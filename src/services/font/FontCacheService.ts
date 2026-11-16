import { app, net } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import Logger from '../../utils/Logger';

/**
 * Tải phông chữ từ Google Fonts một lần rồi lưu CSS (file phông nhúng dạng data:) vào thư mục dữ liệu app.
 * Nhúng data: vì CSP của cửa sổ chỉ cho font-src 'self' data: https: — không đọc được qua local-media://.
 */

// Tên phông Google Fonts chỉ gồm chữ, số, khoảng trắng — chặn ký tự lạ trước khi ghép vào URL / tên file
const FAMILY_RE = /^[A-Za-z0-9][A-Za-z0-9 ]{0,63}$/;
// Chỉ giữ bộ ký tự cần cho tiếng Việt + Latin để file CSS nhỏ
const KEEP_SUBSETS = new Set(['latin', 'latin-ext', 'vietnamese']);
// User-Agent trình duyệt mới để Google trả woff2
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 20_000;

function normalizeFamily(family: string): string {
    const name = String(family || '').trim().replace(/\s+/g, ' ');
    if (!FAMILY_RE.test(name)) throw new Error('Tên phông chữ không hợp lệ (chỉ gồm chữ, số và khoảng trắng)');
    return name;
}

function cacheFile(name: string): string {
    return path.join(app.getPath('userData'), 'fonts', `${name.toLowerCase().replace(/ /g, '-')}.css`);
}

async function fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        return await net.fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function fetchGoogleCss(name: string): Promise<string> {
    const family = encodeURIComponent(name).replace(/%20/g, '+');
    // Một số phông không có đủ 400–700 → Google trả 400, thử lại không chỉ định độ đậm
    for (const query of [`${family}:wght@400;500;600;700`, family]) {
        const res = await fetchWithTimeout(`https://fonts.googleapis.com/css2?family=${query}&display=swap`);
        if (res.ok) return await res.text();
        if (res.status !== 400) throw new Error(`Google Fonts trả lỗi ${res.status}`);
    }
    throw new Error(`Không tìm thấy phông "${name}" trên Google Fonts`);
}

async function inlineFontFiles(css: string): Promise<string> {
    // Google ghi tên bộ ký tự trong comment ngay trước mỗi @font-face: /* vietnamese */ @font-face {...}
    const blocks: string[] = [];
    const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) {
        if (KEEP_SUBSETS.has(m[1])) blocks.push(m[2]);
    }
    // Phông không chia bộ ký tự (không có comment) → giữ toàn bộ @font-face
    if (blocks.length === 0) blocks.push(...(css.match(/@font-face\s*\{[^}]*\}/g) || []));
    if (blocks.length === 0) throw new Error('Phản hồi của Google Fonts không có phông nào');

    const out: string[] = [];
    for (const block of blocks) {
        let inlined = block;
        for (const urlMatch of block.matchAll(/url\((https:\/\/[^)]+)\)/g)) {
            const fileUrl = urlMatch[1];
            if (new URL(fileUrl).hostname !== 'fonts.gstatic.com') throw new Error('URL phông chữ không thuộc Google Fonts');
            const res = await fetchWithTimeout(fileUrl);
            if (!res.ok) throw new Error(`Tải file phông lỗi ${res.status}`);
            const data = Buffer.from(await res.arrayBuffer()).toString('base64');
            const mime = fileUrl.endsWith('.woff2') ? 'font/woff2' : fileUrl.endsWith('.woff') ? 'font/woff' : 'font/ttf';
            inlined = inlined.replace(fileUrl, `data:${mime};base64,${data}`);
        }
        out.push(inlined);
    }
    return out.join('\n');
}

/** Trả CSS @font-face của phông (đã lưu trên máy thì đọc lại, không gọi mạng) */
export async function ensureGoogleFont(family: string): Promise<{ family: string; css: string; cached: boolean }> {
    const name = normalizeFamily(family);
    const file = cacheFile(name);
    if (fs.existsSync(file)) {
        return { family: name, css: fs.readFileSync(file, 'utf8'), cached: true };
    }
    const css = await inlineFontFiles(await fetchGoogleCss(name));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, css, 'utf8');
    Logger.log(`[FontCache] Đã tải và lưu phông "${name}" (${Math.round(css.length / 1024)} KB)`);
    return { family: name, css, cached: false };
}
