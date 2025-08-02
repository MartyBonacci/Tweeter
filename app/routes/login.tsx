import { Form, Link, useActionData } from "react-router";
import { z } from "zod";
import { db } from "~/lib/db/connection";
import { users } from "~/lib/db/schema";
import { verifyPassword } from "~/lib/auth/password";
import { eq } from "drizzle-orm";
import { createUserSession, getUserSession } from "~/lib/session.server";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function loader({ request }: { request: Request }) {
  const user = await getUserSession(request);
  if (user) throw new Response(null, { status: 302, headers: { Location: "/timeline" } });
  return null;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    return Response.json({ error: "Invalid input", values: data }, { status: 400 });
  }
  
  const { username, password } = validation.data;
  
  try {
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (user.length === 0) {
      return Response.json({ error: "Invalid credentials", values: data }, { status: 401 });
    }
    
    const isValid = await verifyPassword(password, user[0].password);
    if (!isValid) {
      return Response.json({ error: "Invalid credentials", values: data }, { status: 401 });
    }
    
    return createUserSession(
      { userId: user[0].id, username: user[0].username, email: user[0].email },
      "/timeline"
    );
    
  } catch (error) {
    return Response.json({ error: "Server error", values: data }, { status: 500 });
  }
}

export default function LoginPage() {
  const actionData = useActionData() as any;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      <Form method="post" className="space-y-4">
        <div>
          <label>Username</label>
          <input name="username" type="text" required className="w-full border rounded p-2" />
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" required className="w-full border rounded p-2" />
        </div>
        {actionData?.error && <p className="text-red-600">{actionData.error}</p>}
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
      </Form>
      <p className="mt-4">
        Don't have an account? <Link to="/register" className="text-blue-600">Register</Link>
      </p>
    </div>
  );
}