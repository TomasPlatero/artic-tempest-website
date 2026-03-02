"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/infrastructure/tailwind/tailwind-utils"

function Slider({
    className,
    defaultValue,
    value,
    min = 0,
    max = 100,
    step = 1,
    ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
    const _values = React.useMemo(
        () => (value ? (Array.isArray(value) ? value : [value]) : Array.isArray(defaultValue) ? defaultValue : [defaultValue ?? 0]),
        [value, defaultValue]
    )

    return (
        <SliderPrimitive.Root
            data-slot="slider"
            className={cn(
                "relative flex w-full touch-none select-none items-center",
                className
            )}
            value={_values}
            min={min}
            max={max}
            step={step}
            {...props}
        >
            <SliderPrimitive.Track
                data-slot="slider-track"
                className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full"
            >
                <SliderPrimitive.Range
                    data-slot="slider-range"
                    className="bg-primary absolute h-full"
                />
            </SliderPrimitive.Track>
            {_values.map((_, index) => (
                <SliderPrimitive.Thumb
                    key={index}
                    data-slot="slider-thumb"
                    className="border-primary bg-background ring-ring/50 block h-4 w-4 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
                />
            ))}
        </SliderPrimitive.Root>
    )
}

export { Slider }
