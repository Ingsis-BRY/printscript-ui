import {defineConfig} from "cypress";

/**
 * Smoke suite against a deployed environment (dev or prod): real Auth0 login, real backend, real WebSocket.
 * It creates one throwaway snippet, exercises it and deletes it.
 *
 *   CYPRESS_BASE_URL=https://<env host> \
 *   CYPRESS_SMOKE_USERNAME=<test user> CYPRESS_SMOKE_PASSWORD=<password> \
 *   npm run test:smoke
 *
 * The credentials only come from the environment (or a git-ignored cypress.env.json); never commit them.
 */
export default defineConfig({
  e2e: {
    specPattern: "cypress/smoke/**/*.cy.ts",
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 15000,
    video: false,
    retries: {runMode: 1, openMode: 0},
    env: {
      auth0_domain: "https://snippet-searcher-bry.us.auth0.com",
    },
  },
});
