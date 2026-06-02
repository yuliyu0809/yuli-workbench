from dataclasses import dataclass
from typing import List, Optional, Tuple


@dataclass
class ProductItem:
    title: str
    price: Optional[float]
    reviews: Optional[int]
    link: str


@dataclass
class AnalysisResult:
    title_keywords: List[Tuple[str, int]]
    selling_keywords: List[Tuple[str, int]]
    hot_specs: List[Tuple[str, int]]
    hot_lengths: List[Tuple[str, int]]
    hot_led_counts: List[Tuple[str, int]]
    title_recommendations: List[str]
    differentiation_suggestions: List[str]
    ai_prompts: List[str]
