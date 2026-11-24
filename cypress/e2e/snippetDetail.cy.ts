import {installFakeRunSocket} from "../support/fakeRunSocket";

// US#6, #7, #10, #13 and the Consigna's format: the snippet detail, as owner and as reader.
describe('Snippet detail', () => {
  beforeEach(() => {
    cy.stubApi()
  })

  it('shows the owner everything and lets them format, save and share', () => {
    cy.visit('/')
    cy.openSnippet('camel')
    cy.wait('@getSnippet')
    cy.get('[data-testid="snippet-description"]').should('have.text', 'prints a value')
    cy.get('[data-testid="snippet-language"]').should('contain', 'printscript 1.1')

    cy.intercept('POST', '/api/snippets/*/format', {formatted: 'let myValue: number = 1;\nprintln(myValue);', ignoredRules: []})
      .as('format')
    cy.get('[data-testid="format-button"]').click()
    cy.wait('@format').its('request.body.content').should('contain', 'number=1')
    cy.get('#snippet-editor').should('contain.value', 'let myValue: number = 1;')

    cy.intercept('PATCH', '/api/snippets/*', {
      id: '11111111-1111-1111-1111-111111111111', name: 'camel', description: 'prints a value', language: 'printscript',
      languageVersion: '1.1', owner: 'auth0|e2e-owner', versionNumber: 3, content: 'let myValue: number = 1;\nprintln(myValue);',
    }).as('save')
    cy.get('[data-testid="save-button"]').click()
    cy.wait('@save').its('request.body.content').should('eq', 'let myValue: number = 1;\nprintln(myValue);')

    cy.intercept('POST', '/api/snippets/*/share', {statusCode: 204}).as('share')
    cy.get('[data-testid="share-button"]').click()
    cy.get('[data-testid="share-user-input"]').type('E2E')
    cy.contains('li', 'E2E Reader').click()
    cy.get('[data-testid="share-confirm"]').click()
    cy.wait('@share').its('request.body').should('deep.equal', {targetUserId: 'auth0|e2e-reader'})
  })

  it('shows a reader the lint issues and disables owner-only actions', () => {
    cy.visit('/')
    cy.openSnippet('snake')
    cy.wait('@getSharedSnippet')
    cy.get('[data-testid="lint-issues"]').should('contain', 'InvalidIdentifier').and('contain', '1:5')
    for (const id of ['share-button', 'edit-button', 'upload-button', 'save-button', 'delete-button']) {
      cy.get(`[data-testid="${id}"]`).should('be.disabled')
    }
    cy.get('[data-testid="format-button"]').should('not.be.disabled')
    cy.get('[data-testid="run-button"]').should('not.be.disabled')
  })

  it('downloads the formatted version', () => {
    cy.intercept('GET', '/api/snippets/*/download?version=formatted', {body: 'let myValue: number = 1;\n'}).as('download')
    cy.visit('/')
    cy.openSnippet('camel')
    cy.get('[data-testid="download-formatted"]').click()
    cy.wait('@download').its('response.statusCode').should('eq', 200)
  })

  it('runs the snippet interactively over the WebSocket (US#10)', () => {
    let socket: ReturnType<typeof installFakeRunSocket> | undefined
    cy.visit('/', {
      onBeforeLoad(win) {
        socket = installFakeRunSocket(win, {
          frames: () => [{type: 'awaiting-input', prompt: 'Name?'}],
          onInput: (value) => [{type: 'output', line: `Hello ${value}`}, {type: 'done', outputs: [`Hello ${value}`], error: null, passed: null}],
        })
      },
    })
    cy.openSnippet('camel')
    cy.wait('@getSnippet')
    cy.get('[data-testid="run-button"]').click()
    cy.contains('Name?').should('exist')
    cy.get('[data-testid="run-input"]').should('not.be.disabled').type('Agus{enter}')
    cy.contains('Hello Agus').should('exist')
    cy.then(() => {
      // Vite's own HMR socket is in the log too; find the run socket
      const run = socket?.urls.findIndex(url => /\/api\/snippets\/11111111-1111-1111-1111-111111111111\/run$/.test(url)) ?? -1
      expect(run, 'run socket opened').to.be.greaterThan(-1)
      expect(socket?.protocols[run]).to.deep.equal(['snippet-run.v1', 'bearer.e2e-token'])
      expect(socket?.sent).to.deep.include({type: 'input', value: 'Agus'})
    })
  })
})
