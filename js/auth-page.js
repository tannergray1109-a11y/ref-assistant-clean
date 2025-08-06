// Authentication Page JavaScript
// Handles sign in/sign up functionality on the separate auth page

// Wait for Firebase to be initialized
function waitForFirebase() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds timeout
    
    const checkFirebase = () => {
      attempts++;
      console.log(`Firebase check attempt ${attempts}...`);
      
      if (window.firebaseAuth && window.firebaseDb) {
        console.log('✅ Firebase initialized successfully');
        resolve();
      } else if (attempts >= maxAttempts) {
        console.error('❌ Firebase initialization timeout');
        reject(new Error('Firebase failed to initialize within 5 seconds'));
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

  // Sign up new user
  async signUp(email, password, displayName) {
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
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
      return { success: false, error: error.message };
    }
  },

  // Sign in existing user
  async signIn(email, password) {
    try {
      const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
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
      return { success: false, error: error.message };
    }
  }
};

// UI Helper Functions
function showAuthError(message) {
  const authError = document.getElementById('authError');
  if (authError) {
    authError.textContent = message;
    authError.classList.remove('hidden');
    setTimeout(() => {
      authError.classList.add('hidden');
    }, 5000);
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
      
      // Safety timeout - automatically hide spinner after 30 seconds
      setTimeout(() => {
        if (spinner && !spinner.classList.contains('hidden')) {
          console.warn('⚠️ Loading timeout - hiding spinner');
          setLoading(false);
          showAuthError('Request timed out. Please check your connection and try again.');
        }
      }, 30000);
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
  
  // Ensure all spinners are hidden on page load
  setLoading(false);
  
  // Initialize auth service with error handling
  try {
    await AuthService.init();
  } catch (error) {
    console.error('❌ Failed to initialize auth:', error);
    showAuthError('Authentication service failed to load. Please refresh the page.');
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
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        console.log('🔐 Attempting to sign in:', email);
        const result = await AuthService.signIn(email, password);
        setLoading(false);
        
        if (!result.success) {
          console.error('❌ Sign in failed:', result.error);
          showAuthError(getFirebaseErrorMessage(result.error));
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
      
      const result = await AuthService.signUp(email, password, name);
      setLoading(false);
      
      if (!result.success) {
        showAuthError(getFirebaseErrorMessage(result.error));
      }
      // If successful, user will be redirected by auth state listener
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
