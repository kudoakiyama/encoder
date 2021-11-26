const puppeteer = require('puppeteer');
const { parseFile } = require('@fast-csv/parse');

const codes = require('./codes.json');
const config = require('./config.json');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 30
    });
    const page = await browser.newPage();
    await page.goto(config.site + 'login');
    page.on('dialog', async (dialog) => {
        await dialog.dismiss();
    });
    const loggedIn = await page.waitForRequest(
        config.site + 'home',
        { timeout: 0 }
    );
    if (loggedIn) {
        await Promise.all([
            page.waitForNavigation(),
            page.goto(config.site + 'voters')
        ]);
        const table = [];
        parseFile(process.argv[2], { headers: true })
            .on('data', row => table.push(row))
            .on('end', async () => {
                for (const row of table) {
                    await page.click('#add-new');
                    await page.waitForSelector('#modal1', { timeout: 0 });
                    await page.select('#address_brgy_code', codes[row.Barangay]);
                    await page.type('#address', row.Address);
                    await page.type('#fullname', row.FULLNAME);
                    await page.type('#precinct_no', row.Precinct);
                    await page.type('#date_of_birth', '01/01/0001');
                    await page.select('#sex', row.Sex);
                    await page.click('#action_button')
                        .then(async () => {
                            await page.keyboard.press('Enter');
                        });
                    await page.waitForTimeout(1000);
                    await page.reload();
                }
            });
    }
})();