import { describe, expect, it } from 'vitest';

import type { AnswerValue } from '@forms';

import {
  isLocalAssetId,
  resolveAssetIds,
  resolveAssetIdsInData,
  splitAssetAnswerRows,
} from './asset-writeback';

describe('resolveAssetIds', () => {
  const mapping = { 'asset-1-a': 'file-1', 'asset-2-b': 'file-2' };

  it('swaps a local id for the server id it uploaded to', () => {
    expect(resolveAssetIds(['asset-1-a'], mapping)).toEqual(['file-1']);
  });

  it('swaps ids wherever they appear in a nested answer tree', () => {
    const answers: AnswerValue = {
      attachments: ['asset-1-a'],
      vehicles: [
        { vehicle_attachments: ['asset-2-b'], plate: { part: '۱۲ب۳۴۵' } },
        { vehicle_attachments: [] },
      ],
      note: 'asset-1-a is not an id here? it is',
    };

    expect(resolveAssetIds(answers, mapping)).toEqual({
      attachments: ['file-1'],
      vehicles: [
        { vehicle_attachments: ['file-2'], plate: { part: '۱۲ب۳۴۵' } },
        { vehicle_attachments: [] },
      ],
      // A plain string that merely contains the id is not rewritten: only an
      // exact match is an asset reference.
      note: 'asset-1-a is not an id here? it is',
    });
  });

  it('leaves a local id with no mapping untouched', () => {
    // The upload may not have run at all (uploads disabled); leaving the id is
    // honest, whereas dropping it would hide that the file never reached the
    // server.
    expect(resolveAssetIds(['asset-unmapped'], mapping)).toEqual(['asset-unmapped']);
  });

  it('never rewrites a plain string that is not a local asset id', () => {
    expect(resolveAssetIds(['file-1', 'خسارتی', 12, true, null], mapping)).toEqual([
      'file-1',
      'خسارتی',
      12,
      true,
      null,
    ]);
  });

  it('does not mutate the input', () => {
    const input = { attachments: ['asset-1-a'] };
    resolveAssetIds(input, mapping);
    expect(input).toEqual({ attachments: ['asset-1-a'] });
  });
});

describe('resolveAssetIdsInData', () => {
  it('returns the same object when there is nothing to resolve', () => {
    const data = { attachments: ['asset-1-a'] };
    expect(resolveAssetIdsInData(data, {})).toBe(data);
  });

  it('resolves the whole payload, including flattened dynamic answers', () => {
    const data = {
      form_answers: { damage_photos: ['asset-1-a'] },
      dynamic_answers: [{ question_key: 'damage_photos', model_name: 'dynamic', answer_names: ['asset-1-a'] }],
      news_number: 7,
    };

    expect(resolveAssetIdsInData(data, { 'asset-1-a': 'file-1' })).toEqual({
      form_answers: { damage_photos: ['file-1'] },
      dynamic_answers: [{ question_key: 'damage_photos', model_name: 'dynamic', answer_names: ['file-1'] }],
      news_number: 7,
    });
  });
});

describe('isLocalAssetId', () => {
  it('recognises the prefix the capture service mints', () => {
    expect(isLocalAssetId('asset-1730000000000-ab12cd')).toBe(true);
    expect(isLocalAssetId('file-507f1f77bcf86cd799439011')).toBe(false);
    expect(isLocalAssetId('')).toBe(false);
  });
});

