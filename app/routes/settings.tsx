import { Form, useActionData, useLoaderData } from "react-router";
import { z } from "zod";
import { db } from "~/lib/db/connection";
import { users } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "~/lib/session.server";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  location: z.string().max(50, "Location must be 50 characters or less").optional(),
  website: z.string().url().optional().or(z.literal("")),
});

export async function loader({ request }: { request: Request }) {
  const user = await requireAuth(request);
  
  const currentUser = await db
    .select()
    .from(users)
    .where(eq(users.id, user.userId))
    .limit(1);

  return { user: currentUser[0] };
}

export async function action({ request }: { request: Request }) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  const validation = settingsSchema.safeParse(data);
  
  if (!validation.success) {
    return Response.json(
      { 
        error: "Validation failed", 
        errors: validation.error.flatten(),
        values: data 
      },
      { status: 400 }
    );
  }

  const { name, bio, location, website } = validation.data;
  
  try {
    await db
      .update(users)
      .set({
        name: name || null,
        bio: bio || null,
        location: location || null,
        website: website || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.userId));

    return Response.json({ success: true, message: "Profile updated successfully" });
    
  } catch (error) {
    return Response.json(
      { error: "Failed to update profile", errors: {}, values: data },
      { status: 500 }
    );
  }
}

export default function SettingsPage() {
  const { user } = useLoaderData() as { user: any };
  const actionData = useActionData() as any;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        {actionData?.success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{actionData.message}</p>
          </div>
        )}
        
        {actionData?.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{actionData.error}</p>
          </div>
        )}

        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={user.name}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {actionData?.errors?.fieldErrors?.name && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.fieldErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              name="bio"
              id="bio"
              rows={3}
              maxLength={160}
              defaultValue={user.bio || ""}
              placeholder="Tell us about yourself..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Brief description for your profile. 160 characters or less.
            </p>
            {actionData?.errors?.fieldErrors?.bio && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.fieldErrors.bio[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              name="location"
              id="location"
              defaultValue={user.location || ""}
              placeholder="City, Country"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {actionData?.errors?.fieldErrors?.location && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.fieldErrors.location[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              type="url"
              name="website"
              id="website"
              defaultValue={user.website || ""}
              placeholder="https://example.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {actionData?.errors?.fieldErrors?.website && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.fieldErrors.website[0]}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </Form>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Username</dt>
            <dd className="mt-1 text-sm text-gray-900">@{user.username}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Joined</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}