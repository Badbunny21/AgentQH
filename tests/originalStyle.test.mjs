import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('original gradient navigation and palette retained without payment logic',()=>{
 const tabs=read('src/navigation/CustomTabBar.tsx');
 assert.ok(tabs.includes('LinearGradient'));
 assert.ok(tabs.includes('accessibilityState'));
 assert.ok(tabs.includes('#a3e635'));
 const profile=read('src/screens/UserProfileScreen.tsx');
 assert.ok(profile.includes('No subscription required.'));
 assert.ok(!profile.includes("navigate('Upgrade'"));
});
