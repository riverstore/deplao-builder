/**
 * emojiUtils.ts - Constants and helpers for emoji (Zalo codes, emoji categories, reaction mapping)
 * Shared by ChatWindow, MessageBubbles, MessageInput, and other components.
 */

/** Zalo text reaction codes & emoticons → Unicode emoji (dùng để convert khi display) */
export const ZALO_CODE_TO_EMOJI: Record<string, string> = {
  // 6 reaction chính khớp với shared/zalo/zaloReactions
  '/-heart':   '❤️',  '/-strong':  '👍',  ':>':        '😆',  ':o':        '😮',
  ':-((':      '😭',  ':-h':       '😡',

  // Zalo official shortcut codes
  '/-weak':    '👎',  '/-rose':    '🌹',  '/-break':   '💔',  '/-shit':    '💩',
  '/-li':      '☀️',  '/-bd':      '🎂',  '/-bome':    '💣',  '/-ok':      '👌',
  '/-v':       '✌️',  '/-thanks':  '🤝',  '/-punch':   '👊',  '/-share':   '🔗',
  '_()_':      '🙏',  '/-no':      '🙅',  '/-bad':     '👎',  '/-loveu':   '🫶',
  '/-fade':    '😶',  '/-beer':    '🍺',  '/-coffee':  '☕',  '/-hug':     '🤗',
  ':handclap': '👏',  ':-bye':     '👋',  ':bye':      '👋',  ':wipe':     '😅',
  ':-dig':     '🤔',  '--b':       '😞',

  // Cười tươi / nhe răng (Big smile / Grin) — hỗ trợ cả chữ thường (:d) chuẩn Zalo lẫn chữ hoa (:D)
  ':-D': '😁',  ':-d': '😁',  ':D': '😁',  ':d': '😁',
  ';-D': '😁',  ';-d': '😁',  ';D': '😁',  ';d': '😁',
  '=-D': '😁',  '=-d': '😁',  '=D': '😁',  '=d': '😁',

  // Cười mỉm / thân thiện (Smile)
  ':-)': '🙂',  ':)': '🙂',  ':-]': '🙂',  ':]': '🙂',
  '=-)': '🙂',  '=)': '🙂',  '^^': '😊',   '^_^': '😊',

  // Cười lớn / cười chảy nước mắt (Laugh / RoFl)
  ":')": '😂',   ":'))": '😂',  ':)))': '😂',  ':))': '😂',
  '=)))': '😂',  '=))': '😂',   ':->': '😄',

  // Lè lưỡi / trêu đùa (Tongue) — hỗ trợ cả :p và :P
  ':-P': '😛',  ':-p': '😛',  ':P': '😛',  ':p': '😛',
  '=-P': '😛',  '=-p': '😛',  '=P': '😛',  '=p': '😛',

  // Ngạc nhiên (Surprise / Shock) — hỗ trợ cả :o và :O
  ':-O': '😲',  ':-o': '😲',  ':O': '😲',
  '=-O': '😲',  '=-o': '😲',  '=O': '😲',  '=o': '😮',

  // Nháy mắt (Wink)
  ';-)': '😉',  ';)': '😉',   ';xx': '😍',

  // Buồn / thất vọng (Sad)
  ':-(': '😞',  ':(': '😞',   ':-[': '😞',  ':[': '😞',
  '=-(': '😞',  '=(': '😞',   'p-(': '😔',  'P-(': '😔',

  // Khóc (Cry)
  ":'(": '😢',   ":'-(": '😢',  ':-(((': '😭', ':(((': '😭',
  ':((': '😭',   ':-<': '😢',

  // Giận dữ (Angry)
  ':-H': '😡',  ':h': '😡',  ':H': '😡',
  '>-|': '😠',  '>:(': '😠',

  // Hôn (Kiss)
  ':-*': '😘',  ':*': '😘',   ';-*': '😘',  ';*': '😘',

  // Kính râm / ngầu (Cool)
  'b-)': '😎',  'B-)': '😎',  'b)': '😎',   'B)': '😎',
  'x-)': '😎',  'X-)': '😎',

  // Kính cận / tri thức (Nerd)
  '8-)': '🤓',  '8)': '🤓',

  // Mất ngủ / buồn ngủ (Sleepy)
  '|-)': '😴',  '|)': '😴',

  // Nghi ngờ / bối rối (Confused)
  ';-/': '😕',  ':-/': '😕',  ':/': '😕',   ':-\\': '😕',  ':\\': '😕',

  // Vô cảm / nghiêm túc (Straight face)
  ':--|': '😐', ':-|': '😐',  ':|': '😐',

  // Im lặng / bí mật (Quiet / Secret)
  ';-x': '🤫',  ';-X': '🤫',  ':-x': '🤫',  ':-X': '🤫',
  ':x': '🤫',   ':X': '🤫',

  // Lo lắng / hoảng hốt (Worried / Fear)
  '&-(': '😰',  ';-a': '😨',  ';-A': '😨',  ':-a': '😨',  ':-A': '😨',

  // Ngượng ngùng / đỏ mặt (Blush)
  ';-s': '😳',  ';-S': '😳',  ':-s': '😳',  ':-S': '😳',

  // Giàu có / hám tiền (Money)
  '$-)': '🤑',  '$)': '🤑',

  // Mèo (Cat)
  ':-3': '😺',  ':3': '😺',

  // Tim (Heart)
  '<3': '❤️',   '</3': '💔',
};

