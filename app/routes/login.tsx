import { Form, Link, useActionData } from "react-router";
import { loginSchema } from "~/models/auth/auth.validator";
import { Index } from "~/models/auth";
import { createUserSession, getUserSession } from "~/lib/session.server";

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
    const loginData = { username, password };
    
    const { user } = await Index.login(loginData);
    
    return createUserSession(
      { userId: user.id, username: user.username, email: user.email },
      "/timeline"
    );
    
  } catch (error: any) {
    const errorMessage = error.message || "Invalid credentials";
    return Response.json({ error: errorMessage, values: data }, { status: 401 });
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