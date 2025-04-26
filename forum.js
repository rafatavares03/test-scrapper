const puppeteer = require('puppeteer')



async function cnnScrap() {
  const browser = await puppeteer.launch({headless:false})
  const page = await browser.newPage()
  await page.goto("https://revistaforum.com.br/politica/", { waitUntil: "domcontentloaded" })

  for(let i = 1; i < 10; i++){
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      let links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("h2.titulo a")).map(el => el.getAttribute("href"))
      })

      // Imprime os links
      for (let i = 0; i < links.length; i++) {
        console.log(links[i])
      }

      await page.evaluate(() => {
        const artigosAntigos = document.querySelectorAll('.caja');
        artigosAntigos.forEach(artigo => artigo.remove());
      });

      try {
        let clickResult = await page.locator('div.btn').click({count: 2 ,delay: 1000})
        console.log(clickResult)
      } catch (e) {
          console.log("Não foi possível carregar novos conteúdos")
          console.log(e)
          return null
      }   
            

            // aqui

  }
    
    // await new Promise(resolve => setTimeout(resolve, 10000)); // pra analisar 
    
  await browser.close()
}

cnnScrap()
