import Vue from 'vue'
import ptBR from './locales/pt-BR.json'
import en from './locales/en.json'

const LOCALE_STORAGE_KEY = 'locale'
const DEFAULT_LOCALE = 'pt-BR'
const FALLBACK_LOCALE = 'en'

const messages = {
  'pt-BR': ptBR,
  en,
}

const getInitialLocale = () => {
  const stored = window.localStorage?.getItem(LOCALE_STORAGE_KEY)
  if (stored && messages[stored]) {
    return stored
  }
  return DEFAULT_LOCALE
}

const state = Vue.observable({
  locale: getInitialLocale(),
})

const interpolate = (value, params = {}) => {
  return value.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] ?? `{${key}}`
  })
}

const resolveMessage = (locale, key) => {
  const parts = key.split('.')
  let current = messages[locale]
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return null
    }
    current = current[part]
  }
  return typeof current === 'string' ? current : null
}

const i18n = {
  state,
  supportedLocales: Object.keys(messages),
  t(key, params = {}) {
    const localized = resolveMessage(state.locale, key)
    if (localized) {
      return interpolate(localized, params)
    }
    const fallback = resolveMessage(FALLBACK_LOCALE, key)
    if (fallback) {
      return interpolate(fallback, params)
    }
    return key
  },
  setLocale(locale) {
    if (!messages[locale]) {
      return
    }
    state.locale = locale
    window.localStorage?.setItem(LOCALE_STORAGE_KEY, locale)
  },
}

export const I18nPlugin = {
  install(VueInstance) {
    VueInstance.mixin({
      computed: {
        $locale() {
          return i18n.state.locale
        },
      },
    })

    VueInstance.prototype.$t = function (key, params = {}) {
      // touch reactive locale so templates update on language change
      this.$locale
      return i18n.t(key, params)
    }
    VueInstance.prototype.$setLocale = i18n.setLocale
    VueInstance.prototype.$supportedLocales = i18n.supportedLocales
  },
}

export default i18n
