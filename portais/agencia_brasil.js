const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')
const {conectar, desconectar} = require("../banco_de_dados/bancoConnection")


async function coletaDadosAgenBr(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {
      portal: "Agência Brasil",
      _id: window.location.href
    }
  
    // Manchete
    let manchete = document.querySelector("h1.titulo-materia")
    if(manchete) dados.manchete = manchete.textContent.trim()
    else return null

    // Lide
    let lide = document.querySelector("div.linha-fina-noticia")
    if(lide) dados.lide = lide.textContent.trim()

    // Data de Publicação
    let dataPublicacao = document.querySelector("meta[property='article:published_time']")
    if(dataPublicacao){
      dados.data = dataPublicacao.getAttribute("content")
    } else {
      return null
    }
    
    // Autores
    let autoresTag = document.querySelector(".autor-noticia")
    if(autoresTag) {
        let autores = autoresTag.textContent
        autores = autores.split('–')[0].trim()
        autores = autores.split('-')[0].trim()
        autores = autores.replace(/ e /g,",")
        autores = autores.split(',')
        dados.autor = autores.map(x => x.trim()).filter(a => a.length > 0)
    }

    // Tags
    let tags = Array.from(document.querySelectorAll("a.tag")).map(x => x.textContent.toUpperCase())
    if(tags && tags.length > 0) dados.tema = tags

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

async function scrapAgenciaBrasil(URL, tipo) {
  const browser = await puppeteer.launch()
  const scrapingPage = await browser.newPage()
  const paginaPortal = await browser.newPage()
  //const {db, client} = await conectar()

  try {
    for (let pagina = 1; pagina <= 2; pagina++) {
      let AgenciaURL = `${URL}${pagina}`
      await paginaPortal.bringToFront()
      await paginaPortal.goto(AgenciaURL, { waitUntil: "domcontentloaded" })

      const links = await paginaPortal.evaluate(() => {
        return Array.from(document.querySelectorAll(".capa-noticia")).map(x => x.getAttribute("href"))
      })


      let raiz = "https://agenciabrasil.ebc.com.br"
      for(let i = 0; i < links.length; i++ ){
        links[i] = raiz + links[i]
        // console.log(links[i])
      }

      
      await scrapingPage.bringToFront()
      let dict = []
      for (let i = 0; i < links.length; i++) {
        let temp = await coletaDadosAgenBr(scrapingPage, links[i])
        if(temp == null) continue;
        temp.secao = tipo
        dict.push(temp)
        console.log(temp)
      }
      await paginaPortal.bringToFront()
      
      try {
        //await inserirNoticia(dict, db)
      } catch (err) {
        if (err.name === 'MongoBulkWriteError' || err.code === 11000) {
          const totalErros = err.writeErrors ? err.writeErrors.length : 0
          
          if ((totalErros / dict.length) >= 0.5) {
            console.warn(`Erro de duplicata = ${(totalErros / dict.length)} .`)
            return null
          } 
        } 
      }
    }
    
  } catch (err) {
    console.error("Erro:", err)
  } finally {
    //await desconectar(client)
    await scrapingPage.close()
    await browser.close()
  }
}

async function scrapingAgenciaBrasil(){
  await scrapAgenciaBrasil("https://agenciabrasil.ebc.com.br/politica?page=", "Política")
  await scrapAgenciaBrasil("https://agenciabrasil.ebc.com.br/economia?page=", "Economia")
}

module.exports = {scrapingAgenciaBrasil}