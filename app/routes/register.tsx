import RegisterForm from '../components/RegisterForm';
import { data, redirect } from 'react-router';
import { db } from '../db/drizzle';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const displayName = formData.get('displayName') as string;

  if (!username || !email || !password) {
    return data({ error: 'All fields are required' }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return data({ error: 'Passwords do not match' }, { status: 400 });
  }

  if (password.length < 6) {
    return data({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  if (username.length < 3) {
    return data({ error: 'Username must be at least 3 characters' }, { status: 400 });
  }

  try {
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUser.length > 0) {
      return data({ error: 'Username already taken' }, { status: 400 });
    }

    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      return data({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      username,
      email,
      password_hash: hashedPassword,
      display_name: displayName || username,
    }).returning();

    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return data({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.display_name,
      },
      token
    });
  } catch (error) {
    return data({ error: 'An error occurred during registration' }, { status: 500 });
  }
}

export default function Register() {
  return <RegisterForm />;
}