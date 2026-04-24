import { test, expect } from "@playwright/test"

const USERNAME = process.env.E2E_USERNAME
const PASSWORD = process.env.E2E_PASSWORD

test.describe("Auth flow", () => {
  test.skip(!USERNAME || !PASSWORD, "E2E credentials are not configured")

  test("login then logout", async ({ page }) => {
    await page.goto("/login")

    await page.getByLabel("اسم المستخدم").fill(USERNAME ?? "")
    await page.getByLabel("كلمة المرور").first().fill(PASSWORD ?? "")
    await page.getByRole("button", { name: "تسجيل الدخول" }).click()

    await page.waitForURL((url) => !url.pathname.startsWith("/login"))

    await page.getByRole("button", { name: /خروج|تسجيل خروج/ }).first().click()
    await page.waitForURL(/\/login/)
    await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible()
  })
})
