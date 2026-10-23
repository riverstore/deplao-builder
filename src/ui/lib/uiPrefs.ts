/**
 * Lưu cài đặt giao diện vào DB của app (bảng app_settings) ngoài localStorage.
 * localStorage gắn với địa chỉ trang (dev: http://localhost:27799, bản build: file://) nên hai chế độ không thấy
 * cài đặt của nhau; DB nằm cạnh dữ liệu app (portable, dùng chung dev/build). localStorage vẫn giữ để áp dụng
 * ngay lúc khởi động trước khi DB trả về. Chế độ nhân viên (workspace từ xa): chỉ dùng localStorage.
 */

/** Khóa localStorage được đồng bộ DB (main process cũng kiểm tra cùng danh sách) */
export const UI_PREF_KEYS = [
  'app_theme', 'app_palette', 'app_font_family', 'app_chat_font_size', 'app_fontSizeScale',
  'app_privacy', 'app_notifSettings',
] as const;

const api = () => (window as any).electronAPI?.uiPrefs as
  | { getAll: () => Promise<{ success: boolean; prefs?: Record<string, string> }>; set: (key: string, value: string) => Promise<{ success: boolean }> }
  | undefined;

/** Ghi localStorage (áp dụng ngay) và DB (nền, lỗi thì bỏ qua — localStorage vẫn còn) */
export function savePref(key: (typeof UI_PREF_KEYS)[number], value: string): void {
  try { localStorage.setItem(key, value); } catch {}
  try { void api()?.set(key, value)?.catch(() => {}); } catch {}
}

/**
 * Đọc DB lúc khởi động: khóa nào DB có thì ghi đè localStorage; khóa DB chưa có mà localStorage có thì đẩy lên DB
 * (chuyển dữ liệu cũ). Trả true nếu localStorage vừa đổi → gọi lại các loader của store.
 */
export async function hydrateUiPrefs(): Promise<boolean> {
  const a = api();
  if (!a) return false;
  let changed = false;
  try {
    const res = await a.getAll();
    if (!res?.success || !res.prefs) return false;
    for (const key of UI_PREF_KEYS) {
      const fromDb = res.prefs[key];
      let local: string | null = null;
      try { local = localStorage.getItem(key); } catch {}
      if (fromDb !== undefined) {
        if (fromDb !== local) {
          try { localStorage.setItem(key, fromDb); changed = true; } catch {}
        }
      } else if (local !== null) {
        void a.set(key, local).catch(() => {});
      }
    }
  } catch {}
  return changed;
}
