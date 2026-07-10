import { ArrowRight, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import { SECTIONS, type SectionId } from '../../shared/nav/sections';
import { Screen } from '../../types';

interface HubProps {
  onEnterSection: (id: SectionId) => void;
  onSelectScreen: (screen: Screen) => void;
}

const Hub = ({ onEnterSection, onSelectScreen }: HubProps) => {
  const { admin } = useAuth();
  const firstName = (admin?.full_name || admin?.email || 'Admin').split(/[ @]/)[0];
  const hour = (() => { try { return new Date().getHours(); } catch { return 9; } })();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-10">
      <header className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <p className="text-sm font-bold text-yellow-600 uppercase tracking-widest">{greeting}</p>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mt-2">
          Welcome back, <span className="text-yellow-600">{firstName}</span>
        </h1>
        <p className="text-gray-500 mt-2 text-base">Pick a workspace to get started — Customer, Partner, Admin or Support.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {SECTIONS.map((section, idx) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className={cn(
                'group relative flex flex-col rounded-2xl border border-gray-200 bg-white transition-all duration-300',
                'hover:border-gray-300 hover:bg-gray-50',
                section.accent.hover,
              )}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-yellow-400/[0.03] to-transparent" />

              <button onClick={() => onEnterSection(section.id)} className="relative text-left p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', section.accent.icon)}>
                    <Icon size={24} />
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
                    <Zap size={10} className="text-yellow-500" />
                    {section.items.length} tools
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-4 group-hover:text-yellow-600 transition-colors">{section.label}</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{section.tagline}</p>
              </button>

              <div className="px-3 pb-3 flex-1 relative">
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  {section.items.map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.screen}
                        onClick={() => onSelectScreen(item.screen)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-all group/item',
                          i < section.items.length - 1 && 'border-b border-gray-100',
                        )}
                      >
                        <ItemIcon size={15} className="text-gray-400 group-hover/item:text-yellow-600 shrink-0 transition-colors" />
                        <span className="text-sm font-medium text-gray-400 flex-1 truncate group-hover/item:text-gray-800 transition-colors">{item.label}</span>
                        <ChevronRight size={13} className="text-gray-700 group-hover/item:text-gray-400 group-hover/item:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => onEnterSection(section.id)}
                className={cn(
                  'relative flex items-center justify-between px-6 py-4 border-t border-gray-100 text-sm font-bold transition-all',
                  'text-gray-500 hover:text-yellow-600',
                )}
              >
                Open {section.label}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Hub;
