/**
 * Production configuration. `ng build` uses the production configuration by default, and
 * angular.json (build > configurations > production > fileReplacements) swaps
 * environment.ts for this file. `ng serve` uses the development configuration,
 * so it keeps using environment.ts.
 *
 * ⚠️ PLACEHOLDER values — replace with the deployed API URL.
 */
export const environment = {
  production: true,

  /** TODO(backend): replace with the deployed API base URL. */
  apiBaseUrl: 'https://your-api-domain.example',

  /**
   * Google OAuth *Web client ID* (public value, safe in frontend code — NEVER put the client SECRET here).
   * Leave empty until you create one in Google Cloud Console (see README). While empty,
   * the Google button is shown but explains that Google Sign-In is not configured.
   */
  googleClientId: '',

  endpoints: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    forgotPassword: '/api/auth/forgot-password',
    /** TODO(backend): confirm the Google sign-in endpoint (receives the Google ID token). */
    googleLogin: '/api/auth/google',
  },
};
