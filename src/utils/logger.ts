// src/utils/logger.ts
// 日志工具 - 根据环境变量控制日志输出

// 从环境变量读取是否启用调试日志
const isDevelopment = import.meta.env.DEV;
const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment || enableDebugLogs) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment || enableDebugLogs) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment || enableDebugLogs) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    // 错误日志始终输出，但生产环境可以进一步限制
    if (isDevelopment || enableDebugLogs) {
      console.error('[ERROR]', ...args);
    } else {
      // 生产环境只输出简化的错误信息
      const simplifiedArgs = args.map((arg) => {
        if (arg instanceof Error) {
          return arg.message; // 只输出错误消息，不输出堆栈
        }
        return arg;
      });
      console.error('[ERROR]', ...simplifiedArgs);
    }
  },
};
