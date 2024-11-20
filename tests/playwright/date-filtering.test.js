import { test, expect } from '@playwright/test';


test.describe('ProductionReport Component', () => {
    test('should load the report page with filters', async ({ page }) => {

        await page.goto('http://localhost:3000');
        //find the input html for start and set it equal to 10-29, then check that the value was set 
        const startDateInput = await page.locator('label:has-text("Start Date") + input[type="date"]');  //find the input html for start
        await startDateInput.fill('2024-10-29');   
        const inputValue = await startDateInput.inputValue();
        expect(inputValue).toBe('2024-10-29');
        
        await startDateInput.dispatchEvent('change');

        //find the input html for end and set it equal to 10-31, then check that the value was set 
        const endDateInput = await page.locator('label:has-text("End Date") + input[type="date"]'); //find the input html for end
    
        await endDateInput.fill('2024-10-31');
    
        const endInput = await endDateInput.inputValue();
        expect(endInput).toBe('2024-10-31');

        await endDateInput.dispatchEvent('change');
    });

    test('should load the report page with filters based on URL', async ({ page }) => {
        //Set the start and end date from the url through parameters to 10-27 and 10-29
        await page.goto('http://localhost:3000/?startDate=2024-10-27&endDate=2024-10-31'); 
        
        const startDateInput = await page.locator('label:has-text("Start Date") + input[type="date"]');
        const inputValue = await startDateInput.inputValue();
        expect(inputValue).toBe('2024-10-27');  //check that the start date is set
        
        await startDateInput.dispatchEvent('change');
        
        const endDateInput = await page.locator('label:has-text("End Date") + input[type="date"]');
        const endInput = await endDateInput.inputValue();
        expect(endInput).toBe('2024-10-31'); //check that the end date is set
        await endDateInput.dispatchEvent('change');
    });

    test('should select a device and verify its value', async ({ page }) => {
        //checked to make sure that the devices set via url are represented in the devices list
        await page.goto('http://localhost:3000/?devices=Ender&startDate=2024-10-29&endDate=2024-11-30');
        // can agument the list to check for multiple inputs selected at once by doing this : devices=MakerBot,Prusa,Ender
        const devices = ['MakerBot', 'Prusa', 'Ender'];
        
        const selectedDevice = 'Ender';
        
        const deviceCheckbox = page.getByLabel(selectedDevice);
        
        // Ensure the checkbox for selectedDevice is selected
        await expect(deviceCheckbox).toBeChecked();
    
    });
    
    test('Validate chart and table data rendering', async ({ page }) => {

        //Tested value for specific integers below is based on data assertations made by me before writing script
        await page.goto('http://localhost:3000/?devices=Ender&startDate=2024-10-29&endDate=2024-11-30');

        const reportContainer = page.locator('text=Production Report');
        await expect(reportContainer).toBeVisible();
    
        const tableRows = page.locator('table tbody tr');
        await expect(tableRows).toHaveCount(4);      //4 rows in table exluding title rows

        const svg = page.locator('svg.recharts-surface').nth(0);
        await expect(svg).toBeVisible();
      
       
        const width = await svg.getAttribute('width');
        const height = await svg.getAttribute('height');
        expect(width).toBe('800');
        expect(height).toBe('400');
      
        
        const gridLines = svg.locator('.recharts-cartesian-grid line');
        await expect(gridLines).toHaveCount(11); // 5 horizontal and 6 vertical lines including axes
      
        
        const xAxisLabels = svg.locator('.recharts-xAxis .recharts-cartesian-axis-tick-value tspan');
        const yAxisLabels = svg.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value tspan');
      
        const xAxisTexts = await xAxisLabels.allTextContents();
        const yAxisTexts = await yAxisLabels.allTextContents();
      
        expect(xAxisTexts).toEqual(['Down', 'Running', 'Changeover', 'Meal/Break']);
        expect(yAxisTexts).toEqual(["0", "5000", "10000", "15000", "20000", "0", "3", "6", "9", "12"]);  // tested the data before this
      
      });
    
      test('checks if the download button triggers a failure on clicking', async ({ page, browser }) => {

        const context = await browser.newContext({
            acceptDownloads: true 
        });
    
        const newPage = await context.newPage();
        await newPage.goto('http://localhost:3000/?devices=Ender&startDate=2024-10-29&endDate=2024-11-30');
        //there is 2 buttons, the second one is the download print button which was verified 
        const downloadButton = newPage.locator('button').nth(1);   
        await expect(downloadButton).toBeVisible();
    
        const clickPromise = downloadButton.click({ force: true }); //click the button ant test
        await expect(clickPromise).resolves.not.toThrow(); 
        const downloadPromise = newPage.waitForEvent('download', { timeout: 5000 }); 
    
        try {
            const download = await downloadPromise;
            if (download) {
                const path = await download.path();
                console.error('Download occurred unexpectedly at:', path);
                throw new Error('Unexpected download event!');
            }
        } catch (error) {
            console.log('Expected: No download event detected.');
            await expect(error.message).toContain('Test timeout'); 
        }
    
        await context.close();
    });

});