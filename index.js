const puppeteer = require('puppeteer')
const fs = require('fs')
const g1URL = "https://g1.globo.com/politica/"

async function start() {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
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
            if(manchete != null) dict.manchete = manchete.textContent
            if(lide != null) dict.lide = lide.textContent
            if(dataPublicacao != null) dict.dataPublicacao = dataPublicacao.getAttribute("datetime")

            return dict
        })
        const dictString = JSON.stringify(dict, null, '\t')
        fs.writeFile(`jsons/noticia${i+1}.json`, dictString, function (err, result){
            if(err) {
                console.log(err)
            } else {
                console.log("Arquivo criado!")
            }
        })
    }
    await browser.close()
}

start()