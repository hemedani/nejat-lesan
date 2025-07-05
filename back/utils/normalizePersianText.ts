// TODO make this function open-source
export function normalizePersianText(text: string): string {
	if (!text) return "";

	return text
		// Remove zero-width characters and invisible characters
		.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "") // Zero-width space, joiner, non-joiner, etc.
		.replace(/\u200F/g, "") // Right-to-Left mark
		.replace(/\u200E/g, "") // Left-to-Right mark
		.replace(/\u202A-\u202E/g, "") // Embedding and override characters

		// Normalize Arabic/Persian characters
		.replace(/ي/g, "ی") // ی عربی → ی فارسی
		.replace(/ك/g, "ک") // ک عربی → ک فارسی
		.replace(/ۀ/g, "ه") // ه‌ی عربی خاص → ه
		.replace(/ؤ/g, "و") // واو با همزه → و
		.replace(/ء/g, "") // Remove standalone hamza
		.replace(/إ|أ|آ/g, "ا") // انواع الف همزه‌دار → ا
		.replace(/ة/g, "ه") // تا مربوطه → ه
		.replace(/ئ/g, "ی") // ی همزه‌دار → ی

		// Normalize digits to English
		.replace(/[۰-۹]/g, (match) => String.fromCharCode(match.charCodeAt(0) - '۰'.charCodeAt(0) + '0'.charCodeAt(0)))
		.replace(/[٠-٩]/g, (match) => String.fromCharCode(match.charCodeAt(0) - '٠'.charCodeAt(0) + '0'.charCodeAt(0)))

		// Normalize punctuation and symbols
		.replace(/[‌]/g, " ") // نیم‌فاصله → space
		.replace(/[−–—]/g, "-") // Different dashes → hyphen
		.replace(/['']/g, "'") // Different apostrophes → standard apostrophe
		.replace(/[""]/g, '"') // Different quotes → standard quote
		.replace(/[«»]/g, '"') // Persian quotes → standard quote
		.replace(/[،]/g, ",") // Persian comma → standard comma
		.replace(/[؛]/g, ";") // Persian semicolon → standard semicolon
		.replace(/[؟]/g, "?") // Persian question mark → standard question mark

		// Remove extra spaces and normalize whitespace
		.replace(/\s+/g, " ") // حذف فاصله‌های اضافی
		.trim() // حذف فاصله ابتدا و انتها
		.toLowerCase(); // Convert to lowercase for consistent comparison
}

// const raw1 = "شخصي كاربردي ي";
// console.log(normalizePersianText(raw1)); // شخصی کاربردی ی

// const raw2 = "دست‌يابي به اطلاعات";
// console.log(normalizePersianText(raw2)); // دستیابی به اطلاعات

// const raw3 = "برنامه‌نويس حرفه‌اي";
// console.log(normalizePersianText(raw3)); // برنامه‌نویس حرفه‌ای

// const raw4 = "كاربردهاي مختلف";
// console.log(normalizePersianText(raw4)); // کاربردهای مختلف

// const raw5 = "مركز آموزش فني";
// console.log(normalizePersianText(raw5)); // مرکز آموزش فنی

// const raw6 = "خانۀ ما";
// console.log(normalizePersianText(raw6)); // خانه ما

// const raw7 = "مهمانۀ رسمی";
// console.log(normalizePersianText(raw7)); // مهمانه رسمی

// const raw8 = "مسؤولیت و تأثیر‌پذیری";
// console.log(normalizePersianText(raw8)); // مسئولیت و تاثیرپذیری

// const raw9 = "رؤساي اداره";
// console.log(normalizePersianText(raw9)); // روسای اداره

// const raw10 = "أحمد در إيران زندگی می‌كند";
// console.log(normalizePersianText(raw10)); // احمد در ايران زندگی می‌کند

// const raw11 = "آثار قدیمي";
// console.log(normalizePersianText(raw11)); // اثار قدیمی

// const raw12 = "می‌ رود و می ‌آید";
// console.log(normalizePersianText(raw12)); // می رود و می آید

// const raw13 = "توسعه‌ ي نرم‌ افزار";
// console.log(normalizePersianText(raw13)); // توسعه ی نرم افزار

// const raw14 = "سلام\u200Cدنیا";
// console.log(normalizePersianText(raw14)); // سلامدنیا

// const raw15 = "سلام\u200F دنیا";
// console.log(normalizePersianText(raw15)); // سلام دنیا

// const raw16 = "  این    یک     متن  با  فاصله‌های  زیاد  است   ";
// console.log(normalizePersianText(raw16)); // این یک متن با فاصله‌های زیاد است
