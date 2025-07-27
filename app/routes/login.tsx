import LoginForm from '../components/LoginForm';
import { data, redirect } from 'react-router';
import { db } from '../db/drizzle';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, generateToken } from '../lib/auth.server';

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return data({ error: 'Username and password are required' }, { status: 400 });
  }

  try {
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (user.length === 0) {
      return data({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user[0].password_hash);
    
    if (!isValid) {
      return data({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = generateToken({
      userId: user[0].id,
      username: user[0].username
    });

    return data({
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        displayName: user[0].display_name,
      },
      token
    });
  } catch (error) {
    return data({ error: 'An error occurred during login' }, { status: 500 });
  }
}

export default function Login() {
  return <LoginForm />;
}