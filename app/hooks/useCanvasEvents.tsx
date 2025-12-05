"use client"

import { useState } from "react"
import { MovieCell, GlobalConfig } from "../types"
import { CANVAS_CONFIG } from "../constants"
import { getCellIdFromCoordinates } from "../utils/canvas"
import { saveToIndexedDB } from "../utils/indexedDB"
import { getClickArea, cropImageToAspectRatio } from "@/app/utils/canvasHelpers"

interface UseCanvasEventsProps {
  cells: MovieCell[]
  setCells: React.Dispatch<React.SetStateAction<MovieCell[]>>
  scale: number
  openSearchDialog: (cellId: number) => void
  openTitleEditDialog: (cellId: number) => void
  openNameEditDialog: (cellId: number) => void
  openMainTitleEditDialog: () => void
  onImageDrop?: (cellId: number, file: File) => void // 添加拖拽图片的回调
  forceCanvasRedraw?: () => void // 添加强制Canvas重绘的函数
  drawCanvasWithScale?: (canvas: HTMLCanvasElement, cells: MovieCell[], config: GlobalConfig, scaleFactor: number) => void
  globalConfig: GlobalConfig
  onImageGenerated?: (dataUrl: string) => void // 新增：生成的图片回调，用于移动端预览
}

export function useCanvasEvents({
  cells,
  setCells,
  scale,
  openSearchDialog,
  openTitleEditDialog,
  openNameEditDialog,
  openMainTitleEditDialog,
  onImageDrop,
  forceCanvasRedraw,
  drawCanvasWithScale,
  globalConfig,
  onImageGenerated,
}: UseCanvasEventsProps) {
  const [dragOverCellId, setDragOverCellId] = useState<number | null>(null)

  // 处理Canvas点击事件
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    if (!canvas) return;

    // 获取点击坐标（考虑缩放）
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // 检查是否点击了主标题区域
    if (y < CANVAS_CONFIG.padding + CANVAS_CONFIG.titleHeight) {
      openMainTitleEditDialog();
      return;
    }

    // 检查点击的是哪个单元格
    const cellId = getCellIdFromCoordinates(x, y, CANVAS_CONFIG);
    if (cellId !== null) {
      // 检查点击的具体区域
      const clickArea = getClickArea(x, y, cellId, CANVAS_CONFIG);
      console.log(cellId, clickArea);
      
      // 根据点击区域执行不同操作
      if (clickArea === "image") {
        // 点击图片区域，打开搜索对话框
        openSearchDialog(cellId);
      } else if (clickArea === "title") {
        // 点击标题区域，编辑标题
        openTitleEditDialog(cellId);
      } else if (clickArea === "name") {
        // 点击电影名称区域，编辑电影名称
        openNameEditDialog(cellId);
      }
    }
  };

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    // 获取拖拽坐标（考虑缩放）
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    // 获取拖拽经过的单元格
    const cellId = getCellIdFromCoordinates(x, y, CANVAS_CONFIG)

    // 更新拖拽经过的单元格ID
    setDragOverCellId(cellId)
    
    // 强制重绘Canvas
    if (forceCanvasRedraw) {
      forceCanvasRedraw();
    }
  }

  const handleDragLeave = () => {
    setDragOverCellId(null)
    
    // 强制重绘Canvas
    if (forceCanvasRedraw) {
      forceCanvasRedraw();
    }
  }

  // 确保图片加载完成后重绘Canvas
  const ensureImageLoaded = (imageUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.src = imageUrl;
    });
  };

  const handleDrop = async (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    // 获取拖拽坐标（考虑缩放）
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    // 获取拖拽放置的单元格
    const cellId = getCellIdFromCoordinates(x, y, CANVAS_CONFIG)

    // 清除拖拽状态
    setDragOverCellId(null)
    
    // 强制重绘Canvas
    if (forceCanvasRedraw) {
      forceCanvasRedraw();
    }

    if (cellId === null) return

    // 处理拖拽的文件
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]

      // 检查是否是图片文件
      if (!file.type.startsWith("image/")) {
        console.error("只能拖拽图片文件");
        alert("只能拖拽图片文件");
        return
      }

      // 如果提供了 onImageDrop 回调，使用它来处理（会打开裁剪对话框）
      if (onImageDrop) {
        onImageDrop(cellId, file);
        return;
      }

      // 否则使用默认的自动裁剪处理（向后兼容）
      // 限制图片大小为3MB
      const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
      if (file.size > MAX_FILE_SIZE) {
        console.error("图片文件过大");
        alert("图片文件过大,请上传小于3MB的图片");
        return
      }

      try {
        // 读取图片文件
        const originalImageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        
        // 裁剪图片为3:4的长宽比
        const croppedImageUrl = await cropImageToAspectRatio(originalImageUrl);
        
        // 确保图片已完全加载
        await ensureImageLoaded(croppedImageUrl);

        // 生成唯一标识，确保React检测到图片URL的变化
        // 这里我们添加一个时间戳参数，确保即使是相同的图片也会被认为是新的URL
        const uniqueImageUrl = `${croppedImageUrl}#t=${Date.now()}`;

        // 更新单元格数据
        const updatedCell: MovieCell = {
          ...cells[cellId],
          image: uniqueImageUrl,
          name: file.name.replace(/\.[^/.]+$/, ""), // 移除文件扩展名作为电影名称
          imageObj: null, // 明确清除旧的图片对象
        }

        // 更新状态
        setCells((prev) => {
          const newCells = [...prev]
          newCells[cellId] = updatedCell
          return newCells
        })

        // 保存到IndexedDB
        await saveToIndexedDB(updatedCell)

        console.log("图片已添加到格子中");
      } catch (error) {
        console.error("读取或处理图片失败:", error)
      }
    }
  }

  // 生成高分辨率图片
  const generateImage = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !drawCanvasWithScale) return

    try {
      // 创建高分辨率的临时canvas
      // iOS 设备对 Canvas 像素数量比较敏感，这里根据设备类型动态调整倍率
      // 3x: 1200 * 1610 * 9 = ~17.4MP (iOS limit ~16.7MP) -> CRASH
      // 2x: 1200 * 1610 * 4 = ~7.7MP -> 安全
      const exportScale = 2
      const exportCanvas = document.createElement('canvas');
      // 使用原始配置尺寸，而不是canvas的实际像素尺寸（避免dpr影响）
      const exportWidth = CANVAS_CONFIG.width * exportScale;
      const exportHeight = CANVAS_CONFIG.height * exportScale;
      
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      
      // 使用高分辨率重新绘制所有内容
      drawCanvasWithScale(exportCanvas, cells, globalConfig, exportScale);

      // 尝试不同的质量级别，确保文件小于3MB
      const maxFileSize = 3 * 1024 * 1024; // 3MB
      let quality = 0.92; // 从较高质量开始
      let dataUrl: string;
      let fileSize: number;

      do {
        dataUrl = exportCanvas.toDataURL("image/jpeg", quality);
        // 估算文件大小（base64编码大约增加33%）
        fileSize = Math.ceil((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);
        
        if (fileSize > maxFileSize) {
          quality -= 0.05; // 降低质量
          if (quality < 0.5) {
            console.warn("无法在3MB内生成图片，使用最低质量");
            break;
          }
        }
      } while (fileSize > maxFileSize && quality >= 0.5);

      console.log(`导出图片: ${exportWidth}x${exportHeight}, 质量: ${(quality * 100).toFixed(0)}%, 大小: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);

      // 移动端检测
      // 包括 iOS, Android, 和各种 Pad 设备
      const isMobile = typeof navigator !== "undefined" && /Mobile|Android|iP(ad|hone|od)/.test(navigator.userAgent);

      // 如果是移动端，且提供了回调，则通过回调展示预览（这是最稳妥的方案）
      // 这可以绕过各种内置浏览器对 download 属性的屏蔽
      if (isMobile && onImageGenerated) {
        onImageGenerated(dataUrl);
        console.log("检测到移动端，已触发预览弹窗");
        return;
      }

      // 获取主标题作为文件名
      let fileName = "电影生涯个人喜好表.jpg";
      try {
        if (globalConfig?.mainTitle) {
          fileName = `${globalConfig.mainTitle}.jpg`;
        }
      } catch (error) {
        console.error("获取主标题失败:", error);
      }

      // 创建下载链接
      const link = document.createElement("a")
      link.download = fileName
      link.href = dataUrl
      link.click()

      console.log("高分辨率图片已生成并下载");
    } catch (error) {
      console.error("生成图片失败:", error)
      // 针对移动端用户提供可见反馈，避免「无反应」的体验
      if (typeof window !== "undefined" && /iP(ad|hone|od)|Android/i.test(navigator.userAgent)) {
        alert("生成图片失败，建议尝试使用桌面浏览器再次导出，或稍后重试。")
      }
    }
  }

  return {
    dragOverCellId,
    handleCanvasClick,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    generateImage,
  }
}
