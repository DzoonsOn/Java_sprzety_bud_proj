'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../auth';

function NavItem({ href, children }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return <Link href={href} className={active ? 'active' : undefined}>{children}</Link>;
}

export default function Navbar() {
  const { ready, authenticated, user, isAdmin, login, register, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="brand-icon">🏗️</span> Bud<strong>Sprzęt</strong>
        </Link>
        <nav className="nav-links">
          <NavItem href="/catalog">Katalog</NavItem>
          {authenticated && <NavItem href="/my-reservations">Moje rezerwacje</NavItem>}
          {isAdmin && <NavItem href="/admin">Panel admina</NavItem>}
        </nav>
        <div className="nav-auth">
          {!ready ? null : authenticated ? (
            <>
              <span className="nav-user">👤 {user.name}{isAdmin && <em className="badge badge-admin">admin</em>}</span>
              <button className="btn btn-ghost" onClick={logout}>Wyloguj</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={register}>Załóż konto</button>
              <button className="btn btn-primary" onClick={() => login()}>Zaloguj się</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
