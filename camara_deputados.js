const puppeteer = require('puppeteer')

async function tempoScrap() {
  const browser = await puppeteer.launch({headless:false})
  const page = await browser.newPage()
  const uri = "mongodb://localhost:27017" // padrão do mongo
//   const client = new MongoClient(uri)

  try {
    // await client.connect()
    // const db = client.db("Noticias-Politica")
    // const noticiasAgenBra = db.collection("O_Tempo")

    for (let pagina = 1; pagina <= 3; pagina++) {
      let tempoURL = `https://www.camara.leg.br/noticias/ultimas?pagina=${pagina}`
      await page.goto(tempoURL, { waitUntil: "domcontentloaded" })

        //   await new Promise(resolve => setTimeout(resolve, 4000)); // pra analisar 

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("h3.g-chamada__titulo a")).map(x => x.getAttribute("href"))
      })
        
      for(let i = 0; i < links.length; i++ ){
        console.log(links[i])
      }
      console.log(links.length)


      // for (let i = 0; i < links.length; i++) {
      //   let dict = await coletaDadosAgenBr(page, links[i])

      //   if(dict == null) continue;
      //   dict._id = dict.link;  // link é a chave primaria 
      //   console.log(dict)
        
      //   // try {
      //   //   await noticiasAgenBra.insertOne(dict)
      //   //   console.log(`✅ Documento inserido: ${dict.manchete?.substring(0, 50)}...`)

      //   // } catch (err) {
      //   //   if(err.code == 11000){
      //   //     console.error(`❌ noticia duplicada! ${dict.manchete.substring(0,50)}.`)
      //   //   } else {
      //   //     console.error("Erro ao inserir:", err)
      //   //   }
      //   // }
      // }
    }

  } catch (err) {
    console.error("Erro:", err)
  } finally {
    // await client.close()
    await browser.close()
  }
}

tempoScrap()