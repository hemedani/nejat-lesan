/**
 * The shared icon vocabulary for form definitions.
 *
 * A form, its questions and its answer options each carry an icon. Those icons are
 * stored as **name strings** in the definition and rendered by two completely
 * different runtimes — the Next.js builder and the Expo patrol app — so this file
 * is the single place the three agree on which icons exist and what they are called.
 *
 * Names are Phosphor's, in its camelCase base form (`trafficSign`, not
 * `traffic-sign`). Each app maps a name to its own component: the web package
 * exports `TrafficSignIcon`, the native package exports `TrafficSign`. Both derive
 * from `phosphorComponentName` below so the two can never drift on capitalisation.
 *
 * This is deliberately data-only. The engine is consumed by the Deno backend, which
 * cannot import a React or React Native component, so a shared *component* is not
 * possible — only a shared name. `validateIconNames` lets the backend reject a typo
 * at publish time rather than rendering an empty box on an officer's phone.
 *
 * Every name here is verified against `@phosphor-icons/react`'s own definition
 * list. Adding a name that the package does not ship produces a glyph the phone
 * renders as a blank box, so the vocabulary is checked rather than eyeballed — see
 * `front/src/components/org/forms/form-icon-map.ts` for the assertion.
 *
 * Persian labels are included despite this being an engine module: both apps need
 * the exact same picker wording, and duplicating them in two apps is how the two
 * form type-label maps already drifted apart.
 */

/** Every icon a form, question or answer option may use. */
export const FORM_ICON_NAMES = [
	// incident — رخداد و وضعیت اضطراری
	"car",
	"truck",
	"motorcycle",
	"bicycle",
	"bus",
	"ambulance",
	"trafficSignal",
	"warning",
	"warningOctagon",
	"fire",
	"bomb",
	"firstAid",
	"drop",

	// environment — شرایط محیطی و جوی
	"sun",
	"moon",
	"sunHorizon",
	"moonStars",
	"cloud",
	"cloudRain",
	"cloudSnow",
	"cloudFog",
	"cloudLightning",
	"wind",
	"thermometer",
	"dropHalf",
	"snowflake",
	"gauge",
	"eye",

	// road — راه و مسیر
	"roadHorizon",
	"path",
	"signpost",
	"trafficSign",
	"barricade",
	"bridge",
	"mountains",
	"trafficCone",
	"ladder",
	"wall",
	"navigationArrow",
	"mapPin",

	// damage — خرابی و نقص
	"wrench",
	"hammer",
	"gear",
	"engine",
	"batteryCharging",
	"gasPump",
	"anchor",
	"plug",
	"hardHat",
	"shovel",
	"paintBrush",

	// people — افراد و مصدومیت
	"person",
	"users",
	"userFocus",
	"skull",
	"syringe",
	"baby",
	"wheelchair",
	"pawPrint",
	"stethoscope",
	"heart",
	"heartbeat",

	// misc — عمومی
	"clipboardText",
	"notePencil",
	"calendarBlank",
	"clock",
	"phone",
	"tag",
	"package",
	"camera",
	"image",
	"videoCamera",
	"paperPlaneTilt",
	"bug",
	"lightbulb",
	"fileText",
	"checkCircle",
	"xCircle",
	"info",
	"question",
] as const;

export type FormIconName = (typeof FORM_ICON_NAMES)[number];

const NAMES: ReadonlySet<string> = new Set(FORM_ICON_NAMES);

export const isFormIconName = (value: unknown): value is FormIconName =>
	typeof value === "string" && NAMES.has(value);

/** Stable group keys, so the picker can order and label sections. */
export const FORM_ICON_GROUP_KEYS = [
	"incident",
	"environment",
	"road",
	"damage",
	"people",
	"misc",
] as const;

export type FormIconGroupKey = (typeof FORM_ICON_GROUP_KEYS)[number];

