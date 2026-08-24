/**
 * Razor-Sharp Canvas 2D Financial Chart Engine
 * Supports Candlestick, Area chart, Live streaming ticks, Indicators, and Interactive Crosshairs.
 */

class MarketChartEngine {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById(containerId);
    if (!this.canvas || !this.container) {
      console.error('Canvas or container element not found for MarketChartEngine');
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.chartType = 'area'; // 'area' or 'candlestick'
    this.timeframe = '24H';
    this.showIndicators = {
      ema20: true,
      ema50: false,
      bollinger: false,
      volume: true
    };

    // Theme state
    this.theme = document.documentElement.getAttribute('data-theme') || 'dark';

    // Chart dimensions & margins
    this.margin = { top: 25, right: 65, bottom: 30, left: 15 };
    this.width = 800;
    this.height = 400;

    // Data series
    this.data = []; // Array of { time, open, high, low, close, volume }
    this.currentPrice = 0;
    this.priceChange = 0;
    this.priceChangePct = 0;

    // Crosshair & Hover state
    this.hover = {
      active: false,
      x: 0,
      y: 0,
      dataIndex: -1,
      point: null
    };

    // Live tick streamer
    this.tickInterval = null;

    this.init();
  }

  init() {
    this.resize();
    this.bindEvents();
  }

