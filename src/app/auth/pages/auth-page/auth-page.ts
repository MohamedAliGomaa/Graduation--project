import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthError, LoginRequest, RegisterRequest } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';
import { GoogleIdentityService } from '../../services/google-identity.service';

type AuthView = 'login' | 'register';
type Feedback = { type: 'success' | 'error'; text: string } | null;

/** Password must contain at least one letter and one number. */
const passwordStrengthValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string) ?? '';
  if (!value) return null; // "required" handles empty values
  const ok = /[A-Za-z]/.test(value) && /\d/.test(value);
  return ok ? null : { weakPassword: true };
};

/** Today's date as "yyyy-MM-dd" in the user's local time zone (used for the date input's `max`). */
function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const MIN_BIRTH_YEAR = 1900;

/**
 * Date of birth must be a real date, not in the future, and not before 1900.
 * <input type="date"> always gives "yyyy-MM-dd" (or "" when empty/incomplete).
 */
const dateOfBirthValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string) ?? '';
  if (!value) return null; // "required" handles empty values
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { invalidDate: true };

  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  const isRealDate = parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
  if (!isRealDate || y < MIN_BIRTH_YEAR) return { invalidDate: true };
  if (value > todayIso()) return { futureDate: true }; // same format, so string comparison is safe
  return null;
};

/** Removes spaces, dashes, dots and parentheses: "+20 (100) 123-4567" -> "+201001234567". */
function normalizePhone(value: string): string {
  return value.replace(/[\s\-().]/g, '');
}

/**
 * Phone number: optional leading "+", then 7–15 digits (the international E.164 maximum is 15).
 * This checks the *shape* only. It cannot know if the number exists or belongs to the user.
 */
const phoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string) ?? '';
  if (!value.trim()) return null; // "required" handles empty values
  return /^\+?\d{7,15}$/.test(normalizePhone(value)) ? null : { invalidPhone: true };
};

