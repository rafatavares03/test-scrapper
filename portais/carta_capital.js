const puppeteer = require('puppeteer')


async function coletaDadosCartaCapital(pagina, link) {
  await pagina.goto(link)
  return pagina.evaluate(() => {
    let dados = {}
        dados.portal = "Carta Capital"
    dados.link = window.location.href

    // Manchete
    let manchete = document.querySelector("section.s-content__heading h1")
    if(manchete) {
      dados.manchete = manchete.textContent
    } else {
      return null
    }

    // Lide
    let lide = Array.from(document.querySelectorAll("section.s-content__heading p")).map(x => x.textContent)
    if(lide.length > 0) {
      lide = lide.filter(x => x.length > 0)
      dados.lide = lide[0]
    } 

    // Data
    let dataPublicacao = document.querySelector("div.s-content__infos span span")
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

    // Autores
    let autores = Array.from(document.querySelectorAll("div.s-content__infos strong")).map(x => x.textContent.trim())
    dados.autores = autores

    // // Artigo 
    // let artigo = Array.from(document.querySelectorAll(".s-content__text .content-closed p")).map(x => x.innerText.trim())
    // artigo = artigo.filter(x => x.length > 0)
    // if(artigo.length > 0) {
    //   dados.artigo = artigo.map(x => x.replaceAll(/\\n/g, '\n'))
    // }

    return dados
  })
}


async function cartaCapitalScraping(URL) {
  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()

  try {

    for (let pagina = 1; pagina <= 1; pagina++) {
      let cartaCapitalURL = `${URL}${pagina}/`
      await page.goto(cartaCapitalURL, { waitUntil: "domcontentloaded" })

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a.l-list__item")).map(x => x.getAttribute("href"))
      })
      
      let scrapingPage = await browser.newPage()
      await scrapingPage.bringToFront()
      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosCartaCapital(scrapingPage, links[i])

        if(dict == null) continue;
        dict._id = dict.link;  // link é a chave primaria 
        console.log(dict)
        
      
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


function scrapCartaPolitica(){
  cartaCapitalScraping("https://www.cartacapital.com.br/politica/page/")
}

module.exports = {scrapCartaPolitica}