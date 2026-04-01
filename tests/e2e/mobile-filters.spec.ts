import { test, expect, type Page } from "@playwright/test";

async function findListingWithMobilePriceInsight(page: Page) {
  await page.goto("/");

  const hrefs = await page.locator('a[href^="/arriendos/"]').evaluateAll((links) =>
    links
      .map((link) => (link instanceof HTMLAnchorElement ? link.href : null))
      .filter((href): href is string => Boolean(href))
  );

  for (const href of hrefs) {
    await page.goto(href);
    if (await page.getByText("Total mensual aprox.", { exact: false }).count()) {
      return href;
    }
  }

  return null;
}

test("mobile: apply hero filters and sync URL", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Barrio o zona").fill("Suba");
  await page.getByLabel("Presupuesto máximo").selectOption("800000");
  await page.getByLabel("Habitaciones mínimas").selectOption("1");
  await page.getByRole("button", { name: /Buscar/i }).click();

  await expect(page).toHaveURL(/q=Suba/);
  await expect(page).toHaveURL(/max=800000/);
  await expect(page).toHaveURL(/beds=1/);
});

test("mobile: numeric filters stack on narrow screens to preserve readable labels", async ({
  page,
}) => {
  await page.goto("/");

  const layout = await page.evaluate(() => {
    const priceField = document
      .querySelector('select[aria-label="Presupuesto máximo"]')
      ?.closest("label");
    const bedroomsField = document
      .querySelector('select[aria-label="Habitaciones mínimas"]')
      ?.closest("label");

    if (!(priceField instanceof HTMLElement) || !(bedroomsField instanceof HTMLElement)) {
      return null;
    }

    const priceRect = priceField.getBoundingClientRect();
    const bedroomsRect = bedroomsField.getBoundingClientRect();

    return {
      priceBottom: priceRect.bottom,
      bedroomsTop: bedroomsRect.top,
    };
  });

  expect(layout).not.toBeNull();
  expect(layout?.bedroomsTop ?? 0).toBeGreaterThan(layout?.priceBottom ?? 0);
});

test("mobile: filter controls keep a 16px font size on narrow screens", async ({
  page,
}) => {
  await page.goto("/");

  const fontSizes = await page.evaluate(() => {
    const controls = [
      document.querySelector('input[aria-controls="home-hero-neighborhood-options"]'),
      document.querySelector('select[aria-label="Presupuesto máximo"]'),
      document.querySelector('select[aria-label="Habitaciones mínimas"]'),
    ];

    return controls.map((control) => {
      if (!(control instanceof HTMLElement)) {
        return null;
      }

      return Number.parseFloat(getComputedStyle(control).fontSize);
    });
  });

  expect(fontSizes.every((size) => (size ?? 0) >= 16)).toBeTruthy();
});

test("mobile: clear filters resets URL and results", async ({ page }) => {
  await page.goto("/?q=Suba&max=800000&beds=1");
  await page
    .locator("#home-search")
    .getByRole("button", { name: "Limpiar" })
    .click();

  await expect(page).toHaveURL("http://127.0.0.1:3100/");
});

test("mobile: restablecer should discard draft filters", async ({ page }) => {
  await page.goto("/?q=Suba");

  const locationInput = page.getByLabel("Barrio o zona");
  await locationInput.fill("Toberin");
  await page.getByRole("button", { name: "Restablecer" }).click();

  await expect(locationInput).toHaveValue("Suba");
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
  const homeBreadcrumbLink = page
    .locator("nav")
    .first()
    .getByRole("link", { name: "Inicio" });
  await expect(homeBreadcrumbLink).toHaveAttribute("href", /q=Verbenal/);
  await expect(homeBreadcrumbLink).toHaveAttribute("href", /max=900000/);
  await expect(homeBreadcrumbLink).toHaveAttribute("href", /beds=1/);
  await homeBreadcrumbLink.click();

  await expect(page).toHaveURL(/q=Verbenal/);
  await expect(page).toHaveURL(/max=900000/);
  await expect(page).toHaveURL(/beds=1/);
});

