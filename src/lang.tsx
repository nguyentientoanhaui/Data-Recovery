import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'vi'

const en = {
  'title': 'Data Recovery Specialist — Video & Photo Repair',
  'nav.services': 'Services',
  'nav.journal': 'Case log',
  'nav.contact': 'Contact',
  'nav.menuAria': 'Toggle menu',
  'nav.langAria': 'Switch language',
  'hero.switch1': 'Recovery',
  'hero.switch2': 'Repair',
  'hero.line1': 'Bring back your memories',
  'hero.line2Prefix': 'frame by ',
  'hero.accent': 'frame',
  'hero.subtitle':
    'Data recovery for hard drives, SD cards, and camera media — plus repair of corrupted video and photos.',
  'hero.ctaText': 'No jargon. No lost causes. Just your files, back where they belong.',
  'hero.ctaTextMobile': 'No lost causes. Your files, back where they belong.',
  'hero.ctaButton': 'Request a recovery',
  'hero.eyebrow': 'Data Recovery Specialist · Video & Photo Repair',
  'hero.ctaSecondary': 'See case log',
  'hero.trust1': 'Free assessment',
  'hero.trust2': 'Read-only imaging',
  'hero.trust3': 'Fully confidential',
  'features.heading': 'Most corrupted files aren’t gone — they’re waiting to be recovered',
  'features.ctaText': 'Free assessment: send the file, get an honest answer.',
  'features.ctaButton': 'Request a recovery',
  'features.navAria': 'Services',
  'services.label': 'Services & case log',
  'features.data.title': 'Data Recovery',
  'features.data.desc':
    'Hard drives, SSDs, RAID arrays, SD cards, and USB media — deleted files, formatted partitions, failed drives, and inaccessible volumes. Read-only imaging first, always.',
  'features.crm.title': 'Video Repair',
  'features.crm.desc':
    'Corrupted MP4/MOV, partially downloaded clips, codec damage, and zero-byte files. Rebuilt headers and audio tracks so your footage plays again.',
  'features.m365.title': 'Photo Repair',
  'features.m365.desc':
    'Broken JPEG/RAW/HEIC, truncated writes, or unreadable cards. Reconstructed images and recovered previews, delivered exactly as captured.',
  'features.backup.title': 'Backup & Rescue',
  'features.backup.desc':
    'Scheduled, tested, offline copies — plus emergency imaging when disaster already happened. Your next worst day becomes boring.',
  'journal.headingPrefix': 'A quiet record of ',
  'journal.accent': 'files saved',
  'journal.label': 'Case log',
  'journal.statement':
    'Every entry below is a finished recovery — not a promise. Newest first.',
  'journal.ctaText': 'Have a file that won’t open?',
  'journal.e1.date': 'Oct 2025',
  'journal.e1.title': 'Recovered 400GB from an unreadable SD card',
  'journal.e1.desc':
    'A photographer’s card stopped mounting mid-shoot. Imaged read-only, rebuilt the partition table, and recovered every raw shot — 400GB, nothing missing.',
  'journal.e1.tag': 'Media Recovery',
  'journal.e2.date': 'Sep 2025',
  'journal.e2.title': 'Repaired a wedding video that wouldn’t play',
  'journal.e2.desc':
    'A partially written MP4 with a missing index. Rebuilt the moov atom, resynced audio, and handed back the full ceremony in playable form.',
  'journal.e2.tag': 'Video Repair',
  'journal.e3.date': 'Aug 2025',
  'journal.e3.title': 'Rebuilt a corrupted RAW series from a dead card',
  'journal.e3.desc':
    'Two weeks of RAW files with broken headers. Reconstructed each image from its embedded data — the client got their entire shoot back.',
  'journal.e3.tag': 'Photo Repair',
  'journal.e4.date': 'Jul 2025',
  'journal.e4.title': 'Imaged a dying drive before it gave up',
  'journal.e4.desc':
    'A failing 2TB drive clicking under load. Cloned it sector-by-sector to a healthy disk — then recovered everything from the clone, one pass, no re-runs.',
  'journal.e4.tag': 'Drive Imaging',
  'footer.headlinePrefix': "Let's bring your files ",
  'footer.accent': 'back',
  'footer.sub':
    'Hard drive and media recovery, video repair, and photo reconstruction — calm, thorough, private.',
  'footer.button': 'Say hello',
}

export type TKey = keyof typeof en

