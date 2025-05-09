const puppeteer = require('puppeteer')
const { MongoClient } = require("mongodb")


async function coletaDadosCartaCapital(pagina, link) {
  await pagina.goto(link)
  return pagina.evaluate(() => {
    let dados = {}
    let manchete = document.querySelector("section.s-content__heading h1")
    let lide = Array.from(document.querySelectorAll("section.s-content__heading p")).map(x => x.textContent)
    let dataPublicacao = document.querySelector("div.s-content__infos span span")
    let autores = Array.from(document.querySelectorAll("div.s-content__infos strong")).map(x => x.textContent.trim())
    let artigo = Array.from(document.querySelectorAll(".s-content__text .content-closed p")).map(x => x.innerText.trim())
    artigo = artigo.filter(x => x.length > 0)
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
      dados.artigo = artigo.map(x => x.replaceAll(/\\n/g, '\n'))
    }

    return dados
  })
}


async function cartaCapitalScraping() {
  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()
  const uri = "mongodb://localhost:27017" // padrão do mongo
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("Noticias-Politica")
    const noticiasCartaCap = db.collection("Carta_Capital")

    for (let pagina = 1; pagina <= 10; pagina++) {
      let cartaCapitalURL = `https://www.cartacapital.com.br/politica/page/${pagina}/`
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
        
        try {
          await noticiasCartaCap.insertOne(dict)
          console.log(`✅ Documento inserido: ${dict.manchete?.substring(0, 50)}...`)

        } catch (err) {
          if(err.code == 11000){
            console.error(`❌ noticia duplicada! ${dict.manchete.substring(0,50)}.`)
          } else {
            console.error("Erro ao inserir:", err)
          }
        }
      }
      await scrapingPage.close()
      await page.bringToFront()
    }

  } catch (err) {
    console.error("Erro:", err)
  } finally {
    await client.close()
    await browser.close()
  }
}

cartaCapitalScraping()