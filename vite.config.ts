import { defineConfig } from "vite";

export default defineConfig({
  // 相対パスにしておくことで、GitHub Pages のようなサブパス配信でも
  // dist/ の中身をそのまま配置すれば動作する。
  base: "./",
});
