const { MongoClient } = require('mongodb')
require('dotenv').config()

const uri = process.env.MONGO_URI
const client = new MongoClient(uri)

async function conectar() {
    try {
        await client.connect()
        const db = client.db("Banco_Coletor")
        return db
    } catch (err) {
        console.error("Erro ao conectar ao MongoDB:", err)
        throw err
    }
}

async function desconectar() {
    try {
        await client.close()
        console.log("MongoDB desconectado.")
    } catch (err) {
        console.error("Erro ao desconectar:", err)
        throw err
    }
}



module.exports = { conectar, client, desconectar }
