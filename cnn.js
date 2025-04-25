const puppeteer = require('puppeteer')
const fs = require('fs')
const { stringify } = require('querystring')

async function coletaDadosCNN(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded"})
  return await pagina.evaluate((link) => {
    const dados = {}
    let manchete = document.querySelector("h1.single-header__title")
    let lide = document.querySelector("p.single-header__excerpt")
    let artigo = Array.from(document.querySelectorAll("div.single-content p")).map((x) => x.textContent)

    if(manchete) dados.manchete = manchete.textContent
    else return null
    if(lide) dados.lide = lide.textContent
    dados.portal = "CNN"
    dados.link = window.location.href 
    if(artigo) dados.artigo = artigo

    return dados
  })
}

async function clicaBotao(page, qtdLinksAtual) {
  let links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.home__list__tag")).map(el => el.getAttribute("href"))
  })
  while(links.length <= qtdLinksAtual) {
    try {
      await page.click('button.block-list-get-more-btn', {delay: 1000})
    } catch (e) {
        console.log("Não foi possível carregar novos conteúdos")
        return null
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

  for(let i = 0; i < 1; i++) {
    for(let j = 0; j < links.length; j++) {
      let dict = await coletaDadosCNN(page, links[j])
      console.log(dict)
    }
    links = await clicaBotao(page, linksQtd)
    if(links != null) {
      links = links.slice(linksQtd)
      linksQtd += links.length
    }
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