import { Link, useLocation } from 'react-router';
import { useUser } from '../hooks/useUser';

export default function MobileNav() {
  const location = useLocation();
  const currentUser = useUser();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <Link 
          to="/home" 
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/home') ? 'text-blue-500' : 'text-gray-600'
          } transition-colors`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1 font-medium">Home</span>
        </Link>

        <Link 
          to="/explore" 
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/explore') ? 'text-blue-500' : 'text-gray-600'
          } transition-colors`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs mt-1 font-medium">Search</span>
        </Link>

        <Link 
          to="/notifications" 
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/notifications') ? 'text-blue-500' : 'text-gray-600'
          } transition-colors`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-xs mt-1 font-medium">Alerts</span>
        </Link>

        {currentUser && (
          <Link 
            to={`/users/${currentUser.username}`}
            className={`flex flex-col items-center py-2 px-3 ${
              location.pathname === `/users/${currentUser.username}` ? 'text-blue-500' : 'text-gray-600'
            } transition-colors`}
          >
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
              {currentUser.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs mt-1 font-medium">Profile</span>
          </Link>
        )}
      </div>
    </nav>
  );
}