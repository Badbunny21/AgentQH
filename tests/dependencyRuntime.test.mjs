import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
test('navigation query decoding remains callable after dependency updates',()=>{
 assert.equal(require('query-string').parse('q=hello%20world').q,'hello world');
});
test('xcode tooling UUID generation still works',()=>{
 const p=require('xcode').project('fixture.pbxproj');
 p.hash={project:{objects:{}}};
 assert.match(p.generateUuid(),/^[0-9A-F]{24}$/);
});
