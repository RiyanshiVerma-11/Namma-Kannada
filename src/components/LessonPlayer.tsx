import React, { useState } from 'react';
import { X, Volume2, CheckCircle2, AlertCircle, Flame, Award, ArrowRight, RotateCcw } from 'lucide-react';
import type { Lesson } from '../data/kannadaData';
import { evaluateSentenceBuilder } from '../utils/learningEngine';
import { speakKannadaPhrase } from '../utils/speech';

interface LessonPlayerProps {
  lesson: Lesson;
  showScript: boolean;
  onToggleScript: () => void;
  onCompleteLesson: (lessonId: string, baseXp: number, accuracyPercent: number) => void;
  onClose: () => void;
}

export function LessonPlayer({
  lesson,
  showScript,
  onToggleScript,
  onCompleteLesson,
  onClose,
}: LessonPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [checkedState, setCheckedState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const exercises = lesson.exercises;
  const currentEx = exercises[currentIndex];
  const progressRatio = ((currentIndex + (checkedState !== 'idle' ? 1 : 0)) / exercises.length) * 100;

  const availableTiles = React.useMemo(() => {
    if (currentEx.type !== 'sentence_builder') return [];
    return [...(currentEx.sentenceTokens || []), ...(currentEx.distractorTokens || [])];
  }, [currentEx]);

  const handleCheckAnswer = () => {
    if (currentEx.type === 'flashcard_intro') {
      setCheckedState('correct');
      setCorrectCount((c) => c + 1);
      setAttemptsCount((a) => a + 1);
      setFeedbackText('Great! Let us practice using this phrase in context.');
      return;
    }

    if (currentEx.type === 'multiple_choice' || currentEx.type === 'dialogue_reply') {
      const chosen = currentEx.options?.find((o) => o.id === selectedOptionId);
      if (!chosen) return;
      setAttemptsCount((a) => a + 1);
      if (chosen.isCorrect) {
        setCheckedState('correct');
        setCorrectCount((c) => c + 1);
        setFeedbackText(chosen.explanation);
        speakKannadaPhrase(chosen.kanglish, chosen.kannadaScript);
      } else {
        setCheckedState('incorrect');
        setFeedbackText(chosen.explanation);
      }
      return;
    }

    if (currentEx.type === 'sentence_builder') {
      if (selectedTiles.length === 0) return;
      setAttemptsCount((a) => a + 1);
      const evaluation = evaluateSentenceBuilder(currentEx.sentenceTokens || [], selectedTiles);
      if (evaluation.isCorrect) {
        setCheckedState('correct');
        setCorrectCount((c) => c + 1);
        setFeedbackText(`Spot on! "${currentEx.kanglish}" (${currentEx.englishMeaning}).`);
        speakKannadaPhrase(currentEx.kanglish, currentEx.kannadaScript);
      } else {
        setCheckedState('incorrect');
        setFeedbackText(`Expected order: "${(currentEx.sentenceTokens || []).join(' ')}"`);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOptionId(null);
      setSelectedTiles([]);
      setCheckedState('idle');
      setFeedbackText('');
    } else {
      setIsFinished(true);
    }
  };

  const accuracyPercent = attemptsCount > 0 ? Math.round((correctCount / attemptsCount) * 100) : 100;

  if (isFinished) {
    const bonusXp = accuracyPercent >= 90 ? 15 : accuracyPercent >= 75 ? 5 : 0;
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF8F5] flex flex-col justify-between p-6 overflow-y-auto">
        <div className="max-w-lg w-full mx-auto my-auto bg-white border border-stone-200 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-5">
            <Award className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-amber-800">Lesson {lesson.number} Complete</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Shabhaash! (ಶಭಾಷ್ · Well Done!)
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            You mastered <strong className="text-stone-900">{lesson.title}</strong> and moved closer to your daily
            Kannada streak goal.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200">
              <p className="text-xs text-stone-500">Total XP</p>
              <p className="font-display text-xl font-bold text-amber-800 font-mono-tabular mt-0.5">
                +{lesson.xpReward + bonusXp} XP
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200">
              <p className="text-xs text-stone-500">Accuracy</p>
              <p className="font-display text-xl font-bold text-emerald-800 font-mono-tabular mt-0.5">
                {accuracyPercent}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200">
              <p className="text-xs text-stone-500">Streak</p>
              <p className="font-display text-xl font-bold text-stone-900 inline-flex items-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Active</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCompleteLesson(lesson.id, lesson.xpReward, accuracyPercent)}
            className="mt-8 w-full min-h-[48px] py-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Claim +{lesson.xpReward + bonusXp} XP &amp; Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const canSubmit =
    currentEx.type === 'flashcard_intro' ||
    ((currentEx.type === 'multiple_choice' || currentEx.type === 'dialogue_reply') &&
      Boolean(selectedOptionId)) ||
    (currentEx.type === 'sentence_builder' && selectedTiles.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5] flex flex-col">
      {/* Top Progress Header */}
      <header className="border-b border-stone-200 bg-white px-6 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit lesson"
            className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-stone-100 flex items-center justify-center text-stone-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1 font-mono-tabular">
              <span>
                Lesson {lesson.number}: {lesson.title}
              </span>
              <span>
                {currentIndex + 1} / {exercises.length}
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${Math.max(0.08, progressRatio / 100)})` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleScript}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {showScript ? 'ಕನ್ನಡ Script: ON' : 'ಕನ್ನಡ Script: OFF'}
          </button>
        </div>
      </header>

      {/* Main Exercise Stage */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-amber-800">
            {currentEx.type === 'flashcard_intro' && 'New Phrase Breakdown'}
            {currentEx.type === 'multiple_choice' && 'Situational Choice'}
            {currentEx.type === 'sentence_builder' && 'Sentence Builder'}
            {currentEx.type === 'dialogue_reply' && 'Real-Life Conversation Reply'}
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mt-1">
            {currentEx.prompt}
          </h2>
          {currentEx.situationContext && (
            <p className="text-xs text-stone-500 mt-1">Context: {currentEx.situationContext}</p>
          )}

          {/* Exercise Type 1: Flashcard Intro */}
          {currentEx.type === 'flashcard_intro' && (
            <div className="mt-6 p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                    {currentEx.kanglish}
                  </p>
                  {showScript && (
                    <p className="text-lg text-amber-800 font-medium mt-1">
                      {currentEx.kannadaScript}
                    </p>
                  )}
                  <p className="text-base text-stone-700 font-medium mt-3">
                    &ldquo;{currentEx.englishMeaning}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => speakKannadaPhrase(currentEx.kanglish, currentEx.kannadaScript)}
                  aria-label={`Listen to ${currentEx.kanglish}`}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs inline-flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
              </div>

              {currentEx.literalBreakdown && (
                <div className="pt-4 border-t border-stone-100">
                  <p className="text-xs font-semibold text-stone-500 mb-2.5">
                    Word-by-Word Breakdown
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentEx.literalBreakdown.map((item) => (
                      <div
                        key={item.word}
                        className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-stone-900">{item.word}</span>
                        <span className="text-stone-600">{item.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentEx.culturalTip && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-stone-700">
                  <strong className="text-amber-900">Bengaluru Insider Tip:</strong> {currentEx.culturalTip}
                </div>
              )}
            </div>
          )}

          {/* Exercise Type 2 & 4: Multiple Choice & Dialogue Reply */}
          {(currentEx.type === 'multiple_choice' || currentEx.type === 'dialogue_reply') && (
            <div className="mt-6 space-y-5">
              {currentEx.speakerLine && (
                <div className="p-5 rounded-2xl bg-stone-900 text-white flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-amber-300 font-medium">
                      {currentEx.speakerLine.speakerName} · {currentEx.speakerLine.speakerRole}
                    </p>
                    <p className="font-display text-lg font-bold mt-1">
                      &ldquo;{currentEx.speakerLine.kanglish}&rdquo;
                    </p>
                    {showScript && (
                      <p className="text-xs text-amber-200 mt-0.5">
                        {currentEx.speakerLine.kannadaScript}
                      </p>
                    )}
                    <p className="text-xs text-stone-300 mt-1.5">
                      Meaning: {currentEx.speakerLine.englishMeaning}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      speakKannadaPhrase(
                        currentEx.speakerLine!.kanglish,
                        currentEx.speakerLine!.kannadaScript
                      )
                    }
                    aria-label="Listen to speaker line"
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Audio</span>
                  </button>
                </div>
              )}

              <div className="space-y-3" role="radiogroup" aria-label="Answer options">
                {currentEx.options?.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={checkedState !== 'idle'}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-amber-50 border-amber-600 text-stone-900'
                          : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800'
                      }`}
                    >
                      <div>
                        <p className="font-display text-base font-bold text-stone-900">
                          {opt.kanglish}
                        </p>
                        {showScript && (
                          <p className="text-xs text-amber-800 mt-0.5">{opt.kannadaScript}</p>
                        )}
                        <p className="text-xs text-stone-500 mt-1">{opt.englishHint}</p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-amber-700 bg-amber-700 text-white' : 'border-stone-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exercise Type 3: Sentence Builder */}
          {currentEx.type === 'sentence_builder' && (
            <div className="mt-6 space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
                  <span>Tap words below to construct the Kannada phrase:</span>
                  {selectedTiles.length > 0 && checkedState === 'idle' && (
                    <button
                      type="button"
                      onClick={() => setSelectedTiles([])}
                      className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <div className="min-h-[68px] p-3.5 rounded-xl bg-[#FAF8F5] border border-dashed border-stone-300 flex flex-wrap items-center gap-2">
                  {selectedTiles.length === 0 ? (
                    <span className="text-xs text-stone-400">
                      Your assembled sentence will appear here...
                    </span>
                  ) : (
                    selectedTiles.map((word, idx) => (
                      <button
                        key={`${word}-${idx}`}
                        type="button"
                        disabled={checkedState !== 'idle'}
                        onClick={() =>
                          setSelectedTiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-stone-900 text-white text-sm font-semibold cursor-pointer hover:bg-stone-700 transition-colors"
                      >
                        {word}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Word Bank */}
              <div>
                <p className="text-xs font-semibold text-stone-500 mb-2.5">Available Word Bank</p>
                <div className="flex flex-wrap gap-2.5">
                  {availableTiles.map((word, idx) => {
                    const alreadyUsedCount = selectedTiles.filter((t) => t === word).length;
                    const totalAvailableCount = availableTiles.filter((t) => t === word).length;
                    const disabled = alreadyUsedCount >= totalAvailableCount || checkedState !== 'idle';

                    return (
                      <button
                        key={`bank-${word}-${idx}`}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedTiles((prev) => [...prev, word])}
                        className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                          disabled
                            ? 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed'
                            : 'bg-white border-stone-300 text-stone-900 hover:border-amber-600 hover:bg-amber-50/50'
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Evaluation & Next Action Bar */}
      <footer
        className={`border-t px-6 py-4 transition-colors ${
          checkedState === 'correct'
            ? 'bg-emerald-50 border-emerald-200'
            : checkedState === 'incorrect'
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-stone-200'
        }`}
      >
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            {checkedState === 'correct' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            )}
            {checkedState === 'incorrect' && (
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            )}
            <div>
              {checkedState !== 'idle' ? (
                <>
                  <p
                    className={`text-sm font-bold ${
                      checkedState === 'correct' ? 'text-emerald-900' : 'text-red-900'
                    }`}
                  >
                    {checkedState === 'correct' ? 'Sari! (Correct!)' : 'Let us review that:'}
                  </p>
                  <p className="text-xs text-stone-700 mt-0.5">{feedbackText}</p>
                </>
              ) : (
                <p className="text-xs text-stone-500">
                  {currentEx.type === 'flashcard_intro'
                    ? 'Listen to the pronunciation and review the word breakdown before continuing.'
                    : 'Select or build your answer above, then check it.'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {checkedState === 'incorrect' && (
              <button
                type="button"
                onClick={() => {
                  setCheckedState('idle');
                  setFeedbackText('');
                }}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-red-300 bg-white text-red-800 font-semibold text-sm cursor-pointer"
              >
                Try Again
              </button>
            )}

            {checkedState === 'idle' ? (
              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleCheckAnswer}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-semibold text-sm cursor-pointer transition-colors"
              >
                {currentEx.type === 'flashcard_intro' ? 'Got It, Continue' : 'Check Answer'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>{currentIndex + 1 < exercises.length ? 'Next Exercise' : 'Finish Lesson'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
