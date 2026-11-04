import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readOfferDisclosure,validSubscriptionQuantity} from '../lib/offer-disclosure';
const facts={issuer:'Citizen Digital Ltd (Reg. 99073)',share_class:'Ordinary Class B',subscription_type:'SAFE',reviewed_on:'2026-10-09',register_as_of:'2026-09-26',register_unissued:9554700,register_status:'pending_reconciliation'};
test('an offer needs source facts and cannot turn an uncertified register into guaranteed inventory',()=>{
 assert.ok(readOfferDisclosure(facts));
 for(const value of [null,undefined,{}, {...facts,register_status:'certified'}, {...facts,subscription_type:'Preference shares'},{...facts,register_unissued:-1}])assert.equal(readOfferDisclosure(value),null);
});
test('absence of a published maximum does not manufacture a commercial limit',()=>{
 assert.ok(validSubscriptionQuantity(1000001,1000,null));
 assert.ok(!validSubscriptionQuantity(999,1000,null));
 assert.ok(!validSubscriptionQuantity(1000.5,1000,null));
 assert.ok(!validSubscriptionQuantity(2001,1000,2000));
 assert.ok(!validSubscriptionQuantity(2147483648,1000,null));
});
