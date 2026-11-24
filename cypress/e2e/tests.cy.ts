import {installFakeRunSocket} from "../support/fakeRunSocket";

// US#8 / US#9 / US#16: a snippet's tests, their stored status, and running one with streamed output.
describe('Snippet tests', () => {
  let socket: ReturnType<typeof installFakeRunSocket> | undefined

  beforeEach(() => {
    cy.stubApi()
    cy.visit('/', {
      onBeforeLoad(win) {
        socket = installFakeRunSocket(win, {
          frames: (start) => start.testId === 'cccccccc-0000-0000-0000-000000000001'
            ? [{type: 'output', line: '1'}, {type: 'done', outputs: ['1'], error: null, passed: true}]
            : [{type: 'output', line: '1'}, {type: 'done', outputs: ['1'], error: null, passed: false}],
        })
      },
    })
    cy.openSnippet('camel')
    cy.wait('@getSnippet')
    cy.get('[data-testid="test-button"]').click()
    cy.wait('@getTests')
  })

  it('lists the tests with the status of their last automatic run', () => {
    cy.get('[data-testid="test-tab-cccccccc-0000-0000-0000-000000000001"]').should('contain', 'prints one')
    cy.get('[data-testid="test-status"]').should('have.text', 'passed')
    cy.get('[data-testid="test-tab-cccccccc-0000-0000-0000-000000000002"]').click()
    cy.get('[data-testid="test-status"]').should('have.text', 'failed')
    cy.contains('Last output: 1').should('exist')
  })

  it('runs one test over the WebSocket and shows the streamed output and the result', () => {
    cy.get('[data-testid="run-test"]').click()
    cy.get('[data-testid="test-run-output"]').should('have.value', '1')
    cy.get('[data-testid="test-result"]').should('have.text', 'Pass')
    cy.then(() => expect(socket?.sent[0]).to.deep.equal({type: 'start', mode: 'test', testId: 'cccccccc-0000-0000-0000-000000000001'}))

    cy.get('[data-testid="test-tab-cccccccc-0000-0000-0000-000000000002"]').click()
    cy.get('[data-testid="run-test"]').click()
    cy.get('[data-testid="test-result"]').should('have.text', 'Fail')
  })

  it('creates a test with ordered inputs and expected outputs', () => {
    cy.intercept('POST', '/api/snippets/*/tests', (req) => req.reply(201, {
      id: 'cccccccc-0000-0000-0000-000000000003', snippetId: '11111111-1111-1111-1111-111111111111', ...req.body,
      status: 'pending', actualOutput: null, error: null, lastRunAt: null,
    })).as('createTest')
    cy.get('[data-testid="new-test-tab"]').click()
    cy.get('[data-testid="test-name"]').type('adds')
    cy.get('[data-testid="test-input"]').type('2{enter}3{enter}')
    cy.get('[data-testid="test-output"]').type('5{enter}')
    cy.get('[data-testid="save-test"]').click()

    cy.wait('@createTest').its('request.body').should('deep.equal', {name: 'adds', input: ['2', '3'], output: ['5']})
  })

  it('removes a test', () => {
    cy.intercept('DELETE', '/api/snippets/*/tests/*', {statusCode: 204}).as('removeTest')
    cy.get('[data-testid="remove-test"]').click()
    cy.wait('@removeTest').its('request.url').should('match', /\/tests\/cccccccc-0000-0000-0000-000000000001$/)
  })
})
