# Frontend API configuration

In Codespaces, define `VITE_CODESPACE_NAME` in `octofit-tracker/frontend/.env.local` using the exact Codespace name, without a protocol or port:

```dotenv
VITE_CODESPACE_NAME=your-codespace-name
```

The frontend builds its API URL as `https://<VITE_CODESPACE_NAME>-8000.app.github.dev/api`. If the variable is unset or empty, it safely uses `http://localhost:8000/api` rather than constructing a URL containing `undefined`.

Vite reads environment variables at startup, so restart the frontend dev server after editing `.env.local`. See `.env.example` for the variable name.