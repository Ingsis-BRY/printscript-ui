import {defineConfig} from "cypress";

/**
 * The stubbed suite (cypress/e2e): runs against `vite --mode e2e` on 127.0.0.1:5174, with a fake Auth0
 * and the API stubbed per spec, so it needs no secrets. `npm run test:e2e` starts the server and runs it.
 * The suite against a deployed environment lives in cypress.smoke.config.ts.
 */
export default defineConfig({
  e2e: {
    baseUrl: "http://127.0.0.1:5174",
    experimentalStudio: true,
  },
});
