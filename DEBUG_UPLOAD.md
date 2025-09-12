# 🚨 UPLOAD PROBLEM - LÖSUNG

## ❌ **Das Problem:**
```
GET http://wp13874980.server-he.de/src/main.tsx 404 (Not Found)
```

**➜ Der Server lädt IMMER NOCH die falsche index.html!**

## 🔍 **Upload prüfen:**

### **1. Upload-Status checken:**
- **Schaue unten in VS Code** - steht da "Upload complete" oder ähnlich?
- **Oder Fehler-Meldung?**

### **2. SFTP-Extension prüfen:**
1. **Öffne Command Palette:** `Ctrl + Shift + P` (Windows) oder `Cmd + Shift + P` (Mac)
2. **Tippe:** `SFTP: List All`
3. **Schaue ob Verbindung da ist**

## ✅ **ALTERNATIVE LÖSUNG:**

### **Manuell über SFTP-Ansicht:**

1. **Command Palette:** `Ctrl + Shift + P`
2. **Tippe:** `SFTP: Open SSH in Terminal`
3. **ODER:** `SFTP: Explorer`

### **Notfall-Lösung:**
**Lade die Dateien über FTP-Client hoch:**
- **FileZilla** oder ähnlich
- **Server:** wp13874980.server-he.de
- **User:** ftp13874980-aural  
- **Password:** aural33!

---

## 🎯 **Was hochgeladen werden muss:**

### **Diese Datei ist KRITISCH:**
- **`/dist/index.html`** → **`/www/aural/index.html`**

**Diese Datei enthält die richtigen Asset-Pfade!**

## 💡 **Schnell-Check:**
**Kannst du mir sagen was unten in VS Code angezeigt wird? Steht da ein Upload-Status?**


