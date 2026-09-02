import { useEffect, useState } from 'react'
import { getCatalogProducts } from '../services/catalogService'
import type { Product, ProductGender } from '../types/catalog'

type CatalogProductsState = {
  error: Error | null
  loading: boolean
  products: Product[]
}

export function useCatalogProducts(gender: ProductGender) {
  const [state, setState] = useState<CatalogProductsState>({ error: null, loading: true, products: [] })

  useEffect(() => {
    let active = true

    getCatalogProducts({ gender })
      .then((products) => {
        if (active) setState({ error: null, loading: false, products })
      })
      .catch((error: unknown) => {
        if (active) setState({ error: error instanceof Error ? error : new Error('Unable to load the catalogue.'), loading: false, products: [] })
      })

    return () => { active = false }
  }, [gender])

  return state
}
