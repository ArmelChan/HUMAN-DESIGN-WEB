import { readFileSync } from 'node:fs';
import { TERMS_SECTIONS, TERMS_META } from '../data/legal/terms';
import { PRIVACY_SECTIONS, DATA_FLOWS } from '../data/legal/privacy';
import { COPYRIGHT_SECTIONS, CONTENT_CLASSES } from '../data/legal/copyright';
import { OPERATOR_FIELDS, PENDING_LABEL, unresolvedOperatorFields } from '../data/legal/operator';
import { ASSETS, assetSummary } from '../data/legal/assets';
import { THIRD_PARTY_LICENSES } from '../data/licenses.generated';
import { clearAll, makeRecord, needsAcceptance, readConsent, writeConsent, STORAGE_KEYS, TERMS_VERSION, DEFAULT_CHOICES, type KeyValueStore } from './consent';

const text = (secs: { paragraphs: string[] }[]) => secs.flatMap((s) => s.paragraphs).join('\n');

describe('使用條款', () => {
  const t = text(TERMS_SECTIONS);
  it('涵蓋規格要求的主題', () => {
    for (const k of ['服務性質', '非專業服務', '執行', '準確性', '使用者責任', '責任', '未成年', '更新與聯絡']) {
      expect(TERMS_SECTIONS.map((s) => s.title).join('')).toContain(k);
    }
  });
  it('不含禁止的免責寫法', () => {
    expect(t).not.toMatch(/概不負責|一切後果|放棄一切|放棄所有.*權利|不承擔任何責任/);
  });
  it('明確保留法定責任與消費者權利', () => {
    expect(t).toMatch(/不排除或限制依適用法律不得排除或限制的任何責任/);
    expect(t).toMatch(/消費者權利/);
  });
  it('不宣稱已審閱或保證有效，標示為草稿', () => {
    expect(TERMS_META.status).toMatch(/草稿/);
    expect(t).not.toMatch(/律師已審閱|經律師審核|保證有效/);
  });
  it('未確認的營運者欄位顯示待填，不虛構電郵或司法管轄區', () => {
    expect(t).toContain(PENDING_LABEL);
    expect(t).not.toMatch(/@[a-z0-9-]+\.[a-z]/i);
    expect(t).not.toMatch(/(香港|台灣|中華民國|英國|美國|新加坡)法律/);
  });
});

