import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import { Timeline } from '../components/Timeline';
import { useUser } from '../hooks/useUser';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function Home() {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex max-w-7xl mx-auto">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
          <div className="border-b border-gray-200 p-4">
            <h1 className="text-xl font-bold">Home</h1>
          </div>
          
          <Timeline />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}