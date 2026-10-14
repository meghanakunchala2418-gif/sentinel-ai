# SENTINEL AI — Fleet Safety & Smart Route Multi-Screen Control (v2.0)

> Advanced Fleet Mission Control integrating **AI Driver Fatigue Monitoring**, **AI-Powered Smart Route Safety Analytics**, and **Live GPS Tracking** structured into a clean, modern **multi-screen dashboard**.

---

## 🚀 Quick Launch Instructions

This project is built with standard web technologies and a zero-dependency Node.js HTTP server. No external installations or paid API keys are required to run the application.

### Exact Launch Command:

Open PowerShell or Terminal inside this project folder (`c:\Ai-driver-safety`) and execute:

```powershell
npm start
```
*or alternatively:*
```powershell
node server.js
```

Then open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🖥️ Clean Multi-Screen Dashboard Architecture

The dashboard separates all fleet operations into six focused screens via an intuitive sidebar and responsive navigation:

### 1. 🏠 Home Dashboard
- **Executive KPI Cards:** Vehicle ID, current speed, GPS status, driver fatigue %, route safety score, and weather snapshot.
- **Overall Trip-Risk Summary Matrix:** Dual meters displaying Driver Fatigue Risk and Route Safety Score side-by-side with composite transit status.
- **Contextual Driver Advisory Highlights:** Short list of critical road cues and authorized safe rest bay locations.
- **Quick Module Shortcuts:** Direct navigation links to dedicated screens.

### 2. 🗺️ Live GPS Tracking
- **Expanded High-Resolution Interactive Map:** Fullscreen Leaflet map with dark cyber theme.
- **Vehicle Telemetry Overlays:** Real-time latitude, longitude, speed, heading, and simulated GPS fix.
- **Hazard Overlays:** Interactive pulsating markers for Flood Zones (with alert radius circles), Road Construction, Valley Fog, and Traffic Bottlenecks.
- **Playback Controls:** Play, pause, speed multipliers (1x, 2x, 5x), route progress scrubber, and "Center Bus".
- **Opt-In Device Geolocation:** "Acquire Device GPS" button requests browser HTML5 location to display the user's real location alongside fleet telemetry.

### 3. 👁️ Driver Safety
- **In-Cabin Computer Vision HUD:** Real-time webcam face-mesh or synthetic AI cyber wireframe.
- **Biometric Fatigue Telemetry:** Eye Aspect Ratio (EAR), Blink Frequency (blinks/min), Fatigue Score (0-100%), and 3D Head Pose deflection.
- **Driver State Simulator:** Interactive test triggers for *Attentive*, *Drowsy / Yawn*, *Critical Micro-Sleep*, and *Distracted*.
- **CAN-Bus Hardware Panel:** Cruising speed, fuel reservoir, engine temperature, and passenger load matrix.

### 4. 🛣️ Route Planning
- **Interactive Corridor Selection:** Source and destination text fields with instant swap and preset corridor shortcuts (`Metro ➔ North Hub NH-44`, `Scenic Bypass SH-12`, `Airport ➔ Mountain Pass`).
- **Route Alternatives Comparison:** Side-by-side cards comparing distance, estimated duration, congestion delays, and safety scores.
- **5-Factor Transparent Scoring:** Dedicated breakdown bars for Weather, Road Conditions, Traffic Congestion, Active Hazards, and Emergency Proximity Bonus.
- **Scoring Audit Drawer:** Itemized line-by-line penalties and bonuses.
- **Sensor Link Degradation Simulator:** Checkbox applying a `+15 Uncertainty Risk Penalty` when feeds are stale.

### 5. 🌦️ Weather & Road Hazards
- **Environmental Sensor Telemetry:** Rainfall rate (mm/h), Visibility (m), Flooding Risk, Road Closures, Traffic Congestion %, and Pavement condition.
- **4 Benchmark Scenarios:** *Monsoon Storm & Flooding*, *Clear Skies & Highway*, *Dense Valley Fog*, and *Peak Urban Gridlock*.
- **Dynamic Interactive Sliders:** Real-time sliders for Rainfall, Visibility, Traffic, and Hazard counts that recalculate safety scores on the fly.

### 6. 📋 Incidents & Reports
- **Chronological Audit Table:** Filterable by severity (`ALL`, `EMERGENCY`, `WARNING`, `INFO`).
- **Data Export:** Instant one-click **CSV Spreadsheet Export** and **JSON Export**.
- **Contextual Driver Advisories:** Complete safety advisories and highway rest station references.
- **Quick Protocols Access:** Direct modals for the External API Integration Guide and Legal Safety Protocols.

---

## 🚨 Emergency Protocols & Global Safeguards

- **Universal Manual SOS:** A prominent, high-visibility **`MANUAL SOS`** button remains visible on every screen.
- **15-Second Emergency Countdown Banner:** Appears globally across all screens when critical micro-sleep or SOS is detected. Includes audible Web Audio synthesizer beeps, a countdown timer, and an **"ACKNOWLEDGE ALERT"** button that resets the system. If unacknowledged, automated emergency dispatch escalates to fleet control.

---

## 🔍 Data Source Transparency & Production Integration Guide

| System Component | Prototype State | Production Service Integration |
|---|---|---|
| **Route Coordinates & Alternatives** | Pre-calibrated Benchmark Corridors | Google Directions API / HERE Routing / OSRM |
| **Weather Conditions** | Dynamic Scenario Synthesizer | OpenWeatherMap OneCall 3.0 / Tomorrow.io |
| **Road Hazards & Closures** | Dynamic Sliders / Pre-mapped Hazards | TomTom Incident API / Waze Live Alerts |
| **Vehicle Fleet GPS** | Waypoint Interpolation Simulation | In-vehicle Teltonika/Concox NMEA 0183 ($GPRMC) |
| **User Device Location** | Live Browser Geolocation (HTML5) | Real-time GPS Hardware |
| **Driver Eye/Face Tracking** | AI Simulation + Live Webcam | MediaPipe FaceMesh / In-Cabin Infrared NIR Cam |

> **Statutory Driver Safety Disclaimer:**  
> This system is an advisory fleet planning and monitoring prototype. It does NOT possess autonomous vehicle braking or steering control. Drivers must never interact with dashboard screens while the vehicle is in motion and remain strictly bound to official traffic laws, road signs, and human visibility.
