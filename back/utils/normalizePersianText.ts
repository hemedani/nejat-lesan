// TODO make this function open-source
export function normalizePersianText(text: string): string {
	if (!text) return "";

	return text
		.replace(/ي/g, "ی") // ی عربی → ی فارسی
		.replace(/ك/g, "ک") // ک عربی → ک فارسی
		.replace(/ۀ/g, "ه") // ه‌ی عربی خاص → ه
		.replace(/ؤ/g, "و") // واو با همزه → و (در صورت نیاز)
		.replace(/إ|أ|آ/g, "ا") // انواع الف همزه‌دار → ا
		// .replace(/‌/g, "") // حذف نیم‌فاصله (U+200C) اگر نیاز نباشه
		// .replace(/\u200C/g, "") // اطمینان از حذف نیم‌فاصله به صورت یونیکدی
		.replace(/\u200F/g, "") // حذف Right-to-Left mark
		.replace(/\u200E/g, "") // حذف Left-to-Right mark
		.replace(/\s+/g, " ") // حذف فاصله‌های اضافی
		.trim(); // حذف فاصله ابتدا و انتها
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
