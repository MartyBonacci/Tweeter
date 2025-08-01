import type { Config } from "@react-router/dev/config";

export default {
  // Server-side rendering and hydration
  ssr: true,
  
  // Build configuration
  buildDirectory: "build",
  
  // Server build configuration
  serverBuildFile: "index.js",
  
  // App directory
  appDirectory: "app",
  
  // Assets configuration
  assetsBuildDirectory: "build/client",
  
  // Public directory
  publicPath: "/",
  
  // Routes configuration
  routes(defineRoutes) {
    return defineRoutes((route) => {
      route("/", "routes/home.tsx", { index: true });
      route("/login", "routes/login.tsx");
      route("/register", "routes/register.tsx");
      route("/profile/:username", "routes/profile.$username.tsx");
      route("/api/auth/*", "routes/api/auth.$.tsx");
      route("/api/tweets/*", "routes/api/tweets.$.tsx");
      route("/api/users/*", "routes/api/users.$.tsx");
    });
  },
} satisfies Config;