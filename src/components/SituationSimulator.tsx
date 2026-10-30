import React, { useState } from 'react';
import { ArrowLeft, Volume2, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react';
import type { EverydaySituation } from '../data/kannadaData';
import { speakKannadaPhrase } from '../utils/speech';

interface SituationSimulatorProps {
  situation: EverydaySituation;
  showScript: boolean;
  onCompleteSituation: (situationId: string, xpReward: number) => void;
  onBack: () => void;
}

export function SituationSimulator({
  situation,
  showScript,
  onCompleteSituation,
  onBack,
}: SituationSimulatorProps) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [turnFeedback, setTurnFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const currentTurn = situation.turns[turnIndex];

  const handleSelectChoice = (idx: number) => {
    if (!currentTurn.choices) return;
    const choice = currentTurn.choices[idx];
    setSelectedChoiceIdx(idx);
    setTurnFeedback(choice.feedback);
    if (choice.isBest) {
      speakKannadaPhrase(choice.kanglish, choice.kannadaScript);
    }
  };

  const handleNextTurn = () => {
    if (turnIndex + 1 < situation.turns.length) {
      setTurnIndex((i) => i + 1);
      setSelectedChoiceIdx(null);
      setTurnFeedback(null);
    } else {
      setCompleted(true);
    }
  };

  const canAdvance =
    !currentTurn.choices ||
    (selectedChoiceIdx !== null && currentTurn.choices[selectedChoiceIdx]?.isBest);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Situations</span>
        </button>
        <div className="text-right">
          <p className="text-xs text-stone-500">{situation.locationTag}</p>
          <p className="text-xs font-semibold text-amber-800 font-mono-tabular">
            +{situation.xpReward} XP Roleplay
          </p>
        </div>
      </div>

      {!completed ? (
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
              {situation.title}
            </h2>
            <p className="text-xs text-stone-600 mt-1">{situation.summary}</p>
          </div>

          {/* Conversation Transcript up to current turn */}
          <div className="space-y-4">
            {situation.turns.slice(0, turnIndex + 1).map((turn, idx) => {
              const isCurrent = idx === turnIndex;
              return (
                <div
                  key={turn.id}
                  className={`p-5 rounded-2xl border ${
                    turn.speaker === 'local'
                      ? 'bg-stone-900 text-white border-stone-800 mr-4 sm:mr-12'
                      : 'bg-[#FAF8F5] text-stone-900 border-stone-200 ml-4 sm:ml-12'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-xs font-semibold ${
                        turn.speaker === 'local' ? 'text-amber-300' : 'text-amber-800'
                      }`}
                    >
                      {turn.speakerName}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakKannadaPhrase(turn.kanglish, turn.kannadaScript)}
                      aria-label={`Listen to ${turn.kanglish}`}
                      className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        turn.speaker === 'local'
                          ? 'bg-stone-800 hover:bg-stone-700 text-amber-300'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </button>
                  </div>

                  {(!isCurrent || !turn.choices) && (
                    <>
                      <p className="font-display text-base sm:text-lg font-bold">{turn.kanglish}</p>
                      {showScript && (
                        <p
                          className={`text-xs mt-0.5 ${
                            turn.speaker === 'local' ? 'text-amber-200' : 'text-amber-800'
                          }`}
                        >
                          {turn.kannadaScript}
                        </p>
                      )}
                      <p
                        className={`text-xs mt-1.5 ${
                          turn.speaker === 'local' ? 'text-stone-300' : 'text-stone-600'
                        }`}
                      >
                        {turn.english}
                      </p>
                    </>
                  )}

                  {isCurrent && turn.choices && (
                    <div className="mt-2 space-y-2.5">
                      <p className="text-xs font-semibold text-stone-600">
                        Choose your response in Kannada:
                      </p>
                      {turn.choices.map((choice, cIdx) => {
                        const selected = selectedChoiceIdx === cIdx;
                        return (
                          <button
                            key={choice.kanglish}
                            type="button"
                            onClick={() => handleSelectChoice(cIdx)}
                            className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                              selected
                                ? choice.isBest
                                  ? 'bg-emerald-50 border-emerald-600 text-stone-900'
                                  : 'bg-red-50 border-red-400 text-stone-900'
                                : 'bg-white border-stone-200 hover:border-amber-600'
                            }`}
                          >
                            <p className="font-display text-sm font-bold text-stone-900">
                              {choice.kanglish}
                            </p>
                            {showScript && (
                              <p className="text-xs text-amber-800 mt-0.5">{choice.kannadaScript}</p>
                            )}
                            <p className="text-xs text-stone-500 mt-1">{choice.english}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <p
                    className={`text-xs mt-3 pt-2.5 border-t ${
                      turn.speaker === 'local'
                        ? 'border-stone-800 text-stone-400'
                        : 'border-stone-200/80 text-stone-500'
                    }`}
                  >
                    Tip: {turn.tip}
                  </p>
                </div>
              );
            })}
          </div>

          {turnFeedback && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-stone-800">
              {turnFeedback}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <span className="text-xs text-stone-500 font-mono-tabular">
              Dialogue Step {turnIndex + 1} of {situation.turns.length}
            </span>
            <button
              type="button"
              disabled={!canAdvance}
              onClick={handleNextTurn}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              {turnIndex + 1 < situation.turns.length ? 'Continue Dialogue' : 'Complete Situation'}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-800">Situation Mastered</p>
            <h3 className="font-display text-2xl font-bold text-stone-900 mt-1">
              You are ready for {situation.title}!
            </h3>
          </div>

          <div className="max-w-md mx-auto text-left p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3">
            <p className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-700" />
              <span>Key Takeaways to Pocket</span>
            </p>
            {situation.keyTakeaways.map((kt) => (
              <div key={kt.kanglish} className="pt-2 border-t border-stone-200/70 first:border-none first:pt-0">
                <p className="text-sm font-bold text-stone-900">{kt.kanglish}</p>
                {showScript && <p className="text-xs text-amber-800">{kt.kannadaScript}</p>}
                <p className="text-xs text-stone-600">{kt.english}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onCompleteSituation(situation.id, situation.xpReward)}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Claim +{situation.xpReward} XP &amp; Return</span>
          </button>
        </div>
      )}
    </div>
  );
}
