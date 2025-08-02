import { Form, Link, useActionData } from "react-router";
import { z } from "zod";
import { db } from "~/lib/db/connection";
import { users } from "~/lib/db/schema";
import { hashPassword } from "~/lib/auth/password";
import { uuidv7 } from "uuidv7";
import { eq } from "drizzle-orm";
import { createUserSession, getUserSession } from "~/lib/session.server";

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

export async function loader({ request }: { request: Request }) {
  const user = await getUserSession(request);
  if (user) throw new Response(null, { status: 302, headers: { Location: "/timeline" } });
  return null;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    return Response.json({ errors: validation.error.flatten(), values: data }, { status: 400 });
  }
  
  const { username, email, name, password } = validation.data;
  
  try {
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0) {
      return Response.json({ error: "Username taken", values: data }, { status: 400 });
    }
    
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      return Response.json({ error: "Email registered", values: data }, { status: 400 });
    }
    
    const hashed = await hashPassword(password);
    const user = await db.insert(users).values({
      id: uuidv7(),
      username,
      email,
      displayName: name,
      passwordHash: hashed,
    }).returning({ id: users.id, username: users.username, email: users.email });
    
    return createUserSession(
      { userId: user[0].id, username: user[0].username, email: user[0].email, isAdmin: false },
      "/timeline"
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    return Response.json({ error: errorMessage, values: data }, { status: 500 });
  }
}

export default function RegisterPage() {
  const actionData = useActionData() as any;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Create Account</h1>
      <Form method="post" className="space-y-4">
        <div>
          <label>Username</label>
          <input name="username" type="text" required className="w-full border rounded p-2" />
        </div>
        <div>
          <label>Email</label>
          <input name="email" type="email" required className="w-full border rounded p-2" />
        </div>
        <div>
          <label>Name</label>
          <input name="name" type="text" required className="w-full border rounded p-2" />
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" required className="w-full border rounded p-2" />
        </div>
        {actionData?.error && <p className="text-red-600">{actionData.error}</p>}
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Register</button>
      </Form>
      <p className="mt-4">
        Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
      </p>
    </div>
  );
}