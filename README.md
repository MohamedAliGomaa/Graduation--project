# Healthy Life — Authentication Page (Angular 21)

Login + Create Account page for the *Healthy Lifestyle Optimization Platform*.
Built with Angular 21 standalone components, Reactive Forms, and HttpClient.
Includes email/password login, **Continue with Google**, and registration with date of birth + phone number.

> ⚠️ **Status:** the UI, validation, and HTTP layer are complete, but authentication is
> **not functional until it is connected to the real ASP.NET Core backend.**
> The app sends real requests; nothing is faked. Without a backend you will see a
> "Cannot reach the server" error — that is the correct behavior.

## Design in brief
- Full-screen park/jogger illustration with a dark-green gradient overlay.
- Centered white, slightly translucent card (blur used only to keep text readable).
- Forest green primary color, soft-green accents, large readable text, visible focus rings.
- Login is the default view; the card widens and shows a two-column form for registration (one column on mobile).
- Registration has two sections: *Personal Information* (first name, last name, date of birth, phone number) and *Account Details* (email, password, confirm password).

## Project structure

```
src/
├─ environments/
│  ├─ environment.ts            ← API base URL + endpoint paths (PLACEHOLDERS)
│  └─ environment.prod.ts       ← production values (used by `ng build`)
├─ styles.css                   ← tiny global reset
└─ app/
   ├─ app.ts / app.config.ts    ← root component, provideHttpClient()
   └─ auth/
      ├─ models/auth.models.ts              ← typed request/response/error models
      ├─ services/auth.service.ts           ← ALL HTTP calls + error mapping
      ├─ services/google-identity.service.ts ← loads Google's official script, renders the button
      └─ pages/auth-page/
         ├─ auth-page.ts        ← component logic, forms, validation
         ├─ auth-page.html      ← template (login + register views)
         └─ auth-page.css       ← styles
public/images/healthy-bg.svg    ← local background image
```

## Run locally

```bash
npm install
npm start          # = ng serve → http://localhost:4200
npm run build      # production build → dist/
```
Requires Node.js 20.19+ / 22.12+ (Angular 21). The project was created with Angular CLI 21.2.

## Background image
The default background is a local illustration: `public/images/healthy-bg.svg`.
To use a real photo (e.g. from Unsplash or Pexels — check the license):
1. Save it as `public/images/healthy-bg.jpg` (about 1920×1080, under ~400 KB; compress it).
2. In `auth-page.css`, change `url('/images/healthy-bg.svg')` to `url('/images/healthy-bg.jpg')`.
3. Keep the `.page__overlay` gradient so the form stays readable.

## Switching between Login and Create Account
- `view` is a signal in `auth-page.ts`, initialized to `'login'` (so login always shows first).
- "Create Account" calls `switchView('register')`; "Sign In" calls `switchView('login')`.
- The template uses `@if (isLogin()) { …login form… } @else { …register form… }`.
- The fade/slide transition is the `.view` CSS animation (disabled for reduced-motion users).
- Switching is blocked while a request is running.

## Google Sign-In

**Status:** the frontend is implemented using the official *Google Identity Services* (GIS). It is **inactive until you add a Google client ID**,
and login is only real once the backend verifies the token. Until a client ID is set, the "Continue with Google" button shows a
"not configured" message (it never fakes a login).

### How it works
1. The user clicks Google's official button, then picks an account in Google's popup.
2. Google gives the browser an **ID token** (a signed JWT).
3. `AuthService.loginWithGoogle(idToken)` POSTs it to your backend (`endpoints.googleLogin`).
4. **The backend must verify the token** (signature, `aud` = your client ID, expiry, `iss`) and then sign the user in or create the account.
   With ASP.NET Core: `Google.Apis.Auth` → `GoogleJsonWebSignature.ValidateAsync(idToken, new() { Audience = new[] { clientId } })`.
   The frontend never decodes or trusts the token itself.

### Setup
1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. *APIs & Services → OAuth consent screen*: configure it (app name, support email; add yourself as a test user while in "Testing").
3. *APIs & Services → Credentials → Create credentials → OAuth client ID* → type **Web application**.
4. Under **Authorized JavaScript origins** add `http://localhost:4200` (and your production domain later). No redirect URI is needed for this popup flow.
5. Copy the **Client ID** (looks like `123456-abc.apps.googleusercontent.com`) into `googleClientId` in `src/environments/environment.ts` (and `environment.prod.ts`).
6. Give the **same client ID** to the backend developer (used as the token audience).

> The client ID is public and safe in frontend code. Never put the **client secret** in Angular — this flow does not need it in the frontend at all.