  resize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width || 800;
    this.height = rect.height || 420;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);
    this.render();
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize(), { passive: true });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleHover(x, y);
    }, { passive: true });

    this.canvas.addEventListener('mouseleave', () => {
      this.hover.active = false;
      this.render();
      if (this.onHoverCallback) this.onHoverCallback(null);
    });

    // Theme observer
    const observer = new MutationObserver(() => {
      this.theme = document.documentElement.getAttribute('data-theme') || 'dark';
      this.render();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  onHover(callback) {
    this.onHoverCallback = callback;
  }

  setData(candles) {
    this.data = candles;
    if (candles.length > 0) {
      const last = candles[candles.length - 1];
      const first = candles[0];
      this.currentPrice = last.close;
      this.priceChange = last.close - first.open;
      this.priceChangePct = ((last.close - first.open) / first.open) * 100;
    }
    this.calculateIndicators();
    this.render();
  }

  setChartType(type) {
    if (['area', 'candlestick'].includes(type)) {
      this.chartType = type;
      this.render();
    }
  }

  toggleIndicator(name) {
    if (this.showIndicators.hasOwnProperty(name)) {
      this.showIndicators[name] = !this.showIndicators[name];
      this.render();
    }
  }

  calculateIndicators() {
    if (!this.data || this.data.length === 0) return;

    // EMA 20
    const k20 = 2 / (20 + 1);
    let ema20 = this.data[0].close;
    for (let i = 0; i < this.data.length; i++) {
      ema20 = this.data[i].close * k20 + ema20 * (1 - k20);
      this.data[i].ema20 = ema20;
    }

    // EMA 50
    const k50 = 2 / (50 + 1);
    let ema50 = this.data[0].close;
    for (let i = 0; i < this.data.length; i++) {
      ema50 = this.data[i].close * k50 + ema50 * (1 - k50);
      this.data[i].ema50 = ema50;
    }

    // Bollinger Bands (20 periods, 2 std dev)
    const period = 20;
    for (let i = 0; i < this.data.length; i++) {
      if (i < period - 1) {
        this.data[i].bbUpper = null;
        this.data[i].bbLower = null;
        this.data[i].bbMid = null;
        continue;
      }
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += this.data[j].close;
      }
      const mean = sum / period;
      let varSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        varSum += Math.pow(this.data[j].close - mean, 2);
      }
      const std = Math.sqrt(varSum / period);
      this.data[i].bbMid = mean;
      this.data[i].bbUpper = mean + std * 2;
      this.data[i].bbLower = mean - std * 2;
    }
  }

  pushLiveTick(tickPrice) {
    if (!this.data || this.data.length === 0) return;
    const last = this.data[this.data.length - 1];
    
    // Update current candle
    last.close = tickPrice;
    if (tickPrice > last.high) last.high = tickPrice;
    if (tickPrice < last.low) last.low = tickPrice;
    last.volume += Math.floor(Math.random() * 8 + 1);

    this.currentPrice = tickPrice;
    const first = this.data[0];
    this.priceChange = last.close - first.open;
    this.priceChangePct = ((last.close - first.open) / first.open) * 100;

    this.calculateIndicators();
    this.render();
  }

  handleHover(mouseX, mouseY) {
    const plotLeft = this.margin.left;
    const plotRight = this.width - this.margin.right;
    const plotWidth = plotRight - plotLeft;

    if (mouseX < plotLeft || mouseX > plotRight || !this.data.length) {
      this.hover.active = false;
      this.render();
      if (this.onHoverCallback) this.onHoverCallback(null);
      return;
    }

    const index = Math.round(((mouseX - plotLeft) / plotWidth) * (this.data.length - 1));
    const clampedIndex = Math.max(0, Math.min(this.data.length - 1, index));

    this.hover.active = true;
    this.hover.x = mouseX;
    this.hover.y = mouseY;
    this.hover.dataIndex = clampedIndex;
    this.hover.point = this.data[clampedIndex];

    this.render();
    if (this.onHoverCallback) this.onHoverCallback(this.hover.point);
  }

  render() {
    const ctx = this.ctx;
    const isDark = this.theme === 'dark';
    
    ctx.clearRect(0, 0, this.width, this.height);

    if (!this.data || this.data.length === 0) {
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '500 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading market stream...', this.width / 2, this.height / 2);
      return;
    }

    const plotLeft = this.margin.left;
    const plotRight = this.width - this.margin.right;
    const plotTop = this.margin.top;
    const plotBottom = this.height - this.margin.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    // Volume section takes bottom 18%
    const volumeHeight = this.showIndicators.volume ? plotHeight * 0.18 : 0;
    const pricePlotHeight = plotHeight - volumeHeight - 10;

    // Determine min/max price
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    for (let i = 0; i < this.data.length; i++) {
      const d = this.data[i];
      if (d.low < minPrice) minPrice = d.low;
      if (d.high > maxPrice) maxPrice = d.high;
      if (this.showIndicators.bollinger && d.bbLower !== null) {
        if (d.bbLower < minPrice) minPrice = d.bbLower;
        if (d.bbUpper > maxPrice) maxPrice = d.bbUpper;
      }
      if (d.volume > maxVolume) maxVolume = d.volume;
    }

    const pricePadding = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;

    const getY = (val) => plotTop + pricePlotHeight - ((val - minPrice) / (maxPrice - minPrice)) * pricePlotHeight;
    const getX = (idx) => plotLeft + (idx / (this.data.length - 1)) * plotWidth;

    // 1. Grid lines and Y Axis labels
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#64748b' : '#94a3b8';
    
    ctx.font = '400 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const priceVal = minPrice + (i / ySteps) * (maxPrice - minPrice);
      const y = getY(priceVal);

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(this.formatPrice(priceVal), plotRight + 8, y);
    }

    // 2. X Axis Time Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
      const idx = Math.floor((i / xSteps) * (this.data.length - 1));
      const x = getX(idx);
      const d = this.data[idx];
      if (d) {
        ctx.fillStyle = textColor;
        ctx.fillText(d.timeLabel || d.time, x, plotBottom + 8);
      }
    }

    // 3. Volume bars
    if (this.showIndicators.volume && maxVolume > 0) {
      const volBaseY = plotBottom;
      const barWidth = Math.max(1.5, (plotWidth / this.data.length) * 0.65);

      for (let i = 0; i < this.data.length; i++) {
        const d = this.data[i];
        const barHeight = (d.volume / maxVolume) * volumeHeight;
        const x = getX(i) - barWidth / 2;
        const y = volBaseY - barHeight;
        const isUp = d.close >= d.open;

        ctx.fillStyle = isUp
          ? (isDark ? 'rgba(34, 197, 94, 0.22)' : 'rgba(22, 163, 74, 0.25)')
          : (isDark ? 'rgba(239, 68, 68, 0.22)' : 'rgba(220, 38, 38, 0.25)');
        
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    // 4. Bollinger Bands
    if (this.showIndicators.bollinger) {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < this.data.length; i++) {
        const d = this.data[i];
        if (d.bbUpper === null) continue;
        const x = getX(i);
        const y = getY(d.bbUpper);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else { ctx.lineTo(x, y); }
      }
      for (let i = this.data.length - 1; i >= 0; i--) {
        const d = this.data[i];
        if (d.bbLower === null) continue;
        const x = getX(i);
        const y = getY(d.bbLower);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(37, 99, 235, 0.04)';
      ctx.fill();

      // Band stroke lines
      ctx.strokeStyle = isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < this.data.length; i++) {
        const d = this.data[i];
        if (d.bbUpper === null) continue;
        const x = getX(i);
        const y = getY(d.bbUpper);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < this.data.length; i++) {
        const d = this.data[i];
        if (d.bbLower === null) continue;
        const x = getX(i);
        const y = getY(d.bbLower);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 5. EMA lines
    if (this.showIndicators.ema20) {
      ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7'; // Sky
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < this.data.length; i++) {
        const x = getX(i);
        const y = getY(this.data[i].ema20);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (this.showIndicators.ema50) {
      ctx.strokeStyle = isDark ? '#a855f7' : '#7c3aed'; // Purple
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < this.data.length; i++) {
        const x = getX(i);
        const y = getY(this.data[i].ema50);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 6. Main Price Series (Area or Candlesticks)
    const isGain = this.priceChange >= 0;
    const primaryColor = isGain
      ? (isDark ? '#22c55e' : '#16a34a')
      : (isDark ? '#ef4444' : '#dc2626');

    if (this.chartType === 'area') {
      // Area Gradient Fill
      const grad = ctx.createLinearGradient(0, plotTop, 0, plotTop + pricePlotHeight);
      if (isGain) {
        grad.addColorStop(0, isDark ? 'rgba(34, 197, 94, 0.28)' : 'rgba(22, 163, 74, 0.20)');
        grad.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
      } else {
        grad.addColorStop(0, isDark ? 'rgba(239, 68, 68, 0.28)' : 'rgba(220, 38, 38, 0.20)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
      }

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(this.data[0].close));
      for (let i = 1; i < this.data.length; i++) {
        ctx.lineTo(getX(i), getY(this.data[i].close));
      }
      ctx.lineTo(getX(this.data.length - 1), plotTop + pricePlotHeight);
      ctx.lineTo(getX(0), plotTop + pricePlotHeight);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Main line stroke
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(this.data[0].close));
      for (let i = 1; i < this.data.length; i++) {
        ctx.lineTo(getX(i), getY(this.data[i].close));
      }
      ctx.stroke();

      // Pulsing Current Price Point
      const lastX = getX(this.data.length - 1);
      const lastY = getY(this.currentPrice);

      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (this.chartType === 'candlestick') {
      const candleWidth = Math.max(2, (plotWidth / this.data.length) * 0.7);

      for (let i = 0; i < this.data.length; i++) {
        const d = this.data[i];
        const x = getX(i);
        const openY = getY(d.open);
        const closeY = getY(d.close);
        const highY = getY(d.high);
        const lowY = getY(d.low);
        const isBullish = d.close >= d.open;

        const candleColor = isBullish
          ? (isDark ? '#22c55e' : '#16a34a')
          : (isDark ? '#ef4444' : '#dc2626');

        // Wick
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
        ctx.fillStyle = candleColor;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      }
    }

    // 7. Interactive Crosshair & Tooltip Badges
    if (this.hover.active && this.hover.point) {
      const point = this.hover.point;
      const hx = getX(this.hover.dataIndex);
      const hy = getY(point.close);

      // Vertical crosshair line
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, plotTop);
      ctx.lineTo(hx, plotBottom);
      ctx.stroke();

      // Horizontal crosshair line
      ctx.beginPath();
      ctx.moveTo(plotLeft, hy);
      ctx.lineTo(plotRight, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point focal circle
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Y-Axis Price Badge
      const priceBadgeText = this.formatPrice(point.close);
      ctx.font = '500 11px Inter, sans-serif';
      const badgeWidth = ctx.measureText(priceBadgeText).width + 12;
      const badgeHeight = 20;

      ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
      ctx.fillRect(plotRight + 2, hy - badgeHeight / 2, badgeWidth, badgeHeight);
      ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(priceBadgeText, plotRight + 8, hy);

      // X-Axis Time Badge
      const timeBadgeText = point.time;
      const timeBadgeWidth = ctx.measureText(timeBadgeText).width + 12;
      ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
      ctx.fillRect(hx - timeBadgeWidth / 2, plotBottom + 2, timeBadgeWidth, badgeHeight);
      ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(timeBadgeText, hx, plotBottom + 12);
    }
  }

  formatPrice(price) {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  }
}

window.MarketChartEngine = MarketChartEngine;
