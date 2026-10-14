/**
 * =====================================================================
 * MASTER APPLICATION ORCHESTRATOR
 * AI Driver Safety & Smart Route Safety System (v2.0)
 * =====================================================================
 */

import { EmergencySystem } from './emergency-system.js';
import { IncidentLogger } from './incident-logger.js';
import { DriverMonitor } from './driver-monitor.js';
import { RouteSafety } from './route-safety.js';
import { MapManager } from './map-manager.js';
import { RiskEngine } from './risk-engine.js';
import { ApiService } from './api-service.js';
import { Navigation } from './navigation.js';

// Expose modules globally for cross-interaction & debugging
window.EmergencySystem = EmergencySystem;
window.IncidentLogger = IncidentLogger;
window.DriverMonitor = DriverMonitor;
window.RouteSafety = RouteSafety;
window.MapManager = MapManager;
window.RiskEngine = RiskEngine;
window.ApiService = ApiService;
window.Navigation = Navigation;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing AI Driver Safety & Smart Route Safety System...');

  // 1. Initialize Emergency System & Web Audio
  EmergencySystem.init();

  // 2. Initialize Incident Audit Logger
  IncidentLogger.init();

  // 3. Initialize Route Analytics & Multi-factor Scoring
  RouteSafety.init();

  // 4. Initialize Leaflet Map & GPS Telemetry
  MapManager.init();
  MapManager.setActiveRoute(RouteSafety.getSelectedRoute());

  // 5. Initialize Driver Fatigue Vision Analytics
  DriverMonitor.init();

  // 6. Initialize Multi-Screen Navigation
  Navigation.init();

  // 7. Bind Application Clocks & Top Bar
  startHeaderClocks();

  // 8. Bind Information & External Services Modals
  bindAppModals();

  console.log('AI Driver Safety & Route Monitoring System ready in Multi-Screen Mode.');
});

function startHeaderClocks() {
  const clockEl = document.getElementById('headerClock');
  const uptimeEl = document.getElementById('headerUptime');
  const startTime = Date.now();

  const updateClocks = () => {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString([], { hour12: false });
    }
    if (uptimeEl) {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      uptimeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  };

  updateClocks();
  setInterval(updateClocks, 1000);
}

function bindAppModals() {
  // External API Guide Modal
  const btnApiModal = document.getElementById('btnOpenApiModal');
  const modalApi = document.getElementById('modalApiGuide');
  const btnCloseApi = document.getElementById('btnCloseApiModal');

  if (btnApiModal && modalApi) {
    btnApiModal.addEventListener('click', () => modalApi.classList.add('active'));
  }
  if (btnCloseApi && modalApi) {
    btnCloseApi.addEventListener('click', () => modalApi.classList.remove('active'));
  }

  // Safety Disclaimers Modal
  const btnDisclaimersModal = document.getElementById('btnOpenDisclaimersModal');
  const modalDisclaimers = document.getElementById('modalDisclaimers');
  const btnCloseDisclaimers = document.getElementById('btnCloseDisclaimersModal');

  if (btnDisclaimersModal && modalDisclaimers) {
    btnDisclaimersModal.addEventListener('click', () => modalDisclaimers.classList.add('active'));
  }
  if (btnCloseDisclaimers && modalDisclaimers) {
    btnCloseDisclaimers.addEventListener('click', () => modalDisclaimers.classList.remove('active'));
  }

  // Close modals on clicking overlay backdrop
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
}
