import VueI18n from 'vue-i18n'
import Vue from 'vue'
// import { apiPost } from './util/api'
// import { allLanguages } from './util/languages'
const loadedLocales = import.meta.globEager('./locales/*.json')
const messages = {}
Object.entries(loadedLocales).forEach(([key, value]) => {
  messages[key.slice(10).slice(0, -5)] = value
})

// Js code to insert all languages to database
// Object.entries(loadedLocales).forEach(([key, value]) => {
//   const code = key.slice(10).slice(0, -5)
//   const languageItem = allLanguages.find((language) => language.code === code.toLocaleLowerCase())
//   const content = value

//   apiPost('/languages', {
//     code: code.toLocaleLowerCase(),
//     name: languageItem?.name || '',
//     content,
//   }).then((res) => {
//     console.log('res', res)
//   })
// })

Vue.use(VueI18n)

let i18n = new VueI18n({
  locale: 'en',
  messages,
})

export default i18n
