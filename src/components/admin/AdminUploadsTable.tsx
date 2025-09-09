import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Trash2, MessageSquare, ChevronUp, ChevronDown, Heart, Clock, Calendar, User, HardDrive } from 'lucide-react';
import type { AudioTrack } from '../../types';

interface AdminUploadsTableProps {
  tracks: AudioTrack[];
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  onDeleteTrack: (trackId: string) => void;
  onPlayTrack: (track: AudioTrack) => void;
  onShowComments: (track: AudioTrack) => void;
  formatFileSize: (bytes: number) => string;
  formatDuration: (seconds: number) => string;
}

type SortField = 'title' | 'user' | 'duration' | 'fileSize' | 'likes' | 'comments' | 'date';
type SortOrder = 'asc' | 'desc';

export const AdminUploadsTable: React.FC<AdminUploadsTableProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onDeleteTrack,
  onPlayTrack,
  onShowComments,
  formatFileSize,
  formatDuration
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 opacity-30" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'user':
        aValue = a.user?.username?.toLowerCase() || '';
        bValue = b.user?.username?.toLowerCase() || '';
        break;
      case 'duration':
        aValue = a.duration;
        bValue = b.duration;
        break;
      case 'fileSize':
        aValue = a.fileSize || 0;
        bValue = b.fileSize || 0;
        break;
      case 'likes':
        aValue = a.likes;
        bValue = b.likes;
        break;
      case 'comments':
        aValue = a.commentsCount || 0;
        bValue = b.commentsCount || 0;
        break;
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const columns = [
    { id: 'title', label: 'Titel', icon: null },
    { id: 'user', label: 'Benutzer', icon: User },
    { id: 'duration', label: 'Länge', icon: Clock },
    { id: 'fileSize', label: 'Größe', icon: HardDrive },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'comments', label: 'Kommentare', icon: MessageSquare },
    { id: 'date', label: 'Datum', icon: Calendar },
  ];

  return (
    <div className="panel-floating">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((column) => {
                const Icon = column.icon;
                return (
                  <th 
                    key={column.id}
                    className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort(column.id as SortField)}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4" />}
                      {column.label}
                      {getSortIcon(column.id as SortField)}
                    </div>
                  </th>
                );
              })}
              <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedTracks.map((track, index) => (
              <motion.tr 
                key={track.id} 
                className="hover:bg-white/5 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <motion.button
                      onClick={() => onPlayTrack(track)}
                      className="mr-3 w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center hover:scale-105 transition-all"
                      title="Audio abspielen"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </motion.button>
                    <div>
                      <div className="text-sm font-medium text-white">{track.title}</div>
                      {track.description && (
                        <div className="text-sm text-text-secondary truncate max-w-xs">
                          {track.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {track.user ? track.user.username : 'Unbekannt'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {formatDuration(track.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {formatFileSize(track.fileSize || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {track.likes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onShowComments(track)}
                    className="text-sm text-gradient-strong hover:text-white transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {track.commentsCount || 0} anzeigen
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {formatDate(track.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <motion.button
                    onClick={() => onDeleteTrack(track.id)}
                    className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tracks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary">Keine Uploads vorhanden.</p>
        </div>
      )}
    </div>
  );
};
