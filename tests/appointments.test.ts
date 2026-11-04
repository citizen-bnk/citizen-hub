import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appointmentInput,independentApprover} from '../lib/appointment-policy';
test('Appointment confirmation needs a different administrator and specific Drive evidence',()=>{
 assert.equal(independentApprover(null,'admin-2'),false);assert.equal(independentApprover('admin-1','admin-1'),false);assert.equal(independentApprover('admin-1','admin-2'),true);
 assert.throws(()=>appointmentInput.parse({action:'confirm',id:crypto.randomUUID(),version:1,approval_link:'https://example.com/file',regulatory_link:'',review_note:'Reviewed',confirmed:true}));
 assert.throws(()=>appointmentInput.parse({action:'save',title:'Director',nominee:'Test person',email:'',phase:'pre_licensing',source_link:'https://drive.google.com/file/d/evidence-id/view',review_note:'Pending review',start_date:'',status:'confirmed'}));
});
