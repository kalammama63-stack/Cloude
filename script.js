/* ============================================================
   WORKER URL — замени на реальный адрес Cloudflare Worker
   после деплоя cf-worker.js (инструкция внутри файла)
   ============================================================ */
const WORKER_URL = 'https://tkweb-form.kalammama63.workers.dev';

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
const cursorRing = document.getElementById('cursorRing');
const cursorDot  = document.getElementById('cursorDot');

if (cursorRing && window.matchMedia('(hover: hover)').matches) {
  let rx = 0, ry = 0, mx = 0, my = 0;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function animateCursor() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    cursorDot.style.left  = mx + 'px';
    cursorDot.style.top   = my + 'px';
    requestAnimationFrame(animateCursor);
  })();

  document.querySelectorAll('a, button, .flip-card, summary').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorRing.style.width       = '54px';
      cursorRing.style.height      = '54px';
      cursorRing.style.borderColor = 'rgba(249,139,0,0.9)';
      cursorRing.style.background  = 'rgba(249,139,0,0.07)';
    });
    el.addEventListener('mouseleave', () => {
      cursorRing.style.width       = '36px';
      cursorRing.style.height      = '36px';
      cursorRing.style.borderColor = 'rgba(249,139,0,0.55)';
      cursorRing.style.background  = 'transparent';
    });
  });
}

/* ============================================================
   SCROLL REVEAL — Intersection Observer
   ============================================================ */
const revealEls = document.querySelectorAll('.reveal-up, .reveal-right');

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const parent   = entry.target.parentElement;
    const siblings = [...parent.querySelectorAll('.reveal-up, .reveal-right')];
    const idx      = siblings.indexOf(entry.target);
    const delay    = idx * 90;

    setTimeout(() => entry.target.classList.add('is-visible'), delay);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ============================================================
   FLIP CARDS — click to flip (сертификаты)
   ============================================================ */
document.querySelectorAll('.flip-card').forEach(card => {
  card.addEventListener('click', () => card.classList.toggle('is-flipped'));
});

/* ============================================================
   CASE FLIP CARDS — touch devices only (desktop uses CSS hover)
   ============================================================ */
if (window.matchMedia('(hover: none)').matches) {
  document.querySelectorAll('.case-big-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('is-flipped'));
  });
}

/* ============================================================
   MOBILE CTA — показываем после прокрутки hero
   ============================================================ */
const mobileCta = document.querySelector('.mobile-cta');
if (mobileCta) {
  window.addEventListener('scroll', () => {
    mobileCta.classList.toggle('mobile-cta--visible', window.scrollY > 300);
  }, { passive: true });
}

/* ============================================================
   TOPBAR — darkens on scroll
   ============================================================ */
const topbar = document.querySelector('.topbar');
if (topbar) {
  window.addEventListener('scroll', () => {
    topbar.style.background = window.scrollY > 60
      ? 'rgba(14,14,16,0.98)'
      : 'rgba(14,14,16,0.88)';
  }, { passive: true });
}

/* ============================================================
   PARALLAX — subtle Y shift on scroll for images
   ============================================================ */
const parallaxItems = document.querySelectorAll('.hero-img, .advantage-img');

if (parallaxItems.length && !window.matchMedia('(max-width: 768px)').matches) {
  window.addEventListener('scroll', () => {
    parallaxItems.forEach(img => {
      const rect   = img.closest('[class*="wrap"], [class*="img-wrap"], section')?.getBoundingClientRect();
      if (!rect) return;
      const center = rect.top + rect.height / 2;
      const shift  = (center - window.innerHeight / 2) * 0.06;
      img.style.transform = `translateY(${shift}px)`;
    });
  }, { passive: true });
}

/* ============================================================
   ACTIVE NAV — подсвечивает текущую страницу в меню
   ============================================================ */
(function () {
  const path = window.location.pathname.replace(/^\//, '') || 'index.html';
  document.querySelectorAll('.nav a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.replace(/^\//, '').split('#')[0] || 'index.html';
    if (linkPath === path) {
      link.classList.add('nav--active');
      link.setAttribute('aria-current', 'page');
    }
  });
})();

/* ============================================================
   BURGER MENU — мобильное меню (< 480px)
   ============================================================ */
(function () {
  const burger  = document.getElementById('burgerBtn');
  const navMenu = document.getElementById('navMenu');
  if (!burger || !navMenu) return;

  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    navMenu.classList.toggle('nav--open', !open);
    burger.classList.toggle('burger--open', !open);
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('nav--open');
      burger.classList.remove('burger--open');
    });
  });
})();

