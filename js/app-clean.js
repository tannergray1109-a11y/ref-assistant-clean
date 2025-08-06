// Clean, minimal version of app.js
console.log('🚀 App.js loading...');

// Simple screen switching
function showScreen(name) {
  console.log(`📱 Switching to screen: ${name}`);
  
  const screens = document.querySelectorAll('.screen');
  const navBtns = document.querySelectorAll('.nav-btn');
  
  // Hide all screens
  screens.forEach(s => s.classList.add('hidden'));
  
  // Show target screen
  const targetScreen = document.getElementById(name);
  if (targetScreen) {
    targetScreen.classList.remove('hidden');
    console.log(`✅ Screen ${name} shown`);
  } else {
    console.error(`❌ Screen ${name} not found`);
  }
  
  // Update nav buttons
  navBtns.forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-screen="${name}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM Ready - Initializing...');
  
  // Hamburger menu functionality
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const navOverlay = document.getElementById('navOverlay');
  
  console.log('Elements found:');
  console.log('- Hamburger:', !!hamburgerBtn);
  console.log('- Sidebar:', !!sidebar);
  console.log('- Overlay:', !!navOverlay);
  
  function toggleNav() {
    console.log('🍔 Toggling navigation');
    if (hamburgerBtn) hamburgerBtn.classList.toggle('active');
    if (sidebar) sidebar.classList.toggle('active');
    if (navOverlay) navOverlay.classList.toggle('active');
  }
  
  function closeNav() {
    console.log('❌ Closing navigation');
    if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    if (sidebar) sidebar.classList.remove('active');
    if (navOverlay) navOverlay.classList.remove('active');
  }
  
  // Add hamburger click handler
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', toggleNav);
    console.log('✅ Hamburger click handler added');
  }
  
  // Add overlay click handler
  if (navOverlay) {
    navOverlay.addEventListener('click', closeNav);
    console.log('✅ Overlay click handler added');
  }
  
  // Navigation buttons
  const navBtns = document.querySelectorAll('.nav-btn');
  console.log(`📝 Found ${navBtns.length} navigation buttons`);
  
  navBtns.forEach((btn, index) => {
    const screen = btn.dataset.screen;
    console.log(`🔗 Setting up nav button ${index}: ${screen}`);
    
    btn.addEventListener('click', () => {
      console.log(`🎯 Nav button clicked: ${screen}`);
      showScreen(screen);
      closeNav();
    });
  });
  
  // Add Game button - detailed debugging
  const addGameBtn = document.getElementById('btnAddGame');
  console.log('🔍 Debugging Add Game button:');
  console.log('- Button element:', addGameBtn);
  console.log('- Button found:', !!addGameBtn);
  console.log('- Button visible:', addGameBtn ? getComputedStyle(addGameBtn).display !== 'none' : 'N/A');
  console.log('- Parent element:', addGameBtn ? addGameBtn.parentElement : 'N/A');
  
  if (addGameBtn) {
    addGameBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🎮 Add Game button clicked!');
      alert('Add Game functionality working!');
    });
    console.log('✅ Add Game click handler added');
    
    // Also try immediate click test
    addGameBtn.style.border = '3px solid red';
    addGameBtn.title = 'Debug: Add Game button found and styled';
  } else {
    console.error('❌ Add Game button NOT found!');
    // Search for it manually
    const allButtons = document.querySelectorAll('button');
    console.log('All buttons found:', allButtons.length);
    allButtons.forEach((btn, i) => {
      console.log(`Button ${i}:`, btn.id, btn.textContent, btn);
    });
  }
  
  // Logo button
  const logoButton = document.getElementById('logoButton');
  if (logoButton) {
    logoButton.addEventListener('click', () => {
      console.log('🏠 Logo clicked - going to dashboard');
      showScreen('dashboard');
    });
    console.log('✅ Logo click handler added');
  }
  
  // Show dashboard by default
  showScreen('dashboard');
  
  console.log('🎉 Initialization complete!');
});
