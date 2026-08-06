import { useReducedMotion } from "framer-motion";

export function usePrefersReducedMotion() {
  return useReducedMotion() ?? false;
}

export function getScrollBehavior(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}
