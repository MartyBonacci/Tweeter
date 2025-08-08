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
} satisfies Config;