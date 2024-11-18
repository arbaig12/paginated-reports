import { test, expect } from '@playwright/test';

test.describe('ProductionReport Component', () => {
    test('should load the report page with filters', async ({ page }) => {

        await page.goto('http://localhost:3000');
    
        const startDateInput = await page.locator('label:has-text("Start Date") + input[type="date"]');
        await startDateInput.fill('2024-10-29');
        const inputValue = await startDateInput.inputValue();
        expect(inputValue).toBe('2024-10-29');
        
        await startDateInput.dispatchEvent('change');


        const endDateInput = await page.locator('label:has-text("End Date") + input[type="date"]');
    
        await endDateInput.fill('2024-10-31');
    
        const endInput = await endDateInput.inputValue();
        expect(endInput).toBe('2024-10-31');

        await endDateInput.dispatchEvent('change');
    });

    test('should load the report page with filters based on URL', async ({ page }) => {
        await page.goto('http://localhost:3000/?startDate=2024-10-27&endDate=2024-10-31'); 
        
        const startDateInput = await page.locator('label:has-text("Start Date") + input[type="date"]');
        const inputValue = await startDateInput.inputValue();
        expect(inputValue).toBe('2024-10-27');
        
        await startDateInput.dispatchEvent('change');
        
        const endDateInput = await page.locator('label:has-text("End Date") + input[type="date"]');
        const endInput = await endDateInput.inputValue();
        expect(endInput).toBe('2024-10-31');
        await endDateInput.dispatchEvent('change');
    });

    test('should select a device and verify its value', async ({ page }) => {
        await page.goto('http://localhost:3000/?devices=Ender&startDate=2024-10-29&endDate=2024-11-30');
    
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
    
        // Validate table data for any specific device
        const tableRows = page.locator('table tbody tr');
        await expect(tableRows).toHaveCount(4); 

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
        expect(yAxisTexts).toEqual(["0", "5000", "10000", "15000", "20000", "0", "3", "6", "9", "12"]);
      
      });
    

      test('checks if the download button triggers a PDF download', async ({ page }) => {
        // Navigate to the page containing the button (replace with the actual URL)
        await page.goto('http://localhost:3000/?devices=Ender&startDate=2024-10-29&endDate=2024-11-30');  // Adjust the URL as needed
        
        // Locate the download button by its class name
        const downloadButton = page.locator('button:has(svg.lucide-download)');
        
        // Ensure the button is visible
        await expect(downloadButton).toBeVisible();
    console.log(downloadButton)
        // Increase timeout for waiting for the download event
        const downloadPromise = page.waitForEvent('download', { timeout: 60000 });  // Increase timeout to 60 seconds
    
        // Click the download button (force click if necessary)
        await downloadButton.click({ force: true });
    
        // Wait for the download to complete
        const download = await downloadPromise;  // Wait until the download event is triggered
    
        // Ensure the download has started
        await expect(download).not.toBeNull();  // Ensure a download has been triggered
    
        // Optionally, you can check the downloaded file's name or path
        const path = await download.path();
        expect(path).toContain('.pdf');  // Verify the file is a PDF (or adjust based on your download format)
        
        // Optionally, save the downloaded file
        await download.saveAs('/path/to/save/at/' + download.suggestedFilename());  // Save the file to a specific path (adjust as needed)
    });
    

});