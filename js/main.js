/* D7 Alta Performance — interações */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const header = $('#header');
  const progress = $('#progress');
  const fab = $('#fab');
  const burger = $('#burger');
  const menu = $('#menu');

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Preloader ---------- */
  const pre = $('#preloader');
  let started = false;
  const goLive = (el) => {
    if (!el.classList.contains('reveal-img')) return;
    const d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    setTimeout(() => el.classList.add('is-live'), 1600 + d * 110);
  };
  const start = () => {
    if (started) return;
    started = true;
    pre && pre.classList.add('is-done');
    // dispara o hero logo depois da cortina subir
    setTimeout(() => {
      $$('.hero .reveal, .hero .reveal-img, .hero__title').forEach(el => { el.classList.add('is-in'); goLive(el); });
    }, reduce ? 0 : 450);
  };
  const minWait = new Promise(r => setTimeout(r, reduce ? 0 : 1000));
  const loaded = new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  Promise.all([minWait, loaded]).then(start);
  setTimeout(start, 2600); // trava de segurança em conexões lentas

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = $$('.reveal, .reveal-img').filter(el => !el.closest('.hero'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); goLive(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => { el.classList.add('is-in'); el.classList.add('is-live'); });
  }

  /* ---------- Contadores ---------- */
  const counters = $$('[data-count]');
  const runCount = (el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    const dur = 1400, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * eased) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  } else counters.forEach(runCount);

  /* ---------- Menu mobile ---------- */
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('no-scroll', open);
    header.classList.remove('is-hidden');
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width:960px)').addEventListener('change', e => e.matches && setMenu(false));

  /* ---------- Scroll: header, progresso, FAB, parallax, timeline ---------- */
  const parallaxEls = reduce ? [] : $$('[data-parallax]');
  const steps = $$('.step');
  const stepsBox = $('#steps');
  const stepsFill = $('#stepsFill');
  const heroEl = $('.hero');
  let lastY = scrollY, ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('is-scrolled', y > 20);

    // esconde ao descer, mostra ao subir (mantém visível com menu aberto)
    if (!menu.classList.contains('is-open')) {
      header.classList.toggle('is-hidden', y > lastY && y > 320);
    }
    lastY = y;

    fab.classList.toggle('is-visible', y > vh * 0.6);

    // parallax leve (só translate; nada de layout)
    if (parallaxEls.length && y < vh * 1.4) {
      parallaxEls.forEach(el => {
        el.style.translate = `0 ${(y * parseFloat(el.dataset.parallax)).toFixed(1)}px ${el.dataset.z || 0}px`;
      });
    }

    // linha do tempo do método
    if (stepsBox) {
      const r = stepsBox.getBoundingClientRect();
      const p = Math.min(Math.max((vh * 0.6 - r.top) / r.height, 0), 1);
      stepsFill.style.transform = `scaleY(${p})`;
      steps.forEach(s => {
        const sr = s.getBoundingClientRect();
        s.classList.toggle('is-active', sr.top < vh * 0.6);
      });
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();

  /* ---------- Spotlight nos cards + botão magnético (só mouse) ---------- */
  if (finePointer && !reduce) {
    $$('.spot').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });

    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.32;
        btn.style.transform = `translate(${x}px,${y}px)`;
      }, { passive: true });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Galeria: arrastar com o mouse ---------- */
  const g = $('#gallery');
  if (g && finePointer) {
    // arrasto com inércia (mouse). Em touch vale a rolagem nativa.
    let down = false, sx = 0, sl = 0, lastX = 0, lastT = 0, vel = 0, raf = 0;
    const stopMomentum = () => { cancelAnimationFrame(raf); raf = 0; };
    const momentum = () => {
      const max = g.scrollWidth - g.clientWidth;
      g.scrollLeft = Math.min(Math.max(g.scrollLeft + vel, 0), max);
      vel *= 0.95;
      if (Math.abs(vel) > 0.15 && g.scrollLeft > 0 && g.scrollLeft < max) raf = requestAnimationFrame(momentum);
    };
    g.addEventListener('dragstart', e => e.preventDefault());
    g.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      stopMomentum();
      down = true; sx = lastX = e.clientX; sl = g.scrollLeft; lastT = performance.now(); vel = 0;
      g.setPointerCapture(e.pointerId);
      g.classList.add('is-dragging');
    });
    g.addEventListener('pointermove', e => {
      if (!down) return;
      g.scrollLeft = sl - (e.clientX - sx);
      const now = performance.now(), dt = Math.max(now - lastT, 1);
      vel = vel * 0.6 + ((lastX - e.clientX) / dt * 16) * 0.4; // px por frame
      lastX = e.clientX; lastT = now;
    });
    const release = (e) => {
      if (!down) return;
      down = false;
      g.classList.remove('is-dragging');
      if (g.hasPointerCapture(e.pointerId)) g.releasePointerCapture(e.pointerId);
      if (performance.now() - lastT > 80) vel = 0; // parou antes de soltar
      raf = requestAnimationFrame(momentum);
    };
    g.addEventListener('pointerup', release);
    g.addEventListener('pointercancel', release);
    g.addEventListener('wheel', stopMomentum, { passive: true });
  }


  /* ---------- Imagens: tilt 3D suave, brilho e cursor ---------- */
  if (finePointer && !reduce) {
    const lerp = (a, b, t) => a + (b - a) * t;

    // tilt individual (molduras e galeria) com inércia
    $$('.frame.reveal-img, .gitem').forEach(el => {
      const s = { rx: 0, ry: 0, tx: 0, ty: 0, run: false };
      const max = el.classList.contains('gitem') ? 7 : 6;
      const tick = () => {
        s.rx = lerp(s.rx, s.tx, 0.09);
        s.ry = lerp(s.ry, s.ty, 0.09);
        el.style.transform = `perspective(1100px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg) translateZ(0)`;
        const settled = Math.abs(s.rx - s.tx) < 0.02 && Math.abs(s.ry - s.ty) < 0.02;
        if (settled && s.tx === 0 && s.ty === 0) {
          el.style.transform = '';
          el.classList.remove('is-tilting');
          s.run = false;
          return;
        }
        requestAnimationFrame(tick);
      };
      el.addEventListener('pointermove', e => {
        if (!el.classList.contains('is-live')) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        s.ty = (px - 0.5) * 2 * max;
        s.tx = -(py - 0.5) * 2 * max;
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        if (!s.run) { s.run = true; el.classList.add('is-tilting'); requestAnimationFrame(tick); }
      }, { passive: true });
      el.addEventListener('pointerleave', () => { s.tx = 0; s.ty = 0; });
    });

    // brilho nos cards do hero
    $$('.hcard').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });

    // colagem do hero em 3D acompanhando o mouse
    const vis = $('.hero__visual');
    if (vis && heroEl) {
      const h = { rx: 0, ry: 0, tx: 0, ty: 0, run: false };
      const tick = () => {
        h.rx = lerp(h.rx, h.tx, 0.06);
        h.ry = lerp(h.ry, h.ty, 0.06);
        vis.style.transform = `perspective(1300px) rotateX(${h.rx.toFixed(2)}deg) rotateY(${h.ry.toFixed(2)}deg)`;
        if (Math.abs(h.rx - h.tx) < 0.01 && Math.abs(h.ry - h.ty) < 0.01 && !h.tx && !h.ty) { vis.style.transform = ''; h.run = false; return; }
        requestAnimationFrame(tick);
      };
      heroEl.addEventListener('pointermove', e => {
        const r = heroEl.getBoundingClientRect();
        h.ty = ((e.clientX - r.left) / r.width - 0.5) * 12;
        h.tx = -((e.clientY - r.top) / r.height - 0.5) * 9;
        if (!h.run) { h.run = true; requestAnimationFrame(tick); }
      }, { passive: true });
      heroEl.addEventListener('pointerleave', () => { h.tx = 0; h.ty = 0; });
    }

  }


  /* ---------- Galeria: progresso e setas ---------- */
  if (g) {
    const bar = $('#gbar'), prev = $('#gprev'), next = $('#gnext');
    const sync = () => {
      const max = g.scrollWidth - g.clientWidth;
      const ratio = g.clientWidth / g.scrollWidth;
      const p = max > 0 ? g.scrollLeft / max : 0;
      const w = bar.parentElement.clientWidth * ratio * 1.0;
      bar.style.width = (ratio * 100).toFixed(1) + '%';
      bar.style.transform = `translate3d(${(p * (bar.parentElement.clientWidth - w)).toFixed(1)}px,0,0)`;
      prev.disabled = g.scrollLeft < 4;
      next.disabled = g.scrollLeft > max - 4;
    };
    g.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    addEventListener('resize', sync, { passive: true });
    const step = () => Math.min(g.clientWidth * 0.8, 640);
    prev.addEventListener('click', () => g.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => g.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
    sync();
  }

  /* ---------- FAQ: um aberto por vez ---------- */
  const faq = $$('.faq details');
  faq.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faq.forEach(o => { if (o !== d) o.open = false; });
  }));
})();
