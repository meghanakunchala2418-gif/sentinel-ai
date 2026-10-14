/**
 * =====================================================================
 * ROUTE SAFETY & HAZARDS ANALYTICS SYSTEM
 * AI Driver Safety & Bus Monitoring System
 * =====================================================================
 * Interactive route planning, multi-factor safety scoring engine,
 * dynamic weather/road hazard simulations, and driver recommendations.
 */

import { ApiService } from './api-service.js';
import { IncidentLogger } from './incident-logger.js';
import { RiskEngine } from './risk-engine.js';
import { MapManager } from './map-manager.js';

export const RouteSafety = {
  routes: [],
  selectedRouteId: 'route-nh44-exp',
  currentScenario: 'monsoon', // 'monsoon', 'clear', 'fog', 'gridlock', 'custom'
  isDataStale: false,
  lastUpdateTime: new Date(),

  // Dynamic slider values for custom scenario
  customModifiers: {
    rainfallMm: 5,
    visibilityMeters: 3500,
    congestionIndex: 30,
    hazardCount: 1
  },

  init() {
    this.routes = ApiService.getPredefinedRoutes();
    this.recalculateAllScores();
    this.renderRouteCards();
    this.renderWeatherPanel();
    this.renderRecommendations();
    this.bindEvents();

    // Periodic live timestamp updater
    setInterval(() => this.updateTimestampUI(), 5000);
  },

  updateTimestampUI() {
    const timeEl = document.getElementById('routeLastUpdateTime');
    if (timeEl) {
      const elapsedSecs = Math.round((Date.now() - this.lastUpdateTime.getTime()) / 1000);
      timeEl.textContent = `Updated ${elapsedSecs}s ago`;
    }
  },

  recalculateAllScores() {
    this.lastUpdateTime = new Date();

    this.routes.forEach(route => {
      // If custom scenario active and this is the selected route, apply custom modifiers
      if (this.currentScenario === 'custom' && route.id === this.selectedRouteId) {
        this.applyCustomModifiersToRoute(route);
      }

      const scoreResult = ApiService.calculateRouteSafetyScore(route.factors, this.isDataStale);
      route.calculatedScore = scoreResult.score;
      route.riskLevel = scoreResult.riskLevel;
      route.riskColor = scoreResult.riskColor;
      route.scoreDeductions = scoreResult.deductions;
      route.scoreBonuses = scoreResult.bonuses;
    });

    const activeRoute = this.getSelectedRoute();
    if (activeRoute) {
      RiskEngine.updateRouteState({
        score: activeRoute.calculatedScore,
        riskLevel: activeRoute.riskLevel,
        name: activeRoute.name
      });
    }
  },

  applyCustomModifiersToRoute(route) {
    const { rainfallMm, visibilityMeters, congestionIndex, hazardCount } = this.customModifiers;

    // Weather penalty calculation
    let wPen = 0;
    if (rainfallMm > 20) wPen += 18;
    else if (rainfallMm > 8) wPen += 10;
    else if (rainfallMm > 2) wPen += 4;

    if (visibilityMeters < 500) wPen += 16;
    else if (visibilityMeters < 1500) wPen += 8;
    route.factors.weather.penalty = wPen;
    route.factors.weather.rainfallMm = rainfallMm;
    route.factors.weather.visibilityMeters = visibilityMeters;

    // Traffic penalty calculation
    let tPen = Math.round((congestionIndex / 100) * 25);
    route.factors.traffic.penalty = tPen;
    route.factors.traffic.congestionIndex = congestionIndex;

    // Hazard penalty
    route.factors.hazards.penalty = hazardCount * 8;
    route.factors.hazards.hazardCount = hazardCount;
  },

  getSelectedRoute() {
    return this.routes.find(r => r.id === this.selectedRouteId) || this.routes[0];
  },

  selectRoute(routeId) {
    if (this.selectedRouteId === routeId) return;
    this.selectedRouteId = routeId;
    const route = this.getSelectedRoute();

    this.renderRouteCards();
    this.renderWeatherPanel();
    this.renderRecommendations();

    IncidentLogger.log(
      'Active Route Changed',
      'INFO',
      `Switched navigation corridor to: ${route.name} (Safety Score: ${route.calculatedScore}/100)`
    );

    // Update map route display
    MapManager.setActiveRoute(route);

    RiskEngine.updateRouteState({
      score: route.calculatedScore,
      riskLevel: route.riskLevel,
      name: route.name
    });
  },

  setScenario(scenarioKey) {
    this.currentScenario = scenarioKey;

    if (scenarioKey === 'monsoon') {
      this.routes = ApiService.getPredefinedRoutes();
      this.routes[1].factors.weather.rainfallMm = 28.5;
      this.routes[1].factors.weather.visibilityMeters = 600;
      this.routes[1].factors.weather.penalty = 28;
      this.routes[1].factors.road.penalty = 26;
      this.routes[1].factors.hazards.penalty = 24;
    } else if (scenarioKey === 'clear') {
      this.routes = ApiService.getPredefinedRoutes();
      this.routes.forEach(r => {
        r.factors.weather.rainfallMm = 0;
        r.factors.weather.visibilityMeters = 5000;
        r.factors.weather.penalty = 2;
        r.factors.hazards.penalty = 2;
        r.factors.road.penalty = 2;
      });
    } else if (scenarioKey === 'fog') {
      this.routes = ApiService.getPredefinedRoutes();
      this.routes[0].factors.weather.visibilityMeters = 400;
      this.routes[0].factors.weather.penalty = 22;
      this.routes[1].factors.weather.visibilityMeters = 250;
      this.routes[1].factors.weather.penalty = 30;
    } else if (scenarioKey === 'gridlock') {
      this.routes = ApiService.getPredefinedRoutes();
      this.routes[0].factors.traffic.congestionIndex = 88;
      this.routes[0].factors.traffic.penalty = 24;
      this.routes[1].factors.traffic.congestionIndex = 42;
      this.routes[1].factors.traffic.penalty = 10;
    }

    this.recalculateAllScores();
    this.renderRouteCards();
    this.renderWeatherPanel();
    this.renderRecommendations();

    // Update scenario button styling
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-scenario') === scenarioKey);
    });

    const activeRoute = this.getSelectedRoute();
    MapManager.setActiveRoute(activeRoute);

    IncidentLogger.log(
      'Hazard Scenario Applied',
      'WARNING',
      `Applied weather/traffic simulation scenario: [${scenarioKey.toUpperCase()}]. Route safety recalculated.`
    );
  },

  toggleStaleData(isStale) {
    this.isDataStale = isStale;
    this.recalculateAllScores();
    this.renderRouteCards();
    this.renderWeatherPanel();

    IncidentLogger.log(
      isStale ? 'Telemetry Link Degraded' : 'Telemetry Link Restored',
      isStale ? 'WARNING' : 'INFO',
      isStale ? 'Weather/Traffic sensor feed timeout: applying +15 uncertainty risk penalty.' : 'Telemetry feed verified live.'
    );
  },

  renderRouteCards() {
    const container = document.getElementById('routeAlternativesContainer');
    if (!container) return;

    // Check if alternative route recommendation is warranted
    const activeRoute = this.getSelectedRoute();
    const otherRoute = this.routes.find(r => r.id !== this.selectedRouteId);
    let recommendationNotice = '';

    if (otherRoute && otherRoute.calculatedScore > activeRoute.calculatedScore + 12) {
      recommendationNotice = `
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--emerald-safe); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 0.75rem; color: #6EE7B7; display: flex; align-items: center; justify-content: space-between;">
          <span>💡 <b>Reroute Advisory:</b> ${otherRoute.name} is currently <b>+${otherRoute.calculatedScore - activeRoute.calculatedScore} points safer</b> due to lower flood/traffic hazards.</span>
          <button id="btnApplyReroute" class="btn btn-sm btn-cyan" style="padding: 2px 8px; font-size: 0.7rem;">SWITCH</button>
        </div>
      `;
    }

    container.innerHTML = recommendationNotice + this.routes.map(route => {
      const isSelected = route.id === this.selectedRouteId;
      let scoreClass = 'score-high';
      if (route.calculatedScore < 50) scoreClass = 'score-low';
      else if (route.calculatedScore < 75) scoreClass = 'score-med';

      const f = route.factors;

      return `
        <div class="route-card ${isSelected ? 'selected' : ''}" data-route-id="${route.id}">
          <div class="route-card-header">
            <div>
              <div class="route-name">
                ${isSelected ? '📍 ' : ''}${route.name}
              </div>
              <div style="font-size: 0.7rem; color: var(--cyan-primary); text-transform: uppercase; font-family: var(--font-mono); margin-top: 2px;">
                ${route.type} • ${route.tag}
              </div>
            </div>
            <div class="safety-score-pill ${scoreClass}">
              ${route.calculatedScore} <span style="font-size: 0.7rem; opacity: 0.8;">/ 100</span>
            </div>
          </div>

          <div class="route-quick-stats">
            <span>📏 ${route.distanceKm} km</span>
            <span>⏱️ ${route.normalDurationMins}m (est)</span>
            <span>🚦 Delay +${f.traffic.delayMins || 0}m</span>
            <span>⚠️ ${f.hazards.hazardCount} Hazards</span>
          </div>

          <!-- Transparent Factor Breakdown Bars -->
          <div class="factor-breakdown-list">
            <div class="factor-row">
              <span class="factor-label">🌦️ Weather Factor</span>
              <div class="factor-score-bar-wrap">
                <div class="factor-score-bar">
                  <div class="factor-score-fill" style="width: ${Math.max(5, 100 - f.weather.penalty * 3)}%; background: ${f.weather.penalty > 15 ? 'var(--crimson-danger)' : 'var(--emerald-safe)'};"></div>
                </div>
                <span class="factor-score-val" style="color: ${f.weather.penalty > 15 ? '#F87171' : '#34D399'}">-${f.weather.penalty}</span>
              </div>
            </div>

            <div class="factor-row">
              <span class="factor-label">🛣️ Road Quality</span>
              <div class="factor-score-bar-wrap">
                <div class="factor-score-bar">
                  <div class="factor-score-fill" style="width: ${Math.max(5, 100 - f.road.penalty * 3)}%; background: ${f.road.penalty > 15 ? 'var(--crimson-danger)' : 'var(--emerald-safe)'};"></div>
                </div>
                <span class="factor-score-val" style="color: ${f.road.penalty > 15 ? '#F87171' : '#34D399'}">-${f.road.penalty}</span>
              </div>
            </div>

            <div class="factor-row">
              <span class="factor-label">🚗 Traffic Flow</span>
              <div class="factor-score-bar-wrap">
                <div class="factor-score-bar">
                  <div class="factor-score-fill" style="width: ${Math.max(5, 100 - f.traffic.penalty * 3)}%; background: ${f.traffic.penalty > 15 ? 'var(--crimson-danger)' : 'var(--emerald-safe)'};"></div>
                </div>
                <span class="factor-score-val" style="color: ${f.traffic.penalty > 15 ? '#F87171' : '#34D399'}">-${f.traffic.penalty}</span>
              </div>
            </div>

            <div class="factor-row">
              <span class="factor-label">⚠️ Active Hazards</span>
              <div class="factor-score-bar-wrap">
                <div class="factor-score-bar">
                  <div class="factor-score-fill" style="width: ${Math.max(5, 100 - f.hazards.penalty * 3)}%; background: ${f.hazards.penalty > 15 ? 'var(--crimson-danger)' : 'var(--emerald-safe)'};"></div>
                </div>
                <span class="factor-score-val" style="color: ${f.hazards.penalty > 15 ? '#F87171' : '#34D399'}">-${f.hazards.penalty}</span>
              </div>
            </div>

            <div class="factor-row">
              <span class="factor-label">🏥 Emergency Access Bonus</span>
              <div class="factor-score-bar-wrap">
                <div class="factor-score-bar">
                  <div class="factor-score-fill" style="width: ${f.emergencyAccess.bonus * 10}%; background: var(--cyan-primary);"></div>
                </div>
                <span class="factor-score-val" style="color: #38BDF8">+${f.emergencyAccess.bonus}</span>
              </div>
            </div>
          </div>

          <!-- Why Route Receives Score (Detailed Audit Box) -->
          <div class="score-explanation-box">
            <div><b>Scoring Audit Breakdown:</b> Base: 100</div>
            <div>• Weather: <span class="penalty-tag">-${f.weather.penalty}</span> (${f.weather.explanation})</div>
            <div>• Road Surface: <span class="penalty-tag">-${f.road.penalty}</span> (${f.road.explanation})</div>
            <div>• Traffic & Delays: <span class="penalty-tag">-${f.traffic.penalty}</span> (${f.traffic.explanation})</div>
            <div>• Hazards Detected: <span class="penalty-tag">-${f.hazards.penalty}</span> (${f.hazards.explanation})</div>
            <div>• Emergency Proximity: <span class="bonus-tag">+${f.emergencyAccess.bonus}</span> (${f.emergencyAccess.explanation})</div>
            ${this.isDataStale ? '<div style="color: #F87171;">• Sensor Link Stale: <span class="penalty-tag">-15</span> (Uncertainty penalty applied)</div>' : ''}
          </div>
        </div>
      `;
    }).join('');

    // Re-bind route selection click
    container.querySelectorAll('.route-card').forEach(card => {
      card.addEventListener('click', () => {
        const routeId = card.getAttribute('data-route-id');
        this.selectRoute(routeId);
      });
    });

    const rerouteBtn = document.getElementById('btnApplyReroute');
    if (rerouteBtn && otherRoute) {
      rerouteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectRoute(otherRoute.id);
      });
    }
  },

  renderWeatherPanel() {
    const route = this.getSelectedRoute();
    const w = route.factors.weather;
    const r = route.factors.road;
    const t = route.factors.traffic;

    const rainEl = document.getElementById('weatherStatRain');
    const visEl = document.getElementById('weatherStatVis');
    const floodEl = document.getElementById('weatherStatFlood');
    const closuresEl = document.getElementById('weatherStatClosures');
    const trafficEl = document.getElementById('weatherStatTraffic');
    const surfaceEl = document.getElementById('weatherStatSurface');

    if (rainEl) rainEl.textContent = `${w.rainfallMm} mm/h`;
    if (visEl) visEl.textContent = `${w.visibilityMeters} m`;
    if (floodEl) floodEl.textContent = w.rainfallMm > 15 ? 'HIGH RISK' : 'LOW RISK';
    if (closuresEl) closuresEl.textContent = `${r.activeClosures} active`;
    if (trafficEl) trafficEl.textContent = `${t.congestionIndex}%`;
    if (surfaceEl) surfaceEl.textContent = r.pavementQuality.split(' ')[0] || 'Asphalt';
  },

  renderRecommendations() {
    const container = document.getElementById('driverAdvisoriesContainer');
    if (!container) return;

    const route = this.getSelectedRoute();
    const w = route.factors.weather;
    const r = route.factors.road;
    const t = route.factors.traffic;
    const h = route.factors.hazards;

    const advisories = [];

    if (w.visibilityMeters < 800) {
      advisories.push({
        type: 'urgent',
        icon: '🌫️',
        text: `Severe low visibility (${w.visibilityMeters}m). <b>Advisory:</b> Reduce cruising speed below 40 km/h, activate dipped headlights and hazard beacons.`
      });
    }

    if (w.rainfallMm > 15) {
      advisories.push({
        type: 'urgent',
        icon: '🌊',
        text: `Torrential rainfall detected (${w.rainfallMm} mm/h). Risk of hydroplaning and lowland culvert waterlogging. Maintain 4+ seconds brake buffer.`
      });
    }

    if (r.activeClosures > 0) {
      advisories.push({
        type: 'warn',
        icon: '🚧',
        text: `Partial lane closure active near km 21. Single lane merge in effect. Do not attempt overtaking.`
      });
    }

    if (t.congestionIndex > 65) {
      advisories.push({
        type: 'warn',
        icon: '🚦',
        text: `Heavy congestion (${t.congestionIndex}% index). Anticipate abrupt braking ahead. Engage retarder brake.`
      });
    }

    if (advisories.length === 0) {
      advisories.push({
        type: 'info',
        icon: '🛡️',
        text: `Corridor conditions optimal on ${route.name}. Maintain standard defensive driving and scheduled check-ins.`
      });
    }

    // Always append nearest safe rest station
    advisories.push({
      type: 'info',
      icon: '🅿️',
      text: `Authorized Safe Haven: <b>Highway Rest Bay Exit 14</b> (km 32.4) equipped with emergency telephone and service depot.`
    });

    container.innerHTML = advisories.map(adv => `
      <div class="advisory-item ${adv.type}">
        <span class="advisory-icon">${adv.icon}</span>
        <div>${adv.text}</div>
      </div>
    `).join('');
  },

  bindEvents() {
    // Preset Route buttons
    const presetChips = document.querySelectorAll('.preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const origin = e.target.getAttribute('data-origin');
        const dest = e.target.getAttribute('data-dest');
        const originInput = document.getElementById('inputOrigin');
        const destInput = document.getElementById('inputDestination');
        if (originInput) originInput.value = origin;
        if (destInput) destInput.value = dest;

        IncidentLogger.log('Route Search Updated', 'INFO', `Origin: ${origin} | Destination: ${dest}`);
      });
    });

    // Swap locations button
    const btnSwap = document.getElementById('btnSwapLocations');
    if (btnSwap) {
      btnSwap.addEventListener('click', () => {
        const originInput = document.getElementById('inputOrigin');
        const destInput = document.getElementById('inputDestination');
        if (originInput && destInput) {
          const tmp = originInput.value;
          originInput.value = destInput.value;
          destInput.value = tmp;
        }
      });
    }

    // Scenario selection buttons
    const scenarioBtns = document.querySelectorAll('.scenario-btn');
    scenarioBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scenario = e.currentTarget.getAttribute('data-scenario');
        if (scenario) this.setScenario(scenario);
      });
    });

    // Custom Sliders
    const sliderRain = document.getElementById('sliderRain');
    const sliderVis = document.getElementById('sliderVisibility');
    const sliderTraf = document.getElementById('sliderTraffic');
    const sliderHaz = document.getElementById('sliderHazards');

    const updateFromSliders = () => {
      this.currentScenario = 'custom';
      this.customModifiers.rainfallMm = parseFloat(sliderRain?.value || 0);
      this.customModifiers.visibilityMeters = parseInt(sliderVis?.value || 3000);
      this.customModifiers.congestionIndex = parseInt(sliderTraf?.value || 30);
      this.customModifiers.hazardCount = parseInt(sliderHaz?.value || 1);

      const valRainEl = document.getElementById('valSliderRain');
      const valVisEl = document.getElementById('valSliderVis');
      const valTrafEl = document.getElementById('valSliderTraf');
      const valHazEl = document.getElementById('valSliderHaz');

      if (valRainEl) valRainEl.textContent = `${this.customModifiers.rainfallMm} mm/h`;
      if (valVisEl) valVisEl.textContent = `${this.customModifiers.visibilityMeters} m`;
      if (valTrafEl) valTrafEl.textContent = `${this.customModifiers.congestionIndex}%`;
      if (valHazEl) valHazEl.textContent = `${this.customModifiers.hazardCount}`;

      this.recalculateAllScores();
      this.renderRouteCards();
      this.renderWeatherPanel();
      this.renderRecommendations();
      MapManager.setActiveRoute(this.getSelectedRoute());
    };

    if (sliderRain) sliderRain.addEventListener('input', updateFromSliders);
    if (sliderVis) sliderVis.addEventListener('input', updateFromSliders);
    if (sliderTraf) sliderTraf.addEventListener('input', updateFromSliders);
    if (sliderHaz) sliderHaz.addEventListener('input', updateFromSliders);

    // Stale data checkbox
    const chkStale = document.getElementById('chkStaleData');
    if (chkStale) {
      chkStale.addEventListener('change', (e) => this.toggleStaleData(e.target.checked));
    }
  }
};
