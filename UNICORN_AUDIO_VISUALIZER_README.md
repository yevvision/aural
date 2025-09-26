# Unicorn Audio Visualizer

Ein neuer Audio-Visualizer, der die bestehende Unicorn Studio 3D-Animation als Basis verwendet und Audio-Daten in Echtzeit integriert.

## 🎯 Überblick

Der Unicorn Audio Visualizer nutzt die gleiche Unicorn Studio 3D-Engine wie der Hintergrund (Projekt "3Z7rqYRTDAvnqc3BpTTz") und reagiert dynamisch auf Audio-Input. Anstatt nur CSS-Animationen zu verwenden, integriert er sich direkt in die 3D-Szene.

## 🚀 Features

### Audio-Integration
- **Echtzeit-Analyse**: Verwendet Web Audio API für präzise Frequenz- und Lautstärke-Analyse
- **Frequenz-Bänder**: Separate Analyse von tiefen, mittleren und hohen Frequenzen
- **Dynamische Parameter**: Skalierung, Farben, Blur-Effekte und andere Parameter ändern sich basierend auf Audio-Input

### 3D-Animation
- **Unicorn Studio Integration**: Nutzt die gleiche 3D-Engine wie der Hintergrund
- **Projekt "3Z7rqYRTDAvnqc3BpTTz"**: Verwendet das bestehende 3D-Projekt
- **Audio-reaktive Effekte**: Die 3D-Szene reagiert direkt auf Audio-Daten

### Responsive Design
- **Verschiedene Größen**: Small (200px), Medium (400px), Large (600px)
- **Mobile-optimiert**: Funktioniert auf allen Geräten
- **Performance-optimiert**: Effiziente Animation mit requestAnimationFrame

## 📁 Dateien

### Hauptkomponenten
- `src/components/audio/UnicornAudioVisualizer.tsx` - Basis-Version
- `src/components/audio/UnicornAudioVisualizerAdvanced.tsx` - Erweiterte Version mit mehr Features

### Demo-Seite
- `src/pages/UnicornVisualizerDemoPage.tsx` - Demo-Seite zum Testen
- Route: `/unicorn-visualizer-demo`

### Integration
- `src/pages/RecordPage.tsx` - Integration in Record-Seite
- `src/pages/RecorderPage.tsx` - Integration in Recorder-Seite

## 🎮 Verwendung

### Grundlegende Verwendung

```tsx
import { UnicornAudioVisualizerAdvanced } from '../components/audio/UnicornAudioVisualizerAdvanced';

<UnicornAudioVisualizerAdvanced
  frequencies={visualizerData.frequencies}
  volume={visualizerData.volume}
  isActive={isRecording}
  size="medium"
/>
```

### Mit Audio-Element

```tsx
<UnicornAudioVisualizerAdvanced
  audioElement={audioRef.current}
  isPlaying={isPlaying}
  size="large"
/>
```

### Props

| Prop | Typ | Standard | Beschreibung |
|------|-----|----------|--------------|
| `frequencies` | `number[]` | `[]` | Frequenz-Daten (0-1) |
| `volume` | `number` | `0` | Lautstärke (0-1) |
| `isActive` | `boolean` | `false` | Ob Audio aktiv ist |
| `audioElement` | `HTMLAudioElement \| null` | `undefined` | Audio-Element für Playback |
| `isPlaying` | `boolean` | `false` | Ob Audio abgespielt wird |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Größe des Visualizers |
| `className` | `string` | `''` | Zusätzliche CSS-Klassen |

## 🔧 Technische Details

### Audio-Analyse
- **FFT-Größe**: 512 (höhere Auflösung als Standard)
- **Smoothing**: 0.7 (responsiver als Standard)
- **Frequenz-Bänder**: 
  - Tief: 0-25% der Frequenzen
  - Mittel: 25-75% der Frequenzen
  - Hoch: 75-100% der Frequenzen

### Unicorn Studio Integration
- **Projekt-ID**: "3Z7rqYRTDAvnqc3BpTTz"
- **API-Parameter**: 
  - `intensity`: Gesamtintensität (0-1)
  - `volume`: Lautstärke (0-1)
  - `lowFreq`, `midFreq`, `highFreq`: Frequenz-Bänder
  - `energy`: Energie-Verteilung

### CSS-Fallback
Falls die Unicorn Studio API nicht verfügbar ist, werden CSS-Transforms und -Filter verwendet:
- **Skalierung**: 1.0 bis 1.8 basierend auf Intensität
- **Helligkeit**: 0.7 bis 1.3 basierend auf Lautstärke
- **Sättigung**: 1.0 bis 2.5 basierend auf Intensität
- **Farbverschiebung**: -60° bis 120° basierend auf Frequenzen
- **Blur**: 0-3px basierend auf hohen Frequenzen
- **Kontrast**: 1.0 bis 1.5 basierend auf mittleren Frequenzen

## 🎨 Visuelle Effekte

### Audio-reaktive Overlays
- **Radial-Gradient**: Position basierend auf Frequenz-Verteilung
- **Farben**: Rot-Orange-Gelb-Spektrum basierend auf Frequenz-Bändern
- **Opacity**: 0-0.8 basierend auf Intensität
- **Skalierung**: 1.0-1.3 basierend auf Intensität

### Frequenz-Indikatoren
- **3 Balken**: Für tiefe, mittlere und hohe Frequenzen
- **Farben**: 
  - Tief: Rot-Orange
  - Mittel: Orange-Gelb
  - Hoch: Gelb-Weiß
- **Höhe**: 5-100% basierend auf Lautstärke

## 🚀 Demo testen

1. Navigiere zu `/unicorn-visualizer-demo`
2. Teste mit Mikrofon-Aufnahme
3. Teste mit Audio-Datei-Wiedergabe
4. Beobachte die Echtzeit-Reaktion der 3D-Animation

## 🔄 Integration in bestehende Seiten

Der Visualizer wurde bereits in folgende Seiten integriert:
- **RecordPage**: Ersetzt den EnhancedAudioVisualizer
- **RecorderPage**: Ersetzt den EnhancedAudioVisualizer

## 🎯 Vorteile gegenüber dem alten Visualizer

1. **3D-Animation**: Nutzt echte 3D-Engine statt nur CSS
2. **Konsistenz**: Gleiche visuelle Sprache wie der Hintergrund
3. **Performance**: Optimiert für Echtzeit-Audio-Analyse
4. **Flexibilität**: Verschiedene Größen und Konfigurationen
5. **Integration**: Nahtlose Integration in bestehende Unicorn Studio Szene

## 🐛 Bekannte Probleme

- Unicorn Studio API-Parameter müssen möglicherweise an die tatsächliche API angepasst werden
- Audio-Kontext kann bei manchen Browsern Probleme verursachen
- Performance kann bei sehr hohen Frequenz-Raten beeinträchtigt werden

## 🔮 Zukünftige Verbesserungen

- [ ] Mehr Unicorn Studio API-Parameter
- [ ] Zusätzliche Audio-Effekte
- [ ] Konfigurierbare Farb-Schemata
- [ ] Partikel-Effekte basierend auf Audio
- [ ] 3D-Kamera-Bewegungen basierend auf Audio
