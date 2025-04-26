const puppeteer = require('puppeteer')

async function coletaDadosCartaCapital(pagina, link) {
  await pagina.goto(link)
  return pagina.evaluate(() => {
    let dados = {}
    let manchete = document.querySelector("section.s-content__heading h1")
    let lide = Array.from(document.querySelectorAll("section.s-content__heading p")).map(x => x.textContent)
    let dataPublicacao = document.querySelector("div.s-content__infos span span")
    let autores = Array.from(document.querySelectorAll("div.s-content__infos strong")).map(x => x.textContent.trim())
    let artigo = Array.from(document.querySelectorAll(".s-content__text .content-closed p")).map(x => x.textContent.trim())
    artigo = artigo.filter(x => x[0] != '{' && x[x.length-1] != '}')
    if(manchete) {
      dados.manchete = manchete.textContent
    } else {
      return null
    }
    if(lide.length > 0) {
      lide = lide.filter(x => x.length > 0)
      dados.lide = lide[0]
    } 
    if(dataPublicacao) {
      dataPublicacao = dataPublicacao.textContent.trim()
      dataPublicacao = dataPublicacao.split(" ")
      let dia = dataPublicacao[0].split(".")
      let hora = dataPublicacao[1].replace("h", ":")
      dia.reverse()
      dia = dia.join("-")
      let dataFormatada = `${dia}T${hora}-03:00`
      dados.dataPublicacao = dataFormatada
    }
    dados.autores = autores
    dados.portal = "Carta Capital"
    dados.link = window.location.href
    if(artigo.length > 0) {
      dados.artigo = artigo
    }
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