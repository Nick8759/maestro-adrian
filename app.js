(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  /* Reveal on scroll */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });

  /* Nav */
  const nav = $('#nav'), burger = $('.nav__burger'), drawer = $('#drawer');
  const dock = $('.dock'), hero = $('.hero');
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 30);
    if (dock) dock.classList.toggle('is-on', y > hero.offsetHeight * 0.6);
    if (!reduce) $('.hero__bg').style.transform = `scale(1.08) translateY(${y * 0.25}px)`;
    stepsProgress();
  };
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    drawer.hidden = open;
  });
  $$('#drawer a').forEach((a) => a.addEventListener('click', () => { drawer.hidden = true; burger.setAttribute('aria-expanded', 'false'); }));

  /* Current section in nav */
  const links = $$('.nav__links a');
  const secIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) secIO.observe(s); });

  /* Cursor glow + portrait tilt */
  if (fine && !reduce) {
    document.body.classList.add('has-pointer');
    const glow = $('.cursor-glow');
    addEventListener('pointermove', (e) => { glow.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`; }, { passive: true });
    const p = $('[data-tilt]');
    p.addEventListener('pointermove', (e) => {
      const r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      p.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 10}deg)`;
      p.style.setProperty('--mx', x * 100 + '%'); p.style.setProperty('--my', y * 100 + '%');
    });
    p.addEventListener('pointerleave', () => { p.style.transform = ''; });
  }
  $('.cursor-glow').style.left = '0'; $('.cursor-glow').style.top = '0';

  /* Spotlight on situation cards */
  $$('.sit').forEach((c) => c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--x', e.clientX - r.left + 'px'); c.style.setProperty('--y', e.clientY - r.top + 'px');
  }));

  /* Traduzioni */
  const T = window.I18N || { it: {} };
  let lang = 'it';
  const t = (k) => (T[lang] && T[lang][k]) || T.it[k] || '';
  const syms = ['✦', '✧', '✶', '☾', '⌘', '✷'];
  let curWork = 0;
  const workData = (i) => [syms[i], t('k' + (19 + i)), i === 0 ? t('k50') : t('w' + (i + 1)), i === 0 ? t('k51') : t('m' + (i + 1))];
  function renderWork(i, animate) {
    curWork = i;
    const w = workData(i);
    $('#wpSym').textContent = w[0]; $('#wpTitle').textContent = w[1]; $('#wpText').textContent = w[2]; $('#wpMeta').textContent = w[3];
    $('#wpCta').href = 'https://wa.me/+393522815456?text=' + encodeURIComponent(t('wa') + w[1]);
    if (animate) { panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap'); }
  }
  function setLang(l, save) {
    if (!T[l]) l = 'it';
    lang = l;
    $$('[data-i18n]').forEach((el) => { const v = t(el.dataset.i18n); if (v) el.innerHTML = v; });
    document.documentElement.lang = l;
    document.title = t('title');
    $$('.flag').forEach((f) => { const on = f.dataset.lang === l; f.classList.toggle('is-active', on); f.setAttribute('aria-pressed', String(on)); });
    renderWork(curWork, false);
    if (save) { try { localStorage.setItem('ma-lang', l); } catch (e) {} }
  }
  $$('.flag').forEach((f) => f.addEventListener('click', () => setLang(f.dataset.lang, true)));

  /* Works tabs */
  const panel = $('#work-panel');
  $$('.work').forEach((b) => b.addEventListener('click', () => {
    $$('.work').forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', String(x === b)); });
    renderWork(+b.dataset.i, true);
  }));
  {
    let start = 'it';
    try { start = new URLSearchParams(location.search).get('lang') || localStorage.getItem('ma-lang') || (navigator.language || 'it').slice(0, 2); } catch (e) {}
    setLang(T[start] ? start : 'it', false);
  }

  /* Video players */
  $$('.vplayer').forEach((v) => {
    $('.vplayer__play', v).addEventListener('click', () => {
      $$('.vplayer video').forEach((o) => o.pause());
      let vid = $('video', v);
      if (!vid) {
        vid = document.createElement('video');
        vid.src = v.dataset.src; vid.poster = v.dataset.poster; vid.controls = true; vid.playsInline = true; vid.preload = 'auto';
        v.appendChild(vid);
        vid.addEventListener('pause', () => { if (vid.currentTime === 0 || vid.ended) v.classList.remove('is-playing'); });
        vid.addEventListener('ended', () => v.classList.remove('is-playing'));
      }
      v.classList.add('is-playing');
      vid.play().catch(() => {});
    });
  });

  /* Steps progress */
  const steps = $('#steps'), fill = $('#stepsFill'), stepEls = $$('.step');
  function stepsProgress() {
    const r = steps.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (r.height + vh * 0.2)));
    if (innerWidth <= 760) { fill.style.setProperty('--h', p * 100 + '%'); fill.style.height = p * 100 + '%'; }
    else { fill.style.width = p * 100 + '%'; fill.style.height = ''; }
    stepEls.forEach((s, i) => s.classList.toggle('is-lit', p >= i / stepEls.length + 0.02));
  }

  /* Testimonials carousel (phone) */
  const track = $('.voices__track'), dotsBox = $('.voices__dots'), voices = $$('.voice');
  let vi = 0, timer;
  voices.forEach((_, i) => {
    const d = document.createElement('button');
    d.setAttribute('role', 'tab'); d.setAttribute('aria-label', 'Testimonianza ' + (i + 1));
    d.addEventListener('click', () => { go(i); restart(); });
    dotsBox.appendChild(d);
  });
  function go(i) {
    vi = (i + voices.length) % voices.length;
    track.style.transform = innerWidth <= 760 ? `translateX(${-vi * 100}%)` : '';
    $$('button', dotsBox).forEach((d, j) => d.setAttribute('aria-selected', String(j === vi)));
  }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => innerWidth <= 760 && go(vi + 1), 6000); }
  let sx = null;
  track.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { go(vi + (dx < 0 ? 1 : -1)); restart(); } sx = null; });
  go(0); restart();

  /* FAQ: one open at a time */
  $$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) $$('.faq details').forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* Embers */
  const cv = $('#embers'), ctx = cv.getContext('2d');
  let W, H, parts = [];
  const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
  const mk = (init) => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 20, r: (Math.random() * 1.6 + 0.4) * (W / innerWidth), vy: Math.random() * 0.5 + 0.2, vx: (Math.random() - 0.5) * 0.25, a: Math.random() * 0.6 + 0.2, t: Math.random() * 6.28 });
  if (!reduce) {
    resize(); addEventListener('resize', resize);
    const n = innerWidth < 760 ? 26 : 55;
    for (let i = 0; i < n; i++) parts.push(mk(true));
    (function loop() {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.t += 0.02; p.y -= p.vy * (W / innerWidth); p.x += p.vx + Math.sin(p.t) * 0.3;
        if (p.y < -20) Object.assign(p, mk(false));
        const fl = p.a * (0.6 + 0.4 * Math.sin(p.t * 3));
        ctx.beginPath(); ctx.fillStyle = `rgba(255,${170 + Math.floor(Math.sin(p.t) * 30)},80,${fl})`;
        ctx.shadowColor = 'rgba(255,160,60,.9)'; ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { go(vi); stepsProgress(); });
  onScroll();
})();
