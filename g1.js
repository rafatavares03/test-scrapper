const puppeteer = require('puppeteer')

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

async function scrapG1() {
  const browser = await puppeteer.launch()
  const paginaPortal = await browser.newPage()
  const paginaScraping = await browser.newPage()

  try {
    for (let pagina = 1; pagina <= 2; pagina++) {
      let g1URL = `https://g1.globo.com/economia/agronegocios/index/feed/pagina-${pagina}.ghtml`
      await paginaPortal.bringToFront()
      await paginaPortal.goto(g1URL, { waitUntil: "domcontentloaded" })

      let links = await paginaPortal.evaluate(() => {
        return Array.from(document.querySelectorAll(".feed-post-link")).map(x => x.getAttribute("href"))
      })
      
      await paginaScraping.bringToFront()
      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosG1(paginaScraping, links[i])
        if(dict == null) continue;
        console.log(dict)
      }
    }
    await paginaScraping.close()

  } catch (err) {
    console.error("Erro:", err)
  } finally {
    await browser.close()
  }
}

scrapG1()
