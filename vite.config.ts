import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [
    remix({
      appDirectory: "src/app",
      routes(defineRoutes) {
        return defineRoutes((route) => {
          // Programmatic routes will be defined here
          // For now, using default file-based routing
        });
      },
    }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src/app"),
    },
  },
});
