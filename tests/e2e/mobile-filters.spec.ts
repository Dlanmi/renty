import { test, expect } from "@playwright/test";

test("mobile: apply filters from step flow and sync URL", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /^Filtros/ }).click();
  await expect(
    page.getByRole("heading", { name: "Buscar arriendo" })
  ).toBeVisible();

  await page.getByLabel("¿En qué barrio quieres buscar?").fill("Suba");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "Hasta $800.000" }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "1+" }).click();
  await page.getByRole("button", { name: /Mostrar \d+ resultado/ }).click();

  await expect(page).toHaveURL(/q=Suba/);
  await expect(page).toHaveURL(/max=800000/);
  await expect(page).toHaveURL(/beds=1/);
});

test("mobile: clear filters resets URL and results", async ({ page }) => {
  await page.goto("/?q=Suba&max=800000&beds=1");
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page
    .getByRole("dialog", { name: "Buscar arriendo" })
    .getByRole("button", { name: "Limpiar todo" })
    .click();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: /Mostrar \d+ resultado/ }).click();

  await expect(page).toHaveURL("http://127.0.0.1:3100/");
});

test("mobile: cancel should discard draft filters", async ({ page }) => {
  await page.goto("/?q=Suba");

  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByLabel("¿En qué barrio quieres buscar?").fill("Toberin");
  await page.getByRole("button", { name: "Cerrar filtros" }).click();

  await expect(page).toHaveURL(/q=Suba/);
  await expect(page).not.toHaveURL(/q=Toberin/);
});

test("mobile: open listing and return to home preserves filter query", async ({
  page,
}) => {
  await page.goto("/?q=Verbenal&max=900000&beds=1");

  const firstListing = page.locator('a[href^="/arriendos/"]').first();
  await expect(firstListing).toBeVisible();
  await firstListing.click();

  await expect(page).toHaveURL(/\/arriendos\//);
  await page.locator("nav").first().getByRole("link", { name: "Inicio" }).click();

  await expect(page).toHaveURL(/q=Verbenal/);
  await expect(page).toHaveURL(/max=900000/);
  await expect(page).toHaveURL(/beds=1/);
});
