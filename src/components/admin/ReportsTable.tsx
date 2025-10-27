import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, Trash2, Eye, Flag, User, FileText, Calendar } from 'lucide-react';
import type { ContentReport } from '../../types';

interface ReportsTableProps {
  reports: ContentReport[];
  onUpdateStatus: (reportId: string, status: 'pending' | 'reviewed' | 'resolved', reviewedBy?: string) => void;
  onDeleteReport: (reportId: string) => void;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({
  reports,
  onUpdateStatus,
  onDeleteReport
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewed':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'reviewed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'recording':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'comment':
        return 'bg-[#ff4e3a]/20 text-[#ff4e3a] border-[#ff4e3a]/30';
      case 'description':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const columns = [
    { id: 'type', label: 'Typ', icon: Flag },
    { id: 'content', label: 'Inhalt', icon: FileText },
    { id: 'reporter', label: 'Melder', icon: User },
    { id: 'reason', label: 'Grund', icon: null },
    { id: 'status', label: 'Status', icon: null },
    { id: 'date', label: 'Datum', icon: Calendar },
  ];

  if (reports.length === 0) {
    return (
      <div className="panel-floating">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Content Reports (0)</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">No reports have been submitted yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-floating">
      <div className="px-6 py-4 border-b border-white/10">
        <h3 className="text-lg font-medium text-white">Content Reports ({reports.length})</h3>
        <p className="text-sm text-text-secondary mt-1">
          {reports.filter(r => r.status === 'pending').length} pending, {reports.filter(r => r.status === 'reviewed').length} reviewed, {reports.filter(r => r.status === 'resolved').length} resolved
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr>
              {columns.map((column) => {
                const Icon = column.icon;
                return (
                  <th 
                    key={column.id}
                    className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4" />}
                      {column.label}
                    </div>
                  </th>
                );
              })}
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {reports.map((report, index) => (
              <motion.tr 
                key={report.id} 
                className="hover:bg-white/5 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(report.type)}`}>
                    {report.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white">
                    {truncateText(report.targetTitle || 'Unknown content', 40)}
                  </div>
                  <div className="text-xs text-text-secondary">
                    ID: {report.targetId}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{report.reporterUsername}</div>
                  <div className="text-xs text-text-secondary">ID: {report.reporterId}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white">
                    {report.reason ? truncateText(report.reason, 30) : 'No reason provided'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(report.status)}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  {report.reviewedBy && (
                    <div className="text-xs text-text-secondary mt-1">
                      by {report.reviewedBy}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {formatDate(report.createdAt)}
                  {report.reviewedAt && (
                    <div className="text-xs text-text-secondary">
                      Reviewed: {formatDate(report.reviewedAt)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {report.status === 'pending' && (
                      <>
                        <motion.button
                          onClick={() => onUpdateStatus(report.id, 'reviewed', 'admin')}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Mark as reviewed"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => onUpdateStatus(report.id, 'resolved', 'admin')}
                          className="text-green-400 hover:text-green-300 transition-colors"
                          title="Mark as resolved"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                    {report.status === 'reviewed' && (
                      <motion.button
                        onClick={() => onUpdateStatus(report.id, 'resolved', 'admin')}
                        className="text-green-400 hover:text-green-300 transition-colors"
                        title="Mark as resolved"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => onDeleteReport(report.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete report"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
