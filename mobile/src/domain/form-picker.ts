/**
 * The form picker.
 *
 * An organization may author as many forms as it likes, so the entry screen cannot
 * be a fixed list of incident types. It shows the first three and puts the rest
 * behind one button — a patrol officer in a hurry picks the common cases in one
 * tap, and the long tail is still reachable.
 *
 * The accident form is not optional. The backend guarantees at most one active
 * accident form per organization, and the app always falls back to its bundled one,
 * so an accident card is always present.
 */

export type FormKind = 'accident' | 'incident_report';

/** How many form cards sit on the entry screen before the rest move behind a button. */
export const INLINE_FORM_LIMIT = 3;

export type PickerForm = {
	_id: string;
	name: string;
	description?: string;
	form_kind?: FormKind;
	icon?: string;
	/** True for the form bundled with the app rather than one the org authored. */
	isDefault?: boolean;
};

export type FormPicker = {
	/** Rendered directly on the entry screen, in order. */
	inline: PickerForm[];
	/** Behind the "more" button; empty when there is nothing to hide. */
	overflow: PickerForm[];
	/** True when the organization has authored no accident form of its own. */
	usingDefaultAccidentForm: boolean;
};

/**
 * Build the picker from the organization's active forms.
 *
 * Order is deliberate rather than alphabetical: accidents first, because they are
 * the common case and the form most officers file; then the rest as the
 * organization named them.
 *
 * A bundled accident form is appended only when the organization has none, so an
 * officer is never blocked from filing an accident because an administrator has
 * not finished setting up.
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
	const reports = normalized.filter((form) => form.form_kind === 'incident_report');

	const usingDefaultAccidentForm = accidents.length === 0;
	const ordered: PickerForm[] = [
		...accidents,
		// Reports first among themselves by title, so a large organization's list is
		// stable rather than in whatever order the database returned.
		...reports.sort((a, b) => a.name.localeCompare(b.name, 'fa')),
	];

	return {
		inline: ordered.slice(0, INLINE_FORM_LIMIT),
		overflow: ordered.slice(INLINE_FORM_LIMIT),
		usingDefaultAccidentForm,
	};
};

/** The row shown for the bundled accident form. */
export const defaultAccidentPickerForm = (form: PickerForm): PickerForm => ({
	...form,
	isDefault: true,
});
