import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { name: 'Chat', icon: '💬', path: '/chat' },
    { name: 'Upload', icon: '📤', path: '/upload' },
    { name: 'YouTube', icon: '🎥', path: '/youtube' },
    { name: 'Summaries', icon: '📝', path: '/summaries' },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-blue-600">AI Study Buddy</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <p className="font-medium">User Name</p>
            <button className="text-sm text-red-500 hover:text-red-600">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 