const puppeteer = require('puppeteer')
const fs = require('fs')

async function uolScrap() {
  const browser = await puppeteer.launch({headless:false})
  const page = await browser.newPage()
  await page.goto("https://noticias.uol.com.br/politica/", { waitUntil: "domcontentloaded" })

  for(let i = 1; i <= 5; i++){
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        
        let links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("div.thumbnails-wrapper a")).map(el => el.getAttribute("href"))
        })
        
        // Imprime os links
        for (let i = 0; i < links.length; i++) {
            console.log(links[i])
        }
        
        await page.evaluate(() => {
            const artigosAntigos = document.querySelectorAll('.thumbnails-item');
            artigosAntigos.forEach(artigo => artigo.remove());
        });
        
        try {
            let clickResult = await page.locator('button.ver-mais').click({count: 2 ,delay: 1000})
            console.log(clickResult)
        } catch (e) {
            console.log("Não foi possível carregar novos conteúdos")
            console.log(e)
            return null
        }   
        
        // uol demora pra carregar, ent tem que ter isso
        await new Promise(resolve => setTimeout(resolve, 2222)); // pra analisar 

            // aqui

  }
    
    // await new Promise(resolve => setTimeout(resolve, 4000)); // pra analisar 
    
  await browser.close()
}

uolScrap()