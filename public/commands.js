export function interpret(input, { ai = false } = {}) {
 const text=input.trim();
 if (/^(help|what can you do)\??$/i.test(text)) return {type:'reply',text:'Try “set a timer for 5 minutes”, “note buy milk”, “show notes”, “calculate 12 * 8”, “open youtube.com”, or “what time is it?”.'};
 if (/\b(time|date)\b/i.test(text) && /\b(what|tell|today|current)\b/i.test(text)) return {type:'reply',text:new Date().toLocaleString(undefined,{dateStyle:'full',timeStyle:'short'})};
 const timer=text.match(/^(?:set (?:a )?)?timer (?:for )?(\d+(?:\.\d+)?)\s*(seconds?|minutes?|hours?)$/i);
 if(timer){const seconds=Number(timer[1])*({s:1,m:60,h:3600}[timer[2][0].toLowerCase()]);return seconds>0&&seconds<=86400?{type:'timer',seconds}:{type:'reply',text:'Choose a timer between 1 second and 24 hours.'};}
 const note=text.match(/^(?:note|remember)\s+(.+)$/i);if(note)return {type:'note',text:note[1]};
 if(/^(show|list|clear) notes$/i.test(text))return {type:/^clear/i.test(text)?'clearNotes':'notes'};
 const open=text.match(/^open\s+(.+)$/i);if(open){let host=open[1].trim();if(!host.includes('.'))host+='.com';try{const url=new URL(/^https?:\/\//i.test(host)?host:'https://'+host);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||!url.hostname.includes('.'))throw Error();return {type:'open',url:url.href};}catch{return {type:'reply',text:'Please use a website address, such as “open youtube.com”.'};}}
 const calc=text.match(/^(?:calculate|what is)\s+([\d\s.+*/()%−-]+)\??$/i);if(calc){try{return {type:'reply',text:calculate(calc[1]).toString()};}catch{return {type:'reply',text:'That calculation is invalid. Try “calculate (12 + 8) * 3”.'};}}
 if(/^(hi|hello|hey)( jarvis)?[!.]?$/i.test(text))return {type:'reply',text:'Hello! I’m here. What shall we do?'};
 if(ai)return {type:'ai',text};
 return {type:'reply',text:'I don’t have an AI service connected yet. I can run timers, save notes, calculate, and help open websites. Type “help” for examples.'};
}
export function calculate(source){
 const tokens=source.replaceAll('−','-').match(/\d*\.?\d+|[()+*/%\-]/g)||[];let i=0;
 function atom(){const t=tokens[i++];if(t==='-')return -atom();if(t==='+')return atom();if(t==='('){const n=sum();if(tokens[i++]!==')')throw Error();return n;}if(!t||!/^(\d*\.)?\d+$/.test(t))throw Error();return Number(t);}
 function product(){let n=atom();while(['*','/','%'].includes(tokens[i])){const op=tokens[i++],b=atom();n=op==='*'?n*b:op==='/'?n/b:n%b;}return n;}
 function sum(){let n=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],b=product();n=op==='+'?n+b:n-b;}return n;}
 const n=sum();if(i!==tokens.length||!Number.isFinite(n))throw Error();return n;
}
