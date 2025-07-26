import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export async function loader() {
  return null;
}

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return null;
}