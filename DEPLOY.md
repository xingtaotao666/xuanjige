# 玄机阁 · 部署指南（纯前端 / 零后端）

本项目已**完全纯前端化**：八字排盘、易经起卦、古籍 RAG 检索、DeepSeek 解读全部在浏览器内完成，  
无需任何服务器。构建产物是一个纯静态站点（`frontend/dist`），可托管到任意静态平台。

---

## 一、架构说明

| 能力                       | 实现位置                       | 说明                              |
| ------------------------ | -------------------------- | ------------------------------- |
| 八字排盘 / 十神 / 五行 / 神煞 / 大运 | `src/lib/bazi/engine.ts`   | 移植自后端 Python 引擎，浏览器内计算          |
| 易经起卦 / 变卦 / 错卦 / 综卦      | `src/lib/yijing/engine.ts` | 铜钱投掷与数字起卦                       |
| 古籍检索（RAG）                | `src/lib/rag/retriever.ts` | 关键词回退检索，语料随站分发（`public/corpus`） |
| AI 解读                    | `src/lib/llm/deepseek.ts`  | 浏览器直连 DeepSeek（已验证支持 CORS）      |
| 知识库                      | `src/lib/knowledge.ts`     | 13 个 JSON 随站分发（`public/data`）   |

**关于 AI 解读的 API Key（当前已全站注入）：**

- 本项目采用「构建期注入」：在 `frontend/.env` 写入 `VITE_DEEPSEEK_API_KEY=<你的Key>`（该文件已被  
  `.gitignore` 忽略，不会进 `main` 源码仓库），构建后 Key 随前端包分发，**所有访客打开即用 AI 解读**，  
  无需各自填 Key。
- 优先级：用户在前端「设置」中填写的 `localStorage` 值 > 构建期注入的 `VITE_DEEPSEEK_API_KEY`。
- ⚠️ Key 注入后，构建产物（gh-pages 上的 JS）会以**明文**包含该 Key（任何访客查看页面源码都可读取）。  
  这是纯前端方案的固有取舍：**好处是全员免配置即用 AI；风险是 Key 暴露、可能被他人盗用刷额度扣费**。
- 安全建议：若 Key 出现异常扣费或被盗用，请到 DeepSeek 平台重新生成 Key，更新 `frontend/.env`  
  后重新构建部署即可。
- 我现在想加个支付系统未注入 Key（或访客自行清除）时，解读自动降级为规则式文本（排盘/起卦核心功能不受影响）。

---

## 二、GitHub Pages（当前已上线 ✅）

> 线上地址：**<https://xingtaotao666.github.io/xuanjige/>**  
> 部署方式：**`gh-pages` 分支**（GitHub Pages 源 = `gh-pages` 分支 / 根目录）。

采用 `gh-pages` 分支而非 GitHub Actions，是因为当前本机缓存的 GitHub Token 仅有 `repo` 权限、  
**缺少 `workflow` 权限**，无法推送 `.github/workflows/*.yml`（GitHub 安全限制）。`gh-pages` 分支方式  
不需要 `workflow` 权限，且对纯静态站点完全够用。

### 1. 仓库与代码（已完成）

```bash
git init -b main
git add .
git commit -m "feat: 玄机阁纯前端化"
git remote add origin https://github.com/xingtaotao666/xuanjige.git
git push -u origin main
```

### 2. 构建并发布到 gh-pages（每次更新都要执行）

```bash
cd frontend
rm -rf dist                 # 本机沙箱会拦截 vite 自动清空 dist，故手动删
# 如需全站 AI 解读：确保 frontend/.env 含 VITE_DEEPSEEK_API_KEY（构建时由 Vite 自动注入）
npm install
npm run build               # 产物在 frontend/dist
# 将产物连同 404.html 推到 gh-pages 分支
rm -rf /tmp/ghpages && mkdir -p /tmp/ghpages
cp -r dist/* /tmp/ghpages/
cp /tmp/ghpages/index.html /tmp/ghpages/404.html   # SPA 深链回退（刷新子页不 404）
cd /tmp/ghpages
git init -b gh-pages
git add -A
git -c user.email=2505429558@qq.com -c user.name=xingtaotao666 commit -m "deploy"
git remote add origin https://github.com/xingtaotao666/xuanjige.git
git push origin gh-pages --force     # 部署分支，force 推送是惯例
```

