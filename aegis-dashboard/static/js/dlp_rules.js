// static/js/dlp_rules.js
document.addEventListener('DOMContentLoaded', () => {
    new DLPRuleEditor();
});

class DLPRuleEditor {
    constructor() {
        // Mock data. In a real app, you'd fetch this from your backend.
        this.rules = [
            { id: '1', name: 'Indian PAN Card', description: 'Detects 10-digit Indian PAN numbers', pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}', action: 'redact', severity: 'High' },
            { id: '2', name: 'Aadhaar Card', description: 'Detects 12-digit Indian national ID numbers', pattern: '\\b[2-9]{1}[0-9]{3}\\s[0-9]{4}\\s[0-9]{4}\\b', action: 'redact', severity: 'High' },
            { id: '3', name: 'Credit Card Number', description: 'Detects common credit card number formats', pattern: '\\b(?:\\d[ -]*?){13,16}\\b', action: 'block', severity: 'Critical' }
        ];

        this.elements = {
            ruleList: document.getElementById('rule-list'),
            addNewRuleBtn: document.getElementById('add-new-rule-btn'),
            modal: document.getElementById('rule-modal'),
            modalTitle: document.getElementById('modal-title'),
            cancelBtn: document.getElementById('cancel-btn'),
            saveBtn: document.getElementById('save-btn'),
            
            // Form fields
            ruleId: document.getElementById('rule-id'),
            ruleName: document.getElementById('rule-name'),
            ruleDescription: document.getElementById('rule-description'),
            rulePattern: document.getElementById('rule-pattern'),
            ruleAction: document.getElementById('rule-action'),
            ruleSeverity: document.getElementById('rule-severity'),
            regexError: document.getElementById('regex-error'),

            // Tester fields
            testInput: document.getElementById('test-input'),
            testOutput: document.getElementById('test-output'),
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderRules();
    }

    setupEventListeners() {
        this.elements.addNewRuleBtn.addEventListener('click', () => this.openModal());
        this.elements.cancelBtn.addEventListener('click', () => this.closeModal());
        this.elements.saveBtn.addEventListener('click', () => this.saveRule());

        // Event delegation for edit/delete buttons on the rule list
        this.elements.ruleList.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            if (editBtn) {
                const ruleId = editBtn.dataset.id;
                const rule = this.rules.find(r => r.id === ruleId);
                this.openModal(rule);
            }

            const deleteBtn = e.target.closest('.btn-danger');
            if (deleteBtn) {
                if (confirm('Are you sure you want to delete this rule?')) {
                    this.deleteRule(deleteBtn.dataset.id);
                }
            }
        });