test("mobile: info insight stays visible until the user scrolls further", async ({
  page,
}) => {
  const listingHref = await findListingWithMobilePriceInsight(page);

  expect(listingHref).toBeTruthy();
  await page.goto(listingHref!);

  const stickyBar = page.locator('[data-mobile-sticky-cta-state]');
  await expect(stickyBar).toHaveAttribute("data-mobile-sticky-cta-state", "visible");

  const insight = page.locator(".mobile-price-insight");
  await page.evaluate(() => window.scrollTo({ top: 280, behavior: "auto" }));
  await expect(insight).toHaveAttribute("data-state", "visible");

  await page.evaluate(() => window.scrollTo({ top: 430, behavior: "auto" }));
  await expect(insight).toHaveAttribute("data-state", "visible");

  const pulseTarget = page.locator('[data-mobile-insight-target="visible"]');
  await expect(pulseTarget).toHaveAttribute("data-mobile-insight-pulse", "0");

  await page.waitForTimeout(1700);
  await page.evaluate(() => window.scrollTo({ top: 760, behavior: "auto" }));
  await expect(insight).toHaveAttribute("data-state", "dismissed");
  await expect(pulseTarget).toHaveAttribute("data-mobile-insight-pulse", "1");
});

test("mobile: info insight anchors to the breakdown block without colliding with the WhatsApp CTA", async ({
  page,
}) => {
  const listingHref = await findListingWithMobilePriceInsight(page);

  expect(listingHref).toBeTruthy();
  await page.goto(listingHref!);
  await page.evaluate(() => window.scrollTo({ top: 280, behavior: "auto" }));
  await expect(page.locator('[data-mobile-sticky-cta-state]')).toHaveAttribute(
    "data-mobile-sticky-cta-state",
    "visible"
  );
  await expect(page.locator(".mobile-price-insight")).toHaveAttribute(
    "data-state",
    "visible"
  );

  const layout = await page.evaluate(() => {
    const footer = document.querySelector('[data-mobile-sticky-cta-state="visible"]');
    const priceBlock = footer?.querySelector("div.min-w-0");
    const button = footer?.querySelector('a[href^="https://wa.me/"]');
    const insight = document.querySelector('.mobile-price-insight[data-state="visible"]');
    const insightTarget = footer?.querySelector('[data-mobile-insight-target="visible"]');

    if (
      !(footer instanceof HTMLElement) ||
      !(priceBlock instanceof HTMLElement) ||
      !(button instanceof HTMLElement) ||
      !(insight instanceof HTMLElement) ||
      !(insightTarget instanceof HTMLElement)
    ) {
      return null;
    }

    const priceRect = priceBlock.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const insightRect = insight.getBoundingClientRect();
    const targetRect = insightTarget.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();

    return {
      priceTop: priceRect.top,
      priceRight: priceRect.right,
      buttonLeft: buttonRect.left,
      buttonTop: buttonRect.top,
      viewportCenterX: Math.round(window.innerWidth / 2),
      insightTop: Math.round(insightRect.top),
      insightBottom: Math.round(insightRect.bottom),
      insightLeft: Math.round(insightRect.left),
      insightCenterX: Math.round(insightRect.left + insightRect.width / 2),
      footerTop: Math.round(footerRect.top),
      targetTop: Math.round(targetRect.top),
      targetRight: Math.round(targetRect.right),
    };
  });

  expect(layout).not.toBeNull();
  expect(layout?.buttonLeft ?? 0).toBeGreaterThan(layout?.priceRight ?? 0);
  expect(Math.abs((layout?.buttonTop ?? 0) - (layout?.priceTop ?? 0))).toBeLessThanOrEqual(
    12
  );
  expect((layout?.insightTop ?? 0) < (layout?.targetTop ?? 0)).toBeTruthy();
  expect((layout?.insightBottom ?? 0) < (layout?.footerTop ?? 0)).toBeTruthy();
  expect(((layout?.footerTop ?? 0) - (layout?.insightBottom ?? 0)) >= 12).toBeTruthy();
  expect(
    Math.abs((layout?.insightCenterX ?? 0) - (layout?.viewportCenterX ?? 0)) <= 16
  ).toBeTruthy();
  expect((layout?.targetRight ?? 0) < (layout?.buttonLeft ?? 0)).toBeTruthy();
});
