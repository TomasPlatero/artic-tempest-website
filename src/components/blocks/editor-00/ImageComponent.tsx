"use client"

import Image from "next/image"

export default function ImageComponent({
    src,
    altText,
    width,
    height,
    nodeKey,
}: {
    altText: string
    height: "inherit" | number
    nodeKey: string
    src: string
    width: "inherit" | number
}) {
    return (
        <div className="relative inline-block max-w-full my-4 group">
            <Image
                src={src}
                alt={altText}
                width={width === "inherit" ? 800 : width}
                height={height === "inherit" ? 600 : height}
                unoptimized
                className="rounded-lg shadow-md border max-w-full h-auto transition-all group-hover:ring-2 group-hover:ring-primary/50"
                style={{
                    width: width === "inherit" ? "auto" : width,
                    height: height === "inherit" ? "auto" : height,
                }}
            />
        </div>
    )
}
