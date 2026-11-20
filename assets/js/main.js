/* =========================================================================
   Portfolio interactions — "data-print" edition
   Fungsi lama dipertahankan: toggleMenu(), openModal(), closeModal(), typing.
   Animasi khas:
     · Preloader counter 000→100 + tirai
     · Text scramble (efek "decoding" data) pada nama & menu
     · Foto halftone (canvas) + lensa yang memperlihatkan foto asli
     · Ticker keahlian yang bereaksi terhadap kecepatan & arah scroll
     · Quote yang "menyala" kata per kata mengikuti scroll
     · Garis timeline yang tergambar mengikuti scroll
     · Tirai warna pada gambar proyek, drawer modal, cursor blend
     · Pergantian tema dengan reveal melingkar (View Transitions API)
   Semua animasi menghormati prefers-reduced-motion.
   ========================================================================= */

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- Text scramble ---------- */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>_*+=';
function scramble(el, duration = 900) {
    if (reduceMotion) return;
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    const start = performance.now();
    cancelAnimationFrame(el._raf);
    const frame = (now) => {
        const p = clamp((now - start) / duration, 0, 1);
        const settled = Math.floor(p * final.length);
        let out = '';
        for (let i = 0; i < final.length; i++) {
            const c = final[i];
            out += i < settled || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
        if (p < 1) el._raf = requestAnimationFrame(frame);
        else el.textContent = final;
    };
    el._raf = requestAnimationFrame(frame);
}

/* ---------- Preloader ---------- */
(function preloader() {
    const el = document.getElementById('preloader');
    const count = document.getElementById('plCount');
    const bar = document.getElementById('plBar');
    let loaded = document.readyState === 'complete';
    window.addEventListener('load', () => { loaded = true; });

    const done = () => {
        if (el) el.classList.add('done');
        root.classList.add('loaded');
        startTyping();
        // Nama "di-decode" setelah teks naik
        setTimeout(() => document.querySelectorAll('.hero [data-scramble]').forEach((n, i) =>
            setTimeout(() => scramble(n, 1100), i * 180)), 350);
    };
    if (reduceMotion || !el) { done(); return; }

    const t0 = performance.now();
    const MIN = 1100, MAX = 3000;
    const tick = (now) => {
        const elapsed = now - t0;
        // Progres bergerak ke 90% sendiri, sisanya menunggu event load
        let p = Math.min(elapsed / MIN, 1) * (loaded ? 1 : 0.9);
        if (elapsed > MAX) p = 1;
        const shown = Math.round(p * 100);
        count.textContent = String(shown).padStart(3, '0');
        bar.style.transform = `scaleX(${p})`;
        if (p >= 1) setTimeout(done, 200);
        else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
})();

/* ---------- Tema (reveal melingkar dari tombol) ---------- */
(function themeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        const apply = () => {
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (err) { /* abaikan */ }
            window.dispatchEvent(new Event('themechange'));
        };
        if (!document.startViewTransition || reduceMotion) { apply(); return; }
        const r = btn.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        document.startViewTransition(apply).ready.then(() => {
            root.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
                { duration: 700, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', pseudoElement: '::view-transition-new(root)' }
            );
        });
    });
})();

/* ---------- Menu mobile (nama fungsi dipertahankan) ---------- */
function toggleMenu(force) {
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('menuBtn');
    const btn = icon.closest('button');
    const open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    root.classList.toggle('menu-open', open);
    document.getElementById('nav').classList.remove('hide'); // tombol tutup harus selalu terlihat
    document.body.classList.toggle('no-scroll', open);
    icon.classList.toggle('fa-xmark', open);
    icon.classList.toggle('fa-bars-staggered', !open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
}

/* ---------- Modal proyek (drawer) ---------- */
let lastFocused = null;

function openModal(projectId) {
    const tpl = document.getElementById(projectId + '-data');
    if (!tpl) return;
    const data = tpl.content || tpl;

    document.getElementById('m-title').textContent = data.querySelector('.modal-title').textContent.trim();
    document.getElementById('m-tech').textContent = data.querySelector('.modal-tech').textContent.trim();
    document.getElementById('m-desc').innerHTML = data.querySelector('.modal-desc').innerHTML;
    const img = document.getElementById('m-img');
    img.src = data.querySelector('.modal-image').textContent.trim();
    img.alt = document.getElementById('m-title').textContent;

    const modal = document.getElementById('projectModal');
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('.modal-scroll').scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('visible')));
    document.body.classList.add('no-scroll');
    setTimeout(() => modal.querySelector('.modal-close').focus({ preventScroll: true }), 60);
}