describe('splitAssetAnswerRows', () => {
  const ids = { 'asset-1-a': '507f1f77bcf86cd799439011' };
  const names = { '507f1f77bcf86cd799439011': 'photo-1730000000000.jpg' };

  it('separates a file answer into joinable ids and readable names', () => {
    // `buildDynamicAnswers` snapshots a `file` answer like any other multi-value,
    // so the ids arrive in `answer_names` — the only list column a plain string
    // answer has. Left there, the review screen shows `asset-1730…`.
    const rows = [
      { question_key: 'attachments', model_name: 'dynamic', answer_names: ['asset-1-a'] },
    ];

    expect(splitAssetAnswerRows(rows, ids, names)).toEqual({
      rows: [
        {
          question_key: 'attachments',
          model_name: 'dynamic',
          answer_ids: ['507f1f77bcf86cd799439011'],
          answer_names: ['photo-1730000000000.jpg'],
        },
      ],
      attachmentIds: ['507f1f77bcf86cd799439011'],
    });
  });

  it('reports every referenced file as an attachment, in first-seen order', () => {
    const rows = [
      { question_key: 'a', model_name: 'dynamic', answer_names: ['asset-1-a'] },
      { question_key: 'b', model_name: 'dynamic', answer_names: ['asset-2-b', 'asset-1-a'] },
    ];
    const twoIds = { ...ids, 'asset-2-b': '507f1f77bcf86cd799439022' };

    const result = splitAssetAnswerRows(rows, twoIds, {
      ...names,
      '507f1f77bcf86cd799439022': 'clip-1730000000001.mp4',
    });

    // Deduplicated: the same file answered twice is one gallery tile.
    expect(result.attachmentIds).toEqual([
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439022',
    ]);
  });

  it('leaves a literal choice answer alone', () => {
    // The guard that matters most: a multi-select of option labels must never be
    // mistaken for a file answer, or its labels would be replaced by ids.
    const rows = [
      { question_key: 'surface', model_name: 'dynamic', answer_names: ['جاده خیس', 'تاریکی'] },
    ];

    const result = splitAssetAnswerRows(rows, ids, names);

    expect(result.rows).toBe(rows);
    expect(result.rows).toEqual(rows);
  });

  it('leaves a reference answer alone', () => {
    const rows = [{ question_key: 'city', model_name: 'city', answer_ids: ['c1'], answer_names: ['c1'] }];

    // A reference row is identified by its ids, but `answer_names` holds a
    // relation id that is not one of this report's files.
    expect(splitAssetAnswerRows(rows, ids, names).rows).toEqual(rows);
  });

  it('leaves a row untouched when even one entry cannot be resolved', () => {
    // `answer_ids` is typed `objectIdValidation` server-side, so writing an
    // unresolved `asset-…` id into it would fail validation and take the whole
    // report down. Degrading is the only safe answer.
    const rows = [
      {
        question_key: 'attachments',
        model_name: 'dynamic',
        answer_names: ['asset-1-a', 'asset-never-uploaded'],
      },
    ];

    const result = splitAssetAnswerRows(rows, ids, names);

    expect(result.rows).toEqual(rows);
    expect(result.attachmentIds).toEqual([]);
  });

  it('accepts entries that are already server ids', () => {
    // A correction re-syncs a draft whose row an earlier run already rewrote, so
    // both id forms have to be understood.
    const rows = [
      {
        question_key: 'attachments',
        model_name: 'dynamic',
        answer_names: ['507f1f77bcf86cd799439011', 'asset-1-a'],
      },
    ];

    expect(splitAssetAnswerRows(rows, ids, names)).toEqual({
      rows: [
        {
          question_key: 'attachments',
          model_name: 'dynamic',
          answer_ids: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439011'],
          answer_names: ['photo-1730000000000.jpg', 'photo-1730000000000.jpg'],
        },
      ],
      attachmentIds: ['507f1f77bcf86cd799439011'],
    });
  });

  it('is idempotent — an already-split row is returned as-is', () => {
    const rows = [
      {
        question_key: 'attachments',
        model_name: 'dynamic',
        answer_ids: ['507f1f77bcf86cd799439011'],
        answer_names: ['photo-1730000000000.jpg'],
      },
    ];

    const result = splitAssetAnswerRows(rows, ids, names);

    expect(result.rows).toBe(rows);
    expect(result.attachmentIds).toEqual([]);
  });

  it('falls back to the id when no name was recorded', () => {
    const rows = [{ question_key: 'a', model_name: 'dynamic', answer_names: ['asset-1-a'] }];

    expect(splitAssetAnswerRows(rows, ids, {}).rows).toEqual([
      {
        question_key: 'a',
        model_name: 'dynamic',
        answer_ids: ['507f1f77bcf86cd799439011'],
        answer_names: ['507f1f77bcf86cd799439011'],
      },
    ]);
  });

  it('passes through rows that are not answer objects', () => {
    const rows = ['not-a-row', null, 42, ['nested']];
    expect(splitAssetAnswerRows(rows, ids, names).rows).toBe(rows);
  });

  it('tolerates a payload with no dynamic answers at all', () => {
    expect(splitAssetAnswerRows(undefined, ids, names)).toEqual({
      rows: undefined,
      attachmentIds: [],
    });
    expect(splitAssetAnswerRows({}, ids, names).rows).toEqual({});
  });

  it('does not mutate the input rows', () => {
    const rows = [{ question_key: 'a', model_name: 'dynamic', answer_names: ['asset-1-a'] }];
    splitAssetAnswerRows(rows, ids, names);
    expect(rows).toEqual([{ question_key: 'a', model_name: 'dynamic', answer_names: ['asset-1-a'] }]);
  });
});
