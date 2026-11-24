// US#11 / US#14: turning format and lint rules on and off, with their values.
describe('Rules', () => {
  beforeEach(() => {
    cy.stubApi()
    cy.visit('/rules')
    cy.wait(['@getLintRules', '@getFormatRules'])
  })

  it('saves a lint rule with its option', () => {
    cy.intercept('PUT', '/api/rules/lint', (req) => req.reply(req.body.map((r: { id: string }) => ({id: r.id}))))
      .as('saveLint')
    cy.get('[data-testid="rule-identifier_format"]').within(() => {
      cy.get('input[type="checkbox"]').check()
      cy.get('[role="combobox"]').should('have.text', 'camelCase')
    })
    cy.contains('Linting rules').parent().find('[data-testid="save-rules"]').click()

    cy.wait('@saveLint').its('request.body')
      .then((body: { id: string }[]) => expect(body.find(r => r.id === 'identifier_format')).to.include({isActive: true, value: 'camelCase'}))
    cy.contains('Your snippets are being re-checked in the background').should('exist')
  })

  it('saves an integer format rule within its bounds', () => {
    cy.intercept('PUT', '/api/rules/format', {fixture: 'rules-format.json'}).as('saveFormat')
    cy.get('[data-testid="rule-indent-inside-if"]').within(() => {
      cy.get('input[type="checkbox"]').check()
      cy.get('input[type="number"]').should('have.value', '4').type('{selectall}2')
    })
    cy.contains('Formatting rules').parent().find('[data-testid="save-rules"]').click()

    cy.wait('@saveFormat').its('request.body')
      .then((body: { id: string }[]) => expect(body.find(r => r.id === 'indent-inside-if')).to.include({isActive: true, value: 2}))
  })

  it('shows why the backend refused the rules', () => {
    cy.intercept('PUT', '/api/rules/format', {
      statusCode: 400,
      headers: {'content-type': 'application/problem+json'},
      body: {title: 'Bad Request', status: 400, detail: 'enforce-spacing-around-equals contradicts enforce-no-spacing-around-equals'},
    }).as('saveFormat')
    cy.contains('Formatting rules').parent().find('[data-testid="save-rules"]').click()
    cy.wait('@saveFormat')
    cy.contains('contradicts').should('exist')
  })
})
