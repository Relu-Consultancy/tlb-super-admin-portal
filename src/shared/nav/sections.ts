/**
 * Flat sidebar navigation for the admin portal.
 *
 * The reference design uses a single-level sidebar where all items
 * are always visible (no workspace drill-down). Partners is the
 * only expandable group, showing listing vertical sub-items.
 */

import {
  Users,
  LifeBuoy,
  Smartphone,
  Store,
  CheckCircle,
  LayoutDashboard,
  UserCog,
  BarChart3,
  CreditCard,
  Ticket,
  Megaphone,
  Sparkles,
  Settings as SettingsIcon,
  TrendingUp,
  DollarSign,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { Screen } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A listing vertical a Partners sub-item filters to. */
export type ListingVertical = 'event' | 'program' | 'class' | 'venue';

/** A navigable feature in the sidebar. */
export interface NavItem {
  screen: Screen;
  label: string;
  icon: LucideIcon;
  /** Sub-screens that should keep this item highlighted (e.g. a create flow). */
  match?: Screen[];
  /** Optional badge text (e.g. "Ticketing", "Enquiry"). */
  badge?: string;
  /** Badge colour variant. */
  badgeTone?: 'coral' | 'green' | 'blue';
  /**
   * For Partners sub-items: the listing type this entry scopes to. Several items
   * share `Screen.EVENT_APPROVAL`, so this is what distinguishes them (which tab
   * is active, and which listing type the screen pre-filters to).
   */
  listingType?: ListingVertical;
}

/** An expandable group in the sidebar (only Partners uses this). */
export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Subtitle shown beneath the label (e.g. "Events · Programs · Classes · Venues"). */
  subtitle?: string;
}

export type SidebarEntry =
  | { kind: 'item'; item: NavItem }
  | { kind: 'group'; group: NavGroup };

// ---------------------------------------------------------------------------
// Sidebar registry — matches client reference design
// ---------------------------------------------------------------------------

