// Import Firebase Authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase configuration (same as your main project)
const firebaseConfig = { 
  apiKey: "AIzaSyCbD9g3mgoPtHST1KiNVR1fO8r4Oa5M4MY", 
  authDomain: "musicvideos-5078e.firebaseapp.com", 
  projectId: "musicvideos-5078e", 
  storageBucket: "musicvideos-5078e.firebasestorage.app", 
  messagingSenderId: "341867589149", 
  appId: "1:341867589149:web:b24ab89732838f1496e0f4" 
}; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase Auth connected:", auth.app.name);

// Global variables
let currentUser = null;

// Event listeners
window.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  checkAuthState();
});

function setupEventListeners() {
  // Tab switching
  window.switchTab = switchTab;
  
  // Form submissions
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("registerForm").addEventListener("submit", handleRegister);
}

function switchTab(tab) {
  // Update tab appearance
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
  
  // Update form visibility
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`${tab}Form`).classList.add('active');
  
  // Clear messages
  hideMessages();
}

function hideMessages() {
  document.getElementById('errorMessage').style.display = 'none';
  document.getElementById('successMessage').style.display = 'none';
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  document.getElementById('successMessage').style.display = 'none';
}

function showSuccess(message) {
  const successDiv = document.getElementById('successMessage');
  successDiv.textContent = message;
  successDiv.style.display = 'block';
  document.getElementById('errorMessage').style.display = 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  hideMessages();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }
  
  const loginBtn = document.getElementById('loginBtn');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    showSuccess('Successfully signed in! Redirecting...');
    
    // Redirect to main page after successful login
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Login failed. Please try again.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
    }
    
    showError(errorMessage);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  hideMessages();
  
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (!name || !email || !password || !confirmPassword) {
    showError('Please fill in all fields');
    return;
  }
  
  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }
  
  if (password.length < 6) {
    showError('Password must be at least 6 characters long');
    return;
  }
  
  const registerBtn = document.getElementById('registerBtn');
  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating account...';
  
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    
    // Create user document in Firestore
    await createUserProfile(userCredential.user.uid, {
      name: name,
      email: email,
      createdAt: new Date(),
      videosCount: 0
    });
    
    showSuccess('Account created successfully! Redirecting...');
    
    // Redirect to main page after successful registration
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak.';
        break;
    }
    
    showError(errorMessage);
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create Account';
  }
}

async function createUserProfile(uid, userData) {
  try {
    await setDoc(doc(db, 'users', uid), userData);
    console.log('✅ User profile created:', uid);
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
}

function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log('✅ User is signed in:', user.email);
    } else {
      currentUser = null;
      console.log('❌ User is signed out');
    }
  });
}

// Export functions for use in main script
window.getCurrentUser = () => currentUser;
window.signOutUser = async () => {
  try {
    await signOut(auth);
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
