# 47 - Email/Password Auth Migration — Frontend Implementation Guide

## 1. Overview

The backend (`back/`) has replaced its OTP-based login flow (national_number + SMS verification code) with a standard **email + password** authentication system. This guide tells you exactly what changed and what the frontend must do to match the new API.

**Scope of this guide:** frontend migration only. The backend is complete, tested, and the frontend type declarations at `front/src/types/declarations/selectInp.ts` are already in sync with the new contract.

**TL;DR of the migration:**
1. `login` act now takes `{ email, password }` (was `{ national_number, code }`).
2. `loginReq` and `changeMobile` acts are **removed** — delete `front/src/app/actions/loginReq.ts` and the two-step OTP login UI.
3. New acts: `setGhostPassword` (public bootstrap) and `changeUserPassword` (Ghost-only).
4. `addUser` now **requires** `email` + `password`; `national_number` is optional everywhere.
5. `updateUser` accepts optional `email` / `password` / `national_number`.
6. Redis is no longer required to boot the backend.

---

## 2. The New API Contract

All acts live on `service: "main"`, `model: "user"`. The exact generated types are in `front/src/types/declarations/selectInp.ts` (`ReqType["main"]["user"][...]`). Summary:

### 2.1 `login` — email + password
```ts
// set (both required)
{ email: string; password: string }
// get (token optional, user REQUIRED)
{
  token?: 0 | 1;
  user: { _id?, first_name?, last_name?, father_name?, mobile?, gender?,
          birth_date?, summary?, email?, national_number?, address?, level?,
          is_verified?, settings?, createdAt?, updatedAt?,
          avatar?, national_card?, uploadedAssets? }
}
```
**Response on success:** `{ success: true, body: { token: string, user: {...} } }`

**JWT payload:** `{ _id, email, mobile, level }` with a **90-day** expiry.

**Errors (body is a Persian string when `success: false`):**
- `چنین کاربری پیدا نشد` — no user with that email
- `رمز عبور برای این کاربر تنظیم نشده است` — user exists but has **no password set** yet (see §6 Bootstrap)
- `رمز عبور وارد شده صحیح نیست` — wrong password

### 2.2 `tempUser` — registration → creates a `Ghost`
```ts
// set
{ first_name, last_name, father_name, mobile, email, national_number? }
```
Creates the Ghost **without a password** (must bootstrap via `setGhostPassword` before the Ghost can log in). `level` is hardcoded `Ghost`; `settings` defaults to `{ cities: [], provinces: [], availableCharts: {} }`.

### 2.3 `setGhostPassword` — public one-time bootstrap (NEW)
```ts
// set — must be an EMPTY object: {}
// get — standard user projection (selectStruct("user", 1)), NEVER password
```
- **No auth required** (public act, no `preAct`).
- Sets the Ghost's password to **`password123`** (fixed value) **only if** the Ghost has no password yet.
- Errors: `"No Ghost user found"`, `"Ghost password already set"` (second call).
- The response never contains the password field.

### 2.4 `registerUser` — self-registration
```ts
// set
{ first_name, last_name, father_name, mobile, gender: "Male" | "Female",
  birth_date?: Date, email, password, national_number? }
```
- Requires `email` + `password`.
- Duplicate `email` / `mobile` / `national_number` (if provided) are rejected:
  - `این ایمیل قبلا ثبت نام شده است`
  - `این شماره ملی قبلا ثبت نام شده است`
  - `این شماره موبایل قبلا ثبت نام شده است`
- Always creates a user with `level: "Editor"`, `is_verified: false`, empty address/settings.

### 2.5 `addUser` — admin create (REQUIRES email + password)
```ts
// set
{ first_name, last_name, father_name, mobile, gender, birth_date?, summary?,
  email, password,            // <-- BOTH REQUIRED (password length 8-100)
  national_number?, address, level, is_verified,
  nationalCard?, avatar?, citySettingIds?, provinceSettingIds?, availableCharts }
```
- Requires **Manager/Editor-level** access (same as before).
- `password` length constraint: **8–100 chars**.

### 2.6 `updateUser` — admin/self update
```ts
// set — all optional except _id
{ _id, first_name?, last_name?, father_name?, gender?, birth_date?, summary?,
  email?, password?, national_number?, address?, level?, is_verified?,
  citySettingIds?, provinceSettingIds?, availableCharts? }
```
- `email`, `password`, `national_number` are optional; `password` length 8–100.
- This is how an admin gives an existing user (created before the migration) an email + password.

