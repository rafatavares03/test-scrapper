const puppeteer = require('puppeteer')

async function coletaDadosCongressoEmFoco(pagina, link) {
  await pagina.goto(link, {waitUntil: "domcontentloaded"})
  return pagina.evaluate(() => {
    let dados = {}
    let manchete = document.querySelector("h1.asset__title")
    let lide = document.querySelector("h2.asset__summary")
    let dataPublicacao = document.querySelector("p.asset__date")
    let artigo = Array.from(document.querySelectorAll("div.html-content p")).map(x => x.innerText)
    if(manchete) {
      dados.manchete = manchete.textContent
    } else {
      return null
    }
    if(lide) dados.lide = lide.textContent
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
    dados.portal = "Congresso em Foco"
    dados.link = window.location.href
    if(artigo) dados.artigo = artigo.filter(x => x.length > 0)
    if(dados.artigo.length > 0) dados.artigo = dados.artigo.replaceAll(/\\n/g, '\n')
    return dados
  })
}

async function congressoEmFocoScrap() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const uri = "mongodb://localhost:27017" // padrão do mongo
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("Noticias-Politica")
    const noticiasCongresso = db.collection("Congresso_em_foco")

    for (let pagina = 1; pagina <= 1; pagina++) {
      let tempoURL = `https://www.congressoemfoco.com.br/noticia?pagina=${pagina}`
      await page.goto(tempoURL, { waitUntil: "domcontentloaded" })

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("p.asset__title a")).map(x => x.getAttribute("href"))
      })
        
      for(let i = 0; i < links.length; i++ ){
        let noticia = await coletaDadosCongressoEmFoco(page, links[i])
        console.log(noticia)
      }
      console.log(links.length)


      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosAgenBr(page, links[i])

        if(dict == null) continue;
        dict._id = dict.link;  // link é a chave primaria 
        console.log(dict)
        
        try {
          await noticiasCongresso.insertOne(dict)
          console.log(`✅ Documento inserido: ${dict.manchete?.substring(0, 50)}...`)

        } catch (err) {
          if(err.code == 11000){
            console.error(`❌ noticia duplicada! ${dict.manchete.substring(0,50)}.`)
          } else {
            console.error("Erro ao inserir:", err)
          }
        }
      }
    }

  } catch (err) {
    console.error("Erro:", err)
  } finally {
    await client.close()
    await browser.close()
  }
}

congressoEmFocoScrap()