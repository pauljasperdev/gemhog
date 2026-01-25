import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/lambda.ts", "./src/serve.ts"],
  format: "esm",
  outDir: "./dist",
  clean: true,
  noExternal: [/@gemhog\/.*/],
});
