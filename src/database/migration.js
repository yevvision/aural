import { centralDB } from './centralDatabase_simple';
// Migrations-Script für V1 zu V2
export class DatabaseMigration {
    // Führe die Migration von V1 zu V2 durch
    static async migrateV1ToV2() {
        console.log('🔄 Migration: Starte V1 zu V2 Migration...');
        try {
            // Prüfe, ob V1-Daten vorhanden sind
            const v1Data = localStorage.getItem('aural-central-database');
            if (!v1Data) {
                console.log('📭 Migration: Keine V1-Daten gefunden - frische Installation');
                return true;
            }
            // Prüfe, ob V2 bereits migriert wurde
            const v2Data = localStorage.getItem('aural-central-database-v2');
            if (v2Data) {
                console.log('✅ Migration: V2-Daten bereits vorhanden - Migration übersprungen');
                return true;
            }
            console.log('🔄 Migration: Führe Migration durch...');
            // Die Migration wird automatisch in CentralDatabaseV2 durchgeführt
            // beim ersten Laden der Instanz
            const db = centralDB;
            console.log('✅ Migration: V1 zu V2 Migration erfolgreich abgeschlossen');
            return true;
        }
        catch (error) {
            console.error('❌ Migration: Fehler bei V1 zu V2 Migration:', error);
            return false;
        }
    }
    // Validiere die migrierten Daten
    static validateMigration() {
        console.log('🔍 Migration: Validiere migrierte Daten...');
        const errors = [];
        try {
            const stats = centralDB.getStats();
            // Prüfe grundlegende Struktur
            if (stats.totalUsers === 0) {
                errors.push('Keine Benutzer nach Migration gefunden');
            }
            if (stats.totalTracks === 0) {
                errors.push('Keine Tracks nach Migration gefunden');
            }
            // Prüfe, ob alle Tracks eine userId haben
            const tracks = centralDB.getAllTracks();
            const tracksWithoutUserId = tracks.filter(track => !track.userId);
            if (tracksWithoutUserId.length > 0) {
                errors.push(`${tracksWithoutUserId.length} Tracks ohne userId gefunden`);
            }
            // Prüfe, ob alle Tracks gültige Tags haben
            const tracksWithInvalidTags = tracks.filter(track => track.tags && !Array.isArray(track.tags));
            if (tracksWithInvalidTags.length > 0) {
                errors.push(`${tracksWithInvalidTags.length} Tracks mit ungültigen Tags gefunden`);
            }
            console.log('✅ Migration: Validierung abgeschlossen', {
                errors: errors.length,
                stats
            });
            return {
                isValid: errors.length === 0,
                errors
            };
        }
        catch (error) {
            console.error('❌ Migration: Fehler bei Validierung:', error);
            return {
                isValid: false,
                errors: [`Validierungsfehler: ${error}`]
            };
        }
    }
    // Erstelle Backup der V1-Daten vor Migration
    static createV1Backup() {
        console.log('💾 Migration: Erstelle V1-Backup...');
        try {
            const v1Data = localStorage.getItem('aural-central-database');
            if (!v1Data) {
                console.log('📭 Migration: Keine V1-Daten für Backup gefunden');
                return true;
            }
            const backupKey = `aural-central-database-v1-backup-${Date.now()}`;
            localStorage.setItem(backupKey, v1Data);
            console.log('✅ Migration: V1-Backup erstellt:', backupKey);
            return true;
        }
        catch (error) {
            console.error('❌ Migration: Fehler beim Erstellen des V1-Backups:', error);
            return false;
        }
    }
    // Stelle V1-Daten aus Backup wieder her
    static restoreV1FromBackup(backupKey) {
        console.log('🔄 Migration: Stelle V1-Daten aus Backup wieder her...', backupKey);
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                console.log('❌ Migration: Backup nicht gefunden:', backupKey);
                return false;
            }
            localStorage.setItem('aural-central-database', backupData);
            console.log('✅ Migration: V1-Daten aus Backup wiederhergestellt');
            return true;
        }
        catch (error) {
            console.error('❌ Migration: Fehler beim Wiederherstellen des V1-Backups:', error);
            return false;
        }
    }
    // Führe komplette Migration mit Backup durch
    static async migrateWithBackup() {
        console.log('🚀 Migration: Starte komplette Migration mit Backup...');
        const errors = [];
        try {
            // 1. Erstelle Backup
            const backupCreated = this.createV1Backup();
            if (!backupCreated) {
                errors.push('Fehler beim Erstellen des V1-Backups');
            }
            // 2. Führe Migration durch
            const migrationSuccess = await this.migrateV1ToV2();
            if (!migrationSuccess) {
                errors.push('Fehler bei der V1 zu V2 Migration');
            }
            // 3. Validiere Migration
            const validation = this.validateMigration();
            if (!validation.isValid) {
                errors.push(...validation.errors);
            }
            const success = errors.length === 0;
            if (success) {
                console.log('✅ Migration: Komplette Migration erfolgreich abgeschlossen');
            }
            else {
                console.log('❌ Migration: Migration mit Fehlern abgeschlossen:', errors);
            }
            return { success, errors };
        }
        catch (error) {
            console.error('❌ Migration: Unerwarteter Fehler bei Migration:', error);
            return {
                success: false,
                errors: [`Unerwarteter Fehler: ${error}`]
            };
        }
    }
    // Zeige Migration-Status
    static getMigrationStatus() {
        console.log('📊 Migration: Prüfe Migration-Status...');
        const v1Data = localStorage.getItem('aural-central-database');
        const v2Data = localStorage.getItem('aural-central-database-v2');
        const hasV1Data = !!v1Data;
        const hasV2Data = !!v2Data;
        const needsMigration = hasV1Data && !hasV2Data;
        let v1Stats = null;
        let v2Stats = null;
        try {
            if (hasV1Data) {
                const parsed = JSON.parse(v1Data);
                v1Stats = {
                    tracks: parsed.tracks?.length || 0,
                    users: parsed.users?.length || 0,
                    comments: parsed.comments?.length || 0,
                    likes: parsed.likes?.length || 0,
                    bookmarks: parsed.bookmarks?.length || 0
                };
            }
            if (hasV2Data) {
                v2Stats = centralDB.getStats();
            }
        }
        catch (error) {
            console.error('❌ Migration: Fehler beim Lesen der Stats:', error);
        }
        console.log('📊 Migration: Status:', {
            hasV1Data,
            hasV2Data,
            needsMigration,
            v1Stats,
            v2Stats
        });
        return {
            hasV1Data,
            hasV2Data,
            needsMigration,
            v1Stats,
            v2Stats
        };
    }
}
// Automatische Migration beim Import
export const autoMigrate = async () => {
    console.log('🔄 Auto-Migration: Starte automatische Migration...');
    const status = DatabaseMigration.getMigrationStatus();
    if (!status.needsMigration) {
        console.log('✅ Auto-Migration: Keine Migration erforderlich');
        return true;
    }
    console.log('🔄 Auto-Migration: Migration erforderlich, führe durch...');
    const result = await DatabaseMigration.migrateWithBackup();
    if (result.success) {
        console.log('✅ Auto-Migration: Automatische Migration erfolgreich');
    }
    else {
        console.log('❌ Auto-Migration: Automatische Migration fehlgeschlagen:', result.errors);
    }
    return result.success;
};
// Export für einfache Verwendung
export default DatabaseMigration;
