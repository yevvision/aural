/**
 * URL Uniqueness Test - Testet die Einzigartigkeit der Audio-URLs
 * 
 * Diese Datei enthält Test-Funktionen, um sicherzustellen, dass jedes Audio
 * eine einzigartige URL erhält.
 */

import { AudioUrlManager } from '../services/audioUrlManager';

export interface UrlUniquenessTestResult {
  totalTests: number;
  uniqueUrls: number;
  duplicateUrls: number;
  success: boolean;
  details: {
    generatedUrls: string[];
    duplicates: string[];
    stats: {
      totalUrls: number;
      uniqueUrls: number;
      expiredUrls: number;
      cacheSize: number;
    };
  };
}

/**
 * Testet die Einzigartigkeit der generierten URLs
 */
export async function testUrlUniqueness(testCount: number = 100): Promise<UrlUniquenessTestResult> {
  console.log(`🧪 Testing URL uniqueness with ${testCount} URLs...`);
  
  const generatedUrls: string[] = [];
  const duplicateUrls: string[] = [];
  const testBlob = new Blob(['test audio data'], { type: 'audio/wav' });
  
  // Generiere URLs
  for (let i = 0; i < testCount; i++) {
    const trackId = `test_track_${i}`;
    const url = await AudioUrlManager.storeAudioUrl(trackId, testBlob, 'unique');
    generatedUrls.push(url);
  }
  
  // Prüfe auf Duplikate
  const uniqueUrls = new Set(generatedUrls);
  const duplicates = generatedUrls.filter((url, index) => generatedUrls.indexOf(url) !== index);
  
  // Sammle Statistiken
  const stats = AudioUrlManager.getUrlStats();
  
  const result: UrlUniquenessTestResult = {
    totalTests: testCount,
    uniqueUrls: uniqueUrls.size,
    duplicateUrls: duplicates.length,
    success: duplicates.length === 0,
    details: {
      generatedUrls,
      duplicates,
      stats
    }
  };
  
  console.log('🧪 URL Uniqueness Test Results:', {
    totalTests: result.totalTests,
    uniqueUrls: result.uniqueUrls,
    duplicateUrls: result.duplicateUrls,
    success: result.success,
    stats: result.details.stats
  });
  
  // Bereinige Test-Daten
  for (let i = 0; i < testCount; i++) {
    AudioUrlManager.clearTrackUrls(`test_track_${i}`);
  }
  
  return result;
}

/**
 * Testet die Auflösung von einzigartigen URLs
 */
export async function testUrlResolution(testCount: number = 50): Promise<{
  success: boolean;
  resolvedUrls: number;
  failedResolutions: number;
  details: string[];
}> {
  console.log(`🔍 Testing URL resolution with ${testCount} URLs...`);
  
  const testBlob = new Blob(['test audio data'], { type: 'audio/wav' });
  const trackIds: string[] = [];
  const uniqueIds: string[] = [];
  
  // Generiere URLs
  for (let i = 0; i < testCount; i++) {
    const trackId = `resolution_test_${i}`;
    const uniqueId = await AudioUrlManager.storeAudioUrl(trackId, testBlob, 'unique');
    trackIds.push(trackId);
    uniqueIds.push(uniqueId);
  }
  
  let resolvedUrls = 0;
  let failedResolutions = 0;
  const details: string[] = [];
  
  // Teste Auflösung über Track-ID
  for (let i = 0; i < testCount; i++) {
    const url = AudioUrlManager.getAudioUrl(trackIds[i]);
    if (url) {
      resolvedUrls++;
      details.push(`✅ Track ${trackIds[i]} resolved successfully`);
    } else {
      failedResolutions++;
      details.push(`❌ Track ${trackIds[i]} failed to resolve`);
    }
  }
  
  // Teste Auflösung über einzigartige ID
  for (let i = 0; i < testCount; i++) {
    const url = AudioUrlManager.getAudioUrlByUniqueId(uniqueIds[i]);
    if (url) {
      resolvedUrls++;
      details.push(`✅ Unique ID ${uniqueIds[i]} resolved successfully`);
    } else {
      failedResolutions++;
      details.push(`❌ Unique ID ${uniqueIds[i]} failed to resolve`);
    }
  }
  
  const success = failedResolutions === 0;
  
  console.log('🔍 URL Resolution Test Results:', {
    success,
    resolvedUrls,
    failedResolutions,
    totalTests: testCount * 2 // Track-ID + Unique-ID Tests
  });
  
  // Bereinige Test-Daten
  for (let i = 0; i < testCount; i++) {
    AudioUrlManager.clearTrackUrls(trackIds[i]);
  }
  
  return {
    success,
    resolvedUrls,
    failedResolutions,
    details
  };
}

