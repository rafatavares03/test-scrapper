const{scrapingAgenciaBrasil} = require('./portais/agencia_brasil')
const{scrapingCNN} = require('./portais/cnn')
const{scrapingCartaCapital} = require('./portais/carta_capital')
const{scrapingForum} = require('./portais/forum')
const{scrapingG1} = require('./portais/g1')
const{scrapingUol} = require('./portais/uol')
const{scrapingCongressoEmFoco} = require('./portais/congresso')
const{scrapingCamaraDeputados} = require('./portais/camara_deputados')
const{scrapingInfoMoney} = require('./portais/infoMoney')
const{scrapingTempo} = require('./portais/tempo')


async function main(){
    await scrapingAgenciaBrasil()
    await scrapingCartaCapital()
    await scrapingCNN()
    await scrapingG1()
    await scrapingCongressoEmFoco()
    await scrapingCamaraDeputados()
    await scrapingInfoMoney()
    
    
    //await scrapingForum() // arrumar autores
    //await scrapingTempo() // arrumar autores
    // await scrapingUol() // arrumar autores 
}

main()

