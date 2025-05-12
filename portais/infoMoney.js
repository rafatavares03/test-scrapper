const puppeteer = require('puppeteer')
const fs = require('fs')

async function coletaInfoMoney(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded"})
  return await pagina.evaluate((link) => {
    const dados = {}
    dados.portal = "InfoMoney"
    dados.link = link

    // Manchete
    let manchete = document.querySelector("body > main > div.max-w-5xl.my-4.mx-auto.space-y-4.px-6.xl\:px-0 > h1")
    if(manchete) dados.manchete = manchete.textContent
    else return null

    // Lide
    let lide = document.querySelector("body > main > div.max-w-5xl.my-4.mx-auto.space-y-4.px-6.xl\:px-0 > div")
    if(lide) dados.lide = lide.textContent

    // Data
    let dataPublicacao = document.querySelector("body > main > div.lg\:flex.justify-between.items-center.max-w-screen-lg.mx-auto.pb-4.mb-6.px-6.xl\:px-0.border-0.md\:border-b > div.mb-4.lg\:mb-0 > div > div > p.im-mob-core-description.lg\:im-web-core-description.text-wl-neutral-600 > time:nth-child(1)").getAttribute("datatime")
    if(dataPublicacao) {
        dados.data = dataPublicacao
    }

    // Autores
    let autores = document.querySelector("body > main > div.lg\:flex.justify-between.items-center.max-w-screen-lg.mx-auto.pb-4.mb-6.px-6.xl\:px-0.border-0.md\:border-b > div.mb-4.lg\:mb-0 > div > div > p.flex.flex-wrap.items-center > a")
    if(autores != null) {
      autores = new Array(autores.textContent)
    }
    dados.autores = autores


    return dados
  }, link)
}

async function scrapInfoMoney(URL, tipo) {
  const browser = await puppeteer.launch({headless:true})
  const page = await browser.newPage()
  await page.goto(`${URL}`, { waitUntil: "domcontentloaded" })

  const arquivo = fs.createWriteStream(`./portais_jsons/infoMoney-${tipo}.jsonl`, { flags: 'a' })

  try{

    for(let i = 1; i <= 1; i++){
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        let links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll(".size-28 a")).map(el => el.getAttribute("href"))
        })

        await page.evaluate(() => {
          const artigosAntigos = document.querySelectorAll("body > main > div > section:nth-child(8) > div > div > div:nth-child(3)");
          artigosAntigos.forEach(artigo => artigo.remove());
        });

        try {
          let clickResult = await page.locator('body > main > div > section:nth-child(9) > div > div.flex.justify-center.my-8 > button').click({count: 2 ,delay: 1000})
          console.log(clickResult)
        } catch (e) {
            console.log("Não foi possível carregar novos conteúdos")
            console.log(e)
            return null
        }   

        for(let i = 0; i < links.length; i++){
            console.log(links[i])
        }
        
        let scrapingPage = await browser.newPage()
        await scrapingPage.bringToFront()
        for (let i = 0; i < links.length; i++) {
          let dict = await coletaInfoMoney(scrapingPage, links[i])
  
          if(dict == null) continue;
          dict._id = dict.link // link é a chave primaria 
          console.log(dict)
          // console.log("\n\n")

          arquivo.write(JSON.stringify(dict) + '\n')
          
        }
        await scrapingPage.close()
        await page.bringToFront()
    }
  } catch (err) {
    console.error("Erro:", err)
  } finally {
    await browser.close()
  }	
}

async function scrapingInfoMoney(){
  await scrapInfoMoney("https://www.infomoney.com.br/economia/")
}

module.exports = {scrapingInfoMoney}








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