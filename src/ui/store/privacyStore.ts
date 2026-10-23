import { create } from 'zustand';
import { savePref } from '../lib/uiPrefs';

/**
 * Tùy chọn riêng tư (giống ZaDark), lưu trên máy:
 *  - hide*Blur: làm mờ nội dung trên màn hình, rê chuột vào mới hiện (chống nhìn trộm)
 *  - hideTyping / hideSeen: không gửi "đang soạn tin" / "đã xem" lên Zalo, Facebook, Telegram
 */
export interface PrivacySettings {
  blurLastMessage: boolean;
  blurMessages: boolean;
  blurAvatars: boolean;
  blurNames: boolean;
  hideTyping: boolean;
  hideSeen: boolean;
}

export type PrivacyKey = keyof PrivacySettings;

const STORAGE_KEY = 'app_privacy';

const DEFAULTS: PrivacySettings = {
  blurLastMessage: false,
  blurMessages: false,
  blurAvatars: false,
  blurNames: false,
  hideTyping: false,
  hideSeen: false,
};

function load(): PrivacySettings {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const out = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS) as PrivacyKey[]) {
      if (typeof raw?.[key] === 'boolean') out[key] = raw[key];
    }
    return out;
  } catch {
    return { ...DEFAULTS };
  }
}

interface PrivacyState extends PrivacySettings {
  setPrivacy: (key: PrivacyKey, value: boolean) => void;
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  ...load(),
  setPrivacy: (key, value) => {
    set({ [key]: value } as Partial<PrivacySettings>);
    const { setPrivacy: _ignored, ...settings } = get();
    savePref('app_privacy', JSON.stringify(settings));
  },
}));

/** Đọc nhanh ngoài React (helper gửi seen/typing) */
export const isPrivacyEnabled = (key: PrivacyKey): boolean => usePrivacyStore.getState()[key];

/** Đọc lại từ localStorage sau khi hydrateUiPrefs nạp từ DB */
export function rehydratePrivacy(): void {
  usePrivacyStore.setState(load());
}
