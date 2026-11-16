/**
 * Đồng bộ danh sách "tắt thông báo" đặt trên Zalo (điện thoại / Zalo PC) về Deplao.
 * Chỉ giữ trong bộ nhớ (appStore.platformMutedThreads), làm mới mỗi lần tài khoản kết nối,
 * nên bật lại thông báo trên điện thoại thì lần kết nối sau Deplao cũng bỏ theo.
 */
import ipc, { buildZaloAuth } from '@/lib/ipc';
import { useAccountStore } from '@/store/accountStore';
import { useAppStore } from '@/store/appStore';
import { useEmployeeStore } from '@/store/employeeStore';
import { isZalo } from '@/lib/channelHelper';
import Logger from '../../utils/Logger';

interface ZaloMuteEntry {
  id: string;
  /** Giây; -1 = tắt vĩnh viễn (MuteDuration.FOREVER của zca-js) */
  duration: number;
  /** Thời điểm bắt đầu tắt (giây) */
  startTime: number;
}

/** threadId → until (0 = vĩnh viễn, >0 = epoch ms); bỏ các mục đã hết hạn */
export function zaloMuteEntriesToMap(entries: ZaloMuteEntry[], now = Date.now()): Record<string, number> {
  const muted: Record<string, number> = {};
  for (const entry of entries) {
    const id = String(entry?.id || '');
    const duration = Number(entry?.duration);
    if (!id || !Number.isFinite(duration)) continue;
    if (duration < 0) { muted[id] = 0; continue; }
    const start = Number(entry?.startTime) || 0;
    // Phòng trường hợp Zalo trả ms thay vì giây
    const startMs = start > 1e12 ? start : start * 1000;
    const until = startMs + duration * 1000;
    if (until > now) muted[id] = until;
  }
  return muted;
}

/** Đồng bộ ngay cho các tài khoản Zalo đang kết nối, rồi làm mới định kỳ (mute đổi trên điện thoại). Trả hàm dừng. */
export function startZaloMutePolling(intervalMs = 5 * 60_000): () => void {
  const run = () => {
    for (const acc of useAccountStore.getState().accounts) {
      if (acc.isConnected && isZalo(acc.channel)) void syncZaloMutes(acc.zalo_id);
    }
  };
  // Chờ danh sách tài khoản + kết nối sau khi khởi động
  const first = setTimeout(run, 8_000);
  const timer = setInterval(run, intervalMs);
  return () => { clearTimeout(first); clearInterval(timer); };
}

export async function syncZaloMutes(zaloId: string): Promise<void> {
  // Nhân viên: Boss giữ phiên Zalo, không tự gọi API
  if (useEmployeeStore.getState().mode === 'employee') return;
  const account = useAccountStore.getState().accounts.find(a => a.zalo_id === zaloId);
  if (!account || !isZalo(account.channel)) return;

  try {
    const res: any = await ipc.zalo?.getMute(buildZaloAuth(account, zaloId));
    if (!res?.success) {
      Logger.warn(`[ZaloMuteSync] ${zaloId} không lấy được danh sách tắt thông báo: ${res?.error || 'không rõ lỗi'}`);
      return;
    }
    const data = res.response || {};
    const entries: ZaloMuteEntry[] = [
      ...(Array.isArray(data.chatEntries) ? data.chatEntries : []),
      ...(Array.isArray(data.groupChatEntries) ? data.groupChatEntries : []),
    ];
    const muted = zaloMuteEntriesToMap(entries);
    useAppStore.getState().setPlatformMuted(zaloId, muted);
    Logger.log(`[ZaloMuteSync] ${zaloId}: ${Object.keys(muted).length} hội thoại đang tắt thông báo trên Zalo`);
  } catch (err: any) {
    Logger.warn(`[ZaloMuteSync] ${zaloId} lỗi: ${err?.message || err}`);
  }
}
