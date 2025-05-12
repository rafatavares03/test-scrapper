const puppeteer = require('puppeteer')
const fs = require('fs')


async function coletaDadosG1(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate(() => {
    const dados = {
      portal: "g1",
      link: window.location.href
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

  const arquivo = fs.createWriteStream(`./portais_jsons/g1-${tipo}.jsonl`, { flags: 'a' })

  try {
    for (let pagina = 1; pagina <= 1; pagina++) {
      let g1URL = `${URL}${pagina}.ghtml`
      await paginaPortal.bringToFront()
      await paginaPortal.goto(g1URL, { waitUntil: "domcontentloaded" })

      let links = await paginaPortal.evaluate(() => {
        return Array.from(document.querySelectorAll(".feed-post-link")).map(x => x.getAttribute("href"))
      })
      
      await paginaScraping.bringToFront()
      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosG1(paginaScraping, links[i])
        if(dict == null) continue;
        // console.log(dict)

        arquivo.write(JSON.stringify(dict) + '\n')
      }
    }
    await paginaScraping.close()

  } catch (err) {
    console.error("Erro:", err)
  } finally {
    await browser.close()
  }
}
// politica
function scrapG1Politica(){
  scrapG1(`https://g1.globo.com/politica/index/feed/pagina-`, "politica")
}

// economia
function scrapG1Economia(){
  scrapG1("https://g1.globo.com/economia/index/feed/pagina-", "economia")
}

module.exports = {scrapG1Economia, scrapG1Politica}