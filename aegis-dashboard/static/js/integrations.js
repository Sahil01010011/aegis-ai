document.addEventListener('DOMContentLoaded', () => {
    new IntegrationsPage();
});

class IntegrationsPage {
    constructor() {
        this.elements = {
            form: document.getElementById('slack-form'),
            urlInput: document.getElementById('webhook-url'),
            statusDiv: document.getElementById('slack-status'),
            submitBtn: document.querySelector('#slack-form button[type="submit"]')
        };
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
    }

    setupEventListeners() {
        this.elements.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveSettings();
        });
    }

    async loadSettings() {
        try {
            const response = await fetch('/integrations/slack');
            if (!response.ok) {
                throw new Error('Failed to load settings from the server.');
            }
            const data = await response.json();
            this.elements.urlInput.value = data.webhook_url || '';
            this.updateStatus(data.configured);
        } catch (error) {
            console.error('Error loading Slack settings:', error);
            alert('Error: Could not load Slack settings from the backend.');
            this.updateStatus(false);
        }
    }

    async saveSettings() {
        const webhookUrl = this.elements.urlInput.value.trim();
        const originalButtonText = this.elements.submitBtn.innerHTML;
        this.elements.submitBtn.innerHTML = 'Saving...';
        this.elements.submitBtn.disabled = true;

        try {
            const response = await fetch('/integrations/slack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhook_url: webhookUrl })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save settings.');
            }
            
            alert('Slack configuration saved successfully! A test message has been sent.');
            this.updateStatus(!!webhookUrl); // Update status based on if URL is present
        } catch (error) {
            console.error('Error saving Slack settings:', error);
            alert(`Error: ${error.message}`);
        } finally {
            this.elements.submitBtn.innerHTML = originalButtonText;
            this.elements.submitBtn.disabled = false;
        }
    }

    updateStatus(isConfigured) {
        if (isConfigured) {
            this.elements.statusDiv.innerHTML = `
                <div class="status-indicator online"></div>
                <span>Configured</span>
            `;
        } else {
            this.elements.statusDiv.innerHTML = `
                <div class="status-indicator offline"></div>
                <span>Not Configured</span>
            `;
        }
    }
}