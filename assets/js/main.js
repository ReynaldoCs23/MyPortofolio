/* =========================================================================
   Portfolio interactions
   - Fungsi lama tetap ada: toggleMenu(), openModal(), closeModal(), typing effect
   - Animasi: preloader, scroll reveal (stagger), counter, scroll progress,
     navbar aktif, custom cursor, magnetic button, 3D tilt + spotlight, parallax blob
   - Semua animasi menghormati prefers-reduced-motion
   ========================================================================= */

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Preloader ---------- */
(function preloader() {
    const el = document.getElementById('preloader');
    const start = performance.now();
    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        // tampil minimal ±900ms agar terasa elegan, tidak berkedip
        const wait = reduceMotion ? 0 : Math.max(0, 900 - (performance.now() - start));
        setTimeout(() => {
            if (el) el.classList.add('done');
            root.classList.add('loaded');
            startTyping();
        }, wait);
    };
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish);
    setTimeout(finish, 2500); // pengaman jika ada aset lambat
})();

/* ---------- Tema terang / gelap ---------- */
(function themeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) { /* storage tidak tersedia */ }
    });
})();

/* ---------- Menu mobile (nama fungsi dipertahankan) ---------- */
function toggleMenu(force) {
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('menuBtn');
    const btn = icon.closest('button');
    const open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    icon.classList.toggle('fa-xmark', open);
    icon.classList.toggle('fa-bars-staggered', !open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    document.getElementById('nav').classList.toggle('scrolled', open || window.scrollY > 20);
}

/* ---------- Modal proyek ---------- */
let lastFocused = null;

function openModal(projectId) {
    const tpl = document.getElementById(projectId + '-data');
    if (!tpl) return;
    const data = tpl.content || tpl; // <template> atau fallback div

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
    setTimeout(() => modal.querySelector('.modal-close').focus({ preventScroll: true }), 50);
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
    }, reduceMotion ? 0 : 380);
}

document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('projectModal');
    if (e.key === 'Escape') {
        if (modal.classList.contains('open')) closeModal();
        else if (document.getElementById('mobileMenu').classList.contains('open')) toggleMenu(false);
    }
    // Focus trap sederhana di dalam modal
    if (e.key === 'Tab' && modal.classList.contains('open')) {
        const f = modal.querySelectorAll('a[href], button, video[controls], [tabindex]:not([tabindex="-1"])');
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
        // Tanpa animasi ketik: ganti kata secara langsung
        span.textContent = textArray[0];
        setInterval(() => { idx = (idx + 1) % textArray.length; span.textContent = textArray[idx]; }, 3000);
        return;
    }
    const type = () => {
        if (char < textArray[idx].length) {
            span.textContent += textArray[idx].charAt(char++);
            setTimeout(type, 80);
        } else setTimeout(erase, 2500);
    };
    const erase = () => {
        if (char > 0) {
            span.textContent = textArray[idx].substring(0, --char);
            setTimeout(erase, 40);
        } else {
            idx = (idx + 1) % textArray.length;
            setTimeout(type, 600);
        }
    };
    setTimeout(type, 500);
}

