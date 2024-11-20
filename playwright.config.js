import { defineConfig } from '@playwright/test';

export default defineConfig({
testDir: 'tests/playwright', // Only tests in this folder will be picked up

// Optionally, exclude specific folders (for example, exclude vitest folder)
testIgnore: [
  'tests/vitest',  // This excludes any tests within the vitest folder
],

});