export const FORM_ICON_GROUP_LABELS: Record<FormIconGroupKey, string> = {
	incident: "رخداد و وضعیت اضطراری",
	environment: "شرایط محیطی و جوی",
	road: "راه و مسیر",
	damage: "خرابی و نقص",
	people: "افراد و مصدومیت",
	misc: "عمومی",
};

/**
 * Icons per group, for the picker.
 *
 * Built by scanning `FORM_ICON_NAMES` in declaration order against a group-key
 * prefix, so adding a name to the list above is enough — a name that matches no
 * group is still valid, it just does not appear in the picker until one is chosen.
 */
const GROUP_PREFIXES: Array<[FormIconGroupKey, readonly string[]]> = [
	[
		"incident",
		[
			"car",
			"truck",
			"motorcycle",
			"bicycle",
			"bus",
			"ambulance",
			"trafficSignal",
			"warning",
			"warningOctagon",
			"fire",
			"bomb",
			"firstAid",
			"drop",
		],
	],
	[
		"environment",
		[
			"sun",
			"moon",
			"sunHorizon",
			"moonStars",
			"cloud",
			"cloudRain",
			"cloudSnow",
			"cloudFog",
			"cloudLightning",
			"wind",
			"thermometer",
			"dropHalf",
			"snowflake",
			"gauge",
			"eye",
		],
	],
	[
		"road",
		[
				"roadHorizon",
			"path",
			"signpost",
			"trafficSign",
			"barricade",
			"bridge",
			"mountains",
			"trafficCone",
			"ladder",
			"wall",
			"navigationArrow",
			"mapPin",
		],
	],
	[
		"damage",
		[
			"wrench",
			"hammer",
			"gear",
			"engine",
			"batteryCharging",
			"gasPump",
					"anchor",
			"plug",
			"hardHat",
			"shovel",
			"paintBrush",
		],
	],
	[
		"people",
		[
			"person",
			"users",
			"userFocus",
			"skull",
			"syringe",
			"baby",
			"wheelchair",
			"pawPrint",
			"stethoscope",
			"heart",
			"heartbeat",
		],
	],
	[
		"misc",
		[
			"clipboardText",
			"notePencil",
			"calendarBlank",
			"clock",
			"phone",
			"tag",
			"package",
			"camera",
			"image",
			"videoCamera",
			"paperPlaneTilt",
			"bug",
			"lightbulb",
			"fileText",
			"checkCircle",
			"xCircle",
			"info",
			"question",
		],
	],
];

export const FORM_ICON_GROUPS: ReadonlyArray<{
	key: FormIconGroupKey;
	label: string;
	icons: readonly FormIconName[];
}> = GROUP_PREFIXES.map(([key, icons]) => ({
	key,
	label: FORM_ICON_GROUP_LABELS[key],
	icons: icons as readonly FormIconName[],
}));

/**
 * The Phosphor export name for an icon.
 *
 * The web adapter appends `Icon` (`TrafficSignIcon`); the native adapter uses this
 * directly (`TrafficSign`). Deriving both from one function is what keeps the two
 * renderers from disagreeing about capitalisation.
 */
export const phosphorComponentName = (icon: FormIconName): string =>
	icon.charAt(0).toUpperCase() + icon.slice(1);

/**
 * Unknown icon names in a value bag, for publish-time rejection.
 *
 * Returns the offending names, so a caller can report all of them at once rather
 * than making an author fix one typo per attempt.
 */
export const validateIconNames = (
	icons: readonly (unknown | null | undefined)[],
): string[] => {
	const bad: string[] = [];
	for (const icon of icons) {
		if (icon === null || icon === undefined || icon === "") continue;
		if (!isFormIconName(icon)) bad.push(String(icon));
	}
	return bad;
};

/**
 * The icon a definition falls back to when a node declares none.
 *
 * Chosen to read as "a question" in both renderers.
 */
export const DEFAULT_FORM_ICON: FormIconName = "fileText";
