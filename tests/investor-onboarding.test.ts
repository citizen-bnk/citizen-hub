import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newInvestorInput} from '../lib/investor-onboarding';
const input={request_key:'dc37ffad-4799-4c72-b315-71168ab9584d',display_name:'Test Investor',email:' INVESTOR@example.com '};
test('new investor capture normalises email and accepts missing document evidence',()=>{
 const data=newInvestorInput.parse(input);assert.equal(data.email,'investor@example.com');assert.equal(data.address,'');assert.equal(data.identity_reference,'');
});
test('new investor cannot request credentials, roles or a forged scope',()=>{
 for(const extra of [{scope:'live'},{roles:['super_admin']},{password:'secret'},{provider_subject:'other-user'}])assert.equal(newInvestorInput.safeParse({...input,...extra}).success,false);
 assert.equal(newInvestorInput.safeParse({...input,email:'invalid'}).success,false);
});
