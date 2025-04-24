const puppeteer = require('puppeteer')
const fs = require('fs')
const { stringify } = require('querystring')

async function clicaBotao(page, qtdLinksAtual) {
  let links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.home__list__tag")).map(el => el.getAttribute("href"))
  })
  while(links.length <= qtdLinksAtual) {
    let tentativas = 0
    try {
      await page.click('button.block-list-get-more-btn', {delay: 1000})
    } catch (e) {
      tentativas++
      if(tentativas > 100) {
        console.log("Não foi possível carregar novos conteúdos")
        return null
      }
    }
    links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a.home__list__tag")).map(el => el.getAttribute("href"))
    })
  }
  return links
}

async function cnnScrap() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto("https://www.cnnbrasil.com.br/politica/", { waitUntil: "domcontentloaded" })

  let links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.home__list__tag")).map(el => el.getAttribute("href"))
  })

  let linksQtd = links.length
  console.log(linksQtd)

  for(let i = 0; i < 3; i++) {
    for(let j = 0; j < links.length; j++) {
      console.log(links[j])
    }
    links = await clicaBotao(page, linksQtd)
    links = links.slice(linksQtd)
    linksQtd += links.length
  }


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

  await browser.close()
}

cnnScrap()