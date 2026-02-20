import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      assets: path.resolve(__dirname, "src/assets"),
      components: path.resolve(__dirname, "src/components"),
      context: path.resolve(__dirname, "src/context"),
      hooks: path.resolve(__dirname, "src/hooks"),
      layouts: path.resolve(__dirname, "src/layouts"),
      lib: path.resolve(__dirname, "src/lib"),
      services: path.resolve(__dirname, "src/services"),
      types: path.resolve(__dirname, "src/types"),
      views: path.resolve(__dirname, "src/views"),
      routes: path.resolve(__dirname, "src/routes.ts"),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: "build",
  },
});
