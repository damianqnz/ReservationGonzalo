import { ImageCategory } from '@prisma/client'

// ─── Category config ──────────────────────────────────────────────────────────

export const IMAGE_CATEGORIES: Record<
  ImageCategory,
  { label: { pt: string; en: string; es: string }; icon: string; order: number }
> = {
  SALA:          { label: { pt: 'Sala',         en: 'Living Room', es: 'Sala'        }, icon: '🛋️', order: 1  },
  COZINHA:       { label: { pt: 'Cozinha',       en: 'Kitchen',     es: 'Cocina'      }, icon: '🍳', order: 2  },
  QUARTO:        { label: { pt: 'Quarto',        en: 'Bedroom',     es: 'Habitación'  }, icon: '🛏️', order: 3  },
  CASA_DE_BANHO: { label: { pt: 'Casa de Banho', en: 'Bathroom',    es: 'Baño'        }, icon: '🚿', order: 4  },
  EXTERIOR:      { label: { pt: 'Exterior',      en: 'Exterior',    es: 'Exterior'    }, icon: '🌿', order: 5  },
  ENTRADA:       { label: { pt: 'Entrada',       en: 'Entrance',    es: 'Entrada'     }, icon: '🚪', order: 6  },
  LAVANDARIA:    { label: { pt: 'Lavandaria',    en: 'Laundry',     es: 'Lavandería'  }, icon: '🧺', order: 7  },
  PISCINA:       { label: { pt: 'Piscina',       en: 'Pool',        es: 'Piscina'     }, icon: '🏊', order: 8  },
  JARDIM:        { label: { pt: 'Jardim',        en: 'Garden',      es: 'Jardín'      }, icon: '🌳', order: 9  },
  VARANDA:       { label: { pt: 'Varanda',       en: 'Balcony',     es: 'Balcón'      }, icon: '🌅', order: 10 },
  ESCRITORIO:    { label: { pt: 'Escritório',    en: 'Office',      es: 'Oficina'     }, icon: '💼', order: 11 },
  OUTRO:         { label: { pt: 'Outras',        en: 'Other',       es: 'Otras'       }, icon: '📷', order: 12 },
}

/**
 * Returns the human-readable label for an image category.
 * Defaults to Portuguese.
 */
export function getCategoryLabel(
  category: ImageCategory,
  lang: 'pt' | 'en' | 'es' = 'pt',
): string {
  return IMAGE_CATEGORIES[category]?.label[lang] ?? category
}

/**
 * Returns the emoji icon for an image category.
 */
export function getCategoryIcon(category: ImageCategory): string {
  return IMAGE_CATEGORIES[category]?.icon ?? '📷'
}

/**
 * Returns categories sorted by display order, filtered to only those
 * that have at least one image in the provided list.
 */
export function groupImagesByCategory<T extends { category: ImageCategory }>(
  images: T[],
): Array<{ category: ImageCategory; images: T[] }> {
  const grouped = new Map<ImageCategory, T[]>()

  for (const img of images) {
    const cat = img.category
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(img)
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => IMAGE_CATEGORIES[a].order - IMAGE_CATEGORIES[b].order)
    .map(([category, imgs]) => ({ category, images: imgs }))
}
