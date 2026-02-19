// I18n class for color-blindness app
;(function() {
try {

class I18n {
    constructor() {
        this.translations = {};
        this.supportedLanguages = ['ko', 'en', 'zh', 'hi', 'ru', 'ja', 'es', 'pt', 'id', 'tr', 'de', 'fr'];
        this.currentLang = this.detectLanguage();
    }
    detectLanguage() {
        const savedLang = localStorage.getItem('app_language');
        if (savedLang && this.supportedLanguages.includes(savedLang)) return savedLang;
        const browserLang = (navigator.language || navigator.userLanguage).split('-')[0];
        if (this.supportedLanguages.includes(browserLang)) return browserLang;
        return 'en';
    }
    async loadTranslations(lang) {
        try {
            const response = await fetch(`js/locales/${lang}.json`);
            if (!response.ok) throw new Error('Not found');
            this.translations[lang] = await response.json();
            return true;
        } catch (e) {
            if (lang !== 'en') return this.loadTranslations('en');
            return false;
        }
    }
    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        for (const k of keys) {
            if (value && value[k] !== undefined) value = value[k]; else return key;
        }
        return value;
    }
    async setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) return false;
        if (!this.translations[lang]) await this.loadTranslations(lang);
        this.currentLang = lang;
        localStorage.setItem('app_language', lang);
        document.documentElement.lang = lang;
        this.updateUI();
        return true;
    }
    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const val = this.t(el.getAttribute('data-i18n'));
            if (val !== el.getAttribute('data-i18n')) el.textContent = val;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const val = this.t(el.getAttribute('data-i18n-placeholder'));
            if (val !== el.getAttribute('data-i18n-placeholder')) el.placeholder = val;
        });
        const title = this.t('app.title');
        if (title !== 'app.title') document.title = title;
        const meta = document.querySelector('meta[name="description"]');
        const desc = this.t('app.description');
        if (meta && desc !== 'app.description') meta.content = desc;
    }
    getCurrentLanguage() { return this.currentLang; }
}

window.i18n = new I18n();

} catch(e) { console.error('i18n init error:', e); }
})();
