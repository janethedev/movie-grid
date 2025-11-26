"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/provider"
import { MovieCell, MovieSearchResult, GlobalConfig } from "../types"
import { saveToIndexedDB } from "../utils/indexedDB"
import { MovieSearchDialog } from "./MovieSearchDialog"
import { TextEditDialog } from "./TextEditDialog"
import { ImageCropDialog } from "./ImageCropDialog"
import { useCanvasRenderer } from "../hooks/useCanvasRenderer"
import { useCanvasEvents } from "../hooks/useCanvasEvents"
import { useIsMobile } from "../hooks/useIsMobile"

interface MovieGridProps {
  initialCells: MovieCell[]
  onUpdateCells: (cells: MovieCell[]) => void
}

export function MovieGrid({ initialCells, onUpdateCells }: MovieGridProps) {
  // Canvas相关状态
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cells, setCells] = useState<MovieCell[]>(initialCells)
  
  // 全局配置状态
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    mainTitle: ""
  })
  const { t, locale } = useI18n();
  const isMobile = useIsMobile();

  useEffect(() => {
    // 每个语系独立的默认标题与存储键
    const storageKey = `movieGridGlobalConfig_${locale}`
    const savedConfig = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setGlobalConfig(parsed)
        if (typeof document !== 'undefined' && parsed.mainTitle) {
          document.title = parsed.mainTitle
        }
      } catch {}
    } else {
      const defaultTitle = String(t('global.main_title'))
      setGlobalConfig((prev) => ({ ...prev, mainTitle: defaultTitle }))
      if (typeof document !== 'undefined') {
        document.title = defaultTitle
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])
  
  // 搜索与编辑状态
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [isMainTitleDialogOpen, setIsMainTitleDialogOpen] = useState(false)
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null)
  
  // 当cells状态发生变化时，通知父组件
  useEffect(() => {
    onUpdateCells(cells)
  }, [cells, onUpdateCells])

  // 打开搜索对话框
  const openSearchDialog = (cellId: number) => {
    console.log("openSearchDialog")
    setSelectedCellId(cellId);
    setIsSearchDialogOpen(true);
  };

  // 打开标题编辑对话框
  const openTitleEditDialog = (cellId: number) => {
    setSelectedCellId(cellId);
    setEditingText(cells[cellId].title);
    setIsTitleDialogOpen(true);
  };

  // 打开电影名称编辑对话框
  const openNameEditDialog = (cellId: number) => {
    setSelectedCellId(cellId);
    setEditingText(cells[cellId].name || "");
    setIsNameDialogOpen(true);
  };

  // 打开主标题编辑对话框
  const openMainTitleEditDialog = () => {
    setEditingText(globalConfig.mainTitle);
    setIsMainTitleDialogOpen(true);
  };

  // 使用自定义hooks处理Canvas渲染
  const { scale, drawCanvas, drawCanvasWithScale } = useCanvasRenderer({ 
    canvasRef, 
    cells, 
    setCells, 
    dragOverCellId: null,
    globalConfig
  });

  // 使用自定义hooks管理Canvas渲染
  const { 
    dragOverCellId: currentDragOverCellId, 
    handleCanvasClick, 
    handleDragOver, 
    handleDragLeave, 
    handleDrop, 
    generateImage 
  } = useCanvasEvents({
    cells,
    setCells,
    scale,
    openSearchDialog,
    openTitleEditDialog,
    openNameEditDialog,
    openMainTitleEditDialog,
    forceCanvasRedraw: drawCanvas,
    drawCanvasWithScale,
    globalConfig,
  });

  // 更新 useCanvasRenderer 以使用当前的 dragOverCellId
  useEffect(() => {
    if (drawCanvas) {
      drawCanvas();
    }
  }, [currentDragOverCellId, globalConfig, drawCanvas]);

  // 保存标题更改
  const handleSaveTitle = (newText: string) => {
    if (selectedCellId === null) return;

    const updatedCell: MovieCell = {
      ...cells[selectedCellId],
      title: newText,
    };

    setCells(cells.map((cell) => (cell.id === selectedCellId ? updatedCell : cell)));
    // 每个语系单独存储标题映射
    try {
      const key = `movieGridTitles_${locale}`
      const raw = localStorage.getItem(key)
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
      map[String(selectedCellId)] = newText
      localStorage.setItem(key, JSON.stringify(map))
    } catch {}
    setIsTitleDialogOpen(false);
  };

  // 保存电影名称更改
  const handleSaveName = (newText: string) => {
    if (selectedCellId === null) return;

    const updatedCell: MovieCell = {
      ...cells[selectedCellId],
      name: newText,
    };

    setCells(cells.map((cell) => (cell.id === selectedCellId ? updatedCell : cell)));
    saveToIndexedDB(updatedCell);
    setIsNameDialogOpen(false);
  };

  // 保存主标题更改
  const handleSaveMainTitle = (newText: string) => {
    const updatedConfig = {
      ...globalConfig,
      mainTitle: newText
    };
    
    setGlobalConfig(updatedConfig);
    setIsMainTitleDialogOpen(false);
    
    // 保存到localStorage
    const storageKey = `movieGridGlobalConfig_${locale}`
    localStorage.setItem(storageKey, JSON.stringify(updatedConfig));
    
    // // 强制重绘画布
    // setTimeout(() => {
    //   if (drawCanvas) {
    //     drawCanvas();
    //   }
    // }, 0);
    
    // 更新页面标题
    if (typeof document !== 'undefined') {
      document.title = newText;
    }
  };

  // 加载全局配置
  // 旧版存储迁移（如存在）
  useEffect(() => {
    const legacy = typeof window !== 'undefined' ? localStorage.getItem('movieGridGlobalConfig') : null
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy)
        const storageKey = `movieGridGlobalConfig_${locale}`
        localStorage.setItem(storageKey, JSON.stringify(parsed))
        localStorage.removeItem('movieGridGlobalConfig')
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  // 选择电影
  const handleSelectMovie = async (movie: MovieSearchResult) => {
    if (selectedCellId === null) return;
    
    // API 已经返回了处理好的路径（如 /tmdb-image/...），直接使用
    const imageUrl = movie.image;
    if (!imageUrl) return;

    try {
      // 先更新UI显示，让用户知道正在处理
      const tempUpdatedCell: MovieCell = {
        ...cells[selectedCellId],
        name: movie.name,
        image: imageUrl,
        imageObj: null,
      };
      
      setCells(cells.map((cell) => (cell.id === selectedCellId ? tempUpdatedCell : cell)));
      
      // 关闭搜索对话框，不挡着后续的UI操作
      setIsSearchDialogOpen(false);
      
      // 获取图片并转换为base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // 创建图片对象进行裁切
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // 创建canvas进行裁切
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to get canvas context');
      
      // 计算裁切尺寸
      const targetRatio = 3/4;
      const imgRatio = img.width / img.height;
      let cropWidth = img.width;
      let cropHeight = img.height;
      let cropX = 0;
      let cropY = 0;
      
      if (imgRatio > targetRatio) {
        // 图片更宽，需要裁切宽度
        cropWidth = img.height * targetRatio;
        cropX = (img.width - cropWidth) / 2;
      } else {
        // 图片更高，需要裁切高度
        cropHeight = img.width / targetRatio;
        cropY = (img.height - cropHeight) / 2;
      }
      
      // 限制输出尺寸不超过800px宽
      const MAX_WIDTH = 800;
      let outputWidth = cropWidth;
      let outputHeight = cropHeight;
      if (outputWidth > MAX_WIDTH) {
        outputWidth = MAX_WIDTH;
        outputHeight = outputWidth / targetRatio;
      }
      
      // 设置canvas尺寸为压缩后的尺寸
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      
      // 执行裁切和缩放
      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
      
      // 将裁切后的图片转换为base64，JPEG质量0.9
      const base64Url = canvas.toDataURL('image/jpeg', 0.9);
      
      // 清理资源
      URL.revokeObjectURL(img.src);
      
      // 使用base64格式的URL更新cell
      const finalUpdatedCell: MovieCell = {
        ...cells[selectedCellId],
        image: base64Url,
        name: movie.name,
        imageObj: null,
      };
      
      setCells(cells.map((cell) => (cell.id === selectedCellId ? finalUpdatedCell : cell)));
      
      // 保存到IndexedDB
      saveToIndexedDB(finalUpdatedCell);
    } catch (error) {
      console.error("转换图片为base64时出错:", error);
      // 如果转换失败，使用原始代理URL作为fallback
      const fallbackCell: MovieCell = {
        ...cells[selectedCellId],
        image: imageUrl,
        name: movie.name,
        imageObj: null,
      };
      
      setCells(cells.map((cell) => (cell.id === selectedCellId ? fallbackCell : cell)));
      saveToIndexedDB(fallbackCell);
    }
  };

  // 处理图片上传 - 打开裁剪对话框
  const handleImageUpload = async (file: File) => {
    if (selectedCellId === null) return;

    // 限制图片大小为3MB
    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_FILE_SIZE) {
      alert(t('error.file_too_large', { size: '3MB' }) || '图片文件过大,请上传小于3MB的图片');
      return;
    }

    try {
      // 读取文件为 Data URL
      const imageSrc = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to read image'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // 预加载图片以验证数据有效性
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Invalid image format'));
        img.src = imageSrc;
      });

      // 确保图片完全加载后再设置状态
      setUploadedImageSrc(imageSrc);
      setIsSearchDialogOpen(false); // 关闭搜索对话框
      
      // 使用 setTimeout 确保状态更新后再打开对话框
      setTimeout(() => {
        setIsCropDialogOpen(true);
      }, 100);
    } catch (error) {
      console.error('读取上传图片失败:', error);
      alert(t('error.image_load_failed_select_another'));
    }
  };

  // 处理裁剪确认
  const handleCropConfirm = async (croppedImageBase64: string) => {
    if (selectedCellId === null) return;

    try {
      // 更新单元格
      const updatedCell: MovieCell = {
        ...cells[selectedCellId],
        image: croppedImageBase64,
        imageObj: null,
      };

      setCells(cells.map((cell) => (cell.id === selectedCellId ? updatedCell : cell)));
      saveToIndexedDB(updatedCell);

      // 清理状态
      setUploadedImageSrc(null);
    } catch (error) {
      console.error('保存裁剪图片失败:', error);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="cursor-pointer"
        style={{
          width: `${CANVAS_CONFIG.width * scale}px`,
          height: `${CANVAS_CONFIG.height * scale}px`,
          maxWidth: "100%",
        }}
      />

      <p className="mt-4 px-4 text-sm text-gray-500 break-words">
        {isMobile 
          ? (() => {
              const text = t('ui.tip_edit');
              // 支持中文分号和英文句号分隔
              const parts = text.includes('；') ? text.split('；') : text.split('. ');
              return parts[0] + (text.includes('；') ? '。' : '.');
            })()
          : t('ui.tip_edit')
        }
      </p>

      <Button 
        onClick={() => generateImage(canvasRef)} 
        className="mt-6 px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 whitespace-normal text-center"
      >
        {t('ui.generate', { title: globalConfig.mainTitle })}
      </Button>

      {/* 电影搜索对话框 */}
      <MovieSearchDialog 
        isOpen={isSearchDialogOpen} 
        onOpenChange={setIsSearchDialogOpen} 
        onSelectMovie={handleSelectMovie}
        onUploadImage={handleImageUpload}
        cellId={selectedCellId}
      />
      
      {/* 标题编辑对话框 */}
      <TextEditDialog
        isOpen={isTitleDialogOpen}
        onOpenChange={setIsTitleDialogOpen}
        title={String(t('dialog.edit_title'))}
        defaultValue={editingText}
        onSave={handleSaveTitle}
      />
      
      {/* 电影名称编辑对话框 */}
      <TextEditDialog
        isOpen={isNameDialogOpen}
        onOpenChange={setIsNameDialogOpen}
        title={String(t('dialog.edit_movie_name'))}
        defaultValue={editingText}
        onSave={handleSaveName}
      />

      {/* 主标题编辑对话框 */}
      <TextEditDialog
        isOpen={isMainTitleDialogOpen}
        onOpenChange={setIsMainTitleDialogOpen}
        title={String(t('dialog.edit_main_title'))}
        defaultValue={editingText}
        onSave={handleSaveMainTitle}
      />

      {/* 图片裁剪对话框 */}
      <ImageCropDialog
        isOpen={isCropDialogOpen}
        onOpenChange={setIsCropDialogOpen}
        imageSrc={uploadedImageSrc}
        onConfirm={handleCropConfirm}
      />
    </>
  )
}

// 由于循环依赖问题，从常量文件导入CANVAS_CONFIG
import { CANVAS_CONFIG } from "../constants";
