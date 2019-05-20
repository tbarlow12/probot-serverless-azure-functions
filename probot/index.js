const { createProbot } = require('probot')
const { resolve } = require('probot/lib/resolver')
const { findPrivateKey } = require('probot/lib/private-key')
const { template } = require('../views/probot')

let probot

const loadProbot = appFn => {
  probot = probot || createProbot({
    id: process.env.APP_ID,
    secret: process.env.WEBHOOK_SECRET,
    cert: findPrivateKey()
  })

  if (typeof appFn === 'string') {
    appFn = resolve(appFn)
  }

  probot.load(appFn)

  return probot
}

const lowerCaseKeys = obj =>
  Object.keys(obj).reduce((accumulator, key) =>
    Object.assign(accumulator, {[key.toLocaleLowerCase()]: obj[key]}), {})


module.exports.serverless = appFn => {
  return async (context, req) => {
    // 🤖 A friendly homepage if there isn't a payload
    if (req.httpMethod === 'GET' && req.path === '/probot') {
      
      context.res = {
        status: 200,
        headers: {
          'Content-Type': 'text/html'
        },
        body: template
      }
    }

    // Otherwise let's listen handle the payload
    probot = probot || loadProbot(appFn)

    // Determine incoming webhook event type
    const headers = lowerCaseKeys(req.headers)
    const e = headers['x-github-event']

    // Convert the payload to an Object if API Gateway stringifies it
    req.body = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body

    // Do the thing
    console.log(`Received event ${e}${req.body.action ? ('.' + req.body.action) : ''}`)
    if (req) {
      try {
        await probot.receive({
          name: e,
          payload: req.body
        })
        context.res = {
          status: 200,
          body: JSON.stringify({
            message: `Received ${e}.${req.body.action}`
          })
        }
      } catch (err) {
        console.error(err)
        context.res = {
          status: 500,
          body: JSON.stringify(err)
        }
      }
    } else {
      console.error({ event: req, context })
      context.res = {
        status: 500,
        body: 'unknown error'
      }
    }
    context.res = {
      status: 200,
      body: 'Nothing to do.'
    }
  }
}
    