import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { BarChart3, CheckCircle2, Flame, TrendingUp } from 'lucide-react';
import {
  buildWeeklyStreakTrends,
  type UserProgressStats,
  type WeeklyStreakTrendPoint,
} from '../utils/learningEngine';

interface StreakTrendsCardProps {
  stats: UserProgressStats;
  dailyXpGoal: number;
  todayIso: string;
}

export function StreakTrendsCard({
  stats,
  dailyXpGoal,
  todayIso,
}: StreakTrendsCardProps) {
  const [metricMode, setMetricMode] = useState<'completion' | 'xp'>('completion');

  const trends = buildWeeklyStreakTrends(stats, dailyXpGoal, todayIso);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6">
      {/* Header & Metric Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <BarChart3 className="w-4 h-4" />
            <span>Weekly Activity &amp; Consistency Analytics</span>
          </div>
          <h2 className="font-display text-xl font-bold text-stone-900 mt-0.5">
            Streak Trends
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Visualizing your daily Kannada practice completion and habit consistency over the last 7 days.
          </p>
        </div>

        {/* Toggle between Completion % and Raw XP */}
        <div
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200 self-start sm:self-center"
          role="group"
          aria-label="Chart metric view"
        >
          <button
            type="button"
            onClick={() => setMetricMode('completion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              metricMode === 'completion'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Completion %
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('xp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              metricMode === 'xp'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            XP Earned
          </button>
        </div>
      </div>

      {/* 3 Consistency Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>7-Day Consistency</span>
            <TrendingUp className="w-4 h-4 text-amber-700" />
          </div>
          <p className="font-display text-2xl font-bold text-stone-900 font-mono-tabular mt-1">
            {trends.consistencyPercent}%
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            {trends.activeDaysCount} of 7 days practiced
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Daily Goal Hit Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-display text-2xl font-bold text-stone-900 font-mono-tabular mt-1">
            {trends.goalMetDaysCount} / 7 Days
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Target: {dailyXpGoal} XP / day
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>7-Day Total XP</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-display text-2xl font-bold text-amber-800 font-mono-tabular mt-1">
            {trends.totalWeeklyXp} XP
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Today: {stats.todayXp} XP earned
          </p>
        </div>
      </div>

      {/* Recharts 7-Day Activity Bar Chart */}
      <div className="pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 mb-3">
          <span>
            {metricMode === 'completion'
              ? 'Daily Activity Completion (% of Daily Goal)'
              : `Daily XP Earned (Goal: ${dailyXpGoal} XP)`}
          </span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
              <span>Goal Met (100%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 inline-block" />
              <span>Practiced (&lt;100%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-stone-300 inline-block" />
              <span>0 XP</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full bg-[#FAF8F5] border border-stone-200/70 rounded-xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trends.days}
              margin={{ top: 12, right: 12, left: -12, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
              <XAxis
                dataKey="dayLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#57534E', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={
                  metricMode === 'completion'
                    ? [0, 100]
                    : [0, Math.max(dailyXpGoal * 1.2, 100)]
                }
                tickFormatter={(val) => (metricMode === 'completion' ? `${val}%` : `${val}`)}
                tick={{ fill: '#78716C', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(217, 119, 6, 0.08)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const point = payload[0].payload as WeeklyStreakTrendPoint;
                  return (
                    <div className="bg-stone-900 text-white px-3.5 py-2.5 rounded-xl border border-stone-700 shadow-md text-xs space-y-1">
                      <p className="font-bold text-amber-300">
                        {point.dayLabel} ({point.shortDate})
                      </p>
                      <p className="font-mono-tabular">
                        Completion: <strong>{point.completionPercent}%</strong>
                      </p>
                      <p className="font-mono-tabular text-stone-300">
                        XP Earned: {point.xpEarned} / {point.dailyGoal} XP
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={metricMode === 'completion' ? 100 : dailyXpGoal}
                stroke="#B45309"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Bar
                dataKey={metricMode === 'completion' ? 'completionPercent' : 'xpEarned'}
                radius={[8, 8, 2, 2]}
                maxBarSize={44}
                minPointSize={6}
              >
                {trends.days.map((entry) => {
                  const fillColor = entry.goalMet
                    ? '#059669'
                    : entry.isActiveDay
                      ? '#D97706'
                      : '#D6D3D1';
                  return <Cell key={entry.dateIso} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Daily Status Strip */}
      <div className="grid grid-cols-7 gap-2 pt-1">
        {trends.days.map((day) => (
          <div
            key={day.dateIso}
            className={`p-2.5 rounded-xl border text-center ${
              day.goalMet
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : day.isActiveDay
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-stone-50 border-stone-200 text-stone-500'
            }`}
          >
            <p className="text-[11px] font-bold">{day.dayLabel}</p>
            <p className="text-[10px] text-stone-500">{day.shortDate}</p>
            <p className="font-mono-tabular text-xs font-bold mt-1">
              {day.completionPercent}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
