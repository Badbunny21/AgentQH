import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('spend never guesses dollars from counts or hides unavailable data',()=>{
 const api=read('src/lib/aiSpendApi.ts'); const screen=read('src/screens/AiSpendScreen.tsx');
 assert.ok(api.includes('cost: null'));
 assert.ok(screen.includes('Spend unavailable'));
 assert.ok(screen.includes('NO REPORTED OR ESTIMATED COST DATA'));
 assert.ok(!/\$0|\$12|PLAN_MONTHLY/.test(screen));
 assert.ok(api.includes('if (messages.error || tasks.error) throw'));
});
test('spend has profile entry point, month range and removed-agent records',()=>{
 assert.ok(read('src/screens/UserProfileScreen.tsx').includes("navigate('AiSpend'"));
 assert.ok(read('src/lib/aiSpendApi.ts').includes('start.setDate(1)'));
 assert.ok(read('src/screens/AiSpendScreen.tsx').includes('Removed agent'));
});
