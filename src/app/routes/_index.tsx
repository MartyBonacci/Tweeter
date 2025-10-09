import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import Navigation from "~/components/Navigation";

export const meta: MetaFunction = () => {
  return [
    { title: "Tweeter - Share in 141 characters" },
    { name: "description", content: "Welcome to Tweeter!" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Tweeter
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Share your thoughts in 141 characters
          </p>
          <p className="text-gray-500 mb-8">
            Better than Twitter... we have 141 characters!
          </p>

          <div className="space-x-4">
            <Link
              to="/register"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Log In
            </Link>
          </div>

          <div className="mt-12 text-sm text-gray-500">
            <p className="font-medium mb-2">Current Features:</p>
            <ul className="space-y-1">
              <li>✓ User registration and authentication</li>
              <li>✓ Profile creation with 141-char bio limit</li>
              <li>✓ Public profile viewing</li>
              <li>✓ 30-day persistent sessions</li>
              <li>✓ Post tweets (141 characters max)</li>
              <li>✓ View tweets on profiles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
