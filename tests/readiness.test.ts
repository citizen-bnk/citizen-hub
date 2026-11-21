import {test} from 'node:test';
import assert from 'node:assert/strict';
import {managesReadiness,reviewsEvidence,mayVerify,mayRetest} from '../lib/readiness-policy';
test('regulatory review grants no company record editing or verification',()=>{
 assert.equal(reviewsEvidence(['regulatory_reviewer']),true);
 assert.equal(managesReadiness(['regulatory_reviewer']),false);
 assert.equal(mayVerify(['regulatory_reviewer'],'reviewer','staff','submitted'),false);
 for(const roles of [['customer'],['investor'],['shareholder']])assert.equal(reviewsEvidence(roles),false);
});
test('verification requires a submitted item and an independent authorised reviewer',()=>{
 assert.equal(mayVerify(['super_admin'],'same','same','submitted'),false);
 assert.equal(mayVerify(['super_admin'],'second','first','open'),false);
 assert.equal(mayVerify(['board_member'],'second','first','submitted'),false);
 assert.equal(mayVerify(['back_office'],'second','first','submitted'),true);
});
test('a finding cannot be called retested before remediation',()=>{
 assert.equal(mayRetest(['regulatory_reviewer'],'a','a','open'),false);
 assert.equal(mayRetest(['staff'],'staff','reviewer','fixed'),false);
 assert.equal(mayRetest(['regulatory_reviewer'],'reviewer','reviewer','fixed'),true);
});
