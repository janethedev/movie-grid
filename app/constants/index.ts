import { CanvasConfig, DBConfig } from "../types";

/**
 * 检查是否在浏览器环境中
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Canvas配置
 */
export const CANVAS_CONFIG: CanvasConfig = {
  width: 1200,
  height: 1300,
  padding: 40,
  titleHeight: 50,
  gridRows: 4,
  gridCols: 6,
  cellPadding: 10,
  cellBorderWidth: 2,
  cellBorderRadius: 8,
  cellAspectRatio: 0.75, // 宽高比为3:4
  coverRatio: 0.75, // 封面宽高比为3:4
  titleFontSize: 48,
  cellTitleFontSize: 22,
  cellNameFontSize: 14,
  cellTitleMargin: 6,
  cellNameMargin: 6,
};

/**
 * IndexedDB 配置
 */
export const DB_CONFIG: DBConfig = {
  name: "gamePreferenceDB",
  storeName: "gameData",
  version: 1
};

/**
 * 预定义的格子标题
 */
export const CELL_TITLES = [
  "最爱的",
  "最影响我的",
  "最惊艳的",
  "最长情的",
  "最快乐的",
  "最想安利的",
  "最喜欢的剧情",
  "最喜欢的画面",
  "最喜欢的配乐",
  "最喜欢的配音",
  "最喜欢的角色",
  "最喜欢的结局",
  "最爽快的",
  "最受苦的",
  "最治愈的",
  "最致郁的",
  "最被低估的",
  "最被高估的",
  "玩的第一款",
  "消磨时间就玩",
  "我咋会喜欢这个",
  "总有一天能打完",
  "爷青回",
  "它好小众我好爱",
];

// 添加 Canvas.roundRect polyfill，以兼容旧版浏览器
if (isBrowser && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
    }
    this.beginPath();
    this.moveTo(x + radius.tl, y);
    this.lineTo(x + width - radius.tr, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    this.lineTo(x + width, y + height - radius.br);
    this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    this.lineTo(x + radius.bl, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    this.lineTo(x, y + radius.tl);
    this.quadraticCurveTo(x, y, x + radius.tl, y);
    this.closePath();
    return this;
  };
}
