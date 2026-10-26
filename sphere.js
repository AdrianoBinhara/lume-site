// The dotted sphere: Fibonacci points, depth from size and opacity, one turn every 64 s.
(function () {
  const canvas = document.getElementById("sphere");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const N = 900;
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dark = window.matchMedia("(prefers-color-scheme: dark)");

  function size() {
    const dpr = window.devicePixelRatio || 1;
    const s = canvas.clientWidth;
    canvas.width = s * dpr;
    canvas.height = s * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(time) {
    const s = canvas.clientWidth;
    const c = s / 2;
    const R = s * 0.46;
    const ink = dark.matches ? "255,255,255" : "0,0,0";
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = `rgba(${ink},0.10)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c, c, R + 6, 0, Math.PI * 2);
    ctx.stroke();
    const a = reduce ? 0.6 : (time / 64000) * Math.PI * 2;
    const tilt = 0.35;
    const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt);
    for (const [x, y, z] of pts) {
      const x1 = x * ca + z * sa;
      const z1 = -x * sa + z * ca;
      const y2 = y * ct - z1 * st;
      const z2 = y * st + z1 * ct;
      const depth = (z2 + 1) / 2;
      ctx.fillStyle = `rgba(${ink},${0.05 + depth * 0.32})`;
      ctx.beginPath();
      ctx.arc(c + x1 * R, c + y2 * R, 0.5 + depth * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }

  size();
  window.addEventListener("resize", size);
  requestAnimationFrame(draw);
})();