/** Group-level validator: confirmPassword must equal password. */
const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.css',
})
export class AuthPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly google = inject(GoogleIdentityService);

  // ---- UI state (signals) ----
  /** Login is ALWAYS the default view. */
  readonly view = signal<AuthView>('login');
  readonly loading = signal(false);
  readonly feedback = signal<Feedback>(null);
  readonly showLoginPassword = signal(false);
  readonly showRegisterPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly isLogin = computed(() => this.view() === 'login');

  // ---- Google Sign-In state ----
  /** False until a Google client ID is set in the environment file. */
  readonly googleConfigured = this.google.isConfigured;
  /** True if the Google script could not be loaded (offline, blocked by an extension, ...). */
  readonly googleUnavailable = signal(false);
  /** The empty <div> Google renders its official button into (only exists in the login view). */
  private readonly googleHost = viewChild<ElementRef<HTMLElement>>('googleHost');

  /** Latest selectable birth date (today). Bound to the date input's `max` attribute. */
  readonly today = todayIso();

  // ---- Forms ----
  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  readonly registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      dateOfBirth: ['', [Validators.required, dateOfBirthValidator]],
      phoneNumber: ['', [Validators.required, phoneValidator]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(8), Validators.maxLength(64), passwordStrengthValidator],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator] },
  );

  constructor() {
    // Whenever the login view (and its Google container) appears, render Google's button into it.
    effect((onCleanup) => {
      const host = this.googleHost()?.nativeElement;
      if (!host || !this.googleConfigured) return;

      let observer: ResizeObserver | null = null;
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
        observer?.disconnect();
      });

      this.google
        .init((idToken) => this.onGoogleCredential(idToken))
        .then(() => {
          if (cancelled || !host.isConnected) return;
          let lastWidth = 0;
          // The Google button needs a pixel width, so re-render it if the card is resized.
          observer = new ResizeObserver(() => {
            const width = host.clientWidth;
            if (width > 0 && width !== lastWidth) {
              lastWidth = width;
              this.google.renderButton(host, width);
            }
          });
          observer.observe(host);
        })
        .catch(() => {
          if (!cancelled) this.googleUnavailable.set(true);
        });
    });
  }

  // ---- View switching ----
  switchView(next: AuthView): void {
    if (this.loading() || this.view() === next) return;
    this.feedback.set(null);
    this.view.set(next);
  }

  // ---- Show / hide password ----
  toggle(flag: 'login' | 'register' | 'confirm'): void {
    const target =
      flag === 'login'
        ? this.showLoginPassword
        : flag === 'register'
          ? this.showRegisterPassword
          : this.showConfirmPassword;
    target.update((v) => !v);
  }

  /** Returns the form for a view as a plain AbstractControl so `.get(name)` works for both. */
  private formOf(form: 'login' | 'register'): AbstractControl {
    return form === 'login' ? this.loginForm : this.registerForm;
  }

  // ---- Validation helpers used by the template ----
  /** True when a control is invalid AND the user has touched it or tried to submit. */
  showError(form: 'login' | 'register', name: string): boolean {
    const c = this.formOf(form).get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  /** Mismatch error lives on the group, but is displayed under the confirm field. */
  showMismatch(): boolean {
    const c = this.registerForm.controls.confirmPassword;
    return this.registerForm.hasError('passwordMismatch') && (c.touched || c.dirty);
  }

  // ---- Submit: login ----
  onLogin(): void {
    if (this.loading()) return; // prevents duplicate submissions
    this.feedback.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const request: LoginRequest = this.loginForm.getRawValue();
    this.loading.set(true);

    this.auth
      .login(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          // TODO(backend): store the token / navigate to the dashboard once the
          // response format is confirmed. This is intentionally NOT faked.
          // The message is neutral on purpose: no session exists yet, so we must not say "signed in".
          this.feedback.set({
            type: 'success',
            text: 'The server accepted your sign-in request. Session handling is not implemented yet.',
          });
          this.loginForm.controls.password.reset('');
        },
        error: (err: AuthError) => this.handleError(err, 'login'),
      });
  }

  // ---- Submit: register ----
  onRegister(): void {
    if (this.loading()) return;
    this.feedback.set(null);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const v = this.registerForm.getRawValue();
    const request: RegisterRequest = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim(),
      password: v.password,
      confirmPassword: v.confirmPassword,
      dateOfBirth: v.dateOfBirth,
      phoneNumber: normalizePhone(v.phoneNumber),
    };

    this.loading.set(true);

    this.auth
      .register(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          const email = request.email;
          this.registerForm.reset();
          this.view.set('login');
          this.loginForm.patchValue({ email });
          this.feedback.set({
            type: 'success',
            text: 'Your account was created. You can now sign in.',
          });
        },
        error: (err: AuthError) => this.handleError(err, 'register'),
      });
  }

  // ---- Google Sign-In ----
  /** Called by Google Identity Services with the Google ID token after the user picks an account. */
  private onGoogleCredential(idToken: string): void {
    if (this.loading()) return; // prevents duplicate submissions
    this.feedback.set(null);
    this.loading.set(true);

    this.auth
      .loginWithGoogle(idToken)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          // TODO(backend): store the token / navigate to the dashboard once the
          // response format is confirmed. This is intentionally NOT faked.
          // Neutral on purpose: no session exists yet, so we must not say "signed in".
          this.feedback.set({
            type: 'success',
            text: 'The server accepted your Google sign-in request. Session handling is not implemented yet.',
          });
        },
        error: (err: AuthError) => this.feedback.set({ type: 'error', text: err.message }),
      });
  }

  /** Shown instead of the real Google button while no client ID is configured. */
  onGoogleNotConfigured(): void {
    this.feedback.set({
      type: 'error',
      text: 'Google Sign-In is not configured yet. Add your Google client ID in the environment file (see README).',
    });
  }

  // ---- Forgot password ----
  onForgotPassword(): void {
    if (this.loading()) return;
    this.feedback.set(null);

    const emailControl = this.loginForm.controls.email;
    if (emailControl.invalid) {
      emailControl.markAsTouched();
      this.feedback.set({ type: 'error', text: 'Enter your email address first, then click "Forgot password?".' });
      return;
    }

    this.loading.set(true);
    this.auth
      .requestPasswordReset(emailControl.value.trim())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () =>
          this.feedback.set({
            type: 'success',
            text: 'If this email is registered, you will receive reset instructions.',
          }),
        error: (err: AuthError) => this.handleError(err, 'login'),
      });
  }

  // ---- Error handling ----
  /** Shows the general message and attaches backend field errors to the matching controls. */
  private handleError(err: AuthError, form: 'login' | 'register'): void {
    const group = this.formOf(form);

    for (const [field, messages] of Object.entries(err.fieldErrors)) {
      const control = group.get(field);
      if (control) {
        control.setErrors({ server: messages.join(' ') });
        control.markAsTouched();
      }
    }

    this.feedback.set({ type: 'error', text: err.message });
  }

  /** Returns the backend message stored on a control (if any). */
  serverError(form: 'login' | 'register', name: string): string | null {
    const c = this.formOf(form).get(name);
    const e = c?.errors?.['server'];
    return typeof e === 'string' ? e : null;
  }
}
