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

/** Chuyển đổi Zalo reaction code → Unicode emoji (dùng cho display) */
export function zaloCodeToEmoji(code: string): string {
  return ZALO_CODE_TO_EMOJI[code] ?? code;
}

/** Replaces all Zalo codes in the text with Unicode emoji */
export function convertZaloEmojis(text: string): string {
  if (!text) return text;
  const direct = ZALO_CODE_TO_EMOJI[text];
  if (direct) return direct;
  let result = text;
  for (const code of SORTED_ZALO_CODES) {
    if (result.includes(code)) {
      result = result.split(code).join(ZALO_CODE_TO_EMOJI[code]);
    }
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
