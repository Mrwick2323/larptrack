const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const [inputString, upperConstraintStr, trackPath] = process.argv.slice(2);
const upperConstraint = parseFloat(upperConstraintStr);

if (!inputString || isNaN(upperConstraint) || !trackPath) {
    console.log("Usage: node simulate.js <inputString> <upperConstraint> <trackPath>");
    process.exit(1);
}

if (!fs.existsSync(trackPath)) {
    console.log(`Error: Track file not found at ${trackPath}`);
    process.exit(1);
}

const trackContent = fs.readFileSync(trackPath, 'utf8');

// 1. Simple Static File Server
const server = http.createServer((req, res) => {
    let url = req.url.split('?')[0];
    if (url === '/') url = '/index.html';
    
    let filePath = path.join(process.cwd(), url);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath);
        
        // Patch bundle.js on the fly
        if (url === '/dist/bundle.js') {
            let bundleStr = content.toString();
            
            // Inject exposure logic
            const injection = `
                window._POLYTRACK_INTERNAL = { 
                    Au, Fu, bc, If, xh, Fl, zg, kg, Jm, 
                    trackWorld: u, 
                    materials: c, 
                    resourceLoader: e, 
                    monitor: s, 
                    audio: a, 
                    storage: o, 
                    ghostStorage: l, 
                    mountainGen: h,
                    recordManager: d
                };
            `;
                if (bundleStr.includes('bc.initResources(e);')) {
                    bundleStr = bundleStr.replace('bc.initResources(e);', `bc.initResources(e); ${injection}`);
                    console.error("[SERVER] Patched bundle.js");
                }
            content = Buffer.from(bundleStr);
        }
        
        if (url.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm');
        if (url.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        
        res.end(content);
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    const url = `http://127.0.0.1:${port}/`;

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.evaluateOnNewDocument((input, upper, track) => {
            window.__HEADLESS_INPUT = input;
            window.__HEADLESS_UPPER = upper;
            window.__HEADLESS_TRACK_CONTENT = track;
        }, inputString, upperConstraint, trackContent);

        page.on('console', msg => {
            console.error(`[BROWSER] ${msg.text()}`);
        });

        await page.goto(url);

        await page.waitForFunction(() => window._POLYTRACK_INTERNAL !== undefined, { timeout: 30000 });

        const logic = fs.readFileSync(path.join(process.cwd(), 'dist', 'headless_logic.js'), 'utf8');
        await page.evaluate(logic);

        await page.waitForFunction(() => window.__finishTime !== undefined, { timeout: (upperConstraint + 60) * 1000 });
        const result = await page.evaluate(() => window.__finishTime);

        process.stdout.write(result.toString() + "\n");

        await browser.close();
        server.close();
        process.exit(0);
    } catch (err) {
        console.error(`[SIM] FATAL ERROR: ${err.message}`);
        console.log("-1");
        process.exit(1);
    }
});
