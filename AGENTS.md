# AGENTS.md - 代码规范指南

本文档为 AI 代理（如 opencode）提供在此代码库中工作的指南。

## 构建和代码质量命令

```bash
# 开发模式（启动开发服务器）
pnpm dev

# 构建项目（TypeScript类型检查 + Vite构建）
pnpm build

# 代码质量检查（ESLint）
pnpm lint

# 代码格式化（Prettier）
pnpm format

# 检查代码格式（不修改文件）
pnpm format:check

# 部署到 Cloudflare Workers
pnpm deploy

# 预览生产构建
pnpm preview

# 生成 Cloudflare Workers 类型定义
pnpm cf-typegen
```

**注意：** 此项目目前未配置测试框架，因此没有测试命令。完成任务后，应运行 `pnpm lint` 和 `pnpm build` 确保代码正确。

## 项目结构

```
src/
  ├── API/              # API 客户端
  │   ├── client.ts     # 真实 API 客户端（用于生产环境）
  │   ├── http.ts       # 类型定义和后端 API 类
  │   └── mock.ts       # 模拟 API 客户端（用于开发环境）
  ├── components/       # React 组件
  ├── App.tsx           # 主应用组件
  ├── main.tsx          # 应用入口
  └── types.ts          # 类型定义
worker/
  └── index.ts          # Cloudflare Workers 后端入口
```

## 代码风格指南

### TypeScript 配置

- **严格模式启用**：`strict: true`
- **类型检查**：`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`
- **目标版本**：ES2020
- **JSX**：使用 `react-jsx` 转换

### 命名约定

- **变量和函数**：使用 `camelCase`（例如：`handleClick`、`userName`）
- **组件**：使用 `PascalCase`（例如：`SiteCard`、`LoginForm`）
- **类型和接口**：使用 `PascalCase`（例如：`Group`、`Site`、`LoginRequest`）
- **常量**：使用 `UPPER_SNAKE_CASE`（例如：`DEFAULT_CONFIGS`）
- **枚举**：使用 `PascalCase`，成员使用 `PascalCase`（例如：`SortMode.GroupSort`）

### 导入顺序

按以下顺序组织导入：

1. React 和第三方库
2. 内部类型导入
3. 组件导入
4. 工具函数/辅助函数
5. 样式文件

示例：

```typescript
import { useState, useEffect } from 'react';
import { NavigationClient } from './API/client';
import { Site, Group } from './API/http';
import { GroupWithSites } from './types';
import ThemeToggle from './components/ThemeToggle';
import './App.css';
```

### React 组件规范

- 使用**函数式组件**而非类组件
- 使用 **React Hooks** 管理状态和副作用
- 使用 `memo` 包装纯组件以优化性能：

```typescript
const SiteCard = memo(function SiteCard({ site, onUpdate }: SiteCardProps) {
  // 组件逻辑
});
```

- Props 接口定义在组件上方：

```typescript
interface SiteCardProps {
  site: Site;
  onUpdate: (updatedSite: Site) => void;
  onDelete: (siteId: number) => void;
}
```

### 错误处理

- **API 请求**：始终使用 try-catch 捕获错误
- **错误提示**：使用 Snackbar 显示错误信息给用户
- **日志记录**：使用 `console.error` 记录错误详情
- **用户友好**：向用户显示简化的错误消息，不暴露内部实现细节

示例：

```typescript
const handleCreateSite = async () => {
  try {
    if (!newSite.name || !newSite.url) {
      handleError('站点名称和URL不能为空');
      return;
    }
    await api.createSite(newSite as Site);
    await fetchData();
  } catch (error) {
    console.error('创建站点失败:', error);
    handleError('创建站点失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
};
```

### CSS 和样式

- **Material UI**：使用 MUI 组件和 `sx` prop 进行样式设置
- **响应式设计**：使用 MUI 的断点系统（xs、sm、md、lg、xl）
- **主题**：支持亮色和暗色主题，使用 `ThemeProvider` 和 `createTheme`
- **自定义 CSS**：通过配置项 `site.customCss` 允许用户注入自定义样式，但需要安全过滤

### API 客户端使用

- **认证**：使用 JWT token，存储在 `localStorage` 中
- **请求头**：自动添加 `Authorization: Bearer ${token}` 头
- **错误处理**：401 错误自动清除 token 并要求重新登录
- **开发环境**：使用 `MockNavigationClient` 模拟数据，生产环境使用真实 API

