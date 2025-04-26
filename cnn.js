const puppeteer = require('puppeteer')
const fs = require('fs')
const { stringify } = require('querystring')

async function cnnScrap() {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto("https://www.cnnbrasil.com.br/politica/", { waitUntil: "domcontentloaded" })

  // Coleta os links das notícias
  for(let i = 0; i <= 500; i++) { //tem que pegar 500, na teoria

    // await page.evaluate(() => {
    //   window.scrollTo(0, document.body.scrollHeight);
    // });

    await page.evaluate((i) => {
      const btn = document.querySelector('.block-list-get-more-btn');
      if (btn) {
        btn.setAttribute('data-perpage', '50');  // deixa por enquanto tavares
        btn.setAttribute('data-page-block-list', `${i}`);
        btn.setAttribute('data-page', `${i}`);
        btn.click();
      }
    }, i); 
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      });

    } 
    console.log("5segundinhos")
    await new Promise(resolve => setTimeout(resolve, 5000)); // pra desencargo  

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

cnnScrap()