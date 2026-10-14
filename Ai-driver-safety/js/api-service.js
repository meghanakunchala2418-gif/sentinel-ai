/**
 * =====================================================================
 * API SERVICE & EXTENSION ARCHITECTURE
 * AI Driver Safety & Smart Route Safety System
 * =====================================================================
 * TRANSPARENCY NOTICE:
 * All default datasets in this prototype are SIMULATED and clearly labeled.
 * This module provides clean mock implementations and documented adapter
 * interfaces for connecting real external providers (OpenWeather, TomTom,
 * HERE Maps, and vehicle NMEA GPS telemetry streams) in production.
 */

export const DATA_ORIGIN = {
  SIMULATED: 'SIMULATED (Demo Scenario Dataset)',
  DEVICE_GPS: 'LIVE (Client Device Browser Geolocation)',
  EXTERNAL_API: 'LIVE (External Production API Provider)'
};

export const ApiService = {
  // Current active mode flags
  isSimulated: true,
  lastUpdated: new Date(),

  /**
   * Predefined simulated routes for demonstration
   */
  getPredefinedRoutes() {
    return [
      {
        id: 'route-nh44-exp',
        name: 'NH-44 Express Highway',
        tag: 'Recommended (Primary Corridor)',
        type: 'Four-lane Divided Highway',
        origin: 'Metro Central Bus Terminal (Gate 4)',
        destination: 'Northern Regional Hub Depot',
        distanceKm: 48.6,
        normalDurationMins: 45,
        congestedDurationMins: 58,
        baseScore: 100,
        factors: {
          weather: {
            rainfallMm: 2.4,
            visibilityMeters: 4800,
            windKmh: 14,
            condition: 'Clear to Light Overcast',
            penalty: 6,
            explanation: 'Minimal precipitation; visibility exceeds 4km.'
          },
          road: {
            pavementQuality: 'Grade A Asphalt',
            activeClosures: 0,
            activeConstruction: 0,
            penalty: 4,
            explanation: 'Expressway pavement in optimal condition.'
          },
          traffic: {
            congestionLevel: 'Moderate Flow (Speed 68 km/h)',
            congestionIndex: 35,
            delayMins: 6,
            penalty: 8,
            explanation: 'Minor slowdown near Ring Road interchange.'
          },
          hazards: {
            hazardCount: 1,
            hazardsList: [
              { type: 'construction', label: 'Expansion Joint Inspection', kmMarker: 32.4, severity: 'Low' }
            ],
            penalty: 6,
            explanation: 'Isolated scheduled lane shoulder inspection.'
          },
          emergencyAccess: {
            traumaCenterDistKm: 4.8,
            depotDistKm: 5.2,
            cellularCoveragePct: 98,
            bonus: 8,
            explanation: 'Two major trauma hospitals within 5km radius; excellent 5G cellular coverage.'
          }
        },
        waypoints: [
          [17.4399, 78.3908],
          [17.4485, 78.3852],
          [17.4640, 78.3710],
          [17.4855, 78.3580],
          [17.5110, 78.3440],
          [17.5360, 78.3310],
          [17.5580, 78.3190],
          [17.5740, 78.3080]
        ]
      },
      {
        id: 'route-sh12-rural',
        name: 'State Highway 12 (Scenic Bypass)',
        tag: 'Elevated Risk (Lowland Flooding)',
        type: 'Two-lane Undivided Roadway',
        origin: 'Metro Central Bus Terminal (Gate 4)',
        destination: 'Northern Regional Hub Depot',
        distanceKm: 54.2,
        normalDurationMins: 56,
        congestedDurationMins: 82,
        baseScore: 100,
        factors: {
          weather: {
            rainfallMm: 24.8,
            visibilityMeters: 750,
            windKmh: 42,
            condition: 'Torrential Rain & Severe Fog',
            penalty: 26,
            explanation: 'High rainfall rate causing surface sheet flow and reduced visibility below 800m.'
          },
          road: {
            pavementQuality: 'Grade C Undivided (Shoulder Waterlogging)',
            activeClosures: 1,
            activeConstruction: 1,
            penalty: 24,
            explanation: 'Culvert underpass partially submerged (18cm standing water) at km 21.'
          },
          traffic: {
            congestionLevel: 'Heavy Stop-and-Go (Avg Speed 28 km/h)',
            congestionIndex: 78,
            delayMins: 26,
            penalty: 18,
            explanation: 'Bottle-neck bottleneck near rural agricultural market.'
          },
          hazards: {
            hazardCount: 3,
            hazardsList: [
              { type: 'flood', label: 'Flash Waterlogging (18cm)', kmMarker: 21.3, severity: 'Severe' },
              { type: 'fog', label: 'Dense Valley Fog Zone', kmMarker: 34.0, severity: 'High' },
              { type: 'traffic', label: 'Single-Lane Bridge Bottleneck', kmMarker: 41.5, severity: 'Medium' }
            ],
            penalty: 22,
            explanation: 'Multiple high-risk hazards: flood zone and valley fog.'
          },
          emergencyAccess: {
            traumaCenterDistKm: 18.4,
            depotDistKm: 21.0,
            cellularCoveragePct: 68,
            bonus: 2,
            explanation: 'Limited emergency hospital proximity; cellular shadow zones in valley.'
          }
        },
        waypoints: [
          [17.4399, 78.3908],
          [17.4290, 78.4150],
          [17.4510, 78.4420],
          [17.4890, 78.4610],
          [17.5250, 78.4350],
          [17.5560, 78.3750],
          [17.5740, 78.3080]
        ]
      }
    ];
  },

  /**
   * Calculate transparent safety score out of 100
   * Formula:
   * Score = 100 - (WeatherPen + RoadPen + TrafficPen + HazardPen) + EmergencyBonus - UncertaintyPenalty
   */
  calculateRouteSafetyScore(factors, isDataStale = false) {
    const wPen = factors.weather?.penalty || 0;
    const rPen = factors.road?.penalty || 0;
    const tPen = factors.traffic?.penalty || 0;
    const hPen = factors.hazards?.penalty || 0;
    const eBonus = factors.emergencyAccess?.bonus || 0;

    // Missing or stale data uncertainty penalty
    const uncertaintyPen = isDataStale ? 15 : 0;

    let score = 100 - (wPen + rPen + tPen + hPen) + eBonus - uncertaintyPen;
    score = Math.max(0, Math.min(100, Math.round(score)));

    let riskLevel = 'Low Risk';
    let riskColor = 'green';
    if (score < 40) {
      riskLevel = 'Critical Risk';
      riskColor = 'red';
    } else if (score < 65) {
      riskLevel = 'Elevated Risk';
      riskColor = 'orange';
    } else if (score < 85) {
      riskLevel = 'Moderate Risk';
      riskColor = 'amber';
    }

    return {
      score,
      riskLevel,
      riskColor,
      deductions: {
        weather: -wPen,
        road: -rPen,
        traffic: -tPen,
        hazards: -hPen,
        uncertainty: -uncertaintyPen
      },
      bonuses: {
        emergencyAccess: +eBonus
      },
      isDataStale
    };
  },

  /**
   * Adapter guidance for integrating real third-party production APIs
   */
  getExternalApiConfigGuide() {
    return {
      weatherProviders: ['OpenWeatherMap OneCall 3.0', 'Tomorrow.io Weather API'],
      trafficRoadProviders: ['TomTom Traffic Flow & Incidents', 'HERE Routing & Hazard Warning', 'Waze Live Alerts'],
      fleetGpsHardware: ['Teltonika FMB920 GPS Tracker', 'Concox OBD-II Telematics', 'NMEA 0183 Serial/TCP Stream'],
      instructions: 'To connect real services, provide the API Key in the settings drawer and switch data source from SIMULATED to LIVE in api-service.js.'
    };
  }
};
