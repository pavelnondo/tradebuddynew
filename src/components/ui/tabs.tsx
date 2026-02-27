import * as React from "react"
import { createPortal } from "react-dom"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

interface Particle {
  id: string
  x: number
  y: number
  delay: number
  duration: number
  angle: number
  distance: number
  size: number
  color: string
}

const getAccentColor = (): string => {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()
  const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  const color = accent || primary || "#3b82f6"
  return color.startsWith("#") || color.startsWith("rgb") ? color : `hsl(${color})`
}

const createParticles = (rect: DOMRect, color: string, burstId: number): Particle[] => {
  const particles: Particle[] = []
  const count = 14
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    particles.push({
      id: `${burstId}-${i}`,
      x: centerX,
      y: centerY,
      delay: Math.random() * 0.08,
      duration: 0.4 + Math.random() * 0.2,
      angle,
      distance: 30 + Math.random() * 40,
      size: 4 + Math.random() * 5,
      color,
    })
  }
  return particles
}

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  showParticles?: boolean
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, onClick, onPointerDown, showParticles = true, ...props }, ref) => {
  const [particles, setParticles] = React.useState<Particle[]>([])
  const burstIdRef = React.useRef(0)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const triggerParticles = () => {
    if (!showParticles || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const color = getAccentColor()
    burstIdRef.current += 1
    setParticles(createParticles(rect, color, burstIdRef.current))
    setTimeout(() => setParticles([]), 700)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    triggerParticles()
    onPointerDown?.(e)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
  }

  const particlesPortal =
    typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="fixed pointer-events-none rounded-full"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size}px ${p.color}`,
                  zIndex: 99999,
                }}
                initial={{ x: -p.size / 2, y: -p.size / 2, opacity: 1, scale: 1 }}
                animate={{
                  x: -p.size / 2 + Math.cos(p.angle) * p.distance,
                  y: -p.size / 2 + Math.sin(p.angle) * p.distance,
                  opacity: 0,
                  scale: 0.2,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>,
          document.body
        )
      : null

  return (
    <>
      <TabsPrimitive.Trigger
        ref={(node) => {
          (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
          if (typeof ref === "function") ref(node)
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          className
        )}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        {...props}
      />
      {particlesPortal}
    </>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
