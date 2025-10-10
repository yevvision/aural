/**
 * Data Retention System
 * Automatische Löschung von Sicherheitsdaten nach 30 Tagen
 */

export interface RetentionData {
  id: string;
  type: 'device_stats' | 'file_hash' | 'pending_upload';
  createdAt: Date;
  expiresAt: Date;
  data: any;
}

export interface RetentionConfig {
  deviceStatsRetentionDays: number;
  fileHashRetentionDays: number;
  pendingUploadRetentionDays: number;
  cleanupIntervalHours: number;
}

export class DataRetentionManager {
  private static instance: DataRetentionManager;
  private config: RetentionConfig = {
    deviceStatsRetentionDays: 30,
    fileHashRetentionDays: 30,
    pendingUploadRetentionDays: 30,
    cleanupIntervalHours: 24 // Täglich
  };

  private constructor() {
    this.startCleanupScheduler();
  }

  public static getInstance(): DataRetentionManager {
    if (!DataRetentionManager.instance) {
      DataRetentionManager.instance = new DataRetentionManager();
    }
    return DataRetentionManager.instance;
  }

  /**
   * Startet den automatischen Cleanup-Scheduler
   */
  private startCleanupScheduler(): void {
    // Sofortiger Cleanup beim Start
    this.performCleanup();

    // Regelmäßiger Cleanup
    setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupIntervalHours * 60 * 60 * 1000);
  }

  /**
   * Führt die Datenbereinigung durch
   */
  public async performCleanup(): Promise<void> {
    try {
      await this.cleanupDeviceStats();
      await this.cleanupFileHashes();
      await this.cleanupPendingUploads();
    } catch (error) {
      console.error('Data Retention: Cleanup failed:', error);
    }
  }

  /**
   * Bereinigt Device-Stats (30 Tage)
   */
  private async cleanupDeviceStats(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.deviceStatsRetentionDays);

    try {
      const keys = Object.keys(localStorage);
      let cleanedCount = 0;

      for (const key of keys) {
        if (key.startsWith('aural_device_stats_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const stats = JSON.parse(data);
              const lastReset = new Date(stats.lastReset);
              
              if (lastReset < cutoffDate) {
                localStorage.removeItem(key);
                cleanedCount++;
              }
            } catch (parseError) {
              // Ungültige Daten löschen
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        }
      }

      // Device stats cleaned if needed
    } catch (error) {
      console.error('Failed to cleanup device stats:', error);
    }
  }

  /**
   * Bereinigt File-Hashes (30 Tage)
   */
  private async cleanupFileHashes(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.fileHashRetentionDays);

    try {
      const keys = Object.keys(localStorage);
      let cleanedCount = 0;

      for (const key of keys) {
        if (key.startsWith('aural_file_hashes_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const hashData = JSON.parse(data);
              const createdAt = new Date(hashData.createdAt);
              
              if (createdAt < cutoffDate) {
                localStorage.removeItem(key);
                cleanedCount++;
              }
            } catch (parseError) {
              // Ungültige Daten löschen
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        }
      }

      // File hash records cleaned if needed
    } catch (error) {
      console.error('Failed to cleanup file hashes:', error);
    }
  }

  /**
   * Bereinigt Pending-Uploads (30 Tage nach Entscheidung)
   */
  private async cleanupPendingUploads(): Promise<void> {
    // In einer echten App würde hier ein API-Call stehen
    // Für Demo-Zwecke simulieren wir die Bereinigung
  }

  /**
   * Markiert Daten für Retention
   */
  public markForRetention(
    id: string, 
    type: RetentionData['type'], 
    data: any,
    customRetentionDays?: number
  ): void {
    const retentionDays = customRetentionDays || this.getRetentionDays(type);
    const createdAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    const retentionData: RetentionData = {
      id,
      type,
      createdAt,
      expiresAt,
      data
    };

    // In localStorage speichern
    const key = `aural_retention_${type}_${id}`;
    localStorage.setItem(key, JSON.stringify(retentionData));
  }

  /**
   * Gibt die Retention-Tage für einen Datentyp zurück
   */
  private getRetentionDays(type: RetentionData['type']): number {
    switch (type) {
      case 'device_stats':
        return this.config.deviceStatsRetentionDays;
      case 'file_hash':
        return this.config.fileHashRetentionDays;
      case 'pending_upload':
        return this.config.pendingUploadRetentionDays;
      default:
        return 30;
    }
  }

  /**
   * Prüft ob Daten abgelaufen sind
   */
  public isExpired(id: string, type: RetentionData['type']): boolean {
    const key = `aural_retention_${type}_${id}`;
    const data = localStorage.getItem(key);
    
    if (!data) return true;

    try {
      const retentionData: RetentionData = JSON.parse(data);
      return new Date() > new Date(retentionData.expiresAt);
    } catch {
      return true;
    }
  }

  /**
   * Löscht abgelaufene Daten
   */
  public deleteExpiredData(): void {
    const keys = Object.keys(localStorage);
    let deletedCount = 0;

    for (const key of keys) {
      if (key.startsWith('aural_retention_')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const retentionData: RetentionData = JSON.parse(data);
            if (new Date() > new Date(retentionData.expiresAt)) {
              localStorage.removeItem(key);
              deletedCount++;
            }
          } catch {
            // Ungültige Daten löschen
            localStorage.removeItem(key);
            deletedCount++;
          }
        }
      }
    }

    // Expired records deleted if needed
  }

  /**
   * Setzt die Retention-Konfiguration
   */
  public setConfig(config: Partial<RetentionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gibt die aktuelle Konfiguration zurück
   */
  public getConfig(): RetentionConfig {
    return { ...this.config };
  }

  /**
   * Manueller Cleanup-Trigger
   */
  public async forceCleanup(): Promise<void> {
    await this.performCleanup();
  }
}

// Singleton-Instanz exportieren
export const dataRetentionManager = DataRetentionManager.getInstance();
