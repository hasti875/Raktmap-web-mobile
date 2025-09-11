import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
  <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your blood donation operations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Moon button for theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              // Sun icon for switching to light mode
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414M17.95 17.95l-1.414-1.414M6.05 6.05L4.636 7.464M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              // Moon icon for switching to dark mode
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0112 21.75c-5.385 0-9.75-4.365-9.75-9.75 0-4.272 2.712-7.897 6.548-9.246a.75.75 0 01.908.99A7.501 7.501 0 0019.5 16.5a.75.75 0 01.99.908z" />
              </svg>
            )}
          </button>
          {/* Profile icon and info */}
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
          {/* Logout button at rightmost corner */}
          <button
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}