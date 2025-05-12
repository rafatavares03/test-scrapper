const puppeteer = require('puppeteer')
const fs = require('fs')

async function coletaDadosUol(pagina, link) {
  await pagina.goto(link, {waitUntil: "domcontentloaded"})
  return pagina.evaluate(() => {
    let dados = {}
    dados.portal = "Uol"
    dados.link = window.location.href

    // Manchete
    let manchete = document.querySelector("h1.title")
    if(manchete) dados.manchete = manchete.textContent
      else return null

    // Data de Publicação
    let dataPublicacao = document.querySelector("time.date")    
    if(dataPublicacao) {
      dataPublicacao = dataPublicacao.textContent
      dataPublicacao = dataPublicacao.split(" ")
      let dia = dataPublicacao[0].split("/")
      let hora = dataPublicacao[1].replace("h", ":")
      dia.reverse()
      dia = dia.join("-")
      let dataFormatada = `${dia}T${hora}-03:00`
      dados.dataPublicacao = dataFormatada
    }

    // Autores
    let autores = Array.from(document.querySelectorAll(".solar-author-name")).map(x => x.innerText)
    if(autores.length > 0) dados.autores = autores

    // // Artigo
    // let artigo = Array.from(document.querySelectorAll("div.jupiter-paragraph-fragment p")).map(x => x.innerText)
    // if(artigo.length > 0) dados.artigo = artigo.map(x => x.replaceAll(/\\n/g, '\n'))

    return dados
  })
}

async function uolScrap(URL, tipo) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(`${URL}`, { waitUntil: "domcontentloaded" })

  // await new Promise(resolve => setTimeout(resolve, 2222)); // a pagina tem que esquentar

  const arquivo = fs.createWriteStream(`./portais_jsons/UOL-${tipo}.jsonl`, { flags: 'a' })


  try{

    for(let i = 1; i <= 1; i++){
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      let links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div.thumbnails-wrapper a")).map(el => el.getAttribute("href"))
      })
      
      let scrapingPage = await browser.newPage()
      await scrapingPage.bringToFront()
      // Imprime os links
      for (let i = 0; i < links.length; i++) {
        let noticia = await coletaDadosUol(scrapingPage, links[i])
        // console.log(noticia)
        arquivo.write(JSON.stringify(dict) + '\n')
      }
      await scrapingPage.close()
      await page.bringToFront()
      
      await page.evaluate(() => {
        const artigosAntigos = document.querySelectorAll('.thumbnails-item');
        artigosAntigos.forEach(artigo => artigo.remove());
      });
      
      try {
        let clickResult = await page.locator('button.ver-mais').click({count: 2 ,delay: 1000})
        console.log(clickResult)
      } catch (e) {
        console.log("Não foi possível carregar novos conteúdos")
        console.log(e)
        await browser.close()
        return null
      }   
      
    }
    
    // await new Promise(resolve => setTimeout(resolve, 4000)); // pra analisar 
  } catch (err) {
    console.error("Erro:", err)
  } finally {
    await browser.close()
  }
}
  

function scrapUOLPolitica(){
  uolScrap("https://noticias.uol.com.br/politica/", "Politica")
}

function scrapUOLEconomia(){
  uolScrap("https://economia.uol.com.br/ultimas/", "Economia")
}


module.exports = {scrapUOLPolitica, scrapUOLEconomia}