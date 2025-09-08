# Audio-Aufnahme und Bearbeitung Briefing

## Aktuelle Implementierung - Status Quo

### Bestehende Funktionalität
Die Aural Web-App verfügt bereits über eine grundlegende Audio-Aufnahmefunktion:

**Technische Basis:**
- **MediaRecorder API** mit WebM/Opus Codec
- **Web Audio API** für Echtzeit-Analyse
- **Real-time Visualisierung** mit Frequenz- und Volumen-Analyse
- **Mono-Aufnahme** (1 Kanal, 44.1kHz Sample Rate)
- **128 kbps Bitrate** für gute Qualität bei moderater Dateigröße

**Aktuelle Features:**
- ✅ Automatischer Aufnahmestart
- ✅ Pause/Resume-Funktionalität
- ✅ Echtzeit-Visualisierung mit Glow-Effekten
- ✅ Dauer-Tracking mit Pause-Unterstützung
- ✅ Automatische Weiterleitung zur Upload-Seite
- ✅ Browser-Kompatibilitätsprüfung
- ✅ Fehlerbehandlung und Timeout-Management

**Limitationen der aktuellen Implementierung:**
- ❌ Keine Audio-Bearbeitung nach der Aufnahme
- ❌ Keine Möglichkeit zum Schneiden/Trimmen
- ❌ Keine Lautstärke-Anpassung
- ❌ Keine automatische Stille-Erkennung
- ❌ Keine Komprimierung oder Format-Optimierung
- ❌ Keine Wellenform-Visualisierung für Bearbeitung

## Anforderungen für Audio-Bearbeitungstool

### 1. Kernfunktionalitäten

#### Audio-Bearbeitung
- **Schneiden/Trimmen**: Präzise Auswahl von Start- und Endpunkten
- **Wellenform-Visualisierung**: Interaktive Darstellung für präzise Bearbeitung
- **Lautstärke-Regelung**: 
  - Globale Lautstärke-Anpassung
  - Ein-/Ausblendeffekte (Fade In/Out)
  - Normalisierung für konsistente Pegel
- **Automatische Stille-Erkennung**:
  - Erkennung von leisen/leeren Passagen
  - Automatisches Entfernen oder Markieren
  - Konfigurierbare Schwellenwerte

#### Audio-Optimierung
- **Komprimierung**: 
  - Verschiedene Qualitätsstufen (hoch/mittel/niedrig)
  - Format-Konvertierung (WebM → MP3/AAC)
  - Dateigröße-Optimierung für Web-Distribution
- **Rauschunterdrückung**: 
  - Automatische Hintergrundgeräusch-Reduzierung
  - Echo-Cancellation
  - Klangverbesserung

### 2. Technische Anforderungen

#### Browser-Kompatibilität
- **Web Audio API** Integration
- **OffscreenCanvas** für Wellenform-Rendering
- **Web Workers** für Audio-Processing
- **File API** für Datei-Export
- **MediaRecorder** Erweiterung

#### Performance
- **Echtzeit-Verarbeitung** ohne Browser-Freeze
- **Streaming-Verarbeitung** für große Dateien
- **Memory-Management** für mobile Geräte
- **Progressive Loading** der Wellenform-Daten

#### Benutzerfreundlichkeit
- **Touch-optimierte Bedienung** für mobile Geräte
- **Keyboard-Shortcuts** für Desktop
- **Undo/Redo-Funktionalität**
- **Vorschau-Funktion** vor Export

### 3. Integration in bestehende Architektur

#### Komponenten-Integration
```typescript
// Neue Komponenten-Struktur
src/components/audio/editor/
├── AudioEditor.tsx           // Haupt-Editor-Komponente
├── WaveformVisualizer.tsx    // Wellenform-Darstellung
├── AudioControls.tsx         // Bearbeitungs-Controls
├── ExportDialog.tsx          // Export-Optionen
└── SilenceDetector.tsx       // Stille-Erkennung
```

#### Hook-Integration
```typescript
// Neue Hooks
src/hooks/
├── useAudioEditor.ts         // Haupt-Editor-Logik
├── useWaveformGenerator.ts   // Wellenform-Generierung
├── useAudioProcessor.ts      // Audio-Verarbeitung
└── useExportManager.ts       // Export-Management
```

#### Store-Integration
```typescript
// Erweiterte Store-Struktur
src/stores/
├── audioEditorStore.ts       // Editor-State
└── exportStore.ts           // Export-Konfiguration
```

