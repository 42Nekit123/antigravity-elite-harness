/**
 * Aether Market Analytics — Main Application Controller
 * Handles live market feeds, interactive charting, order flow, screener, sparklines, and physics dock.
 */

// ==========================================================================
// Market Assets Database
// ==========================================================================

const ASSETS = [
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    icon: '₿',
    category: 'crypto',
    basePrice: 64320.50,
    price: 64320.50,
    change1h: 0.42,
    change24h: 3.42,
    volume24h: '$28.45B',
    marketCap: '$1.268T',
    volatility: 0.008,
    precision: 2
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    icon: 'Ξ',
    category: 'crypto',
    basePrice: 3480.20,
    price: 3480.20,
    change1h: -0.15,
    change24h: 2.18,
    volume24h: '$14.12B',
    marketCap: '$418.5B',
    volatility: 0.011,
    precision: 2
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana',
    icon: '◎',
    category: 'crypto',
    basePrice: 152.80,
    price: 152.80,
    change1h: 1.12,
    change24h: 7.84,
    volume24h: '$5.62B',
    marketCap: '$71.4B',
    volatility: 0.015,
    precision: 2
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    icon: '⬡',
    category: 'equities',
    basePrice: 128.40,
    price: 128.40,
    change1h: 0.25,
    change24h: 4.15,
    volume24h: '$42.10B',
    marketCap: '$3.158T',
    volatility: 0.009,
    precision: 2
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc',
    icon: '',
    category: 'equities',
    basePrice: 224.50,
    price: 224.50,
    change1h: -0.08,
    change24h: 0.95,
    volume24h: '$18.30B',
    marketCap: '$3.440T',
    volatility: 0.006,
    precision: 2
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc',
    icon: '⚡',
    category: 'equities',
    basePrice: 218.30,
    price: 218.30,
    change1h: -0.85,
    change24h: -1.82,
    volume24h: '$21.40B',
    marketCap: '$696.2B',
    volatility: 0.018,
    precision: 2
  },
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    icon: '€',
    category: 'forex',
    basePrice: 1.0885,
    price: 1.0885,
    change1h: 0.02,
    change24h: 0.14,
    volume24h: '$118.0B',
    marketCap: '—',
    volatility: 0.0015,
    precision: 4
  },
  {
    symbol: 'XAU/USD',
    name: 'Gold Spot',
    icon: 'Au',
    category: 'forex',
    basePrice: 2415.60,
    price: 2415.60,
    change1h: 0.18,
    change24h: 0.88,
    volume24h: '$36.20B',
    marketCap: '—',
    volatility: 0.004,
    precision: 2
  }
];

// Initial Algorithmic Signals Data
const INITIAL_SIGNALS = [
  { symbol: 'BTC/USD', type: 'buy', title: 'EMA 20/50 Golden Cross', time: '2m ago', confidence: '94%' },
  { symbol: 'SOL/USD', type: 'buy', title: 'Liquidity Breakout above $150', time: '8m ago', confidence: '89%' },
  { symbol: 'NVDA', type: 'buy', title: 'Bullish Momentum Divergence', time: '14m ago', confidence: '91%' },
  { symbol: 'TSLA', type: 'sell', title: 'Resistance Rejection at $222', time: '21m ago', confidence: '82%' },
  { symbol: 'ETH/USD', type: 'buy', title: 'Support Test & Rebound', time: '35m ago', confidence: '88%' }
];

// ==========================================================================
// Application Core
// ==========================================================================

class App {
  constructor() {
    this.activeAsset = ASSETS[0];
    this.activeTimeframe = '24H';
    this.activeCategory = 'all';
    this.searchQuery = '';

    // Initialize Background Engine
    this.bgEngine = new InteractiveBackgroundEngine('bg-canvas');

    // Initialize Chart Engine
    this.chart = new MarketChartEngine('market-chart-canvas', 'chart-container');

    this.init();
  }

