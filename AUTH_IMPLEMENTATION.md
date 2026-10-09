# Authentication implementation

The desktop and mobile HF-02 through HF-04 screens use the locally bundled DM Sans font and shared controls. The phone status bar and home indicator in the Figma exports belong to the device, so they are not rendered inside the webpage.

## Run locally

1. The ignored `.env.local` has been created with the documented local API address. For another checkout, copy `.env.example` to `.env.local`.
2. Set `VITE_API_URL` to the backend origin. The integration guide uses `http://localhost:4000` locally; it is also the development fallback.
3. Set `VITE_GOOGLE_CLIENT_ID` to the Google OAuth web client ID. Register the frontend origin (including its port) in Google Cloud.
4. Run `npm install`, then `npm run dev`. Restart Vite after changing environment variables.
5. Run `npm run build`, `npm run lint`, and `npm run test:auth` before merging.

All HTTP calls go through `src/lib/apiClient.ts`. The shared client was imported from `origin/feat/api-client` (708d7e3), retaining `apiClient`, `ApiError`, and `tokenStore`. It is extended with public-request support, safe URL joining, timeout/network errors, and session-expiry notifications. No form uses raw fetch. Unrelated dashboard changes from that branch were not imported.

## Routes

- `/user-type`: unselected, learner-selected, institution-selected account choices.
- `/signup`: learner signup, Google signup, Terms consent, submission state.
- `/institution-signup`: two steps with in-memory form persistence, work-domain validation, server errors and submission state.
- `/login`: password/Google sign-in, invalid-credential state, first-time Google role/Terms completion.
- `/forgot-password`: request reset.
- `/reset/check-email`: confirmation, 45-second resend cooldown, change email.
- `/reset-password?token=...`: set a new password using the real email-link token.
- `/password-updated`: successful reset confirmation.
- `/verify-email?token=...`: redeem email verification; without a token, show verification instructions and resend for the signed-in account.
- `/account-status`: pending institution review or missing institution setup.
- Successful learner signup (email or Google): `/onboarding`.
- Successful login (email or Google): `/app/dashboard` for both roles for now.
- First-time Google account completion follows the signup route; institution signup retains its verification/setup flow.

## Backend contract

`token` is saved using `tokenStore.set(token)` under `auth_token` in localStorage. The complete response `user` is saved as JSON under `auth_user` and supplied to the sidebar, dashboard, and onboarding through AuthProvider. Authenticated requests add `Authorization: Bearer <token>`. Session restoration reads the stored user and validates the session with `GET /api/auth/me`, updating the stored user with the latest response. Logout and a protected 401 clear both values. Password-reset success clears the local session. Other devices are invalidated by the backend, not by client-side promises.

Learner registration sends `fullName, email, password, acceptedTerms`. Admin registration sends `institutionName, website, registrationNumber?, fullName, jobTitle, email, password, authorised`. Errors shaped as `errors: { field: [messages] }` are passed to React Hook Form. Admin codes `FREE_EMAIL`, `DOMAIN_MISMATCH`, and `INSTITUTION_EXISTS` receive specific guidance; errors in institution fields return the form to step 1 without dropping entered values. Email subdomains are accepted.

Google uses Google Identity Services and sends its ID credential to `POST /api/auth/google`. New users explicitly supply role and acceptedTerms; existing users do not silently accept terms. The application retains Google's pending credential only in component memory. The customized DM Sans button opens the GIS One Tap/credential prompt; availability depends on browser/account settings. Missing configuration or a dismissed/unavailable prompt produces an actionable email-sign-in fallback.

Reset request uses `POST /api/auth/forgot-password { email }`; reset uses `POST /api/auth/reset-password { token, password }`. No fake tokens, success timers, or browser-only password changes are used. “Open the link” explains how to follow the secure link in the delivered email; it cannot manufacture or open a backend-generated secret reset URL. Resend only makes a request when clicked after the cooldown.

## Integration follow-ups

- Confirm the deployed backend URL, CORS allowance for the frontend origin, Google client ID, and frontend email-link URLs with the backend team.
- The guide does not supply an endpoint to attach an institution to an existing Google admin account. Such accounts are directed to an honest setup-status screen; no duplicate admin registration is attempted.
- The resend-verification request includes the current Bearer token when available and the email in the JSON body. Confirm this payload with the backend team, since the provided endpoint list does not specify its body.
- Publish the actual Terms and Privacy Policy at `/terms` and `/privacy`; their content was not included in the design or backend guide.
- Live authentication, email delivery, and Google sign-in require the real backend and Google configuration. Local tests mock network responses and do not create real accounts or send email.

## GitHub dashboard integration

The dashboard, projects, onboarding, and their shared components were imported from origin/main (237b422). The dashboard, sidebar, and onboarding now use the authenticated user's name rather than the hard-coded demo name. Dashboard counts/activity and project storage still use the upstream mock data; connecting those feature APIs is separate from authentication. No changes have been pushed to GitHub by this task.
