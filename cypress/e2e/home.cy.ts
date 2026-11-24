// US#5: the list, its filters and what each row shows. Runs against `vite --mode e2e` (fake Auth0, stubbed API).
describe('Home: snippet list', () => {
  beforeEach(() => {
    cy.stubApi()
    cy.visit('/')
    cy.wait('@listSnippets')
  })

  it('shows each snippet with its owner name and compliance', () => {
    cy.get('[data-testid="snippet-row"]').should('have.length', 2)
    cy.contains('[data-testid="snippet-row"]', 'camel').within(() => {
      cy.get('[data-testid="snippet-author"]').should('have.text', 'E2E Owner')
      cy.get('[data-testid="compliance-compliant"]').should('exist')
    })
    cy.contains('[data-testid="snippet-row"]', 'snake')
      .find('[data-testid="compliance-not-compliant"]').should('exist')
  })

  it('asks the backend for the chosen relationship', () => {
    cy.intercept({method: 'GET', pathname: '/api/snippets', query: {relationship: 'shared'}}, {fixture: 'snippets-page.json'})
      .as('sharedList')
    cy.get('[data-testid="relationship-filter"]').click()
    cy.contains('li', 'Shared with me').click()
    cy.wait('@sharedList').its('request.query.relationship').should('eq', 'shared')
  })

  it('filters by validity', () => {
    cy.get('[data-testid="validity-filter"]').click()
    cy.contains('li', 'Invalid').click()
    cy.wait('@listSnippets').its('request.query.valid').should('eq', 'false')
  })

  it('searches by name', () => {
    cy.get('[data-testid="search-name"]').type('camel')
    cy.wait('@listSnippets').its('request.query.name').should('eq', 'camel')
  })

  it('sorts by conformance', () => {
    cy.contains('th', 'Conformance').find('.MuiTableSortLabel-root').click()
    cy.wait('@listSnippets').its('request.query.sortBy').should('eq', 'valid')
  })
})
