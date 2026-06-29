import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Ticket,
  Building2,
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
  createTlbEvent,
  createTlbClass,
  createTlbProgram,
  createTlbVenue,
  tlbErrorMessage,
  ApiError,
  type TlbCreateType,
  type TlbDetail,
  type TlbEventInput,
  type TlbClassInput,
  type TlbProgramInput,
  type TlbVenueInput,
} from '../../shared/lib/api';

interface Props {
  onBack?: () => void;
  onCreated?: () => void;
}

const TYPE_META: Record<TlbCreateType, { label: string; Icon: LucideIcon; blurb: string; grad: string }> = {
  event: { label: 'Event', Icon: Ticket, blurb: 'One-off or scheduled event with ticket tiers', grad: 'from-blue-400 to-indigo-500' },
  class: { label: 'Class', Icon: BookOpen, blurb: 'Recurring class with batches', grad: 'from-pink-400 to-rose-500' },
  program: { label: 'Program', Icon: GraduationCap, blurb: 'Multi-session program with batches', grad: 'from-teal-400 to-emerald-500' },
  venue: { label: 'Venue', Icon: Building2, blurb: 'Bookable venue with packages', grad: 'from-purple-400 to-fuchsia-500' },
};

// ---- helpers ----
const num = (v: unknown): number | undefined => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const str = (v: unknown): string | undefined => {
  const s = String(v ?? '').trim();
  return s || undefined;
};
/** Drop undefined/empty entries so we only send what the admin filled in. */
function clean(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  return out;
}

