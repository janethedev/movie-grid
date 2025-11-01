/**
 * 电影格子类型定义
 */
export interface GameCell {
  id: number;
  title: string;
  image?: string;
  name?: string;
  imageObj?: HTMLImageElement | null;
}

/**
 * 全局配置类型
 */
export interface GlobalConfig {
  mainTitle: string;
}

/**
 * Canvas绘图命令类型
 */
export interface DrawCommand {
  cmd: string;
  args?: unknown[];
}

/**
 * Canvas配置类型
 */
export interface CanvasConfig {
  width: number;
  height: number;
  padding: number;
  titleHeight: number;
  titleBottomMargin: number;
  gridRows: number;
  gridCols: number;
  cellPadding: number;
  cellBorderWidth: number;
  cellBorderRadius: number;
  cellAspectRatio: number;
  coverRatio: number;
  titleFontSize: number;
  cellTitleFontSize: number;
  cellNameFontSize: number;
  cellTitleMargin: number;
  cellNameMargin: number;
}

/**
 * 搜索电影结果项
 */
export interface GameSearchResult {
  id?: number | string;
  name: string;
  image: string;
}

/**
 * IndexedDB配置
 */
export interface DBConfig {
  name: string;
  storeName: string;
  version: number;
}

/**
 * 圆角半径配置
 */
export interface RoundRectRadii {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

/**
 * 扩展 CanvasRenderingContext2D 以支持自定义 roundRect 方法
 */
declare global {
  interface CanvasRenderingContext2D {
    roundRect(
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number | Partial<RoundRectRadii>
    ): this;
  }
}

// 确保此文件被视为模块
export {}
