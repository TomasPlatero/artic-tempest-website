"use client"

import React from 'react'

export function SkipLink() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:font-black focus:uppercase focus:tracking-widest focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
        >
            Saltar al contenido principal
        </a>
    )
}
