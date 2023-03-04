import { httpServer } from '../lib/wss-server'
import { gsAdapter } from '../lib/gs-msg-adapter'

const dapi = {

}

const handlers = {
  deviceAuth,
  loginHandler,
  eventHandler,
  dapi
}

const wss = httpServer({
  handlers,
  httpPort: 4000,
  wsPort: 8088,
  certs: {
    pem: './certs/test-server.pem',
    pub: './certs/test-server.pub'
  }
}, gsAdapter)

async function deviceAuth({ ws, cid, devID, dapi, data }) {
  console.log('cid', cid, devID, data)
  const { hmac } = data
  if(hmac === ws.hmac) {
    return {
      '@class': '.AuthenticatedConnectResponse',
      sessionId: cid,
      requestId: 1
    }
  } else {
    return {
      '@class': '.AuthenticatedConnectResponse',
      error: {
        message: "invalid hmac"
      }
    }
  }
}

async function loginHandler({ ws, cid, devID, dapi, data, jwtAuth }) {
  const { requestId, scriptData } = data
  const { email, password } = scriptData
  console.log('logon handler received', email, password)

  const payload = {
    email,
    role: 'admin'
  }

  const authToken = await jwtAuth.createToken(payload, 'access')

  console.log('authToken', authToken)

  return {
    '@class': '.AuthenticationResponse',
    requestId,
    scriptData: {
      ok: true,
      authToken
    }
  }
}

const eventHandlers = {
  TEST_MSG: ({ ws, dapi, data }) => {
    const { msg } = data && data.scriptData
    return {
      '@class': '.LogEventResponse',
      requestId: data.requestId,
      scriptData: {
        test: 'ok',
        msg
      }
    }
  }
}

async function eventHandler({ ws, cid, devID, dapi, data, jwtAuth }) {
  try { 
    const verified = await jwtAuth.verifyToken(data.authToken, 'access')
    console.log('verified', verified)
    console.log('event handler', data)

    const resp = eventHandlers[data.eventKey]
      ? await eventHandlers[data.eventKey]({ ws, dapi, data })
      : null

    return resp
  } catch(err) {
    return {
      '@class': '.LogEventResponse',
      requestId: data.requestId,
      error: { message: err.message }
    }
  }
}

