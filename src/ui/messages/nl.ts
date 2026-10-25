import type { Messages } from './en';

/** Dutch (Nederlands). */
export const nl: Messages = {
  'topbar.install': 'Installeer',
  'topbar.share': 'Libell delen',
  'bottombar.settings': 'Instellingen',
  'bottombar.sound.mute': 'Geluid uit',
  'bottombar.sound.unmute': 'Geluid aan',
  'bottombar.help': 'Help',
  'bottombar.label': 'Acties',
  'share.text': 'Zet je camper of caravan waterpas met je telefoon.',
  'share.copied': 'Link gekopieerd!',
  'update.check': 'Zoeken naar een nieuwe versie',
  'update.checking': 'Zoeken naar updates…',
  'update.updating': 'Bijwerken naar de nieuwe versie…',
  'update.latest': 'Je hebt de nieuwste versie',
  'update.offline': 'Geen verbinding, kan niet zoeken naar updates',
  'update.unsupported': 'Updates zijn hier niet beschikbaar',
  'install.hint': 'Tik op Deel en dan op “Zet op beginscherm”.',
  'install.row': 'Installeer Libell als app op je beginscherm.',
  'install.close': 'Verbergen',
  'share.vehicle.text': 'Mijn voertuiginstellingen voor Libell — maten en blokken.',
  'settings.shareVehicle': 'Naar andere telefoon',
  'setup.incoming.h': 'Ontvangen voertuiginstellingen',
  'setup.incoming.intro': 'Een gezinslid heeft deze voertuigmaten met je gedeeld:',
  'setup.incoming.reminder':
    'Hier zit geen kalibratie bij — je moet deze telefoon nog steeds zelf kalibreren.',
  'setup.incoming.apply': 'Huidig voertuig vervangen',
  'setup.incoming.dismiss': 'Niet nu',
  'setup.incoming.invalid':
    'Die link met voertuiginstellingen kon niet worden gelezen — er is niets gewijzigd.',

  'lamp.setup': '⚠ Maten',
  'lamp.setup.title': 'De voertuigmaten zijn nog nooit opgeslagen — tik om Instellingen te openen',
  'lamp.calibrate': '⚠ Kalibreren',
  'lamp.zero': '⚠ Nullen',
  'lamp.calibrate.title':
    'De telefoon is niet gekalibreerd — tik om “Kalibreren en nullen” te openen',
  'lamp.zero.title': 'Het voertuig is niet genuld — tik om “Kalibreren en nullen” te openen',
  'lamp.calibrate.title.sensor': 'De box is niet genuld — tik om de box te openen',

  'sensorStatus.connected': 'Sensorbox verbonden',
  'sensorStatus.disconnected': 'Sensorbox — geen contact, tik voor details',
  'sensorStatus.stale': 'Sensorbox — geen nieuwe gegevens, tik voor details',
  'sensorStatus.idle': 'Sensorbox — tik om te verbinden',
  'sensorStatus.idle.guide': 'Sensorbox — tik voor de iPhone-handleiding',

  'menu.title': 'Menu',
  'menu.close': 'Menu sluiten',
  'menu.settings': 'Instellingen',
  'menu.calibration': 'Kalibreren en nullen',
  'menu.targets': 'Doelen',
  'menu.feedback': 'Feedback',
  'menu.help': 'Help',
  'menu.intro': 'Introductie tonen',
  'menu.about': 'Over Libell',
  'menu.about.tab': 'Over',
  'menu.sensorSource': 'Sensorbox',

  'sensorSource.connect': '{name}-sensor verbinden',
  'sensorSource.disconnect': 'Verbreken',
  'sensorSource.status.connecting': 'Verbinden…',
  'sensorSource.err.unsupported': 'Deze browser ondersteunt geen Web Bluetooth.',
  'sensorSource.unsupported.browser':
    'Om een sensorbox te verbinden, open je Libell in Chrome of Edge op Android of op een computer. De eigen sensor van de telefoon werkt hier gewoon.',
  'sensorSource.err.password':
    'De {name}-box heeft zijn wachtwoord niet geaccepteerd. Typ hieronder de viercijferige code van de box en tik op Opnieuw. De fabriekscode is 0000. Weet je de code niet, wijzig hem dan in de Xparkle-app.',
  'sensorSource.err.failed': 'Kan geen verbinding maken met de {name}-sensor.',

  'sensorSource.ios.intro':
    'Safari kan niet rechtstreeks verbinding maken met Bluetooth-sensoren, maar er is een omweg:',
  'sensorSource.ios.step1': 'Installeer “Bluefy – Web Bluetooth Browser” uit de App Store.',
  'sensorSource.ios.step2': 'Open Bluefy en sta de Bluetooth-toestemming toe.',
  'sensorSource.ios.step3': 'Ga in Bluefy naar ditzelfde Libell-adres.',
  'sensorSource.ios.step4': 'Open hier opnieuw Sensorbox — het werkt dan zoals op Android.',
  'sensorSource.ios.note':
    'Bluefy is een app van derden, niet gemaakt door Libell — opnieuw verbinden bij het openen ' +
    'van de app kan daar één handmatige tik vragen, in plaats van ongemerkt te gebeuren.',
  'sensorSource.ios.bluefyLink': 'Zoek Bluefy in de App Store',

  'sensorSource.detail.temperature': 'Temperatuur: {value}',
  'sensorSource.detail.notAvailable': 'Nog niet bekend',
  'sensorSource.lowBattery':
    '⚠ Batterij bijna leeg ({value}) — vervang binnenkort de batterij van de sensorbox.',

  'sensorSource.install.now': 'Nu nullen',
  'sensorSource.install.clear': 'Nulpunt wissen',
  'sensorSource.install.status': 'Nulpunt: langs {pitch}, dwars {roll}.',
  'sensorSource.install.status.none': 'Nog niet genuld — de box meet zoals hij staat.',

  'sensorSource.learn.h': 'Montage leren',
  'sensorSource.learn.intro':
    'Libell leert de richting uit twee keer optillen: eerst de voorkant, dan de rechterkant.',
  'sensorSource.learn.start': 'Montage leren',
  'sensorSource.learn.step.front':
    'Til de voorkant van het voertuig een paar centimeter op en druk dan op de knop.',
  'sensorSource.learn.capture.front': 'Voorkant is omhoog',
  'sensorSource.learn.step.right':
    'Laat de voorkant weer zakken. Til nu de rechterkant een paar centimeter op en druk dan op de knop.',
  'sensorSource.learn.capture.right': 'Rechterkant is omhoog',
  'sensorSource.learn.cancel': 'Annuleren',
  'sensorSource.learn.status.learned': 'Montage geleerd.',
  'sensorSource.learn.status.none':
    'Geen montage geleerd — de eigen richtingen van de box worden gebruikt.',
  'sensorSource.learn.done':
    'Klaar! Controleer het: til de voorkant op en Libell hoort de achterwielen aan te wijzen.',
  'sensorSource.learn.err.tooSmall':
    'Het voertuig bewoog nauwelijks. Til het iets verder op en probeer het opnieuw.',
  'sensorSource.learn.err.ambiguous':
    'Beide richtingen bewogen ongeveer evenveel. Til alleen de voorkant op, dan alleen de rechterkant, en probeer het opnieuw.',
  'sensorSource.learn.err.arrow':
    'Geen pijl wijst naar voren. Plaats de box zo dat een van zijn pijlen naar voren wijst en probeer het opnieuw.',
  'sensorSource.learn.err.mirrored':
    'De box lijkt ondersteboven te zitten, of de verkeerde kant is opgetild. Controleer het en probeer het opnieuw.',
  'sensorSource.learn.err.sameAxis':
    'Beide keren kantelde het voertuig dezelfde kant op. Til eerst de voorkant op, dan de rechterkant, en probeer het opnieuw.',

  'sensorStatus.title': '{name}-sensor',
  'sensorStatus.reading': 'Helling nu: {value}',
  'sensorStatus.debug': 'Debuginfo',
  'sensorStatus.debug.intro':
    'Ruwe waarden rechtstreeks van de box — om problemen op te sporen als iets niet werkt.',
  'sensorStatus.debug.state': 'Verbindingsstatus: {value}',
  'sensorStatus.debug.deviceId': 'Apparaat-ID: {value}',
  'sensorStatus.debug.lastSample': 'Laatste meting: {value}',
  'sensorStatus.debug.age': '{s} s geleden',
  'sensorStatus.debug.rawAccel': 'Ruwe versnellingsmeter (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Firmwaregeneratie: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Ruwe statusbytes: {value}',
  'sensorStatus.debug.versionBytes': 'Serienummer en firmware (ruw): {value}',
  'sensorStatus.debug.copy': 'Debuginfo kopiëren',
  'sensorStatus.debug.copied': 'Debuginfo gekopieerd!',
  'sensorStatus.debug.copy.failed': 'Automatisch kopiëren is niet gelukt.',
  'sensorStatus.advanced': 'Geavanceerd',
  'sensorStatus.silentReconnect.intro':
    'Deze browser kan nog niet zelf opnieuw verbinding maken met de box, dus na een herstart kies je hem weer in de lijst. In Chrome kun je dit zelf inschakelen.',
  'sensorStatus.silentReconnect.steps':
    'Open {address}, zoek naar “web bluetooth”, zet “Use the new permissions backend for Web Bluetooth” op Enabled en tik op Relaunch. Verbind daarna de box één keer.',
  'sensorStatus.silentReconnect.copy': '{address} kopiëren',
  'sensorStatus.silentReconnect.copied': 'Gekopieerd — plak het in de adresbalk van Chrome.',
  'sensorStatus.debug.connectDelay.intro':
    'Experimenteel: probeer dit alleen als de verbinding met je box onbetrouwbaar is. Voegt na het verbinden een vaste pauze toe voordat de app gegevens gaat lezen.',
  'sensorStatus.debug.connectDelay.enable': 'Verbindingsvertraging inschakelen',
  'sensorStatus.debug.connectDelay.ms': 'Vertraging (ms)',

  'about.text':
    'Libell helpt je je camper of caravan waterpas te zetten met de telefoon die je ' +
    'al hebt, zonder te gokken.',
  'about.version': 'Versie {v}',
  'about.offline':
    'Werkt volledig offline — het netwerk wordt alleen gebruikt om updates van de app zelf op te halen.',
  'about.privacy':
    'Je instellingen blijven op je telefoon — geen account en geen tracking. Libell stuurt alleen anonieme tellingen van hoe de app wordt gebruikt, en dat kun je uitzetten.',
  'about.source': 'Libell is gratis en open source (MIT-licentie).',
  'about.source.link': 'Broncode op GitHub',
  'menu.privacy': 'Privacy',
  'menu.privacy.tab': 'Privacy',
  'privacy.stored.h': 'Opgeslagen op deze telefoon',
  'privacy.stored.empty': 'Er is niets opgeslagen.',
  'privacy.raw': 'Ruwe gegevens tonen',
  'privacy.raw.hint': 'Precies zoals opgeslagen. Het wachtwoord van de box is verborgen.',
  'privacy.resetSettings': 'Alleen de instellingen terugzetten',
  'privacy.deleteAll': 'Alle Libell-gegevens wissen',
  'privacy.deleteAll.confirm':
    'Alles wissen wat Libell op deze telefoon heeft opgeslagen? Voertuigen, maten en kalibratie verdwijnen, en Libell begint opnieuw zoals de eerste keer.',
  'privacy.deleteAll.yes': 'Ja, alles wissen',
  'privacy.deleteAll.cancel': 'Annuleren',
  'stored.vehicle': 'Voertuig',
  'stored.vehicle.detail': '{name}, wielbasis {wheelbase}',
  'stored.settings': 'Instellingen',
  'stored.settings.detail': 'Maten, blokken, eenheid, uiterlijk en geluid',
  'stored.password': 'Wachtwoord van de sensorbox',
  'stored.language': 'Taal',
  'stored.phoneCalibration': 'Kalibratie van de telefoon',
  'stored.zero': 'Nulpunt van het voertuig',
  'stored.zeroTrim': 'Fijnafstelling van het nulpunt',
  'stored.targets': 'Doelen',
  'stored.targets.active': '{name} (gekozen)',
  'stored.hitch': 'Koppelhoogte',
  'stored.rememberedBox': 'Onthouden sensorbox',
  'stored.notes': 'Eigen notities van de app',
  'stored.notes.detail': '{n} kleine markeringen, zoals of de introductie is getoond',
  'stored.phone': 'De telefoon',
  'stored.saved': 'opgeslagen',
  'stored.counting.off': 'Uitgeschakeld',
  'stored.savedOn': 'opgeslagen op {date}',

  'intro.h': 'Welkom bij Libell',
  'intro.how':
    'Leg de telefoon plat in het voertuig en Libell laat zien welke wielen omhoog moeten, en hoeveel.',
  'intro.start': 'Aan de slag',
  'intro.later': 'Eerst rondkijken',
  'onboard.source.sensorIcon':
    'Een sensorbox kun je altijd verbinden met het sensorpictogram rechtsboven.',
  'counting.title': 'Anoniem tellen',
  'counting.intro': 'Libell telt het gebruik anoniem, zodat we weten wat beter moet.',
  'counting.sent.h': 'Wat wordt geteld',
  'counting.sent':
    'Dat de app is geopend, welke functies worden gebruikt, welk sensormodel meet (de telefoon of een model zoals {boxes}), de appversie en de taal die in Libell is gekozen.',
  'counting.notSent.h': 'Wat nooit wordt opgeslagen',
  'counting.notSent':
    'Je IP-adres, land, apparaat, scherm, besturingssysteem of browser, de maten van je voertuig, je instellingen, of iets anders over jou. Voor het tellen wordt niets op je telefoon opgeslagen.',
  'counting.gpc': 'Als je browser websites vraagt je niet te volgen, telt Libell niets.',
  'counting.later': 'Je kunt het altijd uitzetten via {help} › {tab}.',
  'counting.toggle': 'Mijn gebruik anoniem tellen',
  'counting.dashboard': 'Bekijk de statistieken',
  'onboard.sound.h': 'Geluid',
  'onboard.source.h': 'Hoe wil je meten?',
  'onboard.source.intro':
    'Kies van welke sensor Libell de helling leest — de meeste mensen gebruiken gewoon de telefoon.',
  'onboard.source.phone': 'Deze telefoon',
  'onboard.source.externalActive':
    'Er is nu een sensorbox actief. Kies je deze telefoon, dan wordt het kalibreren van de telefoon overgeslagen. Om de telefoon te kalibreren, open je eerst de box met het sensorpictogram rechtsboven en tik je op “{disconnect}”.',
  'onboard.vehicle.h': 'Wat wil je waterpas zetten?',
  'onboard.vehicle.intro': 'Kies je voertuig — de rest van deze handleiding past zich daaraan aan.',
  'onboard.step1.h': 'Leg de telefoon zo neer',
  'onboard.next': 'Volgende',
  'onboard.back': 'Terug',
  'onboard.close': 'Introductie sluiten',
  'onboard.done': 'Klaar',
  'onboard.skipStep': 'Overslaan',
  'onboard.note.measurements':
    'Sla je dit over, dan worden de standaardmaten gebruikt; {lamp} blijft branden tot je de jouwe opslaat.',
  'onboard.note.ramps':
    'Sla je dit over, dan worden de standaardblokken gebruikt. Je kunt die van jou later kiezen in Instellingen.',
  'onboard.note.calibrate':
    'Nu geen vlakke ondergrond? Tik op {next}; {lamp} herinnert je eraan tot het gedaan is.',
  'onboard.note.connect':
    'Geen box bij de hand? Tik op {next} en verbind later met het sensorpictogram rechtsboven.',
  'onboard.zeroLater':
    'Je nult het voertuig de eerste keer dat je op een vlakke plek parkeert. {lamp} herinnert je eraan tot het gedaan is.',
  'onboard.legend.ok': 'Groen ✓ — dat wiel staat waterpas.',
  'onboard.legend.up': 'Oranje ↑ — dat wiel moet de getoonde trede oprijden.',
  'onboard.legend.no': 'Rood ✕ — geen trede is genoeg; zoek een vlakkere plek.',
  'onboard.legend.dim': 'Grijs – — geen blok bij dat wiel; het getal toont hoeveel er ontbreekt.',
  'settings.wheelbase': 'Wielbasis',
  'settings.trackFront': 'Spoorbreedte voor',
  'settings.trackRear': 'Spoorbreedte achter',
  'settings.tolerance': 'Tolerantie',
  'settings.stability': 'Stabiliteit',
  'settings.dwellRest': 'Reactietijd (ms)',
  'settings.dwellMotion': 'Reactietijd tijdens bijstellen (ms)',
  'settings.dwell.hint': 'Hoe lang een meting stabiel moet blijven voordat het getal verandert.',
  'settings.vehicle': 'Voertuig',
  'vehicle.motorhome': 'Camper',
  'vehicle.caravan': 'Caravan',
  'settings.axleToJockey': 'As tot neuswiel',
  'settings.rearAxle': 'Achteras',
  'settings.axle': 'As',
  'axle.single': 'Enkel',
  'axle.boggie': 'Tandem (dubbele as)',
  'settings.track': 'Spoorbreedte',
  'settings.measureHint': 'Ze staan in de kentekenpapieren. Een paar cm verschil maakt niet uit.',
  'settings.measureHint.caravan':
    'Meet van de as tot het neuswiel. Een paar cm verschil maakt niet uit.',
  'settings.measureHint.boggie': 'Meet bij een tandemas tot het midden van het assenpaar.',
  'settings.steps': 'Hoogte bloktreden',
  'settings.steps.add': 'Trede erbij',
  'settings.steps.new': 'Nieuwe tredehoogte ({unit})',
  'settings.steps.remove': '{value} verwijderen',
  'settings.ramp': 'Kant-en-klaar blok',
  'settings.ramp.custom': 'Eigen set',
  'settings.ramp.stepless': 'Traploze wig',
  'settings.ramp.steplessModel': '{name} (traploos, max. {max} mm)',
  'settings.stepless.max': 'Traploze wig, max. hoogte',
  'settings.stepless.maxHeading': 'Max. hoogte',
  'settings.stepless.set': 'Opslaan',
  'settings.stepless.new': 'Max. hoogte ({unit})',
  'settings.rampCount': 'Aantal blokken',
  'settings.drain': 'Afvoerzijde',
  'settings.rampHint': 'De app kiest waar je blokken het meest helpen.',
  'settings.drainHint':
    'Binnen de tolerantie blijft deze kant het laagst, zodat het water wegloopt.',
  'settings.section.vehicle': 'Voertuig en maten',
  'settings.section.ramps': 'Blokken',
  'settings.general': 'Algemeen',
  'settings.language': 'Taal',
  'settings.language.auto': 'Automatisch (taal van het apparaat)',
  'settings.tolerance.hint': 'Hoe dicht bij waterpas nog als waterpas telt.',
  'settings.stability.hint': 'Dempt kleine sensortrillingen zodat de getallen niet flikkeren.',
  'drain.none': 'Geen / maakt niet uit',
  'drain.left': 'Links, midden',
  'drain.right': 'Rechts, midden',
  'drain.front': 'Voor, midden',
  'drain.rear': 'Achter, midden',
  'drain.frontLeft': 'Linksvoor',
  'drain.frontRight': 'Rechtsvoor',
  'drain.rearLeft': 'Linksachter',
  'drain.rearRight': 'Rechtsachter',
  'settings.unit': 'Lengtes tonen in',
  'settings.unitInches': 'inch (in)',
  'settings.theme': 'Thema',
  'theme.system': 'Zoals de telefoon',
  'theme.light': 'Licht',
  'theme.dark': 'Donker',
  'settings.appearance': 'Uiterlijk',
  'appearance.classic': 'Klassiek',
  'appearance.modern': 'Modern',
  'appearance.glossy': 'Glanzend',
  'settings.sound': 'Signaal bij waterpas',
  'settings.soundGuidance': 'Doorlopende geluidsbegeleiding',
  'settings.soundGuidance.help':
    'De piep wordt sneller en hoger naarmate je dichter bij waterpas komt.',
  'settings.soundSpeech': 'Gesproken begeleiding',
  'settings.soundSpeech.help':
    'Als het voertuig stilstaat, zegt de app welk wiel en hoeveel, bijvoorbeeld “Linksachter, Trede 2”.',
  'settings.soundSpeech.unavailable':
    'Gesproken begeleiding werkt niet op deze telefoon: er is geen Nederlandse stem die offline werkt. De tonen werken gewoon.',
  'speech.level': 'Waterpas',
  'speech.inches': '{n} inch',
  'speech.inchOne': 'één inch',
  'speech.inchOneAnd': 'één en {fraction} inch',
  'speech.inchesAnd': '{n} en {fraction} inch',
  'speech.inchFraction': '{fraction} inch',
  'speech.eighth1': 'een achtste',
  'speech.eighth2': 'een kwart',
  'speech.eighth3': 'drie achtste',
  'speech.eighth4': 'een halve',
  'speech.eighth5': 'vijf achtste',
  'speech.eighth6': 'driekwart',
  'speech.eighth7': 'zeven achtste',
  'settings.undo': 'Herstel',
  'settings.saved': 'Opgeslagen',
  'settings.more': 'Meer',
  'settings.fineTuning': 'Fijnafstelling',
  'settings.resetAll': 'Instellingen terugzetten',
  'settings.err.positive': 'Voer een getal boven 0 in. De vorige waarde blijft gelden.',
  'settings.err.notNegative': 'Voer 0 of meer in. De vorige waarde blijft gelden.',
  'settings.err.range': 'Voer een getal van {min} tot {max} in. De vorige waarde blijft gelden.',

  'settings.tab.vehicle': 'Voertuig',
  'settings.tab.ramps': 'Blokken',
  'settings.tab.level': 'Waterpas',
  'settings.klossar.brandAll': 'Alle',
  'settings.klossar.changeRamp': 'Ander blok',
  'settings.rampCountHint': 'De app legt ze waar ze het meest helpen.',
  'settings.klossar.selected': 'Gekozen',
  'settings.klossar.stepsHeading': 'Tredehoogtes',

  'status.measuring': 'Meten…',
  'status.almost': 'Bijna waterpas — nog {left}',
  'status.cantLevel.close':
    'Je blokken komen dichtbij maar zijn hier net niet genoeg — verplaats het voertuig',
  'status.cantLevel.far': 'Je blokken zijn hier lang niet genoeg — verplaats het voertuig',
  'adjustable.before': 'Zet de blokken op de getoonde trede voor het oprijden.',
  'adjustable.after': 'Nog niet waterpas. Rij van de blokken af, dan meet de app opnieuw.',

  'calibration.intro':
    'Leg de telefoon op een ondergrond waarvan je weet dat die waterpas is en tik op Nu kalibreren. ' +
    'De huidige helling wordt het referentiepunt.',
  'calibration.status': 'Gekalibreerd: langs {pitch}, dwars {roll}.',
  'calibration.status.none': 'Niet gekalibreerd — de ruwe sensor wordt gebruikt.',
  'calibration.now': 'Nu kalibreren',
  'calibration.step.phone.done': 'Telefoon gekalibreerd',
  'calibration.step.phone.hint': 'Leg de telefoon op iets vlaks.',
  'calibration.step.flipLink': 'Niets vlaks? Draai de telefoon',
  'calibration.step.vehicle.done': 'Genuld',
  'calibration.step.vehicle.hint':
    'Zet het voertuig recht met een waterpas en leg de telefoon op zijn vaste plek.',
  'calibration.step.vehicle.now': 'Nu nullen',
  'calibration.clear': 'Kalibratie wissen',
  'calibration.err.notRunning':
    'De hellingsensor draait nog niet — tik eerst op Start in het hoofdscherm.',
  'calibration.warn.notFlat':
    'Kalibratie opgeslagen, maar dit lijkt niet vlak (meer dan 15°), dus ze klopt waarschijnlijk niet. Niet wat je bedoelde? Tik op Herstel, leg de telefoon op een vlakke ondergrond en kalibreer opnieuw.',
  'calibration.undo': 'Herstel',
  'calibration.sensor.h': 'Telefoon kalibreren',
  'calibration.vehicle.h': 'Voertuig nullen',
  'calibration.vehicle.intro':
    'Kalibreren gaat over de telefoon, niet over de plek waar hij ligt. Helt de tafel een beetje, dan toont de app die helling. Zet het voertuig één keer recht met een waterpas, leg de telefoon op zijn vaste plek en tik op Nu nullen.',
  'calibration.vehicle.now': 'Nu nullen',
  'calibration.vehicle.clear': 'Nulpunt wissen',
  'calibration.vehicle.status': 'Nulpunt voertuig: langs {pitch}, dwars {roll}.',
  'calibration.vehicle.status.none':
    'Geen nulpunt voor het voertuig — de plek van de telefoon telt als vlak.',
  'calibration.vehicle.warn.notFlat':
    'Nulpunt opgeslagen, maar dit lijkt niet waterpas (meer dan 15°). Stond het voertuig niet recht? Tik op Herstel, zet het voertuig recht en tik opnieuw op Nu nullen.',
  'calibration.age.today': '(vandaag)',
  'calibration.age.days': '({n} dagen geleden)',
  'calibration.check': 'Controleer',
  'calibration.check.good': 'Nog goed — {off}° afwijking.',
  'calibration.check.off': '{off}° afwijking — overweeg opnieuw te kalibreren.',
  'calibration.vehicle.check.off': '{off}° afwijking — overweeg opnieuw te nullen.',
  'calibration.check.none':
    'Nog niet gekalibreerd, dus er is niets te controleren. Leg de telefoon op een vlakke ondergrond en tik op “{now}”.',
  'calibration.vehicle.check.none':
    'Nog geen nulpunt, dus er is niets te controleren. Zet het voertuig recht met een waterpas en tik op “{now}”.',
  'calibration.flip.intro':
    'Geen vlakke ondergrond in de buurt? Gebruik draaikalibratie: leg de telefoon ergens ' +
    'redelijk vlak neer, meet, draai de telefoon een halve slag (180°) op dezelfde ' +
    'plek, meet opnieuw — de helling van de ondergrond valt dan weg.',
  'calibration.flip.start': 'Draaikalibratie',
  'calibration.flip.rotate':
    'Draai de telefoon nu een halve slag (180°) op dezelfde plek en tik op Meten.',
  'calibration.flip.capture': 'Meten',
  'calibration.flip.done': 'Klaar! Je ondergrond helt {surface}° — weggerekend.',
  'calibration.flip.warn.moved':
    'Kalibratie opgeslagen, maar de twee metingen verschillen meer dan 15°. Is de telefoon verschoven? Tik op Herstel en begin opnieuw.',
  'calibration.pill.notDone': 'OPEN',
  'calibration.pill.done': 'KLAAR',
  'calibration.pill.none': 'GEEN',

  'targets.normal': 'Normaal (waterpas)',
  'targets.name.placeholder': 'Naam (bijv. “Douche-afvoer”)',
  'targets.name.label': 'Naam van het nieuwe doel',
  'targets.defaultName': 'Doel {n}',
  'targets.add': 'Helling opslaan als nieuw doel',
  'targets.delete': '{name} verwijderen',
  'targets.warn.tooSteep':
    'Doel opgeslagen, maar het is steiler dan een gewoon doel (meer dan 15°). Niet wat je bedoelde? Verwijder het met het kruisje en sla opnieuw op.',
  'targets.badge': 'Doel: {name}',

  'feedback.intro':
    'Een probleem gevonden of een idee? Vul dit in en tik op de knop — die opent ' +
    'een kant-en-klaar rapport op GitHub dat je daar plaatst (je hebt een gratis ' +
    'GitHub-account nodig, binnen een minuut aangemaakt).',
  'feedback.category': 'Waar gaat het over?',
  'feedback.cat.bug': 'Fout',
  'feedback.cat.suggestion': 'Suggestie',
  'feedback.cat.other': 'Overig',
  'feedback.title': 'Korte titel',
  'feedback.desc': 'Wat is er gebeurd, of wat zou je willen?',
  'feedback.submit': 'Rapport openen op GitHub',
  'feedback.warn.title': 'De titel is leeg — je kunt het rapport toch versturen.',
  'feedback.warn.desc': 'De beschrijving is leeg — je kunt het rapport toch versturen.',
  'feedback.warn.both':
    'De titel en de beschrijving zijn leeg — je kunt het rapport toch versturen.',

  'help.screen.h': 'Het scherm lezen',
  'help.screen.lead':
    'Het scherm toont welke wielen omhoog moeten en hoeveel. Trede 2 betekent de tweede trede van je blok.',
  'help.screen.t':
    'Groen ✓: klaar, niets te doen.\n' +
    'Oranje ↑: dat wiel moet de trede oprijden die ernaast staat.\n' +
    'Rood ✕: je blokken zijn hier niet genoeg. Verplaats het voertuig.\n' +
    'Grijs –: geen blok bij dat wiel. Het getal toont hoeveel er ontbreekt, als je er iets anders onder wilt leggen.\n' +
    'Als de luchtbel in het midden rust, sta je waterpas.',
  'help.screen.routine':
    'Oprijden, wachten tot het voertuig stilstaat en opnieuw kijken. Herhaal dit tot elk wiel groen is.',
  'help.what.t':
    'Leg de telefoon plat in het voertuig, bovenkant naar voren, elke keer op dezelfde plek.\n' +
    'Met een sensorbox maakt het niet uit hoe de telefoon ligt.',
  'help.settings.h': 'De maten',
  'help.measures.h': 'Maten invoeren',
  'help.settings.t':
    'Libell berekent uit de wielbasis en spoorbreedte hoeveel elk wiel omhoog moet.\n' +
    'Ze staan in de voertuigpapieren, of meet ze met een meetlint.\n' +
    'Typ ze in mm, cm of inch, wat je ook gekozen hebt bij Lengtes tonen in.\n' +
    'Bij een caravan is de wielbasis de afstand van de as tot het neuswiel.\n' +
    'Met meerdere voertuigen houdt elk zijn eigen maten, blokken, nulpunt, doelen en sensorbox; kies er een bovenaan bij Voertuig.',
  'help.ramps.t':
    'Het scherm vertelt op welke trede van je blok elk wiel moet, dus voer de blokken in die je bij je hebt.\n' +
    'Kies een kant-en-klaar blok of een eigen set, en hoeveel je er hebt. Libell legt ze waar ze het meest helpen.\n' +
    'Voor een blok zonder treden kies je Traploze wig en voer je de hoogte in. Het scherm zegt dan hoe ver je moet oprijden.',
  'help.calibration.h': 'Kalibreren en nullen',
  'help.calibration.t':
    'Twee stappen maken de metingen juist: kalibreer de telefoon één keer en nul het voertuig één keer.\n' +
    'Kalibreren: leg de telefoon op een vlakke ondergrond en tik op Nu kalibreren.\n' +
    'Nullen: zet het voertuig recht met een waterpas, leg de telefoon op zijn vaste plek en tik op Nu nullen.\n' +
    'Met een sensorbox nul je op de pagina van de box. Die hoeft niet gekalibreerd te worden.\n' +
    'Nog niet helemaal waterpas? Stel het nulpunt fijn af met Links hoger, Rechts hoger, Voor hoger of Achter hoger bij Voertuig nullen.\n' +
    'De lamp ⚠ Kalibreren of ⚠ Nullen blijft branden tot het gedaan is.',
  'help.sensor.h': 'Sensorbox',
  'help.sensor.t':
    'Een sensorbox in het voertuig kan meten in plaats van de telefoon. Libell werkt met deze:\n' +
    '{upright}: staat rechtop, in elke richting.\n' +
    '{flat}: ligt plat, deksel boven, met één pijl naar voren.\n' +
    'Verbind met het sensorpictogram rechtsboven. De pagina van de box leidt je dan door Kies de richting en Voertuig nullen.\n' +
    'Het werkt in Chrome of Edge op Android of een computer. Op een iPhone heb je de browser Bluefy nodig.\n' +
    'Als de box de code weigert, vraagt Libell om de viercijferige code van de box.',
  'help.targets.h': 'Doelen en geluid',
  'help.targets.t':
    'Sla een gewenste helling op, bijvoorbeeld richting de douche-afvoer, en wissel ertussen.\n' +
    'Caravan: sla de koppelhoogte op voordat je afkoppelt, en Naar koppelhoogte leidt het neuswiel ernaar terug.\n' +
    'Met gesproken begeleiding aan zegt de app welk wiel omhoog moet en hoeveel, zodat je waterpas kunt zetten zonder naar de telefoon te kijken.\n' +
    'De knop in het midden van de onderbalk zet het geluid aan en uit.',
  'help.trouble.h': 'Als er iets niet klopt',
  'help.trouble.t':
    '“Meten…”: het voertuig schommelt. Wacht tot het stilstaat.\n' +
    '“Leg de telefoon plat om te meten”: de telefoon helt te veel om te meten.\n' +
    '“Contact met de box verloren”: tik op Opnieuw verbinden en kies de box in de lijst.\n' +
    '“Wachten op de hellingsensor…”: nog geen metingen. Tik op een iPhone elke keer dat je de app opent op Start; herlaad anders de pagina.\n' +
    '“Toegang tot beweging is geweigerd”: sta beweging en oriëntatie toe voor deze site in de browserinstellingen en herlaad.\n' +
    'Nog steeds fout? Schrijf een rapport onder Feedback.',
  'help.open': '{name} openen',
  'help.open.sensor': 'Sensorbox openen',
  'help.open.feedback': 'Rapport schrijven',

  'main.hint': 'Leg je telefoon plat in het voertuig, bovenrand naar voren.',
  'main.start': 'Start',
  'main.waiting': 'Wachten op de hellingsensor…',
  'main.level': 'Je voertuig staat waterpas!',
  'main.denied':
    'Toegang tot beweging is geweigerd, dus Libell kan de helling niet lezen. ' +
    'Sta toegang tot beweging en oriëntatie toe voor deze site en herlaad.',
  'main.noSensors':
    'Dit apparaat heeft geen bewegingssensoren, dus Libell kan de helling niet lezen.',
  'main.https':
    'Libell heeft een beveiligde verbinding (HTTPS) nodig om de hellingsensoren te lezen. ' +
    'Open de app via HTTPS en probeer het opnieuw.',

  'diagram.aria': 'Bovenaanzicht van je camper dat toont welke wielen omhoog moeten',
  'diagram.caravan.aria': 'Bovenaanzicht van je caravan met de aswielen en het neuswiel',
  'diagram.front': 'Voor',
  'diagram.step': 'Trede {n}',
  'diagram.driveUp': 'Oprijden',
  'diagram.done': 'Klaar',
  'diagram.noRamp': 'Geen blok',
  'diagram.wheel.frontLeft': 'Linksvoor',
  'diagram.wheel.frontRight': 'Rechtsvoor',
  'diagram.wheel.rearLeft': 'Linksachter',
  'diagram.wheel.rearRight': 'Rechtsachter',
  'diagram.notEnough': 'niet genoeg',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Draai omhoog',
  'caravan.crankDown': 'Draai omlaag',
  'caravan.axleLeft': 'Linker aswiel',
  'caravan.axleRight': 'Rechter aswiel',
  'caravan.jockeyWheel': 'Neuswiel',
  'help.screen.caravan': 'Caravan: het neuswiel zegt Draai omhoog of Draai omlaag, en hoeveel.',

  'vehicles.title': 'Voertuigen',
  'vehicles.defaultName': 'Mijn voertuig',
  'vehicles.numbered': 'Voertuig {n}',
  'vehicles.name.placeholder': 'Naam (bijv. “Caravan”)',
  'vehicles.name.label': 'Naam van het voertuig',
  'vehicles.add': 'Nieuw voertuig',
  'namePrompt.save': 'Opslaan',
  'namePrompt.cancel': 'Annuleren',
  'choice.rename': '{name} hernoemen',
  'vehicles.badge': 'Voertuig: {name}',
  'vehicles.delete': '{name} verwijderen',
  'vehicles.remove.confirm': '{name} verwijderen, met het nulpunt, de doelen en de sensorbox?',
  'vehicles.remove.yes': 'Verwijderen',
  'vehicles.hint':
    'Maten, blokken, het nulpunt, doelen en de sensorbox horen bij het voertuig. De kalibratie van de telefoon is gedeeld.',
  'setup.incoming.addNew': 'Als nieuw voertuig',

  'hitch.title': 'Koppelhoogte',
  'hitch.hint':
    'Sla die op terwijl de caravan nog op de trekhaak staat. Voordat je weer aankoppelt, toont het neuswiel hoe ver je moet draaien zodat de koppeling op de kogel komt.',
  'hitch.save': 'Koppelhoogte opslaan',
  'hitch.go': 'Naar koppelhoogte',
  'hitch.done': 'Klaar',
  'hitch.savedNow': 'Koppelhoogte opgeslagen.',
  'hitch.status.none': 'Nog geen koppelhoogte opgeslagen.',
  'hitch.status.saved': 'Er is een koppelhoogte opgeslagen.',
  'hitch.status.active': 'Het hoofdscherm toont hoe ver je het neuswiel moet draaien.',
  'hitch.badge': 'Koppelhoogte',
  'hitch.badge.aria': 'Koppelhoogte: tik om weer gewoon waterpas te zetten',
  'hitch.crank.up': 'Draai {amount} omhoog naar koppelhoogte',
  'hitch.crank.down': 'Draai {amount} omlaag naar koppelhoogte',
  'hitch.reached': 'Op koppelhoogte',
  'hitch.offer': 'Eerst de koppelhoogte opslaan?',
  'hitch.offer.save': 'Opslaan',
  'hitch.offer.dismiss': 'Niet nu',

  'zeroTrim.title': 'Nulpunt fijn afstellen',
  'zeroTrim.hint':
    'Nog niet helemaal waterpas? Elke tik verschuift het nulpunt 0,1°, zodat de app die kant hoger wil.',
  'zeroTrim.left': 'Links hoger',
  'zeroTrim.right': 'Rechts hoger',
  'zeroTrim.front': 'Voor hoger',
  'zeroTrim.back': 'Achter hoger',
  'zeroTrim.side.left': 'Links',
  'zeroTrim.side.right': 'Rechts',
  'zeroTrim.side.front': 'Voor',
  'zeroTrim.side.back': 'Achter',
  'zeroTrim.total': 'Fijn afgesteld: {trim}',
  'zeroTrim.none': 'Niet fijn afgesteld',
  'zeroTrim.reset': 'Afstelling wissen',
  'tilt.frontBack': 'Langs',
  'tilt.sideSide': 'Dwars',

  'pose.layFlat': 'Leg de telefoon plat om te meten',
  'pose.sensorHint': 'Hij meet alleen goed als hij plat ligt, bovenkant boven.',
  'pose.openSensorPage': 'Toon de box',
  'pose.sensorExtreme': 'De box helt te ver',
  'pose.sensorUpsideDown': 'De box lijkt ondersteboven te zitten',
  'pose.sensorNotUpright': 'De box ligt plat',
  'pose.sensorHintUpright': 'Hij meet alleen goed als hij rechtop staat.',
  'calibration.external.h': 'Voertuig nullen',
  'calibration.external.intro': 'Zet het voertuig één keer recht met een waterpas en nul het dan.',
  'calibration.external.phoneHidden':
    'De eigen kalibratie van de telefoon is verborgen zolang de sensorbox meet. Om de telefoon te kalibreren, open je de box en tik je eerst op “{disconnect}”.',
  'calibration.external.working': 'Nullen…',
  'calibration.external.done': '{name} is genuld: deze stand telt nu als waterpas.',
  'calibration.external.err.notConnected':
    '{name} is niet verbonden. Verbind hem en probeer het opnieuw.',
  'calibration.external.err.failed':
    'Kan {name} niet nullen. Er is niets gewijzigd. Controleer de verbinding en probeer het opnieuw.',
  'pose.portrait': 'Draai de telefoon naar staand — de bovenrand moet naar voren wijzen',

  'stale.dataUnavailable': 'Geen nieuwe sensorgegevens — begeleiding gepauzeerd tot ze terugkomen',

  'sensorFallback.lost': 'Contact met de box verloren',
  'sensorFallback.autoRetry': 'Automatisch opnieuw proberen…',
  'sensorFallback.connect': 'Verbind de box',
  'sensorFallback.pick': 'Tik en kies je box in de lijst.',
  'sensorFallback.notFound': 'Geen box gevonden? Controleer of hij aan staat en dichtbij is.',
  'sensorFallback.retry': 'Opnieuw verbinden',
  'sensorFallback.usePhone': 'Gebruik de telefoon',
  'mounting.prompt.upright':
    'Tik waar de achterkant van de box (de schroefbevestiging) naartoe wijst.',
  'mounting.prompt.arrow':
    'Een van de pijlen van de box (op het deksel of op de printplaat eronder) wijst naar voren. Welke kant is naar voren gericht?',
  'mounting.placement.wide': 'Lange kant voorop',
  'mounting.placement.short': 'Korte kant voorop',
  'mounting.facing.front': 'Wijst naar voren',
  'mounting.facing.right': 'Wijst naar rechts',
  'mounting.facing.rear': 'Wijst naar achteren',
  'mounting.facing.left': 'Wijst naar links',
  'box.state.connected': 'Verbonden',
  'box.state.lost': 'Geen contact',
  'box.state.password': 'Fout wachtwoord',
  'box.password.label': 'Code van de box',
  'box.password.retry': 'Opnieuw',
  'box.password.checking': 'Code proberen…',
  'box.password.invalid': 'De code bestaat uit vier cijfers.',
  'box.password.wrong': 'De box accepteerde ook die code niet.',
  'box.password.noAnswer':
    'De box antwoordde niet. De code is opgeslagen en wordt geprobeerd zodra de box weer verbinding maakt.',
  'box.state.notConnected': 'Niet verbonden',
  'box.state.battery': 'batterij {value}',
  'box.connect': 'Verbinden',
  'box.step.position.upright.ok': 'Staat rechtop',
  'box.step.position.upright.bad': 'Ligt plat: zet hem rechtop, in elke richting',
  'box.step.position.flat.ok': 'Ligt plat',
  'box.step.position.flat.bad': 'Helt te ver: leg hem plat, bovenkant boven',
  'box.step.position.flat.upsideDown':
    'Ondersteboven: leg hem met het deksel naar boven. De fabrikant raadt ondersteboven monteren af.',
  'box.step.position.waiting': 'Positie: wachten op een meting',
  'box.step.direction.todo': 'Kies de richting',
  'box.step.direction.done': 'Richting ingesteld',
  'box.step.direction.learn': 'Twijfel? Leer het: til de voorkant op',
  'box.step.zero.todo': 'Voertuig nullen',
  'box.step.zero.done': 'Genuld',
  'box.step.zero.hint': 'Zet het voertuig recht met een waterpas en nul het dan.',
  'box.forgetDirection': 'Richting wissen',
  'onboard.boxPosition.h': 'Positie van de box',
  'onboard.boxPosition.later':
    'Richting en nulpunt stel je in de eerste keer dat je parkeert. De pagina van de box leidt je, en de lamp ⚠ Nullen herinnert je eraan tot het gedaan is.',
  'onboard.boxPosition.notConnected':
    'Er is nog geen box verbonden, dus de positie kan niet worden getoond. Tik op {next} en verbind later met het sensorpictogram rechtsboven.',
  'sensorList.title': 'Sensorbox',
  'sensorList.phone':
    'De eigen sensor van de telefoon wordt gebruikt als er geen box verbonden is.',
  'box.step.zero.again': 'Opnieuw nullen',
};