function closeModal() {
    const modal = document.getElementById('projectModal');
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
        modal.classList.remove('open');
        document.getElementById('m-desc').innerHTML = ''; // hentikan video
        document.body.classList.remove('no-scroll');
        if (lastFocused) lastFocused.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 700);
}

document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('projectModal');
    if (e.key === 'Escape') {
        if (modal.classList.contains('open')) closeModal();
        else if (document.getElementById('mobileMenu').classList.contains('open')) toggleMenu(false);
    }
    if (e.key === 'Tab' && modal.classList.contains('open')) {
        const f = modal.querySelectorAll('a[href], button, video[controls]');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
});

/* ---------- Efek mengetik (Typewriter) ---------- */
const textArray = ['Data Engineer', 'System Analyst', 'Database Specialist', 'Tech Innovator'];
let typingStarted = false;

function startTyping() {
    const span = document.getElementById('typed-text');
    if (!span || typingStarted) return;
    typingStarted = true;
    let idx = 0, char = 0;
    if (reduceMotion) {
        span.textContent = textArray[0];
        setInterval(() => { idx = (idx + 1) % textArray.length; span.textContent = textArray[idx]; }, 3000);
        return;
    }
    const type = () => {
        if (char < textArray[idx].length) {
            span.textContent += textArray[idx].charAt(char++);
            setTimeout(type, 70);
        } else setTimeout(erase, 2400);
    };
    const erase = () => {
        if (char > 0) { span.textContent = textArray[idx].substring(0, --char); setTimeout(erase, 35); }
        else { idx = (idx + 1) % textArray.length; setTimeout(type, 500); }
    };
    setTimeout(type, 700);
}

/* ---------- Scramble saat hover menu ---------- */
document.querySelectorAll('[data-scramble-hover]').forEach((el) => {
    el.addEventListener('mouseenter', () => scramble(el, 450));
});

