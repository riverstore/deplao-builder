/**
 * senderAliasLookup.ts — Tra cứu và ưu tiên hiển thị biệt danh (alias) / tên bạn bè đã lưu của người gửi tin nhắn,
 * đặc biệt là cho tiền tố người gửi trong tin nhắn cuối (last_message preview) ở panel bên trái.
 */
import { useAppStore } from '@/store/app/appStore';
import { useChatStore } from '@/store/chat/chatStore';
import ipc from '@/lib/ipc';
import DataAccessor, { isReadFailure } from '@/lib/data/DataAccessor';
import { useEmployeeStore } from '@/store/employee/employeeStore';

/** Cache alias theo id và theo tên hiển thị cho từng tài khoản: key = `${accountId}__${idOrName}` */
const aliasByIdMap = new Map<string, string>();
const aliasByNameMap = new Map<string, string>();

/** Cache tên bạn bè đã lưu trong danh bạ Zalo */
const friendByIdMap = new Map<string, string>();
const friendByNameMap = new Map<string, string>();

const initializedAccounts = new Set<string>();

/** Đăng ký / cập nhật alias vào bộ nhớ cache */
export function registerAlias(accountId: string, contactId: string, alias: string, displayName?: string): void {
  if (!accountId || !contactId) return;
  const idKey = `${accountId}__${contactId}`;
  const cleanAlias = (alias || '').trim();

  if (cleanAlias) {
    aliasByIdMap.set(idKey, cleanAlias);
    if (displayName && displayName.trim()) {
      aliasByNameMap.set(`${accountId}__${displayName.trim().toLowerCase()}`, cleanAlias);
    }
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
      registerAlias(accountId, c.contact_id, c.alias.trim(), c.display_name || undefined);
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
        friendByNameMap.set(`${accountId}__${name.toLowerCase()}`, name);
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

/** Lấy alias theo display_name */
export function getAliasByName(accountId: string, displayName: string): string | undefined {
  if (!accountId || !displayName) return undefined;
  return aliasByNameMap.get(`${accountId}__${displayName.trim().toLowerCase()}`);
}

/** Lấy tên bạn bè đã lưu theo userId */
export function getFriendSavedNameById(accountId: string, userId: string): string | undefined {
  if (!accountId || !userId) return undefined;
  return friendByIdMap.get(`${accountId}__${userId}`);
}

/**
 * Tra cứu alias hoặc tên bạn bè đã lưu của người gửi tin nhắn (dùng cho tiền tố last_message).
 * Ưu tiên:
 * 1. Nếu tin nhắn từ chính hội thoại 1-1 đang xét và contact đó có alias hoặc tên bạn bè đã lưu.
 * 2. Nếu là nhóm, tra cứu theo danh sách thành viên trong groupInfoCache để lấy userId:
 *    - Lấy alias theo userId.
 *    - Lấy tên bạn bè đã lưu theo userId.
 * 3. Tra cứu alias theo ID trong cache.
 * 4. Tra cứu tên bạn bè đã lưu theo ID trong cache.
 * 5. Tra cứu alias theo Display Name trong cache.
 * 6. Tra cứu trong danh bạ contacts của useChatStore (theo ID và theo Display Name).
 * 7. Tra cứu ở các tài khoản khác (chế độ gộp hộp thư merged inbox).
 */
export function resolveSenderAlias(
  rawSender: string,
  accountId?: string,
  threadId?: string,
): string | undefined {
  if (!rawSender) return undefined;
  // Bỏ ngoặc vuông hoặc khoảng trắng thừa nếu có, ví dụ "[Tên]" -> "Tên"
  let cleanSender = rawSender.trim();
  if (cleanSender.startsWith('[') && cleanSender.endsWith(']')) {
    cleanSender = cleanSender.slice(1, -1).trim();
  }
  if (!cleanSender || cleanSender === 'Bạn' || cleanSender === 'You') return undefined;

  const currentAccountId = accountId || '';
  const lowerSender = cleanSender.toLowerCase();

  // 1. Kiểm tra nhanh: Nếu threadId là hội thoại 1-1 của chính liên hệ đó
  if (currentAccountId && threadId) {
    const threadContact = (useChatStore.getState().contacts[currentAccountId] || []).find((c) => c.contact_id === threadId);
    if (threadContact) {
      if (threadContact.alias?.trim()) return threadContact.alias.trim();
      const friendSaved = getFriendSavedNameById(currentAccountId, threadId);
      if (friendSaved && friendSaved.trim()) return friendSaved.trim();
      if (threadContact.is_friend === 1 && threadContact.display_name && threadContact.display_name.trim() !== threadId) {
        return threadContact.display_name.trim();
      }
    }
  }

  // 2. Nếu là hội thoại nhóm có threadId: tra cứu thành viên trong groupInfoCache
  if (currentAccountId && threadId) {
    const groupInfo = useAppStore.getState().groupInfoCache?.[currentAccountId]?.[threadId];
    if (groupInfo?.members?.length) {
      const member = groupInfo.members.find(
        (m) => String(m.userId) === cleanSender || (m.displayName && m.displayName.trim().toLowerCase() === lowerSender),
      );
      if (member) {
        const memberId = String(member.userId);
        // Tra theo memberId trong aliasByIdMap
        const aliasById = getAliasById(currentAccountId, memberId);
        if (aliasById) return aliasById;

        // Tra theo memberId trong friendByIdMap (tên bạn bè đã lưu)
        const friendSaved = getFriendSavedNameById(currentAccountId, memberId);
        if (friendSaved && friendSaved.trim()) return friendSaved.trim();

        // Tra theo memberId trong contacts của store
        const storeContacts = useChatStore.getState().contacts[currentAccountId] || [];
        const contactMatch = storeContacts.find((c) => c.contact_id === memberId);
        if (contactMatch?.alias?.trim()) {
          registerAlias(currentAccountId, memberId, contactMatch.alias.trim(), member.displayName);
          return contactMatch.alias.trim();
        }
        if (contactMatch?.is_friend === 1 && contactMatch.display_name && contactMatch.display_name.trim() !== memberId) {
          return contactMatch.display_name.trim();
        }
      }
    }
  }

  // 3. Tra cứu trực tiếp theo ID trong alias cache
  if (currentAccountId) {
    const byId = getAliasById(currentAccountId, cleanSender);
    if (byId) return byId;

    // 4. Tra cứu theo ID trong danh bạ bạn bè đã lưu
    const friendById = getFriendSavedNameById(currentAccountId, cleanSender);
    if (friendById) return friendById;

    // 5. Tra cứu trực tiếp theo Display Name trong alias cache
    const byName = getAliasByName(currentAccountId, cleanSender);
    if (byName) return byName;

    // 6. Tra cứu tên bạn bè theo Display Name
    const friendByName = friendByNameMap.get(`${currentAccountId}__${lowerSender}`);
    if (friendByName) return friendByName;
  }

  // 7. Tra cứu trong contacts của useChatStore cho tài khoản hiện tại
  if (currentAccountId) {
    const accountContacts = useChatStore.getState().contacts[currentAccountId] || [];
    // Khớp theo contact_id
    const cById = accountContacts.find((c) => c.contact_id === cleanSender);
    if (cById?.alias?.trim()) {
      registerAlias(currentAccountId, cleanSender, cById.alias.trim(), cById.display_name);
      return cById.alias.trim();
    }
    if (cById?.is_friend === 1 && cById.display_name && cById.display_name.trim() !== cleanSender) {
      return cById.display_name.trim();
    }
    // Khớp theo display_name
    const cByName = accountContacts.find(
      (c) => c.display_name && c.display_name.trim().toLowerCase() === lowerSender,
    );
    if (cByName?.alias?.trim()) {
      registerAlias(currentAccountId, cByName.contact_id, cByName.alias.trim(), cByName.display_name);
      return cByName.alias.trim();
    }
  }

  // 8. Thử tìm trong contacts của tất cả các tài khoản khác (ví dụ chế độ gộp trang merged mode)
  const allContacts = useChatStore.getState().contacts;
  for (const accId of Object.keys(allContacts)) {
    if (accId === currentAccountId) continue;
    const list = allContacts[accId] || [];
    const match = list.find(
      (c) => c.contact_id === cleanSender || (c.display_name && c.display_name.trim().toLowerCase() === lowerSender),
    );
    if (match?.alias?.trim()) {
      return match.alias.trim();
    }
    if (match?.is_friend === 1 && match.display_name && match.display_name.trim() !== cleanSender) {
      return match.display_name.trim();
    }
  }

  return undefined;
}
