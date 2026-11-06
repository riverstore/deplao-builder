/**
 * Chuẩn hoá chữ để tìm kiếm không phân biệt hoa / thường và dấu tiếng Việt: "Đào Vũ" → "dao vu".
 * SQLite LIKE chỉ bỏ qua hoa / thường với ký tự ASCII ("Đ" ≠ "đ") — DatabaseService đăng ký hàm này thành hàm SQL
 * `deplao_fold` để lọc trong DB.
 */
export function foldSearchText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Thoát ký tự đặc biệt của LIKE (dùng kèm `ESCAPE '\'`). */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Tách từ khoá thành các token tìm kiếm (đã bỏ dấu tiếng Việt, chữ thường, bỏ khoảng trắng).
 */
export function getSearchTokens(search: unknown): string[] {
  const folded = foldSearchText(search);
  return folded ? folded.split(/\s+/).filter(Boolean) : [];
}

/**
 * Kiểm tra xem một hoặc nhiều trường văn bản có chứa TẤT CẢ các từ trong tokens hay không.
 * Các từ không cần nằm cạnh nhau (hỗ trợ tìm kiếm từ không cạnh nhau: "an tha" khớp "An (THCS Vĩnh Thạnh)").
 */
export function matchesSearchTokens(target: unknown | unknown[], tokens: readonly string[]): boolean {
  if (!tokens || tokens.length === 0) return true;
  const targetStr = Array.isArray(target)
    ? target.map(foldSearchText).join(' ')
    : foldSearchText(target);
  for (let i = 0; i < tokens.length; i++) {
    if (!targetStr.includes(tokens[i])) return false;
  }
  return true;
}
