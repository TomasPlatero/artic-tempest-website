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
                            title: 'Control de su Privacidad',
                            description: 'Utilizamos cookies propias y de terceros para fines analíticos y para mostrarle publicidad personalizada en base a un perfil elaborado a partir de sus hábitos de navegación. Al pulsar "Aceptar Todas", consiente el uso de todas las cookies. Al pulsar "Solo Esenciales", rechaza todas las que no sean necesarias para el funcionamiento. También puede configurar sus preferencias. <br/><br/>Más información en nuestra <a href="/cookies">Política de Cookies</a>.',
                            acceptAllBtn: 'Aceptar Todas',
                            acceptNecessaryBtn: 'Solo Esenciales',
                            showPreferencesBtn: 'Configurar'
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
