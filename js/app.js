/* ==========================================================================
   Ponto da Esfiha Faria Lima · comportamento do site
   Sem bibliotecas. Movimento só com transform/opacity, molas com velocidade
   herdada nos gestos, e tudo respeita "reduzir movimento".
   ========================================================================== */
(() => {
  'use strict';

  const L = window.LOJA, CATS = window.CATEGORIAS;

  /* ------------------------------------------------------------ utilidades */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const mqMobile = matchMedia('(max-width: 767px)');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile = () => mqMobile.matches;
  const reduce = () => mqReduce.matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mod = (n, m) => ((n % m) + m) % m;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
  const EASE_DRAWER = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const money = v => BRL.format(v);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } }
  };
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffled(arr, seed = 7) { const r = rng(seed); const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  document.addEventListener('load', e => { const t = e.target; if (t.tagName === 'IMG' && t.classList.contains('lazy')) t.classList.add('is-loaded'); }, true);
  document.addEventListener('error', e => { const t = e.target; if (t.tagName === 'IMG') t.classList.add('is-loaded'); }, true);
  const markLoaded = (root = document) => $$('img.lazy', root).forEach(i => { if (i.complete && i.naturalWidth) i.classList.add('is-loaded'); });
  const imgTag = (src, alt = '', { lazy = true, cls = '' } = {}) => `<img class="lazy ${cls}" src="${esc(src)}" alt="${esc(alt)}" ${lazy ? 'loading="lazy"' : ''} decoding="async" draggable="false">`;

  /** Mola no estilo Apple (response em s, damping 1 = sem quicar). Começa do valor atual e herda velocidade. */
  function spring({ from, to, velocity = 0, response = 0.4, damping = 1, onUpdate, onComplete }) {
    const k = Math.pow((2 * Math.PI) / response, 2), c = (4 * Math.PI * damping) / response;
    let x = from, v = velocity, last = performance.now(), raf = 0, done = false;
    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const steps = Math.max(1, Math.ceil(dt * 240)), h = dt / steps;
      for (let i = 0; i < steps; i++) { const a = -k * (x - to) - c * v; v += a * h; x += v * h; }
      if (Math.abs(v) < 4 && Math.abs(x - to) < 0.4) { x = to; onUpdate(x); done = true; onComplete && onComplete(); return; }
      onUpdate(x); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return { stop() { cancelAnimationFrame(raf); }, get value() { return x; }, get velocity() { return v; }, get done() { return done; } };
  }
  const rubber = (o, d, c = 0.55) => (o * d * c) / (d + c * Math.abs(o));
  const project = (v, d = 0.998) => ((v / 1000) * d) / (1 - d);
  function velocityFrom(s, axis) {
    if (s.length < 2) return 0;
    const last = s[s.length - 1]; let first = s[0];
    for (let i = s.length - 1; i >= 0; i--) { if (last.t - s[i].t > 90) break; first = s[i]; }
    const dt = (last.t - first.t) / 1000;
    return dt > 0 ? (last[axis] - first[axis]) / dt : 0;
  }

  /* ---------------------------------------------------------------- dados */
  const ITEMS = new Map();
  CATS.forEach(c => c.itens.forEach(it => { it.cat = c; ITEMS.set(it.id, it); }));
  const ALL = [...ITEMS.values()];
  const catItems = id => (CATS.find(c => c.id === id) || { itens: [] }).itens;
  const isPizza = it => !!it.tamanhos;
  const DENSE = new Set(['esfihas', 'especiais', 'doces', 'bebidas', 'fogazzas']);
  const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const PLUS = '<svg class="i-plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const CHECK = '<svg class="i-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const MINUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>';
  const PLUS_S = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2a9.7 9.7 0 0 0-8.3 14.8L2.4 21.6l4.7-1.2A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-2.8.7.8-2.7-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.5 2.5 0 0 0 1.7-1.2 2 2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/></svg>';
  const media = (it, opts) => imgTag(it.img, it.nome, opts);

  /* preços das pizzas (tamanho, meio a meio pelo sabor mais caro, borda) */
  const sizesOf = it => it.tamanhos || [];
  const priceAt = (it, tam) => { const t = sizesOf(it).find(x => x[0] === tam) || sizesOf(it)[sizesOf(it).length - 1]; return t ? t[1] : it.preco; };
  const maxSabores = (it, tam) => { const t = sizesOf(it).find(x => x[0] === tam); return t ? t[2] : 1; };
  const bordasOf = it => (L.bordas && L.bordas[it.cat.id]) || [];
  const bordaPrice = (it, nome) => { const b = bordasOf(it).find(x => x[0] === nome); return b ? b[1] : 0; };
  function unitPrice(l) {
    const it = ITEMS.get(l.id), s = l.sel || {};
    if (!isPizza(it)) return it.preco;
    const tam = s.tam || sizesOf(it)[sizesOf(it).length - 1][0];
    let p = priceAt(it, tam);
    const b = s.sabor2 && ITEMS.get(s.sabor2);
    if (b) p = Math.max(p, priceAt(b, tam));
    if (s.borda) p += bordaPrice(it, s.borda);
    return p;
  }
  /* combo x esfihas avulsas, com os preços do próprio cardápio */
  function avulsoDoCombo(id) {
    const comp = L.combos && L.combos[id]; if (!comp) return 0;
    return Object.entries(comp).reduce((s, [fid, n]) => s + (ITEMS.has(fid) ? ITEMS.get(fid).preco * n : NaN), 0) || 0;
  }
  const economia = it => { const a = avulsoDoCombo(it.id); const d = a - it.preco; return a && d > 0.009 ? d : 0; };

  /* --------------------------------------------- textos da loja e horário */
  $$('[data-loja]').forEach(el => { const v = L[el.dataset.loja]; if (v != null) el.textContent = v; });
  $$('[data-loja-entrega]').forEach(el => { el.textContent = L.entrega[el.dataset.lojaEntrega] || ''; });
  $$('img[data-foto]').forEach(img => { img.classList.add('lazy'); img.src = L.fotos[img.dataset.foto]; });
  $$('[data-count-cat]').forEach(el => { el.textContent = el.dataset.countCat.split(',').reduce((s, c) => s + catItems(c).length, 0); });
  $('#menuCount').textContent = ALL.length;
  const carne = ITEMS.get('carne');
  if (carne) { $('#factPreco').textContent = money(carne.preco); $('.badge-float.b1').innerHTML = `<small>esfiha</small>${esc(money(carne.preco).replace(/\s/g, ' '))}`; }
  $('#perks').textContent = L.comodidades.map(s => s.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' e $1').replace('wi-fi', 'Wi-Fi');
  const waLink = text => `https://wa.me/${L.whatsapp}?text=${encodeURIComponent(text)}`;

  const toMin = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
  const fmtH = h => { const [a, b] = h.split(':'); return `${+a}h${b !== '00' ? b : ''}`; };
  const fmtAte = h => (h === '00:00' ? 'meia-noite' : fmtH(h));
  const H = d => L.horarios[String(d)] || [];
  function statusAgora(now = new Date()) {
    const d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
    for (const [a, b] of H(d)) { const A = toMin(a); let B = toMin(b); if (B <= A) B += 1440; if (m >= A && m < B) return { aberto: true, txt: `Aberto até ${fmtAte(b)}` }; }
    for (const [a, b] of H((d + 6) % 7)) { const A = toMin(a), B = toMin(b); if (B <= A && m < B) return { aberto: true, txt: `Aberto até ${fmtAte(b)}` }; }
    for (const [a] of H(d)) if (toMin(a) > m) return { aberto: false, txt: `Abre hoje às ${fmtH(a)}` };
    for (let i = 1; i <= 7; i++) { const dd = (d + i) % 7, r = H(dd); if (r.length) return { aberto: false, txt: `Abre ${i === 1 ? 'amanhã' : DIAS[dd].toLowerCase()} às ${fmtH(r[0][0])}` }; }
    return { aberto: false, txt: 'Fechado' };
  }
  function pintaHorario() {
    const st = statusAgora(), el = $('#status');
    el.classList.toggle('is-open', st.aberto);
    el.querySelector('span').textContent = st.txt;
    const d = new Date().getDay(), hoje = H(d);
    $('#factHoje').textContent = hoje.length ? hoje.map(([a, b]) => `${fmtH(a)}–${fmtH(b)}`).join(' · ') : 'Fechado';
    $('#factHojeTxt').textContent = st.aberto ? 'aberto agora' : st.txt.toLowerCase();
    $('#hours').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(i => {
      const r = H(i);
      return `<li class="${i === d ? 'is-today' : ''}"><span>${DIAS[i]}${i === d ? ' · hoje' : ''}</span><span>${r.length ? r.map(([a, b]) => `${fmtH(a)} – ${fmtH(b)}`).join(', ') : 'Fechado'}</span></li>`;
    }).join('');
  }
  pintaHorario();
  setInterval(pintaHorario, 60000);

  /* ----------------------------------------------------------------- tema */
  const root = document.documentElement, metaTheme = $('meta[name="theme-color"]');
  const setTheme = t => { root.dataset.theme = t; metaTheme.setAttribute('content', t === 'dark' ? '#1A0F0B' : '#FFF4E2'); };
  setTheme(store.get('pontoesfiha-tema', 'light'));
  $('#themeBtn').addEventListener('click', e => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => { setTheme(next); store.set('pontoesfiha-tema', next); };
    if (!document.startViewTransition || reduce()) { apply(); return; }
    const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 650, easing: EASE_IN_OUT, pseudoElement: '::view-transition-new(root)' });
    }).catch(() => {});
  });

  /* ------------------------------------------- rolagem travada e camadas */
  let lockCount = 0;
  const lockScroll = () => { if (lockCount++ === 0) { const sw = innerWidth - root.clientWidth; document.body.style.paddingRight = sw ? `${sw}px` : ''; document.body.classList.add('is-locked'); } };
  const unlockScroll = () => { if (--lockCount <= 0) { lockCount = 0; document.body.classList.remove('is-locked'); document.body.style.paddingRight = ''; } };
  const layers = [];
  function pushLayer(entry) { entry.returnFocus = document.activeElement; layers.push(entry); try { history.pushState({ pe: layers.length }, ''); } catch { /* ok */ } }
  function requestClose() {
    if (!layers.length) return;
    if (history.state && history.state.pe === layers.length) {
      const n = layers.length;
      history.back();
      // se o navegador ignorar o "voltar", fecha direto
      setTimeout(() => { if (layers.length === n) { const l = layers.pop(); l.close(l); } }, 400);
    } else { const l = layers.pop(); l.close(l); }
  }
  addEventListener('popstate', e => { const depth = (e.state && e.state.pe) || 0; while (layers.length > depth) { const l = layers.pop(); l.close(l); } });
  const restoreFocus = en => { const f = en && en.returnFocus; if (f && f.isConnected && f.focus) f.focus({ preventScroll: true }); };
  document.addEventListener('keydown', e => {
    if (!layers.length) return;
    if (e.key === 'Escape') { e.preventDefault(); requestClose(); return; }
    if (e.key === 'Tab') {
      const box = layers[layers.length - 1].el;
      const f = $$('button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])', box).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let toastT = 0;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('is-visible'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-visible'), 2400); }

  /* ================================================================ SACOLA */
  const cart = store.get('pontoesfiha-sacola', { linhas: [], modo: 'Entrega', nome: '', endereco: '', pagamento: '', troco: '' });
  cart.linhas = (cart.linhas || []).filter(l => ITEMS.has(l.id));
  if (!L.modos.includes(cart.modo)) cart.modo = L.modos[0];
  const lineKey = l => `${l.id}|${JSON.stringify(l.sel || {})}|${l.obs || ''}`;
  const cartCount = () => cart.linhas.reduce((s, l) => s + l.qtd, 0);
  const cartSubtotal = () => cart.linhas.reduce((s, l) => s + unitPrice(l) * l.qtd, 0);
  const saveCart = () => store.set('pontoesfiha-sacola', cart);
  function addToCart(id, { qtd = 1, sel = {}, obs = '' } = {}, quiet) {
    const nova = { id, qtd, sel, obs: obs.trim() }, k = lineKey(nova);
    const ex = cart.linhas.find(l => lineKey(l) === k);
    if (ex) ex.qtd += qtd; else cart.linhas.push(nova);
    saveCart();
    if (!quiet) { paintBadges(true); if (cartLayer.isOpen) renderCart(); }
  }
  function paintBadges(bump) {
    const n = cartCount();
    $('#bagCount').textContent = n; $('#cartbarCount').textContent = n;
    $('#cartbarTotal').textContent = money(cartSubtotal());
    $('#cartbar').classList.toggle('is-visible', n > 0);
    $('#bagBtn').setAttribute('aria-label', `Abrir sacola de pedido, ${n} ${n === 1 ? 'item' : 'itens'}`);
    if (bump && !reduce()) [$('#bagCount'), $('#cartbarCount')].forEach(el => el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 380, easing: EASE_OUT }));
  }
  function flyToBag(fromEl) {
    if (reduce() || !fromEl || fromEl.tagName !== 'IMG') return;
    const t = $('#bagBtn').getBoundingClientRect(), r = fromEl.getBoundingClientRect();
    if (!r.width) return;
    const outer = document.createElement('div');
    outer.style.cssText = 'position:fixed;left:0;top:0;z-index:250;pointer-events:none;';
    const img = document.createElement('img'); img.className = 'flyer'; img.src = fromEl.currentSrc || fromEl.src; img.alt = '';
    outer.appendChild(img); document.body.appendChild(outer);
    const x0 = r.left + r.width / 2 - 28, y0 = r.top + r.height / 2 - 28, x1 = t.left + t.width - 38, y1 = t.top + t.height / 2 - 28;
    outer.animate([{ transform: `translateX(${x0}px)` }, { transform: `translateX(${x1}px)` }], { duration: 640, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'forwards' });
    img.animate([{ transform: `translateY(${y0}px) scale(1.25) rotate(0deg)`, opacity: 0 }, { transform: `translateY(${y0 - 30}px) scale(1.1) rotate(90deg)`, opacity: 1, offset: 0.15 }, { transform: `translateY(${y1}px) scale(.35) rotate(360deg)`, opacity: .9 }],
      { duration: 640, easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)', fill: 'forwards' }).onfinish = () => outer.remove();
  }
  function markAdded(btn) { if (!btn) return; btn.classList.add('is-added'); clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove('is-added'), 1300); }
  function quickAdd(id, btn, imgEl) {
    const it = ITEMS.get(id);
    if (isPizza(it)) { openDetail(id, imgEl); return; } // pizza pede tamanho
    addToCart(id); markAdded(btn); flyToBag(imgEl); toast(`${it.nome} na sacola`);
  }

  /* ================================================================== HERO */
  function buildOrbit() {
    const orbit = $('#orbit');
    const comFoto = ALL.filter(i => !i.ilus && /esfiha|pizza|beirute|porc/.test(norm(i.cat.nome + i.nome)));
    const ilus = ['carne', 'calabresa', 'frango-com-cream-cheese', 'pizza-calabresa', 'esfiha-doce-chocolate-branco', 'pizza-portuguesa', 'milho-com-catupiry', 'x-tudo'].map(id => ITEMS.get(id)).filter(Boolean);
    const pick = shuffled([...comFoto.slice(0, 6), ...ilus], 11).slice(0, 12);
    orbit.innerHTML = pick.map((it, i) => `<span style="--a:${(i / pick.length) * 360}deg;--r:228%"><img src="${esc(it.img)}" alt="" loading="lazy" decoding="async"></span>`).join('');
  }
  function playIntro() {
    if (reduce()) return;
    $$('.hero__title .w').forEach((w, i) => w.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 900, delay: 120 + i * 120, easing: EASE_OUT, fill: 'backwards' }));
    $('.plate').animate([{ transform: 'rotate(-14deg) translateY(-30px)', opacity: 0 }, { transform: 'rotate(-2.5deg)', opacity: 1 }], { duration: 900, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)', fill: 'backwards' });
    [$('.hero__lead'), $('.hero__cta'), $('.hero__facts')].forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 300 + i * 80, easing: EASE_OUT, fill: 'backwards' }));
    $('.board').animate([{ transform: 'scale(.7) rotate(-40deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1100, delay: 100, easing: EASE_OUT, fill: 'backwards' });
    $$('.orbit span').forEach((s, i) => s.firstElementChild.animate([{ scale: '0' }, { scale: '1' }], { duration: 600, delay: 450 + i * 60, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' }));
    $$('.badge-float').forEach((b, i) => b.animate([{ opacity: 0, scale: '.5' }, { opacity: 1, scale: '1' }], { duration: 700, delay: 800 + i * 120, easing: 'cubic-bezier(0.34, 1.5, 0.64, 1)', fill: 'backwards' }));
  }
  function runLoader() {
    const loader = $('#loader');
    let seen = false;
    try { seen = sessionStorage.getItem('pontoesfiha-abertura') === '1'; } catch { /* ok */ }
    if (reduce() || seen) { loader.classList.add('is-gone'); playIntro(); return; }
    const t0 = performance.now();
    Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(1400)]).then(() => {
      setTimeout(() => {
        loader.classList.add('is-done'); playIntro();
        setTimeout(() => loader.classList.add('is-gone'), 800);
        try { sessionStorage.setItem('pontoesfiha-abertura', '1'); } catch { /* ok */ }
      }, Math.max(0, 1150 - (performance.now() - t0)));
    });
  }

  /* --------------------------------------- faixas infinitas (reagem ao scroll) */
  function marquee(track, html, { speed = 60, dir = 1, copies = 3 } = {}) {
    track.innerHTML = Array.from({ length: copies }, () => html).join('');
    if (reduce()) return;
    let x = 0, w = track.firstElementChild.offsetWidth, last = performance.now(), lastY = scrollY, vel = 0, sdir = 1, visible = true, hover = false;
    new ResizeObserver(() => { w = track.firstElementChild.offsetWidth; }).observe(track.firstElementChild);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(track);
    track.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && track.dataset.pause) hover = true; });
    track.addEventListener('pointerleave', () => { hover = false; });
    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const dy = scrollY - lastY; lastY = scrollY;
      if (dy) sdir = dy > 0 ? 1 : -1;
      vel += (Math.min(Math.abs(dy) / Math.max(dt, 0.001), 3000) - vel) * Math.min(1, dt * 6);
      if (visible && w) { x = mod(x + dir * sdir * (hover ? speed * .15 : speed + vel * 0.22) * dt, w); track.style.transform = `translate3d(${-x}px,0,0)`; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  function buildBands() {
    const a = ['Carne', 'Queijo', 'Calabresa', 'Frango com Catupiry', 'Brócolis com alho', 'Pizza meio a meio', 'Beirute', 'Fogazza', 'Chocolate', 'Romeu e Julieta'];
    const b = [L.slogan, `${L.endereco.replace('Av. Brig. José Vicente de ', 'Av. ')}`, 'Entrega · Retirada · Salão', `Esfiha a partir de ${money(Math.min(...catItems('esfihas').map(i => i.preco)))}`];
    const g = words => `<div class="band__group">${words.map(w => `<span class="band__item">${esc(w)}<i></i></span>`).join('')}</div>`;
    marquee($('#bandA'), g(a), { speed: 60, dir: 1 });
    marquee($('#bandB'), g(b), { speed: 48, dir: -1 });
  }

  /* ======================================================= MONTE SUA CAIXA */
  const box = store.get('pontoesfiha-caixa', { size: 20, list: [] });
  box.list = (box.list || []).filter(id => ITEMS.has(id));
  let pickTab = 'esfihas', lastAdded = -1;
  const saveBox = () => store.set('pontoesfiha-caixa', box);
  const boxCounts = () => box.list.reduce((m, id) => (m[id] = (m[id] || 0) + 1, m), {});
  const boxTotal = () => box.list.reduce((s, id) => s + ITEMS.get(id).preco, 0);
  function comboIgual() {
    const c = boxCounts(), ks = Object.keys(c);
    for (const [cid, comp] of Object.entries(L.combos || {})) {
      const ck = Object.keys(comp);
      if (ks.length === ck.length && ck.every(k => c[k] === comp[k]) && ITEMS.has(cid)) return ITEMS.get(cid);
    }
    return null;
  }
  function renderPicker() {
    const c = boxCounts(), full = box.list.length >= box.size;
    $('#pickList').innerHTML = catItems(pickTab).map(it => `
      <li class="pick${c[it.id] ? ' is-on' : ''}" data-id="${it.id}" data-q="${c[it.id] || 0}">
        ${imgTag(it.img, '')}
        <div><span class="pick__name">${esc(it.nome)}</span><span class="pick__price">${money(it.preco)}</span></div>
        <div class="stepper stepper--sm" role="group" aria-label="Quantidade de ${esc(it.nome)} na caixa">
          <button type="button" data-bq="-1" aria-label="Tirar ${esc(it.nome)}" ${c[it.id] ? '' : 'disabled'}>${MINUS}</button>
          <output>${c[it.id] || 0}</output>
          <button type="button" data-bq="1" aria-label="Pôr ${esc(it.nome)}" ${full ? 'disabled' : ''}>${PLUS_S}</button>
        </div>
      </li>`).join('');
    markLoaded($('#pickList'));
  }
  function paintPicker() {
    const c = boxCounts(), full = box.list.length >= box.size;
    $$('.pick').forEach(li => {
      const q = c[li.dataset.id] || 0;
      li.classList.toggle('is-on', q > 0); li.dataset.q = q;
      li.querySelector('output').textContent = q;
      li.querySelector('[data-bq="-1"]').disabled = q <= 0;
      li.querySelector('[data-bq="1"]').disabled = full;
    });
  }
  function renderSlots() {
    const slots = $('#slots');
    slots.dataset.n = box.size;
    slots.innerHTML = Array.from({ length: box.size }, (_, i) => {
      const id = box.list[i];
      return `<div class="slot${i === lastAdded ? ' is-new' : ''}">${id ? `<img src="${esc(ITEMS.get(id).img)}" alt="" decoding="async">` : ''}</div>`;
    }).join('');
    lastAdded = -1;
  }
  function paintBox() {
    const n = box.list.length, tot = boxTotal();
    $('#boxCount').textContent = n; $('#boxSize').textContent = box.size;
    $('#boxTotal').textContent = money(tot);
    $('#boxAvg').textContent = n ? `${money(tot / n)} por esfiha, em média` : 'escolha os sabores';
    $('#boxAdd').disabled = !n;
    $('#boxAdd').textContent = n ? `Pôr ${n} ${n === 1 ? 'esfiha' : 'esfihas'} na sacola` : 'Pôr a caixa na sacola';
    $('#boxFill').disabled = n >= box.size;
    $('#boxClear').disabled = !n;
    $('#pickSum').innerHTML = `<b>${n}</b> de ${box.size} na caixa<span>${money(tot)}</span>`;
    const hint = $('#boxHint'), combo = comboIgual();
    if (combo && combo.preco < tot - 0.009) {
      hint.hidden = false;
      hint.innerHTML = `<span>Essa caixa é igual ao <b>${esc(combo.nome)}</b>: ${money(combo.preco)} em vez de ${money(tot)} (<b>${money(tot - combo.preco)} a menos</b>).</span><button type="button" class="btn btn--sm btn--dark" data-swap="${combo.id}">Levar o combo</button>`;
    } else hint.hidden = true;
  }
  function buildBox() {
    $(`#boxSizes input[value="${box.size}"]`).checked = true;
    renderPicker(); renderSlots(); paintBox();
    $('#boxSizes').addEventListener('change', e => {
      box.size = Number(e.target.value);
      const sobra = box.list.length - box.size;
      if (sobra > 0) { box.list.length = box.size; toast(`Tirei ${sobra} ${sobra === 1 ? 'esfiha' : 'esfihas'} para caber na caixa`); }
      saveBox(); renderSlots(); paintBox(); paintPicker();
    });
    $('#pickTabs').addEventListener('click', e => {
      const b = e.target.closest('[data-pt]'); if (!b) return;
      pickTab = b.dataset.pt;
      $$('#pickTabs [role="tab"]').forEach(t => t.setAttribute('aria-selected', t === b ? 'true' : 'false'));
      renderPicker(); $('#pickList').scrollTop = 0;
    });
    $('#pickList').addEventListener('click', e => {
      const b = e.target.closest('[data-bq]'); if (!b) return;
      const id = b.closest('.pick').dataset.id;
      if (b.dataset.bq === '1') {
        if (box.list.length >= box.size) { toast('A caixa está cheia. Troque o tamanho ou tire uma esfiha.'); return; }
        box.list.push(id); lastAdded = box.list.length - 1;
      } else {
        const i = box.list.lastIndexOf(id); if (i < 0) return;
        box.list.splice(i, 1);
      }
      saveBox(); renderSlots(); paintBox(); paintPicker();
    });
    $('#boxFill').addEventListener('click', () => {
      const base = ITEMS.get('carne') || catItems('esfihas')[0];
      const falta = box.size - box.list.length; if (falta <= 0) return;
      for (let i = 0; i < falta; i++) box.list.push(base.id);
      saveBox(); renderSlots(); paintBox(); paintPicker();
      if (!reduce()) $$('#slots .slot').slice(-falta).forEach((s, i) => { const im = s.firstElementChild; if (im) im.animate([{ scale: '0' }, { scale: '1' }], { duration: 380, delay: i * 25, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' }); });
    });
    $('#boxClear').addEventListener('click', () => { box.list = []; saveBox(); renderSlots(); paintBox(); paintPicker(); });
    $('#boxAdd').addEventListener('click', () => {
      const c = boxCounts(), n = box.list.length; if (!n) return;
      Object.entries(c).forEach(([id, q]) => addToCart(id, { qtd: q }, true));
      paintBadges(true); if (cartLayer.isOpen) renderCart();
      flyToBag($('#slots img'));
      toast(`${n} ${n === 1 ? 'esfiha' : 'esfihas'} na sacola`);
      box.list = []; saveBox(); renderSlots(); paintBox(); paintPicker();
    });
    $('#boxHint').addEventListener('click', e => {
      const b = e.target.closest('[data-swap]'); if (!b) return;
      const it = ITEMS.get(b.dataset.swap);
      addToCart(it.id); flyToBag($('#slots img')); toast(`${it.nome} na sacola`);
      box.list = []; saveBox(); renderSlots(); paintBox(); paintPicker();
    });
  }

  /* ================================================ COMBOS (carrossel infinito) */
  function buildFavs() {
    const lista = catItems('combos');
    const n = lista.length;
    const card = (it, hidden, i) => {
      const eco = economia(it);
      return `
      <article class="fav ${i % 3 === 1 ? 'fav--t2' : i % 3 === 2 ? 'fav--t1' : ''}" role="listitem" data-id="${it.id}" ${hidden ? 'aria-hidden="true"' : ''}>
        <div class="fav__media">${media(it)}${eco ? `<span class="fav__save">${money(eco)} a menos que avulso</span>` : ''}</div>
        <button type="button" class="fav__open" ${hidden ? 'tabindex="-1"' : ''} aria-label="Ver ${esc(it.nome)}"></button>
        <div class="fav__body"><div><h3 class="fav__name">${esc(it.nome)}</h3>${it.desc ? `<p class="fav__desc">${esc(it.desc)}</p>` : ''}<p class="fav__price">${money(it.preco)}</p></div>
          <button type="button" class="add-btn" ${hidden ? 'tabindex="-1"' : ''} aria-label="Adicionar ${esc(it.nome)}">${PLUS}${CHECK}</button></div>
      </article>`;
    };
    const track = $('#favTrack'), vp = $('#favViewport');
    track.innerHTML = [true, false, true].map(h => lista.map((it, i) => card(it, h, i)).join('')).join('');
    markLoaded(track);
    let setW = 0, step = 0, x = 0, anim = null, drag = null, hovering = false, visible = false, dragged = false, resumeAt = 0, last = performance.now();
    const measure = () => { const c = track.children; setW = c[n].offsetLeft - c[0].offsetLeft; step = c[1].offsetLeft - c[0].offsetLeft; };
    measure(); new ResizeObserver(measure).observe(vp);
    const render = () => { track.style.transform = `translate3d(${mod(x, setW) - setW}px,0,0)`; };
    render();
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(vp);
    vp.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovering = true; });
    vp.addEventListener('pointerleave', () => { hovering = false; });
    const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (visible && !drag && (!anim || anim.done) && !hovering && !reduce() && now > resumeAt) { x -= 30 * dt; render(); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    const goTo = (target, velocity = 0) => {
      const from = anim && !anim.done ? anim.value : x, v = anim && !anim.done ? anim.velocity : velocity;
      anim && anim.stop();
      if (reduce()) { x = target; render(); return; }
      anim = spring({ from, to: target, velocity: velocity || v, response: 0.5, damping: 1, onUpdate: val => { x = val; render(); } });
      resumeAt = performance.now() + 3500;
    };
    const snap = v => Math.round(v / step) * step;
    $('#favPrev').addEventListener('click', () => goTo(snap(anim && !anim.done ? anim.value : x) + step));
    $('#favNext').addEventListener('click', () => goTo(snap(anim && !anim.done ? anim.value : x) - step));
    vp.addEventListener('pointerdown', e => { if (e.button !== 0) return; if (anim) { anim.stop(); anim = null; } drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: x, active: false, s: [{ t: e.timeStamp, x: e.clientX }] }; dragged = false; });
    vp.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.active) { if (Math.abs(dx) < 8) { if (Math.abs(dy) > 10) drag = null; return; } drag.active = true; dragged = true; drag.sx = e.clientX; drag.x0 = x; vp.setPointerCapture(e.pointerId); vp.classList.add('is-dragging'); }
      x = drag.x0 + (e.clientX - drag.sx); render();
      drag.s.push({ t: e.timeStamp, x: e.clientX }); if (drag.s.length > 8) drag.s.shift();
    });
    const end = e => { if (!drag || e.pointerId !== drag.id) return; if (drag.active) { const v = clamp(velocityFrom(drag.s, 'x'), -4000, 4000); goTo(snap(x + project(v)), v); } drag = null; vp.classList.remove('is-dragging'); };
    vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end);
    vp.addEventListener('click', e => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
    vp.addEventListener('click', e => {
      const f = e.target.closest('.fav'); if (!f) return;
      const img = f.querySelector('.fav__media img'), add = e.target.closest('.add-btn');
      if (add) quickAdd(f.dataset.id, add, img); else if (e.target.closest('.fav__open')) openDetail(f.dataset.id, img);
    });
    track.addEventListener('focusin', e => {
      const f = e.target.closest('.fav'); if (!f) return;
      const left = f.offsetLeft + (mod(x, setW) - setW), vw = vp.clientWidth;
      if (left < 16) goTo(x + (16 - left)); else if (left + f.offsetWidth > vw - 16) goTo(x - (left + f.offsetWidth - vw + 16));
    });
  }

  /* ================================================================ MENU */
  const FILTROS = [
    { k: 'carne', label: 'Carne', t: ['carne', 'hamburg'] }, { k: 'frango', label: 'Frango', t: ['frango', 'catufrango', 'catoles', 'caipira'] },
    { k: 'calabresa', label: 'Calabresa', t: ['calabresa', 'pepperoni', 'toscana'] }, { k: 'catupiry', label: 'Catupiry e requeijão', t: ['catupiry', 'requeij', 'cream cheese'] },
    { k: 'cheddar', label: 'Cheddar', t: ['cheddar'] }, { k: 'doces', label: 'Doces', c: ['doces', 'pizzas-doces'] }, { k: 'ate5', label: 'Até R$ 5', p: 5 }
  ];
  const state = { filtros: new Set(), busca: '' };
  const searchText = it => norm(`${it.nome} ${it.desc} ${it.cat.nome}`);
  function priceHTML(it) {
    if (isPizza(it)) {
      const t = sizesOf(it);
      return t.length > 1
        ? `${money(t[0][1])}<small>${esc(t[0][0].toLowerCase())} · ${esc(t[1][0].toLowerCase())} ${money(t[1][1])}</small>`
        : `${money(t[0][1])}<small>${esc(t[0][0].toLowerCase())}</small>`;
    }
    const eco = economia(it);
    return `${money(it.preco)}${eco ? `<small>${money(eco)} a menos que avulso</small>` : ''}`;
  }
  function itemHTML(it, i) {
    return `
      <article class="item reveal" data-id="${it.id}" style="--d:${(i % 3) * 50}ms">
        <button type="button" class="item__open" aria-label="Ver ${esc(it.nome)}, ${money(it.preco)}"></button>
        <div class="item__media${it.ilus ? ' is-ilus' : ''}">${media(it)}</div>
        <div class="item__body">
          <h4 class="item__name">${esc(it.nome)}</h4>
          ${it.desc ? `<p class="item__desc">${esc(it.desc)}</p>` : ''}
          <span class="item__price">${priceHTML(it)}</span>
        </div>
        <button type="button" class="add-btn" aria-label="${isPizza(it) ? 'Escolher tamanho de' : 'Adicionar'} ${esc(it.nome)}">${PLUS}${CHECK}</button>
      </article>`;
  }
  function buildMenu() {
    $('#filters').innerHTML = FILTROS.map(f => `<button type="button" class="chip-f" aria-pressed="false" data-f="${f.k}">${f.label}</button>`).join('');
    $('#menuSections').innerHTML = CATS.map((cat, ci) => `
        <section class="cat${DENSE.has(cat.id) ? ' cat--dense' : ''}" id="cat-${cat.id}" data-cat="${cat.id}" aria-labelledby="t-${cat.id}">
          <header class="cat__head reveal">
            <span class="cat__num">${ci + 1}</span>
            <h3 class="cat__title" id="t-${cat.id}">${esc(cat.nome)}</h3>
            <p class="cat__desc">${esc(cat.desc)}</p>
            <span class="cat__count" data-count>${cat.itens.length} opções</span>
          </header>
          <div class="cat__grid">${cat.itens.map(itemHTML).join('')}</div>
        </section>`).join('');
    const tabs = CATS.map(c => `<li><button type="button" class="tab" data-cat="${c.id}">${esc(c.curto)} <sup>${c.itens.length}</sup></button></li>`).join('');
    $('#tabsList').innerHTML = tabs; $('#tabsActive').innerHTML = tabs;
    markLoaded($('#menuSections'));
    $('#menuSections').addEventListener('click', e => {
      const card = e.target.closest('.item'); if (!card) return;
      const img = card.querySelector('.item__media img'), add = e.target.closest('.add-btn');
      if (add) quickAdd(card.dataset.id, add, img); else if (e.target.closest('.item__open')) openDetail(card.dataset.id, img);
    });
    $('#filters').addEventListener('click', e => {
      const b = e.target.closest('.chip-f'); if (!b) return;
      const k = b.dataset.f; state.filtros.has(k) ? state.filtros.delete(k) : state.filtros.add(k);
      b.setAttribute('aria-pressed', state.filtros.has(k)); applyFilters();
    });
    const search = $('#search'), sbox = $('#searchBox');
    let deb = 0;
    search.addEventListener('input', () => { sbox.classList.toggle('has-value', !!search.value); clearTimeout(deb); deb = setTimeout(() => { state.busca = search.value; applyFilters(); }, 120); });
    search.addEventListener('focus', () => sbox.classList.add('is-open'));
    search.addEventListener('blur', () => { if (!search.value) sbox.classList.remove('is-open'); });
    $('#searchClear').addEventListener('click', () => { search.value = ''; sbox.classList.remove('has-value'); state.busca = ''; applyFilters(); search.focus(); });
    $('#emptyReset').addEventListener('click', () => { search.value = ''; sbox.classList.remove('has-value', 'is-open'); state.busca = ''; state.filtros.clear(); $$('.chip-f').forEach(c => c.setAttribute('aria-pressed', 'false')); applyFilters(); });
  }
  function applyFilters() {
    const q = norm(state.busca.trim()).split(/\s+/).filter(Boolean);
    let total = 0;
    CATS.forEach(cat => {
      let count = 0;
      cat.itens.forEach(it => {
        const txt = searchText(it);
        const okF = [...state.filtros].every(k => { const f = FILTROS.find(x => x.k === k); return f.p ? it.preco <= f.p : f.c ? f.c.includes(cat.id) : f.t.some(w => txt.includes(w)); });
        const show = okF && q.every(w => txt.includes(w));
        const el = $(`.item[data-id="${it.id}"]`); el.hidden = !show;
        if (show) { count++; el.classList.add('is-in'); }
      });
      const sec = $(`#cat-${cat.id}`);
      sec.hidden = !count;
      sec.querySelector('[data-count]').textContent = `${count} ${count === 1 ? 'opção' : 'opções'}`;
      $$(`.tab[data-cat="${cat.id}"] sup`).forEach(s => { s.textContent = count; });
      $$(`.tab[data-cat="${cat.id}"]`).forEach(t => { t.style.opacity = count ? '' : '.4'; });
      total += count;
    });
    $('#empty').hidden = total > 0;
    const top = $('#menuSections').getBoundingClientRect().top + scrollY - offsetTop();
    if (scrollY > top) scrollTo({ top, behavior: 'instant' });
    spy();
  }

  /* --------------------------------------- abas com indicador por clip-path */
  const offsetTop = () => $('#topbar').offsetHeight + $('#menubar').offsetHeight;
  let activeCat = null, spyLock = 0;
  function setActiveTab(id, scrollTabs = true) {
    if (id === activeCat) return;
    activeCat = id;
    const list = $('#tabsList'), btn = list.querySelector(`.tab[data-cat="${id}"]`); if (!btn) return;
    const W = list.offsetWidth, Hh = list.offsetHeight, top = (Hh - btn.offsetHeight) / 2;
    $('#tabsActive').style.clipPath = `inset(${top}px ${W - (btn.offsetLeft + btn.offsetWidth)}px ${top}px ${btn.offsetLeft}px round 999px)`;
    $$('.tab', list).forEach(t => t.setAttribute('aria-current', t === btn ? 'true' : 'false'));
    if (scrollTabs) { const sc = $('#tabsScroller'); sc.scrollTo({ left: Math.max(0, btn.offsetLeft - sc.clientWidth / 2 + btn.offsetWidth / 2), behavior: reduce() ? 'auto' : 'smooth' }); }
  }
  function spy() {
    if (performance.now() < spyLock) return;
    const line = offsetTop() + 80; let cur = null;
    $$('.cat:not([hidden])').forEach(s => { if (s.getBoundingClientRect().top <= line) cur = s.dataset.cat; });
    if (!cur) { const f = $('.cat:not([hidden])'); cur = f && f.dataset.cat; }
    if (cur) setActiveTab(cur);
  }
  function bindTabs() {
    $('#tabsList').addEventListener('click', e => {
      const b = e.target.closest('.tab'); if (!b) return;
      const sec = $(`#cat-${b.dataset.cat}`); if (!sec || sec.hidden) return;
      setActiveTab(b.dataset.cat); spyLock = performance.now() + 1000;
      scrollTo({ top: sec.getBoundingClientRect().top + scrollY - offsetTop() + 1, behavior: reduce() ? 'auto' : 'smooth' });
    });
    const refresh = () => { const a = activeCat; activeCat = null; setActiveTab(a || CATS[0].id, false); };
    addEventListener('resize', refresh);
    if (document.fonts) document.fonts.ready.then(refresh);
  }
  function bindScroll() {
    const topbar = $('#topbar'); let ticking = false;
    const on = () => { ticking = false; topbar.classList.toggle('is-scrolled', scrollY > 8); spy(); };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(on); } }, { passive: true });
    on();
  }

  /* ============================================ folha arrastável (celular) */
  function createSheet(panel, layer, { scroller }) {
    const scrim = layer.querySelector('.scrim');
    let y = 0, h = 1, anim = null, drag = null;
    const set = v => { y = v; panel.style.transform = `translateY(${v}px)`; scrim.style.opacity = String(clamp(1 - v / h, 0, 1)); };
    const api = {
      open() { h = panel.offsetHeight || innerHeight; scrim.style.transition = 'none'; anim && anim.stop(); if (reduce()) { set(0); panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); return; } set(h); anim = spring({ from: h, to: 0, response: 0.45, damping: 1, onUpdate: set }); },
      close(done, velocity = 0) { h = panel.offsetHeight || innerHeight; anim && anim.stop(); if (reduce()) { panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).onfinish = done; return; } anim = spring({ from: y, to: h + 20, velocity, response: 0.34, damping: 1, onUpdate: set, onComplete: done }); },
      reset() { anim && anim.stop(); panel.style.transform = ''; scrim.style.opacity = ''; scrim.style.transition = ''; y = 0; }
    };
    const start = (cy, cx, t, id, inS) => { drag = { id, sy: cy, sx: cx, y0: y, active: false, inS, s: [{ t, y: cy }] }; };
    const move = (cy, cx, t) => {
      if (!drag) return false;
      const dy = cy - drag.sy, dx = cx - drag.sx;
      if (!drag.active) {
        if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return false;
        if (Math.abs(dx) > Math.abs(dy) || (drag.inS && dy < 0)) { drag = null; return false; }
        drag.active = true; anim && anim.stop(); drag.y0 = y; drag.sy = cy; h = panel.offsetHeight;
      }
      let ny = drag.y0 + (cy - drag.sy); if (ny < 0) ny = -rubber(-ny, h);
      set(ny); drag.s.push({ t, y: cy }); if (drag.s.length > 8) drag.s.shift();
      return true;
    };
    const end = () => {
      if (!drag) return;
      if (drag.active) { const v = velocityFrom(drag.s, 'y'); if (y > h * 0.3 || v > 650) { layer._v = Math.max(v, 0); requestClose(); } else anim = spring({ from: y, to: 0, velocity: v, response: 0.38, damping: 0.86, onUpdate: set }); }
      drag = null;
    };
    panel.addEventListener('pointerdown', e => {
      if (!isMobile() || (e.pointerType === 'touch' && scroller && scroller.contains(e.target))) return;
      if (e.button !== 0 || e.target.closest('button, input, textarea, label, a, select')) return;
      start(e.clientY, e.clientX, e.timeStamp, e.pointerId, scroller && scroller.contains(e.target) && scroller.scrollTop > 0);
      if (drag && drag.inS) drag = null;
    });
    panel.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId) return; const was = drag.active; if (move(e.clientY, e.clientX, e.timeStamp) && !was) { try { panel.setPointerCapture(e.pointerId); } catch { /* ok */ } } });
    panel.addEventListener('pointerup', e => { if (drag && drag.id === e.pointerId) end(); });
    panel.addEventListener('pointercancel', e => { if (drag && drag.id === e.pointerId) end(); });
    if (scroller) {
      scroller.addEventListener('touchstart', e => { if (!isMobile() || e.touches.length > 1 || e.target.closest('input, textarea, button, label, select')) return; const t = e.touches[0]; if (scroller.scrollTop <= 0) start(t.clientY, t.clientX, e.timeStamp, 'touch', true); }, { passive: true });
      scroller.addEventListener('touchmove', e => { if (!drag || drag.id !== 'touch') return; const t = e.touches[0]; if ((t.clientY - drag.sy > 0 || drag.active) && scroller.scrollTop <= 0 && e.cancelable) e.preventDefault(); move(t.clientY, t.clientX, e.timeStamp); }, { passive: false });
      scroller.addEventListener('touchend', () => { if (drag && drag.id === 'touch') end(); });
      scroller.addEventListener('touchcancel', () => { if (drag && drag.id === 'touch') end(); });
    }
    return api;
  }

  /* ========================================= DETALHE (pizza: tamanho, meio a meio, borda) */
  const detailLayer = $('#detailLayer'), detail = $('#detail'), detailMedia = $('#detailMedia'), detailBody = $('#detailBody');
  const detailSheet = createSheet(detail, detailLayer, { scroller: detailBody });
  let ds = null;

  function pizzaHTML(it) {
    const t = sizesOf(it), bordas = bordasOf(it);
    return `
      <fieldset class="grp"><legend><span>Tamanho</span></legend>
        <div class="sizes2">${t.map(([n, p, s]) => `<label class="opt"><input type="radio" name="tam" value="${esc(n)}"><i></i><span class="opt__name">${esc(n)}${s > 1 ? '<small>até 2 sabores</small>' : ''}</span><span class="opt__price">${money(p)}</span></label>`).join('')}</div>
      </fieldset>
      <fieldset class="grp half" data-half hidden><legend><span>Meio a meio</span><em>cobra o sabor mais caro</em></legend>
        <label class="field"><span class="sr-only">Segundo sabor</span><select name="sabor2"></select></label>
      </fieldset>
      ${bordas.length ? `<fieldset class="grp"><legend><span>Borda</span><em>opcional</em></legend>
        <label class="opt"><input type="radio" name="borda" value=""><i></i><span class="opt__name">Tradicional</span><span class="opt__price">sem custo</span></label>
        ${bordas.map(([n, p]) => `<label class="opt"><input type="radio" name="borda" value="${esc(n)}"><i></i><span class="opt__name">${esc(n)}</span><span class="opt__price">+ ${money(p)}</span></label>`).join('')}
      </fieldset>` : ''}`;
  }
  function detailHTML(it) {
    const eco = economia(it);
    return `
      <div class="detail__content">
        <span class="detail__cat">${esc(it.cat.nome)}</span>
        <h2 class="detail__name" id="detailName">${esc(it.nome)}</h2>
        ${it.desc ? `<p class="detail__desc">${esc(it.desc)}</p>` : ''}
        ${eco ? `<div class="detail__meta"><span>${money(eco)} a menos que pedir as esfihas avulsas</span></div>` : ''}
        <p class="detail__price" data-price></p>
        ${isPizza(it) ? pizzaHTML(it) : ''}
        <label class="note"><span>Alguma observação?</span><textarea name="obs" rows="2" maxlength="140" placeholder="${it.cat.id === 'bebidas' ? 'Ex.: sabor do refrigerante' : 'Ex.: sem cebola, bem assada'}"></textarea></label>
      </div>
      <div class="detail__foot">
        <div class="stepper" role="group" aria-label="Quantidade">
          <button type="button" data-step="-1" aria-label="Diminuir quantidade" disabled>${MINUS}</button><output aria-live="polite">1</output><button type="button" data-step="1" aria-label="Aumentar quantidade">${PLUS_S}</button>
        </div>
        <button type="button" class="btn btn--red" data-add><span>Adicionar</span><span data-total></span></button>
      </div>`;
  }
  function paintDetail() {
    const it = ITEMS.get(ds.id), line = { id: it.id, sel: ds.sel };
    if (isPizza(it) && maxSabores(it, ds.sel.tam) < 2) ds.sel.sabor2 = null; // broto é de um sabor só
    const u = unitPrice(line);
    detailBody.querySelector('[data-price]').textContent = money(u);
    detailBody.querySelector('[data-total]').textContent = money(u * ds.qtd);
    detailBody.querySelector('.detail__foot output').textContent = ds.qtd;
    detailBody.querySelector('[data-step="-1"]').disabled = ds.qtd <= 1;
    if (!isPizza(it)) return;
    const tam = ds.sel.tam;
    $$('input[name="tam"]', detailBody).forEach(r => { r.checked = r.value === tam; });
    $$('input[name="borda"]', detailBody).forEach(r => { r.checked = r.value === (ds.sel.borda || ''); });
    const half = $('[data-half]', detailBody), pode = maxSabores(it, tam) > 1;
    half.hidden = !pode;
    if (pode) {
      const sel = $('select[name="sabor2"]', detailBody);
      const outros = it.cat.itens.filter(o => o.id !== it.id && sizesOf(o).some(t => t[0] === tam && t[2] > 1));
      sel.innerHTML = `<option value="">Inteira de ${esc(it.nome)}</option>` + outros.map(o => `<option value="${o.id}" ${o.id === ds.sel.sabor2 ? 'selected' : ''}>Meia ${esc(o.nome)} · ${money(priceAt(o, tam))}</option>`).join('');
    }
    paintHalf();
  }
  function paintHalf() {
    const b = ds.sel.sabor2 && ITEMS.get(ds.sel.sabor2);
    let el = detailMedia.querySelector('.half-b');
    detailMedia.classList.toggle('has-half', !!b);
    if (b) {
      if (!el) { el = document.createElement('img'); el.className = 'fgimg half-b'; el.alt = ''; detailMedia.appendChild(el); }
      if (el.getAttribute('src') !== b.img) { el.src = b.img; if (!reduce()) el.animate([{ opacity: 0, transform: 'translateX(12%)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE_OUT }); }
    } else if (el) el.remove();
  }
  function openDetail(id, originImg) {
    const it = ITEMS.get(id);
    if (!it || ds) return;
    const t = sizesOf(it);
    ds = { id, qtd: 1, sel: isPizza(it) ? { tam: t[t.length - 1][0], sabor2: null, borda: '' } : {}, origin: originImg && originImg.tagName === 'IMG' ? originImg : null, at: performance.now() };
    detailBody.innerHTML = detailHTML(it); detailBody.scrollTop = 0;
    detailMedia.className = `detail__media${it.ilus ? ' is-ilus' : ''}`;
    detailMedia.innerHTML = `<img class="bgimg" src="${esc(it.img)}" alt="" aria-hidden="true"><img id="detailImg" class="fgimg" src="${esc(it.img)}" alt="${esc(it.nome)}">${it.ilus ? '<span class="cap">Ilustração do sabor · sem foto no cardápio da loja</span>' : ''}`;
    paintDetail();
    detailLayer.hidden = false; lockScroll();
    pushLayer({ el: detail, close: closeDetailNow });
    if (isMobile()) { detailLayer.classList.add('is-open'); detailSheet.open(); }
    else if (ds.origin && !reduce() && ds.origin.getBoundingClientRect().width > 0) flipOpen(ds.origin);
    else { detail.offsetWidth; detailLayer.classList.add('is-open'); }
    requestAnimationFrame(() => detail.focus({ preventScroll: true }));
  }
  function radiusOf(el) { for (let n = el, i = 0; n && i < 4; n = n.parentElement, i++) { const cs = getComputedStyle(n); if (cs.borderTopLeftRadius !== '0px') return cs.borderRadius; } return '16px'; }
  function makeClone(r, src, rad) {
    const c = document.createElement('div');
    c.style.cssText = `position:fixed;z-index:150;overflow:hidden;pointer-events:none;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${rad};background:var(--img-bg)`;
    const im = document.createElement('img'); im.src = src; im.alt = ''; im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
    c.appendChild(im); document.body.appendChild(c); return c;
  }
  function containRect(box, nw, nh, pad = 0) {
    box = { left: box.left + box.width * pad, top: box.top + box.height * pad, width: box.width * (1 - 2 * pad), height: box.height * (1 - 2 * pad) };
    if (!nw || !nh) return box;
    const r = nw / nh; let w = box.width, h = box.height;
    if (w / h > r) w = h * r; else h = w / r;
    return { left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, width: w, height: h };
  }
  const rectKF = (r, rad) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: rad });
  const padOf = () => (detailMedia.classList.contains('is-ilus') ? 0.09 : 0);
  function flipOpen(o) {
    detailLayer.classList.add('is-flip', 'is-open');
    const to = containRect(detailMedia.getBoundingClientRect(), o.naturalWidth, o.naturalHeight, padOf()), from = o.getBoundingClientRect(), rad = radiusOf(o);
    const clone = makeClone(from, o.currentSrc || o.src, rad), di = $('#detailImg');
    if (di) di.style.opacity = '0';
    o.style.visibility = 'hidden';
    clone.animate([rectKF(from, rad), rectKF(to, detailMedia.classList.contains('is-ilus') ? '50%' : '8px')], { duration: 540, easing: EASE_DRAWER, fill: 'forwards' }).onfinish = () => { if (di) di.style.opacity = ''; clone.remove(); o.style.visibility = ''; };
    detail.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    detailBody.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 120, easing: EASE_OUT, fill: 'backwards' });
  }
  function closeDetailNow(entry) {
    if (!ds) return;
    const st = ds; ds = null;
    const finish = () => { detailLayer.hidden = true; detailLayer.classList.remove('is-open', 'is-flip'); detailSheet.reset(); unlockScroll(); };
    restoreFocus(entry);
    if (isMobile()) { detailLayer.classList.remove('is-open'); const v = detailLayer._v || 0; detailLayer._v = 0; detailSheet.close(finish, v); return; }
    const o = st.origin, r = o && o.isConnected ? o.getBoundingClientRect() : null;
    const onScreen = r && r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    const di = $('#detailImg');
    if (onScreen && di && !reduce() && !detailMedia.classList.contains('has-half')) {
      const from = containRect(detailMedia.getBoundingClientRect(), di.naturalWidth, di.naturalHeight, padOf()), rad = radiusOf(o);
      const clone = makeClone(from, di.currentSrc || di.src, detailMedia.classList.contains('is-ilus') ? '50%' : '8px');
      di.style.opacity = '0'; o.style.visibility = 'hidden';
      detailLayer.classList.remove('is-open');
      detail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
      clone.animate([rectKF(from, detailMedia.classList.contains('is-ilus') ? '50%' : '8px'), rectKF(r, rad)], { duration: 420, easing: EASE_DRAWER, fill: 'forwards' }).onfinish = () => { o.style.visibility = ''; clone.remove(); detail.getAnimations().forEach(a => a.cancel()); finish(); };
    } else { detailLayer.classList.remove('is-flip', 'is-open'); setTimeout(finish, 260); }
  }
  detailLayer.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { requestClose(); return; }
    if (!ds) return;
    const step = e.target.closest('[data-step]');
    if (step) { ds.qtd = clamp(ds.qtd + Number(step.dataset.step), 1, 50); paintDetail(); return; }
    if (e.target.closest('[data-add]') && performance.now() - ds.at > 400) {
      const it = ITEMS.get(ds.id), obs = (detailBody.querySelector('textarea') || {}).value || '', qtd = ds.qtd;
      const sel = isPizza(it) ? { tam: ds.sel.tam, ...(ds.sel.sabor2 ? { sabor2: ds.sel.sabor2 } : {}), ...(ds.sel.borda ? { borda: ds.sel.borda } : {}) } : {};
      addToCart(it.id, { qtd, sel, obs });
      flyToBag($('#detailImg'));
      toast(`${qtd > 1 ? qtd + '× ' : ''}${it.nome} na sacola`);
      requestClose();
    }
  });
  detailLayer.addEventListener('change', e => {
    if (!ds) return;
    const n = e.target.name;
    if (n === 'tam') { ds.sel.tam = e.target.value; paintDetail(); }
    else if (n === 'borda') { ds.sel.borda = e.target.value; paintDetail(); }
    else if (n === 'sabor2') { ds.sel.sabor2 = e.target.value || null; paintDetail(); }
  });

  /* ============================================================ SACOLA (UI) */
  const cartLayer = $('#cartLayer'), cartEl = $('#cart'), cartBody = $('#cartBody'), cartFoot = $('#cartFoot');
  const cartSheet = createSheet(cartEl, cartLayer, { scroller: cartBody });
  cartLayer.isOpen = false;
  function selText(l) {
    const it = ITEMS.get(l.id), s = l.sel || {};
    if (!isPizza(it)) return [];
    const b = s.sabor2 && ITEMS.get(s.sabor2);
    return [s.tam, b ? `meia ${it.nome} / meia ${b.nome}` : '', s.borda || ''].filter(Boolean);
  }
  const lineName = l => { const it = ITEMS.get(l.id); return isPizza(it) ? `Pizza ${it.cat.id === 'pizzas-doces' ? 'doce ' : ''}${it.nome}` : (/^(esfihas|especiais|doces)$/.test(it.cat.id) ? `Esfiha ${it.nome.charAt(0).toLowerCase() + it.nome.slice(1)}` : it.nome); };
  const feeTxt = `R$ ${L.entrega.taxaMin} a R$ ${L.entrega.taxaMax}, pela distância`;
  const abaixoMinimo = () => cart.modo === 'Entrega' && cartSubtotal() < L.entrega.minimo;
  function renderCart() {
    if (!cartCount()) {
      cartBody.innerHTML = `<div class="cart-empty"><strong>Sacola vazia</strong><p>Monte uma caixa de esfihas ou toque no + de qualquer item.</p></div>`;
      cartFoot.innerHTML = '<button type="button" class="btn btn--red btn--block" data-close>Ver cardápio</button>';
      return;
    }
    cartBody.innerHTML = cart.linhas.map((l, i) => {
      const it = ITEMS.get(l.id), extra = [...selText(l), l.obs ? `“${l.obs}”` : ''].filter(Boolean).map(esc).join(' · ');
      return `<div class="cline" data-i="${i}">
        <div class="cline__img"><img src="${esc(it.img)}" alt="" loading="lazy"></div>
        <div><div class="cline__top"><span class="cline__name">${esc(lineName(l))}</span><span class="cline__price">${money(unitPrice(l) * l.qtd)}</span></div>
          ${extra ? `<p class="cline__extra">${extra}</p>` : ''}
          <div class="cline__row"><div class="stepper stepper--sm" role="group" aria-label="Quantidade de ${esc(it.nome)}"><button type="button" data-q="-1" aria-label="Diminuir">${MINUS}</button><output>${l.qtd}</output><button type="button" data-q="1" aria-label="Aumentar">${PLUS_S}</button></div>
          <button type="button" class="cline__rm" data-rm>Remover</button></div></div></div>`;
    }).join('');
    const sub = cartSubtotal();
    cartFoot.innerHTML = `
      <div class="seg" role="radiogroup" aria-label="Como você vai receber">
        ${L.modos.map(m => `<label><input type="radio" name="modo" value="${esc(m)}" ${cart.modo === m ? 'checked' : ''}><span>${esc(m === 'Consumo no local' ? 'Comer aqui' : m)}</span></label>`).join('')}
      </div>
      ${cart.modo === 'Entrega' ? `<label class="field"><span>Endereço</span><input name="endereco" value="${esc(cart.endereco)}" placeholder="Rua, número, bairro" autocomplete="street-address"></label>` : ''}
      <div class="duo">
        <label class="field"><span>Seu nome</span><input name="nome" value="${esc(cart.nome)}" placeholder="Como te chamamos?" autocomplete="given-name"></label>
        <label class="field"><span>Pagamento</span><select name="pagamento"><option value="">Escolha</option>${L.pagamentos.map(p => `<option ${p === cart.pagamento ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
      </div>
      ${cart.pagamento === 'Dinheiro' ? `<label class="field"><span>Troco para quanto?</span><input name="troco" inputmode="decimal" value="${esc(cart.troco)}" placeholder="Ex.: 100"></label>` : ''}
      ${abaixoMinimo() ? `<p class="warn">Pedido mínimo para entrega: ${money(L.entrega.minimo)}. Faltam ${money(L.entrega.minimo - sub)}.</p>` : ''}
      <div class="totals">
        <div><span>Subtotal</span><span>${money(sub)}</span></div>
        ${cart.modo === 'Entrega' ? `<div><span>Entrega</span><span>${feeTxt}</span></div>` : ''}
        <div><span>Total${cart.modo === 'Entrega' ? ' sem entrega' : ''}</span><span>${money(sub)}</span></div>
      </div>
      <a class="btn btn--wa btn--block" data-send href="${esc(waLink(mensagem()))}" target="_blank" rel="noopener">${WA} Enviar pedido no WhatsApp</a>
      <p class="alt-link">Prefere ligar? <a href="tel:${esc(L.telefoneLink)}">${esc(L.telefone)}</a></p>`;
  }
  function mensagem() {
    const linhas = cart.linhas.map(l => { const det = [...selText(l), l.obs ? `Obs: ${l.obs}` : ''].filter(Boolean); return `${l.qtd}x ${lineName(l)} — ${money(unitPrice(l) * l.qtd)}${det.length ? '\n   ' + det.join('\n   ') : ''}`; });
    const sub = cartSubtotal();
    const onde = cart.modo === 'Entrega' ? `Entrega: ${cart.endereco || '(endereço)'}` : cart.modo === 'Retirada' ? 'Vou retirar no balcão' : 'Vou comer no local';
    return [`*Pedido · ${L.nomeCompleto}*`, '', ...linhas, '', `Subtotal: ${money(sub)}`, cart.modo === 'Entrega' ? 'Taxa de entrega: a confirmar (pela distância)' : '', '', onde,
      cart.pagamento ? `Pagamento: ${cart.pagamento}${cart.troco && cart.pagamento === 'Dinheiro' ? ` (troco para R$ ${cart.troco})` : ''}` : '', cart.nome ? `Nome: ${cart.nome}` : '']
      .filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n').trim();
  }
  function openCart() {
    if (cartLayer.isOpen) return;
    $('#toast').classList.remove('is-visible');
    renderCart(); cartLayer.isOpen = true; cartLayer.openedAt = performance.now();
    cartLayer.hidden = false; lockScroll(); pushLayer({ el: cartEl, close: closeCartNow });
    if (isMobile()) { cartLayer.classList.add('is-open'); cartSheet.open(); } else { cartEl.offsetWidth; cartLayer.classList.add('is-open'); }
    requestAnimationFrame(() => cartEl.focus({ preventScroll: true }));
  }
  function closeCartNow(entry) {
    if (!cartLayer.isOpen) return;
    cartLayer.isOpen = false;
    const finish = () => { cartLayer.hidden = true; cartSheet.reset(); unlockScroll(); };
    cartLayer.classList.remove('is-open');
    if (isMobile()) { const v = cartLayer._v || 0; cartLayer._v = 0; cartSheet.close(finish, v); } else setTimeout(finish, reduce() ? 200 : 460);
    restoreFocus(entry);
  }
  const refreshSend = () => { const a = cartFoot.querySelector('[data-send]'); if (a) a.href = waLink(mensagem()); };
  cartLayer.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { requestClose(); return; }
    const line = e.target.closest('.cline');
    if (line) {
      const i = +line.dataset.i, q = e.target.closest('[data-q]');
      if (q) { cart.linhas[i].qtd += Number(q.dataset.q); if (cart.linhas[i].qtd <= 0) cart.linhas.splice(i, 1); saveCart(); paintBadges(); renderCart(); return; }
      if (e.target.closest('[data-rm]')) { cart.linhas.splice(i, 1); saveCart(); paintBadges(); renderCart(); return; }
    }
    const send = e.target.closest('[data-send]');
    if (send) {
      if (performance.now() - cartLayer.openedAt < 500) { e.preventDefault(); return; }
      if (abaixoMinimo()) { e.preventDefault(); toast(`Pedido mínimo para entrega: ${money(L.entrega.minimo)}`); return; }
      if (cart.modo === 'Entrega' && !cart.endereco.trim()) { e.preventDefault(); const f = cartFoot.querySelector('input[name="endereco"]'); f && f.focus(); toast('Informe o endereço de entrega'); return; }
      send.href = waLink(mensagem());
    }
  });
  cartLayer.addEventListener('input', e => { const n = e.target.name; if (['nome', 'endereco', 'troco'].includes(n)) { cart[n] = e.target.value; saveCart(); refreshSend(); } });
  cartLayer.addEventListener('change', e => {
    const n = e.target.name;
    if (n === 'modo') cart.modo = e.target.value; else if (n === 'pagamento') cart.pagamento = e.target.value; else return;
    saveCart(); renderCart();
    const f = cartFoot.querySelector(`[name="${n}"]${n === 'modo' ? `[value="${cart.modo}"]` : ''}`); f && f.focus();
  });
  $('#bagBtn').addEventListener('click', openCart);
  $('#cartbar').addEventListener('click', openCart);

  /* ===================================================== A CASA (faixa de fotos) */
  function buildReel() {
    const F = L.fotos;
    const fotos = [[F.salao, 'Salão', 'jul. 2026'], [F.perto, 'Esfihas abertas', 'abr. 2024'], [F.pizza, 'Pizza', 'abr. 2024'], [F.mesa, 'Mesa de esfihas', 'abr. 2024'],
      [F.carne, 'Esfihas de carne', 'jul. 2026'], [F.docesCaixa, 'Esfihas doces', 'abr. 2024'], [F.fachada, 'Fachada', 'mar. 2026'], [F.morango, 'Esfihas doces', 'abr. 2024']];
    const g = `<div class="reel__track-group" style="display:flex;gap:18px;padding-right:18px">${fotos.map(([src, cap, quando]) => `<figure class="reel__card"><img src="${esc(src)}" alt="${esc(cap)}" loading="lazy" decoding="async" draggable="false"><figcaption>${esc(cap)} · ${esc(quando)}</figcaption></figure>`).join('')}</div>`;
    const reel = $('#reel');
    reel.innerHTML = '<div class="reel__track"></div>';
    const track = reel.firstElementChild;
    track.dataset.pause = '1';
    marquee(track, g, { speed: 36, dir: 1, copies: 2 });
  }

  /* ========================================================= ONDE ESTAMOS */
  function buildWhere() {
    $('#whereCta').innerHTML = `
      <a class="btn btn--light btn--sm" href="${esc(L.mapa)}" target="_blank" rel="noopener">Como chegar</a>
      <a class="btn btn--wa btn--sm" href="${esc(waLink('Olá! Vim pelo site do Ponto da Esfiha Faria Lima.'))}" target="_blank" rel="noopener">${WA} WhatsApp</a>
      <a class="btn btn--ghost btn--sm" href="tel:${esc(L.telefoneLink)}">Ligar ${esc(L.telefone)}</a>
      <a class="btn btn--ghost btn--sm" href="${esc(L.facebook)}" target="_blank" rel="noopener">Facebook</a>`;
    const e = L.entrega;
    $('#delivery').innerHTML = [`Chega em <b>${esc(e.tempo)}</b>`, `Taxa de <b>R$ ${e.taxaMin} a R$ ${e.taxaMax}</b>`, `Pedido mínimo <b>${money(e.minimo)}</b>`, 'Retirada no balcão', 'Consumo no salão'].map(s => `<li>${s}</li>`).join('');
    $('#payments').innerHTML = L.pagamentos.map(p => `<li>${esc(p)}</li>`).join('');
    const frame = $('#mapFrame');
    new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { frame.src = L.mapaEmbed; ob.disconnect(); } }, { rootMargin: '400px' }).observe(frame);
  }

  /* ====================================================== GALERIA INFINITA */
  const ex = { el: $('#explore'), world: $('#exploreWorld'), cursor: $('#exploreCursor'), tiles: [], key: '', raf: 0, last: 0, open: false, camX: 0, camY: 0, vx: 0, vy: 0, drag: null, lastI: 0, colW: 0, gap: 0, totalW: 0, maxH: 0, focus: null, px: -200, py: -200, cx: -200, cy: -200 };
  function exBuild() {
    const vw = innerWidth, vh = innerHeight, mobile = vw < 768;
    const colW = Math.round(mobile ? clamp(vw * 0.42, 140, 190) : clamp(vw / 5.6, 210, 290)), gap = mobile ? 14 : 24;
    const cols = Math.ceil(vw / (colW + gap)) + 2, ratios = [1, 1.25, 1, 0.8, 1.3, 1];
    const base = shuffled(ALL, 31), perCol = Math.ceil((vh + colW * 2.6) / (colW * 1.06 + gap)) + 1;
    let list = []; while (list.length < cols * perCol) list = list.concat(base);
    const seen = new Set(), colsY = Array.from({ length: cols }, (_, c) => (c % 2 ? colW * 0.5 : 0)), tiles = [];
    let html = '';
    list.forEach((it, i) => {
      const c = i % cols, row = Math.floor(i / cols), ratio = it.ilus ? 1 : ratios[(row * 2 + c) % ratios.length], h = Math.round(colW * ratio);
      const first = !seen.has(it.id); seen.add(it.id);
      tiles.push({ c, x0: c * (colW + gap), y0: colsY[c], h, par: 1 + ((c % 3) - 1) * 0.07 });
      colsY[c] += h + gap;
      html += `<button type="button" class="ex-tile${ratio === 1 ? '' : ' sq'}" data-id="${it.id}" style="width:${colW}px;height:${h}px" ${first ? `aria-label="${esc(it.nome)}, ${money(it.preco)}"` : 'tabindex="-1" aria-hidden="true"'}>${imgTag(it.img, '')}<figcaption><b>${esc(it.nome)}</b><span>${isPizza(it) ? 'a partir de ' : ''}${money(it.preco)}</span></figcaption></button>`;
    });
    ex.world.innerHTML = html;
    const els = ex.world.children;
    tiles.forEach((t, i) => { t.el = els[i]; t.colH = colsY[t.c]; });
    Object.assign(ex, { tiles, colW, gap, totalW: cols * (colW + gap), maxH: Math.round(colW * 1.3), key: `${vw}x${vh}` });
    markLoaded(ex.world);
  }
  function exRender() {
    const vw = innerWidth, vh = innerHeight, step = ex.colW + ex.gap;
    for (const t of ex.tiles) {
      const x = mod(t.x0 + ex.camX, ex.totalW) - step, y = mod(t.y0 + ex.camY * t.par, t.colH) - ex.maxH - ex.gap;
      t.sx = x; t.sy = y;
      const s = reduce() ? 1 : 1 - Math.min(1, Math.hypot((x + ex.colW / 2 - vw / 2) / vw, (y + t.h / 2 - vh / 2) / vh) * 1.1) * 0.16;
      t.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    }
  }
  function exFrame(now) {
    const dt = Math.min(0.05, (now - ex.last) / 1000); ex.last = now;
    if (ds) { ex.raf = requestAnimationFrame(exFrame); return; }
    if (!ex.drag) {
      if (ex.focus) { ex.camX += (ex.focus.x - ex.camX) * Math.min(1, dt * 7); ex.camY += (ex.focus.y - ex.camY) * Math.min(1, dt * 7); if (Math.abs(ex.focus.x - ex.camX) < 0.5 && Math.abs(ex.focus.y - ex.camY) < 0.5) ex.focus = null; }
      else if (!reduce()) {
        if (now - ex.lastI > 1800) { ex.vx += (-22 - ex.vx) * Math.min(1, dt * 0.9); ex.vy += (-14 - ex.vy) * Math.min(1, dt * 0.9); }
        else { const f = Math.exp(-dt * 3.4); ex.vx *= f; ex.vy *= f; }
        ex.camX += ex.vx * dt; ex.camY += ex.vy * dt;
      }
    }
    exRender();
    ex.cx += (ex.px - ex.cx) * Math.min(1, dt * 20); ex.cy += (ex.py - ex.cy) * Math.min(1, dt * 20);
    ex.cursor.style.transform = `translate3d(${ex.cx}px,${ex.cy}px,0)`;
    ex.raf = requestAnimationFrame(exFrame);
  }
  function exOpen() {
    if (ex.open) return;
    if (ex.key !== `${innerWidth}x${innerHeight}`) exBuild();
    ex.open = true; ex.el.hidden = false; lockScroll(); pushLayer({ el: ex.el, close: exCloseNow });
    ex.lastI = ex.last = performance.now(); exRender(); ex.el.offsetWidth; ex.el.classList.add('is-open');
    if (!reduce()) {
      const vw = innerWidth, vh = innerHeight;
      ex.tiles.forEach(t => { if (t.sx > vw || t.sx + ex.colW < 0 || t.sy > vh || t.sy + t.h < 0) return; const d = Math.hypot(t.sx + ex.colW / 2 - vw / 2, t.sy + t.h / 2 - vh / 2) / Math.hypot(vw / 2, vh / 2); t.el.firstElementChild.animate([{ opacity: 0, transform: 'scale(1.2) rotate(-25deg)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 80 + d * 380, easing: EASE_OUT, fill: 'backwards' }); });
    }
    ex.raf = requestAnimationFrame(exFrame);
    requestAnimationFrame(() => $('#exploreClose').focus({ preventScroll: true }));
  }
  function exCloseNow(entry) {
    if (!ex.open) return;
    ex.open = false; restoreFocus(entry);
    ex.el.classList.remove('is-open'); ex.cursor.classList.remove('is-visible');
    setTimeout(() => { ex.el.hidden = true; cancelAnimationFrame(ex.raf); unlockScroll(); }, 300);
  }
  function exBind() {
    $$('[data-open-explore]').forEach(b => b.addEventListener('click', exOpen));
    $('#exploreClose').addEventListener('click', requestClose);
    const el = ex.el;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('.explore__ui')) return;
      ex.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, s: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }] };
      ex.vx = ex.vy = 0; ex.focus = null; ex.lastI = performance.now();
      try { el.setPointerCapture(e.pointerId); } catch { /* ok */ }
      ex.cursor.classList.add('is-down');
    });
    el.addEventListener('pointermove', e => {
      ex.px = e.clientX; ex.py = e.clientY;
      if (e.pointerType === 'mouse') { ex.cursor.classList.toggle('is-visible', !e.target.closest('.explore__ui')); if (!ex.drag) ex.cursor.textContent = e.target.closest('.ex-tile') ? 'Ver item' : 'Arraste'; }
      const d = ex.drag; if (!d || d.id !== e.pointerId) return;
      ex.camX += e.clientX - d.x; ex.camY += e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) { d.moved = true; ex.cursor.textContent = 'Arraste'; }
      d.s.push({ t: e.timeStamp, x: e.clientX, y: e.clientY }); if (d.s.length > 8) d.s.shift();
      ex.lastI = performance.now();
    });
    const up = e => {
      const d = ex.drag; if (!d || d.id !== e.pointerId) return;
      ex.drag = null; ex.cursor.classList.remove('is-down'); ex.lastI = performance.now();
      if (!d.moved && e.type === 'pointerup') { const hit = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.classList && n.classList.contains('ex-tile')); if (hit) openDetail(hit.dataset.id, hit.querySelector('img')); return; }
      if (!reduce()) { ex.vx = clamp(velocityFrom(d.s, 'x'), -3200, 3200); ex.vy = clamp(velocityFrom(d.s, 'y'), -3200, 3200); }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') ex.cursor.classList.remove('is-visible'); });
    el.addEventListener('wheel', e => { e.preventDefault(); const k = e.deltaMode === 1 ? 16 : 1; ex.camX -= (e.shiftKey ? e.deltaY : e.deltaX) * k; ex.camY -= (e.shiftKey ? 0 : e.deltaY) * k; ex.vx = ex.vy = 0; ex.focus = null; ex.lastI = performance.now(); }, { passive: false });
    el.addEventListener('keydown', e => {
      const m = { ArrowLeft: [700, 0], ArrowRight: [-700, 0], ArrowUp: [0, 700], ArrowDown: [0, -700] }[e.key];
      if (m) { e.preventDefault(); ex.vx += m[0]; ex.vy += m[1]; ex.lastI = performance.now(); }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('ex-tile')) { e.preventDefault(); openDetail(e.target.dataset.id, e.target.querySelector('img')); }
    });
    el.addEventListener('focusin', e => {
      const tEl = e.target.closest('.ex-tile'); if (!tEl) return;
      const t = ex.tiles.find(x => x.el === tEl); if (!t) return;
      ex.focus = { x: ex.camX + innerWidth / 2 - (t.sx + ex.colW / 2), y: ex.camY + (innerHeight / 2 - (t.sy + t.h / 2)) / t.par };
      ex.vx = ex.vy = 0; ex.lastI = performance.now();
    });
    addEventListener('resize', () => { if (ex.open && ex.key !== `${innerWidth}x${innerHeight}`) { exBuild(); exRender(); } else if (!ex.open) ex.key = ''; });
  }

  /* ================================================================ início */
  buildOrbit();
  buildBands();
  buildBox();
  buildFavs();
  buildMenu();
  buildReel();
  buildWhere();
  bindTabs();
  bindScroll();
  exBind();
  paintBadges();
  setActiveTab(CATS[0].id, false);
  runLoader();
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
  if (location.hash === '#galeria') setTimeout(exOpen, 600);
})();
