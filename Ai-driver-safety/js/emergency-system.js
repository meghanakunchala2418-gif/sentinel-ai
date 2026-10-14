/**
 * =====================================================================
 * EMERGENCY MONITORING & AUDIO ALERT SYSTEM
 * AI Driver Safety & Bus Monitoring System
 * =====================================================================
 * Manages the 15-second responsive emergency countdown, driver acknowledgment,
 * Web Audio API synthesizer for audible alarms, and SOS dispatch protocols.
 */

import { IncidentLogger } from './incident-logger.js';

export const EmergencySystem = {
  countdownSeconds: 15,
  currentCount: 15,
  timerInterval: null,
  isCountdownActive: false,
  isEmergencyTriggered: false,
  audioCtx: null,

  init() {
    this.bindEvents();
  },

  /**
   * Safe Web Audio API synthesizer (No external sound files required)
   */
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  playBeep(frequency = 880, duration = 0.15, type = 'sine') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback not permitted yet (awaiting user interaction):', e);
    }
  },

  playEmergencySiren() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.35);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.7);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Siren audio error:', e);
    }
  },

  playAcknowledgeChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch (e) {
      console.warn('Chime audio error:', e);
    }
  },

  /**
   * Start 15-second emergency countdown
   */
  startCountdown(reason = 'Driver Micro-sleep / Unresponsiveness Detected') {
    if (this.isCountdownActive) return;

    this.isCountdownActive = true;
    this.currentCount = this.countdownSeconds;
    this.updateBannerUI(true, reason);

    IncidentLogger.log(
      'Drowsiness Emergency Countdown',
      'WARNING',
      `15-Second Acknowledgment Countdown initiated: ${reason}`,
      'Route Segment NH-44 km 32'
    );

    this.playBeep(920, 0.2, 'square');

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.currentCount--;
      const countEl = document.getElementById('emergencyCountdownVal');
      if (countEl) countEl.textContent = `${this.currentCount}s`;

      if (this.currentCount > 0) {
        // High urgency beep
        this.playBeep(880 + (15 - this.currentCount) * 25, 0.15, 'square');
      } else {
        // Expired without acknowledgment!
        this.handleCountdownExpired(reason);
      }
    }, 1000);
  },

  /**
   * When driver fails to acknowledge within 15 seconds
   */
  handleCountdownExpired(reason) {
    clearInterval(this.timerInterval);
    this.isCountdownActive = false;
    this.isEmergencyTriggered = true;

    this.playEmergencySiren();

    const banner = document.getElementById('emergencyBannerAlert');
    if (banner) {
      banner.classList.add('active');
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="font-size: 2rem;">🚨</span>
          <div>
            <div style="font-weight: 800; font-size: 1.1rem; letter-spacing: 0.5px;">EMERGENCY SOS DISPATCHED TO FLEET CONTROL</div>
            <div style="font-size: 0.8rem; opacity: 0.9;">Driver unresponsive after 15s alert. Vehicle hazard beacon active. Telemetry broadcast to Central Dispatch.</div>
          </div>
        </div>
        <button id="btnAcknowledgeEmergency" class="btn btn-glass" style="border: 2px solid #FFF; font-weight: 700;">RESET ALERT</button>
      `;
      const btn = document.getElementById('btnAcknowledgeEmergency');
      if (btn) btn.onclick = () => this.driverAcknowledge();
    }

    IncidentLogger.log(
      'EMERGENCY SOS BROADCAST',
      'EMERGENCY',
      `CRITICAL: Driver unresponsive to 15s alert. Emergency broadcast sent to Control Centre. Automated hazard protocol engaged.`,
      'Route Segment NH-44 km 32'
    );
  },

  /**
   * Driver presses Acknowledge or steers
   */
  driverAcknowledge() {
    if (!this.isCountdownActive && !this.isEmergencyTriggered) return;

    clearInterval(this.timerInterval);
    const wasEmergency = this.isEmergencyTriggered;
    this.isCountdownActive = false;
    this.isEmergencyTriggered = false;

    this.playAcknowledgeChime();
    this.updateBannerUI(false);

    IncidentLogger.log(
      wasEmergency ? 'Emergency Reset' : 'Driver Acknowledgment',
      'INFO',
      wasEmergency ? 'Emergency reset by authorized personnel/driver.' : '15-second alert confirmed and acknowledged by driver. Normal monitoring resumed.',
      'Route Segment NH-44 km 32'
    );

    // Reset Driver HUD if active
    const statusBadge = document.getElementById('driverStatusBadge');
    if (statusBadge) {
      statusBadge.textContent = 'ATTENTIVE';
      statusBadge.className = 'hud-status-badge';
    }
  },

  /**
   * Manual SOS Panic Button Trigger
   */
  triggerManualSos() {
    this.playEmergencySiren();
    this.isEmergencyTriggered = true;

    const banner = document.getElementById('emergencyBannerAlert');
    if (banner) {
      banner.classList.add('active');
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="font-size: 2rem;">🚨</span>
          <div>
            <div style="font-weight: 800; font-size: 1.1rem;">MANUAL SOS BROADCAST TRANSMITTED</div>
            <div style="font-size: 0.8rem; opacity: 0.9;">Driver pressed emergency panic button. GPS coordinates and audio telemetry streamed to Control Centre.</div>
          </div>
        </div>
        <button id="btnAcknowledgeEmergency" class="btn btn-glass" style="border: 2px solid #FFF; font-weight: 700;">CANCEL SOS</button>
      `;
      const btn = document.getElementById('btnAcknowledgeEmergency');
      if (btn) btn.onclick = () => this.driverAcknowledge();
    }

    IncidentLogger.log(
      'MANUAL DRIVER SOS',
      'EMERGENCY',
      'Driver manually triggered in-cabin SOS panic button. Distress beacon active.',
      'Route Segment NH-44 km 32'
    );
  },

  updateBannerUI(active, reason = '') {
    const banner = document.getElementById('emergencyBannerAlert');
    if (!banner) return;

    if (active) {
      banner.classList.add('active');
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px;">
          <div class="countdown-timer-large" id="emergencyCountdownVal">${this.currentCount}s</div>
          <div>
            <div style="font-weight: 800; font-size: 1rem; color: #FFF; text-transform: uppercase;">⚠️ DRIVER ATTENTION ALERT — RESPONSE REQUIRED</div>
            <div style="font-size: 0.8rem; color: #FEE2E2;">${reason}. Press Acknowledge or engage controls immediately.</div>
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="btnAcknowledgeCountdown" class="btn btn-glass" style="border: 2px solid #FFF; font-weight: 800; font-size: 0.95rem; background: rgba(0,0,0,0.5);">
            ACKNOWLEDGE ALERT
          </button>
        </div>
      `;
      const ackBtn = document.getElementById('btnAcknowledgeCountdown');
      if (ackBtn) ackBtn.onclick = () => this.driverAcknowledge();
    } else {
      banner.classList.remove('active');
    }
  },

  bindEvents() {
    const sosBtn = document.getElementById('btnHeaderSos');
    if (sosBtn) {
      sosBtn.addEventListener('click', () => this.triggerManualSos());
    }
  }
};
