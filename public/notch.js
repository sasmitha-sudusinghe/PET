import { interpret } from './commands.js';
const $ = selector => document.querySelector(selector);
const bridge = window.jarvisDesktop;
const notch = $('#notch'), conversation = $('#conversation');
let expanded = false, voice = false, listening = false, speechSession = 0, notes = [], browserRecognition;
try {
  const stored = JSON.parse(localStorage.getItem('jarvis-notes') || '[]');
  if (Array.isArray(stored)) notes = stored.filter(note => typeof note === 'string');
  voice = localStorage.getItem('jarvis-desktop-voice') === 'true';
} catch { /* Storage may be unavailable; errors are shown when saving. */ }
$('#voice').checked = voice;
function append(text, user = false) {
  const row = document.createElement('div'); row.className = 'reply' + (user ? ' user' : '');
  const label = document.createElement('span'); label.className = 'reply-name'; label.textContent = user ? 'YOU' : 'JARVIS';
  const p = document.createElement('p'); p.textContent = text;
  row.append(label, p); conversation.append(row); conversation.scrollTop = conversation.scrollHeight;
  return row;
}
function activity(text) { $('#activity').textContent = text; }
function reply(text) {
  append(text);
  if (voice && 'speechSynthesis' in window) {
    speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => { notch.classList.add('speaking'); activity('SPEAKING'); };
    utterance.onend = utterance.onerror = () => { notch.classList.remove('speaking'); activity('READY WHEN YOU ARE'); };
    speechSynthesis.speak(utterance);
  }
}
function stopVoice() {
  speechSession++; listening = false;
  if (browserRecognition) browserRecognition.abort();
  if (bridge) bridge.cancelListening().catch(() => {});
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  notch.classList.remove('listening', 'speaking'); $('#mic').setAttribute('aria-pressed', 'false');
  $('#mic').setAttribute('aria-label', 'Start voice input'); activity('READY WHEN YOU ARE');
}
function paintExpanded(value) {
  expanded = value; notch.classList.toggle('expanded', expanded); $('#panel').hidden = !expanded;
  $('#toggle').setAttribute('aria-expanded', String(expanded));
  $('#toggle').setAttribute('aria-label', expanded ? 'Collapse Jarvis command panel' : 'Open Jarvis command panel');
  if (expanded) requestAnimationFrame(() => $('#command').focus());
  else { stopVoice(); $('#settings').hidden = true; $('#settings-button').setAttribute('aria-expanded', 'false'); $('#toggle').focus(); }
}
async function expand(value) {
  try { paintExpanded(bridge ? await bridge.setExpanded(value) : value); }
  catch { reply('Could not change the window size. Try opening Jarvis again.'); }
}
$('#toggle').onclick = () => expand(!expanded); $('#collapse').onclick = () => expand(false);
if (bridge) bridge.onExpanded(paintExpanded);
document.addEventListener('keydown', event => { if (event.key === 'Escape') {
  if (!$('#settings').hidden) { $('#settings').hidden = true; $('#settings-button').setAttribute('aria-expanded', 'false'); $('#settings-button').focus(); }
  else expand(false);
} });
function persist(next) {
  try { localStorage.setItem('jarvis-notes', JSON.stringify(next)); notes = next; return true; }
  catch { reply('Could not save notes. Check whether your app storage is writable.'); return false; }
}
const timers = new Set();
async function command(input) {
  const text = input.trim().slice(0, 2000); if (!text) return;
  append(text, true); const action = interpret(text);
  switch (action.type) {
    case 'reply': reply(action.text); break;
    case 'note': if (persist([...notes, action.text])) reply('Saved: ' + action.text); break;
    case 'notes': reply(notes.length ? notes.map((note, i) => `${i + 1}. ${note}`).join('\n') : 'No notes yet. Try “note buy milk”.'); break;
    case 'clearNotes': if (persist([])) reply('Your notes have been cleared.'); break;
    case 'open':
      try {
        if (bridge) { await bridge.openWebsite(action.url); reply('Opened ' + new URL(action.url).hostname + ' in your default browser.'); }
        else {
          const row = append('Click to open your website.'); const button = document.createElement('button');
          button.textContent = 'Open ' + new URL(action.url).hostname;
          button.onclick = () => window.open(action.url, '_blank', 'noopener,noreferrer'); row.append(button);
        }
      } catch { reply('Could not open the website. Check your default browser settings.'); }
      break;
    case 'timer': {
      const deadline = Date.now() + action.seconds * 1000;
      const row = append('Timer started.'); const p = row.querySelector('p');
      const cancel = document.createElement('button'); cancel.textContent = 'Cancel timer'; row.append(cancel);
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        p.textContent = `◷ ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} remaining`;
        if (!remaining) {
          clearInterval(interval); timers.delete(interval); cancel.remove(); p.textContent = '✓ Timer complete';
          expand(true); reply('Your timer is complete.');
        }
      };
      const interval = setInterval(tick, 250); timers.add(interval); tick();
      cancel.onclick = () => { clearInterval(interval); timers.delete(interval); cancel.remove(); p.textContent = 'Timer cancelled'; };
      reply('Timer set. You can collapse the notch; keep Jarvis running. Sleep or quitting will interrupt alerts.'); break;
    }
  }
}
$('#notch-form').onsubmit = event => { event.preventDefault(); const input = $('#command'); command(input.value); input.value = ''; input.focus(); };
document.querySelectorAll('[data-command]').forEach(button => { button.onclick = () => command(button.dataset.command); });
$('#mic').onclick = async () => {
  if (listening) { stopVoice(); return; }
  stopVoice(); const session = ++speechSession; listening = true; notch.classList.add('listening');
  $('#mic').setAttribute('aria-pressed', 'true'); $('#mic').setAttribute('aria-label', 'Cancel voice input'); activity('LISTENING…');
  let result;
  try {
    if (bridge) result = await bridge.listen();
    else {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) result = { ok: false, error: 'Voice input needs a supported browser or the Windows desktop app.' };
      else result = await new Promise(resolve => {
        browserRecognition = new Recognition(); browserRecognition.lang = navigator.language || 'en-US';
        browserRecognition.onresult = event => resolve({ ok: true, text: event.results[0][0].transcript });
        browserRecognition.onerror = () => resolve({ ok: false, error: 'Voice input failed. Check microphone permissions or type your command.' });
        browserRecognition.onend = () => resolve({ ok: false, error: 'No speech heard. Try again.' });
        browserRecognition.start();
      });
    }
  } catch { result = { ok: false, error: 'Could not start voice input. You can still type a command.' }; }
  if (session !== speechSession) return;
  stopVoice(); if (result.ok) command(result.text); else reply(result.error);
};
$('#settings-button').onclick = () => { const show = $('#settings').hidden; $('#settings').hidden = !show; $('#settings-button').setAttribute('aria-expanded', String(show)); };
$('#voice').onchange = () => {
  voice = $('#voice').checked;
  try { localStorage.setItem('jarvis-desktop-voice', String(voice)); } catch { reply('The voice preference could not be saved.'); }
  if (!voice) stopVoice();
};
$('#startup').disabled = true;
$('#startup-hint').textContent = bridge ? 'Checking Windows startup settings…' : 'Browser preview. Install the Windows app to enable automatic startup.';
if (bridge) bridge.getSettings().then(settings => {
  $('#startup').disabled = !settings.startupAvailable; $('#startup').checked = settings.startAtLogin;
  $('#startup-hint').textContent = settings.startupAvailable ? 'Choose whether Jarvis launches automatically when you sign in.' : 'Available in the installed Windows app, not a development run.';
}).catch(() => { $('#startup-hint').textContent = 'Could not read Windows startup settings.'; });
$('#startup').onchange = async () => {
  const desired = $('#startup').checked; $('#startup').disabled = true;
  try {
    const settings = await bridge.setStartAtLogin(desired); $('#startup').checked = settings.startAtLogin;
    $('#startup-hint').textContent = settings.startAtLogin ? 'Jarvis will appear when you sign in to Windows.' : 'Automatic startup is off.';
  } catch { $('#startup').checked = !desired; $('#startup-hint').textContent = 'Could not change startup. Check Windows Settings > Apps > Startup.'; }
  finally { $('#startup').disabled = false; }
};
$('#quit').onclick = () => {
  if (timers.size && !window.confirm('Quit Jarvis? Active timers will stop.')) return;
  stopVoice(); if (bridge) bridge.quit(); else expand(false);
};
