import { chromium } from 'playwright';
import * as fs from 'fs';

async function audit() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log("Going to https://www.instagram.com/accounts/login/...");
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle' });
    
    console.log("Current URL:", page.url());
    console.log("Waiting for input[name='username']...");
    
    try {
        await page.waitForSelector('input[name="username"]', { timeout: 15000 });
        console.log("Selector found.");
    } catch (e) {
        console.log("Timeout! Selector not found.");
        const html = await page.content();
        const url = page.url();
        console.log("Final URL:", url);
        
        await page.screenshot({ path: 'login_timeout.png' });
        
        fs.writeFileSync('login_timeout.html', html);
        console.log("Screenshot and HTML saved.");
    }

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

audit();
