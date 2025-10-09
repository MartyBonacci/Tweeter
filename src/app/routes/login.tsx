import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import LoginForm from "~/components/LoginForm";

export const meta: MetaFunction = () => {
  return [
    { title: "Log In - Tweeter" },
    { name: "description", content: "Log in to your Tweeter account" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  try {
    // Call login API endpoint
    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json(data, { status: response.status });
    }

    // Login successful - redirect to home
    return redirect("/");
  } catch (error) {
    return json(
      { error: "Failed to connect to server" },
      { status: 500 }
    );
  }
}

export default function Login() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <LoginForm />
    </div>
  );
}
