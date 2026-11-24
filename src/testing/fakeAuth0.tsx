/**
 * Stand-in for `@auth0/auth0-react`, used ONLY when Vite runs with `--mode e2e` (see vite.config.ts).
 * The Cypress suite stubs every `/api` call, so it needs a logged-in user but no real Auth0 tenant.
 * The production build never resolves to this file.
 */
import {ComponentType, ReactNode} from "react";

export const E2E_USER = {sub: "auth0|e2e-owner", name: "E2E Owner", email: "e2e@example.com"};
export const E2E_TOKEN = "e2e-token";

const auth = {
    isAuthenticated: true,
    isLoading: false,
    user: E2E_USER,
    error: undefined,
    getAccessTokenSilently: async () => E2E_TOKEN,
    getAccessTokenWithPopup: async () => E2E_TOKEN,
    getIdTokenClaims: async () => undefined,
    loginWithRedirect: async () => undefined,
    loginWithPopup: async () => undefined,
    logout: async () => undefined,
    handleRedirectCallback: async () => ({}),
};

export const useAuth0 = () => auth;

export const Auth0Provider = ({children}: { children?: ReactNode; [key: string]: unknown }) => <>{children}</>;

export function withAuthenticationRequired<P extends object>(Component: ComponentType<P>): ComponentType<P> {
    return Component;
}
