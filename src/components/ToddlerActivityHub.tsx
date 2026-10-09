import React, { useState, useMemo } from 'react';
import {
  TODDLER_ACTIVITIES,
  DATA_SOURCES_INFO,
  ActivityItem,
  ActivityScheduleSlot,
  ReviewSource,
  DataSourceHub,
} from '../data/toddlerActivitiesData';
import {
  DEFAULT_ZIP,
  getZipLocationInfo,
  calculateDynamicDistance,
  POPULAR_NEARBY_ZIPS,
} from '../utils/geoUtils';
import { playKeyClick, playSuccessChime, playBeep } from '../utils/audio';

interface ToddlerActivityHubProps {
  onBack?: () => void;
}

export type CategoryFilter = 'all' | 'swimming' | 'gymnastics' | 'dance' | 'ballet' | 'sensory';
export type SortOption =
  | 'closest'
  | 'highest_rated'
  | 'price_low'
  | 'price_high'
  | 'availability'
  | 'tutu_match';
export type AgeFilterMode = 'target' | 'bracket' | 'range';
export type AgeBracketKey = 'all' | 'baby' | 'toddler' | 'preschool' | 'elementary' | 'tween' | 'teen';

interface AgeBracketOption {
  id: AgeBracketKey;
  label: string;
  sub: string;
  icon: string;
  minYears: number;
  maxYears: number;
}

const AGE_BRACKETS: AgeBracketOption[] = [
  { id: 'all', label: 'All Ages', sub: 'Kids 0 – 17 Yrs', icon: '🌟', minYears: 0, maxYears: 18 },
  { id: 'baby', label: 'Babies & Infants', sub: '0 – 18 Months', icon: '🍼', minYears: 0, maxYears: 1.5 },
  { id: 'toddler', label: 'Toddlers', sub: '1.5 – 3.5 Years', icon: '🧸', minYears: 1.5, maxYears: 3.5 },
  { id: 'preschool', label: 'Preschool & Pre-K', sub: '3 – 5.5 Years', icon: '🎨', minYears: 3.0, maxYears: 5.5 },
  { id: 'elementary', label: 'Elementary School', sub: '5.5 – 9 Years', icon: '🎒', minYears: 5.5, maxYears: 9.0 },
  { id: 'tween', label: 'Tweens & Pre-Teens', sub: '9 – 12.5 Years', icon: '🛹', minYears: 9.0, maxYears: 12.5 },
  { id: 'teen', label: 'Teens & High School', sub: '12.5 – 17 Years', icon: '🚀', minYears: 12.5, maxYears: 18 },
];

