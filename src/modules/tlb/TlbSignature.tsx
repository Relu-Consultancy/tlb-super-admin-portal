import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  X,
  Eye,
  Pause,
  Play,
  Archive,
  PencilLine,
  Save,
  CheckCircle2,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
  listTlbSignature,
  getTlbSignature,
  archiveTlbSignature,
  updateTlbSignature,
  toggleTlbVisibility,
  tlbErrorMessage,
  listingTypeLabel,
  listingTypeTone,
  listingStatusLabel,
  listingStatusTone,
  LISTING_TYPES,
  TLB_STATUSES,
  ApiError,
  type TlbListItem,
  type TlbDetail,
} from '../../shared/lib/api';

interface Props {
  onCreate?: () => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

const TlbSignature = ({ onCreate }: Props) => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('MANAGE_TLB_LISTINGS');

  const [rows, setRows] = useState<TlbListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listTlbSignature({
        search: search.trim() || undefined,
        status: status || undefined,
        type: type || undefined,
      }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load TLB Signature listings.');
    } finally {
      setLoading(false);
    }
  }, [search, status, type]);

  useEffect(() => {
    if (!canManage) return;
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [canManage, load]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);

  if (!canManage) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No access"
        description="You need the Manage TLB Listings permission to view first-party listings."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles size={22} className="text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">TLB Signature Listings</h1>
            <p className="text-gray-500 text-sm">First-party listings authored by the TLB admin team.</p>
          </div>
        </div>
        <button
          onClick={() => onCreate?.()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors"
        >
          <Plus size={16} /> Create Listing
        </button>
      </header>

      {banner && (
        <div className={cn('flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium', banner.kind === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {banner.kind === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {banner.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
          <option value="">All types</option>
          {LISTING_TYPES.map((t) => <option key={t} value={t}>{listingTypeLabel(t)}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
          <option value="">All statuses</option>
          {TLB_STATUSES.map((s) => <option key={s} value={s}>{listingStatusLabel(s)}</option>)}
        </select>
      </div>

      {error ? (
        <EmptyState icon={AlertCircle} title="Couldn't load listings" description={error} />
      ) : loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Sparkles} title="No TLB Signature listings" description="Create your first first-party listing." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Created by</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-bold text-gray-900">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-yellow-500 shrink-0" />
                        {r.title}
                        {r.is_paused && <Pause size={12} className="text-orange-400 shrink-0" aria-label="Paused" />}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-[11px] font-bold', listingTypeTone(r.listing_type))}>{listingTypeLabel(r.listing_type)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-[11px] font-bold', listingStatusTone(r.status))}>{listingStatusLabel(r.status)}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{r.city || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{r.created_by_admin_email || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(r.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setDetailId(r.id)} aria-label="View details" className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AnimatePresence>
        {detailId && (
          <DetailDrawer
            id={detailId}
            onClose={() => setDetailId(null)}
            onChanged={(text) => { setBanner({ kind: 'success', text }); load(); }}
            onError={(text) => setBanner({ kind: 'error', text })}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Detail drawer (view + quick edit + pause + archive) ---

interface DrawerProps {
  id: string;
  onClose: () => void;
  onChanged: (banner: string) => void;
  onError: (banner: string) => void;
}

function DetailDrawer({ id, onClose, onChanged, onError }: DrawerProps) {
  const [data, setData] = useState<TlbDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null); // 'save' | 'pause' | 'archive'

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const d = await getTlbSignature(id);
      setData(d);
      setEdit({
        title: d.title ?? '',
        short_description: d.short_description ?? '',
        description: d.description ?? '',
        cancellation_cutoff_hours: d.cancellation_cutoff_hours != null ? String(d.cancellation_cutoff_hours) : '',
      });
    } catch (err) {
      setLoadError(err instanceof ApiError ? tlbErrorMessage(err.code, err.message) : 'Failed to load listing.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setBusy('save');
    try {
      const patch: Record<string, unknown> = {
        title: edit.title.trim(),
        short_description: edit.short_description.trim(),
        description: edit.description.trim(),
      };
      const hrs = edit.cancellation_cutoff_hours.trim();
      if (hrs !== '') patch.cancellation_cutoff_hours = Number(hrs);
      await updateTlbSignature(id, patch);
      setEditing(false);
      onChanged('Listing updated.');
      await load();
    } catch (err) {
      onError(err instanceof ApiError ? tlbErrorMessage(err.code, err.message) : 'Could not update the listing.');
    } finally {
      setBusy(null);
    }
  };

  const handlePause = async () => {
    setBusy('pause');
    try {
      await toggleTlbVisibility(id);
      onChanged(data?.is_paused ? 'Listing unpaused.' : 'Listing paused.');
      await load();
    } catch (err) {
      onError(err instanceof ApiError ? tlbErrorMessage(err.code, err.message) : 'Could not change visibility.');
    } finally {
      setBusy(null);
    }
  };

  const handleArchive = async () => {
    setBusy('archive');
    try {
      await archiveTlbSignature(id);
      onChanged('Listing archived.');
      onClose();
    } catch (err) {
      onError(err instanceof ApiError ? tlbErrorMessage(err.code, err.message) : 'Could not archive the listing.');
      setBusy(null);
    }
  };

  const isArchived = data?.status === 'archived';

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col"
        role="dialog"
        aria-label="TLB Signature listing detail"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-1.5"><Sparkles size={16} className="text-yellow-500" /> Listing Detail</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-gray-400 hover:bg-gray-50"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loadError ? (
            <EmptyState icon={AlertCircle} title="Couldn't load" description={loadError} />
          ) : loading || !data ? (
            <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('px-2 py-0.5 rounded text-[11px] font-bold', listingTypeTone(data.listing_type))}>{listingTypeLabel(data.listing_type)}</span>
                <span className={cn('px-2 py-0.5 rounded text-[11px] font-bold', listingStatusTone(data.status))}>{listingStatusLabel(data.status)}</span>
                {data.is_paused && <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-600">Paused</span>}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <EditField label="Title"><input value={edit.title} onChange={(e) => setEdit((p) => ({ ...p, title: e.target.value }))} className={editCls} /></EditField>
                  <EditField label="Short description"><input value={edit.short_description} onChange={(e) => setEdit((p) => ({ ...p, short_description: e.target.value }))} className={editCls} /></EditField>
                  <EditField label="Description"><textarea rows={4} value={edit.description} onChange={(e) => setEdit((p) => ({ ...p, description: e.target.value }))} className={editCls} /></EditField>
                  <EditField label="Cancellation cutoff (hrs)"><input type="number" value={edit.cancellation_cutoff_hours} onChange={(e) => setEdit((p) => ({ ...p, cancellation_cutoff_hours: e.target.value }))} className={editCls} /></EditField>
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={busy === 'save'} className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-60">
                      {busy === 'save' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
                    </button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-500 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{data.title}</h2>
                  {data.short_description && <p className="text-sm text-gray-500 mt-1">{data.short_description}</p>}
                  {data.description && <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{data.description}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Cancellation cutoff" value={data.cancellation_cutoff_hours != null ? `${data.cancellation_cutoff_hours} hrs` : '—'} />
                <Info label="Published" value={formatDate(data.published_at)} />
                <Info label="Created by" value={data.created_by_admin_email || '—'} />
                <Info label="Created" value={formatDate(data.created_at)} />
              </div>

              {data.details != null && <RawBlock label="Details" value={data.details} />}
              {data.media != null && <RawBlock label="Media" value={data.media} />}
            </>
          )}
        </div>

        {data && !loading && (
          <div className="border-t border-gray-200 p-4 flex flex-wrap gap-2">
            {!editing && !isArchived && (
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-gray-900 font-bold rounded-xl hover:bg-gray-800 text-sm">
                <PencilLine size={15} /> Edit
              </button>
            )}
            {!isArchived && (
              <button onClick={handlePause} disabled={busy === 'pause'} className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-sm disabled:opacity-60">
                {busy === 'pause' ? <Loader2 size={15} className="animate-spin" /> : data.is_paused ? <Play size={15} /> : <Pause size={15} />}
                {data.is_paused ? 'Unpause' : 'Pause'}
              </button>
            )}
            {!isArchived && (
              <button onClick={handleArchive} disabled={busy === 'archive'} className="inline-flex items-center gap-1.5 px-4 py-2 text-red-600 font-bold rounded-xl hover:bg-red-50 text-sm ml-auto disabled:opacity-60">
                {busy === 'archive' ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />} Archive
              </button>
            )}
            {isArchived && <span className="text-sm text-gray-400 ml-auto self-center">This listing is archived.</span>}
          </div>
        )}
      </motion.div>
    </>
  );
}

const editCls = 'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40';
function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-bold text-gray-500">{label}</span><div className="mt-1">{children}</div></label>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p><p className="text-gray-900 font-medium">{value}</p></div>;
}
function RawBlock({ label, value }: { label: string; value: unknown }) {
  let text: string;
  if (typeof value === 'string') {
    try { text = JSON.stringify(JSON.parse(value), null, 2); } catch { text = value; }
  } else {
    text = JSON.stringify(value, null, 2);
  }
  if (!text || text === '""' || text === 'null') return null;
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <pre className="text-[11px] bg-gray-50 rounded-xl p-3 overflow-x-auto text-gray-600 whitespace-pre-wrap break-words">{text}</pre>
    </div>
  );
}

export default TlbSignature;
