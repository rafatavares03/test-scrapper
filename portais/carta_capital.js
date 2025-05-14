const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')
const { client, conectar, desconectar } = require('../banco_de_dados/bancoConnection')


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
    } else {
      return null
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
  const {db, banco} = await conectar()

  try {

    for (let pagina = 500; pagina <= 600; pagina++) {
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
        console.log(temp.manchete) 
      }

      await scrapingPage.close()
      await page.bringToFront()
      
      try {
        await inserirNoticia(dict, db)
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
    await desconectar(banco)
    await browser.close()
  }
}

async function scrapingCartaCapital(){
  await scrapCartaCapital("https://www.cartacapital.com.br/politica/page/", "Política")
  await scrapCartaCapital("https://www.cartacapital.com.br/economia/", "Economia")
}

module.exports = {scrapingCartaCapital}