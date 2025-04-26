const puppeteer = require('puppeteer')
const { MongoClient } = require("mongodb")

async function coletaDadosG1(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {}
    let manchete = document.querySelector("h1.content-head__title")
    let lide = document.querySelector("h2.content-head__subtitle")
    let dataPublicacao = document.querySelector('time[itemprop="dateModified"]')
    let artigo = Array.from(document.querySelectorAll("article[itemprop='articleBody'] .content-text")).map(x => x.textContent)
    let autoresTag = document.querySelector("p.top__signature__text__author-name")
    if(autoresTag == null) {
      autoresTag = document.querySelector("p.content-publication-data__from")
    }
    if(manchete) dados.manchete = manchete.textContent
    else return null
    if(lide) dados.lide = lide.textContent
    if(dataPublicacao) dados.dataPublicacao = dataPublicacao.getAttribute("datetime")
    if(autoresTag) {
      let autores = autoresTag.textContent
      autores = autores.replace("Por", '')
      if(autores.indexOf(" —") >= 0) autores = autores.slice(0, autores.indexOf(" —")) // remove o traço e a localização que vem depois dele.
      autores = autores.split(',')
      if(autores[autores.length - 1].indexOf(" e " >= 0)) {
        let dupla = autores.pop()
        dupla = dupla.split(" e ")
        for(let i = 0; i < dupla.length; i++) autores.push(dupla[i])
      }
      dados.autores = autores.map(x => x.trim())
    }
    dados.portal = "g1"
    dados.link = window.location.href
    if (artigo && (artigo.length > 0)) dados.artigo = artigo.map(x => x.trim())
    return dados
  })
}

async function start() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const uri = "mongodb://localhost:27017" // padrão do mongo
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("meu_banco")
    const noticiasG1 = db.collection("G1_noticias")

    for (let pagina = 1; pagina <= 1; pagina++) {
      let g1URL = `https://g1.globo.com/politica/index/feed/pagina-${pagina}.ghtml`
      await page.goto(g1URL, { waitUntil: "domcontentloaded" })

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".feed-post-link")).map(x => x.getAttribute("href"))
      })

      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosG1(page, links[i])

        if(dict == null) continue;
        dict._id = dict.link;  // link é a chave primaria 
        console.log(dict)
        
        // try {
        //   await noticiasG1.insertOne(dict)
        //   console.log(`✅ Documento inserido: ${dict.manchete?.substring(0, 50)}...`)

        // } catch (err) {
        //   if(err.code == 11000){
        //     console.error(`❌ noticia duplicada! ${dict.manchete.substring(0,50)}.`)
        //   } else {
        //     console.error("Erro ao inserir:", err)
        //   }
        // }
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
