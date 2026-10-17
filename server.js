import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files = {'/':['index.html','text/html'], '/style.css':['style.css','text/css'], '/app.js':['app.js','text/javascript'], '/commands.js':['commands.js','text/javascript']};
http.createServer(async(req,res)=>{const file=files[new URL(req.url,'http://localhost').pathname]; if(!file){res.writeHead(404);return res.end('Not found');}try{const data=await readFile(new URL('./public/'+file[0],import.meta.url));res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8'});res.end(data);}catch{res.writeHead(500);res.end('Unable to load application');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Jarvis listening on port '+(process.env.PORT||3000)));
