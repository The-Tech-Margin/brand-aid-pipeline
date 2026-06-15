'use client'

// Makes the server-resolved brand (name + logo) available to client components that
// render outside the header — e.g. the public access-request modal — without threading
// props through every surface. Seeded once in the root layout from resolveBrand().
import { createContext, useContext, type ReactNode } from 'react'
import { DEFAULT_BRAND, type Brand } from './constants'

const BrandContext = createContext<Brand>(DEFAULT_BRAND)

export function BrandProvider({ brand, children }: { brand: Brand; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
}

export function useBrand(): Brand {
  return useContext(BrandContext)
}