  init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupTickerTape();
    this.setupChartControls();
    this.setupOrderBook();
    this.setupScreener();
    this.setupSignals();
    this.setupFxDock();

    // Load initial asset chart
    this.loadAsset(this.activeAsset);

    // Start live simulation tickers
    this.startMarketFeeds();
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================

  setupTheme() {
    const savedTheme = localStorage.getItem('aether-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcons(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('aether-theme', newTheme);
        this.updateThemeIcons(newTheme);
      });
    }
  }

  updateThemeIcons(theme) {
    const sun = document.getElementById('theme-icon-sun');
    const moon = document.getElementById('theme-icon-moon');
    if (theme === 'dark') {
      if (sun) sun.style.display = 'block';
      if (moon) moon.style.display = 'none';
    } else {
      if (sun) sun.style.display = 'none';
      if (moon) moon.style.display = 'block';
    }
  }

  // ==========================================================================
  // Navigation
  // ==========================================================================

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  // ==========================================================================
  // Live Ticker Tape
  // ==========================================================================

  setupTickerTape() {
    const track = document.getElementById('ticker-tape-track');
    if (!track) return;

    // Create dual copy for seamless infinite marquee
    const generateHtml = () => ASSETS.map(asset => {
      const isUp = asset.change24h >= 0;
      const sign = isUp ? '+' : '';
      const changeClass = isUp ? 'up' : 'down';
      return `
        <div class="ticker-item" data-symbol="${asset.symbol}">
          <span class="ticker-symbol">${asset.symbol}</span>
          <span class="ticker-price">${this.formatPrice(asset.price, asset.precision)}</span>
          <span class="ticker-change ${changeClass}">${sign}${asset.change24h.toFixed(2)}%</span>
        </div>
      `;
    }).join('');

    track.innerHTML = generateHtml() + generateHtml();

    // Clicking ticker item selects asset
    track.addEventListener('click', (e) => {
      const item = e.target.closest('.ticker-item');
      if (item) {
        const symbol = item.getAttribute('data-symbol');
        const asset = ASSETS.find(a => a.symbol === symbol);
        if (asset) this.selectAsset(asset);
      }
    });
  }

  // ==========================================================================
  // Chart Controls & Historical Data Generator
  // ==========================================================================

  setupChartControls() {
    // Timeframe selector
    const tfGroup = document.getElementById('timeframe-control');
    if (tfGroup) {
      tfGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        tfGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTimeframe = btn.getAttribute('data-tf');
        this.loadAsset(this.activeAsset);
      });
    }

    // Chart Type (Area vs Candlestick)
    const typeGroup = document.getElementById('chart-type-control');
    if (typeGroup) {
      typeGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        typeGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.getAttribute('data-type');
        this.chart.setChartType(type);
      });
    }

    // Technical Indicators
    const indicatorButtons = document.querySelectorAll('.toggle-chip');
    indicatorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const indicator = btn.getAttribute('data-indicator');
        this.chart.toggleIndicator(indicator);
      });
    });
  }

  generateCandleData(asset, timeframe) {
    let count = 48;
    let timeStepMinutes = 30;

    switch (timeframe) {
      case '1H': count = 60; timeStepMinutes = 1; break;
      case '24H': count = 48; timeStepMinutes = 30; break;
      case '7D': count = 56; timeStepMinutes = 180; break;
      case '1M': count = 60; timeStepMinutes = 720; break;
      case '1Y': count = 52; timeStepMinutes = 10080; break;
    }

    const candles = [];
    const now = new Date();
    let currentClose = asset.basePrice * (1 - (asset.change24h / 100) * 0.7);

    for (let i = count - 1; i >= 0; i--) {
      const candleTime = new Date(now.getTime() - i * timeStepMinutes * 60 * 1000);
      
      const changePct = (Math.random() - 0.48) * asset.volatility;
      const open = currentClose;
      const close = open * (1 + changePct);
      const high = Math.max(open, close) * (1 + Math.random() * (asset.volatility * 0.6));
      const low = Math.min(open, close) * (1 - Math.random() * (asset.volatility * 0.6));
      const volume = Math.floor(Math.random() * 80 + 20);

      let timeLabel = '';
      if (timeframe === '1H') {
        timeLabel = candleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeframe === '24H') {
        timeLabel = candleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        timeLabel = candleTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }

      candles.push({
        time: candleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeLabel,
        open,
        high,
        low,
        close,
        volume
      });

      currentClose = close;
    }

    // Set last candle close to current price
    candles[candles.length - 1].close = asset.price;
    return candles;
  }

  loadAsset(asset) {
    this.activeAsset = asset;

    // Update Header UI
    document.getElementById('active-asset-icon').textContent = asset.icon;
    document.getElementById('active-asset-name').textContent = asset.name;
    document.getElementById('active-asset-symbol').textContent = asset.symbol;
    document.getElementById('active-asset-price').textContent = this.formatPrice(asset.price, asset.precision);

    const changeEl = document.getElementById('active-asset-change');
    const isUp = asset.change24h >= 0;
    changeEl.className = `asset-change-pill ${isUp ? 'up' : 'down'}`;
    changeEl.textContent = `${isUp ? '+' : ''}${asset.change24h.toFixed(2)}%`;

    // High / Low metadata
    const high = asset.price * 1.025;
    const low = asset.price * 0.978;
    document.getElementById('meta-high').textContent = this.formatPrice(high, asset.precision);
    document.getElementById('meta-low').textContent = this.formatPrice(low, asset.precision);
    document.getElementById('meta-volume').textContent = asset.volume24h;

    // Feed generated candles to chart engine
    const candleData = this.generateCandleData(asset, this.activeTimeframe);
    this.chart.setData(candleData);

    // Refresh Order Book
    this.renderOrderBook();
  }

  selectAsset(asset) {
    this.loadAsset(asset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================================================
  // Order Flow / Order Book Engine
  // ==========================================================================

  setupOrderBook() {
    this.renderOrderBook();
  }

  renderOrderBook() {
    const asksContainer = document.getElementById('orderbook-asks');
    const bidsContainer = document.getElementById('orderbook-bids');
    const midPriceEl = document.getElementById('orderbook-mid-price');

    if (!asksContainer || !bidsContainer) return;

    const current = this.activeAsset.price;
    if (midPriceEl) midPriceEl.textContent = this.formatPrice(current, this.activeAsset.precision);

    const step = current * 0.0004;
    const rows = 6;

    // Generate Asks (Sell orders above current price)
    let asksHtml = '';
    let askCum = 0;
    for (let i = 1; i <= rows; i++) {
      const askPrice = current + (i * step);
      const size = (Math.random() * 2.5 + 0.2);
      askCum += size;
      const depthPct = Math.min(100, (askCum / 12) * 100);

      asksHtml += `
        <div class="orderbook-row">
          <div class="ob-depth-bar ask" style="width: ${depthPct}%;"></div>
          <span class="ob-price ask">${this.formatPrice(askPrice, this.activeAsset.precision)}</span>
          <span class="ob-cell-right">${size.toFixed(3)}</span>
          <span class="ob-cell-right" style="color: var(--color-text-muted);">${askCum.toFixed(3)}</span>
        </div>
      `;
    }
    asksContainer.innerHTML = asksHtml;

    // Generate Bids (Buy orders below current price)
    let bidsHtml = '';
    let bidCum = 0;
    for (let i = 1; i <= rows; i++) {
      const bidPrice = current - (i * step);
      const size = (Math.random() * 2.5 + 0.2);
      bidCum += size;
      const depthPct = Math.min(100, (bidCum / 12) * 100);

      bidsHtml += `
        <div class="orderbook-row">
          <div class="ob-depth-bar bid" style="width: ${depthPct}%;"></div>
          <span class="ob-price bid">${this.formatPrice(bidPrice, this.activeAsset.precision)}</span>
          <span class="ob-cell-right">${size.toFixed(3)}</span>
          <span class="ob-cell-right" style="color: var(--color-text-muted);">${bidCum.toFixed(3)}</span>
        </div>
      `;
    }
    bidsContainer.innerHTML = bidsHtml;
  }

  // ==========================================================================
  // Screener Table & Sparklines
  // ==========================================================================

  setupScreener() {
    // Category tabs
    const catGroup = document.getElementById('category-filter');
    if (catGroup) {
      catGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        catGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.getAttribute('data-cat');
        this.renderScreenerTable();
      });
    }

    // Search filter
    const searchInput = document.getElementById('screener-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderScreenerTable();
      });
    }

    this.renderScreenerTable();
  }

  renderScreenerTable() {
    const tbody = document.getElementById('screener-tbody');
    if (!tbody) return;

    const filtered = ASSETS.filter(a => {
      const matchesCat = this.activeCategory === 'all' || a.category === this.activeCategory;
      const matchesSearch = !this.searchQuery || 
        a.symbol.toLowerCase().includes(this.searchQuery) || 
        a.name.toLowerCase().includes(this.searchQuery);
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
            No assets found matching your criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(asset => {
      const isUp1h = asset.change1h >= 0;
      const isUp24h = asset.change24h >= 0;
      const isCurrent = asset.symbol === this.activeAsset.symbol;

      return `
        <tr data-symbol="${asset.symbol}" style="${isCurrent ? 'background: var(--color-surface-hover);' : ''}">
          <td>
            <div class="table-asset-cell">
              <span style="font-size: 1.1rem; width: 24px; text-align: center;">${asset.icon}</span>
              <div>
                <div class="table-asset-symbol">${asset.symbol}</div>
                <div class="table-asset-name">${asset.name}</div>
              </div>
            </div>
          </td>
          <td style="text-align: right; font-family: var(--font-mono); font-weight: 500;">
            ${this.formatPrice(asset.price, asset.precision)}
          </td>
          <td style="text-align: right; color: ${isUp1h ? 'var(--color-up)' : 'var(--color-down)'}; font-family: var(--font-mono);">
            ${isUp1h ? '+' : ''}${asset.change1h.toFixed(2)}%
          </td>
          <td style="text-align: right; color: ${isUp24h ? 'var(--color-up)' : 'var(--color-down)'}; font-family: var(--font-mono);">
            ${isUp24h ? '+' : ''}${asset.change24h.toFixed(2)}%
          </td>
          <td style="text-align: center;">
            <canvas class="sparkline-canvas" id="spark-${asset.symbol.replace(/[\/]/g, '-')}" width="90" height="28"></canvas>
          </td>
          <td style="text-align: right; font-family: var(--font-mono); color: var(--color-text-muted);">
            ${asset.volume24h}
          </td>
          <td style="text-align: right; font-family: var(--font-mono); color: var(--color-text-muted);">
            ${asset.marketCap}
          </td>
          <td style="text-align: center;">
            <button class="seg-btn" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;">View</button>
          </td>
        </tr>
      `;
    }).join('');

    // Row click listeners
    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const symbol = row.getAttribute('data-symbol');
        const asset = ASSETS.find(a => a.symbol === symbol);
        if (asset) this.selectAsset(asset);
      });
    });

    // Render Sparklines
    requestAnimationFrame(() => {
      filtered.forEach(asset => {
        const canvasId = `spark-${asset.symbol.replace(/[\/]/g, '-')}`;
        this.renderSparkline(canvasId, asset);
      });
    });
  }

  renderSparkline(canvasId, asset) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const points = [];
    const count = 16;
    let p = asset.price * (1 - (asset.change24h / 100) * 0.8);
    for (let i = 0; i < count; i++) {
      p += (Math.random() - 0.48) * (asset.price * 0.015);
      points.push(p);
    }
    points[points.length - 1] = asset.price;

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = (max - min) || 1;

    const isUp = asset.change24h >= 0;
    ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    points.forEach((val, idx) => {
      const x = (idx / (count - 1)) * (w - 4) + 2;
      const y = h - 3 - ((val - min) / range) * (h - 6);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // ==========================================================================
  // Algorithmic Signals Stream
  // ==========================================================================

  setupSignals() {
    this.renderSignals();

    // Periodically generate new signals
    setInterval(() => {
      const randomAsset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
      const isBuy = Math.random() > 0.4;
      const signalsPool = isBuy
        ? ['Volume Surge Breakout', 'RSI Bullish Convergence', 'MACD Momentum Trigger', 'Whale Inflow Detected']
        : ['Resistance Rejection', 'Bearish Engulfing Pattern', 'Funding Rate Overheat', 'Support Breakdown'];

      const title = signalsPool[Math.floor(Math.random() * signalsPool.length)];
      const conf = `${Math.floor(Math.random() * 12 + 85)}%`;

      INITIAL_SIGNALS.unshift({
        symbol: randomAsset.symbol,
        type: isBuy ? 'buy' : 'sell',
        title: `${randomAsset.symbol}: ${title}`,
        time: 'Just now',
        confidence: conf
      });

      if (INITIAL_SIGNALS.length > 6) INITIAL_SIGNALS.pop();
      this.renderSignals();
    }, 15000);
  }

  renderSignals() {
    const container = document.getElementById('signals-stream');
    if (!container) return;

    container.innerHTML = INITIAL_SIGNALS.map(sig => `
      <div class="signal-item">
        <div class="signal-main">
          <span class="signal-tag ${sig.type}">${sig.type === 'buy' ? 'BUY' : 'SELL'}</span>
          <div>
            <div class="signal-title">${sig.title}</div>
            <span class="signal-meta">Confidence: ${sig.confidence}</span>
          </div>
        </div>
        <span class="signal-meta">${sig.time}</span>
      </div>
    `).join('');
  }

  // ==========================================================================
  // Background FX Control Dock
  // ==========================================================================

  setupFxDock() {
    const dock = document.getElementById('fx-mode-selector');
    if (!dock) return;

    dock.addEventListener('click', (e) => {
      const btn = e.target.closest('.fx-mode-btn');
      if (!btn) return;

      dock.querySelectorAll('.fx-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.getAttribute('data-mode');
      this.bgEngine.setMode(mode);
    });
  }

  // ==========================================================================
  // Real-Time Simulation Feed Loops
  // ==========================================================================

  startMarketFeeds() {
    // Tick loop every 500ms
    setInterval(() => {
      // Fluctuate active asset
      const delta = (Math.random() - 0.495) * (this.activeAsset.price * 0.0018);
      this.activeAsset.price = Math.max(0.0001, this.activeAsset.price + delta);

      // Push to active chart engine
      this.chart.pushLiveTick(this.activeAsset.price);

      // Update Active Asset Price badge in UI with flash
      const priceEl = document.getElementById('active-asset-price');
      if (priceEl) {
        priceEl.textContent = this.formatPrice(this.activeAsset.price, this.activeAsset.precision);
      }

      // Update Order Book Mid Price
      const midEl = document.getElementById('orderbook-mid-price');
      if (midEl) {
        midEl.textContent = this.formatPrice(this.activeAsset.price, this.activeAsset.precision);
      }

      // Slightly fluctuate other random assets in table
      const otherAsset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
      if (otherAsset.symbol !== this.activeAsset.symbol) {
        const otherDelta = (Math.random() - 0.495) * (otherAsset.price * 0.0015);
        otherAsset.price = Math.max(0.0001, otherAsset.price + otherDelta);
      }
    }, 600);
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  formatPrice(val, precision = 2) {
    if (val >= 1000) {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision })}`;
    } else if (val >= 1) {
      return `$${val.toFixed(precision)}`;
    } else {
      return `$${val.toFixed(precision || 4)}`;
    }
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.aetherApp = new App();
});
