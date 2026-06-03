import { useMemo, useState } from 'react';
import {
    Ticket,
    Percent,
    IndianRupee,
    Tag,
    CalendarClock,
    Users,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import { ApiError, createCoupon } from '../../shared/lib/api';
import type { CouponAppliesTo, CouponDiscountType, CreateCouponInput } from '../../shared/lib/api';

interface CreateCouponProps {
    /** Navigate back to the coupons list. */
    onBack?: () => void;
    /** Called after a coupon is successfully created. */
    onCreated?: () => void;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

interface FormState {
    code: string;
    description: string;
    discountType: CouponDiscountType;
    discountValue: string;
    maxDiscount: string;
    minOrderValue: string;
    usageLimit: string;
    appliesTo: CouponAppliesTo;
    targetId: string;
    startsAt: string;
    expiresAt: string;
}

const INITIAL: FormState = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minOrderValue: '',
    usageLimit: '',
    appliesTo: 'all_events',
    targetId: '',
    startsAt: '',
    expiresAt: '',
};

const inputCls =
    'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all';
const labelCls = 'block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2';

const CreateCoupon = ({ onBack, onCreated }: CreateCouponProps) => {
    const [form, setForm] = useState<FormState>(INITIAL);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
        if (banner) setBanner(null);
    };

    const validate = (): boolean => {
        const e: FieldErrors = {};
        const code = form.code.trim();
        if (!code) e.code = 'Coupon code is required.';
        else if (!/^[A-Z0-9_-]{3,20}$/.test(code)) e.code = 'Use 3–20 chars: A–Z, 0–9, - or _.';

        const val = Number(form.discountValue);
        if (!form.discountValue.trim()) e.discountValue = 'Discount value is required.';
        else if (Number.isNaN(val) || val <= 0) e.discountValue = 'Enter a value greater than 0.';
        else if (form.discountType === 'percentage' && val > 100) e.discountValue = 'Percentage cannot exceed 100.';

        if (form.maxDiscount && Number(form.maxDiscount) <= 0) e.maxDiscount = 'Must be greater than 0.';
        if (form.minOrderValue && Number(form.minOrderValue) < 0) e.minOrderValue = 'Cannot be negative.';
        if (form.usageLimit && (!Number.isInteger(Number(form.usageLimit)) || Number(form.usageLimit) < 1))
            e.usageLimit = 'Enter a whole number ≥ 1.';

        if (form.startsAt && form.expiresAt && form.startsAt > form.expiresAt)
            e.expiresAt = 'Expiry must be after the start date.';

        if (form.appliesTo !== 'all_events' && !form.targetId.trim())
            e.targetId = form.appliesTo === 'specific_partner' ? 'Partner ID is required.' : 'Category is required.';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const buildPayload = (): CreateCouponInput => ({
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        discount_type: form.discountType,
        discount_value: Number(form.discountValue),
        max_discount: form.discountType === 'percentage' && form.maxDiscount ? Number(form.maxDiscount) : null,
        min_order_value: form.minOrderValue ? Number(form.minOrderValue) : null,
        usage_limit: form.usageLimit ? Number(form.usageLimit) : null,
        applies_to: form.appliesTo,
        target_id: form.appliesTo === 'all_events' ? null : form.targetId.trim(),
        starts_at: form.startsAt || null,
        expires_at: form.expiresAt || null,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        setBanner(null);
        try {
            await createCoupon(buildPayload());
            setBanner({ type: 'success', text: `Coupon "${form.code.trim().toUpperCase()}" created successfully.` });
            setForm(INITIAL);
            onCreated?.();
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? err.isNetworkError || err.status === 404
                        ? 'The marketing API is not connected yet. Your coupon could not be saved.'
                        : err.message
                    : 'Something went wrong while creating the coupon.';
            setBanner({ type: 'error', text: msg });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Live preview values ──
    const previewCode = form.code.trim().toUpperCase() || 'YOURCODE';
    const previewDiscount = useMemo(() => {
        const v = Number(form.discountValue);
        if (!form.discountValue || Number.isNaN(v)) return form.discountType === 'percentage' ? '0%' : '₹0';
        return form.discountType === 'percentage' ? `${v}%` : `₹${v}`;
    }, [form.discountValue, form.discountType]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                        aria-label="Back to coupons"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Coupon</h1>
                    <p className="text-gray-500 text-sm">Set up a new discount or promotional code</p>
                </div>
            </header>

            {banner && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                        banner.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                >
                    {banner.type === 'success' ? (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    ) : (
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    )}
                    <span>{banner.text}</span>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Form fields ── */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="space-y-5">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coupon Details</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Coupon Code *</label>
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={(ev) => set('code', ev.target.value.toUpperCase())}
                                    placeholder="e.g. SAVE20"
                                    className={`${inputCls} font-mono ${errors.code ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                />
                                {errors.code && <p className="text-xs text-red-500 mt-1.5">{errors.code}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Discount Type *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        { v: 'percentage' as const, label: 'Percent', icon: Percent },
                                        { v: 'fixed' as const, label: 'Fixed ₹', icon: IndianRupee },
                                    ]).map(({ v, label, icon: Icon }) => {
                                        const active = form.discountType === v;
                                        return (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => set('discountType', v)}
                                                className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-sm font-bold border transition-all ${
                                                    active
                                                        ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                                                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'
                                                }`}
                                            >
                                                <Icon size={15} /> {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Description</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(ev) => set('description', ev.target.value)}
                                placeholder="Shown to customers (optional)"
                                className={inputCls}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>
                                    {form.discountType === 'percentage' ? 'Discount % *' : 'Discount ₹ *'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.discountValue}
                                    onChange={(ev) => set('discountValue', ev.target.value)}
                                    placeholder={form.discountType === 'percentage' ? '20' : '500'}
                                    className={`${inputCls} ${errors.discountValue ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                />
                                {errors.discountValue && <p className="text-xs text-red-500 mt-1.5">{errors.discountValue}</p>}
                            </div>
                            {form.discountType === 'percentage' && (
                                <div>
                                    <label className={labelCls}>Max Discount ₹</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.maxDiscount}
                                        onChange={(ev) => set('maxDiscount', ev.target.value)}
                                        placeholder="Cap (optional)"
                                        className={`${inputCls} ${errors.maxDiscount ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                    />
                                    {errors.maxDiscount && <p className="text-xs text-red-500 mt-1.5">{errors.maxDiscount}</p>}
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="space-y-5">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rules & Limits</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Min Order Value ₹</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.minOrderValue}
                                    onChange={(ev) => set('minOrderValue', ev.target.value)}
                                    placeholder="No minimum"
                                    className={`${inputCls} ${errors.minOrderValue ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                />
                                {errors.minOrderValue && <p className="text-xs text-red-500 mt-1.5">{errors.minOrderValue}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Usage Limit</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.usageLimit}
                                    onChange={(ev) => set('usageLimit', ev.target.value)}
                                    placeholder="Unlimited"
                                    className={`${inputCls} ${errors.usageLimit ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                />
                                {errors.usageLimit && <p className="text-xs text-red-500 mt-1.5">{errors.usageLimit}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Starts On</label>
                                <input
                                    type="date"
                                    value={form.startsAt}
                                    onChange={(ev) => set('startsAt', ev.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Expires On</label>
                                <input
                                    type="date"
                                    value={form.expiresAt}
                                    onChange={(ev) => set('expiresAt', ev.target.value)}
                                    className={`${inputCls} ${errors.expiresAt ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                />
                                {errors.expiresAt && <p className="text-xs text-red-500 mt-1.5">{errors.expiresAt}</p>}
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Apply To</label>
                            <select
                                value={form.appliesTo}
                                onChange={(ev) => set('appliesTo', ev.target.value as CouponAppliesTo)}
                                className={`${inputCls} appearance-none`}
                            >
                                <option value="all_events">All Events</option>
                                <option value="specific_partner">Specific Partner</option>
                                <option value="category">Category</option>
                            </select>
                        </div>

                        {form.appliesTo !== 'all_events' && (
                            <div>
                                <label className={labelCls}>
                                    {form.appliesTo === 'specific_partner' ? 'Partner ID *' : 'Category *'}
                                </label>
                                <input
                                    type="text"
                                    value={form.targetId}
                                    onChange={(ev) => set('targetId', ev.target.value)}
                                    placeholder={form.appliesTo === 'specific_partner' ? 'Partner UUID' : 'e.g. Music'}
                                    className={`${inputCls} ${errors.targetId ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                                />
                                {errors.targetId && <p className="text-xs text-red-500 mt-1.5">{errors.targetId}</p>}
                            </div>
                        )}
                    </Card>
                </div>

                {/* ── Live preview + submit ── */}
                <div className="space-y-6">
                    <Card className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preview</h3>
                        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white overflow-hidden">
                            <Sparkles size={64} className="absolute -right-3 -top-3 text-yellow-400/20" />
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-10 h-10 bg-yellow-400/15 border border-yellow-400/30 rounded-xl flex items-center justify-center">
                                    <span className="text-sm font-black text-yellow-400">{previewDiscount}</span>
                                </div>
                                <div>
                                    <p className="font-mono font-bold tracking-wider">{previewCode}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                                        {form.discountType === 'percentage' ? 'Percentage off' : 'Flat discount'}
                                    </p>
                                </div>
                            </div>
                            {form.description && <p className="text-xs text-slate-300 mb-2">{form.description}</p>}
                            <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                    <CalendarClock size={12} /> {form.expiresAt || 'No expiry'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users size={12} /> {form.usageLimit ? `${form.usageLimit} uses` : 'Unlimited'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Tag size={12} />{' '}
                                    {form.appliesTo === 'all_events'
                                        ? 'All events'
                                        : form.appliesTo === 'specific_partner'
                                          ? 'Partner'
                                          : 'Category'}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                                    Creating…
                                </>
                            ) : (
                                <>
                                    <Ticket size={18} /> Generate Coupon
                                </>
                            )}
                        </button>
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default CreateCoupon;
