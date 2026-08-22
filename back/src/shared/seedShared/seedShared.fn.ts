import { type ActFn } from "@deps";
import { type MyContext } from "@lib";
import {
	coreApp,
	croquis_type,
	damage_severity,
	driver_status,
	equipment_damage,
	injury_status,
	person_role,
	position,
	road_defect,
	road_situation,
	road_surface_condition,
	vehicle_final_status,
	vehicle_type,
} from "../../../mod.ts";

export const seedSharedFn: ActFn = async (body) => {
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const seeds: Record<string, { model: any; values: string[] }> = {
	vehicle_type: {
		model: vehicle_type,
		values: [
			"سواری",
			"وانت",
			"کامیون",
			"کشنده",
			"اتوبوس",
			"مینی‌بوس",
			"موتورسیکلت",
			"ماشین‌آلات راه‌سازی",
			"امدادی",
			"سایر",
		],
	},
	croquis_type: {
		model: croquis_type,
		values: ["کروکی سازشی سری ۱۲", "کروکی غیرسازشی سری ۲۲"],
	},
	vehicle_final_status: {
		model: vehicle_final_status,
		values: [
			"متوقف در مسیر",
			"متوقف در شانه",
			"واژگون",
			"خارج شده از راه",
			"سقوط کرده",
			"دچار حریق",
			"منتقل شده با جرثقیل",
		],
	},
	driver_status: {
		model: driver_status,
		values: ["حاضر", "مصدوم", "منتقل شده", "فوت شده", "متواری", "نامشخص"],
	},
	injury_status: {
		model: injury_status,
		values: [
			"بدون آسیب",
			"آسیب جزئی",
			"آسیب جدی",
			"وضعیت بحرانی",
			"فوت در محل",
			"فوت پس از انتقال",
			"نامشخص",
		],
	},
	person_role: {
		model: person_role,
		values: [
			"راننده",
			"سرنشین",
			"عابر پیاده",
			"موتورسوار",
			"دوچرخه‌سوار",
			"مأمور/نیروی امدادی",
		],
	},
	damage_severity: {
		model: damage_severity,
		values: ["جزئی", "متوسط", "شدید", "تخریب کامل"],
	},
	position: {
		model: position,
		values: ["خط ۱", "خط ۲", "شانه راست", "شانه چپ"],
	},
	road_situation: {
		model: road_situation,
		values: [
			"قوس افقی",
			"شیب/فراز",
			"قوس قائم",
			"محدوده عوارضی",
			"محل عملیات راه‌سازی",
			"شانه راه",
		],
	},
	road_surface_condition: {
		model: road_surface_condition,
		values: ["مرطوب", "خیس", "آبگرفته"],
	},
	road_defect: {
		model: road_defect,
		values: ["نقص گاردریل", "آبگرفتگی", "محدودیت دید"],
	},
	equipment_damage: {
		model: equipment_damage,
		values: [
			"نیوجرسی",
			"پایه تابلو",
			"پایه روشنایی",
			"چراغ روشنایی",
			"فنس",
			"دوربین",
			"تجهیزات عوارضی",
			"پل/آبرو",
		],
	},
};

	const added: Record<string, number> = {};
	let totalAdded = 0;

	for (const [modelName, { model, values }] of Object.entries(seeds)) {
		let addedCount = 0;

		for (const value of values) {
			const name = value.trim();
			if (!name) continue;

			const existing = await model.findOne({
				filters: {
					name: {
						$regex: new RegExp(
							`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
							"i",
						),
					},
				},
				projection: { _id: 1 },
			});

			if (existing) continue;

			await model.insertOne({
				doc: {
					name,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				relations: {
					registrer: { _ids: user._id },
				},
				projection: { _id: 1 },
			});

			addedCount++;
		}

		if (addedCount > 0) {
			added[modelName] = addedCount;
			totalAdded += addedCount;
		}
	}

	return {
		added,
		totalAdded,
	};
};