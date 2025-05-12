const puppeteer = require('puppeteer')

async function coletaDadosCamaraDep(pagina, link) {
  await pagina.goto(link)
  return pagina.evaluate(() => {
    let dados = {}
    let manchete = document.querySelector("h1.g-artigo__titulo")
    let lide = document.querySelector("p.g-artigo__descricao")
    let dataPublicacao = document.querySelector("p.g-artigo__data-hora")
    let autores = document.querySelector("div.js-article-read-more p[style='font-size: 0.8rem; font-weight: 700;']")
    let artigo = Array.from(document.querySelectorAll("div.js-article-read-more p")).filter(x => x.hasAttribute("class") == false && x.hasAttribute("style") == false)
    artigo = artigo.map(x => {
      let text = x.innerText.trim()
      text = text.replaceAll(/\n/g, ': ')
      return text
    })
    if(manchete) {
      dados.manchete = manchete.textContent
    } else {
      return null
    }
    if(lide) dados.lide = lide.textContent
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
    if(autores) {
      autores = autores.innerHTML
      autores = autores.split("<br>")
      autores = autores.map(x => {
        return x.slice(x.indexOf("–")+1, x.length).trim()
      })
      dados.autores = autores
    }
    dados.portal = "Portal da Câmara dos Deputados"
    dados.link = window.location.href
    if(artigo) dados.artigo = artigo.filter(x => x.length > 0)
    if(dados.artigo.length > 0) dados.artigo = dados.artigo.replaceAll(/\\n/g, '\n')
    return dados
  
  })
}

async function camaraDepScrap() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const uri = "mongodb://localhost:27017" // padrão do mongo
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("Noticias-Politica")
    const noticiasCamara = db.collection("Camara_dos_Deputados")

    for (let pagina = 1; pagina <= 1; pagina++) {
      let tempoURL = `https://www.camara.leg.br/noticias/ultimas?pagina=${pagina}`
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
        console.log(dict)
        
        try {
          await noticiasCamara.insertOne(dict)
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

camaraDepScrap()