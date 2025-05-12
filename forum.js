const puppeteer = require('puppeteer')


async function coletaDadosForum(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {
      portal: "Forum",
      link: link,
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
    // Texto
    let texto = "";
    let pontoDePartida = document.querySelector('div.article-content--cuerpo')
    let elementos = pontoDePartida.parentElement.querySelectorAll("p,h2") 
    for (let elemento of elementos) {
      texto += elemento.textContent.trim() + "\n"
    }
    dados.artigo = texto.trim();

    if(dados.artigo.length > 0) dados.artigo = dados.artigo.replaceAll(/\\n/g, '\n')

    return dados
  }, link)
}



async function forumScrap() {
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage()
  await page.goto("https://revistaforum.com.br/politica/", { waitUntil: "domcontentloaded" })
  const uri = "mongodb://localhost:27017" // padrão do mongo
  const client = new MongoClient(uri)
  

  try{
    await client.connect()
    const db = client.db("Noticias-Politica")
    const noticiasForum = db.collection("Forum")

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
      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosForum(scrapingPage, links[i])

        if(dict == null) continue;
        dict._id = dict.link // link é a chave primaria 
        // console.log(dict)
        // console.log("\n\n")
        
        try {
          await noticiasForum.insertOne(dict)
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
forumScrap()