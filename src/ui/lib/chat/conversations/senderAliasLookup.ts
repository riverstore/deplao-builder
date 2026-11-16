/**
 * senderAliasLookup.ts — Tra cứu và ưu tiên hiển thị biệt danh (alias) / tên bạn bè đã lưu của người gửi tin nhắn,
 * đặc biệt là cho tiền tố người gửi trong tin nhắn cuối (last_message preview) ở panel bên trái.
 */
import { useAppStore } from '@/store/app/appStore';
import { useChatStore } from '@/store/chat/chatStore';
import ipc from '@/lib/ipc';
import DataAccessor, { isReadFailure } from '@/lib/data/DataAccessor';
import { useEmployeeStore } from '@/store/employee/employeeStore';

/** Cache alias theo id cho từng tài khoản: key = `${accountId}__${contactId}` */
const aliasByIdMap = new Map<string, string>();

/** Cache tên bạn bè đã lưu trong danh bạ Zalo (bảng friends): key = `${accountId}__${userId}` */
const friendByIdMap = new Map<string, string>();

const initializedAccounts = new Set<string>();

/** Đăng ký / cập nhật alias vào bộ nhớ cache */
export function registerAlias(accountId: string, contactId: string, alias: string, _displayName?: string): void {
  if (!accountId || !contactId) return;
  const idKey = `${accountId}__${contactId}`;
  const cleanAlias = (alias || '').trim();

  if (cleanAlias) {
    aliasByIdMap.set(idKey, cleanAlias);
  } else {
    aliasByIdMap.delete(idKey);
  }
}

/** Xoá alias khỏi cache */
export function removeAlias(accountId: string, contactId: string): void {
  if (!accountId || !contactId) return;
  aliasByIdMap.delete(`${accountId}__${contactId}`);
}

/** Nạp hàng loạt alias từ danh sách liên hệ */
export function populateAliasesFromContacts(
  accountId: string,
  contacts: Array<{ contact_id: string; alias?: string | null; display_name?: string | null }>,
): void {
  if (!accountId || !Array.isArray(contacts)) return;
  for (const c of contacts) {
    if (c.alias && c.alias.trim()) {
      registerAlias(accountId, c.contact_id, c.alias.trim());
    }
  }
}

/**
 * Khởi tạo nạp toàn bộ alias, danh bạ bạn bè và thành viên nhóm của tài khoản từ SQLite / Boss API
 * để đảm bảo việc tra cứu tên người gửi ở panel bên trái có ngay kết quả từ đầu.
 */
export async function initSenderAliasLookup(accountId: string, force = false): Promise<void> {
  if (!accountId) return;
  if (!force && initializedAccounts.has(accountId)) return;
  initializedAccounts.add(accountId);

  try {
    // 1. Nạp toàn bộ liên hệ có alias từ database
    if (useEmployeeStore.getState().mode === 'employee') {
      const res = await DataAccessor.getConversations(accountId, 500, 0);
      if (!isReadFailure(res) && Array.isArray(res?.items)) {
        populateAliasesFromContacts(accountId, res.items);
      }
    } else {
      const res: any = await ipc.db?.getContacts(accountId);
      const list = Array.isArray(res?.contacts) ? res.contacts : (Array.isArray(res) ? res : []);
      if (list.length) {
        populateAliasesFromContacts(accountId, list);
      }
    }

    // 2. Nạp toàn bộ danh bạ bạn bè đã lưu tên (bảng friends)
    const frRes: any = await DataAccessor.getFriends({ zaloId: accountId });
    const friendList = Array.isArray(frRes?.friends) ? frRes.friends : [];
    for (const f of friendList) {
      const uid = String(f.userId || f.user_id || '');
      const name = String(f.displayName || f.display_name || '').trim();
      if (uid && name && name !== uid) {
        friendByIdMap.set(`${accountId}__${uid}`, name);
      }
    }

    // 3. Nạp thành viên nhóm vào groupInfoCache để tra cứu theo userId
    const gmRes: any = await DataAccessor.getAllGroupMembers(accountId);
    const rows = Array.isArray(gmRes?.rows) ? gmRes.rows : (Array.isArray(gmRes) ? gmRes : []);
    if (rows.length) {
      const byGroup: Record<string, any[]> = {};
      for (const row of rows) {
        if (!byGroup[row.group_id]) byGroup[row.group_id] = [];
        byGroup[row.group_id].push(row);
      }
      const appStore = useAppStore.getState();
      for (const [groupId, members] of Object.entries(byGroup)) {
        const existing = (appStore.groupInfoCache[accountId] || {})[groupId];
        if (!existing || !existing.members?.length) {
          appStore.setGroupInfo(accountId, groupId, {
            groupId,
            name: existing?.name || groupId,
            avatar: existing?.avatar || '',
            memberCount: members.length,
            fetchedAt: Date.now(),
            members: members.map((m: any) => ({
              userId: String(m.member_id || m.userId || ''),
              displayName: m.display_name || m.displayName || m.member_id || '',
              avatar: m.avatar || '',
              role: m.role || 0,
            })),
          });
        }
      }
    }
  } catch (err) {
    console.warn('[senderAliasLookup] initSenderAliasLookup failed for', accountId, err);
  }
}

