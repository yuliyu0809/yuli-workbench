import os
import re
import time
from typing import Callable, Dict, List, Optional
from urllib.parse import quote_plus

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

from models import ProductItem


ProgressFn = Optional[Callable[[str], None]]


class TemuScraper:
    def __init__(
        self,
        headless: bool = True,
        max_items: int = 50,
        timeout_ms: int = 45000,
        user_data_dir: Optional[str] = None,
        login_wait_seconds: int = 180,
    ) -> None:
        # Force real Chrome visible mode to preserve manual login flow reliably.
        self.headless = False
        self.max_items = max_items
        self.timeout_ms = timeout_ms
        project_dir = os.path.dirname(os.path.abspath(__file__))
        self.user_data_dir = os.path.abspath(user_data_dir or os.path.join(project_dir, "chrome_user_data"))
        self.login_wait_seconds = login_wait_seconds
        os.makedirs(self.user_data_dir, exist_ok=True)

    def scrape(self, keyword: str, progress: ProgressFn = None) -> List[ProductItem]:
        search_url = f"https://www.temu.com/search_result.html?search_key={quote_plus(keyword)}"
        self._notify(progress, f"Open search page: {search_url}")
        self._notify(progress, f"Using persistent user data dir: {self.user_data_dir}")

        with sync_playwright() as p:
            context = p.chromium.launch_persistent_context(
                user_data_dir=self.user_data_dir,
                channel="chrome",
                headless=False,
                viewport=None,
                locale="en-US",
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--start-maximized",
                ],
            )
            page = context.pages[0] if context.pages else context.new_page()

            try:
                page.goto(search_url, wait_until="domcontentloaded", timeout=self.timeout_ms)
            except PlaywrightTimeoutError:
                self._notify(progress, "Initial page load timed out. Continue with current content.")

            page.wait_for_timeout(1800)
            self._dismiss_popups(page)
            self._wait_for_login_if_needed(page, search_url, progress)

            raw_items: Dict[str, dict] = {}
            max_scroll_round = 30

            for _ in range(max_scroll_round):
                for item in self._extract_from_dom(page):
                    link = self._normalize_link(item.get("link", ""))
                    if not link:
                        continue
                    if link not in raw_items:
                        raw_items[link] = item

                self._notify(progress, f"Found items: {len(raw_items)} / {self.max_items}")
                if len(raw_items) >= self.max_items:
                    break

                page.mouse.wheel(0, 2800)
                page.wait_for_timeout(1000)
                self._dismiss_popups(page)

            context.close()

        products: List[ProductItem] = []
        for link, item in raw_items.items():
            title = self._clean_text(item.get("title", ""))
            if not title:
                continue
            products.append(
                ProductItem(
                    title=title,
                    price=self._parse_price(item.get("price", "")),
                    reviews=self._parse_reviews(item.get("reviews", "")),
                    link=link,
                )
            )

        products = products[: self.max_items]
        self._notify(progress, f"Scraping complete. Total items: {len(products)}")
        return products

    def _wait_for_login_if_needed(self, page, search_url: str, progress: ProgressFn) -> None:
        if self._has_results_anchor(page):
            return

        url = (page.url or "").lower()
        if "login" not in url and self.headless:
            return
        if self.headless:
            self._notify(progress, "No product list detected in headless mode. Continue without manual login wait.")
            return

        self._notify(
            progress,
            f"No product list detected yet. If login is required, complete login in browser. Waiting up to {self.login_wait_seconds}s.",
        )

        end_ts = time.time() + max(0, self.login_wait_seconds)
        while time.time() < end_ts:
            page.wait_for_timeout(2000)

            # After manual login, ensure we are on search page again.
            current_url = page.url or ""
            if "search_result.html" not in current_url:
                try:
                    page.goto(search_url, wait_until="domcontentloaded", timeout=10000)
                except Exception:
                    pass

            self._dismiss_popups(page)
            if self._has_results_anchor(page):
                self._notify(progress, "Product list detected, continue scraping.")
                return

        self._notify(progress, "Login wait timeout reached, continue with current page content.")

    def _has_results_anchor(self, page) -> bool:
        try:
            return bool(
                page.evaluate(
                    r"""
                    () => !!Array.from(document.querySelectorAll('a[href]'))
                      .find(a => /-g-\d+\.html/i.test(a.href || ''))
                    """
                )
            )
        except Exception:
            return False

    @staticmethod
    def _notify(progress: ProgressFn, message: str) -> None:
        if progress:
            progress(message)

    @staticmethod
    def _clean_text(text: str) -> str:
        return re.sub(r"\s+", " ", text or "").strip()

    @staticmethod
    def _normalize_link(link: str) -> str:
        if not link:
            return ""
        clean = link.strip()
        if not clean.startswith("http"):
            return ""
        clean = clean.split("?", 1)[0]
        clean = clean.split("#", 1)[0].rstrip("/")
        if re.search(r"-g-\d+\.html$", clean, flags=re.IGNORECASE):
            return clean
        return ""

    @staticmethod
    def _parse_price(raw: str) -> Optional[float]:
        if not raw:
            return None
        text = raw.replace(",", "")
        match = re.search(r"(\d+(?:\.\d{1,2})?)", text)
        if not match:
            return None
        try:
            return float(match.group(1))
        except ValueError:
            return None

    @staticmethod
    def _parse_reviews(raw: str) -> Optional[int]:
        if not raw:
            return None
        text = raw.lower().replace(",", "").strip()
        # Supports values like 1.2k, 3w(Chinese ten-thousand), 800+
        match = re.search(r"(\d+(?:\.\d+)?)\s*([kw+]?)", text)
        if not match:
            # Fallback for Chinese ten-thousand character.
            match = re.search(r"(\d+(?:\.\d+)?)\s*(\u4e07)?", text)
            if not match:
                return None

        value = float(match.group(1))
        unit = match.group(2)

        if unit == "k":
            value *= 1000
        elif unit in {"w", "\u4e07"}:
            value *= 10000

        return int(value)

    @staticmethod
    def _dismiss_popups(page) -> None:
        selectors = [
            "button[aria-label='Close']",
            "button[aria-label='close']",
            "div[role='dialog'] button",
            "[class*='close']",
        ]
        for selector in selectors:
            try:
                for node in page.query_selector_all(selector)[:3]:
                    if node and node.is_visible():
                        node.click(timeout=300)
            except Exception:
                pass

    @staticmethod
    def _extract_from_dom(page) -> List[dict]:
        script = r"""
        () => {
          const normalize = (t) => (t || '').replace(/\s+/g, ' ').trim();
          const linkPattern = /-g-\d+\.html/i;
          const currencyPattern = /[\u00A5$\u20AC\u00A3]\s?\d+(?:[\.,]\d{1,2})?/;
          const anchors = Array.from(document.querySelectorAll('a[href]'))
            .filter(a => linkPattern.test(a.href || ''));

          const items = [];
          const seen = new Set();

          const pickTitle = (anchor, cardText, card) => {
            const candidates = [];
            const aText = normalize(anchor.textContent);
            if (aText.length >= 6) candidates.push(aText);

            const titleNodes = card.querySelectorAll('h1,h2,h3,[class*="title"],[class*="name"]');
            for (const node of titleNodes) {
              const t = normalize(node.textContent);
              if (t.length >= 6) candidates.push(t);
            }

            const lines = cardText.split(/\n+/).map(normalize).filter(Boolean);
            for (const line of lines.slice(0, 10)) {
              if (line.length >= 8 && !currencyPattern.test(line)) {
                candidates.push(line);
              }
            }

            candidates.sort((a, b) => b.length - a.length);
            return candidates[0] || '';
          };

          const pickPrice = (cardText, card) => {
            const priceLike = [];
            const nodes = card.querySelectorAll('[class*="price"],[data-price],span,div');
            for (const node of nodes) {
              const txt = normalize(node.textContent);
              if (!txt || txt.length > 20) continue;
              if (currencyPattern.test(txt) || /^\d+(?:[\.,]\d{1,2})$/.test(txt)) {
                priceLike.push(txt);
              }
            }
            if (priceLike.length) return priceLike[0];
            const m = cardText.match(currencyPattern);
            return m ? m[0] : '';
          };

          const pickReviews = (cardText, card) => {
            const reviewPatterns = [
              /([\d\.,]+\s*[kKwW\u4e07+]?\s*(?:reviews?|ratings?|sold))/i,
              /((?:\u5df2\u552e|\u8bc4\u4ef7|\u6761\u8bc4\u8bba)\s*[\d\.,]+\s*[\u4e07kK+]?)/i
            ];

            const nodes = card.querySelectorAll('span,div,p');
            for (const node of nodes) {
              const txt = normalize(node.textContent);
              if (!txt || txt.length > 40) continue;
              for (const p of reviewPatterns) {
                const m = txt.match(p);
                if (m) return m[0];
              }
            }

            for (const p of reviewPatterns) {
              const m = cardText.match(p);
              if (m) return m[0];
            }
            return '';
          };

          for (const a of anchors) {
            const href = (a.href || '').split('?')[0];
            if (!href || seen.has(href)) continue;

            const card = a.closest('article,li,[data-testid*="search"],[class*="item"],[class*="product"],[class*="goods"]') || a.parentElement || a;
            const cardText = normalize(card.innerText || '');
            const title = pickTitle(a, cardText, card);
            const price = pickPrice(cardText, card);
            const reviews = pickReviews(cardText, card);

            if (!title) continue;
            seen.add(href);
            items.push({ title, price, reviews, link: href });
          }
          return items;
        }
        """
        try:
            return page.evaluate(script) or []
        except Exception:
            return []
