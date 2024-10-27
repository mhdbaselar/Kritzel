# Kritzel

## Lokale Ausführung

Empfohlen wird die lokale Ausführung des Projekts als Docker Container. Dazu befinden sich im obersten Verzeichnis eine docker-compose.yml und ein Dockerfile zun automatischen Build und Start des Docker-Containers.

Sowohl zum erstmaligen Build des Containers als auch zum Recreate (nach Änderungen am Quellcode) kann der folgende Befehl im Hauptverzeichnis (dort wo docker-compose.yml und Dockerfile liegen) ausgeführt werden:
> docker compose build --no-cache

Nach dem Build des Containers lässt sich der Container starten mit
> docker compose up -d

Im Buildprozess wird automatisch auf Grundlage des Quelltextes eine aktualisierte bundle.js erstellt und benötigte Pakete installiert. Sollte die Ausführung ohne Docker-Container gewünscht sein, lässt sich dies durch die folgenden Befehle durchführen (Befehle müssen im Verzeichnis app ausgeführt werden):

> browserify ./client/main.js -o ./public/bundle.js

> npm install

> node ./server/gameserver.js

Bitte beachtet, dass der Docker-Container sicherstellt, dass sich die Software im Deployment genau so verhält wie bei euch lokal auf dem Rechner. Die Arbeit ohne Docker-Container, sondern nur mit lokalem Environment, kann zu unvorhergesehenen Bugs führen.