/** Lấy alias theo contact_id / userId */
export function getAliasById(accountId: string, contactId: string): string | undefined {
  if (!accountId || !contactId) return undefined;
  return aliasByIdMap.get(`${accountId}__${contactId}`);
}

/** Lấy tên bạn bè đã lưu theo userId */
export function getFriendSavedNameById(accountId: string, userId: string): string | undefined {
  if (!accountId || !userId) return undefined;
  return friendByIdMap.get(`${accountId}__${userId}`);
}

/**
 * Tra cứu alias hoặc tên bạn bè đã lưu theo userId duy nhất.
 * Ưu tiên:
 * 1. Alias do người dùng tự đặt trong Deplao.
 * 2. Tên bạn bè đã lưu trong danh bạ Zalo (bảng friends).
 * 3. Tên/alias trong danh bạ contacts (nếu là bạn bè is_friend === 1).
 */
export function lookupByUserId(accountId: string, userId: string): string | undefined {
  if (!accountId || !userId) return undefined;
  const uid = String(userId).trim();
  if (!uid) return undefined;

  const alias = getAliasById(accountId, uid);
  if (alias && alias.trim()) return alias.trim();

  const friendName = getFriendSavedNameById(accountId, uid);
  if (friendName && friendName.trim()) return friendName.trim();

  const storeContacts = useChatStore.getState().contacts[accountId] || [];
  const contact = storeContacts.find((c) => String(c.contact_id) === uid);
  if (contact?.alias?.trim()) {
    return contact.alias.trim();
  }
  if (contact?.is_friend === 1 && contact.display_name && contact.display_name.trim() !== uid) {
    return contact.display_name.trim();
  }

  return undefined;
}

/**
 * Tra cứu alias hoặc tên bạn bè đã lưu của người gửi tin nhắn (dùng cho tiền tố last_message).
 * NGUYÊN TẮC:
 * - TUYỆT ĐỐI KHÔNG tra cứu toàn cục theo tên hiển thị (display_name), vì trùng tên Zalo sẽ làm gán nhầm
 *   biệt danh của người này cho người khác!
 * - CHỈ tra cứu khi đã xác định được định danh duy nhất (userId):
 *   1. Trong hội thoại 1-1: Đối phương chính là threadId (userId).
 *   2. Trong hội thoại nhóm: rawSender được đối chiếu với danh sách thành viên CỦA CHÍNH NHÓM ĐÓ (threadId)
 *      để tìm ra userId của thành viên gửi tin trong nhóm. Khi có userId duy nhất, mới tra alias/friend name.
 *   3. Nếu rawSender chính là userId (chuỗi số từ sự kiện realtime): tra cứu trực tiếp theo userId.
 *   4. Nếu không xác định được userId duy nhất: giữ nguyên tên gốc (trả về undefined).
 */
