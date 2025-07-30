import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Meta, Links, Outlet, Scripts, useNavigate, useActionData, Form, data, Link, useLocation, useFetcher, useLoaderData, UNSAFE_withErrorBoundaryProps, useSearchParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import React, { useEffect, useState, memo, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, timestamp, uuid, primaryKey, varchar, text, boolean } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { relations, eq, count, desc, inArray, and, gt, or, ilike, sql } from "drizzle-orm";
import { formatDistanceToNow, format } from "date-fns";
import formData from "form-data";
import Mailgun from "mailgun.js";
import { v2 } from "cloudinary";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const styles = "/assets/tailwind-nkX6CvnV.css";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const JWT_EXPIRES_IN = "24h";
const scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return salt + ":" + derivedKey.toString("hex");
}
async function verifyPassword(password, hash) {
  const [salt, key] = hash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return timingSafeEqual(keyBuffer, derivedKey);
}
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
async function requireAuth(request) {
  const token = extractTokenFromHeader(request.headers.get("Authorization"));
  if (!token) {
    throw new Response(JSON.stringify({ message: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const payload = verifyToken(token);
    return {
      userId: payload.userId,
      username: payload.username
    };
  } catch (error) {
    throw new Response(JSON.stringify({ message: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function optionalAuth(request) {
  const token = extractTokenFromHeader(request.headers.get("Authorization"));
  if (!token) {
    return null;
  }
  try {
    const payload = verifyToken(token);
    return {
      userId: payload.userId,
      username: payload.username
    };
  } catch (error) {
    return null;
  }
}
const links = () => [{
  rel: "stylesheet",
  href: styles
}];
async function loader$9({
  request
}) {
  const user = await optionalAuth(request);
  return {
    user
  };
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("link", {
        rel: "icon",
        href: "data:image/x-icon;base64,AA"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {}), /* @__PURE__ */ jsx("title", {
        children: "Tweeter"
      })]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: root,
  links,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
async function loader$8() {
  return null;
}
const _index = UNSAFE_withComponentProps(function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    } else {
      navigate("/login");
    }
  }, [navigate]);
  return null;
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _index,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
const userRegistrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").max(50, "Username must be at most 50 characters long").regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens").transform((val) => val.toLowerCase()),
  email: z.string().email("Please enter a valid email address").transform((val) => val.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters long").max(128, "Password must be at most 128 characters long").regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter").regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter").regex(/(?=.*\d)/, "Password must contain at least one number"),
  displayName: z.string().max(100, "Display name must be at most 100 characters long").optional()
});
const userLoginSchema = z.object({
  username: z.string().min(1, "Username is required").transform((val) => val.toLowerCase()),
  password: z.string().min(1, "Password is required")
});
const tweetContentSchema = z.object({
  content: z.string().min(1, "Tweet content is required").max(140, "Tweet must be 140 characters or less").transform((val) => val.trim())
});
z.object({
  username: z.string().min(1, "Username parameter is required").transform((val) => val.toLowerCase())
});
z.object({
  tweetId: z.string().uuid("Invalid tweet ID format")
});
const paginationQuerySchema = z.object({
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 20).refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
  offset: z.string().optional().transform((val) => val ? parseInt(val) : 0).refine((val) => val >= 0, "Offset must be non-negative"),
  filter: z.enum(["all", "following"]).optional().default("all")
});
const userProfileUpdateSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50, "Display name must be at most 50 characters long").trim(),
  username: z.string().min(1, "Username is required").max(15, "Username must be at most 15 characters long").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").transform((val) => val.toLowerCase()),
  bio: z.string().max(160, "Bio must be at most 160 characters long").transform((val) => val.trim() === "" ? "" : val).optional(),
  avatar: z.string().transform((val) => val.trim() === "" ? "" : val).refine((val) => val === "" || /^https?:\/\/.+/.test(val), "Avatar URL must be a valid URL").optional()
});
z.object({
  action: z.enum(["follow", "unfollow"])
});
function LoginForm() {
  const actionData = useActionData();
  const {
    register: register2,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm({
    resolver: zodResolver(userLoginSchema)
  });
  React.useEffect(() => {
    if (actionData?.errors) {
      actionData.errors.forEach((error) => {
        setError(error.field, { message: error.message });
      });
    }
  }, [actionData?.errors, setError]);
  React.useEffect(() => {
    if (actionData?.token && actionData?.user) {
      localStorage.setItem("token", actionData.token);
      localStorage.setItem("user", JSON.stringify(actionData.user));
      window.location.href = "/home";
    }
  }, [actionData]);
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: "Sign in to your account" }) }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "mt-8 space-y-6", children: [
      actionData?.error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded", children: actionData.error }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-md shadow-sm -space-y-px", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "username", className: "sr-only", children: "Username" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ...register2("username"),
              id: "username",
              type: "text",
              className: `appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${errors.username ? "border-red-500" : "border-gray-300"}`,
              placeholder: "Username"
            }
          ),
          errors.username && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.username.message })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "sr-only", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ...register2("password"),
              id: "password",
              type: "password",
              className: `appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${errors.password ? "border-red-500" : "border-gray-300"}`,
              placeholder: "Password"
            }
          ),
          errors.password && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.password.message })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: isSubmitting,
          className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
          children: isSubmitting ? "Signing in..." : "Sign in"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx("a", { href: "/register", className: "text-blue-600 hover:text-blue-500", children: "Don't have an account? Sign up" }) })
    ] })
  ] }) });
}
const likes = pgTable("likes", {
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tweet_id: uuid("tweet_id").notNull().references(() => tweets.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.tweet_id] })
}));
const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.user_id],
    references: [users.id]
  }),
  tweet: one(tweets, {
    fields: [likes.tweet_id],
    references: [tweets.id]
  })
}));
const tweets = pgTable("tweets", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: varchar("content", { length: 140 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
const tweetsRelations = relations(tweets, ({ one, many }) => ({
  user: one(users, {
    fields: [tweets.user_id],
    references: [users.id]
  }),
  likes: many(likes)
}));
const follows = pgTable("follows", {
  follower_id: uuid("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  following_id: uuid("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.follower_id, table.following_id] })
}));
const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.follower_id],
    references: [users.id],
    relationName: "follower"
  }),
  following: one(users, {
    fields: [follows.following_id],
    references: [users.id],
    relationName: "following"
  })
}));
const users = pgTable("users", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: text("password_hash").notNull(),
  display_name: varchar("display_name", { length: 100 }),
  bio: text("bio"),
  avatar_url: text("avatar_url"),
  email_verified: boolean("email_verified").default(false).notNull(),
  verification_token: text("verification_token"),
  token_expires: timestamp("token_expires"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
const usersRelations = relations(users, ({ many }) => ({
  tweets: many(tweets),
  followers: many(follows, {
    relationName: "following"
  }),
  following: many(follows, {
    relationName: "follower"
  }),
  likes: many(likes)
}));
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  follows,
  followsRelations,
  likes,
  likesRelations,
  tweets,
  tweetsRelations,
  users,
  usersRelations
}, Symbol.toStringTag, { value: "Module" }));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool, { schema });
async function action$8({
  request
}) {
  const formData2 = await request.formData();
  const username = formData2.get("username");
  const password = formData2.get("password");
  if (!username || !password) {
    return data({
      error: "Username and password are required"
    }, {
      status: 400
    });
  }
  try {
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (user.length === 0) {
      return data({
        error: "Invalid username or password"
      }, {
        status: 401
      });
    }
    const isValid = await verifyPassword(password, user[0].password_hash);
    if (!isValid) {
      return data({
        error: "Invalid username or password"
      }, {
        status: 401
      });
    }
    const token = generateToken({
      userId: user[0].id,
      username: user[0].username
    });
    return data({
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        displayName: user[0].display_name
      },
      token
    });
  } catch (error) {
    return data({
      error: "An error occurred during login"
    }, {
      status: 500
    });
  }
}
const login = UNSAFE_withComponentProps(function Login() {
  return /* @__PURE__ */ jsx(LoginForm, {});
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8,
  default: login
}, Symbol.toStringTag, { value: "Module" }));
function RegisterForm() {
  const actionData = useActionData();
  const {
    register: register2,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm({
    resolver: zodResolver(userRegistrationSchema)
  });
  React.useEffect(() => {
    if (actionData?.errors) {
      actionData.errors.forEach((error) => {
        setError(error.field, { message: error.message });
      });
    }
  }, [actionData?.errors, setError]);
  React.useEffect(() => {
    if (actionData?.token && actionData?.user) {
      localStorage.setItem("token", actionData.token);
      localStorage.setItem("user", JSON.stringify(actionData.user));
      window.location.href = "/home";
    }
  }, [actionData]);
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: "Create your account" }) }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "mt-8 space-y-6", children: [
      actionData?.error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded", children: actionData.error }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "username", className: "block text-sm font-medium text-gray-700", children: "Username" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ...register2("username"),
              id: "username",
              type: "text",
              className: `mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.username ? "border-red-500" : "border-gray-300"}`,
              placeholder: "Choose a username"
            }
          ),
          errors.username && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.username.message })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email address" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ...register2("email"),
              id: "email",
              type: "email",
              className: `mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.email ? "border-red-500" : "border-gray-300"}`,
              placeholder: "Enter your email"
            }
          ),
          errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email.message })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "displayName", className: "block text-sm font-medium text-gray-700", children: "Display Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ...register2("displayName"),
              id: "displayName",
              type: "text",
              className: `mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.displayName ? "border-red-500" : "border-gray-300"}`,
              placeholder: "Your display name (optional)"
            }
          ),
          errors.displayName && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.displayName.message })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ...register2("password"),
              id: "password",
              type: "password",
              className: `mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.password ? "border-red-500" : "border-gray-300"}`,
              placeholder: "Create a password"
            }
          ),
          errors.password && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.password.message })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: isSubmitting,
          className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
          children: isSubmitting ? "Creating account..." : "Sign up"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx("a", { href: "/login", className: "text-blue-600 hover:text-blue-500", children: "Already have an account? Sign in" }) })
    ] })
  ] }) });
}
async function action$7({
  request
}) {
  const formData2 = await request.formData();
  const username = formData2.get("username");
  const email = formData2.get("email");
  const password = formData2.get("password");
  const confirmPassword = formData2.get("confirmPassword");
  const displayName = formData2.get("displayName");
  if (!username || !email || !password) {
    return data({
      error: "All fields are required"
    }, {
      status: 400
    });
  }
  if (password !== confirmPassword) {
    return data({
      error: "Passwords do not match"
    }, {
      status: 400
    });
  }
  if (password.length < 6) {
    return data({
      error: "Password must be at least 6 characters"
    }, {
      status: 400
    });
  }
  if (username.length < 3) {
    return data({
      error: "Username must be at least 3 characters"
    }, {
      status: 400
    });
  }
  try {
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUser.length > 0) {
      return data({
        error: "Username already taken"
      }, {
        status: 400
      });
    }
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      return data({
        error: "Email already registered"
      }, {
        status: 400
      });
    }
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      username,
      email,
      password_hash: hashedPassword,
      display_name: displayName || username
    }).returning();
    const token = generateToken({
      userId: newUser.id,
      username: newUser.username
    });
    return data({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.display_name
      },
      token
    });
  } catch (error) {
    return data({
      error: "An error occurred during registration"
    }, {
      status: 500
    });
  }
}
const register = UNSAFE_withComponentProps(function Register() {
  return /* @__PURE__ */ jsx(RegisterForm, {});
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7,
  default: register
}, Symbol.toStringTag, { value: "Module" }));
function useUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser({
            userId: payload.userId,
            username: payload.username
          });
        } catch (error) {
          console.error("Invalid token:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    updateUser();
    window.addEventListener("storage", updateUser);
    window.addEventListener("tokenChanged", updateUser);
    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("tokenChanged", updateUser);
    };
  }, []);
  return { user, isLoading };
}
const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-2xl"
};
const Avatar = memo(function Avatar2({
  src,
  alt,
  size = "md",
  className = ""
}) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  const getInitial = () => {
    if (!alt) return "U";
    return alt.charAt(0).toUpperCase();
  };
  if (src && !imageError) {
    return /* @__PURE__ */ jsx(
      "img",
      {
        src,
        alt,
        className: `${sizeClass} rounded-full object-cover ${className}`,
        onError: () => {
          setImageError(true);
        }
      }
    );
  }
  return /* @__PURE__ */ jsx("div", { className: `${sizeClass} rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 ${className}`, children: /* @__PURE__ */ jsx("span", { className: `font-semibold text-gray-600 ${size === "xs" ? "text-xs" : size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : size === "xl" ? "text-2xl" : "text-lg"}`, children: getInitial() }) });
});
const SearchBox = memo(function SearchBox2({
  placeholder = "Search Tweeter",
  onResultSelect,
  className = ""
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data2 = await response.json();
        setResults(data2);
        setIsOpen(true);
        setSelectedIndex(-1);
      } else {
        setResults(null);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults(null);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const debouncedSearch = useCallback((searchQuery) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  }, [performSearch]);
  useEffect(() => {
    if (query.length > 0) {
      debouncedSearch(query);
    } else {
      setResults(null);
      setIsOpen(false);
    }
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debouncedSearch]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleKeyDown = (e) => {
    if (!isOpen || !results) return;
    const totalResults = results.users.length + results.hashtags.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalResults);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => prev <= 0 ? totalResults - 1 : prev - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < results.users.length) {
            const user = results.users[selectedIndex];
            window.location.href = `/users/${user.username}`;
          } else {
            const hashtagIndex = selectedIndex - results.users.length;
            const hashtag = results.hashtags[hashtagIndex];
            setQuery(`#${hashtag.tag}`);
            setIsOpen(false);
          }
        } else if (query.trim()) {
          window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };
  const handleResultClick = () => {
    setIsOpen(false);
    onResultSelect?.();
  };
  const hasResults = results && (results.users.length > 0 || results.hashtags.length > 0);
  return /* @__PURE__ */ jsxs("div", { ref: searchRef, className: `relative ${className}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: inputRef,
          type: "text",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          onKeyDown: handleKeyDown,
          onFocus: () => query && hasResults && setIsOpen(true),
          placeholder,
          className: "block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
        }
      ),
      isLoading && /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 right-0 pr-3 flex items-center", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" }) })
    ] }),
    isOpen && hasResults && /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto", children: [
      results.users.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2", children: [
        /* @__PURE__ */ jsx("div", { className: "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide", children: "People" }),
        results.users.map((user, index) => /* @__PURE__ */ jsxs(
          Link,
          {
            to: `/users/${user.username}`,
            onClick: handleResultClick,
            className: `flex items-center px-3 py-2 rounded-md hover:bg-gray-50 ${selectedIndex === index ? "bg-blue-50" : ""}`,
            children: [
              /* @__PURE__ */ jsx(
                Avatar,
                {
                  src: user.avatar,
                  alt: user.displayName,
                  size: "sm",
                  className: "w-10 h-10"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "ml-3 flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: user.displayName }),
                  user.verified && /* @__PURE__ */ jsx("svg", { className: "ml-1 w-4 h-4 text-blue-500", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500 truncate", children: [
                  "@",
                  user.username
                ] }),
                user.bio && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 truncate mt-1", children: user.bio })
              ] })
            ]
          },
          user.id
        ))
      ] }),
      results.hashtags.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2 border-t border-gray-100", children: [
        /* @__PURE__ */ jsx("div", { className: "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide", children: "Hashtags" }),
        results.hashtags.map((hashtag, index) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              setQuery(`#${hashtag.tag}`);
              setIsOpen(false);
              window.location.href = `/search?q=${encodeURIComponent(`#${hashtag.tag}`)}`;
            },
            className: `w-full text-left flex items-center px-3 py-2 rounded-md hover:bg-gray-50 ${selectedIndex === results.users.length + index ? "bg-blue-50" : ""}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-blue-600 font-bold", children: "#" }) }),
              /* @__PURE__ */ jsxs("div", { className: "ml-3 flex-1", children: [
                /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-gray-900", children: [
                  "#",
                  hashtag.tag
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                  hashtag.count,
                  " tweets"
                ] })
              ] })
            ]
          },
          hashtag.tag
        ))
      ] }),
      query && !isLoading && /* @__PURE__ */ jsx("div", { className: "p-2 border-t border-gray-100", children: /* @__PURE__ */ jsxs(
        Link,
        {
          to: `/search?q=${encodeURIComponent(query)}`,
          onClick: handleResultClick,
          className: "flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }),
            'Search for "',
            query,
            '"'
          ]
        }
      ) })
    ] })
  ] });
});
function Header() {
  const { user: currentUser } = useUser();
  return /* @__PURE__ */ jsx("header", { className: "bg-white border-b border-gray-200 sticky top-0 z-50", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center h-16", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsx(Link, { to: "/", className: "text-2xl font-bold text-blue-500", children: "Tweeter" }) }),
    /* @__PURE__ */ jsx("div", { className: "hidden md:flex flex-1 max-w-md mx-8", children: /* @__PURE__ */ jsx(SearchBox, { className: "w-full" }) }),
    /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex space-x-8", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium", children: "Home" }),
      /* @__PURE__ */ jsx(Link, { to: "/explore", className: "text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium", children: "Explore" }),
      /* @__PURE__ */ jsx(Link, { to: "/notifications", className: "text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium", children: "Notifications" }),
      /* @__PURE__ */ jsx(Link, { to: "/messages", className: "text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium", children: "Messages" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
      /* @__PURE__ */ jsx("button", { className: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium", children: "Tweet" }),
      currentUser && /* @__PURE__ */ jsx(
        Link,
        {
          to: `/users/${currentUser.username}`,
          className: "w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold hover:bg-gray-400 transition-colors",
          children: currentUser.username?.charAt(0)?.toUpperCase() || "U"
        }
      )
    ] })
  ] }) }) });
}
function Sidebar() {
  return /* @__PURE__ */ jsx("aside", { className: "hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen", children: /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-4", children: [
    /* @__PURE__ */ jsxs("nav", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Home" })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/explore", className: "flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Explore" })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/notifications", className: "flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Notifications" })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/messages", className: "flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Messages" })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/bookmarks", className: "flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Bookmarks" })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/profile", className: "flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Profile" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full mt-8", children: "Tweet" })
  ] }) });
}
function MobileNav() {
  const location = useLocation();
  const { user: currentUser } = useUser();
  const isActive = (path) => location.pathname === path;
  return /* @__PURE__ */ jsx("nav", { className: "lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-around items-center h-16 max-w-md mx-auto", children: [
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/home",
        className: `flex flex-col items-center py-2 px-3 ${isActive("/home") ? "text-blue-500" : "text-gray-600"} transition-colors`,
        children: [
          /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-xs mt-1 font-medium", children: "Home" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/explore",
        className: `flex flex-col items-center py-2 px-3 ${isActive("/explore") ? "text-blue-500" : "text-gray-600"} transition-colors`,
        children: [
          /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-xs mt-1 font-medium", children: "Search" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/notifications",
        className: `flex flex-col items-center py-2 px-3 ${isActive("/notifications") ? "text-blue-500" : "text-gray-600"} transition-colors`,
        children: [
          /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-xs mt-1 font-medium", children: "Alerts" })
        ]
      }
    ),
    currentUser && /* @__PURE__ */ jsxs(
      Link,
      {
        to: `/users/${currentUser.username}`,
        className: `flex flex-col items-center py-2 px-3 ${location.pathname === `/users/${currentUser.username}` ? "text-blue-500" : "text-gray-600"} transition-colors`,
        children: [
          /* @__PURE__ */ jsx(
            Avatar,
            {
              src: currentUser.avatar,
              alt: currentUser.displayName || currentUser.username,
              size: "xs",
              className: "w-6 h-6"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-xs mt-1 font-medium", children: "Profile" })
        ]
      }
    )
  ] }) });
}
const Tweet = React.memo(function Tweet2({ tweet }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.likeCount);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    checkLikeStatus();
  }, [tweet.id]);
  const checkLikeStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(`/api/tweets/${tweet.id}/like`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data2 = await response.json();
        setIsLiked(data2.isLiked);
        setLikeCount(data2.likeCount);
      }
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };
  const handleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setIsLoading(true);
    try {
      const method = isLiked ? "DELETE" : "POST";
      const response = await fetch(`/api/tweets/${tweet.id}/like`, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data2 = await response.json();
        setIsLiked(!isLiked);
        setLikeCount(data2.likeCount);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const formatContent = (content) => {
    return content.split("\n").map((line, i) => /* @__PURE__ */ jsxs("span", { children: [
      line,
      i < content.split("\n").length - 1 && /* @__PURE__ */ jsx("br", {})
    ] }, i));
  };
  return /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
    /* @__PURE__ */ jsx(
      Avatar,
      {
        src: tweet.user.avatar,
        alt: tweet.user.displayName || tweet.user.username,
        size: "md"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            to: `/users/${tweet.user.username}`,
            className: "font-semibold text-gray-900 hover:underline",
            children: tweet.user.displayName || tweet.user.username
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: `/users/${tweet.user.username}`,
            className: "text-gray-500 hover:underline",
            children: [
              "@",
              tweet.user.username
            ]
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "·" }),
        /* @__PURE__ */ jsx("time", { className: "text-gray-500", dateTime: tweet.created_at, children: formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 text-gray-900 whitespace-pre-wrap", children: formatContent(tweet.content) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center space-x-8", children: [
        /* @__PURE__ */ jsxs("button", { className: "flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors", children: [
          /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "0" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleLike,
            disabled: isLoading,
            className: `flex items-center space-x-2 transition-colors ${isLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"} disabled:opacity-50 disabled:cursor-not-allowed`,
            children: [
              /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: isLiked ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm", children: likeCount || "" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("button", { className: "flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors", children: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }) })
      ] })
    ] })
  ] }) });
});
function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        const payload = JSON.parse(atob(token.split(".")[1]));
        const username = payload.username;
        const response = await fetch(`/api/users/${username}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data2 = await response.json();
          setUser({
            userId: data2.user.id,
            username: data2.user.username,
            displayName: data2.user.displayName,
            bio: data2.user.bio,
            avatar: data2.user.avatar,
            email: data2.user.email
          });
        } else {
          setError("Failed to fetch user profile");
          setUser(null);
        }
      } catch (error2) {
        console.error("Error fetching current user:", error2);
        setError("Failed to fetch user profile");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentUser();
    window.addEventListener("storage", fetchCurrentUser);
    window.addEventListener("tokenChanged", fetchCurrentUser);
    return () => {
      window.removeEventListener("storage", fetchCurrentUser);
      window.removeEventListener("tokenChanged", fetchCurrentUser);
    };
  }, []);
  return { user, isLoading, error };
}
function TweetForm() {
  const [token, setToken] = useState("");
  const { user } = useCurrentUser();
  const actionData = useActionData();
  const {
    register: register2,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setError
  } = useForm({
    resolver: zodResolver(tweetContentSchema),
    defaultValues: { content: "" }
  });
  const content = watch("content") || "";
  const charCount = content.length;
  const isOverLimit = charCount > 140;
  const remainingChars = 140 - charCount;
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token") || "");
    }
  }, []);
  React.useEffect(() => {
    if (actionData?.errors) {
      actionData.errors.forEach((error) => {
        setError(error.field, { message: error.message });
      });
    }
  }, [actionData?.errors, setError]);
  React.useEffect(() => {
    if (actionData?.tweet) {
      reset();
      window.location.reload();
    }
  }, [actionData, reset]);
  return /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
      Avatar,
      {
        src: user?.avatar,
        alt: user?.displayName || user?.username || "User",
        size: "md"
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs(Form, { method: "post", children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "token", value: token }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            ...register2("content"),
            placeholder: "What's happening?",
            className: `w-full resize-none border-0 focus:ring-0 text-lg placeholder-gray-500 p-0 min-h-[60px] ${errors.content ? "text-red-500" : ""}`,
            rows: 3
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-2", children: /* @__PURE__ */ jsx(
            "span",
            {
              className: `text-sm ${isOverLimit ? "text-red-500" : remainingChars <= 20 ? "text-orange-500" : "text-gray-500"}`,
              children: remainingChars
            }
          ) }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: !content.trim() || isOverLimit || isSubmitting,
              className: "bg-blue-500 text-white px-4 py-2 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors",
              children: isSubmitting ? "Tweeting..." : "Tweet"
            }
          )
        ] })
      ] }),
      actionData?.error && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm mt-2", children: actionData.error }),
      errors.content && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm mt-2", children: errors.content.message })
    ] })
  ] }) });
}
const TweetSkeleton = memo(function TweetSkeleton2() {
  return /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 p-4 animate-pulse", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
    /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-gray-300 rounded-full flex-shrink-0" }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-24" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-16" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-12" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-full" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-3/4" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-1/2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-6 mt-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-8" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-8" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-8" })
      ] })
    ] })
  ] }) });
});
const TimelineSkeleton = memo(function TimelineSkeleton2({ count: count2 = 5 }) {
  return /* @__PURE__ */ jsx("div", { className: "bg-white border border-gray-200 rounded-lg", children: Array.from({ length: count2 }, (_, i) => /* @__PURE__ */ jsx(TweetSkeleton, {}, i)) });
});
const Timeline = memo(function Timeline2() {
  const [tweets2, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("for-you");
  const fetcher = useFetcher();
  const fetchTweets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const filterParam = filter === "following" ? "following" : "all";
      const response = await fetch(`/api/tweets?filter=${filterParam}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError("Please log in to view tweets");
          return;
        }
        throw new Error("Failed to fetch tweets");
      }
      const data2 = await response.json();
      if (data2.error) {
        setError(data2.error);
      } else {
        setTweets(data2.tweets || []);
      }
    } catch (err) {
      setError("Failed to load tweets");
    } finally {
      setLoading(false);
    }
  }, [filter]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to view tweets");
      setLoading(false);
      return;
    }
    fetchTweets();
  }, [filter]);
  useEffect(() => {
    if (fetcher.data?.tweet) {
      fetchTweets();
    }
  }, [fetcher.data]);
  const memoizedTweets = useMemo(() => tweets2.map(({ tweet, user, likeCount }) => /* @__PURE__ */ jsx(Tweet, { tweet: {
    id: tweet.id,
    content: tweet.content,
    created_at: tweet.created_at,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar || void 0
    },
    likeCount
  } }, tweet.id)), [tweets2]);
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
      /* @__PURE__ */ jsx(TweetForm, {}),
      /* @__PURE__ */ jsx(TimelineSkeleton, { count: 5 })
    ] });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
      /* @__PURE__ */ jsx(TweetForm, {}),
      /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 mb-4", children: error }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: fetchTweets,
            className: "text-blue-500 hover:text-blue-600 font-semibold",
            children: "Try again"
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
    /* @__PURE__ */ jsx(TweetForm, {}),
    /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setFilter("for-you"),
          className: `flex-1 py-3 text-center font-medium transition-colors ${filter === "for-you" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`,
          children: "For you"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setFilter("following"),
          className: `flex-1 py-3 text-center font-medium transition-colors ${filter === "following" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`,
          children: "Following"
        }
      )
    ] }) }),
    tweets2.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 border-b border-gray-200", children: [
      /* @__PURE__ */ jsx("svg", { className: "mx-auto h-12 w-12 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) }),
      /* @__PURE__ */ jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: filter === "following" ? "No tweets from people you follow" : "No tweets yet" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: filter === "following" ? "Follow more people to see their tweets" : "Be the first to tweet!" })
    ] }) : memoizedTweets
  ] });
});
function validateFormData(formData2, schema2) {
  try {
    const data2 = {};
    for (const [key, value] of formData2.entries()) {
      data2[key] = value;
    }
    const validatedData = schema2.parse(data2);
    return {
      isValid: true,
      errors: [],
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message
      }));
      return {
        isValid: false,
        errors
      };
    }
    return {
      isValid: false,
      errors: [{ field: "general", message: "Validation failed" }]
    };
  }
}
function validateQuery(url, schema2) {
  try {
    const queryData = {};
    for (const [key, value] of url.searchParams.entries()) {
      queryData[key] = value;
    }
    const validatedData = schema2.parse(queryData);
    return {
      isValid: true,
      errors: [],
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message
      }));
      return {
        isValid: false,
        errors
      };
    }
    return {
      isValid: false,
      errors: [{ field: "general", message: "Validation failed" }]
    };
  }
}
function createValidationErrorResponse(errors) {
  return new Response(JSON.stringify({ errors }), {
    status: 400,
    headers: { "Content-Type": "application/json" }
  });
}
const home = UNSAFE_withComponentProps(function Home() {
  const {
    user,
    isLoading
  } = useUser();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !user) {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
      }
    }
  }, [user, isLoading, navigate]);
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsxs("div", {
      className: "flex max-w-7xl mx-auto",
      children: [/* @__PURE__ */ jsx(Sidebar, {}), /* @__PURE__ */ jsxs("main", {
        className: "flex-1 lg:ml-64 pb-16 lg:pb-0",
        children: [/* @__PURE__ */ jsx("div", {
          className: "border-b border-gray-200 p-4",
          children: /* @__PURE__ */ jsx("h1", {
            className: "text-xl font-bold",
            children: "Home"
          })
        }), /* @__PURE__ */ jsx(Timeline, {})]
      })]
    }), /* @__PURE__ */ jsx(MobileNav, {})]
  });
});
async function action$6({
  request
}) {
  if (request.method !== "POST") {
    return data({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  try {
    const formData2 = await request.formData();
    const token = formData2.get("token");
    const content = formData2.get("content");
    if (!token) {
      return data({
        error: "Authentication required"
      }, {
        status: 401
      });
    }
    let userPayload;
    try {
      userPayload = verifyToken(token);
    } catch (error) {
      return data({
        error: "Invalid or expired token"
      }, {
        status: 401
      });
    }
    const contentFormData = new FormData();
    contentFormData.set("content", content);
    const validation = validateFormData(contentFormData, tweetContentSchema);
    if (!validation.isValid) {
      return data({
        errors: validation.errors
      }, {
        status: 400
      });
    }
    const [tweet] = await db.insert(tweets).values({
      user_id: userPayload.userId,
      content: validation.data.content
      // Already trimmed by Zod
    }).returning();
    return data({
      tweet,
      success: true
    });
  } catch (error) {
    console.error("Error creating tweet:", error);
    return data({
      error: "Failed to create tweet"
    }, {
      status: 500
    });
  }
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  default: home
}, Symbol.toStringTag, { value: "Module" }));
const users_$username = UNSAFE_withComponentProps(function UserProfile() {
  const data2 = useLoaderData();
  const {
    user: currentUser
  } = useUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(data2.followersCount);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  console.log("Current user:", currentUser);
  console.log("Profile user:", data2.user);
  console.log("Are they the same?", currentUser?.username === data2.user.username);
  useEffect(() => {
    if (currentUser && data2.user && currentUser.username !== data2.user.username) {
      checkFollowStatus();
    }
  }, [currentUser, data2.user]);
  const checkFollowStatus = async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(`/api/users/${data2.user.username}/follow`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.isFollowing !== void 0) {
        setIsFollowing(result.isFollowing);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };
  const handleFollow = async () => {
    if (!currentUser || currentUser.username === data2.user.username) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch(`/api/users/${data2.user.username}/follow`, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setIsFollowing(!isFollowing);
        setFollowerCount((prev) => isFollowing ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("tokenChanged"));
    window.location.href = "/login";
  };
  if (data2 && typeof data2 === "object" && "error" in data2) {
    return /* @__PURE__ */ jsxs("div", {
      className: "min-h-screen bg-gray-50",
      children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsxs("div", {
        className: "flex max-w-7xl mx-auto",
        children: [/* @__PURE__ */ jsx(Sidebar, {}), /* @__PURE__ */ jsx("main", {
          className: "flex-1 lg:ml-64 pb-16 lg:pb-0",
          children: /* @__PURE__ */ jsxs("div", {
            className: "text-center py-12",
            children: [/* @__PURE__ */ jsx("h1", {
              className: "text-2xl font-bold text-gray-900",
              children: "User Not Found"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-gray-600 mt-2",
              children: "The user you're looking for doesn't exist."
            }), /* @__PURE__ */ jsx(Link, {
              to: "/home",
              className: "text-blue-500 hover:text-blue-600 mt-4 inline-block",
              children: "Go back to home"
            })]
          })
        })]
      }), /* @__PURE__ */ jsx(MobileNav, {})]
    });
  }
  const {
    user,
    tweets: tweets2,
    tweetCount,
    followingCount,
    followersCount
  } = data2;
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsxs("div", {
      className: "flex max-w-7xl mx-auto",
      children: [/* @__PURE__ */ jsx(Sidebar, {}), /* @__PURE__ */ jsxs("main", {
        className: "flex-1 lg:ml-64 pb-16 lg:pb-0",
        children: [/* @__PURE__ */ jsx("div", {
          className: "border-b border-gray-200",
          children: /* @__PURE__ */ jsxs("div", {
            className: "px-4 py-3",
            children: [/* @__PURE__ */ jsx("h1", {
              className: "text-xl font-bold",
              children: user.displayName
            }), /* @__PURE__ */ jsxs("p", {
              className: "text-gray-500 text-sm",
              children: [tweetCount, " tweets"]
            })]
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "border-b border-gray-200",
          children: /* @__PURE__ */ jsx("div", {
            className: "p-4",
            children: /* @__PURE__ */ jsx("div", {
              className: "flex justify-between items-start",
              children: /* @__PURE__ */ jsxs("div", {
                className: "flex-1",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "flex items-end space-x-3",
                  children: [/* @__PURE__ */ jsx(Avatar, {
                    src: user.avatar,
                    alt: user.displayName || user.username,
                    size: "xl",
                    className: "h-20 w-20 border-4 border-white"
                  }), currentUser?.username === data2.user.username ? /* @__PURE__ */ jsxs("div", {
                    className: "ml-auto flex space-x-2",
                    children: [/* @__PURE__ */ jsx(Link, {
                      to: "/settings",
                      className: "bg-white border border-gray-300 text-gray-900 px-4 py-1 rounded-full font-medium hover:bg-gray-50",
                      children: "Edit profile"
                    }), /* @__PURE__ */ jsx("button", {
                      onClick: handleLogout,
                      disabled: isLoggingOut,
                      className: "bg-red-500 border border-red-500 text-white px-4 py-1 rounded-full font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed",
                      children: isLoggingOut ? "Logging out..." : "Logout"
                    })]
                  }) : currentUser ? /* @__PURE__ */ jsx("button", {
                    onClick: handleFollow,
                    disabled: isLoading,
                    className: `ml-auto px-4 py-1 rounded-full font-medium ${isFollowing ? "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50" : "bg-black text-white hover:bg-gray-800"} disabled:opacity-50 disabled:cursor-not-allowed`,
                    children: isLoading ? "..." : isFollowing ? "Following" : "Follow"
                  }) : null]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "mt-3",
                  children: [/* @__PURE__ */ jsx("h2", {
                    className: "text-xl font-bold",
                    children: user.displayName
                  }), /* @__PURE__ */ jsxs("p", {
                    className: "text-gray-500",
                    children: ["@", user.username]
                  })]
                }), user.bio && /* @__PURE__ */ jsx("p", {
                  className: "mt-2 text-gray-900",
                  children: user.bio
                }), /* @__PURE__ */ jsxs("div", {
                  className: "mt-3 flex space-x-6 text-gray-500",
                  children: [/* @__PURE__ */ jsxs("div", {
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "font-bold text-gray-900",
                      children: tweetCount
                    }), /* @__PURE__ */ jsx("span", {
                      className: "ml-1",
                      children: "Tweets"
                    })]
                  }), /* @__PURE__ */ jsxs("div", {
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "font-bold text-gray-900",
                      children: followingCount
                    }), /* @__PURE__ */ jsx("span", {
                      className: "ml-1",
                      children: "Following"
                    })]
                  }), /* @__PURE__ */ jsxs("div", {
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "font-bold text-gray-900",
                      children: followerCount
                    }), /* @__PURE__ */ jsx("span", {
                      className: "ml-1",
                      children: "Followers"
                    })]
                  })]
                }), /* @__PURE__ */ jsxs("p", {
                  className: "mt-3 text-gray-500 text-sm",
                  children: ["Joined ", format(new Date(user.createdAt), "MMMM yyyy")]
                })]
              })
            })
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "divide-y divide-gray-200",
          children: tweets2.length === 0 ? /* @__PURE__ */ jsxs("div", {
            className: "text-center py-12",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-lg font-semibold text-gray-900",
              children: "No tweets yet"
            }), /* @__PURE__ */ jsxs("p", {
              className: "text-gray-500 mt-2",
              children: ["@", user.username, " hasn't posted any tweets yet."]
            })]
          }) : tweets2.map(({
            tweet,
            user: tweetUser,
            likeCount
          }) => /* @__PURE__ */ jsx(Tweet, {
            tweet: {
              ...tweet,
              user: tweetUser,
              created_at: tweet.created_at,
              likeCount
            }
          }, tweet.id))
        })]
      })]
    }), /* @__PURE__ */ jsx(MobileNav, {})]
  });
});
async function loader$7({
  params,
  request
}) {
  const username = params.username;
  if (!username) {
    return data({
      error: "Username is required"
    }, {
      status: 400
    });
  }
  try {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.display_name,
      bio: users.bio,
      avatar: users.avatar_url,
      createdAt: users.created_at
    }).from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      return data({
        error: "User not found"
      }, {
        status: 404
      });
    }
    const [tweetCount] = await db.select({
      count: count()
    }).from(tweets).where(eq(tweets.user_id, user.id));
    const [followingCount] = await db.select({
      count: count()
    }).from(follows).where(eq(follows.follower_id, user.id));
    const [followersCount] = await db.select({
      count: count()
    }).from(follows).where(eq(follows.following_id, user.id));
    const userTweets = await db.select({
      tweet: tweets,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.display_name
      }
    }).from(tweets).innerJoin(users, eq(tweets.user_id, users.id)).where(eq(tweets.user_id, user.id)).orderBy(desc(tweets.created_at)).limit(50);
    return data({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString()
      },
      tweets: userTweets,
      tweetCount: Number(tweetCount.count),
      followingCount: Number(followingCount.count),
      followersCount: Number(followersCount.count)
    });
  } catch (error) {
    console.error("Error loading user profile:", error);
    return data({
      error: "Failed to load user profile"
    }, {
      status: 500
    });
  }
}
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2() {
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsxs("div", {
      className: "flex max-w-7xl mx-auto",
      children: [/* @__PURE__ */ jsx(Sidebar, {}), /* @__PURE__ */ jsx("main", {
        className: "flex-1 lg:ml-64 pb-16 lg:pb-0",
        children: /* @__PURE__ */ jsxs("div", {
          className: "text-center py-12",
          children: [/* @__PURE__ */ jsx("h1", {
            className: "text-2xl font-bold text-gray-900",
            children: "Error Loading Profile"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-gray-600 mt-2",
            children: "Something went wrong loading this profile."
          })]
        })
      })]
    }), /* @__PURE__ */ jsx(MobileNav, {})]
  });
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: users_$username,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
function ProfileEditForm({ userData, token, actionData, onCancel }) {
  const {
    register: register2,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: {
      username: userData.username,
      displayName: userData.displayName,
      bio: userData.bio || "",
      avatar: userData.avatar || ""
    }
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userData.avatar || null);
  const fileInputRef = useRef(null);
  const currentAvatar = watch("avatar");
  useEffect(() => {
    if (actionData?.errors) {
      actionData.errors.forEach((error) => {
        setError(error.field, { message: error.message });
      });
    }
  }, [actionData?.errors, setError]);
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File size too large. Maximum size is 5MB.");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result);
      };
      reader.readAsDataURL(file);
      const formData2 = new FormData();
      formData2.append("file", file);
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData2
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
      const result = await response.json();
      setValue("avatar", result.url);
      setPreviewUrl(result.url);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      setPreviewUrl(currentAvatar || null);
    } finally {
      setIsUploading(false);
    }
  };
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  return /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
    /* @__PURE__ */ jsx("input", { type: "hidden", name: "token", value: token }),
    actionData?.error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded", children: actionData.error }),
    actionData?.success && /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded", children: "Profile updated successfully!" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "displayName", className: "block text-sm font-medium text-gray-700 mb-2", children: "Display name" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ...register2("displayName"),
          type: "text",
          id: "displayName",
          className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.displayName ? "border-red-500" : "border-gray-300"}`
        }
      ),
      errors.displayName && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.displayName.message })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "username", className: "block text-sm font-medium text-gray-700 mb-2", children: "Username" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ...register2("username"),
          type: "text",
          id: "username",
          className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? "border-red-500" : "border-gray-300"}`
        }
      ),
      errors.username && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.username.message })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "bio", className: "block text-sm font-medium text-gray-700 mb-2", children: "Bio" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          ...register2("bio"),
          id: "bio",
          rows: 3,
          className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.bio ? "border-red-500" : "border-gray-300"}`,
          placeholder: "Tell us about yourself..."
        }
      ),
      errors.bio && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.bio.message })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Profile Picture" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              onClick: handleAvatarClick,
              className: "w-24 h-24 rounded-full border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors overflow-hidden bg-gray-50 flex items-center justify-center",
              children: previewUrl ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: previewUrl,
                  alt: "Profile preview",
                  className: "w-full h-full object-cover"
                }
              ) : /* @__PURE__ */ jsxs("div", { className: "text-gray-400 text-center", children: [
                /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 mx-auto mb-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Click to upload" })
              ] })
            }
          ),
          isUploading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/jpeg,image/png,image/webp,image/gif",
              onChange: handleFileSelect,
              className: "hidden"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              ...register2("avatar"),
              type: "hidden"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleAvatarClick,
              disabled: isUploading,
              className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
              children: isUploading ? "Uploading..." : "Choose file"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-500", children: "JPEG, PNG, WebP, or GIF. Max 5MB." }),
          uploadError && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: uploadError })
        ] })
      ] }),
      errors.avatar && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.avatar.message })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex space-x-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: isSubmitting,
          className: "bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
          children: isSubmitting ? "Saving..." : "Save changes"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onCancel,
          className: "bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300",
          children: "Cancel"
        }
      )
    ] })
  ] });
}
async function loader$6({
  request
}) {
  try {
    const authHeader = request.headers.get("Authorization");
    const cookieHeader = request.headers.get("Cookie");
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
      }
    }
    if (!token) {
      return {
        user: null,
        error: null
      };
    }
    const userPayload = verifyToken(token);
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      display_name: users.display_name,
      bio: users.bio,
      avatar_url: users.avatar_url,
      email: users.email
    }).from(users).where(eq(users.id, userPayload.userId)).limit(1);
    if (!user) {
      return {
        user: null,
        error: "User not found"
      };
    }
    const userData = {
      username: user.username,
      displayName: user.display_name || "",
      bio: user.bio || "",
      avatar: user.avatar_url || ""
    };
    return {
      user: userData,
      error: null
    };
  } catch (error) {
    return {
      user: null,
      error: null
    };
  }
}
const settings = UNSAFE_withComponentProps(function Settings() {
  const {
    user: initialData,
    error: loaderError
  } = useLoaderData();
  const {
    user,
    isLoading: isAuthLoading
  } = useUser();
  const navigate = useNavigate();
  const actionData = useActionData();
  const [token, setToken] = useState("");
  const [userData, setUserData] = useState(initialData);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token") || "");
    }
  }, []);
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login");
      return;
    }
    if (!user || isAuthLoading) {
      return;
    }
    if (!userData) {
      setIsLoadingUserData(true);
      const fetchUserData = async () => {
        try {
          const token2 = localStorage.getItem("token");
          if (!token2) {
            navigate("/login");
            return;
          }
          const response = await fetch(`/api/users/${user.username}`, {
            headers: {
              "Authorization": `Bearer ${token2}`
            }
          });
          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }
          const data2 = await response.json();
          const userInfo = data2.user || data2;
          const fetchedUserData = {
            username: userInfo.username || "",
            displayName: userInfo.displayName || "",
            bio: userInfo.bio || "",
            avatar: userInfo.avatar || ""
          };
          setUserData(fetchedUserData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoadingUserData(false);
        }
      };
      fetchUserData();
    }
  }, [user, navigate, userData, isAuthLoading]);
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsxs("div", {
      className: "flex max-w-7xl mx-auto",
      children: [/* @__PURE__ */ jsx(Sidebar, {}), /* @__PURE__ */ jsxs("main", {
        className: "flex-1 lg:ml-64 pb-16 lg:pb-0",
        children: [/* @__PURE__ */ jsx("div", {
          className: "border-b border-gray-200 p-4",
          children: /* @__PURE__ */ jsx("h1", {
            className: "text-xl font-bold",
            children: "Edit profile"
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "max-w-lg mx-auto p-4",
          children: isLoadingUserData || isAuthLoading || !userData ? /* @__PURE__ */ jsx("div", {
            className: "flex justify-center items-center py-8",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-center space-x-2",
              children: [/* @__PURE__ */ jsx("div", {
                className: "animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"
              }), /* @__PURE__ */ jsx("div", {
                className: "text-gray-500",
                children: "Loading your profile..."
              })]
            })
          }) : /* @__PURE__ */ jsx(ProfileEditForm, {
            userData,
            token,
            actionData,
            onCancel: () => navigate(`/users/${user?.username || ""}`)
          })
        })]
      })]
    }), /* @__PURE__ */ jsx(MobileNav, {})]
  });
});
async function action$5({
  request
}) {
  try {
    const formData2 = await request.formData();
    const token = formData2.get("token");
    if (!token) {
      return Response.json({
        error: "Authentication required"
      }, {
        status: 401
      });
    }
    let userPayload;
    try {
      userPayload = verifyToken(token);
    } catch (error) {
      return Response.json({
        error: "Invalid or expired token"
      }, {
        status: 401
      });
    }
    const validation = validateFormData(formData2, userProfileUpdateSchema);
    if (!validation.isValid) {
      return Response.json({
        errors: validation.errors
      }, {
        status: 400
      });
    }
    const {
      displayName,
      username,
      bio,
      avatar
    } = validation.data;
    const existingUsers = await db.select({
      id: users.id
    }).from(users).where(eq(users.username, username));
    const conflictingUser = existingUsers.find((u) => u.id !== userPayload.userId);
    if (conflictingUser) {
      return Response.json({
        errors: [{
          field: "username",
          message: "Username is already taken"
        }]
      }, {
        status: 400
      });
    }
    await db.update(users).set({
      display_name: displayName,
      username,
      bio: bio || null,
      avatar_url: avatar || null,
      updated_at: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userPayload.userId));
    return Response.json({
      success: true
    });
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return Response.json({
        error: "Authentication required"
      }, {
        status: 401
      });
    }
    console.error("Error updating profile:", error);
    return Response.json({
      error: "Failed to update profile"
    }, {
      status: 500
    });
  }
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: settings,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
async function loader$5({
  request
}) {
  const user = await requireAuth(request);
  const url = new URL(request.url);
  const queryValidation = validateQuery(url, paginationQuerySchema);
  if (!queryValidation.isValid) {
    return data({
      error: "Invalid query parameters",
      errors: queryValidation.errors
    }, {
      status: 400
    });
  }
  const {
    limit,
    offset,
    filter
  } = queryValidation.data;
  try {
    if (filter === "following") {
      const followingUsers = await db.select({
        followingId: follows.following_id
      }).from(follows).where(eq(follows.follower_id, user.userId));
      const followingIds = followingUsers.map((f) => f.followingId);
      if (followingIds.length === 0) {
        return data({
          tweets: []
        });
      }
      const tweetsWithUsers = await db.select({
        tweet: tweets,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.display_name,
          avatar: users.avatar_url
        }
      }).from(tweets).innerJoin(users, eq(tweets.user_id, users.id)).where(inArray(tweets.user_id, followingIds)).orderBy(desc(tweets.created_at)).limit(limit).offset(offset);
      const tweetIds = tweetsWithUsers.map((t) => t.tweet.id);
      const tweetLikes = await db.select({
        tweet_id: likes.tweet_id,
        likeCount: count(likes.user_id)
      }).from(likes).where(inArray(likes.tweet_id, tweetIds)).groupBy(likes.tweet_id);
      const likesMap = new Map(tweetLikes.map((l) => [l.tweet_id, l.likeCount]));
      const tweetsWithLikes = tweetsWithUsers.map(({
        tweet,
        user: user2
      }) => ({
        tweet,
        user: user2,
        likeCount: likesMap.get(tweet.id) || 0
      }));
      return data({
        tweets: tweetsWithLikes
      });
    } else {
      const tweetsWithUsers = await db.select({
        tweet: tweets,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.display_name,
          avatar: users.avatar_url
        }
      }).from(tweets).innerJoin(users, eq(tweets.user_id, users.id)).orderBy(desc(tweets.created_at)).limit(limit).offset(offset);
      const tweetIds = tweetsWithUsers.map((t) => t.tweet.id);
      const tweetLikes = await db.select({
        tweet_id: likes.tweet_id,
        likeCount: count(likes.user_id)
      }).from(likes).where(inArray(likes.tweet_id, tweetIds)).groupBy(likes.tweet_id);
      const likesMap = new Map(tweetLikes.map((l) => [l.tweet_id, l.likeCount]));
      const tweetsWithLikes = tweetsWithUsers.map(({
        tweet,
        user: user2
      }) => ({
        tweet,
        user: user2,
        likeCount: likesMap.get(tweet.id) || 0
      }));
      return data({
        tweets: tweetsWithLikes
      });
    }
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return data({
      error: "Failed to fetch tweets"
    }, {
      status: 500
    });
  }
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function loader$4({
  params
}) {
  const username = params.username;
  if (!username) {
    return data({
      error: "Username is required"
    }, {
      status: 400
    });
  }
  try {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.display_name,
      bio: users.bio,
      avatar: users.avatar_url,
      createdAt: users.created_at
    }).from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      return data({
        error: "User not found"
      }, {
        status: 404
      });
    }
    const [tweetCount] = await db.select({
      count: count()
    }).from(tweets).where(eq(tweets.user_id, user.id));
    const [followingCount] = await db.select({
      count: count()
    }).from(follows).where(eq(follows.follower_id, user.id));
    const [followersCount] = await db.select({
      count: count()
    }).from(follows).where(eq(follows.following_id, user.id));
    const userTweets = await db.select({
      tweet: tweets,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.display_name,
        avatar: users.avatar_url
      }
    }).from(tweets).innerJoin(users, eq(tweets.user_id, users.id)).where(eq(tweets.user_id, user.id)).orderBy(desc(tweets.created_at)).limit(50);
    const tweetIds = userTweets.map((t) => t.tweet.id);
    const tweetLikes = await db.select({
      tweet_id: likes.tweet_id,
      likeCount: count(likes.user_id)
    }).from(likes).where(inArray(likes.tweet_id, tweetIds)).groupBy(likes.tweet_id);
    const likesMap = new Map(tweetLikes.map((l) => [l.tweet_id, l.likeCount]));
    const tweetsWithLikes = userTweets.map(({
      tweet,
      user: user2
    }) => ({
      tweet,
      user: user2,
      likeCount: likesMap.get(tweet.id) || 0
    }));
    return data({
      user,
      tweets: tweetsWithLikes,
      tweetCount: tweetCount.count,
      followingCount: followingCount.count,
      followersCount: followersCount.count
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return data({
      error: "Failed to fetch user profile"
    }, {
      status: 500
    });
  }
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function action$4({
  request,
  params
}) {
  const user = await requireAuth(request);
  const username = params.username;
  if (!username) {
    return data({
      error: "Username is required"
    }, {
      status: 400
    });
  }
  try {
    if (request.method === "POST") {
      const [targetUser] = await db.select({
        id: users.id
      }).from(users).where(eq(users.username, username)).limit(1);
      if (!targetUser) {
        return data({
          error: "User not found"
        }, {
          status: 404
        });
      }
      if (targetUser.id === user.userId) {
        return data({
          error: "Cannot follow yourself"
        }, {
          status: 400
        });
      }
      const [existingFollow] = await db.select().from(follows).where(and(eq(follows.follower_id, user.userId), eq(follows.following_id, targetUser.id))).limit(1);
      if (existingFollow) {
        return data({
          error: "Already following"
        }, {
          status: 400
        });
      }
      await db.insert(follows).values({
        follower_id: user.userId,
        following_id: targetUser.id
      });
      return data({
        success: true,
        action: "followed"
      });
    }
    if (request.method === "DELETE") {
      const [targetUser] = await db.select({
        id: users.id
      }).from(users).where(eq(users.username, username)).limit(1);
      if (!targetUser) {
        return data({
          error: "User not found"
        }, {
          status: 404
        });
      }
      await db.delete(follows).where(and(eq(follows.follower_id, user.userId), eq(follows.following_id, targetUser.id)));
      return data({
        success: true,
        action: "unfollowed"
      });
    }
    return data({
      error: "Method not allowed"
    }, {
      status: 405
    });
  } catch (error) {
    console.error("Error in follow action:", error);
    return data({
      error: "Failed to process follow action"
    }, {
      status: 500
    });
  }
}
async function loader$3({
  request,
  params
}) {
  const user = await requireAuth(request);
  const username = params.username;
  if (!username) {
    return data({
      error: "Username is required"
    }, {
      status: 400
    });
  }
  try {
    const [targetUser] = await db.select({
      id: users.id
    }).from(users).where(eq(users.username, username)).limit(1);
    if (!targetUser) {
      return data({
        error: "User not found"
      }, {
        status: 404
      });
    }
    const [isFollowing] = await db.select().from(follows).where(and(eq(follows.follower_id, user.userId), eq(follows.following_id, targetUser.id))).limit(1);
    return data({
      isFollowing: !!isFollowing
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return data({
      error: "Failed to check follow status"
    }, {
      status: 500
    });
  }
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
async function action$3({
  request,
  params
}) {
  const user = await requireAuth(request);
  const tweetId = params.tweetId;
  if (!tweetId) {
    return data({
      error: "Tweet ID is required"
    }, {
      status: 400
    });
  }
  try {
    if (request.method === "POST") {
      const [tweet] = await db.select({
        id: tweets.id
      }).from(tweets).where(eq(tweets.id, tweetId)).limit(1);
      if (!tweet) {
        return data({
          error: "Tweet not found"
        }, {
          status: 404
        });
      }
      const [existingLike] = await db.select().from(likes).where(and(eq(likes.user_id, user.userId), eq(likes.tweet_id, tweetId))).limit(1);
      if (existingLike) {
        return data({
          error: "Already liked"
        }, {
          status: 400
        });
      }
      await db.insert(likes).values({
        user_id: user.userId,
        tweet_id: tweetId
      });
      const [likeCount] = await db.select({
        count: count()
      }).from(likes).where(eq(likes.tweet_id, tweetId));
      return data({
        success: true,
        action: "liked",
        likeCount: Number(likeCount.count)
      });
    }
    if (request.method === "DELETE") {
      await db.delete(likes).where(and(eq(likes.user_id, user.userId), eq(likes.tweet_id, tweetId)));
      const [likeCount] = await db.select({
        count: count()
      }).from(likes).where(eq(likes.tweet_id, tweetId));
      return data({
        success: true,
        action: "unliked",
        likeCount: Number(likeCount.count)
      });
    }
    return data({
      error: "Method not allowed"
    }, {
      status: 405
    });
  } catch (error) {
    console.error("Error in like action:", error);
    return data({
      error: "Failed to process like action"
    }, {
      status: 500
    });
  }
}
async function loader$2({
  request,
  params
}) {
  const user = await requireAuth(request);
  const tweetId = params.tweetId;
  if (!tweetId) {
    return data({
      error: "Tweet ID is required"
    }, {
      status: 400
    });
  }
  try {
    const [isLiked] = await db.select().from(likes).where(and(eq(likes.user_id, user.userId), eq(likes.tweet_id, tweetId))).limit(1);
    const [likeCount] = await db.select({
      count: count()
    }).from(likes).where(eq(likes.tweet_id, tweetId));
    return data({
      isLiked: !!isLiked,
      likeCount: Number(likeCount.count)
    });
  } catch (error) {
    console.error("Error checking like status:", error);
    return data({
      error: "Failed to check like status"
    }, {
      status: 500
    });
  }
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function action$2({
  request
}) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      message: "Method not allowed"
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  try {
    const formData2 = await request.formData();
    const validation = validateFormData(formData2, userLoginSchema);
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }
    const {
      username,
      password
    } = validation.data;
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      return new Response(JSON.stringify({
        message: "Invalid credentials"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return new Response(JSON.stringify({
        message: "Invalid credentials"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (!user.email_verified) {
      return new Response(JSON.stringify({
        message: "Please verify your email address before logging in. Check your email for the verification link.",
        requiresEmailVerification: true,
        email: user.email
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const token = generateToken({
      userId: user.id,
      username: user.username
    });
    return new Response(JSON.stringify({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio
      },
      token
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({
      message: "Internal server error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2
}, Symbol.toStringTag, { value: "Module" }));
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "",
  url: process.env.MAILGUN_API_URL || "https://api.mailgun.net"
});
const DOMAIN = process.env.MAILGUN_DOMAIN || "";
function generateVerificationToken() {
  return randomBytes(32).toString("hex");
}
async function sendVerificationEmail(email, username, token) {
  if (!process.env.MAILGUN_API_KEY || !DOMAIN) {
    throw new Error("Mailgun is not configured");
  }
  const verificationUrl = `${process.env.APP_URL || "http://localhost:5173"}/api/auth/verify-email/${token}`;
  const emailData = {
    from: `Tweeter <noreply@${DOMAIN}>`,
    to: email,
    subject: "Verify your Tweeter account",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1DA1F2; font-size: 32px; margin: 0;">🐦 Tweeter</h1>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Welcome to Tweeter, ${username}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thank you for signing up for Tweeter. To complete your registration and start tweeting, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #1DA1F2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 25px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${verificationUrl}" style="color: #1DA1F2; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create a Tweeter account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Welcome to Tweeter, ${username}!
      
      Thank you for signing up for Tweeter. To complete your registration and start tweeting, 
      please verify your email address by visiting the link below:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create a Tweeter account, you can safely ignore this email.
    `
  };
  try {
    await mg.messages.create(DOMAIN, emailData);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
}
async function action$1({
  request
}) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      message: "Method not allowed"
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  try {
    const formData2 = await request.formData();
    const validation = validateFormData(formData2, userRegistrationSchema);
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }
    const {
      username,
      email,
      password,
      displayName
    } = validation.data;
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUser.length > 0) {
      return new Response(JSON.stringify({
        errors: [{
          field: "username",
          message: "Username already taken"
        }]
      }), {
        status: 409,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      return new Response(JSON.stringify({
        errors: [{
          field: "email",
          message: "Email already registered"
        }]
      }), {
        status: 409,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const passwordHash = await hashPassword(password);
    const verificationToken = generateVerificationToken();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    const [newUser] = await db.insert(users).values({
      username,
      // Already transformed to lowercase by Zod
      email,
      // Already transformed to lowercase by Zod
      password_hash: passwordHash,
      display_name: displayName || username,
      email_verified: false,
      verification_token: verificationToken,
      token_expires: tokenExpires
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.display_name
    });
    try {
      await sendVerificationEmail(email, username, verificationToken);
    } catch (error) {
      console.error("Failed to send verification email:", error);
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
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({
      message: "Internal server error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({
  params
}) {
  const {
    token
  } = params;
  if (!token) {
    return Response.json({
      error: "Verification token is required"
    }, {
      status: 400
    });
  }
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      email_verified: users.email_verified,
      token_expires: users.token_expires
    }).from(users).where(and(eq(users.verification_token, token), gt(users.token_expires, /* @__PURE__ */ new Date()))).limit(1);
    if (!user) {
      return new Response(`
        <html>
          <head>
            <title>Verification Failed - Tweeter</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8f9fa;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
              }
              .icon { font-size: 48px; margin-bottom: 20px; }
              .error { color: #dc3545; }
              h1 { color: #333; margin-bottom: 16px; font-size: 28px; }
              p { color: #666; line-height: 1.6; margin-bottom: 24px; }
              .btn { 
                background: #1DA1F2; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold;
                display: inline-block;
              }
              .btn:hover { background: #0d8bd9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon error">❌</div>
              <h1>Verification Failed</h1>
              <p>This verification link is invalid or has expired. Please request a new verification email from your account settings.</p>
              <a href="/login" class="btn">Back to Login</a>
            </div>
          </body>
        </html>
      `, {
        headers: {
          "Content-Type": "text/html"
        }
      });
    }
    if (user.email_verified) {
      return new Response(`
        <html>
          <head>
            <title>Already Verified - Tweeter</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8f9fa;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
              }
              .icon { font-size: 48px; margin-bottom: 20px; }
              .success { color: #28a745; }
              h1 { color: #333; margin-bottom: 16px; font-size: 28px; }
              p { color: #666; line-height: 1.6; margin-bottom: 24px; }
              .btn { 
                background: #1DA1F2; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold;
                display: inline-block;
              }
              .btn:hover { background: #0d8bd9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon success">✅</div>
              <h1>Already Verified</h1>
              <p>Your email address has already been verified. You can now log in to your Tweeter account.</p>
              <a href="/login" class="btn">Go to Login</a>
            </div>
          </body>
        </html>
      `, {
        headers: {
          "Content-Type": "text/html"
        }
      });
    }
    await db.update(users).set({
      email_verified: true,
      verification_token: null,
      token_expires: null,
      updated_at: /* @__PURE__ */ new Date()
    }).where(eq(users.id, user.id));
    return new Response(`
      <html>
        <head>
          <title>Email Verified - Tweeter</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f8f9fa;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              max-width: 500px;
              width: 100%;
            }
            .icon { font-size: 48px; margin-bottom: 20px; }
            .success { color: #28a745; }
            h1 { color: #333; margin-bottom: 16px; font-size: 28px; }
            p { color: #666; line-height: 1.6; margin-bottom: 24px; }
            .btn { 
              background: #1DA1F2; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: bold;
              display: inline-block;
            }
            .btn:hover { background: #0d8bd9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon success">🎉</div>
            <h1>Email Verified!</h1>
            <p>Thank you, <strong>${user.username}</strong>! Your email address has been successfully verified. You can now access all Tweeter features.</p>
            <a href="/login" class="btn">Start Tweeting</a>
          </div>
        </body>
      </html>
    `, {
      headers: {
        "Content-Type": "text/html"
      }
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return Response.json({
      error: "Verification failed"
    }, {
      status: 500
    });
  }
}
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
async function action({
  request
}) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({
        error: "Authentication required"
      }, {
        status: 401
      });
    }
    const token = authHeader.substring(7);
    let userPayload;
    try {
      userPayload = verifyToken(token);
    } catch (error) {
      return Response.json({
        error: "Invalid or expired token"
      }, {
        status: 401
      });
    }
    const formData2 = await request.formData();
    const file = formData2.get("file");
    if (!file || file.size === 0) {
      return Response.json({
        error: "No file provided"
      }, {
        status: 400
      });
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({
        error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed."
      }, {
        status: 400
      });
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({
        error: "File size too large. Maximum size is 5MB."
      }, {
        status: 400
      });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await new Promise((resolve, reject) => {
      v2.uploader.upload_stream({
        folder: "tweeter/avatars",
        public_id: `avatar_${userPayload.userId}_${Date.now()}`,
        transformation: [{
          width: 400,
          height: 400,
          crop: "fill",
          gravity: "face"
        }, {
          quality: "auto:good"
        }, {
          format: "auto"
        }],
        overwrite: true,
        resource_type: "image"
      }, (error, result2) => {
        if (error) reject(error);
        else resolve(result2);
      }).end(buffer);
    });
    const result = uploadResult;
    return Response.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return Response.json({
      error: "Failed to upload image. Please try again."
    }, {
      status: 500
    });
  }
}
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
async function loader({
  request
}) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({
        error: "Authentication required"
      }, {
        status: 401
      });
    }
    const token = authHeader.substring(7);
    let userPayload;
    try {
      userPayload = verifyToken(token);
    } catch (error) {
      return Response.json({
        error: "Invalid or expired token"
      }, {
        status: 401
      });
    }
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const type = url.searchParams.get("type") || "all";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    if (!query || query.trim().length === 0) {
      return Response.json({
        error: "Search query is required"
      }, {
        status: 400
      });
    }
    const searchTerm = query.trim();
    const results = {
      query: searchTerm,
      users: [],
      tweets: [],
      hashtags: []
    };
    if (type === "all" || type === "users") {
      const userResults = await db.select({
        id: users.id,
        username: users.username,
        displayName: users.display_name,
        bio: users.bio,
        avatar: users.avatar_url,
        verified: users.email_verified
      }).from(users).where(or(ilike(users.username, `%${searchTerm}%`), ilike(users.display_name, `%${searchTerm}%`))).limit(limit);
      results.users = userResults.map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        bio: user.bio,
        avatar: user.avatar,
        verified: user.verified
      }));
    }
    if (type === "all" || type === "tweets") {
      const tweetResults = await db.select({
        tweet: {
          id: tweets.id,
          content: tweets.content,
          created_at: tweets.created_at,
          user_id: tweets.user_id
        },
        user: {
          id: users.id,
          username: users.username,
          displayName: users.display_name,
          avatar: users.avatar_url
        }
      }).from(tweets).innerJoin(users, eq(tweets.user_id, users.id)).where(ilike(tweets.content, `%${searchTerm}%`)).orderBy(sql`${tweets.created_at} DESC`).limit(limit);
      results.tweets = tweetResults.map(({
        tweet,
        user
      }) => ({
        id: tweet.id,
        content: tweet.content,
        created_at: tweet.created_at,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          avatar: user.avatar
        }
      }));
    }
    if (type === "all" || type === "hashtags") {
      if (searchTerm.startsWith("#")) {
        const hashtag = searchTerm.substring(1);
        const hashtagResults = await db.select({
          tweet: {
            id: tweets.id,
            content: tweets.content,
            created_at: tweets.created_at,
            user_id: tweets.user_id
          },
          user: {
            id: users.id,
            username: users.username,
            displayName: users.display_name,
            avatar: users.avatar_url
          }
        }).from(tweets).innerJoin(users, eq(tweets.user_id, users.id)).where(ilike(tweets.content, `%#${hashtag}%`)).orderBy(sql`${tweets.created_at} DESC`).limit(limit);
        results.hashtags = [{
          tag: hashtag,
          count: hashtagResults.length,
          tweets: hashtagResults.map(({
            tweet,
            user
          }) => ({
            id: tweet.id,
            content: tweet.content,
            created_at: tweet.created_at,
            user: {
              id: user.id,
              username: user.username,
              displayName: user.displayName || user.username,
              avatar: user.avatar
            }
          }))
        }];
      } else {
        const hashtagTweets = await db.select({
          content: tweets.content
        }).from(tweets).where(ilike(tweets.content, `%${searchTerm}%`)).limit(100);
        const hashtagCounts = {};
        hashtagTweets.forEach((tweet) => {
          const hashtags = tweet.content.match(/#\w+/g);
          if (hashtags) {
            hashtags.forEach((tag) => {
              const cleanTag = tag.substring(1).toLowerCase();
              if (cleanTag.includes(searchTerm.toLowerCase())) {
                hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
              }
            });
          }
        });
        results.hashtags = Object.entries(hashtagCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([tag, count2]) => ({
          tag,
          count: count2,
          tweets: []
          // Would need another query to get actual tweets
        }));
      }
    }
    return Response.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return Response.json({
      error: "Search failed"
    }, {
      status: 500
    });
  }
}
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const search = UNSAFE_withComponentProps(function SearchPage() {
  const [searchParams] = useSearchParams();
  const {
    user
  } = useUser();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const query = searchParams.get("q") || "";
  useEffect(() => {
    if (!user) return;
    if (query.trim()) {
      performSearch(query);
    } else {
      setResults(null);
    }
  }, [query, user]);
  const performSearch = async (searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data2 = await response.json();
        setResults(data2);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Search failed");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };
  const getResultCount = () => {
    if (!results) return 0;
    return results.users.length + results.tweets.length + results.hashtags.length;
  };
  const renderUsers = () => /* @__PURE__ */ jsx("div", {
    className: "space-y-4",
    children: results?.users.map((user2) => /* @__PURE__ */ jsx("div", {
      className: "bg-white border border-gray-200 rounded-lg p-6",
      children: /* @__PURE__ */ jsxs("div", {
        className: "flex items-start space-x-4",
        children: [/* @__PURE__ */ jsx(Avatar, {
          src: user2.avatar,
          alt: user2.displayName,
          size: "lg"
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex-1",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center",
            children: [/* @__PURE__ */ jsx(Link, {
              to: `/users/${user2.username}`,
              className: "text-lg font-bold text-gray-900 hover:text-blue-600",
              children: user2.displayName
            }), user2.verified && /* @__PURE__ */ jsx("svg", {
              className: "ml-2 w-5 h-5 text-blue-500",
              fill: "currentColor",
              viewBox: "0 0 20 20",
              children: /* @__PURE__ */ jsx("path", {
                fillRule: "evenodd",
                d: "M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
                clipRule: "evenodd"
              })
            })]
          }), /* @__PURE__ */ jsxs("p", {
            className: "text-gray-500",
            children: ["@", user2.username]
          }), user2.bio && /* @__PURE__ */ jsx("p", {
            className: "text-gray-700 mt-2",
            children: user2.bio
          })]
        })]
      })
    }, user2.id))
  });
  const renderTweets = () => /* @__PURE__ */ jsx("div", {
    className: "bg-white border border-gray-200 rounded-lg",
    children: results?.tweets.map((tweet) => /* @__PURE__ */ jsx(Tweet, {
      tweet: {
        ...tweet,
        likeCount: 0
        // Would need to fetch like count
      }
    }, tweet.id))
  });
  const renderHashtags = () => /* @__PURE__ */ jsx("div", {
    className: "space-y-4",
    children: results?.hashtags.map((hashtag) => /* @__PURE__ */ jsxs("div", {
      className: "bg-white border border-gray-200 rounded-lg p-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex items-center mb-4",
        children: [/* @__PURE__ */ jsx("div", {
          className: "w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center",
          children: /* @__PURE__ */ jsx("span", {
            className: "text-blue-600 font-bold text-lg",
            children: "#"
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "ml-4",
          children: [/* @__PURE__ */ jsxs("h3", {
            className: "text-lg font-bold text-gray-900",
            children: ["#", hashtag.tag]
          }), /* @__PURE__ */ jsxs("p", {
            className: "text-gray-500",
            children: [hashtag.count, " tweets"]
          })]
        })]
      }), hashtag.tweets.length > 0 && /* @__PURE__ */ jsx("div", {
        className: "border-t border-gray-100 pt-4",
        children: hashtag.tweets.slice(0, 3).map((tweet) => /* @__PURE__ */ jsx("div", {
          className: "mb-3 last:mb-0",
          children: /* @__PURE__ */ jsxs("div", {
            className: "flex items-start space-x-3",
            children: [/* @__PURE__ */ jsx(Avatar, {
              src: tweet.user.avatar,
              alt: tweet.user.displayName,
              size: "sm"
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex-1",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center space-x-2",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "font-semibold text-sm",
                  children: tweet.user.displayName
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-gray-500 text-sm",
                  children: ["@", tweet.user.username]
                })]
              }), /* @__PURE__ */ jsx("p", {
                className: "text-sm text-gray-900 mt-1",
                children: tweet.content
              })]
            })]
          })
        }, tweet.id))
      })]
    }, hashtag.tag))
  });
  const renderContent = () => {
    if (!results) return null;
    switch (activeTab) {
      case "users":
        return results.users.length > 0 ? renderUsers() : /* @__PURE__ */ jsx("div", {
          className: "text-center py-12",
          children: /* @__PURE__ */ jsxs("p", {
            className: "text-gray-500",
            children: ['No users found for "', query, '"']
          })
        });
      case "tweets":
        return results.tweets.length > 0 ? renderTweets() : /* @__PURE__ */ jsx("div", {
          className: "text-center py-12",
          children: /* @__PURE__ */ jsxs("p", {
            className: "text-gray-500",
            children: ['No tweets found for "', query, '"']
          })
        });
      case "hashtags":
        return results.hashtags.length > 0 ? renderHashtags() : /* @__PURE__ */ jsx("div", {
          className: "text-center py-12",
          children: /* @__PURE__ */ jsxs("p", {
            className: "text-gray-500",
            children: ['No hashtags found for "', query, '"']
          })
        });
      default:
        return /* @__PURE__ */ jsxs("div", {
          className: "space-y-6",
          children: [results.users.length > 0 && /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-lg font-semibold text-gray-900 mb-4",
              children: "People"
            }), renderUsers()]
          }), results.tweets.length > 0 && /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-lg font-semibold text-gray-900 mb-4",
              children: "Tweets"
            }), renderTweets()]
          }), results.hashtags.length > 0 && /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-lg font-semibold text-gray-900 mb-4",
              children: "Hashtags"
            }), renderHashtags()]
          })]
        });
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsxs("div", {
      className: "flex max-w-7xl mx-auto",
      children: [/* @__PURE__ */ jsx(Sidebar, {}), /* @__PURE__ */ jsx("main", {
        className: "flex-1 lg:ml-64 pb-16 lg:pb-0",
        children: /* @__PURE__ */ jsxs("div", {
          className: "max-w-2xl mx-auto",
          children: [/* @__PURE__ */ jsx("div", {
            className: "md:hidden p-4 border-b border-gray-200 bg-white sticky top-16 z-40",
            children: /* @__PURE__ */ jsx(SearchBox, {})
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-white border-b border-gray-200 p-4",
            children: [/* @__PURE__ */ jsx("div", {
              className: "flex items-center justify-between",
              children: /* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("h1", {
                  className: "text-xl font-bold text-gray-900",
                  children: query ? `Search results for "${query}"` : "Search"
                }), results && /* @__PURE__ */ jsxs("p", {
                  className: "text-sm text-gray-500 mt-1",
                  children: [getResultCount(), " results"]
                })]
              })
            }), results && /* @__PURE__ */ jsx("div", {
              className: "flex space-x-8 mt-4",
              children: ["all", "users", "tweets", "hashtags"].map((tab) => /* @__PURE__ */ jsx("button", {
                onClick: () => setActiveTab(tab),
                className: `pb-2 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`,
                children: tab
              }, tab))
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "p-4",
            children: loading ? /* @__PURE__ */ jsx("div", {
              className: "flex justify-center items-center py-12",
              children: /* @__PURE__ */ jsx("div", {
                className: "animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
              })
            }) : error ? /* @__PURE__ */ jsx("div", {
              className: "text-center py-12",
              children: /* @__PURE__ */ jsx("p", {
                className: "text-red-600",
                children: error
              })
            }) : !query ? /* @__PURE__ */ jsxs("div", {
              className: "text-center py-12",
              children: [/* @__PURE__ */ jsx("svg", {
                className: "mx-auto h-12 w-12 text-gray-400",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsx("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                })
              }), /* @__PURE__ */ jsx("h3", {
                className: "mt-2 text-sm font-medium text-gray-900",
                children: "Search Tweeter"
              }), /* @__PURE__ */ jsx("p", {
                className: "mt-1 text-sm text-gray-500",
                children: "Find people, tweets, and hashtags"
              })]
            }) : results && getResultCount() === 0 ? /* @__PURE__ */ jsxs("div", {
              className: "text-center py-12",
              children: [/* @__PURE__ */ jsx("svg", {
                className: "mx-auto h-12 w-12 text-gray-400",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsx("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.007-5.691-2.583M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                })
              }), /* @__PURE__ */ jsx("h3", {
                className: "mt-2 text-sm font-medium text-gray-900",
                children: "No results found"
              }), /* @__PURE__ */ jsx("p", {
                className: "mt-1 text-sm text-gray-500",
                children: "Try searching for something else"
              })]
            }) : renderContent()
          })]
        })
      })]
    }), /* @__PURE__ */ jsx(MobileNav, {})]
  });
});
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: search
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-CNDju8uA.js", "imports": ["/assets/jsx-runtime-D_zvdyIk.js", "/assets/chunk-C37GKA54-DsslrCQ8.js", "/assets/_commonjsHelpers-CE1G-McA.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/root-qVlnUdhg.js", "imports": ["/assets/jsx-runtime-D_zvdyIk.js", "/assets/chunk-C37GKA54-DsslrCQ8.js", "/assets/_commonjsHelpers-CE1G-McA.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": "/", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_index-BdNKSr6L.js", "imports": ["/assets/chunk-C37GKA54-DsslrCQ8.js", "/assets/_commonjsHelpers-CE1G-McA.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-C1z6mh55.js", "imports": ["/assets/chunk-C37GKA54-DsslrCQ8.js", "/assets/jsx-runtime-D_zvdyIk.js", "/assets/schemas-B1xTKLmx.js", "/assets/_commonjsHelpers-CE1G-McA.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/register": { "id": "routes/register", "parentId": "root", "path": "/register", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/register-CbKUaqh5.js", "imports": ["/assets/chunk-C37GKA54-DsslrCQ8.js", "/assets/jsx-runtime-D_zvdyIk.js", "/assets/schemas-B1xTKLmx.js", "/assets/_commonjsHelpers-CE1G-McA.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": "/home", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-wOitowRb.js", "imports": ["/assets/chunk-C37GKA54-DsslrCQ8.js", "/assets/jsx-runtime-D_zvdyIk.js", "/assets/MobileNav-DVqlFF22.js", "/assets/Tweet-C-cnuYn-.js", "/assets/schemas-B1xTKLmx.js", "/assets/_commonjsHelpers-CE1G-McA.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/users.$username": { "id": "routes/users.$username", "parentId": "root", "path": "/users/:username", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/users._username-D9uQFyoi.js", "imports": ["/assets/chunk-C37GKA54-DsslrCQ8.js", "/assets/jsx-runtime-D_zvdyIk.js", "/assets/Tweet-C-cnuYn-.js", "/assets/MobileNav-DVqlFF22.js", "/assets/_commonjsHelpers-CE1G-McA.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/settings": { "id": "routes/settings", "parentId": "root", "path": "/settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/settings-CivmH4Hd.js", "imports": ["/assets/chunk-C37GKA54-DsslrCQ8.js", "/assets/jsx-runtime-D_zvdyIk.js", "/assets/MobileNav-DVqlFF22.js", "/assets/schemas-B1xTKLmx.js", "/assets/_commonjsHelpers-CE1G-McA.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.tweets.api": { "id": "routes/api.tweets.api", "parentId": "root", "path": "/api/tweets", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.tweets.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.users.$username.api": { "id": "routes/api.users.$username.api", "parentId": "root", "path": "/api/users/:username", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.users._username.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.users.$username.follow.api": { "id": "routes/api.users.$username.follow.api", "parentId": "root", "path": "/api/users/:username/follow", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.users._username.follow.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.tweets.$tweetId.like.api": { "id": "routes/api.tweets.$tweetId.like.api", "parentId": "root", "path": "/api/tweets/:tweetId/like", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.tweets._tweetId.like.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.auth.login": { "id": "routes/api.auth.login", "parentId": "root", "path": "/api/auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.auth.login-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.auth.register": { "id": "routes/api.auth.register", "parentId": "root", "path": "/api/auth/register", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.auth.register-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.auth.verify-email.$token.api": { "id": "routes/api.auth.verify-email.$token.api", "parentId": "root", "path": "/api/auth/verify-email/:token", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.auth.verify-email._token.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.upload.avatar.api": { "id": "routes/api.upload.avatar.api", "parentId": "root", "path": "/api/upload/avatar", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.upload.avatar.api-CJa6aMx1.js", "imports": ["/assets/_commonjsHelpers-CE1G-McA.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.search.api": { "id": "routes/api.search.api", "parentId": "root", "path": "/api/search", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.search.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/search": { "id": "routes/search", "parentId": "root", "path": "/search", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/search-Bx9en7hl.js", "imports": ["/assets/chunk-C37GKA54-DsslrCQ8.js", "/assets/jsx-runtime-D_zvdyIk.js", "/assets/MobileNav-DVqlFF22.js", "/assets/Tweet-C-cnuYn-.js", "/assets/_commonjsHelpers-CE1G-McA.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-94c28dad.js", "version": "94c28dad", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: "/",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "/login",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/register": {
    id: "routes/register",
    parentId: "root",
    path: "/register",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: "/home",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/users.$username": {
    id: "routes/users.$username",
    parentId: "root",
    path: "/users/:username",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/settings": {
    id: "routes/settings",
    parentId: "root",
    path: "/settings",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/api.tweets.api": {
    id: "routes/api.tweets.api",
    parentId: "root",
    path: "/api/tweets",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/api.users.$username.api": {
    id: "routes/api.users.$username.api",
    parentId: "root",
    path: "/api/users/:username",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/api.users.$username.follow.api": {
    id: "routes/api.users.$username.follow.api",
    parentId: "root",
    path: "/api/users/:username/follow",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/api.tweets.$tweetId.like.api": {
    id: "routes/api.tweets.$tweetId.like.api",
    parentId: "root",
    path: "/api/tweets/:tweetId/like",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/api.auth.login": {
    id: "routes/api.auth.login",
    parentId: "root",
    path: "/api/auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/api.auth.register": {
    id: "routes/api.auth.register",
    parentId: "root",
    path: "/api/auth/register",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/api.auth.verify-email.$token.api": {
    id: "routes/api.auth.verify-email.$token.api",
    parentId: "root",
    path: "/api/auth/verify-email/:token",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/api.upload.avatar.api": {
    id: "routes/api.upload.avatar.api",
    parentId: "root",
    path: "/api/upload/avatar",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/api.search.api": {
    id: "routes/api.search.api",
    parentId: "root",
    path: "/api/search",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/search": {
    id: "routes/search",
    parentId: "root",
    path: "/search",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
