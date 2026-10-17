import {interpret} from './commands.js';
const $=s=>document.querySelector(s),messages=$('#messages'),pet=$('#pet'),status=$('#status');
let voice=true,recognition,listening=false,notes=[];
try{const stored=JSON.parse(localStorage.getItem('jarvis-notes')||'[]');if(Array.isArray(stored))notes=stored.filter(n=>typeof n==='string');}catch{}
function count(){$('#note-count').textContent=notes.length;}count();
function message(text,user=false){const row=document.createElement('div');row.className='message '+(user?'user':'bot');const icon=document.createElement('span');icon.className='mini-pet';icon.textContent=user?'Y':'✳';const body=document.createElement('div');const label=document.createElement('span');label.className='message-label';label.textContent=user?'YOU':'JARVIS';const p=document.createElement('p');p.textContent=text;body.append(label,p);row.append(icon,body);messages.append(row);messages.scrollTop=messages.scrollHeight;return body;}
function say(text){message(text);$('#pet-message').textContent=text.length>85?text.slice(0,82)+'…':text;if(voice&&'speechSynthesis'in window){speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.rate=1;utterance.onstart=()=>{pet.classList.add('speaking');status.textContent='A LITTLE SOMETHING TO SAY';};const reset=()=>{pet.classList.remove('speaking');if(!listening)status.textContent='READY WHEN YOU ARE';};utterance.onend=reset;utterance.onerror=reset;speechSynthesis.speak(utterance);}}
function saveNotes(){try{localStorage.setItem('jarvis-notes',JSON.stringify(notes));count();return true;}catch{say('This browser could not save your notes. Check its storage settings.');return false;}}
const timers=new Set();
function run(input){const text=input.trim();if(!text)return;message(text,true);const action=interpret(text);
 switch(action.type){
 case'reply':say(action.text);break;
 case'note':{const previous=[...notes];notes.push(action.text);if(saveNotes())say('Saved to your notes: '+action.text);else notes=previous;count();break;}
 case'notes':say(notes.length?notes.map((n,i)=>`${i+1}. ${n}`).join('\n'):'Your notebook is empty. Try “note buy milk”.');break;
 case'clearNotes':{const previous=[...notes];notes=[];if(saveNotes())say('Your notes have been cleared.');else notes=previous;count();break;}
 case'open':{say('Your website is ready. Click the link to open it.');const body=message('');const a=document.createElement('a');a.href=action.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open '+new URL(action.url).hostname+' ↗';body.append(a);messages.scrollTop=messages.scrollHeight;break;}
 case'timer':{const deadline=Date.now()+action.seconds*1000;const body=message('');const p=document.createElement('p');body.append(p);const cancel=document.createElement('button');cancel.textContent='Cancel timer';cancel.style.cssText='border:1px solid #dfe6d8;border-radius:6px;background:#f1f5ed;padding:5px 9px;color:#456b50;font-size:10px';body.append(cancel);let interval;const update=()=>{const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));p.textContent='◷ '+Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0')+' remaining';if(!remaining){clearInterval(interval);timers.delete(interval);cancel.remove();p.textContent='✓ Timer complete';say('Your timer is complete. Time for your next little adventure!');}};interval=setInterval(update,250);timers.add(interval);update();cancel.onclick=()=>{clearInterval(interval);timers.delete(interval);cancel.remove();p.textContent='Timer cancelled';};say('Timer set for '+action.seconds+' seconds. Keep this tab open; background tabs may delay alerts.');break;}
 }
}
$('#command-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#command');run(input.value);input.value='';input.focus();});
document.querySelectorAll('[data-command]').forEach(button=>button.onclick=()=>run(button.dataset.command));
$('#notes-button').onclick=()=>run('show notes');$('#companion').onclick=()=>$('#command').focus();
$('#sound').onclick=()=>{voice=!voice;$('#sound').setAttribute('aria-pressed',String(voice));$('#sound').querySelector('span').textContent=voice?'Voice on':'Voice off';if(!voice&&'speechSynthesis'in window){speechSynthesis.cancel();pet.classList.remove('speaking');status.textContent='READY WHEN YOU ARE';}};
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
function stopListening(){listening=false;pet.classList.remove('listening');$('#mic').classList.remove('listening');$('#mic').setAttribute('aria-label','Start voice input');status.textContent='READY WHEN YOU ARE';}
if(SpeechRecognition){recognition=new SpeechRecognition();recognition.lang=navigator.language||'en-US';recognition.interimResults=true;recognition.continuous=false;
 recognition.onstart=()=>{listening=true;pet.classList.add('listening');$('#mic').classList.add('listening');$('#mic').setAttribute('aria-label','Stop voice input');status.textContent='LISTENING TO YOU';};
 recognition.onresult=e=>{let text='';for(let i=0;i<e.results.length;i++)text+=e.results[i][0].transcript;$('#command').value=text;if(e.results[e.results.length-1].isFinal){stopListening();run(text);$('#command').value='';}};
 recognition.onerror=e=>{stopListening();const explanations={'not-allowed':'Microphone access was denied. Allow it in browser settings, or type your command.','audio-capture':'No microphone was found. Connect one, or type your command.','network':'Speech recognition could not reach its service. Please type your command.','no-speech':'I didn’t hear a command. Tap the mic to try again.'};say(explanations[e.error]||'Voice input stopped. You can still type your command.');};recognition.onend=stopListening;
 $('#mic').onclick=()=>{if(listening){recognition.stop();return;}if('speechSynthesis'in window)speechSynthesis.cancel();try{recognition.start();}catch{say('Voice input is already starting. Please try again in a moment.');}};
}else{$('#mic').disabled=true;$('#mic').title='Voice input is not supported in this browser';$('#voice-hint').textContent='Voice input needs a supported browser, such as Chrome';}
window.addEventListener('beforeunload',e=>{if(timers.size){e.preventDefault();e.returnValue='';}});
