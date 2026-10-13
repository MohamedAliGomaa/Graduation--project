import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthError,
  AuthResponse,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
} from '../models/auth.models';

/**
 * Handles every authentication-related HTTP call.
 *
 * The UI component never builds URLs or parses HTTP errors itself —
 * it only calls these methods and reads the typed result / AuthError.
 *
 * NOTE: This service sends REAL requests. If the backend is not running
 * or the endpoints below do not exist yet, the UI will correctly show an error.
 * Nothing here simulates a successful login or registration.
 *
 * SECURITY: Passwords are only sent in the request body. They are never
 * stored in localStorage / sessionStorage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiBaseUrl;
  private readonly endpoints = environment.endpoints;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.url(this.endpoints.login), request)
      .pipe(catchError((err) => throwError(() => this.toAuthError(err))));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.url(this.endpoints.register), request)
      .pipe(catchError((err) => throwError(() => this.toAuthError(err))));
  }

  /**
   * Sends the Google ID token to the backend, which must verify it and sign the user in.
   * TODO(backend): confirm the endpoint, request body and response.
   */
  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    const body: GoogleLoginRequest = { idToken };
    return this.http
      .post<AuthResponse>(this.url(this.endpoints.googleLogin), body)
      .pipe(catchError((err) => throwError(() => this.toAuthError(err))));
  }

  /** TODO(backend): confirm that a forgot-password endpoint exists and what it expects. */
  requestPasswordReset(email: string): Observable<unknown> {
    return this.http
      .post<unknown>(this.url(this.endpoints.forgotPassword), { email })
      .pipe(catchError((err) => throwError(() => this.toAuthError(err))));
  }

  // ---------------------------------------------------------------------------

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/+$/, '')}${path}`;
  }

  /**
   * Converts any HTTP failure into a friendly AuthError.
   *
   * It understands the default ASP.NET Core error body
   * (ProblemDetails / ValidationProblemDetails: `title`, `detail`, `errors`),
   * and also a plain-string body. TODO(backend): confirm the real error format.
   */
  private toAuthError(err: unknown): AuthError {
    if (!(err instanceof HttpErrorResponse)) {
      return { message: 'Something went wrong. Please try again.', fieldErrors: {} };
    }

    // status 0 = network error, CORS problem, or server not reachable.
    if (err.status === 0) {
      return {
        message:
          'Cannot reach the server. Please check your connection or try again later.',
        fieldErrors: {},
      };
    }

    const body = err.error as unknown;
    const fieldErrors: Record<string, string[]> = {};
    let message = '';

    if (typeof body === 'string' && body.trim()) {
      message = body;
    } else if (body && typeof body === 'object') {
      const b = body as {
        title?: unknown;
        detail?: unknown;
        message?: unknown;
        errors?: unknown;
      };

      if (b.errors && typeof b.errors === 'object' && !Array.isArray(b.errors)) {
        for (const [key, value] of Object.entries(b.errors as Record<string, unknown>)) {
          const list = Array.isArray(value) ? value.map(String) : [String(value)];
          fieldErrors[this.normalizeFieldName(key)] = list;
        }
      }

      if (typeof b.detail === 'string') message = b.detail;
      else if (typeof b.message === 'string') message = b.message;
      else if (typeof b.title === 'string') message = b.title;
    }

    if (!message) {
      message = this.defaultMessageFor(err.status);
    }

    return { message, fieldErrors };
  }

  /** ASP.NET sends "Email" / "Password"; Angular form controls use "email" / "password". */
  private normalizeFieldName(key: string): string {
    return key.charAt(0).toLowerCase() + key.slice(1);
  }

  private defaultMessageFor(status: number): string {
    switch (status) {
      case 400:
        return 'Some of the information you entered is not valid.';
      case 401:
        return 'Incorrect email or password.';
      case 403:
        return 'You do not have permission to do this.';
      case 404:
        return 'The service is not available right now. Please try again later.';
      case 409:
        return 'An account with this email already exists.';
      case 429:
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return status >= 500
          ? 'The server had a problem. Please try again later.'
          : 'Something went wrong. Please try again.';
    }
  }
}
