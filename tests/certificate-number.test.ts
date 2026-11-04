import test from 'node:test';import assert from 'node:assert/strict';import {certificateNumberInput} from '../lib/certificate-number-policy';
const input={subscription_id:'00000000-0000-4000-8000-000000000001',base_reference:'cb36',topup:true,note:'Verified original certificate CB36.',confirmed:true};
test('Certificate allocation accepts a verified original root and normalises its case',()=>{assert.equal(certificateNumberInput.parse(input).base_reference,'CB36');});
test('Suffixes and arbitrary references cannot be submitted as the original root',()=>{for(const base_reference of ['CB36-01','CB-01','CB0','36','CB36.*'])assert.equal(certificateNumberInput.safeParse({...input,base_reference}).success,false);});
test('Allocation requires explicit confirmation, an audit note and a subscription UUID',()=>{for(const change of [{confirmed:false},{note:''},{subscription_id:'CB36'}])assert.equal(certificateNumberInput.safeParse({...input,...change}).success,false);});
