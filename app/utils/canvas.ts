import { DrawCommand, CanvasConfig } from "../types";

/**
 * 生成电影胶片图标路径
 */
export const filmIconPath = (x: number, y: number, size: number): DrawCommand[] => {
  const scale = size / 24;
  const tx = x;
  const ty = y;

  return [
    // 外框矩形
    { cmd: "beginPath" },
    { cmd: "moveTo", args: [tx + 3 * scale, ty + 4 * scale] },
    { cmd: "lineTo", args: [tx + 21 * scale, ty + 4 * scale] },
    { cmd: "lineTo", args: [tx + 21 * scale, ty + 20 * scale] },
    { cmd: "lineTo", args: [tx + 3 * scale, ty + 20 * scale] },
    { cmd: "closePath" },
    { cmd: "stroke" },

    // 左侧胶片孔1
    { cmd: "beginPath" },
    { cmd: "moveTo", args: [tx + 4 * scale, ty + 6 * scale] },
    { cmd: "lineTo", args: [tx + 6 * scale, ty + 6 * scale] },
    { cmd: "lineTo", args: [tx + 6 * scale, ty + 8 * scale] },
    { cmd: "lineTo", args: [tx + 4 * scale, ty + 8 * scale] },
    { cmd: "closePath" },
    { cmd: "fill" },
    
    // 左侧胶片孔2
    { cmd: "beginPath" },
    { cmd: "moveTo", args: [tx + 4 * scale, ty + 11 * scale] },
    { cmd: "lineTo", args: [tx + 6 * scale, ty + 11 * scale] },
    { cmd: "lineTo", args: [tx + 6 * scale, ty + 13 * scale] },
    { cmd: "lineTo", args: [tx + 4 * scale, ty + 13 * scale] },
    { cmd: "closePath" },
    { cmd: "fill" },
    
    // 左侧胶片孔3
    { cmd: "beginPath" },
    { cmd: "moveTo", args: [tx + 4 * scale, ty + 16 * scale] },
    { cmd: "lineTo", args: [tx + 6 * scale, ty + 16 * scale] },
    { cmd: "lineTo", args: [tx + 6 * scale, ty + 18 * scale] },
    { cmd: "lineTo", args: [tx + 4 * scale, ty + 18 * scale] },
    { cmd: "closePath" },
    { cmd: "fill" },

    // 右侧胶片孔1
    { cmd: "beginPath" },
    { cmd: "moveTo", args: [tx + 18 * scale, ty + 6 * scale] },
    { cmd: "lineTo", args: [tx + 20 * scale, ty + 6 * scale] },
    { cmd: "lineTo", args: [tx + 20 * scale, ty + 8 * scale] },
    { cmd: "lineTo", args: [tx + 18 * scale, ty + 8 * scale] },
    { cmd: "closePath" },
    { cmd: "fill" },
    
    // 右侧胶片孔2
    { cmd: "beginPath" },
    { cmd: "moveTo", args: [tx + 18 * scale, ty + 11 * scale] },
    { cmd: "lineTo", args: [tx + 20 * scale, ty + 11 * scale] },
    { cmd: "lineTo", args: [tx + 20 * scale, ty + 13 * scale] },
    { cmd: "lineTo", args: [tx + 18 * scale, ty + 13 * scale] },
    { cmd: "closePath" },
    { cmd: "fill" },
    
    // 右侧胶片孔3
    { cmd: "beginPath" },
    { cmd: "moveTo", args: [tx + 18 * scale, ty + 16 * scale] },
    { cmd: "lineTo", args: [tx + 20 * scale, ty + 16 * scale] },
    { cmd: "lineTo", args: [tx + 20 * scale, ty + 18 * scale] },
    { cmd: "lineTo", args: [tx + 18 * scale, ty + 18 * scale] },
    { cmd: "closePath" },
    { cmd: "fill" },

    // 中间分割线
    { cmd: "beginPath" },
    { cmd: "moveTo", args: [tx + 3 * scale, ty + 12 * scale] },
    { cmd: "lineTo", args: [tx + 21 * scale, ty + 12 * scale] },
    { cmd: "stroke" },
  ];
};

/**
 * 获取点击的单元格ID
 */
export function getCellIdFromCoordinates(
  x: number,
  y: number,
  config: CanvasConfig
): number | null {
  // 计算网格区域
  const gridTop = config.padding + config.titleHeight;
  const gridWidth = config.width - config.padding * 2;
  const gridHeight = config.height - gridTop - config.padding;

  // 计算单元格尺寸
  const cellWidth = gridWidth / config.gridCols;
  const cellHeight = gridHeight / config.gridRows;

  // 检查点击的是哪个单元格
  if (
    x >= config.padding &&
    x <= config.width - config.padding &&
    y >= gridTop &&
    y <= gridTop + gridHeight
  ) {
    const col = Math.floor((x - config.padding) / cellWidth);
    const row = Math.floor((y - gridTop) / cellHeight);

    if (col >= 0 && col < config.gridCols && row >= 0 && row < config.gridRows) {
      return row * config.gridCols + col;
    }
  }

  return null;
}