export function resolveSenderAlias(
  rawSender: string,
  accountId?: string,
  threadId?: string,
): string | undefined {
  if (!rawSender) return undefined;
  let cleanSender = rawSender.trim();
  if (cleanSender.startsWith('[') && cleanSender.endsWith(']')) {
    cleanSender = cleanSender.slice(1, -1).trim();
  }
  if (!cleanSender || cleanSender === 'Bạn' || cleanSender === 'You') return undefined;

  const currentAccountId = accountId || '';
  if (!currentAccountId) {
    // Không có accountId, nếu cleanSender là userId có thể kiểm tra qua các account
    if (/^\d+$/.test(cleanSender)) {
      const allAccounts = Object.keys(useChatStore.getState().contacts || {});
      for (const acc of allAccounts) {
        const found = lookupByUserId(acc, cleanSender);
        if (found) return found;
      }
    }
    return undefined;
  }

  // 1. Nếu cleanSender chính là userId (chỉ chứa số hoặc đã khớp ID trong alias/friend cache)
  if (/^\d+$/.test(cleanSender) || aliasByIdMap.has(`${currentAccountId}__${cleanSender}`) || friendByIdMap.has(`${currentAccountId}__${cleanSender}`)) {
    const res = lookupByUserId(currentAccountId, cleanSender);
    if (res) return res;
  }

  // 2. Nếu có threadId: phân biệt theo ngữ cảnh nhóm hoặc chat 1-1
  if (threadId) {
    const groupInfo = useAppStore.getState().groupInfoCache?.[currentAccountId]?.[threadId];
    if (groupInfo?.members?.length) {
      // 2a. Hội thoại nhóm: Tìm thành viên trong CHÍNH NHÓM ĐÓ khớp với cleanSender
      const lowerSender = cleanSender.toLowerCase();
      const matchedMembers = groupInfo.members.filter((m) => {
        if (String(m.userId) === cleanSender) return true;
        return m.displayName && m.displayName.trim().toLowerCase() === lowerSender;
      });

      if (matchedMembers.length === 1) {
        // Tìm thấy duy nhất 1 thành viên khớp tên/id trong nhóm
        const targetUserId = String(matchedMembers[0].userId);
        const resolved = lookupByUserId(currentAccountId, targetUserId);
        if (resolved) return resolved;
        // Thành viên này không có alias và không có tên bạn bè đã lưu -> giữ nguyên tên gốc
        return undefined;
      }

      if (matchedMembers.length > 1) {
        // Nếu có nhiều người trùng tên trong nhóm, chỉ nhận khi có người khớp chính xác userId
        const exactIdMatch = matchedMembers.find((m) => String(m.userId) === cleanSender);
        if (exactIdMatch) {
          const resolved = lookupByUserId(currentAccountId, String(exactIdMatch.userId));
          if (resolved) return resolved;
        }
        return undefined;
      }

      // Không tìm thấy trong members của nhóm -> giữ nguyên tên gốc
      return undefined;
    }

    // 2b. Kiểm tra nếu là chat 1-1 (threadId là contact_id cá nhân)
    const threadContact = (useChatStore.getState().contacts[currentAccountId] || []).find((c) => c.contact_id === threadId);
    const isOneOnOne = threadContact ? threadContact.contact_type === 'user' : !threadId.endsWith('_g');
    if (isOneOnOne) {
      // Trong chat 1-1, đối phương chính là threadId
      const lowerSender = cleanSender.toLowerCase();
      const isTarget = cleanSender === threadId
        || (threadContact?.display_name && threadContact.display_name.trim().toLowerCase() === lowerSender);
      if (isTarget) {
        const resolved = lookupByUserId(currentAccountId, threadId);
        if (resolved) return resolved;
      }
      return undefined;
    }
  }

  // Tuyệt đối không tra cứu mò theo tên toàn cục
  return undefined;
}
