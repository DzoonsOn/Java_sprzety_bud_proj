'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../api';
import EquipmentCard from '../components/EquipmentCard';

const STEPS = [
  { icon: '🔍', title: 'Wybierz sprzęt', text: 'Przeglądaj katalog, filtruj po kategorii, cenie i dostępności w wybranym terminie.' },
  { icon: '📅', title: 'Zarezerwuj online', text: 'Wskaż daty, zobacz cenę od razu i potwierdź rezerwację na swoim koncie.' },
  { icon: '🚚', title: 'Odbierz i pracuj', text: 'Odbierz sprzęt w naszej wypożyczalni – gotowy, sprawdzony i zatankowany.' },
];

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState([]);
  const [top, setTop] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.categories(), api.equipment({ sort: 'rating' })])
      .then(([c, e]) => {
        setCategories(c);
        setTop(e.slice(0, 6));
      })
      .catch((e) => setError(e.message));
  }, []);

  const search = (e) => {
    e.preventDefault();
    router.push(`/catalog?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1>Sprzęt budowlany <span>na każdą budowę</span></h1>
          <p>Młoty, zagęszczarki, agregaty, rusztowania. Zarezerwuj online w kilka minut i odbierz w dniu rozpoczęcia prac.</p>
          <form className="hero-search" onSubmit={search}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Czego szukasz? np. młot wyburzeniowy" />
            <button className="btn btn-primary" type="submit">Szukaj</button>
          </form>
          <div className="hero-stats">
            <div><strong>12+</strong><span>modeli sprzętu</span></div>
            <div><strong>24 h</strong><span>potwierdzenie rezerwacji</span></div>
            <div><strong>100%</strong><span>sprawdzony sprzęt</span></div>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>Kategorie</h2>
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.id} href={`/catalog?categoryId=${c.id}`} className="cat-tile">
              <span className="cat-icon">{c.icon}</span>
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Najwyżej oceniane</h2>
          <Link href="/catalog" className="link">Cały katalog →</Link>
        </div>
        {error && <div className="alert alert-error">Nie udało się pobrać danych: {error}</div>}
        <div className="grid">
          {top.map((item) => <EquipmentCard key={item.id} item={item} />)}
        </div>
      </section>

      <section className="steps-wrap">
        <div className="container section">
          <h2 style={{ textAlign: 'center' }}>Jak to działa?</h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="step">
                <div className="step-num">{i + 1}</div>
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
