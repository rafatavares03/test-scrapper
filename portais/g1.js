const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')


async function coletaDadosG1(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate(() => {
    const dados = {
      portal: "g1",
      _id : window.location.href  
    }

    // Manchete
    let manchete = document.querySelector("h1.content-head__title")
    if(manchete) dados.manchete = manchete.textContent
    else return null
    
    // Lide
    let lide = document.querySelector("h2.content-head__subtitle")
    if(lide) dados.lide = lide.textContent
    
    // Data
    let dataPublicacao = document.querySelector('time[itemprop="dateModified"]')
    if(dataPublicacao) dados.dataPublicacao = dataPublicacao.getAttribute("datetime")
      
    // Autores
    let autoresTag = document.querySelector("p.top__signature__text__author-name")
    if(autoresTag == null) {
      autoresTag = document.querySelector("p.content-publication-data__from")
    }
    if(autoresTag) {
      let autores = autoresTag.textContent
      autores = autores.replace("Por", '')
      if(autores.indexOf(" —") >= 0) autores = autores.slice(0, autores.indexOf(" —")) // remove o traço e a localização que vem depois dele.
      autores = autores.split(',')
      if(autores[autores.length - 1].indexOf(" e " >= 0)) {
        let dupla = autores.pop()
        dupla = dupla.split(" e ")
        for(let i = 0; i < dupla.length; i++) autores.push(dupla[i])
      }
      dados.autores = autores.map(x => x.trim())
    }
    return dados
  })
}

async function scrapG1(URL, tipo) {
  const browser = await puppeteer.launch({headless : true})
  const paginaPortal = await browser.newPage()
  const paginaScraping = await browser.newPage()


  try {
    for (let pagina = 1; pagina <= 1; pagina++) {
      let g1URL = `${URL}${pagina}.ghtml`
      await paginaPortal.bringToFront()
      await paginaPortal.goto(g1URL, { waitUntil: "domcontentloaded" })

      let links = await paginaPortal.evaluate(() => {
        return Array.from(document.querySelectorAll(".feed-post-link")).map(x => x.getAttribute("href"))
      })
      

      let dict = []
      await paginaScraping.bringToFront()
      for (let i = 0; i < links.length; i++) {
        let temp = await coletaDadosG1(paginaScraping, links[i])
        if(temp == null) continue

        temp.tema = tipo
        dict.push(temp)
        console.log(temp)
      }
      
      try {
        await inserirNoticia(dict)
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
    await paginaScraping.close()
    await browser.close()
  }
}



scrapG1(`https://g1.globo.com/politica/index/feed/pagina-`, "Política")
scrapG1("https://g1.globo.com/economia/index/feed/pagina-", "Economia")
async function scrapingG1(){
}

module.exports = {scrapingG1}