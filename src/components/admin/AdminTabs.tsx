import React from 'react';

interface AdminTabsProps {
  activeTab: 'uploads' | 'users' | 'comments' | 'reports';
  setActiveTab: (tab: 'uploads' | 'users' | 'comments' | 'reports') => void;
  uploadsCount: number;
  usersCount: number;
  commentsCount: number;
  reportsCount: number;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
  activeTab,
  setActiveTab,
  uploadsCount,
  usersCount,
  commentsCount,
  reportsCount
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'uploads'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Uploads ({uploadsCount})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Benutzer ({usersCount})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'comments'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kommentare ({commentsCount})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports ({reportsCount})
          </button>
        </nav>
      </div>
    </div>
  );
};