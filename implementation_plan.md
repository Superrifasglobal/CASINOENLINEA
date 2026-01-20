# Firebase Auth Migration Plan

## Goal
Replace the custom NextAuth.js/Cloudflare backend with Firebase Authentication to leverage automatic email verification and simpler client-side management.

## Proposed Changes

### 1. Configuration (`src/lib/firebase.js`)
*   Initialize Firebase using environment variables (API Key, Auth Domain, Project ID).
*   Export `auth` instance.

### 2. Code Refactoring (`src/components/auth/AuthOverlay.jsx`)
*   **Import**: Replace `next-auth/react` imports with `firebase/auth`.
*   **Login**: Use `signInWithEmailAndPassword`.
*   **Register**: 
    1.  Use `createUserWithEmailAndPassword`.
    2.  Update profile with `updateProfile` (to set Display Name).
    3.  Call `sendEmailVerification` immediately after creation.
    4.  Show alert: "Registro exitoso. Por favor verifica tu correo."

### 3. Session Management (`src/context/AuthContext.jsx` - Optional but recommended)
*   Create a React Context to wrap the app and listen to `onAuthStateChanged`.
*   Or update `Navbar.jsx` to direct listening if keeping it simple.

### 4. Admin Check
*   Update logic to check `user.email === 'nexjmr07@gmail.com'` from the Firebase user object.

## Verification Plan
1.  **Register**: Create account -> Verify Alert -> Check Firebase Console (if access available) or check mock behavior.
2.  **Verify Email**: Ensure the verification flow triggers (simulated or real if keys provided).
3.  **Login**: Ensure login works with created credentials.
