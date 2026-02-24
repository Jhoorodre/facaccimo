# facaccimo

A static web app for easy management of cubari.moe sources.

https://stirante.com/facaccimo/index.html

## Localization (i18n)

The UI now supports runtime localization with default locale set to `pt-BR` and fallback locale `en`.

- Locale files live in `src/i18n/locales/`.
- Supported locales can be switched from the app header.
- The selected locale is persisted in browser `localStorage` under `locale`.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```
