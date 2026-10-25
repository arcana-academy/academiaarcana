import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessSupabasePublishedPorts } from './c03-docker-publish-guard.mjs';

const entry = (Names, Ports) => JSON.stringify({ Names, Ports });
const valid = [
  entry('supabase_kong_synthetic', '127.0.0.1:54321->8000/tcp, [::1]:54321->8000/tcp'),
  entry('supabase_db_synthetic', '127.0.0.1:54322->5432/tcp'),
  entry('supabase_auth_synthetic', '9999/tcp'),
].join('\n');

test('accepts only loopback-published disposable Supabase ports', () => {
  assert.deepEqual(assessSupabasePublishedPorts(valid), { ok: true, reasons: [] });
});
test('refuses IPv4 wildcard publishing (synthetic reproduction of current bind shape)', () => {
  assert.equal(assessSupabasePublishedPorts(valid.replace('127.0.0.1:54321', '0.0.0.0:54321')).ok, false);
});
test('refuses IPv6 wildcard publishing', () => {
  assert.equal(assessSupabasePublishedPorts(valid.replace('[::1]:54321', '[::]:54321')).ok, false);
});
test('refuses published ports on any other Supabase container', () => {
  assert.equal(assessSupabasePublishedPorts(valid.replace('9999/tcp', '192.168.1.5:9999->9999/tcp')).ok, false);
});
test('refuses incomplete or unavailable inventory', () => {
  assert.equal(assessSupabasePublishedPorts('').ok, false);
  assert.equal(assessSupabasePublishedPorts('{}').ok, false);
  assert.equal(assessSupabasePublishedPorts('{bad-json').ok, false);
});
test('refuses missing API/database containers or unpublished required ports', () => {
  assert.equal(assessSupabasePublishedPorts(entry('supabase_kong_synthetic', '127.0.0.1:54321->8000/tcp')).ok, false);
  assert.equal(assessSupabasePublishedPorts(valid.replace('127.0.0.1:54322->5432/tcp', '5432/tcp')).ok, false);
});
test('rejects malformed port numbers and arbitrary port host identifiers', () => {
  assert.equal(assessSupabasePublishedPorts(valid.replace('127.0.0.1:54321', 'localhost:54321')).ok, false);
  assert.equal(assessSupabasePublishedPorts(valid.replace('127.0.0.1:54321', '127.0.0.1:99999')).ok, false);
});
test('does not log input content or any container metadata in error reasons', () => {
  const marker = 'supabase_db_sensitive-marker';
  const result = assessSupabasePublishedPorts(valid + '\n' + entry(marker, '0.0.0.0:5432->5432/tcp'));
  assert.equal(result.ok, false);
  assert.equal(result.reasons.join(' ').includes(marker), false);
});