/**
 * Font stack of message text that should draw emoji in color (Telegram): the app's text fonts FIRST, color emoji fonts
 * after, so a symbol such as ❤ or ✈ without the emoji selector is drawn in color instead of the monochrome Segoe UI Symbol
 * (Windows). Emoji fonts must never come first: they also hold digits, "#", "*" and the space (keycap emoji), so on macOS
 * Apple Color Emoji drew wide digits and spaces while the letters fell back to a serif font.
 */
export const COLOR_EMOJI_TEXT_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';

/** Pre-sort các keys theo độ dài giảm dần một lần duy nhất để tối ưu hiệu năng */
const SORTED_ZALO_CODES = Object.keys(ZALO_CODE_TO_EMOJI).sort((a, b) => b.length - a.length);

/** Regex bảo vệ: URL (http/https/ftp/custom scheme), link www, email, Windows file path (C:\...), domain links */
const PROTECTED_TEXT_REGEX = /(?:https?:\/\/[^\s<>"]+|[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s<>"]+|www\.[^\s<>"]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z]:\\[^\s<>"]+|[a-zA-Z0-9._-]+\.(?:com|vn|net|org|io|dev|app|me|co|xyz|info|tv|gg|link|page|site|online|tech|store|fun|icu|top|cc|pw|tk|ml|ga|cf|gq)(?:\/[^\s<>"]*)?)/gi;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Xây dựng Regex một lần duy nhất với các điều kiện ranh giới chặt chẽ:
 * 1. Phía trước code: Không được là chữ cái, số, hoặc gạch dưới (?<![a-zA-Z0-9_])
 *    -> Ngăn chặn dính vào scheme link (https://), ổ đĩa Windows (D:\), hoặc từ (Note:demo)
 * 2. Phía sau code:
 *    - Nếu code kết thúc bằng chữ cái/số (:d, :p, :o, :h, :x, :3, b), 8)...) -> (?![a-zA-Z0-9_])
 *      -> Ngăn chặn biến từ (:dog, :phone) thành emoji
 *    - Nếu code kết thúc bằng / (:/, :-/) -> (?![/])
 *      -> Ngăn chặn biến :// trong URL thành emoji
 *    - Nếu code kết thúc bằng \ (:\, :-\) -> (?![\\\\])
 */
const EMOJI_PATTERNS = SORTED_ZALO_CODES.map((code) => {
  const escaped = escapeRegex(code);
  const lastChar = code[code.length - 1];

  let lookahead = '';
  if (/[a-zA-Z0-9]/.test(lastChar)) {
    lookahead = '(?![a-zA-Z0-9_])';
  } else if (code.endsWith('/')) {
    lookahead = '(?![/])';
  } else if (code.endsWith('\\')) {
    lookahead = '(?![\\\\])';
  }

  const lookbehind = '(?<![a-zA-Z0-9_])';
  return `(?:${lookbehind}${escaped}${lookahead})`;
});

const EMOJI_REGEX = new RegExp(EMOJI_PATTERNS.join('|'), 'g');

function convertPlainTextSegment(segment: string): string {
  EMOJI_REGEX.lastIndex = 0;
  return segment.replace(EMOJI_REGEX, (matched) => ZALO_CODE_TO_EMOJI[matched] ?? matched);
}

/** Chuyển đổi Zalo reaction code → Unicode emoji (dùng cho display) */
export function zaloCodeToEmoji(code: string): string {
  return ZALO_CODE_TO_EMOJI[code] ?? code;
}

/** Thay thế tất cả Zalo codes trong text bằng Unicode emoji (bảo vệ tuyệt đối URL, Email, File path) */
export function convertZaloEmojis(text: string): string {
  if (!text) return text;
  const direct = ZALO_CODE_TO_EMOJI[text];
  if (direct) return direct;

  // Nếu trong text không có bất kỳ ký tự trigger nào (: / - < = ; b B 8 | p P $ & ^ _)
  // thì bỏ qua luôn để đạt hiệu năng tối đa (fast path)
  if (!/[:/=<;bB8|pP$&^_]/.test(text)) return text;

  // Tách các đoạn được bảo vệ (URL, email, Windows path) để giữ nguyên vẹn 100%
  PROTECTED_TEXT_REGEX.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let result = '';

  while ((match = PROTECTED_TEXT_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result += convertPlainTextSegment(text.slice(lastIndex, match.index));
    }
    // Giữ nguyên đoạn được bảo vệ
    result += match[0];
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result += convertPlainTextSegment(text.slice(lastIndex));
  }

  return result;
}

/** Map Unicode emoji → Zalo reaction code (used when sending a reaction) */
export const EMOJI_TO_REACTION: Record<string, string> = {
  // Zalo's bar: 👍 ❤️ 😆 😮 😭 😡; 😄 / 😢 (the emoji used before) still send the same reactions
  '❤️': 'HEART', '👍': 'LIKE', '😆': 'HAHA', '😮': 'WOW', '😭': 'CRY', '😡': 'ANGRY',
  '😄': 'HAHA', '😢': 'CRY',
  '😘': 'KISS', '😂': 'TEARS_OF_JOY', '💩': 'SHIT', '🌹': 'ROSE', '💔': 'BROKEN_HEART',
  '👎': 'DISLIKE', '😍': 'LOVE', '👌': 'OK', '✌️': 'PEACE', '🙏': 'PRAY',
  '😉': 'WINK', '😕': 'CONFUSED', '😁': 'BIG_SMILE', '👊': 'PUNCH', '👋': 'BYE',
  '🫶': 'LOVE_YOU', '😎': 'COOL', '🎂': 'BIRTHDAY',
};

/** Extended emoji categories for the emoji picker */
export const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Phổ biến': ['😊', '😂', '❤️', '👍', '😮', '😢', '😡', '🔥', '👋', '🙏', '✌️', '😍', '😎', '🥰', '😜', '🤩', '😭', '🤗', '😇', '🤔', '😤', '🥳', '💪', '✅', '🎉', '💯', '🚀', '⭐', '🌈', '💙'],
  'Cảm xúc': ['😀', '😃', '😄', '😁', '😆', '🥹', '😅', '🤣', '🥲', '☺️', '😋', '😛', '😝', '🤑', '🤭', '🤫', '🤐', '🤨', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '🙂', '😌', '😔', '😪', '🤤', '😴'],
  'Trái tim': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❤️‍🔥', '❤️‍🩹', '💑', '💏', '🫂', '💋', '🫶', '🤲', '🙌', '👏', '🤝'],
  'Tay & Cử chỉ': ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '💪', '🦾', '🙏', '✍️', '🤳', '💅', '🤌', '👌', '🫰'],
  'Động vật': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🦋', '🐌'],
  'Đồ ăn': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍔', '🍕', '🌭', '🍟', '🍗', '🥩', '🍣', '🍜', '🍝', '🍰', '🎂', '🍩', '🍪', '☕', '🍺', '🥂'],
  'Hoạt động': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🏸', '🥊', '🎯', '🎮', '🎲', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵', '🎹', '🥇', '🏆', '🏅', '🎖️', '🎗️', '🎟️', '🎪', '🎠', '🎡', '🎢'],
  'Du lịch': ['✈️', '🚗', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🏍️', '🚲', '🛵', '🚀', '🛸', '🚁', '⛵', '🚢', '⛺', '🏠', '🏢', '🏰', '🗼', '🗽', '⛩️', '🕌', '🛕', '⛪'],
  'Đồ vật': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💿', '📷', '📹', '🎥', '📞', '☎️', '📺', '📻', '🎙️', '⏰', '⏱️', '⏲️', '🕰️', '💡', '🔦', '🏮', '📦', '💰', '💳', '💎', '⚖️', '🔧', '🔨'],
  'Biểu tượng': ['✨', '⚡', '🌟', '💫', '💥', '💢', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗯️', '💭', '💤', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🔶', '🔷', '🔸', '🔹', '▶️', '⏩'],
};

/** Flat array of all emojis for backward compatibility */
export const QUICK_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();
