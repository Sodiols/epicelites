"use client";

import { createContext, useContext } from "react";

type Brand = { logoUrl: string; teamName: string };

const BrandContext = createContext<Brand>({ logoUrl: "/images/epic-elites-mark.webp", teamName: "Epic Elites" });

/** Makes the editable logo and team name available to client components (header, route curtain). */
export function BrandProvider({ children, ...brand }: Brand & { children: React.ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export const useBrand = () => useContext(BrandContext);
