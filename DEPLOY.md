# Cloudflare 部署指南 (Deployment Guide)

本指南将帮助你将 NaviHive 部署到 Cloudflare Workers 和 D1 数据库。

## 1. 准备工作

确保你已经安装了 Node.js 并在此时登录 Cloudflare。

```powershell
# 登录 Cloudflare（浏览器会弹出）
npx wrangler login
```

## 2. 创建 D1 数据库

我们需要在 Cloudflare 上创建一个生产环境的数据库。

```powershell
# 创建名为 navihive-prod 的数据库
npx wrangler d1 create navihive-prod
```

**关键步骤**：
命令执行后，控制台会输出一段 JSON 配置，类似如下：
```json
{
  "binding": "DB",
  "database_name": "navihive-prod",
  "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```
请将 `wrangler.jsonc` 文件中的 `d1_databases` 部分更新为这个新的 `database_id`。

## 3. 初始化数据库结构

使用 SQL 命令初始化数据库表结构。请依次执行以下命令：

```powershell
# 1. 创建基础表结构
npx wrangler d1 execute navihive-prod --command "CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, order_num INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);"

npx wrangler d1 execute navihive-prod --command "CREATE TABLE IF NOT EXISTS sites (id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER, name TEXT NOT NULL, url TEXT NOT NULL, icon TEXT, description TEXT, notes TEXT, order_num INTEGER DEFAULT 0, visits INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE);"

npx wrangler d1 execute navihive-prod --command "CREATE TABLE IF NOT EXISTS configs (key TEXT PRIMARY KEY, value TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);"

# 2. 如果是旧数据库升级，记得添加 visits 字段 (如果是全新安装，上面的 create table 已经包含了)
# npx wrangler d1 execute navihive-prod --command "ALTER TABLE sites ADD COLUMN visits INTEGER DEFAULT 0;"
```

## 4. 设置生产环境密钥

为了安全，生产环境的密钥不要写在代码里，而是通过此时命令设置。

```powershell
# 1. 设置 JWT 密钥 (生成一个随机长字符串)
npx wrangler secret put AUTH_SECRET
# 输入提示时粘贴你的随机密钥

# 2. 设置管理员密码 (注意：这里需要输入的是密码的 SHA-256 哈希值)
# 你可以在 https://www.sha256generator.com/ 生成，例如 "123456" 的哈希是 "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
npx wrangler secret put AUTH_PASSWORD_HASH

# 3. 启用认证
npx wrangler secret put AUTH_ENABLED
# 输入: true

# 4. 设置管理员用户名
npx wrangler secret put AUTH_USERNAME
# 输入: admin
```

## 5. 构建与部署

最后，构建前端并部署到 Cloudflare。

```powershell
# 安装依赖
npm install

# 部署 (会自动执行 build)
npm run deploy
```

部署成功后，控制台会显示你的访问网址，例如 `https://navihive.your-name.workers.dev`。

## 常见问题

*   **部署后页面空白**：请检查 `wrangler.jsonc` 中 `assets` 配置是否包含 `"directory": "./dist"`（已自动修复）。
*   **API 报错 500**：请检查 D1 数据库是否成功绑定，以及密钥是否正确设置。
*   **样式丢失**：确保 `dist` 目录下的文件已正确上传，通常 `npm run deploy` 会处理好。
