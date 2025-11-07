"use client"

import { useState, useEffect, RefObject } from "react"
import { MovieCell, GlobalConfig } from "../types"
import { CANVAS_CONFIG, isBrowser } from "../constants"
import { filmIconPath } from "../utils/canvas"

interface UseCanvasRendererProps {
  canvasRef: RefObject<HTMLCanvasElement>
  cells: MovieCell[]
  setCells: React.Dispatch<React.SetStateAction<MovieCell[]>>
  dragOverCellId: number | null
  globalConfig: GlobalConfig
}

export function useCanvasRenderer({
  canvasRef,
  cells,
  setCells,
  dragOverCellId,
  globalConfig,
}: UseCanvasRendererProps) {
  const [scale, setScale] = useState(1)

  // 通用的绘制函数，支持高分辨率导出
  const drawCanvasWithScale = (
    targetCanvas: HTMLCanvasElement, 
    targetCells: MovieCell[], 
    config: GlobalConfig,
    scaleFactor: number = 1
  ) => {
    const ctx = targetCanvas.getContext("2d")
    if (!ctx) return

    // 应用缩放因子
    const width = CANVAS_CONFIG.width * scaleFactor
    const height = CANVAS_CONFIG.height * scaleFactor
    const padding = CANVAS_CONFIG.padding * scaleFactor
    const titleHeight = CANVAS_CONFIG.titleHeight * scaleFactor
    const titleBottomMargin = (CANVAS_CONFIG.titleBottomMargin || 0) * scaleFactor
    const cellPadding = CANVAS_CONFIG.cellPadding * scaleFactor
    const cellBorderWidth = CANVAS_CONFIG.cellBorderWidth * scaleFactor
    const cellBorderRadius = CANVAS_CONFIG.cellBorderRadius * scaleFactor

    try {
      // 清空画布
      ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)

      // 绘制白色背景
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height)

      // 绘制标题（自适应缩放过长文本）
      ctx.fillStyle = "black"
      const baseFontSize = CANVAS_CONFIG.titleFontSize * scaleFactor
      ctx.font = `bold ${baseFontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const title = config.mainTitle || ""
      const maxWidth = width - padding * 2
      const metrics = ctx.measureText(title)
      let fontSize = baseFontSize
      if (metrics.width > maxWidth && metrics.width > 0) {
        const scale = maxWidth / metrics.width
        fontSize = Math.max(12 * scaleFactor, Math.floor(baseFontSize * scale))
        ctx.font = `bold ${fontSize}px sans-serif`
      }

      const titleY = padding + titleHeight / 2
      ctx.fillText(title, width / 2, titleY)

      // 计算网格区域
      const gridTop = padding + titleHeight + titleBottomMargin
      const gridWidth = width - padding * 2
      const gridHeight = height - gridTop - padding

      // 计算单元格尺寸
      const cellWidth = gridWidth / CANVAS_CONFIG.gridCols
      const cellHeight = gridHeight / CANVAS_CONFIG.gridRows

      // 绘制单元格
      targetCells.forEach((cell, index) => {
        const row = Math.floor(index / CANVAS_CONFIG.gridCols)
        const col = index % CANVAS_CONFIG.gridCols

        const x = padding + col * cellWidth
        const y = gridTop + row * cellHeight

        // 绘制单元格边框
        ctx.strokeStyle = "black"
        ctx.lineWidth = cellBorderWidth

        // 如果是拖拽目标，绘制高亮边框
        if (dragOverCellId === cell.id) {
          ctx.strokeStyle = "#3b82f6" // 蓝色高亮
          ctx.lineWidth = cellBorderWidth * 2
        }

        // 检查是否支持 roundRect API
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(
            x + cellPadding / 2,
            y + cellPadding / 2,
            cellWidth - cellPadding,
            cellHeight - cellPadding,
            cellBorderRadius
          );
          ctx.stroke();
        } else {
          // 对于不支持 roundRect 的浏览器，使用普通矩形
          ctx.strokeRect(
            x + cellPadding / 2,
            y + cellPadding / 2,
            cellWidth - cellPadding,
            cellHeight - cellPadding
          );
        }

        // 计算封面区域
        const coverWidth = cellWidth - cellPadding * 2 - cellBorderWidth * 2
        const coverHeight = coverWidth / CANVAS_CONFIG.coverRatio
        const coverX = x + cellPadding + cellBorderWidth
        const coverY = y + cellPadding + cellBorderWidth

        // 绘制封面区域
        if (cell.imageObj) {
          try {
            // 绘制电影封面
            ctx.drawImage(cell.imageObj, coverX, coverY, coverWidth, coverHeight);
          } catch (error) {
            console.error(`绘制图片失败: ${cell.name || index}`, error);
            // 绘制错误占位图
            drawPlaceholder(ctx, coverX, coverY, coverWidth, coverHeight);
          }
        } else {
          // 绘制空白封面区域
          drawPlaceholder(ctx, coverX, coverY, coverWidth, coverHeight);
        }

        // 绘制标题文字（自适应缩放 + 垂直居中）
        ctx.fillStyle = "black"
        const baseCellTitleFont = CANVAS_CONFIG.cellTitleFontSize * scaleFactor
        ctx.font = `${baseCellTitleFont}px sans-serif`
        ctx.textAlign = "center"
        // 允许的最大宽度（左右各留出 padding）
        const cellTitleMaxWidth = cellWidth - cellPadding * 2
        const cellTitleMetrics = ctx.measureText(cell.title)
        let cellTitleFontSize = baseCellTitleFont
        if (cellTitleMetrics.width > cellTitleMaxWidth && cellTitleMetrics.width > 0) {
          const scale = cellTitleMaxWidth / cellTitleMetrics.width
          cellTitleFontSize = Math.max(10 * scaleFactor, Math.floor(baseCellTitleFont * scale))
          ctx.font = `${cellTitleFontSize}px sans-serif`
        }
        // 以固定高度区域居中，确保不同字号的标题基线一致
        const cellTitleMargin = CANVAS_CONFIG.cellTitleMargin * scaleFactor
        const titleTop = coverY + cellTitleMargin + coverHeight
        // 使用固定槽位高度（基础字号），保证过长缩小时也垂直居中
        const titleAreaHeight = baseCellTitleFont
        const titleCenterY = titleTop + titleAreaHeight / 2
        const prevBaseline = ctx.textBaseline
        ctx.textBaseline = "middle"
        ctx.fillText(
          cell.title,
          x + cellWidth / 2,
          titleCenterY + 3 * scaleFactor,
        )
        ctx.textBaseline = prevBaseline

        // 如果有电影名称，绘制电影名称
        if (cell.name) {
          // 副标题使用 alphabetic 基线，配合基于字号的 Y 计算，避免偏下
          const prevBaseline2 = ctx.textBaseline
          ctx.textBaseline = "alphabetic"
          ctx.fillStyle = "#4b5563" // 灰色文字
          const cellNameFontSize = CANVAS_CONFIG.cellNameFontSize * scaleFactor
          ctx.font = `${cellNameFontSize}px sans-serif`

          // 截断过长的电影名称
          let movieName = cell.name
          let textWidth = ctx.measureText(movieName).width
          const maxWidth = cellWidth - cellPadding * 4

          if (textWidth > maxWidth) {
            // 截断文本并添加省略号
            let truncated = movieName
            while (textWidth > maxWidth && truncated.length > 0) {
              truncated = truncated.slice(0, -1)
              textWidth = ctx.measureText(truncated + "...").width
            }
            movieName = truncated + "..."
          }

          const cellNameMargin = CANVAS_CONFIG.cellNameMargin * scaleFactor
          ctx.fillText(
            movieName,
            x + cellWidth / 2,
            coverY +
              coverHeight +
              cellTitleMargin +
              baseCellTitleFont +
              cellNameMargin +
              cellNameFontSize,
          )
          ctx.textBaseline = prevBaseline2
        }
      })

      // 添加水印
      ctx.fillStyle = "#9ca3af" // 使用灰色
      ctx.font = `${14 * scaleFactor}px sans-serif`
      ctx.textAlign = "right"
      ctx.fillText(
        "moviegrid.dsdev.ink",
        width - padding,
        height - padding / 2
      )
    } catch (error) {
      console.error("绘制Canvas时发生错误:", error)
    }
  }

  // 绘制Canvas（用于显示）
  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCanvasWithScale(canvas, cells, globalConfig, 1)
  }

  // 计算Canvas缩放比例
  useEffect(() => {
    if (!isBrowser || !canvasRef.current) return;

    const updateScale = () => {
      if (!canvasRef.current) return;

      const containerWidth = Math.min(window.innerWidth, 1200);
      const newScale = containerWidth / CANVAS_CONFIG.width;
      setScale(newScale);

      // 更新Canvas尺寸
      const canvas = canvasRef.current;
      
      // 保持Canvas的实际像素数
      canvas.width = CANVAS_CONFIG.width;
      canvas.height = CANVAS_CONFIG.height;
      
      // 设置显示尺寸
      canvas.style.width = `${CANVAS_CONFIG.width * newScale}px`;
      canvas.style.height = `${CANVAS_CONFIG.height * newScale}px`;

      // 使用 requestAnimationFrame 确保在下一帧重绘
      requestAnimationFrame(() => {
        drawCanvas();
      });
    };

    // 初始更新
    updateScale();
    
    // 使用防抖处理窗口大小变化
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateScale, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [drawCanvas]);

  // 当cells变化时重新绘制Canvas
  useEffect(() => {
    if (isBrowser) {
      requestAnimationFrame(() => {
        drawCanvas();
      });
    }
  }, [cells, dragOverCellId, drawCanvas]);

  // 加载图片
  useEffect(() => {
    if (!isBrowser) return;

    cells.forEach((cell, index) => {
      if (cell.image && !cell.imageObj) {
        try {
          // 使用全局 window.Image 构造函数而不是直接使用 Image
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onerror = (err) => {
            console.error(`图片加载失败: ${cell.image}`, err);
          };
          img.onload = () => {
            setCells((prev) => {
              const newCells = [...prev];
              newCells[index] = { ...newCells[index], imageObj: img };
              return newCells;
            });
          };
          img.src = cell.image;
        } catch (error) {
          console.error("创建图片对象失败:", error);
        }
      }
    });
  }, [cells, setCells]);

  // 内部函数：绘制占位符
  function drawPlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    ctx.fillStyle = "#f3f4f6"; // 淡灰色背景
    ctx.fillRect(x, y, width, height);

    // 绘制电影手柄图标
    const iconSize = Math.min(width, height) * 0.4;
    const iconX = x + (width - iconSize) / 2;
    const iconY = y + (height - iconSize) / 2;

    // 绘制电影手柄图标
    ctx.fillStyle = "#9ca3af";
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 3;
    filmIconPath(iconX, iconY, iconSize).forEach((cmd) => {
      if (cmd.cmd === "beginPath") {
        ctx.beginPath();
      } else if (cmd.cmd === "roundRect" && cmd.args && typeof ctx.roundRect === 'function') {
        ctx.roundRect(
          cmd.args[0] as number,
          cmd.args[1] as number,
          cmd.args[2] as number,
          cmd.args[3] as number,
          cmd.args[4] as number
        );
      } else if (cmd.cmd === "arc" && cmd.args) {
        ctx.arc(
          cmd.args[0] as number,
          cmd.args[1] as number,
          cmd.args[2] as number,
          cmd.args[3] as number,
          cmd.args[4] as number
        );
      } else if (cmd.cmd === "moveTo" && cmd.args) {
        ctx.moveTo(
          cmd.args[0] as number,
          cmd.args[1] as number
        );
      } else if (cmd.cmd === "lineTo" && cmd.args) {
        ctx.lineTo(
          cmd.args[0] as number,
          cmd.args[1] as number
        );
      } else if (cmd.cmd === "bezierCurveTo" && cmd.args) {
        ctx.bezierCurveTo(
          cmd.args[0] as number,
          cmd.args[1] as number,
          cmd.args[2] as number,
          cmd.args[3] as number,
          cmd.args[4] as number,
          cmd.args[5] as number
        );
      } else if (cmd.cmd === "closePath") {
        ctx.closePath();
      } else if (cmd.cmd === "fill") {
        ctx.fill();
      } else if (cmd.cmd === "stroke") {
        ctx.stroke();
      }
    });
  }

  return {
    scale,
    drawCanvas,
    drawCanvasWithScale
  }
}
