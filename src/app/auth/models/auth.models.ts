/**
 * Typed models for authentication.
 *
 * ⚠️ These shapes are a PROPOSAL based on the fields collected by the UI.
 * They are NOT a confirmed backend contract. Confirm the exact property names,
 * casing, and types with the ASP.NET Core developer (ASP.NET usually accepts
 * camelCase JSON by default, but this must be verified).
 */

/** Data sent when the user signs in. */
export interface LoginRequest {
  email: string;
  password: string;
  /** TODO(backend): confirm whether the API supports "remember me" at all. */
  rememberMe: boolean;
}

/** Data sent when the user creates an account. */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string; // TODO(backend): confirm whether the API expects this field or only `password`.
  /** Date of birth as an ISO date string: "yyyy-MM-dd" (e.g. "1999-04-23"). TODO(backend): confirm the format. */
  dateOfBirth: string;
  /**
   * Phone number with formatting removed, e.g. "+201001234567".
   * NOTE: this is only collected, NOT verified. TODO(backend): confirm the expected format (E.164?).
   */
  phoneNumber: string;
}

/**
 * Data sent after the user signs in with Google.
 * `idToken` is the Google ID token (a JWT) that Google Identity Services returns
 * to the browser. The backend MUST verify it (signature, audience = your Google
 * client ID, expiry) before trusting it. The frontend never trusts it on its own.
 * TODO(backend): confirm the property name (`idToken`? `credential`?).
 */
export interface GoogleLoginRequest {
  idToken: string;
}

/**
 * Response of a successful login/register call.
 * TODO(backend): replace with the real response shape (token? user object? refresh token?).
 * Kept intentionally loose so no fake structure is assumed.
 */
export type AuthResponse = Record<string, unknown>;

/**
 * Friendly error produced by AuthService from any failed HTTP call.
 * Components only deal with this type, never with raw HttpErrorResponse.
 */
export interface AuthError {
  /** A general message that is safe to show to the user. */
  message: string;
  /** Field-level messages keyed by the field name sent by the backend (if any). */
  fieldErrors: Record<string, string[]>;
}
