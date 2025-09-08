import React from 'react';
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

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Titel
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Benutzer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Länge
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Größe
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Likes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kommentare
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Datum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tracks.map((track) => (
            <tr key={track.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="mr-3 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                    title="Audio abspielen"
                  >
                    {currentTrack?.id === track.id && isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{track.title}</div>
                    {track.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {track.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {track.user ? track.user.username : 'Unbekannt'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDuration(track.duration)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatFileSize(track.fileSize || 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {track.likes}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onShowComments(track)}
                  className="text-sm text-orange-600 hover:text-orange-800"
                >
                  {track.commentsCount || 0} anzeigen
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(track.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onDeleteTrack(track.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
