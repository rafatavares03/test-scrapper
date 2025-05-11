const puppeteer = require('puppeteer')
const { MongoClient } = require("mongodb")


async function coletaDadosCartaCapital(pagina, link) {
  await pagina.goto(link)
  return pagina.evaluate((link) => {
        const dados = {
      portal: "Carta Capital",
      link: link,
    }
    let manchete = document.querySelector("section.s-content__heading h1")
    let lide = Array.from(document.querySelector("button[data-excerpt]").dataset.excerpt)

    let dataPublicacao = document.querySelector("div.s-content__infos span span")
    let autores = Array.from(document.querySelectorAll("div.s-content__infos strong")).map(x => x.textContent.trim())

    if(manchete) {
      dados.manchete = manchete.textContent
    } else {
      return null
    }

    if(lide.length > 0) {
      // lide.textContent
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

    return dados
  }, link)
}


async function cartaCapitalScraping() {
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()

  try {

    for (let pagina = 1; pagina < 3; pagina++) {
      let cartaCapitalURL = `https://www.cartacapital.com.br/tag/agronegocio/page/${pagina}/`
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

cartaCapitalScraping()