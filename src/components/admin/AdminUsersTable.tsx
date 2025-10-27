import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, User as UserIcon, Mail, Upload, Heart, CheckCircle, Calendar } from 'lucide-react';
import type { User } from '../../types';

interface AdminUsersTableProps {
  users: User[];
  onDeleteUser: (userId: string) => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  users,
  onDeleteUser
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

  const columns = [
    { id: 'username', label: 'Benutzername', icon: UserIcon },
    { id: 'email', label: 'E-Mail', icon: Mail },
    { id: 'uploads', label: 'Uploads', icon: Upload },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'verified', label: 'Verifiziert', icon: CheckCircle },
    { id: 'created', label: 'Registriert', icon: Calendar },
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
                    className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {column.label}
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
            {users.map((user, index) => (
              <motion.tr 
                key={user.id} 
                className="hover:bg-white/5 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-[#ff4e3a]">{user.username}</div>
                    {user.isVerified && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verifiziert
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {user.totalUploads}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {user.totalLikes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {user.isVerified ? 'Ja' : 'Nein'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <motion.button
                    onClick={() => onDeleteUser(user.id)}
                    className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Entfernen
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary">Keine Benutzer vorhanden.</p>
        </div>
      )}
    </div>
  );
};