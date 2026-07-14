# 玄机阁微信支付 Worker — 部署指南

## 前提条件

1. **微信支付商户号**（你已有）
2. **公众号或小程序 AppID**（需与商户号绑定）
3. **Cloudflare 账号**（免费注册：https://dash.cloudflare.com/sign-up）
4. **商户证书序列号**（登录 https://pay.weixin.qq.com → 账户中心 → API 安全）
5. **API v3 密钥**（同上页面设置，32 位随机字符）
6. **商户私钥**（在商户平台生成 API 证书时下载的 `apiclient_key.pem`）

---

## 部署步骤

### 第一步：创建 KV Namespace

1. 登录 Cloudflare Dashboard
2. 左侧菜单 → Workers & Pages → KV（或直接访问 `https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces`）
3. 点击 **Create namespace**，名称填 `xuanjige-payment-kv`
4. 复制创建后显示的 **Namespace ID**

### 第二步：创建 Worker

1. Cloudflare Dashboard → Workers & Pages → **Create application**
2. 选择 **Create Worker**，名称填 `xuanjige-payment`
3. 编辑器出现后，把 `workers/payment-worker.js` 的**全部内容**粘贴进去
4. 点击 **Save and Deploy**

### 第三步：绑定 KV

1. 在 Worker 详情页 → **Settings** → **Variables**
2. 往下找到 **KV Namespace Bindings**
3. 点击 **Add binding**：
   - Variable name: `PAYMENT_KV`
   - KV Namespace: 选择刚才创建的 `xuanjige-payment-kv`
4. 点击 **Save**

### 第四步：设置环境变量

**普通变量**（在 Settings → Variables 中设置）：

| 变量名 | 值 |
|---|---|
| `WECHAT_APPID` | 你的公众号/小程序 AppID |
| `WECHAT_MCHID` | 你的微信支付商户号 |
| `WECHAT_API_V3_KEY` | API v3 密钥（32 位） |
| `WECHAT_SERIAL_NO` | 商户证书序列号 |
| `NOTIFY_URL` | `https://xuanjige-payment.你的子域名.workers.dev/api/notify` |
| `PAY_PRICE` | `50`（0.5 元 = 50 分，可改） |

**加密变量（Secrets）** — 商户私钥必须用 Secrets 存储（选 Encrypt）：

1. 点击 **Add variable**
2. Variable name: `WECHAT_PRIVATE_KEY`
3. Value: 打开你下载的 `apiclient_key.pem` 文件，**完整复制全部内容**（含 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`）
4. 勾选 **Encrypt**
5. 点击 **Save**

### 第五步：获取 Worker URL

1. Worker 详情页 → **Preview** tab
2. 你会看到一个域名如 `https://xuanjige-payment.xxxx.workers.dev`
3. 访问 `https://xuanjige-payment.xxxx.workers.dev/api/health` 确认返回 `{"status":"ok"}`

### 第六步：配置玄机阁前端

1. 打开玄机阁网站 → 点右上角 ⚙️ **设置**
2. 在「支付 Worker 地址」输入框填入 Worker URL（如 `https://xuanjige-payment.xxxx.workers.dev`）
3. 点击保存

---

## 验证

1. 打开玄机阁 → 算一次八字
2. AI 解读应显示**微信支付二维码**（不是固定图片）
3. 用微信扫码 → 支付 0.5 元
4. 支付成功后，AI 解读自动解锁

---

## 域名（可选，不必须）

Worker 默认的 `*.workers.dev` 域名可以直接使用。如果希望用自定义域名：
1. Worker 详情页 → **Triggers** → **Custom Domains**
2. 添加你的域名（需 DNS 解析到 Cloudflare）

---

## 安全说明

- 商户私钥作为 **Encrypted Secret** 存储，Worker 平台无法明文读取
- 所有微信支付 API 调用在 Worker 内签名完成，密钥不离开 Cloudflare 环境
- 前端仅存储 Worker URL，不接触任何密钥
- 支付回调使用微信支付平台证书验签（已实现基础验证）
