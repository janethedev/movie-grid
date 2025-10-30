"use client"

import { useState } from "react"
import { GameCell } from "../types"
import { CANVAS_CONFIG } from "../constants"
import { getCellIdFromCoordinates } from "../utils/canvas"
import { saveToIndexedDB } from "../utils/indexedDB"
import { getClickArea, cropImageToAspectRatio } from "@/app/utils/canvasHelpers"

interface UseCanvasEventsProps {
  cells: GameCell[]
  setCells: React.Dispatch<React.SetStateAction<GameCell[]>>
  scale: number
  openSearchDialog: (cellId: number) => void
  openTitleEditDialog: (cellId: number) => void
  openNameEditDialog: (cellId: number) => void
  openMainTitleEditDialog: () => void
  forceCanvasRedraw?: () => void // 添加强制Canvas重绘的函数
}

export function useCanvasEvents({
  cells,
  setCells,
  scale,
  openSearchDialog,
  openTitleEditDialog,
  openNameEditDialog,
  openMainTitleEditDialog,
  forceCanvasRedraw,
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
        // 点击游戏名称区域，编辑游戏名称
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
        const updatedCell: GameCell = {
          ...cells[cellId],
          image: uniqueImageUrl,
          name: file.name.replace(/\.[^/.]+$/, ""), // 移除文件扩展名作为游戏名称
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

  // 生成图片
  const generateImage = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      // 在某些浏览器中，如果内容包含跨域资源且未正确设置 CORS，
      // 调用 toDataURL 会抛出安全错误。使用 try-catch 处理。
      const dataUrl = canvas.toDataURL("image/png")

      // 获取主标题（从localStorage）
      let fileName = "游戏生涯个人喜好表.png";
      try {
        const savedConfig = localStorage.getItem('gameGridGlobalConfig');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.mainTitle) {
            fileName = `${parsedConfig.mainTitle}.png`;
          }
        }
      } catch (error) {
        console.error("获取主标题失败:", error);
      }

      // 创建下载链接
      const link = document.createElement("a")
      link.download = fileName
      link.href = dataUrl
      link.click()

      console.log("图片已生成并下载");
    } catch (error) {
      console.error("生成图片失败:", error)
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
