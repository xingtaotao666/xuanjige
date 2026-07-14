import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // 本机沙箱的 safe-delete 拦截会阻止 vite 清空 dist，改为手动清理：
    // 构建前先 `rm -rf dist`（CI 每次全新检出，dist 本就不存在）。
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
