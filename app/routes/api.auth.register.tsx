import { db } from "../db/drizzle";
import { users } from "../db/schema";
import { hashPassword, generateToken } from "../lib/auth.server";
import { validateUsername, validateEmail, validatePassword } from "../lib/validation";
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
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const displayName = formData.get("displayName") as string;

    // Validate input
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    const errors = [
      ...usernameValidation.errors,
      ...emailValidation.errors,
      ...passwordValidation.errors,
    ];

    if (errors.length > 0) {
      return new Response(JSON.stringify({ errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    const [newUser] = await db
      .insert(users)
      .values({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        display_name: displayName || username,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.display_name,
      });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      username: newUser.username,
    });

    return new Response(JSON.stringify({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
      },
      token,
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