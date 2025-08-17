document.addEventListener('DOMContentLoaded', () => {
    const roleInput = document.getElementById('role');
    const userId = document.body.dataset.userId; // Get the user ID from the body tag

    if (!roleInput || !userId) return;

    // 1. Fetch and display the current role on page load
    const loadRole = async () => {
        try {
            const response = await fetch(`/user/${userId}/role`);
            if (!response.ok) return;
            const data = await response.json();
            roleInput.value = data.role;
        } catch (error) {
            console.error("Failed to load user role:", error);
        }
    };

    // 2. Save the role whenever the user types
    const saveRole = async () => {
        try {
            await fetch(`/user/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: roleInput.value })
            });
        } catch (error) {
            console.error("Failed to save user role:", error);
        }
    };

    // Use a "debounce" function to avoid saving on every single keystroke
    let debounceTimeout;
    roleInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(saveRole, 500); // Save 500ms after user stops typing
    });

    loadRole();
});