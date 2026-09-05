// Shared place + category helpers for the merged Guide/Map view.

export const CATEGORIES = [
  { id: 'water', colorVar: '--color-cat-beach', label: 'Beaches', match: /beach|water|lagoon|boat|snorkel|scuba|swim|windsurf|paddle|kayak|dive/i },
  { id: 'nature', colorVar: '--color-cat-hiking', label: 'Hiking', match: /hiking|nature|gorge|mountain|garden|trail|river|botanical/i },
  { id: 'town', colorVar: '--color-cat-town', label: 'Towns', match: /town|market|village|neighbor|district|old town|plaka|psirri|kerameikos|monastiraki/i },
  { id: 'dining', colorVar: '--color-cat-dining', label: 'Dining', match: /dining|food|taverna|restaurant|brunch|cafe|street food|meal|wine bar/i },
  { id: 'history', colorVar: '--color-cat-history', label: 'History', match: /museum|historical|site|palace|ancient|agora|acropol|stadium|fortress|archae|temple|island|agora/i },
  { id: 'activity', colorVar: '--color-cat-tour', label: 'Tours', match: /activit|tour|class|tasting|safari|photo|yoga|horse|climb|ferrata|cook|jeep|4x4|wine|raki|catamaran|excursion/i },
];

// How keen we are on a card. Cards without a level are simply unmarked — the
// absence of a mark is not a "no", so nothing is ever hidden or reordered away.
export const INTEREST_LEVELS = [
  { id: 'must', label: 'Must-do', short: 'Must-do', rank: 0 },
  { id: 'maybe', label: 'Interested', short: 'Interested', rank: 1 },
];

export const UNMARKED_RANK = 2;

export function interestOf(card) {
  const level = INTEREST_LEVELS.find((item) => item.id === card?.interest);
  return level || null;
}

// Cycle unmarked → Interested → Must-do → unmarked, so one control covers all
// three states and the button's label always says where you are.
export function nextInterest(current) {
  if (current === 'maybe') return 'must';
  if (current === 'must') return '';
  return 'maybe';
}

// Marked cards rise within their own group; ties keep their authored order so
// the guide never shuffles unpredictably underneath you.
export function sortByInterest(cards) {
  return cards
    .map((card, index) => ({ card, index, rank: interestOf(card)?.rank ?? UNMARKED_RANK }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.card);
}

export function collectMarked(trip, level) {
  return (trip.guideSections || []).flatMap((section) =>
    (section.groups || []).flatMap((group) =>
      (group.cards || [])
        .filter((card) => (level ? card.interest === level : Boolean(interestOf(card))))
        .map((card) => ({ card, sectionTitle: section.title, groupTitle: group.title }))
    )
  );
}

export const DEFAULT_CATEGORY = { id: 'other', colorVar: '--color-cat-history', label: 'Other' };

export function categorizeGroup(title) {
  return CATEGORIES.find((c) => c.match.test(title || '')) || DEFAULT_CATEGORY;
}

// Flatten a trip's guide sections into a list of places, each tagged with its
// city (area) + guide category. Shared by the city filter and the map.
export function collectPlaces(trip) {
  return trip.guideSections.flatMap((section) =>
    section.groups.flatMap((group) => group.cards.map((card) => ({
      id: card.id,
      title: card.title,
      area: section.area,
      category: categorizeGroup(group.title),
      groupTitle: group.title,
      snippet: card.paragraphs?.[0] || card.bullets?.[0] || card.location || section.title,
      coordinates: card.coordinates || null,
    })))
  );
}

export function filterPlacesByCity(places, city) {
  return city === 'all' ? places : places.filter((p) => p.area === city);
}

export function filterSectionsByCity(sections, city) {
  return city === 'all' ? sections : sections.filter((s) => s.area === city);
}

// Keep only the groups whose guide category is selected (empty = all).
export function filterSectionsByCategory(sections, cats) {
  if (!cats || cats.length === 0) return sections;
  return sections.map((section) => ({
    ...section,
    groups: section.groups.filter((group) => cats.includes(categorizeGroup(group.title).id)),
  })).filter((section) => section.groups.length > 0);
}

export function filterPlacesByCategory(places, cats) {
  if (!cats || cats.length === 0) return places;
  return places.filter((p) => cats.includes(p.category.id));
}

// Categories that actually appear in this trip (for building the filter chips).
export function categoriesOfTrip(trip) {
  const places = collectPlaces(trip);
  const present = new Set(places.map((p) => p.category.id));
  return CATEGORIES.filter((c) => present.has(c.id));
}

export function citiesOfTrip(trip) {
  // Only surface areas that actually have mapped (coordinate-bearing) places,
  // so non-place sections like phrases/daily-templates don't appear as cities.
  const set = new Set();
  trip.guideSections.forEach((section) =>
    section.groups.forEach((group) =>
      group.cards.forEach((card) => {
        const c = card.coordinates || {};
        if (section.area && Number.isFinite(c.lat) && Number.isFinite(c.lng)) set.add(section.area);
      })
    )
  );
  return ['all', ...set];
}

export function cityLabel(city) {
  if (city === 'all') return 'All';
  if (city === 'crete') return 'Crete';
  if (city === 'athens') return 'Athens';
  return city;
}
