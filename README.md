# BudSprzęt – wypożyczalnia sprzętu budowlanego

Spring Boot 3 (Java 21) · PostgreSQL · Keycloak · React + Next.js

```
.
├── docker-compose.yml        # PostgreSQL + Keycloak (realm importowany automatycznie)
├── keycloak/rental-realm.json
├── backend/                  # REST API (Spring Boot, resource server JWT, Flyway)
└── frontend/                 # Next.js 15 (App Router) + React 19, keycloak-js
```

## Uruchomienie

1. **Baza i Keycloak**
   ```bash
   docker compose up -d
   ```
   - PostgreSQL: `localhost:5432` (db/user/hasło: `rental`)
   - Keycloak: <http://localhost:8081> (konsola: `admin` / `admin`), realm `rental` importuje się sam.
2. **Backend** (port 8080)
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   Flyway tworzy tabele i wgrywa przykładowy sprzęt (12 pozycji, 6 kategorii).
3. **Frontend** (port 3000)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Otwórz <http://localhost:3000>. Next.js przekazuje `/api` do backendu (`rewrites` w `next.config.mjs`).

## Konta testowe (realm `rental`)

| Login   | Hasło   | Role          |
|---------|---------|---------------|
| `admin` | `admin` | admin + user  |
| `klient`| `klient`| user          |

Nowi klienci mogą się sami zarejestrować (przycisk „Załóż konto” → ekran Keycloaka).

## Funkcje

**Klient** – strona główna (hero, kategorie, najwyżej oceniane), katalog z filtrami (tekst, kategoria, przedział cen,
dostępność w terminie, minimalna ocena, sortowanie), szczegóły sprzętu, rezerwacja z wyliczeniem ceny i sprawdzaniem
dostępności, „Moje rezerwacje” z anulowaniem, opinie 1–5 ★ (po zarezerwowaniu danego sprzętu).

**Admin** (`/admin`, rola `admin`) – statystyki, CRUD sprzętu (dodawanie, edycja, ukrywanie, usuwanie),
CRUD kategorii, lista wszystkich rezerwacji ze zmianą statusu.

## API (skrót)

| Metoda | Ścieżka | Dostęp |
|--------|---------|--------|
| GET | `/api/categories`, `/api/equipment`, `/api/equipment/{id}`, `/api/equipment/{id}/availability`, `/api/equipment/{id}/reviews` | publiczny |
| POST | `/api/equipment/{id}/reviews` | zalogowany |
| POST / GET | `/api/reservations`, `/api/reservations/my`; POST `/api/reservations/{id}/cancel` | zalogowany |
| * | `/api/admin/**` (sprzęt, kategorie, rezerwacje, statystyki) | rola `admin` |

## Uwagi

- Dostępność: rezerwacja jest możliwa, gdy liczba nakładających się rezerwacji (PENDING/CONFIRMED) jest mniejsza niż
  liczba sztuk. To podejście konserwatywne – w skrajnych układach terminów może odrzucić rezerwację, która fizycznie by się zmieściła.
  Równoległe rezerwacje tego samego sprzętu są serializowane blokadą wiersza.
- Role pochodzą z `realm_access.roles` tokenu Keycloaka; backend mapuje je na `ROLE_*`.
- Zmienne środowiskowe backendu: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `KEYCLOAK_ISSUER`, `CORS_ORIGINS`.
  Frontendu: `NEXT_PUBLIC_KEYCLOAK_URL`, `NEXT_PUBLIC_KEYCLOAK_REALM`, `NEXT_PUBLIC_KEYCLOAK_CLIENT`, `NEXT_PUBLIC_API_URL`, `API_URL` (adres backendu dla proxy `/api`).
- Jeśli Keycloak był już uruchomiony ze starym realmem (port 5173), import go nie nadpisze. Zrób `docker compose down -v && docker compose up -d`
  albo w konsoli Keycloaka zmień redirect URI klienta `rental-frontend` na `http://localhost:3000/*`.
- Na produkcji: włącz HTTPS (`sslRequired`), zmień hasła z realmu, ustaw właściwe `redirectUris`/`webOrigins`.
