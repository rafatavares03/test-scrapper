const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')
const { conectar, desconectar } = require('../banco_de_dados/bancoConnection')


async function coletaInfo(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded"})
  return await pagina.evaluate((link) => {
    const dados = {}
    dados.portal = "InfoMoney"
    dados._id = link

    // Manchete
    let manchete = document.querySelector(".text-3xl")
    if(manchete) dados.manchete = manchete.textContent.trim()
    else return null
  
    // Lide
    let lide = document.querySelector(".text-lg")
    if(lide) dados.lide = lide.textContent.trim()


    // Datatime[itemprop="dateModified"]
    let dataPublicacao = document.querySelector("div[data-ds-component='author-small'] time")

    if(dataPublicacao) {
        dados.data = dataPublicacao.getAttribute("datetime")
    } else {
      return null
    }

    // Autores
    let autores = Array.from(document.querySelectorAll("div[data-ds-component='author-small'] a.text-base, div[data-ds-component='author-small'] span.text-base")).map(x => x.textContent.trim())
    dados.autores = autores

    return dados
  }, link)
}

async function infoMoneyscrap(URL, tipo) {
  const browser = await puppeteer.launch({headless:true})
  const scrapingPage = await browser.newPage()
  const paginaPortal = await browser.newPage()
  await paginaPortal.goto(`${URL}`, { waitUntil: "domcontentloaded" })

  const {db, client} = await conectar()

  try{

    for(let i = 1; i <= 200; i++){
        await paginaPortal.bringToFront()
        await paginaPortal.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        let links = await paginaPortal.evaluate(() => {
          return Array.from(document.querySelectorAll(".size-28 a")).map(el => el.getAttribute("href"))
        })

        await paginaPortal.evaluate(() => {
          const artigosAntigos = document.querySelectorAll("body > main > div > section:nth-child(8) > div > div > div:nth-child(3)");
          artigosAntigos.forEach(artigo => artigo.remove());
        });

        try {
          let clickResult = await paginaPortal.locator('body > main > div > section:nth-child(9) > div > div.flex.justify-center.my-8 > button').click({count: 2 ,delay: 1000})
          console.log(clickResult)
        } catch (e) {
            console.log("Não foi possível carregar novos conteúdos")
            console.log(e)
            return null
        }   

        // for(let i = 0; i < links.length; i++){
        //     console.log(links[i])
        // }
        
        await scrapingPage.bringToFront()
        let dict = []
        for (let i = 0; i < links.length; i++) {
          let temp = await coletaInfo(scrapingPage, links[i])
  
          if(temp == null) continue;
          temp.tema = tipo

          dict.push(temp)
          console.log(temp._id)
          // console.log("\n\n")
        }
        
        try {
          await inserirNoticia(dict, db)
        } catch (err) {
          if (err.name === 'MongoBulkWriteError' || err.code === 11000) {
            const totalErros = err.writeErrors ? err.writeErrors.length : 0
          
          if ((totalErros / dict.length) >= 0.5) {
            console.warn(`Erro de duplicata = ${(totalErros / dict.length)} .`)
            console.log("\n\n")
            continue
            return null
          } 
        } 
      }
    }
  } catch (err) {
    console.error("Erro:", err)
  } finally {
    await scrapingPage.close()
    await desconectar(client)
    await browser.close()
  }	
}


async function scrapingInfoMoney(){  
  infoMoneyscrap("https://www.infomoney.com.br/economia/", "Economia")
  
}

module.exports = {scrapingInfoMoney}