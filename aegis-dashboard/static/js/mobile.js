document.addEventListener('DOMContentLoaded', () => {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (mobileNavToggle && sidebar && overlay) {
        const toggleSidebar = () => {
            sidebar.classList.toggle('is-visible');
            overlay.classList.toggle('is-visible');
        };

        mobileNavToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar); // Also close when clicking the overlay
    }
});