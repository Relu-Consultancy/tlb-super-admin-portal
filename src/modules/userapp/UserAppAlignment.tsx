import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Star,
  PauseCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Home,
  Ticket,
  Building2,
  GraduationCap,
  BookOpen,
  Signal,
  Wifi,
  BatteryFull,
  MapPin,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
  ALIGNMENT_PAGES,
  listSections,
  getSectionRows,
  addToSection,
  removeFromSection,
  setSection,
  sectionLabel,
  sectionErrorMessage,
  SECTION_MIN_LISTINGS,
  SECTION_MAX_LISTINGS,
  TLB_SIGNATURE_SECTION,
  listListings,
  listingTypeLabel,
  listingTypeTone,
  listingStatusLabel,
  listingStatusTone,
  LISTING_TYPES,
  ApiError,
  type AlignmentPage,
  type AlignmentPageId,
  type AlignmentSection,
  type SectionListing,
  type ListingListItem,
} from '../../shared/lib/api';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** Icon per alignment page. */
const PAGE_ICONS: Record<AlignmentPageId, LucideIcon> = {
  homepage: Home,
  events: Ticket,
  classes: BookOpen,
  programs: GraduationCap,
  venues: Building2,
};

const UserAppAlignment = () => {
  const { hasPermission } = useAuth();

  // Only the pages the admin is allowed to curate.
  const pages = useMemo(() => ALIGNMENT_PAGES.filter((p) => hasPermission(p.permission)), [hasPermission]);
  const [pageId, setPageId] = useState<AlignmentPageId | null>(() => pages[0]?.id ?? null);
  const page: AlignmentPage | null = useMemo(
    () => pages.find((p) => p.id === pageId) ?? pages[0] ?? null,
    [pages, pageId],
  );
  const base = page?.base ?? '';

  const [sections, setSections] = useState<AlignmentSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const [items, setItems] = useState<SectionListing[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null); // listing id being mutated
  const [reordering, setReordering] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Listings for EVERY section on the page, powering the live phone preview
  // (the active section reads from `items` so optimistic edits show instantly).
  const [previewMap, setPreviewMap] = useState<Record<string, SectionListing[]>>({});

  const activeSection = useMemo(
    () => sections.find((s) => s.section === activeSlug) ?? null,
    [sections, activeSlug],
  );
  const isSignatureSection = page?.id === 'homepage' && activeSlug === TLB_SIGNATURE_SECTION;

  // Tracks which page's sections are currently loaded, so the items/preview
  // effects never fetch with a new `base` but a stale slug/section list (which
  // would 404 against the wrong screen and could race in late).
  const [loadedBase, setLoadedBase] = useState('');

  const loadSectionsList = useCallback(async (b: string) => {
    setSectionsLoading(true);
    setSectionsError(null);
    try {
      const data = await listSections(b);
      setSections(data);
      setActiveSlug((prev) => prev ?? data[0]?.section ?? null);
      setLoadedBase(b);
    } catch (err) {
      setSectionsError(err instanceof ApiError ? err.message : 'Failed to load sections.');
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  const loadItems = useCallback(async (b: string, slug: string) => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      setItems(await getSectionRows(b, slug));
    } catch (err) {
      setItemsError(err instanceof ApiError ? err.message : 'Failed to load this section.');
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  // Page change: reset selection + caches, then load that page's sections.
  useEffect(() => {
    if (!base) return;
    setActiveSlug(null);
    setItems([]);
    setPreviewMap({});
    setLoadedBase('');
    loadSectionsList(base);
  }, [base, loadSectionsList]);

  // Load the active section's listings (only once this page's sections loaded).
  useEffect(() => {
    if (base && activeSlug && loadedBase === base) loadItems(base, activeSlug);
  }, [base, activeSlug, loadedBase, loadItems]);

  // Hydrate the phone preview with every section's listings, in parallel.
  useEffect(() => {
    if (!base || loadedBase !== base || sections.length === 0) return;
    let cancelled = false;
    Promise.all(
      sections.map(async (s) => {
        try { return [s.section, await getSectionRows(base, s.section)] as const; }
        catch { return [s.section, [] as SectionListing[]] as const; }
      }),
    ).then((entries) => { if (!cancelled) setPreviewMap(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [base, loadedBase, sections]);

  // Active section reads from the live editable `items`; others from the map.
  const itemsFor = useCallback(
    (slug: string) => (slug === activeSlug ? items : previewMap[slug] ?? []),
    [activeSlug, items, previewMap],
  );

  // Auto-dismiss the banner.
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);

  const refresh = useCallback(async () => {
    if (activeSlug) await loadItems(base, activeSlug);
    await loadSectionsList(base);
  }, [base, activeSlug, loadItems, loadSectionsList]);

  const handleAdd = useCallback(async (listingId: string) => {
    if (!base || !activeSlug) return;
    setBusyId(listingId);
    try {
      await addToSection(base, activeSlug, listingId);
      setBanner({ kind: 'success', text: 'Listing added to the section.' });
      setPickerOpen(false);
      await refresh();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : null;
      setBanner({ kind: 'error', text: sectionErrorMessage(code, 'Could not add that listing.') });
    } finally {
      setBusyId(null);
    }
  }, [base, activeSlug, refresh]);

  const handleRemove = useCallback(async (listingId: string) => {
    if (!base || !activeSlug) return;
    setBusyId(listingId);
    try {
      await removeFromSection(base, activeSlug, listingId);
      setBanner({ kind: 'success', text: 'Listing removed from the section.' });
      await refresh();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : null;
      setBanner({ kind: 'error', text: sectionErrorMessage(code, 'Could not remove that listing.') });
    } finally {
      setBusyId(null);
    }
  }, [base, activeSlug, refresh]);

  const handleMove = useCallback(async (index: number, dir: -1 | 1) => {
    if (!base || !activeSlug) return;
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    // Optimistic reorder; revert on failure.
    const previous = items;
    setItems(next);
    setReordering(true);
    try {
      await setSection(base, activeSlug, next.map((i) => i.listing.id));
      setBanner({ kind: 'success', text: 'Order updated.' });
      await loadItems(base, activeSlug);
    } catch (err) {
      setItems(previous);
      const code = err instanceof ApiError ? err.code : null;
      setBanner({ kind: 'error', text: sectionErrorMessage(code, 'Could not reorder the section.') });
    } finally {
      setReordering(false);
    }
  }, [base, activeSlug, items, loadItems]);

  if (!page) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No access"
        description="You need the Manage Listings or Manage TLB Listings permission to curate the user app."
      />
    );
  }

  const count = items.length;
  const atMax = count >= SECTION_MAX_LISTINGS;
  const atMin = count <= SECTION_MIN_LISTINGS;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">UserApp Alignment</h1>
        <p className="text-gray-500 text-sm">Curate which listings appear on the app homepage and each discovery screen.</p>
      </header>

      {/* Page selector */}
      <div className="flex flex-wrap gap-2">
        {pages.map((p) => {
          const Icon = PAGE_ICONS[p.id];
          const active = p.id === page.id;
          return (
            <button
              key={p.id}
              onClick={() => setPageId(p.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all',
                active
                  ? 'bg-gray-900 text-gray-900 border-gray-900 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
              )}
            >
              <Icon size={16} />
              {p.label}
            </button>
          );
        })}
      </div>

      {banner && (
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium',
            banner.kind === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
          )}
        >
          {banner.kind === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {banner.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Sections list */}
        <div className="xl:col-span-3 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">{page.label} Sections</h2>
          {sectionsError ? (
            <EmptyState icon={AlertCircle} title="Couldn't load sections" description={sectionsError} />
          ) : sectionsLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
          ) : sections.length === 0 ? (
            <EmptyState icon={LayoutGrid} title="No sections" description="This screen has no configurable sections yet." />
          ) : (
            sections.map((s) => {
              const fill = Math.min(100, Math.round((s.published_count / SECTION_MAX_LISTINGS) * 100));
              const active = s.section === activeSlug;
              return (
                <button
                  key={s.section}
                  onClick={() => setActiveSlug(s.section)}
                  className={cn(
                    'w-full text-left rounded-2xl border p-4 transition-all',
                    active ? 'border-yellow-400 bg-yellow-50/60 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-200',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-900 flex items-center gap-1.5">
                      {page.id === 'homepage' && s.section === TLB_SIGNATURE_SECTION && <Sparkles size={14} className="text-yellow-500" />}
                      {sectionLabel(s.section, s.label)}
                    </span>
                    <span className="text-xs font-bold text-gray-500">{s.published_count}/{SECTION_MAX_LISTINGS}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', s.published_count < SECTION_MIN_LISTINGS ? 'bg-amber-400' : 'bg-green-500')}
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    {s.published_count} published · {s.total_count} total
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Active section detail */}
        <div className="xl:col-span-5">
          {!activeSection ? (
            <Card><EmptyState icon={LayoutGrid} title="Select a section" description={`Pick a ${page.label} section to curate its listings.`} /></Card>
          ) : (
            <Card className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                    {isSignatureSection && <Sparkles size={16} className="text-yellow-500" />}
                    {sectionLabel(activeSection.section, activeSection.label)}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {count} of {SECTION_MAX_LISTINGS} slots filled · minimum {SECTION_MIN_LISTINGS}
                  </p>
                </div>
                <button
                  onClick={() => setPickerOpen(true)}
                  disabled={atMax}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors',
                    atMax ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300',
                  )}
                  title={atMax ? `Sections can hold at most ${SECTION_MAX_LISTINGS} listings` : undefined}
                >
                  <Plus size={16} /> Add Listing
                </button>
              </div>

              {isSignatureSection ? (
                <div className="flex items-start gap-2 px-3 py-2 bg-yellow-50 text-yellow-800 rounded-xl text-xs">
                  <Sparkles size={14} className="mt-0.5 shrink-0" />
                  Only TLB Signature listings can be placed in this section.
                </div>
              ) : page.listingType ? (
                <div className="flex items-start gap-2 px-3 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  This screen accepts only published <span className="font-bold">{page.label}</span> listings.
                </div>
              ) : null}

              {itemsError ? (
                <EmptyState icon={AlertCircle} title="Couldn't load section" description={itemsError} />
              ) : itemsLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
              ) : count === 0 ? (
                <EmptyState icon={LayoutGrid} title="No listings yet" description="Add published listings to feature them in this section." />
              ) : (
                <div className="space-y-2">
                  {count < SECTION_MIN_LISTINGS && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-800 rounded-xl text-xs">
                      <AlertCircle size={14} /> Below the minimum of {SECTION_MIN_LISTINGS}. Add {SECTION_MIN_LISTINGS - count} more so this section shows in the app.
                    </div>
                  )}
                  {items.map((item, idx) => {
                    const l = item.listing;
                    const busy = busyId === l.id;
                    return (
                      <div
                        key={l.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-200 transition-colors"
                      >
                        <div className="flex flex-col">
                          <button
                            onClick={() => handleMove(idx, -1)}
                            disabled={idx === 0 || reordering}
                            aria-label="Move up"
                            className="p-0.5 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMove(idx, 1)}
                            disabled={idx === items.length - 1 || reordering}
                            aria-label="Move down"
                            className="p-0.5 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                        <span className="w-6 text-center text-sm font-bold text-gray-700">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                            {l.is_tlb_signature && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                            {l.title}
                            {l.is_paused && <PauseCircle size={12} className="text-orange-400 shrink-0" aria-label="Paused" />}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', listingTypeTone(l.listing_type))}>
                              {listingTypeLabel(l.listing_type)}
                            </span>
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', listingStatusTone(l.status))}>
                              {listingStatusLabel(l.status)}
                            </span>
                            <span className="text-[10px] text-gray-400">Added {formatDate(item.added_at)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(l.id)}
                          disabled={busy || atMin || reordering}
                          aria-label="Remove from section"
                          title={atMin ? `A section must keep at least ${SECTION_MIN_LISTINGS} listings` : 'Remove from section'}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Live phone preview */}
        <div className="xl:col-span-4">
          <PhonePreview
            page={page}
            sections={sections}
            activeSlug={activeSlug}
            itemsFor={itemsFor}
            onSelect={setActiveSlug}
          />
        </div>
      </div>

      <AnimatePresence>
        {pickerOpen && activeSlug && (
          <AddListingPicker
            listingType={page.listingType}
            signatureOnly={!!isSignatureSection}
            existingIds={new Set(items.map((i) => i.listing.id))}
            busyId={busyId}
            onAdd={handleAdd}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Live phone preview (renders the screen as the consumer app would) ---

const TYPE_VISUALS: Record<string, { grad: string; Icon: LucideIcon }> = {
  event: { grad: 'from-blue-400 to-indigo-500', Icon: Ticket },
  venue: { grad: 'from-purple-400 to-fuchsia-500', Icon: Building2 },
  program: { grad: 'from-teal-400 to-emerald-500', Icon: GraduationCap },
  class: { grad: 'from-pink-400 to-rose-500', Icon: BookOpen },
};
function typeVisual(type: string) {
  return TYPE_VISUALS[type] ?? { grad: 'from-gray-300 to-gray-400', Icon: LayoutGrid };
}

interface PhonePreviewProps {
  page: AlignmentPage;
  sections: AlignmentSection[];
  activeSlug: string | null;
  itemsFor: (slug: string) => SectionListing[];
  onSelect: (slug: string) => void;
}

function PhonePreview({ page, sections, activeSlug, itemsFor, onSelect }: PhonePreviewProps) {
  const headerTitle = page.id === 'homepage' ? 'Discover' : page.label;
  const searchPlaceholder = page.id === 'homepage' ? 'Search events, venues…' : `Search ${page.label.toLowerCase()}…`;
  const signatureSlug = page.id === 'homepage' ? TLB_SIGNATURE_SECTION : null;

  return (
    <div className="xl:sticky xl:top-6 xl:-mt-24">
      <div className="mx-auto w-[300px] rounded-[2.75rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
        {/* Status bar + app chrome */}
        <div className="relative bg-white">
          <div className="flex items-center justify-between px-6 pt-2.5 pb-1 text-[10px] font-bold text-gray-900">
            <span>9:41</span>
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-20 h-4 bg-gray-900 rounded-full" />
            <span className="flex items-center gap-1"><Signal size={11} /><Wifi size={11} /><BatteryFull size={14} /></span>
          </div>
          <div className="px-4 pt-1.5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-400 font-bold flex items-center gap-0.5"><MapPin size={9} /> Pune</p>
                <p className="text-base font-black text-gray-900 leading-tight">{headerTitle}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-[11px] font-black text-gray-900">T</div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 bg-gray-100 rounded-xl px-2.5 py-2 text-[10px] text-gray-400">
              <Search size={11} /> {searchPlaceholder}
            </div>
          </div>
        </div>

        {/* Scrollable screen */}
        <div className="bg-gray-50 h-[440px] overflow-y-auto pb-6">
          {sections.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[11px] text-gray-700">No sections</div>
          ) : (
            sections.map((s) => {
              const list = itemsFor(s.section);
              const active = s.section === activeSlug;
              return (
                <div key={s.section} className={cn('pt-3 transition-colors', active && 'bg-yellow-50/60')}>
                  <button
                    onClick={() => onSelect(s.section)}
                    className="w-full flex items-center justify-between px-4 mb-2"
                  >
                    <span className={cn('text-xs font-black flex items-center gap-1', active ? 'text-gray-900' : 'text-gray-700')}>
                      {s.section === signatureSlug && <Sparkles size={11} className="text-yellow-500" />}
                      {sectionLabel(s.section, s.label)}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 flex items-center">See all <ChevronRight size={10} /></span>
                  </button>
                  <div className="flex gap-2.5 overflow-x-auto px-4 pb-2">
                    {list.length === 0 ? (
                      <div className="shrink-0 w-full h-20 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-700">
                        Empty section
                      </div>
                    ) : (
                      list.map((item) => {
                        const l = item.listing;
                        const { grad, Icon } = typeVisual(l.listing_type);
                        return (
                          <div key={l.id} className="shrink-0 w-28">
                            <div className={cn('h-20 rounded-xl bg-gradient-to-br flex items-center justify-center relative overflow-hidden', grad, l.is_paused && 'opacity-40 grayscale')}>
                              <Icon size={24} className="text-gray-900/90" />
                              {l.is_tlb_signature && (
                                <span className="absolute top-1 left-1 bg-white/90 rounded-full p-0.5"><Sparkles size={9} className="text-yellow-500" /></span>
                              )}
                              {l.is_paused && (
                                <span className="absolute bottom-1 left-1 bg-gray-900/70 text-gray-900 text-[7px] font-bold px-1 py-0.5 rounded">Paused</span>
                              )}
                            </div>
                            <p className="mt-1 text-[10px] font-bold text-gray-900 leading-tight line-clamp-2">{l.title}</p>
                            <p className="text-[9px] text-gray-400">{listingTypeLabel(l.listing_type)}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-3">Live preview · tap a section to edit it</p>
    </div>
  );
}

// --- Add-listing picker (searches published listings of the right type) ---

interface PickerProps {
  /** Restrict results to this listing type (discovery screens); null = any. */
  listingType: string | null;
  signatureOnly: boolean;
  existingIds: Set<string>;
  busyId: string | null;
  onAdd: (listingId: string) => void;
  onClose: () => void;
}

function AddListingPicker({ listingType, signatureOnly, existingIds, busyId, onAdd, onClose }: PickerProps) {
  const [search, setSearch] = useState('');
  // Active type tab (homepage only — discovery is already locked to one type).
  const [typeTab, setTypeTab] = useState<string>('');
  const [results, setResults] = useState<ListingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discovery screens fix the type; on the homepage the tab narrows it.
  const effectiveType = listingType ?? (typeTab || undefined);
  const grouped = !listingType && !typeTab; // show type-segregated sections

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listListings({
          status: 'published',
          search: search.trim() || undefined,
          listing_type: effectiveType,
        });
        if (!cancelled) setResults(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to search listings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, effectiveType]);

  const renderRow = (l: ListingListItem) => {
    const already = existingIds.has(l.id);
    const busy = busyId === l.id;
    return (
      <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate text-sm">{l.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', listingTypeTone(l.listing_type))}>
              {listingTypeLabel(l.listing_type)}
            </span>
            {l.city && <span className="text-[10px] text-gray-400">{l.city}</span>}
          </div>
        </div>
        <button
          onClick={() => onAdd(l.id)}
          disabled={already || busy}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
            already ? 'bg-green-50 text-green-600 cursor-default' : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300',
          )}
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : already ? <CheckCircle2 size={12} /> : <Plus size={12} />}
          {already ? 'Added' : 'Add'}
        </button>
      </div>
    );
  };

  const groups = LISTING_TYPES.map((t) => ({ type: t, items: results.filter((r) => r.listing_type === t) })).filter((g) => g.items.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative w-full max-w-2xl h-[72vh] max-h-[640px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-label="Add a listing to the section"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Add a Published Listing</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-gray-400 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings by title…"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
            />
          </div>

          {/* Type segregation — only on the homepage (discovery is single-type) */}
          {!listingType && (
            <div className="flex flex-wrap gap-1.5">
              <TypeChip label="All" active={typeTab === ''} onClick={() => setTypeTab('')} />
              {LISTING_TYPES.map((t) => (
                <TypeChip key={t} label={listingTypeLabel(t)} active={typeTab === t} onClick={() => setTypeTab(t)} />
              ))}
            </div>
          )}

          {signatureOnly ? (
            <p className="text-[11px] text-yellow-700 flex items-center gap-1">
              <Sparkles size={12} /> This section accepts only TLB Signature listings.
            </p>
          ) : listingType ? (
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <AlertCircle size={12} /> Showing published {listingType} listings only.
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {error ? (
            <EmptyState icon={AlertCircle} title="Search failed" description={error} />
          ) : loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
          ) : results.length === 0 ? (
            <EmptyState icon={Search} title="No published listings" description="Try a different search term." />
          ) : grouped ? (
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.type}>
                  <div className="flex items-center gap-1.5 px-2.5 pb-1.5">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', listingTypeTone(g.type))}>{listingTypeLabel(g.type)}</span>
                    <span className="text-[10px] font-bold text-gray-400">{g.items.length}</span>
                  </div>
                  <div className="space-y-1">{g.items.map(renderRow)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">{results.map(renderRow)}</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function TypeChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
        active ? 'bg-gray-900 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-100',
      )}
    >
      {label}
    </button>
  );
}

export default UserAppAlignment;
