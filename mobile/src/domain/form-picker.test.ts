import { describe, expect, it } from 'vitest';

import { buildFormPicker, type PickerForm } from './form-picker';

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

    expect(picker.forms.map((row) => row.name)).toEqual([
      'تصادف',
      'خرابی آسفالت',
      'مانع ریزش سنگ',
    ]);
  });

  it('lists every active form, not a first page of them', () => {
    // The regression this pins: the entry screen used to split the org's forms
    // into "three inline" and "the rest behind a button", and a caller that only
    // rendered the first group showed one of an organization's four forms.
    const picker = buildFormPicker([
      form('a', 'تصادف', 'accident'),
      form('b', 'یک'),
      form('c', 'دو'),
      form('d', 'سه'),
      form('e', 'چهار'),
      form('f', 'پنج'),
    ]);

    expect(picker.forms).toHaveLength(6);
    expect(picker.forms[0].name).toBe('تصادف');
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
      expect(picker.forms.map((row) => row._id)).toContain(id);
    }
  });

  it('treats a form with no kind as an accident', () => {
    // Older definitions predate `form_kind`; the backend defaults them to accident.
    const picker = buildFormPicker([{ _id: 'x', name: 'قدیمی' }]);
    expect(picker.forms[0].form_kind).toBe('accident');
  });

  it('keeps the report forms whatever the incident type is', () => {
    // `form_kind` decides which model stores the report — not the draft's current
    // type. Filtering the list by the draft's type is what made an organization's
    // three report forms unreachable while only its accident form showed.
    const picker = buildFormPicker([
      form('a', 'گزارش تصادف', 'accident'),
      form('b', 'خرابی سطح راه', 'incident_report'),
      form('c', 'مانع در سطح راه', 'incident_report'),
      form('d', 'خرابی روشنایی', 'incident_report'),
    ]);

    expect(picker.forms[0].name).toBe('گزارش تصادف');
    expect(picker.forms).toHaveLength(4);
    // Asserted as a set: the order of the report forms follows Persian collation,
    // which is not what this test is about.
    expect(new Set(picker.forms.map((row) => row.name))).toEqual(
      new Set(['گزارش تصادف', 'خرابی سطح راه', 'مانع در سطح راه', 'خرابی روشنایی']),
    );
  });
});

describe('buildFormPicker mode', () => {
  it('hands the choice to the organization once it has authored a report form', () => {
    // The demo organization: an accident form plus a report form. Its forms are the
    // menu, so the «نوع واقعه» tiles would be a duplicate.
    const picker = buildFormPicker([
      form('a', 'گزارش تصادف', 'accident'),
      form('b', 'خرابی سطح راه', 'incident_report'),
    ]);
    expect(picker.mode).toBe('forms');
  });

  it('hands the choice over even with no accident form of its own', () => {
    const picker = buildFormPicker([form('b', 'خرابی سطح راه', 'incident_report')]);
    expect(picker.mode).toBe('forms');
  });

  it('hands the choice over for a lone accident form', () => {
    // The regression this pins: an organization with a single authored form used to
    // keep the built-in «نوع واقعه» tiles, showing the officer an app default beside
    // the one form their organization actually made.
    const picker = buildFormPicker([form('a', 'گزارش تصادف', 'accident')]);
    expect(picker.mode).toBe('forms');
    expect(picker.forms.map((row) => row.name)).toEqual(['گزارش تصادف']);
  });

  it('falls back to the built-in incident types when it has authored none', () => {
    // Also the offline state with an empty cache: there is nothing stored, so the
    // standard flow and its type tiles stay.
    expect(buildFormPicker([]).mode).toBe('types');
    expect(buildFormPicker([]).forms).toEqual([]);
  });
});
