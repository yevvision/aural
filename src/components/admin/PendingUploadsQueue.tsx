import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Shield, 
  AlertTriangle,
  Play,
  Download,
  Trash2,
  User,
  Calendar,
  FileText,
  HardDrive,
  Pause,
  PlayCircle
} from 'lucide-react';
import DatabaseService from '../../services/databaseService';
import { useActivityStore } from '../../stores/activityStore';
import { useDatabase } from '../../hooks/useDatabase';

export interface PendingUpload {
  uploadId: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  title: string;
  description: string;
  gender?: string;
  tags: string[];
  uploadedAt: string;
  status: 'pending_review';
  reason: string;
  duplicateCount: number;
  deviceId: string;
  userId: string;
  username: string;
  duration?: number; // Audio-Dauer in Sekunden
}

interface PendingUploadsQueueProps {
  onUploadProcessed: (uploadId: string, action: 'approve' | 'reject') => void;
}

export const PendingUploadsQueue = ({ onUploadProcessed }: PendingUploadsQueueProps) => {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState<PendingUpload | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isAutoApproveActive, setIsAutoApproveActive] = useState<boolean>(false);
  const { addActivity } = useActivityStore();
  const { addUserActivity, addNotification } = useDatabase();

  // Hilfsfunktion: Lade Audio aus allen verfügbaren Managern
  const loadAudioFromManagers = async (trackId: string): Promise<string | null> => {
    try {
      // 1. Versuche UnifiedAudioManager
      const { unifiedAudioManager } = await import('../../services/unifiedAudioManager');
      const unifiedResult = await unifiedAudioManager.loadAudioForPlayback({ id: trackId } as any);
      if (unifiedResult.success && unifiedResult.url) {
        console.log('✅ Fallback: Audio aus UnifiedAudioManager geladen');
        return unifiedResult.url;
      }
    } catch (error) {
      console.log('❌ UnifiedAudioManager Fallback fehlgeschlagen:', error);
    }

    try {
      // 2. Versuche CentralAudioManager
      const { centralAudioManager } = await import('../../services/centralAudioManager');
      const centralUrl = await centralAudioManager.loadAudioForPlayback({ id: trackId } as any);
      if (centralUrl) {
        console.log('✅ Fallback: Audio aus CentralAudioManager geladen');
        return centralUrl;
      }
    } catch (error) {
      console.log('❌ CentralAudioManager Fallback fehlgeschlagen:', error);
    }

    try {
      // 3. Versuche AudioUrlManager
      const { AudioUrlManager } = await import('../../services/audioUrlManager');
      const urlManagerUrl = AudioUrlManager.getAudioUrl(trackId);
      if (urlManagerUrl) {
        console.log('✅ Fallback: Audio aus AudioUrlManager geladen');
        return urlManagerUrl;
      }
    } catch (error) {
      console.log('❌ AudioUrlManager Fallback fehlgeschlagen:', error);
    }

    console.log('❌ Alle Fallback-Versuche fehlgeschlagen');
    return null;
  };

  // Lade pending Uploads und Auto-Approve-Status
  useEffect(() => {
    loadPendingUploads();
    loadAutoApproveStatus();
  }, []);

  // Lade Auto-Approve-Status aus localStorage
  const loadAutoApproveStatus = () => {
    try {
      const savedStatus = localStorage.getItem('aural_queue_paused');
      if (savedStatus !== null) {
        setIsAutoApproveActive(JSON.parse(savedStatus));
      }
    } catch (error) {
      console.error('Failed to load auto approve status:', error);
    }
  };

  // Speichere Auto-Approve-Status in localStorage
  const saveAutoApproveStatus = (active: boolean) => {
    try {
      localStorage.setItem('aural_queue_paused', JSON.stringify(active));
      console.log('✅ Auto approve status saved:', active);
    } catch (error) {
      console.error('Failed to save auto approve status:', error);
    }
  };

  // Toggle Auto-Approve-Status
  const toggleAutoApprove = () => {
    const newAutoApproveStatus = !isAutoApproveActive;
    setIsAutoApproveActive(newAutoApproveStatus);
    saveAutoApproveStatus(newAutoApproveStatus);
    
    // Trigger global event für andere Komponenten
    window.dispatchEvent(new CustomEvent('queuePauseStatusChanged', { 
      detail: { isPaused: newAutoApproveStatus } 
    }));
    
    console.log(`🔄 Auto-Approve ${newAutoApproveStatus ? 'aktiviert' : 'deaktiviert'}`);
  };

  const loadPendingUploads = async () => {
    try {
      setLoading(true);
      
      // Lade echte pending Uploads aus localStorage
      const pendingUploadsData = localStorage.getItem('aural_pending_uploads');
      console.log('🔍 DEBUG: Raw localStorage data:', pendingUploadsData);
      
      if (pendingUploadsData) {
        const uploads = JSON.parse(pendingUploadsData);
        console.log('🔍 DEBUG: Parsed uploads object:', uploads);
        
        const pendingList = Object.values(uploads).filter((upload: any) => 
          upload.status === 'pending_review'
        ) as PendingUpload[];
        
        console.log('🔍 DEBUG: Filtered pending list:', pendingList);
        setPendingUploads(pendingList);
        console.log('📋 Loaded pending uploads:', pendingList.length);
      } else {
        console.log('🔍 DEBUG: No pending uploads data found in localStorage');
        setPendingUploads([]);
      }
    } catch (error) {
      console.error('Failed to load pending uploads:', error);
      setPendingUploads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uploadId: string) => {
    try {
      console.log('Approving upload:', uploadId);
      
      // Finde den Upload in der Liste
      const uploadToApprove = pendingUploads.find(upload => upload.uploadId === uploadId);
      if (!uploadToApprove) {
        console.error('Upload not found:', uploadId);
        return;
      }

      // Konvertiere Blob-URL zu Base64 für persistente Speicherung
      let audioDataUrl = uploadToApprove.url;
      let audioBlob: Blob | null = null;
      
      // Lade Audio-Daten für persistente Speicherung (Server-URL oder Blob-URL)
      if (uploadToApprove.url && !uploadToApprove.url.startsWith('data:')) {
        try {
          console.log('🔄 Lade Audio-Daten für Manager-Speicherung...', uploadToApprove.url);
          
          // Lade Audio-Daten aus der URL (Server-URL oder Blob-URL)
          const response = await fetch(uploadToApprove.url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          audioBlob = await response.blob();
          console.log('📦 Audio-Blob erhalten:', {
            size: audioBlob.size,
            type: audioBlob.type,
            isBlob: audioBlob instanceof Blob
          });
          
          // Prüfe ob Blob echte Audio-Daten enthält
          if (audioBlob.size < 1000) {
            console.warn('⚠️ Blob ist sehr klein, möglicherweise keine echten Audio-Daten');
          }
          
          // Konvertiere zu Base64 für persistente Speicherung
          audioDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              console.log('✅ Base64-URL erstellt:', {
                length: result.length,
                startsWithData: result.startsWith('data:'),
                first100Chars: result.substring(0, 100),
                isAudioData: result.includes('audio/')
              });
              
              // Prüfe ob Base64-URL echte Audio-Daten enthält
              if (result.length < 1000) {
                console.warn('⚠️ Base64-URL ist sehr kurz, möglicherweise keine echten Audio-Daten');
              }
              
              resolve(result);
            };
            reader.onerror = (error) => {
              console.error('❌ FileReader Fehler:', error);
              reject(error);
            };
            reader.readAsDataURL(audioBlob);
          });
          
          console.log('✅ Audio-Daten erfolgreich geladen und konvertiert');
        } catch (error) {
          console.error('❌ Fehler beim Laden der Audio-Daten:', error);
          // Fallback: Versuche Audio aus anderen Quellen zu laden
          console.log('⚠️ Versuche Fallback-Loading aus anderen Quellen...');
          
          try {
            // Versuche Audio aus localStorage oder anderen Speichern zu laden
            const fallbackUrl = await loadAudioFromManagers(uploadId);
            if (fallbackUrl) {
              console.log('✅ Fallback-URL gefunden:', fallbackUrl.substring(0, 100));
              audioDataUrl = fallbackUrl;
            } else {
              console.log('⚠️ Keine Fallback-URL gefunden, verwende ursprüngliche URL');
            }
          } catch (fallbackError) {
            console.error('❌ Fallback-Loading fehlgeschlagen:', fallbackError);
            console.log('⚠️ Verwende ursprüngliche URL als letzten Fallback');
          }
        }
      } else {
        console.log('ℹ️ URL ist bereits Base64:', uploadToApprove.url?.substring(0, 50));
        audioDataUrl = uploadToApprove.url;
      }

      // Konvertiere PendingUpload zu AudioTrack
      const approvedTrack = {
        id: uploadId,
        title: uploadToApprove.title,
        description: uploadToApprove.description,
        url: audioDataUrl, // Base64-URL für persistente Wiedergabe
        duration: uploadToApprove.duration || 0,
        user: {
          id: uploadToApprove.userId,
          username: uploadToApprove.username,
          email: '', // Fallback
          avatar: '', // Fallback
          totalLikes: 0,
          totalUploads: 0,
          createdAt: new Date(),
          isAdmin: false
        },
        likes: 0,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(), // Verwende aktuelles Datum für freigegebene Tracks
        tags: uploadToApprove.tags,
        gender: uploadToApprove.gender as 'Female' | 'Male' | 'Mixed' | 'Couple' | 'Diverse',
        filename: uploadToApprove.filename,
        fileSize: uploadToApprove.size,
        format: uploadToApprove.mimeType,
        status: 'active' as const // Setze Status auf 'active' nach der Freigabe
      };

      // WICHTIG: Speichere Audio in allen Audio-Managern für persistente Wiedergabe
      if (audioBlob) {
        console.log('🎵 Speichere Audio in allen Audio-Managern...');
        
        try {
          // 1. Speichere in UnifiedAudioManager (empfohlen)
          const { unifiedAudioManager } = await import('../../services/unifiedAudioManager');
          const unifiedResult = await unifiedAudioManager.storeNewAudio(uploadId, audioBlob, {
            title: uploadToApprove.title,
            duration: uploadToApprove.duration
          });
          
          if (unifiedResult.success) {
            console.log('✅ UnifiedAudioManager: Audio gespeichert');
            // Verwende die URL vom UnifiedAudioManager
            approvedTrack.url = unifiedResult.url!;
          } else {
            console.warn('⚠️ UnifiedAudioManager: Fehler beim Speichern:', unifiedResult.error);
          }
        } catch (error) {
          console.error('❌ UnifiedAudioManager: Fehler:', error);
        }
        
        try {
          // 2. Speichere auch in CentralAudioManager als Backup
          const { centralAudioManager } = await import('../../services/centralAudioManager');
          await centralAudioManager.storeNewAudio(uploadId, audioBlob);
          console.log('✅ CentralAudioManager: Audio gespeichert');
        } catch (error) {
          console.error('❌ CentralAudioManager: Fehler:', error);
        }
        
        try {
          // 3. Speichere auch in AudioUrlManager für Kompatibilität
          const { AudioUrlManager } = await import('../../services/audioUrlManager');
          await AudioUrlManager.storeAudioUrl(uploadId, audioBlob, 'base64');
          console.log('✅ AudioUrlManager: Audio gespeichert');
        } catch (error) {
          console.error('❌ AudioUrlManager: Fehler:', error);
        }
        
        console.log('🎵 Audio-Manager-Speicherung abgeschlossen');
      } else {
        console.warn('⚠️ Kein Audio-Blob verfügbar für Manager-Speicherung');
        
        // Versuche trotzdem, Audio aus anderen Quellen zu laden und zu speichern
        console.log('🔄 Versuche Audio aus anderen Quellen zu laden...');
        try {
          const fallbackUrl = await loadAudioFromManagers(uploadId);
          if (fallbackUrl) {
            console.log('✅ Fallback-URL gefunden, speichere in Managern...');
            
            // Konvertiere Fallback-URL zu Blob für Manager-Speicherung
            if (fallbackUrl.startsWith('data:')) {
              // Base64-URL zu Blob konvertieren
              const { AudioUrlManager } = await import('../../services/audioUrlManager');
              const fallbackBlob = AudioUrlManager.base64ToBlob(fallbackUrl);
              if (fallbackBlob) {
                // Speichere in UnifiedAudioManager
                const { unifiedAudioManager } = await import('../../services/unifiedAudioManager');
                const unifiedResult = await unifiedAudioManager.storeNewAudio(uploadId, fallbackBlob, {
                  title: uploadToApprove.title,
                  duration: uploadToApprove.duration
                });
                
                if (unifiedResult.success) {
                  console.log('✅ Fallback-Audio in UnifiedAudioManager gespeichert');
                  approvedTrack.url = unifiedResult.url!;
                }
              }
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback-Loading fehlgeschlagen:', fallbackError);
        }
      }

      // Speichere als normalen Track in der zentralen Datenbank
      const success = DatabaseService.addTrack(approvedTrack);
      
      if (!success) {
        console.error('Failed to add track to central database');
        return;
      }

      // Zusätzlich: Speichere auch in localStorage für Backup (zentrale DB verwendet 'aural-central-database')
      try {
        const centralDBData = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
        if (!Array.isArray(centralDBData.tracks)) {
          centralDBData.tracks = [];
        }
        centralDBData.tracks.push(approvedTrack);
        localStorage.setItem('aural-central-database', JSON.stringify(centralDBData));
        console.log('✅ Track auch in localStorage gespeichert');
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }

      // Debug: Überprüfe ob Track korrekt gespeichert wurde
      const savedTrack = DatabaseService.getTrack(approvedTrack.id);
      console.log('🔍 Debug: Gespeicherter Track:', {
        id: savedTrack?.id,
        title: savedTrack?.title,
        hasUrl: !!savedTrack?.url,
        urlType: savedTrack?.url ? (savedTrack.url.startsWith('data:') ? 'Base64' : 'Blob') : 'No URL',
        urlLength: savedTrack?.url?.length || 0,
        urlFirst100Chars: savedTrack?.url ? savedTrack.url.substring(0, 100) : 'No URL',
        createdAt: savedTrack?.createdAt
      });
      
      // Zusätzlicher Test: Versuche Audio-Element zu erstellen
      if (savedTrack?.url) {
        try {
          const testAudio = new Audio();
          testAudio.src = savedTrack.url;
          testAudio.addEventListener('loadstart', () => {
            console.log('✅ Test-Audio loadstart erfolgreich');
          });
          testAudio.addEventListener('loadedmetadata', () => {
            console.log('✅ Test-Audio loadedmetadata erfolgreich, Duration:', testAudio.duration);
          });
          testAudio.addEventListener('error', (e) => {
            console.error('❌ Test-Audio Fehler:', e, 'Error Code:', testAudio.error?.code);
            
            // Fallback: Versuche Audio aus den Managern zu laden
            console.log('🔄 Versuche Fallback-Loading aus Audio-Managern...');
            loadAudioFromManagers(uploadId).then(fallbackUrl => {
              if (fallbackUrl) {
                console.log('✅ Fallback-URL gefunden:', fallbackUrl.substring(0, 100));
                // Aktualisiere den Track mit der Fallback-URL
                const updatedTrack = { ...savedTrack, url: fallbackUrl };
                DatabaseService.updateTrack(uploadId, updatedTrack);
              }
            });
          });
          testAudio.load();
        } catch (error) {
          console.error('❌ Fehler beim Testen der Audio-URL:', error);
        }
      }

      console.log('✅ Track erfolgreich zur zentralen Datenbank hinzugefügt:', approvedTrack.title);

      // Entferne aus Pending-Liste
      setPendingUploads(prev => prev.filter(upload => upload.uploadId !== uploadId));
      
      // Entferne aus Pending-Uploads
      const pendingUploadsData = JSON.parse(localStorage.getItem('aural_pending_uploads') || '{}');
      delete pendingUploadsData[uploadId];
      localStorage.setItem('aural_pending_uploads', JSON.stringify(pendingUploadsData));

      // WICHTIG: Trigger globale Aktualisierung
      window.dispatchEvent(new CustomEvent('trackApproved', { 
        detail: { trackId: approvedTrack.id, track: approvedTrack } 
      }));

        // Erstelle Upload-Aktivität für den User (My Activities)
        console.log('🔔 Creating upload activity for user:', uploadToApprove.userId);
        
        const uploadActivitySuccess = addUserActivity({
          type: 'my_upload',
          userId: uploadToApprove.userId,
          trackId: approvedTrack.id,
          trackTitle: approvedTrack.title,
          trackUser: approvedTrack.user,
          createdAt: new Date(),
          isRead: false
        });
        
        console.log('🔔 Upload activity created successfully:', uploadActivitySuccess);
        
        // Erstelle Benachrichtigung für den User (Notifications)
        console.log('🔔 Creating notification for user:', uploadToApprove.userId);
        
        const notificationSuccess = addNotification({
          type: 'upload_approved',
          user: {
            id: 'admin',
            username: 'Admin',
            email: '',
            avatar: '',
            totalLikes: 0,
            totalUploads: 0,
            createdAt: new Date(),
            isAdmin: true
          },
          trackId: approvedTrack.id,
          trackTitle: approvedTrack.title,
          targetUserId: uploadToApprove.userId
        });
        
        console.log('🔔 Notification created successfully:', notificationSuccess);

      console.log('✅ Upload approved and converted to track:', approvedTrack.title);
      
      onUploadProcessed(uploadId, 'approve');
      setShowDetails(false);
      setSelectedUpload(null);
    } catch (error) {
      console.error('Failed to approve upload:', error);
    }
  };

  const handleReject = async (uploadId: string) => {
    try {
      console.log('Rejecting upload:', uploadId);
      
      // Finde den Upload in der Liste
      const uploadToReject = pendingUploads.find(upload => upload.uploadId === uploadId);
      if (!uploadToReject) {
        console.error('Upload not found:', uploadId);
        return;
      }
      
      // Entferne aus Pending-Liste
      setPendingUploads(prev => prev.filter(upload => upload.uploadId !== uploadId));
      
      // Entferne aus Pending-Uploads
      const pendingUploadsData = JSON.parse(localStorage.getItem('aural_pending_uploads') || '{}');
      delete pendingUploadsData[uploadId];
      localStorage.setItem('aural_pending_uploads', JSON.stringify(pendingUploadsData));

      // Erstelle Upload-Rejection-Aktivität für den User (My Activities)
      console.log('🔔 Creating upload rejection activity for user:', uploadToReject.userId);
      
      const uploadRejectionActivitySuccess = addUserActivity({
        type: 'my_upload_rejected',
        userId: uploadToReject.userId,
        trackId: uploadId,
        trackTitle: uploadToReject.title,
        trackUser: {
          id: uploadToReject.userId,
          username: uploadToReject.username,
          email: '',
          avatar: '',
          totalLikes: 0,
          totalUploads: 0,
          createdAt: new Date(),
          isAdmin: false
        },
        createdAt: new Date(),
        isRead: false
      });
      
      console.log('🔔 Upload rejection activity created successfully:', uploadRejectionActivitySuccess);
      
      // Erstelle Benachrichtigung für den User (Notifications)
      console.log('🔔 Creating rejection notification for user:', uploadToReject.userId);
      
      const rejectionNotificationSuccess = addNotification({
        type: 'upload_rejected',
        user: {
          id: 'admin',
          username: 'Admin',
          email: '',
          avatar: '',
          totalLikes: 0,
          totalUploads: 0,
          createdAt: new Date(),
          isAdmin: true
        },
        trackId: uploadId,
        trackTitle: uploadToReject.title,
        targetUserId: uploadToReject.userId
      });
      
      console.log('🔔 Rejection notification created successfully:', rejectionNotificationSuccess);

      console.log('❌ Upload rejected and removed:', uploadId);
      
      onUploadProcessed(uploadId, 'reject');
      setShowDetails(false);
      setSelectedUpload(null);
    } catch (error) {
      console.error('Failed to reject upload:', error);
    }
  };

  const handlePlayAudio = (upload: PendingUpload) => {
    if (playingAudio === upload.uploadId) {
      // Stop current audio
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }
      setPlayingAudio(null);
      setAudioRef(null);
    } else {
      // Stop any currently playing audio
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }
      
      // Start new audio (Blob-URL sollte funktionieren)
      if (upload.url) {
        const audio = new Audio(upload.url);
        audio.play();
        setPlayingAudio(upload.uploadId);
        setAudioRef(audio);
        
        audio.onended = () => {
          setPlayingAudio(null);
          setAudioRef(null);
        };
        
        audio.onerror = () => {
          console.error('Audio playback error:', upload.uploadId);
          setPlayingAudio(null);
          setAudioRef(null);
        };
      } else {
        console.error('No audio URL available for upload:', upload.uploadId);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unbekannt';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getReasonIcon = (reason: string) => {
    if (reason.includes('kurz') || reason.includes('short')) return <Clock className="w-3 h-3" />;
    if (reason.includes('duplicate') || reason.includes('Duplikat')) return <AlertTriangle className="w-3 h-3" />;
    if (reason.includes('rate') || reason.includes('limit')) return <Shield className="w-3 h-3" />;
    return <AlertTriangle className="w-3 h-3" />;
  };

  const getReasonColor = (reason: string) => {
    if (reason.includes('kurz') || reason.includes('short')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (reason.includes('duplicate') || reason.includes('Duplikat')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (reason.includes('rate') || reason.includes('limit')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-400">Lade Warteschlange...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Warteschlange ({pendingUploads.length})
          </h2>
          <p className="text-gray-400">
            {pendingUploads.length === 0 
              ? 'Keine Uploads in der Warteschlange' 
              : `${pendingUploads.length} Upload${pendingUploads.length === 1 ? '' : 's'} wartet${pendingUploads.length === 1 ? '' : 'en'} auf Freigabe`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Auto Approve Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAutoApprove}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 border ${
                isAutoApproveActive
                  ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30'
              }`}
              title={isAutoApproveActive ? 'Auto-Freigabe deaktivieren' : 'Auto-Freigabe aktivieren'}
            >
              {isAutoApproveActive ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Auto-Freigabe</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Manuelle Freigabe</span>
                </>
              )}
            </button>
            
            {isAutoApproveActive && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-medium">Aktiv</span>
              </div>
            )}
          </div>
          
          {pendingUploads.length > 0 && !isAutoApproveActive && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-sm font-medium">
                {pendingUploads.length} wartet{pendingUploads.length === 1 ? '' : 'en'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Uploads List */}
      {pendingUploads.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">Keine Uploads in der Warteschlange</h3>
          <p className="text-gray-500">Alle Uploads wurden bereits bearbeitet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUploads.map((upload, index) => (
            <motion.div
              key={upload.uploadId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Titel und Grund */}
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-medium text-orange-500">
                      {upload.title}
                    </h3>
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getReasonColor(upload.reason)}`}>
                      {getReasonIcon(upload.reason)}
                      <span>{upload.reason}</span>
                    </div>
                  </div>
                  
                  {/* Uploader Info */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-400">
                      <User className="w-4 h-4 inline mr-1" />
                      <span className="text-gray-500">Upload von:</span> 
                      <span className="text-orange-500 font-medium ml-1">{upload.username}</span>
                      <span className="text-gray-500 ml-2">(ID: {upload.userId})</span>
                    </p>
                  </div>

                  {/* Detaillierte Informationen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-400 mb-4">
                    <div>
                      <span className="text-gray-500 flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        Datei:
                      </span>
                      <p className="text-white">{upload.originalName}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 flex items-center">
                        <HardDrive className="w-4 h-4 mr-1" />
                        Größe:
                      </span>
                      <p className="text-white">{formatFileSize(upload.size)}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Dauer:
                      </span>
                      <p className="text-white">{formatDuration(upload.duration)}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Hochgeladen:
                      </span>
                      <p className="text-white">{new Date(upload.uploadedAt).toLocaleString('de-DE')}</p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <span className="text-gray-500">Beschreibung:</span>
                      <p className="text-white">{upload.description || 'Keine Beschreibung'}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {upload.tags && upload.tags.length > 0 && (
                    <div className="mb-4">
                      <span className="text-gray-500 text-sm">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {upload.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  {/* Play Button */}
                  <button
                    onClick={() => handlePlayAudio(upload)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      playingAudio === upload.uploadId
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30'
                    }`}
                    title={playingAudio === upload.uploadId ? 'Stoppen' : 'Abspielen'}
                  >
                    <Play className={`w-4 h-4 ${playingAudio === upload.uploadId ? 'hidden' : 'block'}`} />
                    <XCircle className={`w-4 h-4 ${playingAudio === upload.uploadId ? 'block' : 'hidden'}`} />
                  </button>

                  {/* Approve Button */}
                  <button
                    onClick={() => handleApprove(upload.uploadId)}
                    className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-all duration-200"
                    title="Freigeben"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>

                  {/* Reject Button */}
                  <button
                    onClick={() => handleReject(upload.uploadId)}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all duration-200"
                    title="Ablehnen"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>

                  {/* Details Button */}
                  <button
                    onClick={() => {
                      setSelectedUpload(upload);
                      setShowDetails(true);
                    }}
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all duration-200"
                    title="Details anzeigen"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Upload Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-gray-500">Titel:</span>
                <p className="text-orange-500 font-medium">{selectedUpload.title}</p>
              </div>
              
              <div>
                <span className="text-gray-500">Uploader:</span>
                <p className="text-orange-500">{selectedUpload.username} (ID: {selectedUpload.userId})</p>
              </div>
              
              <div>
                <span className="text-gray-500">Grund für Review:</span>
                <p className="text-white">{selectedUpload.reason}</p>
              </div>
              
              <div>
                <span className="text-gray-500">Duplikat-Count:</span>
                <p className="text-white">{selectedUpload.duplicateCount}</p>
              </div>
              
              <div>
                <span className="text-gray-500">Device ID:</span>
                <p className="text-white font-mono text-sm">{selectedUpload.deviceId}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};