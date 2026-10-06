"use client";

import { useEffect, useState } from "react";

const MOBILE_WORKSPACE_QUERY = "(max-width: 48rem)";

/** Keep side panels available on desktop and collapsed around the mobile editor. */
export function useMobileDisclosure() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(MOBILE_WORKSPACE_QUERY);
    const syncWithViewport = () => setIsOpen(!media.matches);
    syncWithViewport();

    media.addEventListener("change", syncWithViewport);
    return () => media.removeEventListener("change", syncWithViewport);
  }, []);

  return [isOpen, setIsOpen] as const;
}