describe('隱私聲明', () => {
  const t = text(PRIVACY_SECTIONS);
  it('與條款分開，說明 AI、本機保存、網址與主控台', () => {
    expect(PRIVACY_SECTIONS.length).toBeGreaterThan(4);
    expect(t).toMatch(/沒有任何 AI 功能/);
    expect(t).toMatch(/本機保存預設關閉/);
    expect(t).toMatch(/網址中不會帶出生資料/);
    expect(t).toMatch(/主控台/);
    expect(DATA_FLOWS.length).toBeGreaterThanOrEqual(4);
  });
  it('不虛構供應商的不保存或不訓練承諾', () => {
    expect(t).not.toMatch(/零保留|不會用於訓練/);
  });
  it('隱私聲明的描述與程式現況一致：原始碼中沒有 cookie、console、fetch 或分析工具', () => {
    const files = ['src/pages/Chart.tsx', 'src/App.tsx', 'src/lib/consent.ts', 'src/lib/chart.ts', 'src/main.tsx', 'src/components/ReportView.tsx', 'src/components/ConsentPanel.tsx'];
    for (const f of files) {
      let src = '';
      try {
        src = readFileSync(f, 'utf8');
      } catch {
        continue;
      }
      expect(src, f).not.toMatch(/document\.cookie|console\.(log|info|warn|error|debug)|fetch\(|XMLHttpRequest|sendBeacon|gtag|analytics/);
    }
  });
});

describe('版權與素材登錄', () => {
  it('九類內容分開說明', () => expect(CONTENT_CLASSES).toHaveLength(9));
  it('不宣稱重繪即不侵權，並說明註明來源不等於授權', () => {
    const t = text(COPYRIGHT_SECTIONS);
    expect(t).toMatch(/註明來源不等於取得授權/);
    expect(t).toMatch(/並不保證一定不侵權/);
    expect(t).not.toMatch(/(本站|我們)(保證|確定|確保)(一定)?不侵權/);
  });
  it('每筆素材都有必要欄位', () => {
    for (const a of ASSETS) {
      for (const k of ['name', 'rightsHolder', 'license', 'evidence', 'attribution', 'scope', 'checkedAt'] as const) expect(a[k], `${a.id}.${k}`).toBeTruthy();
      expect(['confirmed', 'pending']).toContain(a.status);
    }
  });
  it('打包的開源套件：登錄、授權全文與 node_modules 的實際授權三者一致', () => {
    for (const lic of THIRD_PARTY_LICENSES) {
      const asset = ASSETS.find((a) => a.id === lic.name);
      expect(asset, lic.name).toBeDefined();
      expect(asset!.license).toBe(lic.license);
      const pkg = JSON.parse(readFileSync(`node_modules/${lic.name}/package.json`, 'utf8'));
      expect(pkg.license).toBe(lic.license);
      expect(pkg.version).toBe(lic.version);
      expect(lic.text).toMatch(/Copyright/);
    }
  });
  it('權利未確認的項目標為待確認，不標為已確認', () => {
    for (const id of ['gate-keynotes', 'channel-names', 'bodygraph-layout', 'human-design-mark', 'gate-wheel-order']) {
      expect(ASSETS.find((a) => a.id === id)!.status).toBe('pending');
    }
    expect(assetSummary().pending).toBeGreaterThan(0);
  });
});

describe('營運者欄位', () => {
  it('未知欄位為 null，並列為待辦', () => {
    expect(OPERATOR_FIELDS.find((f) => f.key === 'legalName')!.value).toBeNull();
    expect(OPERATOR_FIELDS.find((f) => f.key === 'governingLaw')!.value).toBeNull();
    expect(unresolvedOperatorFields().length).toBeGreaterThan(5);
  });
});

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('同意紀錄', () => {
  it('四項同意分開；預設都未勾選；AI 與行銷為 not_offered', () => {
    expect(DEFAULT_CHOICES).toEqual({ termsAccepted: false, localSave: false, aiTransfer: 'not_offered', marketing: 'not_offered' });
  });
  it('只記錄條款版本與接受時間', () => {
    const r = makeRecord(new Date('2026-10-29T00:00:00Z'));
    expect(Object.keys(r).sort()).toEqual(['acceptedAt', 'termsVersion']);
  });
  it('條款版本更新後需要重新接受', () => {
    const s = memoryStore();
    writeConsent(s, makeRecord(new Date(), 'terms-draft-0.0'));
    expect(needsAcceptance(readConsent(s))).toBe(true);
    writeConsent(s, makeRecord(new Date(), TERMS_VERSION));
    expect(needsAcceptance(readConsent(s))).toBe(false);
  });
  it('損壞的紀錄視為未接受', () => {
    const s = memoryStore();
    s.setItem(STORAGE_KEYS.consent, '{bad json');
    expect(needsAcceptance(readConsent(s))).toBe(true);
  });
  it('清除會刪掉本站所有本機資料', () => {
    const s = memoryStore();
    for (const k of Object.values(STORAGE_KEYS)) s.setItem(k, 'x');
    s.setItem('other-site-key', 'keep');
    expect(clearAll(s).sort()).toEqual(Object.values(STORAGE_KEYS).sort());
    expect([...s.data.keys()]).toEqual(['other-site-key']);
  });
  it('沒有可用的儲存空間時不會出錯', () => {
    expect(readConsent(null)).toBeNull();
    expect(writeConsent(null, makeRecord(new Date()))).toBe(false);
    expect(clearAll(null)).toEqual([]);
  });
});
