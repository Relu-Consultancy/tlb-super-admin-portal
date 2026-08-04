import type { ListingVertical } from './sections';

export interface VerticalMeta {
  /** Display label, e.g. "Events". */
  label: string;
  /** Matching partner category name (Partner.categories / PARTNER_CATEGORIES). */
  category: string;
  /** Sidebar badge text, e.g. "Ticketing". */
  badge: string;
  badgeTone: 'coral' | 'green' | 'blue';
  /** Short blurb used on the Dashboard's "Listings by Vertical" cards. */
  subtitle: string;
}

/** The 4 moderated listing verticals, with their matching partner category and display metadata. */
export const VERTICAL_CONFIG: Record<ListingVertical, VerticalMeta> = {
  event: { label: 'Events', category: 'Events', badge: 'Ticketing', badgeTone: 'coral', subtitle: 'Ticketing · commission' },
  program: { label: 'Programs', category: 'Programs', badge: 'Enquiry', badgeTone: 'green', subtitle: 'Enquiry credits' },
  class: { label: 'Classes', category: 'Classes', badge: 'Enquiry', badgeTone: 'green', subtitle: 'Enquiry credits' },
  venue: { label: 'Venues', category: 'Venues', badge: 'Hybrid', badgeTone: 'blue', subtitle: 'Hybrid model' },
};

export const VERTICALS: ListingVertical[] = ['event', 'program', 'class', 'venue'];