export const ToddlerActivityHub: React.FC<ToddlerActivityHubProps> = ({ onBack }) => {
  // Zip Code Origin & Location State (Anchored to 95131 by default)
  const [originZip, setOriginZip] = useState<string>(DEFAULT_ZIP);
  const [zipInput, setZipInput] = useState<string>(DEFAULT_ZIP);
  const [isEditingZip, setIsEditingZip] = useState<boolean>(false);
  const [zipFeedbackMsg, setZipFeedbackMsg] = useState<string | null>(null);

  // Age Filtering State (Universal for any parents with kids of any age)
  const [ageFilterMode, setAgeFilterMode] = useState<AgeFilterMode>('bracket');
  const [selectedBracket, setSelectedBracket] = useState<AgeBracketKey>('all'); // All ages by default
  const [targetAgeYears, setTargetAgeYears] = useState<number | 'all'>('all');
  const [minAgeYears, setMinAgeYears] = useState<number>(0);
  const [maxAgeYears, setMaxAgeYears] = useState<number>(17);

  // Studio Style Matcher Filter State (Tutu School benchmark)
  const [onlyTutuSimilar, setOnlyTutuSimilar] = useState<boolean>(false);
  const [showTutuGuideModal, setShowTutuGuideModal] = useState<boolean>(false);

  // Other Filters & State
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('closest');
  const [onlyFreeTrials, setOnlyFreeTrials] = useState<boolean>(false);
  const [onlyAvailableSpots, setOnlyAvailableSpots] = useState<boolean>(false);
  const [maxDistance, setMaxDistance] = useState<number>(30); // 30-mile radius default
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [showSourcesModal, setShowSourcesModal] = useState<boolean>(false);
  const [activeActivity, setActiveActivity] = useState<ActivityItem | null>(null);

  // Reservation Flow Modal State
  const [reservingActivity, setReservingActivity] = useState<ActivityItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ActivityScheduleSlot | null>(null);
  const [childName, setChildName] = useState<string>('');
  const [childAge, setChildAge] = useState<string>(
    targetAgeYears !== 'all' ? `${targetAgeYears} Years Old` : ''
  );
  const [parentEmail, setParentEmail] = useState<string>('eric.huon@gmail.com');
  const [reservationConfirmed, setReservationConfirmed] = useState<boolean>(false);

  // Location info for active origin zip
  const originLocationInfo = useMemo(() => {
    return getZipLocationInfo(originZip);
  }, [originZip]);

  // Count of Tutu-similar style facilities
  const tutuSimilarCount = useMemo(() => {
    return TODDLER_ACTIVITIES.filter((a) => a.isTutuSimilar).length;
  }, []);

  // Handle Zip Code Submission
  const handleApplyZipCode = (newZipCandidate: string) => {
    const cleaned = newZipCandidate.trim().replace(/\D/g, '').slice(0, 5);
    if (cleaned.length !== 5) {
      playBeep();
      setZipFeedbackMsg('Please enter a valid 5-digit US Zip Code (e.g. 95131)');
      return;
    }

    playKeyClick();
    setOriginZip(cleaned);
    setZipInput(cleaned);
    setIsEditingZip(false);

    const info = getZipLocationInfo(cleaned);
    if (info.isKnown) {
      setZipFeedbackMsg(`Centered on ${info.name}`);
    } else {
      setZipFeedbackMsg(`Custom Zip Code ${cleaned} applied`);
    }

    setTimeout(() => {
      setZipFeedbackMsg(null);
    }, 4000);
  };

  // Reset Zip Code back to default 95131
  const handleResetToDefaultZip = () => {
    playKeyClick();
    setOriginZip(DEFAULT_ZIP);
    setZipInput(DEFAULT_ZIP);
    setIsEditingZip(false);
    setZipFeedbackMsg('Reset back to default Zip 95131 (North San Jose / Berryessa)');
    setTimeout(() => {
      setZipFeedbackMsg(null);
    }, 3500);
  };

  // Reset Age back to "All Ages"
  const handleResetToAllAges = () => {
    playKeyClick();
    setAgeFilterMode('bracket');
    setSelectedBracket('all');
    setTargetAgeYears('all');
    setMinAgeYears(0);
    setMaxAgeYears(17);
    setChildAge('');
  };

  // Filtered & Distance-Calculated Activities
  const filteredActivities = useMemo(() => {
    return TODDLER_ACTIVITIES.filter((item) => {
      // Tutu School style similarity filter
      if (onlyTutuSimilar && !item.isTutuSimilar) {
        return false;
      }

      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Free trial filter
      if (onlyFreeTrials && !item.hasFreeTrial) {
        return false;
      }

      // Dynamic distance filter from user's active originZip
      const dynamicDist = calculateDynamicDistance(
        originZip,
        item.location.zipCode,
        item.location.distanceMiles
      );
      if (dynamicDist > maxDistance) {
        return false;
      }

      // Universal Age Filtering Logic
      if (ageFilterMode === 'bracket') {
        if (selectedBracket !== 'all') {
          const bracket = AGE_BRACKETS.find((b) => b.id === selectedBracket);
          if (bracket) {
            const minMonths = bracket.minYears * 12;
            const maxMonths = bracket.maxYears * 12;
            // Overlap check
            if (item.minAgeMonths > maxMonths || item.maxAgeMonths < minMonths) {
              return false;
            }
          }
        }
      } else if (ageFilterMode === 'target') {
        if (targetAgeYears !== 'all') {
          const targetMonths = targetAgeYears * 12;
          if (targetMonths < item.minAgeMonths || targetMonths > item.maxAgeMonths) {
            return false;
          }
        }
      } else if (ageFilterMode === 'range') {
        const minMonths = minAgeYears * 12;
        const maxMonths = maxAgeYears * 12;
        if (item.minAgeMonths > maxMonths || item.maxAgeMonths < minMonths) {
          return false;
        }
      }

      // Source Platform Filter
      if (selectedSourceFilter !== 'all') {
        const matchesRegistration =
          item.registrationPlatform.toLowerCase().includes(selectedSourceFilter.toLowerCase());
        const matchesSourceList = item.sourcePlatforms.some((sp) =>
          sp.toLowerCase().includes(selectedSourceFilter.toLowerCase())
        );
        if (!matchesRegistration && !matchesSourceList) {
          return false;
        }
      }

      // Day of week match in schedule slots
      if (selectedDay !== 'all') {
        const hasMatchingSlot = item.scheduleSlots.some((slot) => {
          if (selectedDay === 'weekend') return slot.dayOfWeek === 'Sat' || slot.dayOfWeek === 'Sun';
          if (selectedDay === 'weekday') return slot.dayOfWeek !== 'Sat' && slot.dayOfWeek !== 'Sun';
          return slot.dayOfWeek.toLowerCase() === selectedDay.toLowerCase();
        });
        if (!hasMatchingSlot) return false;
      }

      // Available spots filter
      if (onlyAvailableSpots) {
        const hasOpenSpots = item.scheduleSlots.some(
          (slot) => slot.status === 'available' || slot.status === 'few_spots'
        );
        if (!hasOpenSpots) return false;
      }

      // Search query match (smart keyword, facility, location, tutu reasons)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesFacility = item.facility.toLowerCase().includes(q);
        const matchesCity = item.location.city.toLowerCase().includes(q);
        const matchesCategory = item.categoryLabel.toLowerCase().includes(q);
        const matchesAddress = item.location.address.toLowerCase().includes(q);
        const matchesTutuReason = item.tutuSimilarityReasons?.some((r) =>
          r.toLowerCase().includes(q)
        );
        const matchesTutuKeyword =
          (q.includes('tutu') || q.includes('similar') || q.includes('storybook')) &&
          item.isTutuSimilar;

        if (
          !matchesTitle &&
          !matchesFacility &&
          !matchesCity &&
          !matchesCategory &&
          !matchesAddress &&
          !matchesTutuReason &&
          !matchesTutuKeyword
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortOption === 'tutu_match') {
        return (b.tutuSimilarityScore || 0) - (a.tutuSimilarityScore || 0);
      }
      if (sortOption === 'closest') {
        const distA = calculateDynamicDistance(originZip, a.location.zipCode, a.location.distanceMiles);
        const distB = calculateDynamicDistance(originZip, b.location.zipCode, b.location.distanceMiles);
        return distA - distB;
      }
      if (sortOption === 'highest_rated') {
        return b.ratingSummary.compositeScore - a.ratingSummary.compositeScore;
      }
      if (sortOption === 'price_low') {
        return a.pricePerClass - b.pricePerClass;
      }
      if (sortOption === 'price_high') {
        return b.pricePerClass - a.pricePerClass;
      }
      if (sortOption === 'availability') {
        const aOpen = a.scheduleSlots.reduce((acc, s) => acc + s.spotsLeft, 0);
        const bOpen = b.scheduleSlots.reduce((acc, s) => acc + s.spotsLeft, 0);
        return bOpen - aOpen;
      }
      return 0;
    });
  }, [
    onlyTutuSimilar,
    selectedCategory,
    selectedDay,
    sortOption,
    onlyFreeTrials,
    onlyAvailableSpots,
    maxDistance,
    selectedSourceFilter,
    searchQuery,
    originZip,
    ageFilterMode,
    selectedBracket,
    targetAgeYears,
    minAgeYears,
    maxAgeYears,
  ]);

  // Open reservation modal
  const handleStartReservation = (activity: ActivityItem, defaultSlot?: ActivityScheduleSlot) => {
    playKeyClick();
    setReservingActivity(activity);
    const availableSlot =
      defaultSlot ||
      activity.scheduleSlots.find((s) => s.status === 'available' || s.status === 'few_spots') ||
      activity.scheduleSlots[0];
    setSelectedSlot(availableSlot);
    setReservationConfirmed(false);
  };

  // Confirm reservation
  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccessChime();
    setReservationConfirmed(true);
  };

  // Generate .ics calendar download
  const handleDownloadCalendar = () => {
    if (!reservingActivity || !selectedSlot) return;
    playKeyClick();

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Kids Activity Hub//Activity Calendar//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${reservingActivity.title} - ${reservingActivity.facility}
DESCRIPTION:Class reservation for ${childName || 'Student'} (${childAge || 'Youth'}). Instructor: ${selectedSlot.instructor}. Platform: ${reservingActivity.registrationPlatform}. Address: ${reservingActivity.location.address}. Direct Link: ${reservingActivity.registrationUrl}
LOCATION:${reservingActivity.location.address}, ${reservingActivity.location.city}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reservingActivity.title.replace(/\s+/g, '_')}_class.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active age filter summary text
  const activeAgeLabel = useMemo(() => {
    if (ageFilterMode === 'bracket') {
      const b = AGE_BRACKETS.find((item) => item.id === selectedBracket);
      return b ? b.label : 'All Ages';
    }
    if (ageFilterMode === 'target') {
      return targetAgeYears === 'all' ? 'All Ages' : `Age ${targetAgeYears}`;
    }
    return `Ages ${minAgeYears} – ${maxAgeYears}`;
  }, [ageFilterMode, selectedBracket, targetAgeYears, minAgeYears, maxAgeYears]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-900/40 backdrop-blur-md relative overflow-hidden shadow-lg">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>&larr;</span>
                  <span>Projects</span>
                </button>
              )}
              <span className="text-xs font-mono text-pink-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                <span>PROJECT #3 &bull; BAY AREA YOUTH &amp; KIDS ACTIVITY HUB</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>Kids &amp; Youth Activity Hub</span>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-pink-950/80 border border-pink-700/60 text-pink-300">
                {activeAgeLabel}
              </span>
              {onlyTutuSimilar && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-pink-500 text-slate-950 shadow-sm animate-pulse">
                  ✨ Tutu Style Match Active
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
              Real-time activity aggregator pooling verified swimming, gymnastics, dance,
              ballet, martial arts, STEM, and creative programs for kids of <strong>any age (infants to teens)</strong> centered at{' '}
              <strong className="text-white">Zip Code {originZip} ({originLocationInfo.city})</strong> across a{' '}
              <strong className="text-white">{maxDistance}-mile radius</strong>. Includes multi-platform reviews
              (Google, Yelp, Winnie, ActivityHero, Sawyer), live seat availability, transparent pricing, and direct booking links.
            </p>
          </div>

          {/* Quick Metrics Bar & Sources Modal Launcher */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                playKeyClick();
                setShowSourcesModal(true);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-pink-500/40 text-pink-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm group"
            >
              <span className="text-base">🌐</span>
              <div className="text-left font-mono">
                <div className="text-[10px] text-pink-400 font-bold group-hover:underline">DATA SOURCES (9)</div>
                <div className="text-[11px] text-slate-300">How classes are pooled &rarr;</div>
              </div>
            </button>

            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-400">ORIGIN ZIP</div>
                <div className="text-white font-bold text-sm">
                  {originZip} {originZip === DEFAULT_ZIP && <span className="text-pink-400 text-xs">★</span>}
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400">MATCHES</div>
                <div className="text-pink-400 font-bold text-sm">{filteredActivities.length} Classes</div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400">RADIUS</div>
                <div className="text-emerald-400 font-bold text-sm">&le; {maxDistance} Mi</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Studio Style & Philosophy Benchmark Spotlight Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/70 via-purple-950/50 to-slate-900 border border-pink-700/60 shadow-md relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-xl shrink-0">
              🩰
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Studio Philosophy Matcher:
                </span>
                <span className="text-xs font-bold text-pink-200 bg-pink-950 px-2.5 py-0.5 rounded-full border border-pink-600/70 font-mono flex items-center gap-1.5">
                  <span>Tutu School Benchmark (Milpitas)</span>
                  <span className="text-slate-400 font-normal">(2.4 mi &bull; 95035)</span>
                </span>
                <span className="text-[10px] text-pink-300 bg-pink-950/70 border border-pink-700/60 px-2 py-0.5 rounded-full font-mono font-medium">
                  Storybook Early Childhood Ballet
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Looking for programs similar to Tutu School’s signature style? We match studios sharing this methodology: <strong>Storybook Ballet</strong> (fairy tale themes like Swan Lake &amp; Nutcracker), <strong>loaner tutus &amp; silk scarves</strong>, <strong>gentle non-competitive showcases (Bravo! Bash)</strong>, and <strong>low 5:1 student-teacher ratios</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => {
                playKeyClick();
                setOnlyTutuSimilar(!onlyTutuSimilar);
                if (!onlyTutuSimilar) {
                  setSortOption('tutu_match');
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                onlyTutuSimilar
                  ? 'bg-pink-500 text-slate-950 ring-2 ring-pink-300 shadow-md'
                  : 'bg-pink-900/60 hover:bg-pink-800 border border-pink-500/80 text-pink-200 hover:text-white'
              }`}
            >
              <span>{onlyTutuSimilar ? '✓' : '✨'}</span>
              <span>
                {onlyTutuSimilar
                  ? `Filtering: ${filteredActivities.length} Matching Studios`
                  : `Filter Studios Like Tutu School (${tutuSimilarCount})`}
              </span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setShowTutuGuideModal(true);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-pink-900/80 text-pink-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>ℹ️</span>
              <span>Why These Match</span>
            </button>
          </div>
        </div>
      </div>

      {/* Origin Location & Radius Control Bar (Editable Zip Code) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">📍</span>
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Origin Location:
            </span>

            {/* Editable Zip Code Form / Pill */}
            {!isEditingZip ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playKeyClick();
                    setIsEditingZip(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-pink-950/90 border border-pink-700 text-pink-200 font-bold hover:bg-pink-900 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm group"
                  title="Click to edit Zip Code"
                >
                  <span className="text-sm font-mono">{originZip}</span>
                  <span className="text-[10px] text-pink-400 underline font-normal group-hover:text-white">
                    (Edit)
                  </span>
                </button>

                <span className="text-slate-300 font-medium">
                  &bull; {originLocationInfo.name}
                </span>

                {originZip !== DEFAULT_ZIP && (
                  <button
                    onClick={handleResetToDefaultZip}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-pink-300 hover:text-white border border-pink-900/50 text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                    title="Reset origin back to 95131"
                  >
                    <span>↺</span>
                    <span>Reset to 95131</span>
                  </button>
                )}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleApplyZipCode(zipInput);
                }}
                className="flex items-center gap-2 flex-wrap"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={zipInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setZipInput(val);
                      if (val.length === 5) {
                        handleApplyZipCode(val);
                      }
                    }}
                    placeholder="e.g. 95131"
                    maxLength={5}
                    autoFocus
                    className="w-24 px-2 py-1 rounded-lg bg-slate-950 border border-pink-500 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-pink-400 text-center font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-slate-950 font-bold transition-colors cursor-pointer text-xs"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playKeyClick();
                    setZipInput(originZip);
                    setIsEditingZip(false);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <span className="text-[10px] text-slate-400">
                  (Default is 95131 &bull; type 5 digits or choose preset below)
                </span>
              </form>
            )}
          </div>

          {/* Quick Distance Radius Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase mr-1">Search Radius:</span>
            {[5, 10, 15, 20, 30].map((dist) => (
              <button
                key={dist}
                onClick={() => {
                  playKeyClick();
                  setMaxDistance(dist);
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                  maxDistance === dist
                    ? 'bg-pink-500 text-slate-950 font-bold border-pink-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {dist} mi {dist === 30 ? '(Full 30mi)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback message if zip was just updated */}
        {zipFeedbackMsg && (
          <div className="text-[11px] text-pink-300 bg-pink-950/40 border border-pink-800/40 px-3 py-1 rounded-lg flex items-center justify-between">
            <span>✨ {zipFeedbackMsg} — Driving distances &amp; sorting recalculated in real-time.</span>
            <button
              onClick={() => setZipFeedbackMsg(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Popular Nearby Bay Area Zip Code Preset Chips */}
        <div className="pt-2 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0">
            Quick Switch Zip:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {POPULAR_NEARBY_ZIPS.map((pz) => {
              const isCurrent = originZip === pz.zip;
              return (
                <button
                  key={pz.zip}
                  onClick={() => {
                    handleApplyZipCode(pz.zip);
                  }}
                  className={`px-2 py-0.5 rounded-md border text-[10px] font-mono transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-pink-500/20 border-pink-500 text-pink-200 font-bold shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title={`${pz.city} (${pz.zip})`}
                >
                  <span className="font-semibold">{pz.zip}</span>
                  <span className="text-slate-500 ml-1">({pz.city})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* UNIVERSAL CHILD AGE SEARCH FILTER (FOR KIDS OF ANY AGE) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">👶</span>
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Child Age Search Filter:
            </span>

            {/* Mode Toggle: Age Brackets vs Target Exact Age vs Custom Range */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px]">
              <button
                onClick={() => {
                  playKeyClick();
                  setAgeFilterMode('bracket');
                }}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  ageFilterMode === 'bracket'
                    ? 'bg-pink-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Age Brackets
              </button>
              <button
                onClick={() => {
                  playKeyClick();
                  setAgeFilterMode('target');
                }}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  ageFilterMode === 'target'
                    ? 'bg-pink-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Exact Age (0–17)
              </button>
              <button
                onClick={() => {
                  playKeyClick();
                  setAgeFilterMode('range');
                }}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  ageFilterMode === 'range'
                    ? 'bg-pink-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Custom Range
              </button>
            </div>

            {/* Reset to All Ages button */}
            {(selectedBracket !== 'all' || targetAgeYears !== 'all' || minAgeYears !== 0 || maxAgeYears !== 17) && (
              <button
                onClick={handleResetToAllAges}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-pink-300 hover:text-white border border-pink-900/50 text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                title="Reset to All Ages"
              >
                <span>↺</span>
                <span>Show All Ages</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            Active Filter: <strong className="text-pink-300">{activeAgeLabel}</strong>
          </div>
        </div>

        {/* 1. Age Bracket Preset Mode */}
        {ageFilterMode === 'bracket' && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {AGE_BRACKETS.map((br) => {
              const isSelected = selectedBracket === br.id;
              return (
                <button
                  key={br.id}
                  onClick={() => {
                    playKeyClick();
                    setSelectedBracket(br.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-pink-500 text-slate-950 font-bold border-pink-400 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span>{br.icon}</span>
                  <span className="font-semibold">{br.label}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                    ({br.sub})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Target Exact Age Selector (0.5 to 16 Years) */}
        {ageFilterMode === 'target' && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 uppercase mr-1">Select Single Age:</span>
              <button
                onClick={() => {
                  playKeyClick();
                  setTargetAgeYears('all');
                }}
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono cursor-pointer ${
                  targetAgeYears === 'all'
                    ? 'bg-pink-500 text-slate-950 font-bold border-pink-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Any Age
              </button>
              {[
                { val: 0.5, label: '6 mo' },
                { val: 1.0, label: '1 yr' },
                { val: 2.0, label: '2 yr' },
                { val: 3.0, label: '3 yr' },
                { val: 4.0, label: '4 yr' },
                { val: 5.0, label: '5 yr' },
                { val: 6.0, label: '6 yr' },
                { val: 7.0, label: '7 yr' },
                { val: 8.0, label: '8 yr' },
                { val: 9.0, label: '9 yr' },
                { val: 10.0, label: '10 yr' },
                { val: 11.0, label: '11 yr' },
                { val: 12.0, label: '12 yr' },
                { val: 13.0, label: '13 yr' },
                { val: 14.0, label: '14 yr' },
                { val: 15.0, label: '15+ yr' },
              ].map((opt) => {
                const isSelected = targetAgeYears === opt.val;
                return (
                  <button
                    key={String(opt.val)}
                    onClick={() => {
                      playKeyClick();
                      setTargetAgeYears(opt.val);
                      setChildAge(`${opt.val} Years Old`);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pink-500 text-slate-950 font-bold border-pink-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Custom Min – Max Range Mode */}
        {ageFilterMode === 'range' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase">Min Age:</span>
              <select
                value={minAgeYears}
                onChange={(e) => {
                  playKeyClick();
                  const newMin = parseFloat(e.target.value);
                  setMinAgeYears(newMin);
                  if (newMin > maxAgeYears) setMaxAgeYears(newMin);
                }}
                className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-pink-500 focus:outline-none cursor-pointer"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((age) => (
                  <option key={age} value={age}>
                    {age === 0 ? 'Infant (0 yr)' : `${age} Years`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase">Max Age:</span>
              <select
                value={maxAgeYears}
                onChange={(e) => {
                  playKeyClick();
                  const newMax = parseFloat(e.target.value);
                  setMaxAgeYears(newMax);
                  if (newMax < minAgeYears) setMinAgeYears(newMax);
                }}
                className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-pink-500 focus:outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((age) => (
                  <option key={age} value={age}>
                    {age} Years
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-400">
              Active window: <strong className="text-white">{minAgeYears} to {maxAgeYears} Years</strong> (overlap matching enabled)
            </div>
          </div>
        )}
      </div>

      {/* Primary Category Quick Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="uppercase tracking-wider font-semibold text-slate-300">
            Activity Disciplines:
          </span>
          <span className="text-[11px] text-slate-500">
            Filter by sport, performing art, or creative workshop
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'all', label: 'All Activities', icon: '🌟', count: TODDLER_ACTIVITIES.length },
            {
              id: 'swimming',
              label: 'Swimming',
              icon: '🏊‍♂️',
              count: TODDLER_ACTIVITIES.filter((a) => a.category === 'swimming').length,
            },
            {
              id: 'gymnastics',
              label: 'Gymnastics & Parkour',
              icon: '🤸‍♀️',
              count: TODDLER_ACTIVITIES.filter((a) => a.category === 'gymnastics').length,
            },
            {
              id: 'ballet',
              label: 'Ballet',
              icon: '🩰',
              count: TODDLER_ACTIVITIES.filter((a) => a.category === 'ballet').length,
            },
            {
              id: 'dance',
              label: 'Dance & Hip Hop',
              icon: '💃',
              count: TODDLER_ACTIVITIES.filter((a) => a.category === 'dance').length,
            },
            {
              id: 'sensory',
              label: 'Art, STEM & Clay',
              icon: '🎨',
              count: TODDLER_ACTIVITIES.filter((a) => a.category === 'sensory').length,
            },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  playKeyClick();
                  setSelectedCategory(cat.id as CategoryFilter);
                }}
                className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-pink-950/40 border-pink-500/80 ring-1 ring-pink-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{cat.icon}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-pink-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </div>
                <div className="mt-2">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isSelected ? 'text-pink-300' : 'text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {cat.id === 'swimming'
                      ? 'Water Safety to Team'
                      : cat.id === 'gymnastics'
                      ? 'Tumbling to Parkour'
                      : cat.id === 'ballet'
                      ? 'Storybook to Pointe'
                      : cat.id === 'dance'
                      ? 'Creative to Hip Hop'
                      : cat.id === 'sensory'
                      ? 'Robotics & Ceramics'
                      : 'All Disciplines'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Search & Filtering Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider">
              Search Classes / Studios
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Calphin, Tutu, robotics, swim team..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-slate-500 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider">
              Sort Results By
            </label>
            <select
              value={sortOption}
              onChange={(e) => {
                playKeyClick();
                setSortOption(e.target.value as SortOption);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-pink-500 text-xs cursor-pointer"
            >
              <option value="closest">📍 Closest Distance (from Zip {originZip})</option>
              <option value="tutu_match">✨ Tutu School Similarity Match % (High to Low)</option>
              <option value="highest_rated">★ Highest Rated (Multi-Source Score)</option>
              <option value="price_low">💲 Price: Low to High</option>
              <option value="price_high">💎 Price: High to Low</option>
              <option value="availability">⚡ Most Available Open Spots</option>
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider">
              Class Schedule Day
            </label>
            <select
              value={selectedDay}
              onChange={(e) => {
                playKeyClick();
                setSelectedDay(e.target.value);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-pink-500 text-xs cursor-pointer"
            >
              <option value="all">Any Day of the Week</option>
              <option value="weekend">🎉 Weekend Only (Sat / Sun)</option>
              <option value="weekday">📅 Weekdays Only (Mon – Fri)</option>
              <option value="mon">Monday</option>
              <option value="tue">Tuesday</option>
              <option value="wed">Wednesday</option>
              <option value="thu">Thursday</option>
              <option value="fri">Friday</option>
              <option value="sat">Saturday</option>
              <option value="sun">Sunday</option>
            </select>
          </div>

          {/* Source Platform Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider">
              Booking Platform / Source
            </label>
            <select
              value={selectedSourceFilter}
              onChange={(e) => {
                playKeyClick();
                setSelectedSourceFilter(e.target.value);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-pink-500 text-xs cursor-pointer"
            >
              <option value="all">All 9 Aggregated Sources</option>
              <option value="Sawyer">Sawyer (Tutu School, Kindermusik)</option>
              <option value="iClassPro">iClassPro (Airborne, Goldfish, Twisters)</option>
              <option value="Mindbody">Mindbody (San Jose Dance Theatre, CSC)</option>
              <option value="CivicRec">CivicRec / City Rec (Milpitas, Berryessa CC)</option>
              <option value="ActivityHero">ActivityHero (Direct bookings)</option>
              <option value="Direct Studio">Direct Studio Portal (Calphin, SCSC)</option>
            </select>
          </div>
        </div>

        {/* Quick Toggles: Tutu Similar, Open Spots & Free Trial */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <button
            onClick={() => {
              playKeyClick();
              setOnlyTutuSimilar(!onlyTutuSimilar);
              if (!onlyTutuSimilar) {
                setSortOption('tutu_match');
              }
            }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 ${
              onlyTutuSimilar
                ? 'bg-pink-600 border-pink-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-950 border-pink-900/60 text-pink-300 hover:text-white hover:border-pink-500'
            }`}
          >
            <span>{onlyTutuSimilar ? '✓' : '✨'}</span>
            <span>Similar to Tutu School ({tutuSimilarCount})</span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setOnlyAvailableSpots(!onlyAvailableSpots);
            }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 ${
              onlyAvailableSpots
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>{onlyAvailableSpots ? '✓' : '+'}</span>
            <span>Has Immediate Open Spots</span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setOnlyFreeTrials(!onlyFreeTrials);
            }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 ${
              onlyFreeTrials
                ? 'bg-pink-950/60 border-pink-500 text-pink-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>{onlyFreeTrials ? '✓' : '+'}</span>
            <span>Offers Free Trial / Demo</span>
          </button>

          <div className="ml-auto text-slate-400 text-[11px] flex items-center gap-2">
            <span>
              Showing <strong className="text-white">{filteredActivities.length}</strong> matching activities
            </span>
            <button
              onClick={() => setShowSourcesModal(true)}
              className="text-pink-400 hover:text-pink-300 underline font-mono text-[10px] cursor-pointer"
            >
              (View Sources)
            </button>
          </div>
        </div>
      </div>

      {/* Activity Cards Grid */}
      {filteredActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredActivities.map((act) => {
            const dynamicDist = calculateDynamicDistance(
              originZip,
              act.location.zipCode,
              act.location.distanceMiles
            );
            const nextSlot =
              act.scheduleSlots.find((s) => s.status === 'available' || s.status === 'few_spots') ||
              act.scheduleSlots[0];

            return (
              <div
                key={act.id}
                className="p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 group backdrop-blur-md relative bg-slate-900/70 border-slate-800 hover:border-slate-700"
              >
                {/* Header & Badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                          {act.categoryLabel}
                        </span>

                        {act.badge && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-800/80 text-pink-300">
                            {act.badge}
                          </span>
                        )}

                        {act.isTutuSimilar && (
                          <button
                            onClick={() => {
                              playKeyClick();
                              setShowTutuGuideModal(true);
                            }}
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-900/80 hover:bg-pink-800 border border-pink-400 text-pink-100 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="Click to view why this studio is similar to Tutu School"
                          >
                            <span>✨</span>
                            <span>{act.tutuSimilarityScore}% Tutu Style</span>
                          </button>
                        )}

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700 flex items-center gap-1">
                          <span>📍</span>
                          <span>{dynamicDist} mi from {originZip}</span>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-pink-300 transition-colors">
                        {act.title}
                      </h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-medium">{act.facility}</span>
                        <span>&bull;</span>
                        <span>{act.location.city}</span>
                        <span className="text-slate-500">({act.location.neighborhood})</span>
                      </div>
                    </div>

                    {/* Composite Rating Pill */}
                    <div className="shrink-0 text-right bg-slate-950/80 border border-slate-800 p-2 rounded-xl font-mono">
                      <div className="text-emerald-400 font-bold text-base flex items-center justify-end gap-1">
                        <span>★</span>
                        <span>{act.ratingSummary.compositeScore.toFixed(1)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {act.ratingSummary.totalReviews} parent reviews
                      </div>
                    </div>
                  </div>

                  {/* Multi-Platform Verified Ratings Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                    {act.ratingSummary.sources.map((src) => (
                      <span
                        key={src.platform}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1"
                        title={`${src.platform}: ${src.rating}★ (${src.reviewCount} reviews) - "${src.highlight}"`}
                      >
                        <span className="font-semibold text-white">{src.platform}:</span>
                        <span className="text-yellow-400 font-bold">{src.rating}★</span>
                        <span className="text-[10px] text-slate-500">({src.reviewCount})</span>
                      </span>
                    ))}
                  </div>

                  {/* Tutu Similarity Profile Box (if matching) */}
                  {act.isTutuSimilar && act.tutuSimilarityReasons && (
                    <div className="p-2.5 rounded-xl bg-pink-950/30 border border-pink-800/40 text-[11px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-pink-300 font-bold text-[10px]">
                        <span className="flex items-center gap-1">
                          <span>🌸</span>
                          <span>TUTU SCHOOL SIMILARITY PROFILE:</span>
                        </span>
                        <button
                          onClick={() => {
                            playKeyClick();
                            setShowTutuGuideModal(true);
                          }}
                          className="text-pink-400 hover:text-white underline text-[10px] cursor-pointer"
                        >
                          How it matches &rarr;
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {act.tutuSimilarityReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-950/70 border border-pink-900/40 text-pink-200 text-[10px]"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pooled Sources Platform Badges */}
                  <div className="flex items-center gap-1 pt-0.5 text-[10px] font-mono text-slate-400">
                    <span className="text-slate-500">Pooled via:</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-pink-300">
                      {act.registrationPlatform}
                    </span>
                    {act.sourcePlatforms
                      .filter((sp) => sp !== act.registrationPlatform)
                      .slice(0, 2)
                      .map((sp, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                          {sp}
                        </span>
                      ))}
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {act.description}
                  </p>

                  {/* Highlights / Features Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                      Ratio: <strong className="text-white">{act.studentTeacherRatio}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-pink-950/60 border border-pink-800/40 text-pink-200">
                      Age: <strong className="text-white">{act.ageRange}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                      {act.parentParticipation}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                      {act.location.facilityType}
                    </span>
                  </div>
                </div>

                {/* Pricing & Availability Panel */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  {/* Prices breakdown */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">PRICING</span>
                      <span className="text-base font-bold text-white">
                        ${act.pricePerClass}
                        <span className="text-xs font-normal text-slate-400"> / class</span>
                      </span>
                      {act.monthlyTuition && (
                        <span className="text-[10px] text-slate-400 ml-2">
                          (${act.monthlyTuition}/mo)
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">NEXT SESSION</span>
                      <span className="text-xs font-semibold text-slate-200">
                        {nextSlot ? `${nextSlot.dayOfWeek} ${nextSlot.startTime}` : 'Weekly'}
                      </span>
                      {nextSlot && (
                        <div
                          className={`text-[10px] font-bold ${
                            nextSlot.spotsLeft <= 2
                              ? 'text-amber-400 animate-pulse'
                              : 'text-emerald-400'
                          }`}
                        >
                          {nextSlot.spotsLeft > 0
                            ? `⚡ ${nextSlot.spotsLeft} seats remaining`
                            : 'Waitlist Open'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Free trial note badge */}
                  {act.hasFreeTrial && act.freeTrialNote && (
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-[11px] text-emerald-300 flex items-center gap-1.5 font-mono">
                      <span>🎁</span>
                      <span>{act.freeTrialNote}</span>
                    </div>
                  )}

                  {/* Actions: Direct Booking & Details Modal */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleStartReservation(act, nextSlot)}
                      className="flex-1 py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 active:bg-pink-700 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>⚡</span>
                      <span>Reserve Spot ({nextSlot?.dayOfWeek || 'Now'})</span>
                    </button>

                    <button
                      onClick={() => {
                        playKeyClick();
                        setActiveActivity(act);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
                      title="View all parent reviews, curriculum & direct studio link"
                    >
                      <span>Details &amp; Links &rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="text-4xl">🔍</div>
          <h3 className="text-lg font-bold text-white">No activities match your current filter criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try expanding your search radius (currently {maxDistance} miles from Zip {originZip}), adjusting child age bracket (currently {activeAgeLabel}),
            or turning off the specific &quot;Similar to Tutu School&quot; filter.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                playKeyClick();
                setOnlyTutuSimilar(false);
                setMaxDistance(30);
                setSelectedCategory('all');
                setSelectedDay('all');
                setSelectedSourceFilter('all');
                setOnlyFreeTrials(false);
                setOnlyAvailableSpots(false);
                setSearchQuery('');
                handleResetToAllAges();
                handleResetToDefaultZip();
              }}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Reset All Filters (All Ages &bull; 95131 &bull; 30mi)
            </button>
          </div>
        </div>
      )}

      {/* TUTU SCHOOL SIMILARITY GUIDE MODAL */}
      {showTutuGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-pink-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowTutuGuideModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-xl cursor-pointer p-1"
            >
              &times;
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono text-pink-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span>🩰</span>
                <span>TUTU SCHOOL BENCHMARK &bull; STUDIO SIMILARITY &amp; REPUTATION INTELLIGENCE</span>
              </span>
              <h3 className="text-2xl font-bold text-white">
                How We Identify Facilities Similar to Tutu School
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                <a
                  href="https://tutuschool.com/milpitas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 underline font-bold"
                >
                  Tutu School Milpitas
                </a>{' '}
                (1794 N Milpitas Blvd &bull; ~2.4 mi from 95131) represents a distinct boutique early-childhood movement philosophy. Below is the comparative profile we use to curate and rank kindred studios in the Bay Area.
              </p>
            </div>

            {/* The 5 Pillars of Tutu School's Methodology */}
            <div className="space-y-3 font-mono">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1.5">
                The 5 Defining Criteria of the &quot;Tutu School Model&quot;:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-pink-900/50 space-y-1">
                  <div className="font-bold text-pink-300 flex items-center gap-1.5">
                    <span>1.</span>
                    <span>Storybook &amp; Fairytale Curriculum</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Classes are structured around classical ballets (Swan Lake, Sleeping Beauty, Coppélia, Cinderella). Children learn musical phrasing, dramatic mime, and arabesques through stories rather than mechanical drills.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-pink-900/50 space-y-1">
                  <div className="font-bold text-pink-300 flex items-center gap-1.5">
                    <span>2.</span>
                    <span>Boutique Early Childhood Setting</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Intimate chandelier decor, child-safe hardwood, and loaner dress-up tutus and silk scarves. Designed specifically for early childhood (18mo–5yr), not an afterthought in a massive multi-genre dance facility.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-pink-900/50 space-y-1">
                  <div className="font-bold text-pink-300 flex items-center gap-1.5">
                    <span>3.</span>
                    <span>Gentle &amp; Non-Competitive</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Purely process-over-product. Confidence, body joy, and social ease. End-of-term &quot;Bravo! Bash&quot; studio celebrations with zero expensive mandatory costumes or stage anxiety.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-pink-900/50 space-y-1">
                  <div className="font-bold text-pink-300 flex items-center gap-1.5">
                    <span>4.</span>
                    <span>Low Student-Teacher Ratio (5:1)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Strict caps of 5–8 children per class ensure personal attention, soothing of toddler separation anxiety, and playful encouragement throughout the 45-minute lesson.
                  </p>
                </div>
              </div>
            </div>

            {/* Clusters of Similar Studios Available in Search */}
            <div className="space-y-3 font-mono text-xs">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1.5">
                Kindred Facilities in Your {maxDistance}-Mile Radius ({originZip}):
              </h4>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                  <span className="text-xl">🌸</span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">
                      Official Tutu School Locations (100% Match)
                    </div>
                    <p className="text-[11px] text-slate-300">
                      <strong>Tutu School Milpitas</strong> (2.4 mi), <strong>Tutu School Willow Glen</strong> (7.6 mi), <strong>Tutu School Sunnyvale</strong> (11.2 mi), and <strong>Tutu School Saratoga</strong> (14.8 mi). Identical curriculum, membership reciprocity, and loaner tutus.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                  <span className="text-xl">🎀</span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">
                      Dedicated Early Childhood Dance Academies (92% &ndash; 94% Match)
                    </div>
                    <p className="text-[11px] text-slate-300">
                      <strong>Small Fry Dance Club</strong> (Peninsula &bull; dedicated toddler &amp; preschool dance club) &amp; <strong>West Valley Dance Co &quot;Tiny Toes &amp; Tutu Tots&quot;</strong> (San Jose &bull; fairy wands, ribbons, and low-stress showcases).
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                  <span className="text-xl">🩰</span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">
                      Classical Pre-Ballet Traditions with Gentle Tracks (85% &ndash; 88% Match)
                    </div>
                    <p className="text-[11px] text-slate-300">
                      <strong>Dance Academy USA &quot;Twinkle Toes&quot;</strong> (Cupertino &bull; dedicated preschool wing with wand props) &amp; <strong>San Jose Dance Theatre &quot;First Steps&quot;</strong> (Downtown SJ &bull; Nutcracker heritage with gentle storybook movement).
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                  <span className="text-xl">🎵</span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">
                      Sensory, Scarf &amp; Ribbon Movement Complements (80% &ndash; 82% Match)
                    </div>
                    <p className="text-[11px] text-slate-300">
                      <strong>Kindermusik at Campbell CC</strong> (silk scarves, bells &amp; classical storytelling) &amp; <strong>Berryessa Community Center &quot;Tiny Dancers&quot;</strong> (2.4 mi away &bull; subsidized municipal ribbon dancing).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
              <button
                onClick={() => {
                  playKeyClick();
                  setOnlyTutuSimilar(true);
                  setSortOption('tutu_match');
                  setShowTutuGuideModal(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <span>✨</span>
                <span>Apply Filter: Show All 12 Matched Studios</span>
              </button>

              <button
                onClick={() => setShowTutuGuideModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer text-center"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA SOURCES & MULTI-PLATFORM AGGREGATOR MODAL */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative font-mono">
            <button
              onClick={() => setShowSourcesModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-xl cursor-pointer p-1"
            >
              &times;
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono text-pink-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span>🌐</span>
                <span>TRANSPARENT ACTIVITY AGGREGATOR ENGINE</span>
              </span>
              <h3 className="text-2xl font-bold text-white">
                How Classes &amp; Reviews Are Aggregated
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rather than relying on a single closed directory, the Youth &amp; Kids Activity Hub pulls directly
                from 9 major Bay Area youth booking systems, municipal portals, and verified parent review engines.
              </p>
            </div>

            <div className="space-y-3">
              {DATA_SOURCES_INFO.map((src) => (
                <div
                  key={src.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{src.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-950 border border-pink-800 text-pink-300">
                      {src.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{src.description}</p>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900 text-slate-400">
                    <span>
                      Coverage in 95131: <strong className="text-emerald-400">{src.coverageIn95131}</strong>
                    </span>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:underline"
                    >
                      Visit Platform &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowSourcesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Sources
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY DETAILS & VERIFIED REVIEWS MODAL */}
      {activeActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative font-sans">
            <button
              onClick={() => setActiveActivity(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-xl cursor-pointer p-1 z-10"
            >
              &times;
            </button>

            {/* Header with Badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                  {activeActivity.categoryLabel}
                </span>
                {activeActivity.badge && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-800/80 text-pink-300">
                    {activeActivity.badge}
                  </span>
                )}
                {activeActivity.isTutuSimilar && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-900 border border-pink-500 text-pink-200">
                    ✨ {activeActivity.tutuSimilarityScore}% Tutu Style
                  </span>
                )}
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                  📍 {calculateDynamicDistance(originZip, activeActivity.location.zipCode, activeActivity.location.distanceMiles)} mi from {originZip}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {activeActivity.title}
              </h3>
              <div className="text-xs text-slate-400 font-mono">
                {activeActivity.facility} &bull; {activeActivity.location.address}
              </div>
            </div>

            {/* Tutu Similarity Profile Callout in Modal if Applicable */}
            {activeActivity.isTutuSimilar && activeActivity.tutuSimilarityReasons && (
              <div className="p-4 rounded-xl bg-pink-950/40 border border-pink-700/60 font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-pink-200 flex items-center gap-1.5 uppercase">
                    <span>🌸</span>
                    <span>Tutu School Philosophy Breakdown ({activeActivity.tutuSimilarityScore}% Match)</span>
                  </div>
                  <button
                    onClick={() => setShowTutuGuideModal(true)}
                    className="text-[10px] text-pink-400 hover:underline cursor-pointer"
                  >
                    View Guide &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeActivity.tutuSimilarityReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-pink-100">
                      <span className="text-pink-400 font-bold">&bull;</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comprehensive Reviews Breakdown from Various Sources */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Verified Reviews &amp; Ratings Breakdown
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {activeActivity.ratingSummary.compositeScore} / 5.0 (Composite)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {activeActivity.ratingSummary.sources.map((src) => (
                  <div
                    key={src.platform}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{src.platform}</span>
                      <span className="text-yellow-400 font-bold">
                        ★ {src.rating} <span className="text-slate-500 font-normal">({src.reviewCount})</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic">
                      &quot;{src.highlight}&quot;
                    </p>
                    <div className="text-[10px] text-slate-500 pt-1">
                      Reviewed by {src.reviewerName} &bull; {src.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights & Curriculum */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                What Kids Learn &amp; Skills Developed:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {activeActivity.learningHighlights.map((hl, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-pink-400 font-bold">✓</span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Logistics & Facility Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">AGE GROUP</span>
                <span className="text-white font-bold">{activeActivity.ageRange}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">RATIO</span>
                <span className="text-white font-bold">{activeActivity.studentTeacherRatio}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">PARKING</span>
                <span className="text-white font-semibold text-[11px]">{activeActivity.location.parking}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">STUDIO TYPE</span>
                <span className="text-white font-bold text-[11px]">{activeActivity.location.facilityType}</span>
              </div>
            </div>

            {/* What to Bring */}
            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                What to Bring / Attire:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeActivity.whatToBring.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px]"
                  >
                    🎒 {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Schedule & Live Slots */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Upcoming Class Schedules &amp; Live Availability:
              </h4>
              <div className="space-y-2">
                {activeActivity.scheduleSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono flex-wrap gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded bg-slate-800 text-white font-bold">
                        {slot.dayOfWeek}
                      </span>
                      <div>
                        <div className="text-white font-bold">
                          {slot.startTime} – {slot.endTime} ({slot.durationMins} mins)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Instructor: {slot.instructor} &bull; Next session: {slot.nextStartDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold ${
                          slot.spotsLeft <= 2 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {slot.spotsLeft} of {slot.spotsTotal} seats open
                      </span>
                      <button
                        onClick={() => {
                          setActiveActivity(null);
                          handleStartReservation(activeActivity, slot);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-slate-950 font-bold transition-colors cursor-pointer text-xs"
                      >
                        Reserve Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Studio Website Link & Phone */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
              <div>
                <div className="text-[10px] text-slate-400">DIRECT STUDIO PORTAL</div>
                <div className="text-xs text-slate-200">
                  Book directly via {activeActivity.registrationPlatform} &bull; Phone: {activeActivity.phone}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeActivity.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Visit Official Website &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESERVATION FLOW MODAL */}
      {reservingActivity && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setReservingActivity(null);
                setReservationConfirmed(false);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-xl cursor-pointer p-1"
            >
              &times;
            </button>

            {!reservationConfirmed ? (
              <form onSubmit={handleConfirmReservation} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-pink-400 uppercase tracking-wider font-bold">
                    DIRECT RESERVATION PORTAL
                  </span>
                  <h3 className="text-xl font-bold text-white font-sans">
                    Reserve Class Slot
                  </h3>
                  <p className="text-slate-400">
                    {reservingActivity.title} &bull; {reservingActivity.facility}
                  </p>
                </div>

                {/* Selected Slot Information */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">
                      {selectedSlot.dayOfWeek} &bull; {selectedSlot.startTime} – {selectedSlot.endTime}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {selectedSlot.spotsLeft} spots open
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Instructor: {selectedSlot.instructor} &bull; Next starts: {selectedSlot.nextStartDate}
                  </div>
                  <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-900 flex justify-between">
                    <span>Single Class: ${reservingActivity.pricePerClass}</span>
                    {reservingActivity.monthlyTuition && (
                      <span>Monthly: ${reservingActivity.monthlyTuition}</span>
                    )}
                  </div>
                </div>

                {/* Child Name & Age Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Child / Student Name</label>
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="e.g. Maya"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Child&apos;s Age / DOB</label>
                    <input
                      type="text"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      placeholder="e.g. 7 Years Old"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Parent Contact Email</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Free trial guarantee notice */}
                {reservingActivity.hasFreeTrial && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-[11px] text-emerald-300 flex items-center gap-2">
                    <span>🎁</span>
                    <span>
                      Includes free trial evaluation. No upfront payment required to hold this initial spot.
                    </span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>Confirm Class Reservation</span>
                  </button>

                  <a
                    href={reservingActivity.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer text-center"
                    title="Open studio registration page directly"
                  >
                    External Link &rarr;
                  </a>
                </div>
              </form>
            ) : (
              /* Confirmed Screen */
              <div className="space-y-4 font-mono text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Spot Reserved!</h3>
                  <p className="text-xs text-slate-300">
                    Confirmation saved for <strong>{childName || 'Student'}</strong> at <strong>{reservingActivity.facility}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left space-y-2">
                  <div className="text-white font-bold">{reservingActivity.title}</div>
                  <div className="text-slate-400">
                    📅 {selectedSlot.dayOfWeek} &bull; {selectedSlot.startTime} ({selectedSlot.durationMins} mins)
                  </div>
                  <div className="text-slate-400">
                    📍 {reservingActivity.location.address} (
                    {calculateDynamicDistance(originZip, reservingActivity.location.zipCode, reservingActivity.location.distanceMiles)} miles from Zip {originZip})
                  </div>
                  <div className="text-slate-400">
                    👩‍🏫 Instructor: {selectedSlot.instructor}
                  </div>
                  <div className="text-[10px] text-pink-300 pt-1">
                    Booking confirmation token: #EXP-{Math.floor(100000 + Math.random() * 900000)}
                  </div>
                </div>

                {/* Calendar Export */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleDownloadCalendar}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>📅</span>
                    <span>Download to Apple / Google Calendar (.ics)</span>
                  </button>

                  <a
                    href={reservingActivity.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Complete Studio Waiver on {reservingActivity.registrationPlatform}</span>
                    <span>&rarr;</span>
                  </a>

                  <button
                    onClick={() => {
                      playKeyClick();
                      setReservingActivity(null);
                      setReservationConfirmed(false);
                    }}
                    className="text-xs text-slate-400 hover:text-white pt-2 cursor-pointer"
                  >
                    Done &amp; Return to Hub
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
