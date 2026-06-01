import { useState } from 'react';
import {
    Users,
    CheckCircle,
    CreditCard,
    MessageSquare,
    ChevronRight,
    ArrowLeft,
    Calendar,
    MapPin,
    ShieldCheck,
    FileText,
} from 'lucide-react';
import { motion } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';

interface EventItem {
    id: string;
    status: string;
    title: string;
    partner: string;
    date: string;
}

// Empty until the events API is wired.
const EVENTS: EventItem[] = [];

const EventApproval = () => {
    const [activeTab, setActiveTab] = useState('Pending List');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    if (selectedEvent) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedEvent(null)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to List
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-0 overflow-hidden">
                            <img src="https://picsum.photos/seed/event/800/400" className="w-full h-64 object-cover" alt="" />
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="text-3xl font-bold text-gray-900">{selectedEvent.title}</h1>
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full uppercase tracking-wider">Draft</span>
                                        </div>
                                        <p className="text-gray-500">Partner: <span className="text-blue-500 font-medium">{selectedEvent.partner}</span></p>
                                    </div>
                                    <div className="bg-yellow-50 border border-yellow-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                                        <ShieldCheck className="text-yellow-600" size={18} />
                                        <span className="text-sm font-bold text-yellow-700">Quality Score: {selectedEvent.qualityScore}%</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700">
                                        <Calendar size={16} className="text-gray-400" /> {selectedEvent.date}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700">
                                        <Users size={16} className="text-gray-400" /> Ages {selectedEvent.ages}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700">
                                        <MapPin size={16} className="text-gray-400" /> {selectedEvent.location}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileText size={18} className="text-yellow-500" /> Description</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        Experience the ultimate celebration of sound at the {selectedEvent.title}. Featuring three days of non-stop performances from world-class artists, immersive art installations, and a curated selection of gourmet food stalls.
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                                        <li>Main stage with 4k visuals</li>
                                        <li>Interactive workshops</li>
                                        <li>Eco-friendly camping grounds</li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard size={18} className="text-yellow-500" /> Pricing Tiers</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Early Bird</p>
                                            <p className="text-xl font-bold text-yellow-600">$149.00</p>
                                            <p className="text-[10px] text-gray-400">Available until July 1</p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">VIP Pass</p>
                                            <p className="text-xl font-bold text-yellow-600">$399.00</p>
                                            <p className="text-[10px] text-gray-400">Includes lounge access</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={18} className="text-yellow-500" /> Venue & Seat Layout</h3>
                            <div className="aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200">
                                <div className="w-16 h-10 border-2 border-yellow-400 rounded-lg flex items-center justify-center mb-4">
                                    <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Interactive Seat Layout Active</p>
                                <p className="text-[10px] text-gray-400">Venue: Olympic Park Stadium</p>
                            </div>
                            <button className="w-full mt-4 text-xs font-bold text-yellow-600 hover:text-yellow-700">Enlarge Map</button>
                        </Card>

                        <Card className="bg-green-50/50 border-green-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-green-600" /> Content Review Check</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Image Resolution', value: '4K Optimized' },
                                    { label: 'Description Keywords', value: '8/10 matched' },
                                    { label: 'Accessibility Tags', value: 'Complete' },
                                ].map((check, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">{check.label}</span>
                                        <span className="font-bold text-green-600">{check.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-green-100">
                                <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">Passed</span>
                            </div>
                        </Card>

                        <Card className="space-y-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2"><MessageSquare size={18} className="text-yellow-500" /> Review Feedback</h3>
                            <textarea
                                placeholder="Enter rejection reason or requested changes here..."
                                className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                            />
                            <div className="space-y-3">
                                <button className="w-full py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 transition-all">
                                    Approve & Go Live
                                </button>
                                <button className="w-full py-3 bg-white border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors">
                                    Reject with Feedback
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Approve Event</h1>
                <div className="flex border-b border-gray-100">
                    {['Pending List', 'Review Details'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-3 text-sm font-medium transition-all relative",
                                activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab}
                            {activeTab === tab && <motion.div layoutId="eventTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EVENTS.length === 0 && (
                    <Card className="md:col-span-2 lg:col-span-3">
                        <EmptyState
                            icon={Calendar}
                            title="No events yet"
                            description="Events submitted for approval will appear here once the events API is connected."
                        />
                    </Card>
                )}
                {EVENTS.map((event) => (
                    <Card key={event.id} className="p-0 overflow-hidden group cursor-pointer" onClick={() => setSelectedEvent(event)}>
                        <div className="relative h-48 overflow-hidden">
                            <img src={`https://picsum.photos/seed/${event.id}/400/300`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                            <div className="absolute top-4 right-4 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-gray-900 shadow-sm">
                                {event.status}
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">{event.title}</h3>
                                <p className="text-xs text-gray-400">Partner: {event.partner}</p>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar size={14} /> {event.date}
                                </div>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default EventApproval;
