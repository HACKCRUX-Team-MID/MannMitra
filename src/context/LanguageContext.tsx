import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Language = 'en' | 'hi'

const translations: Record<string, Record<Language, string>> = {
  // Settings page
  'settings.title': { en: 'Settings', hi: 'सेटिंग्स' },
  'settings.analytics': { en: 'Analytics', hi: 'विश्लेषण' },

  // Profile
  'profile.accountDetails': { en: 'Account Details', hi: 'खाता विवरण' },

  // Privacy badges
  'privacy.encrypted': { en: 'Encrypted', hi: 'एन्क्रिप्टेड' },
  'privacy.localFirst': { en: 'Local First', hi: 'लोकल फर्स्ट' },
  'privacy.noSharing': { en: 'No Sharing', hi: 'शेयरिंग नहीं' },

  // Tracking
  'tracking.title': { en: 'Tracking', hi: 'ट्रैकिंग' },
  'tracking.behavioral': { en: 'Behavioral Insights', hi: 'व्यवहार विश्लेषण' },
  'tracking.behavioralDesc': { en: 'Mood predictions from habits', hi: 'आदतों से मूड भविष्यवाणी' },
  'tracking.sleep': { en: 'Sleep Data', hi: 'नींद डेटा' },
  'tracking.sleepDesc': { en: 'Track sleep patterns', hi: 'नींद पैटर्न ट्रैक करें' },
  'tracking.screen': { en: 'Screen Time', hi: 'स्क्रीन टाइम' },
  'tracking.screenDesc': { en: 'Monitor device usage', hi: 'डिवाइस उपयोग की निगरानी' },
  'tracking.steps': { en: 'Step Count', hi: 'कदम गणना' },
  'tracking.stepsDesc': { en: 'Track daily steps', hi: 'दैनिक कदम ट्रैक करें' },

  // Preferences
  'prefs.title': { en: 'Preferences', hi: 'प्राथमिकताएं' },
  'prefs.reminders': { en: 'Gentle Reminders', hi: 'अनुस्मारक' },
  'prefs.remindersDesc': { en: 'Soft nudges to journal', hi: 'जर्नल लिखने के लिए अनुस्मारक' },
  'prefs.darkMode': { en: 'Dark Mode', hi: 'डार्क मोड' },
  'prefs.darkModeDesc': { en: 'Softer appearance', hi: 'हल्का रूप' },

  // Language
  'lang.title': { en: 'Language / भाषा', hi: 'भाषा / Language' },
  'lang.english': { en: 'English', hi: 'English' },
  'lang.switchHindi': { en: 'हिन्दी में बदलें', hi: 'Switch to English' },

  // About
  'about.title': { en: 'About', hi: 'जानकारी' },
  'about.mannmitra': { en: 'About MannMitra', hi: 'MannMitra के बारे में' },
  'about.body': {
    en: 'MannMitra is your personal mental wellness companion. It helps you track your emotions, identify patterns, and build healthier habits through AI-powered journaling and behavioral insights — all with a privacy-first design. Your data stays on your device first, and is always encrypted.',
    hi: 'MannMitra आपका व्यक्तिगत मानसिक स्वास्थ्य साथी है। यह आपकी भावनाओं को ट्रैक करने, पैटर्न पहचानने और AI-संचालित जर्नलिंग व व्यवहार विश्लेषण से स्वस्थ आदतें बनाने में मदद करता है — सब कुछ गोपनीयता-प्रथम डिज़ाइन के साथ। आपका डेटा पहले आपके डिवाइस पर रहता है और हमेशा एन्क्रिप्टेड होता है।',
  },

  // Data & Account
  'data.title': { en: 'Data & Account', hi: 'डेटा और खाता' },
  'data.export': { en: 'Export All Data', hi: 'सभी डेटा निर्यात करें' },
  'data.privacy': { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  'data.help': { en: 'Help & Support', hi: 'सहायता' },

  // Crisis
  'crisis.title': { en: 'Crisis Resources', hi: 'आपातकालीन संसाधन' },
  'crisis.helplines': { en: 'Emergency Helplines', hi: 'आपातकालीन हेल्पलाइन' },

  // Danger zone
  'danger.title': { en: 'Danger Zone', hi: 'खतरे का क्षेत्र' },
  'danger.delete': { en: 'Delete All Data', hi: 'सभी डेटा हटाएं' },
  'danger.deleteDesc': { en: 'Remove all entries and stored data', hi: 'सभी प्रविष्टियाँ और संग्रहीत डेटा हटाएं' },
  'danger.confirmTitle': { en: 'Are you absolutely sure?', hi: 'क्या आप पूरी तरह से सुनिश्चित हैं?' },
  'danger.confirmDesc': {
    en: 'This action cannot be undone. This will permanently delete all your journal entries and stored data.',
    hi: 'यह क्रिया पूर्ववत नहीं की जा सकती। यह आपकी सभी जर्नल प्रविष्टियाँ और डेटा स्थायी रूप से हटा देगा।',
  },
  'danger.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'danger.confirm': { en: 'Yes, delete everything', hi: 'हाँ, सब हटाएं' },

  // Sign out
  'signOut': { en: 'Sign Out', hi: 'साइन आउट' },

  // Nav items
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.journal': { en: 'Journal', hi: 'जर्नल' },
  'nav.companion': { en: 'Companion', hi: 'साथी' },
  'nav.insights': { en: 'Insights', hi: 'अंतर्दृष्टि' },
  'nav.moodAI': { en: 'Mood AI', hi: 'मूड AI' },
  'nav.settings': { en: 'Settings', hi: 'सेटिंग्स' },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('mannmitra-lang') as Language) || 'en'
  })

  useEffect(() => {
    localStorage.setItem('mannmitra-lang', language)
    document.documentElement.setAttribute('lang', language)
  }, [language])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
  }, [])

  const t = useCallback((key: string): string => {
    return translations[key]?.[language] || key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
