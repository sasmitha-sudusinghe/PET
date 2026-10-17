import test from 'node:test';
import assert from 'node:assert/strict';
import {interpret,calculate} from '../public/commands.js';
test('timers parse units and reject unreasonable durations',()=>{assert.deepEqual(interpret('Set a timer for 5 minutes'),{type:'timer',seconds:300});assert.equal(interpret('timer 0 seconds').type,'reply');assert.equal(interpret('timer 25 hours').type,'reply');});
test('notes preserve content',()=>{assert.deepEqual(interpret('note Buy milk'),{type:'note',text:'Buy milk'});assert.equal(interpret('show notes').type,'notes');assert.equal(interpret('clear notes').type,'clearNotes');});
test('calculations respect precedence, parentheses and unary signs',()=>{assert.equal(calculate('(12 + 8) * 3'),60);assert.equal(calculate('-2 + 4 / 2'),0);assert.throws(()=>calculate('1 / 0'));assert.throws(()=>calculate('(1+2'));assert.equal(interpret('calculate 12 * 8').text,'96');});
test('website commands do not permit executable schemes',()=>{assert.equal(interpret('open youtube.com').url,'https://youtube.com/');assert.notEqual(interpret('open javascript:alert(1)').type,'open');assert.notEqual(interpret('open https://user:pass@example.com').type,'open');});
test('unconnected AI commands are described honestly',()=>{assert.match(interpret('write a poem').text,/AI service connected/);});
