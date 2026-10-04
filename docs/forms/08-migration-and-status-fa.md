# ۰۸ — مهاجرت و وضعیت فعلی

گزارش صادقانه از آنچه تمام شده، آنچه نشده، و گام بعدی چیست.

## خلاصه

| حوزه | وضعیت |
| ---- | ------ |
| موتور مشترک | **کامل** — ۱۴۸ تست (شامل آیکون و snapshot) |
| مدل `form_definition` | **کامل** — `form_kind`، `icon`، ایندکس تک‌فرمی تصادف، حذف ایندکس پیش از تفکیک |
| اکشن‌های بک‌اند | **کامل** — ۱۴ اکشن، محدود به سازمان، با اعتبارسنجی binding و آیکون هنگام انتشار |
| کنترل دسترسی و جداسازی مستأجر | **کامل** — ۲۰ تست |
| مجوزدهی ماژول | **کامل** |
| مدل `incident_report` و ۱۷ اکشن | **کامل** — چرخهٔ کامل ثبت و بازبینی + ۳ اکشن نظارت |
| حذف چندوجهی‌بودن از `accident` | **کامل** — بدون `incident_type`، بدون فیلتر در نمودارها |
| `synced_at` روی هر دو مدل گزارش | **کامل** — در اختیار سرور، یک‌بار نوشته می‌شود؛ ۱۱ تست |
| کنسول نظارت سازمانی | **کامل** — فهرست یکپارچه، سه بلوک آماری، بازبینی گروهی، CSV |
| واژگان مشترک آیکون | **کامل** — ۸۰ نام، اعتبارسنجی هنگام فعال‌سازی |
| فرم‌ساز فرانت‌اند | **کامل و متصل به مسیریابی** — `/forms`، `/forms/new`، `/forms/[formId]` |
| پیش‌نمایش زندهٔ فرانت‌اند | **کامل** |
| انتخابگر فرم در موبایل | **کامل** — سه فرم در صفحه + بقیه، با آیکون |
| فرم پیش‌فرض داخلی موبایل | **کامل** — آفلاین، بدون `form_definition_id` ارسال می‌شود |
| شاخه‌بندی همگام‌سازی موبایل | **کامل** — `targetModelFor` هم مدل و هم mapper را انتخاب می‌کند |
| رندرکنندهٔ موبایل | **متصل به مسیریابی** — `file` و `location` هنوز جای‌نگهدارند |
| ارسال فرم | **کامل** — کلیدهای نوع‌دار + `dynamic_answers` + `form_answers` |
| فرم QA به‌صورت تعریف | **کامل** — ۳۶ تست پذیرش |
| مهاجرت `accident_process` | **بی‌موضوع شد** — ویجت اکنون فقط برای تصادف است |

> ردیف قدیمی «کنسول یکپارچهٔ گزارش‌ها در فرانت — تصادف و گزارش از یک منبع» با دو ردیف
> کنسول بالا جایگزین شد. این یک تغییر ظاهری نیست: ادغامی که آن ردیف توصیف می‌کرد
> (`fetchMergedReports`، دو فراخوانی `gets`) برای سرپرست سازمان **هیچ چیزی فهرست
> نمی‌کرد** و اکنون در سمت سرور جایگزین شده است. ببینید §۲د.

## اعتبارسنجی اجراشده

اعداد روی همین درخت کاری اندازه‌گیری شده‌اند و از قبل منتقل نشده‌اند. مجموعه‌های بک‌اند
یک پایگاه‌داده مشترک دارند و هرکدام آن را حذف می‌کنند، پس **تکی** اجرا و مجموع دستی
گرفته شد؛ حلقهٔ پایین را ببینید.

| مجموعه تست | نتیجه |
| ----------- | ------ |
| `shared/form-engine` — `deno test -A test/` | **۱۴۸ موفق، ۰ ناموفق** |
| `back` — حلقهٔ تکی روی `test/*-test.ts` (۱۸ فایل) | **۲۸۳ موفق، ۰ ناموفق** |
| `mobile` — `npx vitest run` (۲۲ فایل) | **۲۴۴ موفق، ۰ ناموفق** |
| `front` — `npx tsc --noEmit -p tsconfig.json` / `npx next lint` | بدون خطا / بدون هشدار یا خطا |
| `mobile` — `npx tsc --noEmit` / `npx expo lint` | بدون خطا / ۰ خطا (۵۰ هشدار) |
| `front` — `next build` | در این مرحله تکرار نشد (آخرین بار سبز: ۱۲۵ از ۱۲۵ صفحه) |
| `.workbuddy-ai/tools/audit-frontend-actions.py` | OK — ۳۵۲ فراخوانی در برابر ۴۴۸ اکشن، همه resolve شدند |
| `.workbuddy-ai/tools/audit-module-acts.py` | OK — ۴۰۰ اکشن، هر ۳۸ الگو resolve شد |
| `.workbuddy-ai/tools/panel-routing-test.py` | هر ۴۸ ادعا موفق |
| `.workbuddy-ai/tools/reports-csv-test.py` | هر ۱۷ ادعا موفق |

شمارش هر فایل بک‌اند: `incident-report-test` ۳۲، `oversight-list-test` ۳۰،
`patrol-operations-test` ۳۰، `form-definition-schema-test` ۲۹، `form-definition-test` ۲۶،
`oversight-stats-test` ۱۶، `oversight-review-bulk-test` ۱۴، `organization-test` ۱۴،
`warehouse-test` ۱۲، `form-definition-access-test` ۲۰، `accident-report-shape-test` ۱۱،
`report-sync-timestamp-test` ۱۱، `accident-process-test` ۸، `module-config-test` ۸،
`org-module-test` ۹، `charts-legacy-compat-test` ۷، `enterprise-auth-test` ۴،
`normalize-email-test` ۲.

