const puppeteer = require('puppeteer')
const fs = require('fs')

async function cnnScrap() {
  const browser = await puppeteer.launch({ headless: true })
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
  for(let i = 1; i <= 3; i++) {
    await page
      .locator('.block-list-get-more-btn')
      .click();
  } 

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.home__list__tag")).map(el => el.getAttribute("href"))
  })
  console.log(links.length)
  // Imprime os links
  for (let i = 0; i < links.length; i++) {
    console.log(links[i])
  }

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