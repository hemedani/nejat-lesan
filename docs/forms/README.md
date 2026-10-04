# Form Engine — Documentation Index

The dynamic form engine lets an organization author field-report forms of any
complexity without writing code, and lets patrol officers complete them offline
on a phone.

## Documentation

| # | Document | English | فارسی |
| - | -------- | ------- | ----- |
| 01 | Overview and architecture | [01-overview.md](./01-overview.md) | [۰۱-نمای کلی.md](./01-overview-fa.md) |
| 02 | Definition schema reference | [02-definition-schema.md](./02-definition-schema.md) | [02-definition-schema-fa.md](./02-definition-schema-fa.md) |
| 03 | Rules and conditional logic | [03-rules-and-conditions.md](./03-rules-and-conditions.md) | [03-rules-and-conditions-fa.md](./03-rules-and-conditions-fa.md) |
| 04 | Backend API reference | [04-backend-api.md](./04-backend-api.md) | [04-backend-api-fa.md](./04-backend-api-fa.md) |
| 05 | Authoring guide (build a form) | [05-authoring-guide.md](./05-authoring-guide.md) | [05-authoring-guide-fa.md](./05-authoring-guide-fa.md) |
| 06 | Mobile and offline behaviour | [06-mobile-and-offline.md](./06-mobile-and-offline.md) | [06-mobile-and-offline-fa.md](./06-mobile-and-offline-fa.md) |
| 07 | QA accident form walkthrough | [07-qa-form-walkthrough.md](./07-qa-form-walkthrough.md) | [07-qa-form-walkthrough-fa.md](./07-qa-form-walkthrough-fa.md) |
| 08 | Migration and current status | [08-migration-and-status.md](./08-migration-and-status.md) | [08-migration-and-status-fa.md](./08-migration-and-status-fa.md) |

Start with **01 Overview** if the engine is new to you. If you are authoring a
form, jump to **05 Authoring Guide**. If you are debugging a condition, read
**03 Rules and Conditional Logic**.

## Where the code lives

| Area | Path | Purpose |
| ---- | ---- | ------- |
| Shared engine | `shared/form-engine/` | One implementation of form semantics, used by all three apps |
| Backend models | `back/models/form_definition.ts` | `form_definition` + `form_response` |
| Backend acts | `back/src/form_definition/` | 11 acts (CRUD, activate, render, validate) |
| Builder UI | `front/src/components/org/forms/` | Tree, palette, property editors, live preview |
| Server actions | `front/src/app/actions/form_definition/` | Next.js server actions per act |
| Mobile domain | `mobile/src/domain/form-state.ts` | Answer-tree transitions, offline draft merge |
| Mobile renderer | `mobile/src/app/incident/form.tsx`, `mobile/src/components/form/` | On-device form rendering |
| Worked example | `shared/form-engine/src/qa-accident-form.ts` | The QA form expressed as a definition (`mobile/src/domain/qa-accident-form.ts` is a re-export shim) |

## Import aliases

The engine is imported as `@forms` in all three services:

| Service | Mechanism |
| ------- | --------- |
| `back/` | `back/deno.json` → `"@forms": "../shared/form-engine/src/index.ts"` |
| `front/` | `front/tsconfig.json` → `paths` entry |
| `mobile/` | `mobile/tsconfig.json` `paths` **and** a `resolveRequest` hook in `mobile/metro.config.js` |

> **Metro ignores `tsconfig` paths.** The mobile `metro.config.js` is required;
> without it `@forms` will not resolve in the React Native bundle.

## Status

See **[08 Migration and Status](./08-migration-and-status.md)** for exactly what
is finished and what is not. Short version: the engine, the backend, the `/forms`
builder and the mobile renderer are complete and tested. The builder **is** linked
into navigation — a «فرم‌ساز» section in the OrgHead and UnitHead sidebars plus a
«فرم‌ساز» group in the admin sidebar, each gated on the `forms` module being on for
the organization. `accident_process` is **not** superseded: it stays registered and
keeps authoring accident registration until it is retired on its own schedule.

---

<div dir="rtl" align="right">

# 📋 فهرست مستندات موتور فرم‌ساز

موتور فرم پویا به سازمان‌ها اجازه می‌دهد فرم‌های گزارش میدانی را با هر پیچیدگی
بدون نوشتن کد طراحی کنند، و به مأموران گشت اجازه می‌دهد این فرم‌ها را به‌صورت
آفلاین روی تلفن همراه تکمیل و ارسال کنند.

## مستندات