```bash
cd shared/form-engine && deno test -A test/
cd back && for f in test/*-test.ts; do deno test -A "$f"; done   # تکی، توضیح پایین
cd mobile && npx vitest run
cd front && npx tsc --noEmit -p tsconfig.json
```

> مجموعه‌های بک‌اند یک پایگاه‌داده مشترک دارند و هرکدام در پایان **آن را حذف
> می‌کنند**، پس آن‌ها را جدا از هم اجرا کنید نه به‌صورت یک فراخوانی. حلقهٔ بالا
> روش پشتیبانی‌شده برای گرفتن مجموع کل است.
> `panel-routing-test.py` قبلاً یک مسیر ثابت Node از یک runtime مدیریت‌شده داشت که
> همه‌جا وجود ندارد و پیش از اجرای اولین ادعا شکست می‌خورد. اکنون `node` را از
> `PATH` پیدا می‌کند.
> **پیش از باور کردن یک شکست بک‌اند، دنبال پروسهٔ یتیم بگردید:** یک پروسهٔ کهنهٔ
> `deno test` از اجرایی که قطع شده روی همان پایگاه‌داده رقابت می‌کند و خطاهای
> گمراه‌کنندهٔ «Collection … is being dropped» می‌سازد. با `pgrep -fl "deno test"`
> پیدایش کنید، بکشید و دوباره اجرا کنید.

## آنچه وجود دارد

### موتور مشترک — `shared/form-engine/`

`types.ts`، `paths.ts`، `rules.ts`، `traverse.ts`، `conditions.ts`،
`validate.ts`، `cascade.ts`، `bindings.ts`، `snapshot.ts`، `icons.ts`،
`index.ts`. بدون وابستگی، به‌صورت `@forms` توسط هر سه سرویس مصرف می‌شود. سند
[۰۱ نمای کلی](./01-overview-fa.md).

`icons.ts` **واژگان مشترک آیکون** را نگه می‌دارد: ۸۰ نام کامپوننت Phosphor، گروه‌بندی‌شده
برای رابط انتخابگر، و به‌صورت دادهٔ خالص خروجی می‌دهد تا هیچ کلاینتی از موتور پکیج
آیکون import نکند. وب از `@phosphor-icons/react` و موبایل از
`phosphor-react-native` استفاده می‌کند (پکیج `@phosphor-icons/react-native` روی npm
وجود ندارد — به همین دلیل این یک فهرست نام است، نه یک کامپوننت مشترک). آیکون یک
فرم در تعریفش رشته است و هنگام فعال‌سازی با این فهرست اعتبارسنجی می‌شود، پس غلط
املانی پیش از انتشار گرفته می‌شود نه اینکه روی یکی از کلاینت‌ها جعبهٔ خالی رندر شود.

### بک‌اند

- `back/models/form_definition.ts` — مدل‌های `form_definition` (با `form_kind`،
  `icon`، ایندکس تک‌فرمی تصادف و `applyFormDefinitionMigrations`) و `form_response`
- `back/models/incident_report.ts` — مدل گزارش‌های غیرتصادفی
- `back/src/form_definition/` — ۱۴ اکشن به‌علاوهٔ `helpers.ts` (اعتبارسنج ساختاری،
  روابط قابل‌ اتصالِ **مشتق‌شده**، حل مدل مرجع، اعتبارسنجی آیکون، حل سازمان)
- `back/src/incident_report/` — ۱۷ اکشن، که ۳ تای آن‌ها کنسول نظارت است
  (`oversight/`)
- تحت گیت کلیدهای ماژول `forms` و `incident_patrol`
- اعلان‌ها بازتولید شد

`helpers.ts` آنچه را که یک فرم می‌تواند به آن bind شود از اسکیمای زندهٔ Lesan
(`getSchemas()[target].mainRelations`) مشتق می‌کند، نه از یک فهرست دستی. آن
فهرست پیش‌تر بین دو کلاینت ۱۶ مدل اختلاف داشت؛ مشتق‌کردن، واگرایی را ناممکن
می‌کند نه صرفاً بعیدمحتمل.

### فرانت‌اند

- `front/src/components/org/forms/` — `FormBuilder.tsx`، `NodeTree.tsx`،
  `FieldEditor.tsx`، `BindingEditor.tsx`، `RuleEditor.tsx`، `LivePreview.tsx`،
  `FormIcon.tsx`، `IconPicker.tsx`، `form-types.ts`، `rule-editor.ts`،
  به‌همراه `FormAuthorGuard.tsx`، `FormAuthorHeader.tsx`، `FormList.tsx`
- `front/src/app/forms/` — مسیرهای تألیف
- `front/src/app/actions/form_definition/` — اکشن‌های سرور، شامل
  `getBindableRelations` و `getReferenceModels`
- `front/src/app/actions/incident_report/` — اکشن‌های گزارش، به‌علاوهٔ
  `getOversightList.ts`، `getOversightStats.ts` و `reviewReports.ts`
- `front/src/components/org/OrgReportsView.tsx` — خود کنسول، که هر سه مسیر
  گزارش (`/orghead/reports`، `/unit-head/reports`، `/org/[orgId]/reports`) آن را
  رندر می‌کنند، به‌همراه `OversightFilterBar.tsx`، `OversightStatsCards.tsx`،
  `OversightTable.tsx` و `OversightActionBar.tsx`
- `front/src/services/reports-csv.ts` — تابع `reportsToCsv`، پوشش‌داده‌شده با
  `.workbuddy-ai/tools/reports-csv-test.py`
- `front/src/services/report-sources.ts` — تصادف و گزارش پشت یک واسط، تا
  داشبوردهای گشت، گزارش‌های کارمند و ویجت وضعیت همگام‌سازی همگی یک شکل بخوانند؛
  همچنین **نوع‌های** کنسول نظارت (`OversightRow`، `OversightFilters`،
  `OversightStats`، `ReviewOutcome`)
