require('dotenv-swarm').config()
const WebSocketServer = require('ws').Server
const uuid = require('uuid')
const url = require('url')
const jwtAuth = require('jwt-simple-auth')

import { getHmac } from '../lib/util'

const {
  SECRET,
} = process.env

console.log('SECRET', SECRET)

export function wssServer(httpServer) {
  return  ({
    dapi,
    deviceAuth,
    loginHandler,
    eventHandler,
    port=8080
  }) => {

    try {
      const conns = new Map()
      const devids = new Map()

      const wss = new WebSocketServer({
        server: httpServer
      })

      wss.addListener('connection', handleConnection)

      function handleConnection(ws, req) {
        const query = url.parse(req.url, true).query
        const { devID, SDK } = query
        const dcid = devids.get(devID)
        const cid = dcid ? dcid : uuid.v4()

        ws.cid = cid
        ws.devID = devID
        ws.hmac = getHmac(cid, SECRET)

        conns.set(cid, ws)
        devids.set(devID, cid)

        console.log('devids', devids)

        ws.addListener('message', msgHandler({
          ws,
          cid,
          devID,
          dapi,
          deviceAuth,
          eventHandler,
          loginHandler,
          jwtAuth 
        }))

        const wmsg = {
          '@class': '.AuthenticatedConnectResponse',
          nonce:  cid,
          reuestId: 0
        }
        ws.send(JSON.stringify(wmsg))
      }

    } catch(err) {
      console.log('wss connection error', err.message)
      //nit sure iof this is the correct behaviour here but for the mo
      //lets just exit
      ///////////////////////////////////////////////////////////////////
      process.exit(2)
    }
  }
}

export function msgHandler({ 
  ws, cid, devID, dapi,
  deviceAuth,
  loginHandler,
  eventHandler,
  jwtAuth
}) {

  return async (msg) => {
    let data = {}

    if(Buffer.isBuffer(msg)) {
      msg = msg.toString()
    }

    if(msg === ' ') {
      return 
    }

    console.log('data', data, msg)

    try {
      data = JSON.parse(msg)
    } catch(err) {
      console.log('json parse err', err.message)
    }

    if(!data['@class']) {
      console.log('unkonw msg', data)
      ws.send('unknown message')
      return
    }

    let resp
    switch(data['@class']) {
      case '.DeviceAuthenticationRequest':
      case '.AuthenticatedConnectRequest':
        resp = await deviceAuth({ ws, cid, devID, dapi, data })
      break
      case '.AuthenticationRequest':
        resp = await loginHandler({ ws, cid, devID, dapi, data, jwtAuth })
      break
      case '.LogEventRequest':
        resp = await eventHandler({ ws, cid, devID, dapi, data, jwtAuth })
      break
    }

    if(resp && 'object' == typeof resp) {
      console.log('reply', resp)
      ws.send(JSON.stringify(resp))
    } else {
      console.log('resp not set', resp)
    }
  }

}

export function httpServer({
  httpPort=3000,
  wsPort=8080,
  handlers,
  routes={},
  certs
}) {
  const http = require('http')
  let server

  try { 
    server = http.createServer((req, res) => {
      console.log('http req', req.headers)
    })

    server.on('upgrade', (req, socket, head) => {
      console.log('upgrade req', head)
    })

    const wss = wssServer(server)({ ...handlers, port: wsPort  })

    server.listen(wsPort, () => {
      console.log('http listening on', wsPort)
    })

    jwtAuth.loadCerts(certs.pem, certs.pub)

  } catch(e) {
    console.log('http server error', e.message)
    process.exit(1)
  }
}

export const welcomeMessage = (ws) => {
  const msg = {
    '@class'    :'.AuthenticatedConnectResponse',
    nonce       :ws.cid,
    requestId   :0
  }

  return msg
}


