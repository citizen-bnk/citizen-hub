import test from 'node:test';
import assert from 'node:assert/strict';
import {ledgerInput} from '../lib/investment-ledger-policy';
const capture={action:'capture',request_key:'00000000-0000-4000-8000-000000000001',person_id:'00000000-0000-4000-8000-000000000002',opportunity_id:'00000000-0000-4000-8000-000000000003',offer_version:1,units:1000,bonus_units:0,note:'Recorded on behalf of the selected subscriber.',minimum_exception:'',confirmed:true};
test('administrator capture accepts a documented price without changing the offer or recipient',()=>{const d=ledgerInput.parse({...capture,unit_price:'7.50',price_note:'Approved historical price for this subscription.'});assert.equal(d.action,'capture');if(d.action==='capture'){assert.equal(d.unit_price,'7.50');assert.equal(d.person_id,capture.person_id);}});
test('capture refuses invalid prices, excess precision and forged scope',()=>{for(const unit_price of ['0','-1','1.001','NaN'])assert.equal(ledgerInput.safeParse({...capture,unit_price}).success,false);assert.equal(ledgerInput.safeParse({...capture,scope:'live'}).success,false);});
