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
  Pause
} from 'lucide-react';
import DatabaseService from '../../services/databaseService';

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

  // Lade pending Uploads
  useEffect(() => {
    loadPendingUploads();
  }, []);

  const loadPendingUploads = async () => {
    try {
      setLoading(true);
      
      // Lade echte pending Uploads aus localStorage
      const pendingUploadsData = localStorage.getItem('aural_pending_uploads');
      if (pendingUploadsData) {
        const uploads = JSON.parse(pendingUploadsData);
        const pendingList = Object.values(uploads).filter((upload: any) => 
          upload.status === 'pending_review'
        ) as PendingUpload[];
        
        setPendingUploads(pendingList);
        console.log('📋 Loaded pending uploads:', pendingList.length);
      } else {
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
      if (uploadToApprove.url && uploadToApprove.url.startsWith('blob:')) {
        try {
          console.log('🔄 Konvertiere Blob-URL zu Base64...', uploadToApprove.url);
          
          // Prüfe ob Blob-URL noch gültig ist
          try {
            const testResponse = await fetch(uploadToApprove.url, { method: 'HEAD' });
            if (!testResponse.ok) {
              throw new Error(`Blob-URL nicht mehr gültig: ${testResponse.status}`);
            }
            console.log('✅ Blob-URL ist noch gültig');
          } catch (testError) {
            console.error('❌ Blob-URL ist nicht mehr gültig:', testError);
            throw new Error('Blob-URL ist nicht mehr gültig. Möglicherweise wurde die Seite neu geladen.');
          }
          
          // Lade Audio-Daten aus Blob-URL
          const response = await fetch(uploadToApprove.url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const blob = await response.blob();
          console.log('📦 Blob erhalten:', {
            size: blob.size,
            type: blob.type,
            isBlob: blob instanceof Blob
          });
          
          // Prüfe ob Blob echte Audio-Daten enthält
          if (blob.size < 1000) {
            console.warn('⚠️ Blob ist sehr klein, möglicherweise keine echten Audio-Daten');
          }
          
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
            reader.readAsDataURL(blob);
          });
          
          console.log('✅ Audio-Daten zu Base64 konvertiert');
        } catch (error) {
          console.error('❌ Fehler beim Konvertieren der Audio-Daten:', error);
          // Fallback: Verwende die ursprüngliche URL
          console.log('⚠️ Verwende ursprüngliche URL als Fallback');
        }
      } else {
        console.log('ℹ️ URL ist bereits Base64 oder kein Blob:', uploadToApprove.url?.substring(0, 50));
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
          createdAt: new Date(),
          isAdmin: false
        },
        likes: 0,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(), // Verwende aktuelles Datum für freigegebene Tracks
        tags: uploadToApprove.tags,
        gender: uploadToApprove.gender,
        filename: uploadToApprove.filename,
        fileSize: uploadToApprove.size,
        format: uploadToApprove.mimeType
      };

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
      
      // Entferne aus Pending-Liste
      setPendingUploads(prev => prev.filter(upload => upload.uploadId !== uploadId));
      
      // Entferne aus Pending-Uploads
      const pendingUploadsData = JSON.parse(localStorage.getItem('aural_pending_uploads') || '{}');
      delete pendingUploadsData[uploadId];
      localStorage.setItem('aural_pending_uploads', JSON.stringify(pendingUploadsData));

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
        
        {pendingUploads.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 text-sm font-medium">
              {pendingUploads.length} wartet{pendingUploads.length === 1 ? '' : 'en'}
            </span>
          </div>
        )}
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
                    <h3 className="text-lg font-medium text-white">
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
                <p className="text-white font-medium">{selectedUpload.title}</p>
              </div>
              
              <div>
                <span className="text-gray-500">Uploader:</span>
                <p className="text-white">{selectedUpload.username} (ID: {selectedUpload.userId})</p>
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