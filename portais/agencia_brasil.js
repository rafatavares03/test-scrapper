const puppeteer = require('puppeteer')
const fs = require('fs')

async function coletaDadosAgenBr(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {}
    dados.portal = "Agencia_Brasil"
    dados.link = link
  
    // Manchete
    let manchete = document.querySelector("h1.titulo-materia")
    if(manchete) dados.manchete = manchete.textContent.trim()
    else return null

    // Lide
    let lide = document.querySelector("div.linha-fina-noticia")
    if(lide) dados.lide = lide.textContent

    // Data de Publicação
    let dataPublicacao = document.querySelector('.data')
    if(dataPublicacao){
      let texto = dataPublicacao.textContent.replace("Publicado em ", "").trim()
      let [data, hora] = texto.split(' - ')
      let [dia, mes, ano] = data.split('/')
      let dataISO = `${ano}-${mes}-${dia}T${hora}:00`
      dados.dataPublicacao = new Date(dataISO).toISOString()
    }
    
    // Autores
    let autoresTag = document.querySelector(".autor-noticia")
    if(autoresTag) {
        let autores = autoresTag.textContent
        autores = autores.split('–')[0].trim()
        autores = autores.split('-')[0].trim()
        autores = autores.replace(/ e /g,",")
        autores = autores.split(',')
        dados.autores = autores.map(x => x.trim()).filter(a => a.length > 0)
    }

    // // Artigo
    // let texto = "";
    // let pontoDePartida = document.querySelector('div.conteudo-noticia')
    // let elementos = pontoDePartida.parentElement.querySelectorAll("p,h2") 
    // for (let elemento of elementos) {
    //   texto += elemento.textContent.trim() + "\n"
    // }
    // dados.artigo = texto.trim();

    // if(dados.artigo.length > 0) dados.artigo = dados.artigo.replaceAll(/\\n/g, '\n')

    return dados
  }, link)
}

async function start(URL, tipo) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  const arquivo = fs.createWriteStream(`./portais_jsons/Agencia_brasil-${tipo}.jsonl`, { flags: 'a' })

  try {
    for (let pagina = 1; pagina <= 1; pagina++) {
      let AgenciaURL = `${URL}${pagina}`
      await page.goto(AgenciaURL, { waitUntil: "domcontentloaded" })

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".capa-noticia")).map(x => x.getAttribute("href"))
      })


      let raiz = "https://agenciabrasil.ebc.com.br"
      for(let i = 0; i < links.length; i++ ){
        links[i] = raiz + links[i]
        // console.log(links[i])
      }

      let scrapingPage = await browser.newPage()
      await scrapingPage.bringToFront()
      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosAgenBr(scrapingPage, links[i])

        if(dict == null) continue;
        dict._id = dict.link;  // link é a chave primaria 
        // console.log(dict)

        arquivo.write(JSON.stringify(dict) + '\n')

      }
      await scrapingPage.close()
      await page.bringToFront()
    }

  } catch (err) {
    console.error("Erro:", err)
  } finally {
    await browser.close()
  }
}

function scrapAgenciaPolitica(){
  start("https://agenciabrasil.ebc.com.br/politica?page=", "Politica")
}

function scrapAgenciaEconomia(){
  start("https://agenciabrasil.ebc.com.br/economia?page=", "Economia")
}

module.exports = {scrapAgenciaEconomia, scrapAgenciaPolitica}