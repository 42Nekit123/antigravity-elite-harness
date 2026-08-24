/**
 * High-Performance Interactive Background Physics Engine
 * Generates dynamic, responsive canvas effects reacting to cursor position, velocity, and clicks.
 */

class InteractiveBackgroundEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas with id ${canvasId} not found`);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    
    // Display scaling
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Mouse state with smooth interpolation & velocity
    this.mouse = {
      x: this.width / 2,
      y: this.height / 2,
      targetX: this.width / 2,
      targetY: this.height / 2,
      prevX: this.width / 2,
      prevY: this.height / 2,
      vx: 0,
      vy: 0,
      speed: 0,
      isHovered: false,
      radius: 180,
      lastMoveTime: Date.now()
    };

    // Configuration & Modes
    this.mode = 'quantum'; // 'quantum', 'beams', 'warp', 'orbit'
    this.theme = document.documentElement.getAttribute('data-theme') || 'dark';
    
    // Effect settings
    this.settings = {
      particleDensity: 110,
      connectionDistance: 130,
      reactivity: 1.0,
      glowIntensity: 1.0,
      trailPersistence: 0.18,
      speedMultiplier: 1.0
    };

    // Entities
    this.particles = [];
    this.beams = [];
    this.ripples = [];
    this.sparks = [];
    this.gridNodes = [];
    
    // Animation frame handle
    this.animationId = null;
    this.lastFrameTime = performance.now();
    
    this.init();
  }

  init() {
    this.resize();
    this.bindEvents();
    this.initModeEntities();
    this.start();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.ctx.scale(this.dpr, this.dpr);
    this.initModeEntities();
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize(), { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
      this.mouse.isHovered = true;
      this.mouse.lastMoveTime = Date.now();

      // Emit velocity sparks on high speed
      if (this.mouse.speed > 8 && Math.random() < 0.4) {
        this.addSpark(this.mouse.x, this.mouse.y, this.mouse.vx * 0.3, this.mouse.vy * 0.3);
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.mouse.isHovered = false;
    });

    window.addEventListener('mouseenter', (e) => {
      this.mouse.isHovered = true;
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Touch support for mobile/tablets
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.targetX = e.touches[0].clientX;
        this.mouse.targetY = e.touches[0].clientY;
        this.mouse.isHovered = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.isHovered = false;
    });

    // Shockwave ripple on click
    window.addEventListener('click', (e) => {
      // Ignore click if clicking on input, select or button elements
      const target = e.target;
      if (target.closest('button, input, select, a, .control-btn, .theme-toggle')) {
        return;
      }
      this.addRipple(e.clientX, e.clientY);
    });

    // Theme mutation observer
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      if (currentTheme !== this.theme) {
        this.theme = currentTheme;
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  setMode(mode) {
    if (['quantum', 'beams', 'warp', 'orbit'].includes(mode)) {
      this.mode = mode;
      this.initModeEntities();
    }
  }

  addRipple(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: Math.max(this.width, this.height) * 0.45,
      opacity: 0.8,
      speed: 8 + this.settings.reactivity * 4,
      color: this.theme === 'dark' ? 'rgba(0, 240, 255, ' : 'rgba(37, 99, 235, '
    });

    // Particle burst on click
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const speed = 2 + Math.random() * 5;
      this.addSpark(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  addSpark(x, y, vx, vy) {
    if (this.sparks.length > 80) this.sparks.shift();
    this.sparks.push({
      x,
      y,
      vx: vx + (Math.random() - 0.5) * 2,
      vy: vy + (Math.random() - 0.5) * 2,
      life: 1.0,
      decay: 0.02 + Math.random() * 0.03,
      size: 1.5 + Math.random() * 2,
      color: this.theme === 'dark' 
        ? (Math.random() > 0.5 ? 'rgba(0, 240, 255,' : 'rgba(217, 70, 239,') 
        : 'rgba(59, 130, 246,'
    });
  }

  initModeEntities() {
    const isDark = this.theme === 'dark';
    
    // 1. Quantum Particles
    const count = Math.floor((this.width * this.height) / 11000 * (this.settings.particleDensity / 100));
    this.particles = [];
    for (let i = 0; i < Math.max(count, 60); i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        originX: Math.random() * this.width,
        originY: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: Math.random() * 2 + 1,
        baseSize: Math.random() * 2 + 1,
        colorIndex: Math.floor(Math.random() * 3),
        phase: Math.random() * Math.PI * 2
      });
    }

    // 2. Beams (Vertical Cyber Matrix Streams)
    const beamCount = Math.floor(this.width / 40);
    this.beams = [];
    for (let i = 0; i < beamCount; i++) {
      this.beams.push({
        x: (i * 40) + (Math.random() - 0.5) * 15,
        speed: 0.8 + Math.random() * 2.2,
        length: 80 + Math.random() * 260,
        y: Math.random() * this.height,
        opacity: 0.15 + Math.random() * 0.5,
        width: 1 + Math.random() * 1.5,
        colorIndex: Math.random() > 0.6 ? 1 : 0
      });
    }

    // 3. Warp Grid Nodes
    const spacing = 45;
    this.gridNodes = [];
    const cols = Math.ceil(this.width / spacing) + 2;
    const rows = Math.ceil(this.height / spacing) + 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.gridNodes.push({
          col: c,
          row: r,
          baseX: (c - 1) * spacing,
          baseY: (r - 1) * spacing,
          x: (c - 1) * spacing,
          y: (r - 1) * spacing,
          elevation: 0
        });
      }
    }
  }

  updatePhysics(delta) {
    // Smooth mouse interpolation (Damping factor)
    const lerpFactor = 0.12;
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * lerpFactor;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * lerpFactor;

    this.mouse.vx = this.mouse.x - this.mouse.prevX;
    this.mouse.vy = this.mouse.y - this.mouse.prevY;
    this.mouse.speed = Math.sqrt(this.mouse.vx * this.mouse.vx + this.mouse.vy * this.mouse.vy);

    // Idle idle motion if no mouse movement for a while
    if (Date.now() - this.mouse.lastMoveTime > 3000) {
      const time = performance.now() * 0.001;
      this.mouse.targetX = this.width / 2 + Math.cos(time * 0.6) * (this.width * 0.28);
      this.mouse.targetY = this.height / 2 + Math.sin(time * 0.8) * (this.height * 0.22);
    }

    // Update Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.opacity *= 0.96;
      if (r.radius > r.maxRadius || r.opacity < 0.01) {
        this.ripples.splice(i, 1);
      }
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.95;
      s.vy *= 0.95;
      s.life -= s.decay;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  renderQuantum() {
    const isDark = this.theme === 'dark';
    const ctx = this.ctx;
    const time = performance.now() * 0.0015;

    // Palette
    const colors = isDark ? [
      'rgba(0, 240, 255, ',    // Cyan
      'rgba(168, 85, 247, ',   // Violet
      'rgba(244, 63, 94, '     // Rose neon
    ] : [
      'rgba(37, 99, 235, ',    // Royal Blue
      'rgba(79, 70, 229, ',    // Indigo
      'rgba(14, 165, 233, '    // Sky
    ];

    const mouseRadius = this.mouse.radius * (1 + Math.min(this.mouse.speed * 0.08, 1.2));

    // Draw ambient mouse glow
    if (this.mouse.isHovered || true) {
      const glowGrad = ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, mouseRadius * 1.5
      );
      if (isDark) {
        glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
        glowGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.05)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        glowGrad.addColorStop(0, 'rgba(37, 99, 235, 0.08)');
        glowGrad.addColorStop(0.6, 'rgba(99, 102, 241, 0.03)');
        glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, mouseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update and draw particles
    const connDist = this.settings.connectionDistance;
    const pCount = this.particles.length;

    for (let i = 0; i < pCount; i++) {
      const p = this.particles[i];

      // Base movement
      p.x += p.vx * this.settings.speedMultiplier;
      p.y += p.vy * this.settings.speedMultiplier;

      // Wrap boundaries
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;
      if (p.y < -20) p.y = this.height + 20;
      if (p.y > this.height + 20) p.y = -20;

      // Mouse interaction (Repulsion / Attraction dynamic)
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouseRadius && dist > 0) {
        const force = (1 - dist / mouseRadius) * 4 * this.settings.reactivity;
        const angle = Math.atan2(dy, dx);
        
        // Repulsion with orbital swirl
        p.x -= Math.cos(angle) * force + Math.sin(angle) * (this.mouse.speed * 0.15);
        p.y -= Math.sin(angle) * force - Math.cos(angle) * (this.mouse.speed * 0.15);
        p.size = p.baseSize * (1 + (1 - dist / mouseRadius) * 1.8);
      } else {
        p.size += (p.baseSize - p.size) * 0.05;
      }

      // Ripple displacement
      for (const r of this.ripples) {
        const rdx = p.x - r.x;
        const rdy = p.y - r.y;
        const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
        const diff = Math.abs(rdist - r.radius);
        if (diff < 40) {
          const rForce = (1 - diff / 40) * 6 * r.opacity;
          p.x += (rdx / (rdist || 1)) * rForce;
          p.y += (rdy / (rdist || 1)) * rForce;
        }
      }

      // Draw particle
      const alpha = isDark ? 0.75 : 0.6;
      ctx.fillStyle = `${colors[p.colorIndex]}${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Connect near neighbors
      for (let j = i + 1; j < pCount; j++) {
        const p2 = this.particles[j];
        const ndx = p.x - p2.x;
        const ndy = p.y - p2.y;
        const nDist = Math.sqrt(ndx * ndx + ndy * ndy);

        if (nDist < connDist) {
          const lineAlpha = (1 - nDist / connDist) * (isDark ? 0.22 : 0.14);
          ctx.strokeStyle = isDark 
            ? `rgba(0, 240, 255, ${lineAlpha})` 
            : `rgba(37, 99, 235, ${lineAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Connect to mouse if near
      if (dist < mouseRadius * 0.85) {
        const mouseLineAlpha = (1 - dist / (mouseRadius * 0.85)) * (isDark ? 0.45 : 0.3);
        ctx.strokeStyle = isDark 
          ? `rgba(217, 70, 239, ${mouseLineAlpha})` 
          : `rgba(79, 70, 229, ${mouseLineAlpha})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(this.mouse.x, this.mouse.y);
        ctx.stroke();
      }
    }
  }

  renderBeams() {
    const isDark = this.theme === 'dark';
    const ctx = this.ctx;
    const time = performance.now() * 0.001;

    for (let i = 0; i < this.beams.length; i++) {
      const b = this.beams[i];
      b.y += b.speed * 2.5 * this.settings.speedMultiplier;
      if (b.y > this.height + b.length) {
        b.y = -b.length;
        b.x = (i * 40) + (Math.random() - 0.5) * 15;
      }

      // Laser stream refraction towards mouse
      let drawX = b.x;
      let drawY = b.y;
      const dx = this.mouse.x - b.x;
      const dy = this.mouse.y - (b.y + b.length / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      let curveX = drawX;
      if (dist < 260) {
        const bend = (1 - dist / 260) * 45 * this.settings.reactivity;
        curveX += (dx > 0 ? bend : -bend);
      }

      // Gradient beam
      const grad = ctx.createLinearGradient(drawX, drawY, curveX, drawY + b.length);
      if (isDark) {
        if (b.colorIndex === 1) {
          grad.addColorStop(0, 'rgba(217, 70, 239, 0)');
          grad.addColorStop(0.5, `rgba(217, 70, 239, ${b.opacity * 0.8})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
        } else {
          grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
          grad.addColorStop(0.5, `rgba(0, 240, 255, ${b.opacity * 0.7})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
        }
      } else {
        grad.addColorStop(0, 'rgba(37, 99, 235, 0)');
        grad.addColorStop(0.5, `rgba(37, 99, 235, ${b.opacity * 0.5})`);
        grad.addColorStop(1, 'rgba(14, 165, 233, 0.8)');
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth = b.width;
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.quadraticCurveTo(curveX, drawY + b.length * 0.5, curveX, drawY + b.length);
      ctx.stroke();

      // Beam head glow dot
      ctx.fillStyle = isDark ? '#ffffff' : '#2563eb';
      ctx.beginPath();
      ctx.arc(curveX, drawY + b.length, b.width * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderWarp() {
    const isDark = this.theme === 'dark';
    const ctx = this.ctx;
    const spacing = 45;
    const cols = Math.ceil(this.width / spacing) + 2;
    const rows = Math.ceil(this.height / spacing) + 2;

    // Update node positions based on mouse proximity
    for (const node of this.gridNodes) {
      const dx = this.mouse.x - node.baseX;
      const dy = this.mouse.y - node.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 200;

      if (dist < maxDist) {
        const factor = (1 - dist / maxDist);
        const push = factor * 25 * this.settings.reactivity;
        const angle = Math.atan2(dy, dx);
        node.x = node.baseX - Math.cos(angle) * push;
        node.y = node.baseY - Math.sin(angle) * push;
        node.elevation = factor;
      } else {
        node.x += (node.baseX - node.x) * 0.1;
        node.y += (node.baseY - node.y) * 0.1;
        node.elevation *= 0.9;
      }
    }

    // Draw Grid Lines
    ctx.lineWidth = 0.9;
    const baseStroke = isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(37, 99, 235, 0.08)';
    const highStroke = isDark ? 'rgba(217, 70, 239, 0.4)' : 'rgba(79, 70, 229, 0.3)';

    // Horizontal lines
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const node = this.gridNodes[idx];
        if (!node) continue;
        if (c === 0) ctx.moveTo(node.x, node.y);
        else ctx.lineTo(node.x, node.y);
      }
      ctx.strokeStyle = baseStroke;
      ctx.stroke();
    }

    // Vertical lines
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const idx = r * cols + c;
        const node = this.gridNodes[idx];
        if (!node) continue;
        if (r === 0) ctx.moveTo(node.x, node.y);
        else ctx.lineTo(node.x, node.y);
      }
      ctx.strokeStyle = baseStroke;
      ctx.stroke();
    }

    // Draw elevated nodes with highlights
    for (const node of this.gridNodes) {
      if (node.elevation > 0.1) {
        ctx.fillStyle = highStroke;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + node.elevation * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderOrbit() {
    const isDark = this.theme === 'dark';
    const ctx = this.ctx;
    const time = performance.now() * 0.002;
    const count = this.particles.length;

    // Center focal point is mouse position
    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      const orbitSpeed = (0.5 + (i % 5) * 0.3) * (1 + this.mouse.speed * 0.04);
      const angle = p.phase + time * orbitSpeed;
      const baseR = 40 + (i * 2.2);
      
      const targetX = this.mouse.x + Math.cos(angle) * baseR;
      const targetY = this.mouse.y + Math.sin(angle) * (baseR * 0.6); // Elliptical tilt

      p.x += (targetX - p.x) * 0.08;
      p.y += (targetY - p.y) * 0.08;

      const alpha = 0.3 + 0.6 * Math.sin(angle);
      ctx.fillStyle = isDark 
        ? (i % 2 === 0 ? `rgba(0, 240, 255, ${Math.max(0.1, alpha)})` : `rgba(217, 70, 239, ${Math.max(0.1, alpha)})`)
        : `rgba(37, 99, 235, ${Math.max(0.1, alpha * 0.7)})`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderRipplesAndSparks() {
    const ctx = this.ctx;
    
    // Draw Ripples
    for (const r of this.ripples) {
      ctx.strokeStyle = `${r.color}${r.opacity})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Sparks
    for (const s of this.sparks) {
      ctx.fillStyle = `${s.color}${s.life})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  loop(timestamp) {
    const delta = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    this.updatePhysics(delta);

    // Clear canvas with theme background
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render active mode
    switch (this.mode) {
      case 'beams':
        this.renderBeams();
        break;
      case 'warp':
        this.renderWarp();
        break;
      case 'orbit':
        this.renderOrbit();
        break;
      case 'quantum':
      default:
        this.renderQuantum();
        break;
    }

    // Render ripple waves and kinetic sparks
    this.renderRipplesAndSparks();

    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    if (!this.animationId) {
      this.lastFrameTime = performance.now();
      this.animationId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

window.InteractiveBackgroundEngine = InteractiveBackgroundEngine;
