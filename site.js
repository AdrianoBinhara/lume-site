/* ============================================================
   CONFIGURAÇÃO: o único lugar pra mexer em preço, link e download.
   ------------------------------------------------------------
   lancamento: true  -> mostra "R$ 97" riscado, o preço de lançamento,
                        a nota de prazo e põe o cupom na URL do Stripe.
   lancamento: false -> volta pro preço cheio e pro link sem cupom.
   ============================================================ */
const LUME = {
  preco: "R$ 97",
  nota: "Pagamento único, 1 ano de atualizações.",
  garantia: "Reembolso em 7 dias.",
  requisito: "Só para Mac com chip Apple, do M1 em diante, e macOS Tahoe 26 ou mais novo.",
  link: "https://buy.stripe.com/fZufZi4MWc9IdgK3a577O04",

  lancamento: true,
  precoLancamento: "R$ 47",
  rotuloLancamento: "no lançamento",
  notaLancamento: "Até 05/11 ou 100 primeiros.",
  cupom: "LANCAMENTO",

  download: "releases/Lume-0.3.1.zip",

  // Servidor de licença (o único servidor do Lume). obrigado.html busca a chave aqui.
  licencaURL: "https://licenca.adrianobinhara.com",
};

(function () {
  "use strict";
  const doc = document;
  doc.documentElement.classList.add("js");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preço e links, a partir da config ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function linkCompra() {
    if (!LUME.lancamento || !LUME.cupom) return LUME.link;
    const sep = LUME.link.includes("?") ? "&" : "?";
    return LUME.link + sep + "prefilled_promo_code=" + encodeURIComponent(LUME.cupom);
  }

  function aplicarConfig() {
    const href = linkCompra();
    doc.querySelectorAll("[data-buy]").forEach((a) => { a.href = href; });
    doc.querySelectorAll("[data-download]").forEach((a) => { a.href = LUME.download; });

    const garantia = LUME.garantia ? " " + esc(LUME.garantia) : "";
    const nota = (LUME.lancamento ? esc(LUME.notaLancamento) + " " : "") + esc(LUME.nota) + garantia;
    const req = LUME.requisito ? "<span class=\"note req\">" + esc(LUME.requisito) + "</span>" : "";

    doc.querySelectorAll("[data-price]").forEach((el) => {
      el.innerHTML = (LUME.lancamento
        ? "<s>" + esc(LUME.preco) + "</s> <strong>" + esc(LUME.precoLancamento) + "</strong> <span class=\"tag\">" + esc(LUME.rotuloLancamento) + "</span><span class=\"note\">" + nota + "</span>"
        : "<strong>" + esc(LUME.preco) + "</strong> <span class=\"note\">" + nota + "</span>") + req;
    });

    doc.querySelectorAll("[data-price-big]").forEach((el) => {
      el.innerHTML = (LUME.lancamento
        ? "<s>" + esc(LUME.preco) + "</s><strong>" + esc(LUME.precoLancamento) + "</strong><span class=\"tag\">" + esc(LUME.rotuloLancamento).replace(/^./, (c) => c.toUpperCase()) + ". " + esc(LUME.notaLancamento) + "</span><span class=\"note\">" + esc(LUME.nota) + garantia + "</span>"
        : "<strong>" + esc(LUME.preco) + "</strong><span class=\"note\">" + esc(LUME.nota) + garantia + "</span>") + req;
    });
  }

  /* ---------- A esfera de pontos ----------
     Rede de Fibonacci, inclinação 0,38 rad, uma volta a cada 64 s,
     profundidade só por tamanho e opacidade. Igual ao app e ao filme. */

  const TURN = 64;
  const TILT = 0.38;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const spheres = [];

  function makeSphere(canvas) {
    const ctx = canvas.getContext("2d");
    const N = parseInt(canvas.dataset.n, 10) || 900;
    const ink = canvas.dataset.ink || "0,0,0";
    const P = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - ((i + 0.5) / N) * 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * golden;
      P[i * 3] = r * Math.cos(phi);
      P[i * 3 + 1] = y;
      P[i * 3 + 2] = r * Math.sin(phi);
    }
    const s = { canvas, ctx, N, P, ink, size: 0, dpr: 1, visible: true };

    // Logos em órbita, se houver: giram com o mesmo ângulo e a mesma inclinação dos pontos.
    const orbitEl = canvas.parentNode.querySelector(".orbit");
    s.orbit = orbitEl ? Array.from(orbitEl.children) : [];
    s.orbitVisible = [];
    s.refreshOrbit = function () {
      s.orbitVisible = s.orbit.filter((el) => getComputedStyle(el).display !== "none");
    };
    s.drawOrbit = function (ca, sa, ct, st, R) {
      const items = s.orbitVisible;
      const n = items.length;
      if (!n) return;
      const r = R * (s.size < 170 ? 1.42 : 1.52);
      for (let i = 0; i < n; i++) {
        const phi = Math.PI / 2 + (i / n) * Math.PI * 2;
        const x = Math.cos(phi) * r;
        const z = Math.sin(phi) * r;
        const x1 = x * ca + z * sa;
        const z1 = -x * sa + z * ca;
        const depth = (z1 / r + 1) / 2;
        const sc = 0.58 + 0.42 * depth;
        const op = 0.1 + 0.9 * depth * depth;
        const el = items[i].style;
        el.transform = "translate(" + x1.toFixed(1) + "px," + (z1 * st).toFixed(1) + "px) scale(" + sc.toFixed(3) + ")";
        el.opacity = op.toFixed(3);
        el.zIndex = z1 >= 0 ? 2 : 0;
      }
    };

    s.resize = function () {
      const px = canvas.clientWidth || parseInt(getComputedStyle(canvas.parentNode).width, 10);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (px === s.size && dpr === s.dpr) return;
      s.size = px;
      s.dpr = dpr;
      canvas.width = Math.round(px * dpr);
      canvas.height = Math.round(px * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.refreshOrbit();
    };

    s.draw = function (t) {
      const size = s.size;
      if (!size) return;
      const c = size / 2;
      const R = c - 1.5;
      const scale = R * 0.955;
      const ang = ((t / 1000) / TURN) * Math.PI * 2;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const ct = Math.cos(TILT), st = Math.sin(TILT);
      const dotScale = Math.min(2, Math.max(0.85, R / 150));
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = "rgba(" + ink + ",0.13)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.stroke();
      const P = s.P;
      for (let i = 0; i < s.N; i++) {
        const px0 = P[i * 3], py0 = P[i * 3 + 1], pz0 = P[i * 3 + 2];
        const x = px0 * ca + pz0 * sa;
        const z = -px0 * sa + pz0 * ca;
        const y = py0 * ct - z * st;
        const zz = py0 * st + z * ct;
        const depth = (zz + 1) / 2;
        const a = 0.08 + 0.56 * depth * depth;
        const rad = (0.55 + depth) * dotScale;
        ctx.fillStyle = "rgba(" + ink + "," + a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(c + x * scale, c - y * scale, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      s.drawOrbit(ca, sa, ct, st, R);
    };

    return s;
  }

  function startSpheres() {
    doc.querySelectorAll("canvas[data-sphere]").forEach((cv) => spheres.push(makeSphere(cv)));
    if (!spheres.length) return;

    const resizeAll = () => spheres.forEach((s) => s.resize());
    resizeAll();
    window.addEventListener("resize", resizeAll);

    if (reduce) {
      // Parada, num ângulo bonito, como no app com Reduzir Movimento.
      spheres.forEach((s) => s.draw(9000));
      return;
    }

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const s = spheres.find((x) => x.canvas === e.target);
          if (s) s.visible = e.isIntersecting;
        });
      }, { rootMargin: "80px" });
      spheres.forEach((s) => io.observe(s.canvas));
    }

    const t0 = performance.now();
    function frame(now) {
      if (!doc.hidden) {
        const t = now - t0;
        for (const s of spheres) if (s.visible) s.draw(t);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- O filme: pôster, play com som ---------- */

  function startFilm() {
    const film = doc.getElementById("filme");
    const video = doc.getElementById("video");
    if (!film || !video) return;
    const play = film.querySelector(".film-play");
    video.removeAttribute("controls");

    function tocar() {
      // Telas pequenas recebem o 720p; o 1080p continua sendo a fonte principal.
      if (!video.dataset.escolhido) {
        video.dataset.escolhido = "1";
        const sd = video.dataset.srcSd;
        if (sd && window.innerWidth < 768) video.src = sd;
      }
      film.classList.add("playing");
      video.setAttribute("controls", "");
      video.muted = false;
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    }

    if (play) play.addEventListener("click", tocar);
    video.addEventListener("ended", () => {
      film.classList.remove("playing");
      video.removeAttribute("controls");
    });

    doc.querySelectorAll("[data-play]").forEach((a) => {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        film.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        tocar();
      });
    });
  }

  /* ---------- A pilha da dor entra quando aparece ---------- */

  function startStack() {
    const stack = doc.querySelector("[data-stack]");
    if (!stack) return;
    if (reduce || !("IntersectionObserver" in window)) { stack.classList.add("in"); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        stack.classList.add("in");
        io.disconnect();
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
    io.observe(stack);
  }

  /* ---------- A faixa de agentes: o anel acende a cada consulta ---------- */

  function startBand() {
    const band = doc.querySelector("[data-band]");
    if (!band || reduce) return;
    const tiles = Array.from(band.querySelectorAll(".tile"));
    const wire = band.querySelector(".wire");
    if (!tiles.length) return;
    const order = [0, 2, 5, 3, 1, 4, 6, 0, 2];
    let i = 0;
    let visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); }).observe(band);
    }
    function pulse() {
      if (!visible || doc.hidden) return;
      tiles.forEach((t) => t.classList.remove("lit"));
      const tile = tiles[order[i % order.length] % tiles.length];
      i++;
      void tile.offsetWidth; // reinicia a animação do anel
      tile.classList.add("lit");
      if (wire) {
        wire.classList.add("lit");
        setTimeout(() => wire.classList.remove("lit"), 700);
      }
    }
    pulse();
    setInterval(pulse, 2200);
  }

  /* ---------- Obrigado: a chave depois do pagamento ---------- */

  function startObrigado() {
    const root = doc.querySelector("[data-obrigado]");
    if (!root) return;
    const base = (LUME.licencaURL || "").replace(/\/$/, "");
    const estados = {};
    root.querySelectorAll("[data-estado]").forEach((el) => { estados[el.dataset.estado] = el; });

    function mostrar(nome) {
      Object.keys(estados).forEach((k) => { estados[k].hidden = k !== nome; });
      const titulo = root.querySelector("[data-reenviar-titulo]");
      if (titulo) titulo.textContent = nome === "pronta" ? "Não recebeu o e-mail? Reenviar minha chave" : "Já comprou? Reenviar minha chave";
    }

    function chaveValida(c) {
      return /^LUME-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}$/.test(c);
    }

    function pronta(dados) {
      const chave = String(dados.chave || "").trim().toUpperCase();
      if (!chaveValida(chave)) { mostrar("erro"); return; }
      const out = root.querySelector("[data-chave]");
      out.textContent = chave;
      const ativar = root.querySelector("[data-ativar]");
      ativar.href = "lume://ativar?chave=" + encodeURIComponent(chave);
      const email = String(dados.email || "").trim();
      const linha = root.querySelector("[data-email-linha]");
      if (email) root.querySelector("[data-email]").textContent = email;
      else linha.hidden = true;
      const copiar = root.querySelector("[data-copiar]");
      copiar.addEventListener("click", () => {
        const feito = () => { copiar.textContent = "Copiada"; setTimeout(() => { copiar.textContent = "Copiar chave"; }, 2000); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(chave).then(feito, () => selecionar());
        else selecionar();
        function selecionar() {
          const r = doc.createRange(); r.selectNodeContents(out);
          const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        }
      });
      mostrar("pronta");
    }

    async function buscar(sessionId) {
      mostrar("gerando");
      const limite = Date.now() + 62000;
      while (true) {
        let resp;
        try {
          resp = await fetch(base + "/licenca?session_id=" + encodeURIComponent(sessionId), { cache: "no-store", headers: { Accept: "application/json" } });
        } catch (e) {
          resp = null;
        }
        if (resp && resp.status === 200) {
          try { pronta(await resp.json()); } catch (e) { mostrar("erro"); }
          return;
        }
        if (resp && resp.status !== 202) { mostrar("erro"); return; }
        if (Date.now() > limite) { mostrar("erro"); return; }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const form = root.querySelector("[data-reenviar-form]");
    if (form) {
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const email = form.email.value.trim();
        if (!email) return;
        const botao = form.querySelector("button");
        botao.disabled = true;
        try {
          await fetch(base + "/reenviar", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email }) });
        } catch (e) { /* a mensagem é a mesma: não revela se a compra existe */ }
        const msg = root.querySelector("[data-reenviar-msg]");
        msg.hidden = false;
        botao.disabled = false;
      });
    }

    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (sessionId && /^[\w-]{3,200}$/.test(sessionId)) buscar(sessionId);
    else mostrar("sem-sessao");
  }

  function init() {
    aplicarConfig();
    startSpheres();
    startFilm();
    startStack();
    startBand();
    startObrigado();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})();