## Empfohlene Tool-Optionen

### Option 1: Web Audio API + Custom Implementation
**Vorteile:**
- Vollständige Kontrolle über Funktionalität
- Optimale Integration in bestehende Architektur
- Keine externen Abhängigkeiten
- Custom UI/UX Design

**Nachteile:**
- Hoher Entwicklungsaufwand
- Komplexe Audio-Verarbeitung
- Browser-Kompatibilitätsprobleme

**Geschätzter Aufwand:** 4-6 Wochen

### Option 2: Tone.js + Web Audio API
**Vorteile:**
- Bewährte Audio-Bibliothek
- Gute Web Audio API Abstraktion
- Aktive Community
- Umfangreiche Dokumentation

**Nachteile:**
- Zusätzliche Bundle-Größe (~200KB)
- Lernkurve für Team
- Mögliche Feature-Limitationen

**Geschätzter Aufwand:** 3-4 Wochen

### Option 3: Pizzicato.js + Custom Editor
**Vorteile:**
- Leichtgewichtig (~50KB)
- Einfache API
- Gute Performance
- Fokus auf Audio-Processing

**Nachteile:**
- Weniger Features als Tone.js
- Kleinere Community
- Mögliche Limitationen bei komplexen Operationen

**Geschätzter Aufwand:** 2-3 Wochen

### Option 4: WaveSurfer.js + Web Audio API
**Vorteile:**
- Spezialisiert auf Wellenform-Visualisierung
- Interaktive Timeline
- Plugin-System
- Gute Performance

**Nachteile:**
- Fokus auf Visualisierung, weniger auf Bearbeitung
- Zusätzliche Bibliotheken für Audio-Processing nötig

**Geschätzter Aufwand:** 3-4 Wochen

## Empfehlung

**Beste Option: Tone.js + Web Audio API + Custom Editor**

### Begründung:
1. **Bewährte Technologie**: Tone.js ist eine etablierte, gut dokumentierte Bibliothek
2. **Flexibilität**: Kombination aus Bibliothek und Custom-Code für optimale Kontrolle
3. **Performance**: Web Audio API für Echtzeit-Verarbeitung
4. **Skalierbarkeit**: Erweiterbar für zukünftige Features
5. **Team-Kompetenz**: Web Audio API ist bereits im Projekt verwendet

### Implementierungsplan:

#### Phase 1: Grundfunktionen (1-2 Wochen)
- Wellenform-Visualisierung
- Basis-Bearbeitungs-Controls (Schneiden, Lautstärke)
- Integration in bestehende Upload-Pipeline

#### Phase 2: Erweiterte Features (1-2 Wochen)
- Automatische Stille-Erkennung
- Rauschunterdrückung
- Export-Optimierung

#### Phase 3: Polish & Performance (1 Woche)
- Mobile-Optimierung
- Performance-Tuning
- UI/UX-Verbesserungen

## Technische Spezifikationen

### Audio-Formate
- **Aufnahme**: WebM/Opus (bestehend)
- **Bearbeitung**: Web Audio API (Float32Array)
- **Export**: MP3 (128kbps), AAC (96kbps), WebM (128kbps)

### Performance-Ziele
- **Ladezeit**: < 2 Sekunden für 5-Minuten-Audio
- **Bearbeitung**: < 100ms Latenz für Echtzeit-Operationen
- **Export**: < 10 Sekunden für 5-Minuten-Audio
- **Memory**: < 100MB für 10-Minuten-Audio

### Browser-Support
- **Chrome/Edge**: Vollständige Unterstützung
- **Firefox**: Vollständige Unterstützung
- **Safari**: Basis-Unterstützung (iOS 14.5+)
- **Mobile**: Touch-optimierte Bedienung

## Nächste Schritte

1. **Prototyp-Entwicklung**: Erstelle MVP mit Tone.js + Web Audio API
2. **Performance-Tests**: Teste mit verschiedenen Audio-Längen
3. **UI/UX-Design**: Entwerfe mobile-optimierte Bedienung
4. **Integration-Tests**: Teste mit bestehender Upload-Pipeline
5. **User-Testing**: Feedback von Beta-Usern einholen

## Budget-Schätzung

- **Entwicklung**: 3-4 Wochen (1 Entwickler)
- **Testing**: 1 Woche
- **Design**: 1 Woche
- **Gesamt**: 5-6 Wochen

**Kosten**: ~€15.000 - €25.000 (je nach Entwickler-Rate)

