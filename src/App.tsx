import { Link } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Tweeter</h1>
        <p className="text-gray-600">A clone of Twitter back when Tweets were only 140 characters</p>
      </header>
      
      <nav className="mb-8">
        <ul className="flex space-x-4">
          <li><Link to="/" className="text-blue-500 hover:text-blue-700">Home</Link></li>
          <li><Link to="/login" className="text-blue-500 hover:text-blue-700">Login</Link></li>
          <li><Link to="/register" className="text-blue-500 hover:text-blue-700">Register</Link></li>
        </ul>
      </nav>
      
      <main>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Tweeter</h2>
          <p className="mb-4">
            Share your thoughts in 140 characters or less. Follow friends and discover new ones.
          </p>
          <div className="flex space-x-4">
            <Link 
              to="/register" 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Get Started
            </Link>
            <Link 
              to="/login" 
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
