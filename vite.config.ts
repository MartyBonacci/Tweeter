import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
  optimizeDeps: {
    exclude: ['@node-rs/argon2', 'uuidv7']
  },
  build: {
    rollupOptions: {
      external: ['@node-rs/argon2-wasm32-wasi', '@node-rs/argon2', 'uuidv7']
    }
  },
  ssr: {
    external: ['@node-rs/argon2', 'uuidv7']
  }
});