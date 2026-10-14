/**
 * =====================================================================
 * INCIDENT LOGGER & AUDIT LOG SYSTEM
 * AI Driver Safety & Bus Monitoring System
 * =====================================================================
 * Records and persists all safety alerts, driver drowsiness events,
 * route hazards, and dispatch communications with CSV/JSON export.
 */

const STORAGE_KEY = 'ai_driver_safety_incident_logs_v2';

export const IncidentLogger = {
  incidents: [],
  currentFilter: 'ALL',

  init() {
    this.loadFromStorage();
    if (this.incidents.length === 0) {
      this.seedInitialLogs();
    }
    this.render();
    this.bindEvents();
  },

  seedInitialLogs() {
    const now = new Date();
    const tMinus = (mins) => new Date(now.getTime() - mins * 60000).toLocaleTimeString();

    this.incidents = [
      {
        id: 'inc-01',
        time: tMinus(22),
        type: 'System Initialization',
        severity: 'INFO',
        description: 'AI Driver Safety & Smart Route Telemetry System active. Telemetry stream locked (Simulated).',
        location: 'Metro Central Depot Bay 4'
      },
      {
        id: 'inc-02',
        time: tMinus(14),
        type: 'Route Evaluated',
        severity: 'INFO',
        description: 'NH-44 Express Highway selected. Route Safety Score: 88/100 (Optimal).',
        location: 'NH-44 Corridor km 8.0'
      },
      {
        id: 'inc-03',
        time: tMinus(7),
        type: 'Route Hazard Advisory',
        severity: 'WARNING',
        description: 'Notice: Lowland culvert flooding reported on alternate SH-12 bypass. Recommended route kept on NH-44.',
        location: 'SH-12 Junction km 18'
      }
    ];
    this.saveToStorage();
  },

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.incidents = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not load incident logs from localStorage:', e);
      this.incidents = [];
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.incidents));
    } catch (e) {
      console.warn('Could not save incident logs:', e);
    }
  },

  log(type, severity, description, location = 'Active Segment') {
    const newEntry = {
      id: 'inc-' + Date.now(),
      time: new Date().toLocaleTimeString(),
      type,
      severity: severity.toUpperCase(),
      description,
      location
    };

    // Prepend new entry
    this.incidents.unshift(newEntry);
    // Keep max 100 entries
    if (this.incidents.length > 100) {
      this.incidents = this.incidents.slice(0, 100);
    }

    this.saveToStorage();
    this.render();
  },

  filter(severity) {
    this.currentFilter = severity;
    this.render();
  },

  clearLogs() {
    this.incidents = [];
    this.saveToStorage();
    this.render();
  },

  exportCSV() {
    if (this.incidents.length === 0) {
      alert('Incident log is empty. Nothing to export.');
      return;
    }

    const headers = ['Timestamp', 'Event Type', 'Severity', 'Location', 'Description'];
    const rows = this.incidents.map(item => [
      `"${item.time}"`,
      `"${item.type.replace(/"/g, '""')}"`,
      `"${item.severity}"`,
      `"${item.location.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `incident_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportJSON() {
    if (this.incidents.length === 0) {
      alert('Incident log is empty. Nothing to export.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.incidents, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `incident_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  render() {
    const tbody = document.getElementById('incidentTableBody');
    if (!tbody) return;

    const filtered = this.incidents.filter(inc => {
      if (this.currentFilter === 'ALL') return true;
      return inc.severity === this.currentFilter;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No incidents recorded for filter [${this.currentFilter}].
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(inc => {
      let badgeClass = 'log-badge-info';
      if (inc.severity === 'EMERGENCY') badgeClass = 'log-badge-emergency';
      else if (inc.severity === 'WARNING') badgeClass = 'log-badge-warning';

      return `
        <tr>
          <td style="font-family: var(--font-mono); color: var(--text-secondary);">${inc.time}</td>
          <td style="font-weight: 600;">${inc.type}</td>
          <td><span class="${badgeClass}">${inc.severity}</span></td>
          <td style="color: var(--cyan-primary); font-size: 0.74rem;">${inc.location}</td>
          <td style="color: var(--text-main); font-size: 0.75rem;">${inc.description}</td>
        </tr>
      `;
    }).join('');
  },

  bindEvents() {
    const btnCsv = document.getElementById('btnExportCsv');
    if (btnCsv) btnCsv.addEventListener('click', () => this.exportCSV());

    const btnClear = document.getElementById('btnClearLogs');
    if (btnClear) btnClear.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the incident logs?')) {
        this.clearLogs();
      }
    });

    const filterBtns = document.querySelectorAll('.filter-log-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const filterVal = e.target.getAttribute('data-filter') || 'ALL';
        this.filter(filterVal);
      });
    });
  }
};
