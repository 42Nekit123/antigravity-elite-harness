/**
 * Dimension Analytics Dashboard — Interactive Engine
 * Handles theme toggling, live metric simulation, soundwave equalizer modulation,
 * timeframe switching, interactive pricing calculator, channel switcher, and terminal log stream.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. Theme Management (Dark / Light)
  // -------------------------------------------------------------------------
  const THEME_STORAGE_KEY = 'dimension_theme_preference';
  const root = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      const currentTheme = root.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  // -------------------------------------------------------------------------
  // 2. Real-time Metric & Telemetry Simulation
  // -------------------------------------------------------------------------
  const throughputEl = document.getElementById('liveMetricThroughput');
  const heroThroughputEl = document.getElementById('heroThroughput');
  const latencyEl = document.getElementById('liveMetricLatency');
  const heroLatencyEl = document.getElementById('heroLatency');

  let baseThroughput = 4821940;
  let baseLatency = 1.18;

  function updateMetrics() {
    const jitter = Math.floor((Math.random() - 0.5) * 35000);
    const currentThroughput = baseThroughput + jitter;
    
    if (throughputEl) {
      throughputEl.textContent = currentThroughput.toLocaleString('en-US');
    }
    if (heroThroughputEl) {
      heroThroughputEl.textContent = (currentThroughput / 1000000).toFixed(2) + 'M';
    }

    const latJitter = (Math.random() - 0.5) * 0.08;
    const currentLatency = Math.max(0.85, baseLatency + latJitter);
    if (latencyEl) {
      latencyEl.textContent = currentLatency.toFixed(2);
    }
    if (heroLatencyEl) {
      heroLatencyEl.textContent = currentLatency.toFixed(2) + ' ms';
    }
  }

  setInterval(updateMetrics, 1500);

  // -------------------------------------------------------------------------
  // 3. Soundwave Equalizer Real-time Modulation (Kobaryo Reference)
  // -------------------------------------------------------------------------
  const eqBars = document.querySelectorAll('.equalizer-waveform .eq-bar');
  let isStreamActive = true;

  function modulateEqualizer() {
    if (!isStreamActive) return;

    eqBars.forEach((bar, idx) => {
      // Bell-curved random heights peaking in the middle
      const centerFactor = 1 - Math.abs(idx - eqBars.length / 2) / (eqBars.length / 2);
      const baseHeight = 20 + centerFactor * 45;
      const randomJitter = (Math.random() - 0.5) * 35;
      const clampedHeight = Math.max(8, Math.min(100, Math.round(baseHeight + randomJitter)));
      bar.style.height = clampedHeight + '%';
    });
  }

  setInterval(modulateEqualizer, 180);

  // Stream Play / Pause button
  const streamPlayBtn = document.getElementById('streamPlayBtn');
  const streamPlayBtnText = document.getElementById('streamPlayBtnText');

  if (streamPlayBtn && streamPlayBtnText) {
    streamPlayBtn.addEventListener('click', function () {
      isStreamActive = !isStreamActive;
      if (isStreamActive) {
        streamPlayBtnText.textContent = 'Live telemetry stream';
        streamPlayBtn.classList.remove('btn-secondary');
        streamPlayBtn.classList.add('btn-primary');
      } else {
        streamPlayBtnText.textContent = 'Stream paused';
        streamPlayBtn.classList.remove('btn-primary');
        streamPlayBtn.classList.add('btn-secondary');
        eqBars.forEach(bar => { bar.style.height = '12%'; });
      }
    });
  }

  // -------------------------------------------------------------------------
  // 4. Channel / Track Cycler
  // -------------------------------------------------------------------------
  const channels = [
    { artist: 'Kobaryo', title: 'Dimension Hacker', bpm: '256 BPM / Hi-Tech', protocol: 'Protocol: eBPF Ring', ingress: '4.82M req/s' },
    { artist: 'Kobaryo', title: 'Everlasting Liberty Plus-X', bpm: '240 BPM / Speedcore', protocol: 'Protocol: gRPC Stream', ingress: '5.14M req/s' },
    { artist: 'Kobaryo', title: 'Villain Virus', bpm: '280 BPM / Mainstream HC', protocol: 'Protocol: QUIC Tunnel', ingress: '6.02M req/s' },
    { artist: 'Kobaryo', title: 'Super Miracle Entelecheia', bpm: '200 BPM / Artcore', protocol: 'Protocol: ZeroMQ Ingress', ingress: '3.95M req/s' }
  ];

  let currentChannelIdx = 0;
  const artistEl = document.getElementById('currentTrackArtist');
  const titleEl = document.getElementById('currentTrackTitle');
  const bpmEl = document.getElementById('currentTrackBpm');
  const protocolEl = document.getElementById('currentTrackProtocol');
  const ingressEl = document.getElementById('currentTrackIngress');

  function setChannel(idx) {
    currentChannelIdx = (idx + channels.length) % channels.length;
    const ch = channels[currentChannelIdx];
    if (artistEl) artistEl.textContent = ch.artist;
    if (titleEl) titleEl.textContent = ch.title;
    if (bpmEl) bpmEl.textContent = ch.bpm;
    if (protocolEl) protocolEl.textContent = ch.protocol;
    if (ingressEl) ingressEl.textContent = ch.ingress;
  }

  const prevTrackBtn = document.getElementById('prevTrackBtn');
  const nextTrackBtn = document.getElementById('nextTrackBtn');
  const cycleChannelBtn = document.getElementById('cycleChannelBtn');

  if (prevTrackBtn) prevTrackBtn.addEventListener('click', () => setChannel(currentChannelIdx - 1));
  if (nextTrackBtn) nextTrackBtn.addEventListener('click', () => setChannel(currentChannelIdx + 1));
  if (cycleChannelBtn) cycleChannelBtn.addEventListener('click', () => setChannel(currentChannelIdx + 1));

  // -------------------------------------------------------------------------
  // 5. Timeframe Filter Switching (SVG Path Morphing)
  // -------------------------------------------------------------------------
  const timeframeBtns = document.querySelectorAll('.timeframe-btn');
  const chartPath = document.getElementById('svgTelemetryPath');
  const chartAreaPath = document.getElementById('chartAreaPath');

  const chartPathVariants = {
    '15m': {
      stroke: 'M0 160 Q 60 130, 120 140 T 240 100 T 360 80 T 480 50 T 600 40',
      area:   'M0 160 Q 60 130, 120 140 T 240 100 T 360 80 T 480 50 T 600 40 L 600 200 L 0 200 Z'
    },
    '1h': {
      stroke: 'M0 150 Q 60 140, 120 120 T 240 90 T 360 110 T 480 40 T 600 35',
      area:   'M0 150 Q 60 140, 120 120 T 240 90 T 360 110 T 480 40 T 600 35 L 600 200 L 0 200 Z'
    },
    '24h': {
      stroke: 'M0 170 Q 70 110, 140 130 T 280 80 T 420 60 T 520 70 T 600 45',
      area:   'M0 170 Q 70 110, 140 130 T 280 80 T 420 60 T 520 70 T 600 45 L 600 200 L 0 200 Z'
    },
    '7d': {
      stroke: 'M0 140 Q 50 160, 100 130 T 200 110 T 300 70 T 450 50 T 600 30',
      area:   'M0 140 Q 50 160, 100 130 T 200 110 T 300 70 T 450 50 T 600 30 L 600 200 L 0 200 Z'
    },
    '30d': {
      stroke: 'M0 180 Q 80 150, 160 120 T 320 90 T 480 60 T 560 40 T 600 25',
      area:   'M0 180 Q 80 150, 160 120 T 320 90 T 480 60 T 560 40 T 600 25 L 600 200 L 0 200 Z'
    },
    'live': {
      stroke: 'M0 130 Q 50 110, 100 140 T 200 90 T 350 60 T 480 30 T 600 20',
      area:   'M0 130 Q 50 110, 100 140 T 200 90 T 350 60 T 480 30 T 600 20 L 600 200 L 0 200 Z'
    }
  };

  timeframeBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      timeframeBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const timeKey = this.getAttribute('data-time');
      if (chartPathVariants[timeKey]) {
        if (chartPath) chartPath.setAttribute('d', chartPathVariants[timeKey].stroke);
        if (chartAreaPath) chartAreaPath.setAttribute('d', chartPathVariants[timeKey].area);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 6. Interactive Pricing / Volume Estimator
  // -------------------------------------------------------------------------
  const volumeSlider = document.getElementById('volumeSlider');
  const sliderValueLabel = document.getElementById('sliderValueLabel');
  const priceValue = document.getElementById('priceValue');

  if (volumeSlider && sliderValueLabel && priceValue) {
    function updatePricing() {
      const millionEvents = parseInt(volumeSlider.value, 10);
      sliderValueLabel.textContent = millionEvents + ' Million events / mo';
      const calculatedPrice = 49 + Math.round(millionEvents * 2);
      priceValue.textContent = calculatedPrice;
    }

    volumeSlider.addEventListener('input', updatePricing);
    updatePricing();
  }

  // -------------------------------------------------------------------------
  // 7. Live Terminal Log Feed
  // -------------------------------------------------------------------------
  const terminalLogBody = document.getElementById('terminalLogBody');
  const sampleLogs = [
    { level: 'OK', levelClass: 'log-level-ok', msg: 'Cluster consensus verified across all 18 edge POPs' },
    { level: 'METRIC', levelClass: 'log-level-metric', msg: 'Zero-copy ring buffer utilization at 44.2%' },
    { level: 'INFO', levelClass: 'log-level-info', msg: 'Ingress node #804 rotated TLS 1.3 session ticket' },
    { level: 'OK', levelClass: 'log-level-ok', msg: 'Delta-of-delta compression achieved 14.2:1 ratio' },
    { level: 'INFO', levelClass: 'log-level-info', msg: 'Channel KBR-01 eBPF socket map re-anchored' },
    { level: 'METRIC', levelClass: 'log-level-metric', msg: 'Vectorized SIMD query completed in 4.12ms' },
    { level: 'WARN', levelClass: 'log-level-warn', msg: 'Minor jitter on AP-South (Singapore): 1.94ms' },
    { level: 'OK', levelClass: 'log-level-ok', msg: 'Automated anomaly scan completed: 0 outliers detected' }
  ];

  function getTimestamp() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function appendLog() {
    if (!terminalLogBody) return;

    const randomLog = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = 
      '<span class="log-time">' + getTimestamp() + '</span> ' +
      '<span class="log-level ' + randomLog.levelClass + '">' + randomLog.level + '</span> ' +
      '<span class="log-msg">' + randomLog.msg + '</span>';

    terminalLogBody.appendChild(entry);

    while (terminalLogBody.children.length > 25) {
      terminalLogBody.removeChild(terminalLogBody.firstChild);
    }

    terminalLogBody.scrollTop = terminalLogBody.scrollHeight;
  }

  setInterval(appendLog, 3200);

})();
