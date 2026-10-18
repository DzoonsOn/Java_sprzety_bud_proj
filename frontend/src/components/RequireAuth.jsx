'use client';

import { useAuth } from '../auth';

export default function RequireAuth({ children, admin = false }) {
  const { ready, authenticated, isAdmin, login } = useAuth();
  if (!ready) return <div className="center-msg">Ładowanie…</div>;
  if (!authenticated) {
    return (
      <div className="center-msg">
        <h2>Wymagane logowanie</h2>
        <p>Zaloguj się, aby zobaczyć tę stronę.</p>
        <button className="btn btn-primary" onClick={() => login()}>Zaloguj się</button>
      </div>
    );
  }
  if (admin && !isAdmin) {
    return (
      <div className="center-msg">
        <h2>Brak uprawnień</h2>
        <p>Ta sekcja jest dostępna tylko dla administratorów.</p>
      </div>
    );
  }
  return children;
}
