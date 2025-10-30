"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/provider"

interface TextEditDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  title: string
  defaultValue: string
  onSave: (text: string) => void
}

export function TextEditDialog({
  isOpen,
  onOpenChange,
  title,
  defaultValue,
  onSave,
}: TextEditDialogProps) {
  const { t } = useI18n();
  const [text, setText] = useState(defaultValue)

  // 当对话框打开或默认值变化时更新文本
  useEffect(() => {
    setText(defaultValue)
  }, [defaultValue, isOpen])

  const handleSave = () => {
    onSave(text)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSave()
              }
            }}
          />
        </div>
        <DialogFooter className="flex flex-row justify-between gap-2 sm:justify-end sm:flex-row">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1 sm:flex-none"
          >
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
