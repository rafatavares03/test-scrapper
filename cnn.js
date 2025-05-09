const puppeteer = require('puppeteer')
const { MongoClient } = require("mongodb")

async function coletaDadosCNN(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded"})
  return await pagina.evaluate(() => {
    const dados = {}
    let manchete = document.querySelector("h1.single-header__title")
    let lide = document.querySelector("p.single-header__excerpt")
    let dataPublicacao = document.querySelector("time.single-header__time")
    let autores = document.querySelector("a.blogger__name")
    if(autores == null) {
      autores = Array.from(document.querySelectorAll("span.author__group a")).map(x => x.textContent)
    } else {
      autores = new Array(autores.textContent)
    }
    let artigo = Array.from(document.querySelectorAll("div.single-content p")).map(x => x.textContent)
    artigo = artigo.filter(x => x.trim().length > 0) // remove parágrafos vazios

    if(manchete) dados.manchete = manchete.textContent
    else return null
    if(lide) dados.lide = lide.textContent
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
    }
    dados.autores = autores
    dados.portal = "CNN"
    dados.link = window.location.href 
    if(artigo && (artigo.length > 0)) dados.artigo = artigo

    if(dados.artigo.length > 0) dados.artigo = dados.artigo.map(x => x.replaceAll(/\\n/g, '\n'))

    return dados
  })
}

async function cnnScrap() {
  const browser = await puppeteer.launch({headless:false})
  const page = await browser.newPage()
  await page.goto("https://www.cnnbrasil.com.br/politica/", { waitUntil: "domcontentloaded" })
  const uri = "mongodb://localhost:27017" // padrão do mongo
  const client = new MongoClient(uri)
  


  try{
    await client.connect()
    const db = client.db("Noticias-Politica")
    const noticiasCNN = db.collection("CNN")

    for(let i = 1; i < 10; i++){
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        let links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("a.home__list__tag")).map(el => el.getAttribute("href"))
        })

        await page.evaluate(() => {
          const artigosAntigos = document.querySelectorAll('.home__list__item');
          artigosAntigos.forEach(artigo => artigo.remove());
        });

        try {
          let clickResult = await page.locator('button.block-list-get-more-btn').click({count: 2 ,delay: 1000})
          console.log(clickResult)
        } catch (e) {
            console.log("Não foi possível carregar novos conteúdos")
            console.log(e)
            return null
        }   
        
        let scrapingPage = await browser.newPage()
        await scrapingPage.bringToFront()
        for (let i = 0; i < links.length; i++) {
          let dict = await coletaDadosCNN(scrapingPage, links[i])
  
          if(dict == null) continue;
          dict._id = dict.link // link é a chave primaria 
          // console.log(dict)
          // console.log("\n\n")
          
          try {
            await noticiasCNN.insertOne(dict)
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

cnnScrap()









// // Coleta os links das notícias
// for(let i = 0; i <= 1000; i++) { //tem que pegar 500, na teoria

//   // await page.evaluate(() => {
//   //   window.scrollTo(0, document.body.scrollHeight);
//   // });

//   await page.evaluate((i) => {
//     const btn = document.querySelector('.block-list-get-more-btn');
//     if (btn) {
//       // btn.setAttribute('data-perpage', '1000');  // deixa por enquanto tavares
//       btn.setAttribute('data-page-block-list', `${i}`);
//       btn.click();
//     }
//   }, i); 
	
//   await page.evaluate(() => {
//     window.scrollTo(0, document.body.scrollHeight);
//     });

//   await new Promise(resolve => setTimeout(resolve, 10)); // pra desencargo  
//   } 


// console.log(links.length)
// // // Imprime os links
// // for (let i = 0; i < links.length; i++) {
// //   console.log(links[i])
// // }