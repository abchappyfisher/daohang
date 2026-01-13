# SECURITY_FIXES.md - 安全修复说明

本文档详细说明了针对 NaviHive 项目的安全漏洞修复。

## 📋 修复概览

### 高优先级修复（P0）

#### 1. ✅ JWT 签名算法修复

**问题**: 使用不安全的 Base64 编码代替真正的 HMAC-SHA256 签名
**影响**: 攻击者可以伪造任意 token，完全绕过认证系统
**修复**: 使用 `@cfworker/jwt` 库实现真正的 HMAC-SHA256 签名和验证
**文件**: `src/API/http.ts`

- 导入 `@cfworker/jwt` 库
- 重写 `generateToken()` 方法
- 重写 `verifyToken()` 方法

#### 2. ✅ 密码哈希实施

**问题**: 密码以明文形式存储在环境变量中
**影响**: 如果环境变量泄露，密码直接暴露
**修复**: 使用 Web Crypto API 的 SHA-256 算法进行密码哈希
**文件**: `src/API/http.ts`

- 添加 `hashPassword()` 方法
- 添加 `verifyPassword()` 方法
- 修改 `login()` 方法以验证密码哈希
- 环境变量改为 `AUTH_PASSWORD_HASH`

#### 3. ✅ 弱密钥和凭证修复

**问题**:

- JWT 密钥是 "linuxdo"，非常弱
- 用户名和密码相同
- 敏感凭证硬编码在配置文件中
  **影响**: 攻击者可以轻易计算出 JWT 签名并登录系统
  **修复**:
- 更新 `wrangler.jsonc`，添加详细的安全说明
- 提供使用强随机密钥的指南
- 使用 `wrangler secret` 命令存储敏感信息
  **文件**: `wrangler.jsonc`

### 中优先级修复（P1）

#### 4. ✅ XSS 防护改进

**问题**: 只过滤了有限的 XSS 向量，可以绕过
**影响**: 攻击者可能注入恶意 CSS
**修复**: 创建强大的 CSS sanitization 工具
**新增文件**: `src/utils/sanitizer.ts`

- 多层 CSS 过滤，移除危险属性
- 限制 CSS 属性白名单
- 验证 URL 和颜色值
- 防止 JavaScript 伪协议
- 更新 `src/App.tsx` 使用新的 sanitizer

#### 5. ✅ CSRF 保护实施

**问题**: 没有 CSRF token 机制
**影响**: 跨站请求伪造攻击
**修复**: 实现 CSRF token 机制
**新增文件**: `src/utils/csrf.ts`

- 生成和验证 CSRF token
- 使用加密安全的随机数生成器
- 在所有修改请求中添加 X-CSRF-Token 头
  **修改文件**:
- `src/API/client.ts`: 在请求中添加 CSRF token
- `worker/index.ts`: 验证 CSRF token
- `src/App.tsx`: 初始化 CSRF token

#### 6. ✅ 调试日志清理

**问题**: 大量调试日志泄露，可能暴露内部数据结构
**影响**: 生产环境泄露敏感信息
**修复**: 创建日志工具，根据环境变量控制输出
**新增文件**: `src/utils/logger.ts`

- 支持不同日志级别（debug, info, warn, error）
- 在生产环境禁用调试日志
- 错误日志简化，不暴露堆栈信息
  **修改文件**: `src/App.tsx`: 替换所有 `console.log` 和 `console.error`

### 低优先级修复（P2）

#### 7. ✅ URL 验证改进

**问题**: 只检查 URL 格式，没有限制协议类型
**影响**: 可能允许危险的协议（如 javascript:, file:）
**修复**: 添加严格的 URL 验证
**修改文件**: `worker/index.ts`

- 添加 `validateUrl()` 函数
- 只允许 HTTP 和 HTTPS 协议
- 验证主机名存在
- 在创建和更新站点时使用验证

#### 8. ✅ 错误处理改进

**问题**: 错误信息可能泄露内部信息
**影响**: 暴露系统内部结构
**修复**: 改进错误处理，返回通用错误消息
**修改文件**:

- `worker/index.ts`: 统一错误响应格式
- `src/API/client.ts`: 不暴露内部错误详情

#### 9. ✅ .gitignore 更新

**问题**: 可能意外提交敏感信息
**影响**: 敏感信息泄露到 Git 仓库
**修复**: 更新 .gitignore，防止敏感文件提交
**修改文件**: `.gitignore`

- 添加更多敏感文件模式
- 添加 Cloudflare 相关忽略规则
- 添加临时文件模式

## 📁 新增文件

1. `src/utils/logger.ts` - 日志工具
2. `src/utils/sanitizer.ts` - CSS 安全过滤工具
3. `src/utils/csrf.ts` - CSRF 保护工具

