import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin to handle JSX in .js files as a fallback
function jsxInJs() {
  return {
    name: "jsx-in-js",
    enforce: "pre",
    async transform(code, id) {
      // Only handle .js files in src/ that contain JSX
      if (!id.endsWith(".js") || !id.includes("/src/") || !code.includes("<")) {
        return null;
      }
      // Use esbuild to transform JSX
      const { transform } = await import("esbuild");
      const result = await transform(code, {
        loader: "jsx",
        jsx: "automatic",
        sourcefile: id,
      });
      return {
        code: result.code,
        map: result.map || null,
      };
    },
  };
}

export default defineConfig({
  plugins: [
    jsxInJs(),
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
      "routes.js": path.resolve(__dirname, "src/routes.js"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: "build",
  },
});
