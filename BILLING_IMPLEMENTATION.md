# Learner billing: one-time Premium

Premium is a single Paystack card payment for lifetime access and unlimited projects. The current API price is NGN 2,499; Free allows two projects. Prices and limits are read from the public `GET /api/billing/plans`, not fixed in the pricing UI. DM Sans is self-hosted and used throughout the pricing and payment screens.

For local development, set `VITE_API_URL=https://skillcred-be-development-pmhe.onrender.com` in `.env.local`, or `http://localhost:5000` when running the backend locally. Restart Vite after changing this value. Deployments must set their own `VITE_API_URL` before building; `.env.local` remains ignored by Git.
If `.env.development.local` sets `VITE_API_URL=/api`, it takes precedence during development and uses the Vite proxy, which already targets the development backend. Change that override too when choosing a different local backend.

- Authenticated learner billing is loaded from `GET /api/billing/me` and shared by the dashboard, Plans and Projects pages. Account/session changes discard the previous learner's billing state. Project changes refresh usage.
- `POST /api/billing/checkout` sends `{}` with the stored bearer token and redirects to the returned HTTPS `authorizationUrl`.
- `/billing/success` remains outside the dashboard layout. It accepts `reference` or `trxref` and verifies with `GET /api/billing/verify?reference=...`. Only `paid: true` shows success; pending payments are polled with a bounded retry, and missing/failed/network responses have separate states.
- After confirmation, `/api/billing/me` refreshes the shared plan and project limit. The verification response is intentionally typed separately because it does not include every `/me` field. A failed refresh remains retryable on the Plans page without changing a confirmed payment into a failed one.
- Login preserves the internal return route and payment query string using `state.from`.
- `paidThrough` may contain a lifetime sentinel date. It is not presented as an expiry or renewal date. Verification does not return an amount, so the success page does not present the current catalogue price as a payment receipt.
- Subscription/card-management controls and calls to the removed management endpoint are removed. A legacy account-deletion billing error directs the user to support rather than a nonexistent cancellation page.

Validation: `npm run test:unit`, `npm run lint`, `npm run build`, and `npm run test:e2e -- tests/e2e/pricing.spec.ts tests/e2e/billing-return.spec.ts tests/e2e/billing-lifetime.spec.ts --trace off --workers 1`.
Browser tests mock the backend and Paystack navigation; they do not charge a card. A real Paystack test-mode payment still requires a verified learner account and the deployed callback URL configured by the backend.
