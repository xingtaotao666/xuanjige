# 玄机阁 · 部署指南（纯前端 / 零后端）

本项目已**完全纯前端化**：八字排盘、易经起卦、古籍 RAG 检索、DeepSeek 解读全部在浏览器内完成，
无需任何服务器。构建产物是一个纯静态站点（`frontend/dist`），可托管到任意静态平台。

---

## 一、架构说明

| 能力 | 实现位置 | 说明 |
| --- | --- | --- |
| 八字排盘 / 十神 / 五行 / 神煞 / 大运 | `src/lib/bazi/engine.ts` | 移植自后端 Python 引擎，浏览器内计算 |
| 易经起卦 / 变卦 / 错卦 / 综卦 | `src/lib/yijing/engine.ts` | 铜钱投掷与数字起卦 |
| 古籍检索（RAG） | `src/lib/rag/retriever.ts` | 关键词回退检索，语料随站分发（`public/corpus`） |
| AI 解读 | `src/lib/llm/deepseek.ts` | 浏览器直连 DeepSeek（已验证支持 CORS） |
| 知识库 | `src/lib/knowledge.ts` | 13 个 JSON 随站分发（`public/data`） |

**关于 AI 解读的 API Key：**
- 优先级：用户在前端「设置」中填写的 `localStorage` 值 > 部署时注入的 `VITE_DEEPSEEK_API_KEY`。
- 未配置 Key 时，解读自动降级为规则式文本（排盘/起卦核心功能不受影响）。
- Key **不会**硬编码进仓库，也不会上传到任何服务器（仅存于访问者本机浏览器）。

---

## 二、方式一：GitHub Pages（推荐，自动部署）

### 1. 初始化仓库并推送

```bash
cd <项目根目录>
git init
git add .
git commit -m "feat: 玄机阁纯前端化"
gh repo create xuanji-ge --public   # 或用 GitHub 网页建仓库后关联
git branch -M main
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
git push -u origin main
```

> 工作流监听 `main` 分支。若你的默认分支是 `master`，请修改 `.github/workflows/deploy.yml` 中的
> `branches: [main]` 为 `[master]`。

### 2. 启用 Pages

1. 打开仓库 **Settings → Pages**。
2. **Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送代码后，Actions 会自动构建并发布。访问地址形如：
   `https://<用户名>.github.io/<仓库名>/`

### 3.（可选）配置默认 API Key

仓库 **Settings → Secrets and variables → Actions → New repository secret**，
名称填 `VITE_DEEPSEEK_API_KEY`，值为你的 DeepSeek Key。之后每次构建会注入为全站默认值，
用户仍可在「设置」中覆盖。

---

## 三、方式二：Gitee Pages（国内访问更顺畅）

GitHub Pages 在国内有时访问不稳定，可镜像到 Gitee：

1. 在 [Gitee](https://gitee.com) 新建仓库，导入（Import）GitHub 仓库，或 `git push` 到 Gitee 远程。
2. 仓库 **服务 → Gitee Pages**，选择部署目录（见下方两种子方案）。
3. 由于 Gitee Pages 不原生支持 GitHub Actions，推荐**提交构建产物**方式：

```bash
cd frontend
npm install
npm run build          # 生成 dist/
# 将 dist 内容推到仓库根目录（或 Gitee Pages 指定的部署分支/目录）
# 方式 A：把 dist 作为仓库内容推送
cp -r dist/* ../
git add . && git commit -m "deploy" && git push
# 方式 B（推荐）：使用 gitee-pages-action 等社区 Action 自动同步
```

> 提示：`vite.config.ts` 中 `base: './'` 确保资源使用相对路径，无论是挂在
> `https://<用户名>.gitee.io/<仓库名>/` 还是自定义域名根目录都能正常加载。

---

## 四、本地预览 / 手动构建

```bash
cd frontend
npm install
npm run build        # tsc -b && vite build，产物在 frontend/dist
npm run preview      # 本地预览构建结果（默认 http://localhost:4173）
```

如需自定义域名：在 GitHub Pages / Gitee Pages 设置中填写，并在 `frontend/public`
放置 `CNAME` 文件（内容为你的域名），同时在 `vite.config.ts` 保持 `base: './'` 即可。

---

## 五、常见问题

- **刷新子页面 404？** 已通过工作流中的 `cp dist/index.html dist/404.html` 处理（SPA 深链回退）。
- **资源 404 / 白屏？** 确认 `base` 为 `'./'`（已配置），且 `public/data`、`public/corpus` 已随构建分发。
- **AI 解读没有内容？** 多半是未配置 API Key；点击右上角「设置」填入 DeepSeek Key 即可。
- **国内访问慢？** 优先选 Gitee Pages 或绑定国内可访问的自定义域名。
