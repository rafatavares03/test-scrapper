const puppeteer = require('puppeteer')
const fs = require('fs')
const { stringify } = require('querystring')

async function cnnScrap() {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto("https://www.cnnbrasil.com.br/politica/", { waitUntil: "domcontentloaded" })

  let clickCount = 0;
  const maxClicks = 30;
  /*
  while (clickCount < maxClicks) {
    try {
      //await autoScroll(page);
      //await page.waitForSelector('.block-list-get-more-btn', { timeout: 3000 });
      //await page.click('.block-list-get-more-btn');
      //await page.waitForTimeout(1000);
      botao.click()
      clickCount++;
    } catch (e) {
      console.log("achou porra nenhuma")
      console.log("Nenhum botão 'carregar mais' encontrado. Fim do scroll.");
      break;
    }
  }
    */

  // Coleta os links das notícias
  for(let i = 0; i <= 1000; i++) { //tem que pegar 500, na teoria

    // await page.evaluate(() => {
    //   window.scrollTo(0, document.body.scrollHeight);
    // });

    await page.evaluate((i) => {
      const btn = document.querySelector('.block-list-get-more-btn');
      if (btn) {
        btn.setAttribute('data-perpage', '100');
        btn.setAttribute('data-page-block-list', `${i}`);
        btn.click();
      }
    }, i); 
    

    
    // await page.waitForSelector('.block-list-get-more-btn', { visible: true });
    
    // await page.evaluate(() => {
      //   document.querySelector('.block-list-get-more-btn')?.click();
      // });
      // console.log(`contador : ${i}`)
    } 
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      });
    await new Promise(resolve => setTimeout(resolve, 1000)); // pra desencargo  

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.home__list__tag")).map(el => el.getAttribute("href"))
  })

  console.log(links.length)
  // // Imprime os links
  // for (let i = 0; i < links.length; i++) {
  //   console.log(links[i])
  // }

  await browser.close()
}


async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0
            const distance = 100
        const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight
            window.scrollBy(0, distance)
          totalHeight += distance
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer)
            resolve()
        }
    }, 100)
      })
    })
}

cnnScrap()