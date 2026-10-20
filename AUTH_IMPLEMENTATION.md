# Authentication implementation

The desktop and mobile HF-02 through HF-04 screens use the locally bundled DM Sans font and shared controls. The phone status bar and home indicator in the Figma exports belong to the device, so they are not rendered inside the webpage.

## Run locally

1. The ignored `.env.local` is configured with the supplied Render API address and public Google web client ID. For another checkout, copy `.env.example` to `.env.local`.
2. Set `VITE_API_URL` to `https://skillcred-backend-fc5i.onrender.com`, or to `http://localhost:4000` when running a local backend. The latter remains the development fallback.
3. The public `VITE_GOOGLE_CLIENT_ID` is included in `.env.example`. Register the frontend origin (including its port) in Google Cloud. Never put a Google client secret in frontend files or `VITE_*` variables.
4. Run `npm install`, then `npm run dev`. Restart Vite after changing environment variables.
5. Run `npm run build`, `npm run lint`, and `npm run test:auth` before merging.

All HTTP calls go through `src/lib/apiClient.ts`. The shared client was imported from `origin/feat/api-client` (708d7e3), retaining `apiClient`, `ApiError`, and `tokenStore`. It is extended with public-request support, safe URL joining, timeout/network errors, and session-expiry notifications. No form uses raw fetch. Unrelated dashboard changes from that branch were not imported.

## Routes

- `/user-type`: unselected, learner-selected, institution-selected account choices.
- `/signup`: redirects to `/user-type` so new users choose their account type first.
- `/signup/learner`: learner signup, Google signup, Terms consent, submission state after choosing Learner.
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

Google uses the official Google Identity Services button with popup UX and sends the returned ID credential to POST /api/auth/google. New learners explicitly accept Terms before the Google button is enabled; existing users do not silently accept terms. Popup responses are associated with their originating button, and stale results from unmounted pages are ignored. Script-loading failures offer a retry or email sign-in. The flow no longer depends on the One Tap prompt.

Reset request uses `POST /api/auth/forgot-password { email }`; reset uses `POST /api/auth/reset-password { token, password }`. No fake tokens, success timers, or browser-only password changes are used. “Open the link” explains how to follow the secure link in the delivered email; it cannot manufacture or open a backend-generated secret reset URL. Resend only makes a request when clicked after the cooldown.

## Integration follow-ups

- Confirm the deployed backend URL, CORS allowance for the frontend origin, Google client ID, and frontend email-link URLs with the backend team.
- The guide does not supply an endpoint to attach an institution to an existing Google admin account. Such accounts are directed to an honest setup-status screen; no duplicate admin registration is attempted.
- The resend-verification request includes the current Bearer token when available and the email in the JSON body. Confirm this payload with the backend team, since the provided endpoint list does not specify its body.
- Publish the actual Terms and Privacy Policy at `/terms` and `/privacy`; their content was not included in the design or backend guide.
- Live authentication, email delivery, and Google sign-in require the real backend and Google configuration. Local tests mock network responses and do not create real accounts or send email.

## GitHub dashboard integration

The dashboard, projects, onboarding, and their shared components from origin/main (237b422) are merged into the local integrate-partner-updates branch. The pre-merge local implementation is preserved in commit f9e5375. The dashboard, sidebar, and onboarding now use the authenticated user's name rather than the hard-coded demo name. Dashboard counts/activity and project storage still use the upstream mock data; connecting those feature APIs is separate from authentication.

## Integration verification (2026-10-09)

- Fetched origin and merged origin/main (237b422) after saving the local work on a separate branch. Reviewed all conflicts; most were equivalent copied files with line-ending or final-newline differences.
- Preserved authentication routes, token/user persistence, signed-in names, local fonts, password controls, responsive landing styles, and the partner's dashboard, projects, and onboarding Back button.
- Passed all 15 authentication contract tests, TypeScript build checks, full ESLint, and the Vite production build. Production bundling used RAYON_NUM_THREADS=1 and a 384 MB Node heap to accommodate this computer's memory limits.
- Browser checks used synthetic @example.test accounts on a separate frontend (port 3001) and temporary API fixture (port 4001). Verified unchecked/checked consent, signup to onboarding, the onboarding Back button and completion, response names in onboarding/sidebar/dashboard, session restoration, project draft creation, logout, failed login, and login to the dashboard.
- Verified landing profile-card spacing, signup, and dashboard at a 375px mobile viewport with no horizontal overflow. Closed temporary browser tabs and stopped both test servers afterward.
- These checks do not verify the live backend or Google sign-in. Those original checks used a fixture; the supplied Render backend was subsequently verified as described below. Upstream project storage and onboarding save still use mocks.
- .env.local remained ignored during the partner integration.

## Live backend and profile handles (2026-10-09)

- The supplied Render API responds to login and registration validation requests, and permits localhost:3000 through CORS. GET /api/auth/me without a token correctly returns 401. A synthetic invalid login in the real browser reached the API and showed a credentials error rather than a connection error; the user subsequently signed into their real learner account.
- `.env.example` now contains the supplied API origin and public Google web client ID so other checkouts can use the same settings. Production builds must receive these VITE variables too; `.env.local` is intentionally not committed. Google sign-in still requires correct authorized origins and an end-to-end sign-in check.
- The dashboard profile-link card reads GET /api/learner/profile through the authenticated API client. It uses the saved profile.handle for both the displayed address and copied URL; no demo name or unsaved name-derived URL is used.
- If the profile has no handle, the card suggests a handle from the signed-in name. Saving is an explicit user action: it checks GET /api/learner/handle-available, then PATCHes only { handle } to /api/learner/profile and reloads the saved value. Taken handles, server validation errors, loading, retry, and clipboard failures are handled.
- Public addresses retain the existing skillcred.app/u/:handle format. This frontend repository does not yet implement the public /u/:handle page, so displaying/saving an address does not confirm that public sharing is deployed.

- Follow-up validation passed: all 19 authentication/profile contract tests, TypeScript, full ESLint, and the production build. Browser checks against the isolated fixture verified the missing-profile suggestion, unavailable handles, a conflict during saving, successful saving, persistence after reload, and copying the saved URL. The real account handle was not changed during testing.

## Google sign-in button follow-up (2026-10-09)

- Reproduced the former One Tap failure locally, then replaced it with the official responsive Google-rendered button. The SDK loads once, supports retry, and routes credentials only to the originating mounted button. Closing a Google window does not leave the email form locked.
- Learner signup explains the Terms prerequisite and focuses the checkbox if Google is requested before consent. No real account was created during these checks.
- All 23 authentication/profile/Google SDK tests passed, as did TypeScript, full ESLint, and the production build. Browser checks confirmed the official login button renders and signup blocks Google authentication without consent.
- Google currently rejects the local origin for the configured client ID. The Google Cloud client owner must add http://localhost, http://localhost:3000, and the deployed frontend origin to Authorized JavaScript origins. A real Google login is still unverified until that configuration is corrected.
- The live Render frontend was observed serving the old placeholder login and returning an Nginx 404 for /login. Authentication must be deployed from integrate-partner-updates; a Docker deployment must also include the partner's Nginx routing configuration and build-time VITE settings. No merge into main or live deployment was performed.
