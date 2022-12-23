import { httpServer } from '../lib/wss-server'
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
})

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
  const { requestId } = data

  const payload = {
    email: 'dave@bluntworks.net',
    role: 'admin'
  }

  const authToken = await jwtAuth.createToken(payload, 'access')

  console.log('authToken', authToken)

  return {
    '@class': '.AuthenticationResponse',
    requestId,
    ok: true,
    authToken
  }


}

const eventHandlers = {
  test: ({ ws, dapi, data }) => {
    console.log('test', data)
    return {
      '@class': '.LogEventResponse',
      requestId: data.requestId,
      data: {
        test: 'ok'
      }
    }
  }
}

async function eventHandler({ ws, cid, devID, dapi, data, jwtAuth }) {
  const verified = await jwtAuth.verifyToken(data.authToken, 'access')
  console.log('verified', verified)

  console.log('event handler', data)

  const resp = eventHandlers[data.eventKey]
    ? await eventHandlers[data.eventKey]({ ws, dapi, data })
    : null

  return resp
}

