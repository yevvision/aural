# 🚨 DRINGEND: MANUELLER UPLOAD ERFORDERLICH

## ❌ **Problem:**
Die SFTP-Extension hat nicht alle korrigierten Dateien hochgeladen!
Der Server lädt immer noch die Development-Version → Weißer Bildschirm

## ✅ **Sofort-Lösung:**

### **MANUELL diese Dateien überschreiben:**

1. **`index.html`** - WICHTIGSTE DATEI!
   - **Quelle:** `/dist/index.html` 
   - **Ziel:** `/www/aural/index.html`
   - **Warum:** Enthält korrekte Production-Asset-Pfade

2. **`assets/` Ordner** - KOMPLETT überschreiben!
   - **Quelle:** `/dist/assets/`
   - **Ziel:** `/www/aural/assets/`
   - **Warum:** Neue kompilierte JS/CSS-Dateien

### **So gehts:**

1. **SFTP-Extension öffnen**
2. **Rechtsklick auf `/www/aural/index.html`** → "Delete"
3. **`/dist/index.html` hochladen** nach `/www/aural/`
4. **`/dist/assets/` Ordner komplett hochladen** nach `/www/aural/`

---

## 🎯 **Nach dem Upload:**

### **Testen:** http://wp13874980.server-he.de/aural/

**SOLLTE JETZT FUNKTIONIEREN!** 🎉

---

## 📋 **Checklist:**

- [ ] `/www/aural/index.html` überschrieben
- [ ] `/www/aural/assets/` Ordner überschrieben  
- [ ] Browser-Cache geleert (Ctrl+F5)
- [ ] Getestet: http://wp13874980.server-he.de/aural/

**Die ServiceWorker-Fehler kannst du ignorieren - das sind Browser-Extensions.**


