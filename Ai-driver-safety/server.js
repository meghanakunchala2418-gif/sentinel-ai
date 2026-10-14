/**
 * AI Driver Safety & Smart Route Safety Server
 * Zero-dependency pure Node.js HTTP server with static file serving & simulated REST API
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

// Simulated mock API backend for route safety and fleet telemetry
const mockRouteDatabase = {
  routes: [
    {
      id: "route-primary-exp",
      name: "NH-44 Express Corridor",
      type: "Expressway",
      origin: "Metro Terminal A",
      destination: "North Central Depot",
      distanceKm: 46.8,
      normalTimeMins: 42,
      congestedTimeMins: 58,
      safetyScore: 88,
      status: "Recommended",
      factors: {
        weather: { score: 90, rainRateMm: 2.1, visibilityMeters: 4500, windKmh: 14, condition: "Light Overcast" },
        road: { score: 92, surfaceQuality: "Paved High Grade", closures: 0, constructionZones: 0 },
        traffic: { score: 82, congestionIndex: 32, incidentCount: 0, avgSpeedKmh: 68 },
        hazards: { score: 85, activeHazards: ["Minor bridge expansion joint maintenance at km 31.2"] },
        emergencyAccess: { score: 92, traumaCenterDistanceKm: 4.2, cellularCoveragePct: 99, depotDistanceKm: 6.0 }
      },
      waypoints: [
        [17.4399, 78.3908],
        [17.4475, 78.3882],
        [17.4621, 78.3754],
        [17.4812, 78.3619],
        [17.5034, 78.3490],
        [17.5255, 78.3378],
        [17.5488, 78.3211],
        [17.5699, 78.3105]
      ]
    },
    {
      id: "route-bypass-rural",
      name: "State Highway 12 (Scenic Bypass)",
      type: "Highway / Bypass",
      origin: "Metro Terminal A",
      destination: "North Central Depot",
      distanceKm: 52.4,
      normalTimeMins: 55,
      congestedTimeMins: 62,
      safetyScore: 61,
      status: "Elevated Risk",
      factors: {
        weather: { score: 55, rainRateMm: 18.5, visibilityMeters: 650, windKmh: 38, condition: "Heavy Rain & Waterlogging" },
        road: { score: 58, surfaceQuality: "Potholes / Lowland Shoulder", closures: 1, constructionZones: 1 },
        traffic: { score: 78, congestionIndex: 22, incidentCount: 1, avgSpeedKmh: 45 },
        hazards: { score: 52, activeHazards: ["Flash waterlogging (15cm) at km 18 underpass", "Shoulder erosion at km 27"] },
        emergencyAccess: { score: 64, traumaCenterDistanceKm: 14.5, cellularCoveragePct: 76, depotDistanceKm: 18.2 }
      },
      waypoints: [
        [17.4399, 78.3908],
        [17.4310, 78.4100],
        [17.4520, 78.4350],
        [17.4850, 78.4520],
        [17.5210, 78.4310],
        [17.5510, 78.3810],
        [17.5699, 78.3105]
      ]
    }
  ]
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Set CORS headers for API accessibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', serverTime: new Date().toISOString(), simulatedMode: true }));
    return;
  }

  if (pathname === '/api/routes') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      dataOrigin: 'Simulated Benchmark Dataset (Static Pre-calibrated Demo)',
      timestamp: new Date().toISOString(),
      routes: mockRouteDatabase.routes
    }));
    return;
  }

  if (pathname === '/api/telemetry') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      busId: "BUS-104",
      driverName: "Capt. Rajesh Verma",
      speedKmh: 48,
      headingDeg: 345,
      fuelPct: 78,
      engineTempC: 86,
      tirePressurePsi: 110,
      passengerCount: 34,
      gpsFix: "3D Fixed (Simulated High Precision)",
      lastUpdated: new Date().toISOString()
    }));
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Prevent directory traversal attacks
  const safePath = path.resolve(filePath);
  if (!safePath.startsWith(path.resolve(PUBLIC_DIR))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If file not found, try index.html for SPA fallback
      const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallbackPath, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(safePath, (err3, data) => {
      if (err3) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` AI DRIVER SAFETY & SMART ROUTE MONITORING SYSTEM`);
  console.log(` Server running locally at: http://localhost:${PORT}`);
  console.log(` All route scores & telemetry are clearly SIMULATED.`);
  console.log(`=======================================================`);
});
