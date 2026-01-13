// src/utils/sanitizer.ts
// CSS 安全过滤工具 - 防止 XSS 攻击

/**
 * 清理用户提供的 CSS，防止 XSS 攻击
 * 移除所有潜在危险的 CSS 属性和值
 */
export function sanitizeCSS(css: string): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  // 多层过滤，逐步移除危险内容

  let sanitized = css;

  // 1. 移除 JavaScript 相关的内容
  sanitized = sanitized
    // 移除 javascript: 伪协议
    .replace(/url\s*\(\s*(['"]?)javascript:/gi, 'url($1invalid:')
    .replace(/url\s*\(\s*(['"]?)(data:script|data:text\/(html|javascript))/gi, 'url($1invalid:')
    // 移除 expression() 函数（旧版 IE）
    .replace(/expression\s*\(/gi, 'invalid(')
    // 移除 @import 规则
    .replace(/@import[^;]+;?/gi, '/* @import removed */')
    // 移除 behavior 属性
    .replace(/behavior\s*:/gi, '/* behavior removed */')
    // 移除 -moz-binding
    .replace(/-moz-binding\s*:/gi, '/* -moz-binding removed */')
    // 移除 JavaScript 事件处理器（虽然在 CSS 中很少见）
    .replace(/on\w+\s*:/gi, '/* event handler removed */');

  // 2. 移除 data 协议（除了 image/svg+xml）
  sanitized = sanitized.replace(
    /url\s*\(\s*['"]?(?!image\/svg\+xml)(data:[^'"]+)['"]?\s*\)/gi,
    'url(invalid:)'
  );

  // 3. 移除 content 属性中的不安全内容
  sanitized = sanitized.replace(
    /content\s*:\s*(['"]?).*?url\s*\(\s*['"]?(javascript:|data:)/gi,
    'content:$1 /* unsafe url removed */'
  );

  // 4. 移除可能的 CSS 注入攻击
  sanitized = sanitized.replace(/\[.*?\]/g, (match) => {
    // 移除属性选择器中的危险内容
    if (match.includes('javascript:') || match.includes('data:text/html')) {
      return '/* unsafe selector removed */';
    }
    return match;
  });

  // 5. 限制 CSS 属性白名单（可选）
  const allowedProperties = [
    'color',
    'background',
    'background-color',
    'background-image',
    'background-size',
    'background-position',
    'background-repeat',
    'opacity',
    'font-family',
    'font-size',
    'font-weight',
    'text-align',
    'margin',
    'padding',
    'width',
    'height',
    'border',
    'border-radius',
    'display',
    'flex-direction',
    'align-items',
    'justify-content',
    'gap',
    'transition',
    'transform',
    'box-shadow',
    'z-index',
  ];

  // 移除不在白名单中的属性
  sanitized = sanitized.replace(/([\w-]+)\s*:/g, (match, property) => {
    if (!allowedProperties.includes(property.trim())) {
      return `/* property removed: ${property} */`;
    }
    return match;
  });

  // 6. 移除 @keyframes 中的危险内容
  sanitized = sanitized.replace(/@keyframes\s+[^{]+\{[^}]*\}[^}]*\}/gi, (match) => {
    if (match.includes('javascript:') || match.includes('expression')) {
      return '/* @keyframes removed */';
    }
    return match;
  });

  // 7. 清理多余注释和空白
  sanitized = sanitized.replace(/\/\*\s*[\w-]+\s*removed\s*\*\/\s*/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * 验证 URL 是否安全（用于 background-image 等）
 */
export function validateCSSUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // 只允许 http 和 https 协议
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // 检查是否为有效的图片 URL（可选验证）
    // 注意：不强制要求图片扩展名，因为可能是动态图片服务
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证颜色值是否安全
 */
export function validateColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  // 允许的颜色格式
  const colorRegex = [
    /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}))$/, // hex colors
    /^(rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))$/, // rgb colors
    /^(rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\))$/, // rgba colors
    /^(hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\))$/, // hsl colors
    /^(hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\))$/, // hsla colors
    /^(transparent|inherit|initial|unset|currentColor)$/, // CSS color keywords
  ];

  return colorRegex.some((regex) => regex.test(color.trim()));
}
