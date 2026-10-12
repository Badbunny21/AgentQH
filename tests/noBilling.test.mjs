import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(new URL(e.name+'/',path)):[new URL(e.name,path)]);}
test('client has no payment navigation, Stripe calls or paid-tier checks',()=>{
  for(const path of files(new URL('src/',root))){
    const src=readFileSync(path,'utf8');
    if(path.pathname.endsWith('/types/database.ts'))continue; // persisted schema compatibility only
    assert.ok(!/stripeApi|navigate\('Upgrade'\)|name="Upgrade"|PLAN_CHAT_LIMITS|getChatLimit|Upgrade to Pro|profile\??\.plan/.test(src),path.pathname);
  }
  assert.equal(existsSync(new URL('src/screens/UpgradeScreen.tsx',root)),false);
});
test('server reply/task gate source is unconditional, counts retained',()=>{
  const src=readFileSync(new URL('supabase/functions/_shared/planLimits.ts',root),'utf8');
  assert.ok(src.includes('allowed: true'));
  assert.ok(!src.includes('allowed: false'));
  assert.ok(!src.includes('Upgrade'));
  assert.ok(src.includes('incrementChatUsage'));
});
