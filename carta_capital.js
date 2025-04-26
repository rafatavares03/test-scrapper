const puppeteer = require('puppeteer')

async function coletaDadosCartaCapital(pagina, link) {
  await pagina.goto(link)
  return pagina.evaluate(() => {
    let dados = {}
    let manchete = document.querySelector("section.s-content__heading h1")
    let lide = Array.from(document.querySelectorAll("section.s-content__heading p")).map(x => x.textContent)
    let dataPublicacao = document.querySelector("div.s-content__infos span span")
    if(manchete) {
      dados.manchete = manchete.textContent
    } else {
      return null
    }
    if(lide.length > 0) {
      lide = lide.filter(x => x.length > 0)
      dados.lide = lide[0]
    } 
    if(dataPublicacao) dados.dataPublicacao = dataPublicacao.textContent.trim()
    dados.portal = "Carta Capital"
    dados.link = window.location.href
    return dados
  })
}

async function cartaCapitalScraping() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  let cartaCapitalURL = "https://www.cartacapital.com.br/politica/page/1/"
  await page.goto(cartaCapitalURL)

  let links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.l-list__item")).map(x => x.getAttribute("href"))
  })
  for(let i = 0; i < links.length; i++) {
    let noticia = await coletaDadosCartaCapital(page, links[i])
    console.log(noticia)
  }
  await browser.close()
}

cartaCapitalScraping()