const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')
const { conectar, desconectar } = require('../banco_de_dados/bancoConnection')


async function coletaDadosCartaCapital(pagina, link) {
  await pagina.goto(link)
  return pagina.evaluate(() => {
    let dados = {
      portal: "Carta Capital",
      _id: window.location.href
    }

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
      dados.lide = lide[0].trim()
    } 

    // Data
    let dataPublicacao = document.querySelector("meta[property='article:published_time']")
    if(dataPublicacao) {
      dataPublicacao = dataPublicacao.getAttribute('content')
      dados.data = dataPublicacao.replace("+00:00", "-03:00")
    } else {
      return null
    }

    // Autores
    let autores = Array.from(document.querySelectorAll("div.s-content__infos strong")).map(x => x.textContent.trim())
    dados.autor = autores

    // Tags
    let tema = Array.from(document.querySelectorAll("meta[property='article:tag']")).map(x => x.getAttribute('content'))
    if(tema){
      dados.tema = tema
    }

    // // Artigo 
    // let artigo = Array.from(document.querySelectorAll(".s-content__text .content-closed p")).map(x => x.innerText.trim())
    // artigo = artigo.filter(x => x.length > 0)
    // if(artigo.length > 0) {
    //   dados.artigo = artigo.map(x => x.replaceAll(/\\n/g, '\n'))
    // }

    return dados
  })
}


async function scrapCartaCapital(URL, tipo, init) {
  const browser = await puppeteer.launch({headless: true})
  const scrapingPage = await browser.newPage()
  const paginaPortal = await browser.newPage()
  //const {db, client} = await conectar()
  let dict = []

  try {

    for (let pagina = init; pagina <= 500; pagina+=3) {
      console.log("\n", pagina, "\n")
      let cartaCapitalURL = `${URL}${pagina}/`
      await paginaPortal.bringToFront()
      await paginaPortal.goto(cartaCapitalURL, { waitUntil: "domcontentloaded" })

      const links = await paginaPortal.evaluate(() => {
        return Array.from(document.querySelectorAll("a.l-list__item")).map(x => x.getAttribute("href"))
      })
    
      await scrapingPage.bringToFront()
      for (let i = 0; i < links.length; i++) {
        let temp = await coletaDadosCartaCapital(scrapingPage, links[i])
        
        if(temp == null) continue;
        temp.secao = tipo
        dict.push(temp)
        console.log(temp._id) 
        // console.log(temp)
      }

      try {
        if(pagina % 10 != init) continue
        //await inserirNoticia(dict, db)
        console.log("inseriu\n")
        
      } catch (err) {
        if (err.name === 'MongoBulkWriteError' || err.code === 11000) {
          const totalErros = err.writeErrors ? err.writeErrors.length : 0
          
          if ((totalErros / dict.length) >= 0.5) {
            console.warn(`Erro de duplicata = ${(totalErros / dict.length)} .`)
            // return null
          } 
        } 
      }

      dict = []
    }
  } catch (err) {
    console.error("Erro:", err)
  } finally {
    //await desconectar(client)
    await scrapingPage.close()
    await browser.close()
  }
}

async function scrapingCartaCapital(){
  await Promise.all([
    scrapCartaCapital("https://www.cartacapital.com.br/economia/page/", "Economia",1),
    scrapCartaCapital("https://www.cartacapital.com.br/economia/page/", "Economia",2),
    scrapCartaCapital("https://www.cartacapital.com.br/economia/page/", "Economia",3)
  ])
  // await scrapCartaCapital("https://www.cartacapital.com.br/politica/page/", "Política")
}

module.exports = {scrapingCartaCapital}