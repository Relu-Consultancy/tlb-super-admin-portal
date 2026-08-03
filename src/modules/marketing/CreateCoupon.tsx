import { useState, useEffect, type ReactNode } from 'react';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    CheckCircle,
    CheckCircle2,
    X,
    Tag,
    Store,
    Building2,
    Percent,
    IndianRupee,
} from 'lucide-react';
import { motion } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import Select from '../../shared/components/ui/Select';
import { cn } from '../../shared/lib/utils';
import {
    createCoupon,
    listPartners,
    LISTING_TYPES,
    ApiError,
    type CouponInput,
    type PartnerListItem,
} from '../../shared/lib/api';

interface CreateCouponProps {
    onBack?: () => void;
    onCreated?: () => void;
}

const GENDERS = ['male', 'female', 'other'] as const;

const CreateCoupon = ({ onBack, onCreated }: CreateCouponProps) => {
    const [couponType, setCouponType] = useState<'platform' | 'partner'>('platform');
    const [partnerId, setPartnerId] = useState('');
    const [partners, setPartners] = useState<PartnerListItem[]>([]);

    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState('');
    const [maxDiscount, setMaxDiscount] = useState('');
    const [minOrder, setMinOrder] = useState('');
    const [usageLimit, setUsageLimit] = useState('');
    const [perUserLimit, setPerUserLimit] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [targetTypes, setTargetTypes] = useState<string[]>([]);
    const [targetGenders, setTargetGenders] = useState<string[]>([]);
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    // Load partners for the partner-coupon picker.
    useEffect(() => {
        listPartners().then(setPartners).catch(() => setPartners([]));
    }, []);

    const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
        setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

    const validate = (): string | null => {
        if (!code.trim()) return 'Coupon code is required.';
        if (couponType === 'partner' && !partnerId) return 'Select a partner for a partner coupon.';
        const dv = Number(discountValue);
        if (!discountValue || Number.isNaN(dv) || dv <= 0) return 'Enter a valid discount value.';
        if (discountType === 'percent' && dv > 100) return 'Percentage cannot exceed 100.';
        if (startsAt && expiresAt && new Date(expiresAt) < new Date(startsAt)) return 'Expiry must be after the start date.';
        return null;
    };

    const buildPayload = (): CouponInput => {
        const str = (v: string) => (v.trim() === '' ? undefined : v.trim());
        const int = (v: string) => (v.trim() === '' ? undefined : Number(v));
        return {
            code: code.trim().toUpperCase(),
            partner_id: couponType === 'partner' ? partnerId : undefined,
            description: description.trim() || undefined,
            is_active: isActive,
            discount_type: discountType,
            discount_value: discountValue.trim(),
            max_discount: discountType === 'percent' ? str(maxDiscount) : undefined,
            min_order_value: str(minOrder),
            usage_limit: int(usageLimit),
            per_user_limit: int(perUserLimit),
            starts_at: str(startsAt),
            expires_at: str(expiresAt),
            target_listing_types: targetTypes.length ? targetTypes : undefined,
            target_genders: targetGenders.length ? targetGenders : undefined,
            target_min_age: int(minAge),
            target_max_age: int(maxAge),
        };
    };

    const submit = async () => {
        const err = validate();
        if (err) { setFieldError(err); return; }
        setFieldError(null);
        setSubmitting(true);
        try {
            await createCoupon(buildPayload());
            setDone(true);
        } catch (e) {
            setFieldError(e instanceof ApiError ? e.message : 'Could not create the coupon.');
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="max-w-lg mx-auto py-16 text-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 mx-auto rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900">Coupon created</h1>
                <p className="text-gray-500 mt-1">
                    <span className="font-mono font-bold uppercase">{code}</span> is now {isActive ? 'active' : 'inactive'}.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button onClick={() => onCreated?.()} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all">Back to Coupons</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={20} /> Back to Coupons
            </button>

            <header>
                <h1 className="text-2xl font-bold text-gray-900">Create Coupon</h1>
                <p className="text-gray-500 text-sm">Set up a platform-wide or partner-specific discount</p>
            </header>

            {fieldError && (
                <div role="alert" className="flex items-start gap-2 text-sm rounded-xl px-4 py-3 border bg-red-50 border-red-200 text-red-700">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" /> <span className="flex-1">{fieldError}</span>
                    <button onClick={() => setFieldError(null)}><X size={16} /></button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Scope */}
                    <Card className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coupon scope</p>
                        <div className="grid grid-cols-2 gap-2">
                            <ScopeButton active={couponType === 'platform'} onClick={() => setCouponType('platform')} icon={Store} title="Platform" sub="Applies across TLB" />
                            <ScopeButton active={couponType === 'partner'} onClick={() => setCouponType('partner')} icon={Building2} title="Partner" sub="Scoped to one partner" />
                        </div>
                        {couponType === 'partner' && (
                            <Labeled label="Partner" required>
                                <Select
                                    value={partnerId}
                                    onChange={setPartnerId}
                                    placeholder="Select a partner…"
                                    variant="form"
                                    options={partners.map((p) => ({ value: p.id, label: p.business_name || p.email }))}
                                />
                            </Labeled>
                        )}
                    </Card>

                    {/* Basics */}
                    <Card className="space-y-4">
                        <Labeled label="Coupon code" required>
                            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAVE20" className={cn(inputCls, 'font-mono uppercase tracking-wider')} />
                        </Labeled>
                        <Labeled label="Description">
                            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Internal note shown to customers" className={inputCls} />
                        </Labeled>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Discount type</p>
                            <div className="grid grid-cols-2 gap-2">
                                <ScopeButton active={discountType === 'percent'} onClick={() => setDiscountType('percent')} icon={Percent} title="Percentage" sub="% off the order" compact />
                                <ScopeButton active={discountType === 'fixed'} onClick={() => setDiscountType('fixed')} icon={IndianRupee} title="Fixed" sub="Flat ₹ off" compact />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Labeled label={discountType === 'percent' ? 'Percentage (%)' : 'Amount (₹)'} required>
                                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === 'percent' ? '20' : '150'} className={inputCls} />
                            </Labeled>
                            {discountType === 'percent' && (
                                <Labeled label="Max discount (₹)">
                                    <input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="Optional cap" className={inputCls} />
                                </Labeled>
                            )}
                            <Labeled label="Min order value (₹)">
                                <input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="Optional" className={inputCls} />
                            </Labeled>
                        </div>
                    </Card>

                    {/* Targeting (optional) */}
                    <Card className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Tag size={12} /> Targeting (optional)</p>
                        <div>
                            <p className="text-[11px] text-gray-500 mb-1.5">Listing types</p>
                            <div className="flex flex-wrap gap-2">
                                {LISTING_TYPES.map((t) => <ChipToggle key={t} active={targetTypes.includes(t)} onClick={() => toggle(targetTypes, setTargetTypes, t)} label={t} />)}
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500 mb-1.5">Genders</p>
                            <div className="flex flex-wrap gap-2">
                                {GENDERS.map((g) => <ChipToggle key={g} active={targetGenders.includes(g)} onClick={() => toggle(targetGenders, setTargetGenders, g)} label={g} />)}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Labeled label="Min age"><input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} placeholder="Any" className={inputCls} /></Labeled>
                            <Labeled label="Max age"><input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} placeholder="Any" className={inputCls} /></Labeled>
                        </div>
                    </Card>
                </div>

                {/* Sidebar: schedule + status + submit */}
                <div className="space-y-6">
                    <Card className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Schedule & limits</p>
                        <Labeled label="Starts at"><input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} /></Labeled>
                        <Labeled label="Expires at"><input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} /></Labeled>
                        <Labeled label="Total usage limit"><input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" className={inputCls} /></Labeled>
                        <Labeled label="Per-user limit"><input type="number" value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} placeholder="Unlimited" className={inputCls} /></Labeled>
                        <button type="button" onClick={() => setIsActive((v) => !v)} className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium', isActive ? 'bg-green-50 border-green-200 text-gray-900' : 'bg-white border-gray-200 text-gray-500')}>
                            <CheckCircle2 size={16} className={isActive ? 'text-green-500' : 'text-gray-700'} />
                            <span className="flex-1 text-left">Active immediately</span>
                            <span className={cn('w-9 h-5 rounded-full relative transition-colors', isActive ? 'bg-green-500' : 'bg-gray-200')}>
                                <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all', isActive ? 'left-4.5' : 'left-0.5')} />
                            </span>
                        </button>
                        <button onClick={submit} disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all disabled:opacity-60">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />} Generate Coupon
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400';

function Labeled({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
            {children}
        </div>
    );
}

function ScopeButton({ active, onClick, icon: Icon, title, sub, compact }: { active: boolean; onClick: () => void; icon: typeof Store; title: string; sub: string; compact?: boolean }) {
    return (
        <button type="button" onClick={onClick} className={cn('flex items-center gap-3 p-3 rounded-xl border text-left transition-all', active ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200 hover:bg-gray-50')}>
            <div className={cn('p-2 rounded-lg', active ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 text-gray-400')}><Icon size={compact ? 16 : 18} /></div>
            <div>
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
            </div>
        </button>
    );
}

function ChipToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button type="button" onClick={onClick} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border', active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {label}
        </button>
    );
}

export default CreateCoupon;
