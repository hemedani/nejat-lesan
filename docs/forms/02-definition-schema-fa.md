# ۰۲ — مرجع ساختار تعریف

یک `FormDefinition` درختی از **صفحه‌ها ← بخش‌ها ← گره‌ها** است. موتور آن را با
`walkNodes` پیمایش می‌کند، در موبایل رندر می‌کند، در فرم‌ساز پیش‌نمایش می‌دهد و
در سرور اعتبارسنجی می‌کند.

مرجع اصلی: `shared/form-engine/src/types.ts`.

## سطح بالا

```ts
type FormDefinition = {
  schemaVersion: number;   // با تغییر ناسازگار ساختار افزایش می‌یابد
  name: string;
  pages: PageNode[];
};
```

`schemaVersion` برای سازگاری مهم است. کلاینتی که نسخه را نفهمد، فرم را رندر
نمی‌کند و به جریان داخلی برمی‌گردد، به‌جای اینکه فرمی نیمه‌درست نشان دهد و
اجازه دهد مأمور گزارشی با پرسش‌های ناقص ثبت کند. نسخهٔ فعلی `1` است.

## ظرف‌ها

### PageNode

یک گام ویزارد. هر صفحه می‌تواند شرطی باشد — این‌گونه «گام آسیب فقط وقتی آسیب
تأیید شد ظاهر شود» بیان می‌شود.

```ts
type PageNode = {
  key: string;            // در کل تعریف یکتا است
  title: string;
  description?: string;
  icon?: string;
  order: number;
  sections: SectionNode[];
  visibleWhen?: Rule;     // کل صفحه در صورت false پنهان می‌شود
  requiredWhen?: Rule;    // صفحه نمی‌تواند خالی رها شود
};
```

### SectionNode

یک گروه عنوان‌دار از فیلدها درون صفحه. برای کاربر یک گام جدا محسوب نمی‌شود؛
فقط صفحه را سازمان‌دهی می‌کند.

```ts
type SectionNode = {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
  nodes: ContentNode[];
  visibleWhen?: Rule;
  requiredWhen?: Rule;
};
```

### GroupNode

ظرفی صرفاً سازمان‌دهنده. خودش پاسخی ندارد و به‌صورت یک ناحیهٔ عنوان‌دار رندر
می‌شود. برای «نمایش مجموعه فیلدهای کاملاً متفاوت برای مقدار متفاوت» مفید است:
هر گزینهٔ جایگزین را در یک گروه بگذارید و هر گروه را شرطی کنید.

```ts
type GroupNode = {
  kind: "group";
  key: string;
  label?: string;
  order: number;
  children: ContentNode[];
  visibleWhen?: Rule;
  requiredWhen?: Rule;
};
```

### RepeatableNode

فهرستی که مأمور به آن ردیف اضافه می‌کند. **گروه‌های تکرارشونده تودرتو
می‌شوند** و همین، ساختار `vehicles[] → راننده + passengers[]` را بیان می‌کند.

```ts
type RepeatableNode = {
  kind: "repeatable";
  key: string;
  label: string;           // «وسیله نقلیه»
  description?: string;
  order: number;
  minItems?: number;       // مثلاً 1 یعنی دست‌کم یک وسیله
  maxItems?: number;       // سقف فهرست مأمور
  itemLabel?: string;      // عنوان ردیف، مثلاً «وسیله»
  itemSummary?: string;    // خلاصهٔ ردیف بسته
  children: ContentNode[];
  visibleWhen?: Rule;
  requiredWhen?: Rule;
};
```

`minItems` **یک بار برای کل گروه** بررسی می‌شود، نه یک بار برای هر ردیف — فهرستی
که بیش از حد پر شده نباید همان خطا را مکرر گزارش کند.

## FieldNode

```ts
type FieldNode = {
  kind: "field";
  key: string;             // یکتا؛ شرط‌ها فیلدها را با این کلید نشان می‌دهند
  type: FieldType;
  label: string;           // متن فارسی نمایش‌داده‌شده به مأمور
  description?: string;
  placeholder?: string;
  optionalHint?: string;   // پیام دلخواه هنگام خالی‌بودنِ الزامی
  icon?: string;
  order: number;
  defaultValue?: AnswerValue;

  // رفتار شرطی — سند ۰۳ را ببینید
  visibleWhen?: Rule;
  requiredWhen?: Rule;
  options?: OptionSource;
  optionsFilter?: OptionsFilter;
  clearOnChange?: string[];

  validation?: Validation;
  valueFrom?: Rule;        // برای type: "computed"
  plateVariants?: PlateVariant[];
  binding?: Binding;
};
```

### انواع فیلد

