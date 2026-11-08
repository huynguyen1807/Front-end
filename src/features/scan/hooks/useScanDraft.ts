import { useEffect, useRef, useState } from 'react';
import { ScanReviewSession } from '../types/scan';
import { decodeScanDraft, readScanDraft, scanDraftKey, writeScanDraft } from '../services/scanDraftStorage';

export function useScanDraft(review: ScanReviewSession | null, onRestore: (draft: ScanReviewSession) => void) {
  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const restore = useRef(onRestore); restore.current = onRestore;
  const latest = useRef(review); latest.current = review;
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const draftKey = await scanDraftKey();
        if (!active) return;
        setKey(draftKey);
        if (draftKey) {
          const text = await readScanDraft(draftKey);
          const draft = text ? decodeScanDraft(text) : null;
          if (active && draft && !latest.current) { latest.current = draft; restore.current(draft); }
        }
      } catch { if (active) setWarning('Chưa đọc được nháp trên thiết bị. Danh sách hiện tại vẫn có thể sử dụng.'); }
      finally { if (active) setReady(true); }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready || !key) return;
    const timer = setTimeout(() => { void writeScanDraft(key, latest.current).catch(() => setWarning('Chưa lưu được nháp trên thiết bị. Giữ màn hình này mở để tránh mất món chưa lưu.')); }, 350);
    return () => clearTimeout(timer);
  }, [ready, key, review]);
  useEffect(() => () => { if (key) void writeScanDraft(key, latest.current).catch(() => {}); }, [key]);
  return { ready, warning };
}
