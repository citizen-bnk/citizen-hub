import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hasHubAccess} from '../lib/hub-access';
import {workspaceCards} from '../lib/workspaces';

test('investor, shareholder and board-only identities cannot enter Hub',()=>{
 for(const roles of [[],['customer'],['investor'],['shareholder'],['board_member'],['investor','board_member','customer']])
  assert.equal(hasHubAccess(roles),false);
});

test('staff access is additive but self-service stays on the website',()=>{
 for(const role of ['staff','back_office','admin','super_admin'])assert.equal(hasHubAccess([role]),true);
 const mixed=['staff','investor','board_member'];
 assert.equal(hasHubAccess(mixed),true);
 assert.equal(workspaceCards('invest',mixed).some(card=>card.label==='My investment portfolio'),false);
 assert.equal(workspaceCards('governance',mixed).some(card=>card.label==='Board'),false);
 assert.equal(workspaceCards('invest',['admin']).some(card=>card.path==='/cap-table'),true);
});
