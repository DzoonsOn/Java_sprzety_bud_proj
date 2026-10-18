import Keycloak from 'keycloak-js';

// Keycloak działa wyłącznie w przeglądarce – podczas renderowania po stronie serwera (SSR) instancji nie tworzymy
const keycloak =
  typeof window === 'undefined'
    ? null
    : new Keycloak({
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8081',
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'rental',
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT || 'rental-frontend',
      });

// init() może być wywołane tylko raz (React.StrictMode montuje komponenty dwukrotnie)
let initPromise;
export function initKeycloak() {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });
  }
  return initPromise;
}

export default keycloak;
