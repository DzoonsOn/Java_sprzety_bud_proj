'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../api';
import { money } from '../../components/EquipmentCard'
import RequireAuth from '../../components/RequireAuth';
import { StatusBadge } from '../../components/Status';

export default function MyReservationsPage() {
  return <RequireAuth><MyReservations /></RequireAuth>;
}

function MyReservations() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.myReservations().then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function cancel(id) {
    if (!window.confirm('Na pewno anulować tę rezerwację?')) return;
    try {
      await api.cancelReservation(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="container section">
      <h1>Moje rezerwacje</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {list === null && !error && <p>Ładowanie…</p>}
      {list && list.length === 0 && (
        <div className="empty">Nie masz jeszcze rezerwacji. <Link href="/catalog" className="link">Przeglądaj katalog →</Link></div>
      )}
      <div className="res-list">
        {list?.map((r) => (
          <div key={r.id} className="card res-item">
            <div>
              <Link href={`/equipment/${r.equipmentId}`}><h3>{r.equipmentName}</h3></Link>
              <p className="muted">
                {new Date(r.startDate).toLocaleDateString('pl-PL')} – {new Date(r.endDate).toLocaleDateString('pl-PL')}
              </p>
              {r.note && <p className="muted">„{r.note}”</p>}
            </div>
            <div className="res-right">
              <StatusBadge status={r.status} />
              <strong>{money(r.totalPrice)}</strong>
              {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                <button className="btn btn-ghost btn-sm" onClick={() => cancel(r.id)}>Anuluj</button>
              )}
              {r.status !== 'CANCELLED' && (
                <Link className="btn btn-ghost btn-sm" href={`/equipment/${r.equipmentId}#reviews`}>Oceń</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
