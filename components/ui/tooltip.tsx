"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

// 创建一个上下文来共享tooltip的开关状态
const TooltipClickContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null)

const Tooltip = ({ children, ...props }: TooltipPrimitive.TooltipProps) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <TooltipClickContext.Provider value={{ open, setOpen }}>
      <TooltipPrimitive.Root 
        open={open} 
        onOpenChange={setOpen}
        delayDuration={0} 
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipClickContext.Provider>
  )
}

// 自定义点击触发器
const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>((props, ref) => {
  const context = React.useContext(TooltipClickContext)
  
  const handleClick = (e: React.MouseEvent) => {
    // 调用原始onClick
    if (props.onClick) {
      props.onClick(e as any)
    }
    
    // 切换tooltip状态
    if (context) {
      context.setOpen(!context.open)
    }
  }
  
  return (
    <TooltipPrimitive.Trigger 
      {...props} 
      ref={ref} 
      onClick={handleClick}
    />
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[9999] overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } 