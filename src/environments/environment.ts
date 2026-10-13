/**
 * Environment configuration.
 *
 * ⚠️ PLACEHOLDERS — NOT CONFIRMED BACKEND VALUES ⚠️
 * Ask your ASP.NET Core developer for the real base URL and endpoint paths,
 * then update them here. Nothing else in the Angular code needs to change
 * if only these values differ.
 */
export const environment = {
  production: false,

  /** TODO(backend): replace with the real ASP.NET Core API base URL (e.g. the https URL shown by `dotnet run`). */
  apiBaseUrl: 'https://localhost:7000',

  /**
   * Google OAuth *Web client ID* (public value, safe in frontend code — NEVER put the client SECRET here).
   * Leave empty until you create one in Google Cloud Console (see README). While empty,
   * the Google button is shown but explains that Google Sign-In is not configured.
   */
  googleClientId: '',

  /** TODO(backend): confirm the real endpoint paths. */
  endpoints: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    forgotPassword: '/api/auth/forgot-password',
    /** TODO(backend): confirm the Google sign-in endpoint (receives the Google ID token). */
    googleLogin: '/api/auth/google',
  },
};
