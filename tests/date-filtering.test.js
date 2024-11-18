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
        // Navigate to the page containing the ProductionReport component
        await page.goto('http://localhost:3000/?devices=Ender&startDate=2024-10-29&endDate=2024-11-30');
        // Ensure the report filter section is visible

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
      
        // Verify rotated text for labels (optional)
        const xAxisRotatedText = xAxisLabels.first();
        const rotationTransform = await xAxisRotatedText.getAttribute('transform');
        expect(rotationTransform).toContain('rotate(-45');
      
        // Verify clipPath definitions
        const clipPath = svg.locator('defs clipPath#recharts2-clip rect');
        await expect(clipPath).toBeVisible();
      
        // Check for the rect inside the clipPath
        const clipRect = svg.locator('defs clipPath#recharts2-clip rect');
        const rectX = await clipRect.getAttribute('x');
        const rectY = await clipRect.getAttribute('y');
        const rectHeight = await clipRect.getAttribute('height');
        const rectWidth = await clipRect.getAttribute('width');
      
        expect(rectX).toBe('140');
        expect(rectY).toBe('56');
        expect(rectHeight).toBe('184');
        expect(rectWidth).toBe('520');
      });
    

});