/**
 * =====================================================================
 * MAP MANAGER & LIVE GPS MONITORING SYSTEM
 * AI Driver Safety & Bus Monitoring System
 * =====================================================================
 * High-tech Leaflet map controller, animated vehicle telemetry,
 * dynamic hazard markers, and device geolocation integration.
 */

import { IncidentLogger } from './incident-logger.js';

export const MapManager = {
  map: null,
  activeRoute: null,
  routePolyline: null,
  altPolyline: null,
  busMarker: null,
  hazardLayerGroup: null,
  deviceMarker: null,
  deviceAccuracyCircle: null,

  // Animation playback state
  isPlaying: true,
  playSpeed: 1, // 1x, 2x, 5x
  routeProgress: 0.15, // 0.0 to 1.0
  animTimer: null,
  watchId: null,

  // Simulated vehicle metrics
  busTelemetry: {
    id: 'BUS-104',
    lat: 17.4399,
    lng: 78.3908,
    speedKmh: 54,
    heading: 345,
    gpsMode: 'SIMULATED', // 'SIMULATED' or 'DEVICE_GPS'
    accuracyM: 3.2
  },

  init() {
    this.initLeaflet();
    this.bindEvents();
  },

  initLeaflet() {
    const mapContainer = document.getElementById('leafletMap');
    if (!mapContainer || !window.L) {
      console.warn('Leaflet or map container not ready');
      return;
    }

    // Initialize Leaflet map
    this.map = L.map('leafletMap', {
      zoomControl: false,
      attributionControl: true
    }).setView([17.48, 78.36], 12);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Standard OpenStreetMap tiles (styled with dark cyber filter in CSS)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors | Simulated Fleet Telemetry'
    }).addTo(this.map);

    this.hazardLayerGroup = L.layerGroup().addTo(this.map);

    // Create Bus Marker
    const busIcon = L.divIcon({
      className: 'custom-bus-marker-container',
      html: `
        <div class="custom-bus-marker" id="leafletBusMarker">
          <div class="bus-marker-icon" id="busIconRotator">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div class="bus-marker-label" id="busMarkerLabel">BUS-104 • 54 km/h</div>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 25]
    });

    this.busMarker = L.marker([17.4399, 78.3908], { icon: busIcon }).addTo(this.map);

    // Start animated vehicle loop
    this.startAnimationLoop();
  },

  setActiveRoute(route) {
    this.activeRoute = route;
    if (!this.map) return;

    // Remove existing polylines
    if (this.routePolyline) this.map.removeLayer(this.routePolyline);
    if (this.altPolyline) this.map.removeLayer(this.altPolyline);

    // Draw active glowing line
    this.routePolyline = L.polyline(route.waypoints, {
      color: '#06B6D4',
      weight: 5,
      opacity: 0.9,
      smoothFactor: 1
    }).addTo(this.map);

    // Draw alternate route faintly
    if (window.RouteSafety && window.RouteSafety.routes) {
      const alt = window.RouteSafety.routes.find(r => r.id !== route.id);
      if (alt && alt.waypoints) {
        this.altPolyline = L.polyline(alt.waypoints, {
          color: '#F59E0B',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.55
        }).addTo(this.map);
      }
    }

    // Fit bounds smoothly
    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [40, 40] });

    // Render hazards for this route
    this.renderHazards(route);
  },

  renderHazards(route) {
    if (!this.hazardLayerGroup) return;
    this.hazardLayerGroup.clearLayers();

    const hazards = route.factors?.hazards?.hazardsList || [];

    hazards.forEach((hazard, idx) => {
      // Place hazard along route waypoints
      const wpIndex = Math.min(route.waypoints.length - 2, 2 + idx * 2);
      const coord = route.waypoints[wpIndex] || route.waypoints[1];

      let iconClass = 'hazard-flood';
      let iconEmoji = '🌊';
      if (hazard.type === 'construction') {
        iconClass = 'hazard-construction';
        iconEmoji = '🚧';
      } else if (hazard.type === 'fog') {
        iconClass = 'hazard-fog';
        iconEmoji = '🌫️';
      } else if (hazard.type === 'traffic') {
        iconClass = 'hazard-traffic';
        iconEmoji = '🚦';
      }

      const hazardIcon = L.divIcon({
        className: 'hazard-icon-wrapper',
        html: `
          <div class="custom-hazard-marker ${iconClass}" title="${hazard.label}">
            ${iconEmoji}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(coord, { icon: hazardIcon }).addTo(this.hazardLayerGroup);

      marker.bindPopup(`
        <div class="popup-title">${iconEmoji} ${hazard.label}</div>
        <div class="popup-desc">
          <b>Severity:</b> ${hazard.severity}<br>
          <b>Location:</b> km marker ${hazard.kmMarker}<br>
          <b>Advisory:</b> Maintain caution and monitor speed.
        </div>
      `);

      // If flood or severe hazard, draw alert radius circle
      if (hazard.type === 'flood') {
        L.circle(coord, {
          radius: 450,
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.22,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(this.hazardLayerGroup);
      }
    });
  },

  startAnimationLoop() {
    clearInterval(this.animTimer);
    this.animTimer = setInterval(() => {
      if (!this.isPlaying || !this.activeRoute || !this.activeRoute.waypoints) return;

      // Increment progress
      const step = 0.003 * this.playSpeed;
      this.routeProgress += step;
      if (this.routeProgress >= 1.0) {
        this.routeProgress = 0.0; // Loop around route
      }

      this.updateBusPositionFromProgress(this.routeProgress);
      this.updateProgressUI();
    }, 100);
  },

  updateBusPositionFromProgress(progress) {
    if (!this.activeRoute || !this.activeRoute.waypoints) return;

    const wps = this.activeRoute.waypoints;
    const totalSegments = wps.length - 1;
    const exactIndex = progress * totalSegments;
    const segIndex = Math.min(totalSegments - 1, Math.floor(exactIndex));
    const segFraction = exactIndex - segIndex;

    const p1 = wps[segIndex];
    const p2 = wps[segIndex + 1];

    // Linear interpolation
    const curLat = p1[0] + (p2[0] - p1[0]) * segFraction;
    const curLng = p1[1] + (p2[1] - p1[1]) * segFraction;

    // Calculate heading angle
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    let headingDeg = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI);
    if (headingDeg < 0) headingDeg += 360;

    this.busTelemetry.lat = +curLat.toFixed(5);
    this.busTelemetry.lng = +curLng.toFixed(5);
    this.busTelemetry.heading = headingDeg;

    // Vary speed based on route congestion
    const baseSpeed = this.activeRoute.factors.traffic.congestionIndex > 60 ? 34 : 58;
    this.busTelemetry.speedKmh = Math.round(baseSpeed + Math.sin(progress * 15) * 6);

    if (this.busMarker) {
      this.busMarker.setLatLng([curLat, curLng]);

      const rotator = document.getElementById('busIconRotator');
      if (rotator) {
        rotator.style.transform = `rotate(${headingDeg}deg)`;
      }

      const label = document.getElementById('busMarkerLabel');
      if (label) {
        label.textContent = `${this.busTelemetry.id} • ${this.busTelemetry.speedKmh} km/h`;
      }
    }

    this.updateGpsHud();
  },

  updateProgressUI() {
    const fill = document.getElementById('routeProgressFill');
    const label = document.getElementById('routeProgressPct');
    const pct = Math.round(this.routeProgress * 100);

    if (fill) fill.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}% Completed`;
  },

  updateGpsHud() {
    const latEl = document.getElementById('gpsValLat');
    const lngEl = document.getElementById('gpsValLng');
    const speedEl = document.getElementById('gpsValSpeed');
    const headEl = document.getElementById('gpsValHeading');
    const modeEl = document.getElementById('gpsStatusMode');

    if (latEl) latEl.textContent = `${this.busTelemetry.lat.toFixed(4)}° N`;
    if (lngEl) lngEl.textContent = `${this.busTelemetry.lng.toFixed(4)}° E`;
    if (speedEl) speedEl.textContent = `${this.busTelemetry.speedKmh} km/h`;
    if (headEl) headEl.textContent = `${this.busTelemetry.heading}°`;

    if (modeEl) {
      if (this.busTelemetry.gpsMode === 'DEVICE_GPS') {
        modeEl.textContent = 'LIVE DEVICE GPS (Active)';
        modeEl.className = 'gps-status-indicator live-device';
      } else {
        modeEl.textContent = 'SIMULATED TELEMETRY';
        modeEl.className = 'gps-status-indicator simulated';
      }
    }
  },

  /**
   * Acquire live device geolocation after explicit permission
   */
  requestDeviceLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation API is not supported by your browser.');
      return;
    }

    const btn = document.getElementById('btnAcquireDeviceLocation');
    if (btn) btn.textContent = 'Acquiring GPS...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        this.busTelemetry.gpsMode = 'DEVICE_GPS';
        this.busTelemetry.accuracyM = Math.round(accuracy);

        // Place or update device marker
        if (this.deviceMarker) {
          this.deviceMarker.setLatLng([latitude, longitude]);
        } else {
          const deviceIcon = L.divIcon({
            className: 'device-marker-wrap',
            html: `<div class="user-device-marker" title="Your Device Location (Live GPS)"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          this.deviceMarker = L.marker([latitude, longitude], { icon: deviceIcon }).addTo(this.map);
          this.deviceMarker.bindPopup(`
            <div class="popup-title">📱 Your Device Location</div>
            <div class="popup-desc">
              <b>Source:</b> Live Browser Geolocation<br>
              <b>Accuracy:</b> ±${Math.round(accuracy)} meters<br>
              <b>Lat / Lng:</b> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}
            </div>
          `);
        }

        // Draw accuracy circle
        if (this.deviceAccuracyCircle) {
          this.deviceAccuracyCircle.setLatLng([latitude, longitude]);
          this.deviceAccuracyCircle.setRadius(accuracy);
        } else {
          this.deviceAccuracyCircle = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.15,
            weight: 1
          }).addTo(this.map);
        }

        this.map.panTo([latitude, longitude]);
        this.updateGpsHud();

        if (btn) btn.textContent = 'Device GPS Active (±' + Math.round(accuracy) + 'm)';

        IncidentLogger.log(
          'Device GPS Verified',
          'INFO',
          `Client device GPS acquired: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)} (Accuracy: ±${Math.round(accuracy)}m).`
        );
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not acquire device location: ' + err.message + '. Simulated vehicle telemetry remains active.');
        if (btn) btn.textContent = 'Acquire Device Location';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  },

  bindEvents() {
    // Play / Pause button
    const btnPlayPause = document.getElementById('btnMapPlayPause');
    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        btnPlayPause.innerHTML = this.isPlaying ? '⏸️' : '▶️';
        btnPlayPause.title = this.isPlaying ? 'Pause Simulation' : 'Play Simulation';
      });
    }

    // Speed multiplier button
    const btnSpeed = document.getElementById('btnMapSpeed');
    if (btnSpeed) {
      btnSpeed.addEventListener('click', () => {
        if (this.playSpeed === 1) this.playSpeed = 2;
        else if (this.playSpeed === 2) this.playSpeed = 5;
        else this.playSpeed = 1;

        btnSpeed.textContent = `${this.playSpeed}x`;
      });
    }

    // Route progress scrubber
    const progressTrack = document.getElementById('routeProgressTrack');
    if (progressTrack) {
      progressTrack.addEventListener('click', (e) => {
        const rect = progressTrack.getBoundingClientRect();
        const clickFraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.routeProgress = clickFraction;
        this.updateBusPositionFromProgress(this.routeProgress);
        this.updateProgressUI();
      });
    }

    // Device location button
    const btnDeviceLoc = document.getElementById('btnAcquireDeviceLocation');
    if (btnDeviceLoc) {
      btnDeviceLoc.addEventListener('click', () => this.requestDeviceLocation());
    }

    // Recenter map on bus
    const btnRecenter = document.getElementById('btnRecenterBus');
    if (btnRecenter) {
      btnRecenter.addEventListener('click', () => {
        if (this.map && this.busMarker) {
          this.map.panTo(this.busMarker.getLatLng());
        }
      });
    }
  }
};
