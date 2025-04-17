const puppeteer = require('puppeteer')
const fs = require('fs')

async function uolScrap() {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto("https://noticias.uol.com.br/politica/")
    const link = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".thumbnails-wrapper a")).map(x => x.getAttribute("href"))
    })
    for(let i = 0; i < link.length; i++) {
        console.log(link[i])
    }
    browser.close()
}

uolScrap()