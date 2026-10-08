import { expect, test } from '@playwright/test'
import { API_URL, CDN_URL, S3_URL } from '../services'

test('api is running', async ({ request }) => {
  const response = await request.get(API_URL)

  expect(response.ok()).toBe(true)
  expect(await response.json()).toMatchObject({ status: 'ok' })
})

test('cdn serves the embed scripts', async ({ request }) => {
  for (const script of ['banner.js', 'widget.js', 'paywall.js']) {
    const response = await request.get(`${CDN_URL}/${script}`)

    expect(response.ok(), script).toBe(true)
    expect(response.headers()['content-type'], script).toContain('javascript')
  }
})

test('local s3 is running', async ({ request }) => {
  const response = await request.get(S3_URL)

  expect(response.ok()).toBe(true)
  expect(Array.isArray(await response.json())).toBe(true)
})
