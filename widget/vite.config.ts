import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/widget.ts",
      name: "NicheDeskWidget",
      formats: ["iife"],
      fileName: () => "nichedesk-widget.js",
    },
    minify: "esbuild",
    cssCodeSplit: false,
    target: "es2020",
    reportCompressedSize: true,
  },
});
