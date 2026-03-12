// ===== CRAZY.co.jp-style Gradient Light Background =====
// Reproduces the multi-layer gradient plane approach:
// Large soft gradient circles slowly drifting, like CRAZY's WebGL shader planes
(() => {
    const canvas = document.getElementById('starfieldCanvas');
    if (!canvas || getComputedStyle(canvas).display === 'none') return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        canvas.width = W * dpr;
        canvas.height = H * dpr;
    }

    // CRAZY's actual color palette (extracted from their source):
    // オレンジ [253,200,157], ピンク [253,237,234], ブルー [186,213,234]
    // Plus white as base light
    const gradientOrbs = [];
    const ORB_COUNT = 12;

    const lightColors = [
        { r: 255, g: 180, b: 100 },  // オレンジ
        { r: 255, g: 200, b: 120 },  // ライトオレンジ
        { r: 255, g: 235, b: 130 },  // イエロー
        { r: 255, g: 245, b: 170 },  // ライトイエロー
        { r: 200, g: 170, b: 255 },  // パステルパープル
        { r: 220, g: 195, b: 255 },  // ライトパープル
    ];

    class GradientOrb {
        constructor(i) {
            this.id = i;
            // CRAZY uses planes ~1400x787 with gradient points
            // We simulate with very large circles (30-60% of viewport)
            this.sizeRatio = Math.random() * 0.35 + 0.3; // 30-65% of viewport
            this.radius = Math.max(W, H) * this.sizeRatio;
            // Spread across viewport
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            // Target position for smooth movement (CRAZY moves gradient points slowly)
            this.tx = this.x;
            this.ty = this.y;
            this.moveTimer = 0;
            this.moveDuration = Math.random() * 400 + 300; // frames to reach target
            // Alpha - CRAZY's orbs are very soft, overlapping
            this.baseAlpha = Math.random() * 0.25 + 0.15;
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.005 + 0.002;
            // Pick color
            const c = lightColors[i % lightColors.length];
            this.r = c.r; this.g = c.g; this.b = c.b;
        }
        pickNewTarget() {
            // Drift to a new position within viewport (±30% of current pos)
            const drift = Math.max(W, H) * 0.3;
            this.tx = this.x + (Math.random() - 0.5) * drift;
            this.ty = this.y + (Math.random() - 0.5) * drift;
            // Keep somewhat within bounds (allow some overflow for edge glow)
            this.tx = Math.max(-this.radius * 0.5, Math.min(W + this.radius * 0.5, this.tx));
            this.ty = Math.max(-this.radius * 0.5, Math.min(H + this.radius * 0.5, this.ty));
            this.moveTimer = 0;
            this.moveDuration = Math.random() * 500 + 300;
        }
        update(t) {
            // Ease toward target
            this.moveTimer++;
            const ease = 0.003;
            this.x += (this.tx - this.x) * ease;
            this.y += (this.ty - this.y) * ease;
            // Pick new target when close enough or timer expires
            if (this.moveTimer > this.moveDuration) {
                this.pickNewTarget();
            }
            // Gentle pulse
            this.alpha = this.baseAlpha * (0.7 + 0.3 * Math.sin(t * this.pulseSpeed + this.pulsePhase));
            // Update radius on resize
            this.radius = Math.max(W, H) * this.sizeRatio;
        }
        draw() {
            const r = this.radius;
            if (!r || !isFinite(r) || r <= 0) return;
            const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
            // CRAZY style: smooth gradient from color center to transparent edge
            g.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${this.alpha})`);
            g.addColorStop(0.4, `rgba(${this.r},${this.g},${this.b},${this.alpha * 0.5})`);
            g.addColorStop(0.7, `rgba(${this.r},${this.g},${this.b},${this.alpha * 0.15})`);
            g.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    resize();
    for (let i = 0; i < ORB_COUNT; i++) gradientOrbs.push(new GradientOrb(i));

    window.addEventListener('resize', resize);

    let t = 0;

    function animate() {
        if (!W || !H) { resize(); requestAnimationFrame(animate); return; }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        t++;
        for (const o of gradientOrbs) { o.update(t); o.draw(); }
        requestAnimationFrame(animate);
    }

    animate();
})();

// ===== Mouse Sparkle Particles =====
(() => {
    const canvas = document.getElementById('sparkleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    let mouse = { x: -1000, y: -1000 };
    const sparkles = [];
    const MAX_SPARKLES = 80;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        for (let i = 0; i < 2; i++) {
            emitSparkle(mouse.x + (Math.random() - 0.5) * 20, mouse.y + (Math.random() - 0.5) * 20);
        }
    });

    const sparkleColors = [
        [255, 215, 0],    // gold
        [255, 179, 71],   // warm orange
        [255, 240, 200],  // warm white
        [255, 107, 53],   // orange
        [255, 200, 100],  // light gold
    ];

    class Sparkle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const c = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
            this.r = c[0]; this.g = c[1]; this.b = c[2];
            this.size = Math.random() * 3 + 1;
            this.life = 1;
            this.decay = Math.random() * 0.03 + 0.015;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5 - 0.8;
            this.gravity = 0.02;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.15;
            this.twinkle = Math.random() * Math.PI * 2;
            this.twinkleSpeed = Math.random() * 0.15 + 0.05;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.life -= this.decay;
            this.rotation += this.rotSpeed;
            this.twinkle += this.twinkleSpeed;
        }

        draw() {
            const alpha = this.life * (0.5 + 0.5 * Math.sin(this.twinkle));
            if (alpha <= 0) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = alpha;

            // Glow
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 4);
            glow.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${alpha * 0.35})`);
            glow.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 4, 0, Math.PI * 2);
            ctx.fill();

            // 4-point star
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${alpha})`;
            ctx.beginPath();
            const s = this.size;
            const inner = s * 0.25;
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
                const nextAngle = ((i + 0.5) / 4) * Math.PI * 2 - Math.PI / 2;
                ctx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
                ctx.lineTo(Math.cos(nextAngle) * inner, Math.sin(nextAngle) * inner);
            }
            ctx.closePath();
            ctx.fill();

            // Center bright dot
            ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    function emitSparkle(x, y) {
        if (sparkles.length < MAX_SPARKLES * 2) {
            sparkles.push(new Sparkle(x, y));
        }
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);

        for (let i = sparkles.length - 1; i >= 0; i--) {
            sparkles[i].update();
            sparkles[i].draw();
            if (sparkles[i].life <= 0) {
                sparkles.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
})();

// ===== DeepAI Text Particle Animation (Original) =====
(() => {
    const pCanvas = document.getElementById('particleCanvas');
    if (!pCanvas) return;
    const ctx = pCanvas.getContext('2d');
    let particles = [];
    let mousePosition = { x: 0, y: 0 };
    let startTime = Date.now();
    let animationPhase = 'floating';

    const dayColors = ['#555555', '#888888', '#aaaaaa', '#3f51b5', '#e91e63'];

    const textPaths = {
        'D': [[0,0],[0,20],[0,40],[0,60],[0,80],[20,0],[40,0],[20,80],[40,80],[60,10],[60,20],[60,60],[60,70]],
        'e': [[80,30],[100,30],[120,30],[140,30],[80,50],[100,50],[120,50],[80,70],[100,70],[120,70],[140,70]],
        'e2': [[160,30],[180,30],[200,30],[220,30],[160,50],[180,50],[200,50],[160,70],[180,70],[200,70],[220,70]],
        'p': [[240,30],[240,50],[240,70],[240,90],[260,30],[280,30],[260,50],[280,50]],
        'A': [[340,80],[350,60],[360,40],[370,20],[380,0],[390,20],[400,40],[410,60],[420,80],[360,50],[380,50],[400,50]],
        'I': [[440,0],[460,0],[480,0],[460,20],[460,40],[460,60],[440,80],[460,80],[480,80]]
    };

    let allTextPoints = [];
    Object.values(textPaths).forEach(p => allTextPoints = allTextPoints.concat(p));

    function resize() {
        const rect = pCanvas.parentElement.getBoundingClientRect();
        const w = rect.width || pCanvas.parentElement.offsetWidth || window.innerWidth;
        const h = rect.height || pCanvas.parentElement.offsetHeight || 240;
        pCanvas.width = w;
        pCanvas.height = h;
    }

    let globalTime = 0;

    class Particle {
        constructor() {
            this.reset();
            this.isFormingText = false;
            this.targetX = 0;
            this.targetY = 0;
            this.trail = [];
            this.wobblePhaseX = Math.random() * Math.PI * 2;
            this.wobblePhaseY = Math.random() * Math.PI * 2;
            this.wobbleSpeedX = Math.random() * 0.08 + 0.03;
            this.wobbleSpeedY = Math.random() * 0.08 + 0.03;
            this.wobbleAmpX = Math.random() * 2 + 1;
            this.wobbleAmpY = Math.random() * 2 + 1;
            this.scatterAngle = Math.random() * Math.PI * 2;
            this.scatterSpeed = Math.random() * 0.8 + 0.3;
        }

        reset() {
            this.x = Math.random() * pCanvas.width;
            this.y = Math.random() * pCanvas.height;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5;
            this.size = Math.random() * 3 + 0.8;
            this.color = dayColors[Math.floor(Math.random() * dayColors.length)];
            this.alpha = Math.random() * 0.4 + 0.6;
            this.trail = [];
        }

        softScatter() {
            this.scatterAngle = Math.random() * Math.PI * 2;
            this.scatterSpeed = Math.random() * 0.8 + 0.3;
            this.vx = Math.cos(this.scatterAngle) * this.scatterSpeed;
            this.vy = Math.sin(this.scatterAngle) * this.scatterSpeed;
            this.isFormingText = false;
            this.isScattering = true;
            this.scatterTimer = 0;
        }

        update() {
            if (animationPhase === 'forming' && this.isFormingText) {
                // ピタッと止まる
                this.x += (this.targetX - this.x) * 0.08;
                this.y += (this.targetY - this.y) * 0.08;
                this.trail.push({ x: this.x, y: this.y });
                if (this.trail.length > 15) this.trail.shift();
            } else if (this.isScattering) {
                // 散る時だけぷるぷる小刻みに震える
                this.scatterTimer++;
                const wobX = Math.sin(globalTime * 0.4 + this.wobblePhaseX) * 1.8
                           + Math.sin(globalTime * 0.7 + this.wobblePhaseY) * 0.8;
                const wobY = Math.sin(globalTime * 0.5 + this.wobblePhaseY) * 1.8
                           + Math.cos(globalTime * 0.6 + this.wobblePhaseX) * 0.8;
                this.x += this.vx + wobX;
                this.y += this.vy + wobY;
                // 120フレーム(約2秒)後に通常浮遊に戻る
                if (this.scatterTimer > 120) {
                    this.isScattering = false;
                }
            } else {
                // 通常浮遊：震えなし、まっすぐ静かに動く
                this.x += this.vx;
                this.y += this.vy;
                this.vx += (Math.random() - 0.5) * 0.02;
                this.vy += (Math.random() - 0.5) * 0.02;
                const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (spd > 1.2) { this.vx *= 1.2 / spd; this.vy *= 1.2 / spd; }

                this.trail = [];
                const dx = mousePosition.x - this.x;
                const dy = mousePosition.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    this.x -= dx * 0.02;
                    this.y -= dy * 0.02;
                }
            }
            // Wrap around edges smoothly instead of hard reset
            if (this.x < -10) this.x = pCanvas.width + 10;
            if (this.x > pCanvas.width + 10) this.x = -10;
            if (this.y < -10) this.y = pCanvas.height + 10;
            if (this.y > pCanvas.height + 10) this.y = -10;
        }

        drawTrail() {
            if (this.trail.length < 2) return;
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = 0.15;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            this.trail.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
            ctx.restore();
        }

        drawDiamond() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size);
            ctx.lineTo(this.x + this.size, this.y);
            ctx.lineTo(this.x, this.y + this.size);
            ctx.lineTo(this.x - this.size, this.y);
            ctx.closePath();
            ctx.fill();
        }

        draw() {
            if (animationPhase === 'forming' && this.isFormingText) {
                this.drawTrail();
            }
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            if (animationPhase === 'forming' && this.isFormingText) {
                this.drawDiamond();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    function assignTextTargets() {
        const cx = pCanvas.width / 2 - 250;
        const cy = pCanvas.height / 2 - 40;
        const free = particles.filter(p => !p.isFormingText);
        allTextPoints.forEach((pt, i) => {
            if (free[i]) {
                free[i].isFormingText = true;
                free[i].targetX = cx + pt[0];
                free[i].targetY = cy + pt[1];
            }
        });
    }

    let scattered = false;

    function updatePhase() {
        const t = (Date.now() - startTime) / 1000;
        if (t < 3) {
            animationPhase = 'floating';
            scattered = false;
        } else if (t < 8) {
            animationPhase = 'forming';
            scattered = false;
            assignTextTargets();
        } else {
            // Scatter phase: particles tremble and drift away
            if (!scattered) {
                particles.forEach(p => {
                    if (p.isFormingText) {
                        p.softScatter();
                    }
                });
                scattered = true;
            }
            animationPhase = 'floating';
            if (t > 12) {
                // Enough time for scatter to look natural, restart cycle
                startTime = Date.now();
            }
        }
    }

    function animate() {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pCanvas.width, pCanvas.height);
        globalTime++;
        updatePhase();
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    let animRunning = false;

    function startAnimation() {
        if (animRunning) return;
        resize();
        if (pCanvas.width < 10) return; // not ready yet
        particles.length = 0;
        for (let i = 0; i < 80; i++) particles.push(new Particle());
        startTime = Date.now();
        animRunning = true;
        requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);

    pCanvas.parentElement.addEventListener('mousemove', e => {
        const rect = pCanvas.getBoundingClientRect();
        mousePosition.x = e.clientX - rect.left;
        mousePosition.y = e.clientY - rect.top;
    });

    // Try to start immediately, retry if layout not ready
    startAnimation();
    if (!animRunning) {
        setTimeout(startAnimation, 500);
        setTimeout(startAnimation, 1500);
    }

    // Also start when scrolled into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startAnimation();
                resize();
                startTime = Date.now();
                particles.forEach(p => p.reset());
            }
        });
    }, { threshold: 0.01 });

    observer.observe(pCanvas.parentElement);
})();

// ===== Floating Pop Objects =====
(() => {
    const emojis = ['💭','💬','✨','💫','🫧','💗','🌟','⭐','💛','🧡','💜','🩵','🤍','☁️','🪄'];
    const container = document.createElement('div');
    container.className = 'floating-objects-container';
    document.body.appendChild(container);

    const count = 30;
    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'pop-object';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

        // Random depth: front (big, clear) or back (small, blurry)
        const isFront = Math.random() > 0.6;
        const size = isFront
            ? (Math.random() * 1.2 + 1.0) + 'rem'
            : (Math.random() * 0.8 + 0.5) + 'rem';
        const opacity = isFront
            ? (Math.random() * 0.2 + 0.15)
            : (Math.random() * 0.12 + 0.06);
        const blur = isFront ? '0px' : (Math.random() * 2 + 1) + 'px';

        el.style.setProperty('--size', size);
        el.style.setProperty('--opa', opacity);
        el.style.setProperty('--blur', blur);
        el.style.setProperty('--duration', (Math.random() * 4 + 5) + 's');
        el.style.setProperty('--delay', -(Math.random() * 8) + 's');
        el.style.left = (Math.random() * 95) + '%';
        el.style.top = (Math.random() * 90) + '%';
        el.style.zIndex = isFront ? '3' : '0';

        container.appendChild(el);
    }

    // Parallax: move objects slightly on scroll for depth
    window.addEventListener('scroll', () => {
        const sy = window.scrollY;
        container.querySelectorAll('.pop-object').forEach(el => {
            const isFront = el.style.zIndex === '3';
            const speed = isFront ? 0.03 : 0.01;
            el.style.transform = `translateY(${sy * -speed}px)`;
        });
    });
})();

// ===== Header Scroll =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== Mobile Menu =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.contains('mobile-open');
        if (isOpen) {
            navLinks.classList.remove('mobile-open');
            navLinks.removeAttribute('style');
        } else {
            navLinks.classList.add('mobile-open');
            navLinks.style.display = 'flex';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '60px';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.flexDirection = 'column';
            navLinks.style.background = 'rgba(255,255,255,0.98)';
            navLinks.style.padding = '20px';
            navLinks.style.gap = '16px';
            navLinks.style.borderBottom = '1px solid rgba(255,179,71,0.15)';
            navLinks.style.backdropFilter = 'blur(20px)';
            navLinks.style.borderRadius = '0 0 16px 16px';
        }
    });
}

// ===== Scroll Reveal =====
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => entry.target.classList.add('visible'), parseInt(delay));
            scrollObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-scroll]').forEach(el => scrollObserver.observe(el));

// ===== Smooth scroll =====
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===== Parallax on scroll =====
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const hero = document.querySelector('.hero');
    if (hero) {
        const phone = hero.querySelector('.hero-video-raw');
        if (phone) {
            phone.style.transform = `translateY(${scrollY * -0.08}px)`;
        }
    }
});
