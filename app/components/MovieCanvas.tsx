"use client"

import { useEffect, useRef, useState } from "react"
import { CANVAS_CONFIG } from "../constants"
import { useCanvasEvents } from "../hooks/useCanvasEvents"
import { MovieCell } from "../types"
import { drawCanvasContent } from "../utils/canvas"

interface MovieCanvasProps {
  cells: MovieCell[]
  setCells: React.Dispatch<React.SetStateAction<MovieCell[]>>
  openSearchDialog: (cellId: number) => void
  openTitleEditDialog: (cellId: number) => void
  openNameEditDialog: (cellId: number) => void
}

export function MovieCanvas({
  cells,
  setCells,
  openSearchDialog,
  openTitleEditDialog,
  openNameEditDialog,
}: MovieCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(1)
  // 添加一个重绘触发器，用于在需要时强制重绘
  const [redrawTrigger, setRedrawTrigger] = useState(0)

  // 强制重绘Canvas的函数
  const forceCanvasRedraw = () => setRedrawTrigger(prev => prev + 1)

  const {
    dragOverCellId,
    handleCanvasClick,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    generateImage,
  } = useCanvasEvents({
    cells,
    setCells,
    scale,
    openSearchDialog,
    openTitleEditDialog,
    openNameEditDialog,
    forceCanvasRedraw, // 传入强制重绘函数
  })

  // 调整Canvas大小
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { cellSize, cellGap, rows, cols } = CANVAS_CONFIG
    const totalSize = cellSize + cellGap
    
    canvas.width = cols * totalSize + cellGap
    canvas.height = rows * totalSize + cellGap

    // 计算缩放比例，使Canvas适应屏幕宽度
    const maxWidth = Math.min(window.innerWidth - 40, 1200) // 最大宽度，考虑边距
    const calculatedScale = maxWidth / canvas.width
    setScale(calculatedScale)

    // 设置Canvas样式宽度
    canvas.style.width = `${canvas.width * calculatedScale}px`
    canvas.style.height = `${canvas.height * calculatedScale}px`

    // 初始绘制
    drawCanvasContent(canvas, cells, dragOverCellId)
  }, [cells, dragOverCellId]) // 当cells或dragOverCellId变化时重新调整

  // 当cells、dragOverCellId或redrawTrigger变化时重绘Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 重绘Canvas内容
    drawCanvasContent(canvas, cells, dragOverCellId)
  }, [cells, dragOverCellId, redrawTrigger]) // 添加redrawTrigger作为依赖

  return (
    <div className="flex flex-col items-center gap-4 relative mt-4">
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="touch-none"
        />
      </div>
      <button
        onClick={() => generateImage(canvasRef)}
        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        保存为图片
      </button>
    </div>
  )
}
