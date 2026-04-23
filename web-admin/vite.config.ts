import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const KONG_URL = process.env.VITE_KONG_URL || "http://localhost:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/auth": { target: KONG_URL, changeOrigin: true },
      "/core": { target: KONG_URL, changeOrigin: true },
      "/order": { target: KONG_URL, changeOrigin: true },
      "/chat":  { target: KONG_URL, changeOrigin: true },
    },
  },
});