        // Live update for the regex tester
        [this.elements.rulePattern, this.elements.testInput, this.elements.ruleAction, this.elements.ruleName].forEach(el => {
            el.addEventListener('input', () => this.updateTestOutput());
        });
    }

    renderRules() {
        this.elements.ruleList.innerHTML = ''; // Clear existing content
        
        // Create and append the header row
        const headerEl = document.createElement('div');
        headerEl.className = 'dlp-rule-item dlp-rule-header';
        headerEl.innerHTML = `
            <div>Rule</div>
            <div>Pattern</div>
            <div>Action</div>
            <div>Severity</div>
            <div style="text-align: right;">Actions</div>
        `;
        this.elements.ruleList.appendChild(headerEl);

        if (this.rules.length === 0) {
            const placeholderEl = document.createElement('div');
            placeholderEl.innerHTML = '<p class="placeholder" style="text-align: center; padding: 2rem; color: var(--text-muted);">No DLP rules defined. Click "Add New Rule" to get started.</p>';
            this.elements.ruleList.appendChild(placeholderEl);
            return;
        }

        // Create and append a row for each rule
        this.rules.forEach(rule => {
            const ruleEl = document.createElement('div');
            ruleEl.className = 'dlp-rule-item';
            ruleEl.innerHTML = `
                <div>
                    <div class="rule-name">${this.escapeHTML(rule.name)}</div>
                    <div class="rule-description">${this.escapeHTML(rule.description)}</div>
                </div>
                <div>
                    <code class="rule-pattern">${this.escapeHTML(rule.pattern)}</code>
                </div>
                <div>${this.escapeHTML(rule.action)}</div>
                <div>
                    <span class="severity-tag severity-${rule.severity}">${rule.severity}</span>
                </div>
                <div class="rule-actions">
                    <button class="btn btn-edit" data-id="${rule.id}" title="Edit Rule"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn btn-danger" data-id="${rule.id}" title="Delete Rule"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            this.elements.ruleList.appendChild(ruleEl);
        });
    }

    openModal(rule = null) {
        // Reset form
        this.elements.ruleId.value = '';
        this.elements.ruleName.value = '';
        this.elements.ruleDescription.value = '';
        this.elements.rulePattern.value = '';
        this.elements.ruleAction.value = 'redact';
        this.elements.ruleSeverity.value = 'High';
        this.elements.regexError.classList.add('hidden');

        if (rule) {
            // Populate form for editing
            this.elements.modalTitle.textContent = 'Edit DLP Rule';
            this.elements.ruleId.value = rule.id;
            this.elements.ruleName.value = rule.name;
            this.elements.ruleDescription.value = rule.description;
            this.elements.rulePattern.value = rule.pattern;
            this.elements.ruleAction.value = rule.action;
            this.elements.ruleSeverity.value = rule.severity;
        } else {
            this.elements.modalTitle.textContent = 'Add New Rule';
        }
        this.updateTestOutput();
        this.elements.modal.classList.remove('hidden');
    }

    closeModal() {
        this.elements.modal.classList.add('hidden');
    }

    saveRule() {
        const ruleData = {
            id: this.elements.ruleId.value,
            name: this.elements.ruleName.value.trim(),
            description: this.elements.ruleDescription.value.trim(),
            pattern: this.elements.rulePattern.value.trim(),
            action: this.elements.ruleAction.value,
            severity: this.elements.ruleSeverity.value,
        };

        if (!ruleData.name || !ruleData.pattern) {
            alert('Rule Name and Regex Pattern are required.');
            return;
        }

        // Mocking API call
        console.log('Saving rule:', ruleData);
        if (ruleData.id) { // Update existing
            const index = this.rules.findIndex(r => r.id === ruleData.id);
            if (index > -1) this.rules[index] = ruleData;
        } else { // Add new
            ruleData.id = Date.now().toString();
            this.rules.push(ruleData);
        }

        this.renderRules();
        this.closeModal();
    }

    deleteRule(id) {
        // Mocking API call
        console.log('Deleting rule:', id);
        this.rules = this.rules.filter(r => r.id !== id);
        this.renderRules();
    }

    updateTestOutput() {
        const pattern = this.elements.rulePattern.value;
        const text = this.elements.testInput.value;
        this.elements.regexError.classList.add('hidden');

        if (!pattern || !text) {
            this.elements.testOutput.textContent = text;
            return;
        }

        try {
            const regex = new RegExp(pattern, 'gi');
            const action = this.elements.ruleAction.value;
            let outputHTML = this.escapeHTML(text);

            if (action === 'redact') {
                const ruleName = this.elements.ruleName.value.trim().toUpperCase().replace(/ /g, '_') || 'MATCH';
                const replacement = `[REDACTED_${ruleName}]`;
                outputHTML = this.escapeHTML(text).replace(regex, `<span class="highlight">${replacement}</span>`);
            } else { // 'block' action, we just highlight what would be blocked
                outputHTML = this.escapeHTML(text).replace(regex, `<span class="highlight">$&</span>`);
            }
            this.elements.testOutput.innerHTML = outputHTML;

        } catch (e) {
            this.elements.regexError.classList.remove('hidden');
            this.elements.testOutput.textContent = text;
        }
    }

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                "'": '&#39;', '"': '&quot;'
            }[tag] || tag)
        );
    }
}