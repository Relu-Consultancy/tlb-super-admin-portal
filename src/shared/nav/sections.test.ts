import { describe, it, expect } from 'vitest';
import { SECTIONS, sectionOfScreen, navItemOfScreen, firstScreenOfSection, getSection } from './sections';
import { Screen } from '../../types';

describe('sections registry', () => {
  it('defines the four workspaces in order', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['customer', 'partner', 'admin', 'support']);
  });

  it('maps every non-home screen into exactly one section', () => {
    const screens = Object.values(Screen).filter((s) => s !== Screen.HOME && s !== Screen.LOGIN);
    for (const screen of screens) {
      expect(sectionOfScreen(screen as Screen), `screen ${screen} should belong to a section`).not.toBeNull();
    }
  });

  it('routes core screens to the right section', () => {
    expect(sectionOfScreen(Screen.USER_MANAGEMENT)?.id).toBe('customer');
    expect(sectionOfScreen(Screen.USERAPP_ALIGNMENT)?.id).toBe('customer');
    expect(sectionOfScreen(Screen.PARTNER_MANAGEMENT)?.id).toBe('partner');
    expect(sectionOfScreen(Screen.EVENT_APPROVAL)?.id).toBe('partner');
    expect(sectionOfScreen(Screen.FINANCE_DASHBOARD)?.id).toBe('admin');
    expect(sectionOfScreen(Screen.TLB_SIGNATURE)?.id).toBe('admin');
    expect(sectionOfScreen(Screen.SUPPORT_SYSTEM)?.id).toBe('support');
  });

  it('resolves a sub-screen to its parent section and nav item', () => {
    expect(sectionOfScreen(Screen.CREATE_COUPON)?.id).toBe('admin');
    expect(navItemOfScreen(Screen.CREATE_COUPON)?.screen).toBe(Screen.COUPONS_MARKETING);
    expect(navItemOfScreen(Screen.CREATE_TLB_SIGNATURE)?.screen).toBe(Screen.TLB_SIGNATURE);
  });

  it('returns the first screen of a section', () => {
    expect(firstScreenOfSection('customer')).toBe(Screen.USER_MANAGEMENT);
    expect(firstScreenOfSection('partner')).toBe(Screen.PARTNER_MANAGEMENT);
    expect(firstScreenOfSection('admin')).toBe(Screen.DASHBOARD);
    expect(firstScreenOfSection('support')).toBe(Screen.SUPPORT_SYSTEM);
  });

  it('looks up a section by id', () => {
    expect(getSection('partner')?.label).toBe('Partner');
    expect(getSection('admin')?.items.length).toBeGreaterThan(3);
  });

  it('returns null section for HOME', () => {
    expect(sectionOfScreen(Screen.HOME)).toBeNull();
  });
});
