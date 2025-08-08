import { Form, Link, useActionData } from "react-router";
import { registerSchema } from "~/models/auth/auth.validator";
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
  
  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    return Response.json({ errors: validation.error.flatten(), values: data }, { status: 400 });
  }
  
  const { username, email, name, password } = validation.data;
  
  try {
    const registerData = {
      username,
      email,
      name,
      password,
    };
    
    const { user } = await Index.register(registerData);
    
    return createUserSession(
      { userId: user.id, username: user.username, email: user.email },
      "/timeline"
    );
    
  } catch (error: any) {
    const errorMessage = error.message || 'Registration failed';
    return Response.json({ error: errorMessage, values: data }, { status: 400 });
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