'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'none'
}

const hiddenTransforms = {
  up: 'translate3d(0, 28px, 0)',
  left: 'translate3d(-28px, 0, 0)',
  right: 'translate3d(28px, 0, 0)',
  none: 'translate3d(0, 0, 0)',
}

function useRevealVisibility() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisible(true)
        observer.unobserve(element)
      },
      { threshold: 0.12 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: ScrollRevealProps) {
  const { ref, visible } = useRevealVisibility()

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0, 0, 0)' : hiddenTransforms[direction],
        transition: `opacity 650ms cubic-bezier(.22,1,.36,1) ${delay}ms, transform 650ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export function StaggerReveal({
  children,
  className = '',
  interval = 120,
}: {
  children: ReactNode
  className?: string
  interval?: number
}) {
  const { ref, visible } = useRevealVisibility()

  return (
    <div ref={ref} className={className}>
      {Children.toArray(children).map((child, index) => (
        <div
          key={index}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 28px, 0)',
            transition: `opacity 650ms cubic-bezier(.22,1,.36,1) ${index * interval}ms, transform 650ms cubic-bezier(.22,1,.36,1) ${index * interval}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export function ParallaxOrb({
  className = '',
  speed = 0.15,
}: {
  className?: string
  speed?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame: number | null = null

    const update = () => {
      frame = null
      const bounds = element.getBoundingClientRect()
      const distanceFromCenter = bounds.top + bounds.height / 2 - window.innerHeight / 2
      element.style.transform = `translate3d(0, ${distanceFromCenter * speed}px, 0)`
    }

    const onScroll = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [speed])

  return <div ref={ref} className={className} aria-hidden="true" />
}
