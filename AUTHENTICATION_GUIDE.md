# Firebase Authentication & Name Change Troubleshooting Guide

## Overview
Your app has a complete authentication system with user name management. This guide helps troubleshoot any issues.

## What's Implemented ✅

### 1. User Authentication
- Sign up with email/password and display name
- Sign in with existing credentials
- User session persistence across page reloads
- Automatic user data sync to Firestore

### 2. Name Change Functionality
- Display name input field in Settings
- "Update" button to save changes
- Real-time UI updates (profile initials, display name)
- Data persistence in both Firebase Auth and Firestore
- Visual feedback when updating (loading state, success message)

### 3. Data Storage
- User profiles stored in `users/{uid}` collection
- User app data stored in `userData/{uid}` collection
- Automatic synchronization between local and cloud storage

## Firebase Services Required 🔧

Before the app works fully, ensure these are enabled in Firebase Console:

### 1. Authentication Service
1. Go to **Firebase Console → Authentication → Sign-in method**
2. Enable **"Email/Password"** authentication
3. Save changes

### 2. Firestore Database
1. Go to **Firebase Console → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location close to your users

## Testing the Name Change Feature 🧪

### Step 1: Create Test Account
1. Open your app: `http://localhost:8080`
2. Click "Sign Up" and create a new account
3. Include a display name during signup

### Step 2: Test Name Change
1. Go to Settings page
2. Change the display name in the input field
3. Click "Update" button
4. Verify:
   - Button shows "Updating..." then "Updated!"
   - Profile initials update in top-right corner
   - Display name persists after page refresh

### Step 3: Verify Data Persistence
1. Sign out and sign back in
2. Check that your display name is still there
3. Go to Settings - the input should show your saved name

## Debug Tools 🔍

### Firebase Debug Page
Use the debug tool at: `http://localhost:8080/firebase-debug.html`

This tests:
- Firebase initialization
- Authentication service connection
- Firestore database connection
- User creation and sign-in

### Browser Console Logs
Your app now includes detailed console logging. Check for:
- `👤 User data:` - Shows current user info
- `🔄 updateDisplayName called with:` - Name update process
- `✅ Display name update successful` - Successful updates
- `❌` - Any error messages

## Common Issues & Solutions 🛠️

### Issue: "Basic user account" with no name
**Cause**: User created before name change feature was implemented
**Solution**: 
1. Go to Settings
2. Enter desired display name
3. Click "Update"
4. Name will be saved and displayed

### Issue: Name change button doesn't work
**Checks**:
1. Are Authentication and Firestore enabled in Firebase Console?
2. Check browser console for error messages
3. Verify internet connection for Firebase sync

### Issue: Name doesn't persist after reload
**Cause**: Firestore database not enabled or accessible
**Solution**:
1. Ensure Firestore is created in Firebase Console
2. Check Firestore security rules allow read/write for authenticated users

### Issue: Firebase connection errors
**Solutions**:
1. Verify Firebase configuration in `js/firebase-config.js`
2. Check that project ID matches your Firebase project
3. Ensure services are enabled in Firebase Console

## Firestore Security Rules 🔒

For production, update Firestore rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /userData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Next Steps 📋

1. **Enable Firebase Services**: Authentication + Firestore in Firebase Console
2. **Test Name Changes**: Create account → change name → verify persistence
3. **Check Debug Logs**: Use browser console and debug page
4. **Deploy**: Once testing works locally, deploy to Firebase Hosting

## Support 💬

If issues persist:
1. Check browser console for specific error messages
2. Use the Firebase debug tool to isolate connection issues
3. Verify Firebase project configuration and service enablement

---

*Last updated: August 6, 2025*
