# Beam Animation System

Ein robustes, abbrechbares Tween-System für die Unicorn Studio Beam-Animation.

## 🎯 Funktionalität

- **Reverse-Animation**: Spiegelt die Intro-Animation (radius: 0 → 0.85) rückwärts ab
- **Abbrechbar**: Animationen können jederzeit gestoppt werden
- **Robust**: Mehrere Fallback-Strategien für Unicorn Studio API-Zugriff
- **Dev-Tools**: Keyboard-Shortcuts und Debug-Funktionen

## 📁 Dateistruktur

```
src/lib/
├── tween.ts              # RequestAnimationFrame-basiertes Tween-System
├── easing.ts             # Easing-Funktionen (easeInExpo, etc.)
├── beamRadiusAdapter.ts  # Unicorn Studio API-Adapter
└── beamAnimationService.ts # Hauptservice für Animationen
```

## 🚀 Verwendung

### Automatisch (Record-Seite)
Die Animation startet automatisch, wenn du zur Record-Seite navigierst:
```typescript
// In UnicornBackgroundSimple.tsx
useEffect(() => {
  if (isRecordPage) {
    reverseAppear(4000); // 4 Sekunden Animation
  }
}, [isRecordPage]);
```

### Manuell
```typescript
import { reverseAppear, stopCurrentAnimation } from '../lib/beamAnimationService';

// Animation starten
await reverseAppear(4000);

// Animation stoppen
stopCurrentAnimation();
```

## ⌨️ Dev-Shortcuts

- **R**: Starte Reverse-Animation
- **S**: Stoppe aktuelle Animation  
- **D**: Debug: Zeige aktuellen Radius

## 🔧 API-Adapter

Das System versucht automatisch, den Beam-Radius zu finden:

1. **Property API**: `player.layers.beam.radius`
2. **Uniform API**: `shader.setUniform("uRadius", value)`
3. **Unicorn Scenes API**: `scene.planes[].radius`

## 🎨 Animation-Details

- **Dauer**: 4000ms (wie Original-Intro)
- **Easing**: `easeInExpo` (Spiegelung von `easeOutExpo`)
- **Startwert**: Aktueller Radius (nicht hart 0.85)
- **Endwert**: 0.0

## 🐛 Debugging

```typescript
import { getCurrentRadius, debugBeamRadius } from '../lib/beamRadiusAdapter';

// Aktuellen Radius abrufen
const radius = getCurrentRadius();

// Debug-Info in Konsole
debugBeamRadius();
```

## 📱 Test-Seite

Besuche `/beam-test` für eine interaktive Test-Oberfläche mit:
- Start/Stop-Buttons
- Status-Anzeige
- Dev-Shortcuts-Übersicht

## 🔄 Integration

Das System ist vollständig in `UnicornBackgroundSimple.tsx` integriert und:
- Startet automatisch auf Record-Seite
- Zeigt Animation-Status an
- Funktioniert mit bestehender Unicorn Studio-Integration

## ⚡ Performance

- Verwendet `requestAnimationFrame` für 60fps
- Abbrechbare Animationen verhindern Memory-Leaks
- Minimale API-Aufrufe durch intelligente Caching

