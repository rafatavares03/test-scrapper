const puppeteer = require('puppeteer')
const { MongoClient } = require("mongodb")

async function coletaDadosTempo(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {}
    let manchete = document.querySelector("h1.cmp__title-title")
    let lide = document.querySelector("h2.cmp__title-bigode")
    let dataPublicacao = document.querySelector('.cmp__author-publication span')
    let artigo = Array.from(document.querySelectorAll("section.read-controller")).map(x => x.textContent.trim())
    let autoresTag = document.querySelector('.cmp__author-name span')

    if(manchete) dados.manchete = manchete.textContent.trim()
    else return null
    if(lide) dados.lide = lide.textContent.trim()

    if(dataPublicacao){

      const meses = {
        janeiro: '01', fevereiro: '02', março: '03', abril: '04', maio: '05', junho: '06', julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
      };
      const [dataNova, horaNova] = dataPublicacao.textContent.split('|').map(p => p.trim());
      const data2 = dataNova.split(' '); 
    
      const dia = data2[0];
      const mesNome = data2[2];
      const ano = data2[4];

      const mesNumero = meses[mesNome.toLowerCase()];

      const dataFormatada = `${ano}-${mesNumero}-${dia.padStart(2, '0')}T${horaNova}:00`; 
      dados.data = new Date(dataFormatada).toISOString()
    } 
    
    if (autoresTag) {
      let autores = autoresTag.textContent.trim(); 
      autores = autores.replace("Por", '');  
      
      if (autores.indexOf(" —") >= 0) {
        autores = autores.slice(0, autores.indexOf(" —")); 
      }
      autores = autores.split(','); 
    
      if (autores[autores.length - 1].indexOf(" e ") >= 0) {
        let dupla = autores.pop(); 
        dupla = dupla.split(" e "); 
        for (let i = 0; i < dupla.length; i++) {
          autores.push(dupla[i].trim()); 
        }
      }
      
      if (autores.length === 1) {
        dados.autores = autores[0];  
      } else {
        dados.autores = autores.map(x => x.trim()); 
      }
    }
    

    dados.portal = "tempo"
    dados.link = link

      let texto = "";
  
      // Selecione o ponto de partida, por exemplo, um elemento com uma classe específica
      let pontoDePartida = document.querySelector('section.read-controller');

      // Pegue todos os elementos depois do ponto de partida
      let elementos = pontoDePartida.parentElement.querySelectorAll("#bodyArticle p, #bodyArticle.h2"); // Pega <p> e <h2> após o ponto de partida
  
      // Itere sobre os elementos
      for (let elemento of elementos) {
        // Verifique se encontramos o elemento com a classe que deve parar
        if (elemento.classList.contains('list__container')) {
          break; // Interrompe o loop quando a classe for encontrada
        }
  
        // Adiciona o texto dos parágrafos e cabeçalhos ao resultado
        texto += elemento.textContent.trim() + "\n"
      }
  
      // Armazena o artigo coletado
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

      for (let i = 0; i < 1 /*links.length*/; i++) {
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