| # | سند | فارسی | English |
| - | --- | ----- | ------- |
| ۰۱ | نمای کلی و معماری | [01-overview-fa.md](./01-overview-fa.md) | [01-overview.md](./01-overview.md) |
| ۰۲ | مرجع ساختار تعریف فرم | [02-definition-schema-fa.md](./02-definition-schema-fa.md) | [02-definition-schema.md](./02-definition-schema.md) |
| ۰۳ | شرط‌ها و منطق شرطی | [03-rules-and-conditions-fa.md](./03-rules-and-conditions-fa.md) | [03-rules-and-conditions.md](./03-rules-and-conditions.md) |
| ۰۴ | مرجع ای‌پی‌آی بک‌اند | [04-backend-api-fa.md](./04-backend-api-fa.md) | [04-backend-api.md](./04-backend-api.md) |
| ۰۵ | راهنمای طراحی فرم | [05-authoring-guide-fa.md](./05-authoring-guide-fa.md) | [05-authoring-guide.md](./05-authoring-guide.md) |
| ۰۶ | موبایل و رفتار آفلاین | [06-mobile-and-offline-fa.md](./06-mobile-and-offline-fa.md) | [06-mobile-and-offline.md](./06-mobile-and-offline.md) |
| ۰۷ | بررسی فرم تصادف QA | [07-qa-form-walkthrough-fa.md](./07-qa-form-walkthrough-fa.md) | [07-qa-form-walkthrough.md](./07-qa-form-walkthrough.md) |
| ۰۸ | مهاجرت و وضعیت فعلی | [08-migration-and-status-fa.md](./08-migration-and-status-fa.md) | [08-migration-and-status.md](./08-migration-and-status.md) |

اگر با موتور فرم‌ساز آشنا نیستید، از **سند ۰۱ نمای کلی** شروع کنید. اگر در حال
طراحی فرم هستید، مستقیم به **سند ۰۵ راهنمای طراحی فرم** بروید. اگر در حال رفع
اشکال یک شرط هستید، **سند ۰۳ شرط‌ها و منطق شرطی** را بخوانید.

## محل کدها

| بخش | مسیر | کارکرد |
| ---- | ----- | ------ |
| موتور مشترک | `shared/form-engine/` | یک پیاده‌سازی واحد از معنای فرم، مشترک بین هر سه اپ |
| مدل‌های بک‌اند | `back/models/form_definition.ts` | `form_definition` و `form_response` |
| اکشن‌های بک‌اند | `back/src/form_definition/` | ۱۱ اکشن (CRUD، فعال‌سازی، رندر، اعتبارسنجی) |
| رابط کاربری فرم‌ساز | `front/src/components/org/forms/` | درخت، پالت فیلد، ویرایشگر ویژگی، پیش‌نمایش زنده |
| اکشن‌های سرور | `front/src/app/actions/form_definition/` | اکشن سرور Next.js برای هر عملیات |
| دامنه موبایل | `mobile/src/domain/form-state.ts` | تغییرات درخت پاسخ، ادغام پیش‌نویس آفلاین |
| رندرکننده موبایل | `mobile/src/app/incident/form.tsx`، `mobile/src/components/form/` | رندر فرم روی دستگاه |
| نمونه عملی | `shared/form-engine/src/qa-accident-form.ts` | فرم QA که صرفاً به‌صورت تعریف بیان شده است (`mobile/src/domain/qa-accident-form.ts` فقط یک شیم باز-اکسپورت است) |

## نام مستعار ایمپورت

موتور در هر سه سرویس با نام `@forms` ایمپورت می‌شود:

| سرویس | سازوکار |
| ----- | ------- |
| `back/` | `back/deno.json` → `"@forms": "../shared/form-engine/src/index.ts"` |
| `front/` | ورودی `paths` در `front/tsconfig.json` |
| `mobile/` | `paths` در `mobile/tsconfig.json` **و** قلاب `resolveRequest` در `mobile/metro.config.js` |

> **Metro به `paths` در tsconfig توجه نمی‌کند.** فایل `mobile/metro.config.js`
> لازم است؛ بدون آن `@forms` در باندل React Native resolve نمی‌شود.

## وضعیت

برای اینکه دقیقاً چه چیزی تمام شده و چه چیزی نشده، **[سند ۰۸ مهاجرت و وضعیت
فعلی](./08-migration-and-status-fa.md)** را ببینید. خلاصه: موتور، بک‌اند (با جداسازی
مستأجر)، فرم‌ساز `/forms` و فرم پویای موبایل کامل و تست‌شده‌اند؛ پاسخ‌های فرم به
`accident` می‌رسند و سازمانی که فرم نداشته باشد به جریان استاندارد می‌افتد.
`accident_process` هنوز مهاجرت نیافته و فیلدهای `file` / `location` جای‌نگهدارند.

</div>
