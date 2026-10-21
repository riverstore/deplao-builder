import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CHAT_FONT_SIZE_MAX, CHAT_FONT_SIZE_MIN, useAppStore } from '@/store/appStore';
import { PalettePicker, ThemeModePicker } from '../settings/AppearanceControls';
import { SlidersIcon } from '../common/icons';
import { Switch } from '@/components/ui';
import { usePrivacyStore, type PrivacyKey } from '@/store/privacyStore';

const PRIVACY_OPTIONS: Array<{ key: PrivacyKey; label: string; description?: string }> = [
  { key: 'blurLastMessage', label: 'Ẩn Tin nhắn gần nhất', description: 'Làm mờ ở danh sách hội thoại, rê chuột để xem' },
  { key: 'blurMessages', label: 'Ẩn Tin nhắn trong cuộc trò chuyện', description: 'Rê chuột vào tin để xem' },
  { key: 'blurAvatars', label: 'Ẩn Ảnh đại diện cuộc trò chuyện' },
  { key: 'blurNames', label: 'Ẩn Tên cuộc trò chuyện' },
  { key: 'hideTyping', label: 'Ẩn trạng thái Đang soạn tin', description: 'Người nhận không thấy bạn đang gõ' },
  { key: 'hideSeen', label: 'Ẩn trạng thái Đã xem', description: 'Không báo đã xem cho người gửi; trong app vẫn đánh dấu đã đọc' },
];

// Gợi ý phông Google Fonts hỗ trợ tiếng Việt; vẫn gõ được tên phông khác
const FONT_SUGGESTIONS = ['Be Vietnam Pro', 'Inter', 'Roboto', 'Nunito', 'Open Sans', 'Montserrat', 'Lexend', 'Noto Sans', 'Quicksand', 'Mulish'];

const CHAT_FONT_SIZES = Array.from({ length: CHAT_FONT_SIZE_MAX - CHAT_FONT_SIZE_MIN + 1 }, (_, i) => CHAT_FONT_SIZE_MIN + i);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{children}</p>;
}

/** Nút trên thanh trên cùng + bảng tùy chỉnh nhanh (giống popup của ZaDark) */
export default function QuickSettingsPanel() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { fontFamily, setFontFamily, chatFontSize, setChatFontSize } = useAppStore(useShallow(s => ({
    fontFamily: s.fontFamily, setFontFamily: s.setFontFamily, chatFontSize: s.chatFontSize, setChatFontSize: s.setChatFontSize,
  })));
  const [fontDraft, setFontDraft] = useState(fontFamily);
  const { setPrivacy, ...privacy } = usePrivacyStore();

  useEffect(() => { setFontDraft(fontFamily); }, [fontFamily]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const applyFont = () => setFontFamily(fontDraft);

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-9 h-9 flex items-center justify-center transition-colors ${open ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        title="Tùy chỉnh nhanh"
        aria-label="Tùy chỉnh nhanh"
        aria-expanded={open}
      >
        <SlidersIcon className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-80 max-h-[80vh] overflow-y-auto bg-popover border border-border rounded-xl shadow-xl p-4 space-y-4 text-sm">
          <div>
            <SectionTitle>Giao diện</SectionTitle>
            <ThemeModePicker />
          </div>

          <div>
            <SectionTitle>Bảng màu</SectionTitle>
            <PalettePicker />
          </div>

          <div>
            <SectionTitle>Phông chữ (Google Fonts)</SectionTitle>
            <div className="flex gap-2">
              <input
                list="quick-settings-fonts"
                value={fontDraft}
                onChange={e => setFontDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') applyFont(); }}
                placeholder="Mặc định"
                className="flex-1 min-w-0 h-8 px-2 rounded-md bg-muted border border-input text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <datalist id="quick-settings-fonts">
                {FONT_SUGGESTIONS.map(f => <option key={f} value={f} />)}
              </datalist>
              <button
                onClick={applyFont}
                disabled={fontDraft.trim() === fontFamily}
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40"
              >
                Áp dụng
              </button>
            </div>
            <p className="text-[11px] text-subtle-foreground mt-1.5">
              Tải về một lần rồi lưu trên máy. Để trống và bấm Áp dụng để dùng phông mặc định.
            </p>
          </div>

          <div>
            <SectionTitle>Cỡ chữ của tin nhắn</SectionTitle>
            <select
              value={chatFontSize}
              onChange={e => setChatFontSize(Number(e.target.value))}
              className="w-full h-8 px-2 rounded-md bg-muted border border-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value={0}>Mặc định</option>
              {CHAT_FONT_SIZES.map(px => <option key={px} value={px}>{px}px</option>)}
            </select>
          </div>

          <div className="border-t border-border pt-3">
            <SectionTitle>Riêng tư</SectionTitle>
            <div className="space-y-2.5">
              {PRIVACY_OPTIONS.map(opt => (
                <Switch
                  key={opt.key}
                  size="sm"
                  checked={privacy[opt.key]}
                  onCheckedChange={v => setPrivacy(opt.key, v)}
                  label={opt.label}
                  description={opt.description}
                  className="flex-row-reverse justify-between"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