- `front/src/utils/panel-nav.ts` — ورودی «فرم‌ساز» در هر دو پنل نقش
- `ModuleKey` و `MODULE_LABELS` برای `forms` به‌روز شد
- `MODULE_KEYS` در `ModuleConfigClient` شامل `forms` شد تا ماژول واقعاً قابل
  خاموش/روشن باشد — وگرنه `requiredModule` هرگز نمی‌توانست چیزی را نشان یا پنهان کند

### موبایل

- `mobile/src/domain/form-state.ts` — انتقال‌ها، پاک‌سازی‌های وابسته، ماندگاری، گیت
- `mobile/src/domain/form-picker.ts` — سه فرم در صفحه + بقیه، تصادف اول
- `mobile/src/domain/form-routing.ts` — کدام صفحه گزارش را ثبت کند
- `mobile/src/domain/form-submission.ts` — پاسخ‌ها به کلید نوع‌دار + عکس فوری
- `mobile/src/domain/default-accident-form.ts` — فرم تصادف داخلی خود برنامه
- `mobile/src/domain/accident-mapper.ts` — هم `buildAccidentAddSet` و هم
  `buildIncidentReportAddSet`
- `mobile/src/app/incident/index.tsx` — صفحهٔ ورود با انتخابگر فرم
- `mobile/src/app/incident/form.tsx` — صفحه
- `mobile/src/components/form/form-node.tsx`، `form-icon.tsx` — رندرکننده + آیکون
- `mobile/src/api/form-definition.ts`، `incident-report.ts` — پوشش‌های API
- `mobile/src/services/sync-worker.ts` — بر اساس نوع گزارش، هم مدل و هم mapper را
  انتخاب می‌کند
- `shared/form-engine/src/qa-accident-form.ts` — فرم QA به‌صورت تعریف
  (`mobile/src/domain/qa-accident-form.ts` یک شیم باز-اکسپورت به آن است)
- `mobile/metro.config.js` — **جدید و لازم**

## اتصال‌ها: انجام شده

### ۱. ~~فرم‌ساز به مسیریابی وصل نیست~~ — **انجام شد**

سطح تألیف اکنون روی `/forms` فعال است و از نوار کناری پنل سرپرست سازمان و سرپرست
واحد، در بخش «فرم‌ساز» در دسترس است؛ این بخش فقط وقتی ماژول `forms` برای سازمان
روشن باشد نمایش داده می‌شود.

```
front/src/app/forms/layout.tsx          FormAuthorGuard + PanelScopeProvider
front/src/app/forms/page.tsx            فهرست تعریف‌های سازمان
front/src/app/forms/new/page.tsx        فرم‌ساز، بدون formId
front/src/app/forms/[formId]/page.tsx   فرم‌ساز، موجود
front/src/components/org/forms/FormAuthorGuard.tsx    کنترل نقش
front/src/components/org/forms/FormAuthorHeader.tsx   سربرگ + انتخاب سازمان
front/src/components/org/forms/FormList.tsx           فهرست، تکثیر، باز کردن
```

`/forms` آگاهانه بیرون از `/orghead` و `/unit-head` قرار دارد: هم سرپرست سازمان و هم
سرپرست واحد فرم می‌سازند اما از دو پنل متفاوت وارد می‌شوند، پس این سطح مشترک نگهبان
مخصوص خودش را دارد به‌جای تکرار مسیر در هر پنل. `FormAuthorGuard` به Ghost، Manager،
OrgHead و UnitHead اجازه می‌دهد و هر کس دیگر را به پنل خودش می‌فرستد؛
`PanelScopeProvider` سازمان را از `user.roles[]` می‌گیرد و برای Ghost/Manager که نقش
سازمانی ندارند، انتخابگر سازمان نشان می‌دهد.

### ۲. ~~مسیریابی موبایل فرم جدید را ترجیح نمی‌دهد~~ — **انجام شد**

اولویت در `mobile/src/domain/form-routing.ts` به‌صورت یک تابع خالص و تست‌شده قرار
دارد و `incident/index.tsx` آن را صدا می‌زند:

```ts
resolveIncidentRoute({
  incidentType, online, hasChosenForm, hasRenderableProcess,
});
// '/incident/form' > '/incident/process' > '/incident/details' | '/incident/simple'
```

فرمی که مأمور در صفحهٔ ورود لمس کرده همیشه برنده است. تنها گزارشی که فرم انتخاب‌شده
ندارد به ویجت قدیمی مراجعه می‌کند که حالا فقط برای تصادف است، و بعد به جریان
استاندارد. شاخهٔ آخر همان بازگشت لازم است: سازمانی که فرم خودش را ندارد، گزارش را با
جریان استاندارد داخلی ثبت می‌کند. هم فرم سازمان و هم فرایند سازمان برای دریافت به شبکه
نیاز دارند، پس دستگاه آفلاین به جریان استاندارد هدایت می‌شود و مسدود نمی‌شود — ثبت
رخداد هرگز نباید به اینترنت وابسته باشد.

صفحهٔ ورود یک **انتخابگر فرم** است، نه فهرست ثابتی از انواع رخداد، چون یک سازمان
می‌تواند هر تعداد فرم گزارش که نیاز دارد بنویسد. `fetchPatrolForms` آن‌ها را
می‌گیرد، `buildFormPicker` اول تصادف و بعد فرم‌های گزارش را بر اساس عنوان مرتب می‌کند،
سه تای اول را در صفحه نشان می‌دهد و بقیه را پشت یک دکمه می‌گذارد. اگر سازمان فرم فعال
تصادف نداشته باشد، `DEFAULT_ACCIDENT_FORM` خود برنامه اضافه می‌شود تا مأمور به
این دلیل که مدیر سیستم هنوز تنظیمات را تمام نکرده مسدود نشود — و چون این فرم معادلی
در بک‌اند ندارد، draft آن عمداً **بدون** `form_definition_id` ارسال می‌شود.

