import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on 0.0.0.0 inside the container
    port: 5173,
    allowedHosts: ["xeffect.local"], // allow requests coming via ingress host
  },
});