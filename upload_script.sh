#!/bin/bash

# Aural App Upload Script
echo "🚀 Aural App - Upload Script"
echo "============================"

# FTP-Zugangsdaten
FTP_HOST="yev.vision"
FTP_USER="ftp13874980-aural"
FTP_PASS="aural33!"
FTP_DIR="/www/aural/"

echo "📡 Verbinde mit FTP-Server..."

# Erstelle FTP-Script
cat > ftp_commands.txt << EOF
open $FTP_HOST
user $FTP_USER $FTP_PASS
binary
cd $FTP_DIR
mkdir aural
cd aural
mkdir assets
mkdir uploads
put dist/index.html index.html
put dist/assets/index-Cg5zhJfg.css assets/index-Cg5zhJfg.css
put dist/assets/index-BY7-5q0t.js assets/index-BY7-5q0t.js
put dist/assets/worker-BAOIWoxA.js assets/worker-BAOIWoxA.js
put dist/assets/ffmpegWorker-G7I8upzo.js assets/ffmpegWorker-G7I8upzo.js
put upload.php upload.php
put setup.php setup.php
put .htaccess .htaccess
put robots.txt robots.txt
put sitemap.xml sitemap.xml
put uploads/index.php uploads/index.php
quit
EOF

echo "📁 Lade Dateien hoch..."

# Führe FTP-Upload aus
ftp -n < ftp_commands.txt

echo "✅ Upload abgeschlossen!"
echo ""
echo "🔧 Nächste Schritte:"
echo "1. Besuche: https://yev.vision/aural/setup.php"
echo "2. Teste: https://yev.vision/aural/"
echo "3. Admin: https://yev.vision/aural/admin"

# Aufräumen
rm ftp_commands.txt

echo "🎉 Fertig!"
