import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createRequire} from 'node:module';
import {interpret} from '../public/commands.js';
const {createOllamaClient}=createRequire(import.meta.url)('../desktop/ollama.cjs');
async function service(handler,fn){const server=http.createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));try{await fn(createOllamaClient({port:server.address().port,timeout:200}));}finally{await new Promise(resolve=>server.close(resolve));}}
test('AI conversations route separately while built-in actions stay deterministic',()=>{assert.equal(interpret('Explain gravity',{ai:true}).type,'ai');assert.equal(interpret('note explain gravity',{ai:true}).type,'note');assert.equal(interpret('calculate 3*4',{ai:true}).text,'12');});
test('Ollama discovery lists installed local models and filters cloud models',()=>service((_req,res)=>res.end(JSON.stringify({models:[{name:'llama3.2:3b',size:2048},{name:'gpt-oss:120b-cloud'},{}]})),async client=>{assert.deepEqual(await client.models(),[{name:'llama3.2:3b',size:2048}]);}));
test('chat sends system instructions and conversation and reads a real HTTP response',()=>service((req,res)=>{assert.equal(req.url,'/api/chat');let data='';req.on('data',part=>data+=part);req.on('end',()=>{const body=JSON.parse(data);assert.equal(body.model,'test:small');assert.equal(body.stream,false);assert.equal(body.messages[0].role,'system');assert.equal(body.messages[1].content,'Hello');assert.ok(body.options.num_predict<=512);res.end(JSON.stringify({message:{content:'Hello from your local model.'}}));});},async client=>{assert.equal(await client.chat('test:small',[{role:'user',content:'Hello'}]),'Hello from your local model.');await assert.rejects(client.chat('model:cloud',[]),/local model/);}));
test('connection refuses malformed responses, missing models, and timeouts',async()=>{
 await service((_req,res)=>res.end('broken JSON'),async client=>assert.rejects(client.models(),/invalid response/));
 await service((_req,res)=>{res.writeHead(404);res.end();},async client=>assert.rejects(client.chat('missing:model',[]),/not installed/));
 await service((_req,_res)=>{},async client=>assert.rejects(client.models(),/too long/));
});
