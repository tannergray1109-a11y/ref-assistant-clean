// Authentication Page JavaScript
// Handles sign in/sign up functionality on the separate auth page

// Wait for Firebase to be initialized
function waitForFirebase() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds timeout (reduced from 5)
    
    const checkFirebase = () => {
      attempts++;
      console.log(`Firebase check attempt ${attempts}...`);
      
      if (window.firebaseAuth && window.firebaseDb) {
        console.log('✅ Firebase initialized successfully');
        resolve();
      } else if (attempts >= maxAttempts) {
        console.error('❌ Firebase initialization timeout after 3 seconds');
        reject(new Error('Firebase failed to initialize within 3 seconds'));
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
}

// Auth State Management
let currentUser = null;
let isSignUpMode = false;

// Authentication Functions
const AuthService = {
  // Initialize auth service
  async init() {
    try {
      console.log('🚀 Initializing auth service...');
      await waitForFirebase();
      console.log('✅ Firebase ready, setting up auth listener...');
      
      // Set up auth state listener
      const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      onAuthStateChanged(window.firebaseAuth, (user) => {
        console.log('Auth state changed:', user ? `Logged in as ${user.email}` : 'Not logged in');
        currentUser = user;
        if (user) {
          // User is signed in, redirect to main app
          console.log('✅ User authenticated, redirecting to main app...');
          window.location.href = 'index.html';
        }
      });
      console.log('✅ Auth service initialized successfully');
    } catch (error) {
      console.error('❌ Auth service initialization failed:', error);
      showAuthError('Failed to initialize authentication. Please refresh the page.');
      throw error;
    }
  },

  // Check if Firebase services are properly configured
  async checkServices() {
    try {
      console.log('🔍 Checking Firebase services...');
      
      // Test if auth is working by checking current user (should be null for signed out)
      const currentUser = window.firebaseAuth.currentUser;
      console.log('Auth service check - current user:', currentUser);
      
      // Test if Firestore is accessible
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      // This will fail if Firestore isn't enabled
      await getDoc(doc(window.firebaseDb, 'test', 'connection'));
      
      console.log('✅ Firebase services appear to be working');
      return { success: true };
    } catch (error) {
      console.error('❌ Firebase services check failed:', error);
      return { 
        success: false, 
        error: error.message,
        code: error.code
      };
    }
  },

  // Sign up new user
  async signUp(email, password, displayName) {
    try {
      console.log('📝 Attempting sign up for:', email);
      const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      console.log('🔥 Firebase Auth object:', window.firebaseAuth);
      console.log('🗄️ Firebase Firestore object:', window.firebaseDb);
      
      const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
      const user = userCredential.user;
      
      // Update user profile
      await updateProfile(user, { displayName: displayName });
      
      // Create user profile in Firestore
      await setDoc(doc(window.firebaseDb, 'users', user.uid), {
        email: user.email,
        displayName: displayName,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      
      // Initialize empty user data
      await setDoc(doc(window.firebaseDb, 'userData', user.uid), {
        games: [],
        expenses: [],
        mileage: [],
        lastUpdated: serverTimestamp()
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return { success: false, error: error.message, code: error.code };
    }
  },

  // Sign in existing user
  async signIn(email, password) {
    try {
      console.log('🔑 Attempting sign in for:', email);
      const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      console.log('🔥 Firebase Auth object:', window.firebaseAuth);
      const userCredential = await signInWithEmailAndPassword(window.firebaseAuth, email, password);
      const user = userCredential.user;
      
      // Update last login
      try {
        await updateDoc(doc(window.firebaseDb, 'users', user.uid), {
          lastLogin: serverTimestamp()
        });
      } catch (e) {
        // Ignore if user document doesn't exist yet
        console.log('Could not update last login:', e);
      }
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return { success: false, error: error.message, code: error.code };
    }
  }
};

// UI Helper Functions
function showAuthError(message, errorCode = null) {
  const authError = document.getElementById('authError');
  if (authError) {
    console.error('🚨 Showing auth error:', message, errorCode);
    
    // Provide more user-friendly error messages
    let displayMessage = message;
    if (errorCode) {
      switch (errorCode) {
        case 'auth/user-not-found':
          displayMessage = 'No account found with this email address. Please sign up first.';
          break;
        case 'auth/wrong-password':
          displayMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/email-already-in-use':
          displayMessage = 'An account with this email already exists. Please sign in instead.';
          break;
        case 'auth/weak-password':
          displayMessage = 'Password should be at least 6 characters long.';
          break;
        case 'auth/invalid-email':
          displayMessage = 'Please enter a valid email address.';
          break;
        case 'auth/operation-not-allowed':
          displayMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          displayMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/timeout':
          displayMessage = 'Connection timed out. Please ensure Firebase Authentication is enabled in your Firebase Console.';
          break;
        default:
          displayMessage = message;
      }
    }
    
    authError.textContent = displayMessage;
    authError.classList.remove('hidden');
    setTimeout(() => {
      authError.classList.add('hidden');
    }, 8000); // Longer timeout for more detailed messages
  }
}

function setLoading(isLoading) {
  const submitBtns = document.querySelectorAll('.auth-submit');
  submitBtns.forEach(btn => {
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    
    if (isLoading) {
      btn.disabled = true;
      text.classList.add('hidden');
      spinner.classList.remove('hidden');
      
      // Safety timeout - automatically hide spinner after 15 seconds
      setTimeout(() => {
        if (spinner && !spinner.classList.contains('hidden')) {
          console.warn('⚠️ Loading timeout - hiding spinner');
          setLoading(false);
          showAuthError('Request timed out. Please check that Firebase Authentication is enabled and try again.', 'auth/timeout');
        }
      }, 15000); // Reduced to 15 seconds
    } else {
      btn.disabled = false;
      text.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  });
}

function toggleAuthMode() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authTitle = document.getElementById('authTitle');
  const authSwitchText = document.getElementById('authSwitchText');
  const authSwitchBtn = document.getElementById('authSwitchBtn');
  
  isSignUpMode = !isSignUpMode;
  
  if (isSignUpMode) {
    // Switch to sign up mode
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authTitle.textContent = 'Create Your Account';
    authSwitchText.textContent = 'Already have an account?';
    authSwitchBtn.textContent = 'Sign In';
  } else {
    // Switch to sign in mode
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = 'Welcome Back';
    authSwitchText.textContent = 'New to Ref Assistant?';
    authSwitchBtn.textContent = 'Create Account';
  }
  
  // Clear any errors
  const authError = document.getElementById('authError');
  if (authError) {
    authError.classList.add('hidden');
  }
}

function getFirebaseErrorMessage(error) {
  switch (error) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return error;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎯 Auth page DOM loaded');
  
  // IMMEDIATELY ensure all spinners are hidden on page load
  const submitBtns = document.querySelectorAll('.auth-submit');
  submitBtns.forEach(btn => {
    btn.disabled = false;
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    if (text) text.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
  });
  
  console.log('✅ Spinners hidden on page load');
  
  // Clear any error messages
  const authError = document.getElementById('authError');
  if (authError) {
    authError.classList.add('hidden');
  }
  
  // Set a safety timeout to catch any hanging operations
  setTimeout(() => {
    console.log('🔍 Safety check - ensuring spinners are still hidden');
    submitBtns.forEach(btn => {
      const spinner = btn.querySelector('.btn-spinner');
      if (spinner && !spinner.classList.contains('hidden')) {
        console.warn('⚠️ Found visible spinner, hiding it');
        spinner.classList.add('hidden');
        btn.disabled = false;
        const text = btn.querySelector('.btn-text');
        if (text) text.classList.remove('hidden');
      }
    });
  }, 3000); // Check after 3 seconds
  
  // Initialize auth service with error handling
  try {
    console.log('🚀 Starting Firebase initialization...');
    await AuthService.init();
    console.log('✅ Firebase initialization completed');
    
    // Check if Firebase services are working
    console.log('🔍 Checking Firebase services status...');
    const serviceCheck = await AuthService.checkServices();
    if (!serviceCheck.success) {
      console.warn('⚠️ Firebase services check failed:', serviceCheck.error);
      showAuthError('Firebase services need to be configured. Please ensure Authentication and Firestore are enabled in your Firebase Console.', serviceCheck.code);
    } else {
      console.log('✅ Firebase services are working correctly');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase auth:', error);
    showAuthError('Firebase failed to load. This usually means Authentication or Firestore services are not enabled. Please check your Firebase Console.');
    return;
  }
  
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📧 Login form submitted');
      setLoading(true);
      
      try {
        // First check if Firebase services are working
        const serviceCheck = await AuthService.checkServices();
        if (!serviceCheck.success) {
          setLoading(false);
          showAuthError('Firebase services are not properly configured. Please ensure Authentication and Firestore are enabled.', serviceCheck.code);
          return;
        }
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        console.log('🔐 Attempting to sign in:', email);
        const result = await AuthService.signIn(email, password);
        setLoading(false);
        
        if (!result.success) {
          console.error('❌ Sign in failed:', result.error, result.code);
          showAuthError(result.error, result.code);
        } else {
          console.log('✅ Sign in successful');
        }
        // If successful, user will be redirected by auth state listener
      } catch (error) {
        console.error('❌ Login error:', error);
        setLoading(false);
        showAuthError('An unexpected error occurred. Please try again.');
      }
    });
  }
  
  // Signup Form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
          setLoading(false);
          showAuthError('Passwords do not match');
          return;
        }
        
        if (name.length < 2) {
          setLoading(false);
          showAuthError('Please enter your full name');
          return;
        }
        
        // Check Firebase services before attempting signup
        const serviceCheck = await AuthService.checkServices();
        if (!serviceCheck.success) {
          setLoading(false);
          showAuthError('Firebase services are not properly configured. Please ensure Authentication and Firestore are enabled.', serviceCheck.code);
          return;
        }
        
        const result = await AuthService.signUp(email, password, name);
        setLoading(false);
        
        if (!result.success) {
          console.error('❌ Sign up failed:', result.error, result.code);
          showAuthError(result.error, result.code);
        }
        // If successful, user will be redirected by auth state listener
      } catch (error) {
        console.error('❌ Signup error:', error);
        setLoading(false);
        showAuthError('An unexpected error occurred during signup. Please try again.');
      }
    });
  }
  
  // Auth Mode Toggle
  const authSwitchBtn = document.getElementById('authSwitchBtn');
  if (authSwitchBtn) {
    authSwitchBtn.addEventListener('click', toggleAuthMode);
  }
  
  // Form validation
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value && !input.validity.valid) {
        input.style.borderColor = '#ef4444';
      } else {
        input.style.borderColor = '';
      }
    });
  });
  
  // Password confirmation validation
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const signupPasswordInput = document.getElementById('signupPassword');
  
  if (confirmPasswordInput && signupPasswordInput) {
    confirmPasswordInput.addEventListener('input', () => {
      if (confirmPasswordInput.value && confirmPasswordInput.value !== signupPasswordInput.value) {
        confirmPasswordInput.style.borderColor = '#ef4444';
      } else {
        confirmPasswordInput.style.borderColor = '';
      }
    });
  }
});

// Check for existing session on page load
window.addEventListener('load', async () => {
  await waitForFirebase();
  
  // Check if user is already signed in
  const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
  onAuthStateChanged(window.firebaseAuth, (user) => {
    if (user) {
      // User is already signed in, redirect to main app
      window.location.href = 'index.html';
    }
  });
});
