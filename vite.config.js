{
  "name": "domino-prospect-engine",
  "version": "3.3.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"vite\" \"node api/server.js\"",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "pptxgenjs": "^3.12.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "concurrently": "^9.0.0",
    "vite": "^5.4.8"
  }
}
