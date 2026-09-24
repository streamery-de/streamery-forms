import { v4wp } from "@kucrut/vite-for-wp";
import react from "@vitejs/plugin-react";
import path from "path"

// Every compiled file starts with a comment naming its human-readable source,
// so the source can be found from the minified file alone (WordPress.org
// plugin guideline 4).
const SOURCE_BANNER =
  "/*! Streamery Forms - compiled file. Human-readable source: src/admin/, src/components/, src/lib/, src/hooks/ (shipped in this plugin) and https://github.com/streamery-de/streamery-forms - build: npm ci && npm run build */";

// Prepended after minification so it stays on line 1 (rollup's output.banner
// ends up behind hoisted imports and does not cover CSS).
function sourceBanner() {
  return {
    name: "source-banner",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === "chunk") {
          file.code = `${SOURCE_BANNER}\n${file.code}`;
        } else if (file.fileName.endsWith(".css")) {
          file.source = `${SOURCE_BANNER}\n${file.source}`;
        }
      }
    },
  };
}

export default {
  plugins: [
    v4wp({
      input: {
        main: "src/admin/main.jsx",
      },
      outDir: "assets/admin/dist",
    }),
    // wp_scripts(),
    react(),
    sourceBanner(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