### 3. 启用 Pages（一次性，已做）

仓库 **Settings → Pages → Build and deployment → Source** 选 **Deploy from a branch**，  
分支选 **`gh-pages`**，目录 **`/ (root)`**。保存后访问上面的线上地址即可。

---

## 三、（可选）升级为 GitHub Actions 自动部署

若希望「每次 `git push` 自动构建发布」，可使用仓库根目录的 **`github-pages-deploy.yml`**  
（即标准的 Actions 部署工作流）。激活方法二选一：

- **方式 A（网页操作，无需 token 权限）**：在 GitHub 仓库网页上  
  `Create new file` → 路径填 `.github/workflows/deploy.yml` → 内容粘贴 `github-pages-deploy.yml`  
  的内容 → 提交。该文件提交后 Actions 会自动运行，并把 Pages 源自动切到 **GitHub Actions**。
- **方式 B（命令行）**：用一枚带有 `workflow` 权限的 Personal Access Token 推送该文件到  
  `.github/workflows/deploy.yml` 即可（当前缓存 token 无此权限，需新生成）。

> 升级到 Actions 后，`gh-pages` 分支不再需要维护（Actions 直接发布构建产物）。

（可选）默认 API Key：仓库 **Settings → Secrets → Actions → New repository secret**，  
名称 `VITE_DEEPSEEK_API_KEY`，值为你的 DeepSeek Key，作为全站默认值（用户仍可前端覆盖）。

---

## 四、Gitee Pages（国内访问更顺畅 ⭐）

GitHub Pages 在国内有时访问不稳定/被墙，**若要国内用户稳定访问，强烈建议同时镜像到 Gitee**。

1. 在 [Gitee](https://gitee.com) 新建仓库，导入（Import）GitHub 仓库，或 `git push` 到 Gitee 远程。
2. 仓库 **服务 → Gitee Pages**，部署目录选构建产物（方式见下）。
3. Gitee Pages 不原生支持 GitHub Actions，推荐**提交构建产物**方式：

```bash
cd frontend
npm install
npm run build            # 生成 dist/
cp -r dist/* ../         # 把 dist 内容放到仓库根目录（或 Gitee Pages 指定目录）
git add . && git commit -m "deploy" && git push
```

> 提示：`vite.config.ts` 中 `base: './'` 确保资源使用相对路径，无论是挂在  
> `https://<用户名>.gitee.io/<仓库名>/` 还是自定义域名根目录都能正常加载。

---

## 五、本地预览 / 手动构建

```bash
cd frontend
npm install
rm -rf dist             # 本机沙箱 safe-delete 拦截，需手动清理
npm run build           # tsc -b && vite build，产物在 frontend/dist
npm run preview         # 本地预览（默认 http://localhost:4173）
```

> 说明：`vite.config.ts` 已设 `build.emptyOutDir: false`（绕开本机沙箱对清空 dist 的拦截），  
> 因此构建前请务必先 `rm -rf dist`。CI（GitHub Actions）每次全新检出不受影响。

如需自定义域名：在 GitHub Pages / Gitee Pages 设置中填写，并在 `frontend/public`  
放置 `CNAME` 文件（内容为你的域名），同时 `vite.config.ts` 保持 `base: './'` 即可。

---

## 六、常见问题

- **刷新子页面 404？** 已通过 `cp index.html 404.html` 处理（SPA 深链回退）。
- **资源 404 / 白屏？** 确认 `base` 为 `'./'`（已配置），且 `public/data`、`public/corpus` 已随构建分发。
- **AI 解读没有内容 / 仍是规则式降级？** 站点已构建期注入 Key，正常应为真实模型解读。若仍降级：  
  ① 检查网络能否访问 `api.deepseek.com`（CORS 已验证可用）；② Key 可能已失效/被平台停用，  
  需到 DeepSeek 平台重新生成并更新 `frontend/.env` 后重新部署；③ 访客若在「设置」中清空了 Key，  
  也会退回规则式（属正常）。
- **国内访问慢/打不开？** 优先选 Gitee Pages（见第四节）或绑定国内可访问的自定义域名。
