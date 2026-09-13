# First Run

Use Node 22.13 or newer, then run:

```bash
npm install
npx expo install --check
npm test
npm run typecheck
npm run start
```

The web app can validate non-camera screens. Camera recording and the local Apple Vision Swift module require a development build:

```bash
npx eas-cli@latest build --profile development --platform ios
npm run start -- --dev-client
```

Rebuild the native client whenever files under `modules/` change; Metro cannot add native code to an already installed app.

See `README.md` for the local Xcode option, the complete device checklist, and current platform limitations.
