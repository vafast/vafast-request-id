# @vafast/request-id

为 Vafast 请求生成唯一标识符的中间件。

## ✨ 特性

- 🆔 自动生成 UUID v4 请求 ID
- 🔗 支持分布式链路追踪（复用上游 ID）
- ⚙️ 可自定义 ID 生成器
- 📤 自动添加响应头

## 📦 安装

```bash
npm install @vafast/request-id
```

## 🚀 使用

### 基础用法

```typescript
import { Server, defineRoutes, createHandler } from 'vafast'
import { requestId, getRequestId } from '@vafast/request-id'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/test',
    handler: createHandler({}, async ({ req }) => {
      const id = getRequestId(req)
      return { requestId: id }
    })
  }
])

const app = new Server(routes)
app.use(requestId())

serve({ fetch: app.fetch, port: 3000 })
```

响应会自动包含 `X-Request-Id` 头：

```
HTTP/1.1 200 OK
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

### 自定义配置

```typescript
import { requestId } from '@vafast/request-id'
import { nanoid } from 'nanoid'

// 使用 nanoid 生成更短的 ID
app.use(requestId({
  generator: () => nanoid(),
  headerName: 'X-Correlation-Id'
}))

// 禁用复用已有 ID
app.use(requestId({
  useExisting: false
}))

// 从不同的请求头读取已有 ID
app.use(requestId({
  headerName: 'X-Request-Id',
  existingHeaderName: 'X-Trace-Id'
}))
```

## 📚 API

### `requestId(options?)`

创建请求 ID 中间件。

#### 选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `generator` | `() => string` | `crypto.randomUUID()` | ID 生成函数 |
| `headerName` | `string` | `'X-Request-Id'` | 响应头名称 |
| `useExisting` | `boolean` | `true` | 是否复用请求头中的 ID |
| `existingHeaderName` | `string` | 同 `headerName` | 读取已有 ID 的请求头名称 |

### `getRequestId(req)`

从请求对象获取 ID。

```typescript
import { getRequestId } from '@vafast/request-id'

const id = getRequestId(req) // string | undefined
```

## 🔗 分布式追踪

在微服务架构中，请求 ID 可以跨服务传递：

```
Client → Gateway → Service A → Service B
         ↓           ↓            ↓
    X-Request-Id  复用 ID      复用 ID
```

上游服务的请求头会被自动复用，保持整条链路的追踪 ID 一致。

## 📄 许可证

MIT

