# facaccimo

A static web app for easy management of cubari.moe sources.

https://stirante.com/facaccimo/index.html

## Localization (i18n)

The UI now supports runtime localization with default locale set to `pt-BR` and fallback locale `en`.

- Locale files live in `src/i18n/locales/`.
- Supported locales can be switched from the app header.
- The selected locale is persisted in browser `localStorage` under `locale`.

## GitHub Pages (fork-ready)

This repository is configured to deploy through GitHub Actions using `.github/workflows/deploy-pages.yml`.

1. Push your changes to `main`.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Source: GitHub Actions**.
4. Wait for the workflow **Deploy to GitHub Pages** to finish.

Expected URL format for any fork:

- `https://<github-username>.github.io/<repo-name>/`

Example:

- `https://jhoorodre.github.io/facaccimo/`

> Note: this project builds into `desktop-wrapper/dist` (configured in `vue.config.js`), and the workflow already publishes that folder.

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
