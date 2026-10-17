# Jarvis — a browser companion

An animated pet with voice and text commands, spoken replies, local notes, timers, website links, and arithmetic. No dependencies, API keys, or build step are required. Requires Node.js 20 or newer.

```sh
npm start
npm test
```

The server listens on port 3000 (override with `PORT`). Open the app in a browser. Microphone access requires HTTPS or localhost and a browser supporting the Web Speech API, such as Chrome. Voice recognition may use the browser vendor's online speech service; availability depends on browser, device, permissions, and connectivity. Spoken replies use browser speech synthesis. Text commands remain available when voice is unavailable.

Try:

- `set a timer for 5 minutes`
- `note buy milk`, `show notes`, `clear notes`
- `calculate (12 + 8) * 3`
- `open youtube.com` (click the resulting link)
- `what time is it?`

Notes are saved in this browser's local storage. Clearing site data removes them. Timers require the tab to remain open; background throttling or device sleep can delay alerts. This version uses a built-in command interpreter, not a general AI model. It cannot control desktop programs or execute arbitrary computer commands. A future AI integration should use a server-side provider connection, keep credentials off the client, and require confirmation for consequential actions.

The UI uses Google Fonts when available and system font fallbacks otherwise.