const CreateTlbSignature = ({ onBack, onCreated }: Props) => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('MANAGE_TLB_LISTINGS');

  const [type, setType] = useState<TlbCreateType | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<TlbDetail | null>(null);

  const set = (key: string, value: string) => setF((prev) => ({ ...prev, [key]: value }));

  const pickType = (t: TlbCreateType) => {
    setType(t);
    setF({});
    setError(null);
    // Seed one empty nested row.
    setRows([{}]);
  };

  const reset = () => { setType(null); setF({}); setRows([]); setCreated(null); setError(null); };

  const setRow = (i: number, key: string, value: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const addRow = () => setRows((prev) => [...prev, {}]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const baseInput = () =>
    clean({
      title: str(f.title) ?? '',
      short_description: str(f.short_description),
      description: str(f.description),
      cancellation_cutoff_hours: num(f.cancellation_cutoff_hours),
      category_id: num(f.category_id),
      subcategory_id: num(f.subcategory_id),
      terms_and_conditions: str(f.terms_and_conditions),
    });

  const submit = async () => {
    if (!type) return;
    if (!str(f.title)) { setError('A title is required.'); return; }
    if (type === 'event' && !rows.some((r) => str(r.name))) { setError('Add at least one ticket type.'); return; }

    setSubmitting(true);
    setError(null);
    try {
      let result: TlbDetail;
      if (type === 'event') {
        const payload = {
          ...baseInput(),
          format: str(f.format),
          start_datetime: str(f.start_datetime),
          end_datetime: str(f.end_datetime),
          registration_deadline: str(f.registration_deadline),
          mode: str(f.mode),
          city: str(f.city),
          area: str(f.area),
          address: str(f.address),
          meeting_link: str(f.meeting_link),
          price_type: str(f.price_type),
          capacity: num(f.capacity),
          age_group: (num(f.min_age) != null || num(f.max_age) != null)
            ? { type: 'static', min_age: num(f.min_age) ?? 0, max_age: num(f.max_age) ?? 0 }
            : undefined,
          tickets: rows.filter((r) => str(r.name)).map((r) => clean({
            name: str(r.name) ?? '',
            price: str(r.price) ?? '0',
            total_quantity: num(r.total_quantity) ?? 0,
            description: str(r.description),
            is_default: r.is_default === 'true',
          })),
        };
        result = await createTlbEvent(clean(payload) as unknown as TlbEventInput);
      } else if (type === 'class') {
        const payload = {
          ...baseInput(),
          mode: str(f.mode),
          min_age: num(f.min_age),
          max_age: num(f.max_age),
          city: str(f.city),
          area: str(f.area),
          address: str(f.address),
          meeting_link: str(f.meeting_link),
          price: str(f.price),
          tags: str(f.tags) ? str(f.tags)!.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
          teaser_video_url: str(f.teaser_video_url),
          booking_type: str(f.booking_type),
          is_live: f.is_live === 'true' ? true : undefined,
          batches: rows.filter((r) => str(r.name)).map((r) => clean({
            name: str(r.name) ?? '',
            days: str(r.days) ? str(r.days)!.split(',').map((d) => d.trim()).filter(Boolean) : [],
            start_date: str(r.start_date),
            start_time: str(r.start_time),
            end_time: str(r.end_time),
            capacity: num(r.capacity) ?? 0,
          })),
        };
        result = await createTlbClass(clean(payload) as unknown as TlbClassInput);
      } else if (type === 'program') {
        const payload = {
          ...baseInput(),
          program_format: str(f.program_format),
          delivery_mode: str(f.delivery_mode),
          city: str(f.city),
          area: str(f.area),
          address: str(f.address),
          meeting_link: str(f.meeting_link),
          latitude: str(f.latitude),
          longitude: str(f.longitude),
          min_age: num(f.min_age),
          max_age: num(f.max_age),
          max_capacity: num(f.max_capacity),
          total_hours: num(f.total_hours),
          module_count: num(f.module_count),
          booking_type: str(f.booking_type),
          batches: rows.filter((r) => str(r.name)).map((r) => clean({
            name: str(r.name) ?? '',
            start_date: str(r.start_date),
            end_date: str(r.end_date),
            start_time: str(r.start_time),
            end_time: str(r.end_time),
            fee: str(r.fee) ?? '0',
            total_seats: num(r.total_seats) ?? 0,
            days: str(r.days) ? str(r.days)!.split(',').map((d) => d.trim()).filter(Boolean) : [],
          })),
        };
        result = await createTlbProgram(clean(payload) as unknown as TlbProgramInput);
      } else {
        const payload = {
          ...baseInput(),
          location_type: str(f.location_type),
          city: str(f.city),
          area: str(f.area),
          address: str(f.address),
          latitude: str(f.latitude),
          longitude: str(f.longitude),
          min_age: num(f.min_age),
          max_age: num(f.max_age),
          min_capacity: num(f.min_capacity),
          max_capacity: num(f.max_capacity),
          booking_type: str(f.booking_type),
          packages: rows.filter((r) => str(r.name)).map((r) => clean({
            name: str(r.name) ?? '',
            price: str(r.price) ?? '0',
            description: str(r.description),
            duration_minutes: num(r.duration_minutes) ?? 0,
            max_guests: num(r.max_guests) ?? 0,
          })),
        };
        result = await createTlbVenue(clean(payload) as unknown as TlbVenueInput);
      }
      setCreated(result);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : null;
      const msg = err instanceof ApiError ? err.message : 'Could not create the listing.';
      setError(tlbErrorMessage(code, msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <AlertCircle size={40} className="mb-3 opacity-40" />
        <h2 className="text-lg font-bold text-gray-500">No access</h2>
        <p className="text-sm">You need the Manage TLB Listings permission to create listings.</p>
      </div>
    );
  }

  if (created) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">TLB Signature listing created</h2>
        <p className="text-gray-500 text-sm mt-1">“{created.title}” was created as a draft.</p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={reset} className="px-5 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-300">Create another</button>
          <button onClick={() => onCreated?.()} className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800">Back to TLB Signature</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to TLB Signature</span>
      </button>

      <header className="flex items-center gap-2">
        <Sparkles size={22} className="text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create TLB Signature Listing</h1>
          <p className="text-gray-500 text-sm">Author a first-party listing. It is created as a draft.</p>
        </div>
      </header>

      {!type ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(TYPE_META) as TlbCreateType[]).map((t) => {
            const m = TYPE_META[t];
            return (
              <button
                key={t}
                onClick={() => pickType(t)}
                className="text-left rounded-2xl border border-gray-100 bg-white p-5 hover:border-yellow-300 hover:shadow-sm transition-all"
              >
                <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', m.grad)}>
                  <m.Icon size={22} className="text-white" />
                </div>
                <p className="font-bold text-gray-900">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.blurb}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center', TYPE_META[type].grad)}>
                {(() => { const I = TYPE_META[type].Icon; return <I size={18} className="text-white" />; })()}
              </span>
              <span className="font-bold text-gray-900">New {TYPE_META[type].label}</span>
            </div>
            <button onClick={() => setType(null)} className="text-xs font-bold text-gray-400 hover:text-gray-700">Change type</button>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-700">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Common details */}
          <Card className="space-y-4">
            <SectionTitle>Details</SectionTitle>
            <Field label="Title" required>
              <Text value={f.title} onChange={(v) => set('title', v)} placeholder="Listing title" />
            </Field>
            <Field label="Short description">
              <Text value={f.short_description} onChange={(v) => set('short_description', v)} placeholder="One-line summary" />
            </Field>
            <Field label="Description">
              <Area value={f.description} onChange={(v) => set('description', v)} placeholder="Full description" />
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Category ID"><Text type="number" value={f.category_id} onChange={(v) => set('category_id', v)} /></Field>
              <Field label="Subcategory ID"><Text type="number" value={f.subcategory_id} onChange={(v) => set('subcategory_id', v)} /></Field>
              <Field label="Cancellation cutoff (hrs)"><Text type="number" value={f.cancellation_cutoff_hours} onChange={(v) => set('cancellation_cutoff_hours', v)} /></Field>
            </div>
            <Field label="Terms & conditions">
              <Area value={f.terms_and_conditions} onChange={(v) => set('terms_and_conditions', v)} placeholder="Terms" />
            </Field>
          </Card>

          {/* Type-specific */}
          <Card className="space-y-4">
            <SectionTitle>{TYPE_META[type].label} specifics</SectionTitle>
            {type === 'event' && <EventFields f={f} set={set} />}
            {type === 'class' && <ClassFields f={f} set={set} />}
            {type === 'program' && <ProgramFields f={f} set={set} />}
            {type === 'venue' && <VenueFields f={f} set={set} />}
          </Card>

          {/* Nested rows */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle>{NESTED_LABEL[type]}</SectionTitle>
              <button onClick={addRow} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-900 text-white hover:bg-gray-800">
                <Plus size={14} /> Add
              </button>
            </div>
            {rows.length === 0 ? (
              <p className="text-sm text-gray-400">No {NESTED_LABEL[type].toLowerCase()} added yet.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((r, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3 relative">
                    <button onClick={() => removeRow(i)} aria-label="Remove row" className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                    {type === 'event' && <TicketRow r={r} on={(k, v) => setRow(i, k, v)} />}
                    {type === 'class' && <ClassBatchRow r={r} on={(k, v) => setRow(i, k, v)} />}
                    {type === 'program' && <ProgramBatchRow r={r} on={(k, v) => setRow(i, k, v)} />}
                    {type === 'venue' && <PackageRow r={r} on={(k, v) => setRow(i, k, v)} />}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex items-center justify-end gap-3">
            <button onClick={onBack} className="px-5 py-2.5 text-gray-500 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Create {TYPE_META[type].label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NESTED_LABEL: Record<TlbCreateType, string> = {
  event: 'Ticket Types',
  class: 'Batches',
  program: 'Batches',
  venue: 'Packages',
};

// ---- shared field primitives ----
function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-bold text-gray-900">{children}</h3>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-500">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
const inputCls = 'w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40';
function Text({ value, onChange, placeholder, type = 'text' }: { value?: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />;
}
function Area({ value, onChange, placeholder }: { value?: string; onChange: (v: string) => void; placeholder?: string }) {
  return <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={inputCls} />;
}
interface Option { value: string; label: string }
function Select({ value, onChange, options, placeholder = 'Select…' }: { value?: string; onChange: (v: string) => void; options: Option[]; placeholder?: string }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// Fixed-option value sets surfaced as dropdowns.
const MODE_OPTIONS: Option[] = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
];
const BOOKING_TYPE_OPTIONS: Option[] = [
  { value: 'enquiry', label: 'Enquiry' },
  { value: 'booking', label: 'Booking' },
];
const YES_NO: Option[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

type FieldsProps = { f: Record<string, string>; set: (k: string, v: string) => void };

function EventFields({ f, set }: FieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Format"><Text value={f.format} onChange={(v) => set('format', v)} /></Field>
      <Field label="Mode"><Select value={f.mode} onChange={(v) => set('mode', v)} options={MODE_OPTIONS} /></Field>
      <Field label="Start"><Text type="datetime-local" value={f.start_datetime} onChange={(v) => set('start_datetime', v)} /></Field>
      <Field label="End"><Text type="datetime-local" value={f.end_datetime} onChange={(v) => set('end_datetime', v)} /></Field>
      <Field label="Registration deadline"><Text type="datetime-local" value={f.registration_deadline} onChange={(v) => set('registration_deadline', v)} /></Field>
      <Field label="Price type"><Text value={f.price_type} onChange={(v) => set('price_type', v)} /></Field>
      <Field label="Capacity"><Text type="number" value={f.capacity} onChange={(v) => set('capacity', v)} /></Field>
      <Field label="City"><Text value={f.city} onChange={(v) => set('city', v)} /></Field>
      <Field label="Area"><Text value={f.area} onChange={(v) => set('area', v)} /></Field>
      <Field label="Address"><Text value={f.address} onChange={(v) => set('address', v)} /></Field>
      <Field label="Meeting link"><Text value={f.meeting_link} onChange={(v) => set('meeting_link', v)} /></Field>
      <Field label="Min age"><Text type="number" value={f.min_age} onChange={(v) => set('min_age', v)} /></Field>
      <Field label="Max age"><Text type="number" value={f.max_age} onChange={(v) => set('max_age', v)} /></Field>
    </div>
  );
}
function ClassFields({ f, set }: FieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Mode"><Select value={f.mode} onChange={(v) => set('mode', v)} options={MODE_OPTIONS} /></Field>
      <Field label="Price"><Text value={f.price} onChange={(v) => set('price', v)} placeholder="0.00" /></Field>
      <Field label="Booking type"><Select value={f.booking_type} onChange={(v) => set('booking_type', v)} options={BOOKING_TYPE_OPTIONS} /></Field>
      <Field label="Live class"><Select value={f.is_live} onChange={(v) => set('is_live', v)} options={YES_NO} placeholder="Not set" /></Field>
      <Field label="Tags (comma-separated)"><Text value={f.tags} onChange={(v) => set('tags', v)} /></Field>
      <Field label="Teaser video URL"><Text value={f.teaser_video_url} onChange={(v) => set('teaser_video_url', v)} /></Field>
      <Field label="City"><Text value={f.city} onChange={(v) => set('city', v)} /></Field>
      <Field label="Area"><Text value={f.area} onChange={(v) => set('area', v)} /></Field>
      <Field label="Address"><Text value={f.address} onChange={(v) => set('address', v)} /></Field>
      <Field label="Meeting link"><Text value={f.meeting_link} onChange={(v) => set('meeting_link', v)} /></Field>
      <Field label="Min age"><Text type="number" value={f.min_age} onChange={(v) => set('min_age', v)} /></Field>
      <Field label="Max age"><Text type="number" value={f.max_age} onChange={(v) => set('max_age', v)} /></Field>
    </div>
  );
}
function ProgramFields({ f, set }: FieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Program format"><Text value={f.program_format} onChange={(v) => set('program_format', v)} /></Field>
      <Field label="Delivery mode"><Select value={f.delivery_mode} onChange={(v) => set('delivery_mode', v)} options={MODE_OPTIONS} /></Field>
      <Field label="City"><Text value={f.city} onChange={(v) => set('city', v)} /></Field>
      <Field label="Area"><Text value={f.area} onChange={(v) => set('area', v)} /></Field>
      <Field label="Address"><Text value={f.address} onChange={(v) => set('address', v)} /></Field>
      <Field label="Meeting link"><Text value={f.meeting_link} onChange={(v) => set('meeting_link', v)} /></Field>
      <Field label="Latitude"><Text value={f.latitude} onChange={(v) => set('latitude', v)} /></Field>
      <Field label="Longitude"><Text value={f.longitude} onChange={(v) => set('longitude', v)} /></Field>
      <Field label="Min age"><Text type="number" value={f.min_age} onChange={(v) => set('min_age', v)} /></Field>
      <Field label="Max age"><Text type="number" value={f.max_age} onChange={(v) => set('max_age', v)} /></Field>
      <Field label="Max capacity"><Text type="number" value={f.max_capacity} onChange={(v) => set('max_capacity', v)} /></Field>
      <Field label="Total hours"><Text type="number" value={f.total_hours} onChange={(v) => set('total_hours', v)} /></Field>
      <Field label="Module count"><Text type="number" value={f.module_count} onChange={(v) => set('module_count', v)} /></Field>
      <Field label="Booking type"><Select value={f.booking_type} onChange={(v) => set('booking_type', v)} options={BOOKING_TYPE_OPTIONS} /></Field>
    </div>
  );
}
function VenueFields({ f, set }: FieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Location type"><Text value={f.location_type} onChange={(v) => set('location_type', v)} /></Field>
      <Field label="Booking type"><Select value={f.booking_type} onChange={(v) => set('booking_type', v)} options={BOOKING_TYPE_OPTIONS} /></Field>
      <Field label="City"><Text value={f.city} onChange={(v) => set('city', v)} /></Field>
      <Field label="Area"><Text value={f.area} onChange={(v) => set('area', v)} /></Field>
      <Field label="Address"><Text value={f.address} onChange={(v) => set('address', v)} /></Field>
      <Field label="Latitude"><Text value={f.latitude} onChange={(v) => set('latitude', v)} /></Field>
      <Field label="Longitude"><Text value={f.longitude} onChange={(v) => set('longitude', v)} /></Field>
      <Field label="Min age"><Text type="number" value={f.min_age} onChange={(v) => set('min_age', v)} /></Field>
      <Field label="Max age"><Text type="number" value={f.max_age} onChange={(v) => set('max_age', v)} /></Field>
      <Field label="Min capacity"><Text type="number" value={f.min_capacity} onChange={(v) => set('min_capacity', v)} /></Field>
      <Field label="Max capacity"><Text type="number" value={f.max_capacity} onChange={(v) => set('max_capacity', v)} /></Field>
    </div>
  );
}

type RowProps = { r: Record<string, string>; on: (k: string, v: string) => void };
function TicketRow({ r, on }: RowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pr-6">
      <Field label="Name"><Text value={r.name} onChange={(v) => on('name', v)} /></Field>
      <Field label="Price"><Text value={r.price} onChange={(v) => on('price', v)} placeholder="0.00" /></Field>
      <Field label="Quantity"><Text type="number" value={r.total_quantity} onChange={(v) => on('total_quantity', v)} /></Field>
      <Field label="Default"><Select value={r.is_default} onChange={(v) => on('is_default', v)} options={YES_NO} placeholder="Not set" /></Field>
      <Field label="Description"><Text value={r.description} onChange={(v) => on('description', v)} /></Field>
    </div>
  );
}
function ClassBatchRow({ r, on }: RowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pr-6">
      <Field label="Name"><Text value={r.name} onChange={(v) => on('name', v)} /></Field>
      <Field label="Days (comma-sep)"><Text value={r.days} onChange={(v) => on('days', v)} placeholder="Mon, Wed" /></Field>
      <Field label="Capacity"><Text type="number" value={r.capacity} onChange={(v) => on('capacity', v)} /></Field>
      <Field label="Start date"><Text type="date" value={r.start_date} onChange={(v) => on('start_date', v)} /></Field>
      <Field label="Start time"><Text type="time" value={r.start_time} onChange={(v) => on('start_time', v)} /></Field>
      <Field label="End time"><Text type="time" value={r.end_time} onChange={(v) => on('end_time', v)} /></Field>
    </div>
  );
}
function ProgramBatchRow({ r, on }: RowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pr-6">
      <Field label="Name"><Text value={r.name} onChange={(v) => on('name', v)} /></Field>
      <Field label="Fee"><Text value={r.fee} onChange={(v) => on('fee', v)} placeholder="0.00" /></Field>
      <Field label="Total seats"><Text type="number" value={r.total_seats} onChange={(v) => on('total_seats', v)} /></Field>
      <Field label="Days (comma-sep)"><Text value={r.days} onChange={(v) => on('days', v)} /></Field>
      <Field label="Start date"><Text type="date" value={r.start_date} onChange={(v) => on('start_date', v)} /></Field>
      <Field label="End date"><Text type="date" value={r.end_date} onChange={(v) => on('end_date', v)} /></Field>
      <Field label="Start time"><Text type="time" value={r.start_time} onChange={(v) => on('start_time', v)} /></Field>
      <Field label="End time"><Text type="time" value={r.end_time} onChange={(v) => on('end_time', v)} /></Field>
    </div>
  );
}
function PackageRow({ r, on }: RowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pr-6">
      <Field label="Name"><Text value={r.name} onChange={(v) => on('name', v)} /></Field>
      <Field label="Price"><Text value={r.price} onChange={(v) => on('price', v)} placeholder="0.00" /></Field>
      <Field label="Duration (min)"><Text type="number" value={r.duration_minutes} onChange={(v) => on('duration_minutes', v)} /></Field>
      <Field label="Max guests"><Text type="number" value={r.max_guests} onChange={(v) => on('max_guests', v)} /></Field>
      <Field label="Description"><Text value={r.description} onChange={(v) => on('description', v)} /></Field>
    </div>
  );
}

export default CreateTlbSignature;
