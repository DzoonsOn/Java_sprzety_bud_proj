'use client';

import { useState } from 'react';

/** Zdjęcie sprzętu z ładnym zastępnikiem, gdy brak URL lub obraz się nie załaduje. */
export default function EquipmentImage({ src, icon = '🔧', alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className="img-fallback" aria-label={alt}>{icon}</div>;
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
