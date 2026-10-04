import type { FormDefinition } from '@forms';

import { qaAccidentFormDefinition } from './qa-accident-form';

/**
 * The accident form the app falls back to when an organization has not authored
 * one.
 *
 * Why this exists: `form_definition.getForPatrol` returns `form: null` when the
 * officer's organization has no active accident form, and the backend enforces
 * that at most one exists. A null form must therefore never dead-end an officer —
 * product invariant 2 says offline (or unconfigured) must still allow incident
 * creation. So the app carries a definition of its own and renders it through the
 * same `/incident/form` screen, the same engine, and the same validation.
 *
 * Why it is derived from `qa-accident-form` rather than written separately: that
 * definition is the engine's acceptance test — 36 assertions covering pages,
 * conditions, cascades, nested repeatables, plate variants, option narrowing and
 * reference sources. Duplicating it would mean two accident forms to keep in step,
 * and the copy is the one nobody tests. Deriving keeps the shipped artifact covered
 * by the tests that already exist.
 *
 * It is also deliberately offline-first: every option list is literal, so the form
 * renders with no network at all. A `reference` field needs the server to resolve
 * its options, which a bundled form cannot rely on.
 */

/** A stable, obviously-synthetic id so the app can reference this form. */
export const DEFAULT_ACCIDENT_FORM_ID = '000000000000000000000000';

export const DEFAULT_ACCIDENT_FORM_TITLE = 'فرم استاندارد تصادف';
export const DEFAULT_ACCIDENT_FORM_ICON = 'car';

/**
 * Bumped alongside `qa-accident-form`'s structure so a draft captured against an
 * older bundled form can be told apart from one captured against the current one.
 */
export const DEFAULT_ACCIDENT_FORM_VERSION = 1;

export const DEFAULT_ACCIDENT_FORM_SCHEMA_VERSION = 1;

export const defaultAccidentForm: FormDefinition = {
	...qaAccidentFormDefinition,
	name: DEFAULT_ACCIDENT_FORM_TITLE,
};

/** The shape `/incident/form` expects back from `getForPatrol`. */
export const defaultAccidentFormPayload = (): {
	form: {
		_id: string;
		name: string;
		description?: string;
		form_kind: 'accident';
		icon: string;
		schema_version: number;
		definition: FormDefinition;
	};
	options: Record<string, unknown[]>;
	version: { version: number };
} => ({
	form: {
		_id: DEFAULT_ACCIDENT_FORM_ID,
		name: DEFAULT_ACCIDENT_FORM_TITLE,
		description: 'فرم پیش‌فرض برنامه؛ تا زمانی که سازمان فرم تصادفی بسازد استفاده می‌شود.',
		form_kind: 'accident',
		icon: DEFAULT_ACCIDENT_FORM_ICON,
		schema_version: DEFAULT_ACCIDENT_FORM_SCHEMA_VERSION,
		definition: defaultAccidentForm,
	},
	// Every option in the bundled form is literal, so there is nothing to resolve.
	options: {},
	version: { version: DEFAULT_ACCIDENT_FORM_VERSION },
});

/** Whether a form id refers to the bundled default rather than a stored one. */
export const isDefaultAccidentForm = (formId?: string | null): boolean =>
	formId === DEFAULT_ACCIDENT_FORM_ID;
