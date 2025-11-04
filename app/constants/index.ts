import { CanvasConfig, DBConfig, RoundRectRadii } from "../types";
// 导入类型以确保全局声明被加载
import type {} from "../types";

/**
 * 检查是否在浏览器环境中
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Canvas配置
 */
export const CANVAS_CONFIG: CanvasConfig = {
  width: 1200,
  height: 1610,  // 从 1300 改为 1600
  padding: 40,
  titleHeight: 50,
  titleBottomMargin: 20,
  gridRows: 5,
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
  name: "moviePreferenceDB",
  storeName: "movieData",
  version: 1
};

/**
 * 预定义的格子标题
 */
export const CELL_TITLES = [
  "最爱的一部",
  "最佳导演",
  "最爱演员",
  "最爱导演",
  "最佳画面",
  "最佳剧情",
  "最佳服化",
  "最佳摄影",
  "最具创意",
  "最佳配乐",
  "最佳主演",
  "最佳配角",
  "最佳反派",
  "最讨厌的角色",
  "最悲伤",
  "最浪漫",
  "最恐怖",
  "最性感",
  "最爽",
  "最感动",
  "最烧脑",
  "最有趣",
  "最震撼",
  "最过誉",
  "最看不懂",
  "最多遍",
  "启蒙之作",
  "最被低估",
  "最具特殊意义",
  "最近一部",
];

// 添加 Canvas.roundRect polyfill，以兼容旧版浏览器
if (isBrowser && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    let radii: RoundRectRadii;
    if (typeof radius === 'number') {
      radii = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      radii = { tl: 0, tr: 0, br: 0, bl: 0, ...radius };
    }
    this.beginPath();
    this.moveTo(x + radii.tl, y);
    this.lineTo(x + width - radii.tr, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radii.tr);
    this.lineTo(x + width, y + height - radii.br);
    this.quadraticCurveTo(x + width, y + height, x + width - radii.br, y + height);
    this.lineTo(x + radii.bl, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radii.bl);
    this.lineTo(x, y + radii.tl);
    this.quadraticCurveTo(x, y, x + radii.tl, y);
    this.closePath();
    return this;
  };
}
