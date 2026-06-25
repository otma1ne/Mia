import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toneStyles: Record<string, React.CSSProperties> = {
  purple:  { background: 'var(--mia-purple-soft)', color: 'var(--mia-purple-700)' },
  coral:   { background: 'var(--mia-coral-soft)',  color: '#9A3412' },
  blue:    { background: '#DCE8FB',                color: 'var(--mia-blue)' },
  neutral: { background: 'var(--mia-surface-2)',   color: 'var(--mia-slate)' },
}

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground",
        secondary:   "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline:     "border-border text-foreground",
        ghost:       "hover:bg-muted hover:text-muted-foreground",
        link:        "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({
  className,
  variant = "default",
  tone,
  render,
  style,
  ...props
}: useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    tone?: 'purple' | 'coral' | 'blue' | 'neutral'
  }) {
  const toneStyle = tone ? toneStyles[tone] : undefined
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant: tone ? undefined : variant }), className),
        style: { ...toneStyle, ...style },
      },
      props
    ),
    render,
    state: { slot: "badge", variant },
  })
}

export { Badge, badgeVariants }
