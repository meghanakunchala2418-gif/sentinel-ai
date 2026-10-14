/**
 * =====================================================================
 * RISK ENGINE & COMPOSITE TRIP MATRIX
 * AI Driver Safety & Bus Monitoring System
 * =====================================================================
 * Evaluates both Driver Drowsiness Risk and Route Environmental Risk
 * separately and generates a composite trip risk assessment without
 * obscuring or conflating either individual score.
 */

export const RiskEngine = {
  driverState: {
    status: 'ATTENTIVE',
    fatigueScore: 12,
    ear: 0.32
  },
  routeState: {
    score: 88,
    riskLevel: 'Low Risk',
    name: 'NH-44 Express Highway',
    weatherHazard: 'Clear to Light Overcast',
    roadHazard: 'Optimal Asphalt',
    trafficHazard: 'Minor Slowdown'
  },

  updateDriverState(driverData) {
    this.driverState = { ...this.driverState, ...driverData };
    this.evaluateCompositeRisk();
  },

  updateRouteState(routeData) {
    this.routeState = { ...this.routeState, ...routeData };
    this.evaluateCompositeRisk();
  },

  evaluateCompositeRisk() {
    // 1. Individual Driver Risk Assessment (0 - 100, where 100 is maximum danger)
    const driverFatigue = this.driverState.fatigueScore;
    let driverRiskGrade = 'Low';
    let driverColor = 'var(--emerald-safe)';
    if (driverFatigue >= 75 || this.driverState.status === 'CRITICAL_MICROSLEEP') {
      driverRiskGrade = 'CRITICAL';
      driverColor = 'var(--crimson-danger)';
    } else if (driverFatigue >= 35 || this.driverState.status === 'DROWSY') {
      driverRiskGrade = 'Moderate';
      driverColor = 'var(--amber-warn)';
    }

    // 2. Individual Route Safety Score (0 - 100, where 100 is safest)
    const routeScore = this.routeState.score;
    let routeRiskGrade = 'Low Risk';
    let routeColor = 'var(--emerald-safe)';
    if (routeScore < 40) {
      routeRiskGrade = 'Critical Route Risk';
      routeColor = 'var(--crimson-danger)';
    } else if (routeScore < 65) {
      routeRiskGrade = 'Elevated Route Risk';
      routeColor = 'var(--amber-warn)';
    } else if (routeScore < 85) {
      routeRiskGrade = 'Moderate Route Risk';
      routeColor = 'var(--amber-warn)';
    }

    // 3. Composite Assessment Matrix
    let compositeTitle = 'OPTIMAL OVERALL TRIP STATUS';
    let compositeDesc = 'Driver is alert and attentive. Route conditions are favorable with low hazard indicators.';
    let compositeClass = 'composite-verdict';

    if (driverRiskGrade === 'CRITICAL') {
      compositeTitle = 'CRITICAL TRIP ALERT: DRIVER UNRESPONSIVE';
      compositeDesc = 'URGENT: Critical micro-sleep / driver impairment detected. Immediate stop at nearest safe location or terminal bay mandated.';
      compositeClass = 'composite-verdict critical';
    } else if (driverRiskGrade === 'Moderate' && routeScore < 65) {
      compositeTitle = 'HIGH COMPOUND RISK: FATIGUE + HAZARDOUS ROUTE';
      compositeDesc = 'Caution: Driver exhibits elevated fatigue while traversing high-risk road/weather conditions. Recommend alternate route and immediate driver handover.';
      compositeClass = 'composite-verdict critical';
    } else if (driverRiskGrade === 'Moderate') {
      compositeTitle = 'MODERATE TRIP RISK: DRIVER FATIGUE ELEVATED';
      compositeDesc = 'Route is safe, but driver exhibits frequent blinking or yawning. Schedule rest stop within next 15 minutes.';
      compositeClass = 'composite-verdict warning';
    } else if (routeScore < 65) {
      compositeTitle = 'ELEVATED ROUTE RISK: ADVERSE ROAD HAZARDS';
      compositeDesc = 'Driver is attentive, but route conditions present heavy rain, flood risk, or congestion. Reduce speed appropriately.';
      compositeClass = 'composite-verdict warning';
    }

    this.renderUI(driverRiskGrade, driverFatigue, driverColor, routeRiskGrade, routeScore, routeColor, compositeTitle, compositeDesc, compositeClass);
  },

  renderUI(driverGrade, driverVal, driverColor, routeGrade, routeScore, routeColor, compTitle, compDesc, compClass) {
    // Driver Risk Meter
    const driverGradeEl = document.getElementById('compositeDriverGrade');
    const driverValEl = document.getElementById('compositeDriverVal');
    const driverBarEl = document.getElementById('compositeDriverBar');

    if (driverGradeEl) {
      driverGradeEl.textContent = driverGrade;
      driverGradeEl.style.color = driverColor;
    }
    if (driverValEl) driverValEl.textContent = `Fatigue: ${driverVal}%`;
    if (driverBarEl) {
      driverBarEl.style.width = `${Math.min(100, driverVal)}%`;
      driverBarEl.style.background = driverColor;
    }

    // Route Risk Meter
    const routeGradeEl = document.getElementById('compositeRouteGrade');
    const routeValEl = document.getElementById('compositeRouteVal');
    const routeBarEl = document.getElementById('compositeRouteBar');

    if (routeGradeEl) {
      routeGradeEl.textContent = routeGrade;
      routeGradeEl.style.color = routeColor;
    }
    if (routeValEl) routeValEl.textContent = `Safety: ${routeScore}/100`;
    if (routeBarEl) {
      routeBarEl.style.width = `${Math.min(100, routeScore)}%`;
      routeBarEl.style.background = routeColor;
    }

    // Composite Box
    const verdictBox = document.getElementById('compositeVerdictBox');
    const verdictTitle = document.getElementById('compositeVerdictTitle');
    const verdictDesc = document.getElementById('compositeVerdictDesc');

    if (verdictBox) verdictBox.className = compClass;
    if (verdictTitle) verdictTitle.textContent = compTitle;
    if (verdictDesc) verdictDesc.textContent = compDesc;
  }
};
