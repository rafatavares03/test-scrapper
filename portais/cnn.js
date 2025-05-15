const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')
const { conectar, desconectar } = require('../banco_de_dados/bancoConnection')


async function coletaDadosCNN(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded"})
  return await pagina.evaluate(() => {
    const dados = {
      portal: "CNN",
      _id: window.location.href
    }

    // Manchete
    let manchete = document.querySelector("h1.single-header__title")
    if(manchete) dados.manchete = manchete.textContent
    else return null

    // Lide
    let lide = document.querySelector("p.single-header__excerpt")
    if(lide) dados.lide = lide.textContent

    // Data
    let dataPublicacao = document.querySelector("time.single-header__time")
    if(dataPublicacao) {
      dataTexto = dataPublicacao.textContent
      if(dataTexto.indexOf("|") >= 0) dataTexto = dataTexto.slice(0, dataTexto.indexOf("|"))
      dataTexto = dataTexto.split("às")
      let dia = dataTexto[0].split("/")
      let hora = dataTexto[1]
      dia.reverse()
      dia = dia.join("-")
      dataFormatada = `${dia}T${hora}-03:00`
      dataFormatada = dataFormatada.replace(/\s/g, '')
      dados.dataPublicacao = dataFormatada
    } else {
      return null
    }

    // Autores
    let autores = document.querySelector("a.blogger__name")
    if(autores == null) {
      autores = Array.from(document.querySelectorAll("span.author__group a")).map(x => x.textContent)
    } else {
      autores = new Array(autores.textContent)
    }
    if(autores.length > 0) dados.autores = autores

    // // Artigo
    // let artigo = Array.from(document.querySelectorAll("div.single-content p")).map(x => x.textContent)
    // artigo = artigo.filter(x => x.trim().length > 0) // remove parágrafos vazios
    // if(artigo && (artigo.length > 0)) dados.artigo = artigo
    // if(dados.artigo.length > 0) dados.artigo = dados.artigo.map(x => x.replaceAll(/\\n/g, '\n'))

    return dados
  })
}

async function scrapCNN(URL, tipo) {
  const browser = await puppeteer.launch({headless:true})
  const scrapingPage = await browser.newPage()
  const paginaPortal = await browser.newPage()
  await paginaPortal.goto(`${URL}`, { waitUntil: "domcontentloaded" })

  const {db,client} = await conectar()

  try{

    for(let i = 1; i <= 2; i++){    
      await paginaPortal.bringToFront()

      await paginaPortal.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      let links = await paginaPortal.evaluate(() => {
        return Array.from(document.querySelectorAll("a.home__list__tag")).map(el => el.getAttribute("href"))
      })

      await paginaPortal.evaluate(() => {
        const artigosAntigos = document.querySelectorAll('.home__list__item');
        artigosAntigos.forEach(artigo => artigo.remove());
      });

      try {
        let clickResult = await paginaPortal.locator('button.block-list-get-more-btn').click({count: 2 ,delay: 1000})
        // console.log(clickResult)
      } catch (e) {
        console.log("Não foi possível carregar novos conteúdos")
        console.log(e)
        return null
      }   
      
      await scrapingPage.bringToFront()
      
        let dict = []
        for (let i = 0; i < links.length; i++) {
          let temp = await coletaDadosCNN(scrapingPage, links[i])
  
          if(temp == null) continue;
          temp.tema = tipo

          dict.push(temp)
          //console.log(temp._id)
          console.log(temp)
          // console.log("\n\n")
        }
        
        try {
           await inserirNoticia(dict, db)
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
    await desconectar(client)
    await scrapingPage.close()
    await browser.close()
  }	
}

async function scrapingCNN(){
  await scrapCNN("https://www.cnnbrasil.com.br/economia/", "Economia")
  await new Promise(resolve => setTimeout(resolve, 1000))
  await scrapCNN("https://www.cnnbrasil.com.br/politica/", "Política")
}

module.exports = {scrapingCNN}


