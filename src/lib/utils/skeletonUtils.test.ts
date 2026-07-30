import assert from 'node:assert';
import { describe, test } from 'node:test';

import { skeletonLength } from './skeletonUtils';

describe('skeletonUtils', () => {
  test('skeletonLength stays within the inclusive range', () => {
    for (let index = 0; index < 50; index++) {
      const length = skeletonLength(index, 20, 50);
      assert.ok(length >= 20 && length <= 50, `${length} out of range`);
    }

    assert.strictEqual(skeletonLength(3, 30, 30), 30);
  });

  test('skeletonLength gives consecutive rows different lengths', () => {
    // Test a sequence of 10 (we have 10 pre-defined ratios)
    const lengths = Array.from({ length: 10 }, (_, index) =>
      skeletonLength(index, 10, 60),
    );

    assert.strictEqual(new Set(lengths).size, 10, lengths.join());
    assert.strictEqual(skeletonLength(11, 10, 60), lengths[0]);
  });
});
