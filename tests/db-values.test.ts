import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normaliseDates} from '../lib/db-values';
test('driver dates in rows and nested history become ISO strings without changing counts or nulls',()=>{const rows=normaliseDates([{source_date:new Date('2026-09-27T00:00:00Z'),count:1117,due:null,history:{at:new Date('2026-10-08T10:00:00Z')},labels:['A']}]);assert.deepEqual(rows,[{source_date:'2026-09-27T00:00:00.000Z',count:1117,due:null,history:{at:'2026-10-08T10:00:00.000Z'},labels:['A']}]);});
