const puppeteer = require('puppeteer')
const { MongoClient } = require("mongodb")

async function start() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const uri = "mongodb://localhost:27017" // padrão do mongo
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("meu_banco")
    const noticiasG1 = db.collection("G1_noticias")

    for (let pagina = 1; pagina <= 2; pagina++) {''
      let g1URL = `https://g1.globo.com/politica/index/feed/pagina-${pagina}.ghtml`
      await page.goto(g1URL, { waitUntil: "domcontentloaded" })

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".feed-post-link")).map(x => x.getAttribute("href"))
      })

      for (let i = 0; i < links.length; i++) {
        await page.goto(links[i], { waitUntil: "domcontentloaded" })

        let dict = await page.evaluate(() => {
          const dict = {}
          let manchete = document.querySelector("h1.content-head__title")
          let lide = document.querySelector("h2.content-head__subtitle")
          let dataPublicacao = document.querySelector('time[itemprop="dateModified"]')
          let artigo = Array.from(document.querySelectorAll("article[itemprop='articleBody'] .content-text")).map(x => x.textContent)
          if (manchete) {
            dict.manchete = manchete.textContent
          } else return null
          if (lide) dict.lide = lide.textContent
          if (dataPublicacao) dict.dataPublicacao = dataPublicacao.getAttribute("datetime")
          if (artigo && artigo.length) dict.artigo = artigo
          return dict
        })
        if(dict == null) continue;
        dict.portal = "g1"
        dict.link = links[i]
        dict._id = dict.link;
        
        try {
          await noticiasG1.insertOne(dict)
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

start()
