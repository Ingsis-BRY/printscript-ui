import React from 'react';
import App from './App.tsx'
import './index.css'
import {createRoot} from "react-dom/client";
import {PaginationProvider} from "./contexts/paginationProvider.tsx";
import {SnackbarProvider} from "./contexts/snackbarProvider.tsx";
import {Auth0Provider} from "@auth0/auth0-react";
import {AccessTokenBridge} from "./components/auth/AccessTokenBridge.tsx";

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN ?? ""}
            clientId={import.meta.env.VITE_AUTH0_CLIENT_ID ?? ""}
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                scope: "openid profile email read:snippets write:snippets"
            }}
            cacheLocation="localstorage"
        >
            <AccessTokenBridge>
                <PaginationProvider>
                    <SnackbarProvider>
                        <App/>
                    </SnackbarProvider>
                </PaginationProvider>
            </AccessTokenBridge>
        </Auth0Provider>
    </React.StrictMode>,
)
