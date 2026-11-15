/* gkougkoudis team — site v4 */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced');
  const hasGsap = !!window.gsap;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = document.getElementById('burger'), menu = document.getElementById('menu');
  const toggleMenu = (open) => { menu.hidden = !open; burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; };
  burger.addEventListener('click', () => toggleMenu(menu.hidden));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- hero ribbons (three.js) ---------- */
  function ribbons() {
    const canvas = document.getElementById('gl');
    const hero = document.getElementById('hero');
    if (!window.THREE) { hero.classList.add('no-gl'); return; }
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch (e) { hero.classList.add('no-gl'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    scene.add(new THREE.AmbientLight(0x1a2a5a, 0.6));
    const key = new THREE.DirectionalLight(0xf7f5ee, 1.6); key.position.set(4, 6, 8); scene.add(key);
    const rim = new THREE.PointLight(0xff1200, 2.2, 40); rim.position.set(-8, -3, 4); scene.add(rim);
    const fill = new THREE.PointLight(0x6f8cff, 1.4, 40); fill.position.set(8, 2, -2); scene.add(fill);

    function ribbonGeo(curve, width, segs) {
      const frames = curve.computeFrenetFrames(segs, true);
      const pos = [], nor = [], idx = [];
      for (let i = 0; i <= segs; i++) {
        const p = curve.getPointAt(i / segs), b = frames.binormals[i], n = frames.normals[i];
        const w = width * (0.75 + 0.25 * Math.sin(i / segs * Math.PI * 2));
        pos.push(p.x + b.x * w, p.y + b.y * w, p.z + b.z * w, p.x - b.x * w, p.y - b.y * w, p.z - b.z * w);
        nor.push(n.x, n.y, n.z, n.x, n.y, n.z);
        if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }
    const group = new THREE.Group(); scene.add(group);
    const mats = [
      new THREE.MeshStandardMaterial({ color: 0x0c2749, metalness: 0.92, roughness: 0.22, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x1b2f63, metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x660000, metalness: 0.85, roughness: 0.28, side: THREE.DoubleSide }),
    ];
    const R = (a, b) => a + Math.random() * (b - a);
    for (let r = 0; r < 5; r++) {
      const pts = [];
      const turns = 7, rad = R(3.2, 6.4), tilt = R(-0.6, 0.6), off = R(0, Math.PI * 2);
      for (let i = 0; i < turns; i++) {
        const t = i / turns * Math.PI * 2 + off;
        pts.push(new THREE.Vector3(Math.cos(t) * rad * R(0.85, 1.15), Math.sin(t * 2) * R(0.6, 1.6) + tilt * Math.cos(t) * 3, Math.sin(t) * rad * R(0.6, 1)));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
      const mesh = new THREE.Mesh(ribbonGeo(curve, R(0.35, 0.8), 400), mats[r === 2 ? 2 : r % 2]);
      mesh.rotation.set(R(-0.5, 0.5), R(0, Math.PI), R(-0.3, 0.3));
      mesh.userData.spin = R(0.02, 0.06) * (Math.random() > 0.5 ? 1 : -1);
      group.add(mesh);
    }
    let mx = 0, my = 0, scrollK = 0, visible = true;
    window.addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    function resize() {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.position.z = w < 700 ? 19 : 14; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize); resize();
    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      const t = clock.getElapsedTime();
      scrollK = Math.min(window.scrollY / innerHeight, 1);
      group.children.forEach(m => { m.rotation.y += m.userData.spin * (reduced ? 0.006 : 0.016); });
      const pm = reduced ? 0 : 1;
      group.rotation.x += ((my * 0.25 * pm + scrollK * 0.5) - group.rotation.x) * 0.04;
      group.rotation.z += ((-mx * 0.2 * pm) - group.rotation.z) * 0.04;
      group.position.y = scrollK * 2.5;
      rim.position.x = Math.sin(t * 0.4) * 9;
      renderer.render(scene, camera);
    })();
  }
  ribbons();

  /* ---------- text split + reveals ---------- */
  document.querySelectorAll('.split').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
  });
  const Y = reduced ? 0 : 30;
  if (hasGsap) {
    gsap.from('.hero .split .w>span', { yPercent: reduced ? 0 : 110, opacity: reduced ? 0 : 1, duration: 1.3, ease: 'power4.out', stagger: 0.07, delay: 0.2 });
    gsap.to('.hero .reveal', { opacity: 1, y: 0, duration: 1.2, delay: 0.8, ease: 'power3.out' });
    gsap.from('.hero__card, .hero__down', { opacity: 0, y: 20, duration: 1, delay: 1.3 });
    gsap.utils.toArray('.statement__line span').forEach(s => {
      gsap.from(s, { yPercent: reduced ? 0 : 105, opacity: reduced ? 0 : 1, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: s, start: 'top 88%' } });
    });
    ScrollTrigger.batch('.reveal:not(.hero .reveal)', {
      start: 'top 88%',
      onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }),
    });
    gsap.utils.toArray('.parallax img').forEach(img => {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, scrub: true } });
    });
    gsap.utils.toArray('.tenet').forEach(t => {
      gsap.from(t, { opacity: 0.15, duration: 0.6, scrollTrigger: { trigger: t, start: 'top 75%', end: 'top 45%', scrub: true } });
    });
    // horizontal process on wide screens
    ScrollTrigger.matchMedia({
      '(min-width: 1001px)': function () {
        const track = document.getElementById('track');
        const dist = () => track.scrollWidth - window.innerWidth;
        gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.process', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
      },
    });
    // counters
    document.querySelectorAll('[data-count]').forEach(el => {
      const end = +el.dataset.count; if (end === 1992) return;
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => { el.textContent = Math.round(o.v); } });
    });
  } else {
    document.querySelectorAll('.reveal').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; });
  }

  /* ---------- listings ---------- */
  const TYPE = { 'apartments': 'Διαμέρισμα', 'studio-apartments': 'Γκαρσονιέρα', 'single-family-homes': 'Μονοκατοικία', 'stores': 'Κατάστημα', 'plots-of-land': 'Οικόπεδο', 'business': 'Επιχείρηση', 'commercial-buildings': 'Επαγγελματικό κτίριο', 'offices': 'Γραφείο', 'maisonettes': 'Μεζονέτα' };
  const typeName = l => { for (const t of l.types) if (TYPE[t]) return TYPE[t]; return l.types.includes('land') ? 'Γη' : l.types.includes('commercial') ? 'Επαγγελματικό' : 'Ακίνητο'; };
  const area = a => (a || '').split(', Ν.')[0].replace(/^Κέντρο, /, 'Κέντρο · ');
  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CAPS = { 'ΠΩΛΕΙΤΑΙ': 'Πωλείται', 'ΕΝΟΙΚΙΑΖΕΤΑΙ': 'Ενοικιάζεται', 'ΥΠΕΥΘΥΝΟΣ ΣΥΝΕΡΓΑΤΗΣ': 'Υπεύθυνος συνεργάτης', 'ΠΡΟΣΟΧΗ': 'Προσοχή', 'ΕΥΚΑΙΡΙΑ': 'Ευκαιρία' };
  const tidy = s => (s || '').replace(/ΠΩΛΕΙΤΑΙ|ΕΝΟΙΚΙΑΖΕΤΑΙ|ΥΠΕΥΘΥΝΟΣ ΣΥΝΕΡΓΑΤΗΣ|ΠΡΟΣΟΧΗ|ΕΥΚΑΙΡΙΑ/g, m => CAPS[m]).replace(/\s+/g, ' ').replace(/\.(?=[Α-ΩA-Z])/g, '. ').trim();
  let LIST = [];
  const grid = document.getElementById('grid');

  function render() {
    grid.innerHTML = LIST.map((l, i) => `
      <button class="card reveal" data-i="${i}" data-p="${l.purpose}" data-types="${l.types.join(' ')}">
        <div class="card__img">${l.photos[0] ? `<img src="${esc(l.photos[0])}" alt="${esc(typeName(l))} ${esc(l.sqm)} τ.μ." loading="lazy">` : ''}
          <span class="card__tag ${l.purpose === 'rent' ? 'card__tag--rent' : ''}">${l.purpose === 'rent' ? 'Ενοικιάζεται' : 'Πωλείται'}</span></div>
        <div class="card__body">
          <span class="card__title">${esc(typeName(l))} ${esc(l.sqm)} τ.μ.</span>
          <span class="card__price">${esc(l.price)}${l.purpose === 'rent' && l.price ? '<small>/μήνα</small>' : ''}</span>
          <span class="card__meta">${esc(area(l.address))} · Κωδ. ${esc(l.code)}</span>
        </div>
      </button>`).join('') || '<p class="grid__empty">Τα ακίνητα φορτώνουν…</p>';
    grid.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => openModal(+c.dataset.i)));
    if (hasGsap) {
      ScrollTrigger.batch(grid.querySelectorAll('.reveal'), { start: 'top 92%', onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06 }) });
      ScrollTrigger.refresh();
    } else grid.querySelectorAll('.reveal').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; });
  }
  let fP = 'all', fT = null;
  function applyFilter() {
    grid.querySelectorAll('.card').forEach(c => {
      const ok = (fP === 'all' || c.dataset.p === fP) && (!fT || c.dataset.types.split(' ').includes(fT));
      c.classList.toggle('is-hidden', !ok);
      if (ok) { c.style.opacity = 1; c.style.transform = 'none'; }
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  document.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
    if (ch.dataset.f) { fP = ch.dataset.f; document.querySelectorAll('.chip[data-f]').forEach(x => x.classList.toggle('is-on', x === ch)); }
    if (ch.dataset.t) { fT = fT === ch.dataset.t ? null : ch.dataset.t; document.querySelectorAll('.chip[data-t]').forEach(x => x.classList.toggle('is-on', x.dataset.t === fT)); }
    applyFilter();
  }));

  /* modal */
  const modal = document.getElementById('modal'), mImg = document.getElementById('mImg');
  let cur = null, ph = 0;
  function show() { mImg.src = cur.photos[ph] || ''; document.getElementById('mCnt').textContent = cur.photos.length ? `${ph + 1} / ${cur.photos.length}` : ''; }
  function openModal(i) {
    cur = LIST[i]; ph = 0;
    document.getElementById('mEyebrow').textContent = (cur.purpose === 'rent' ? 'Ενοικιάζεται' : 'Πωλείται') + ' · κωδ. ' + cur.code;
    document.getElementById('mTitle').textContent = `${typeName(cur)} ${cur.sqm} τ.μ.`;
    document.getElementById('mPrice').textContent = cur.price + (cur.purpose === 'rent' && cur.price ? ' / μήνα' : '');
    const facts = [['Περιοχή', area(cur.address)], ['Εμβαδόν', cur.sqm + ' τ.μ.'], ['Όροφος', cur.floor], ['Έτος κατασκευής', cur.year], ['Υπνοδωμάτια', cur.bedrooms], ['Μπάνια', cur.baths]]
      .filter(f => f[1] && f[1] !== '0' && f[1] !== '0 τ.μ.');
    document.getElementById('mFacts').innerHTML = facts.map(f => `<div><dt>${f[0]}</dt><dd>${esc(f[1])}</dd></div>`).join('');
    document.getElementById('mDesc').textContent = tidy(cur.description);
    document.getElementById('mLink').href = cur.url;
    mImg.alt = `${typeName(cur)} ${cur.sqm} τ.μ.`;
    show(); modal.hidden = false; document.body.style.overflow = 'hidden';
  }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }
  document.getElementById('mClose').onclick = closeModal;
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.getElementById('mPrev').onclick = () => { ph = (ph - 1 + cur.photos.length) % cur.photos.length; show(); };
  document.getElementById('mNext').onclick = () => { ph = (ph + 1) % cur.photos.length; show(); };
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') document.getElementById('mNext').click();
    if (e.key === 'ArrowLeft') document.getElementById('mPrev').click();
  });
  let sx = 0;
  mImg.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  mImg.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) document.getElementById(dx < 0 ? 'mNext' : 'mPrev').click(); });

  fetch('data/listings.json', { cache: 'no-cache' }).then(r => r.json()).then(d => {
    LIST = d.listings.filter(l => l.photos && l.photos.length);
    render();
    const n = LIST.length;
    document.getElementById('heroCount').textContent = n;
    const nl = document.getElementById('numListings'); nl.dataset.count = n; nl.textContent = n;
    if (LIST[0]) document.getElementById('heroCardImg').style.backgroundImage = `url("${LIST.find(l => l.purpose === 'sale').photos[0]}")`;
    const up = d.updated ? new Date(d.updated) : null;
    document.getElementById('updated').textContent = up ? up.toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  }).catch(() => { grid.innerHTML = '<p class="grid__empty">Δείτε τα ακίνητα στο remax-deltaktima.gr.</p>'; });
})();
