import { ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import { SECTIONS, type SectionId } from '../../shared/nav/sections';
import { Screen } from '../../types';

interface HubProps {
  onEnterSection: (id: SectionId) => void;
  onSelectScreen: (screen: Screen) => void;
}

/**
 * The post-login landing. Presents the portal as three workspaces —
 * Customer, Partner, Admin — each listing the features it contains.
 */
const Hub = ({ onEnterSection, onSelectScreen }: HubProps) => {
  const { admin } = useAuth();
  const firstName = (admin?.full_name || admin?.email || 'Admin').split(/[ @]/)[0];
  const hour = (() => { try { return new Date().getHours(); } catch { return 9; } })();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-bold text-yellow-600 uppercase tracking-wider">{greeting}</p>
        <h1 className="text-3xl font-black text-gray-900 mt-1">Welcome back, {firstName}</h1>
        <p className="text-gray-500 mt-1.5">Pick a workspace to get started — Customer, Partner or Admin.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {SECTIONS.map((section, idx) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.06 }}
              className={cn(
                'group flex flex-col rounded-3xl border border-gray-100 bg-white shadow-sm transition-all',
                section.accent.hover,
              )}
            >
              {/* Card header — enters the section */}
              <button onClick={() => onEnterSection(section.id)} className="text-left p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', section.accent.icon)}>
                    <Icon size={28} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-300">{section.items.length} tools</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-4">{section.label}</h2>
                <p className="text-sm text-gray-500 mt-1">{section.tagline}</p>
              </button>

              {/* Feature list */}
              <div className="px-3 pb-3 flex-1">
                <div className={cn('rounded-2xl p-1.5', section.accent.soft)}>
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.screen}
                        onClick={() => onSelectScreen(item.screen)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white transition-colors group/item"
                      >
                        <ItemIcon size={16} className="text-gray-500 shrink-0" />
                        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{item.label}</span>
                        <ChevronRight size={14} className="text-gray-300 group-hover/item:text-gray-500 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer — enter section */}
              <button
                onClick={() => onEnterSection(section.id)}
                className={cn('flex items-center justify-between px-6 py-4 border-t border-gray-50 text-sm font-bold', section.accent.text)}
              >
                Open {section.label}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Hub;
