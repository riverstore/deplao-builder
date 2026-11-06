/**
 * Kính lúp của ô tìm kiếm hội thoại, kiêm dấu hội thoại ẩn Zalo (ZL-03, bảo mật & đúng chuẩn Zalo):
 *  - không có hội thoại ẩn / bình thường chưa có tin mới: kính lúp màu xám trung tính (không làm lộ có hội thoại ẩn),
 *    bấm vào = focus vào ô tìm kiếm để tìm kiếm hoặc gõ PIN;
 *  - có hội thoại ẩn VÀ có tin nhắn mới chưa đọc: kính lúp đỏ + chấm đỏ nhấp nháy, báo hiệu cho chủ nhân biết;
 *  - đang xem hội thoại ẩn (đã gõ đúng PIN): kính lúp đỏ có nền, bấm để ẩn lại ngay.
 */
import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store/app/appStore';
import { useChatStore } from '@/store/chat/chatStore';
import { refreshHiddenFromZalo } from '@/hooks/zalo/useZaloHidden';

function SearchGlyph({ className }: { className: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/** Nút bao kính lúp: vùng bấm rộng hơn nhưng không đẩy chữ trong ô tìm kiếm (-m-1 p-1). */
const RED_BUTTON = '-m-1 flex flex-shrink-0 items-center justify-center rounded-full p-1 text-red-500 transition-colors hover:bg-red-500/15 relative';
const NEUTRAL_BUTTON = '-m-1 flex flex-shrink-0 items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/80';

export default function ZaloHiddenMark({ accountIds, onFocusSearch }: {
  accountIds: ReadonlyArray<string | null | undefined>;
  onFocusSearch: () => void;
}) {
  const { hidden, unlocked } = useAppStore(useShallow((s) => ({ hidden: s.hiddenConversations, unlocked: s.hiddenUnlocked })));
  const contacts = useChatStore((s) => s.contacts);

  const withHidden = useMemo(
    () => accountIds.filter((id): id is string => !!id && (hidden[id]?.size || 0) > 0),
    [accountIds, hidden],
  );

  // Kiểm tra xem có tin nhắn mới chưa đọc trong bất kỳ hội thoại ẩn nào không
  const hasUnreadHidden = useMemo(() => {
    for (const id of withHidden) {
      const hiddenIds = hidden[id];
      if (!hiddenIds || hiddenIds.size === 0) continue;
      const list = contacts[id] || [];
      if (list.some((c) => hiddenIds.has(c.contact_id) && (Number(c.unread_count) || 0) > 0)) {
        return true;
      }
    }
    return false;
  }, [withHidden, hidden, contacts]);

  const open = withHidden.filter((id) => !!unlocked[id]);

  // 1. Đang mở xem hội thoại ẩn: nút đỏ có nền, bấm để khoá lại
  if (open.length > 0) {
    return (
      <button
        type="button"
        className={`${RED_BUTTON} bg-red-500/15`}
        title="Đang xem hội thoại ẩn — bấm để ẩn lại"
        aria-label="Ẩn lại hội thoại ẩn"
        onClick={() => {
          for (const id of open) useAppStore.getState().setHiddenUnlocked(id, false);
        }}
      >
        <SearchGlyph className="flex-shrink-0" />
      </button>
    );
  }

  // 2. Có tin nhắn mới chưa đọc từ hội thoại ẩn: kính lúp đỏ + chấm đỏ báo hiệu
  if (hasUnreadHidden) {
    return (
      <button
        type="button"
        className={RED_BUTTON}
        aria-label="Có tin nhắn mới trong hội thoại ẩn"
        title="Có tin nhắn mới trong hội thoại ẩn — gõ mã PIN vào ô tìm kiếm để xem"
        onClick={() => {
          onFocusSearch();
          void refreshHiddenFromZalo(withHidden).then(({ noPin }) => {
            if (noPin.length > 0) useAppStore.getState().showNotification('Zalo không còn mã PIN hội thoại ẩn — các hội thoại đã hiện lại', 'info');
          });
        }}
      >
        <SearchGlyph className="flex-shrink-0" />
        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-card animate-pulse" />
      </button>
    );
  }

  // 3. Bình thường: kính lúp màu xám trung tính (bảo mật, không làm lộ hội thoại ẩn), bấm vào để focus ô tìm kiếm
  return (
    <button
      type="button"
      className={NEUTRAL_BUTTON}
      aria-label="Tìm kiếm"
      title={withHidden.length > 0 ? "Tìm kiếm (gõ mã PIN để xem hội thoại ẩn)" : "Tìm kiếm..."}
      onClick={() => {
        onFocusSearch();
        if (withHidden.length > 0) {
          void refreshHiddenFromZalo(withHidden).then(({ noPin }) => {
            if (noPin.length > 0) useAppStore.getState().showNotification('Zalo không còn mã PIN hội thoại ẩn — các hội thoại đã hiện lại', 'info');
          });
        }
      }}
    >
      <SearchGlyph className="flex-shrink-0" />
    </button>
  );
}
