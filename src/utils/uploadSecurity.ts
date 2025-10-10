import { generateId } from './index';
import { dataRetentionManager } from './dataRetention';

/**
 * Upload-Sicherheitssystem mit Rate-Limits und Duplikat-Erkennung
 */

export interface UploadLimits {
  maxUploadsPer30Min: number;
  maxUploadsPerDay: number;
  maxAudioMinutesPerDay: number;
  maxDuplicateCount: number;
  minAudioDuration: number; // Mindestdauer in Sekunden
  maxAudioDuration: number; // Maximale Dauer in Sekunden (20 Minuten)
}

export interface DeviceStats {
  deviceId: string;
  uploads30Min: number;
  uploadsToday: number;
  audioMinutesToday: number;
  lastUpload30Min: Date | null;
  lastUploadToday: Date | null;
  fileHashes: { [hash: string]: number };
  lastReset: Date;
}

export interface DuplicateCheck {
  isDuplicate: boolean;
  duplicateCount: number;
  isSuspicious: boolean;
}

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  requiresReview: boolean;
  duplicateCheck: DuplicateCheck;
  deviceStats: DeviceStats;
}

// Standard-Limits
export const DEFAULT_LIMITS: UploadLimits = {
  maxUploadsPer30Min: 1, // Reduziert für mehr Warteschlangen-Uploads
  maxUploadsPerDay: 2, // Reduziert für mehr Warteschlangen-Uploads
  maxAudioMinutesPerDay: 60, // Reduziert für mehr Warteschlangen-Uploads
  maxDuplicateCount: 3, // Reduziert für mehr Warteschlangen-Uploads
  minAudioDuration: 5, // Reduziert auf 5 Sekunden
  maxAudioDuration: 1200 // 20 Minuten maximale Dauer
};

/**
 * Upload-Sicherheitsmanager
 */
export class UploadSecurityManager {
  private static instance: UploadSecurityManager;
  private deviceStats: Map<string, DeviceStats> = new Map();
  private limits: UploadLimits = DEFAULT_LIMITS;

  private constructor() {
    // Cleanup alte Daten beim Start
    this.cleanupOldData();
  }

  public static getInstance(): UploadSecurityManager {
    if (!UploadSecurityManager.instance) {
      UploadSecurityManager.instance = new UploadSecurityManager();
    }
    return UploadSecurityManager.instance;
  }

