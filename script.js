(function () {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);

  /* ---------- Theme toggle (remembers choice) ---------- */
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.setAttribute("data-theme", saved);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.setAttribute("data-theme", "dark");
  } catch (e) {}
  $("theme").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  const menu = $("menu"), burger = $("burger");
  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Scroll progress, sticky nav, back-to-top ---------- */
  const progress = $("progress"), nav = $("nav"), topBtn = $("top");
  function onScroll() {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    progress.style.width = pct + "%";
    nav.classList.toggle("scrolled", h.scrollTop > 10);
    topBtn.classList.toggle("show", h.scrollTop > 500);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Highlight the nav link of the section in view ---------- */
  const links = [...menu.querySelectorAll("a")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => s && spy.observe(s));

  /* ---------- Typing effect ---------- */
  const roles = ["BSIT student", "Network Development Management major", "future network engineer", "curious learner"];
  const typed = $("typed");
  let r = 0, c = 0, deleting = false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function type() {
    const word = roles[r];
    if (reduce) { typed.textContent = roles[0]; return; }
    typed.textContent = word.slice(0, c);
    if (!deleting && c < word.length) c++;
    else if (!deleting) { deleting = true; return setTimeout(type, 1400); }
    else if (c > 0) c--;
    else { deleting = false; r = (r + 1) % roles.length; }
    setTimeout(type, deleting ? 35 : 70);
  }
  type();

  /* ---------- Hero: animated network with packets ---------- */
  const canvas = $("net"), ctx = canvas.getContext("2d");
  let W, H, nodes = [], packets = [];
  const mouse = { x: -999, y: -999 };

  function color(v, a) {
    return "rgba(" + getComputedStyle(root).getPropertyValue(v) + "," + a + ")";
  }
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(70, Math.floor((W * H) / 16000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    }));
  }
  function links2() {
    const out = [];
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < 140) out.push([i, j, d]);
      }
    return out;
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    nodes.forEach((n) => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 110) { n.x += (dx / d) * 0.8; n.y += (dy / d) * 0.8; }
    });
    const ls = links2();
    ls.forEach(([i, j, d]) => {
      ctx.strokeStyle = color("--node", (1 - d / 140) * 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
    });
    nodes.forEach((n) => {
      ctx.fillStyle = color("--node", 0.7);
      ctx.beginPath(); ctx.arc(n.x, n.y, 2.4, 0, 6.283); ctx.fill();
    });
    if (ls.length && Math.random() < 0.05 && packets.length < 8) {
      const l = ls[Math.floor(Math.random() * ls.length)];
      packets.push({ a: l[0], b: l[1], t: 0 });
    }
    packets = packets.filter((p) => p.t < 1);
    packets.forEach((p) => {
      p.t += 0.02;
      const x = nodes[p.a].x + (nodes[p.b].x - nodes[p.a].x) * p.t;
      const y = nodes[p.a].y + (nodes[p.b].y - nodes[p.a].y) * p.t;
      ctx.fillStyle = color("--packet", 1);
      ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 6.283); ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  window.addEventListener("resize", resize);
  canvas.parentElement.addEventListener("mousemove", (e) => {
    const b = canvas.getBoundingClientRect();
    mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top;
  });
  canvas.parentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -999; });
  resize();
  if (reduce) { frame(); } else { requestAnimationFrame(frame); }

  $("year").textContent = new Date().getFullYear();
})();
