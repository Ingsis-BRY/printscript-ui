/// <reference types="cypress" />

/**
 * Stubs every Snippet-Service endpoint the UI calls with the fixtures in cypress/fixtures.
 * Each route gets an alias (`@listSnippets`, `@getSnippet`, ...) so specs can wait on it and
 * inspect the request; a spec overrides one route by calling cy.intercept again after this.
 */
Cypress.Commands.add('stubApi', () => {
    cy.intercept('GET', '/api/languages', {fixture: 'languages.json'}).as('languages')
    cy.intercept({method: 'GET', pathname: '/api/snippets'}, {fixture: 'snippets-page.json'}).as('listSnippets')
    cy.intercept('GET', '/api/snippets/11111111-1111-1111-1111-111111111111', {fixture: 'snippet-owner.json'}).as('getSnippet')
    cy.intercept('GET', '/api/snippets/22222222-2222-2222-2222-222222222222', {fixture: 'snippet-reader.json'}).as('getSharedSnippet')
    cy.intercept('GET', '/api/snippets/*/tests', {fixture: 'tests.json'}).as('getTests')
    cy.intercept('GET', '/api/rules/lint', {fixture: 'rules-lint.json'}).as('getLintRules')
    cy.intercept('GET', '/api/rules/format', {fixture: 'rules-format.json'}).as('getFormatRules')
    cy.intercept('GET', '/api/users*', {fixture: 'users.json'}).as('getUsers')
})

/** Opens the snippet with that row name from the home list and waits for its detail. */
Cypress.Commands.add('openSnippet', (name: string) => {
    cy.contains('[data-testid="snippet-row"]', name).click()
})

export {}