/**
 * Testet die Performance der URL-Generierung
 */
export async function testUrlPerformance(testCount: number = 1000): Promise<{
  success: boolean;
  averageTime: number;
  totalTime: number;
  details: {
    times: number[];
    minTime: number;
    maxTime: number;
  };
}> {
  console.log(`⚡ Testing URL generation performance with ${testCount} URLs...`);
  
  const testBlob = new Blob(['test audio data'], { type: 'audio/wav' });
  const times: number[] = [];
  
  const startTime = performance.now();
  
  for (let i = 0; i < testCount; i++) {
    const trackId = `perf_test_${i}`;
    const urlStartTime = performance.now();
    
    await AudioUrlManager.storeAudioUrl(trackId, testBlob, 'unique');
    
    const urlEndTime = performance.now();
    times.push(urlEndTime - urlStartTime);
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const averageTime = totalTime / testCount;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  const success = averageTime < 10; // Unter 10ms pro URL ist gut
  
  console.log('⚡ URL Performance Test Results:', {
    success,
    averageTime: averageTime.toFixed(2),
    totalTime: totalTime.toFixed(2),
    minTime: minTime.toFixed(2),
    maxTime: maxTime.toFixed(2)
  });
  
  // Bereinige Test-Daten
  for (let i = 0; i < testCount; i++) {
    AudioUrlManager.clearTrackUrls(`perf_test_${i}`);
  }
  
  return {
    success,
    averageTime,
    totalTime,
    details: {
      times,
      minTime,
      maxTime
    }
  };
}

/**
 * Führt alle Tests aus und gibt ein Gesamtergebnis zurück
 */
export async function runAllUrlTests(): Promise<{
  success: boolean;
  results: {
    uniqueness: UrlUniquenessTestResult;
    resolution: Awaited<ReturnType<typeof testUrlResolution>>;
    performance: Awaited<ReturnType<typeof testUrlPerformance>>;
  };
  summary: string;
}> {
  console.log('🚀 Running all URL tests...');
  
  const [uniqueness, resolution, performance] = await Promise.all([
    testUrlUniqueness(100),
    testUrlResolution(50),
    testUrlPerformance(1000)
  ]);
  
  const success = uniqueness.success && resolution.success && performance.success;
  
  const summary = `
🧪 URL Tests Summary:
- Uniqueness: ${uniqueness.success ? '✅ PASS' : '❌ FAIL'} (${uniqueness.uniqueUrls}/${uniqueness.totalTests} unique)
- Resolution: ${resolution.success ? '✅ PASS' : '❌ FAIL'} (${resolution.resolvedUrls}/${resolution.resolvedUrls + resolution.failedResolutions} resolved)
- Performance: ${performance.success ? '✅ PASS' : '❌ FAIL'} (${performance.averageTime.toFixed(2)}ms avg)
- Overall: ${success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
  `.trim();
  
  console.log(summary);
  
  return {
    success,
    results: {
      uniqueness,
      resolution,
      performance
    },
    summary
  };
}

// Exportiere die Test-Funktionen für die Verwendung in der Konsole
if (typeof window !== 'undefined') {
  (window as any).testUrlUniqueness = testUrlUniqueness;
  (window as any).testUrlResolution = testUrlResolution;
  (window as any).testUrlPerformance = testUrlPerformance;
  (window as any).runAllUrlTests = runAllUrlTests;
}
