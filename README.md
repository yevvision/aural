# 🎵 Aural - Voice Social Network

**Instagram für Stimmen** - Eine moderne soziale Plattform für Audio-Inhalte

## 🌟 Features

- 🎙️ **Audio aufnehmen** - Direkt im Browser aufnehmen
- 🎵 **Audio hochladen** - MP3, WAV, WebM, OGG, M4A (bis 50MB)
- 👂 **Audio anhören** - Mit Waveform-Visualisierung
- 💬 **Kommentare** - Interagiere mit anderen Nutzern
- ❤️ **Likes & Bookmarks** - Markiere deine Lieblingsinhalte
- 👤 **Profile** - Erstelle und verwalte dein Profil
- 🔍 **Suche** - Entdecke neue Audio-Inhalte
- 📱 **Mobile-optimiert** - Perfekt für Smartphones

## 🚀 Tech Stack

### Frontend
- **React 19** + TypeScript
- **Vite 7.1.2** - Build Tool
- **Tailwind CSS 4.1.12** - Styling
- **Framer Motion** - Animationen
- **WaveSurfer.js** - Audio-Visualisierung
- **FFmpeg.wasm** - Audio-Bearbeitung

### Backend
- **PHP 8+** - Upload-Handler
- **Lokale Dateispeicherung**
- **CORS-konfiguriert**

### Audio-System
- **MediaRecorder API** - Browser-native Aufnahme
- **Web Audio API** - Real-time Processing
- **HTML5 Audio** - Cross-browser Playback
- **Waveform-Editor** - Audio-Bearbeitung

## 🛠️ Installation

```bash
# Repository klonen
git clone https://github.com/[username]/aural-voice-social-network.git
cd aural-voice-social-network

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

## 📱 Verwendung

1. **Audio aufnehmen**: Klicke auf den roten Aufnahme-Button
2. **Audio hochladen**: Ziehe Dateien in den Upload-Bereich
3. **Audio bearbeiten**: Nutze den integrierten Audio-Editor
4. **Teilen**: Veröffentliche deine Aufnahmen im Feed
5. **Entdecken**: Durchsuche und höre andere Inhalte

## 🎨 Design

- **Dunkles Theme** mit Orange-Red Gradienten
- **Glassmorphism** - Moderne Glaseffekte
- **Mobile-First** - Optimiert für alle Bildschirmgrößen
- **3D-Animationen** - Unicorn Studio Hintergrund

## 🔒 Sicherheit

- **File Validation** - MIME-Type + Extension Check
- **Rate Limiting** - 3 Uploads/30min, 5 Uploads/Tag
- **CORS-geschützt** - Nur autorisierte Domains
- **Content Moderation** - Admin-Panel für Meldungen

## 📊 Performance

- **Code Splitting** - Route-basierte Aufteilung
- **Lazy Loading** - Komponenten-on-Demand
- **Bundle Optimization** - Tree Shaking + Minification
- **Service Worker** - Offline-Funktionalität

## 🚀 Deployment

```bash
# Production Build
npm run build

# Preview
npm run preview

# Deploy (mit eigenem Skript)
npm run deploy
```

## 📁 Projektstruktur

```
aural/
├── src/
│   ├── components/     # React-Komponenten
│   ├── pages/         # Seiten-Komponenten
│   ├── hooks/         # Custom React Hooks
│   ├── services/      # Business Logic
│   ├── stores/        # Zustand State Management
│   ├── utils/         # Utility-Funktionen
│   └── styles/        # CSS-Styles
├── public/            # Statische Assets
├── uploads/           # Audio-Dateien
└── dist/              # Production Build
```

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushe zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne eine Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) für Details.

## 🎯 Roadmap

- [ ] **Backend Migration** - PostgreSQL/MySQL Integration
- [ ] **Real-time Features** - WebSocket für Live-Updates
- [ ] **AI Integration** - Audio-Transkription
- [ ] **Mobile Apps** - React Native Apps
- [ ] **Social Features** - Follow-System, DMs
- [ ] **Monetization** - Premium Features

## 📞 Support

Bei Fragen oder Problemen erstelle bitte ein [Issue](https://github.com/[username]/aural-voice-social-network/issues).

---

**Erstellt mit ❤️ für die Audio-Community**
