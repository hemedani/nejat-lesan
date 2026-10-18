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
 * The organization is authoritative: as soon as it has authored **any** form — of
 * any kind — its forms are the whole chooser and the built-in type tiles are hidden.
 * The app neither adds a form of its own nor widens the choice back to the built-in
 * flows; an organization that wants تصادف، خرابی و مانع filable authors a form for
 * each.
 */

export type FormKind = 'accident' | 'incident_report';

export type PickerForm = {
	_id: string;
	name: string;
	description?: string;
	form_kind?: FormKind;
	icon?: string;
};

/**
 * Which chooser the entry screen renders.
 *
 * - `forms` — the organization has authored at least one form, so its forms are the
 *   whole chooser and the «نوع واقعه» section is hidden. Showing both asks the
 *   officer the same question twice, and the type tiles cannot reach an authored
 *   form at all: tapping «خرابی راه» runs the standard flow, never the
 *   organization's «خرابی سطح راه» form.
 * - `types` — the organization has authored none, so the built-in list (and the
 *   standard flow behind it) stays. This is also the offline state with an empty
 *   cache: the form list is whatever the device holds, and incident creation must
 *   never be blocked.
 */
export type PickerMode = 'forms' | 'types';

export type FormPicker = {
	/** Every form the officer may choose, in display order. */
	forms: PickerForm[];
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
 * Any authored form switches the chooser to `forms`: the organization decided what
 * its officers may file, so the app neither adds a form of its own nor keeps the
 * built-in type tiles alongside it.
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
		mode: normalized.length > 0 ? 'forms' : 'types',
	};
};
