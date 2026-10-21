// Icon từ Material Icon Theme (MIT), một số đổi sang màu thương hiệu — xem src/assets/file-icons/README.md
import pdfIcon from '../../../assets/file-icons/pdf.svg';
import wordIcon from '../../../assets/file-icons/word.svg';
import excelIcon from '../../../assets/file-icons/excel.svg';
import powerpointIcon from '../../../assets/file-icons/powerpoint.svg';
import imageIcon from '../../../assets/file-icons/image.svg';
import videoIcon from '../../../assets/file-icons/video.svg';
import audioIcon from '../../../assets/file-icons/audio.svg';
import zipIcon from '../../../assets/file-icons/zip.svg';
import exeIcon from '../../../assets/file-icons/exe.svg';
import androidIcon from '../../../assets/file-icons/android.svg';
import discIcon from '../../../assets/file-icons/disc.svg';
import codeIcon from '../../../assets/file-icons/code.svg';
import textIcon from '../../../assets/file-icons/text.svg';
import fileIcon from '../../../assets/file-icons/file.svg';

const FILE_TYPE_ICONS: Array<[string, string[]]> = [
  [pdfIcon, ['pdf']],
  [wordIcon, ['doc', 'docx', 'docm', 'dot', 'dotx', 'odt', 'rtf']],
  [excelIcon, ['xls', 'xlsx', 'xlsm', 'xlsb', 'csv', 'ods']],
  [powerpointIcon, ['ppt', 'pptx', 'pptm', 'pps', 'ppsx', 'odp']],
  [imageIcon, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif', 'svg', 'tif', 'tiff', 'psd', 'ai']],
  [videoIcon, ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v', '3gp']],
  [audioIcon, ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma', 'amr', 'opus']],
  [zipIcon, ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz']],
  [exeIcon, ['exe', 'msi', 'bat', 'cmd']],
  [androidIcon, ['apk', 'xapk', 'aab']],
  [discIcon, ['iso', 'dmg', 'img']],
  [codeIcon, ['js', 'ts', 'json', 'html', 'css', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'xml', 'sql', 'sh']],
  [textIcon, ['txt', 'md', 'log']],
];

/** URL icon theo đuôi file (ưu tiên `fileExt` Zalo gửi kèm, nếu không thì lấy từ tên file) */
export function fileTypeIconSrc(fileName: string, fileExt?: string): string {
  const ext = String(fileExt || (fileName.includes('.') ? fileName.split('.').pop() : '') || '')
    .replace(/^\./, '')
    .toLowerCase();
  return FILE_TYPE_ICONS.find(([, exts]) => exts.includes(ext))?.[0] ?? fileIcon;
}
