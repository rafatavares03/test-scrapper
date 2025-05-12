const puppeteer = require('puppeteer')

async function coletaDadosAgenBr(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {}
    dados.portal = "Agencia_Brasil"
    dados.link = link
  
    // Manchete
    let manchete = document.querySelector("h1.titulo-materia")
    if(manchete) dados.manchete = manchete.textContent.trim()
    else return null

    // Lide
    let lide = document.querySelector("div.linha-fina-noticia")
    if(lide) dados.lide = lide.textContent.trim()

    // Data de Publicação
    let dataPublicacao = document.querySelector('.data')
    if(dataPublicacao){
      let texto = dataPublicacao.textContent.replace("Publicado em ", "").trim()
      let [data, hora] = texto.split(' - ')
      let [dia, mes, ano] = data.split('/')
      let dataISO = `${ano}-${mes}-${dia}T${hora}:00`
      dados.dataPublicacao = new Date(dataISO).toISOString()
    }
    
    // Autores
    let autoresTag = document.querySelector(".autor-noticia")
    if(autoresTag) {
        let autores = autoresTag.textContent
        autores = autores.split('–')[0].trim()
        autores = autores.split('-')[0].trim()
        autores = autores.replace(/ e /g,",")
        autores = autores.split(',')
        dados.autores = autores.map(x => x.trim()).filter(a => a.length > 0)
    }

    return dados
  }, link)
}

async function agenciaScrap() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  try {

    for (let pagina = 1; pagina <= 2; pagina++) {
      let g1URL = `https://agenciabrasil.ebc.com.br/politica?page=${pagina}`
      await page.goto(g1URL, { waitUntil: "domcontentloaded" })

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".capa-noticia")).map(x => x.getAttribute("href"))
      })


      let raiz = "https://agenciabrasil.ebc.com.br"
      for(let i = 0; i < links.length; i++ ){
        links[i] = raiz + links[i]
        // console.log(links[i])
      }

      let scrapingPage = await browser.newPage()
      await scrapingPage.bringToFront()
      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosAgenBr(scrapingPage, links[i])

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

agenciaScrap()