### 数据库操作（Worker 层）

- **参数化查询**：所有数据库操作使用参数化查询防止 SQL 注入
- **事务**：批量操作使用 `db.batch()` 确保原子性
- **错误处理**：捕获数据库错误并返回适当的 HTTP 状态码

### 类型定义

- **严格类型**：避免使用 `any`，使用具体类型或 `unknown`
- **可选字段**：使用 `?` 标记可选属性
- **类型断言**：仅在必要时使用类型断言，优先使用类型守卫
- **泛型**：适当使用泛型提高代码复用性

### 状态管理

- **本地状态**：使用 `useState` 管理组件本地状态
- **副作用**：使用 `useEffect` 处理副作用（数据获取、订阅等）
- **记忆化**：使用 `useMemo` 和 `useCallback` 优化性能
- **全局状态**：当前没有使用 Redux 等状态管理库，状态主要通过 props 传递

### 文件命名

- **组件文件**：PascalCase（例如：`SiteCard.tsx`）
- **工具文件**：camelCase（例如：`client.ts`）
- **类型文件**：camelCase 或 kebab-case（例如：`types.ts`）
- **样式文件**：与组件同名（例如：`App.css`）

### 注释规范

- **函数注释**：对于复杂函数，添加简短注释说明功能
- **类型注释**：接口和类型定义应有清晰的属性说明
- **TODO 注释**：使用 `// TODO:` 标记待办事项

## 常见模式

### 创建新组件

```typescript
import { useState } from 'react';
import { Box, Typography } from '@mui/material';

interface NewComponentProps {
  title: string;
  onAction: () => void;
}

const NewComponent = memo(function NewComponent({ title, onAction }: NewComponentProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <Box>
      <Typography>{title}</Typography>
    </Box>
  );
});

export default NewComponent;
```

### 添加新 API 端点

1. 在 `src/API/http.ts` 的 `NavigationClient` 类中添加方法
2. 在 `worker/index.ts` 的路由处理中添加对应的路由处理逻辑
3. 添加输入验证函数（如果需要）
4. 返回适当的响应和错误处理

### 表单处理

- 使用受控组件（通过 `value` 和 `onChange` 控制）
- 使用 Material UI 的 `TextField`、`Dialog` 等组件
- 在提交前验证输入
- 使用 `handleInputChange` 通用处理函数更新状态

## 安全注意事项

- **XSS 防护**：自定义 CSS 需要通过 `sanitizeCSS` 函数过滤
- **SQL 注入**：所有数据库查询使用参数化查询
- **认证**：所有 API 端点（除登录和初始化）需要 JWT 认证
- **输入验证**：所有用户输入在 Worker 层进行验证和清理
- **敏感信息**：不将密码、token 等敏感信息记录到控制台或暴露给用户

## 开发工作流

1. **开始开发**：运行 `pnpm dev` 启动开发服务器
2. **代码格式化**：运行 `pnpm format` 格式化代码
3. **类型检查**：运行 `pnpm build` 进行类型检查
4. **部署**：运行 `pnpm deploy` 部署到 Cloudflare Workers
5. **类型生成**：修改 Worker 后，运行 `pnpm cf-typegen` 生成最新的类型定义

## 环境变量

项目使用以下环境变量（在 `wrangler.jsonc` 中配置）：

- `AUTH_ENABLED`：是否启用身份验证（true/false）
- `AUTH_USERNAME`：管理员用户名
- `AUTH_PASSWORD`：管理员密码
- `AUTH_SECRET`：JWT 签名密钥

## 常见问题

**Q: 如何添加新的配置项？**
A: 在 `DEFAULT_CONFIGS` 中添加默认值，确保在 `worker/index.ts` 中添加相应的验证逻辑。

**Q: 如何处理拖拽功能？**
A: 使用 `@dnd-kit/core` 和 `@dnd-kit/sortable` 库，参考 `App.tsx` 中的拖拽实现。

**Q: 如何添加暗色/亮色主题支持？**
A: 使用 MUI 的 `ThemeProvider` 和 `createTheme`，参考 `App.tsx` 中的主题实现。

**Q: 数据库操作失败时如何处理？**
A: 使用 try-catch 捕获错误，返回适当的 HTTP 状态码和错误消息，参考 `worker/index.ts` 中的错误处理模式。
