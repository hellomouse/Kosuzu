/* Utilities for downloading stuff */

const https = require('https');
const fs = require('fs');

const puppeteer = require('puppeteer-extra');

// Add stealth plugin and use defaults (all evasion techniques)
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(stealthPlugin());

module.exports = {
    /**
     * Download a file from a url
     * @param {string} url URL to file to download
     * @param {string} dest Local file destination w/ name
     */
    download: (url, dest) => {
        let file = fs.createWriteStream(dest);

        https.get(url, res => {
            res.pipe(file);
            file.on('finish', file.close);
        }).on('error', err => {
            fs.unlink(dest); // Delete file on failure
        });
    },

    /**
     * Read data from a JSON API end point
     * @param {string} apiendpoint URL to API end point
     * @param {Function} callback Callback, json data will be passed to it
     */
    getFromAPI: async (apiendpoint, callback) => {
        await https.get(apiendpoint, res => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                let jsonData = JSON.parse(data);
                callback(jsonData);
            });

            res.on('error', err => {
                // TODO: replace w/ logger
                // callback should also be called to indicate an error occured
                console.log('Error: ' + err.message);
            });
        });
    },


    /**
     * Evaluate a script on a page and get a callback
     * Example usage:
     * > pageEval('https://mywebsite.xyz/url', () => document.getElementById(...).innerText, text => console.log(text), {})
     *
     * @param {string} url Url to page to open
     * @param {Function} pageScript Function to evaluate on the page, returned value will be returned
     * @param {object} settings Optional puppeteer settings. The following options can be set:
     *                          headless: {Boolean} default=false, launch browser in headless mode?
     *                          delay: {Integer}, default=0, extra delay in ms before running pagescript
     *                          autoscroll: {Boolean}, default=false, before running page script keep scrolling
     *                                  down until it can no longer? For pages that load images on scroll
     *                          autoscrollTimeout: {Integer}, default=-1, timeout for auto-scrolling, set t
     *                                  be negative for no limit (WARNING: do not set to -1 for infinite scrolling page)
     *                          autoscrollDelay: {Integer}, default=100, ms delay betwen scrolls, don't set too high
     *                                  or some autoscrolling pages may not be able to keep up
     *                          autoscrollScrollBy: {Integer}, default=100, pixels to scroll by each time,
     *                                  don't set too high or program may incorrectly detect its finished scrolling
     *                          blockImages: {Boolean}, default=true, block images from loading for speed
     *                          blockCSS: {Boolean}, default=true, block CSS from loading for speed
     * @return {*} Result of the pageScript
     */
    pageEval: async (url, pageScript, settings = {}) => {
        settings.delay = settings.delay || 0;
        settings.autoscrollTimeout = settings.autoscrollTimeout || -1;
        settings.autoscrollDelay = settings.autoscrollDelay || 100;
        settings.autoscrollBy = settings.autoscrollBy || 100;

        if (settings.blockImages === undefined)
            settings.blockImages = true;
        if (settings.blockCSS === undefined)
            settings.blockCSS = true;

        const browser = await puppeteer.launch({ headless: settings.headless || false });
        const page = await browser.newPage();

        if (settings.blockImages || settings.blockCSS) {
            await page.setRequestInterception(true);
            page.on('request', req => {
                if ((settings.blockCSS && (req.resourceType() === 'stylesheet' || req.resourceType() === 'font')) || (settings.blockImages && req.resourceType() === 'image'))
                    req.abort();
                else
                    req.continue();
            });
        }

        await page.goto(url, {
            waitUntil: 'load',
            timeout: 0
        });
        await page.waitForTimeout(settings.delay);

        // Autoscroll to bottom
        if (settings.autoscroll)
            await page.evaluate(async () => {
                await new Promise(resolve => {
                    const start = new Date();
                    let height = 0;

                    let timer = setInterval(() => {
                        window.scrollBy(0, settings.autoscrollBy);
                        height += settings.autoscrollBy;

                        if (height >= document.body.scrollHeight ||
                            ( // Scroll timeout, not tested on daylight savings
                                settings.autoscrollTimeout > 0 &&
                                Date.now() - start.getTime() > settings.autoscrollTimeout)) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, settings.autoscrollDelay);
                });
            }, { settings });

        // Evaluate scraping script
        const data = await page.evaluate(pageScript);
        await browser.close();
        return data;
    }
};
