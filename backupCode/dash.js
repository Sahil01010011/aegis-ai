
document.addEventListener('DOMContentLoaded', () => {
    // This object will be shared between the two classes to link them
    const dashboardState = {
        update: () => {} // This will be replaced by the AegisDashboard's update method
    };


    // Initialize the main dashboard and the AI assistant, passing the shared state
    new AegisDashboard(dashboardState);
    new AIAssistant(dashboardState);
});


/**
 * Manages the new AI Live Analysis Assistant chat interface.
 */
class AIAssistant {
    constructor(dashboardState) {
        this.dashboardState = dashboardState; // Reference to the shared state updater
        this.elements = {
            chatWindow: document.getElementById('chat-window'),
            form: document.getElementById('analyze-form'),
            textInput: document.getElementById('text-input'),
        };
        this.conversationHistory = [];
        this.init();
    }


    init() {
        if (!this.elements.form) return;
        this.setupEventListeners();
    }


    setupEventListeners() {
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserMessage();
        });
        this.elements.textInput.addEventListener('input', this.autoResizeTextarea);
        this.elements.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleUserMessage();
            }
        });
    }


    autoResizeTextarea(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }


    async handleUserMessage() {
        const userInput = this.elements.textInput.value.trim();
        if (!userInput) return;


        this.addMessage(this.escapeHTML(userInput), 'user');
        this.conversationHistory.push(userInput);
        this.elements.textInput.value = '';
        this.elements.textInput.style.height = 'auto';


        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: userInput,
                    user_id: document.body.dataset.userId, // Use the real, logged-in user's ID
                    security_profile: document.getElementById('security-profile')?.value || 'balanced',
                    conversation_history: this.conversationHistory
                })
            });
            if (!response.ok) throw new Error('Network response was not ok.');
           
            const result = await response.json();
           
            this.displayAnalysisResult(result);
            this.dashboardState.update(result);


        } catch (error) {
            console.error("Analysis failed:", error);
            this.addMessage('<p>Sorry, an error occurred while analyzing the text.</p>', 'assistant');
        }
    }


    addMessage(html, type) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `${type}-message`;
        messageContainer.innerHTML = `<div class="message-bubble">${html}</div>`;
        this.elements.chatWindow.appendChild(messageContainer);
        this.elements.chatWindow.scrollTop = this.elements.chatWindow.scrollHeight;
    }
   
    displayAnalysisResult(result) {
        const isThreat = result.is_threatening;
        const messageBubble = document.createElement('div');
        messageBubble.className = `message-bubble analysis-result ${isThreat ? 'threat-detected' : 'safe'}`;


        let responseHTML = `<div class="result-header">`;
        if (isThreat) {
            responseHTML += `<i class="fas fa-exclamation-triangle"></i><strong>Threat Detected!</strong><span class="score">Score: ${result.final_score}</span>`;
        } else {
            responseHTML += `<i class="fas fa-check-circle"></i><strong>Analysis Complete: Safe</strong><span class="score">Score: ${result.final_score}</span>`;
        }
        responseHTML += `</div>`;


        if (isThreat && result.threat_details?.length > 0) {
            responseHTML += `<div class="result-body"><ul>`;
            result.threat_details.forEach(threat => {
                responseHTML += `<li><strong>${threat.type}:</strong> ${this.escapeHTML(threat.detail)}</li>`;
            });
            responseHTML += `</ul></div>`;
        }
        messageBubble.innerHTML = responseHTML;
       
        const messageContainer = document.createElement('div');
        messageContainer.className = 'assistant-message';
        messageContainer.appendChild(messageBubble);
        this.elements.chatWindow.appendChild(messageContainer);
        this.elements.chatWindow.scrollTop = this.elements.chatWindow.scrollHeight;
    }


    escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g,
            tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag));
    }
}



/**
 * Manages the main dashboard elements like charts and stat cards.
 */
class AegisDashboard {
    constructor(dashboardState) {
        this.charts = {};
        this.elements = {
            recentEventsFeed: document.getElementById('recent-events-feed'),
            highRiskThreatsDisplay: document.getElementById('high-risk-threats'),
            highRiskTotalDisplay: document.getElementById('high-risk-total'),
            totalThreatsDisplay: document.getElementById('total-threats'),
            totalThreatsPercentageDisplay: document.getElementById('total-threats-percentage'),
            blockedAttacksDisplay: document.getElementById('blocked-attacks'),
            blockedAttacksPercentageDisplay: document.getElementById('blocked-attacks-percentage'),
            avgResponseTimeDisplay: document.getElementById('avg-response-time'),
        };


        dashboardState.update = this.handleNewAnalysis.bind(this);
        this.init();
    }


    async init() {
        this.initCharts();
        await this.loadInitialStats();
    }
   
    async loadInitialStats() {
        try {
            const response = await fetch('/stats');
            if (!response.ok) throw new Error('Failed to load stats');
            const stats = await response.json();
            this.renderDashboard(stats);
        } catch (error) {
            console.error("Failed to load initial dashboard stats:", error);
        }
    }


    handleNewAnalysis(analysisResult) {
        this.loadInitialStats();
        if (analysisResult.is_threatening && analysisResult.final_score > 75) {
            this.addRecentEvent(analysisResult);
        }
    }


