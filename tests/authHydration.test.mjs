import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAuthHydrator} from '../src/lib/authHydration.ts';
const session=id=>({user:{id}});
test('loading stays true until profile resolves',async()=>{
  let resolve; const states=[];
  const h=createAuthHydrator(()=>new Promise(r=>resolve=r),s=>states.push(s));
  const promise=h.load(session('a'));
  assert.equal(states.at(-1).isLoading,true);
  resolve({id:'a',onboarding_complete:true}); await promise;
  assert.equal(states.at(-1).isLoading,false);
  assert.equal(states.at(-1).profile.id,'a');
});
test('old profile cannot revive signed-out account or overwrite newer user',async()=>{
  const resolves={};const states=[];
  const h=createAuthHydrator(id=>new Promise(r=>resolves[id]=r),s=>states.push(s));
  const a=h.load(session('a'));const b=h.load(session('b'));
  resolves.b({id:'b'});await b;resolves.a({id:'a'});await a;
  assert.equal(states.at(-1).profile.id,'b');
  const c=h.load(session('c'));await h.load(null);resolves.c({id:'c'});await c;
  assert.equal(states.at(-1).session,null);
});
test('profile failure yields retry state, never incomplete-onboarding guess',async()=>{
  const states=[];const h=createAuthHydrator(async()=>null,s=>states.push(s));
  await h.load(session('a'));assert.equal(states.at(-1).profileError,true);
  assert.equal(states.at(-1).isLoading,false);
});
test('Home keeps truthful task total, no all-time Done today metric',()=>{
  const src=readFileSync(new URL('../src/screens/DashboardScreen.tsx',import.meta.url),'utf8');
  assert.ok(!src.includes('Done today'));
  assert.ok(src.includes('value={visibleTasks.length} label="Tasks"'));
});
