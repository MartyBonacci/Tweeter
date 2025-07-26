import { Link } from 'react-router';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-500">
              Tweeter
            </Link>
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
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              Tweet
            </button>
            <div className="w-8 h-8 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
}