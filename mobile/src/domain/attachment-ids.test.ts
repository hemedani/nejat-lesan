import { describe, expect, it } from 'vitest';

import { mergeAttachmentIds, withAttachmentIds } from './attachment-ids';

describe('attachment ids', () => {
  it('keeps what is already there and appends what is new', () => {
    expect(mergeAttachmentIds(['file-a'], ['file-b'])).toEqual(['file-a', 'file-b']);
  });

  it('does not repeat an id the backend would already have from the card fields', () => {
    expect(mergeAttachmentIds(['file-a', 'file-b'], ['file-b', 'file-c'])).toEqual([
      'file-a',
      'file-b',
      'file-c',
    ]);
  });

  it('starts from nothing when the payload has no list yet', () => {
    expect(mergeAttachmentIds(undefined, ['file-a'])).toEqual(['file-a']);
  });

  it('ignores a payload value that is not a list of strings', () => {
    expect(mergeAttachmentIds('nonsense', ['file-a'])).toEqual(['file-a']);
    expect(mergeAttachmentIds([1, null, 'file-a'], [])).toEqual(['file-a']);
  });

  it('puts the files into the payload', () => {
    expect(withAttachmentIds({}, ['file-a', 'file-b'])).toEqual({
      attachmentsIds: ['file-a', 'file-b'],
    });
  });

  it('adds a croquis id that has no card field to ride in', () => {
    // The whole point: `applyServerFileIds` cannot place this one, so nothing else does.
    const data = withAttachmentIds({ vehicle_dtos: [{ plate_image: 'file-plate' }] }, ['file-croquis']);
    expect(data['attachmentsIds']).toEqual(['file-croquis']);
    expect(data['vehicle_dtos']).toEqual([{ plate_image: 'file-plate' }]);
  });

  it('leaves the payload alone when there is nothing to add', () => {
    const data = { description: 'توضیح' };
    expect(withAttachmentIds(data, [])).toBe(data);
  });

  it('never writes an empty list, which would clear the relation on an update', () => {
    expect(withAttachmentIds({ attachmentsIds: [] }, [])).toEqual({ attachmentsIds: [] });
    expect(withAttachmentIds({}, [])).toEqual({});
  });

  it('preserves every other key in the payload', () => {
    expect(withAttachmentIds({ gps_coords: [1, 2], description: 'الف' }, ['file-a'])).toEqual({
      gps_coords: [1, 2],
      description: 'الف',
      attachmentsIds: ['file-a'],
    });
  });
});