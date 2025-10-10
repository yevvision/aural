// Einfache Proof-of-Work Implementierung ohne externe Bibliothek
// Da Cap-Bibliothek Probleme verursacht, verwenden wir eine eigene Lösung

/**
 * Cap (Proof-of-Work) Client für Bot-Schutz
 * Generiert unsichtbar einen Proof-of-Work Token vor Upload
 */
export class CapClient {
  private static instance: CapClient;
  private isGenerating = false;

  private constructor() {}

  public static getInstance(): CapClient {
    if (!CapClient.instance) {
      CapClient.instance = new CapClient();
    }
    return CapClient.instance;
  }

  /**
   * Generiert einen Proof-of-Work Token für den Upload
   * @param fileSize Dateigröße in Bytes
   * @returns Promise<string> Proof-of-Work Token
   */
  public async generateToken(fileSize: number): Promise<string> {
    if (this.isGenerating) {
      throw new Error('Token generation already in progress');
    }

    this.isGenerating = true;

    try {
      // Proof-of-Work Konfiguration basierend auf Dateigröße
      const difficulty = this.calculateDifficulty(fileSize);
      
      console.log('🔐 Proof-of-Work: Generating token...', {
        fileSize,
        difficulty
      });

      // Simuliere Proof-of-Work durch CPU-intensive Berechnung
      const token = await this.performProofOfWork(fileSize, difficulty);

      console.log('✅ Proof-of-Work: Token generated successfully');
      return token;

    } catch (error) {
      console.error('❌ Proof-of-Work: Token generation failed:', error);
      throw new Error('Proof-of-work generation failed');
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Führt Proof-of-Work durch (CPU-intensive Berechnung)
   */
  private async performProofOfWork(fileSize: number, difficulty: number): Promise<string> {
    const timestamp = Date.now();
    const userAgent = navigator.userAgent.substring(0, 100);
    const randomSeed = Math.random().toString(36).substring(2);
    
    // Erstelle Challenge-String
    const challenge = `${timestamp}-${fileSize}-${difficulty}-${userAgent}-${randomSeed}`;
    
    // Proof-of-Work: Finde Hash mit führenden Nullen
    const targetZeros = difficulty;
    let nonce = 0;
    let hash = '';
    
    // Simuliere CPU-intensive Berechnung
    const startTime = Date.now();
    const maxTime = 2000; // Max 2 Sekunden
    
    while (Date.now() - startTime < maxTime) {
      const testString = `${challenge}-${nonce}`;
      hash = await this.simpleHash(testString);
      
      if (hash.startsWith('0'.repeat(targetZeros))) {
        break;
      }
      
      nonce++;
      
      // Yield control to prevent blocking
      if (nonce % 1000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Erstelle finalen Token
    const token = `pow_${difficulty}_${nonce}_${hash.substring(0, 16)}`;
    
    console.log(`🔐 Proof-of-Work completed: ${nonce} iterations, ${Date.now() - startTime}ms`);
    
    return token;
  }

  /**
   * Einfache Hash-Funktion für Proof-of-Work
   */
  private async simpleHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generiert einen Fallback-Token falls Cap-Bibliothek nicht verfügbar ist
   */
  private generateFallbackToken(fileSize: number, difficulty: number): string {
    const timestamp = Date.now();
    const randomData = Math.random().toString(36).substring(2);
    const userAgent = navigator.userAgent.substring(0, 50);
    
    // Einfacher Hash-basierter Token
    const tokenData = `${timestamp}-${fileSize}-${difficulty}-${randomData}-${userAgent}`;
    const hash = btoa(tokenData).replace(/[^a-zA-Z0-9]/g, '');
    
    return `cap_fallback_${hash}`;
  }

  /**
   * Berechnet die Schwierigkeit basierend auf Dateigröße
   * Größere Dateien = höhere Schwierigkeit
   */
  private calculateDifficulty(fileSize: number): number {
    // Basis-Schwierigkeit
    let difficulty = 1;

    // Erhöhe Schwierigkeit basierend auf Dateigröße
    if (fileSize > 10 * 1024 * 1024) { // > 10MB
      difficulty = 3;
    } else if (fileSize > 5 * 1024 * 1024) { // > 5MB
      difficulty = 2;
    }

    return difficulty;
  }

  /**
   * Validiert einen Cap-Token (Client-seitig)
   * @param token Cap-Token
   * @returns boolean
   */
  public validateToken(token: string): boolean {
    try {
      // Einfache Validierung - echte Validierung passiert server-seitig
      return typeof token === 'string' && token.length > 0;
    } catch {
      return false;
    }
  }
}

// Singleton-Instanz exportieren
export const capClient = CapClient.getInstance();
