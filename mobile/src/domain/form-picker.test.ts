import { describe, expect, it } from 'vitest';

import { INLINE_FORM_LIMIT, buildFormPicker, type PickerForm } from './form-picker';

const form = (
  _id: string,
  name: string,
  form_kind: PickerForm['form_kind'] = 'incident_report',
): PickerForm => ({ _id, name, form_kind });

describe('buildFormPicker', () => {
  it('puts accidents first, then reports by title', () => {
    const picker = buildFormPicker([
      form('c', 'مانع ریزش سنگ', 'incident_report'),
      form('a', 'تصادف', 'accident'),
      form('b', 'خرابی آسفالت', 'incident_report'),
    ]);

    expect(picker.inline.map((row) => row.name)).toEqual([
      'تصادف',
      'خرابی آسفالت',
      'مانع ریزش سنگ',
    ]);
    expect(picker.overflow).toEqual([]);
  });

  it('shows the first three and hides the rest behind the button', () => {
    // The product rule: three forms on the face of the screen, the rest behind a
    // button, because an organization can author as many as it likes.
    const picker = buildFormPicker([
      form('a', 'تصادف', 'accident'),
      form('b', 'یک'),
      form('c', 'دو'),
      form('d', 'سه'),
      form('e', 'چهار'),
      form('f', 'پنج'),
    ]);

    expect(picker.inline).toHaveLength(INLINE_FORM_LIMIT);
    expect(picker.overflow).toHaveLength(3);
    expect(picker.inline[0].name).toBe('تصادف');

	// Every form is reachable exactly once across the two groups. Asserted as a set
	// rather than a sequence, because the order of the non-accident forms follows
	// Persian collation and is not what this test is about.
	const shown = [...picker.inline, ...picker.overflow].map((row) => row._id);
	expect(new Set(shown).size).toBe(6);
	for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
	  expect(shown).toContain(id);
	}
  });

  it('reports that no accident form is authored, so the caller can bundle one', () => {
    const withoutAccident = buildFormPicker([form('b', 'خرابی')]);
    expect(withoutAccident.usingDefaultAccidentForm).toBe(true);

    const withAccident = buildFormPicker([form('a', 'تصادف', 'accident'), form('b', 'خرابی')]);
    expect(withAccident.usingDefaultAccidentForm).toBe(false);
  });

  it('treats a form with no kind as an accident', () => {
    // Older definitions predate `form_kind`; the backend defaults them to accident.
    const picker = buildFormPicker([{ _id: 'x', name: 'قدیمی' }]);
    expect(picker.inline[0].form_kind).toBe('accident');
    expect(picker.usingDefaultAccidentForm).toBe(false);
  });

  it('handles an organization with no forms at all', () => {
    const picker = buildFormPicker([]);
    expect(picker.inline).toEqual([]);
    expect(picker.overflow).toEqual([]);
    expect(picker.usingDefaultAccidentForm).toBe(true);
  });
});
