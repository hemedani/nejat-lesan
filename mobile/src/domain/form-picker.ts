/**
 * The form picker.
 *
 * An organization may author as many forms as it likes, so the entry screen cannot
 * be a fixed list of incident types: the organization's own forms **are** its
 * incident-type menu. Every active form is listed — accidents first, then the rest
 * by title — because an officer in a hurry should find the common case at the top.
 *
 * There is deliberately no "first N, the rest behind a button" tier. Once the
 * organization's forms replace the type list (see `PickerMode`) they are the *only*
 * way to choose, so hiding one behind a second tap would hide an incident type the
 * officer is looking for — which is exactly the bug this replaced: a list that
 * silently showed one of four forms.
 *
 * The accident form is not optional. The backend guarantees at most one active
 * accident form per organization, and the app always falls back to its bundled one,
 * so an accident card is always present.
 */

export type FormKind = 'accident' | 'incident_report';

export type PickerForm = {
	_id: string;
	name: string;
	description?: string;
	form_kind?: FormKind;
	icon?: string;
	/** True for the form bundled with the app rather than one the org authored. */
	isDefault?: boolean;
};

/**
 * Which chooser the entry screen renders.
 *
 * - `forms` — the organization's own forms can stand in for the built-in list, so
 *   they replace it and the «نوع واقعه» section is hidden. Showing both asks the
 *   officer the same question twice, and the type tiles cannot reach an authored
 *   form at all: tapping «خرابی راه» runs the standard flow, never the
 *   organization's «خرابی سطح راه» form.
 * - `types` — they cannot, so the built-in list (and the standard flow behind it)
 *   stays. This is also the offline state: the form list needs the network, and
 *   incident creation must never be blocked.
 *
 * "Can stand in for it" means **every** incident type is covered, and accidents are
 * always covered because the app bundles a form for them. So the deciding question is
 * whether the organization has authored a *report* form. An organization with only an
 * accident form keeps the tiles: hiding them would leave its officers no way at all to
 * file خرابی/مانع/سایر.
 */
export type PickerMode = 'forms' | 'types';

export type FormPicker = {
	/** Every form the officer may choose, in display order. */
	forms: PickerForm[];
	/** True when the organization has authored no accident form of its own. */
	usingDefaultAccidentForm: boolean;
	/** Which chooser the entry screen renders. */
	mode: PickerMode;
};

/**
 * Build the picker from the organization's active forms.
 *
 * Order is deliberate rather than alphabetical: accidents first, because they are
 * the common case and the form most officers file; then the rest as the
 * organization named them.
 *
 * A bundled accident form is appended by the caller only when the organization has
 * none, so an officer is never blocked from filing an accident because an
 * administrator has not finished setting up.
 */
export const buildFormPicker = (forms: PickerForm[]): FormPicker => {
	// A definition stored before `form_kind` existed has none, and the backend
	// defaults that to accident — so normalize here rather than trusting every
	// caller to have done it.
	const normalized: PickerForm[] = forms.map((form) => ({
		...form,
		form_kind: form.form_kind ?? 'accident',
	}));
	const accidents = normalized.filter((form) => form.form_kind === 'accident');
	// Reports sorted by title, so a large organization's list is stable rather than
	// in whatever order the database returned.
	const reports = normalized
		.filter((form) => form.form_kind === 'incident_report')
		.sort((a, b) => a.name.localeCompare(b.name, 'fa'));

	return {
		forms: [...accidents, ...reports],
		usingDefaultAccidentForm: accidents.length === 0,
		mode: reports.length > 0 ? 'forms' : 'types',
	};
};

/** The row shown for the bundled accident form. */
export const defaultAccidentPickerForm = (form: PickerForm): PickerForm => ({
	...form,
	isDefault: true,
});
