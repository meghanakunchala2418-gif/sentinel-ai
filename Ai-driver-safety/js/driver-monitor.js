/**
 * =====================================================================
 * DRIVER MONITORING & FATIGUE VISION SYSTEM
 * AI Driver Safety & Bus Monitoring System
 * =====================================================================
 * Real-time vision analytics (Webcam with AI landmark analysis fallback)
 * plus full synthetic simulation engine for driver state classification.
 */

import { EmergencySystem } from './emergency-system.js';
import { IncidentLogger } from './incident-logger.js';
import { RiskEngine } from './risk-engine.js';

export const DriverMonitor = {
  mode: 'SIMULATION', // 'SIMULATION' or 'WEBCAM'
  status: 'ATTENTIVE', // 'ATTENTIVE', 'DROWSY', 'CRITICAL_MICROSLEEP', 'DISTRACTED'
  ear: 0.32, // Eye Aspect Ratio
  blinkRate: 14, // Blinks/min
  yawnCount: 0,
  headPose: 'Centered (0°)',
  fatigueScore: 12, // 0 - 100
  stream: null,
  simInterval: null,
  eyesClosedFrames: 0,

  init() {
    this.startSimulationLoop();
    this.bindEvents();
    this.updateUI();
  },

  /**
   * Continuous background simulation pulse to create a living HUD
   */
  startSimulationLoop() {
    clearInterval(this.simInterval);
    this.simInterval = setInterval(() => {
      if (this.mode === 'SIMULATION') {
        this.simulateMicroFluctuations();
      }
      this.updateUI();
      // Notify composite risk engine
      RiskEngine.updateDriverState({
        status: this.status,
        fatigueScore: this.fatigueScore,
        ear: this.ear
      });
    }, 1000);
  },

  simulateMicroFluctuations() {
    if (this.status === 'ATTENTIVE') {
      this.ear = +(0.31 + (Math.random() * 0.04 - 0.02)).toFixed(2);
      this.blinkRate = Math.round(13 + Math.random() * 4);
      this.fatigueScore = Math.max(5, Math.min(22, Math.round(12 + Math.random() * 6)));
      this.headPose = 'Centered (0°)';
    } else if (this.status === 'DROWSY') {
      this.ear = +(0.23 + (Math.random() * 0.04 - 0.02)).toFixed(2);
      this.blinkRate = Math.round(24 + Math.random() * 8);
      this.fatigueScore = Math.min(68, Math.round(52 + Math.random() * 10));
      this.headPose = 'Head Pitch Low (-8°)';
    } else if (this.status === 'CRITICAL_MICROSLEEP') {
      this.ear = +(0.08 + (Math.random() * 0.04)).toFixed(2);
      this.blinkRate = Math.round(4 + Math.random() * 2);
      this.fatigueScore = 95;
      this.headPose = 'Head Slumped Forward (-22°)';
    } else if (this.status === 'DISTRACTED') {
      this.ear = +(0.29 + (Math.random() * 0.03)).toFixed(2);
      this.blinkRate = 18;
      this.fatigueScore = 40;
      this.headPose = 'Head Yaw Left (+32°)';
    }
  },

  setDriverState(newState) {
    this.status = newState;
    const wireframe = document.getElementById('faceWireframe');
    const leftEye = document.getElementById('leftEye');
    const rightEye = document.getElementById('rightEye');
    const mouth = document.getElementById('mouth');

    if (newState === 'ATTENTIVE') {
      this.ear = 0.33;
      this.fatigueScore = 12;
      this.yawnCount = 0;
      if (wireframe) wireframe.className = 'face-mesh-wireframe';
      if (leftEye) leftEye.classList.remove('closed');
      if (rightEye) rightEye.classList.remove('closed');
      if (mouth) mouth.classList.remove('yawning');
      IncidentLogger.log('Driver Status Normal', 'INFO', 'Driver state verified: Attentive & responsive.');
    } else if (newState === 'DROWSY') {
      this.ear = 0.22;
      this.fatigueScore = 58;
      this.yawnCount++;
      if (wireframe) wireframe.className = 'face-mesh-wireframe drowsy';
      if (leftEye) leftEye.classList.remove('closed');
      if (rightEye) rightEye.classList.remove('closed');
      if (mouth) mouth.classList.add('yawning');
      IncidentLogger.log('Drowsiness Warning', 'WARNING', 'Driver yawning & elevated blink rate detected (Fatigue: 58%).');
      EmergencySystem.playBeep(440, 0.2, 'sine');
    } else if (newState === 'CRITICAL_MICROSLEEP') {
      this.ear = 0.08;
      this.fatigueScore = 95;
      if (wireframe) wireframe.className = 'face-mesh-wireframe critical';
      if (leftEye) leftEye.classList.add('closed');
      if (rightEye) rightEye.classList.add('closed');
      if (mouth) mouth.classList.remove('yawning');

      IncidentLogger.log(
        'Critical Drowsiness Trigger',
        'EMERGENCY',
        'CRITICAL: Eye Aspect Ratio dropped below 0.10 for > 2.0s (Micro-sleep). Initiating 15s Countdown.'
      );
      EmergencySystem.startCountdown('Closed Eyes / Micro-sleep Detected (EAR: 0.08)');
    } else if (newState === 'DISTRACTED') {
      this.ear = 0.28;
      this.fatigueScore = 45;
      if (wireframe) wireframe.className = 'face-mesh-wireframe drowsy';
      if (mouth) mouth.classList.remove('yawning');
      IncidentLogger.log('Driver Distraction', 'WARNING', 'Driver gaze deflected away from roadway > 3 seconds.');
      EmergencySystem.playBeep(520, 0.25, 'triangle');
    }

    this.updateUI();
    RiskEngine.updateDriverState({
      status: this.status,
      fatigueScore: this.fatigueScore,
      ear: this.ear
    });
  },

  async toggleWebcam() {
    const videoEl = document.getElementById('driverVideo');
    const simGraphic = document.getElementById('simulatedFaceGraphic');
    const btnToggle = document.getElementById('btnToggleCamera');

    if (this.mode === 'SIMULATION') {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert('Webcam access is not supported in this browser environment. Using simulation mode.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        this.stream = stream;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.style.display = 'block';
          videoEl.play();
        }
        if (simGraphic) simGraphic.style.display = 'none';
        this.mode = 'WEBCAM';
        if (btnToggle) btnToggle.textContent = 'Switch to AI Simulation';
        IncidentLogger.log('Webcam Feed Enabled', 'INFO', 'Local webcam connected for driver monitoring vision.');
      } catch (err) {
        console.error('Webcam error:', err);
        alert('Could not access webcam: ' + err.message + '. Reverting to simulation.');
      }
    } else {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
      if (videoEl) {
        videoEl.style.display = 'none';
        videoEl.srcObject = null;
      }
      if (simGraphic) simGraphic.style.display = 'flex';
      this.mode = 'SIMULATION';
      if (btnToggle) btnToggle.textContent = 'Enable Live Webcam';
      IncidentLogger.log('Simulation Mode Enabled', 'INFO', 'Driver monitoring switched to synthetic AI simulation.');
    }
    this.updateUI();
  },

  updateUI() {
    const earVal = document.getElementById('valEar');
    const blinksVal = document.getElementById('valBlinks');
    const fatigueVal = document.getElementById('valFatigue');
    const headPoseVal = document.getElementById('valHeadPose');
    const statusBadge = document.getElementById('driverStatusBadge');
    const modeBadge = document.getElementById('driverModeBadge');

    if (earVal) earVal.textContent = this.ear.toFixed(2);
    if (blinksVal) blinksVal.textContent = `${this.blinkRate} /min`;
    if (fatigueVal) fatigueVal.textContent = `${this.fatigueScore}%`;
    if (headPoseVal) headPoseVal.textContent = this.headPose;

    if (modeBadge) {
      modeBadge.textContent = this.mode === 'WEBCAM' ? 'LIVE CAMERA' : 'AI SIMULATED';
      modeBadge.className = this.mode === 'WEBCAM' ? 'panel-badge badge-live' : 'panel-badge badge-simulated';
    }

    if (statusBadge) {
      if (this.status === 'ATTENTIVE') {
        statusBadge.textContent = 'ATTENTIVE (SAFE)';
        statusBadge.className = 'hud-status-badge';
      } else if (this.status === 'DROWSY') {
        statusBadge.textContent = 'DROWSINESS DETECTED';
        statusBadge.className = 'hud-status-badge drowsy';
      } else if (this.status === 'CRITICAL_MICROSLEEP') {
        statusBadge.textContent = 'CRITICAL MICRO-SLEEP';
        statusBadge.className = 'hud-status-badge critical';
      } else if (this.status === 'DISTRACTED') {
        statusBadge.textContent = 'DISTRACTED / LOOKING AWAY';
        statusBadge.className = 'hud-status-badge drowsy';
      }
    }
  },

  bindEvents() {
    const btnNormal = document.getElementById('btnSimNormal');
    if (btnNormal) btnNormal.addEventListener('click', () => this.setDriverState('ATTENTIVE'));

    const btnDrowsy = document.getElementById('btnSimDrowsy');
    if (btnDrowsy) btnDrowsy.addEventListener('click', () => this.setDriverState('DROWSY'));

    const btnCritical = document.getElementById('btnSimCritical');
    if (btnCritical) btnCritical.addEventListener('click', () => this.setDriverState('CRITICAL_MICROSLEEP'));

    const btnDistracted = document.getElementById('btnSimDistracted');
    if (btnDistracted) btnDistracted.addEventListener('click', () => this.setDriverState('DISTRACTED'));

    const btnCam = document.getElementById('btnToggleCamera');
    if (btnCam) btnCam.addEventListener('click', () => this.toggleWebcam());
  }
};