/* ---------- Scroll reveal + stagger ---------- */
(function reveal() {
    // Index stagger untuk anak-anak dalam [data-stagger]
    document.querySelectorAll('[data-stagger]').forEach((group) => {
        [...group.querySelectorAll(':scope > [data-reveal]')].forEach((el, i) => el.style.setProperty('--i', i));
    });
    const items = document.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('in'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
})();

/* ---------- Counter angka (IPK) ---------- */
(function counters() {
    const els = document.querySelectorAll('[data-count]');
    if (reduceMotion || !('IntersectionObserver' in window)) return; // angka final sudah di HTML
    const run = (el) => {
        const target = parseFloat(el.dataset.count);
        const dec = parseInt(el.dataset.decimals || '0', 10);
        const dur = 1600;
        const t0 = performance.now();
        const tick = (now) => {
            const p = Math.min(1, (now - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = (target * eased).toFixed(dec);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target.toFixed(dec);
        };
        requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => { el.textContent = (0).toFixed(parseInt(el.dataset.decimals || '0', 10)); io.observe(el); });
})();

/* ---------- Scroll: progress bar, navbar, back-to-top (rAF-throttled) ---------- */
(function onScroll() {
    const bar = document.getElementById('scrollProgress');
    const nav = document.getElementById('nav');
    const btt = document.getElementById('backToTop');
    const ring = document.getElementById('backToTopRing');
    const menu = document.getElementById('mobileMenu');
    let ticking = false;

    const update = () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? y / max : 0;
        bar.style.transform = `scaleX(${p})`;
        ring.style.strokeDashoffset = String(100 - p * 100);
        nav.classList.toggle('scrolled', y > 20 || menu.classList.contains('open'));
        btt.classList.toggle('show', y > 500);
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

/* ---------- Highlight menu aktif ---------- */
(function activeNav() {
    const links = document.querySelectorAll('.nav-link, .mobile-menu a');
    const ids = ['home', 'about', 'experience', 'certifications', 'projects', 'contact'];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const setActive = (id) => {
        links.forEach((l) => {
            const on = l.getAttribute('href') === '#' + id;
            l.classList.toggle('active', on);
            if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
        });
    };
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
})();

/* ---------- Efek pointer (desktop saja) ---------- */
if (finePointer && !reduceMotion) {
    /* Custom cursor: titik + cincin dengan easing */
    (function cursor() {
        const dot = document.querySelector('.cursor-dot');
        const ring = document.querySelector('.cursor-ring');
        if (!dot || !ring) return;
        document.body.classList.add('has-cursor');
        let mx = -100, my = -100, rx = -100, ry = -100;
        window.addEventListener('pointermove', (e) => {
            mx = e.clientX; my = e.clientY;
            dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
            dot.classList.remove('is-hidden'); ring.classList.remove('is-hidden');
        }, { passive: true });
        document.addEventListener('pointerleave', () => { dot.classList.add('is-hidden'); ring.classList.add('is-hidden'); });
        const loop = () => {
            rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
            ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
            requestAnimationFrame(loop);
        };
        loop();
        const hoverSel = 'a, button, .card, video';
        document.addEventListener('pointerover', (e) => { if (e.target.closest(hoverSel)) ring.classList.add('is-hover'); });
        document.addEventListener('pointerout', (e) => { if (e.target.closest(hoverSel)) ring.classList.remove('is-hover'); });
    })();

    /* Magnetic buttons */
    document.querySelectorAll('.magnetic').forEach((el) => {
        const strength = 0.28;
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left - r.width / 2) * strength;
            const y = (e.clientY - r.top - r.height / 2) * strength;
            el.style.transform = `translate(${x}px, ${y}px)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    /* Spotlight (semua card) + 3D tilt (card .tilt) */
    document.querySelectorAll('.card').forEach((card) => {
        const tilt = card.classList.contains('tilt');
        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            card.style.setProperty('--mx', `${px * 100}%`);
            card.style.setProperty('--my', `${py * 100}%`);
            if (tilt) {
                card.classList.add('tilting');
                card.style.setProperty('--rx', `${(0.5 - py) * 6}deg`);
                card.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
            }
        });
        card.addEventListener('pointerleave', () => {
            card.classList.remove('tilting');
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });

    /* Parallax halus pada background blob */
    (function parallax() {
        const blobs = document.querySelectorAll('.blob[data-depth]');
        let tx = 0, ty = 0, cx = 0, cy = 0;
        window.addEventListener('pointermove', (e) => {
            tx = e.clientX / window.innerWidth - 0.5;
            ty = e.clientY / window.innerHeight - 0.5;
        }, { passive: true });
        const loop = () => {
            cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
            blobs.forEach((b) => {
                const d = parseFloat(b.dataset.depth);
                b.style.translate = `${cx * d}px ${cy * d}px`;
            });
            requestAnimationFrame(loop);
        };
        loop();
    })();
}
