declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to log in using Auth0 (smoke suite against a real deployment only).
     * @example cy.loginToAuth0('username', 'password')
     */
    loginToAuth0(username: string, password: string): Chainable<void>

    /** Stubs every Snippet-Service endpoint with the fixtures (stubbed suite, `vite --mode e2e`). */
    stubApi(): Chainable<void>

    /** Clicks the home list row with that name. */
    openSnippet(name: string): Chainable<void>
  }
}
