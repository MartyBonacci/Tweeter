/**
 * Example usage of session management utilities in Remix routes
 * 
 * This file demonstrates how to use the session utilities in:
 * 1. Route loaders and actions
 * 2. Form submissions
 * 3. Protected routes
 * 4. API routes
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form, redirect } from "@remix-run/react";
import {
  requireAuth,
  getUserSession,
  createUserSession,
  destroyUserSession,
  isAdmin,
  updateUserSession,
} from "~/lib/session.server";

// =============================================================================
// EXAMPLE 1: Protected Route Loader
// =============================================================================

/**
 * Protected dashboard route that requires authentication
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // This will redirect to login if not authenticated
  const userSession = await requireAuth(request, "/login?redirect=/dashboard");
  
  // Check if user is admin for admin-only features
  const isUserAdmin = await isAdmin(request);
  
  return json({
    user: {
      id: userSession.userId,
      email: userSession.email,
      role: userSession.role,
    },
    isAdmin: isUserAdmin,
    // Your additional data here
  });
}

// =============================================================================
// EXAMPLE 2: Login Action
// =============================================================================

/**
 * Login form action that creates a session
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Validate credentials (implement your own logic)
  const user = await validateCredentials(email, password);
  
  if (!user) {
    return json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }
  
  // Create session and redirect
  return createUserSession(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    "/dashboard"
  );
}

// =============================================================================
// EXAMPLE 3: Logout Action
// =============================================================================

/**
 * Logout action that destroys the session
 */
export async function actionLogout({ request }: ActionFunctionArgs) {
  return destroyUserSession(request, "/login?logout=success");
}

// =============================================================================
// EXAMPLE 4: API Route with Authentication
// =============================================================================

/**
 * Protected API route that requires authentication
 */
export async function loaderApi({ request }: LoaderFunctionArgs) {
  try {
    const userSession = await requireAuth(request);
    
    // Fetch user-specific data
    const userData = await getUserData(userSession.userId);
    
    return json({
      success: true,
      data: userData,
      user: {
        id: userSession.userId,
        email: userSession.email,
      },
    });
  } catch (error) {
    if (error instanceof Response && error.status === 302) {
      // Not authenticated - return 401 instead of redirect
      return json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    throw error;
  }
}

// =============================================================================
// EXAMPLE 5: Conditional Rendering Based on Authentication
// =============================================================================

/**
 * Route that shows different content based on authentication status
 */
export async function loaderConditional({ request }: LoaderFunctionArgs) {
  const userSession = await getUserSession(request);
  
  if (!userSession) {
    return json({
      isAuthenticated: false,
      redirectTo: "/login",
    });
  }
  
  return json({
    isAuthenticated: true,
    user: {
      id: userSession.userId,
      email: userSession.email,
      role: userSession.role,
    },
  });
}

// =============================================================================
// EXAMPLE 6: Admin-Only Route
// =============================================================================

/**
 * Admin-only route that checks for admin role
 */
export async function loaderAdmin({ request }: LoaderFunctionArgs) {
  const userSession = await requireAuth(request);
  
  if (!await isAdmin(request)) {
    throw redirect("/unauthorized");
  }
  
  // Admin-specific data
  const adminData = await getAdminData();
  
  return json({
    adminData,
    user: {
      id: userSession.userId,
      email: userSession.email,
    },
  });
}

// =============================================================================
// EXAMPLE 7: Form Submission with Session Update
// =============================================================================

/**
 * Profile update action that updates session data
 */
export async function actionUpdateProfile({ request }: ActionFunctionArgs) {
  const userSession = await requireAuth(request);
  const formData = await request.formData();
  
  // Update user in database
  await updateUserProfile(userSession.userId, {
    email: formData.get("email") as string,
    // other fields...
  });
  
  // Update session with new email
  const newHeaders = await updateUserSession(request, {
    email: formData.get("email") as string,
  });
  
  return redirect("/profile", {
    headers: newHeaders,
  });
}

// =============================================================================
// EXAMPLE 8: React Component Usage
// =============================================================================

/**
 * Example React component using session data
 */
export default function Dashboard() {
  const { user, isAdmin } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <p>Role: {user.role}</p>
      
      {isAdmin && (
        <div>
          <h2>Admin Panel</h2>
          {/* Admin-only content */}
        </div>
      )}
      
      <Form method="post" action="/logout">
        <button type="submit">Logout</button>
      </Form>
    </div>
  );
}

// =============================================================================
// EXAMPLE 9: Layout Route with Authentication Check
// =============================================================================

/**
 * Layout route that checks authentication for nested routes
 */
export async function loaderLayout({ request }: LoaderFunctionArgs) {
  const userSession = await getUserSession(request);
  
  return json({
    user: userSession ? {
      id: userSession.userId,
      email: userSession.email,
      role: userSession.role,
    } : null,
  });
}

// =============================================================================
// EXAMPLE 10: Error Boundaries with Authentication
// =============================================================================

/**
 * Error boundary that handles authentication errors
 */
export function ErrorBoundary() {
  // Remix will handle the redirect from requireAuth
  // This is mainly for unexpected errors
  return (
    <div>
      <h1>Something went wrong</h1>
      <a href="/login">Go to login</a>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS (Implement these based on your needs)
// =============================================================================

async function validateCredentials(email: string, password: string) {
  // Implement your credential validation logic
  // This is just a stub
  if (email === "test@example.com" && password === "password") {
    return {
      id: "123",
      email: "test@example.com",
      role: "user" as const,
    };
  }
  return null;
}

async function getUserData(userId: string) {
  // Implement your user data fetching logic
  return { id: userId, preferences: {} };
}

async function getAdminData() {
  // Implement your admin data fetching logic
  return { users: [], stats: {} };
}

async function updateUserProfile(userId: string, updates: { email: string }) {
  // Implement your user profile update logic
  console.log(`Updating user ${userId} with:`, updates);
}

// =============================================================================
// MIDDLEWARE PATTERN (For route organization)
// =============================================================================

/**
 * Middleware pattern for authentication
 */
export async function withAuth(
  loader: (args: LoaderFunctionArgs, userSession: any) => Promise<Response>
) {
  return async (args: LoaderFunctionArgs) => {
    const userSession = await requireAuth(args.request);
    return loader(args, userSession);
  };
}

/**
 * Usage of middleware pattern
 */
export const protectedLoader = withAuth(async ({ request }, userSession) => {
  // This loader is guaranteed to have an authenticated user
  const data = await getUserData(userSession.userId);
  
  return json({
    user: userSession,
    data,
  });
});

// =============================================================================
// SECURITY BEST PRACTICES
// =============================================================================

/**
 * Security headers for authenticated routes
 */
export function getSecurityHeaders() {
  return {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  };
}

/**
 * Use in authenticated routes
 */
export async function loaderWithSecurity({ request }: LoaderFunctionArgs) {
  const userSession = await requireAuth(request);
  
  return json(
    { user: userSession },
    { headers: getSecurityHeaders() }
  );
}