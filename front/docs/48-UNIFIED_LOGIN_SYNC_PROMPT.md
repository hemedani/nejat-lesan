# 48 — Enhanced Prompt: Sync Web Frontend With Unified Email+Password Login

Copy everything below this line into your frontend AI agent.

---

## Role & Goal

You are working on the Next.js web frontend (`front/`) of a Lesan-backed traffic management system. The backend was just migrated to a **single unified login**: one public act `user.login` keyed on **email + password**, used by both web and mobile. The old personnel-code-keyed `user.mobileLogin` act was **deleted** from the backend and from generated declarations.

Your task: audit and update the web login flow so it matches the new backend behavior exactly, remove dead code/messages, and verify nothing else regressed. Do not refactor unrelated files.

## Backend facts (authoritative — do not re-derive)

1. Act: `service: "main"`, `model: "user"`, `act: "login"`. Set: `{ email, password }`. The act also accepts an optional `device` payload for device-scoped patrol sessions — **the web must never send it**. Response for web stays `{ token, user }`.
2. Error messages the backend can now return on login:
   - «ایمیل یا رمز عبور صحیح نیست» — single generic message for unknown email, missing password hash, and wrong password (user enumeration is impossible by design).
   - «به دلیل تلاش‌های ناموفق مکرر، حساب شما N دقیقه دیگر قفل است» — account temporarily locked (N is dynamic). Applies to every login now, including web.
   - «به دلیل ۵ تلاش ناموفق، حساب شما به مدت ۵ دقیقه قفل شد» — emitted on the 5th consecutive failure.
   - «حساب کاربری غیرفعال است» — NEW for web: deactivated accounts are rejected even with correct credentials.
3. Messages that **no longer exist**: «چنین کاربری پیدا نشد», «رمز عبور برای این کاربر تنظیم نشده است», «رمز عبور وارد شده صحیح نیست».
4. JWT payload changed: claims are now `_id`, `email`, `level`, plus `device_id` only for device logins. The old `mobile` claim is gone. The token remains an opaque string for the web — store/send it exactly as before (cookie named `token`, header `token` without Bearer).
5. The response `user` object is built strictly from your requested projection — it will never contain `password`, `failed_login_attempts`, or `locked_until`.
6. `personnel_code` still exists on users as display data (Patrol officers have one) but is not a credential anywhere.
7. Declarations at `back/declarations/selectInp.ts` were regenerated; the mirrored copy `front/src/types/declarations/selectInp.ts` must contain `login` and must NOT contain `mobileLogin` (already verified — treat any mismatch as a bug to report, not fix silently).

## Current state you will find

- `front/src/app/actions/login.ts` — already compatible (calls `act: "login"` with email + password). Leave the wire format unchanged.
- `front/src/types/auth.ts` — already includes `"Patrol"` level and `PatrolPermissions`. No change needed.
- `front/src/components/organisms/login/LoginForm.tsx` — contains a stale `ERROR_MESSAGES` map listing the three removed messages above, and has no mapping for the new generic/lockout/inactive messages.

## Tasks

### Task 1 — Fix the login error-message map (`LoginForm.tsx`)
Replace the `ERROR_MESSAGES` map so it covers exactly the live backend messages:

```ts
const ERROR_MESSAGES: Record<string, string> = {
  "ایمیل یا رمز عبور صحیح نیست": "ایمیل یا رمز عبور صحیح نیست.",
};
```

Then extend `getFriendlyError` so that:
- Any message containing «قفل» is shown as-is (it already contains the remaining minutes and is user-facing Persian; do not try to parse N).
- «حساب کاربری غیرفعال است» is shown as-is or with a friendly wrapper («حساب شما غیرفعال شده است. لطفاً با مدیر سیستم تماس بگیرید.» — pick one and stay consistent).
- Unknown strings fall back to the existing generic network/error text rather than leaking raw backend internals.

Remove the three dead keys entirely. Search the whole `front/src` for the removed message strings and delete any other references.

### Task 2 — Lockout UX (minimal)
When the lockout message is displayed, disable the submit button for the duration if and only if the minutes are trivially parseable; otherwise simply show the message and leave normal retry behavior. Do not build a countdown timer in this pass unless it takes fewer than ~20 lines.

### Task 3 — Regression sweep
- Confirm `loginAction` still sends `get: { token: 1, user: { ... } }` and that every requested user field still exists on the model (e.g., `mobile`, `national_number`, `settings` are all valid pure fields — nothing was removed).
- Confirm the auth context stores/reads the cookie and session user exactly as before; the JWT payload shape change must require zero frontend changes because the token is opaque.
- Grep for `mobileLogin` across `front/src` — there should be zero matches.
- Run the project's typecheck/lint (`npm run lint`, `npx tsc --noEmit`) and fix anything your edits introduced.

## Hard constraints

- Keep the `{ success, body }` response-envelope handling untouched.
- Never render passwords or request password fields in projections.
- Do not add `device` to the web login payload.
- Do not rename the cookie, headers, or the `loginAction` export.
- All user-visible strings stay Persian and RTL-consistent.

## Acceptance checklist

- [ ] Submitting wrong credentials shows «ایمیل یا رمز عبور صحیح نیست.»
- [ ] 5 consecutive failures show the 5-attempt lockout message; retrying during the window shows the remaining-minutes message.
- [ ] A deactivated account with correct credentials sees the inactive-account message, not a generic error.
- [ ] Successful login sets the token cookie and redirects exactly as before.
- [ ] Zero references to removed backend messages remain in the codebase.
- [ ] `tsc --noEmit` and lint pass with no new errors.
