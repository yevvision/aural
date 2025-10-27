// Script zum Synchronisieren der Datenbank aus dist_original/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lade die Datenbank aus dist_original/
const distOriginalPath = path.join(__dirname, 'dist_original', 'aural_database.json');
const databaseData = JSON.parse(fs.readFileSync(distOriginalPath, 'utf8'));

// Speichere in localStorage-Format
const localStorageData = {
  'aural-central-database': JSON.stringify(databaseData)
};

// Erstelle ein HTML-File das die Daten in localStorage lädt
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Database Sync</title>
</head>
<body>
    <h1>Database Sync</h1>
    <p>Loading database data into localStorage...</p>
    <script>
        // Lade die Datenbank-Daten
        const databaseData = ${JSON.stringify(databaseData)};
        
        // Speichere in localStorage
        localStorage.setItem('aural-central-database', JSON.stringify(databaseData));
        
        console.log('✅ Database synced to localStorage');
        console.log('Tracks:', databaseData.tracks?.length || 0);
        console.log('Users:', databaseData.users?.length || 0);
        
        document.body.innerHTML = '<h1>✅ Database Synced!</h1><p>Tracks: ' + (databaseData.tracks?.length || 0) + '</p><p>Users: ' + (databaseData.users?.length || 0) + '</p>';
    </script>
</body>
</html>
`;

// Speichere das HTML-File
fs.writeFileSync(path.join(__dirname, 'sync_database.html'), htmlContent);

console.log('✅ Database sync HTML created');
console.log('Tracks:', databaseData.tracks?.length || 0);
console.log('Users:', databaseData.users?.length || 0);
console.log('Open sync_database.html in your browser to load data into localStorage');
