import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Upload, 
  MessageSquare, 
  Heart, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import type { AudioTrack, User, Comment, ContentReport } from '../../types';

interface AdminStatisticsProps {
  onBack: () => void;
}

interface StatisticData {
  period: string;
  users: number;
  uploads: number;
  comments: number;
  likes: number;
}

export const AdminStatistics: React.FC<AdminStatisticsProps> = ({ onBack }) => {
  const { tracks, users, comments, reports, getStats } = useDatabase();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [visibleCharts, setVisibleCharts] = useState({
    users: true,
    uploads: true,
    comments: true,
    likes: true
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Echte Daten aus der Datenbank generieren
  const generateRealData = (period: string): StatisticData[] => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const data: StatisticData[] = [];
    
    console.log('📊 AdminStatistics: Generating data for period:', period);
    console.log('📊 AdminStatistics: Available data:', { 
      users: users.length, 
      tracks: tracks.length, 
      comments: comments.length 
    });
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filtere Daten für diesen Tag
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= dayStart && userDate <= dayEnd;
      }).length;
      
      const dayUploads = tracks.filter(track => {
        const trackDate = new Date(track.createdAt);
        return trackDate >= dayStart && trackDate <= dayEnd;
      }).length;
      
      const dayComments = comments.filter(comment => {
        const commentDate = new Date(comment.createdAt);
        return commentDate >= dayStart && commentDate <= dayEnd;
      }).length;
      
      const dayLikes = tracks
        .filter(track => {
          const trackDate = new Date(track.createdAt);
          return trackDate >= dayStart && trackDate <= dayEnd;
        })
        .reduce((sum, track) => sum + track.likes, 0);
      
      data.push({
        period: dateStr,
        users: dayUsers,
        uploads: dayUploads,
        comments: dayComments,
        likes: dayLikes
      });
    }
    
    console.log('📊 AdminStatistics: Generated data:', data);
    return data;
  };

  const [chartData, setChartData] = useState<StatisticData[]>([]);

  useEffect(() => {
    setChartData(generateRealData(selectedPeriod));
  }, [selectedPeriod, tracks, users, comments]);

  const toggleChart = (chartType: keyof typeof visibleCharts) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartType]: !prev[chartType]
    }));
  };

  const getMaxValue = () => {
    const values = chartData.flatMap(d => [d.users, d.uploads, d.comments, d.likes]);
    const max = Math.max(...values);
    // Mindestens 1 für bessere Darstellung
    return max > 0 ? max : 1;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (selectedPeriod === '7d') {
      return date.toLocaleDateString('de-DE', { weekday: 'short' });
    } else if (selectedPeriod === '30d') {
      return date.getDate().toString();
    } else if (selectedPeriod === '90d') {
      return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('de-DE', { month: 'short' });
    }
  };

  const getTotalStats = () => {
    return chartData.reduce((acc, data) => ({
      users: acc.users + data.users,
      uploads: acc.uploads + data.uploads,
      comments: acc.comments + data.comments,
      likes: acc.likes + data.likes
    }), { users: 0, uploads: 0, comments: 0, likes: 0 });
  };

  // Echte Gesamtstatistiken aus der Datenbank
  const getRealTotalStats = () => {
    const dbStats = getStats();
    return {
      totalUsers: dbStats.totalUsers,
      totalUploads: dbStats.totalTracks,
      totalComments: dbStats.totalComments,
      totalLikes: dbStats.totalLikes,
      totalReports: dbStats.totalReports,
      pendingReports: dbStats.pendingReports
    };
  };

  const totalStats = getTotalStats();
  const realTotalStats = getRealTotalStats();
  const maxValue = getMaxValue();

  const chartConfig = [
    { key: 'users', label: 'Neue Benutzer', color: 'bg-blue-500', icon: Users },
    { key: 'uploads', label: 'Uploads', color: 'bg-green-500', icon: Upload },
    { key: 'comments', label: 'Kommentare', color: 'bg-yellow-500', icon: MessageSquare },
    { key: 'likes', label: 'Likes', color: 'bg-red-500', icon: Heart }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Statistiken</h2>
          <p className="text-text-secondary">Übersicht über Plattform-Aktivitäten</p>
        </div>
        <motion.button
          onClick={onBack}
          className="glass-button px-4 py-2 rounded-lg text-text-secondary hover:text-white transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Zurück
        </motion.button>
      </div>

      {/* Zeitraum-Auswahl */}
      <div className="panel-floating p-6">
        <h3 className="text-lg font-medium text-white mb-4">Zeitraum auswählen</h3>
        <div className="flex gap-2">
          {[
            { id: '7d', label: '7 Tage' },
            { id: '30d', label: '30 Tage' },
            { id: '90d', label: '90 Tage' },
            { id: '1y', label: '1 Jahr' }
          ].map((period) => (
            <motion.button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id as any)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedPeriod === period.id
                  ? 'bg-gradient-primary text-white'
                  : 'glass-surface text-text-secondary hover:text-white hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {period.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Echte Gesamtstatistiken */}
      <div className="panel-floating p-6">
        <h3 className="text-lg font-medium text-white mb-4">Gesamtstatistiken (Alle Zeiten)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Gesamt Benutzer</p>
              <p className="text-xl font-semibold text-white">{realTotalStats.totalUsers}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Gesamt Uploads</p>
              <p className="text-xl font-semibold text-white">{realTotalStats.totalUploads}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Gesamt Kommentare</p>
              <p className="text-xl font-semibold text-white">{realTotalStats.totalComments}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Gesamt Likes</p>
              <p className="text-xl font-semibold text-white">{realTotalStats.totalLikes}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#ff4e3a] rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Gesamt Reports</p>
              <p className="text-xl font-semibold text-white">{realTotalStats.totalReports}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Pending Reports</p>
              <p className="text-xl font-semibold text-white">{realTotalStats.pendingReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Zeitraum-spezifische Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {chartConfig.map((config) => {
          const Icon = config.icon;
          const total = totalStats[config.key as keyof typeof totalStats];
          return (
            <motion.div
              key={config.key}
              className="panel-floating p-6"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">{config.label} ({selectedPeriod})</p>
                    <p className="text-2xl font-semibold text-white">{total}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => toggleChart(config.key as keyof typeof visibleCharts)}
                  className="text-text-secondary hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {visibleCharts[config.key as keyof typeof visibleCharts] ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Diagramm */}
      <div className="panel-floating p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-white">Aktivitätsverlauf</h3>
            <p className="text-sm text-text-secondary">
              Maximaler Wert: {maxValue} | Datenpunkte: {chartData.length}
            </p>
            <div className="text-xs text-text-secondary mt-1">
              Letzte 3 Tage: {chartData.slice(-3).map(d => 
                `U:${d.uploads} L:${d.likes} C:${d.comments}`
              ).join(' | ')}
            </div>
          </div>
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="glass-button px-3 py-2 rounded-lg text-text-secondary hover:text-white transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isExpanded ? 'Zusammenklappen' : 'Erweitern'}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </motion.button>
        </div>

        <div className={`transition-all duration-300 ${isExpanded ? 'h-96' : 'h-64'} overflow-hidden`}>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">Keine Daten für den gewählten Zeitraum</p>
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between h-full gap-2">
              {chartData.map((data, index) => (
                <div key={data.period} className="flex-1 flex flex-col items-center">
                  <div className="flex flex-col items-center gap-1 h-full justify-end">
                    {chartConfig.map((config) => {
                      if (!visibleCharts[config.key as keyof typeof visibleCharts]) return null;
                      
                      const value = data[config.key as keyof StatisticData] as number;
                      // Mindestens 8px Höhe für bessere Sichtbarkeit, auch bei kleinen Werten
                      const height = Math.max(8, (value / maxValue) * 200); // Erhöhe den Multiplikator für bessere Sichtbarkeit
                      
                      return (
                        <motion.div
                          key={config.key}
                          className={`w-full ${config.color} rounded-t transition-all duration-300 relative group border border-white/20 min-h-[8px]`}
                          style={{ 
                            height: `${height}px`,
                            minHeight: '8px',
                            backgroundColor: config.color.includes('blue') ? '#3B82F6' : 
                                           config.color.includes('green') ? '#10B981' :
                                           config.color.includes('yellow') ? '#F59E0B' :
                                           config.color.includes('red') ? '#EF4444' : '#6B7280'
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}px` }}
                          transition={{ duration: 0.5, delay: index * 0.02 }}
                          title={`${config.label}: ${value}`}
                        >
                          {value > 0 && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-1 rounded">
                              {value}
                            </div>
                          )}
                          {/* Fallback: Zeige Wert direkt im Balken wenn sehr klein */}
                          {value > 0 && height < 20 && (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                              {value}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-text-secondary mt-2 text-center">
                    {formatDate(data.period)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legende */}
        <div className="flex flex-wrap gap-4 mt-6">
          {chartConfig.map((config) => {
            const Icon = config.icon;
            return (
              <motion.div
                key={config.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  visibleCharts[config.key as keyof typeof visibleCharts]
                    ? 'bg-white/10'
                    : 'bg-white/5 opacity-50'
                }`}
                whileHover={{ scale: 1.05 }}
                onClick={() => toggleChart(config.key as keyof typeof visibleCharts)}
              >
                <div className={`w-3 h-3 ${config.color} rounded`} />
                <Icon className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-secondary">{config.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
