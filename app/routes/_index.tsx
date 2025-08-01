import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tweeter - Authentic Twitter Experience" },
    { name: "description", content: "Experience Twitter as it was in its golden age with 140-character messages" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Tweeter</h1>
          <p className="text-sm text-gray-600 mt-1">
            Authentic Twitter experience from the golden age
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Tweeter</h2>
          <p className="text-gray-700 mb-4">
            Experience the simplicity of early Twitter with 140-character messages,
            chronological timelines, and genuine human connection.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Features Coming Soon:</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>User registration and authentication</li>
                <li>140-character tweet creation</li>
                <li>Chronological timeline</li>
                <li>Follow/unfollow users</li>
                <li>Like and retweet functionality</li>
              </ul>
            </div>
            
            <div className="flex space-x-4">
              <button className="bg-twitter-500 text-white px-4 py-2 rounded-md hover:bg-twitter-600 transition-colors">
                Get Started
              </button>
              <button className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}