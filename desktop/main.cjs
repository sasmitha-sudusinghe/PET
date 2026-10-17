const { app, BrowserWindow, ipcMain, screen, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('node:path');
const { readFileSync } = require('node:fs');
const { spawn } = require('node:child_process');
const { notchBounds, safeWebsite } = require('./policy.cjs');
let window, tray, expanded = false, speechProcess, quitting = false;
if (!app.isPackaged) app.setPath('userData', path.join(app.getPath('appData'), 'Jarvis-development'));
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { window.show(); setExpanded(true); } });
  app.whenReady().then(createWindow);
}
function settings() {
  return { platform: process.platform,
    startupAvailable: process.platform === 'win32' && app.isPackaged,
    startAtLogin: process.platform === 'win32' && app.isPackaged
      ? app.getLoginItemSettings({ path: process.execPath }).openAtLogin : false };
}
function placeWindow() {
  if (window && !window.isDestroyed()) window.setBounds(notchBounds(screen.getPrimaryDisplay(), expanded));
}
function setExpanded(value) {
  expanded = value === true;
  if (!expanded && speechProcess) speechProcess.kill();
  placeWindow(); window.webContents.send('notch:expanded', expanded);
  if (expanded) { window.show(); window.focus(); }
  return expanded;
}
function createWindow() {
  window = new BrowserWindow({
    ...notchBounds(screen.getPrimaryDisplay(), false),
    title: 'Jarvis', frame: false, transparent: true, backgroundColor: '#00000000',
    resizable: false, maximizable: false, minimizable: false,
    alwaysOnTop: true, skipTaskbar: true, show: false, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true,
      nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false }
  });
  window.setAlwaysOnTop(true, 'floating'); window.setVisibleOnAllWorkspaces(true);
  window.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  window.webContents.session.setPermissionCheckHandler(() => false);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.loadFile(path.join(__dirname, '../public/notch.html'));
  window.once('ready-to-show', () => window.showInactive());
  // Alt+F4 collapses; explicit Quit exits. Collapsing keeps timers running.
  window.on('close', event => { if (!quitting) { event.preventDefault(); setExpanded(false); } });
  screen.on('display-metrics-changed', placeWindow);
  screen.on('display-added', placeWindow); screen.on('display-removed', placeWindow);
  createTray();
}
function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'tray.png'));
  tray = new Tray(icon); tray.setToolTip('Jarvis — click to give a command');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Jarvis', click: () => setExpanded(true) },
    { label: 'Collapse', click: () => setExpanded(false) },
    { type: 'separator' }, { label: 'Quit Jarvis', click: () => app.quit() }
  ]));
  tray.on('click', () => setExpanded(!expanded));
}
function handle(channel, callback) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) throw new Error('Untrusted caller');
    return callback(...args);
  });
}
handle('notch:expand', value => setExpanded(value));
handle('notch:settings', settings);
handle('notch:startup', value => {
  if (typeof value !== 'boolean' || !settings().startupAvailable) throw new Error('Install the Windows app to configure startup.');
  app.setLoginItemSettings({ openAtLogin: value, path: process.execPath });
  const result = settings();
  if (result.startAtLogin !== value) throw new Error('Windows could not update startup. Check Settings > Apps > Startup.');
  return result;
});
handle('notch:website', async value => {
  const url = safeWebsite(value);
  if (!url) throw new Error('Only HTTP and HTTPS website links are supported.');
  await shell.openExternal(url); return true;
});
handle('notch:cancel-listening', () => { if (speechProcess) speechProcess.kill(); });
handle('notch:quit', () => app.quit());
handle('notch:listen', () => {
  if (process.platform !== 'win32') return { ok: false, error: 'Desktop voice input is available on Windows. You can still type commands.' };
  if (speechProcess) return { ok: false, error: 'Already listening. Please wait.' };
  return new Promise(resolve => {
    const script = readFileSync(path.join(__dirname, 'recognize.ps1'), 'utf8');
    const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const child = spawn(executable, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    speechProcess = child;
    let output = '', settled = false;
    const finish = result => {
      if (settled) return;
      settled = true; clearTimeout(timeout);
      if (speechProcess === child) speechProcess = null;
      resolve(result);
    };
    const timeout = setTimeout(() => { child.kill(); finish({ ok: false, error: 'Listening timed out. Please try again or type your command.' }); }, 20000);
    child.stdout.on('data', chunk => { output += chunk.toString(); if (output.length > 32000) child.kill(); });
    child.stderr.resume();
    child.on('error', () => finish({ ok: false, error: 'Could not start Windows speech recognition. Please type your command.' }));
    child.on('close', () => {
      try {
        const result = JSON.parse(output.replace(/^\uFEFF/, '').trim());
        if (result.ok && typeof result.text === 'string') finish({ ok: true, text: result.text.slice(0, 2000) });
        else finish({ ok: false, error: result.error || 'No speech heard. Try again.' });
      } catch { finish({ ok: false, error: 'Voice input stopped. You can still type your command.' }); }
    });
  });
});
app.on('before-quit', () => { quitting = true; if (speechProcess) speechProcess.kill(); });
app.on('window-all-closed', () => app.quit());
