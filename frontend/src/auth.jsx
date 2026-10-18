'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import keycloak, { initKeycloak } from './keycloak';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    initKeycloak()
      .then((auth) => setAuthenticated(auth))
      .catch((e) => console.error('Keycloak init failed', e))
      .finally(() => setReady(true));

    keycloak.onAuthLogout = () => setAuthenticated(false);
  }, []);

  const value = {
    ready,
    authenticated,
    login: (redirectUri) => keycloak.login({ redirectUri: redirectUri || window.location.href }),
    register: () => keycloak.register({ redirectUri: window.location.origin }),
    logout: () => keycloak.logout({ redirectUri: window.location.origin }),
    user: authenticated
      ? {
          id: keycloak.subject,
          name: keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username,
          username: keycloak.tokenParsed?.preferred_username,
          email: keycloak.tokenParsed?.email,
        }
      : null,
    isAdmin: authenticated && keycloak.hasRealmRole('admin'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
