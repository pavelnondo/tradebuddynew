import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Force unique bundle names with timestamp to bypass cache
        entryFileNames: `assets/[name]-${Date.now()}-[hash].js`,
        chunkFileNames: `assets/[name]-${Date.now()}-[hash].js`,
        assetFileNames: `assets/[name]-${Date.now()}-[hash].[ext]`
      }
    }
  }
}));
