// US#1/#3: creating a snippet from the editor or a file, with the parser's error shown in place.
describe('Add snippet', () => {
  const created = {
    id: '33333333-3333-3333-3333-333333333333', name: 'new one', description: 'from cypress', language: 'printscript',
    languageVersion: '1.1', owner: 'auth0|e2e-owner', versionNumber: 1, content: 'println(1);',
  }

  beforeEach(() => {
    cy.stubApi()
    cy.visit('/')
    cy.wait('@listSnippets')
  })

  const openCreate = () => {
    cy.get('[data-testid="add-snippet-button"]').click()
    cy.get('[data-testid="create-snippet-option"]').click()
  }

  it('offers the engine versions, newest first selected, and sends them on create', () => {
    cy.intercept('POST', '/api/snippets', {statusCode: 201, body: created}).as('create')
    openCreate()
    cy.get('[data-testid="version-select"]').should('have.text', '1.1').click()
    cy.get('[data-testid="version-option-1.0"]').should('exist')
    cy.get('[data-testid="version-option-1.1"]').click()
    cy.get('#name').type(created.name)
    cy.get('[data-testid="description-input"]').type(created.description)
    cy.get('#add-snippet-editor').type(created.content, {parseSpecialCharSequences: false})
    cy.get('[data-testid="save-snippet-button"]').scrollIntoView().click()

    cy.wait('@create').its('request.body').should('deep.include', {
      name: created.name, description: created.description, language: 'printscript', languageVersion: '1.1',
      content: created.content,
    })
  })

  it('shows the broken rule with line and column and highlights that line', () => {
    cy.intercept('POST', '/api/snippets', {
      statusCode: 400,
      headers: {'content-type': 'application/problem+json'},
      body: {
        title: 'InvalidSnippetContent', status: 400,
        detail: "Snippet breaks the rule 'UnexpectedToken' at line 2, column 17: Unexpected token ';'.",
        rule: 'UnexpectedToken', message: "Unexpected token ';'.",
        span: {start: {line: 2, column: 17}, end: {line: 2, column: 17}},
      },
    }).as('create')
    openCreate()
    cy.get('#name').type('broken')
    cy.get('[data-testid="description-input"]').type('does not parse')
    cy.get('#add-snippet-editor').type('println(1);\nlet x: number = ;', {parseSpecialCharSequences: false})
    cy.get('[data-testid="save-snippet-button"]').scrollIntoView().click()

    cy.wait('@create')
    cy.get('[data-testid="add-snippet-error"]').should('contain', 'UnexpectedToken').and('contain', 'line 2, column 17')
    cy.get('.code-error-line').should('have.length', 1).and('contain', 'let x')
  })

  it('creates a snippet from a .prs file', () => {
    cy.intercept('POST', '/api/snippets/upload', {statusCode: 201, body: created}).as('upload')
    cy.get('[data-testid="upload-file-input"]').selectFile('cypress/fixtures/hello.prs', {force: true})
    cy.get('#name').should('have.value', 'hello')
    cy.get('[data-testid="description-input"]').type('uploaded')
    cy.get('[data-testid="save-snippet-button"]').scrollIntoView().click()
    cy.wait('@upload').its('request.headers.content-type').should('contain', 'multipart/form-data')
  })
})
