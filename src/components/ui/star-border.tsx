import { cn } from "../../lib/utils"
import { ElementType, ComponentPropsWithoutRef } from "react"

interface StarBorderProps<T extends ElementType> {
  as?: T
  color?: string
  speed?: string
  className?: string
  children: React.ReactNode
}

export function StarBorder<T extends ElementType = "button">({
  as,
  className,
  color,
  speed = "6s",
  children,
  ...props
}: StarBorderProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const Component = as || "button"
  const defaultColor = color || "hsl(var(--foreground))"

  return (
    <Component 
      className={cn(
        "relative inline-block py-[1px] overflow-hidden rounded-[20px]",
        className
      )} 
      {...props}
    >
      <div
        className={cn(
          "absolute w-[300%] h-[50%] bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0",
          "opacity-40 dark:opacity-60" 
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 15%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "absolute w-[300%] h-[50%] top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0",
          "opacity-40 dark:opacity-60"
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 15%)`,
          animationDuration: speed,
        }}
      />
      <div className={cn(
        "relative z-1 border text-center text-base py-4 px-6 rounded-[20px]",
        "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
        "border-slate-200/50 dark:border-slate-600/50",
        "shadow-lg hover:shadow-xl transition-shadow duration-300"
      )}>
        {children}
      </div>
    </Component>
  )
}
