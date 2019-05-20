const { serverless } = require('../probot-function')

describe('serverless-lambda', () => {
  let spy, handler, context

  beforeEach(() => {
    context = {}
    spy = jest.fn()
    handler = serverless(async app => {
      app.auth = () => Promise.resolve({})
      app.on('issues', spy)
    })
  })

  it('responds with the homepage', async () => {
    const req = { httpMethod: 'GET', path: '/probot' }
    await handler(context, req)
    expect(context.res.status).toBe(200)
    expect(context.res.body).toMatchSnapshot()
  })

  it('calls the event handler', async () => {
    const req = {
      body: {
        installation: { id: 1 }
      },
      headers: {
        'X-Github-Event': 'issues',
        'x-github-delivery': 123
      }
    }

    await handler(context, req)
    expect(spy).toHaveBeenCalled()
  })
})
