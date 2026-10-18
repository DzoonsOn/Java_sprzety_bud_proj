'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { money } from '../../components/EquipmentCard';
import EquipmentImage from '../../components/EquipmentImage';
import { STATUS_LABEL, StatusBadge } from '../../components/Status';
import RequireAuth from '../../components/RequireAuth';

const TABS = [
  ['stats', '📊 Podsumowanie'],
  ['equipment', '🚜 Sprzęt'],
  ['reservations', '📅 Rezerwacje'],
  ['categories', '🗂️ Kategorie'],
];

export default function AdminPage() {
  return <RequireAuth admin><Admin /></RequireAuth>;
}

function Admin() {
  const [tab, setTab] = useState('stats');
  return (
    <div className="container section">
      <h1>Panel administratora</h1>
      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'tab active' : 'tab'} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      {tab === 'stats' && <Stats />}
      {tab === 'equipment' && <EquipmentAdmin />}
      {tab === 'reservations' && <ReservationsAdmin />}
      {tab === 'categories' && <CategoriesAdmin />}
    </div>
  );
}

/** Hook do ładowania listy + obsługi błędów. */
function useLoad(fn) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => fn().then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message)), [fn]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, setError, reload };
}

function Stats() {
  const { data, error } = useLoad(api.admin.stats);
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <p>Ładowanie…</p>;
  const tiles = [
    ['Pozycji sprzętu', data.equipmentCount],
    ['Wszystkich rezerwacji', data.reservationCount],
    ['Oczekujących', data.pendingCount],
    ['Potwierdzonych', data.confirmedCount],
    ['Przychód (potw. + zakończone)', money(data.revenue)],
  ];
  return (
    <div className="stat-grid">
      {tiles.map(([label, value]) => (
        <div key={label} className="card stat"><strong>{value}</strong><span>{label}</span></div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- sprzęt

const EMPTY_EQ = { name: '', description: '', categoryId: '', pricePerDay: '', quantity: 1, imageUrl: '', active: true };

function EquipmentAdmin() {
  const { data, error, setError, reload } = useLoad(api.admin.equipment);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null); // { id?, ...pola }

  useEffect(() => { api.categories().then(setCats).catch(() => {}); }, []);

  async function remove(item) {
    if (!window.confirm(`Usunąć „${item.name}”?`)) return;
    try { await api.admin.deleteEquipment(item.id); reload(); } catch (e) { setError(e.message); }
  }

  async function toggle(item) {
    try {
      await api.admin.saveEquipment(item.id, {
        name: item.name, description: item.description, categoryId: item.category.id,
        pricePerDay: item.pricePerDay, quantity: item.quantity, imageUrl: item.imageUrl, active: !item.active,
      });
      reload();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="section-head">
        <h2>Sprzęt ({data?.length ?? 0})</h2>
        <button className="btn btn-primary" onClick={() => setEditing({ ...EMPTY_EQ, categoryId: cats[0]?.id ?? '' })}>+ Dodaj sprzęt</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="table-wrap card">
        <table>
          <thead>
            <tr><th></th><th>Nazwa</th><th>Kategoria</th><th>Cena/doba</th><th>Szt.</th><th>Ocena</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {data?.map((e) => (
              <tr key={e.id} className={e.active ? '' : 'inactive'}>
                <td className="thumb"><EquipmentImage src={e.imageUrl} icon={e.category.icon} alt="" /></td>
                <td><strong>{e.name}</strong></td>
                <td>{e.category.icon} {e.category.name}</td>
                <td>{money(e.pricePerDay)}</td>
                <td>{e.quantity}</td>
                <td>{e.reviewCount ? `★ ${e.avgRating} (${e.reviewCount})` : '–'}</td>
                <td><span className={`badge ${e.active ? 'status-confirmed' : 'status-cancelled'}`}>{e.active ? 'Aktywny' : 'Ukryty'}</span></td>
                <td className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ ...e, categoryId: e.category.id, imageUrl: e.imageUrl || '', description: e.description || '' })}>Edytuj</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggle(e)}>{e.active ? 'Ukryj' : 'Pokaż'}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(e)}>Usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <EquipmentForm
          initial={editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </>
  );
}

function EquipmentForm({ initial, cats, onClose, onSaved }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.admin.saveEquipment(initial.id, {
        name: f.name,
        description: f.description,
        categoryId: Number(f.categoryId),
        pricePerDay: Number(f.pricePerDay),
        quantity: Number(f.quantity),
        imageUrl: f.imageUrl,
        active: f.active,
      });
      onSaved();
    } catch (ex) {
      setErr(ex.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{initial.id ? 'Edycja sprzętu' : 'Nowy sprzęt'}</h2>
        <label>Nazwa *<input required maxLength="200" value={f.name} onChange={set('name')} /></label>
        <label>Opis<textarea rows="4" maxLength="2000" value={f.description} onChange={set('description')} /></label>
        <div className="row2">
          <label>Kategoria *
            <select required value={f.categoryId} onChange={set('categoryId')}>
              <option value="" disabled>Wybierz…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </label>
          <label>Liczba sztuk *<input required type="number" min="1" value={f.quantity} onChange={set('quantity')} /></label>
        </div>
        <div className="row2">
          <label>Cena za dobę (zł) *<input required type="number" min="0.01" step="0.01" value={f.pricePerDay} onChange={set('pricePerDay')} /></label>
          <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Widoczny w katalogu</label>
        </div>
        <label>URL zdjęcia<input type="url" maxLength="500" value={f.imageUrl} onChange={set('imageUrl')} placeholder="https://…" /></label>
        {err && <div className="alert alert-error">{err}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Zapisuję…' : 'Zapisz'}</button>
        </div>
      </form>
    </div>
  );
}

// ------------------------------------------------------------- rezerwacje

function ReservationsAdmin() {
  const { data, error, setError, reload } = useLoad(api.admin.reservations);
  const [filter, setFilter] = useState('');

  async function change(id, status) {
    try { await api.admin.setStatus(id, status); reload(); } catch (e) { setError(e.message); }
  }

  const rows = (data || []).filter((r) => !filter || r.status === filter);

  return (
    <>
      <div className="section-head">
        <h2>Rezerwacje ({rows.length})</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Wszystkie statusy</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="table-wrap card">
        <table>
          <thead><tr><th>#</th><th>Klient</th><th>Sprzęt</th><th>Termin</th><th>Kwota</th><th>Status</th><th>Zmień status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.userName}<br /><small className="muted">{r.userEmail}</small></td>
                <td>{r.equipmentName}{r.note && <><br /><small className="muted">„{r.note}”</small></>}</td>
                <td>{new Date(r.startDate).toLocaleDateString('pl-PL')} – {new Date(r.endDate).toLocaleDateString('pl-PL')}</td>
                <td>{money(r.totalPrice)}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  <select value={r.status} onChange={(e) => change(r.id, e.target.value)}>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && rows.length === 0 && <div className="empty">Brak rezerwacji.</div>}
      </div>
    </>
  );
}

// -------------------------------------------------------------- kategorie

function CategoriesAdmin() {
  const { data, error, setError, reload } = useLoad(api.categories);
  const [editing, setEditing] = useState(null);

  async function save(e) {
    e.preventDefault();
    try {
      await api.admin.saveCategory(editing.id, { name: editing.name, icon: editing.icon });
      setEditing(null);
      reload();
    } catch (ex) { setError(ex.message); }
  }

  async function remove(c) {
    if (!window.confirm(`Usunąć kategorię „${c.name}”?`)) return;
    try { await api.admin.deleteCategory(c.id); reload(); } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="section-head">
        <h2>Kategorie</h2>
        <button className="btn btn-primary" onClick={() => setEditing({ name: '', icon: '🔧' })}>+ Dodaj kategorię</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {editing && (
        <form className="card inline-form" onSubmit={save}>
          <input className="icon-input" maxLength="16" value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="🔧" />
          <input required maxLength="100" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Nazwa kategorii" />
          <button className="btn btn-primary">Zapisz</button>
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Anuluj</button>
        </form>
      )}
      <div className="table-wrap card">
        <table>
          <thead><tr><th>Ikona</th><th>Nazwa</th><th></th></tr></thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id}>
                <td style={{ fontSize: 22 }}>{c.icon}</td>
                <td>{c.name}</td>
                <td className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ ...c })}>Edytuj</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
