"use client"

import { useState, useEffect } from "react"
import { IconChevronUp } from "@/shared/ui/tabler-icons"
import { Button } from "@/shared/ui/button"
import { getScrollBehavior, usePrefersReducedMotion } from "@/shared/lib/use-prefers-reduced-motion"

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)
    const prefersReducedMotion = usePrefersReducedMotion()

    useEffect(() => {
        const toggleVisibility = () => {
            // Only show on small screens and after scrolling 300px
            const isMobile = window.innerWidth < 1024
            if (isMobile && window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener("scroll", toggleVisibility, { passive: true })
        window.addEventListener("resize", toggleVisibility)
        return () => {
            window.removeEventListener("scroll", toggleVisibility)
            window.removeEventListener("resize", toggleVisibility)
        }
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: getScrollBehavior(prefersReducedMotion),
        })
    }

    return (
        <div
            className={`fixed bottom-6 right-6 z-[100] lg:hidden  ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-5 scale-90 pointer-events-none"}`}
        >
            <Button
                size="icon"
                onClick={scrollToTop}
                className="size-12 rounded-full bg-zinc-950/80 backdrop-blur-xl border border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:bg-zinc-900  active:scale-90"
            >
                <IconChevronUp className="size-6" />
            </Button>
        </div>
    )
}
