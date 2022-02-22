/* 

index.js - This file is where the scrape product urls function is called and the product data is processed and outputed as JSON.

Important Functions:

main() - This function is where the scraping and data processing are executed.

get[Datapoint] - Each of these functions returns [Datapoint] from the .ajax site gotten from the product url scrape.

*/

const request = require('request-promise');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
fs = require('fs');

const so = require('./site_objects');
const url_scraper = require('./product_url_scrapper');

const result = [];
const product_urls = []

async function main() {

    for (var i = 0; i < so.SITE_OBJECTS.length; i++) {
        product_urls.push(await url_scraper.scrapeProductUrls(so.SITE_OBJECTS[i]))
    }

    for(var i = 0; i < product_urls.length; i++) {
        for(var j = 0; j < product_urls[i].length; j++) {

            var data = {}
            let response = await fetch(product_urls[i][j])

            let json = await response.json();

            data.id = await getId(json);
            data.title = await getTitle(json);
            data.business_name = await scrapeBusinessName(json);
            data.url = await getUrl(json);
            data.description = await getDescription(json);
            data.vendor = await getVendor(json);
            data.price = await getPrice(json);
            data.available = await getInStock(json);
            data.variants = await getVariants(json);
            data.images = await getImages(json);
            data.tags = await getTags(json);
            data.body_html = await scrapeBodyHtml(json);
            
            await result.push(data);
        }
    }

    await console.log(result);
    await console.log("Number of items scraped: " + result.length);

    //Write to output file
    fs.writeFileSync('./outputJson.json', JSON.stringify(result));
    
}

/* API FUNCTIONS */

async function getTitle(productJson) {
    return productJson['title'];
}

async function getId(productJson) {
    return productJson['id'];
}

async function getVendor(productJson) {
    return productJson['brand']['title'];
}

async function getVariants(productJson) {
    let cleanVariants = [];

    for(let i = 0; i < productJson['variants'].length; i++) {
        cleanVariants[i]['id'] = productJson[i]['id'];
    }

    return cleanVariants;
}

async function getTags(productJson) {
    var title = await getTitle(productJson);
    var tags = [];

    tags = title.split(' ');

    return tags;
}

async function getImages(productJson) {
    return productJson['images']
}

async function getPrice(productJson) {
    let priceString = productJson['price']['price_money_without_currency'];
    priceString = priceString.replace('.', '');
    
    return priceString;
}

async function getDescription(productJson) {
    return productJson['description']
}

async function getInStock(productJson) {
    return productJson['stock']['available']
}

async function getUrl(productJson) {
    return productJson['url']
}

/* UTILITY FUNCTIONS */

async function scrapeBusinessName(productJson) {
    const url = await getUrl(productJson);
    startPos = url.indexOf('.');
    endPos = url.indexOf('.', startPos + 1);

    return url.substring(startPos + 1, endPos);

}

async function scrapeBodyHtml(productJson) {
    const url = await getUrl(productJson);
    const html = await request.get(url);
    const $ = await cheerio.load(html);
    
    let bodyHtml = $("body").html();

    return bodyHtml;
}

//Stops the program for a specified number of seconds
async function sleep(miliseconds)
{
    return new Promise(resolve => setTimeout(resolve,miliseconds));
}

main();