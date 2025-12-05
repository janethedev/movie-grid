"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/provider"

interface ImagePreviewDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string | null
}

export function ImagePreviewDialog({ isOpen, onOpenChange, imageSrc }: ImagePreviewDialogProps) {
  const { t } = useI18n()
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  // 将 base64 转换为 blob url，解决部分安卓浏览器无法长按保存 base64 图片的问题
  useEffect(() => {
    if (isOpen && imageSrc) {
      setLoadError(false)
      try {
        fetch(imageSrc)
          .then((res) => res.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob)
            setBlobUrl(url)
          })
          .catch((err) => {
            console.error("Failed to create blob from base64:", err)
            // 失败时回退到原始 base64
            setBlobUrl(imageSrc)
          })
      } catch (e) {
        setBlobUrl(imageSrc)
      }
    } else {
      // 关闭时清理
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl)
      }
      setBlobUrl(null)
    }

    return () => {
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, imageSrc])

  if (!imageSrc) return null

  const handleDownload = () => {
    if (!blobUrl) return
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = `movie-grid-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 使用 blobUrl 优先，如果没有转换完成则使用 imageSrc
  const displaySrc = blobUrl || imageSrc

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-h-[90vh] sm:max-w-md md:max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('preview.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500 text-center">
            {t('preview.long_press_tip')}
          </p>
          
          <div className="relative w-full rounded overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 min-h-[200px] flex items-center justify-center">
            {loadError ? (
              <div className="text-center p-4 space-y-2">
                <p className="text-red-500">{t('error.image_load_failed')}</p>
                <Button variant="link" onClick={handleDownload} className="text-blue-500">
                  {t('common.download_directly') || "Download Directly"}
                </Button>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={displaySrc} 
                alt="Generated Grid" 
                className="w-full h-auto object-contain"
                style={{ 
                  WebkitTouchCallout: "default", // 尝试强制开启长按菜单
                }}
                onError={() => setLoadError(true)}
              />
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-center">
          <Button 
            variant="default" 
            onClick={handleDownload}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {t('common.save')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
