/**
 * Multi-select: turn on select mode; hold the mouse and drag across messages to select a whole range (added up across several drags). ESC exits.
 */
import React, { useEffect, useRef, useState } from 'react';

/**
 * Tìm ID tin nhắn tại toạ độ (clientX, clientY).
 * Nếu con trỏ chuột lệch ra lề hoặc khoảng trống giữa các tin nhắn,
 * duyệt các phần tử tin nhắn hiển thị để lấy tin gần nhất theo trục Y.
 */
function findMsgIdAtPoint(clientX: number, clientY: number): string | null {
  // 1. Thử tìm phần tử trực tiếp dưới con trỏ
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const el of elements) {
    const msgEl = (el as HTMLElement).closest?.('[id^="msg-"]') as HTMLElement;
    if (msgEl) {
      return msgEl.id.replace('msg-', '');
    }
  }

  // 2. Nếu con trỏ ở lề hoặc khoảng trống, tìm theo vị trí Y của các tin nhắn đang có trên DOM
  const allMsgEls = Array.from(document.querySelectorAll<HTMLElement>('[id^="msg-"]'));
  if (allMsgEls.length === 0) return null;

  const firstRect = allMsgEls[0].getBoundingClientRect();
  if (clientY < firstRect.top) {
    return allMsgEls[0].id.replace('msg-', '');
  }

  const lastRect = allMsgEls[allMsgEls.length - 1].getBoundingClientRect();
  if (clientY > lastRect.bottom) {
    return allMsgEls[allMsgEls.length - 1].id.replace('msg-', '');
  }

  for (let i = 0; i < allMsgEls.length; i++) {
    const rect = allMsgEls[i].getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) {
      return allMsgEls[i].id.replace('msg-', '');
    }
    if (clientY < rect.top) {
      return allMsgEls[i].id.replace('msg-', '');
    }
  }

  return null;
}

