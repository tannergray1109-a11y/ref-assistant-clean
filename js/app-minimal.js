// MINIMAL TEST VERSION OF APP.JS
console.log('🔥 Minimal app.js loading...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded - minimal version');
    
    // Test hamburger button
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    console.log('🍔 Hamburger button found:', !!hamburgerBtn);
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            console.log('🔄 Hamburger clicked!');
            alert('Hamburger menu works!');
        });
        console.log('✅ Hamburger listener added');
    }
    
    // Test add game button  
    const addGameBtn = document.getElementById('btnAddGame');
    console.log('🎮 Add Game button found:', !!addGameBtn);
    
    if (addGameBtn) {
        addGameBtn.addEventListener('click', () => {
            console.log('🎮 Add Game clicked!');
            alert('Add Game button works!');
        });
        console.log('✅ Add Game listener added');
    }
    
    console.log('🎉 Minimal initialization complete');
});
