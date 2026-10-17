# Jarvis — your desktop notch companion

Jarvis can sit as a small, always-on-top notch with a lit 3D robot hovering above it at the top center of your Windows 10/11 desktop. Click it to expand a command panel. Press **Esc**, click the minus button, or click the notch header to collapse it. Collapsing keeps timers running; their completion reopens the panel. The tray menu provides Open, Collapse, and Quit.

## Install on Windows (recommended)

1. Open [Build Windows app](https://github.com/sasmitha-sudusinghe/PET/actions/workflows/windows.yml) and select the latest successful run.
2. Download the **Jarvis-Windows** artifact at the bottom of that run (GitHub sign-in is required for artifact downloads).
3. Extract the artifact and run `Jarvis-1.2.0-x64.exe` to install. The installer is currently unsigned; the publisher identity is not verified by Windows.
4. Launch **Jarvis** from the Start menu or desktop shortcut. Click the notch, open **Settings**, and enable **Start with Windows**. Jarvis will then appear when you sign in; this can also be disabled in Windows Settings > Apps > Startup.

The artifact also contains a portable ZIP. If you use it, extract **all** its files into a permanent folder and run `Jarvis.exe`. Do not run the executable from inside the ZIP. Keep the folder in place if startup is enabled; disable startup before moving or deleting it. The installed version is recommended for startup use. Node.js is **not** required to run the packaged app.

## Connect local AI (Ollama)

1. Install [Ollama for Windows](https://ollama.com/download/windows) and open it.
2. In PowerShell on your PC, run `ollama pull llama3.2:3b`. For a smaller model on a low-memory PC, use `ollama pull qwen2.5:0.5b`.
3. In Jarvis, open **Settings > Check connection** and choose your downloaded model. Then ask a question in the command box or by microphone.

The model must run on the same PC as Jarvis. The app connects only to `127.0.0.1:11434`; no account or API key is required. It lists installed local models and excludes models named as cloud models. Model downloads require Internet access; questions go to your local Ollama service. Jarvis keeps up to eight conversation turns in memory and forgets them when you quit or change models. No notes or files are automatically sent to the model.

Built-in timers, notes, calculations, and website commands still run directly. Other questions use the AI. AI replies cannot execute commands or control your computer. When Ollama is unavailable, Jarvis explains how to connect it instead of pretending to answer.

The 3D robot uses bundled Three.js geometry, lighting, and animation with no remote assets. It has a lightweight fallback when WebGL is unavailable and respects reduced-motion settings. Clicking the bot or notch opens the command panel.

## Commands and voice

- `set a timer for 5 minutes`
- `note buy milk`, `show notes`, `clear notes`
- `calculate (12 + 8) * 3`
- `open youtube.com` — opens your default browser in the desktop version
- `what time is it?`
- `help`

Click the microphone to listen for one command (up to 8 seconds); click it again to cancel. Collapsing also cancels listening. Desktop voice input uses the installed Windows `System.Speech` recognizer through Windows PowerShell 5.1. It requires an installed compatible speech language and microphone access; availability and recognition quality depend on your Windows configuration. If voice is unavailable, type commands instead. Configure your microphone and speech language in Windows Settings > Privacy & security > Microphone and Time & language > Speech. Voice input must be tested on your Windows machine; the Linux cloud environment cannot validate Windows microphone or sign-in behavior.

**Spoken replies** uses speech synthesis and is on by default for new users, with a lower pitch, slightly slower rate, and a preferred deeper English voice when installed. You can switch it off in Settings; existing saved preferences are preserved. Voice characteristics depend on the installed Windows voices. Notes and this preference are stored locally in the app's user profile. Browser notes and desktop notes are separate. Timers work while the app remains running; quitting, restarting, or device sleep interrupts/delays alerts. Quick commands use a built-in interpreter; other conversation uses the selected local Ollama model. Arbitrary computer control is not connected.

## Development

Use Node.js **22.12+** and the existing checkout. Install pinned dependencies:

```sh
npm ci
npm test
npm run desktop
```

`npm run desktop` and `npm run dist:win` automatically bundle the 3D renderer first. You can also run `npm run build:bot` manually.

The startup switch is available only in a packaged Windows app so development runs cannot accidentally register the Electron development executable at login. To create the Windows installer and portable ZIP on Windows:

```sh
npm run dist:win
```

Outputs go to `dist/`. GitHub Actions runs the tests and produces both packages on Windows for each push to `main`. Builds are unsigned. No secrets or API keys are required. Desktop content is local, sandboxed, isolated from Node.js, and has a restrictive Content Security Policy. Only validated HTTP(S) links can be opened externally; recognized or typed commands are never executed as shell scripts.

The original browser companion is still available with `npm start` on port 3000 (override using `PORT`). Browser voice input requires HTTPS or localhost, microphone permission, and Web Speech API support; it may use a browser-vendor online speech service. The browser UI loads Google Fonts when available and otherwise uses system fonts. The desktop notch loads no remote fonts or content.

## Validation

`npm test` covers command interpretation, timer bounds, arithmetic, website safety, and notch geometry. Chromium functional checks exercise expansion/collapse, notes surviving reload, and a timer reopening the collapsed panel. Native Electron checks on Linux verify window sizes, always-on-top, the sandboxed bridge, unsafe URL rejection, and commands. The Windows portable ZIP builds successfully on Linux; the NSIS installer is built by the Windows CI job (local installer packaging requires Wine). Ollama integration tests use a local HTTP fixture to verify model discovery, conversation payloads, cloud-model filtering, malformed responses, missing models, and timeouts. A live model download was blocked by the cloud network; AI answers must be checked with a downloaded model on your PC. Windows installer execution, microphone recognition, and automatic launch after signing in require a Windows machine.