| نوع | نمایش | توضیح |
| ---- | ----- | ------ |
| `text` | ورودی تک‌خطی | |
| `textarea` | ورودی چندخطی | |
| `number` | ورودی عددی | ارقام فارسی پیش از مقایسه یکسان‌سازی می‌شود |
| `date` | انتخابگر تاریخ | ذخیره به‌صورت ISO |
| `time` | انتخابگر ساعت | |
| `datetime` | ترکیبی | |
| `select` | فهرست بازشو، یک انتخاب | نیازمند `options` |
| `multi_select` | تراشه‌ها، چند انتخاب | نیازمند `options` |
| `boolean` | تراشه‌های بله / خیر | در صورت حذف، پیش‌فرض داخلی دارد |
| `choice_group` | ردیف انتخاب لمسی | از رنگ‌بندی `tone` پشتیبانی می‌کند |
| `reference` | فهرست مدل بک‌اند | گزینه‌ها از سرور می‌آید، هرگز دستی |
| `plate` | پلاک مرکب ایرانی | بخش «variantهای پلاک» را ببینید |
| `file` | فهرست رسانه | در صفحهٔ اختصاصی رسانه گرفته می‌شود |
| `location` | نقشه و GPS | در صفحهٔ اختصاصی موقعیت |
| `computed` | متن فقط‌خواندنی | مقدار از `valueFrom` |

### گزینه‌ها

گزینه‌های ثابت درون‌خطی تعریف می‌شوند:

```ts
options: {
  kind: "literal",
  items: [
    { value: "حریق یا دود شدید", label: "حریق یا دود شدید", tone: "danger", symbol: "♨" },
    { value: "مصدوم", label: "مصدوم", tone: "warn" },
  ],
}
```

`tone` یکی از `normal` | `warn` | `danger` است و رنگ تراشه‌ها را تعیین می‌کند؛
همان چیزی که فرم QA برای برجسته‌کردن آتش، انفجار و انسداد کامل استفاده می‌کند.

منبع `reference` گزینه‌ها را از هر مدل لسن که `{_id, name}` دارد می‌گیرد:

```ts
options: { kind: "reference", model: "collision_type", allowedIds: [] }
```

`allowedIds` فهرست را به زیرمجموعه‌ای محدود می‌کند. **این فهرست مجاز از پاسخ
گشتی حذف می‌شود** — کلاینت‌ها نمی‌بینند کدام زیرمجموعه در جریان است؛ فهرست
محدودشده‌ای که دریافت می‌کنند تنها نمای آن‌هاست.

### اعتبارسنجی

```ts
validation: {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  message?: string;              // هنگام خطا نمایش می‌شود
  warnings?: Array<{ rule: Rule; message: string }>;
};
```

`warnings` همان بررسی‌های مشورتی هستند. هرگز جلوگیری نمی‌کنند.

## نگاشت‌ها (Binding)

یک binding مقدار پاسخ را روی یک فیلد typed واقعی در **مدل هدف** نگاشت می‌کند —
`accident` برای فرمی با نوع `accident` و `incident_report` برای فرم گزارش — تا
نمودارهای موجود کار کنند و گزارش‌ها قابل‌کوئری بمانند.

```ts
type Binding =
  | { kind: "relation"; path: string; multi?: boolean }
  | { kind: "dto"; dto: string; field: string; from: string }
  | { kind: "pure"; path: string }
  | { kind: "dynamic" };
```

| نوع | مقصد | نمونه |
| --- | ----- | ----- |
| `relation` | رابطه‌ای که مدل هدف اعلام می‌کند | `{ kind: "relation", path: "type" }` |
| `dto` | فیلدی درون آرایهٔ DTO توکار | `{ kind: "dto", dto: "vehicle_dtos", field: "vehicle_type", from: "type" }` |
| `pure` | فیلد سطح‌بالا در مدل هدف | `{ kind: "pure", path: "date_of_accident" }` |
| `dynamic` | بدون مقصد typed — فقط دادهٔ فرم | `{ kind: "dynamic" }` |

کلید خروجی همان‌گونه ساخته می‌شود که
`mobile/src/domain/process-form.ts` می‌سازد، پس بارِ موبایل موجود بدون تغییر تولید
می‌شود: `road_defects` با `multi` می‌شود `roadDefectsIds` و `collision_type`
می‌شود `collisionTypeId`.

### یک binding معتبر چه شکلی است

دو قاعده هنگام **فعال‌سازی** اعمال می‌شوند و هر دو به این دلیل که نقضشان گزارشی
می‌ساخت که بی‌صدا داده از دست می‌داد:

۱. **مقصد باید وجود داشته باشد.** مسیر `relation` باید رابطه‌ای باشد که مدل هدف
   اعلام می‌کند؛ فیلد `dto` باید فیلدی واقعی از یک DTO واقعی باشد. هر دو مجموعه از
   اسکیمای زندهٔ Lesan در سرور مشتق می‌شوند، پس یک فهرست دستی دیگر هرگز نمی‌تواند
   از مدل‌ها عقب بماند.
