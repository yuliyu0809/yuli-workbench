const styleTemplates = {
  conversion: [
    '{name}, {keyword}, practical {scene} essential with {feature}, perfect for {audience}',
    '{keyword} for {audience}, {feature}, stylish {name} for {scene} and daily use',
    'Premium {name} with {feature}, {keyword} for {scene}, gift-ready choice for {audience}',
  ],
  simple: [
    '{name} {keyword} with {feature} for {scene}',
    '{feature} {name} for {audience}, {keyword}',
    '{name}, {keyword}, {scene} accessory',
  ],
  keyword: [
    '{name}, {keyword}, {feature}, {scene}, {audience}, daily use and gift option',
    '{keyword} {name} for {scene}, {feature}, lightweight, practical, stylish',
    '{name} for {audience}, {keyword}, {scene}, {feature}, home and travel use',
  ],
  gift: [
    '{name} Gift for {audience}, {keyword} with {feature}, ideal for {scene}',
    'Cute {name} for {audience}, {keyword}, thoughtful gift for {scene}',
    '{feature} {name}, {keyword} gift idea for {audience} and {scene}',
  ],
};

function clean(value, fallback) {
  return value?.trim() || fallback;
}

function toTitleCase(text) {
  return text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function generateTitles(form) {
  const keyword = clean(form.keyword, 'TEMU Product');
  const payload = {
    name: clean(form.englishName, keyword),
    keyword,
    feature: clean(form.feature, 'durable and lightweight design'),
    scene: clean(form.scene, 'home, travel and everyday use'),
    audience: clean(form.audience, 'women, girls and families'),
  };

  return (styleTemplates[form.style] || styleTemplates.conversion).map((template) =>
    toTitleCase(
      template.replace(/\{(\w+)\}/g, (_, key) => payload[key] || '').replace(/\s+/g, ' '),
    ),
  );
}
