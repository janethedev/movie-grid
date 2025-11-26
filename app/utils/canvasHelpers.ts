import { CANVAS_CONFIG } from "../constants";

// 判断点击区域类型
export function getClickArea(
  x: number,
  y: number,
  cellId: number,
  canvasConfig: typeof CANVAS_CONFIG
): "image" | "title" | "name" | null {
  // 获取网格区域基础信息
  const { padding, titleHeight, width, height, gridRows, gridCols } =
    canvasConfig;

  // 计算网格区域
  const gridTop = padding + titleHeight;
  const gridWidth = width - padding * 2;
  const gridHeight = height - gridTop - padding;

  // 计算单元格尺寸
  const cellWidth = gridWidth / gridCols;
  const cellHeight = gridHeight / gridRows;

  // 计算当前单元格的行和列
  const row = Math.floor(cellId / gridCols);
  const col = cellId % gridCols;

  // 计算单元格左上角的绝对坐标
  const cellLeft = padding + col * cellWidth;
  const cellTop = gridTop + row * cellHeight;

  // 计算相对于单元格左上角的坐标
  const relX = x - cellLeft;
  const relY = y - cellTop;

  // 检查是否在有效范围内
  if (relX < 0 || relX >= cellWidth || relY < 0 || relY >= cellHeight) {
    return null;
  }

  // 划分单元格内的三个区域
  if (relY < cellHeight * 0.75) {
    return "image";
  } else if (relY < cellHeight * 0.9) {
    return "title";
  } else {
    return "name";
  }
}

// 裁剪并压缩图片为3:4的长宽比
export function cropImageToAspectRatio(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Unable to create Canvas context"));
        return;
      }

      // 目标宽高比 3:4
      const targetRatio = 3 / 4;

      let sourceWidth = img.width;
      let sourceHeight = img.height;
      let sourceX = 0;
      let sourceY = 0;

      // 计算裁剪区域，保持3:4的长宽比
      const currentRatio = sourceWidth / sourceHeight;

      if (currentRatio > targetRatio) {
        // 图片过宽，裁剪两边
        sourceWidth = sourceHeight * targetRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else if (currentRatio < targetRatio) {
        // 图片过高，裁剪上下
        sourceHeight = sourceWidth / targetRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // 限制最大宽度为800px，保持宽高比
      const MAX_WIDTH = 800;
      let outputWidth = sourceWidth;
      let outputHeight = sourceHeight;
      
      if (outputWidth > MAX_WIDTH) {
        outputWidth = MAX_WIDTH;
        outputHeight = outputWidth / targetRatio;
      }

      // 设置Canvas为压缩后的大小
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      // 转换为JPEG格式，质量0.9
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = imageUrl;
  });
}

// 预加载图片并返回Promise
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
