'use client';

import Link from 'next/link';
import Stars from './Stars';
import EquipmentImage from './EquipmentImage';

export const money = (v) => `${Number(v).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`;

export default function EquipmentCard({ item }) {
  return (
    <Link href={`/equipment/${item.id}`} className="card eq-card">
      <div className="eq-img">
        <EquipmentImage src={item.imageUrl} icon={item.category.icon} alt={item.name} />
        <span className="chip">{item.category.icon} {item.category.name}</span>
        {item.availableUnits != null && (
          <span className="chip chip-right ok">Dostępne: {item.availableUnits} szt.</span>
        )}
      </div>
      <div className="eq-body">
        <h3>{item.name}</h3>
        <div className="eq-rating">
          <Stars value={item.avgRating} size={15} />
          <small>{item.reviewCount ? `${item.avgRating} (${item.reviewCount})` : 'brak ocen'}</small>
        </div>
        <div className="eq-price">
          <strong>{money(item.pricePerDay)}</strong> <small>/ doba</small>
        </div>
      </div>
    </Link>
  );
}
