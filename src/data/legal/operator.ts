// 營運者資訊。未知欄位一律為 null，介面顯示「待營運者填寫」；不得自行填入推測值。
// 完整待辦清單見 docs/OPERATOR_TODO.md。

export interface OperatorField {
  key: string;
  label: string;
  value: string | null;
  note: string;
}

export const OPERATOR_FIELDS: OperatorField[] = [
  { key: 'legalName', label: '營運者名稱（個人或公司）', value: null, note: '條款與隱私聲明的責任主體。' },
  { key: 'contact', label: '聯絡方式（電郵或表單）', value: null, note: '一般聯絡、隱私請求與條款問題。' },
  { key: 'copyrightContact', label: '侵權通知聯絡方式', value: null, note: '權利人提出通知的管道。' },
  { key: 'address', label: '營運地址或登記地', value: null, note: '依適用法律可能為必要資訊。' },
  { key: 'serviceRegions', label: '服務地區', value: null, note: '決定適用的消費者與個資法規。' },
  { key: 'governingLaw', label: '準據法與管轄', value: null, note: '未確認前，條款不寫入任何司法管轄區。' },
  { key: 'pricing', label: '收費模式', value: '目前沒有任何收費、付款或訂閱功能（依程式現況）。', note: '若日後收費，須另行補充消費者權利、退款與付款條款。' },
  { key: 'minimumAge', label: '最低使用年齡與監護安排', value: null, note: '本站提出的產品限制見條款第 7 節，須由營運者依服務地區法律確認。' },
  { key: 'effectiveDate', label: '條款生效日期', value: null, note: '草稿未生效。' },
  { key: 'changeNotice', label: '重大變更的通知方式', value: null, note: '本站沒有帳號或電郵名單，目前只能以網站公告與重新同意的方式通知。' },
  { key: 'commercialReuse', label: '報告的商業再發布權限', value: null, note: '未決定前，條款不授予任何商業權限。' },
  { key: 'hosting', label: '網站託管服務與其資料處理', value: null, note: '託管者可能依其政策記錄連線資訊（例如 IP 位址）；須由營運者確認實際託管方與其政策。' },
];

export const PENDING_LABEL = '［待營運者填寫］';

export function operatorValue(key: string): string {
  const f = OPERATOR_FIELDS.find((x) => x.key === key);
  return f?.value ?? PENDING_LABEL;
}

export const unresolvedOperatorFields = () => OPERATOR_FIELDS.filter((f) => f.value === null).map((f) => f.label);
