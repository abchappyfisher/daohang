// src/utils/csrf.ts
// CSRF 保护工具 - 生成和验证 CSRF Token

// 生成 CSRF Token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// 从 localStorage 获取 CSRF Token
export function getCSRFToken(): string | null {
  return localStorage.getItem('csrf_token');
}

// 保存 CSRF Token 到 localStorage
export function saveCSRFToken(token: string): void {
  localStorage.setItem('csrf_token', token);
}

// 清除 CSRF Token
export function clearCSRFToken(): void {
  localStorage.removeItem('csrf_token');
}

// 生成新的 CSRF Token 并保存
export function refreshCSRFToken(): string {
  const token = generateCSRFToken();
  saveCSRFToken(token);
  return token;
}

// 初始化 CSRF Token（如果不存在）
export function initCSRFToken(): string {
  let token = getCSRFToken();
  if (!token) {
    token = refreshCSRFToken();
  }
  return token;
}
