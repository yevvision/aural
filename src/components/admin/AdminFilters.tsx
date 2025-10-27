import React from 'react';
import type { User } from '../../types';

type SortField = 'title' | 'user' | 'likes' | 'comments' | 'date' | 'fileSize' | 'duration';
type SortOrder = 'asc' | 'desc';

interface AdminFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  userFilter: string;
  onUserFilterChange: (userId: string) => void;
  allUsers: User[];
}

export const AdminFilters: React.FC<AdminFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  userFilter,
  onUserFilterChange,
  allUsers
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4e3a] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={userFilter}
            onChange={(e) => onUserFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4e3a] focus:border-transparent"
          >
            <option value="all">Alle Benutzer</option>
            {allUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <select
            value={sortField}
            onChange={(e) => onSortFieldChange(e.target.value as SortField)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4e3a] focus:border-transparent"
          >
            <option value="date">Datum</option>
            <option value="title">Titel</option>
            <option value="user">Benutzer</option>
            <option value="likes">Likes</option>
            <option value="comments">Kommentare</option>
            <option value="fileSize">Dateigröße</option>
            <option value="duration">Länge</option>
          </select>
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 bg-[#ff4e3a] text-white rounded-lg hover:bg-[#ff4e3a] transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
    </div>
  );
};