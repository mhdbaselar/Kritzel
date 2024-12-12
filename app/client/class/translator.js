"use strict";

module.exports = class Translator {
  #translations;
  #tokenPattern;

  constructor() {
    // Token Format: {{key}}
    this.#tokenPattern = /\{\{(\w+)\}\}/g;
    
    // Übersetzungen nach Sprache
    this.#translations = {
      'de': {
        'START_GAME': 'Spiel starten',
        'CHOOSE_WORD': 'Wähle ein Wort',
        'YOUR_TURN': 'Du bist dran',
        'TIMER': 'Zeit verbleibend',
        'USERNAME_PROMPT': 'Benutzernamen eingeben',
        'JOIN': 'Beitreten',
        'CREATE': 'Erstellen', 
        'DONE': 'Fertig'
      },
      'en': {
        'START_GAME': 'Start game',
        'CHOOSE_WORD': 'Choose a word', 
        'YOUR_TURN': 'Your turn',
        'TIMER': 'Time remaining',
        'USERNAME_PROMPT': 'Enter username',
        'JOIN': 'Join',
        'CREATE': 'Create',
        'DONE': 'Done'
      }
    };
  }

  translate(text, language) {
    if (!this.#translations[language]) {
      return text; // Fallback auf Original wenn Sprache nicht unterstützt
    }

    return text.replace(this.#tokenPattern, (match, token) => {
      return this.#translations[language][token] || match;
    });
  }
}