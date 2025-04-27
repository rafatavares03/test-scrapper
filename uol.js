const puppeteer = require('puppeteer')
const fs = require('fs')

async function coletaDadosUol(pagina, link) {
  await pagina.goto(link, {waitUntil: "domcontentloaded"})
  return pagina.evaluate(() => {
    let dados = {}
    let manchete = document.querySelector("h1.title")
    let dataPublicacao = document.querySelector("time.date")
    let autores = Array.from(document.querySelectorAll(".solar-author-name")).map(x => x.innerText)
    let artigo = Array.from(document.querySelectorAll("div.jupiter-paragraph-fragment p")).map(x => x.innerText)
    if(manchete) {
      dados.manchete = manchete.textContent
    } else {
      return null
    }
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
    if(autores.length > 0) dados.autores = autores
    dados.portal = "Uol"
    dados.link = window.location.href
    if(artigo.length > 0) dados.artigo = artigo
    return dados
  })
}

async function uolScrap() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto("https://noticias.uol.com.br/politica/", { waitUntil: "domcontentloaded" })

  await new Promise(resolve => setTimeout(resolve, 2222)); // a pagina tem que esquentar

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
            let noticia = await coletaDadosUol(page, links[i])
            console.log(noticia)
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
        
        // uol demora pra carregar, ent tem que ter isso


            // aqui

  }
    
    // await new Promise(resolve => setTimeout(resolve, 4000)); // pra analisar 
    
  await browser.close()
}

uolScrap()