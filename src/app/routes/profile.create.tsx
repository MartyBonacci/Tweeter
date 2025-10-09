import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import ProfileForm from "~/components/ProfileForm";

export const meta: MetaFunction = () => {
  return [
    { title: "Create Profile - Tweeter" },
    { name: "description", content: "Set up your Tweeter profile" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const displayName = formData.get("displayName");
  const bio = formData.get("bio") || "";

  try {
    // Call profile creation API endpoint
    // Note: We need to forward the session cookie
    const cookie = request.headers.get("Cookie");

    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/profiles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookie && { Cookie: cookie }),
        },
        body: JSON.stringify({ displayName, bio }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json(data, { status: response.status });
    }

    // Profile created successfully - redirect to profile view
    // TODO: Get username from session to redirect to /@username
    return redirect("/");
  } catch (error) {
    return json(
      { error: "Failed to connect to server" },
      { status: 500 }
    );
  }
}

export default function ProfileCreate() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <ProfileForm />
    </div>
  );
}
