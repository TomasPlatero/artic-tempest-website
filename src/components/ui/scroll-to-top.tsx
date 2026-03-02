"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IconChevronUp } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)

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

        window.addEventListener("scroll", toggleVisibility)
        window.addEventListener("resize", toggleVisibility)
        return () => {
            window.removeEventListener("scroll", toggleVisibility)
            window.removeEventListener("resize", toggleVisibility)
        }
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    className="fixed bottom-6 right-6 z-[100] lg:hidden"
                >
                    <Button
                        size="icon"
                        onClick={scrollToTop}
                        className="size-12 rounded-full bg-zinc-950/80 backdrop-blur-xl border border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:bg-zinc-900 transition-all active:scale-90"
                    >
                        <IconChevronUp className="size-6" />
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
