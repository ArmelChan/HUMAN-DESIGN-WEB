// 規則實驗室的教學示例。每個示例只是依規則挑選的閘門組合，
// 用來展示判定規則如何運作，不是任何真實人物的人類圖，也不是由出生資料算出。

export interface LabPreset {
  id: string;
  label: string;
  gates: number[];
  purpose: string;
}

export const LAB_PRESETS: LabPreset[] = [
  {
    id: 'empty',
    label: '全部清空',
    gates: [],
    purpose: '沒有任何閘門：九個中心都是完全開放，依規則為反映者。',
  },
  {
    id: 'hanging',
    label: '只有懸掛閘門',
    gates: [34, 61, 30, 12],
    purpose: '有閘門但沒有完整通道：相關中心變成「未定義」而非完全開放，類型仍是反映者。',
  },
  {
    id: 'generator',
    label: '生產者示例',
    gates: [5, 15],
    purpose: '薦骨經 5-15 連到 G，沒有動力中心連到喉嚨。',
  },
  {
    id: 'mg-emotional',
    label: '顯示生產者＋情緒權威',
    gates: [20, 34, 6, 59],
    purpose: '薦骨直接連喉嚨；情緒中心也有定義，所以權威是情緒而非薦骨。',
  },
  {
    id: 'manifestor',
    label: '顯示者示例',
    gates: [21, 45],
    purpose: '薦骨沒有定義，意志力中心經 21-45 直接連到喉嚨。',
  },
  {
    id: 'projector-split',
    label: '投射者＋二分定義',
    gates: [7, 31, 64, 47],
    purpose: 'G 連喉嚨、頭頂連邏輯，兩群互不相連，形成二分定義；權威為自我投射。',
  },
  {
    id: 'projector-mental',
    label: '投射者＋環境權威',
    gates: [43, 23],
    purpose: '定義只在邏輯與喉嚨之間，依規則沒有內在權威。',
  },
];
