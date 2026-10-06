import puppeteer from 'puppeteer-core';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // 1. Capture initial status screenshot
  await page.screenshot({ path: 'screenshots/document_statuses_initial.png', fullPage: true });
  console.log('Saved screenshots/document_statuses_initial.png');

  // 2. Click "Load Sample Pack" button
  const loadButton = await page.$('button[title*="DevFest sample"]');
  if (loadButton) {
    await loadButton.click();
    await new Promise(r => setTimeout(r, 2000));
  }

  // 3. Click "Smart Auto-Match" button
  const autoMatchBtn = await page.$('button[title*="match uploaded PDFs"]');
  if (autoMatchBtn) {
    await autoMatchBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  // 4. Capture verified document statuses screenshot
  await page.screenshot({ path: 'screenshots/document_statuses_verified.png', fullPage: true });
  console.log('Saved screenshots/document_statuses_verified.png');

  // Also save default main screenshot
  await page.screenshot({ path: 'screenshots/document_statuses.png', fullPage: true });
  console.log('Saved screenshots/document_statuses.png');

  await browser.close();
}

capture().catch(console.error);
