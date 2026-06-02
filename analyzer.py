import os
import re
from collections import Counter
from typing import Dict, List, Optional, Tuple

import matplotlib.pyplot as plt
from wordcloud import WordCloud

from models import AnalysisResult, ProductItem

try:
    import jieba  # type: ignore

    HAS_JIEBA = True
except Exception:
    HAS_JIEBA = False


STOPWORDS = {
    "and",
    "for",
    "with",
    "the",
    "new",
    "set",
    "pack",
    "of",
    "to",
    "in",
    "on",
    "a",
    "an",
    "pcs",
    "pc",
    "is",
    "at",
    "by",
    "from",
    "or",
    "led",
    "light",
    "lights",
    "temu",
    "sale",
    "hot",
    "product",
}


SELLING_POINT_PATTERNS: Dict[str, List[str]] = {
    "waterproof": [r"waterproof", r"ip65", r"ip67", r"ip68", r"\u9632\u6c34"],
    "rechargeable": [r"rechargeable", r"usb\s*charge", r"type-?c", r"\u53ef\u5145\u7535", r"usb\u4f9b\u7535"],
    "remote_control": [r"remote", r"\u9065\u63a7", r"\u65e0\u7ebf\u63a7\u5236"],
    "smart_control": [r"smart", r"app", r"wifi", r"bluetooth", r"\u667a\u80fd"],
    "adjustable": [r"adjustable", r"dimmable", r"\u8c03\u5149", r"\u53ef\u8c03\u8282"],
    "portable": [r"portable", r"compact", r"\u4fbf\u643a", r"\u8f7b\u91cf"],
    "easy_install": [r"easy to install", r"self-adhesive", r"adhesive", r"\u5b89\u88c5\u65b9\u4fbf", r"\u514d\u6253\u5b54"],
    "energy_saving": [r"energy saving", r"low power", r"\u8282\u80fd", r"\u4f4e\u529f\u8017"],
    "durable": [r"durable", r"long lasting", r"\u8010\u7528", r"\u6297\u6454"],
    "rgb_multi_color": [r"rgb", r"multi-?color", r"\u591a\u8272", r"\u53d8\u8272"],
}


DIFFERENTIATION_POOL: List[Tuple[str, str]] = [
    ("high_cri", "Add high CRI claim (CRI > 90) and side-by-side real-scene comparison."),
    ("eye_comfort", "Highlight eye-comfort and low-blue-light use cases for night scenes."),
    ("weather_resistance", "Add dustproof/moistureproof/temperature range data for outdoor trust."),
    ("install_speed", "Provide a one-minute install visual guide to reduce purchase friction."),
    ("warranty", "Show warranty and replacement promise to lower buyer risk."),
    ("bundle_strategy", "Offer bundle options by length and accessories for multiple budgets."),
    ("certifications", "Show CE/FCC/RoHS badges for trust building."),
]


SPEC_REGEXES = [
    r"\b\d+\s?(?:pcs|pc|pack|set)\b",
    r"\b(?:usb|type-c|rgb|wifi|bluetooth|app)\b",
    r"\b\d+(?:\.\d+)?\s?(?:w|v|mah|lm|k)\b",
    r"\b(?:s|m|l|xl|xxl|xxxl)\b",
    r"\b\d+\s?(?:in|inch|cm|mm|m|ft)\b",
]


LENGTH_RE = re.compile(r"(\d+(?:\.\d+)?)\s?(mm|cm|m|ft|in|inch)\b", re.IGNORECASE)
LED_RE_LIST = [
    re.compile(r"\b(\d{1,4})\s?leds?\b", re.IGNORECASE),
    re.compile(r"\bleds?\s?(\d{1,4})\b", re.IGNORECASE),
    re.compile(r"(\d{1,4})\s?(?:\u706f\u73e0|\u706f)\b"),
]


