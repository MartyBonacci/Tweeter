import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Meta, Links, Outlet, Scripts, useNavigate, useActionData, Form, data, Link, useLocation, useFetcher, useLoaderData, UNSAFE_withErrorBoundaryProps } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import React, { useEffect, useState } from "react";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, timestamp, uuid, primaryKey, varchar, text } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { relations, eq, count, desc, and, inArray } from "drizzle-orm";
import { formatDistanceToNow, format } from "date-fns";
import { z } from "zod";
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
const styles = "/assets/tailwind-D4C4iGgs.css";
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
async function loader$7({
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
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function loader$6() {
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
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
function LoginForm() {
  const actionData = useActionData();
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
              id: "username",
              name: "username",
              type: "text",
              required: true,
              className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm",
              placeholder: "Username"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "sr-only", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "password",
              name: "password",
              type: "password",
              required: true,
              className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm",
              placeholder: "Password"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          children: "Sign in"
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
async function action$7({
  request
}) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
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
  action: action$7,
  default: login
}, Symbol.toStringTag, { value: "Module" }));
function RegisterForm() {
  const actionData = useActionData();
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
              id: "username",
              name: "username",
              type: "text",
              required: true,
              minLength: 3,
              maxLength: 50,
              className: "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
              placeholder: "Choose a username"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email address" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "email",
              name: "email",
              type: "email",
              required: true,
              className: "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
              placeholder: "Enter your email"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "displayName", className: "block text-sm font-medium text-gray-700", children: "Display Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "displayName",
              name: "displayName",
              type: "text",
              maxLength: 100,
              className: "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
              placeholder: "Your display name (optional)"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "password",
              name: "password",
              type: "password",
              required: true,
              minLength: 6,
              className: "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
              placeholder: "Create a password"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700", children: "Confirm Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "confirmPassword",
              name: "confirmPassword",
              type: "password",
              required: true,
              className: "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
              placeholder: "Confirm your password"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          children: "Sign up"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx("a", { href: "/login", className: "text-blue-600 hover:text-blue-500", children: "Already have an account? Sign in" }) })
    ] })
  ] }) });
}
async function action$6({
  request
}) {
  const formData = await request.formData();
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const displayName = formData.get("displayName");
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
  action: action$6,
  default: register
}, Symbol.toStringTag, { value: "Module" }));
function Header() {
  return /* @__PURE__ */ jsx("header", { className: "bg-white border-b border-gray-200 sticky top-0 z-50", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center h-16", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsx(Link, { to: "/", className: "text-2xl font-bold text-blue-500", children: "Tweeter" }) }),
    /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex space-x-8", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium", children: "Home" }),
      /* @__PURE__ */ jsx(Link, { to: "/explore", className: "text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium", children: "Explore" }),
      /* @__PURE__ */ jsx(Link, { to: "/notifications", className: "text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium", children: "Notifications" }),
      /* @__PURE__ */ jsx(Link, { to: "/messages", className: "text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium", children: "Messages" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
      /* @__PURE__ */ jsx("button", { className: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium", children: "Tweet" }),
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-gray-300 rounded-full" })
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
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold", children: currentUser.username?.charAt(0)?.toUpperCase() || "U" }),
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
    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: tweet.user.avatar ? /* @__PURE__ */ jsx(
      "img",
      {
        src: tweet.user.avatar,
        alt: tweet.user.displayName,
        className: "h-12 w-12 rounded-full"
      }
    ) : /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-gray-600", children: tweet.user.displayName?.charAt(0).toUpperCase() || tweet.user.username?.charAt(0).toUpperCase() || "U" }) }) }),
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
function TweetForm() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useUser();
  const charCount = content.length;
  const isOverLimit = charCount > 140;
  const remainingChars = 140 - charCount;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim() && !isOverLimit) {
      setIsSubmitting(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to create tweets");
        setIsSubmitting(false);
        return;
      }
      try {
        const response = await fetch("/api/tweets/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${token}`
          },
          body: new URLSearchParams({ content: content.trim() })
        });
        const data2 = await response.json();
        if (data2.error) {
          setError(data2.error);
        } else if (data2.tweet) {
          setContent("");
          window.location.reload();
        }
      } catch (err) {
        setError("Failed to create tweet");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    if (newContent.length <= 140) {
      setContent(newContent);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-gray-600", children: user?.username?.charAt(0).toUpperCase() || "U" }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: content,
            onChange: handleContentChange,
            placeholder: "What's happening?",
            className: "w-full resize-none border-0 focus:ring-0 text-lg placeholder-gray-500 p-0 min-h-[60px]",
            rows: 3,
            disabled: isSubmitting
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
              children: isSubmitting ? "Posting..." : "Tweet"
            }
          )
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm mt-2", children: error })
    ] })
  ] }) });
}
function Timeline() {
  const [tweets2, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("for-you");
  const fetcher = useFetcher();
  const fetchTweets = async () => {
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
  };
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
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
      /* @__PURE__ */ jsx(TweetForm, {}),
      /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 p-4", children: /* @__PURE__ */ jsx("div", { className: "animate-pulse", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-full bg-gray-300" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-1/4" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded" }),
            /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-300 rounded w-5/6" })
          ] })
        ] })
      ] }) }) })
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
    ] }) : tweets2.map(({ tweet, user, likeCount }) => /* @__PURE__ */ jsx(Tweet, { tweet: {
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
    } }, tweet.id))
  ] });
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
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
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
                  children: [user.avatar ? /* @__PURE__ */ jsx("img", {
                    src: user.avatar,
                    alt: user.displayName,
                    className: "h-20 w-20 rounded-full border-4 border-white"
                  }) : /* @__PURE__ */ jsx("div", {
                    className: "h-20 w-20 rounded-full bg-gray-300 border-4 border-white flex items-center justify-center",
                    children: /* @__PURE__ */ jsx("span", {
                      className: "text-2xl font-semibold text-gray-600",
                      children: user.displayName?.charAt(0)?.toUpperCase() || "U"
                    })
                  }), currentUser?.username === data2.user.username ? /* @__PURE__ */ jsx(Link, {
                    to: "/settings",
                    className: "ml-auto bg-white border border-gray-300 text-gray-900 px-4 py-1 rounded-full font-medium hover:bg-gray-50",
                    children: "Edit profile"
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
async function loader$5({
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
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function loader$4({
  request
}) {
  return {
    user: null
  };
}
const settings = UNSAFE_withComponentProps(function Settings() {
  const {
    user: initialData
  } = useLoaderData();
  const {
    user,
    isLoading: isAuthLoading
  } = useUser();
  const navigate = useNavigate();
  useActionData();
  const [userData, setUserData] = useState({
    username: "",
    displayName: "",
    bio: "",
    avatar: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login");
      return;
    }
    if (!user || isAuthLoading) {
      return;
    }
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const response = await fetch(`/api/users/${user.username}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const data2 = await response.json();
        setUserData({
          username: data2.username || "",
          displayName: data2.displayName || "",
          bio: data2.bio || "",
          avatar: data2.avatar || ""
        });
      } catch (error2) {
        console.error("Error fetching user data:", error2);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserData();
  }, [user, navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await fetch("/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${token}`
        },
        body: new URLSearchParams({
          displayName: userData.displayName,
          username: userData.username,
          bio: userData.bio || "",
          avatar: userData.avatar || ""
        })
      });
      if (!response.ok) {
        const data2 = await response.json();
        throw new Error(data2.error || "Failed to update profile");
      }
      setSuccess(true);
      setTimeout(() => {
        navigate(`/users/${userData.username}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };
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
          children: isLoadingUser || isAuthLoading ? /* @__PURE__ */ jsx("div", {
            className: "flex justify-center items-center py-8",
            children: /* @__PURE__ */ jsx("div", {
              className: "text-gray-500",
              children: "Loading..."
            })
          }) : /* @__PURE__ */ jsxs("form", {
            onSubmit: handleSubmit,
            className: "space-y-6",
            children: [error && /* @__PURE__ */ jsx("div", {
              className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded",
              children: error
            }), success && /* @__PURE__ */ jsx("div", {
              className: "bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded",
              children: "Profile updated successfully!"
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                htmlFor: "displayName",
                className: "block text-sm font-medium text-gray-700 mb-2",
                children: "Display name"
              }), /* @__PURE__ */ jsx("input", {
                type: "text",
                id: "displayName",
                name: "displayName",
                value: userData.displayName,
                onChange: (e) => setUserData({
                  ...userData,
                  displayName: e.target.value
                }),
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                maxLength: 50,
                required: true
              })]
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                htmlFor: "username",
                className: "block text-sm font-medium text-gray-700 mb-2",
                children: "Username"
              }), /* @__PURE__ */ jsx("input", {
                type: "text",
                id: "username",
                name: "username",
                value: userData.username,
                onChange: (e) => setUserData({
                  ...userData,
                  username: e.target.value
                }),
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                pattern: "[a-zA-Z0-9_]+",
                title: "Username can only contain letters, numbers, and underscores",
                maxLength: 15,
                required: true
              })]
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                htmlFor: "bio",
                className: "block text-sm font-medium text-gray-700 mb-2",
                children: "Bio"
              }), /* @__PURE__ */ jsx("textarea", {
                id: "bio",
                name: "bio",
                value: userData.bio,
                onChange: (e) => setUserData({
                  ...userData,
                  bio: e.target.value
                }),
                rows: 3,
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                maxLength: 160,
                placeholder: "Tell us about yourself..."
              })]
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                htmlFor: "avatar",
                className: "block text-sm font-medium text-gray-700 mb-2",
                children: "Avatar URL"
              }), /* @__PURE__ */ jsx("input", {
                type: "url",
                id: "avatar",
                name: "avatar",
                value: userData.avatar,
                onChange: (e) => setUserData({
                  ...userData,
                  avatar: e.target.value
                }),
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                placeholder: "https://example.com/avatar.jpg"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex space-x-4",
              children: [/* @__PURE__ */ jsx("button", {
                type: "submit",
                disabled: isLoading,
                className: "bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
                children: isLoading ? "Saving..." : "Save changes"
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                onClick: () => navigate(`/users/${user?.username || ""}`),
                className: "bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300",
                children: "Cancel"
              })]
            })]
          })
        })]
      })]
    }), /* @__PURE__ */ jsx(MobileNav, {})]
  });
});
async function action$5({
  request
}) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const displayName = formData.get("displayName");
  const username = formData.get("username");
  const bio = formData.get("bio");
  const avatar = formData.get("avatar");
  if (!displayName || !username) {
    return Response.json({
      error: "Display name and username are required"
    }, {
      status: 400
    });
  }
  if (username.length > 15) {
    return Response.json({
      error: "Username must be 15 characters or less"
    }, {
      status: 400
    });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return Response.json({
      error: "Username can only contain letters, numbers, and underscores"
    }, {
      status: 400
    });
  }
  if (bio && bio.length > 160) {
    return Response.json({
      error: "Bio must be 160 characters or less"
    }, {
      status: 400
    });
  }
  try {
    const [otherUserWithUsername] = await db.select({
      id: users.id
    }).from(users).where(and(eq(users.username, username))).limit(1);
    if (otherUserWithUsername && otherUserWithUsername.id !== user.userId) {
      return Response.json({
        error: "Username is already taken"
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
    }).where(eq(users.id, user.userId));
    return Response.json({
      success: true
    });
  } catch (error) {
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
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
async function loader$3({
  request
}) {
  const user = await requireAuth(request);
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT)), MAX_LIMIT);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const filter = url.searchParams.get("filter") || "all";
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
          displayName: users.display_name
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
          displayName: users.display_name
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
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
function validateUsername(username) {
  const errors = [];
  if (!username || username.length < 3) {
    errors.push({ field: "username", message: "Username must be at least 3 characters long" });
  }
  if (username.length > 50) {
    errors.push({ field: "username", message: "Username must be at most 50 characters long" });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push({ field: "username", message: "Username can only contain letters, numbers, underscores, and hyphens" });
  }
  return { isValid: errors.length === 0, errors };
}
function validateEmail(email) {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push({ field: "email", message: "Please enter a valid email address" });
  }
  return { isValid: errors.length === 0, errors };
}
function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push({ field: "password", message: "Password must be at least 8 characters long" });
  }
  if (password.length > 128) {
    errors.push({ field: "password", message: "Password must be at most 128 characters long" });
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push({ field: "password", message: "Password must contain at least one lowercase letter" });
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push({ field: "password", message: "Password must contain at least one uppercase letter" });
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push({ field: "password", message: "Password must contain at least one number" });
  }
  return { isValid: errors.length === 0, errors };
}
function validateTweetContent(content) {
  const errors = [];
  if (!content || content.trim().length === 0) {
    errors.push({ field: "content", message: "Tweet content is required" });
  }
  if (content.length > 140) {
    errors.push({ field: "content", message: "Tweet must be 140 characters or less" });
  }
  return { isValid: errors.length === 0, errors };
}
z.object({
  content: z.string().min(1).max(140)
});
async function action$4({
  request
}) {
  const user = await requireAuth(request);
  if (request.method !== "POST") {
    return data({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  try {
    const formData = await request.formData();
    const content = formData.get("content");
    if (!content || typeof content !== "string") {
      return data({
        error: "Content is required"
      }, {
        status: 400
      });
    }
    const validation = validateTweetContent(content);
    if (!validation.isValid) {
      return data({
        error: validation.errors[0].message
      }, {
        status: 400
      });
    }
    const [tweet] = await db.insert(tweets).values({
      user_id: user.userId,
      content: content.trim()
    }).returning();
    return data({
      tweet
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
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4
}, Symbol.toStringTag, { value: "Module" }));
async function loader$2({
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
        displayName: users.display_name
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
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function action$3({
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
async function loader$1({
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
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function action$2({
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
async function loader({
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
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  loader
}, Symbol.toStringTag, { value: "Module" }));
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
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");
    if (!username || !password) {
      return new Response(JSON.stringify({
        message: "Username and password are required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const [user] = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
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
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1
}, Symbol.toStringTag, { value: "Module" }));
async function action({
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
    const formData = await request.formData();
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");
    const displayName = formData.get("displayName");
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const errors = [...usernameValidation.errors, ...emailValidation.errors, ...passwordValidation.errors];
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        errors
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
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
    const [newUser] = await db.insert(users).values({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      display_name: displayName || username
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.display_name
    });
    const token = generateToken({
      userId: newUser.id,
      username: newUser.username
    });
    return new Response(JSON.stringify({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName
      },
      token
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
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-McodlLfg.js", "imports": ["/assets/jsx-runtime-D_zvdyIk.js", "/assets/chunk-C37GKA54-DzvN4HZS.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/root-ATowwpFk.js", "imports": ["/assets/jsx-runtime-D_zvdyIk.js", "/assets/chunk-C37GKA54-DzvN4HZS.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": "/", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_index-DSPytAGF.js", "imports": ["/assets/chunk-C37GKA54-DzvN4HZS.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-COuthTdY.js", "imports": ["/assets/chunk-C37GKA54-DzvN4HZS.js", "/assets/jsx-runtime-D_zvdyIk.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/register": { "id": "routes/register", "parentId": "root", "path": "/register", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/register-DblS6bUV.js", "imports": ["/assets/chunk-C37GKA54-DzvN4HZS.js", "/assets/jsx-runtime-D_zvdyIk.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": "/home", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-H_pg3ltL.js", "imports": ["/assets/chunk-C37GKA54-DzvN4HZS.js", "/assets/jsx-runtime-D_zvdyIk.js", "/assets/MobileNav-DSL4YrWt.js", "/assets/Tweet-PV8-JUvY.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/users.$username": { "id": "routes/users.$username", "parentId": "root", "path": "/users/:username", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/users._username-2C-SqeEb.js", "imports": ["/assets/chunk-C37GKA54-DzvN4HZS.js", "/assets/jsx-runtime-D_zvdyIk.js", "/assets/Tweet-PV8-JUvY.js", "/assets/MobileNav-DSL4YrWt.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/settings": { "id": "routes/settings", "parentId": "root", "path": "/settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/settings-DbzOWw_l.js", "imports": ["/assets/chunk-C37GKA54-DzvN4HZS.js", "/assets/jsx-runtime-D_zvdyIk.js", "/assets/MobileNav-DSL4YrWt.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.tweets.api": { "id": "routes/api.tweets.api", "parentId": "root", "path": "/api/tweets", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.tweets.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.tweets.create.api": { "id": "routes/api.tweets.create.api", "parentId": "root", "path": "/api/tweets/create", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.tweets.create.api-DLdxOAow.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.users.$username.api": { "id": "routes/api.users.$username.api", "parentId": "root", "path": "/api/users/:username", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.users._username.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.users.$username.follow.api": { "id": "routes/api.users.$username.follow.api", "parentId": "root", "path": "/api/users/:username/follow", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.users._username.follow.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.tweets.$tweetId.like.api": { "id": "routes/api.tweets.$tweetId.like.api", "parentId": "root", "path": "/api/tweets/:tweetId/like", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.tweets._tweetId.like.api-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.auth.login": { "id": "routes/api.auth.login", "parentId": "root", "path": "/api/auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.auth.login-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.auth.register": { "id": "routes/api.auth.register", "parentId": "root", "path": "/api/auth/register", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.auth.register-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-c7f4f86a.js", "version": "c7f4f86a", "sri": void 0 };
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
  "routes/api.tweets.create.api": {
    id: "routes/api.tweets.create.api",
    parentId: "root",
    path: "/api/tweets/create",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/api.users.$username.api": {
    id: "routes/api.users.$username.api",
    parentId: "root",
    path: "/api/users/:username",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/api.users.$username.follow.api": {
    id: "routes/api.users.$username.follow.api",
    parentId: "root",
    path: "/api/users/:username/follow",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/api.tweets.$tweetId.like.api": {
    id: "routes/api.tweets.$tweetId.like.api",
    parentId: "root",
    path: "/api/tweets/:tweetId/like",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/api.auth.login": {
    id: "routes/api.auth.login",
    parentId: "root",
    path: "/api/auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/api.auth.register": {
    id: "routes/api.auth.register",
    parentId: "root",
    path: "/api/auth/register",
    index: void 0,
    caseSensitive: void 0,
    module: route13
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
