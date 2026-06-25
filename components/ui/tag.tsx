import { cn } from "@/lib/utils"
import * as React from "react"

const tagStyles = {
  outline: {
    background: 'transparent',
    color: 'var(--mia-purple)',
    border: '1px solid var(--mia-purple)',
  },
  solid: {
    background: 'var(--mia-purple-soft)',
    color: 'var(--mia-purple-700)',
    border: '1px solid transparent',
  },
  neutral: {
    background: 'transparent',
    color: 'var(--mia-slate)',
    border: '1px solid var(--mia-border)',
  },
}

function Tag({
  variant = 'outline',
  className,
  style,
  ...props
}: React.ComponentProps<'span'> & {
  variant?: 'outline' | 'solid' | 'neutral'
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-3 py-1 text-[13px] font-medium leading-none",
        className
      )}
      style={{ ...tagStyles[variant], ...style }}
      {...props}
    />
  )
}

export { Tag }
