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
import { serverDatabaseService } from '../../services/serverDatabaseService';
import type { PendingUpload } from '../../types';

interface PendingUploadsQueueProps {
  onUploadProcessed?: (track: any) => void;
}

export const PendingUploadsQueue = ({ onUploadProcessed }: PendingUploadsQueueProps) => {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState<PendingUpload | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isAutoApproveActive, setIsAutoApproveActive] = useState(false);
  const [processingUploads, setProcessingUploads] = useState<Set<string>>(new Set());

  // Lade pending Uploads vom Server und localStorage
  const loadPendingUploads = async () => {
    try {
      setLoading(true);
      
      console.log('🌐 Loading pending uploads from server...');
      
      const serverUploads = await serverDatabaseService.getPendingUploads();
      console.log('🔍 DEBUG: Server pending uploads:', serverUploads);
      
      let allPendingUploads: PendingUpload[] = [];
      
      // Lade vom Server (primäre Quelle)
      if (serverUploads && serverUploads.length > 0) {
        const convertedServerUploads = serverUploads.map((upload: any) => ({
          ...upload,
          id: upload.uploadId || upload.id,
          uploadId: upload.uploadId || upload.id,
          createdAt: new Date(upload.createdAt || Date.now()),
          source: 'server' // Markierung für Debugging
        }));
        allPendingUploads = [...convertedServerUploads];
        console.log('📋 Loaded pending uploads from server:', convertedServerUploads.length);
      }
      
      // Lade aus localStorage nur als Fallback (wenn Server leer ist)
      if (allPendingUploads.length === 0) {
        try {
          const pendingUploadsData = localStorage.getItem('aural_pending_uploads');
          if (pendingUploadsData) {
            const uploads = JSON.parse(pendingUploadsData);
            const localPendingList = Object.values(uploads).filter((upload: any) => upload.status === 'pending_review');
            
            // Konvertiere localStorage-Daten zu PendingUpload-Format
            const convertedLocalUploads = localPendingList.map((upload: any) => ({
              ...upload,
              id: upload.uploadId || upload.id,
              uploadId: upload.uploadId || upload.id,
              createdAt: new Date(upload.uploadedAt || upload.createdAt || Date.now()),
              source: 'localStorage' // Markierung für Debugging
            }));
            
            allPendingUploads = convertedLocalUploads;
            console.log('📋 Loaded pending uploads from localStorage (fallback):', convertedLocalUploads.length);
          }
        } catch (localError) {
          console.error('Failed to load pending uploads from localStorage:', localError);
        }
      } else {
        console.log('📋 Using server data only, skipping localStorage');
      }
      
      // Entferne Duplikate basierend auf uploadId (zusätzliche Sicherheit)
      const uniqueUploads = allPendingUploads.filter((upload, index, self) => 
        index === self.findIndex(u => u.uploadId === upload.uploadId)
      );
      
      if (uniqueUploads.length !== allPendingUploads.length) {
        console.log(`🔧 Removed ${allPendingUploads.length - uniqueUploads.length} duplicate uploads`);
      }
      
      setPendingUploads(uniqueUploads);
      console.log('📋 Total unique pending uploads loaded:', uniqueUploads.length);
      
      // Bereinige localStorage wenn Server-Daten verfügbar sind
      if (serverUploads && serverUploads.length > 0) {
        try {
          const pendingUploadsData = localStorage.getItem('aural_pending_uploads');
          if (pendingUploadsData) {
            const localUploads = JSON.parse(pendingUploadsData);
            const serverUploadIds = new Set(serverUploads.map(u => u.uploadId || u.id));
            
            // Entferne lokale Uploads, die bereits auf dem Server sind
            const cleanedLocalUploads = Object.fromEntries(
              Object.entries(localUploads).filter(([id, upload]: [string, any]) => 
                !serverUploadIds.has(upload.uploadId || upload.id)
              )
            );
            
            if (Object.keys(cleanedLocalUploads).length !== Object.keys(localUploads).length) {
              localStorage.setItem('aural_pending_uploads', JSON.stringify(cleanedLocalUploads));
              console.log('🧹 Cleaned up localStorage - removed server-synced uploads');
            }
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup localStorage:', cleanupError);
        }
      }
      
    } catch (error) {
      console.error('Failed to load pending uploads:', error);
      setPendingUploads([]);
    } finally {
      setLoading(false);
    }
  };

  // Lade Auto-Approve-Status vom Server
  const loadAutoApproveStatus = async () => {
    try {
      console.log('🌐 Loading auto approve status from server...');
      const serverStatus = await serverDatabaseService.getAutoApproveStatus();
      setIsAutoApproveActive(serverStatus);
      console.log('✅ Auto approve status loaded from server:', serverStatus);
    } catch (error) {
      console.error('❌ Failed to load auto approve status from server:', error);
      // Fallback zu localStorage
      try {
        const savedStatus = localStorage.getItem('aural_queue_paused');
        if (savedStatus !== null) {
          setIsAutoApproveActive(JSON.parse(savedStatus));
          console.log('📱 Fallback to localStorage auto approve status');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
  };

  // Speichere Auto-Approve-Status auf dem Server
  const saveAutoApproveStatus = async (active: boolean) => {
    try {
      console.log('🌐 Saving auto approve status to server:', active);
      const serverSuccess = await serverDatabaseService.setAutoApproveStatus(active);
      if (serverSuccess) {
        console.log('✅ Auto approve status saved to server');
        // Auch lokal als Backup speichern
        localStorage.setItem('aural_queue_paused', JSON.stringify(active));
      } else {
        console.error('❌ Failed to save auto approve status to server');
        // Fallback zu localStorage
        localStorage.setItem('aural_queue_paused', JSON.stringify(active));
      }
    } catch (error) {
      console.error('❌ Failed to save auto approve status:', error);
      // Fallback zu localStorage
      localStorage.setItem('aural_queue_paused', JSON.stringify(active));
    }
  };

  const toggleAutoApprove = async () => {
    const newAutoApproveStatus = !isAutoApproveActive;
    setIsAutoApproveActive(newAutoApproveStatus);
    await saveAutoApproveStatus(newAutoApproveStatus);
    
    // Trigger global event für andere Komponenten
    window.dispatchEvent(new CustomEvent('queuePauseStatusChanged', { 
      detail: { isPaused: newAutoApproveStatus } 
    }));
    
    console.log(`🔄 Auto-Approve ${newAutoApproveStatus ? 'aktiviert' : 'deaktiviert'}`);
  };

  const handleApprove = async (uploadId: string) => {
    try {
      console.log('🌐 Approving upload via server:', uploadId);
      
      // Zeige Loading-State
      setProcessingUploads(prev => new Set(prev).add(uploadId));
      
      // Finde den Upload für bessere Fehlermeldungen
      const uploadToApprove = pendingUploads.find(upload => upload.uploadId === uploadId);
      if (!uploadToApprove) {
        console.error('❌ Upload not found in local list:', uploadId);
        alert('Fehler: Upload nicht gefunden!');
        return;
      }
      
      console.log('📋 Approving upload:', {
        id: uploadId,
        title: uploadToApprove.title,
        username: uploadToApprove.username
      });
      
      const approvedTrack = await serverDatabaseService.approveUpload(uploadId);
      
      if (!approvedTrack) {
        console.error('❌ Server returned null for approved track');
        alert('Fehler: Upload konnte nicht freigegeben werden. Server antwortete nicht korrekt.');
        return;
      }

      console.log('✅ Upload approved on server:', approvedTrack);

      // Entferne den Upload aus der lokalen Liste
      setPendingUploads(prev => prev.filter(upload => upload.uploadId !== uploadId));
      
      // Entferne auch aus localStorage falls vorhanden
      try {
        const pendingUploadsData = localStorage.getItem('aural_pending_uploads');
        if (pendingUploadsData) {
          const uploads = JSON.parse(pendingUploadsData);
          delete uploads[uploadId];
          localStorage.setItem('aural_pending_uploads', JSON.stringify(uploads));
        }
      } catch (localError) {
        console.error('Failed to update localStorage:', localError);
      }
      
      // Benachrichtige über erfolgreiche Genehmigung
      if (onUploadProcessed) {
        onUploadProcessed(approvedTrack);
      }
      
      console.log('✅ Upload approval completed successfully');
      alert(`✅ Upload "${uploadToApprove.title}" erfolgreich freigegeben!`);
      
    } catch (error) {
      console.error('❌ Failed to approve upload:', error);
      alert(`❌ Fehler beim Freigeben des Uploads: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      // Entferne Loading-State
      setProcessingUploads(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
    }
  };

  const handleReject = async (uploadId: string) => {
    try {
      console.log('🌐 Rejecting upload via server:', uploadId);
      
      // Zeige Loading-State
      setProcessingUploads(prev => new Set(prev).add(uploadId));
      
      // Finde den Upload für bessere Fehlermeldungen
      const uploadToReject = pendingUploads.find(upload => upload.uploadId === uploadId);
      if (!uploadToReject) {
        console.error('❌ Upload not found in local list:', uploadId);
        alert('Fehler: Upload nicht gefunden!');
        return;
      }
      
      console.log('📋 Rejecting upload:', {
        id: uploadId,
        title: uploadToReject.title,
        username: uploadToReject.username
      });
      
      // Implementiere server-side rejection
      const success = await serverDatabaseService.rejectUpload(uploadId, 'Rejected by admin');
      
      if (success) {
        // Entferne aus lokaler Liste
        setPendingUploads(prev => prev.filter(upload => upload.uploadId !== uploadId));
        
        // Entferne auch aus localStorage falls vorhanden
        try {
          const pendingUploadsData = localStorage.getItem('aural_pending_uploads');
          if (pendingUploadsData) {
            const uploads = JSON.parse(pendingUploadsData);
            delete uploads[uploadId];
            localStorage.setItem('aural_pending_uploads', JSON.stringify(uploads));
          }
        } catch (localError) {
          console.error('Failed to update localStorage:', localError);
        }
        
        console.log('✅ Upload rejected successfully');
        alert(`✅ Upload "${uploadToReject.title}" erfolgreich abgelehnt!`);
      } else {
        throw new Error('Server rejection failed');
      }
      
    } catch (error) {
      console.error('❌ Failed to reject upload:', error);
      alert(`❌ Fehler beim Ablehnen des Uploads: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      // Entferne Loading-State
      setProcessingUploads(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
    }
  };

  const handlePlayAudio = async (upload: PendingUpload) => {
    if (playingAudio === upload.uploadId) {
      setPlayingAudio(null);
      return;
    }

    setPlayingAudio(upload.uploadId);
    
    // Audio wird automatisch gestoppt wenn ein anderes Audio gestartet wird
    setTimeout(() => {
      setPlayingAudio(null);
    }, 10000); // 10 Sekunden Auto-Stop
  };

  const handleCleanupDuplicates = async () => {
    try {
      console.log('🧹 Manual cleanup of duplicates...');
      await loadPendingUploads();
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  };

  const handleTestServerConnection = async () => {
    try {
      console.log('🔍 Testing server connection...');
      const serverUploads = await serverDatabaseService.getPendingUploads();
      console.log('📡 Server response:', serverUploads);
      alert(`Server-Verbindung erfolgreich! ${serverUploads.length} Uploads gefunden.`);
    } catch (error) {
      console.error('❌ Server connection test failed:', error);
      alert(`❌ Server-Verbindung fehlgeschlagen: ${error.message}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initial load
  useEffect(() => {
    loadPendingUploads();
    loadAutoApproveStatus();
  }, []);

  // Auto-refresh alle 30 Sekunden
  useEffect(() => {
    const interval = setInterval(() => {
      loadPendingUploads();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4e3a]"></div>
        <span className="ml-2 text-white">Lade Warteschlange...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Auto-Approve Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Warteschlange</h2>
          <span className="bg-[#ff4e3a] text-white px-3 py-1 rounded-full text-sm font-medium">
            {pendingUploads.length} Aufnahmen
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isAutoApproveActive 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}>
            {isAutoApproveActive ? 'Auto-Approve' : 'Manuell'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTestServerConnection}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Server testen</span>
          </button>
          
          <button
            onClick={handleCleanupDuplicates}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Duplikate bereinigen</span>
          </button>
          
          <button
            onClick={toggleAutoApprove}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isAutoApproveActive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isAutoApproveActive ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            <span>{isAutoApproveActive ? 'Auto-Approve Aktiv' : 'Manuelle Freigabe'}</span>
          </button>
        </div>
      </div>

      {/* Status Info Box */}
      <div className={`p-4 rounded-lg border ${
        isAutoApproveActive 
          ? 'bg-red-500/10 border-red-500/30' 
          : 'bg-blue-500/10 border-blue-500/30'
      }`}>
        <div className="flex items-center space-x-2">
          {isAutoApproveActive ? (
            <>
              <Pause className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Auto-Approve Modus aktiv</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">Manuelle Freigabe aktiv</span>
            </>
          )}
        </div>
        <p className={`text-sm mt-1 ${
          isAutoApproveActive ? 'text-red-300' : 'text-blue-300'
        }`}>
          {isAutoApproveActive 
            ? 'Neue Uploads werden automatisch freigegeben und erscheinen nicht in der Warteschlange.'
            : 'Neue Uploads, die eine Überprüfung benötigen, werden in der Warteschlange angezeigt.'
          }
        </p>
      </div>

      {/* Uploads Liste */}
      {pendingUploads.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Keine Aufnahmen in der Warteschlange</h3>
          <p className="text-gray-400">Alle Aufnahmen wurden bereits bearbeitet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUploads.map((upload) => (
            <motion.div
              key={upload.uploadId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{upload.title}</h3>
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium">
                      {upload.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{upload.username}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(upload.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <HardDrive className="w-4 h-4" />
                      <span>{formatFileSize(upload.size)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-500 text-sm">{upload.reason}</span>
                    {upload.duplicateCount > 0 && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                        {upload.duplicateCount} Duplikate
                      </span>
                    )}
                    {upload.source && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        upload.source === 'server' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-blue-500 text-white'
                      }`}>
                        {upload.source}
                      </span>
                    )}
                    <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-mono">
                      ID: {upload.uploadId?.substring(0, 8)}...
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePlayAudio(upload)}
                    className={`p-2 rounded-lg transition-colors ${
                      playingAudio === upload.uploadId
                        ? 'bg-[#ff4e3a] text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedUpload(upload);
                      setShowDetails(true);
                    }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleApprove(upload.uploadId)}
                    disabled={processingUploads.has(upload.uploadId)}
                    className={`p-2 rounded-lg transition-colors ${
                      processingUploads.has(upload.uploadId)
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {processingUploads.has(upload.uploadId) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleReject(upload.uploadId)}
                    disabled={processingUploads.has(upload.uploadId)}
                    className={`p-2 rounded-lg transition-colors ${
                      processingUploads.has(upload.uploadId)
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                  >
                    {processingUploads.has(upload.uploadId) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4"
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
                <p className="text-[#ff4e3a] font-medium">{selectedUpload.title}</p>
              </div>
              
              <div>
                <span className="text-gray-500">Uploader:</span>
                <p className="text-[#ff4e3a]">{selectedUpload.username} (ID: {selectedUpload.userId})</p>
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
