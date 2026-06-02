# TEMU Keyword Analysis Assistant (Windows)

## Features
- Input a product keyword
- Open TEMU search page automatically
- Scrape top 50 products
- Extract:
  - title
  - price
  - review count
  - product link
- Analyze:
  - high-frequency title words
  - high-frequency selling points
  - hot specs
  - hot lengths
  - hot LED counts
- Generate:
  - keyword word cloud
  - keyword ranking
  - TEMU title suggestions
  - differentiation suggestions
  - AI image prompts
- Export to Excel
- Desktop GUI for Windows

## Requirements
- Windows 10/11
- Python 3.10+

## Install
```powershell
pip install -r requirements.txt
playwright install chromium
```

## Run
```powershell
python main.py
```

Or double-click `run.bat`.

## Output Workbook Sheets
- `Product Data`
- `Title Keywords`
- `Selling Keywords`
- `Hot Specs`
- `Recommendations`
- `Word Cloud`

## Notes
- TEMU page structure may change over time, which can reduce scrape count.
- If CAPTCHA appears, use visual browser mode and re-run.
