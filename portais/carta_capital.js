const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')


async function coletaDadosCartaCapital(pagina, link) {
  await pagina.goto(link)
  return pagina.evaluate(() => {
    let dados = {}
    dados.portal = "Carta Capital"
    dados._id = window.location.href

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


async function scrapCartaCapital(URL, tipo) {
  const browser = await puppeteer.launch({headless: true})
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

      let dict = []
      for (let i = 0; i < links.length; i++) {
        let temp = await coletaDadosCartaCapital(scrapingPage, links[i])
        
        if(temp == null) continue;
        temp.tema = tipo
        dict.push(temp)
        // console.log(dict) 
      }
      
      await scrapingPage.close()
      await page.bringToFront()
      
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
    await browser.close()
  }
}

async function scrapingCartaCapital(){
  await scrapCartaCapital("https://www.cartacapital.com.br/politica/page/", "Política")
  await scrapCartaCapital("https://www.cartacapital.com.br/economia/", "Economia")
}

module.exports = {scrapingCartaCapital}