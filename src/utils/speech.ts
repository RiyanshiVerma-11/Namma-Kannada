export function speakKannadaPhrase(kanglish: string, kannadaScript?: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) setTimeout(onEnd, 400);
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const kannadaVoice = voices.find((v) => v.lang.toLowerCase().includes('kn'));
    const indianVoice = voices.find(
      (v) => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('hi-in')
    );

    const textToSpeak = kannadaVoice && kannadaScript ? kannadaScript : kanglish;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (kannadaVoice) {
      utterance.voice = kannadaVoice;
      utterance.lang = kannadaVoice.lang;
    } else if (indianVoice) {
      utterance.voice = indianVoice;
      utterance.lang = indianVoice.lang;
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    if (onEnd) setTimeout(onEnd, 400);
  }
}
