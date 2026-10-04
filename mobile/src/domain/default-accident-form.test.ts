import { describe, expect, it } from 'vitest';

import { validateForm, visiblePages } from '@forms';

import {
	DEFAULT_ACCIDENT_FORM_ID,
	DEFAULT_ACCIDENT_FORM_ICON,
	DEFAULT_ACCIDENT_FORM_TITLE,
	defaultAccidentForm,
	defaultAccidentFormPayload,
	isDefaultAccidentForm,
} from './default-accident-form';

describe('bundled default accident form', () => {
	it('is the accident kind, so its answers go to accident', () => {
		const payload = defaultAccidentFormPayload();
		expect(payload.form.form_kind).toBe('accident');
	});

	it('carries a title and an icon from the shared vocabulary', () => {
		const payload = defaultAccidentFormPayload();
		expect(payload.form.name).toBe(DEFAULT_ACCIDENT_FORM_TITLE);
		expect(payload.form.icon).toBe(DEFAULT_ACCIDENT_FORM_ICON);
	});

	it('uses a stable, reserved id', () => {
		expect(DEFAULT_ACCIDENT_FORM_ID).toBe('000000000000000000000000');
		expect(isDefaultAccidentForm(DEFAULT_ACCIDENT_FORM_ID)).toBe(true);
		expect(isDefaultAccidentForm('507f1f77bcf86cd799439011')).toBe(false);
		expect(isDefaultAccidentForm(undefined)).toBe(false);
	});

	it('needs no server-resolved options, so it renders offline', () => {
		// A bundled form cannot depend on the network for its option lists, because
		// invariant 2 requires creation to work offline.
		const payload = defaultAccidentFormPayload();
		expect(payload.options).toEqual({});

		const references: string[] = [];
		const visit = (nodes: unknown[] | undefined) => {
			for (const node of (nodes ?? []) as Array<Record<string, unknown>>) {
				const options = node.options as { kind?: string } | undefined;
				if (options?.kind === 'reference') references.push(String(node.key));
				visit(node.children as unknown[] | undefined);
			}
		};
		for (const page of defaultAccidentForm.pages) {
			for (const section of page.sections ?? []) visit(section.nodes);
		}
		expect(references).toEqual([]);
	});

	it('validates as a real definition and has reachable pages', () => {
		const result = validateForm(defaultAccidentForm, {});
		// An empty report is incomplete, but it must be *judged* rather than crash.
		expect(Array.isArray(result.errors)).toBe(true);
		expect(visiblePages(defaultAccidentForm, {}).length).toBeGreaterThan(0);
	});

	it('has a unique key per field, so answers cannot collide', () => {
		const keys: string[] = [];
		const visit = (nodes: unknown[] | undefined) => {
			for (const node of (nodes ?? []) as Array<Record<string, unknown>>) {
				keys.push(String(node.key));
				visit(node.children as unknown[] | undefined);
			}
		};
		for (const page of defaultAccidentForm.pages) {
			for (const section of page.sections ?? []) visit(section.nodes);
		}
		expect(new Set(keys).size).toBe(keys.length);
	});
});
