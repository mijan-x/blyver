import { useEffect, useState } from "react";
import { getCategories } from "../services/catalogService";
import type { Category, ProductGender } from "../types/catalog";

export function useCategories(gender: ProductGender) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;

    getCategories(gender)
      .then((result) => {
        if (active) setCategories(result);
      })
      .catch(() => {
        // Chips are a filtering convenience; if they fail to load, the
        // catalogue itself (via useCatalogProducts) still shows its own error.
        if (active) setCategories([]);
      });

    return () => {
      active = false;
    };
  }, [gender]);

  return categories;
}
