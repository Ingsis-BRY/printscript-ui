// Smoke test for a deployed environment: real Auth0, real Snippet-Service, real engine over the WebSocket.
// It works on one throwaway snippet and deletes it at the end.
const username = () => Cypress.env('SMOKE_USERNAME') as string
const password = () => Cypress.env('SMOKE_PASSWORD') as string

describe('Smoke: deployed environment', () => {
  before(() => {
    expect(username(), 'CYPRESS_SMOKE_USERNAME').to.be.a('string').and.not.be.empty
    expect(password(), 'CYPRESS_SMOKE_PASSWORD').to.be.a('string').and.not.be.empty
  })

  it('sends anonymous visitors to the Auth0 login', () => {
    cy.visit('/', {failOnStatusCode: false})
    cy.origin(Cypress.env('auth0_domain'), () => {
      cy.get('input#username', {timeout: 20000}).should('exist')
    })
  })

  it('creates, runs, formats and deletes a snippet', () => {
    const name = `smoke-${Date.now()}`
    const content = 'let greeting: string = "smoke";\nprintln(greeting);'

    cy.loginToAuth0(username(), password())
    cy.intercept('POST', '**/snippets').as('create')
    cy.intercept('POST', '**/snippets/*/format').as('format')
    cy.intercept('DELETE', '**/snippets/*').as('delete')
    cy.visit('/')

    // create (US#1) — the engine validates it
    cy.get('[data-testid="add-snippet-button"]').click()
    cy.get('[data-testid="create-snippet-option"]').click()
    cy.get('#name').type(name)
    cy.get('[data-testid="description-input"]').type('created by the smoke test')
    cy.get('#add-snippet-editor').type(content, {parseSpecialCharSequences: false})
    cy.get('[data-testid="save-snippet-button"]').scrollIntoView().click()
    cy.wait('@create').its('response.statusCode').should('eq', 201)

    // it's listed (US#5) and opens (US#6)
    cy.get('[data-testid="search-name"]').type(name)
    cy.contains('[data-testid="snippet-row"]', name, {timeout: 20000}).click()
    cy.get('[data-testid="snippet-description"]').should('have.text', 'created by the smoke test')

    // run it over the WebSocket through nginx (US#10)
    cy.get('[data-testid="run-button"]').click()
    cy.contains('smoke', {timeout: 20000}).should('exist')
    cy.contains('Finished', {timeout: 20000}).should('exist')

    // format with the user's rules (Consigna)
    cy.get('[data-testid="format-button"]').click()
    cy.wait('@format').its('response.statusCode').should('eq', 200)

    // delete it, so the environment stays clean
    cy.get('[data-testid="delete-button"]').click()
    cy.get('[data-testid="confirm-delete"]').click()
    cy.wait('@delete').its('response.statusCode').should('be.oneOf', [200, 204])
  })

  it('rejects a snippet that does not parse, with the rule and position', () => {
    cy.loginToAuth0(username(), password())
    cy.intercept('POST', '**/snippets').as('create')
    cy.visit('/')
    cy.get('[data-testid="add-snippet-button"]').click()
    cy.get('[data-testid="create-snippet-option"]').click()
    cy.get('#name').type(`smoke-broken-${Date.now()}`)
    cy.get('[data-testid="description-input"]').type('does not parse')
    cy.get('#add-snippet-editor').type('let x: number = ;', {parseSpecialCharSequences: false})
    cy.get('[data-testid="save-snippet-button"]').scrollIntoView().click()
    cy.wait('@create').its('response.statusCode').should('eq', 400)
    cy.get('[data-testid="add-snippet-error"]').should('contain', 'line 1')
  })
})
