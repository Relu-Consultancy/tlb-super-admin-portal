/**
 * Top-level information architecture for the admin portal.
 *
 * Every feature screen lives inside exactly one of three sections —
 * Customer, Partner, or Admin. The Hub (landing) and the Sidebar both render
 * from this single registry, so adding a screen in one place updates both.
 */

import {
  Users,
  UserPlus,
  LifeBuoy,
  MessageSquare,
  Smartphone,
  Store,
  PieChart,
  CheckCircle,
  ShieldCheck,
  LayoutDashboard,
  UserCog,
  BarChart3,
  CreditCard,
  Ticket,
  Megaphone,
  Sparkles,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { Screen } from '../../types';

export type SectionId = 'customer' | 'partner' | 'admin' | 'support';

/** A navigable feature within a section. */
export interface NavItem {
  screen: Screen;
  label: string;
  icon: LucideIcon;
  /** Sub-screens that should keep this item highlighted (e.g. a create flow). */
  match?: Screen[];
}

/** Per-section accent classes (Tailwind) for cards, chips and headers. */
export interface SectionAccent {
  /** Icon tile (bg + text). */
  icon: string;
  /** Solid dot / bar. */
  bar: string;
  /** Soft background tint. */
  soft: string;
  /** Card hover border. */
  hover: string;
  /** Text accent. */
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

export const SECTIONS: SectionDef[] = [
  {
    id: 'customer',
    label: 'User / Customer',
    tagline: 'End-users, their app experience & support',
    icon: Users,
    accent: { icon: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500', soft: 'bg-blue-50', hover: 'hover:border-blue-300', text: 'text-blue-600' },
    items: [
      { screen: Screen.USER_MANAGEMENT, label: 'User Management', icon: Users },
      { screen: Screen.USER_SECTION, label: 'User Section', icon: UserPlus },
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
      { screen: Screen.PARTNER_MANAGEMENT, label: 'Partner Management', icon: PieChart },
      { screen: Screen.EVENT_APPROVAL, label: 'Listings Approval', icon: CheckCircle },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    tagline: 'Platform ops, finance, marketing & content',
    icon: ShieldCheck,
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
      { screen: Screen.SUPPORT_SYSTEM, label: 'Support Tickets', icon: MessageSquare },
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
