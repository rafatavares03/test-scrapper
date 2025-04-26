const puppeteer = require('puppeteer')


let linkDoMenino = "https://www.terra.com.br/noticias/brasil/politica/"

async function babado(){
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto("https://www.terra.com.br/noticias/brasil/politica/", { waitUntil: "domcontentloaded" })
    
    
    await page.evaluate((i) => {
      const btn = document.querySelector('.block-list-get-more-btn');
      if (btn) {
        // btn.setAttribute('data-perpage', '1000');  // deixa por enquanto tavares
        btn.setAttribute('data-page-block-list', `${i}`);
        btn.click();
      }
    }, i); 
      
    
    // await page.evaluate(() => {
    //     window.scrollTo(0, document.body.scrollHeight);
    //     });
    
    console.log("babado")
    await new Promise(resolve => setTimeout(resolve, 1000)); // pra desencargo  
    
    
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".card-news__text--title")).map(x => x.getAttribute("href"))
    })
    
    console.log(links.length)
    // // Imprime os links
    // for (let i = 0; i < links.length; i++) {
    //   console.log(links[i])
    // }
    
    await browser.close()

}

babado()

