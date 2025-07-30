import { db } from "../db/drizzle";
import { users } from "../db/schema";
import { hashPassword, generateToken } from "../lib/auth.server";
import { userRegistrationSchema } from "../lib/schemas";
import { validateFormData, createValidationErrorResponse } from "../lib/validation-middleware";
import { eq } from "drizzle-orm";
import { generateVerificationToken, sendVerificationEmail } from "../lib/email.server";

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
    const validation = validateFormData(formData, userRegistrationSchema);
    
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }
    
    const { username, email, password, displayName } = validation.data;

    // Check if username already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return new Response(JSON.stringify({
        errors: [{ field: "username", message: "Username already taken" }]
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if email already exists
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return new Response(JSON.stringify({
        errors: [{ field: "email", message: "Email already registered" }]
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password and create user with email verification
    const passwordHash = await hashPassword(password);
    const verificationToken = generateVerificationToken();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const [newUser] = await db
      .insert(users)
      .values({
        username, // Already transformed to lowercase by Zod
        email, // Already transformed to lowercase by Zod
        password_hash: passwordHash,
        display_name: displayName || username,
        email_verified: false,
        verification_token: verificationToken,
        token_expires: tokenExpires,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.display_name,
      });

    // Send verification email
    try {
      await sendVerificationEmail(email, username, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Continue with registration even if email fails
    }

    return new Response(JSON.stringify({
      message: "User registered successfully. Please check your email to verify your account.",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        emailVerified: false
      },
      requiresEmailVerification: true
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}