`/incident/form` دیگر بن‌بست ندارد. حالت‌های `empty`، `unsupported` **و** خطای
شبکه در حالت آفلاین، همگی از راه `standardRouteFor` به جریان استانداردِ متناسب با نوع
رخداد سقوط می‌کنند؛ و `reports.tsx` گزارش برگشتی را وقتی `form_definition_id` روی
پیش‌نویس باشد به `/incident/form` بازمی‌گرداند.

### ۲ب. پاسخ‌ها اکنون به بک‌اند می‌رسند — **انجام شد**

صفحهٔ فرم پیش‌تر پاسخ‌ها را روی دستگاه ذخیره می‌کرد و چیزی ارسال نمی‌کرد. اکنون هنگام
ثبت، پاسخ‌ها از راه `formAnswersToDraftData`
(`mobile/src/domain/form-submission.ts`) نوشته می‌شوند که تولید می‌کند:

- **کلیدهای نوع‌دار** از `buildBindings`، تا گزارش ثبت‌شده با فرم همان رابطه‌هایی را
  پر کند که کوئری‌های تحلیلی می‌خوانند؛
- **`dynamic_answers`**، از راه `buildDynamicAnswers` در موتور مشترک
  (`shared/form-engine/src/snapshot.ts`) — یک ردیف به ازای هر برگِ بی‌بند، با کلید
  مسیر نمونه تا `vehicles[1].plate` از `vehicles[0].plate` متمایز بماند؛
- **فرادادهٔ محلی** (`form_answers`، `form_definition_id`، `form_version`).

اینکه این payload به کدام مدل می‌رود را **نوع گزارش** تعیین می‌کند، نه محتوای
payload. `sync-worker.ts` با `targetModelFor` هم `accident` و هم `incident_report` و
هم mapper متناظر (`buildAccidentAddSet` / `buildIncidentReportAddSet`) را انتخاب
می‌کند. این تفکیک مهم است: دو مدل روابط متفاوتی اعلام می‌کنند، پس payload تصادف
ارسال‌شده به اکشن گزارش توسط validator رد می‌شود و مخلوط‌کردن آرام آن‌ها دقیقاً همان
اشتباهی است که این تفکیک حذف کرد. `checkProcessVersionFreshness` هم برای
غیرتصادف‌ها رد می‌شود — ویجت دیگر آن‌ها را نمی‌نویسد، پس نسخه‌ای برای مقایسه نیست.

### ۲ج. جداسازی مستأجر — **رفع شد**

`form_definition.get`، `gets`، `count` و `validate` در ابتدا دادهٔ هر سازمانی را به
هر کاربر احراز‌شده‌ای برمی‌گرداندند: `get` فقط روی `_id` تطابق می‌داد و `gets`/`count`
تنها وقتی فیلتر می‌کردند که فراخوان خودش `organizationId` می‌داد. یک مأمور گشت می‌توانست
فرم سازمان دیگری را بخواند — و فرم، ساختار گزارش‌دهی داخلی آن سازمان را افشا می‌کند.

هر چهار اکشن اکنون از `orgFilterFor` → `getAllowedManagerOrgIds` محدود می‌شوند، همان
کمکی که `accident_process.gets` از آن استفاده می‌کند. Ghost و Manager خواندن بین‌سازمانی
خود را نگه می‌دارند؛ بقیه به سازمان‌هایی که عضو آن هستند محدود می‌شوند و `validate` به‌جای
بازتاب دادن پرسش‌های تعریف بیگانه در فهرست خطاها، «فرم یافت نشد» برمی‌گرداند. پوشش تست:
`back/test/form-definition-access-test.ts`.

### ۲د. کنسول نظارت سازمانی — **انجام شد**

سه اکشن روی `incident_report` (`back/src/incident_report/oversight/`) جای ادغام
سمت مرورگر را گرفتند که پشت کنسول سازمان بود:

| اکشن | پاسخ |
| ----- | ----- |
| `getOversightList` | یک فهرست از تصادف‌ها **و** گزارش‌های غیرتصادفی، فیلتر و صفحه‌بندی **در سمت سرور** |
| `getOversightStats` | بلوک‌های هر مأمور، هر نسخهٔ اپ و کهنگی، روی همان سطح فیلتر |
| `reviewReports` | بازبینی گروهی با نتیجهٔ جداگانه برای هر ردیف |

```ts
// back/src/incident_report/oversight/getOversightList/getOversightList.fn.ts:51
const [result] = await coreApp.odm.getCollection("incident_report")
  .aggregate(pipeline).toArray();
```

**یک تجمیع، نه دو فراخوانی.** `$unionWith` مجموعهٔ `accident` را در
`incident_report` ادغام می‌کند و `$facet` در یک گذر مجموع کل را می‌شمارد و ردیف‌ها
را صفحه‌بندی می‌کند. دو فراخوانی `gets` نمی‌توانند یک union را منسجم صفحه‌بندی کنند —
`total` غلط می‌شود و صفحه‌ها هم‌پوشانی پیدا می‌کنند — و فیلتر سمت کلاینت روی ۲۰۰ ردیف
سقف‌خورده نمی‌تواند «این ۵۲٬۰۰۰ گزارش، صفحهٔ ۴» را بیان کند.

**درایور خام باربر است.** `aggregation()` خود Lesan مراحل `$lookup`/`$unwind`/
`$project` برگرفته از `get` کلاینت را **بعد از** مراحل شما اضافه می‌کند. آن مراحل روی
کالکشن پایه لنگر می‌خورند، پس نمی‌توانند شاخهٔ `$unionWith` را دنبال کنند، و یک
`$project` تولیدشده پس از `$facet` پایانی شکل facet را دور می‌ریزد. محرکش یک projection
تودرتوی معمولیِ رابطه است (`organization: { _id: 1 }`)، پس pipeline درست به نظر
می‌رسد و پاسخ درست نیست — به‌آسانی با «ساده‌سازی» یک اکشنِ درایور-خام برمی‌گردد و
دیباگ‌کردنش گران است. قاعده اکنون در `back/AGENTS.md` ← *Function Implementation Best
Practices* زندگی می‌کند، نه فقط اینجا.

