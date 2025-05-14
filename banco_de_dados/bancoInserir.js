const { conectar, desconectar } = require('./bancoConnection')

async function inserirNoticia(jsons, db) {
    try {
        const colecao = db.collection("Noticias")
        await colecao.insertMany(jsons, { ordered: false })
    } catch (err) {
        throw err
    } finally {
        // await desconectar()
    }
}

module.exports = { inserirNoticia }