۲. **bindingهای `relation` و `dto` فقط روی فیلد `reference` کار می‌کنند.** یک
   گزینهٔ literal رشته می‌دهد نه ObjectId، پس bind کردنش به یک رابطه قابل‌حل نیست.
   binding از نوع `pure` یا `dynamic` روی هر نوع فیلدی مجاز است.

نقض هر قاعده باعث می‌شود `activate` تعریف را با پیام فارسی رد کند و فرم پیش‌نویس
بماند. فرم‌ساز فقط گزینه‌های معتبر را پیشنهاد می‌دهد، پس حالت رایج اصلاً قابل تألیف
نیست.

## variantهای پلاک

پلاک ایرانی برای هر نوع پلاک شکل متفاوتی دارد. تعریف هر شکل را اعلام می‌کند و
موتور با شرط انتخاب می‌کند:

```ts
{
  key: "plate_national",
  type: "plate",
  visibleWhen: { op: "eq", path: "plateType", value: "ملی" },
  requiredWhen: { op: "eq", path: "plateType", value: "ملی" },
  plateVariants: [{
    when: { op: "eq", path: "plateType", value: "ملی" },
    parts: [
      { key: "a", label: "دو رقم", kind: "digits", length: 2, inputMode: "numeric" },
      { key: "b", label: "حرف",    kind: "select", items: [ /* ب، ج، د، … */ ] },
      { key: "c", label: "سه رقم", kind: "digits", length: 3, inputMode: "numeric" },
      { key: "d", label: "کد",     kind: "digits", length: 2, inputMode: "numeric" },
    ],
  }],
}
```

انواع بخش: `digits` (طول ثابت `length`، صفحه‌کلید عددی)، `letters`، `text`،
`select` (از `items`). هر variant باید **دست‌کم یک بخش** داشته باشد — variant بدون
بخش، کنترلی خالی رندر می‌کند.

## شرط‌ها روی گره‌ها

سه جایگاه، که همهٔ آنچه تیم کیفیت خواسته را پوشش می‌دهد:

| جایگاه | اثر |
| ------ | ---- |
| `visibleWhen` | نمایش یا پنهان‌سازی گره |
| `requiredWhen` | الزام شرطی |
| `optionsFilter` | محدود کردن فهرست گزینه‌ها بر اساس پاسخ‌های دیگر |

به‌علاوهٔ `clearOnChange` که فهرست فیلدهایی را می‌گوید که با هر تغییر این فیلد
پاک شوند.

## شکل ذخیره‌سازی

`form_definition.definition` درخت را نگه می‌دارد. ساختار گره عمداً یک **پوشش
شل** است، نه یک superstruct بازگشتی:

- یک `object()` خودارجاع، تا سرریز پشته بازگشت می‌کند — این بررسی شده، نه
  فرضی.
- بنابراین پوشش توسط مدل اعتبارسنجی می‌شود و **معناشناسی** (کلیدهای یکتا،
  عملگرهای مجاز، مدل‌های مرجع قابل حل) در `activate` بررسی می‌شود که پیام‌های
  فارسی و قابل‌اقدام تولید می‌کند.

این یعنی تعریف می‌تواند بدون مهاجرت، فیلدهای اختیاری جدید بگیرد.

> **تله‌ای که باید بدانید.** روی گره‌های تعریف از `optional()` استفاده کنید،
> نه `defaulted()`. مقدار پیش‌فرض `defaulted` فقط زیر `create()`
> (`validationRunType` اکشن `add`) اعمال می‌شود، در حالی که `update` یک
> `assert` ساده اجرا می‌کند — پس فیلدی با مقدار پیش‌فرض روی add اعتبارسنجی و
> بعد روی update با همان سند شکست می‌خورد.

## قواعد کلیدی

۱. **هر `key` باید در کل تعریف یکتا باشد.** شرط‌ها فیلدها را با کلید نشان
می‌دهند، پس تکراری بودن هر شرطی را که آن را نام ببرد بی‌صدا خراب می‌کند. بک‌اند
در `activate` تکراری‌ها را رد می‌کند و فرم‌ساز هشدار می‌دهد.
۲. **`order` ترتیب را کنترل می‌کند.** ترتیب‌های برابر، ترتیب اعلان را حفظ
می‌کنند.
۳. **کلیدها باید پایدار باشند.** پیش‌نویس‌های موبایل با کلید فیلد نشان‌دار
می‌شوند؛ تغییر نام یک کلید، پاسخ‌های واردشده را بی‌صاحب می‌کند.

## گام بعد

- **[۰۳ شرط‌ها و منطق شرطی](./03-rules-and-conditions-fa.md)** — زبان شرط به‌طور کامل