**سطح فیلتر عمداً مشترک است.** `getOversightStats` دقیقاً همان
`oversightFilterStruct` فهرست را می‌گیرد. این شمارش‌ها مستقیم بالای ردیف‌هایی نشسته‌اند
که همان فهرست برمی‌گرداند، پس فیلتری که یک طرف رعایت و طرف دیگر نادیده بگیرد یک
**اختلاف قابل‌دیدن** است؛ `oversight-stats-test.ts` برای هر فیلتر آشتی را ادعا
می‌کند.

**قواعد محدودسازی، همه عمدی.** سرپرستان سازمان `getOrgReportBase` را می‌گیرند که `$or`
آن از پیش هر دو دستهٔ رکوردِ لینک‌شده از اپ و رکورد قدیمی را می‌گیرد — پس
`organizationId` آن‌ها **نادیده گرفته می‌شود**، چون محدود کردن روی `organization._id`
با آن `$or` AND می‌شد و هر گزارش قدیمی را پنهان می‌کرد. (`getReportScope` کمکی اشتباهی
برای اینجاست: برای سرپرستان سازمان **پرتاب** می‌کند.) `organizationId` یک Manager
دید را محدود می‌کند، نه دسترسی را؛ اکشن‌های بازبینی همچنان از `getOrgReportBase` عبور
می‌کنند.

**تاریخ‌ها روز محلی‌اند** (moment `startOf`/`endOf("day")`)، هم‌راستا با اکشن‌های
نمودار. `new Date(dateTo)` نیمه‌شب است و بی‌صدا بقیهٔ آن روز را حذف می‌کند.

**گیت ماژول:** خودکار از راه الگوی `incident_report.*`. چیزی برای ثبت‌کردن نیست و
چیزی هم نباید به نقشهٔ ماژول اضافه شود.

### ۲ه. دو ایراد که هنگام ساختش پیدا و رفع شدند

هیچ‌کدام برای مجموعهٔ تست پنهان نبودند. هر دو اینجا ثبت شده‌اند چون دلیلشان تعمیم‌پذیر
است.

**۱. فهرست گزارش‌های کنسول سازمان هیچ چیزی فهرست نمی‌کرد.** دو باگ مستقل روی هم
افتاده بودند:

- فراخوان یک **شناسهٔ** جاده را به فیلتری می‌داد که **نام** جاده را می‌سنجد
  (`accident.gets`: ‏`matchConditions["road.name"] = { $in: road }` — رشته‌های فارسی)،
  پس سمت تصادف‌ها صفر ردیف تطبیق می‌داد؛
- اکشن فهرست غیرتصادف از `getReportScope` محدود می‌شود که برای سرپرستان سازمان
  **پرتاب** می‌کند، و فراخوان از `Promise.allSettled` استفاده می‌کرد که آن رد شدن را
  در پرچم `partial: true`ای می‌بلعید که هیچ‌کس نمی‌خواند.

نتیجه: یک جدول موفق و **خالی** — که با «این سازمان گزارشی ندارد» تفاوتی ندارد. با
`getOversightList` جایگزین شد: یک کوئری، یک محدوده، یک مجموعه فیلتر. **هنوز باز:**
`fetchMergedReports` در `front/src/services/report-sources.ts` باقی مانده و هنوز از
سوی `OrgAnalyticsPanel` (کارت «نمای تحلیلی رخدادها» در `/orghead` و `/org/[orgId]`)
با `road: [roadId]` صدا زده می‌شود، پس **آن کارت هنوز صفر** نشان می‌دهد. ببینید §۹.

**۲. ایندکس یکتای جامانده از پیش از تفکیک، سازمان را به یک فرم فعال محدود می‌کرد.**
`form_definition` یک ایندکس یکتای `{ "organization._id": 1, incident_type: 1 }` با
فیلتر `status: "active"` داشت. تعریف‌ها دیگر `incident_type` ندارند، پس هر فرم فعال
با `incident_type: null` ایندکس می‌شد و با هر فرم فعال دیگر **تداخل** می‌کرد — یعنی
سقف یک سازمان **یک فرم فعال از هر نوع** بود، دقیقاً برعکس «یک فرم فعال تصادف، هر تعداد
فرم گزارش». با `applyFormDefinitionMigrations()` رفع شد که در `back/mod.ts` بلافاصله
پیش از `runServer` `await` می‌شود.

چرا هیچ تستی نمی‌توانست بگیردش: `createIndex` فقط **اضافه** می‌کند، پس ایندکس از هر
استقرار کدی جان سالم به در می‌برد؛ و **هر مجموعه تست پایگاه‌داده‌اش را حذف می‌کند**،
پس ایندکس کهنه هنگام اجرای تست هرگز حاضر نیست. تستی که فقط ادعای «ده فرم می‌توانند
وجود داشته باشند» داشته باشد در هر دو حالت پاس می‌شود و چیزی را ثابت نمی‌کند.
بنابراین `form-definition-test.ts` ایندکس قدیمی را **عمداً بازسازی** می‌کند
(`recreatePreSplitIndex`)، ادعا می‌کند فرم فعال دوم *واقعاً* رد می‌شود (که ثابت می‌کند
ایندکس واقعاً برگشته)، سپس مهاجرت را اجرا می‌کند و ادعا می‌کند ده فرم درج می‌شوند.

## آنچه انجام نشده

### ۳. `accident_process` اکنون فقط برای تصادف است — نیازی به مهاجرت نیست — `حل شد`

این بند در ابتدا «مهاجرت ویزارد هر سازمان به `form_definition`» بود. تفکیک مدل‌ها آن
را بی‌موضوع کرد. `accident_process` ثبت تصادف را تألیف می‌کند، پس `add`/`update` در
برابر `process_authorable_incident_types = ["accident"]` اعتبارسنجی می‌کنند و هر مقدار
دیگری را رد می‌کنند — یک ویزرد نباید بتواند برای مدلی سؤال تألیف کند که پاسخ‌ها را
رد می‌کند. فیلد `incident_type` فقط برای خواندنِ درست اسناد قدیمی باقی مانده است.

