const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')


async function coletaDadosUol(pagina, link) {
  await pagina.goto(link, {waitUntil: "domcontentloaded"})
  return pagina.evaluate(() => {
    let dados = {
      portal: "Uol",
      _id: window.location.href
    }

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
    } else {
      return null
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

async function scrapUol(URL, tipo) {
  const browser = await puppeteer.launch({headless: true})
  const scrapingPage = await browser.newPage()
  const paginaPortal = await browser.newPage()
  await paginaPortal.goto(`${URL}`, { waitUntil: "domcontentloaded" })

  // await new Promise(resolve => setTimeout(resolve, 2222)); // a pagina tem que esquentar

  try{

    for(let i = 1; i <= 2; i++){
      await paginaPortal.bringToFront()
      await paginaPortal.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      let links = await paginaPortal.evaluate(() => {
        let vetor = Array.from(document.querySelectorAll("div.thumbnails-wrapper a")).map(el => el.getAttribute("href"))

        const artigosAntigos = document.querySelectorAll('.thumbnails-item');
        artigosAntigos.forEach(artigo => artigo.remove());

        return vetor
      })

      try {
        await paginaPortal.locator('button.ver-mais').click({count: 2 ,delay: 1000})
        // console.log(clickResult)
      } catch (e) {
        console.log("Não foi possível carregar novos conteúdos")
        console.log(e)
        await browser.close()
        return null
      }   
      
      await scrapingPage.bringToFront()
      // Imprime os links
      let dict = []
      for (let i = 0; i < links.length; i++) {
        let noticia = await coletaDadosUol(scrapingPage, links[i])
        if(noticia == null) continue
        noticia.tema = tipo
        
        console.log(noticia)

        noticia.tema = tipo
        dict.push(noticia)
      }
      
      
      try {
        // await inserirNoticia(dict)
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
    // await new Promise(resolve => setTimeout(resolve, 4000)); // pra analisar 
  } catch (err) {
    console.error("Erro:", err)
  } finally {
    await scrapingPage.close()
    await browser.close()
  }
}

async function scrapingUol(){
  await scrapUol("https://noticias.uol.com.br/politica/", "Política")
  await scrapUol("https://economia.uol.com.br/ultimas/", "Economia")
}


module.exports = {scrapingUol}