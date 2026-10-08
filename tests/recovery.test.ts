import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recoveryActions} from '../lib/recovery-policy';
test('permission denials cannot offer a futile retry or a privilege escalation',()=>{assert.deepEqual(recoveryActions('WORKSPACE_ACCESS_DENIED'),['workspace','back','cancel']);assert(!recoveryActions('BOARD_ROLE_REQUIRED').includes('retry'));});
test('an investment intent has a discovery path and expired authentication has a sign-in path',()=>{assert.equal(recoveryActions('INVESTOR_ROLE_REQUIRED')[0],'opportunities');assert.equal(recoveryActions('SIGN_IN_REQUIRED')[0],'sign_in');});
test('changed information is refreshed instead of automatically replaying a mutation',()=>{assert.equal(recoveryActions('PROFILE_CHANGED')[0],'reload');assert.equal(recoveryActions('OPPORTUNITY_CHANGED')[0],'opportunities');assert.equal(recoveryActions('DATABASE_UNAVAILABLE')[0],'retry');});
