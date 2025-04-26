const puppeteer = require('puppeteer')
const fs = require('fs')
const { stringify } = require('querystring')

async function coletaDadosCNN(pagina, link) {
  await pagina.goto(link, { waitUntil: "domcontentloaded"})
  return await pagina.evaluate((link) => {
    const dados = {}
    let manchete = document.querySelector("h1.single-header__title")
    let lide = document.querySelector("p.single-header__excerpt")
    let dataPublicacao = document.querySelector("time.single-header__time")
    let autores = Array.from(document.querySelectorAll("span.author__group a")).map(x => x.textContent)
    let artigo = Array.from(document.querySelectorAll("div.single-content p")).map(x => x.textContent)
    artigo = artigo.filter(x => x.trim().length > 0) // remove parágrafos vazios

    if(manchete) dados.manchete = manchete.textContent
    else return null
    if(lide) dados.lide = lide.textContent
    if(dataPublicacao) {
      dataTexto = dataPublicacao.textContent
      if(dataTexto.indexOf("|") >= 0) dataTexto = dataTexto.slice(0, dataTexto.indexOf("|"))
      dataTexto = dataTexto.split("às")
      let dia = dataTexto[0].split("/")
      let hora = dataTexto[1]
      dia.reverse()
      dia = dia.join("-")
      dataFormatada = `${dia}T${hora}-03:00`
      dataFormatada = dataFormatada.replace(/\s/g, '')
      dados.dataPublicacao = dataFormatada
    }
    dados.autores = autores
    dados.portal = "CNN"
    dados.link = window.location.href 
    if(artigo && (artigo.length > 0)) dados.artigo = artigo

    return dados
  })
}

async function clicaBotao(page, qtdLinksAtual) {
  let links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.home__list__tag")).map(el => el.getAttribute("href"))
  })
  try {
    let clickResult = await page.locator('button.block-list-get-more-btn').click({count: 2 ,delay: 1000})
    console.log(clickResult)
  } catch (e) {
      console.log("Não foi possível carregar novos conteúdos")
      console.log(e)
      return null
  }
  while(links.length <= qtdLinksAtual) {
    console.log(links.length)
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
  let scrapingPage = await browser.newPage()
  for(let i = 0; i < 1; i++) {
    for(let j = 0; j < links.length; j++) {
      let dict = await coletaDadosCNN(scrapingPage, links[j])
      console.log(dict)
    }
    await page.bringToFront()
    //links = await clicaBotao(page, linksQtd)
    // if(links != null) {
    //   links = links.slice(linksQtd)
    //   linksQtd += links.length
    // }
  }
  await scrapingPage.close()


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