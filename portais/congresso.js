const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')



async function coletaDadosCongressoEmFoco(pagina, link) {
  await pagina.goto(link, {waitUntil: "domcontentloaded"})
  return pagina.evaluate(() => {
    let dados = {}
    dados.portal = "Congresso em Foco"
    dados._id = window.location.href

    // Manchete
    let manchete = document.querySelector("h1.asset__title")
    if(manchete) {
      dados.manchete = manchete.textContent
    } else {
      return null
    }

    // Lide
    let lide = document.querySelector("h2.asset__summary")
    if(lide) dados.lide = lide.textContent

    // Data
    let dataPublicacao = document.querySelector("p.asset__date")
    if(dataPublicacao) {
      dataPublicacao = dataPublicacao.textContent.trim()
      if(dataPublicacao.indexOf(" | Atualizado às ") > 0) {
        dataPublicacao = dataPublicacao.split(" | Atualizado às ")
      } else {
        dataPublicacao = dataPublicacao.split(/\s/)
      }
      let dia = dataPublicacao[0].split("/")
      let hora = dataPublicacao[dataPublicacao.length-1]
      dia.reverse()
      dia = dia.join("-")
      let dataFormatada = `${dia}T${hora}-03:00`
      dados.dataPublicacao = dataFormatada.replace(" ", '')
    }

    // // Artigo
    // let artigo = Array.from(document.querySelectorAll("div.html-content p")).map(x => x.innerText)
    // if(artigo) dados.artigo = artigo.filter(x => x.length > 0)
    // if(dados.artigo.length > 0) dados.artigo = dados.artigo.replaceAll(/\\n/g, '\n')


    return dados
  })
}

async function scrapCongressoEmFoco(URL, tipo) {
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  
  // const arquivo = fs.createWriteStream(`./portais_jsons/Congresso-${tipo}.jsonl`, { flags: 'a' })

  try {

    for (let pagina = 1; pagina <= 1; pagina++) {
      let congressoURL = `${URL}${pagina}`
      await page.goto(congressoURL, { waitUntil: "domcontentloaded" })

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("p.asset__title a")).map(x => x.getAttribute("href"))
      })
        
      // console.log(links.length)
      let scrapingPage = await browser.newPage()
      await scrapingPage.bringToFront()
      
      let dict = []
      for (let i = 0; i < links.length; i++) {
        let temp = await coletaDadosCongressoEmFoco(scrapingPage, links[i])
        if(temp == null) continue;
        dict.tema = tipo
        dict.push(temp)
        // console.log("==\n")
        // console.log(temp)
        // arquivo.write(JSON.stringify(dict) + '\n')
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

async function scrapingCongressoEmFoco(){
  await scrapCongressoEmFoco("https://www.congressoemfoco.com.br/noticia?pagina=", "Política")
}

module.exports = {scrapingCongressoEmFoco}