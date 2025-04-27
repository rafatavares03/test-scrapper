const puppeteer = require('puppeteer')
const { MongoClient } = require("mongodb")

async function coletaDadosTempo(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {
      portal: "O Tempo",
      link: link,
      manchete: null,
      lide: null,
      data: null,
      autores: null,
      artigo: ""
    };

    // Manchete
    let manchete = document.querySelector("h1.cmp__title-title")
    if(manchete) dados.manchete = manchete.textContent.trim()
    else return null

    // Lide  
    let lide = document.querySelector("h2.cmp__title-bigode")
    if(lide) dados.lide = lide.textContent.trim()

    // Data
    let dataPublicacao = document.querySelector('.cmp__author-publication span')
    if(dataPublicacao){
      let meses = {
        janeiro: '01', fevereiro: '02', março: '03', abril: '04', maio: '05', junho: '06', julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
      };
      let [dataNova, horaNova] = dataPublicacao.textContent.split('|').map(p => p.trim());
      let data2 = dataNova.split(' '); 
    
      let dia = data2[0];
      let mesNome = data2[2];
      let ano = data2[4];

      let mesNumero = meses[mesNome.toLowerCase()];

      let dataFormatada = `${ano}-${mesNumero}-${dia.padStart(2, '0')}T${horaNova}:00`; 
      dados.data = new Date(dataFormatada).toISOString()
    } 

    // Autores
    let autoresTag = document.querySelector('.cmp__author-name span')
    if (autoresTag) {
      let autores = autoresTag.textContent.trim(); 
      let arra = autores.split(/[,\/]/).map(a => a.trim()).filter(a => a.length > 0);
      dados.autores = arra
    }
    
    dados.portal = "tempo"
    dados.link = link

      let texto = "";
      let pontoDePartida = document.querySelector('section.read-controller');
      let elementos = pontoDePartida.parentElement.querySelectorAll("#bodyArticle p, #bodyArticle.h2"); // deixa .h2 que funciona. o motivo n sei, mas funciona. n mexe, pelo amor
      for (let elemento of elementos) {
        texto += elemento.textContent.trim() + "\n"
      }
      dados.artigo = texto.trim();

    return dados
  }, link)
}


async function tempoScrap() {
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage()
  const uri = "mongodb://localhost:27017" // padrão do mongo
//   const client = new MongoClient(uri)

  try {
    // await client.connect()
    // const db = client.db("Noticias-Politica")
    // const noticiasAgenBra = db.collection("O_Tempo")

    for (let pagina = 1; pagina <= 1; pagina++) {
      let tempoURL = `https://www.otempo.com.br/politica/page/${pagina}`
      await page.goto(tempoURL, { waitUntil: "domcontentloaded" })

        //   await new Promise(resolve => setTimeout(resolve, 4000)); // pra analisar 

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a.list__link")).map(x => x.getAttribute("href"))
      })
        
      let raiz = "https://www.otempo.com.br"
      
      for(let i = 0; i < links.length; i++ ){
        links[i] = raiz + links[i]                  // TEM QUE TER ESSA LINHA PRA JUNTAR. sem querer ser grossoo
      }

      for (let i = 0; i < links.length; i++) {
        let dict = await coletaDadosTempo(page, links[i])

        if(dict == null) continue;
        dict._id = dict.link;  // link é a chave primaria 
        console.log(dict)
        console.log("\n\n")
        
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
    // await client.close()
    await browser.close()
  }
}

tempoScrap()