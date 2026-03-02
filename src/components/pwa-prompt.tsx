"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { IconDeviceDesktop, IconDownload, IconDeviceMobile } from "@tabler/icons-react"

export function PwaPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Register SW
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.error('Service worker registration failed:', err)
            })
        }

        // Check if already in PWA standalone mode
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches
        const isIOSStandalone = (window.navigator as any).standalone === true
        if (isStandaloneMatch || isIOSStandalone) {
            setIsStandalone(true)
            return
        }

        // Check platform
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
        setIsIOS(isIOSDevice)

        // Listen for standard browser install prompt (Android/Chrome/Edge)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    useEffect(() => {
        if (isStandalone) return; // App already installed

        const hasPrompted = localStorage.getItem("pwa_prompted")
        // To not overwhelm user, if they close the toast they aren't bothered again manually unless they trigger it

        if (deferredPrompt && !hasPrompted) {
            toast('Instala Artic Tempest Apps', {
                description: 'Añade la web a la pantalla de inicio de tu dispositivo para un acceso más rapido.',
                icon: <IconDownload className="text-primary" />,
                action: {
                    label: 'Instalar',
                    onClick: async () => {
                        deferredPrompt.prompt()
                        const { outcome } = await deferredPrompt.userChoice
                        if (outcome === 'accepted') {
                            console.log('User accepted the install prompt')
                        }
                        setDeferredPrompt(null)
                        localStorage.setItem("pwa_prompted", "true")
                    }
                },
                cancel: {
                    label: 'Más tarde',
                    onClick: () => localStorage.setItem("pwa_prompted", "true")
                },
                duration: 10000,
            })
        } else if (isIOS && !hasPrompted) {
            toast('Instala Artic Tempest en tu iPhone', {
                description: 'Pulsa el botón Compartir y luego "Añadir a pantalla de inicio" para instalarla como una App nativa.',
                icon: <IconDeviceMobile className="text-primary" />,
                action: {
                    label: 'Entendido',
                    onClick: () => localStorage.setItem("pwa_prompted", "true")
                },
                duration: 15000,
            })
        }

    }, [deferredPrompt, isIOS, isStandalone])

    return null
}
