export const gsAdapter = ({ 
  ws, cid, devID, 
  dapi, deviceAuth, 
  loginHandler, eventHandler, 
  jwtAuth 
}) => async (msg) => {
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
