/**
 * Ghi log của giao diện vào tab Nhật ký (log của renderer mặc định chỉ nằm trong DevTools, không xuất ra file).
 * Dùng để truy vết lỗi khó tái hiện; nội dung cắt ở 1500 ký tự.
 */
export function rendererLog(level: 'log' | 'warn' | 'error', message: string): void {
  try { (window as any).electronAPI?.rendererLog?.(level, String(message).slice(0, 1500)); } catch {}
}

/** Vài khung đầu của stack (bỏ khung của chính hàm này) để biết ai gọi */
export function shortStack(skip = 2, frames = 6): string {
  try {
    return (new Error().stack || '').split('\n').slice(skip, skip + frames).map(l => l.trim().replace(/^at /, '')).join(' < ');
  } catch { return ''; }
}
