import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Inbox and agent profile both open actual conversation route',()=>{
 assert.ok(read('src/navigation/RootNavigator.tsx').includes('name="AgentChat"'));
 for(const p of ['src/screens/InboxScreen.tsx','src/screens/AgentProfileScreen.tsx']) assert.ok(read(p).includes("navigate('AgentChat'"));
});
test('chat has honest missing send capability, not simulated replies or delivery',()=>{
 const s=read('src/screens/AgentChatScreen.tsx');
 assert.ok(s.includes('DRAFT IS NOT SAVED OR SENT'));
 assert.ok(!/insertMessage|functions.invoke|setTimeout|LIVE SYNC/.test(s));
 assert.ok(s.includes('active = false'));
 assert.ok(s.includes('No messages yet'));
 assert.ok(s.includes('Could not load this conversation.'));
});
