import {test} from 'node:test';
import assert from 'node:assert/strict';
import {investmentMoney,paymentState} from '../lib/investment-display';
test('investment amounts preserve cents and payment state uses actual receipts',()=>{
 assert.match(investmentMoney('10.25','ZAR'),/10[,.]25/);
 assert.equal(paymentState(1000,500,'pending_conversion'),'partial');
 assert.equal(paymentState(1000,0,'submitted'),'unpaid');
 assert.equal(paymentState(10.1+0.2,10.3,'submitted'),'paid');
 assert.equal(paymentState(1000,500,'withdrawn'),'closed');
});
