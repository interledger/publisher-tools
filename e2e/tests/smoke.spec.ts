import { expect, test } from '@playwright/test'

test('home page loads without errors', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  await page.goto('./')

  await expect(page).toHaveTitle(/Publisher Tools/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Publisher Tools' }),
  ).toBeVisible()
  expect(pageErrors).toEqual([])
})
