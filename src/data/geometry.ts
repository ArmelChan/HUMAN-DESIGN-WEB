// BodyGraph 示意幾何（viewBox 0 0 400 700）。
// 中心的相對位置與閘門所在的邊依照常見的 BodyGraph 版面，
// 但比例與座標是本站自行繪製的示意，不是官方圖譜的精確複製。

import type { CenterId } from './structure';

export interface Point {
  x: number;
  y: number;
}

export interface CenterShape {
  points: Point[];
  label: Point;
}

const p = (x: number, y: number): Point => ({ x, y });

export const VIEWBOX = { width: 400, height: 700 };

export const GEOMETRY: Record<CenterId, CenterShape> = {
  head: { points: [p(200, 18), p(245, 92), p(155, 92)], label: p(200, 60) },
  ajna: { points: [p(155, 118), p(245, 118), p(200, 196)], label: p(132, 150) },
  throat: { points: [p(158, 222), p(242, 222), p(242, 300), p(158, 300)], label: p(200, 265) },
  g: { points: [p(200, 320), p(248, 368), p(200, 416), p(152, 368)], label: p(200, 372) },
  heart: { points: [p(280, 380), p(314, 436), p(246, 436)], label: p(272, 453) },
  spleen: { points: [p(30, 416), p(128, 481), p(30, 546)], label: p(60, 485) },
  solarPlexus: { points: [p(370, 416), p(370, 546), p(272, 481)], label: p(340, 485) },
  sacral: { points: [p(158, 470), p(242, 470), p(242, 546), p(158, 546)], label: p(200, 512) },
  root: { points: [p(158, 602), p(242, 602), p(242, 680), p(158, 680)], label: p(200, 646) },
};

/** 每個閘門在中心邊緣上的錨點；通道線從這裡出發。 */
export const GATE_POINTS: Record<number, Point> = {
  // 頭頂
  64: p(178, 88), 61: p(200, 88), 63: p(222, 88),
  // 邏輯
  47: p(178, 122), 24: p(200, 122), 4: p(222, 122),
  17: p(184, 160), 43: p(200, 189), 11: p(216, 160),
  // 喉嚨
  62: p(178, 225), 23: p(200, 225), 56: p(222, 225),
  16: p(161, 242), 20: p(161, 282),
  35: p(239, 238), 12: p(239, 260), 45: p(239, 282),
  31: p(178, 297), 8: p(200, 297), 33: p(222, 297),
  // G
  1: p(200, 324), 7: p(179, 346), 13: p(221, 346),
  10: p(156, 368), 25: p(244, 368),
  15: p(179, 390), 2: p(200, 412), 46: p(221, 390),
  // 意志力
  21: p(280, 388), 51: p(263, 408), 26: p(256, 433), 40: p(304, 433),
  // 直覺
  48: p(50, 432), 57: p(71, 446), 44: p(93, 460), 50: p(113, 474),
  32: p(107, 491), 28: p(84, 507), 18: p(60, 523),
  // 情緒
  36: p(350, 432), 22: p(329, 446), 37: p(307, 460), 6: p(287, 474),
  49: p(293, 491), 55: p(316, 507), 30: p(340, 523),
  // 薦骨
  5: p(178, 473), 14: p(200, 473), 29: p(222, 473),
  34: p(161, 484), 27: p(161, 530), 59: p(239, 520),
  42: p(178, 543), 3: p(200, 543), 9: p(222, 543),
  // 根部
  53: p(178, 605), 60: p(200, 605), 52: p(222, 605),
  54: p(161, 618), 38: p(161, 642), 58: p(161, 666),
  19: p(239, 618), 39: p(239, 642), 41: p(239, 666),
};

/**
 * 少數通道若畫成直線會穿過其他中心，改用二次曲線繞開。
 * 這只是排版上的處理，曲線本身沒有額外意義。
 */
export const CHANNEL_BENDS: Record<string, Point> = {
  '20-34': p(116, 383),
};

export function centroid(points: Point[]): Point {
  const x = points.reduce((s, q) => s + q.x, 0) / points.length;
  const y = points.reduce((s, q) => s + q.y, 0) / points.length;
  return { x, y };
}

export function polygonPath(points: Point[]): string {
  return points.map((q) => `${q.x},${q.y}`).join(' ');
}
