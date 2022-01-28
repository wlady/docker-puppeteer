#!/usr/bin/env node

const { exec } = require("child_process");

function sleep(ms) {
    ms = (ms) ? ms : 0;
    return new Promise(resolve => {setTimeout(resolve, ms);});
}

function os_func() {
    this.exec = function(cmd) {
        return new Promise( (resolve, reject) => {
           exec(cmd, (error, stdout, stderr) => {
             if (error) {
                reject(error);
                return;
             }
             resolve(stdout)
           })
        });
    }
}

process.on('uncaughtException', (error) => {
    console.error(error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
    console.error(reason, p);
    process.exit(1);
});

const puppeteer = require('puppeteer');

if (!process.argv[2]) {
    console.error('ERROR: no url arg\n');

    console.info('for example:\n');
    console.log('  docker run --shm-size 1G --rm -v /tmp:/screenshots \\');
    console.log('  wlady2001/puppeteer:latest generate \'https://www.google.com\' 1920,1280,960 200\n');
    process.exit(1);
}

var url = process.argv[2];

var now = new Date();

var dateStr = now.toISOString();

var height = 600;
var widths = [];
if (typeof process.argv[3] === 'string') {
    widths = process.argv[3].split(',').map(v => parseInt(v, 10));
}

var delay = 0;

if (typeof process.argv[4] === 'string') {
    delay = parseInt(process.argv[4], 10);
}

var prefix = 'full_screenshot';

if (typeof process.argv[5] === 'string') {
    prefix = process.argv[5];
}

var quality = 100;

if (typeof process.argv[6] === 'string') {
    quality = parseInt(process.argv[6], 10);
}


var isMobile = false;

var os = new os_func();

(async() => {
  await Promise.all(widths.map(async (width) => {

    const browser = await puppeteer.launch({
        args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();

    page.setViewport({
        width,
        height,
        isMobile
    });

    await page.goto(url, {waitUntil: 'networkidle2'});

    await sleep(delay);

    await page.screenshot({path: `/screenshots/${prefix}_${width}.png`, fullPage: true});

    browser.close();

    os.exec(`convert /screenshots/${prefix}_${width}.png /screenshots/${prefix}_${width}.jpg`).then( res => {
        if (quality < 100) {
            os.exec(`find /screenshots/ -type f -name ${prefix}_${width}.jpg -print0 | xargs -0 jpegoptim -m${quality}`);
        }
    });;
  }));
})();
