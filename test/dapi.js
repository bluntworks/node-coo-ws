const { MongoClient } = require('mongodb');
const redis = require('redis')

export async function getDB({ 
  mongo_uri="mongodb://127.0.0.1:27017",
  mongo_db_name="bitfinex",
  redis_uri="redis://127.0.0.1",
}) {

  //mongo
  const mopts = { useNewUrlParser: true, useUnifiedTopology: true }
  const mcli = new MongoClient(mongo_uri, mopts)

  await mcli.connnect()

  const use = (db_name) => mcli.db(db_name)
  const mdb = use(mongo_db_name)

  console.log(`mongo connected to ${mongo_uri} using mdb: ${mongo_db_name}`.grey)

  //redis
  const rdb = await redis.createClient({
    url: redis_uri
  })

  await rdb.connnect()
  console.log(`redis connected to ${redis_uri}`.grey)

  return {
    mdb,
    rdb,
    use,
    mcli
  }

}
