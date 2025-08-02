import { createCookieSessionStorage } from "react-router";
import { z } from "zod";

const sessionSchema = z.object({
  userId: z.string().uuid(),
  username: z.string().min(3).max(20),
  email: z.string().email(),
  isAdmin: z.boolean().optional().default(false),
});

export type UserSession = z.infer<typeof sessionSchema>;

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set in environment variables");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_tweeter_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

export async function getUserSession(request: Request): Promise<UserSession | null> {
  const cookie = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookie);
  const userData = session.get("user");
  
  if (!userData) return null;
  
  try {
    return sessionSchema.parse(userData);
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request): Promise<UserSession> {
  const user = await getUserSession(request);
  if (!user) {
    throw new Response(null, { 
      status: 302, 
      headers: { Location: "/login" } 
    });
  }
  return user;
}

export async function createUserSession(user: UserSession, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("user", user);
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function destroyUserSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookie);
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}