  /**
   * Generiert eine Device-ID basierend auf Browser-Fingerprint
   */
  private generateDeviceId(): string {
    // Einfacher Fingerprint basierend auf verfügbaren Browser-Daten
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // Einfacher Hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Berechnet SHA-256 Hash einer Datei
   */
  public async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Führt Sicherheitscheck vor Upload durch
   */
  public async checkUploadSecurity(file: File, duration: number): Promise<SecurityCheckResult> {
    const deviceId = this.generateDeviceId();
    const fileHash = await this.calculateFileHash(file);
    
    // Device-Stats laden oder erstellen
    let deviceStats = this.deviceStats.get(deviceId);
    if (!deviceStats) {
      // Versuche aus localStorage zu laden
      const loadedStats = this.loadDeviceStats(deviceId);
      if (loadedStats) {
        deviceStats = loadedStats;
        this.deviceStats.set(deviceId, deviceStats);
      } else {
        deviceStats = this.createNewDeviceStats(deviceId);
        this.deviceStats.set(deviceId, deviceStats);
      }
    }
    
    console.log('🔐 Security Check - Device Stats:', {
      deviceId,
      uploads30Min: deviceStats.uploads30Min,
      uploadsToday: deviceStats.uploadsToday,
      audioMinutesToday: deviceStats.audioMinutesToday,
      lastUpload30Min: deviceStats.lastUpload30Min,
      lastUploadToday: deviceStats.lastUploadToday
    });

    // Rate-Limits ZUERST prüfen (unabhängig von der Dauer)
    const rateLimitCheck = this.checkRateLimits(deviceStats, duration);
    if (!rateLimitCheck.allowed) {
      return {
        allowed: false,
        reason: rateLimitCheck.reason,
        requiresReview: true,
        duplicateCheck: { isDuplicate: false, duplicateCount: 0, isSuspicious: false },
        deviceStats
      };
    }

    // 5-Sekunden-Mindestdauer prüfen
    if (duration < this.limits.minAudioDuration) {
      return {
        allowed: true, // Erlauben, aber zur Review
        reason: 'Deine Aufnahme wird jetzt geprüft. Das dauert nur einen Moment.',
        requiresReview: true,
        duplicateCheck: { isDuplicate: false, duplicateCount: 0, isSuspicious: false },
        deviceStats
      };
    }

    // 20-Minuten-Maximaldauer prüfen
    if (duration > this.limits.maxAudioDuration) {
      return {
        allowed: true, // Erlauben, aber zur Review
        reason: 'Aufnahme länger als 20 Minuten - Sicherheitsprüfung erforderlich',
        requiresReview: true,
        duplicateCheck: { isDuplicate: false, duplicateCount: 0, isSuspicious: false },
        deviceStats
      };
    }

    // Duplikat-Check
    const duplicateCheck = this.checkDuplicates(deviceStats, fileHash);

    // TEMPORÄR: Alle Uploads zur Warteschlange für Testing
    // TODO: Entfernen nach Tests
    const forceReview = true; // Setze auf false, um normale Logik zu verwenden

    // Entscheidung treffen
    const requiresReview = forceReview || duplicateCheck.isSuspicious || rateLimitCheck.requiresReview;
    const allowed = !forceReview && rateLimitCheck.allowed && !duplicateCheck.isSuspicious;

    return {
      allowed,
      reason: allowed ? undefined : (forceReview ? 'Deine Aufnahme wird jetzt geprüft. Das dauert nur einen Moment.' : (rateLimitCheck.reason || 'Suspicious duplicate uploads')),
      requiresReview,
      duplicateCheck,
      deviceStats
    };
  }

  /**
   * Aktualisiert Device-Stats nach erfolgreichem Upload
   */
  public updateDeviceStatsAfterUpload(deviceStats: DeviceStats, fileHash: string, duration: number): void {
    const now = new Date();
    
    // Upload-Zähler aktualisieren
    deviceStats.uploads30Min++;
    deviceStats.uploadsToday++;
    deviceStats.audioMinutesToday += Math.round(duration / 60);
    
    // Timestamps aktualisieren
    deviceStats.lastUpload30Min = now;
    deviceStats.lastUploadToday = now;
    
    // File-Hash zählen
    deviceStats.fileHashes[fileHash] = (deviceStats.fileHashes[fileHash] || 0) + 1;
    
    // Stats speichern
    this.deviceStats.set(deviceStats.deviceId, deviceStats);
    
    // In localStorage persistieren
    this.persistDeviceStats(deviceStats);
  }

  /**
   * Prüft Rate-Limits
   */
  private checkRateLimits(deviceStats: DeviceStats, duration: number): {
    allowed: boolean;
    reason?: string;
    requiresReview: boolean;
  } {
    const now = new Date();
    
    console.log('🔐 Rate Limit Check:', {
      uploads30Min: deviceStats.uploads30Min,
      uploadsToday: deviceStats.uploadsToday,
      audioMinutesToday: deviceStats.audioMinutesToday,
      durationMinutes: Math.round(duration / 60),
      lastUpload30Min: deviceStats.lastUpload30Min,
      lastUploadToday: deviceStats.lastUploadToday
    });
    
    // 30-Minuten-Limit prüfen
    if (deviceStats.lastUpload30Min) {
      const timeDiff30Min = (now.getTime() - deviceStats.lastUpload30Min.getTime()) / (1000 * 60);
      console.log('🔐 30min check - timeDiff:', timeDiff30Min, 'minutes');
      
                if (timeDiff30Min < 30) {
                  if (deviceStats.uploads30Min >= this.limits.maxUploadsPer30Min) {
                    console.log('❌ 30min rate limit exceeded');
                    return {
                      allowed: false,
                      reason: 'Upload-Frequenz überschritten - Aufnahme wird in Warteschlange aufgenommen',
                      requiresReview: true
                    };
                  }
                } else {
        // 30-Minuten-Zähler zurücksetzen
        console.log('🔄 Resetting 30min counter');
        deviceStats.uploads30Min = 0;
        deviceStats.lastUpload30Min = null;
      }
    }

    // Tages-Limit prüfen
    if (deviceStats.lastUploadToday) {
      const timeDiffToday = (now.getTime() - deviceStats.lastUploadToday.getTime()) / (1000 * 60 * 60 * 24);
      console.log('🔐 Daily check - timeDiff:', timeDiffToday, 'days');
      
                if (timeDiffToday < 1) {
                  if (deviceStats.uploadsToday >= this.limits.maxUploadsPerDay) {
                    console.log('❌ Daily upload limit exceeded');
                    return {
                      allowed: false,
                      reason: 'Tages-Limit überschritten - Aufnahme wird in Warteschlange aufgenommen',
                      requiresReview: true
                    };
                  }
        
        const newAudioMinutes = deviceStats.audioMinutesToday + Math.round(duration / 60);
        if (newAudioMinutes > this.limits.maxAudioMinutesPerDay) {
          console.log('❌ Daily audio limit exceeded:', newAudioMinutes, '>', this.limits.maxAudioMinutesPerDay);
          return {
            allowed: false,
            reason: 'Audio-Minuten-Limit überschritten - Aufnahme wird in Warteschlange aufgenommen',
            requiresReview: true
          };
        }
      } else {
        // Tages-Zähler zurücksetzen
        console.log('🔄 Resetting daily counters');
        deviceStats.uploadsToday = 0;
        deviceStats.audioMinutesToday = 0;
        deviceStats.lastUploadToday = null;
      }
    }

    console.log('✅ Rate limits passed');
    return { allowed: true, requiresReview: false };
  }

  /**
   * Prüft auf Duplikate
   */
  private checkDuplicates(deviceStats: DeviceStats, fileHash: string): DuplicateCheck {
    const duplicateCount = deviceStats.fileHashes[fileHash] || 0;
    const isDuplicate = duplicateCount > 0;
    const isSuspicious = duplicateCount >= this.limits.maxDuplicateCount;

    return {
      isDuplicate,
      duplicateCount,
      isSuspicious
    };
  }

  /**
   * Erstellt neue Device-Stats
   */
  private createNewDeviceStats(deviceId: string): DeviceStats {
    return {
      deviceId,
      uploads30Min: 0,
      uploadsToday: 0,
      audioMinutesToday: 0,
      lastUpload30Min: null,
      lastUploadToday: null,
      fileHashes: {},
      lastReset: new Date()
    };
  }

  /**
   * Persistiert Device-Stats in localStorage
   */
  private persistDeviceStats(deviceStats: DeviceStats): void {
    try {
      const key = `aural_device_stats_${deviceStats.deviceId}`;
      localStorage.setItem(key, JSON.stringify(deviceStats));
    } catch (error) {
      console.warn('Failed to persist device stats:', error);
    }
  }

  /**
   * Lädt Device-Stats aus localStorage
   */
  private loadDeviceStats(deviceId: string): DeviceStats | null {
    try {
      const key = `aural_device_stats_${deviceId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const stats = JSON.parse(data);
        // Konvertiere Date-Strings zurück zu Date-Objekten
        if (stats.lastUpload30Min) stats.lastUpload30Min = new Date(stats.lastUpload30Min);
        if (stats.lastUploadToday) stats.lastUploadToday = new Date(stats.lastUploadToday);
        if (stats.lastReset) stats.lastReset = new Date(stats.lastReset);
        return stats;
      }
    } catch (error) {
      console.warn('Failed to load device stats:', error);
    }
    return null;
  }

  /**
   * Bereinigt alte Daten (30 Tage)
   */
  private cleanupOldData(): void {
    // Verwende das zentrale Data-Retention-System
    dataRetentionManager.forceCleanup();
  }

  /**
   * Setzt Limits (für Admin)
   */
  public setLimits(limits: Partial<UploadLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  /**
   * Gibt aktuelle Limits zurück
   */
  public getLimits(): UploadLimits {
    return { ...this.limits };
  }
}

// Singleton-Instanz exportieren
export const uploadSecurityManager = UploadSecurityManager.getInstance();
