import { describe, expect, it } from 'vitest';

import { applyServerFileIds } from './media-writeback';

describe('applyServerFileIds', () => {
  it('writes plate and insurance file ids into the matching vehicle dto', () => {
    const data = {
      vehicle_dtos: [{ plaque_no: ['22', '111', 'Iran55'] }, { plaque_no: ['33', '444', 'Iran66'] }],
    };
    const next = applyServerFileIds(data, [
      { category: 'plate', fileId: 'file-plate-1', ownerId: 'vehicle:0' },
      { category: 'insurance', fileId: 'file-ins-1', ownerId: 'vehicle:1' },
    ]);
    expect(next['vehicle_dtos']).toEqual([
      { plate_image: 'file-plate-1', plaque_no: ['22', '111', 'Iran55'] },
      { insurance_image: 'file-ins-1', plaque_no: ['33', '444', 'Iran66'] },
    ]);
    expect(data['vehicle_dtos'][0]).not.toHaveProperty('plate_image');
  });

  it('appends damage images to facility dtos without duplicating ids', () => {
    const data = {
      facility_damage_dtos: [{ asset_code: 'A-1', images: ['file-old'] }],
    };
    const next = applyServerFileIds(data, [
      { category: 'damage', fileId: 'file-new', ownerId: 'facility:0' },
      { category: 'damage', fileId: 'file-old', ownerId: 'facility:0' },
    ]);
    expect(next['facility_damage_dtos']).toEqual([
      { asset_code: 'A-1', images: ['file-old', 'file-new'] },
    ]);
  });

  it('ignores unknown owners and preserves unrelated draft fields', () => {
    const data = {
      news_number: 12,
      vehicle_dtos: [{}],
    };
    const next = applyServerFileIds(data, [
      { category: 'croquis', fileId: 'file-croq', ownerId: 'croquis' },
      { category: 'damage', fileId: 'file-x', ownerId: 'somewhere' },
    ]);
    expect(next).toEqual(data);
  });

  it('returns the same object when there is nothing to write back', () => {
    const data = { vehicle_dtos: [] };
    expect(applyServerFileIds(data, [])).toBe(data);
  });
});
