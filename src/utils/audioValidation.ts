// Audio Validation Utilities
export const validateAudioBlob = (blob: Blob): boolean => {
  if (!blob || !(blob instanceof Blob)) {
    return false;
  }
  
  if (blob.size === 0) {
    return false;
  }
  
  if (!blob.type.startsWith('audio/')) {
    return false;
  }
  
  return true;
};

export const isValidAudioFile = (file: File): boolean => {
  if (!file || !(file instanceof File)) {
    return false;
  }
  
  if (file.size === 0) {
    return false;
  }
  
  // Prüfe auf unterstützte Audio-Formate
  const supportedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    'audio/aac',
    'audio/webm'
  ];
  
  if (!supportedTypes.includes(file.type)) {
    return false;
  }
  
  // Prüfe Dateigröße (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return false;
  }
  
  return true;
};

export const validateAudioFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file || !(file instanceof File)) {
    return { isValid: false, error: 'Keine gültige Datei ausgewählt' };
  }
  
  if (file.size === 0) {
    return { isValid: false, error: 'Die Datei ist leer' };
  }
  
  // Prüfe auf unterstützte Audio-Formate
  const supportedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    'audio/aac',
    'audio/webm'
  ];
  
  if (!supportedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Nicht unterstütztes Audio-Format. Unterstützte Formate: ${supportedTypes.join(', ')}` 
    };
  }
  
  // Prüfe Dateigröße (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `Datei zu groß. Maximum: ${Math.round(maxSize / (1024 * 1024))}MB` 
    };
  }
  
  return { isValid: true };
};

export const repairAudioBlob = (blob: Blob): Blob | null => {
  if (!validateAudioBlob(blob)) {
    return null;
  }
  
  // Einfache Reparatur: Blob als Audio/MP3 markieren falls Typ fehlt
  if (!blob.type || blob.type === 'application/octet-stream') {
    return new Blob([blob], { type: 'audio/mpeg' });
  }
  
  return blob;
};
