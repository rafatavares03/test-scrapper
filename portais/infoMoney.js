const puppeteer = require('puppeteer')
const fs = require('fs')

async function coletaInfo(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded"})
  return await pagina.evaluate((link) => {
    const dados = {}
    dados.portal = "InfoMoney"
    dados.link = link

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
    }

    // Autores
    let autores = Array.from(document.querySelectorAll("div[data-ds-component='author-small'] a.text-base, div[data-ds-component='author-small'] span.text-base")).map(x => x.textContent.trim())
    dados.autores = autores

    return dados
  }, link)
}

async function infoMoneyscrap(URL, tipo) {
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage()
  await page.goto(`${URL}`, { waitUntil: "domcontentloaded" })

  const arquivo = fs.createWriteStream(`./portais_jsons/infoMoney-${tipo}.jsonl`, { flags: 'a' })

  try{

    for(let i = 1; i <= 1; i++){
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        let links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll(".size-28 a")).map(el => el.getAttribute("href"))
        })

        await page.evaluate(() => {
          const artigosAntigos = document.querySelectorAll("body > main > div > section:nth-child(8) > div > div > div:nth-child(3)");
          artigosAntigos.forEach(artigo => artigo.remove());
        });

        try {
          let clickResult = await page.locator('body > main > div > section:nth-child(9) > div > div.flex.justify-center.my-8 > button').click({count: 2 ,delay: 1000})
          console.log(clickResult)
        } catch (e) {
            console.log("Não foi possível carregar novos conteúdos")
            console.log(e)
            return null
        }   

        for(let i = 0; i < links.length; i++){
            console.log(links[i])
        }
        
        let scrapingPage = await browser.newPage()
        await scrapingPage.bringToFront()
        for (let i = 0; i < links.length; i++) {
          let dict = await coletaInfo(scrapingPage, links[i])
  
          if(dict == null) continue;
          dict._id = dict.link // link é a chave primaria 
          console.log(dict)
          // console.log("\n\n")

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


async function scrappingInfoMoney(){
  infoMoneyscrap("https://www.infomoney.com.br/economia/", "Economia")
}

module.exports = {scrappingInfoMoney}