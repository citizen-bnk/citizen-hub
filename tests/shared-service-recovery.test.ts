import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedServiceRecovery } from '../lib/shared-service-recovery';

test('quota recovery stays specific without reflecting server details', () => {
  const result = sharedServiceRecovery({code:'DATA_QUOTA_EXHAUSTED',detail:'private connection details'});
  assert.equal(result?.code, 'DATA_QUOTA_EXHAUSTED');
  assert.match(result!.message, /return later/i);
  assert.doesNotMatch(result!.message, /private connection/);
});

test('unknown or malformed failures cannot become trusted public messages', () => {
  for (const value of [null, 'DATA_QUOTA_EXHAUSTED', {}, {code:'UNKNOWN',detail:'internal stack'}]) {
    assert.equal(sharedServiceRecovery(value), undefined);
  }
  assert.equal(sharedServiceRecovery({code:'DATA_CAPACITY_UNAVAILABLE'})?.code, 'DATA_CAPACITY_UNAVAILABLE');
});
