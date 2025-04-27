const puppeteer = require('puppeteer')
const { MongoClient } = require("mongodb")

async function coletaDadosAgenBr(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {}
    dados.portal = "Agencia_Brasil"
    dados.link = link
  
    // Manchete
    let manchete = document.querySelector("h1.titulo-materia")
    if(manchete) dados.manchete = manchete.textContent.trim()
    else return null

    // Lide
    let lide = document.querySelector("div.linha-fina-noticia")
    if(lide) dados.lide = lide.textContent

    // Data de Publicação
    let dataPublicacao = document.querySelector('.data')
    if(dataPublicacao){
      let texto = dataPublicacao.textContent.replace("Publicado em ", "").trim()
      let [data, hora] = texto.split(' - ')
      let [dia, mes, ano] = data.split('/')
      let dataISO = `${ano}-${mes}-${dia}T${hora}:00`
      dados.dataPublicacao = new Date(dataISO).toISOString()
    }
    
    // Autores
    let autoresTag = document.querySelector(".autor-noticia")
    if(autoresTag) {
        let autores = autoresTag.textContent
        autores = autores.replace(/ –| - |Repórter da | - Repórteres da | e /g, ',') // não mexa no primeiro, pelo amor
        autores = autores.split(',')
        if(autores[autores.length - 1].indexOf(" e " >= 0)) {
          let dupla = autores.pop()
          dupla = dupla.split(" e ")
          for(let i = 0; i < dupla.length; i++) autores.push(dupla[i])
        }
        dados.autores = autores.map(x => x.trim()).filter(a => a.length > 0)
    }

    // Artigo
    let texto = "";
    let pontoDePartida = document.querySelector('div.conteudo-noticia')
    let elementos = pontoDePartida.parentElement.querySelectorAll("p,h2") 
    for (let elemento of elementos) {
      texto += elemento.textContent.trim() + "\n"
    }
    dados.artigo = texto.trim();

    if(dados.artigo.length > 0) dados.artigo = dados.artigo.replaceAll(/\\n/g, '\n')

    return dados
  }, link)
}

async function start() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const uri = "mongodb://localhost:27017" // padrão do mongo
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("Noticias-Politica")
    const noticiasAgenBra = db.collection("Agencia_Brasil")
    await noticiasAgenBra.deleteMany({})

    for (let pagina = 1; pagina <= 10; pagina++) {
      let g1URL = `https://agenciabrasil.ebc.com.br/politica?page=${pagina}`
      await page.goto(g1URL, { waitUntil: "domcontentloaded" })

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".capa-noticia")).map(x => x.getAttribute("href"))
      })


      let raiz = "https://agenciabrasil.ebc.com.br"
      for(let i = 0; i < links.length; i++ ){
        links[i] = raiz + links[i]
        // console.log(links[i])
      }


      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosAgenBr(page, links[i])

        if(dict == null) continue;
        dict._id = dict.link;  // link é a chave primaria 
        console.log(dict.autores)
        
        // try {
        //   await noticiasAgenBra.insertOne(dict)
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
