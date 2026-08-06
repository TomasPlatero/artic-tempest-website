"use client";

import { useEffect, useState } from "react";

/**
 * Detección ligera de adblock mediante un bait element oculto.
 * No bloquea al usuario: solo permite mostrar un aviso amable.
 */
export function useAdblockDetection() {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const bait = document.createElement("div");
    bait.className = "adsbox ad-banner ad-unit adsbygoogle";
    bait.setAttribute("aria-hidden", "true");
    bait.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;width:10px;height:10px;pointer-events:none;opacity:0;";

    document.body.appendChild(bait);

    const check = () => {
      const computed = window.getComputedStyle(bait);
      const blocked =
        computed.display === "none" ||
        computed.visibility === "hidden" ||
        bait.offsetParent === null ||
        bait.offsetHeight === 0 ||
        bait.clientHeight === 0;

      setDetected(blocked);
      bait.remove();
    };

    const timer = window.setTimeout(check, 350);

    return () => {
      window.clearTimeout(timer);
      bait.remove();
    };
  }, []);

  return detected;
}
