document.addEventListener('DOMContentLoaded', () => {
    new ActivityLogPage();
});

class ActivityLogPage {
    constructor() {
        this.elements = {
            logList: document.getElementById('log-list'),
        };
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadLogs();
    }
    
    setupEventListeners() {
        this.elements.logList.addEventListener('click', (e) => {
            const entry = e.target.closest('.log-entry');
            if (!entry) return;
            const detailsPanel = entry.nextElementSibling;
            if (detailsPanel && detailsPanel.classList.contains('log-details')) {
                const isVisible = detailsPanel.style.display === 'block';
                detailsPanel.style.display = isVisible ? 'none' : 'block';
            }
        });
    }

    async loadLogs() {
        try {
            const response = await fetch('/logs');
            
            // **DEBUG**: Log the response status
            console.log('Fetch response:', response);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const logs = await response.json();
            this.renderLogs(logs);
        } catch (error) {
            // **DEBUG**: Log the exact error
            console.error('Error in loadLogs:', error);
            this.elements.logList.innerHTML = `<div class="log-placeholder">Error: Could not load activity logs.</div>`;
        }
    }
    renderLogs(logs) {
        this.elements.logList.innerHTML = '';
        if (logs.length === 0) {
            this.elements.logList.innerHTML = `<div class="log-placeholder">No activity recorded yet.</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        logs.forEach(log => {
            const entryEl = document.createElement('div');
            entryEl.className = 'log-entry';
            entryEl.innerHTML = `
                <div class="col-status">
                    <div class="status-dot ${log.is_threatening ? 'threat' : 'safe'}"></div>
                </div>
                <div class="col-event">
                    <div class="col-event-text">${this.escapeHTML(log.original_text)}</div>
                </div>
                <div class="col-score">
                    <span class="col-score-value">${log.final_score}</span>
                </div>
                <div class="col-time">${this.formatTimestamp(log.timestamp)}</div>
            `;

            const detailsEl = document.createElement('div');
            detailsEl.className = 'log-details';
            detailsEl.innerHTML = `
                <h4>Event Details (ID: ${log.id})</h4>
                <strong>Original Text:</strong>
                <pre>${this.escapeHTML(log.original_text)}</pre>
                <br>
                <strong>Threats Detected (${log.threat_details.length}):</strong>
                <div class="threat-list">
                    ${log.threat_details.length > 0 ? log.threat_details.map(t => `
                        <div class="threat-item">
                            <strong>${t.type}</strong> (Score: ${t.weight})<br>
                            <small>${this.escapeHTML(t.detail)}</small>
                        </div>
                    `).join('') : '<div class="threat-item"><small>No specific threats detected.</small></div>'}
                </div>
            `;
            fragment.appendChild(entryEl);
            fragment.appendChild(detailsEl);
        });

        this.elements.logList.appendChild(fragment);
    }
    
    formatTimestamp(isoString) {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
            hour12: true
        });
    }

    escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                "'": '&#39;', '"': '&quot;'
            }[tag] || tag)
        );
    }
}