export const SIDEBAR_ENTRIES: SidebarEntry[] = [
  {
    kind: 'item',
    item: { screen: Screen.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  },
  {
    kind: 'item',
    item: { screen: Screen.USER_MANAGEMENT, label: 'Customers', icon: Users, match: [Screen.USER_SECTION] },
  },
  {
    kind: 'group',
    group: {
      id: 'partners',
      label: 'Partners',
      icon: Store,
      subtitle: 'Events · Programs · Classes · Venues',
      items: [
        { screen: Screen.EVENT_APPROVAL, label: 'Events', icon: CheckCircle, badge: 'Ticketing', badgeTone: 'coral', listingType: 'event' },
        { screen: Screen.EVENT_APPROVAL, label: 'Programs', icon: CheckCircle, badge: 'Enquiry', badgeTone: 'green', listingType: 'program' },
        { screen: Screen.EVENT_APPROVAL, label: 'Classes', icon: CheckCircle, badge: 'Enquiry', badgeTone: 'green', listingType: 'class' },
        { screen: Screen.EVENT_APPROVAL, label: 'Venues', icon: CheckCircle, badge: 'Hybrid', badgeTone: 'blue', listingType: 'venue' },
      ],
    },
  },
  {
    kind: 'item',
    item: { screen: Screen.TRAFFIC_ENGAGEMENT, label: 'Traffic & Engagement', icon: TrendingUp },
  },
  {
    kind: 'item',
    item: { screen: Screen.FINANCE_DASHBOARD, label: 'Finances', icon: DollarSign, match: [Screen.PAYMENTS_FINANCE] },
  },
  {
    kind: 'item',
    item: { screen: Screen.COUPONS_MARKETING, label: 'Marketing', icon: Ticket, match: [Screen.CREATE_COUPON] },
  },
  {
    kind: 'item',
    item: { screen: Screen.USERAPP_ALIGNMENT, label: 'App content', icon: Layers, match: [Screen.APP_CONTENT, Screen.TLB_SIGNATURE, Screen.CREATE_TLB_SIGNATURE] },
  },
  {
    kind: 'item',
    item: { screen: Screen.SUPPORT_SYSTEM, label: 'Support', icon: LifeBuoy },
  },
  {
    kind: 'item',
    item: { screen: Screen.ADMIN_MANAGEMENT, label: 'Admin', icon: UserCog, match: [Screen.BROADCASTS, Screen.ANALYTICS, Screen.SETTINGS] },
  },
];

// ---------------------------------------------------------------------------
// Legacy helpers — kept for backward compatibility with App.tsx/Sidebar tests
// ---------------------------------------------------------------------------

export type SectionId = 'customer' | 'partner' | 'admin' | 'support';

export interface SectionAccent {
  icon: string;
  bar: string;
  soft: string;
  hover: string;
  text: string;
}

export interface SectionDef {
  id: SectionId;
  label: string;
  tagline: string;
  icon: LucideIcon;
  accent: SectionAccent;
  items: NavItem[];
}

// Kept for any code that still imports SECTIONS (tests, Hub, etc.)
export const SECTIONS: SectionDef[] = [
  {
    id: 'customer',
    label: 'User / Customer',
    tagline: 'End-users, their app experience & support',
    icon: Users,
    accent: { icon: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500', soft: 'bg-blue-50', hover: 'hover:border-blue-300', text: 'text-blue-600' },
    items: [
      { screen: Screen.USER_MANAGEMENT, label: 'User Management', icon: Users },
      { screen: Screen.USER_SECTION, label: 'User Section', icon: Users },
      { screen: Screen.USERAPP_ALIGNMENT, label: 'UserApp Alignment', icon: Smartphone },
    ],
  },
  {
    id: 'partner',
    label: 'Partner',
    tagline: 'Partner onboarding & their listings',
    icon: Store,
    accent: { icon: 'bg-purple-50 text-purple-600', bar: 'bg-purple-500', soft: 'bg-purple-50', hover: 'hover:border-purple-300', text: 'text-purple-600' },
    items: [
      { screen: Screen.PARTNER_MANAGEMENT, label: 'Partner Management', icon: Store },
      { screen: Screen.EVENT_APPROVAL, label: 'Listings Approval', icon: CheckCircle },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    tagline: 'Platform ops, finance, marketing & content',
    icon: UserCog,
    accent: { icon: 'bg-yellow-50 text-yellow-600', bar: 'bg-yellow-400', soft: 'bg-yellow-50', hover: 'hover:border-yellow-300', text: 'text-yellow-600' },
    items: [
      { screen: Screen.DASHBOARD, label: 'Overview', icon: LayoutDashboard },
      { screen: Screen.ADMIN_MANAGEMENT, label: 'Employee Admins', icon: UserCog },
      { screen: Screen.FINANCE_DASHBOARD, label: 'Finance Dashboard', icon: BarChart3 },
      { screen: Screen.PAYMENTS_FINANCE, label: 'Payments & Transactions', icon: CreditCard },
      { screen: Screen.COUPONS_MARKETING, label: 'Marketing Coupons', icon: Ticket, match: [Screen.CREATE_COUPON] },
      { screen: Screen.BROADCASTS, label: 'Broadcasts', icon: Megaphone },
      { screen: Screen.TLB_SIGNATURE, label: 'TLB Signature', icon: Sparkles, match: [Screen.CREATE_TLB_SIGNATURE] },
      { screen: Screen.ANALYTICS, label: 'Analytics', icon: BarChart3 },
      { screen: Screen.SETTINGS, label: 'Settings', icon: SettingsIcon },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    tagline: 'Customer & partner enquiries across the platform',
    icon: LifeBuoy,
    accent: { icon: 'bg-teal-50 text-teal-600', bar: 'bg-teal-500', soft: 'bg-teal-50', hover: 'hover:border-teal-300', text: 'text-teal-600' },
    items: [
      { screen: Screen.SUPPORT_SYSTEM, label: 'Support Tickets', icon: LifeBuoy },
    ],
  },
];

/** Find the section that owns a screen (matching primary screens and sub-screens). */
export function sectionOfScreen(screen: Screen): SectionDef | null {
  return SECTIONS.find((s) => s.items.some((i) => i.screen === screen || i.match?.includes(screen))) ?? null;
}

/** The nav item a screen highlights (its own item, or the parent of a sub-screen). */
export function navItemOfScreen(screen: Screen): NavItem | null {
  for (const s of SECTIONS) {
    const item = s.items.find((i) => i.screen === screen || i.match?.includes(screen));
    if (item) return item;
  }
  return null;
}

/** The first (default) screen of a section — where "enter section" lands. */
export function firstScreenOfSection(id: SectionId): Screen {
  const s = SECTIONS.find((x) => x.id === id);
  return s ? s.items[0].screen : Screen.HOME;
}

export function getSection(id: SectionId): SectionDef | undefined {
  return SECTIONS.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// New flat-sidebar helpers
// ---------------------------------------------------------------------------

/** Is a single nav item the active one, given the current screen (+ Partners listing type)? */
export function isActiveItem(
  item: NavItem,
  currentScreen: Screen,
  activeListingType?: ListingVertical | '',
): boolean {
  // Typed Partners sub-items share one screen — the listing type is the tiebreaker.
  if (item.listingType) {
    return item.screen === currentScreen && item.listingType === activeListingType;
  }
  return item.screen === currentScreen || !!item.match?.includes(currentScreen);
}

/** Check if a screen is the active one for a given sidebar entry. */
export function isActiveEntry(
  entry: SidebarEntry,
  currentScreen: Screen,
  activeListingType?: ListingVertical | '',
): boolean {
  if (entry.kind === 'item') {
    return isActiveItem(entry.item, currentScreen, activeListingType);
  }
  return entry.group.items.some((i) => isActiveItem(i, currentScreen, activeListingType));
}
