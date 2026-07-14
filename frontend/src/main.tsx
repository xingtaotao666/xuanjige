import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 使用 HashRouter：GitHub Pages 部署在子路径 /xuanjige/ 下，
// 浏览器 URL 路径为 /xuanjige/ 不会被 BrowserRouter 的路由匹配到，
// 哈希路由对子路径天然免疫（#/ 之后的内容不发送到服务器）。
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
