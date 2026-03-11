import React from 'react';
import { STAGES } from '../utils/constants.js';

export default function ProgressBar({ progress = 0, stage, compact = false }) {
  const currentStageIdx = STAGES.indexOf(stage);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{progress}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stage pills */}
      <div className="flex gap-1.5 flex-wrap">
        {STAGES.map((s, i) => {
          const isDone = i < currentStageIdx;
          const isActive = i === currentStageIdx;
          return (
            <span
              key={s}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                isDone
                  ? 'bg-brand-600 text-white'
                  : isActive
                  ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-400'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isDone ? '✓ ' : ''}{s}
            </span>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Прогресс</span>
          <span className="font-medium text-slate-700">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full progress-animated transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step markers */}
        <div className="flex justify-between mt-1">
          {STAGES.map((s, i) => {
            const pct = [10, 30, 55, 75, 90][i];
            const reached = progress >= pct;
            return (
              <div key={s} className="flex flex-col items-center" style={{ width: `${100 / STAGES.length}%` }}>
                <div className={`w-2 h-2 rounded-full mt-0.5 ${reached ? 'bg-brand-500' : 'bg-slate-200'}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