/* ============================================================
   BOIDS ECOSYSTEM — hero background
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('hero-boids');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const PALETTE    = ['#f98b00', '#ffb347', '#ffd166', '#f2f2f3', 'rgba(249,139,0,0.55)'];
  const COUNT      = 70;
  const PERCEPTION = 36;
  const MAX_SPEED  = 1.8;
  const CURSOR_R   = 90;

  const dpr    = Math.min(window.devicePixelRatio || 1, 2);
  const cursor = { x: 0, y: 0, active: false };
  let agents   = [];
  let raf      = 0;
  let paused   = false;

  const W = () => canvas.width  / dpr;
  const H = () => canvas.height / dpr;

  function resize() {
    const r = canvas.getBoundingClientRect();
    canvas.width  = r.width  * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    agents = [];
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.6 + Math.random() * 0.6;
      agents.push({
        x: Math.random() * W(), y: Math.random() * H(),
        vx: Math.cos(a) * s,   vy: Math.sin(a) * s,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)]
      });
    }
  }

  function step() {
    if (paused) { raf = requestAnimationFrame(step); return; }

    const Wv = W(), Hv = H();

    ctx.fillStyle = 'rgba(14,14,16,0.18)';
    ctx.fillRect(0, 0, Wv, Hv);

    for (const a of agents) {
      let ax = 0, ay = 0, sx = 0, sy = 0, cx = 0, cy = 0, n = 0;

      for (const b of agents) {
        if (a === b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < PERCEPTION * PERCEPTION) {
          ax += b.vx; ay += b.vy;
          cx += b.x;  cy += b.y;
          if (d2 < 18 * 18 && d2 > 0.0001) {
            const d = Math.sqrt(d2);
            sx -= dx / d; sy -= dy / d;
          }
          n++;
        }
      }
      if (n > 0) {
        a.vx += (ax / n - a.vx) * 0.04;
        a.vy += (ay / n - a.vy) * 0.04;
        a.vx += (cx / n - a.x)  * 0.0006;
        a.vy += (cy / n - a.y)  * 0.0006;
        a.vx += sx * 0.06;
        a.vy += sy * 0.06;
      }

      if (cursor.active) {
        const dx = a.x - cursor.x, dy = a.y - cursor.y;
        const d  = Math.hypot(dx, dy);
        if (d < CURSOR_R && d > 0) {
          const f = (CURSOR_R - d) / CURSOR_R;
          a.vx += (dx / d) * f * 0.6;
          a.vy += (dy / d) * f * 0.6;
        }
      }

      const sp = Math.hypot(a.vx, a.vy);
      if (sp > MAX_SPEED) { a.vx = (a.vx / sp) * MAX_SPEED; a.vy = (a.vy / sp) * MAX_SPEED; }

      a.x += a.vx; a.y += a.vy;
      if (a.x < 0) a.x += Wv; if (a.x > Wv) a.x -= Wv;
      if (a.y < 0) a.y += Hv; if (a.y > Hv) a.y -= Hv;

      ctx.fillStyle   = a.color;
      ctx.globalAlpha = 0.88;
      const angle = Math.atan2(a.vy, a.vx);
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(step);
  }

  resize();
  spawn();
  raf = requestAnimationFrame(step);

  const ro = new ResizeObserver(() => { resize(); });
  ro.observe(canvas);

  // Пауза когда canvas вне viewport
  const visObs = new IntersectionObserver(([entry]) => {
    paused = !entry.isIntersecting;
  }, { threshold: 0 });
  visObs.observe(canvas);

  window.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    cursor.x = e.clientX - r.left;
    cursor.y = e.clientY - r.top;
    cursor.active = cursor.x >= 0 && cursor.x <= r.width && cursor.y >= 0 && cursor.y <= r.height;
  });
  document.documentElement.addEventListener('pointerleave', () => { cursor.active = false; });
  window.addEventListener('blur', () => { cursor.active = false; });
})();

/* ============================================================
   AI BUTTON — частицы при наведении
   ============================================================ */
(function () {
  const btn = document.getElementById('aiBtn');
  if (!btn) return;

  const colors = ['#f98b00','#ffb347','#ffd080','#ff6000','#ffe0a0','#ffcc55'];
  let interval = null;

  function spawnParticle() {
    const p     = document.createElement('span');
    p.className = 'ai-particle';
    const angle = Math.random() * 360;
    const dist  = 55 + Math.random() * 75;
    const tx    = Math.cos(angle * Math.PI / 180) * dist;
    const ty    = Math.sin(angle * Math.PI / 180) * dist;
    const sz    = 3 + Math.random() * 6;
    const dur   = 0.55 + Math.random() * 0.55;
    p.style.cssText = `--tx:${tx}px;--ty:${ty}px;--r:${Math.random()*360}deg;--sz:${sz}px;--col:${colors[Math.floor(Math.random()*colors.length)]};--dur:${dur}s`;
    btn.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }

  btn.addEventListener('mouseenter', () => {
    spawnParticle();
    interval = setInterval(spawnParticle, 110);
  });
  btn.addEventListener('mouseleave', () => clearInterval(interval));
})();

/* ============================================================
   CONTACT FORM — отправка через Cloudflare Worker
   ============================================================ */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name    = form.querySelector('[name="name"]').value.trim();
    const contact = form.querySelector('[name="contact"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();
    const service = form.querySelector('[name="service"]')?.value || '';
    const btn     = form.querySelector('#aiBtn');

    btn.disabled    = true;
    btn.textContent = 'Отправляю...';

    try {
      const res = await fetch(WORKER_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, contact, message, service }),
      });

      if (!res.ok) throw new Error();

      form.innerHTML = '<p class="form-success">Заявка отправлена!<br>Напишу в мессенджер в течение дня 🤝</p>';
    } catch {
      btn.disabled  = false;
      btn.innerHTML = '✦ Отправить заявку →';
      const err = document.createElement('p');
      err.className   = 'form-error';
      err.textContent = 'Не удалось отправить. Напишите напрямую: @TK_Web';
      form.appendChild(err);
    }
  });
})();

/* ============================================================
   LEAD MAGNET TOAST
   ============================================================ */
(function () {
  const btn   = document.getElementById('checklistBtn');
  const toast = document.getElementById('checklistToast');
  const close = document.getElementById('checklistToastClose');
  if (!btn || !toast) return;

  btn.addEventListener('click', () => {
    setTimeout(() => {
      toast.classList.add('checklist-toast--visible');
    }, 1200);
  });

  if (close) {
    close.addEventListener('click', () => toast.classList.remove('checklist-toast--visible'));
  }
})();

/* ============================================================
   SCROLL TO TOP
   ============================================================ */
(function () {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 320);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
