# @vafast/request-id

为每个请求生成唯一 ID：写入 `req.id`、经 `next({ requestId })` 注入 handler，并回写响应头（默认 `X-Request-Id`）。

## 安装

```bash
npm install @vafast/request-id
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { requestId, getRequestId } from '@vafast/request-id'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: ({ requestId: id, req }) => ({
      fromContext: id,
      fromReq: req.id,
      viaHelper: getRequestId(req),
    }),
  }),
])

const server = new Server(routes)
server.use(requestId())
serve({ fetch: server.fetch, port: 3000 })
```

响应头示例：

```
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

## 用法

### 自定义配置

```typescript
server.use(
  requestId({
    generator: () => `req-${Date.now()}`,
    headerName: 'X-Correlation-Id',
    useExisting: true,
    existingHeaderName: 'X-Trace-Id',
  }),
)
```

### 与 request-logger

```typescript
import { requestId } from '@vafast/request-id'
import { requestLogger } from '@vafast/request-logger'

server.use(requestId())
server.use(
  requestLogger({
    url: process.env.LOG_INGEST_URL!,
    service: 'my-server',
  }),
)
```

## API 完整参数

### `requestId(options?)`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `generator` | `() => string` | `crypto.randomUUID()` | ID 生成器 |
| `headerName` | `string` | `'X-Request-Id'` | 响应头名称 |
| `useExisting` | `boolean` | `true` | 复用入站请求头中的 ID |
| `existingHeaderName` | `string` | 同 `headerName` | 读取已有 ID 的请求头 |

行为：解析/生成 ID → `req.id = id` → `next({ requestId: id })` → 写入响应头。

### `getRequestId(req)`

```typescript
getRequestId(req: Request): string | undefined
```

## 最佳实践

- 在 `request-logger` 等依赖追踪 ID 的中间件**之前**挂载
- 微服务保持同一头名与 `useExisting: true`，贯通链路
- 业务日志自行带上 `requestId`（`@vafast/logger` 不会自动注入）

## 注意事项

- 会新建 `Response` 以设置响应头
- 入站 ID 不做格式校验；网关侧应负责清洗
- 本包只负责请求 ID，不是应用日志库

## 相关链接

- 文档：[`docs/middleware/request-id.md`](../vafast-doc/docs/middleware/request-id.md)
- [@vafast/request-logger](https://www.npmjs.com/package/@vafast/request-logger)
- [@vafast/logger](https://www.npmjs.com/package/@vafast/logger)

## License

MIT
