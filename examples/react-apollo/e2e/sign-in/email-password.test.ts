import { faker } from '@faker-js/faker'
import { Decoder } from '@nuintun/qrcode'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import totp from 'totp-generator'
import { baseURL } from '../config'
import { signInWithEmailAndPassword, signUpWithEmailAndPassword, verifyEmail } from '../utils'

const email = faker.internet.email()
const password = faker.internet.password()

let page: Page

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()

  await page.goto(baseURL)
  await signUpWithEmailAndPassword({ page, email, password })
  await expect(page.getByText(/verification email sent/i)).toBeVisible()

  const newPage = await verifyEmail({ page, email, context: page.context() })
  await expect(newPage.getByText(/you are authenticated/i)).toBeVisible()
  await newPage.getByRole('button', { name: /sign out/i }).click()

  page = newPage
})

test.afterEach(async () => {
  await page.getByRole('button', { name: /sign out/i }).click()
})

test.afterAll(() => {
  page.close()
})

test('should sign in with email and password', async () => {
  await page.goto(baseURL)

  await signInWithEmailAndPassword({ page, email, password })
  await expect(page.getByText(/you are authenticated/i)).toBeVisible()
})

// TODO: Create email verification test

// TODO: `Decoder` is not working in a Node environment properly
test.skip('should activate and sign in with MFA', async () => {
  await page.goto(baseURL)

  await signInWithEmailAndPassword({ page, email, password })
  await page.waitForURL(baseURL)
  await page.getByRole('button', { name: /profile/i }).click()
  await page.getByRole('button', { name: /generate/i }).click()

  const image = page.getByAltText(/qrcode/i)
  const src = await image.getAttribute('src')

  // note: we are decoding MFA here
  const result = await new Decoder().scan(src || '')
  const [, params] = result.data.split('?')
  const { secret, algorithm, digits, period } = Object.fromEntries(new URLSearchParams(params))
  const code = totp(secret, {
    algorithm: algorithm.replace('SHA1', 'SHA-1'),
    digits: parseInt(digits),
    period: parseInt(period)
  })

  await page.getByPlaceholder(/enter activation code/i).fill(code)
  await page.getByRole('button', { name: /activate/i }).click()
  await expect(page.getByText(/mfa has been activated/i)).toBeVisible()
  await page.getByRole('button', { name: /sign out/i }).click()

  await page.getByRole('button', { name: /sign in/i }).click()
  await signInWithEmailAndPassword({ page, email, password })
  await expect(page.getByText(/send 2-step verification code/i)).toBeVisible()

  const newCode = totp(secret, { timestamp: Date.now() })

  await page.getByPlaceholder(/one-time password/i).fill(newCode)
  await page.getByRole('button', { name: /send 2-step verification code/i }).click()
  await expect(page.getByText(/you are authenticated/i)).toBeVisible()
})
