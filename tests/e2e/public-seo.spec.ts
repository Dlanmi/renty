import { test, expect } from "@playwright/test";

test("seo: robots y sitemap públicos responden con reglas clave", async ({
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  const robotsText = await robots.text();
  expect(robotsText).toContain("Disallow: /admin");
  expect(robotsText).toContain("Sitemap: https://renty-seven.vercel.app/sitemap.xml");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("https://renty-seven.vercel.app/publicar");
  expect(sitemapText).toContain("https://renty-seven.vercel.app/nosotros");
});

test("seo: la ruta legacy /listing redirige al canonical /arriendos preservando query", async ({
  page,
}) => {
  await page.goto("/");

  const canonicalHref = await page
    .locator('a[href^="/arriendos/"]')
    .first()
    .getAttribute("href");

  expect(canonicalHref).toBeTruthy();
  const slug = canonicalHref!.replace("/arriendos/", "");

  await page.goto(`/listing/${slug}?q=Suba&max=800000`);

  await expect(page).toHaveURL(
    new RegExp(`/arriendos/${slug}\\?q=Suba&max=800000`)
  );
});

test("seo: un listing activo expone canonical hacia su URL pública final", async ({
  page,
}) => {
  await page.goto("/");

  const canonicalHref = await page
    .locator('a[href^="/arriendos/"]')
    .first()
    .getAttribute("href");

  expect(canonicalHref).toBeTruthy();
  await page.goto(canonicalHref!);

  const canonicalTag = page.locator('link[rel="canonical"]');
  await expect(canonicalTag).toHaveAttribute(
    "href",
    new RegExp(`${canonicalHref}$`)
  );
});