### 2.7 `changeUserPassword` — password reset (NEW, Ghost-only)
```ts
// set
{ userId: string; newPassword: string }   // newPassword length 8-100
```
- **Requires `Ghost` level** (enforced via `grantAccess({ levels: ["Ghost"] })`). A Manager is NOT allowed to call it (error `You cant do this`).
- Changes the password of **any user** identified by `userId`.
- Errors: `"User not found"`.

### 2.8 `getMe` — unchanged
No API change. Note the **default projection** in the frontend action should be extended to include `email: 1` (see §4.8).

---

## 3. Backend Behavior You Must Respect (Security Rules)

1. **`password` is NEVER returned** by any act, in any projection. The user model sets `excludes: ["password"]` and the generated type makes `get.password` a `never` type — TypeScript should reject it at compile time.
   - ➜ **Never put `password` (or `token` outside `login`) in any `get` object.**
2. **Login is case-sensitive on email** and the DB stores email exactly as given (no normalization). Keep the email input consistent on the client.
3. **Email pattern** enforced server-side (`/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/`). TLD must be **2–4 chars** — e.g. `user@site.com` ✅, `user@site.local` ❌. Validate client-side with the same rules.
4. **Passwords are bcrypt-hashed** server-side. Min length **8**, max **100**.
5. `national_number` is now **optional** for `tempUser`, `registerUser`, `addUser`, `updateUser`. Do not force it in new/updated forms (existing validation `{10 digits}` is fine to keep on existing UI, but it must not block submission when empty).
6. `setGhostPassword` is **public** — do not send a token with it.
7. `changeUserPassword` is **Ghost-only** — only show the "reset password" UI when `user.level === "Ghost"`.

---

## 4. Frontend Changes Required

### 4.1 `src/app/actions/login.ts` — rewrite the `set`
Current code sends `{ national_number, code }` — **replace** with:
```ts
export const loginAction = async ({ email, password }: { email: string; password: string }) => {
  return await AppApi().send({
    service: "main",
    model: "user",
    act: "login",
    details: {
      set: { email, password },
      get: {
        token: 1,
        user: {
          _id: 1, first_name: 1, last_name: 1, mobile: 1, email: 1,
          national_number: 1, level: 1, settings: 1,
        },
      },
    },
  });
};
```
Response shape stays `{ success, body: { token, user } }`, so downstream callers (LoginStepTwo → replaced by new form) keep using `body.token` / `body.user`.

### 4.2 `src/app/actions/loginReq.ts` — DELETE
The `loginReq` act no longer exists on the backend. Remove this file and the `registration_step` cookie logic it set.

### 4.3 `src/components/organisms/login/LoginStepOne.tsx` — DELETE / REPLACE
It calls `loginReqAction` (gone). Replace the whole two-step OTP flow with a **single-step email+password form**.

### 4.4 `src/components/organisms/login/LoginStepTwo.tsx` — DELETE / REPLACE
Same — it calls the old `loginAction({ national_number, code })`. The new single form takes over its responsibilities (call `loginAction({ email, password })`, set the token cookie, store user, redirect).

**Suggested single-component shape (new `LoginForm.tsx`, "use client"):**
- Two inputs: `email` (type `email`) and `password` (type `password`, minLength 8).
- On submit: `const res = await loginAction({ email, password })`.
- If `res.success`: `Cookies.set("token", res.body.token, { path: "/", expires: 7, sameSite: "lax" })`, `sessionStorage.setItem("lesan_user", JSON.stringify(res.body.user))`, `onLogin(res.body.token, res.body.user)`, redirect `/`.
- If `!res.success`: show `res.body` (Persian message) — map the three login errors to friendly UI text (see §2.1).

### 4.5 `src/app/login/page.tsx` — simplify to one step
- Remove `useState` step switching, `useAutoReturnTimer`, `phone` state, and the countdown display.
- Import the new single login form; title should be something like `ورود`.
- Keep calling `login(token, userData)` from `useAuth()` (signature unchanged).

### 4.6 `src/types/auth.ts` — add email to `UserData`
```ts
export interface UserData {
  _id?: string;
  first_name?: string;
  last_name?: string;
  mobile?: string;
  email?: string;           // <-- ADD
  national_number?: string; // keep
  gender?: string;
  level: UserLevel;
  settings?: EnterpriseSettings;
}
```

### 4.7 `src/context/AuthContext.tsx` — verify only
`login(token, userData)` and the `sessionStorage("lesan_user")` restore path are unchanged. No code change required — just confirm it still receives the new `{ token, user }` shape from the new login form.

### 4.8 `src/app/actions/user/getMe.ts` — add email to default projection
```ts
const getFields = get || {
  _id: 1, first_name: 1, last_name: 1, gender: 1,
  mobile: 1, email: 1,        // <-- ADD
  national_number: 1, level: 1, settings: 1,
};
```

