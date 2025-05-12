const{scrapAgenciaPolitica} = require('./portais/agencia_brasil')
const{scrapAgenciaEconomia} = require('./portais/agencia_brasil')

const{scrapCamaraPolitica} = require('./portais/camara_deputados')

const{scrapCartaPolitica} = require('./portais/carta_capital')

const{scrapCNNPolitica} = require('./portais/cnn')

const{scrapCongressoPolitica} = require('./portais/congresso')

const{scrapForumPolitica} = require('./portais/forum')

const{scrapG1Politica} = require('./portais/g1')
const{scrapG1Economia} = require('./portais/g1')

const{scrapUOLPolitica} = require('./portais/uol')

const fs = require('fs')

function main(){
    fs.mkdirSync('portais_jsons', { recursive: true }) // cria a pasta caso não tenha

    scrapAgenciaEconomia()
    scrapAgenciaPolitica()
    
    scrapCNNPolitica()
    
    scrapCamaraPolitica()
    
    scrapCartaPolitica()
    
    scrapCongressoPolitica()
    
    scrapForumPolitica()
    
    scrapG1Politica()
    scrapG1Economia()

    scrapUOLPolitica()   
}

main()

