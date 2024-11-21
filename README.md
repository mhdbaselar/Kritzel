# Kritzel

**Kritzel** ist ein kreatives Multiplayer-Zeichenspiel, das es Benutzern ermöglicht, gemeinsam in Echtzeit auf einer Leinwand zu zeichnen, Nachrichten auszutauschen und Punkte zu sammeln. Es ist inspiriert von bekannten Spielen wie Skribbl.io, aber mit einer individuellen Umsetzung.

## 📋 Features

- **Echtzeit-Zeichnen**: Zeichne mit Freunden auf derselben Leinwand.
- **Benutzernamen-Eingabe**: Benutzer können ihren Namen eingeben, der im Spiel und im Chat angezeigt wird.
- **Farben und Stiftgrößen**: Wähle aus verschiedenen Farben und Stiftgrößen für maximale Kreativität.
- **Punktesystem**: Verfolge deine Punkte in einer Benutzerliste.
- **Chat-Funktion**: Kommuniziere mit anderen Spielern im Chat.
- **Docker-Unterstützung**: Einfacher Start über Docker für eine einheitliche Umgebung.

## Konflikte zwischen Windows und Git

Alle Windows-Nutzer sollten bei sich auf dem Windows-System die folgende Einstellung (einfach irgendwo im CMD) vornehmen:
> git config --global core.autocrlf true

## Lokale Ausführung

Empfohlen wird die lokale Ausführung des Projekts als Docker Container. Dazu befinden sich im obersten Verzeichnis eine docker-compose.yml und ein Dockerfile zun automatischen Build und Start des Docker-Containers.

Sowohl zum erstmaligen Build des Containers als auch zum Recreate (nach Änderungen am Quellcode) kann der folgende Befehl im Hauptverzeichnis (dort wo docker-compose.yml und Dockerfile liegen) ausgeführt werden:
> docker compose build --no-cache

Nach dem Build des Containers lässt sich der Container starten mit
> docker compose up -d

Im Buildprozess wird automatisch auf Grundlage des Quelltextes eine aktualisierte bundle.js erstellt und benötigte Pakete installiert. Sollte die Ausführung ohne Docker-Container gewünscht sein, lässt sich dies durch die folgenden Befehle durchführen (Befehle müssen im Verzeichnis app ausgeführt werden):

> browserify ./client/main.js -o ./public/bundle.js

> npm install

> node ./kritzel.js

Bitte beachtet, dass der Docker-Container sicherstellt, dass sich die Software im Deployment genau so verhält wie bei euch lokal auf dem Rechner. Die Arbeit ohne Docker-Container, sondern nur mit lokalem Environment, kann zu unvorhergesehenen Bugs führen.