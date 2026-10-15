import type { Messages } from './en';

/** German. */
export const de: Messages = {
  'topbar.install': 'Installieren',
  'topbar.share': 'Libell teilen',
  'bottombar.settings': 'Einstellungen',
  'bottombar.sound.mute': 'Ton stummschalten',
  'bottombar.sound.unmute': 'Ton einschalten',
  'bottombar.help': 'Hilfe',
  'bottombar.label': 'Aktionen',
  'share.text': 'Richte dein Wohnmobil oder deinen Wohnwagen mit dem Handy waagerecht aus.',
  'share.copied': 'Link kopiert!',
  'update.check': 'Nach neuer Version suchen',
  'update.checking': 'Suche nach Updates…',
  'update.updating': 'Aktualisiere auf die neue Version…',
  'update.latest': 'Du hast die neueste Version',
  'update.offline': 'Keine Verbindung, Suche nach Updates nicht möglich',
  'update.unsupported': 'Updates sind hier nicht verfügbar',
  'install.hint': 'Auf Teilen tippen, dann „Zum Home-Bildschirm“.',
  'share.vehicle.text': 'Die Konfiguration meines Fahrzeugs für Libell — Maße und Keile.',
  'settings.shareVehicle': 'An ein anderes Handy senden',
  'setup.incoming.h': 'Empfangene Fahrzeugkonfiguration',
  'setup.incoming.intro': 'Jemand aus deiner Familie hat dir diese Fahrzeugmaße geschickt:',
  'setup.incoming.reminder':
    'Eine Kalibrierung ist nicht dabei — auf diesem Handy musst du trotzdem kalibrieren.',
  'setup.incoming.apply': 'Diese Werte übernehmen',
  'setup.incoming.dismiss': 'Jetzt nicht',
  'setup.incoming.invalid':
    'Dieser Konfigurationslink konnte nicht gelesen werden — es wurde nichts geändert.',

  'lamp.setup': '⚠ Maße',
  'lamp.setup.title':
    'Die Maße des Fahrzeugs wurden noch nie gespeichert — zum Öffnen der Einstellungen tippen',
  'lamp.calibrate': '⚠ Kalibrieren',
  'lamp.zero': '⚠ Nullen',
  'lamp.calibrate.title':
    'Das Handy ist nicht kalibriert — tippe, um „Kalibrieren und nullen“ zu öffnen',
  'lamp.zero.title':
    'Das Fahrzeug ist nicht genullt — tippe, um „Kalibrieren und nullen“ zu öffnen',
  'lamp.calibrate.title.sensor': 'Die Box ist nicht genullt — tippen, um die Box zu öffnen',

  'sensorStatus.connected': 'Sensorbox verbunden',
  'sensorStatus.disconnected': 'Sensorbox — Verbindung verloren, für Details tippen',
  'sensorStatus.stale': 'Sensorbox — keine neuen Daten, für Details tippen',
  'sensorStatus.idle': 'Sensorbox — zum Verbinden tippen',
  'sensorStatus.idle.guide': 'Sensorbox — für die iPhone-Anleitung tippen',

  'menu.title': 'Menü',
  'menu.close': 'Menü schließen',
  'menu.settings': 'Einstellungen',
  'menu.calibration': 'Kalibrieren und nullen',
  'menu.targets': 'Ziele',
  'menu.feedback': 'Rückmeldung',
  'menu.help': 'Hilfe',
  'menu.intro': 'Einführung anzeigen',
  'menu.about': 'Über Libell',
  'menu.about.tab': 'Über',
  'menu.sensorSource': 'Sensorbox',

  'sensorSource.connect': '{name}-Sensor verbinden',
  'sensorSource.disconnect': 'Trennen',
  'sensorSource.status.connecting': 'Verbinden…',
  'sensorSource.err.unsupported': 'Dieser Browser unterstützt Web Bluetooth nicht.',
  'sensorSource.unsupported.browser':
    'Um eine Sensorbox zu verbinden, öffne Libell in Chrome oder Edge auf Android oder einem Computer. Der eigene Sensor des Handys funktioniert hier wie gewohnt.',
  'sensorSource.err.password':
    'Die {name}-Box hat ihr Passwort nicht akzeptiert. Gib unten den vierstelligen Code der Box ein und tippe auf Erneut versuchen. Der Werkscode ist 0000. Wenn du den Code nicht kennst, ändere ihn in der Xparkle-App.',
  'sensorSource.err.failed': 'Verbindung zum {name}-Sensor nicht möglich.',

  'sensorSource.ios.intro':
    'Safari kann sich nicht direkt mit Bluetooth-Sensoren verbinden, aber es gibt einen Umweg:',
  'sensorSource.ios.step1': 'Installiere „Bluefy – Web Bluetooth Browser“ aus dem App Store.',
  'sensorSource.ios.step2': 'Öffne Bluefy und erlaube die Bluetooth-Berechtigung.',
  'sensorSource.ios.step3': 'Rufe in Bluefy dieselbe Libell-Adresse auf.',
  'sensorSource.ios.step4': 'Öffne hier wieder Sensorbox — es funktioniert wie unter Android.',
  'sensorSource.ios.note':
    'Bluefy ist eine App von Dritten, nicht von Libell — das erneute Verbinden beim Öffnen ' +
    'erfordert dort eventuell einen manuellen Tipp, statt still zu geschehen.',
  'sensorSource.ios.bluefyLink': 'Bluefy im App Store finden',

  'sensorSource.detail.temperature': 'Temperatur: {value}',
  'sensorSource.detail.notAvailable': 'Noch nicht verfügbar',
  'sensorSource.lowBattery':
    '⚠ Batterie schwach ({value}) — die Batterie der Sensorbox sollte bald gewechselt werden.',

  'sensorSource.install.now': 'Jetzt nullen',
  'sensorSource.install.clear': 'Nullpunkt vergessen',
  'sensorSource.install.status': 'Nullpunkt: längs {pitch}, seitlich {roll}.',
  'sensorSource.install.status.none': 'Noch nicht genullt — die Box misst so, wie sie sitzt.',

  'sensorSource.learn.h': 'Montage anlernen',
  'sensorSource.learn.intro':
    'Libell lernt die Richtung aus zwei Anhebungen: zuerst vorne, dann die rechte Seite.',
  'sensorSource.learn.start': 'Montage anlernen',
  'sensorSource.learn.step.front':
    'Hebe die Fahrzeugfront ein paar Zentimeter an und tippe dann auf die Schaltfläche.',
  'sensorSource.learn.capture.front': 'Die Front ist angehoben',
  'sensorSource.learn.step.right':
    'Senke die Front wieder ab. Hebe jetzt die rechte Seite ein paar Zentimeter an und tippe dann auf die Schaltfläche.',
  'sensorSource.learn.capture.right': 'Die rechte Seite ist angehoben',
  'sensorSource.learn.cancel': 'Abbrechen',
  'sensorSource.learn.status.learned': 'Montage angelernt.',
  'sensorSource.learn.status.none':
    'Keine Montage angelernt — die eigenen Richtungen der Box werden verwendet.',
  'sensorSource.learn.done':
    'Fertig! Prüfe es: Hebe die Front an, dann sollte Libell auf die Hinterräder zeigen.',
  'sensorSource.learn.err.tooSmall':
    'Das Fahrzeug hat sich kaum bewegt. Hebe es etwas mehr an und versuche es erneut.',
  'sensorSource.learn.err.ambiguous':
    'Beide Richtungen haben sich etwa gleich stark bewegt. Hebe nur die Front, dann nur die rechte Seite an und versuche es erneut.',
  'sensorSource.learn.err.arrow':
    'Kein Pfeil zeigt nach vorn. Drehe die Box so, dass einer ihrer Pfeile nach vorn zeigt, und versuche es erneut.',
  'sensorSource.learn.err.mirrored':
    'Die Box scheint verkehrt herum zu sitzen, oder die falsche Seite wurde angehoben. Prüfe es und versuche es erneut.',
  'sensorSource.learn.err.sameAxis':
    'Beide Anhebungen haben in dieselbe Richtung geneigt. Hebe zuerst die Front, dann die rechte Seite an und versuche es erneut.',

  'sensorStatus.title': '{name}-Sensor',
  'sensorStatus.reading': 'Neigung jetzt: {value}',
  'sensorStatus.debug': 'Debug-Infos',
  'sensorStatus.debug.intro':
    'Rohwerte direkt aus der Box — zur Fehlersuche, wenn etwas nicht funktioniert.',
  'sensorStatus.debug.state': 'Verbindungsstatus: {value}',
  'sensorStatus.debug.deviceId': 'Geräte-ID: {value}',
  'sensorStatus.debug.lastSample': 'Letzte Messung: {value}',
  'sensorStatus.debug.age': 'vor {s} s',
  'sensorStatus.debug.rawAccel': 'Rohes Beschleunigungssignal (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Firmware-Stufe: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Rohe Status-Bytes: {value}',
  'sensorStatus.debug.copy': 'Debug-Infos kopieren',
  'sensorStatus.debug.copied': 'Debug-Infos kopiert!',
  'sensorStatus.debug.copy.failed': 'Automatisches Kopieren nicht möglich.',
  'sensorStatus.advanced': 'Erweitert',
  'sensorStatus.silentReconnect.intro':
    'Dieser Browser kann sich noch nicht selbst wieder mit der Box verbinden, daher wählst du sie nach einem Neustart erneut in der Liste. In Chrome kannst du das selbst einschalten.',
  'sensorStatus.silentReconnect.steps':
    'Öffne {address}, suche nach „web bluetooth“, stelle „Use the new permissions backend for Web Bluetooth“ auf Enabled und tippe auf Relaunch. Verbinde die Box danach einmal.',
  'sensorStatus.silentReconnect.copy': '{address} kopieren',
  'sensorStatus.silentReconnect.copied': 'Kopiert – füge es in die Adressleiste von Chrome ein.',
  'sensorStatus.debug.connectDelay.intro':
    'Experimentell: nur versuchen, wenn die Verbindung deiner Box unzuverlässig ist. Fügt ' +
    'nach dem Verbinden eine feste Pause ein, bevor die App zu lesen beginnt.',
  'sensorStatus.debug.connectDelay.enable': 'Verbindungspause aktivieren',
  'sensorStatus.debug.connectDelay.ms': 'Pause (ms)',

  'about.text':
    'Libell hilft dir, dein Wohnmobil oder deinen Wohnwagen mit dem Handy auszurichten, ' +
    'das du ohnehin dabeihast, ohne Raten.',
  'about.version': 'Version {v}',
  'about.offline':
    'Funktioniert vollständig offline — das Netz wird nur für Updates der App selbst genutzt.',
  'about.privacy':
    'Alles bleibt auf deinem Handy — kein Konto, kein Tracking, und keine Daten verlassen das Gerät.',
  'about.source': 'Libell ist kostenlos und quelloffen (MIT-Lizenz).',
  'about.source.link': 'Quellcode auf GitHub',

  'onboard.welcome.h': 'Willkommen bei Libell',
  'onboard.welcome.t':
    'Diese kurze Einführung richtet Fahrzeug und Handy ein. Jeder Schritt lässt sich ' +
    'überspringen und später in den Einstellungen erledigen.',
  'onboard.welcome.sensor':
    'Eine Sensorbox verbindest du jederzeit über das Sensorsymbol oben rechts.',
  'onboard.sound.h': 'Ton',
  'onboard.source.h': 'Wie möchtest du messen?',
  'onboard.source.intro':
    'Wähle, von welchem Sensor Libell die Neigung lesen soll — die meisten nehmen einfach das Handy.',
  'onboard.source.phone': 'Dieses Handy',
  'onboard.source.externalActive':
    'Eine Sensorbox ist aktiv. Wählst du dieses Handy, überspringt der Assistent die Kalibrierung des Handys. Um das Handy zu kalibrieren, öffne die Box über das Sensorsymbol oben rechts und tippe zuerst auf „{disconnect}“.',
  'onboard.vehicle.h': 'Was richtest du aus?',
  'onboard.vehicle.intro': 'Wähle dein Fahrzeug — der Rest dieser Einführung richtet sich danach.',
  'onboard.step1.h': 'Lege das Handy so hin',
  'onboard.next': 'Weiter',
  'onboard.back': 'Zurück',
  'onboard.close': 'Einführung schließen',
  'onboard.done': 'Fertig',
  'onboard.skipStep': 'Überspringen',
  'onboard.note.measurements':
    'Überspringst du, gelten die Standardmaße, und {lamp} leuchtet, bis du deine gespeichert hast.',
  'onboard.note.ramps':
    'Überspringst du, gelten die Standard-Keile. Deine eigenen wählst du später in den Einstellungen.',
  'onboard.note.calibrate':
    'Gerade keine ebene Fläche? Tippe auf „{next}“; {lamp} erinnert dich, bis es erledigt ist.',
  'onboard.note.connect':
    'Keine Box zur Hand? Tippe auf „{next}“ und verbinde sie später über das Sensorsymbol oben rechts.',
  'onboard.zeroLater':
    'Das Fahrzeug nullst du, wenn du das erste Mal auf ebenem Boden parkst. {lamp} erinnert dich, bis es erledigt ist.',
  'onboard.legend.ok': 'Grün ✓ — dieses Rad steht waagerecht.',
  'onboard.legend.up': 'Orange ↑ — dieses Rad auf die angezeigte Stufe fahren.',
  'onboard.legend.no': 'Rot ✕ — keine Stufe reicht; such dir einen ebeneren Platz.',
  'onboard.legend.dim': 'Grau – — an diesem Rad kein Keil; die Zahl zeigt, wie viel fehlt.',
  'settings.wheelbase': 'Radstand',
  'settings.trackFront': 'Spurweite vorn',
  'settings.trackRear': 'Spurweite hinten',
  'settings.tolerance': 'Toleranz',
  'settings.stability': 'Stabilität',
  'settings.dwellRest': 'Reaktionsverzögerung (ms)',
  'settings.dwellMotion': 'Reaktionsverzögerung beim Ausrichten (ms)',
  'settings.dwell.hint': 'Wie lange ein Messwert halten muss, bevor sich die Zahl ändert.',
  'settings.vehicle': 'Fahrzeug',
  'vehicle.motorhome': 'Wohnmobil',
  'vehicle.caravan': 'Wohnwagen',
  'settings.axleToJockey': 'Achse bis Stützrad',
  'settings.rearAxle': 'Hinterachse',
  'settings.axle': 'Achse',
  'axle.single': 'Einzeln',
  'axle.boggie': 'Tandem (Doppelachse)',
  'settings.track': 'Spurweite',
  'settings.measureHint':
    'Die Maße stehen im Fahrzeugschein. Ein paar cm Abweichung machen nichts.',
  'settings.measureHint.caravan':
    'Von der Achse bis zum Stützrad messen. Ein paar cm Abweichung machen nichts.',
  'settings.measureHint.boggie': 'Bei einer Doppelachse bis zur Mitte des Achspaars messen.',
  'settings.steps': 'Stufenhöhen der Keile',
  'settings.steps.add': 'Stufe hinzufügen',
  'settings.steps.new': 'Neue Stufenhöhe ({unit})',
  'settings.steps.remove': '{value} entfernen',
  'settings.ramp': 'Fertiger Keil',
  'settings.ramp.custom': 'Eigener Satz',
  'settings.rampCount': 'Anzahl Keile',
  'settings.drain': 'Abflussseite',
  'settings.rampHint': 'Die App wählt, wo deine Keile am meisten bringen.',
  'settings.drainHint':
    'Innerhalb der Toleranz bleibt diese Seite am tiefsten, damit das Wasser abläuft.',
  'settings.section.vehicle': 'Fahrzeug und Maße',
  'settings.section.ramps': 'Keile',
  'settings.general': 'Allgemein',
  'settings.language': 'Sprache',
  'settings.language.auto': 'Automatisch (Gerätesprache)',
  'settings.tolerance.hint': 'Wie nah an der Waagerechten noch als waagerecht gilt.',
  'settings.stability.hint':
    'Glättet kleine Schwankungen des Sensors, damit die Zahlen nicht flackern.',
  'drain.none': 'Keine / egal',
  'drain.left': 'Links, Mitte',
  'drain.right': 'Rechts, Mitte',
  'drain.front': 'Vorn, Mitte',
  'drain.rear': 'Hinten, Mitte',
  'drain.frontLeft': 'Vorn links',
  'drain.frontRight': 'Vorn rechts',
  'drain.rearLeft': 'Hinten links',
  'drain.rearRight': 'Hinten rechts',
  'settings.unit': 'Längen anzeigen in',
  'settings.theme': 'Design',
  'theme.system': 'Wie das Handy',
  'theme.light': 'Hell',
  'theme.dark': 'Dunkel',
  'settings.appearance': 'Darstellung',
  'appearance.classic': 'Klassisch',
  'appearance.modern': 'Modern',
  'appearance.glossy': 'Glänzend',
  'settings.sound': 'Signalton bei waagerecht',
  'settings.soundGuidance': 'Durchgehende Tonführung',
  'settings.soundGuidance.help':
    'Der Ton wird schneller und höher, je näher du der Waagerechten kommst.',
  'settings.soundSpeech': 'Sprachansage',
  'settings.soundSpeech.help':
    'Steht das Fahrzeug still, sagt die App, welches Rad und wie viel, etwa „Hinten links, Stufe 2“.',
  'settings.soundSpeech.unavailable':
    'Die Sprachansage funktioniert auf diesem Handy nicht: Es hat keine deutsche Stimme, die offline funktioniert. Die Töne funktionieren wie gewohnt.',
  'speech.level': 'Waagerecht',
  'settings.undo': 'Rückgängig',
  'settings.saved': 'Gespeichert',
  'settings.more': 'Mehr',
  'settings.fineTuning': 'Feinabstimmung',
  'settings.resetAll': 'Alle Einstellungen zurücksetzen',
  'settings.err.positive': 'Gib eine Zahl über 0 ein. Der vorige Wert gilt weiter.',
  'settings.err.notNegative': 'Gib 0 oder mehr ein. Der vorige Wert gilt weiter.',
  'settings.err.range': 'Gib eine Zahl von {min} bis {max} ein. Der vorige Wert gilt weiter.',

  'settings.tab.vehicle': 'Fahrzeug',
  'settings.tab.ramps': 'Keile',
  'settings.tab.level': 'Waagerecht',
  'settings.klossar.brandAll': 'Alle',
  'settings.klossar.changeRamp': 'Keil wechseln',
  'settings.rampCountHint': 'Die App legt sie dorthin, wo sie am meisten bringen.',
  'settings.klossar.selected': 'Ausgewählt',
  'settings.klossar.stepsHeading': 'Stufenhöhen',

  'status.measuring': 'Messen…',
  'status.almost': 'Fast waagerecht — noch {left}',
  'status.cantLevel.close':
    'Deine Keile kommen nah heran, reichen hier aber nicht — stell das Fahrzeug um',
  'status.cantLevel.far': 'Deine Keile reichen hier bei Weitem nicht — stell das Fahrzeug um',

  'calibration.intro':
    'Lege das Handy auf eine Fläche, von der du weißt, dass sie waagerecht ist, und tippe ' +
    'auf Jetzt kalibrieren. Die aktuelle Neigung wird zum Nullpunkt.',
  'calibration.status': 'Kalibriert: längs {pitch}, seitlich {roll}.',
  'calibration.status.none': 'Nicht kalibriert — der Rohwert des Sensors wird verwendet.',
  'calibration.now': 'Jetzt kalibrieren',
  'calibration.step.phone.done': 'Handy kalibriert',
  'calibration.step.phone.hint': 'Leg das Handy auf etwas Ebenes.',
  'calibration.step.flipLink': 'Nichts Ebenes da? Handy drehen',
  'calibration.step.vehicle.done': 'Genullt',
  'calibration.step.vehicle.hint':
    'Richte das Fahrzeug mit einer Wasserwaage aus und leg das Handy an seinen üblichen Platz.',
  'calibration.step.vehicle.now': 'Jetzt nullen',
  'calibration.clear': 'Kalibrierung löschen',
  'calibration.err.notRunning':
    'Der Neigungssensor läuft noch nicht — tippe zuerst auf dem Hauptbildschirm auf Start.',
  'calibration.warn.notFlat':
    'Das sieht nicht flach aus (über 15°), die Kalibrierung wird also falsch. Lege das Handy auf eine flache Fläche oder kalibriere trotzdem.',
  'calibration.anyway': 'Trotzdem kalibrieren',
  'calibration.sensor.h': 'Handy kalibrieren',
  'calibration.vehicle.h': 'Fahrzeug nullen',
  'calibration.vehicle.intro':
    'Die Kalibrierung gilt dem Handy, nicht dem Platz, auf dem es liegt. Steht der Tisch leicht schief, zeigt die App diese Neigung. Stell das Fahrzeug einmal mit einer Wasserwaage waagerecht, leg das Handy an seinen gewohnten Platz und nulle.',
  'calibration.vehicle.now': 'Jetzt nullen',
  'calibration.vehicle.clear': 'Nullpunkt vergessen',
  'calibration.vehicle.status': 'Fahrzeug-Nullpunkt: längs {pitch}, seitlich {roll}.',
  'calibration.vehicle.status.none':
    'Kein Fahrzeug-Nullpunkt — der Platz des Handys gilt als eben.',
  'calibration.vehicle.warn.notFlat':
    'Das sieht nicht waagerecht aus (über 15°). Steht das Fahrzeug wirklich waagerecht? Nulle trotzdem, wenn du sicher bist.',
  'calibration.vehicle.anyway': 'Trotzdem nullen',
  'calibration.age.today': '(heute)',
  'calibration.age.days': '(vor {n} Tagen)',
  'calibration.check': 'Prüfen',
  'calibration.check.good': 'Immer noch gut — {off}° daneben.',
  'calibration.check.off': '{off}° daneben — neu kalibrieren wäre sinnvoll.',
  'calibration.vehicle.check.off': '{off}° daneben — neu nullen wäre sinnvoll.',
  'calibration.check.none':
    'Noch nicht kalibriert, also gibt es nichts zu prüfen. Leg das Handy auf eine ebene Fläche und tippe auf „{now}“.',
  'calibration.vehicle.check.none':
    'Noch kein Nullpunkt, also gibt es nichts zu prüfen. Richte das Fahrzeug mit einer Wasserwaage waagerecht aus und tippe auf „{now}“.',
  'calibration.flip.intro':
    'Keine waagerechte Fläche in der Nähe? Nimm die Umdreh-Kalibrierung: Handy irgendwo ' +
    'halbwegs eben hinlegen, erfassen, das Handy an derselben Stelle um eine halbe Drehung ' +
    '(180°) drehen, erneut erfassen — die Neigung der Fläche hebt sich dabei selbst auf.',
  'calibration.flip.start': 'Durch Umdrehen kalibrieren',
  'calibration.flip.rotate':
    'Drehe das Handy jetzt an derselben Stelle um eine halbe Drehung (180°) und tippe auf Erfassen.',
  'calibration.flip.capture': 'Erfassen',
  'calibration.flip.done': 'Fertig! Deine Fläche neigt sich um {surface}° — herausgerechnet.',
  'calibration.flip.warn.moved':
    'Die beiden Erfassungen weichen um mehr als 15° ab — hat sich das Handy bewegt? Fang von vorn an oder kalibriere trotzdem.',
  'calibration.pill.notDone': 'OFFEN',
  'calibration.pill.done': 'ERLEDIGT',
  'calibration.pill.none': 'KEINER',

  'targets.normal': 'Normal (waagerecht)',
  'targets.name.placeholder': 'Name (z. B. „Duschablauf“)',
  'targets.name.label': 'Name des neuen Ziels',
  'targets.defaultName': 'Ziel {n}',
  'targets.add': 'Aktuelle Neigung als neues Ziel speichern',
  'targets.delete': '{name} löschen',
  'targets.warn.tooSteep':
    'Das sieht steiler aus als ein gewolltes Ziel (über 15°). Versuche es erneut oder speichere trotzdem.',
  'targets.anyway': 'Trotzdem speichern',
  'targets.badge': 'Ziel: {name}',

  'feedback.intro':
    'Ein Problem gefunden oder eine Idee? Fülle das hier aus und tippe auf den Knopf — es ' +
    'öffnet sich ein fertiger Bericht auf GitHub, den du dort abschickst (ein kostenloses ' +
    'GitHub-Konto ist nötig, in einer Minute angelegt).',
  'feedback.category': 'Worum geht es?',
  'feedback.cat.bug': 'Fehler',
  'feedback.cat.suggestion': 'Vorschlag',
  'feedback.cat.other': 'Sonstiges',
  'feedback.title': 'Kurzer Titel',
  'feedback.desc': 'Was ist passiert, oder was wünschst du dir?',
  'feedback.submit': 'Den Bericht auf GitHub öffnen',
  'feedback.warn.title': 'Der Titel ist leer — du kannst den Bericht trotzdem senden.',
  'feedback.warn.desc': 'Die Beschreibung ist leer — du kannst den Bericht trotzdem senden.',
  'feedback.warn.both': 'Titel und Beschreibung sind leer — du kannst den Bericht trotzdem senden.',

  'help.screen.h': 'Den Bildschirm lesen',
  'help.screen.lead':
    'Der Bildschirm zeigt, welche Räder hoch müssen und um wie viel. Stufe 2 heißt die zweite Stufe deines Keils.',
  'help.screen.t':
    'Grün ✓: fertig, nichts zu tun.\n' +
    'Orange ↑: fahr das Rad auf die daneben angezeigte Stufe.\n' +
    'Rot ✕: deine Keile reichen hier nicht. Stell das Fahrzeug um.\n' +
    'Grau –: an diesem Rad kein Keil. Die Zahl zeigt, wie viel fehlt, falls du etwas anderes unterlegen willst.\n' +
    'Ruht die Blase in der Mitte, stehst du waagerecht.',
  'help.screen.routine':
    'Fahr auf, warte, bis das Fahrzeug still steht, und schau noch einmal. Wiederhole das, bis alle Räder grün sind.',
  'help.what.t':
    'Leg das Handy flach ins Fahrzeug, die Oberseite nach vorn, jedes Mal an dieselbe Stelle.\n' +
    'Mit einer Sensorbox ist egal, wie das Handy liegt.',
  'help.settings.h': 'Die Maße',
  'help.measures.h': 'Maße eintragen',
  'help.settings.t':
    'Libell berechnet aus Radstand und Spurweite, wie weit jedes Rad hoch muss.\n' +
    'Sie stehen in den Fahrzeugpapieren, sonst miss mit dem Maßband.\n' +
    'Beim Wohnwagen ist der Radstand der Abstand von der Achse zum Stützrad.',
  'help.ramps.t':
    'Der Bildschirm sagt, auf welche Stufe deines Keils jedes Rad muss, also trag die Keile ein, die du dabeihast.\n' +
    'Wähle einen fertigen Keil oder einen eigenen Satz und wie viele du hast. Libell legt sie dorthin, wo sie am meisten bringen.',
  'help.calibration.h': 'Kalibrieren und nullen',
  'help.calibration.t':
    'Zwei Schritte machen die Messung richtig: das Handy einmal kalibrieren und das Fahrzeug einmal nullen.\n' +
    'Kalibrieren: leg das Handy auf eine ebene Fläche und tippe auf Jetzt kalibrieren.\n' +
    'Nullen: stell das Fahrzeug mit einer Wasserwaage waagerecht, leg das Handy an seinen gewohnten Platz und tippe auf Jetzt nullen.\n' +
    'Mit einer Sensorbox nullst du auf der Seite der Box. Sie braucht keine Kalibrierung.\n' +
    'Die Lampe ⚠ Kalibrieren oder ⚠ Nullen leuchtet, bis es erledigt ist.',
  'help.sensor.h': 'Sensorbox',
  'help.sensor.t':
    'Eine Sensorbox im Fahrzeug kann statt des Handys messen. Libell arbeitet mit diesen:\n' +
    '{upright}: steht aufrecht, in beliebiger Richtung.\n' +
    '{flat}: liegt flach, Deckel oben, mit einem Pfeil nach vorn.\n' +
    'Verbinde sie über das Sensorsymbol oben rechts. Die Seite der Box führt dich dann durch Richtung wählen und Fahrzeug nullen.\n' +
    'Das geht in Chrome oder Edge auf Android oder einem Computer. Auf dem iPhone brauchst du den Browser Bluefy.\n' +
    'Lehnt die Box den Code ab, fragt Libell nach dem vierstelligen Code der Box.',
  'help.targets.h': 'Ziele und Ton',
  'help.targets.t':
    'Speichere eine gewünschte Neigung, etwa zum Duschablauf hin, und wechsle zwischen ihnen.\n' +
    'Mit der Sprachansage sagt die App, welches Rad du anheben musst und wie viel, damit du nivellieren kannst, ohne das Handy zu sehen.\n' +
    'Die Taste in der Mitte der unteren Leiste schaltet den Ton ein und aus.',
  'help.trouble.h': 'Wenn etwas nicht klappt',
  'help.trouble.t':
    '„Messen…“: das Fahrzeug schaukelt. Warte, bis es ruhig steht.\n' +
    '„Zum Messen das Handy flach hinlegen“: das Handy ist zum Messen zu stark geneigt.\n' +
    '„Verbindung zur Box verloren“: tippe auf Erneut verbinden und wähle die Box in der Liste.\n' +
    '„Warten auf den Neigungssensor…“: noch keine Messwerte. Auf dem iPhone tippe bei jedem Öffnen der App auf Start, sonst lade neu.\n' +
    '„Der Zugriff auf die Bewegungssensoren wurde verweigert“: erlaube Bewegung und Orientierung für diese Website in den Browsereinstellungen und lade neu.\n' +
    'Immer noch falsch? Schreib einen Bericht unter Rückmeldung.',
  'help.open': '{name} öffnen',
  'help.open.sensor': 'Sensorbox öffnen',
  'help.open.feedback': 'Bericht schreiben',

  'main.hint': 'Lege dein Handy flach ins Fahrzeug, die Oberkante nach vorn.',
  'main.start': 'Start',
  'main.waiting': 'Warten auf den Neigungssensor…',
  'main.level': 'Dein Fahrzeug steht waagerecht!',
  'main.denied':
    'Der Zugriff auf die Bewegungssensoren wurde verweigert, daher kann Libell die Neigung ' +
    'nicht lesen. Erlaube Bewegung und Orientierung für diese Website und lade neu.',
  'main.noSensors':
    'Dieses Gerät bietet keine Bewegungssensoren, daher kann Libell die Neigung nicht lesen.',
  'main.https':
    'Libell braucht eine sichere Verbindung (HTTPS), um die Neigungssensoren zu lesen. ' +
    'Öffne die App über HTTPS und versuche es erneut.',

  'diagram.aria': 'Dein Wohnmobil von oben, mit den Rädern, die angehoben werden müssen',
  'diagram.caravan.aria': 'Dein Wohnwagen von oben, mit den Achsrädern und dem Stützrad',
  'diagram.front': 'Vorn',
  'diagram.step': 'Stufe {n}',
  'diagram.done': 'Fertig',
  'diagram.noRamp': 'Kein Keil',
  'diagram.wheel.frontLeft': 'Vorne links',
  'diagram.wheel.frontRight': 'Vorne rechts',
  'diagram.wheel.rearLeft': 'Hinten links',
  'diagram.wheel.rearRight': 'Hinten rechts',
  'diagram.notEnough': 'reicht nicht',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Hochkurbeln',
  'caravan.crankDown': 'Herunterkurbeln',
  'caravan.axleLeft': 'Linkes Achsrad',
  'caravan.axleRight': 'Rechtes Achsrad',
  'caravan.jockeyWheel': 'Stützrad',
  'help.screen.caravan':
    'Wohnwagen: Das Stützrad zeigt Hochkurbeln oder Herunterkurbeln und um wie viel.',

  'tilt.frontBack': 'Längs',
  'tilt.sideSide': 'Quer',

  'pose.layFlat': 'Zum Messen das Handy flach hinlegen',
  'pose.sensorHint': 'Sie misst nur flach liegend richtig, Oberseite nach oben.',
  'pose.openSensorPage': 'Box anzeigen',
  'pose.sensorExtreme': 'Die Box ist zu stark geneigt',
  'pose.sensorUpsideDown': 'Die Box scheint kopfüber zu sitzen',
  'pose.sensorNotUpright': 'Die Box liegt',
  'pose.sensorHintUpright': 'Sie misst nur stehend richtig.',
  'calibration.external.h': 'Fahrzeug nullen',
  'calibration.external.intro':
    'Stell das Fahrzeug einmal mit einer Wasserwaage waagerecht und nulle dann.',
  'calibration.external.phoneHidden':
    'Die Kalibrierung des Handys ist ausgeblendet, solange die Sensorbox misst. Um das Handy zu kalibrieren, öffne die Box und tippe zuerst auf „{disconnect}“.',
  'calibration.external.working': 'Wird genullt…',
  'calibration.external.done': '{name} ist genullt: Diese Lage gilt jetzt als waagerecht.',
  'calibration.external.err.notConnected':
    '{name} ist nicht verbunden. Verbinde ihn und versuch es erneut.',
  'calibration.external.err.failed':
    '{name} konnte nicht genullt werden. Es wurde nichts geändert. Prüf die Verbindung und versuch es erneut.',
  'pose.portrait': 'Drehe das Handy hochkant (Porträt) — die Oberkante muss nach vorn zeigen',

  'stale.dataUnavailable': 'Keine neuen Sensordaten — die Führung pausiert, bis sie zurückkommen',

  'sensorFallback.lost': 'Verbindung zur Box verloren',
  'sensorFallback.autoRetry': 'Neuer Versuch läuft automatisch…',
  'sensorFallback.connect': 'Box verbinden',
  'sensorFallback.pick': 'Tippe und wähle deine Box in der Liste.',
  'sensorFallback.notFound': 'Keine Box gefunden? Prüfe, ob sie eingeschaltet und in der Nähe ist.',
  'sensorFallback.retry': 'Erneut verbinden',
  'sensorFallback.usePhone': 'Stattdessen das Handy verwenden',
  'mounting.prompt.upright':
    'Tippe auf die Seite, auf die die Rückseite der Box (die Schraubhalterung) zeigt.',
  'mounting.prompt.arrow':
    'Einer der Pfeile der Box (auf dem Deckel oder der Platine darunter) zeigt nach vorn. Welche Seite zeigt nach vorn?',
  'mounting.placement.wide': 'Lange Seite nach vorn',
  'mounting.placement.short': 'Kurze Seite nach vorn',
  'mounting.facing.front': 'Zeigt nach vorne',
  'mounting.facing.right': 'Zeigt nach rechts',
  'mounting.facing.rear': 'Zeigt nach hinten',
  'mounting.facing.left': 'Zeigt nach links',
  'box.state.connected': 'Verbunden',
  'box.state.lost': 'Verbindung verloren',
  'box.state.password': 'Falsches Passwort',
  'box.password.label': 'Code der Box',
  'box.password.retry': 'Erneut versuchen',
  'box.password.checking': 'Code wird geprüft…',
  'box.password.invalid': 'Der Code hat vier Ziffern.',
  'box.password.wrong': 'Die Box hat auch diesen Code nicht akzeptiert.',
  'box.password.noAnswer':
    'Die Box hat nicht geantwortet. Der Code ist gespeichert und wird beim nächsten Verbinden der Box versucht.',
  'box.state.notConnected': 'Nicht verbunden',
  'box.state.battery': 'Batterie {value}',
  'box.connect': 'Verbinden',
  'box.step.position.upright.ok': 'Steht aufrecht',
  'box.step.position.upright.bad': 'Liegt: stelle sie aufrecht, Richtung egal',
  'box.step.position.flat.ok': 'Liegt flach',
  'box.step.position.flat.bad': 'Zu stark geneigt: lege sie flach, Oberseite nach oben',
  'box.step.position.flat.upsideDown':
    'Verkehrt herum: dreh sie mit dem Deckel nach oben. Der Hersteller rät von einer Montage über Kopf ab.',
  'box.step.position.waiting': 'Lage: wartet auf einen Messwert',
  'box.step.direction.todo': 'Richtung wählen',
  'box.step.direction.done': 'Richtung gewählt',
  'box.step.direction.learn': 'Unsicher? Durch Anheben der Front einlernen',
  'box.step.zero.todo': 'Fahrzeug nullen',
  'box.step.zero.done': 'Genullt',
  'box.step.zero.hint': 'Stelle das Fahrzeug mit einer Wasserwaage waagerecht und nulle dann.',
  'box.forgetDirection': 'Richtung vergessen',
  'onboard.boxPosition.h': 'Lage der Box',
  'onboard.boxPosition.later':
    'Richtung und Nullpunkt stellst du beim ersten Parken ein. Die Seite der Box führt dich, und die Lampe ⚠ Nullen erinnert dich bis dahin.',
  'onboard.boxPosition.notConnected':
    'Noch ist keine Box verbunden, daher lässt sich ihre Lage nicht anzeigen. Tippe auf „{next}“ und verbinde sie später über das Sensorsymbol oben rechts.',
  'sensorList.title': 'Sensorbox',
  'sensorList.phone': 'Der Sensor des Handys wird verwendet, wenn keine Box verbunden ist.',
  'box.step.zero.again': 'Erneut nullen',
};
