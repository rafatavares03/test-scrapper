const puppeteer = require('puppeteer')
const fs = require('fs')

async function coletaDadosCamaraDep(pagina, link) {
  await pagina.goto(link)
  return pagina.evaluate(() => {
    let dados = {}
    dados.portal = "Portal da Câmara dos Deputados"
    dados.link = window.location.href

    // Manchete
    let manchete = document.querySelector("h1.g-artigo__titulo")
    if(manchete) {
      dados.manchete = manchete.textContent
    } else {
      return null
    }

    // Lide
    let lide = document.querySelector("p.g-artigo__descricao")
    if(lide) dados.lide = lide.textContent

    // Data
    let dataPublicacao = document.querySelector("p.g-artigo__data-hora")
    if(dataPublicacao) {
      dataPublicacao = dataPublicacao.textContent.trim()
      if(dataPublicacao.indexOf("•") >= 0) {
        dataPublicacao = dataPublicacao.slice(0, dataPublicacao.indexOf("•")).trim()
      }
      dataPublicacao = dataPublicacao.split(" - ")
      let dia = dataPublicacao[0]
      let hora = dataPublicacao[1]
      dia = dia.split("/")
      dia.reverse()
      dia = dia.join("-")
      let dataFormatada = `${dia}T${hora}-03:00`
      dados.dataPublicacao = dataFormatada
    }

    // Autores
    let autores = document.querySelector("div.js-article-read-more p[style='font-size: 0.8rem; font-weight: 700;']")
    if(autores) {
      autores = autores.innerHTML
      autores = autores.split("<br>")
      autores = autores.map(x => {
        return x.slice(x.indexOf("–")+1, x.length).trim()
      })
      dados.autores = autores
    }

    // // Artigo
    // let artigo = Array.from(document.querySelectorAll("div.js-article-read-more p")).filter(x => x.hasAttribute("class") == false && x.hasAttribute("style") == false)
    // artigo = artigo.map(x => {
    //   let text = x.innerText.trim()
    //   text = text.replaceAll(/\n/g, ': ')
    //   return text
    // })
    // if(artigo) dados.artigo = artigo.filter(x => x.length > 0)
    // if(dados.artigo.length > 0) dados.artigo = dados.artigo.replaceAll(/\\n/g, '\n')

    return dados
  })
}

async function camaraDepScrap(URL, tipo) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  const arquivo = fs.createWriteStream(`./portais_jsons/Camara_deputados-${tipo}.jsonl`, { flags: 'a' })

  try {
    for (let pagina = 1; pagina <= 1; pagina++) {
      let tempoURL = `${URL}${pagina}`
      await page.goto(tempoURL, { waitUntil: "domcontentloaded" })

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("h3.g-chamada__titulo a")).map(x => x.getAttribute("href"))
      })
      
      let scrapingPage = await browser.newPage()
      await scrapingPage.bringToFront()
      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosCamaraDep(scrapingPage, links[i])

        if(dict == null) continue;
        dict._id = dict.link;  // link é a chave primaria 
        // console.log(dict)

        arquivo.write(JSON.stringify(dict) + '\n')
        
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


function scrapCamaraPolitica(){
  camaraDepScrap("https://www.camara.leg.br/noticias/ultimas?pagina=", "Politica")
}

module.exports = {scrapCamaraPolitica}

