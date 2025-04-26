const puppeteer = require('puppeteer')

async function cartaCapitalScraping() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  let cartaCapitalURL = "https://www.cartacapital.com.br/politica/page/1/"
  await page.goto(cartaCapitalURL)

  let links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.l-list__item")).map(x => x.getAttribute("href"))
  })
  console.log(links)
  await browser.close()
}

cartaCapitalScraping()