/* ---------- Scroll reveal ---------- */
(function reveal() {
    document.querySelectorAll('[data-stagger]').forEach((g) => {
        [...g.querySelectorAll(':scope > [data-reveal]')].forEach((el, i) => el.style.setProperty('--i', i % 6));
    });
    const items = document.querySelectorAll('[data-reveal], [data-reveal-group]');
    if (reduceMotion || !('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            io.unobserve(e.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach((el) => io.observe(el));
})();

/* ---------- Counter IPK + bar ---------- */
(function counters() {
    const els = document.querySelectorAll('[data-count]');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const run = (el) => {
        const target = parseFloat(el.dataset.count);
        const dec = parseInt(el.dataset.decimals || '0', 10);
        const bar = el.parentElement.querySelector('.gpa-bar i');
        if (bar) bar.style.setProperty('--p', 1);
        const t0 = performance.now(), dur = 1800;
        const tick = (now) => {
            const p = Math.min(1, (now - t0) / dur);
            el.textContent = (target * (1 - Math.pow(1 - p, 4))).toFixed(dec);
            if (p < 1) requestAnimationFrame(tick); else el.textContent = target.toFixed(dec);
        };
        requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => {
        el.textContent = (0).toFixed(parseInt(el.dataset.decimals || '0', 10));
        const bar = el.parentElement.querySelector('.gpa-bar i');
        if (bar) bar.style.setProperty('--p', 0);
        io.observe(el);
    });
})();

/* ---------- Quote: pecah per kata (teks tetap sama) ---------- */
const quoteWords = (function splitQuote() {
    const p = document.getElementById('quoteText');
    if (!p || reduceMotion) return null;
    const words = p.textContent.trim().split(/\s+/);
    p.setAttribute('aria-label', words.join(' '));
    p.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    return { p, spans: [...p.querySelectorAll('.w')] };
})();

/* ---------- Ticker keahlian ---------- */
const ticker = (function setupTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return null;
    const group = track.querySelector('.ticker-group');
    for (let i = 0; i < 2; i++) track.appendChild(group.cloneNode(true));
    return { track, group, x: 0, dir: -1, boost: 0 };
})();

/* ---------- Loop scroll terpadu (rAF) ---------- */
(function scrollLoop() {
    const bar = document.getElementById('scrollProgress');
    const nav = document.getElementById('nav');
    const btt = document.getElementById('backToTop');
    const ring = document.getElementById('backToTopRing');
    const timelines = [...document.querySelectorAll('[data-timeline]')];
    let lastY = window.scrollY;
    let dirty = true;

    window.addEventListener('scroll', () => { dirty = true; }, { passive: true });
    window.addEventListener('resize', () => { dirty = true; });

    const onScroll = (y) => {
        const vh = window.innerHeight;
        const max = document.documentElement.scrollHeight - vh;
        const p = max > 0 ? y / max : 0;
        bar.style.transform = `scaleX(${p})`;
        ring.style.strokeDashoffset = String(100 - p * 100);
        nav.classList.toggle('scrolled', y > 20);
        btt.classList.toggle('show', y > 600);

        // Timeline tergambar sampai garis 60% viewport
        timelines.forEach((tl) => {
            const r = tl.getBoundingClientRect();
            const prog = reduceMotion ? 1 : clamp((vh * 0.6 - r.top) / r.height, 0, 1);
            tl.style.setProperty('--draw', prog);
            tl.querySelectorAll('.t-item').forEach((it) => {
                const d = it.querySelector('.dot').getBoundingClientRect();
                it.classList.toggle('passed', d.top < vh * 0.6 || reduceMotion);
            });
        });

        // Quote menyala kata per kata
        if (quoteWords) {
            const r = quoteWords.p.getBoundingClientRect();
            const prog = clamp((vh * 0.85 - r.top) / (vh * 0.5), 0, 1);
            const lit = Math.round(prog * quoteWords.spans.length);
            quoteWords.spans.forEach((s, i) => s.classList.toggle('lit', i < lit));
        }
    };

    const frame = () => {
        const y = window.scrollY;
        const dy = y - lastY;
        lastY = y;

        if (dirty) {
            onScroll(y);
            // Sembunyikan navbar saat scroll turun, tampilkan saat naik
            if (Math.abs(dy) > 4 && !root.classList.contains('menu-open')) nav.classList.toggle('hide', dy > 0 && y > 400);
            dirty = false;
        }

        // Ticker: kecepatan dasar + dorongan dari kecepatan scroll, arah ikut scroll
        if (ticker && !reduceMotion) {
            if (dy !== 0) ticker.dir = dy > 0 ? -1 : 1;
            ticker.boost += (Math.min(Math.abs(dy), 80) - ticker.boost) * 0.1;
            ticker.x += ticker.dir * (0.6 + ticker.boost * 0.35);
            const w = ticker.group.offsetWidth;
            if (w) {
                if (ticker.x <= -w) ticker.x += w;
                if (ticker.x > 0) ticker.x -= w;
            }
            ticker.track.style.transform = `translate3d(${ticker.x}px,0,0) skewX(${clamp(-dy * 0.15, -8, 8)}deg)`;
        }
        requestAnimationFrame(frame);
    };
    onScroll(lastY);
    requestAnimationFrame(frame);
})();

/* ---------- Menu aktif ---------- */
(function activeNav() {
    const links = document.querySelectorAll('.nav-link, .mobile-menu a');
    const sections = ['home', 'about', 'experience', 'certifications', 'projects', 'contact']
        .map((id) => document.getElementById(id)).filter(Boolean);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            links.forEach((l) => {
                const on = l.getAttribute('href') === '#' + e.target.id;
                l.classList.toggle('active', on);
                if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
})();

/* ---------- Foto halftone + lensa ---------- */
(function halftone() {
    const wrap = document.getElementById('portrait');
    const canvas = document.getElementById('halftone');
    const img = wrap && wrap.querySelector('.photo');
    if (!wrap || !canvas || !img || reduceMotion) { if (canvas) canvas.remove(); return; }
    const ctx = canvas.getContext('2d');
    let samples = null, cols = 0, rows = 0, cell = 0, W = 0, H = 0, introStart = 0;

    // Ambil sampel kecerahan dari foto (latar merah dianggap kosong)
    const sample = () => {
        const rect = wrap.getBoundingClientRect();
        W = rect.width; H = rect.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cell = W < 360 ? 6 : 7;
        cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
        const off = document.createElement('canvas');
        off.width = cols; off.height = rows;
        const o = off.getContext('2d');
        // object-fit: cover + object-position: top
        const s = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        o.drawImage(img, (cols - dw) / 2, 0, dw, dh);
        const d = o.getImageData(0, 0, cols, rows).data; // throws jika canvas "tainted" (file://)
        samples = new Float32Array(cols * rows);
        for (let i = 0; i < cols * rows; i++) {
            const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
            const redBg = r - Math.max(g, b) > 110;
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            // simpan luminance; -1 = latar (tidak digambar)
            samples[i] = redBg ? -1 : lum;
        }
    };

    const draw = (now) => {
        const t = introStart ? clamp((now - introStart) / 1400, 0, 1) : 1;
        const color = getComputedStyle(root).getPropertyValue('--halftone').trim() || '#141312';
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = color;
        const maxR = cell * 0.62;
        const dark = root.getAttribute('data-theme') === 'dark';
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const lum = samples[y * cols + x];
                if (lum < 0) continue;
                // Tinta gelap di kertas terang: titik besar = area gelap.
                // Tinta terang di latar gelap: titik besar = area terang.
                const v = dark ? clamp(lum * 1.2 + 0.12, 0, 1) : clamp((1 - lum) * 1.35 + 0.1, 0, 1);
                // gelombang diagonal saat intro
                const local = clamp(t * 1.8 - (x / cols + y / rows) * 0.4, 0, 1);
                const r = v * maxR * local;
                if (r < 0.3) continue;
                ctx.beginPath();
                ctx.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (t < 1) requestAnimationFrame(draw);
    };

    const init = () => {
        try { sample(); } catch (err) { canvas.remove(); return; } // fallback: foto biasa
        wrap.classList.add('halftone-ready');
        introStart = performance.now() + 900;
        requestAnimationFrame(function wait(now) { if (now < introStart) requestAnimationFrame(wait); else draw(now); });
        startLens();
    };

    // Lensa: ikuti kursor; saat idle mengembara pelan di sekitar wajah
    function startLens() {
        let hover = false, tx = 0.5, ty = 0.36, cx = 0.5, cy = 0.36, rad = 0, trad = 72;
        wrap.addEventListener('pointerenter', () => { hover = true; trad = 110; });
        wrap.addEventListener('pointerleave', () => { hover = false; trad = 72; });
        wrap.addEventListener('pointermove', (e) => {
            const r = wrap.getBoundingClientRect();
            tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
        });
        const t0 = performance.now();
        (function loop(now) {
            if (!hover) {
                const t = (now - t0) / 1000;
                tx = 0.5 + Math.sin(t * 0.55) * 0.22;
                ty = 0.38 + Math.sin(t * 0.8 + 1) * 0.14;
            }
            cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12; rad += (trad - rad) * 0.08;
            wrap.style.setProperty('--mx', `${cx * 100}%`);
            wrap.style.setProperty('--my', `${cy * 100}%`);
            wrap.style.setProperty('--lens', `${rad}px`);
            requestAnimationFrame(loop);
        })(performance.now());
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (samples) { try { sample(); draw(performance.now()); } catch (e) { } } }, 200);
    });
    window.addEventListener('themechange', () => { if (samples) draw(performance.now()); });
    if (img.complete && img.naturalWidth) init(); else img.addEventListener('load', init);
})();

/* ---------- Efek pointer (desktop saja) ---------- */
if (finePointer && !reduceMotion) {
    (function cursor() {
        const c = document.querySelector('.cursor');
        if (!c) return;
        document.body.classList.add('has-cursor');
        let mx = -100, my = -100, x = -100, y = -100;
        window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; c.classList.remove('is-hidden'); }, { passive: true });
        document.addEventListener('pointerleave', () => c.classList.add('is-hidden'));
        (function loop() {
            x += (mx - x) * 0.22; y += (my - y) * 0.22;
            c.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            requestAnimationFrame(loop);
        })();
        document.addEventListener('pointerover', (e) => {
            const view = e.target.closest('[data-view]');
            c.classList.toggle('is-view', !!view);
            c.classList.toggle('is-link', !view && !!e.target.closest('a, button, .skill'));
        });
    })();

    document.querySelectorAll('.magnetic').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
}
