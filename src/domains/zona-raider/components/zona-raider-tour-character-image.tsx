"use client";

import * as React from "react";
import Image from "next/image";

function CharacterFallback() {
  return (
    <div className="flex size-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,32,0.92),rgba(5,8,16,0.96))]">
      <div className="relative flex size-full items-center justify-center">
        <div className="absolute inset-x-8 top-5 h-20 rounded-full bg-cyan-400/15 blur-2xl" />
        <div className="absolute inset-x-10 bottom-4 h-12 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <div className="size-14 rounded-2xl border border-white/10 bg-white/5 shadow-inner shadow-black/30" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
            Vista estática
          </p>
        </div>
      </div>
    </div>
  );
}

export function ZonaRaiderTourCharacterImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [hasError, setHasError] = React.useState(false);
  const eagerLoad = src.includes("/assets/images/tour/gnome-talking.webp");

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,32,0.92),rgba(5,8,16,0.96))]",
        className ?? "h-[168px]",
      ].join(" ")}
    >
      {hasError ? (
        <CharacterFallback />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          loading={eagerLoad ? "eager" : "lazy"}
          priority={eagerLoad}
          onError={() => setHasError(true)}
          className="object-contain p-2"
          sizes="(max-width: 768px) 92vw, 400px"
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(6,9,19,0.95))]" />
    </div>
  );
}
