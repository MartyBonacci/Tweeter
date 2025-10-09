import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import RegisterForm from "~/components/RegisterForm";

export const meta: MetaFunction = () => {
  return [
    { title: "Register - Tweeter" },
    { name: "description", content: "Create your Tweeter account" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  try {
    // Call registration API endpoint
    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json(data, { status: response.status });
    }

    // Registration successful - redirect to profile creation
    return redirect("/profile/create");
  } catch (error) {
    return json(
      { error: "Failed to connect to server" },
      { status: 500 }
    );
  }
}

export default function Register() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <RegisterForm />
    </div>
  );
}
