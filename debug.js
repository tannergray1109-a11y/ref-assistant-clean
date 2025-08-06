// Simple console debug script
console.log('Debug script starting...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Check if elements exist
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const addGameBtn = document.getElementById('btnAddGame');
    const sidebar = document.getElementById('sidebar');
    
    console.log('Elements found:');
    console.log('- Hamburger button:', hamburgerBtn);
    console.log('- Add Game button:', addGameBtn);
    console.log('- Sidebar:', sidebar);
    
    // Test click handlers
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            console.log('🍔 Hamburger clicked!');
            alert('Hamburger menu clicked!');
        });
        console.log('✅ Hamburger click handler added');
    } else {
        console.error('❌ Hamburger button not found');
    }
    
    if (addGameBtn) {
        addGameBtn.addEventListener('click', () => {
            console.log('🎮 Add Game clicked!');
            alert('Add Game button clicked!');
        });
        console.log('✅ Add Game click handler added');
    } else {
        console.error('❌ Add Game button not found');
    }
});
