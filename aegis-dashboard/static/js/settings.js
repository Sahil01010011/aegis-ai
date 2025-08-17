document.addEventListener('DOMContentLoaded', () => {
    new SettingsPage();
});

class SettingsPage {
    constructor() {
        this.elements = {
            weightsGrid: document.getElementById('weights-grid'),
            thresholdsGrid: document.getElementById('thresholds-grid'),
            saveBtn: document.getElementById('save-settings-btn')
        };
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
    }

    setupEventListeners() {
        this.elements.saveBtn.addEventListener('click', async () => {
            await this.saveSettings();
        });
    }

    async loadSettings() {
        try {
            const response = await fetch('/config');
            if (!response.ok) {
                throw new Error('Failed to load configuration from the server.');
            }
            const config = await response.json();
            
            this.populateGrid(this.elements.weightsGrid, config.weights, 'number');
            this.populateGrid(this.elements.thresholdsGrid, config.thresholds, 'number');

        } catch (error) {
            console.error('Error loading settings:', error);
            alert('Error: Could not load settings from the backend.');
        }
    }

    populateGrid(gridElement, settingsObject, inputType) {
        gridElement.innerHTML = ''; // Clear the "Loading..." placeholder

        for (const key in settingsObject) {
            const value = settingsObject[key];
            const cardEl = document.createElement('div');
            cardEl.className = 'setting-card';

            const labelText = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            cardEl.innerHTML = `
                <label for="setting-${key}">${labelText}</label>
                <input type="${inputType}" id="setting-${key}" name="${key}" value="${value}" ${inputType === 'number' ? 'step="any"' : ''} required>
            `;
            gridElement.appendChild(cardEl);
        }
    }

    async saveSettings() {
        const originalButtonText = this.elements.saveBtn.innerHTML;
        this.elements.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        this.elements.saveBtn.disabled = true;

        try {
            const weightsData = this.getGridData(this.elements.weightsGrid);
            const thresholdsData = this.getGridData(this.elements.thresholdsGrid);

            const [weightsResponse, thresholdsResponse] = await Promise.all([
                fetch('/config/weights', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(weightsData)
                }),
                fetch('/config/thresholds', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(thresholdsData)
                })
            ]);

            if (!weightsResponse.ok || !thresholdsResponse.ok) {
                throw new Error('One or more settings failed to save.');
            }

            alert('Settings saved successfully!');

        } catch (error) {
            console.error('Error saving settings:', error);
            alert(`Error: ${error.message}`);
        } finally {
            this.elements.saveBtn.innerHTML = originalButtonText;
            this.elements.saveBtn.disabled = false;
        }
    }
    
    getGridData(gridElement) {
        const data = {};
        const inputs = gridElement.querySelectorAll('input');
        inputs.forEach(input => {
            data[input.name] = parseFloat(input.value);
        });
        return data;
    }
}