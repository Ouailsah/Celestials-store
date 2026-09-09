import { defineConfig, devices } from '@playwright/test';
const port = process.env.PLAYWRIGHT_PORT || '3002';
export default defineConfig({testDir:'./tests/e2e',fullyParallel:false,workers:1,reporter:'list',use:{baseURL:`http://localhost:${port}`,trace:'retain-on-failure'},projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],webServer:{command:`npm run start -- -p ${port}`,url:`http://localhost:${port}`,reuseExistingServer:true,timeout:120000}});
