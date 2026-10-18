'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../api';
import { useAuth } from '../../../auth';
import Stars from '../../../components/Stars';
import EquipmentImage from '../../../components/EquipmentImage';
import { money } from '../../../components/EquipmentCard';

const iso = (d) => d.toISOString().slice(0, 10);
const today = () => iso(new Date());
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

export default function EquipmentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { authenticated, login } = useAuth();

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [note, setNote] = useState('');
  const [avail, setAvail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState(null);

  const loadAll = useCallback(() => {
    Promise.all([api.equipmentById(id), api.reviews(id)])
      .then(([e, r]) => { setItem(e); setReviews(r); })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(loadAll, [loadAll]);

  useEffect(() => {
    if (!start || !end || end < start) { setAvail(null); return; }
    api.availability(id, start, end).then(setAvail).catch(() => setAvail(null));
  }, [id, start, end]);

  if (error) return <div className="container section"><div className="alert alert-error">{error}</div></div>;
  if (!item) return <div className="center-msg">Ładowanie…</div>;

  const validDates = start && end && end >= start;
  const days = validDates ? daysBetween(start, end) : 0;
  const total = days * Number(item.pricePerDay);

  async function reserve(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.reserve({ equipmentId: item.id, startDate: start, endDate: end, note });
      router.push('/my-reservations');
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    setReviewMsg(null);
    try {
      await api.addReview(item.id, { rating, comment });
      setComment('');
      setReviewMsg({ type: 'ok', text: 'Dziękujemy za opinię!' });
      loadAll();
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.message });
    }
  }

  return (
    <div className="container section">
      <Link href="/catalog" className="link">← Wróć do katalogu</Link>

      <div className="detail">
        <div className="detail-main">
          <div className="detail-img"><EquipmentImage src={item.imageUrl} icon={item.category.icon} alt={item.name} /></div>
          <span className="chip chip-static">{item.category.icon} {item.category.name}</span>
          <h1>{item.name}</h1>
          <div className="eq-rating">
            <Stars value={item.avgRating} size={20} />
            <span>{item.reviewCount ? `${item.avgRating} / 5 · ${item.reviewCount} opinii` : 'Brak opinii'}</span>
          </div>
          <p className="desc">{item.description || 'Brak opisu.'}</p>
          <p className="muted">W naszej flocie: {item.quantity} szt.</p>
        </div>

        <aside className="card booking">
          <div className="price-big">{money(item.pricePerDay)} <small>/ doba</small></div>

          {!item.active ? (
            <div className="alert alert-error">Sprzęt chwilowo niedostępny.</div>
          ) : (
            <form onSubmit={reserve}>
              <div className="row2">
                <label>Od
                  <input type="date" min={today()} value={start}
                         onChange={(e) => { setStart(e.target.value); if (end < e.target.value) setEnd(e.target.value); }} />
                </label>
                <label>Do
                  <input type="date" min={start || today()} value={end} onChange={(e) => setEnd(e.target.value)} />
                </label>
              </div>

              <label>Uwagi (opcjonalnie)
                <textarea rows="2" maxLength="500" value={note} onChange={(e) => setNote(e.target.value)}
                          placeholder="np. potrzebuję transportu" />
              </label>

              {avail && (
                <div className={`alert ${avail.available ? 'alert-ok' : 'alert-error'}`}>
                  {avail.available ? `✔ Dostępne: ${avail.availableUnits} z ${avail.quantity} szt.` : '✖ Brak wolnych sztuk w tym terminie'}
                </div>
              )}

              {validDates && (
                <div className="sum">
                  <span>{days} {days === 1 ? 'doba' : 'dób'} × {money(item.pricePerDay)}</span>
                  <strong>{money(total)}</strong>
                </div>
              )}

              {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

              {authenticated ? (
                <button className="btn btn-primary btn-block" disabled={busy || !validDates || (avail && !avail.available)}>
                  {busy ? 'Rezerwuję…' : 'Zarezerwuj'}
                </button>
              ) : (
                <button type="button" className="btn btn-primary btn-block" onClick={() => login()}>
                  Zaloguj się, aby zarezerwować
                </button>
              )}
            </form>
          )}
        </aside>
      </div>

      <section className="reviews" id="reviews">
        <h2>Opinie klientów</h2>

        {authenticated ? (
          <form className="card review-form" onSubmit={submitReview}>
            <h3>Dodaj swoją opinię</h3>
            <Stars value={rating} onChange={setRating} size={26} />
            <textarea rows="3" maxLength="1000" value={comment} onChange={(e) => setComment(e.target.value)}
                      placeholder="Jak sprawdził się sprzęt?" />
            {reviewMsg && <div className={`alert alert-${reviewMsg.type}`}>{reviewMsg.text}</div>}
            <button className="btn btn-primary">Opublikuj opinię</button>
            <small className="muted">Opinię mogą dodawać klienci, którzy zarezerwowali ten sprzęt. Ponowne dodanie aktualizuje Twoją opinię.</small>
          </form>
        ) : (
          <div className="alert">Zaloguj się, aby ocenić ten sprzęt.</div>
        )}

        {reviews.length === 0 && <p className="muted">Nikt jeszcze nie ocenił tego sprzętu.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="card review">
            <div className="review-head">
              <strong>{r.userName}</strong>
              <Stars value={r.rating} size={15} />
              <small className="muted">{new Date(r.createdAt).toLocaleDateString('pl-PL')}</small>
            </div>
            {r.comment && <p>{r.comment}</p>}
          </div>
        ))}
      </section>
    </div>
  );
}
