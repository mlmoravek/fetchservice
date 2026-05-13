import { defineConfig } from "tsdown";

export default defineConfig({
  platform: "neutral",
  dts: {
    sourcemap: true,
  },
  alias: { "@": "./src" },
});
