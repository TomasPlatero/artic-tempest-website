"use client"

import { useEffect } from "react"
import * as CookieConsent from "vanilla-cookieconsent"
import "vanilla-cookieconsent/dist/cookieconsent.css"

export function CookieConsentLoader() {
    useEffect(() => {
        CookieConsent.run({
            cookie: {
                name: 'guildboard_cookie_consent'
            },
            guiOptions: {
                consentModal: {
                    layout: 'box',
                    position: 'bottom right',
                    equalWeightButtons: true,
                    flipButtons: false
                },
                preferencesModal: {
                    layout: 'box',
                    position: 'right',
                    equalWeightButtons: true,
                    flipButtons: false
                }
            },
            categories: {
                necessary: {
                    readOnly: true,
                    enabled: true
                },
                analytics: {
                    readOnly: false,
                    enabled: false
                }
            },
            language: {
                default: 'es',
                translations: {
                    es: {
                        consentModal: {
                            title: 'Aviso de Privacidad y Cookies',
                            description: 'Utilizamos cookies propias estrictamente necesarias para el correcto funcionamiento de la plataforma (como mantener tu sesión protegida y activa). También usamos cookies para analizar el tráfico. Puedes ver más detalles en nuestra <a href="/cookies">Política de Cookies</a>.',
                            acceptAllBtn: 'Aceptar Todas',
                            acceptNecessaryBtn: 'Solo Esenciales',
                            showPreferencesBtn: 'Gestionar preferencias'
                        },
                        preferencesModal: {
                            title: 'Centro de Preferencias de Cookies',
                            acceptAllBtn: 'Aceptar Todas',
                            acceptNecessaryBtn: 'Solo Esenciales',
                            savePreferencesBtn: 'Guardar preferencias',
                            closeIconLabel: 'Cerrar modal',
                            sections: [
                                {
                                    title: 'Uso de Cookies',
                                    description: 'En este panel puedes revisar y personalizar tus preferencias respecto al uso de cookies. Ten en cuenta que bloquear algunos tipos de cookies puede afectar a tu experiencia en GuildBoard.'
                                },
                                {
                                    title: 'Cookies Estrictamente Necesarias',
                                    description: 'Estas cookies son imprescindibles para que la aplicación web funcione correctamente (inicio de sesión, seguridad y navegación). No pueden desactivarse.',
                                    linkedCategory: 'necessary'
                                },
                                {
                                    title: 'Cookies de Rendimiento y Análisis',
                                    description: 'Estas cookies nos permiten contabilizar las visitas y fuentes de tráfico de forma anónima, para poder evaluar el rendimiento y mejorar la plataforma.',
                                    linkedCategory: 'analytics'
                                }
                            ]
                        }
                    }
                }
            }
        })
    }, [])

    return null
}