const vi: Record<TKey, string> = {
  'title': 'Chuyên gia khôi phục dữ liệu — Sửa video & ảnh',
  'nav.services': 'Dịch vụ',
  'nav.journal': 'Nhật ký ca',
  'nav.contact': 'Liên hệ',
  'nav.menuAria': 'Mở/đóng menu',
  'nav.langAria': 'Đổi ngôn ngữ',
  'hero.switch1': 'Khôi phục',
  'hero.switch2': 'Sửa chữa',
  'hero.line1': 'Mang lại ký ức của bạn',
  'hero.line2Prefix': 'từng khung ',
  'hero.accent': 'hình',
  'hero.subtitle':
    'Khôi phục dữ liệu cho ổ cứng, thẻ SD và phương tiện máy ảnh — cùng sửa video và ảnh bị hỏng.',
  'hero.ctaText': 'Không thuật ngữ rắc rối. Không ca vô vọng. Chỉ tệp của bạn trở về đúng chỗ.',
  'hero.ctaTextMobile': 'Không ca vô vọng. Tệp của bạn trở về đúng chỗ.',
  'hero.ctaButton': 'Yêu cầu khôi phục',
  'hero.eyebrow': 'Chuyên gia khôi phục dữ liệu · Sửa video & ảnh',
  'hero.ctaSecondary': 'Xem nhật ký ca',
  'hero.trust1': 'Thẩm định miễn phí',
  'hero.trust2': 'Sao lưu chỉ đọc',
  'hero.trust3': 'Bảo mật tuyệt đối',
  'features.heading': 'Hầu hết tệp bị hỏng không biến mất — chúng đang chờ được khôi phục',
  'features.ctaText': 'Thẩm định miễn phí: gửi tệp, nhận câu trả lời trung thực.',
  'features.ctaButton': 'Yêu cầu khôi phục',
  'features.navAria': 'Dịch vụ',
  'services.label': 'Dịch vụ & nhật ký ca',
  'features.data.title': 'Phục hồi dữ liệu',
  'features.data.desc':
    'Ổ cứng, SSD, mảng RAID, thẻ SD và USB — tệp đã xóa, phân vùng đã format, ổ hỏng và phân vùng không truy cập được. Luôn tạo bản sao chỉ đọc trước tiên.',
  'features.crm.title': 'Sửa video',
  'features.crm.desc':
    'MP4/MOV bị hỏng, clip tải dở, lỗi codec và tệp 0 byte. Dựng lại header và đường tiếng để cảnh quay phát lại được.',
  'features.m365.title': 'Sửa ảnh',
  'features.m365.desc':
    'JPEG/RAW/HEIC vỡ, ghi dở hoặc thẻ không đọc được. Tái tạo hình ảnh và lấy lại ảnh xem trước, trả về đúng như khi chụp.',
  'features.backup.title': 'Sao lưu & Cứu hộ',
  'features.backup.desc':
    'Bản sao có lịch trình, kiểm thử, lưu offline — cùng ứng cứu khẩn cấp khi đã xảy ra sự cố. Ngày tồi tệ nhất kế tiếp sẽ trở nên buồn tẻ.',
  'journal.headingPrefix': 'Ghi chép nhỏ về những ',
  'journal.accent': 'tệp đã cứu',
  'journal.label': 'Nhật ký ca',
  'journal.statement': 'Mỗi mục dưới đây là một ca khôi phục đã hoàn thành — không phải lời hứa. Mới nhất trước.',
  'journal.ctaText': 'Có tệp nào không mở được không?',
  'journal.e1.date': 'Thg 10, 2025',
  'journal.e1.title': 'Khôi phục 400GB từ thẻ SD không đọc được',
  'journal.e1.desc':
    'Thẻ của một nhiếp ảnh gia dừng hoạt động giữa buổi chụp. Tạo bản sao chỉ đọc, dựng lại bảng phân vùng và lấy lại mọi ảnh RAW — 400GB, không thiếu tấm nào.',
  'journal.e1.tag': 'Khôi phục phương tiện',
  'journal.e2.date': 'Thg 9, 2025',
  'journal.e2.title': 'Sửa video đám cưới không phát được',
  'journal.e2.desc':
    'Tệp MP4 ghi dở và mất mục lục. Dựng lại khối moov, đồng bộ lại âm thanh và trả về toàn bộ buổi lễ dưới dạng phát được.',
  'journal.e2.tag': 'Sửa video',
  'journal.e3.date': 'Thg 8, 2025',
  'journal.e3.title': 'Tái tạo chuỗi ảnh RAW hỏng từ thẻ chết',
  'journal.e3.desc':
    'Hai tuần ảnh RAW bị vỡ header. Tái tạo từng ảnh từ dữ liệu nhúng — khách hàng nhận lại trọn bộ ảnh buổi chụp.',
  'journal.e3.tag': 'Sửa ảnh',
  'journal.e4.date': 'Thg 7, 2025',
  'journal.e4.title': 'Tạo bản sao ổ cứng sắp chết trước khi nó buông xuôi',
  'journal.e4.desc':
    'Ổ 2TB đang vào tiếng lạch cạch khi tải. Nhân bản từng sector sang ổ khỏe mạnh — sau đó khôi phục mọi thứ từ bản sao, một lần duy nhất.',
  'journal.e4.tag': 'Nhân bản ổ',
  'footer.headlinePrefix': 'Hãy mang tệp của bạn ',
  'footer.accent': 'trở về',
  'footer.sub': 'Khôi phục ổ cứng và phương tiện, sửa video, tái tạo ảnh — thận trọng, kỹ lưỡng, riêng tư.',
  'footer.button': 'Gửi lời chào',
}

const dicts: Record<Lang, Record<TKey, string>> = { en, vi }

interface Ctx {
  lang: Lang
  t: (key: TKey) => string
  setLang: (lang: Lang) => void
  toggle: () => void
}

const LangContext = createContext<Ctx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('lang')
      if (saved === 'en' || saved === 'vi') return saved
    }
    return 'en'
  })

  useEffect(() => {
    try {
      window.localStorage.setItem('lang', lang)
    } catch {
      /* storage unavailable — ignore */
    }
  }, [lang])

  const value: Ctx = {
    lang,
    t: (key) => dicts[lang][key],
    setLang,
    toggle: () => setLang((prev) => (prev === 'en' ? 'vi' : 'en')),
  }

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within a LangProvider')
  return ctx
}
