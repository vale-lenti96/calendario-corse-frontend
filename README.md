# Calendario Corse — Frontend (Render Static Site)

## Sviluppo locale
```bash
npm install
npm run dev
# apre su http://localhost:5173
```

## Build
```bash
npm run build
npm run preview
```

## Configurazione backend URL
Imposta l'URL pubblico del backend (deployato su Render) in un file `.env`:
```
VITE_BACKEND_URL=https://cal-corse.onrender.com
```

## Deploy su Render (Static Site)
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment → aggiungi `VITE_BACKEND_URL` con l'URL del tuo backend