پیامدها، و همه عمدی:

- ثبت غیرتصادف کار `form_definition` است، بدون سقف نوع.
- `accident_process` ثبت‌شده می‌ماند و تا زمان بازنشانی برنامه‌ریزی‌شدهٔ خودش برای
  تصادف کار می‌کند. مسیریابی فرم انتخاب‌شده را ترجیح می‌دهد، برای تصادف به ویجت
  برمی‌گردد و بعد به جریان استاندارد.
- بازنشانی بعدی آن کوچک و بی‌خطر است: بایگانی اکشن‌ها، رابط `ProcessBuilder` و
  `/incident/process`، حذف از `MODULE_KEYS` و به‌روزرسانی دو تست مرجع. این کار را
  پیش از آنکه سازمان‌ها واقعاً به فرم تصادف تألیف‌شده مهاجرت کرده باشند انجام ندهید —
  برخلاف غیرتصادف، برای یک ویزارد *سفارشی‌شده* جایگزین داخلی وجود ندارد.

### ۳ب. فعال‌سازی تراکنشی نیست — `کم، پذیرفته‌شده`

`activate` تعریف فعال قبلی را بایگانی می‌کند و سپس تعریف جدید را فعال، بدون
تراکنش. کرش بین این دو گام می‌تواند سازمان را بدون فرم فعال تصادف باقی بگذارد. این
ریسک کاهش یافته، نه رفع شده: کلاینت به فرم پیش‌فرض داخلی خود برمی‌گردد
(`{ form: null }` پاسخ معتبر `getForPatrol` است)، پس پیامد یک فرم تصادف عمومی و
موقتی است، نه ناتوانی در ثبت. رفع واقعی یعنی outbox یا وضعیت دومرحله‌ای، که
ماشین‌آلات بیشتری از آن است که این خرابی می‌طلبد.

### ۴. فیلدهای `file` و `location` در موبایل جای‌نگهدار هستند — `متوسط`

`form-node.tsx` فقط یک راهنما رندر می‌کند:

```tsx
{node.type === 'file' ? 'مستندات از بخش رسانه ثبت می‌شود.' : 'موقعیت از بخش نقشه ثبت می‌شود.'}
```

جریان‌های گرفتن از قبل وجود دارند (`MediaSection` و `/incident/location`) و
دست‌نخورده‌اند. آنچه لازم است، اتصال فیلد تعریف به آن‌هاست:

- `file` ← mount کردن کامپوننت رسانهٔ موجود، با کلید مالک به سبک
  (`vehicle:<i>`، `facility:<i>`) همان‌طور که `media-writeback.ts` پشتیبانی می‌کند
- `location` ← جاسازی انتخابگر نقشه، یا پیوند به مرحلهٔ موقعیت و نوشتن نتیجه بازگشتی

همچنین حل‌نشده: فیلد `location` باید `gps_coords` (مأمور) را از
`incident_coords` (انتخاب‌شده) جدا نگه دارد، مطابق `mobile/AGENTS.md`.

### ۵. گزینه‌های `select` بین‌گروهی پر نمی‌شوند — `کم`

`damage_vehicleId` («وسیله مرتبط با این آسیب») فهرست ثابت خالی اعلام می‌کند. نمونهٔ
QA این گزینه‌ها را از گروه وسایل می‌سازد.

موتور به راهی نیاز دارد که گزینه‌های یک فیلد را از بخش دیگری از درخت پاسخ استخراج
کند — یعنی یک `OptionSource` که به‌جای کوئری مدل، روی پاسخ‌ها ارزیابی شود. قبل از
پیاده‌سازی طراحی‌اش کنید؛ آن را در تعریف QA hard-code نکنید.

### ۶. `form_response` اکشن ثبت ندارد — `کم، عمدی`

مدل وجود دارد و پاسخ‌ها اعتبارسنجی و نگاشت می‌شوند، ولی چیزی سند پاسخ را ذخیره
نمی‌کند. ارسال از مسیر `accident.add` / `accident.update` با فیلدهای typed نگاشت‌شده
انجام می‌شود و همین دلیل است که نمودارها امروز کار می‌کنند.

ارزشمند است وقتی گزارش‌گیری بین فرم‌ها از هزینهٔ نوشتن اضافه در هر ثبت مهم‌تر
شود.

### ۷. تست کامپوننت در موبایل وجود ندارد — `پیشین`

`mobile/vitest.config.ts` فقط `src/**/*.test.ts` را شامل می‌شود. رندرکنندهٔ `.tsx`
هیچ تست کامپوننتی ندارد. فعال‌سازی آن نیازمند `jsdom` به‌همراه
`@testing-library/react-native` است که هیچ‌کدام نصب نیستند.

### ۹. کارت تحلیلی سازمان هنوز صفر نشان می‌دهد — `متوسط، باز`

`front/src/components/org/OrgAnalyticsPanel.tsx` (کارت «نمای تحلیلی رخدادها» در
`/orghead` و `/org/[orgId]`) هنوز `fetchMergedReports({ road: [roadId] })` را صدا
می‌زند که هر دو باگ ایراد ۱ از §۲ه را دارد: یک **شناسهٔ** جاده به فیلتر `road.name`
داده می‌شود، و `incident_report.gets` که `getReportScope` آن برای سرپرستان سازمان
پرتاب می‌کند — ردی که `Promise.allSettled` می‌بلعد. پس کارت برای سرپرست سازمان ۰ رخداد
گزارش می‌کند در حالی که `/orghead/reports` درست فهرست می‌کند.

