const{scrapAgenciaPolitica, scrapAgenciaEconomia} = require('./portais/agencia_brasil')
const{scrapCNNPolitica, scrapCNNEconomia} = require('./portais/cnn')
const{scrapCartaPolitica, scrapCartaEconomia} = require('./portais/carta_capital')
const{scrapForumPolitica, scrapForumEconomia} = require('./portais/forum')
const{scrapG1Politica, scrapG1Economia} = require('./portais/g1')
const{scrapUOLPolitica, scrapUOLEconomia} = require('./portais/uol')
const{scrapCongressoPolitica} = require('./portais/congresso')
const{scrapCamaraPolitica} = require('./portais/camara_deputados')


const fs = require('fs')

function main(){
    fs.mkdirSync('portais_jsons', { recursive: true }) // cria a pasta caso não tenha

    scrapAgenciaEconomia()
    scrapAgenciaPolitica()
    
    scrapCNNPolitica()
    scrapCNNEconomia()
    
    
    scrapCartaPolitica()
    scrapCartaEconomia()
    
    
    scrapForumPolitica()
    scrapForumEconomia()
    
    scrapG1Politica()
    scrapG1Economia()
    
    scrapUOLPolitica()   
    scrapUOLEconomia()

    scrapCongressoPolitica()

    scrapCamaraPolitica()
}

main()

