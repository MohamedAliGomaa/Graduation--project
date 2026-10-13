# Healthy Life — Auth API Contract (DRAFT, to agree with the backend)

**Status: NOT CONFIRMED.** Every endpoint, property name and format below is a *proposal*
taken from what the Angular frontend currently sends (`src/environments/environment.ts`,
`src/app/auth/models/auth.models.ts`). Nothing here has been tested against the real
ASP.NET Core API. Fill in the **Answer** column together, then update the frontend to match.

Frontend: Angular 21 · Backend: ASP.NET Core Web API

---

## 1. Environment and CORS

| # | Question | Answer |
|---|----------|--------|
| 1.1 | API base URL in development (the URL printed by `dotnet run`; http or https? which port?) | |
| 1.2 | API base URL in production / staging | |
| 1.3 | Is CORS enabled for `http://localhost:4200` (origin only, no path)? Which headers/methods are allowed? | |
| 1.4 | Does the dev certificate work on both machines (`dotnet dev-certs https --trust`)? | |
| 1.5 | If CORS is not enabled yet: should the frontend use an Angular dev proxy instead (see section 8)? | |

Current frontend placeholder: `apiBaseUrl: 'https://localhost:7000'` (**not** confirmed).

## 2. Endpoints

| # | Purpose | Frontend currently calls | Confirmed path | Exists yet? |
|---|---------|--------------------------|----------------|-------------|
| 2.1 | Register | `POST /api/auth/register` | | |
| 2.2 | Login | `POST /api/auth/login` | | |
| 2.3 | Google sign-in | `POST /api/auth/google` | | |
| 2.4 | Forgot password | `POST /api/auth/forgot-password` | | |
| 2.5 | Reset password (will need a frontend page later) | not implemented | | |
| 2.6 | Logout / refresh token (if any) | not implemented | | |

## 3. Register request

Proposed body (`POST` JSON):

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

Questions:

| # | Question | Answer |
|---|----------|--------|
| 3.1 | Are the property names and casing exactly these? (ASP.NET Core serializes camelCase by default — confirm no custom naming policy.) | |
| 3.2 | Does the API need `confirmPassword`, or should the frontend send only `password`? | |
| 3.3 | Date of birth format: `yyyy-MM-dd` string? (`DateOnly` or `DateTime` in the DTO?) | |
| 3.4 | Phone format: E.164 (`+201001234567`) as sent now? Must it be unique? | |
| 3.5 | Is the phone number verified (SMS/OTP)? Or only stored? (Frontend does **not** verify phones.) | |
| 3.6 | Minimum age rule, if any? (Frontend only blocks future dates and years before 1900.) | |
| 3.7 | Is email confirmation required before the first login? | |
| 3.8 | What should the frontend do after a successful register: go to login, or is the user logged in immediately? | |

## 4. Password rules

Frontend currently requires: 8–64 characters, at least one letter and one number.

| # | Question | Answer |
|---|----------|--------|
| 4.1 | What are the server's real rules (ASP.NET Identity defaults require upper/lower case, digit and symbol)? | |
| 4.2 | Final rules to show in the UI (the frontend must match the server) | |

## 5. Login request

Proposed body:

```json
{ "email": "ahmed@example.com", "password": "********", "rememberMe": true }
```

| # | Question | Answer |
|---|----------|--------|
| 5.1 | Property names exact? Login by email only, or also phone/username? | |
| 5.2 | Does the API accept `rememberMe`? If not, the frontend will remove the checkbox or stop sending it. | |
| 5.3 | Lockout / rate limiting (which status code, e.g. 429 or 423)? | |

## 6. Session design (decides what the frontend builds next)

| # | Question | Answer |
|---|----------|--------|
| 6.1 | JWT in the response body, or an HttpOnly cookie? | |
| 6.2 | If JWT: exact response shape (`accessToken`, `expiresIn`, `refreshToken`, `user`?) | |
| 6.3 | If cookie: `SameSite`/`Secure` settings, and CORS `AllowCredentials` (the frontend would then need `withCredentials: true`) | |
| 6.4 | Is there a refresh-token flow? Token lifetime? | |
| 6.5 | Endpoint to get the current user (e.g. `GET /api/me`) and its response shape | |
| 6.6 | Roles/permissions needed in the frontend (e.g. admin vs user)? | |

Until 6.1–6.2 are answered the frontend deliberately does **not** store tokens, add routing,
or add an AuthGuard. After a successful login/register response it shows a neutral message only.

## 7. Google sign-in

Proposed body: `{ "idToken": "<Google ID token JWT>" }`

| # | Question | Answer |
|---|----------|--------|
| 7.1 | Endpoint path and property name (`idToken` or `credential`)? | |
| 7.2 | Who creates the Google Cloud project and the OAuth **Web client ID**? Add `http://localhost:4200` as an Authorized JavaScript origin. | |
| 7.3 | The **same client ID** must be used in the frontend (`googleClientId` in `environment.ts`) and as the token audience in the backend. | |
| 7.4 | Backend verifies the token (signature, `aud`, `iss`, expiry), e.g. with `Google.Apis.Auth` `GoogleJsonWebSignature.ValidateAsync`. Confirm. | |
| 7.5 | A Google user has no phone/date of birth: is an account created anyway, or must the user complete a profile step afterwards? | |
| 7.6 | If an account with the same email already exists (registered with a password), link it or reject? | |

Status: the frontend button is implemented but **inactive** (no Client ID) and has **never been tested end to end**.

## 8. Dev proxy vs CORS

The frontend currently calls the API with an **absolute URL** (`apiBaseUrl` + path), so the browser talks
to the backend directly and the backend must allow CORS for `http://localhost:4200`.

A proxy would only be used if `apiBaseUrl` is changed to an empty string (relative URLs) and a
`proxy.conf.json` pointing to the backend URL is wired into `angular.json`. It is **not** added yet because
the backend URL/port is unknown. Decide together: (a) enable CORS on the backend (recommended, it is also
needed in production unless both are served from one domain), or (b) use a dev proxy.

## 9. Error format

The frontend understands the default ASP.NET `ProblemDetails` / `ValidationProblemDetails`:

```json
{ "title": "One or more validation errors occurred.", "status": 400,
  "errors": { "PhoneNumber": ["Phone already in use."] } }
```

and a plain string body. Field keys are mapped to form controls by lowercasing the first letter.

| # | Question | Answer |
|---|----------|--------|
| 9.1 | Is this the error format the API returns? Any custom envelope (`{ success, message, data }`)? | |
| 9.2 | Status codes: 400 validation, 401 wrong credentials, 409 duplicate email/phone — confirm. | |
| 9.3 | Are error messages safe to show to users (no internal details)? Language: English only? | |

## 10. Responses

| # | Question | Answer |
|---|----------|--------|
| 10.1 | Register success response (status code and body) | |
| 10.2 | Login success response (see section 6) | |
| 10.3 | Forgot-password: always 200 regardless of whether the email exists (avoids account enumeration)? | |

## 11. Work needed on each side after the answers

**Backend:** implement/confirm endpoints, enable CORS, share the Swagger URL (or OpenAPI JSON) so the
frontend can verify the shapes, verify Google tokens server-side.

**Frontend (after answers):** update `environment.ts` and `auth.models.ts`; remove unused fields;
implement session handling (token storage or cookies), routing and AuthGuard; replace the neutral
success messages with real navigation; test against the running API and record the results.

## 12. Decision log

| Date | Decision | Agreed by |
|------|----------|-----------|
| | | |
