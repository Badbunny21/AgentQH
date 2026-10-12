import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('activity feed renders recorded rows only, never invented task completions',()=>{
 const s=read('src/screens/NotificationsScreen.tsx');
 assert.ok(!s.includes('satisfies Activity'));
 assert.ok(!s.includes('t.result ?'));
 assert.ok(s.includes('[...activities]'));
 assert.ok(s.includes('Date.parse(b.createdAt)'));
});
test('loading failure is different from an empty feed and retains retry',()=>{
 assert.ok(read('src/lib/activitiesApi.ts').includes('throw new Error'));
 assert.ok(read('src/screens/NotificationsScreen.tsx').includes('!activityError && feed.length === 0'));
 assert.ok(read('src/contexts/TasksContext.tsx').includes('if (activityResult.data) setActivities'));
});