اینجا رفع نشده است: این مرحله فقط مستندسازی است. راه‌حل این است که کارت به
`getOversightList` نگاه کند (همان جمعیت را می‌خواهد به‌علاوهٔ تفکیک `group_key` که
projection ردیف از قبل حمل می‌کند) و سپس `fetchMergedReports` حذف شود، چون تنها
فراخوان باقی‌ماندهٔ آن همین کارت است.

## تغییرات در کد موجود

| فایل | تغییر | چرا |
| ---- | ------ | ---- |
| `back/src/app_modules/constants.ts` | اضافه شدن `"forms"` **در انتها** | `moduleKeyFor` روی اولین تطابق برمی‌گردد؛ ترتیب باربر است |
| `back/src/app_modules/moduleConfig.ts` | نگاشت `form_definition.*`، `form_response.*` | گیت |
| `back/src/form_definition/{get,gets,count,validate}` | محدودسازی به سازمان | جداسازی مستأجر |
| `back/test/module-config-test.ts` | `length === 3` ← `MODULE_KEYS.length` | شمارش ماژول ثابت‌شده |
| `back/test/org-module-test.ts` | همان، به‌علاوهٔ افزودن `forms` به `orgSet` | همان |
| `front/src/types/auth.ts` | افزودن `"forms"` به `ModuleKey` | برابری نوع |
| `front/src/utils/org.ts` | افزودن `forms: "فرم‌ساز پویا"` | برچسب ماژول |
| `back/declarations/selectInp.ts` | بازتولید | اکشن‌های جدید |
| `front/src/types/declarations/selectInp.ts` | نسخهٔ همگام | برابری |
| `mobile/tsconfig.json` | مسیر `@forms`، `allowImportingTsExtensions` | Metro به مسیرها توجه نمی‌کند؛ پرچم برای `tsc` است |
| `front/tsconfig.json` | مسیر `@forms`، `allowImportingTsExtensions` | مشخص‌کردن صریح پسوند `.ts` |
| `mobile/AGENTS.md` | جایگزینی قاعدهٔ «بدون ایمپورت بیرونی» | پیکربندی Metro اکنون آن را ایمن کرد |
| `back/models/{accident,incident_report}.ts` | افزودن `synced_at` | زمان میانهٔ همگام‌سازی هر مأمور — از هیچ چیز دیگری به‌دست نمی‌آید |
| `back/src/{accident,incident_report}/update/` | مهر `synced_at` فقط روی **نخستین** گذار به `synced` | این یک واقعیت دربارهٔ رسیدن است؛ اصلاح نباید آن را دوباره مهر بزند |
| `back/models/{accident,incident_report}.ts` | برای هر مدل دو ایندکس کنسول نظارت | `{org._id, createdAt/reported_at}`، `{sync_status, date_of_accident/reported_at}` |
| `back/models/form_definition.ts` | افزودن `applyFormDefinitionMigrations()` | حذف ایندکس پیش از تفکیک؛ `createIndex` نمی‌تواند (ایراد ۲ از §۲ه) |
| `back/mod.ts` | `await applyFormDefinitionMigrations()` پیش از `runServer` | تا نخستین درخواست با مهاجرت مسابقه ندادهد |
| `back/test/oversight-{list,stats,review-bulk}-test.ts` | تازه — ۶۰ تست | سه اکشن، محدوده، فیلترها، میانه، نتایج گروهی |
| `back/test/report-sync-timestamp-test.ts` | تازه — ۱۱ تست | `synced_at` روی هر دو مدل، از جمله تلاش برای جعل |
| `back/test/form-definition-test.ts` | دو تست که ایندکس پیش از تفکیک را بازسازی می‌کنند | مجموعه‌ای که پایگاه‌داده را حذف می‌کند نمی‌تواند ایندکس کهنه را ببیند |
| `front/src/app/actions/incident_report/*Oversight*`، `reviewReports` | اکشن‌های سرور تازه | نوع‌دار روی اعلان‌های بازتولیدشده، بدون cast |
| `front/src/services/reports-csv.ts` | تابع تازهٔ `reportsToCsv` | برچسب‌ها فقط روی ستون‌های enum؛ BOM برای Excel |
| `front/src/components/patrol/DarkModal.tsx` | از `ReviewActions.tsx` بیرون کشیده و آنجا هم به‌کار رفت | مشترک میان رابط بازبینی گشت و نوار اقدام نظارت |

هیچ چیزی حذف نشده است. `accident_process`، `ProcessBuilder` و صفحات قدیمی موبایل
همچنان کار می‌کنند — مسیریابی فرم انتخاب‌شده را ترجیح می‌دهد و در صورت نبودش به عقب
می‌افتد، پس سازمانی که چیزی تألیف نکرده همچنان کار می‌کند.

### تفکیک accident / incident_report

بزرگ‌ترین تغییر، و همان چیزی که سیستم فرم برای آن وجود دارد. `accident` پیش‌تر
چندوجهی بود: یک سند، یا برخورد یا گزارش جاده، انتخاب‌شده با `incident_type`. این
یک‌جا سه باگ می‌ساخت — آمار تصادف گزارش جاده را هم می‌شمرد
(`user.dashboardStatistic`، `accident.count`، `getCreatedAtPeriods` و
`mapAccidents` همه کل کالکشن را می‌خواندند)، یک سند می‌توانست دادهٔ مخصوص تصادف
(کارت خودرو، نوع برخورد) را کنار دادهٔ گزارش جاده نگه دارد، و `form_definition` روی
`incident_type` کلید می‌زد پس فقط یک فرم برای هر دسته ممکن بود.

