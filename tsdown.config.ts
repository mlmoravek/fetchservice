import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/**/index.ts",
  exports: true,
  platform: "neutral",
  dts: {
    sourcemap: true,
  },
  alias: { "@": "./src" },
});
