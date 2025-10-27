import React from 'react';
import { Calendar } from 'lucide-react';

interface CalendarElementProps {
  date: Date | string;
  className?: string;
}

export const CalendarElement: React.FC<CalendarElementProps> = ({ 
  date, 
  className = '' 
}) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
      <Calendar size={16} strokeWidth={2} className="text-gray-400" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{formatDate(dateObj)}</span>
        <span className="text-xs text-gray-500">{formatTime(dateObj)}</span>
      </div>
    </div>
  );
};
