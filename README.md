# Kritzel

## Konflikte zwischen Windows und Git

Da Microsoft kläglich mit ihrer Marktmacht versuchte, ein eigenes Dateisystem (DOS-Dateisystem) in die Welt zu setzen und damit das Unix-Dateisystem (Linux, MacOS, Git und basically ALLES andere) zu verdrängen, haben wir, da wir in der Gruppe beide Dateisysteme verwenden, nun das Vergnügen, dass es immer mal wieder zu Konflikten bei Windows und Git kommen wird. Alle Windows-Nutzer sollten deshalb bei sich auf dem Windows-System die folgende Einstellung (einfach irgendwo im CMD) vornehmen:
> git config --global core.autocrlf true

Sollte es danach noch zu Fehlern kommen, sollte sich von den betroffenen Nutzern ernsthaft über die Anschaffung eines vernünftigen (Unix-Like) Betriebssystem Gedanken gemacht werden, da ich hier mit Microsofts "Wir kochen hier unser eigenes Ding und begeben uns auf keinen Fall auf bestehende Standards aller anderen hinab"-Gehabe fertig habe und auch nicht mehr weiter weiß, wenn es jetzt noch zu Konflikten kommt.

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