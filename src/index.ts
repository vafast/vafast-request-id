/**
 * vafast-request-id
 * 为每个请求生成唯一标识符的中间件
 */

import { defineMiddleware } from 'vafast'

/** 请求 ID 生成器函数类型 */
export type IdGenerator = () => string;

/** 中间件配置选项 */
export interface RequestIdOptions {
  /** 自定义 ID 生成器，默认使用 crypto.randomUUID() */
  generator?: IdGenerator;
  /** 响应头名称，默认 'X-Request-Id' */
  headerName?: string;
  /** 是否从请求头中读取已有的 ID（用于链路追踪），默认 true */
  useExisting?: boolean;
  /** 请求头中已有 ID 的名称，默认与 headerName 相同 */
  existingHeaderName?: string;
}

/** 扩展 Request 类型，添加 id 属性 */
declare global {
  interface Request {
    id?: string;
  }
}

/**
 * 默认 ID 生成器
 * 使用 crypto.randomUUID() 生成 UUID v4
 */
function defaultGenerator(): string {
  return crypto.randomUUID();
}

/**
 * 创建请求 ID 中间件
 * 
 * @example
 * ```typescript
 * import { requestId } from '@vafast/request-id'
 * import { serve } from 'vafast'
 * 
 * // 使用默认配置
 * app.use(requestId())
 * 
 * // 自定义配置
 * app.use(requestId({
 *   generator: () => `req-${Date.now()}-${Math.random().toString(36).slice(2)}`,
 *   headerName: 'X-Correlation-Id'
 * }))
 * 
 * // 在处理函数中使用
 * defineRoute({
 *   method: 'GET',
 *   path: '/',
 *   handler: ({ req }) => {
 *     console.log('Request ID:', req.id)
 *     return { requestId: req.id }
 *   }
 * })
 * ```
 */
export function requestId(options: RequestIdOptions = {}) {
  const {
    generator = defaultGenerator,
    headerName = 'X-Request-Id',
    useExisting = true,
    existingHeaderName = headerName,
  } = options;

  return defineMiddleware<{ requestId: string }>(async (req, next) => {
    // 尝试从请求头获取已有的 ID（用于分布式追踪）
    let id: string | undefined;
    
    if (useExisting) {
      id = req.headers.get(existingHeaderName) ?? undefined;
    }
    
    // 如果没有已有 ID，生成新的
    if (!id) {
      id = generator();
    }
    
    // 将 ID 附加到请求对象
    (req as Request & { id: string }).id = id;
    
    // 执行下一个中间件/处理函数，传递 requestId 到上下文
    const response = await next({ requestId: id });
    
    // 将 ID 添加到响应头
    const newHeaders = new Headers(response.headers);
    newHeaders.set(headerName, id);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  });
}

/**
 * 从请求中获取 ID（类型安全的辅助函数）
 */
export function getRequestId(req: Request): string | undefined {
  return (req as Request & { id?: string }).id;
}

export default requestId;
