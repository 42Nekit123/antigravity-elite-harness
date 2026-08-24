/**
 * MAYHEM Analytics — Master Interactive Engine
 * Pure Vanilla JavaScript: High-frequency telemetry stream simulator,
 * dynamic SVG charts, 5-axis radar HUD, event logs, calculator, and theme switcher.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Theme Management (Dark / Light)
  // =========================================================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const htmlRoot = document.documentElement;

  function initTheme() {
    const savedTheme = localStorage.getItem('mayhem_theme');
    if (savedTheme) {
      htmlRoot.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      htmlRoot.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  function toggleTheme() {
    const currentTheme = htmlRoot.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlRoot.setAttribute('data-theme', nextTheme);
    localStorage.setItem('mayhem_theme', nextTheme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
  initTheme();

  // =========================================================================
  // 2. HUD Orb Visualizer Spectrum Generator
  // =========================================================================
  const hudSpectrumGroup = document.getElementById('hudSpectrumGroup');
  function initHudSpectrum() {
    if (!hudSpectrumGroup) return;
    const numBars = 36;
    const cx = 200;
    const cy = 200;
    const rBase = 120;

    let svgHtml = '';
    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * 2 * Math.PI;
      const length = 4 + (Math.sin(i * 0.8) + 1) * 6;
      const x1 = cx + Math.cos(angle) * rBase;
      const y1 = cy + Math.sin(angle) * rBase;
      const x2 = cx + Math.cos(angle) * (rBase + length);
      const y2 = cy + Math.sin(angle) * (rBase + length);
      
      const opacity = (i % 2 === 0) ? 0.7 : 0.35;
      svgHtml += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--accent-primary)" stroke-width="1.5" opacity="${opacity}" id="specBar_${i}"/>`;
    }
    hudSpectrumGroup.innerHTML = svgHtml;
  }
  initHudSpectrum();

  // =========================================================================
  // 3. State & Telemetry Simulation Engine
  // =========================================================================
  const state = {
    isRunning: true,
    speedMultiplier: 1,
    activeMetric: 'throughput', // 'throughput' | 'latency' | 'anomalies'
    activeWindow: '1m',
    isAnomalyActive: false,
    anomalyDecay: 0,
    
    // Core telemetry values
    throughput: 9.42, // Millions ops/sec
    latency: 0.38,   // ms
    accuracy: 99.94,
    entropy: 0.24,
    ddosIndex: 0.12,
    socketLeak: 0.38,
    memJitter: 0.18,
    payloadMalform: 0.08,

    // Time-series history buffers (30 points)
    history: {
      throughput: [],
      latency: [],
      anomalies: []
    },
    timestamps: [],
    
    // Nodes state
    nodes: {
      tyo: { cpu: 34, latency: 0.28, throughput: 2.84 },
      fra: { cpu: 42, latency: 0.42, throughput: 3.12 },
      iad: { cpu: 39, latency: 0.31, throughput: 2.41 },
      sin: { cpu: 29, latency: 0.49, throughput: 1.05 }
    },

    totalEventsIngested: 1482938
  };

  // Seed initial history
  function seedHistory() {
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const t = new Date(now - i * 1500);
      const timeStr = t.toTimeString().split(' ')[0];
      state.timestamps.push(timeStr);
      
      const tVal = 9.2 + Math.sin(i * 0.5) * 0.7 + (Math.random() * 0.4);
      state.history.throughput.push(parseFloat(tVal.toFixed(2)));
      
      const lVal = 0.35 + Math.cos(i * 0.4) * 0.05 + (Math.random() * 0.04);
      state.history.latency.push(parseFloat(lVal.toFixed(3)));

      const aVal = Math.floor(Math.random() * 3);
      state.history.anomalies.push(aVal);
    }
  }
  seedHistory();

  // =========================================================================
  // 4. Real-time SVG Chart Renderer
  // =========================================================================
  const chartAreaPath = document.getElementById('chartAreaPath');
  const chartLinePath = document.getElementById('chartLinePath');
  const chartNodesGroup = document.getElementById('chartNodesGroup');
  const yAxisMax = document.getElementById('yAxisMax');
  const yAxisMidHigh = document.getElementById('yAxisMidHigh');
  const yAxisMidLow = document.getElementById('yAxisMidLow');
  const yAxisMin = document.getElementById('yAxisMin');
  const chartContainer = document.getElementById('chartContainer');
  const chartTooltip = document.getElementById('chartTooltip');
  const tooltipTime = document.getElementById('tooltipTime');
  const tooltipVal = document.getElementById('tooltipVal');
  const tooltipStatus = document.getElementById('tooltipStatus');
  const chartCursor = document.getElementById('chartCursor');
  const cursorLine = document.getElementById('cursorLine');
  const cursorPoint = document.getElementById('cursorPoint');

  // Chart configuration constants
  const chartCfg = {
    width: 800,
    height: 280,
    padLeft: 40,
    padRight: 20,
    padTop: 35,
    padBottom: 55
  };

  function updateChart() {
    if (!chartLinePath || !chartAreaPath) return;

    const data = state.history[state.activeMetric];
    if (!data || data.length === 0) return;

    // Determine scale based on active metric
    let minVal = 0;
    let maxVal = 12;
    let unit = 'M ops/s';

    if (state.activeMetric === 'throughput') {
      minVal = 3.0;
      maxVal = 14.0;
      unit = 'M ops/s';
      if (yAxisMax) yAxisMax.textContent = '14M';
      if (yAxisMidHigh) yAxisMidHigh.textContent = '10.5M';
      if (yAxisMidLow) yAxisMidLow.textContent = '7.0M';
      if (yAxisMin) yAxisMin.textContent = '3.5M';
    } else if (state.activeMetric === 'latency') {
      minVal = 0.1;
      maxVal = 1.0;
      unit = 'ms';
      if (yAxisMax) yAxisMax.textContent = '1.0ms';
      if (yAxisMidHigh) yAxisMidHigh.textContent = '0.75ms';
      if (yAxisMidLow) yAxisMidLow.textContent = '0.50ms';
      if (yAxisMin) yAxisMin.textContent = '0.25ms';
    } else if (state.activeMetric === 'anomalies') {
      minVal = 0;
      maxVal = 20;
      unit = 'anomalies';
      if (yAxisMax) yAxisMax.textContent = '20';
      if (yAxisMidHigh) yAxisMidHigh.textContent = '15';
      if (yAxisMidLow) yAxisMidLow.textContent = '10';
      if (yAxisMin) yAxisMin.textContent = '5';
    }

    const usableW = chartCfg.width - chartCfg.padLeft - chartCfg.padRight;
    const usableH = chartCfg.height - chartCfg.padTop - chartCfg.padBottom;
    const stepX = usableW / (data.length - 1);

    const points = data.map((val, idx) => {
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      const normY = (clamped - minVal) / (maxVal - minVal);
      const x = chartCfg.padLeft + idx * stepX;
      const y = (chartCfg.height - chartCfg.padBottom) - (normY * usableH);
      return { x, y, val, time: state.timestamps[idx] || '--:--:--' };
    });

    // Build smooth cubic spline path
    let pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    chartLinePath.setAttribute('d', pathD);

    // Build area fill path
    const baselineY = chartCfg.height - chartCfg.padBottom;
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${baselineY} L ${points[0].x.toFixed(1)} ${baselineY} Z`;
    chartAreaPath.setAttribute('d', areaD);

    // Update node circles
    if (chartNodesGroup) {
      let nodesHtml = '';
      points.forEach((pt, i) => {
        // Show node if it's the last point or an anomaly
        const isAnomaly = state.activeMetric === 'throughput' ? pt.val > 10.5 : (state.activeMetric === 'latency' ? pt.val > 0.65 : pt.val > 5);
        if (i === points.length - 1 || isAnomaly) {
          const cls = isAnomaly ? 'chart-node-circle anomaly-node' : 'chart-node-circle';
          nodesHtml += `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${isAnomaly ? 5 : 4}" class="${cls}"/>`;
        }
      });
      chartNodesGroup.innerHTML = nodesHtml;
    }

    // Attach points to container for cursor tooltip
    chartContainer._cachedPoints = points;
    chartContainer._cachedUnit = unit;
  }

  // Interactive Chart Tooltip Tracking
  if (chartContainer) {
    chartContainer.addEventListener('mousemove', function (e) {
      const points = chartContainer._cachedPoints;
      if (!points || points.length === 0) return;

      const rect = chartContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const scaleX = chartCfg.width / rect.width;
      const svgX = mouseX * scaleX;

      // Find closest data point
      let closest = points[0];
      let minDiff = Infinity;
      points.forEach(pt => {
        const diff = Math.abs(pt.x - svgX);
        if (diff < minDiff) {
          minDiff = diff;
          closest = pt;
        }
      });

      if (closest && minDiff < 40) {
        if (chartCursor) {
          chartCursor.style.display = 'block';
          cursorLine.setAttribute('x1', closest.x);
          cursorLine.setAttribute('x2', closest.x);
          cursorPoint.setAttribute('cx', closest.x);
          cursorPoint.setAttribute('cy', closest.y);
        }

        if (chartTooltip) {
          chartTooltip.style.display = 'block';
          const pixelX = (closest.x / chartCfg.width) * rect.width;
          const pixelY = (closest.y / chartCfg.height) * rect.height;
          chartTooltip.style.left = `${pixelX}px`;
          chartTooltip.style.top = `${pixelY}px`;

          tooltipTime.textContent = closest.time;
          tooltipVal.textContent = `${closest.val} ${chartContainer._cachedUnit || ''}`;
          
          const isSpike = closest.val > (state.activeMetric === 'throughput' ? 10.5 : 0.65);
          tooltipStatus.textContent = isSpike ? 'Threshold alert' : 'Nominal';
          tooltipStatus.style.color = isSpike ? 'var(--accent-amber)' : 'var(--accent-emerald)';
        }
      } else {
        if (chartCursor) chartCursor.style.display = 'none';
        if (chartTooltip) chartTooltip.style.display = 'none';
      }
    });

    chartContainer.addEventListener('mouseleave', function () {
      if (chartCursor) chartCursor.style.display = 'none';
      if (chartTooltip) chartTooltip.style.display = 'none';
    });
  }

  // =========================================================================
  // 5. 5-Axis Threat Radar HUD Renderer
  // =========================================================================
  const radarPoly = document.getElementById('radarPoly');
  const radarScoreBadge = document.getElementById('radarScoreBadge');
  const barEntropy = document.getElementById('barEntropy');
  const valEntropy = document.getElementById('valEntropy');
  const barDdos = document.getElementById('barDdos');
  const valDdos = document.getElementById('valDdos');
  const barSocket = document.getElementById('barSocket');
  const valSocket = document.getElementById('valSocket');

  function updateRadar() {
    if (!radarPoly) return;

    const cx = 140;
    const cy = 130;
    const maxR = 105;

    // Vectors normalized [0..1]
    const vectors = [
      { angle: -Math.PI / 2, val: state.entropy },                         // 1. Entropy (Top)
      { angle: -Math.PI / 2 + (2 * Math.PI / 5), val: state.ddosIndex },     // 2. DDoS (Top-Right)
      { angle: -Math.PI / 2 + (4 * Math.PI / 5), val: state.memJitter },     // 3. Mem jitter (Bottom-Right)
      { angle: -Math.PI / 2 + (6 * Math.PI / 5), val: state.socketLeak },    // 4. Socket leak (Bottom-Left)
      { angle: -Math.PI / 2 + (8 * Math.PI / 5), val: state.payloadMalform } // 5. Malform (Top-Left)
    ];

    const polyPoints = vectors.map(v => {
      const r = Math.max(15, Math.min(maxR, v.val * maxR));
      const px = cx + Math.cos(v.angle) * r;
      const py = cy + Math.sin(v.angle) * r;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    }).join(' ');

    radarPoly.setAttribute('points', polyPoints);

    // Compute composite threat score
    const compositeScore = (state.entropy * 0.3 + state.ddosIndex * 0.35 + state.socketLeak * 0.2 + state.memJitter * 0.15);
    if (radarScoreBadge) {
      const isCritical = compositeScore > 0.6;
      const isWarn = compositeScore > 0.35;
      const label = isCritical ? 'Critical threat' : (isWarn ? 'Elevated' : 'Nominal');
      radarScoreBadge.textContent = `Score: ${compositeScore.toFixed(2)} (${label})`;
      radarScoreBadge.style.color = isCritical ? 'var(--accent-rose)' : (isWarn ? 'var(--accent-amber)' : 'var(--accent-emerald)');
      radarScoreBadge.style.borderColor = isCritical ? 'var(--accent-rose)' : (isWarn ? 'var(--accent-amber)' : 'var(--accent-emerald)');
      radarScoreBadge.style.backgroundColor = isCritical ? 'var(--accent-rose-bg)' : (isWarn ? 'var(--accent-amber-bg)' : 'var(--accent-emerald-bg)');
    }

    if (barEntropy && valEntropy) {
      barEntropy.style.width = `${Math.min(100, state.entropy * 100).toFixed(0)}%`;
      valEntropy.textContent = state.entropy.toFixed(2);
    }
    if (barDdos && valDdos) {
      barDdos.style.width = `${Math.min(100, state.ddosIndex * 100).toFixed(0)}%`;
      valDdos.textContent = state.ddosIndex.toFixed(2);
    }
    if (barSocket && valSocket) {
      barSocket.style.width = `${Math.min(100, state.socketLeak * 100).toFixed(0)}%`;
      valSocket.textContent = state.socketLeak.toFixed(2);
    }
  }

  // =========================================================================
  // 6. Live Event Terminal & Anomaly Feed
  // =========================================================================
  const terminalFeed = document.getElementById('terminalFeed');
  const logCounter = document.getElementById('logCounter');
  const clearLogBtn = document.getElementById('clearLogBtn');
  const autoscrollCheckbox = document.getElementById('autoscrollCheckbox');
  let currentLogFilter = 'all';

  const logTemplates = [
    { type: 'info', msg: 'Kernel eBPF ring buffer synchronized across 4 nodes (0 lost frames)' },
    { type: 'info', msg: 'Kafka topic stream `ingest.telemetry.matrix` rebalanced cleanly' },
    { type: 'info', msg: 'SIMD isolation forest vector sweep complete · 0.04ms execution' },
    { type: 'info', msg: 'Tokyo node ap-northeast-1 heartbeat verified · 0.28ms latency' },
    { type: 'anomaly', msg: 'Entropy perturbation detected on channel #14 (z-score: 2.84)' },
    { type: 'anomaly', msg: 'Sub-millisecond latency jitter spike observed on eu-central-1' },
    { type: 'critical', msg: 'High-frequency SYN flood signature matched on edge port 8443' },
    { type: 'recovery', msg: 'Autonomous load-shedding mitigated queue pressure on Node IAD-02' }
  ];

  function appendLog(type, message) {
    if (!terminalFeed) return;

    const time = new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100);
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.setAttribute('data-type', type);

    let badgeClass = 'badge-info';
    let badgeText = 'INFO';
    if (type === 'critical') { badgeClass = 'badge-critical'; badgeText = 'CRITICAL'; }
    else if (type === 'anomaly') { badgeClass = 'badge-anomaly'; badgeText = 'ANOMALY'; }
    else if (type === 'recovery') { badgeClass = 'badge-recovery'; badgeText = 'RESOLVED'; }

    entry.innerHTML = `
      <span class="log-time">[${time}]</span>
      <span class="log-badge ${badgeClass}">${badgeText}</span>
      <span class="log-msg">${message}</span>
    `;

    // Filter check
    if (currentLogFilter === 'all' || currentLogFilter === type || (currentLogFilter === 'anomaly' && (type === 'anomaly' || type === 'critical'))) {
      entry.style.display = 'flex';
    } else {
      entry.style.display = 'none';
    }

    terminalFeed.appendChild(entry);
    state.totalEventsIngested += Math.floor(Math.random() * 800 + 200);
    if (logCounter) logCounter.textContent = state.totalEventsIngested.toLocaleString();

    // Auto-scroll
    if (autoscrollCheckbox && autoscrollCheckbox.checked) {
      terminalFeed.scrollTop = terminalFeed.scrollHeight;
    }

    // Limit maximum DOM nodes in terminal
    while (terminalFeed.children.length > 80) {
      terminalFeed.removeChild(terminalFeed.firstChild);
    }
  }

  // Pre-fill terminal with initial logs
  logTemplates.slice(0, 6).forEach(item => appendLog(item.type, item.msg));

  // Terminal Filter Tabs
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentLogFilter = this.getAttribute('data-filter');

      const entries = terminalFeed.querySelectorAll('.log-entry');
      entries.forEach(entry => {
        const type = entry.getAttribute('data-type');
        if (currentLogFilter === 'all' || currentLogFilter === type || (currentLogFilter === 'anomaly' && (type === 'anomaly' || type === 'critical'))) {
          entry.style.display = 'flex';
        } else {
          entry.style.display = 'none';
        }
      });
    });
  });

  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', function () {
      if (terminalFeed) terminalFeed.innerHTML = '';
    });
  }

  // =========================================================================
  // 7. Node Matrix Real-Time Updates
  // =========================================================================
  const tyoLatency = document.getElementById('tyoLatency');
  const tyoCpu = document.getElementById('tyoCpu');
  const tyoThroughput = document.getElementById('tyoThroughput');

  const fraLatency = document.getElementById('fraLatency');
  const fraCpu = document.getElementById('fraCpu');
  const fraThroughput = document.getElementById('fraThroughput');

  const iadLatency = document.getElementById('iadLatency');
  const iadCpu = document.getElementById('iadCpu');
  const iadThroughput = document.getElementById('iadThroughput');

  const sinLatency = document.getElementById('sinLatency');
  const sinCpu = document.getElementById('sinCpu');
  const sinThroughput = document.getElementById('sinThroughput');

  function updateNodes() {
    // Jitter node values realistically
    const jLat = (base) => (base + (Math.random() * 0.06 - 0.03)).toFixed(2) + ' ms';
    const jCpu = (base) => Math.min(95, Math.max(15, Math.floor(base + (Math.random() * 6 - 3)))) + '%';
    const jThr = (base) => (base + (Math.random() * 0.2 - 0.1)).toFixed(2) + 'M/s';

    if (tyoLatency) tyoLatency.textContent = jLat(0.28);
    if (tyoCpu) tyoCpu.textContent = jCpu(34);
    if (tyoThroughput) tyoThroughput.textContent = jThr(2.84);

    if (fraLatency) fraLatency.textContent = jLat(0.42);
    if (fraCpu) fraCpu.textContent = jCpu(42);
    if (fraThroughput) fraThroughput.textContent = jThr(3.12);

    if (iadLatency) iadLatency.textContent = jLat(0.31);
    if (iadCpu) iadCpu.textContent = jCpu(39);
    if (iadThroughput) iadThroughput.textContent = jThr(2.41);

    if (sinLatency) sinLatency.textContent = jLat(0.49);
    if (sinCpu) sinCpu.textContent = jCpu(29);
    if (sinThroughput) sinThroughput.textContent = jThr(1.05);
  }

  // =========================================================================
  // 8. Main Real-time Simulation Loop
  // =========================================================================
  const heroThroughput = document.getElementById('heroThroughput');
  const heroLatency = document.getElementById('heroLatency');
  const heroAccuracy = document.getElementById('heroAccuracy');
  const hudStatusReadout = document.getElementById('hudStatusReadout');
  const hudEntropyText = document.getElementById('hudEntropyText');

  let tickCount = 0;

  function simulationTick() {
    if (!state.isRunning) return;

    tickCount++;
    const nowTime = new Date().toTimeString().split(' ')[0];

    // Handle anomaly decay if active
    if (state.isAnomalyActive) {
      state.anomalyDecay--;
      if (state.anomalyDecay <= 0) {
        state.isAnomalyActive = false;
        appendLog('recovery', 'Anomaly burst dissipated; stream baseline restored');
      }
    }

    // Compute dynamic values
    let targetThroughput = 9.4 + Math.sin(tickCount * 0.2) * 0.6 + (Math.random() * 0.4);
    let targetLatency = 0.38 + Math.cos(tickCount * 0.15) * 0.04 + (Math.random() * 0.03);
    let targetAnomalies = Math.floor(Math.random() * 2);

    if (state.isAnomalyActive) {
      targetThroughput += 2.8;
      targetLatency += 0.35;
      targetAnomalies += 8;
      state.entropy = Math.min(0.95, state.entropy + 0.15);
      state.ddosIndex = Math.min(0.92, state.ddosIndex + 0.2);
    } else {
      state.entropy = Math.max(0.18, state.entropy * 0.94);
      state.ddosIndex = Math.max(0.08, state.ddosIndex * 0.92);
    }

    state.throughput = parseFloat(targetThroughput.toFixed(2));
    state.latency = parseFloat(targetLatency.toFixed(3));

    // Push into time-series history
    state.timestamps.shift();
    state.timestamps.push(nowTime);

    state.history.throughput.shift();
    state.history.throughput.push(state.throughput);

    state.history.latency.shift();
    state.history.latency.push(state.latency);

    state.history.anomalies.shift();
    state.history.anomalies.push(targetAnomalies);

    // Update Hero KPIs
    if (heroThroughput) heroThroughput.textContent = `${state.throughput}M`;
    if (heroLatency) heroLatency.textContent = `${state.latency.toFixed(2)} ms`;
    if (hudEntropyText) hudEntropyText.textContent = `ENTROPY: ${state.entropy.toFixed(3)}`;

    // Random log trigger
    if (Math.random() < 0.35) {
      const template = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      appendLog(template.type, template.msg);
    }

    // Update components
    updateChart();
    updateRadar();
    if (tickCount % 2 === 0) updateNodes();
  }

  // Start Interval
  let simInterval = setInterval(simulationTick, 1200 / state.speedMultiplier);

  function resetSimSpeed() {
    clearInterval(simInterval);
    simInterval = setInterval(simulationTick, 1200 / state.speedMultiplier);
  }

  // =========================================================================
  // 9. Interactive Controls (Play/Pause, Speed, Anomaly Injection)
  // =========================================================================
  const toggleSimBtn = document.getElementById('toggleSimBtn');
  const simStateLabel = document.getElementById('simStateLabel');
  const triggerSpikeBtn = document.getElementById('triggerSpikeBtn');

  if (toggleSimBtn) {
    toggleSimBtn.addEventListener('click', function () {
      state.isRunning = !state.isRunning;
      toggleSimBtn.textContent = state.isRunning ? 'Pause' : 'Resume';
      if (simStateLabel) {
        simStateLabel.textContent = state.isRunning ? 'Running' : 'Paused';
        simStateLabel.style.color = state.isRunning ? 'var(--accent-emerald)' : 'var(--text-muted)';
      }
    });
  }

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.speedMultiplier = parseFloat(this.getAttribute('data-speed')) || 1;
      resetSimSpeed();
    });
  });

  if (triggerSpikeBtn) {
    triggerSpikeBtn.addEventListener('click', function () {
      state.isAnomalyActive = true;
      state.anomalyDecay = 6;
      appendLog('critical', 'MANUAL INJECTION: Simulated DDoS & entropy flood triggered on cluster!');
      simulationTick();
    });
  }

  // Dashboard Metric Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.activeMetric = this.getAttribute('data-metric');

      const chartSubtitle = document.getElementById('chartSubtitle');
      if (chartSubtitle) {
        if (state.activeMetric === 'throughput') chartSubtitle.textContent = 'Real-time operations per second across all edge channels';
        else if (state.activeMetric === 'latency') chartSubtitle.textContent = 'Kernel-to-OLAP p99 ingestion latency distribution (milliseconds)';
        else chartSubtitle.textContent = 'High-frequency vector anomaly heuristics detection frequency';
      }
      updateChart();
    });
  });

  // Time Window Switcher
  document.querySelectorAll('.window-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.window-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.activeWindow = this.getAttribute('data-window');
      // Visual feedback
      updateChart();
    });
  });

  // =========================================================================
  // 10. Capacity & Pricing Estimator Engine
  // =========================================================================
  const eventSlider = document.getElementById('eventSlider');
  const retentionSlider = document.getElementById('retentionSlider');
  const readoutEvents = document.getElementById('readoutEvents');
  const readoutRetention = document.getElementById('readoutRetention');
  
  const optEbpf = document.getElementById('optEbpf');
  const optAi = document.getElementById('optAi');
  const optHa = document.getElementById('optHa');

  const clusterTierBadge = document.getElementById('clusterTierBadge');
  const specVolume = document.getElementById('specVolume');
  const specStorage = document.getElementById('specStorage');
  const specNodes = document.getElementById('specNodes');
  const specPrice = document.getElementById('specPrice');
  const deployClusterBtn = document.getElementById('deployClusterBtn');
  const downloadSpecBtn = document.getElementById('downloadSpecBtn');

  function calculateCapacity() {
    if (!eventSlider || !retentionSlider) return;

    const eventsPerSecM = parseFloat(eventSlider.value); // In Millions ops/s
    const retentionDays = parseInt(retentionSlider.value, 10);

    if (readoutEvents) readoutEvents.textContent = `${eventsPerSecM.toFixed(1)} M ops/s`;
    if (readoutRetention) readoutRetention.textContent = `${retentionDays} days`;

    // Monthly ingested TB = events/sec * 1e6 * 200 bytes/event * 86400 * 30 / 1e12
    const totalEventsMo = eventsPerSecM * 1000000 * 86400 * 30;
    const monthlyTb = (totalEventsMo * 220) / (1024 * 1024 * 1024 * 1024);
    
    // Storage Pool with 3.5x columnar compression
    const storagePoolTb = (monthlyTb * (retentionDays / 30)) / 3.4;

    // Node sizing
    let requiredNodes = Math.max(2, Math.ceil(eventsPerSecM / 1.6));
    if (optHa && optHa.checked) requiredNodes = Math.ceil(requiredNodes * 1.5);

    // Pricing calculation
    let basePrice = requiredNodes * 320; // $320 per dedicated 16-vCPU node
    let storagePrice = storagePoolTb * 14; // $14 per TB NVMe
    let addonPrice = 0;
    if (optEbpf && optEbpf.checked) addonPrice += 120;
    if (optAi && optAi.checked) addonPrice += 240;

    const totalPrice = Math.round(basePrice + storagePrice + addonPrice);

    // Tier badge
    let tierName = 'Edge Cluster';
    if (eventsPerSecM > 12) tierName = 'HyperScale Matrix';
    else if (eventsPerSecM > 4) tierName = 'Enterprise Cluster';

    if (clusterTierBadge) clusterTierBadge.textContent = tierName;
    if (specVolume) specVolume.textContent = `${monthlyTb.toFixed(1)} TB / mo`;
    if (specStorage) specStorage.textContent = `${storagePoolTb.toFixed(1)} TB`;
    if (specNodes) specNodes.textContent = `${requiredNodes} Nodes (${requiredNodes * 16} vCPU)`;
    if (specPrice) specPrice.textContent = totalPrice.toLocaleString();
  }

  if (eventSlider) eventSlider.addEventListener('input', calculateCapacity);
  if (retentionSlider) retentionSlider.addEventListener('input', calculateCapacity);
  if (optEbpf) optEbpf.addEventListener('change', calculateCapacity);
  if (optAi) optAi.addEventListener('change', calculateCapacity);
  if (optHa) optHa.addEventListener('change', calculateCapacity);

  calculateCapacity();

  if (deployClusterBtn) {
    deployClusterBtn.addEventListener('click', function () {
      const originalText = deployClusterBtn.textContent;
      deployClusterBtn.textContent = 'Cluster deployment initiated...';
      deployClusterBtn.disabled = true;
      appendLog('critical', `DEPLOYMENT TRIGGERED: Provisioning ${specNodes ? specNodes.textContent : 'Cluster'} in 4 global zones`);

      setTimeout(() => {
        deployClusterBtn.textContent = 'Cluster provisioned (Active)';
        setTimeout(() => {
          deployClusterBtn.textContent = originalText;
          deployClusterBtn.disabled = false;
        }, 3000);
      }, 1500);
    });
  }

  if (downloadSpecBtn) {
    downloadSpecBtn.addEventListener('click', function () {
      const terraformSnippet = `# MAYHEM Telemetry Cluster Terraform Manifest
module "mayhem_cluster" {
  source          = "mayhem-telemetry/engine/aws"
  version         = "3.4.0"
  cluster_tier    = "${clusterTierBadge ? clusterTierBadge.textContent : 'Enterprise'}"
  sustained_mops  = ${eventSlider ? eventSlider.value : 5.0}
  retention_days  = ${retentionSlider ? retentionSlider.value : 30}
  ebpf_acceleration = ${optEbpf ? optEbpf.checked : true}
  vector_scoring    = ${optAi ? optAi.checked : true}
  ha_replication    = ${optHa ? optHa.checked : false}
}`;
      const blob = new Blob([terraformSnippet], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mayhem-cluster.tf';
      a.click();
      URL.revokeObjectURL(url);
      appendLog('info', 'Exported Terraform manifest mayhem-cluster.tf');
    });
  }

  // Initial render of chart and radar
  updateChart();
  updateRadar();
})();
