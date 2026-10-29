// 報告匯出：產生獨立的 HTML 與純文字。必要提示（聲明、限制、驗證狀態、來源、使用範圍）一律包含，不能關閉。

import { AREA_LABEL } from '../data/content/reflection';
import type { Provenance } from './chart';
import type { Report } from './report';

export type ReflectionAnswer = 'agree' | 'disagree' | 'unsure';

export interface ReflectionEntry {
  answer: ReflectionAnswer | null;
  example: string;
  counterExample: string;
}

export const ANSWER_LABEL: Record<ReflectionAnswer, string> = {
  agree: '符合',
  disagree: '不符合',
  unsure: '不確定',
};

export interface ExportOptions {
  /** 使用者自訂的報告標題，只出現在檔首，不影響任何內容。 */
  title?: string;
  includeReflection: boolean;
  reflection: Record<string, ReflectionEntry>;
  provenance: Provenance | null;
  birthSummary: string;
  generatedAt: Date;
}

export const USAGE_NOTE =
  '使用範圍：可作個人保存、列印與分享；商業轉售或再發布的權限尚未由營運者決定，目前不授予。報告中第三方的名稱、規則資料與授權內容屬於各自的權利人。';
export const BIRTH_DATA_WARNING = '這份報告含有出生資料。分享前請確認你願意讓對方看到。';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface Block {
  heading: string;
  lines: string[];
}

export function reportBlocks(report: Report, opts: ExportOptions): Block[] {
  const blocks: Block[] = [];
  blocks.push({ heading: '重要說明', lines: [report.notice, BIRTH_DATA_WARNING] });
  blocks.push({ heading: '1. 圖表計算結果', lines: [opts.birthSummary, ...report.calculation.map((i) => `${i.heading}：${i.text}`)] });
  blocks.push({ heading: '2. 人類圖體系解釋', lines: report.system.map((i) => `【${i.heading}】${i.text}（依據：${i.basis}）`) });
  const refl = report.reflection.map((p) => {
    const e = opts.reflection[p.id];
    const base = `［${AREA_LABEL[p.area]}］${p.text}`;
    if (!opts.includeReflection || !e) return base;
    const parts = [base];
    if (e.answer) parts.push(`　你的回應：${ANSWER_LABEL[e.answer]}`);
    if (e.example.trim()) parts.push(`　例子：${e.example.trim()}`);
    if (e.counterExample.trim()) parts.push(`　反例：${e.counterExample.trim()}`);
    return parts.join('\n');
  });
  blocks.push({
    heading: '3. 自我觀察與反思',
    lines: ['這些問題不計分、不是量表，也不會得出任何判定。你的回應不會改變計算結果。', ...refl],
  });
  const h = report.health;
  blocks.push({
    heading: '4. 一般健康與心理教育（不依圖表個人化）',
    lines: [h.intro, ...h.practices, h.mentalHealth, ...h.seekHelp, h.chartBoundary, ...h.bodyClaims.map((b) => b.text)].filter(Boolean),
  });
  blocks.push({ heading: '5. 象徵性人生方向', lines: report.direction.map((i) => `【${i.heading}】${i.text}`) });
  blocks.push({ heading: '6. 計算與解讀限制', lines: report.limits });
  const prov = opts.provenance
    ? [
        `星曆引擎：${opts.provenance.engine.name} ${opts.provenance.engine.version}（${opts.provenance.engine.license}）`,
        `規則表：${opts.provenance.rules.version}；起點 ${opts.provenance.rules.startLongitude}°`,
        `人格 UTC：${opts.provenance.birthUtc}；設計 UTC：${opts.provenance.designUtc}`,
        `設計時刻求根殘差：${opts.provenance.solver.residualDeg.toExponential(2)}°`,
        `外部驗證：${opts.provenance.externalValidation}`,
      ]
    : ['只知道出生日期：沒有單一的計算時刻，因此沒有計算紀錄。'];
  blocks.push({
    heading: '7. 來源與版權',
    lines: [...prov, ...report.sources.map((s) => (s.url ? `${s.label}　${s.url}` : s.label)), USAGE_NOTE, `報告版本：${report.version}`],
  });
  blocks.push({ heading: '再次提醒', lines: [report.notice] });
  return blocks;
}

export function reportToText(report: Report, opts: ExportOptions): string {
  const head = [opts.title?.trim() || '人類圖個人報告', `產生時間：${opts.generatedAt.toISOString()}`];
  return [...head, '', ...reportBlocks(report, opts).flatMap((b) => [`■ ${b.heading}`, ...b.lines, ''])].join('\n');
}

export function reportToHtml(report: Report, opts: ExportOptions): string {
  const title = esc(opts.title?.trim() || '人類圖個人報告');
  const body = reportBlocks(report, opts)
    .map((b) => `<section><h2>${esc(b.heading)}</h2>${b.lines.map((l) => `<p>${esc(l).replace(/\n/g, '<br>')}</p>`).join('')}</section>`)
    .join('\n');
  return `<!doctype html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>body{font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;line-height:1.8;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#1f1d1a;background:#fff}h1{font-size:1.6rem}h2{font-size:1.15rem;margin-top:2rem;border-bottom:1px solid #ccc}section:first-of-type{border:2px solid #c8773b;padding:0 1rem;border-radius:8px}</style>
</head><body>
<h1>${title}</h1>
<p>產生時間：${esc(opts.generatedAt.toISOString())}</p>
${body}
</body></html>
`;
}