    renderDashboard(stats) {
        const { total_requests, total_threats, high_risk_threats, blocked_attacks, response_times, threat_distribution } = stats;


        // Update stat displays
        this.elements.highRiskThreatsDisplay.textContent = high_risk_threats;
        this.elements.highRiskTotalDisplay.textContent = `of ${total_threats} total`;
        this.elements.totalThreatsDisplay.textContent = total_threats;
        this.elements.blockedAttacksDisplay.textContent = blocked_attacks;
       
        const avgTime = response_times.length ? response_times.reduce((a, b) => a + b, 0) / response_times.length : 0;
        this.elements.avgResponseTimeDisplay.textContent = `${Math.round(avgTime)}ms`;


        // Update percentages
        const threatPercentage = total_requests > 0 ? (total_threats / total_requests) * 100 : 0;
        this.elements.totalThreatsPercentageDisplay.textContent = `${threatPercentage.toFixed(0)}% of requests`;
        const blockedPercentage = total_threats > 0 ? (blocked_attacks / total_threats) * 100 : 0;
        this.elements.blockedAttacksPercentageDisplay.textContent = `${blockedPercentage.toFixed(0)}% of threats`;
       
        // Update Gauges
        this.updateGauge(this.charts.highRiskGauge, total_threats > 0 ? (high_risk_threats / total_threats) * 100 : 0);
        this.updateGauge(this.charts.totalThreatsGauge, threatPercentage);
        this.updateGauge(this.charts.blockedAttacksGauge, blockedPercentage);
       
        // Update Distribution Chart
        if (threat_distribution && this.charts.threatDistribution) {
            const chart = this.charts.threatDistribution;
            chart.data.labels.forEach((label, index) => {
                chart.data.datasets[0].data[index] = threat_distribution[label] || 0;
            });
            chart.update();
        }
    }
   
    addRecentEvent(result) {
    const feed = this.elements.recentEventsFeed;
    const placeholder = feed.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }


    const eventEl = document.createElement('div');
    eventEl.className = 'event-item';
   
    // **FIX**: Safely handle cases where threat_details might be empty
    let threatType = 'High-Risk Threat'; // A reliable default
    if (result.threat_details && result.threat_details.length > 0) {
        // Find the threat with the highest weight to display
        const primaryThreat = result.threat_details.reduce((max, t) => (t.weight || 0) > (max.weight || 0) ? t : max, {weight: 0});
        threatType = primaryThreat.type || 'THREAT';
    }
   
    eventEl.innerHTML = `
        <div>
            <span class="event-type threat">${this.escapeHTML(threatType)}</span>
            <span>(Score: ${result.final_score})</span>
        </div>
        <span class="event-time">${new Date().toLocaleTimeString()}</span>`;
   
    feed.prepend(eventEl);


    while (feed.children.length > 5) {
        feed.removeChild(feed.lastChild);
    }
}
// Add a comma here if you have other functions after this one in your class


escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            "'": '&#39;', '"': '&quot;'
        }[tag] || tag)
    );
}
   
    updateGauge(chart, value) {
        if (!chart) return;
        chart.data.datasets[0].data[0] = value;
        chart.data.datasets[0].data[1] = 100 - value;
        chart.update();
    }
   
    initCharts() {
        this.initGaugeCharts();
        this.initThreatsOverTimeChart();
        this.initThreatDistributionChart();
    }


    initGaugeCharts() {
        const gaugeOptions = () => ({ responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, elements: { arc: { borderWidth: 0, borderRadius: 20 } } });
        const createGauge = (canvasId, color) => {
            const ctx = document.getElementById(canvasId)?.getContext('2d');
            if (!ctx) return null;
            return new Chart(ctx, { type: 'doughnut', data: { datasets: [{ data: [0, 100], backgroundColor: [color, '#ffffff20'] }] }, options: gaugeOptions() });
        };
        this.charts.highRiskGauge = createGauge('high-risk-gauge', '#ef4444');
        this.charts.totalThreatsGauge = createGauge('total-threats-gauge', '#a78bfa');
        this.charts.blockedAttacksGauge = createGauge('blocked-attacks-gauge', '#34d399');
    }


    initThreatsOverTimeChart() {
        // This function remains unchanged
        const ctx = document.getElementById('threats-over-time-chart')?.getContext('2d');
        if (!ctx) return;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        const labels = Array.from({ length: 24 }, (_, i) => new Date(Date.now() - (23 - i) * 3600 * 1000));
        const data = [0, 1, 0, 2, 1, 3, 2, 4, 5, 3, 6, 7, 5, 8, 9, 6, 10, 11, 8, 12, 13, 10, 14, 15].map(v => Math.floor(Math.random() * v));
        this.charts.threatsOverTime = new Chart(ctx, {
            type: 'line', data: { labels: labels, datasets: [{
                label: 'Threats Detected', data: data, fill: true, backgroundColor: gradient, borderColor: '#8b5cf6',
                tension: 0.4, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: '#8b5cf6',
            }]},
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                scales: { x: { type: 'time', time: { unit: 'hour', tooltipFormat: 'MMM d, h:mm a' }, grid: { display: false }, ticks: { color: '#94a3b8' } },
                          y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } },
                plugins: { legend: { display: false }, tooltip: {
                    enabled: true, backgroundColor: 'var(--bg-lighter)', titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)', borderColor: 'var(--border-color)',
                    borderWidth: 1, padding: 10, caretSize: 8, cornerRadius: 8,
                }}
            }
        });
    }


    initThreatDistributionChart() {
        const ctx = document.getElementById('threat-distribution-chart')?.getContext('2d');
        if (!ctx) return;
        this.charts.threatDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['INSTR_INJECT', 'DATA_EXFIL', 'ROLE_ATTACK', 'DLP', 'SemanticAnomaly', 'Entropy'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0], // Initialize with zeros
                    backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#cbd5e1', boxWidth: 12, padding: 20 } }
                },
                cutout: '70%',
                // **NEW**: Add a continuous rotation animation
                animation: {
                    duration: 20000, // Speed of one rotation (in ms)
                    easing: 'linear',
                    loop: true
                }
            }
        });
    }
}

