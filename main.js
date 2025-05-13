const{scrapingAgenciaBrasil} = require('./portais/agencia_brasil')
const{scrapingCNN} = require('./portais/cnn')
const{scrapingCartaCapital} = require('./portais/carta_capital')
const{scrapingForum} = require('./portais/forum')
const{scrappingG1} = require('./portais/g1')
const{scrapingUol} = require('./portais/uol')
const{scrapingCongressoEmFoco} = require('./portais/congresso')
const{scrapingCamaraDeputados} = require('./portais/camara_deputados')
const{scrappingInfoMoney} = require('./portais/infoMoney')



const fs = require('fs')

async function main(){
    fs.mkdirSync('portais_jsons', { recursive: true }) // cria a pasta caso não tenha
    await scrapingAgenciaBrasil()
    await scrapingCNN()
    await scrapingCartaCapital()
    await scrapingForum()
    await scrappingG1()
    await scrapingUol()
    await scrapingCongressoEmFoco()
    await scrapingCamaraDeputados()
    await scrappingInfoMoney()
}
main()

