import {test} from 'node:test';
import assert from 'node:assert/strict';
import {capitalSummary,portfolioTotals} from '../lib/capital-summary';
test('holder count deduplicates linked people and keeps unresolved identities separate',()=>{
 const record={id:'1',person_id:'a',status:'confirmed',facts:{quantity:100}};
 const result=capitalSummary([record,{...record,id:'2',status:'work_in_progress',facts:{quantity:900}},{...record,id:'3',person_id:null},{...record,id:'4',status:'archived'}]);
 assert.equal(result.holders,1);assert.equal(result.unlinked,1);assert.equal(result.issued,200);assert.equal(result.reported,1100);assert.equal(result.pending,1);
});
test('portfolio keeps currencies separate, excludes withdrawn and does not offset unpaid subscriptions with overpayments',()=>{
 const record={currency:'ZAR',units:3,unit_price:'0.10',recorded_receipts:'0.20',status:'submitted'};
 const result=portfolioTotals([record,{...record,recorded_receipts:'1.00'},{...record,currency:'USD'},{...record,status:'withdrawn'}]);
 assert.deepEqual(result,[{currency:'ZAR',committed:0.6,paid:1.2,outstanding:0.1},{currency:'USD',committed:0.3,paid:0.2,outstanding:0.1}]);
});
