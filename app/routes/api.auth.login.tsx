import { db } from "../db/drizzle";
import { users } from "../db/schema";
import { verifyPassword, generateToken } from "../lib/auth.server";
import { userLoginSchema } from "../lib/schemas";
import { validateFormData, createValidationErrorResponse } from "../lib/validation-middleware";
import { eq } from "drizzle-orm";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    
    // Validate input using Zod schema
    const validation = validateFormData(formData, userLoginSchema);
    
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }
    
    const { username, password } = validation.data;

    // Find user by username or email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username)) // Already transformed to lowercase by Zod
      .limit(1);

    if (!user) {
      // Don't reveal whether username or password was wrong
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return new Response(JSON.stringify({ 
        message: "Please verify your email address before logging in. Check your email for the verification link.",
        requiresEmailVerification: true,
        email: user.email
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
      },
      token,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}