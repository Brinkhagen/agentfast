import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCalendar, evaluateRepository } from '../scripts/release-gate.mjs';
import { resolve } from 'node:path';

const now = new Date('2026-12-12T00:00:00Z');
const milestone = (version, status, targetAt = '2026-12-11T10:30:00Z') =>
  ({ version, status, targetAt, name: 'test', summary: 'test' });
const calendar = (...milestones) => ({
  schemaVersion: 1, timezone: 'Europe/Berlin', milestones
});
const options = (version = '0.8.0', extra = {}) => ({
  now, packageVersion: version, lockVersion: version, notesExist: () => true, ...extra
});

test('planned releases never publish, even after their date', () => {
  const result = evaluateCalendar(calendar(milestone('0.8.0', 'planned')), options());
  assert.equal(result.publish, false);
  assert.match(result.reason, /never publish/);
});

test('approved future versions wait until the scheduled UTC instant', () => {
  const result = evaluateCalendar(calendar(milestone('0.8.0', 'approved')),
    options('0.8.0', { now: new Date('2026-12-11T10:29:59Z') }));
  assert.equal(result.publish, false);
  assert.match(result.reason, /not due/);
});

test('reviewed release can publish on or after the target instant', () => {
  const result = evaluateCalendar(calendar(milestone('0.8.0', 'approved')),
    options('0.8.0', { now: new Date('2026-12-11T10:30:00Z') }));
  assert.deepEqual(result, { publish: true, version: '0.8.0',
    reason: 'Approved, due and locally validated.' });
});

test('version mismatch, lock mismatch and missing notes block release', () => {
  const c = calendar(milestone('0.8.0', 'approved'));
  assert.throws(() => evaluateCalendar(c, options('0.9.0')), /does not match/);
  assert.throws(() => evaluateCalendar(c, options('0.8.0', { lockVersion: '0.7.0' })),
    /versions disagree/);
  assert.throws(() => evaluateCalendar(c, options('0.8.0', { notesExist: () => false })),
    /Missing reviewed release notes/);
});

test('multiple approved versions are invalid', () => {
  const c = calendar(milestone('0.8.0', 'approved'),
    milestone('0.9.0', 'approved', '2027-01-08T10:30:00Z'));
  assert.throws(() => evaluateCalendar(c, options()), /zero or one/);
});

test('invalid dates, duplicates and out-of-order versions are rejected', () => {
  assert.throws(() => evaluateCalendar(
    calendar(milestone('0.8.0', 'approved', '2026-02-30T10:30:00Z')), options()), /timestamp/);
  assert.throws(() => evaluateCalendar(
    calendar(milestone('0.8.0', 'planned'), milestone('0.8.0', 'planned')), options()),
    /duplicated/);
  assert.throws(() => evaluateCalendar(
    calendar(milestone('0.9.0', 'planned'), milestone('0.8.0', 'planned')), options()),
    /increasing/);
});

test('a released version is historical evidence, not an approval', () => {
  const c = calendar({ version: '0.7.0', status: 'released',
    releasedAt: '2026-11-19T15:00:29Z' },
    milestone('0.8.0', 'planned'));
  assert.equal(evaluateCalendar(c, options('0.7.0')).publish, false);
});

test('malformed calendar or version fails instead of approving accidentally', () => {
  assert.throws(() => evaluateCalendar({}, options()), /Invalid release calendar/);
  assert.throws(() => evaluateCalendar(calendar(milestone('0.8.0', 'approved')),
    options('0.8.0-preview')), /stable semver/);
});

test('the real checked-in calendar cannot publish before any future target', () => {
  const result = evaluateRepository(resolve('.'), new Date('2020-01-01T00:00:00Z'));
  assert.equal(result.publish, false);
});
