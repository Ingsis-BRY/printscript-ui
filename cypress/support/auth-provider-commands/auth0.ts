/**
 * Logs in through Auth0's Universal Login page, the way a person does: the app redirects to the tenant,
 * we fill the form there (cy.origin, since it's another domain) and Auth0 sends us back to the app.
 * Handles both the single-page form and the identifier-first one (username, Continue, then password).
 */
export function loginViaAuth0Ui(username: string, password: string) {
  cy.visit('/')

  cy.origin(
      Cypress.env('auth0_domain'),
      {args: {username, password}},
      ({username, password}) => {
        cy.get('input#username', {timeout: 20000}).type(username)
        cy.get('body').then($body => {
          if ($body.find('input#password').length === 0) {
            cy.get('button[type=submit][name=action]').first().click()
          }
        })
        cy.get('input#password').type(password, {log: false})
        cy.get('button[type=submit][name=action]').first().click()
      }
  )

  // back on the app, logged in
  cy.location('origin', {timeout: 20000}).should('eq', new URL(Cypress.config('baseUrl') ?? '').origin)
}
