import { Link } from 'react-router';
import { useUser } from '../hooks/useUser';
import { SearchBox } from './SearchBox';

export default function Header() {
  const { user: currentUser } = useUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-500">
              Tweeter
            </Link>
          </div>
          
          {/* Search Box - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchBox className="w-full" />
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link to="/explore" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium">
              Explore
            </Link>
            <Link to="/notifications" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium">
              Notifications
            </Link>
            <Link to="/messages" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium">
              Messages
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {currentUser && (
              <Link 
                to={`/users/${currentUser.username}`}
                className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold hover:bg-gray-400 transition-colors"
              >
                {currentUser.username?.charAt(0)?.toUpperCase() || 'U'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}