export function useMessageSelection(msgsRef: React.MutableRefObject<any[]>) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  // ── Drag-to-select: giữ chuột kéo qua nhiều tin nhắn → auto chọn ───────────
  const dragSelectRef = useRef<{
    isDown: boolean;
    startMsgId: string | null;
    startIdx: number;
    startX: number;
    startY: number;
    hasActivated: boolean;
    startedFromEmptySpace: boolean;
    initialSelectedMsgIds: Set<string>;
  }>({
    isDown: false,
    startMsgId: null,
    startIdx: -1,
    startX: 0,
    startY: 0,
    hasActivated: false,
    startedFromEmptySpace: false,
    initialSelectedMsgIds: new Set(),
  });
  const clickSuppressUntilRef = useRef(0);

  // ─── Drag-to-select: pointer move/up (document level) ──────────────────────
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragSelectRef.current;
      if (!drag.isDown) return;

      const deltaX = Math.abs(e.clientX - drag.startX);
      const deltaY = Math.abs(e.clientY - drag.startY);
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Tìm message element dưới cursor (hoặc gần nhất theo trục Y)
      const currentMsgId = findMsgIdAtPoint(e.clientX, e.clientY);
      if (!currentMsgId && !drag.startMsgId) return;

      // Nếu bắt đầu từ vùng trống mà lúc pointerdown chưa có startMsgId, gán tin nhắn đầu tiên gặp
      if (!drag.startMsgId && currentMsgId) {
        drag.startMsgId = currentMsgId;
        const currentMsgs = msgsRef.current;
        drag.startIdx = currentMsgs.findIndex((m: any) => String(m.msg_id) === String(currentMsgId));
      }

      if (!drag.startMsgId) return;

      const currentMsgs = msgsRef.current;
      const startIdx = drag.startIdx >= 0
        ? drag.startIdx
        : currentMsgs.findIndex((m: any) => String(m.msg_id) === String(drag.startMsgId));
      if (startIdx === -1) return;

      const endIdx = currentMsgId
        ? currentMsgs.findIndex((m: any) => String(m.msg_id) === String(currentMsgId))
        : startIdx;
      if (endIdx === -1) return;

      // Điều kiện kích hoạt drag-select:
      // - Nếu đang ở chế độ chọn: chỉ cần kéo chuột > 4px
      // - Nếu bắt đầu từ vùng trống ngoài tin nhắn: kéo chuột > 4px
      // - Nếu bắt đầu trong tin nhắn: kéo sang tin nhắn khác hoặc kéo dọc > 25px
      if (!drag.hasActivated) {
        const movedToDifferentMsg = currentMsgId && String(currentMsgId) !== String(drag.startMsgId);
        const shouldActivate = isSelecting
          ? dist > 4
          : (drag.startedFromEmptySpace && dist > 4) || movedToDifferentMsg || (deltaY > 25);

        if (!shouldActivate) return;

        drag.hasActivated = true;
        setIsSelecting(true);
        // Huỷ text selection nếu có và khoá chọn chữ tạm thời
        window.getSelection()?.removeAllRanges();
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
      }

      // Auto-scroll nếu kéo chuột sát mép trên/dưới container chat
      const container = document.querySelector('[class*="overflow-y-auto"]') as HTMLElement | null;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (e.clientY < rect.top + 35) {
          container.scrollTop -= 18;
        } else if (e.clientY > rect.bottom - 35) {
          container.scrollTop += 18;
        }
      }

      // Chọn tất cả messages trong dải [startIdx, endIdx]
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);
      const rangeIds = new Set<string>();
      for (let i = minIdx; i <= maxIdx; i++) {
        const m = currentMsgs[i];
        if (m) {
          rangeIds.add(String(m.msg_id));
        }
      }

      // Merge với danh sách selection ban đầu (cộng dồn khi kéo nhiều lần)
      setSelectedMsgIds(() => {
        const next = new Set(drag.initialSelectedMsgIds);
        for (const id of rangeIds) next.add(id);
        return next;
      });
    };

    const handlePointerUp = () => {
      const drag = dragSelectRef.current;
      if (!drag.isDown) return;

      if (drag.hasActivated) {
        // Giữ selection mode active, chặn click toggle ngay sau khi thả chuột
        clickSuppressUntilRef.current = Date.now() + 200;
      }

      // Restore user-select
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';

      drag.isDown = false;
      drag.startMsgId = null;
      drag.startIdx = -1;
      drag.hasActivated = false;
      drag.startedFromEmptySpace = false;
      drag.initialSelectedMsgIds = new Set();
    };

    const handleDragStart = (e: DragEvent) => {
      // Khi đang giữ chuột chuẩn bị chọn hoặc đang drag-select tin nhắn,
      // chặn HTML5 native drag trên text/ảnh để không bị cướp mất pointer events.
      if (dragSelectRef.current.isDown || dragSelectRef.current.hasActivated) {
        e.preventDefault();
      }
    };

    document.addEventListener('pointermove', handlePointerMove, { capture: true });
    document.addEventListener('pointerup', handlePointerUp, { capture: true });
    document.addEventListener('pointercancel', handlePointerUp, { capture: true });
    document.addEventListener('dragstart', handleDragStart, { capture: true });

    return () => {
      document.removeEventListener('pointermove', handlePointerMove, { capture: true });
      document.removeEventListener('pointerup', handlePointerUp, { capture: true });
      document.removeEventListener('pointercancel', handlePointerUp, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isSelecting]);

  // ─── ESC to exit selection mode ─────────────────────────────────────────
  useEffect(() => {
    if (!isSelecting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsSelecting(false);
        setSelectedMsgIds(new Set());
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      }
    };
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isSelecting]);

  return { isSelecting, setIsSelecting, selectedMsgIds, setSelectedMsgIds, dragSelectRef, clickSuppressUntilRef };
}

export type MessageSelection = ReturnType<typeof useMessageSelection>;
