import {test} from 'node:test';
import assert from 'node:assert/strict';
import {passwordProof,bindingMatches,recoveryOrigin,resetFailure} from '../lib/password-recovery';
test('session revocation binds to a verified recipient',()=>{
 assert(bindingMatches('investor-id',passwordProof(200,{user_id:'investor-id'})));
 assert(!bindingMatches('admin-id',passwordProof(200,{user_id:'investor-id'})));
 assert(!bindingMatches(undefined,passwordProof(200,{user_id:'investor-id'})));
});
test('expired, replayed and rejected-password responses give distinct recovery instructions',()=>{
 assert.equal(resetFailure({code:'VERIFICATION_CODE_EXPIRED'}).code,'RECOVERY_LINK_EXPIRED');
 assert.equal(resetFailure({code:'VERIFICATION_CODE_ALREADY_USED'}).code,'RECOVERY_LINK_USED');
 assert.match(resetFailure({code:'PASSWORD_TOO_SHORT'}).message,/longer password/);
 assert.equal(resetFailure(null).code,'RECOVERY_REJECTED');
});
test('MFA challenge proves password without granting a session or bypassing MFA',()=>{
 assert.deepEqual(passwordProof(400,{code:'MULTI_FACTOR_AUTHENTICATION_REQUIRED'}),{mfaRequired:true});
 assert(bindingMatches('admin-id',passwordProof(400,{code:'MULTI_FACTOR_AUTHENTICATION_REQUIRED'})));
 assert.equal(passwordProof(401,{code:'MULTI_FACTOR_AUTHENTICATION_REQUIRED'}),null);
});
test('mismatches, outages and malformed responses never prove identity',()=>{
 for(const [status,body] of [[400,{code:'EMAIL_PASSWORD_MISMATCH'}],[503,{user_id:'admin'}],[200,{}],[200,null]] as const)assert.equal(passwordProof(status,body),null);
});
test('email callback is confined to Hub, independently of the website token issuer',()=>{
 assert.equal(recoveryOrigin('https://hub.citizenbank.co.ls/reset-password'),'https://hub.citizenbank.co.ls');
 assert.throws(()=>recoveryOrigin('https://evil.example/reset-password'));
 assert.throws(()=>recoveryOrigin('https://hub.citizenbank.co.ls','https://citizen-website-demo.vercel.app'));
});