| فایل | تغییر | چرا |
| ---- | ------ | ---- |
| `back/models/accident.ts` | حذف `incident_type`، `incident_payload`، `incident_severity` | تصادف، تصادف است |
| `back/models/incident_report.ts` | تازه — پیشوند `INC-`، فرادادهٔ فرم، چرخهٔ بازبینی | رخدادهای غیرتصادفی، با فرم‌های نامحدود |
| `back/src/incident_report/` | ۱۷ اکشن (پیش‌تر ۱۴)، انتساب مأمور و وضعیت همگام‌سازی در سمت سرور اعمال می‌شود | برابری کامل با `accident`، به‌علاوهٔ کنسول نظارت |
| `back/src/accident/charts/*` (۲۵ اکشن) | حذف `accidentOnlyFilter` | این فیلتر برای خنثی‌کردن آلودگی‌ای بود که تفکیک حذف می‌کند |
| `back/models/accident_process.ts` | مجموعهٔ مجاز narrowed به `["accident"]` | ویزرد نمی‌تواند برای مدلی تألیف کند که پاسخ‌ها را رد می‌کند |
| `back/test/incident-types-test.ts` | جایگزین با `accident-report-shape-test.ts` | تست قدیمی قرارداد غلط را تثبیت می‌کرد |
| `back/test/charts-legacy-compat-test.ts` | بازنویسی به‌صورت نگهبان ساختاری | تست قدیمی فیلترهای حذف‌شده را تثبیت می‌کرد |
| `front/src/services/report-sources.ts` | تازه — تصادف و گزارش پشت یک واسط | کنسول هر دو را بدون شاخه‌بندی در هر پنل نشان می‌دهد |
| `mobile/src/services/sync-worker.ts` | بر اساس نوع گزارش، مدل و mapper را انتخاب می‌کند | دو مدل روابط متفاوتی اعلام می‌کنند |

نقشه عمداً تغییری نکرد و فقط تصادفی است: `mapAccidents` یک قابلیت تصادف است و
گزارش‌های جاده جای درستی روی آن ندارند.

یک enum دسته برای `incident_report` بررسی و **رد شد**. فرمی که گزارش با آن ثبت
شده، دستهٔ آن است؛ فیلد جداگانه منبع حقیقت دومی می‌شد که می‌توانست با پرسش‌هایی که
مأمور واقعاً پاسخ داده در تضاد باشد.

> **در این مسیر یک باگ موتور هم رفع شد.** `buildBindings` و `buildFlatAnswers` مقدار
> یک فیلد را از نزدیک‌ترین شیء scope می‌خواندند، اما پیمایش فقط *ردیف‌های
> تکرارشونده* را روی scope می‌گذارد — در حالی که `group` هم فرزندانش را تودرتو
> می‌کند (`{ group: { note } }`). پس فیلدِ دارای binding درون یک group چیزی صادر
> نمی‌کرد و بی‌صدا دادهٔ نوع‌دار `accident` را از گزارش ثبت‌شده با فرم حذف می‌کرد.
> هر دو اکنون `meta.instancePath` را resolve می‌کنند. تست رگرسیون در
> `bindings_test.ts`.

### ۸. هیچ مهاجرتی روی محیط عملیاتی اجرا نشده — `متوسط، بیرونی`

خودِ تفکیک به مهاجرت داده نیاز ندارد: پایگاه‌دادهٔ توسعه ۵۲٬۸۲۸ تصادف، صفر ردیف
غیرتصادف، صفر سند `form_definition` و یک `accident_process` فقط-تصادف دارد، پس
چیزی نیاز به بازنویسی ندارد. آنچه انجام **نشده** بررسی همین روی محیط عملیاتی است
که از میزبان توسعه در دسترس نیست. پیش از استقرار:

- مطمئن شوید `accident` سندی با `incident_type != "accident"` ندارد؛ اگر دارد، باید
  به `incident_report` منتقل شود (همراه `incident_payload` → فیلدهای اصلی و
  `incident_severity` → رابط)؛
- مطمئن شوید هیچ `form_definition` فیلدهای `incident_type`/`is_active` ندارد؛
- ایندکس منسوخ `{ organization._id, incident_type }` روی `form_definition` را
  **برنامه** حذف می‌کند، نه دست: `applyFormDefinitionMigrations()` پیش از `runServer`
  اجرا می‌شود (ایراد ۲ از §۲ه). به‌جای فرض کردن، بررسی کنید که رفته است —
  `db.form_definition.getIndexes()` نباید
  `organization._id_1_incident_type_1` را فهرست کند؛
- تصمیم بگیرید اسناد `accident_process` قدیمیِ نوع‌دار چه شوند؛ آن‌ها خواندنی
  می‌مانند اما دیگر قابل تألیف نیستند.

همچنین `synced_at` موجود را نمی‌توان پس‌پر کرد: ردیف‌هایی که پیش از این تغییر همگام
شده‌اند هیچ لحظهٔ رسیدنی ندارند و ساختن آن از `updatedAt` میانهٔ زمانی را جعل می‌کند.
آن‌ها `null` می‌مانند و `getOversightStats` آن‌ها را «نامعلوم» گزارش می‌دهد، نه
همگام‌سازی آنی.

## ترتیب پیشنهادی کار

۱. اجرای بررسی پیش از استقرار روی محیط عملیاتی (۸).
۲. رفع کارت تحلیلی سازمان (۹) — یک کارت، یک نقطهٔ فراخوانی.
۳. اتصال `file` / `location` (۴) — پیش از گرفتن مدرک واقعی لازم است.
۴. soak کردن سطح تألیف، انتخابگر و فرم پویا روی دستگاه واقعی.
۵. تألیف دست‌کم یک فرم `incident_report` واقعی برای هر سازمانی که در جاده گشت
   می‌زند، تا ادعای «فرم‌های نامحدود» آزموده شود نه صرفاً فرض.
۶. استخراج گزینه‌های بین‌گروهی (۵) وقتی فرمی واقعاً به آن نیاز داشت.
۷. بازنشاندن `accident_process` پس از پایدار soak و تألیف فرم‌های تصادف.

> بند ۲ پس از عرضهٔ کنسول نظارت افزوده شد. همان ایراد §۲ه/۱ است، در تنها جایی که
> هنوز کمکیِ ادغام قدیمی را صدا می‌زند.
