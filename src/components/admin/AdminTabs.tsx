import React from 'react';

interface AdminTabsProps {
  activeTab: 'uploads' | 'users' | 'comments' | 'reports' | 'pending';
  setActiveTab: (tab: 'uploads' | 'users' | 'comments' | 'reports' | 'pending') => void;
  uploadsCount: number;
  usersCount: number;
  commentsCount: number;
  reportsCount: number;
  pendingCount: number;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
  activeTab,
  setActiveTab,
  uploadsCount,
  usersCount,
  commentsCount,
  reportsCount,
  pendingCount
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'uploads'
                ? 'border-[#ff4e3a] text-[#ff4e3a]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Uploads ({uploadsCount})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-[#ff4e3a] text-[#ff4e3a]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Benutzer ({usersCount})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'comments'
                ? 'border-[#ff4e3a] text-[#ff4e3a]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kommentare ({commentsCount})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-[#ff4e3a] text-[#ff4e3a]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports ({reportsCount})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-[#ff4e3a] text-[#ff4e3a]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Warteschlange ({pendingCount})
          </button>
        </nav>
      </div>
    </div>
  );
};