### 4.9 `src/app/actions/user/createUser.ts` — no change needed
It already spreads `ReqType["main"]["user"]["addUser"]["set"]`, which now includes `email` + `password`. The **callers** must supply them (see 4.10/4.11).

### 4.10 `src/components/template/FormCreateUserUpdated.tsx` — add email + password
- Add to `UserCreateSchema` (zod):
  - `email: z.string().email(...)` (mirror server: TLD 2–4 chars; `z.email()` is fine)
  - `password: z.string().min(8).max(100)`
  - Make `national_number` `.optional()` (server no longer requires it)
- Add `email` + `password` input fields to the form (reuse `MyInput`).
- Pass both through to `createUser(...)` (the `addUser` act).

### 4.11 Other admin user surfaces — audit for email/password
Search the codebase for callers of `createUser` / `addUser` / `updateUser` and add email/password fields wherever a user is created or edited:
- `src/components/template/FormCreateUser.tsx`
- `src/components/template/clientUserDashboard.tsx`
- Any "edit profile" or "manage users" screens that call `updateUser` should gain optional `email` / `password` inputs.

### 4.12 Remove dead code
- `src/components/organisms/login/LoginStepTwo.tsx` and `LoginStepOne.tsx` (if replaced) can be deleted.
- `useAutoReturnTimer` hook is no longer needed by the login page (leave the hook file in place if used elsewhere; otherwise it's safe to leave).

---

## 5. Bootstrap / Onboarding Flow (important for demo & first login)

The DB currently has **5 users with no email and no password** (1 Ghost, 1 Enterprise, 2 Manager, 1 Driver). They cannot log in until they are given credentials. There is **no UI for this yet** — the frontend should add it:

1. **Ghost bootstrap (one-time):**
   - Call `setGhostPassword` with `set: {}` (no auth). This sets the Ghost's password to **`password123`**.
   - Then log in as the Ghost with `{ email: <ghost email>, password: "password123" }`.
2. **Give other users credentials** (as Ghost or admin):
   - `updateUser` with `{ _id, email, password }` — admin sets both at once, **or**
   - `changeUserPassword` with `{ userId, newPassword }` — **Ghost-only**, sets only the password (email must come from `updateUser`).
3. After a user has email + password, they log in normally via `login`.

**Suggested UI additions (optional but recommended):**
- A small "set ghost password" button/flow on first setup (disabled once the Ghost already has a password — the act returns `"Ghost password already set"`).
- A "reset password" control in the admin user list, shown only to `Ghost` users, calling `changeUserPassword`.

---

## 6. Testing Checklist

With the backend running (`deno task bc-dev` — Redis is no longer required to start):

1. Login with a valid email+password → get `{ success: true, body: { token, user } }`.
2. Login with unknown email → `چنین کاربری پیدا نشد`.
3. Login with existing email but no password → `رمز عبور برای این کاربر تنظیم نشده است`.
4. Login with wrong password → `رمز عبور وارد شده صحیح نیست`.
5. `setGhostPassword` twice → first sets `password123`, second returns `Ghost password already set`.
6. `registerUser` with duplicate email → `این ایمیل قبلا ثبت نام شده است`.
7. `addUser` without `email` or `password` → validation error (both required).
8. `addUser` with password length < 8 → validation error.
9. `changeUserPassword` as Ghost succeeds; as Manager → `You cant do this`.
10. Any `get` containing `password` → TypeScript error (type `never`) and/or backend validation rejection.

---

## 7. Files Changed on the Backend (reference only — do NOT touch)

- `back/deps.ts` — added `compare`/`hash` from `jsr:@da/bcrypt`.
- `back/models/user.ts` — `email` (required), `password` (optional), `national_number` optional, `excludes: ["password"]`, unique sparse index on `email`, `"password"` added to `user_excludes`.
- `back/src/user/login/*` — email+password login, bcrypt compare, 90-day JWT.
- `back/src/user/register/*` — email+password, level `Editor`.
- `back/src/user/tempUser/*` — email required, no password.
- `back/src/user/addUser/*` — email+password required, hashed.
- `back/src/user/updateUser/*` — optional email/password/national_number.
- `back/src/user/setGhostPassword/*` — NEW public bootstrap act.
- `back/src/user/changeUserPassword/*` — NEW Ghost-only reset act.
- **Deleted:** `back/src/user/loginReq/*`, `back/src/user/changeMobile/*`.
- `back/mod.ts` — Redis connection is now lazy (`getRedis()`), so the app starts without Redis.