"use strict";

module.exports = class Translator {
  constructor() {
    this._tokenPattern = /\{\{(\w+)\}\}/g;
    this._translations = {};
    this._loadTranslations();
  }

  _loadTranslations() {
    try {
      this._translations = {
        'de': require('../translations/de.json'),
        'en': require('../translations/en.json')
      };
    } catch (error) {
      console.error('Fehler beim Laden der Übersetzungen:', error);
    }
  }

  getTokenPattern() {
    return this._tokenPattern;
  }

  translate(text, language) {
    if (!this._translations[language]) {
      return text;
    }

    return text.replace(this._tokenPattern, (match, token) => {
      return this._translations[language][token] || match;
    });
  }
}