export default class CorsProxy {

    static URL = 'https://cors.stirante.com';
    static DEV_URL = 'http://localhost:3000';
    static STORAGE_KEY = 'facaccimoCorsProxy';
    static QUERY_PARAM = 'proxy';

    static normalizeUrl(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }
        const clean = url.trim().replace(/\/$/, '');
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
            return null;
        }
        return clean;
    }

    static getCustomProxyUrl() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }
        return this.normalizeUrl(window.localStorage.getItem(CorsProxy.STORAGE_KEY));
    }

    static setCustomProxyUrl(url) {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }
        const normalized = this.normalizeUrl(url);
        if (!normalized) {
            window.localStorage.removeItem(CorsProxy.STORAGE_KEY);
            return;
        }
        window.localStorage.setItem(CorsProxy.STORAGE_KEY, normalized);
    }

    static getProxyFromQuery() {
        if (typeof window === 'undefined' || !window.location) {
            return null;
        }
        const queryUrl = new URLSearchParams(window.location.search).get(CorsProxy.QUERY_PARAM);
        return this.normalizeUrl(queryUrl);
    }

    static get(url, headers) {
        if (window.isElectron) {
            return fetch(url, {
                headers: headers
            })
        }
        if (url.startsWith('https://')) {
            url = url.replace('https://', '');
        }
        return fetch(CorsProxy.getProxyUrl() + '/' + url, {
            headers: headers
        })
    }

    static getProxyUrl() {
        if (window.isElectron) {
            return undefined;
        }
        const queryProxy = this.getProxyFromQuery();
        if (queryProxy) {
            this.setCustomProxyUrl(queryProxy);
            return queryProxy;
        }
        const custom = this.getCustomProxyUrl();
        if (custom) {
            return custom;
        }
        if (process.env.NODE_ENV === 'development') {
            return CorsProxy.DEV_URL;
        }
        return CorsProxy.URL;
    }

    static isAvailable() {
        if (window.isElectron) {
            return new Promise((resolve) => resolve(true));
        }
        return this.get('https://github.com/')
            .then((response) => response.ok)
            .catch(() => false);
    }
}
