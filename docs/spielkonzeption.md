# Spielkonzeption

## 1. Konzeption/Auswahl des zu realisierenden Spieles

Arbeitstitel: **kritzel.gg**

Das Spiel ist ein Mehrspieler-Onlinespiel, bei dem ein Spieler ein zufällig ausgewähltes Wort zeichnen muss, während die anderen Spieler versuchen, das Wort zu erraten. Der Zeichner erhält das Wort und beginnt, es auf einer gemeinsamen Leinwand zu zeichnen. Alle anderen Spieler sehen diese Zeichnung in Echtzeit und können im Chat ihre Vermutungen abgeben. Der Spieler, der das Wort richtig errät, erhält Punkte, ebenso wie der Zeichner, basierend auf der Zeit, die für das Erraten benötigt wird. Nach einer festgelegten Anzahl von Runden wird der Spieler mit den meisten Punkten zum Gewinner gekürt. 

Das Spiel schafft eine unterhaltsame, wettbewerbsorientierte Atmosphäre. Es eignet sich gut für kürzere Spielsessions und ist leicht zugänglich für verschiedene Spielergruppen.

- Echtzeit und Rundenbasiert
- Low-Skill Gesellschaftsspiel

## 2. Entwurf und Visualisierung Use-Case-Diagramm

- siehe UCGrundfunktionen.wsd

## 3. Skizzen

- siehe skibble.io

## 4. Ausbaustufen

### 4.1 Grundfunktionen

- Ein Menü erstellen in dem Spieler Funktionen/Modi im Spiel auswählen können.
- Spielverbindung von Spielern realisieren.
- Spieler sollen ein Spiel beitretten können.
- Ein Spiel ist in Runden unterteilen.
- Erstellen eines Chats (für die Kommunikation der Spieler und zum Erraten der Worte)
- Erstellen von grundlegenden Zeichenfunktionen für den Zeichner (Farbauswahl, unterscheidliche Zeichenoptionen, Radierer)
- Erstellen einer simplen UI für das Spielgeschehen (Platzierung, Chat, Zeichenfunktionen, Wort, Punktevergabe)
- Im Spiel Auswahl eines Spielers als Zeichner pro Runde, dieser kann zwischen einer Auswahl an zufälligen Worten wählen (z.B. 3), die dieser zeichen muss.
- Spieler, die in einer Runde nicht der Zeichner sind, erraten den Begriff anhand der Zeichnung.
- Das Erraten von Begriffen soll in einen Chat realisiert werden.
- Zeichner werden mit Punkten entlohnt jenachdem wie schnell der Begriff erraten wird und wie oft.
- Errater werden mit Punkten entlohnt jenachdem wie schnell sie den Begriff erraten haben.
- Die erlangten Punkte bestimmen die Platzierung der Spieler. (Der Spieler mit den meisten Punkten nach einer vorgegbenen Rundenanzahl gewinnt das Spiel)
- Ein Spiel endet wenn die vorgegebene Rundenanzahl erreicht ist. (Mindest jeder Spieler muss einmal Zeichner gewesen sein).
- Anzeige der Platzierung am Ende des Spieles und Rückkehr zur Lobby/Menü.

### 4.2 Erweiterte Funktionen

Alle diese Funktionen sind nur Ideen, die nicht alle umgesetzt werden müssen.

**Modi:**
- Ranked Mode : Spieler erhalten durch ihre Leistung/Platzierung im Spiel Punkte die diese im Rang auf und absteigen lassen können. Spieler ähnlicher Ränge spielen gegeneinander.
- Private Lobby : Spieler können mittels Code andere Spieler einladen und zusammenspielen (Spieleinstellungsmöglichkeiten sollen möglich sein z.B. Rundenanzahl).
- Teammodus bei den jeweils das Team ein Wort zeichnet und errät und so gegen andere Teams antritt. Erweiterterung z.B. durch spezielle Modi bei den das Team ein zusammengesetztes Wort erhält und der eine Spieler den ersten Teil und der andere Spieler den zweiten Teil zeichnen muss ohne das der jeweilige Teampartner den jeweiligen Teil des anderen sieht und die anderen Teams müssen diesen Begriff erraten. Und weitere vorstellbare Modi.
- Only Draw Mode / Only Guess Mode: Spieler können eine Spiel beitretten bei den diesen nur die Rolle des Zeichners/Erraters erhalten für jede Runde.
- Spezial-Themen-Modus : Ein Modus bei dem sich nur Wörter in der Auswahl befinden die zu dem vorgegeben Thema passen. Zeitbegrenzte Evente mit diesen Modus möglich z.B. Feiertags oder Saison bezogen.
- Einzelspieler-Modus: Spieler errät jede Runde nur Begriffe, die automatisch von der Anwendung gezeichnet werden (vorgefertigte Zeichnung wird abgespielt) und erhält jenachdem wie schnell er diese errät Punkte.
- Zuschauer-Modus: Zuschauer kann einen Spiel beitretten und den Spielverlauf anschauen, aber nicht mitspielen.

**Zusätzliche Erweiterungen:**
- Responsive UI für unterschiedliche Geräte
- Verbessertes Design der UI
- Zusätzliche freischaltbare Achivements, Titel oder/und Avatare bereitstellen, die Spieler durch erhaltene Punkte im Spiel eintauschen können oder die durch gewisse Aufgaben erreicht werden können (z.B. Gewinne 2 Spiele nacheinander).
- Quests (wöchentlich, täglich oder unbegrenzt für freischaltbare Elemente).
- Timer, die die Zeit vom Zeichnen und Erraten eingrenzen
- erweiterte Zeichenfunktionen (mehrere Farben, Formen, Größen, Zeichenwerkzeuge)
- verbesserte Chaterkennung zur Worterkennung (Groß- und Kleinschreibung andere Sprache usw.)
- verbesserte Chatfunktionen z.B. Emojis zulassen usw.
- individuelle Wortlisten erstellen können in Privaten Lobbys
- Möglichkeit einen Spieleraccount zu erstellen um am Ranked Mode teilnehmen zu können und freischaltbare Spielelemente zu archivieren zudem für Spielbezogene Statistiken.
- Erstellen einer Statistikanzeige zum Profil. Diese beinhaltet z.B. Gewonnene Runden, Verlorene Runden, Durchschnittspunkte, Rang, Anzahl Spiele im jeweiligen Modus usw.




