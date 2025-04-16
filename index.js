const puppeteer = require('puppeteer')
const fs = require('fs')

async function autoScroll(page) {
    let previousHeight = await page.evaluate('document.body.scrollHeight');
    let tentativas = 0;
  
    while (tentativas < 10) { // Limita a 10 tentativas para evitar loop infinito
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await new Promise(resolve => setTimeout(resolve, 2000))

  
      let newHeight = await page.evaluate('document.body.scrollHeight');
  
      if (newHeight === previousHeight) {
        tentativas++;
      } else {
        tentativas = 0;
        previousHeight = newHeight;
      }
    }
  }
  
async function start() {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    for(let pagina = 1; pagina <= 10; pagina++) {
      let g1URL = `https://g1.globo.com/politica/index/feed/pagina-${pagina}.ghtml`
      await page.goto(g1URL)

      const link = await page.evaluate(() => {
          return Array.from(document.querySelectorAll(".feed-post-link")).map(x => x.getAttribute("href"))
      })
      for(let i = 0; i < link.length; i++) {
          await page.goto(link[i])
          let dict = await page.evaluate(() => {
              const dict = {}
              let manchete = document.querySelector("h1.content-head__title")
              let lide = document.querySelector("h2.content-head__subtitle")
              let dataPublicacao = document.querySelector('time[itemprop="dateModified"]')
              let artigo = Array.from(document.querySelectorAll("article[itemprop='articleBody'] .content-text")).map(x => x.textContent)
              if(manchete != null) dict.manchete = manchete.textContent
              if(lide != null) dict.lide = lide.textContent
              if(dataPublicacao != null) dict.dataPublicacao = dataPublicacao.getAttribute("datetime")
              if(artigo != null && artigo.length != 0) dict.artigo = artigo
              return dict
          })
          dict.portal = "g1"
          dict.link = link[i]
          const dictString = JSON.stringify(dict, null, '\t')
          fs.writeFile(`jsons/noticia${(pagina*link.length)+i+1}.json`, dictString, function (err, result){
              if(err) {
                  console.log(err)
              } else {
                  console.log("Arquivo criado!")
              }
          })
      }
    }

    //await autoScroll(page);

    await browser.close()
}

start()