'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../api';
import EquipmentCard from '../../components/EquipmentCard';

const FIELDS = ['q', 'categoryId', 'minPrice', 'maxPrice', 'start', 'end', 'minRating', 'sort'];
const today = () => new Date().toISOString().slice(0, 10);

export default function CatalogPage() {
  // useSearchParams wymaga granicy Suspense w Next.js
  return <Suspense fallback={<div className="center-msg">Ładowanie…</div>}><Catalog /></Suspense>;
}

function Catalog() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState(params.get('q') || '');

  const filters = Object.fromEntries(FIELDS.map((f) => [f, params.get(f) || '']));
  const key = JSON.stringify(filters);

  useEffect(() => { api.categories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    api.equipment(filters)
      .then((r) => { setItems(r); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // wyszukiwanie tekstowe z opóźnieniem, żeby nie odpytywać API przy każdej literze
  useEffect(() => {
    const t = setTimeout(() => set('q', q), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function set(name, value) {
    const next = new URLSearchParams(params);
    value ? next.set(name, value) : next.delete(name);
    if (next.toString() !== params.toString()) {
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    }
  }

  const reset = () => { setQ(''); router.replace(pathname, { scroll: false }); };

  return (
    <div className="container section catalog">
      <aside className="filters card">
        <h3>Filtry</h3>

        <label>Szukaj
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="nazwa lub opis" />
        </label>

        <label>Kategoria
          <select value={filters.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">Wszystkie</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </label>

        <div className="row2">
          <label>Cena od (zł)
            <input type="number" min="0" value={filters.minPrice} onChange={(e) => set('minPrice', e.target.value)} />
          </label>
          <label>do (zł)
            <input type="number" min="0" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
          </label>
        </div>

        <fieldset>
          <legend>Dostępny w terminie</legend>
          <div className="row2">
            <label>Od
              <input type="date" min={today()} value={filters.start} onChange={(e) => set('start', e.target.value)} />
            </label>
            <label>Do
              <input type="date" min={filters.start || today()} value={filters.end} onChange={(e) => set('end', e.target.value)} />
            </label>
          </div>
        </fieldset>

        <label>Minimalna ocena
          <select value={filters.minRating} onChange={(e) => set('minRating', e.target.value)}>
            <option value="">Dowolna</option>
            <option value="4">★ 4+</option>
            <option value="3">★ 3+</option>
            <option value="2">★ 2+</option>
          </select>
        </label>

        <label>Sortuj
          <select value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="">Najnowsze</option>
            <option value="rating">Najwyżej oceniane</option>
            <option value="price_asc">Cena rosnąco</option>
            <option value="price_desc">Cena malejąco</option>
            <option value="name">Nazwa A–Z</option>
          </select>
        </label>

        <button className="btn btn-ghost" onClick={reset}>Wyczyść filtry</button>
      </aside>

      <section className="results">
        <div className="section-head">
          <h2>Katalog sprzętu</h2>
          <span className="muted">{loading ? 'Szukam…' : `Znaleziono: ${items.length}`}</span>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="empty">😕 Nic nie znaleziono. Zmień filtry i spróbuj ponownie.</div>
        )}
        <div className="grid">
          {items.map((item) => <EquipmentCard key={item.id} item={item} />)}
        </div>
      </section>
    </div>
  );
}
