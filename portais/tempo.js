const puppeteer = require('puppeteer')
const {inserirNoticia} = require('../banco_de_dados/bancoInserir')


async function coletaDadosTempo(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded" })
  return await pagina.evaluate((link) => {
    const dados = {
      portal: "O Tempo",
      _id: link,
    }

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
    } else {
      return null
    }

    // Autores
    let autoresTag = document.querySelector('.cmp__author-name span')
    if (autoresTag) {
      let autores = autoresTag.textContent.trim(); 
      let arra = autores.split(/[,\/]/).map(a => a.trim()).filter(a => a.length > 0);
      dados.autores = arra
    }
    
    // // Artigo
    // let texto = "";
    // let pontoDePartida = document.querySelector('section.read-controller');
    // let elementos = pontoDePartida.parentElement.querySelectorAll("#bodyArticle p, #bodyArticle.h2"); // deixa .h2 que funciona. o motivo n sei, mas funciona. n mexe, pelo amor
    // for (let elemento of elementos) {
    //   texto += elemento.textContent.trim() + "\n"
    // }
    // dados.artigo = texto.trim();
    // if(dados.artigo.length > 0) dados.artigo = dados.artigo.replaceAll(/\\n/g, '\n')

    return dados
  }, link)
}


async function scrapTempo(URL) {
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage()

  try {

    for (let pagina = 1; pagina <= 1; pagina++) {
      let tempoURL = `${URL}${pagina}`
      await page.goto(tempoURL, { waitUntil: "domcontentloaded" })

        //   await new Promise(resolve => setTimeout(resolve, 4000)); // pra analisar 

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a.list__link")).map(x => x.getAttribute("href"))
      })
        
      let raiz = "https://www.otempo.com.br"
      
      for(let i = 0; i < links.length; i++ ){
        links[i] = raiz + links[i]                  // TEM QUE TER ESSA LINHA PRA JUNTAR. sem querer ser grossoo
      }


      let scrapingPage = await browser.newPage()
      await scrapingPage.bringToFront()

      let dict = []
      for (let i = 0; i < links.length; i++) {
        let temp = await coletaDadosTempo(scrapingPage, links[i])

        if(temp == null) continue;
        temp.tema = tipo
        
        dict.push(temp)
        // console.log(dict)
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

async function scrapingTempo(){
  await scrapTempo("https://www.otempo.com.br/politica/page/", "Política")
}

module.exports = {scrapingTempo}