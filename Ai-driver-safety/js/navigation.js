/**
 * =====================================================================
 * MULTI-SCREEN NAVIGATION CONTROLLER
 * SENTINEL AI — Driver Safety & Smart Route Fleet Control
 * =====================================================================
 * Manages clean screen transitions, sidebar state, breadcrumbs,
 * Leaflet map size invalidation, and Home Dashboard summary synchronization.
 */

export const Navigation = {
  activeScreen: 'home',

  screens: {
    home: 'Home Dashboard',
    gps: 'Live GPS Tracking & Telemetry',
    driver: 'Driver Safety & Vision Analytics',
    routes: 'Route Planning & Safety Scoring',
    weather: 'Weather & Road Hazards',
    incidents: 'Incidents & Audit Reports'
  },

  init() {
    this.bindEvents();
    this.showScreen('home');
    this.startHomeSyncLoop();
  },

  /**
   * Switch active screen without reloading page
   */
  showScreen(screenId) {
    if (!this.screens[screenId]) {
      console.warn(`Screen ID ${screenId} not recognized. Defaulting to home.`);
      screenId = 'home';
    }

    this.activeScreen = screenId;

    // 1. Update Sidebar Active Button
    document.querySelectorAll('.nav-item').forEach(btn => {
      const target = btn.getAttribute('data-screen');
      btn.classList.toggle('active', target === screenId);
    });

    // 2. Hide all screens, show targeted screen
    document.querySelectorAll('.app-screen').forEach(screen => {
      screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    // 3. Update Breadcrumb Title
    const titleEl = document.getElementById('currentScreenTitle');
    if (titleEl) {
      titleEl.textContent = this.screens[screenId];
    }

    // 4. Scroll to top of viewport
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 5. Special Handler: Leaflet Map size re-calculation
    if (screenId === 'gps') {
      setTimeout(() => {
        if (window.MapManager && window.MapManager.map) {
          window.MapManager.map.invalidateSize();
          if (window.MapManager.routePolyline) {
            window.MapManager.map.fitBounds(window.MapManager.routePolyline.getBounds(), { padding: [40, 40] });
          }
        }
      }, 100);
    }

    // 6. Close mobile sidebar drawer if open
    this.closeMobileSidebar();
  },

  /**
   * Keep Home Dashboard KPI summaries synchronized with active simulation data
   */
  startHomeSyncLoop() {
    const sync = () => {
      // 1. Sync Driver State to Home
      if (window.DriverMonitor) {
        const dm = window.DriverMonitor;
        const homeFatigueVal = document.getElementById('homeKpiDriverFatigue');
        const homeDriverStatus = document.getElementById('homeKpiDriverStatus');
        const homeDriverSub = document.getElementById('homeKpiDriverSub');

        if (homeFatigueVal) homeFatigueVal.textContent = `${dm.fatigueScore}%`;
        if (homeDriverStatus) {
          homeDriverStatus.textContent = dm.status.replace('_', ' ');
          if (dm.status === 'ATTENTIVE') {
            homeDriverStatus.className = 'panel-badge badge-live';
          } else if (dm.status === 'DROWSY') {
            homeDriverStatus.className = 'panel-badge badge-warn';
          } else if (dm.status === 'CRITICAL_MICROSLEEP') {
            homeDriverStatus.className = 'panel-badge badge-danger';
          } else {
            homeDriverStatus.className = 'panel-badge badge-simulated';
          }
        }
        if (homeDriverSub) homeDriverSub.textContent = `EAR: ${dm.ear.toFixed(2)} • Blinks: ${dm.blinkRate}/m`;
      }

      // 2. Sync Route State to Home
      if (window.RouteSafety) {
        const rs = window.RouteSafety;
        const activeRoute = rs.getSelectedRoute();
        const homeRouteScore = document.getElementById('homeKpiRouteScore');
        const homeRouteName = document.getElementById('homeKpiRouteName');
        const homeRouteSub = document.getElementById('homeKpiRouteSub');

        if (homeRouteScore && activeRoute) {
          homeRouteScore.textContent = `${activeRoute.calculatedScore}/100`;
          homeRouteScore.style.color = activeRoute.calculatedScore > 75 ? 'var(--emerald-safe)' : (activeRoute.calculatedScore > 50 ? 'var(--amber-warn)' : 'var(--crimson-danger)');
        }
        if (homeRouteName && activeRoute) homeRouteName.textContent = activeRoute.name;
        if (homeRouteSub && activeRoute) homeRouteSub.textContent = `${activeRoute.distanceKm} km • ${activeRoute.normalDurationMins}m est`;
      }

      // 3. Sync GPS / Telemetry to Home
      if (window.MapManager) {
        const mm = window.MapManager;
        const homeSpeed = document.getElementById('homeKpiSpeed');
        const homeGpsCoords = document.getElementById('homeKpiCoords');
        const homeGpsStatus = document.getElementById('homeKpiGpsStatus');

        if (homeSpeed) homeSpeed.textContent = `${mm.busTelemetry.speedKmh} km/h`;
        if (homeGpsCoords) homeGpsCoords.textContent = `${mm.busTelemetry.lat.toFixed(4)}° N, ${mm.busTelemetry.lng.toFixed(4)}° E`;
        if (homeGpsStatus) {
          homeGpsStatus.textContent = mm.busTelemetry.gpsMode === 'DEVICE_GPS' ? 'DEVICE GPS ACTIVE' : 'SIMULATED FIX';
        }
      }

      // 4. Sync Weather Summary to Home
      if (window.RouteSafety) {
        const rs = window.RouteSafety;
        const activeRoute = rs.getSelectedRoute();
        const homeRain = document.getElementById('homeKpiRain');
        const homeVis = document.getElementById('homeKpiVis');
        const homeFlood = document.getElementById('homeKpiFlood');

        if (activeRoute && activeRoute.factors) {
          const w = activeRoute.factors.weather;
          if (homeRain) homeRain.textContent = `${w.rainfallMm} mm/h`;
          if (homeVis) homeVis.textContent = `${w.visibilityMeters} m`;
          if (homeFlood) homeFlood.textContent = w.rainfallMm > 15 ? 'HIGH RISK' : 'LOW RISK';
        }
      }
    };

    sync();
    setInterval(sync, 1000);
  },

  openMobileSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  },

  bindEvents() {
    // Nav items in sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const screenId = e.currentTarget.getAttribute('data-screen');
        if (screenId) this.showScreen(screenId);
      });
    });

    // Quick-action links across screens
    document.querySelectorAll('[data-goto-screen]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const screenId = e.currentTarget.getAttribute('data-goto-screen');
        if (screenId) this.showScreen(screenId);
      });
    });

    // Mobile nav toggle button
    const toggleBtn = document.getElementById('btnMobileNavToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.openMobileSidebar());
    }

    // Sidebar backdrop click closes sidebar
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeMobileSidebar());
    }
  }
};