def analyze_products(keyword: str, products: List[ProductItem]) -> AnalysisResult:
    titles = [p.title for p in products if p.title]
    title_counter = Counter()
    selling_counter = Counter()
    spec_counter = Counter()
    length_counter = Counter()
    led_counter = Counter()

    for title in titles:
        tokens = _extract_tokens(title)
        title_counter.update(tokens)
        selling_counter.update(_extract_selling_points(title))
        spec_counter.update(_extract_specs(title))
        length_counter.update(_extract_lengths(title))
        led_counter.update(_extract_led_counts(title))

    title_keywords = title_counter.most_common(50)
    selling_keywords = selling_counter.most_common(30)
    hot_specs = spec_counter.most_common(30)
    hot_lengths = length_counter.most_common(20)
    hot_led_counts = led_counter.most_common(20)

    title_recommendations = _build_title_recommendations(
        keyword=keyword,
        title_keywords=title_keywords,
        selling_keywords=selling_keywords,
        hot_specs=hot_specs,
        hot_lengths=hot_lengths,
        hot_led_counts=hot_led_counts,
    )

    differentiation_suggestions = _build_differentiation_suggestions(selling_keywords)
    ai_prompts = _build_ai_prompts(keyword, title_keywords, selling_keywords, hot_specs)

    return AnalysisResult(
        title_keywords=title_keywords,
        selling_keywords=selling_keywords,
        hot_specs=hot_specs,
        hot_lengths=hot_lengths,
        hot_led_counts=hot_led_counts,
        title_recommendations=title_recommendations,
        differentiation_suggestions=differentiation_suggestions,
        ai_prompts=ai_prompts,
    )


def generate_wordcloud(
    keyword_freq: List[Tuple[str, int]],
    output_dir: str,
    filename: str = "temu_keyword_wordcloud.png",
) -> str:
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, filename)

    freq_dict = {k: v for k, v in keyword_freq}
    if not freq_dict:
        freq_dict = {"no_data": 1}

    font_path = _get_chinese_font()
    wc = WordCloud(
        width=1600,
        height=1000,
        background_color="white",
        font_path=font_path,
        collocations=False,
        max_words=300,
    ).generate_from_frequencies(freq_dict)

    plt.figure(figsize=(16, 10))
    plt.imshow(wc, interpolation="bilinear")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(output_path, dpi=220)
    plt.close()

    return output_path


def _extract_tokens(text: str) -> List[str]:
    clean = re.sub(r"[\[\](){}|/\\,.:;!@#$%^&*+=<>?~`\"']", " ", text.lower())
    tokens: List[str] = []

    if HAS_JIEBA and re.search(r"[\u4e00-\u9fff]", clean):
        for token in jieba.cut(clean):
            token = token.strip().lower()
            if _valid_token(token):
                tokens.append(token)

    for token in re.findall(r"[a-z][a-z0-9\-\+]{1,}", clean):
        if _valid_token(token):
            tokens.append(token)

    if not HAS_JIEBA:
        for token in re.findall(r"[\u4e00-\u9fff]{2,}", clean):
            if _valid_token(token):
                tokens.append(token)

    return tokens


def _valid_token(token: str) -> bool:
    if not token:
        return False
    if token in STOPWORDS:
        return False
    if len(token) <= 1:
        return False
    if re.fullmatch(r"\d+", token):
        return False
    return True


def _extract_selling_points(text: str) -> List[str]:
    found: List[str] = []
    lower_text = text.lower()
    for label, patterns in SELLING_POINT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lower_text):
                found.append(label)
                break
    return found


def _extract_specs(text: str) -> List[str]:
    lower_text = text.lower()
    specs: List[str] = []
    for pattern in SPEC_REGEXES:
        specs.extend(re.findall(pattern, lower_text))
    return [re.sub(r"\s+", "", spec) for spec in specs if spec]


def _extract_lengths(text: str) -> List[str]:
    lengths: List[str] = []
    for value_str, unit in LENGTH_RE.findall(text.lower()):
        try:
            value = float(value_str)
        except ValueError:
            continue
        if value <= 0:
            continue
        normalized = _normalize_length(value, unit.lower())
        if normalized:
            lengths.append(normalized)
    return lengths


