export interface ExerciseItem {
  id: string;
  type: 'flashcard_intro' | 'multiple_choice' | 'sentence_builder' | 'dialogue_reply';
  prompt: string;
  situationContext?: string;
  kanglish: string;
  kannadaScript: string;
  englishMeaning: string;
  literalBreakdown?: { word: string; meaning: string }[];
  culturalTip?: string;
  options?: {
    id: string;
    kanglish: string;
    kannadaScript: string;
    englishHint: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  sentenceTokens?: string[];
  distractorTokens?: string[];
  speakerLine?: {
    speakerName: string;
    speakerRole: string;
    kanglish: string;
    kannadaScript: string;
    englishMeaning: string;
  };
}

export interface Lesson {
  id: string;
  unitId: string;
  number: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  xpReward: number;
  keyPhrasesCount: number;
  exercises: ExerciseItem[];
}

export interface LearningUnit {
  id: string;
  number: number;
  title: string;
  description: string;
  culturalNote: string;
  badgeLabel: string;
  lessons: Lesson[];
}

export interface SituationTurn {
  id: string;
  speaker: 'local' | 'learner';
  speakerName: string;
  kanglish: string;
  kannadaScript: string;
  english: string;
  tip: string;
  choices?: {
    kanglish: string;
    kannadaScript: string;
    english: string;
    isBest: boolean;
    feedback: string;
  }[];
}

export interface EverydaySituation {
  id: string;
  title: string;
  locationTag: string;
  difficulty: 'Beginner' | 'Practical' | 'Polite Fluency';
  summary: string;
  xpReward: number;
  illustrationType: 'auto' | 'darshini' | 'market' | 'delivery' | 'office';
  keyTakeaways: { kanglish: string; kannadaScript: string; english: string }[];
  turns: SituationTurn[];
}

export interface VocabPhrase {
  id: string;
  category: 'Greetings' | 'Commute' | 'Food & Cafe' | 'Shopping & Numbers' | 'Work & Social' | 'Emergency';
  kanglish: string;
  kannadaScript: string;
  english: string;
  literalMeaning: string;
  usageContext: string;
}

export const LEARNING_UNITS: LearningUnit[] = [
  {
    id: 'unit-1',
    number: 1,
    title: 'Warm Greetings & Polite Essentials',
    description: 'Break the ice anywhere in Karnataka using respectful suffixes (-ri / -avare) and everyday courtesies.',
    culturalNote: 'Adding "-ri" (ರಿ) or addressing someone as "Anna" (elder brother) or "Akka" (elder sister) immediately brings a warm smile in Bengaluru.',
    badgeLabel: 'Foundation',
    lessons: [
      {
        id: 'lesson-1-1',
        unitId: 'unit-1',
        number: '1.1',
        title: 'Namaskara & First Smiles',
        subtitle: 'Greet anyone, ask how they are, and respond naturally',
        durationMinutes: 4,
        xpReward: 40,
        keyPhrasesCount: 4,
        exercises: [
          {
            id: 'ex-1-1-1',
            type: 'flashcard_intro',
            prompt: 'Learn the universal respectful greeting in Kannada',
            situationContext: 'Meeting a neighbor, colleague, or shopkeeper at any time of day',
            kanglish: 'Namaskara, chennagiddira?',
            kannadaScript: 'ನಮಸ್ಕಾರ, ಚೆನ್ನಾಗಿದ್ದೀರಾ?',
            englishMeaning: 'Hello, are you doing well?',
            literalBreakdown: [
              { word: 'Namaskara', meaning: 'Respectful hello / greetings' },
              { word: 'Chennagiddira?', meaning: 'Are you well? (Polite plural)' },
            ],
            culturalTip: '"Chennagiddira?" uses the respectful plural form. Reply with "Naanu chennagiddini" (I am doing well).',
          },
          {
            id: 'ex-1-1-2',
            type: 'multiple_choice',
            prompt: 'Your apartment security guard smiles and asks: "Namaskara sir/madam, chennagiddira?" How do you reply?',
            kanglish: 'Chennagiddini, neevu?',
            kannadaScript: 'ಚೆನ್ನಾಗಿದ್ದೀನಿ, ನೀವು?',
            englishMeaning: 'I am doing well, and you?',
            options: [
              {
                id: 'opt-1',
                kanglish: 'Haudu, naanu chennagiddini. Neevu?',
                kannadaScript: 'ಹೌದು, ನಾನು ಚೆನ್ನಾಗಿದ್ದೀನಿ. ನೀವು?',
                englishHint: 'Yes, I am doing well. And you?',
                isCorrect: true,
                explanation: '"Haudu" means Yes, "Naanu chennagiddini" means I am fine, and "Neevu?" politely asks "And you?".',
              },
              {
                id: 'opt-2',
                kanglish: 'Nanage Kannada gothilla',
                kannadaScript: 'ನನಗೆ ಕನ್ನಡ ಗೊತ್ತಿಲ್ಲ',
                englishHint: 'I do not know Kannada',
                isCorrect: false,
                explanation: 'While useful, answering "Chennagiddini" builds instant rapport!',
              },
              {
                id: 'opt-3',
                kanglish: 'Ellige hogabeku?',
                kannadaScript: 'ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?',
                englishHint: 'Where do you want to go?',
                isCorrect: false,
                explanation: '"Ellige hogabeku?" is what an auto driver asks you about your destination.',
              },
            ],
          },
          {
            id: 'ex-1-1-3',
            type: 'sentence_builder',
            prompt: 'Build the phrase for: "I am learning a little Kannada"',
            situationContext: 'Locals love hearing that you are making an effort to learn!',
            kanglish: 'Naanu swalpa Kannada kalitha iddini',
            kannadaScript: 'ನಾನು ಸ್ವಲ್ಪ ಕನ್ನಡ ಕಲಿತಾ ಇದ್ದೀನಿ',
            englishMeaning: 'I am learning a little Kannada',
            sentenceTokens: ['Naanu', 'swalpa', 'Kannada', 'kalitha', 'iddini'],
            distractorTokens: ['bedi', 'eshtu', 'elle'],
          },
          {
            id: 'ex-1-1-4',
            type: 'dialogue_reply',
            prompt: 'Respond to your colleague around 1:30 PM in the office',
            speakerLine: {
              speakerName: 'karthik (Colleague)',
              speakerRole: 'Teammate in Bengaluru',
              kanglish: 'Namaskara! Oota aaytha?',
              kannadaScript: 'ನಮಸ್ಕಾರ! ಊಟ ಆಯ್ತಾ?',
              englishMeaning: 'Hello! Have you had your lunch/meal?',
            },
            kanglish: 'Oota aaythu, nimdu aaytha?',
            kannadaScript: 'ಊಟ ಆಯ್ತು, ನಿಮ್ದು ಆಯ್ತಾ?',
            englishMeaning: 'Lunch is done, did you have yours?',
            options: [
              {
                id: 'opt-a',
                kanglish: 'Aaythu! Nimdu oota aaytha?',
                kannadaScript: 'ಆಯ್ತು! ನಿಮ್ದು ಊಟ ಆಯ್ತಾ?',
                englishHint: 'Done! Did you have your meal?',
                isCorrect: true,
                explanation: 'In Karnataka, asking "Oota aaytha?" is the warmest way to show care. "Aaythu" means "It is done / Yes, I ate."',
              },
              {
                id: 'opt-b',
                kanglish: 'Meter haaki anna',
                kannadaScript: 'ಮೀಟರ್ ಹಾಕಿ ಅಣ್ಣ',
                englishHint: 'Please put on the meter brother',
                isCorrect: false,
                explanation: 'Save "Meter haaki" for your next auto rickshaw ride!',
              },
              {
                id: 'opt-c',
                kanglish: 'Beda, naale banni',
                kannadaScript: 'ಬೇಡ, ನಾಳೆ ಬನ್ನಿ',
                englishHint: 'No need, come tomorrow',
                isCorrect: false,
                explanation: '"Beda" means don\'t want / no need.',
              },
            ],
          },
        ],
      },
      {
        id: 'lesson-1-2',
        unitId: 'unit-1',
        number: '1.2',
        title: 'Swalpa, Dayavittu & Gratitude',
        subtitle: 'Magic words for polite requests, yes/no, and thank you',
        durationMinutes: 5,
        xpReward: 45,
        keyPhrasesCount: 5,
        exercises: [
          {
            id: 'ex-1-2-1',
            type: 'flashcard_intro',
            prompt: 'Master the most versatile word in Bengaluru: "Swalpa"',
            situationContext: 'Asking someone to adjust, wait a moment, or give a little bit of something',
            kanglish: 'Dayavittu swalpa sahaya maadi',
            kannadaScript: 'ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಹಾಯ ಮಾಡಿ',
            englishMeaning: 'Please help me a little bit',
            literalBreakdown: [
              { word: 'Dayavittu', meaning: 'Please (literally: placing kindness)' },
              { word: 'Swalpa', meaning: 'A little / slightly' },
              { word: 'Sahaya maadi', meaning: 'Do help' },
            ],
            culturalTip: '"Swalpa adjust maadi" (Please adjust a little) is Bengaluru\'s unofficial motto for harmony!',
          },
          {
            id: 'ex-1-2-2',
            type: 'multiple_choice',
            prompt: 'Which pair correctly means "Wanted / Needed" vs "Not Wanted / No Need"?',
            kanglish: 'Beku vs Beda',
            kannadaScript: 'ಬೇಕು vs ಬೇಡ',
            englishMeaning: 'Want/Need vs Don\'t want',
            options: [
              {
                id: 'opt-1',
                kanglish: 'Beku (Want) & Beda (Do not want)',
                kannadaScript: 'ಬೇಕು & ಬೇಡ',
                englishHint: 'e.g., Neeru beku (Want water), Sakkare beda (No sugar)',
                isCorrect: true,
                explanation: 'Simply attach any noun before "beku" or "beda": Coffee beku (I want coffee), Plastic cover beda (No plastic bag needed).',
              },
              {
                id: 'opt-2',
                kanglish: 'Illi (Here) & Alli (There)',
                kannadaScript: 'ಇಲ್ಲಿ & ಅಲ್ಲಿ',
                englishHint: 'Location pointers',
                isCorrect: false,
                explanation: 'Illi and Alli mean "Here" and "There".',
              },
              {
                id: 'opt-3',
                kanglish: 'Banni (Come) & Hogi (Go)',
                kannadaScript: 'ಬನ್ನಿ & ಹೋಗಿ',
                englishHint: 'Movement verbs',
                isCorrect: false,
                explanation: 'Banni and Hogi mean "Please come" and "Please go".',
              },
            ],
          },
          {
            id: 'ex-1-2-3',
            type: 'sentence_builder',
            prompt: 'Build the polite phrase: "Thank you very much"',
            kanglish: 'Thumba dhanyavadagalu',
            kannadaScript: 'ತುಂಬಾ ಧನ್ಯವಾದಗಳು',
            englishMeaning: 'Thank you very much',
            sentenceTokens: ['Thumba', 'dhanyavadagalu'],
            distractorTokens: ['beda', 'beku', 'elli'],
          },
        ],
      },
      {
        id: 'lesson-1-3',
        unitId: 'unit-1',
        number: '1.3',
        title: 'Introducing Yourself & Where You Live',
        subtitle: 'Share your name, neighborhood, and profession',
        durationMinutes: 5,
        xpReward: 50,
        keyPhrasesCount: 4,
        exercises: [
          {
            id: 'ex-1-3-1',
            type: 'flashcard_intro',
            prompt: 'Introduce yourself and your neighborhood',
            situationContext: 'Chatting with a neighbor or new acquaintance',
            kanglish: 'Nanna hesaru Aarav. Naanu Indiranagar-alli iddini.',
            kannadaScript: 'ನನ್ನ ಹೆಸರು ಆರವ್. ನಾನು ಇಂದಿರಾನಗರಲ್ಲಿ ಇದ್ದೀನಿ.',
            englishMeaning: 'My name is Aarav. I stay in Indiranagar.',
            literalBreakdown: [
              { word: 'Nanna hesaru', meaning: 'My name' },
              { word: 'Naanu', meaning: 'I' },
              { word: '-alli iddini', meaning: 'stay in / am located in' },
            ],
          },
          {
            id: 'ex-1-3-2',
            type: 'sentence_builder',
            prompt: 'Ask someone politely: "What is your name?"',
            kanglish: 'Nimma hesaru yenu?',
            kannadaScript: 'ನಿಮ್ಮ ಹೆಸರು ಏನು?',
            englishMeaning: 'What is your name? (Respectful)',
            sentenceTokens: ['Nimma', 'hesaru', 'yenu?'],
            distractorTokens: ['Nanna', 'eshtu', 'beku'],
          },
        ],
      },
    ],
  },
  {
    id: 'unit-2',
    number: 2,
    title: 'Auto Rickshaw, Metro & Commute',
    description: 'Navigate Bengaluru streets effortlessly—give turn-by-turn landmarks, negotiate fares, and guide drivers.',
    culturalNote: 'Adding "-ge" to any place name means "to that place" (e.g., Koramangala-ge, Metro station-ge).',
    badgeLabel: 'Street Smart',
    lessons: [
      {
        id: 'lesson-2-1',
        unitId: 'unit-2',
        number: '2.1',
        title: 'Hailing an Auto & "Bartheera?"',
        subtitle: 'Ask if a driver will come to your destination and discuss the fare',
        durationMinutes: 5,
        xpReward: 50,
        keyPhrasesCount: 5,
        exercises: [
          {
            id: 'ex-2-1-1',
            type: 'flashcard_intro',
            prompt: 'Ask an auto driver if they will come to your destination',
            situationContext: 'Hailing an auto rickshaw on 100 Feet Road',
            kanglish: 'Anna, Koramangala-ge bartheera? Meter haaki.',
            kannadaScript: 'ಅಣ್ಣ, ಕೋರಮಂಗಲಗೆ ಬರ್ತೀರಾ? ಮೀಟರ್ ಹಾಕಿ.',
            englishMeaning: 'Brother, will you come to Koramangala? Please put on the meter.',
            literalBreakdown: [
              { word: 'Anna', meaning: 'Elder brother (polite address)' },
              { word: 'Koramangala-ge', meaning: 'To Koramangala' },
              { word: 'Bartheera?', meaning: 'Will you come?' },
              { word: 'Meter haaki', meaning: 'Put on the meter' },
            ],
            culturalTip: 'Using "Bartheera?" (Will you come?) instead of English immediately sets a friendly local tone.',
          },
          {
            id: 'ex-2-1-2',
            type: 'dialogue_reply',
            prompt: 'The auto driver says: "Meter beda sir, inuru rupayi (200 rupees) kodi." You want to offer 150 rupees politely:',
            speakerLine: {
              speakerName: 'Ramesh (Auto Driver)',
              speakerRole: 'Near Metro Exit',
              kanglish: 'Traffic jaasthi ide. Inuru rupayi kodi.',
              kannadaScript: 'ಟ್ರಾಫಿಕ್ ಜಾಸ್ತಿ ಇದೆ. ಇನ್ನೂರು ರೂಪಾಯಿ ಕೊಡಿ.',
              englishMeaning: 'There is heavy traffic. Give 200 rupees.',
            },
            kanglish: 'Anna, thumba jaasthi aaythu. Noora aivathu (150) thagoli.',
            kannadaScript: 'ಅಣ್ಣ, ತುಂಬಾ ಜಾಸ್ತಿ ಆಯ್ತು. ನೂರಾ ಐವತ್ತು ತಗೊಳ್ಳಿ.',
            englishMeaning: 'Brother, that is too much. Please take 150.',
            options: [
              {
                id: 'opt-1',
                kanglish: 'Anna, jaasthi aaythu. Noora aivathu (150) thagoli.',
                kannadaScript: 'ಅಣ್ಣ, ಜಾಸ್ತಿ ಆಯ್ತು. ನೂರಾ ಐವತ್ತು ತಗೊಳ್ಳಿ.',
                englishHint: 'Brother, that is high. Please take 150.',
                isCorrect: true,
                explanation: '"Jaasthi aaythu" (It became too much) and "Thagoli" (Please take) is the polite way to bargain.',
              },
              {
                id: 'opt-2',
                kanglish: 'Oota aaytha anna?',
                kannadaScript: 'ಊಟ ಆಯ್ತಾ ಅಣ್ಣ?',
                englishHint: 'Did you have lunch brother?',
                isCorrect: false,
                explanation: 'Friendly, but doesn\'t answer the fare question!',
              },
              {
                id: 'opt-3',
                kanglish: 'Naanu illi iddini',
                kannadaScript: 'ನಾನು ಇಲ್ಲಿ ಇದ್ದೀನಿ',
                englishHint: 'I am right here',
                isCorrect: false,
                explanation: '"Naanu illi iddini" is used on phone calls to tell someone where you are standing.',
              },
            ],
          },
          {
            id: 'ex-2-1-3',
            type: 'sentence_builder',
            prompt: 'Tell the driver: "Take a right turn ahead, stop right here"',
            kanglish: 'Munde right thagoli, illi nilisi',
            kannadaScript: 'ಮುಂದೆ ರೈಟ್ ತಗೊಳ್ಳಿ, ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ',
            englishMeaning: 'Take a right ahead, stop here',
            sentenceTokens: ['Munde', 'right', 'thagoli,', 'illi', 'nilisi'],
            distractorTokens: ['hinde', 'beku', 'eshtu'],
          },
        ],
      },
      {
        id: 'lesson-2-2',
        unitId: 'unit-2',
        number: '2.2',
        title: 'Guiding Delivery & Cab Drivers by Phone',
        subtitle: 'Explain gates, landmarks, and "I have sent the location"',
        durationMinutes: 5,
        xpReward: 50,
        keyPhrasesCount: 4,
        exercises: [
          {
            id: 'ex-2-2-1',
            type: 'flashcard_intro',
            prompt: 'Guide a delivery partner to your apartment gate',
            situationContext: 'When your food or grocery delivery partner calls asking for directions',
            kanglish: 'Anna, main gate hathra banni. Security hathra kodi.',
            kannadaScript: 'ಅಣ್ಣ, ಮೇನ್ ಗೇಟ್ ಹತ್ರ ಬನ್ನಿ. ಸೆಕ್ಯೂರಿಟಿ ಹತ್ರ ಕೊಡಿ.',
            englishMeaning: 'Brother, come near the main gate. Hand it over near security.',
            literalBreakdown: [
              { word: 'Hathra', meaning: 'Near / next to' },
              { word: 'Banni', meaning: 'Please come' },
              { word: 'Kodi', meaning: 'Please give' },
            ],
          },
          {
            id: 'ex-2-2-2',
            type: 'multiple_choice',
            prompt: 'How do you say "Go straight and take a left" in everyday Bengaluru Kannada?',
            kanglish: 'Seedha hogi, left thagoli',
            kannadaScript: 'ಸೀದಾ ಹೋಗಿ, ಲೆಫ್ಟ್ ತಗೊಳ್ಳಿ',
            englishMeaning: 'Go straight, take a left',
            options: [
              {
                id: 'opt-1',
                kanglish: 'Seedha hogi, left thagoli (or Edagade thagoli)',
                kannadaScript: 'ಸೀದಾ ಹೋಗಿ, ಲೆಫ್ಟ್ ತಗೊಳ್ಳಿ',
                englishHint: 'Go straight, take a left',
                isCorrect: true,
                explanation: '"Seedha hogi" (Go straight) + "Left/Right thagoli" (Take a left/right) is understood by 100% of drivers.',
              },
              {
                id: 'opt-2',
                kanglish: 'Bega banni anna',
                kannadaScript: 'ಬೇಗ ಬನ್ನಿ ಅಣ್ಣ',
                englishHint: 'Come quickly brother',
                isCorrect: false,
                explanation: '"Bega banni" means come fast, not go straight.',
              },
              {
                id: 'opt-3',
                kanglish: 'Eshtu aaythu?',
                kannadaScript: 'ಎಷ್ಟು ಆಯ್ತು?',
                englishHint: 'How much did it cost?',
                isCorrect: false,
                explanation: '"Eshtu aaythu?" asks for the bill amount.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'unit-3',
    number: 3,
    title: 'Darshini, Filter Coffee & Local Markets',
    description: 'Order crispy masala dosas, customize sugar in your filter coffee, and shop fresh produce with confidence.',
    culturalNote: 'At a standing Darshini cafe, ordering in Kannada ("Ondu Masala Dose, ondu Filter Coffee kodi") earns instant respect!',
    badgeLabel: 'Food & Market',
    lessons: [
      {
        id: 'lesson-3-1',
        unitId: 'unit-3',
        number: '3.1',
        title: 'Ordering at a Darshini & Filter Coffee',
        subtitle: 'Quantities, spice levels, and "Sakkare kammi"',
        durationMinutes: 5,
        xpReward: 55,
        keyPhrasesCount: 5,
        exercises: [
          {
            id: 'ex-3-1-1',
            type: 'flashcard_intro',
            prompt: 'Order breakfast and customize your filter coffee',
            situationContext: 'At the token counter of a bustling Bengaluru Darshini',
            kanglish: 'Anna, eradu masala dose, ondu filter coffee — sakkare kammi.',
            kannadaScript: 'ಅಣ್ಣ, ಎರಡು ಮಸಾಲೆ ದೋಸೆ, ಒಂದು ಫಿಲ್ಟರ್ ಕಾಫಿ — ಸಕ್ಕರೆ ಕಮ್ಮಿ.',
            englishMeaning: 'Brother, two masala dosas, one filter coffee — less sugar.',
            literalBreakdown: [
              { word: 'Ondu / Eradu', meaning: 'One / Two' },
              { word: 'Sakkare', meaning: 'Sugar' },
              { word: 'Kammi', meaning: 'Less' },
            ],
            culturalTip: 'In Kannada, it is pronounced "Dose" (ದೋಸೆ) with a soft "e" at the end!',
          },
          {
            id: 'ex-3-1-2',
            type: 'sentence_builder',
            prompt: 'Ask for the bill / total price: "How much did it come to? Do you have UPI / QR?"',
            kanglish: 'Anna, eshtu aaythu? QR code idya?',
            kannadaScript: 'ಅಣ್ಣ, ಎಷ್ಟು ಆಯ್ತು? ಕ್ಯೂಆರ್ ಕೋಡ್ ಇದ್ಯಾ?',
            englishMeaning: 'Brother, how much did it come to? Is there a QR code?',
            sentenceTokens: ['Anna,', 'eshtu', 'aaythu?', 'QR', 'code', 'idya?'],
            distractorTokens: ['beku', 'hogi', 'oota'],
          },
        ],
      },
    ],
  },
  {
    id: 'unit-4',
    number: 4,
    title: 'Workplace, Landlord & Everyday Nuance',
    description: 'Discuss schedules, household maintenance, weather, and build deeper bonds with Kannada-speaking friends.',
    culturalNote: 'Even a few Kannada connectors like "Aamele" (Afterwards) and "parvagilla" (No problem / It\'s okay) transform your conversations.',
    badgeLabel: 'Conversational',
    lessons: [
      {
        id: 'lesson-4-1',
        unitId: 'unit-4',
        number: '4.1',
        title: '"Parvagilla" & Everyday Problem Solving',
        subtitle: 'Coordinate home repairs, schedules, and reassuring phrases',
        durationMinutes: 6,
        xpReward: 60,
        keyPhrasesCount: 5,
        exercises: [
          {
            id: 'ex-4-1-1',
            type: 'flashcard_intro',
            prompt: 'Reassure someone or coordinate timing',
            situationContext: 'When someone apologizes for a 5-minute delay or you schedule a visit',
            kanglish: 'Parvagilla bidi! Naale beligge banni.',
            kannadaScript: 'ಪರವಾಗಿಲ್ಲ ಬಿಡಿ! ನಾಳೆ ಬೆಳಿಗ್ಗೆ ಬನ್ನಿ.',
            englishMeaning: 'No problem at all! Please come tomorrow morning.',
            literalBreakdown: [
              { word: 'Parvagilla', meaning: 'No problem / It does not matter' },
              { word: 'Bidi', meaning: 'Leave it / Don\'t worry' },
              { word: 'Naale beligge', meaning: 'Tomorrow morning' },
            ],
          },
          {
            id: 'ex-4-1-2',
            type: 'multiple_choice',
            prompt: 'Your plumber asks when you will be at home tomorrow. How do you say "I will be at home in the morning"?',
            kanglish: 'Naale beligge naanu maneyalli irthini',
            kannadaScript: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ ನಾನು ಮನೆಯಲ್ಲಿ ಇರ್ತೀನಿ',
            englishMeaning: 'Tomorrow morning I will be at home',
            options: [
              {
                id: 'opt-1',
                kanglish: 'Naale beligge naanu maneyalli irthini',
                kannadaScript: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ ನಾನು ಮನೆಯಲ್ಲಿ ಇರ್ತೀನಿ',
                englishHint: 'Tomorrow morning I will be at home',
                isCorrect: true,
                explanation: '"Maneyalli" means at home, and "irthini" means I will be there.',
              },
              {
                id: 'opt-2',
                kanglish: 'ivathu sanje hogi',
                kannadaScript: 'ಇವತ್ತು ಸಂಜೆ ಹೋಗಿ',
                englishHint: 'Go this evening',
                isCorrect: false,
                explanation: '"Ivathu sanje" means today evening.',
              },
              {
                id: 'opt-3',
                kanglish: 'Nanage gothilla',
                kannadaScript: 'ನನಗೆ ಗೊತ್ತಿಲ್ಲ',
                englishHint: 'I don\'t know',
                isCorrect: false,
                explanation: '"Nanage gothilla" means I do not know.',
              },
            ],
          },
        ],
      },
    ],
  },
];

export const EVERYDAY_SITUATIONS: EverydaySituation[] = [
  {
    id: 'sit-auto-commute',
    title: 'Hailing an Auto & Guiding the Route',
    locationTag: 'Indiranagar 100ft Road -> Metro Station',
    difficulty: 'Beginner',
    summary: 'Practice asking an auto driver if they will come to your destination, agreeing on the meter or a fair price, and giving last-mile turn instructions.',
    xpReward: 35,
    illustrationType: 'auto',
    keyTakeaways: [
      { kanglish: 'Metro station-ge bartheera?', kannadaScript: 'ಮೆಟ್ರೋ ಸ್ಟೇಷನ್‌ಗೆ ಬರ್ತೀರಾ?', english: 'Will you come to the Metro station?' },
      { kanglish: 'Meter haaki anna', kannadaScript: 'ಮೀಟರ್ ಹಾಕಿ ಅಣ್ಣ', english: 'Please put on the meter, brother' },
      { kanglish: 'Munde left thagoli, illi nilisi', kannadaScript: 'ಮುಂದೆ ಲೆಫ್ಟ್ ತಗೊಳ್ಳಿ, ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ', english: 'Take a left ahead, stop right here' },
    ],
    turns: [
      {
        id: 't1',
        speaker: 'learner',
        speakerName: 'You',
        kanglish: 'Anna, Indiranagar Metro station-ge bartheera?',
        kannadaScript: 'ಅಣ್ಣ, ಇಂದಿರಾನಗರ ಮೆಟ್ರೋ ಸ್ಟೇಷನ್‌ಗೆ ಬರ್ತೀರಾ?',
        english: 'Brother, will you come to Indiranagar Metro station?',
        tip: 'Adding "-ge" to any landmark means "to [landmark]".',
        choices: [
          {
            kanglish: 'Anna, Indiranagar Metro station-ge bartheera?',
            kannadaScript: 'ಅಣ್ಣ, ಇಂದಿರಾನಗರ ಮೆಟ್ರೋ ಸ್ಟೇಷನ್‌ಗೆ ಬರ್ತೀರಾ?',
            english: 'Brother, will you come to Indiranagar Metro station?',
            isBest: true,
            feedback: 'Spot on! Polite, clear, and natural.',
          },
          {
            kanglish: 'Indiranagar Metro elli ide?',
            kannadaScript: 'ಇಂದಿರಾನಗರ ಮೆಟ್ರೋ ಎಲ್ಲಿ ಇದೆ?',
            english: 'Where is Indiranagar Metro?',
            isBest: false,
            feedback: 'That asks where the station is located rather than asking the driver to take you there.',
          },
        ],
      },
      {
        id: 't2',
        speaker: 'local',
        speakerName: 'Manjunath (Auto Driver)',
        kanglish: 'Barthini banni sir. Hatthu rupayi extra kodi, traffic ide.',
        kannadaScript: 'ಬರ್ತೀನಿ ಬನ್ನಿ ಸರ್. ಹತ್ತು ರೂಪಾಯಿ ಎಕ್ಸ್ಟ್ರಾ ಕೊಡಿ, ಟ್ರಾಫಿಕ್ ಇದೆ.',
        english: 'I will come, please get in. Give 10 rupees extra, there is traffic.',
        tip: '"Barthini" = I will come, "Banni" = Please come/hop in.',
      },
      {
        id: 't3',
        speaker: 'learner',
        speakerName: 'You',
        kanglish: 'Sari anna, meter haaki. Munde signal hathra nilisi.',
        kannadaScript: 'ಸರಿ ಅಣ್ಣ, ಮೀಟರ್ ಹಾಕಿ. ಮುಂದೆ ಸಿಗ್ನಲ್ ಹತ್ರ ನಿಲ್ಲಿಸಿ.',
        english: 'Okay brother, put the meter on. Stop near the signal ahead.',
        tip: '"Sari" means Okay/Agreed. "Nilisi" means Please stop.',
        choices: [
          {
            kanglish: 'Sari anna, meter haaki. Munde signal hathra nilisi.',
            kannadaScript: 'ಸರಿ ಅಣ್ಣ, ಮೀಟರ್ ಹಾಕಿ. ಮುಂದೆ ಸಿಗ್ನಲ್ ಹತ್ರ ನಿಲ್ಲಿಸಿ.',
            english: 'Okay brother, put on the meter. Stop near the signal ahead.',
            isBest: true,
            feedback: 'Great job! You agreed and gave a clear landmark.',
          },
          {
            kanglish: 'Beda anna, naale banni.',
            kannadaScript: 'ಬೇಡ ಅಣ್ಣ, ನಾಳೆ ಬನ್ನಿ.',
            english: 'No need brother, come tomorrow.',
            isBest: false,
            feedback: 'Unless you want to cancel your ride until tomorrow, use "Sari anna"!',
          },
        ],
      },
    ],
  },
  {
    id: 'sit-darshini-coffee',
    title: 'Morning Breakfast & Filter Coffee at a Darshini',
    locationTag: 'Jayanagar Brahmin\'s Tiffin Room',
    difficulty: 'Beginner',
    summary: 'Order crispy Benne Masala Dose and steaming brass-tumbler Filter Coffee with custom sugar preferences.',
    xpReward: 35,
    illustrationType: 'darshini',
    keyTakeaways: [
      { kanglish: 'Ondu masala dose, eradu idli kodi', kannadaScript: 'ಒಂದು ಮಸಾಲೆ ದೋಸೆ, ಎರಡು ಇಡ್ಲಿ ಕೊಡಿ', english: 'Give one masala dosa and two idlis' },
      { kanglish: 'Swalpa chutney kodi', kannadaScript: 'ಸ್ವಲ್ಪ ಚಟ್ನಿ ಕೊಡಿ', english: 'Please give a little more chutney' },
      { kanglish: 'Filter coffee, sakkare kammi', kannadaScript: 'ಫಿಲ್ಟರ್ ಕಾಫಿ, ಸಕ್ಕರೆ ಕಮ್ಮಿ', english: 'Filter coffee, less sugar' },
    ],
    turns: [
      {
        id: 'd1',
        speaker: 'local',
        speakerName: 'Cashier',
        kanglish: 'Namaskara! Yenu beku helri?',
        kannadaScript: 'ನಮಸ್ಕಾರ! ಏನು ಬೇಕು ಹೇಳ್ರಿ?',
        english: 'Hello! Tell me what you would like?',
        tip: '"Yenu beku?" literally means "What is wanted/needed?"',
      },
      {
        id: 'd2',
        speaker: 'learner',
        speakerName: 'You',
        kanglish: 'Ondu masala dose matthu ondu filter coffee kodi. Sakkare kammi.',
        kannadaScript: 'ಒಂದು ಮಸಾಲೆ ದೋಸೆ ಮತ್ತು ಒಂದು ಫಿಲ್ಟರ್ ಕಾಫಿ ಕೊಡಿ. ಸಕ್ಕರೆ ಕಮ್ಮಿ.',
        english: 'Please give one masala dosa and one filter coffee. Less sugar.',
        tip: '"Matthu" means "and". "Kodi" means "please give".',
        choices: [
          {
            kanglish: 'Ondu masala dose matthu ondu filter coffee kodi. Sakkare kammi.',
            kannadaScript: 'ಒಂದು ಮಸಾಲೆ ದೋಸೆ ಮತ್ತು ಒಂದು ಫಿಲ್ಟರ್ ಕಾಫಿ ಕೊಡಿ. ಸಕ್ಕರೆ ಕಮ್ಮಿ.',
            english: 'One masala dosa and one filter coffee please. Less sugar.',
            isBest: true,
            feedback: 'Authentic Darshini ordering pro!',
          },
          {
            kanglish: 'Coffee beda, neeru maathra.',
            kannadaScript: 'ಕಾಫಿ ಬೇಡ, ನೀರು ಮಾತ್ರ.',
            english: 'No coffee, water only.',
            isBest: false,
            feedback: 'You came for the famous filter coffee—use "ondu filter coffee kodi"!',
          },
        ],
      },
    ],
  },
  {
    id: 'sit-delivery-call',
    title: 'Guiding a Delivery Partner to Your Gate',
    locationTag: 'HSR Layout Apartment Gate',
    difficulty: 'Practical',
    summary: 'Handle the classic phone call: "Sir location hathra iddini, yelli barbeku?" without switching back to English.',
    xpReward: 40,
    illustrationType: 'delivery',
    keyTakeaways: [
      { kanglish: 'dead-end alli black gate ide', kannadaScript: 'ಡೆಡ್-ಎಂಡ್ ಅಲ್ಲಿ ಬ್ಲಾಕ್ ಗೇಟ್ ಇದೆ', english: 'At the dead-end there is a black gate' },
      { kanglish: 'Security hathra kodi, naanu bandhe', kannadaScript: 'ಸೆಕ್ಯೂರಿಟಿ ಹತ್ರ ಕೊಡಿ, ನಾನು ಬಂದೆ', english: 'Give it near security, I am coming right now' },
    ],
    turns: [
      {
        id: 'del1',
        speaker: 'local',
        speakerName: 'Puneeth (Delivery Partner)',
        kanglish: 'Hello sir, nimma building road-alli iddini. Yelli barbeku?',
        kannadaScript: 'ಹಲೋ ಸರ್, ನಿಮ್ಮ ಬಿಲ್ಡಿಂಗ್ ರೋಡಲ್ಲಿ ಇದ್ದೀನಿ. ಎಲ್ಲಿ ಬರ್ಬೇಕು?',
        english: 'Hello sir, I am on your building road. Where should I come?',
        tip: '"Yelli barbeku?" = Where should I come?',
      },
      {
        id: 'del2',
        speaker: 'learner',
        speakerName: 'You',
        kanglish: 'Anna, seedha banni. Park pakkadalli black gate ide. Security hathra kodi.',
        kannadaScript: 'ಅಣ್ಣ, ಸೀದಾ ಬನ್ನಿ. ಪಾರ್ಕ್ ಪಕ್ಕದಲ್ಲಿ ಬ್ಲಾಕ್ ಗೇಟ್ ಇದೆ. ಸೆಕ್ಯೂರಿಟಿ ಹತ್ರ ಕೊಡಿ.',
        english: 'Brother, come straight. Next to the park is a black gate. Leave it near security.',
        tip: '"Pakkadalli" means "next to / beside".',
        choices: [
          {
            kanglish: 'Anna, seedha banni. Park pakkadalli black gate ide. Security hathra kodi.',
            kannadaScript: 'ಅಣ್ಣ, ಸೀದಾ ಬನ್ನಿ. ಪಾರ್ಕ್ ಪಕ್ಕದಲ್ಲಿ ಬ್ಲಾಕ್ ಗೇಟ್ ಇದೆ. ಸೆಕ್ಯೂರಿಟಿ ಹತ್ರ ಕೊಡಿ.',
            english: 'Come straight. Next to the park there is a black gate. Give it near security.',
            isBest: true,
            feedback: 'Crystal clear directions! "Pakkadalli" (beside) is super handy.',
          },
          {
            kanglish: 'Naale beligge banni anna.',
            kannadaScript: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ ಬನ್ನಿ ಅಣ್ಣ.',
            english: 'Come tomorrow morning brother.',
            isBest: false,
            feedback: 'Your hot dinner is outside right now!',
          },
        ],
      },
    ],
  },
  {
    id: 'sit-local-market',
    title: 'Fresh Vegetables & Coconut Water at the Market',
    locationTag: 'Malleshwaram Flower & Produce Market',
    difficulty: 'Practical',
    summary: 'Ask prices per kilo, pick sweet tender coconuts (Elaneeru), and pay via UPI.',
    xpReward: 40,
    illustrationType: 'market',
    keyTakeaways: [
      { kanglish: 'Kilo eshtu akka?', kannadaScript: 'ಕಿಲೋ ಎಷ್ಟು ಅಕ್ಕ?', english: 'How much per kilo, sister?' },
      { kanglish: 'ardha kilo kodi', kannadaScript: 'ಅರ್ಧ ಕಿಲೋ ಕೊಡಿ', english: 'Give half a kilo' },
      { kanglish: 'Sihi elaneeru kodi', kannadaScript: 'ಸಿಹಿ ಎಳನೀರು ಕೊಡಿ', english: 'Give sweet tender coconut water' },
    ],
    turns: [
      {
        id: 'm1',
        speaker: 'learner',
        speakerName: 'You',
        kanglish: 'Akka, tomato kilo eshtu? Ardha kilo kodi.',
        kannadaScript: 'ಅಕ್ಕ, ಟೊಮೆಟೊ ಕಿಲೋ ಎಷ್ಟು? ಅರ್ಧ ಕಿಲೋ ಕೊಡಿ.',
        english: 'Sister, how much is a kilo of tomatoes? Please give half a kilo.',
        tip: '"Ardha" = Half, " Kaalu" = Quarter (1/4).',
        choices: [
          {
            kanglish: 'Akka, tomato kilo eshtu? Ardha kilo kodi.',
            kannadaScript: 'ಅಕ್ಕ, ಟೊಮೆಟೊ ಕಿಲೋ ಎಷ್ಟು? ಅರ್ಧ ಕಿಲೋ ಕೊಡಿ.',
            english: 'Sister, how much per kilo of tomatoes? Give half a kilo.',
            isBest: true,
            feedback: 'Great! Addressing women vendors respectfully as "Akka" (elder sister) or "Amma" (mother) is customary.',
          },
          {
            kanglish: 'Tomato beda, hogi.',
            kannadaScript: 'ಟೊಮೆಟೊ ಬೇಡ, ಹೋಗಿ.',
            english: 'Don\'t want tomatoes, go.',
            isBest: false,
            feedback: 'Too abrupt! Use "Kilo eshtu?" to check the price.',
          },
        ],
      },
    ],
  },
];

export const VOCABULARY_ITEMS: VocabPhrase[] = [
  {
    id: 'v1',
    category: 'Greetings',
    kanglish: 'Namaskara',
    kannadaScript: 'ನಮಸ್ಕಾರ',
    english: 'Hello / Respectful greetings',
    literalMeaning: 'I bow to you',
    usageContext: 'Universal greeting for any time of day with anyone.',
  },
  {
    id: 'v2',
    category: 'Greetings',
    kanglish: 'Chennagiddira?',
    kannadaScript: 'ಚೆನ್ನಾಗಿದ್ದೀರಾ?',
    english: 'How are you? / Are you doing well?',
    literalMeaning: 'Well-are-you (respectful plural)',
    usageContext: 'Follow-up right after Namaskara.',
  },
  {
    id: 'v3',
    category: 'Greetings',
    kanglish: 'Naanu chennagiddini',
    kannadaScript: 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೀನಿ',
    english: 'I am doing well',
    literalMeaning: 'I well-am',
    usageContext: 'Standard warm reply to Chennagiddira.',
  },
  {
    id: 'v4',
    category: 'Work & Social',
    kanglish: 'Oota aaytha?',
    kannadaScript: 'ಊಟ ಆಯ್ತಾ?',
    english: 'Did you have your meal?',
    literalMeaning: 'Meal happened-question',
    usageContext: 'Karnataka\'s favorite icebreaker and expression of care around breakfast, lunch, or dinner.',
  },
  {
    id: 'v5',
    category: 'Work & Social',
    kanglish: ' ಕಾಫಿ / ಟೀ ಆಯ್ತಾ? (Coffee / Tea aaytha?)',
    kannadaScript: 'ಕಾಫಿ ಆಯ್ತಾ?',
    english: 'Have you had coffee/tea?',
    literalMeaning: 'Coffee happened?',
    usageContext: 'Used between 9 AM–11 AM and 4 PM–6 PM in offices and neighborhoods.',
  },
  {
    id: 'v6',
    category: 'Greetings',
    kanglish: 'Dayavittu',
    kannadaScript: 'ದಯವಿಟ್ಟು',
    english: 'Please',
    literalMeaning: 'Placing kindness',
    usageContext: 'Polite prefix for requests.',
  },
  {
    id: 'v7',
    category: 'Greetings',
    kanglish: 'Thumba dhanyavadagalu',
    kannadaScript: 'ತುಂಬಾ ಧನ್ಯವಾದಗಳು',
    english: 'Thank you very much',
    literalMeaning: 'Many thanks',
    usageContext: 'Expressing heartfelt gratitude.',
  },
  {
    id: 'v8',
    category: 'Commute',
    kanglish: 'Indiranagar-ge bartheera?',
    kannadaScript: 'ಇಂದಿರಾನಗರಗೆ ಬರ್ತೀರಾ?',
    english: 'Will you come to Indiranagar?',
    literalMeaning: 'To-Indiranagar will-you-come?',
    usageContext: 'Replace "Indiranagar" with any destination when hailing an auto.',
  },
  {
    id: 'v9',
    category: 'Commute',
    kanglish: 'Meter haaki anna',
    kannadaScript: 'ಮೀಟರ್ ಹಾಕಿ ಅಣ್ಣ',
    english: 'Please put on the meter, brother',
    literalMeaning: 'Meter put elder-brother',
    usageContext: 'Polite way to ask auto drivers to run by the meter.',
  },
  {
    id: 'v10',
    category: 'Commute',
    kanglish: 'Seedha hogi, munde left thagoli',
    kannadaScript: 'ಸೀದಾ ಹೋಗಿ, ಮುಂದೆ ಲೆಫ್ಟ್ ತಗೊಳ್ಳಿ',
    english: 'Go straight, take a left ahead',
    literalMeaning: 'Straight go, ahead left take',
    usageContext: 'Guiding auto or cab drivers through neighborhood lanes.',
  },
  {
    id: 'v11',
    category: 'Commute',
    kanglish: 'Illi nilisi',
    kannadaScript: 'ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ',
    english: 'Please stop right here',
    literalMeaning: 'Here stop',
    usageContext: 'When you reach your drop-off spot.',
  },
  {
    id: 'v12',
    category: 'Food & Cafe',
    kanglish: 'Ondu filter coffee kodi, sakkare kammi',
    kannadaScript: 'ಒಂದು ಫಿಲ್ಟರ್ ಕಾಫಿ ಕೊಡಿ, ಸಕ್ಕರೆ ಕಮ್ಮಿ',
    english: 'Give one filter coffee, less sugar',
    literalMeaning: 'One filter coffee give, sugar less',
    usageContext: 'Ordering at any Darshini or cafe.',
  },
  {
    id: 'v13',
    category: 'Food & Cafe',
    kanglish: 'Khaara kammi maadi',
    kannadaScript: 'ಖಾರ ಕಮ್ಮಿ ಮಾಡಿ',
    english: 'Please make it less spicy',
    literalMeaning: 'Spice less make',
    usageContext: 'Customizing food orders at restaurants.',
  },
  {
    id: 'v14',
    category: 'Food & Cafe',
    kanglish: 'Bisi neeru kodi',
    kannadaScript: 'ಬಿಸಿ ನೀರು ಕೊಡಿ',
    english: 'Please give warm/hot drinking water',
    literalMeaning: 'Hot water give',
    usageContext: 'Very common request at South Indian restaurants.',
  },
  {
    id: 'v15',
    category: 'Shopping & Numbers',
    kanglish: 'Idhu eshtu? / Eshtu aaythu?',
    kannadaScript: 'ಇದು ಎಷ್ಟು? / ಎಷ್ಟು ಆಯ್ತು?',
    english: 'How much is this? / What is the total?',
    literalMeaning: 'This how-much / How-much happened',
    usageContext: 'Asking price before or after buying.',
  },
  {
    id: 'v16',
    category: 'Shopping & Numbers',
    kanglish: 'Ondu (1), Eradu (2), Mooru (3), Naalku (4), Aidu (5)',
    kannadaScript: 'ಒಂದು, ಎರಡು, ಮೂರು, ನಾಲ್ಕು, ಐದು',
    english: 'Numbers 1 to 5',
    literalMeaning: '1, 2, 3, 4, 5',
    usageContext: 'Essential for ordering plates of idli/dosa or counting items.',
  },
  {
    id: 'v17',
    category: 'Shopping & Numbers',
    kanglish: 'Hathu (10), Aivathu (50), Nooru (100)',
    kannadaScript: 'ಹತ್ತು (10), ಐವತ್ತು (50), ನೂರು (100)',
    english: '10, 50, and 100',
    literalMeaning: 'Ten, Fifty, Hundred',
    usageContext: 'Crucial for auto fares and vegetable market prices.',
  },
  {
    id: 'v18',
    category: 'Work & Social',
    kanglish: 'Naanu swalpa Kannada kalitha iddini',
    kannadaScript: 'ನಾನು ಸ್ವಲ್ಪ ಕನ್ನಡ ಕಲಿತಾ ಇದ್ದೀನಿ',
    english: 'I am learning a little Kannada',
    literalMeaning: 'I a-little Kannada learning am',
    usageContext: 'Guarantees encouragement and patience from any local speaker.',
  },
  {
    id: 'v19',
    category: 'Work & Social',
    kanglish: 'Parvagilla bidi',
    kannadaScript: 'ಪರವಾಗಿಲ್ಲ ಬಿಡಿ',
    english: 'No problem at all / Never mind',
    literalMeaning: 'It-matters-not leave-it',
    usageContext: 'Reassuring someone when they apologize.',
  },
  {
    id: 'v20',
    category: 'Emergency',
    kanglish: 'Dayavittu sahaya maadi',
    kannadaScript: 'ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ',
    english: 'Please help me',
    literalMeaning: 'Please help do',
    usageContext: 'Asking passersby or officials for immediate assistance.',
  },
];
