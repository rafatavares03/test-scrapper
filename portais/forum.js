const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')


async function coletaDadosForum(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {
      portal: "Forum",
      _id: link,
    }

    // Manchete 
    const manchete = document.querySelector("h1.titulo")
    if (manchete) dados.manchete = manchete.textContent.trim()
      else return null

    // Lide
    const lide = document.querySelector("h2.bajada")
    if (lide) dados.lide = lide.textContent.trim()

    // Data de publicação
    const dataPublicacao = document.querySelector('time.fecha-time')
    if (dataPublicacao) {
      dados.data = dataPublicacao.getAttribute('datetime')
    }

    // Autores
    const autoresTag = document.querySelector('span.post-author-name')
    if (autoresTag) {
      let autores = autoresTag.textContent.trim(); 
      let arra = autores.split(/[,\/]/).map(a => a.trim()).filter(a => a.length > 0);
      dados.autores = arra
    }
    // // Texto
    // let texto = "";
    // let pontoDePartida = document.querySelector('div.article-content--cuerpo')
    // let elementos = pontoDePartida.parentElement.querySelectorAll("p,h2") 
    // for (let elemento of elementos) {
    //   texto += elemento.textContent.trim() + "\n"
    // }
    // dados.artigo = texto.trim();

    // if(dados.artigo.length > 0) dados.artigo = dados.artigo.replaceAll(/\\n/g, '\n')

    return dados
  }, link)
}



async function scrapForum(URL, tipo) {
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage()
  await page.goto(`${URL}`, { waitUntil: "domcontentloaded" })

// const arquivo = fs.createWriteStream(`./portais_jsons/Forum-${tipo}.jsonl`, { flags: 'a' })
  try{

    for(let i = 1; i <= 1; i++){
      // vai pro fim
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // links
      let links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("h2.titulo a")).map(el => el.getAttribute("href"))
      })
      
      // coloca o link completo
      let raiz = "https://revistaforum.com.br"
      for (let i = 0; i < links.length; i++) {
        links[i] = raiz + links[i]
        // console.log(links[i])
      }
  
      // remove os links antigos
      await page.evaluate(() => {
        const artigosAntigos = document.querySelectorAll('.caja')
        artigosAntigos.forEach(artigo => artigo.remove())
      });
    
      // clica no botão
      try {
        let clickResult = await page.locator('div.btn').click({count: 2 ,delay: 1000})
        console.log(clickResult)
      } catch (e) {
          console.log("Não foi possível carregar novos conteúdos")
          console.log(e)
          return null
      }   
      
      let scrapingPage = await browser.newPage()
      await scrapingPage.bringToFront()

      let dict = []
      for (let i = 0; i < links.length; i++) {
        let temp = await coletaDadosForum(scrapingPage, links[i])

        if(temp == null) continue;
        temp.tema = tipo

        dict.push(temp)
        // console.log(dict)

        // arquivo.write(JSON.stringify(dict) + '\n')

        // console.log("\n\n")

      }
      await scrapingPage.close()
      await page.bringToFront()
      
      try {
        await inserirNoticia(dict)
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
    await browser.close()
  }
    
}

async function scrapingForum(){
  await scrapForum("https://revistaforum.com.br/politica/", "Política")
  await scrapForum("https://revistaforum.com.br/economia/", "Economia")
}

module.exports = {scrapingForum}