## 🔧 修改文件

1. `src/API/http.ts` - JWT 和密码哈希修复
2. `src/API/client.ts` - CSRF token 集成
3. `worker/index.ts` - CSRF 验证和 URL 验证
4. `src/App.tsx` - 日志工具和 sanitizer 集成
5. `wrangler.jsonc` - 安全配置更新
6. `.gitignore` - 敏感文件保护

## 🚀 部署前检查清单

在生产环境部署前，请完成以下步骤：

### 1. 设置安全凭证

```bash
# 1. 生成强随机密钥（至少 32 字节）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. 生成密码哈希（SHA-256）
# 访问 https://www.sha256generator.com/
# 或使用命令行工具

# 3. 使用 wrangler secret 命令设置
wrangler secret put AUTH_SECRET
# 输入生成的强随机密钥

wrangler secret put AUTH_PASSWORD_HASH
# 输入密码的 SHA-256 哈希值

wrangler secret put AUTH_USERNAME
# 输入管理员用户名

wrangler secret put AUTH_ENABLED
# 输入 "true" 启用认证
```

### 2. 验证配置

检查 `wrangler.jsonc` 中的配置：

- 确认 D1 数据库绑定正确
- 确认没有硬编码敏感信息
- 确认使用的是示例值而非真实密钥

### 3. 测试安全功能

- [ ] 测试登录功能（使用正确和错误的密码）
- [ ] 测试 CSRF 保护（尝试跨站请求）
- [ ] 测试 XSS 防护（尝试注入恶意 CSS）
- [ ] 测试 URL 验证（尝试使用 javascript: 协议）
- [ ] 测试 token 过期（等待 24 小时）

### 4. 检查日志

- [ ] 确认生产环境不输出调试日志
- [ ] 确认错误日志不泄露敏感信息

### 5. 代码审查

- [ ] 确认所有敏感操作都有认证
- [ ] 确认所有用户输入都经过验证和清理
- [ ] 确认所有错误处理不暴露内部信息

## 🔐 安全最佳实践

### 密码管理

- ✅ 密码使用 SHA-256 哈希存储
- ✅ 使用强随机密钥（至少 32 字节）
- ✅ 使用 `wrangler secret` 命令存储敏感信息
- ❌ 不要在代码中硬编码密码
- ❌ 不要在 Git 仓库中提交密钥

### 会话管理

- ✅ JWT 使用 HMAC-SHA256 签名
- ✅ Token 有过期时间（24 小时或 30 天）
- ✅ 使用 `@cfworker/jwt` 库进行 JWT 操作
- ❌ 不要使用不安全的编码代替签名

### CSRF 保护

- ✅ 所有修改请求都有 CSRF token
- ✅ CSRF token 使用加密安全的随机数生成器
- ✅ 在 Worker 端验证 CSRF token
- ⚠️ 考虑将 CSRF token 存储在 HttpOnly Cookie（未来改进）

### XSS 防护

- ✅ 所有用户输入都经过验证和清理
- ✅ CSS 使用严格的白名单过滤
- ✅ URL 验证限制为 HTTP 和 HTTPS
- ✅ 颜色值验证确保只使用安全的颜色格式

### 日志管理

- ✅ 生产环境禁用调试日志
- ✅ 错误日志不暴露堆栈信息
- ✅ 使用日志工具统一管理日志输出
- ⚠️ 考虑将日志发送到日志服务（未来改进）

## 📝 未来改进建议

虽然已经修复了所有已发现的安全问题，但仍有一些改进空间：

1. **HttpOnly Cookie**: 将 JWT token 存储在 HttpOnly Cookie 而非 localStorage
2. **Rate Limiting**: 实现 API 速率限制，防止暴力攻击
3. **Content Security Policy**: 添加 CSP 头，进一步增强 XSS 防护
4. **CORS 配置**: 精确配置 CORS，限制跨域访问
5. **安全头部**: 添加安全相关的 HTTP 头（X-Frame-Options, X-Content-Type-Options 等）
6. **两步验证**: 添加可选的两步验证
7. **审计日志**: 记录所有敏感操作，便于审计
8. **密码策略**: 实施密码复杂度要求
9. **会话管理**: 添加会话撤销功能
10. **依赖扫描**: 定期使用 `npm audit` 检查依赖漏洞

## 📚 相关资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Workers 安全最佳实践](https://developers.cloudflare.com/workers/security/)
- [JWT 安全最佳实践](https://tools.ietf.org/html/rfc8725)
- [Web Security Guidelines](https://web.dev/secure/)

---

**重要提醒**: 安全是一个持续的过程，请定期审查和更新安全措施。