The button is rendered by Google (so it always follows Google's branding rules); its width adapts to the card on mobile and desktop.

## Registration fields and phone verification

Collected: first name, last name, **date of birth**, **phone number**, email, password, confirm password.

- **Date of birth** — `<input type="date">`; cannot be in the future (also blocked by the `max` attribute), must be a real date, and not before 1900.
- **Phone number** — `<input type="tel">`; 7–15 digits with an optional leading `+`. Spaces, dashes, dots and parentheses are allowed and removed before sending (`+20 (100) 123-4567` → `+201001234567`).
- Email and phone are both required and sent together.

⚠️ **The phone number is collected but NOT verified.** The format check only proves it *looks* like a phone number, not that it exists or belongs to the user.
To verify phones later you need:
- An **SMS provider** (e.g. Twilio Verify, Firebase Phone Auth, Vonage, or a local gateway) with an account and sender configuration.
- **Backend endpoints**: one to send a one-time code (rate-limited, with expiry) and one to check it, plus an `isPhoneVerified` flag on the user.
- **Frontend**: an OTP input step after registration (or in the profile). Not implemented, to avoid fake verification.
- The backend should also normalize numbers to E.164 and decide whether unverified phones are allowed.

## Expected request / response formats (PROPOSAL — not confirmed)

All endpoint paths below are placeholders from `environment.ts`. Confirm everything with the backend developer.

`POST /api/auth/login`
```json
{ "email": "ahmed@example.com", "password": "********", "rememberMe": true }
```

`POST /api/auth/register`
```json
{
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "email": "ahmed@example.com",
  "password": "********",
  "confirmPassword": "********",
  "dateOfBirth": "1999-04-23",
  "phoneNumber": "+201001234567"
}
```

`POST /api/auth/google`
```json
{ "idToken": "<Google ID token JWT>" }
```

**Responses:** not defined yet. The frontend only checks for success (2xx). Typical choices: `{ "accessToken": "...", "user": { ... } }`, or an HttpOnly cookie.
**Errors:** the frontend understands ASP.NET `ValidationProblemDetails`, e.g. `400 { "errors": { "PhoneNumber": ["Phone already in use."] } }` —
the message is shown under the matching field (control names equal the JSON property names, first letter lowercased).

## Connecting to ASP.NET Core
1. Get the real base URL and endpoint paths from the backend developer and update `src/environments/environment.ts` (and `.prod.ts`).
2. Compare `src/app/auth/models/auth.models.ts` with the backend DTOs; rename/remove fields as needed
   (e.g. `dateOfBirth` / `phoneNumber` naming, whether `confirmPassword` / `rememberMe` are accepted).
3. In `auth-page.ts`, find the `TODO(backend)` comments in the login and Google `next:` handlers:
   after login, handle the token/session and navigate to the dashboard.
4. Enable **CORS** in ASP.NET Core for `http://localhost:4200`.
5. Backend validation errors in the ASP.NET `ProblemDetails` / `ValidationProblemDetails` format
   (`errors: { Email: ["…"] }`) are mapped onto the matching form fields automatically
   (see `toAuthError` in `auth.service.ts`).

### Must be confirmed with the backend developer
- API base URL (dev + production) and CORS configuration.
- Exact paths for login, register, and forgot-password (the forgot-password endpoint may not exist yet).
- Request JSON property names, casing, and types (including the date-of-birth format and phone-number format).
- Whether `confirmPassword` and `rememberMe` are accepted or should be removed.
- Google: the endpoint path, the request property name (`idToken`?), the Google client ID, and that the backend verifies the token.
- Whether phone numbers must be unique / verified, and which SMS provider (if any) will be used.
- Password rules (the UI currently requires 8–64 chars with a letter and a number — match the server's rules).
- Response format of login/register (token? user object? refresh token?).
- How the session is kept: JWT in a response body, or an HttpOnly cookie (cookies would need `withCredentials: true`).
- Error format and status codes (400 validation, 401 bad credentials, 409 duplicate email, etc.).
- Whether email confirmation is required after registration.

## Security notes
- Passwords are only sent in the request body — never saved in localStorage/sessionStorage.
- Client-side validation is for convenience; the backend must validate everything again.
- Prefer HttpOnly cookies over localStorage for tokens if the backend supports it.

## Beginner-friendly tour of the code
- **`environment.ts`** — the one place that knows the API address.
- **`auth.models.ts`** — TypeScript interfaces that describe the data sent/received (a typo in a field name becomes a compile error).
- **`auth.service.ts`** — wraps `HttpClient.post(...)`. It also turns messy HTTP errors into a simple `AuthError { message, fieldErrors }` so the component never touches raw HTTP errors.
- **`auth-page.ts`**
  - *Signals* (`view`, `loading`, `feedback`, …) hold UI state; the template re-renders when they change.
  - *Reactive Forms*: `loginForm` and `registerForm` define each field and its validators (`required`, `email`, `minLength`, `min/max`).
  - `passwordsMatchValidator` compares password and confirmation at the form level.
  - `dateOfBirthValidator` / `phoneValidator` are small functions that return an error object (or `null` if valid), the same pattern as the password validators.
  - `onLogin()` / `onRegister()`: stop if already loading → validate (`markAllAsTouched` reveals errors) → call the service → `finalize` always turns loading off.
- **`google-identity.service.ts`** — loads Google's script only when a client ID exists, then hands the Google ID token to the component. It never logs anyone in by itself.
- **`auth-page.html`** — `@if` blocks show errors only after the user touched a field; `aria-invalid` / `aria-describedby` connect each error to its input for screen readers.
- **`auth-page.css`** — colors are CSS variables at the top; change them to re-theme the whole page.
