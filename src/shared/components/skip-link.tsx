"use client"

import React from 'react'

export function SkipLink() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-blue-700 focus:text-white focus:font-black focus:uppercase focus:tracking-widest focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black transition-all"
        >
            Saltar al contenido principal
        </a>
    )
}
