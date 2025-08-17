/* FILE: static/js/auth.js */
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        const passwordInput = document.getElementById('password');
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            
            // If the input is empty, hide everything
            if (password.length === 0) {
                strengthText.textContent = '';
                strengthBar.style.width = '0%';
                strengthText.className = 'strength-text';
                return;
            }

            // --- Check Password Strength ---
            let score = 0;
            if (/.{8,}/.test(password)) score++;        // Length
            if (/[a-z]/.test(password)) score++;        // Lowercase
            if (/[A-Z]/.test(password)) score++;        // Uppercase
            if (/[0-9]/.test(password)) score++;        // Number
            if (/[^A-Za-z0-9]/.test(password)) score++; // Special char

            // --- Update Strength Bar ---
            const width = (score / 5) * 100;
            strengthBar.style.width = width + '%';

            // --- Update Text and Bar Color based on new rules ---
            strengthText.className = 'strength-text'; // Reset classes

            if (password.length < 8) {
                strengthText.textContent = 'Password is too short (minimum 8 characters).';
                strengthText.classList.add('weak');
                strengthBar.style.backgroundColor = 'var(--danger)';
            } else if (score < 5) {
                strengthText.textContent = 'Password is too weak. Use a mix of characters.';
                strengthText.classList.add('medium');
                strengthBar.style.backgroundColor = 'var(--warning)';
            } else {
                strengthText.textContent = 'Strong password.';
                strengthText.classList.add('strong');
                strengthBar.style.backgroundColor = 'var(--success)';
            }
        });
    }
});