def _normalize_length(value: float, unit: str) -> str:
    cm_value = value
    if unit == "mm":
        cm_value = value / 10
    elif unit == "m":
        cm_value = value * 100
    elif unit == "ft":
        cm_value = value * 30.48
    elif unit in ("in", "inch"):
        cm_value = value * 2.54

    if cm_value > 5000:
        return ""
    if abs(cm_value - round(cm_value)) < 0.05:
        return f"{int(round(cm_value))}cm"
    return f"{cm_value:.1f}cm"


def _extract_led_counts(text: str) -> List[str]:
    matches: List[str] = []
    for regex in LED_RE_LIST:
        for item in regex.findall(text):
            try:
                value = int(item)
            except ValueError:
                continue
            if 1 <= value <= 5000:
                matches.append(f"{value}LED")
    return matches


def _build_title_recommendations(
    keyword: str,
    title_keywords: List[Tuple[str, int]],
    selling_keywords: List[Tuple[str, int]],
    hot_specs: List[Tuple[str, int]],
    hot_lengths: List[Tuple[str, int]],
    hot_led_counts: List[Tuple[str, int]],
) -> List[str]:
    top_title_words = [word for word, _ in title_keywords[:6]]
    top_selling = [word for word, _ in selling_keywords[:3]]
    top_specs = [word for word, _ in hot_specs[:2]]
    top_lengths = [word for word, _ in hot_lengths[:2]]
    top_led = [word for word, _ in hot_led_counts[:2]]

    chunk_a = " ".join(top_title_words[:3]) if top_title_words else "high quality"
    chunk_b = " ".join(top_selling[:2]) if top_selling else "easy install"
    spec_1 = top_specs[0] if top_specs else "multi-pack"
    length_1 = top_lengths[0] if top_lengths else "100cm"
    led_1 = top_led[0] if top_led else "120LED"

    templates = [
        f"{keyword} {chunk_a} {spec_1} {length_1} {led_1} {chunk_b}",
        f"{keyword} {chunk_a} {length_1} {chunk_b} for home decor",
        f"{keyword} {spec_1} {led_1} {chunk_b} gift-ready design",
        f"{keyword} premium {chunk_a} durable {length_1} quick install",
        f"{keyword} value pack {spec_1} {length_1} {led_1} smart control",
    ]
    return [re.sub(r"\s+", " ", title).strip() for title in templates]


def _build_differentiation_suggestions(selling_keywords: List[Tuple[str, int]]) -> List[str]:
    existing = {key for key, _ in selling_keywords}
    suggestions: List[str] = []
    for tag, content in DIFFERENTIATION_POOL:
        if tag not in existing:
            suggestions.append(f"{tag}: {content}")
        if len(suggestions) >= 5:
            break
    if not suggestions:
        suggestions.append("Emphasize material process and after-sales commitment visualization.")
    return suggestions


def _build_ai_prompts(
    keyword: str,
    title_keywords: List[Tuple[str, int]],
    selling_keywords: List[Tuple[str, int]],
    hot_specs: List[Tuple[str, int]],
) -> List[str]:
    top_words = ", ".join([key for key, _ in title_keywords[:4]]) or keyword
    top_selling = ", ".join([key for key, _ in selling_keywords[:3]]) or "premium quality, multi-scene"
    top_spec = ", ".join([key for key, _ in hot_specs[:2]]) or "multi-size"

    return [
        (
            f"E-commerce hero shot of {keyword}, {top_words}, pure white background, "
            f"soft shadow, ultra detailed, highlight {top_selling}, show {top_spec}, square composition"
        ),
        (
            f"Lifestyle scene with {keyword}, warm home lighting, real usage context, "
            f"focus on {top_selling}, photorealistic, high resolution"
        ),
        (
            f"Comparison ad for {keyword}, left side standard version, right side upgraded version, "
            f"emphasize {top_selling}, clean background, infographic style"
        ),
        (
            f"Macro detail shot of {keyword}, close-up material texture and craftsmanship, "
            f"display {top_spec}, commercial photography lighting"
        ),
        (
            f"Social media ad visual for {keyword}, high click-through style, title-safe blank area, "
            f"keywords {top_words}, clear product focus, 16:9"
        ),
    ]


def _get_chinese_font() -> Optional[str]:
    candidates = [
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\simsun.ttc",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for font in candidates:
        if os.path.exists(font):
            return font
    return None
