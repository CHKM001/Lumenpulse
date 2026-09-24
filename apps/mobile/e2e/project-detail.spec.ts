import { test, expect } from '@playwright/test';
import { mockAll, MOCK_PROJECT } from './mocks';

test.describe('Project detail', () => {
  test.beforeEach(async ({ page }) => {
    await mockAll(page);
  });

  test('opening a project from the list shows its detail screen', async ({ page }) => {
    await page.goto('/projects');
    await page.getByTestId(`project-card-${MOCK_PROJECT.id}`).click();

    await expect(page).toHaveURL(new RegExp(`/projects/${MOCK_PROJECT.id}`));
    await expect(page.getByText(MOCK_PROJECT.name)).toBeVisible();
  });
});
