import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { APP_PALETTES, useAppStore, type AppPalette, type AppThemeMode } from '@/store/appStore';
import { MinimizeIcon, MonitorIcon, SunIcon } from '../common/icons';

const MODE_OPTIONS: Array<{ value: AppThemeMode; label: string; icon: React.ReactNode }> = [
  { value: 'light', label: 'Sáng', icon: <SunIcon className="w-4 h-4" /> },
  { value: 'dark', label: 'Tối', icon: <MinimizeIcon className="w-4 h-4" /> },
  { value: 'system', label: 'Hệ thống', icon: <MonitorIcon className="w-4 h-4" /> },
];

/** Màu ô mẫu (màu nhấn chính của bảng màu) */
const PALETTE_META: Record<AppPalette, { label: string; swatch: string; hint?: string }> = {
  blue: { label: 'Xanh dương', swatch: '#2f7bff' },
  green: { label: 'Xanh lá', swatch: '#20a868' },
  purple: { label: 'Tím', swatch: '#8b5cf6' },
  amoled: { label: 'Đen tuyền', swatch: '#000000', hint: 'Chỉ áp dụng khi giao diện Tối' },
  zadark: { label: 'ZaDark', swatch: '#232526', hint: 'Tông xám than như ZaDark — chỉ áp dụng khi giao diện Tối' },
};

/** Sáng / Tối / Hệ thống dạng nút bấm liền nhau */
export function ThemeModePicker({ className = '' }: { className?: string }) {
  const { themeMode, setThemeMode } = useAppStore(useShallow(s => ({ themeMode: s.themeMode, setThemeMode: s.setThemeMode })));
  return (
    <div className={`flex bg-muted rounded-lg p-0.5 gap-0.5 ${className}`} role="radiogroup" aria-label="Giao diện">
      {MODE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={themeMode === opt.value}
          onClick={() => setThemeMode(opt.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
            themeMode === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.icon}{opt.label}
        </button>
      ))}
    </div>
  );
}

/** Các ô màu của bảng màu */
export function PalettePicker({ showLabels = true }: { showLabels?: boolean }) {
  const { palette, setPalette, theme } = useAppStore(useShallow(s => ({ palette: s.palette, setPalette: s.setPalette, theme: s.theme })));
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Bảng màu">
      {APP_PALETTES.map(value => {
        const meta = PALETTE_META[value];
        const active = palette === value;
        const inactiveInLight = (value === 'amoled' || value === 'zadark') && theme === 'light';
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPalette(value)}
            title={meta.hint ? `${meta.label} — ${meta.hint}` : meta.label}
            className="flex flex-col items-center gap-1 group"
          >
            <span
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                active ? 'border-primary ring-2 ring-primary/30' : 'border-border group-hover:border-border-strong'
              } ${inactiveInLight ? 'opacity-50' : ''}`}
              style={{ backgroundColor: meta.swatch }}
            >
              {active && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            {showLabels && <span className={`text-[11px] ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{meta.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
