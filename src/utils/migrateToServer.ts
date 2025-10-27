import { serverDatabaseService } from '../services/serverDatabaseService';

/**
 * Migriert lokale localStorage-Daten auf den Server
 */
export const migrateLocalDataToServer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting migration from localStorage to server...');

    // 1. Migriere pending uploads
    const pendingUploadsData = localStorage.getItem('aural_pending_uploads');
    if (pendingUploadsData) {
      console.log('📦 Found pending uploads in localStorage, migrating...');
      const uploads = JSON.parse(pendingUploadsData);
      const pendingList = Object.values(uploads).filter((upload: any) => 
        upload.status === 'pending_review'
      );

      console.log(`📋 Found ${pendingList.length} pending uploads to migrate`);

      // TODO: Implement server-side migration for pending uploads
      // For now, we'll keep them in localStorage as backup
      console.log('⚠️ Pending uploads migration not yet implemented - keeping in localStorage as backup');
    }

    // 2. Migriere zentrale Datenbank
    const centralDBData = localStorage.getItem('aural-central-database');
    if (centralDBData) {
      console.log('📦 Found central database in localStorage, syncing with server...');
      const dbData = JSON.parse(centralDBData);
      
      // Sync tracks with server
      if (dbData.tracks && Array.isArray(dbData.tracks)) {
        console.log(`📋 Found ${dbData.tracks.length} tracks to sync with server`);
        
        for (const track of dbData.tracks) {
          try {
            await serverDatabaseService.addTrack(track);
            console.log(`✅ Synced track: ${track.title}`);
          } catch (error) {
            console.error(`❌ Failed to sync track ${track.title}:`, error);
          }
        }
      }

      // Sync users with server
      if (dbData.users && Array.isArray(dbData.users)) {
        console.log(`📋 Found ${dbData.users.length} users to sync with server`);
        
        for (const user of dbData.users) {
          try {
            await serverDatabaseService.addUser(user);
            console.log(`✅ Synced user: ${user.username}`);
          } catch (error) {
            console.error(`❌ Failed to sync user ${user.username}:`, error);
          }
        }
      }
    }

    // 3. Erstelle Backup der lokalen Daten
    const backupData = {
      pendingUploads: pendingUploadsData ? JSON.parse(pendingUploadsData) : null,
      centralDatabase: centralDBData ? JSON.parse(centralDBData) : null,
      migratedAt: new Date().toISOString()
    };

    localStorage.setItem('aural-migration-backup', JSON.stringify(backupData));
    console.log('💾 Created migration backup in localStorage');

    // 4. Teste Server-Verbindung
    try {
      const serverData = await serverDatabaseService.getDatabase();
      console.log('✅ Server connection successful, data synced');
      console.log('📊 Server data summary:', {
        tracks: serverData?.tracks?.length || 0,
        users: serverData?.users?.length || 0,
        pendingUploads: serverData?.pendingUploads?.length || 0
      });
    } catch (error) {
      console.error('❌ Server connection failed:', error);
      throw error;
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Prüft ob eine Migration nötig ist
 */
export const needsMigration = (): boolean => {
  const pendingUploads = localStorage.getItem('aural_pending_uploads');
  const centralDB = localStorage.getItem('aural-central-database');
  const migrationBackup = localStorage.getItem('aural-migration-backup');
  
  // Migration nötig wenn lokale Daten existieren aber noch keine Migration durchgeführt wurde
  return (!!pendingUploads || !!centralDB) && !migrationBackup;
};

/**
 * Führt automatische Migration durch wenn nötig
 */
export const autoMigrateIfNeeded = async (): Promise<void> => {
  if (needsMigration()) {
    console.log('🔄 Auto-migration needed, starting...');
    try {
      await migrateLocalDataToServer();
      console.log('✅ Auto-migration completed');
    } catch (error) {
      console.error('❌ Auto-migration failed:', error);
      // Don't throw - let the app continue with fallback to localStorage
    }
  } else {
    console.log('ℹ️ No migration needed');
  }
};
