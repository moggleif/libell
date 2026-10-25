import type { Messages } from './en';

/** Danish. */
export const da: Messages = {
  'topbar.install': 'Installér',
  'topbar.share': 'Del Libell',
  'bottombar.settings': 'Indstillinger',
  'bottombar.sound.mute': 'Slå lyden fra',
  'bottombar.sound.unmute': 'Slå lyden til',
  'bottombar.help': 'Hjælp',
  'bottombar.label': 'Handlinger',
  'share.text': 'Sæt din autocamper eller campingvogn i vater med din telefon.',
  'share.copied': 'Link kopieret!',
  'update.check': 'Søg efter en ny version',
  'update.checking': 'Søger efter opdateringer…',
  'update.updating': 'Opdaterer til den nye version…',
  'update.latest': 'Du har den nyeste version',
  'update.offline': 'Ingen forbindelse, kan ikke søge efter opdateringer',
  'update.unsupported': 'Opdateringer er ikke tilgængelige her',
  'install.hint': 'Tryk på Del og derefter »Føj til hjemmeskærm«.',
  'install.row': 'Installér Libell som app på hjemmeskærmen.',
  'install.close': 'Skjul',
  'share.vehicle.text': 'Mit køretøjs opsætning til Libell — dimensioner og klodser.',
  'settings.shareVehicle': 'Send til en anden telefon',
  'setup.incoming.h': 'Modtaget køretøjsopsætning',
  'setup.incoming.intro': 'Et familiemedlem har delt disse køretøjsdimensioner med dig:',
  'setup.incoming.reminder':
    'Kalibreringen følger ikke med — du skal stadig kalibrere på denne telefon.',
  'setup.incoming.apply': 'Erstat nuværende køretøj',
  'setup.incoming.dismiss': 'Ikke nu',
  'setup.incoming.invalid': 'Linket til køretøjsopsætningen kunne ikke læses — intet blev ændret.',

  'lamp.setup': '⚠ Dimensioner',
  'lamp.setup.title':
    'Køretøjets dimensioner er aldrig blevet gemt — tryk for at åbne Indstillinger',
  'lamp.calibrate': '⚠ Kalibrér',
  'lamp.zero': '⚠ Nulstil',
  'lamp.calibrate.title': 'Telefonen er ikke kalibreret — tryk for at åbne »Kalibrér og nulstil«',
  'lamp.zero.title': 'Køretøjet er ikke nulstillet — tryk for at åbne »Kalibrér og nulstil«',
  'lamp.calibrate.title.sensor': 'Boksen er ikke nulstillet — tryk for at åbne boksen',

  'sensorStatus.connected': 'Sensorboks forbundet',
  'sensorStatus.disconnected': 'Sensorboks — kontakt tabt, tryk for detaljer',
  'sensorStatus.stale': 'Sensorboks — ingen nye data, tryk for detaljer',
  'sensorStatus.idle': 'Sensorboks — tryk for at forbinde',
  'sensorStatus.idle.guide': 'Sensorboks — tryk for vejledning til iPhone',

  'menu.title': 'Menu',
  'menu.close': 'Luk menuen',
  'menu.settings': 'Indstillinger',
  'menu.calibration': 'Kalibrér og nulstil',
  'menu.targets': 'Mål',
  'menu.feedback': 'Feedback',
  'menu.help': 'Hjælp',
  'menu.intro': 'Vis introduktion',
  'menu.about': 'Om Libell',
  'menu.about.tab': 'Om',
  'menu.sensorSource': 'Sensorboks',

  'sensorSource.connect': 'Forbind {name}-sensor',
  'sensorSource.disconnect': 'Afbryd',
  'sensorSource.status.connecting': 'Forbinder…',
  'sensorSource.err.unsupported': 'Web Bluetooth understøttes ikke i denne browser.',
  'sensorSource.unsupported.browser':
    'For at forbinde en sensorboks skal du åbne Libell i Chrome eller Edge på Android eller en computer. Telefonens egen sensor virker her som normalt.',
  'sensorSource.err.password':
    '{name}-boksen accepterede ikke sin adgangskode. Skriv boksens firecifrede kode nedenfor, og tryk på Prøv igen. Fabrikskoden er 0000. Hvis du ikke kender koden, kan du ændre den i Xparkle-appen.',
  'sensorSource.err.failed': 'Kunne ikke forbinde til {name}-sensoren.',

  'sensorSource.ios.intro':
    'Safari kan ikke forbinde direkte til Bluetooth-sensorer, men der er en løsning:',
  'sensorSource.ios.step1': 'Installér »Bluefy – Web Bluetooth Browser« fra App Store.',
  'sensorSource.ios.step2': 'Åbn Bluefy, og tillad Bluetooth-adgang.',
  'sensorSource.ios.step3': 'Gå til den samme Libell-adresse i Bluefy.',
  'sensorSource.ios.step4': 'Åbn Sensorboks her igen — det virker som på Android.',
  'sensorSource.ios.note':
    'Bluefy er en app fra en tredjepart, ikke lavet af Libell — når du åbner appen, ' +
    'kan det kræve et enkelt tryk der at forbinde igen, i stedet for at det sker af sig selv.',
  'sensorSource.ios.bluefyLink': 'Find Bluefy i App Store',

  'sensorSource.detail.temperature': 'Temperatur: {value}',
  'sensorSource.detail.notAvailable': 'Afventer',
  'sensorSource.lowBattery':
    '⚠ Lavt batteri ({value}) — overvej snart at skifte sensorboksens batteri.',

  'sensorSource.install.now': 'Nulstil nu',
  'sensorSource.install.clear': 'Glem nulpunktet',
  'sensorSource.install.status': 'Nulpunkt: for/bag {pitch}, side/side {roll}.',
  'sensorSource.install.status.none': 'Ikke nulstillet endnu — boksen måler, som den sidder.',

  'sensorSource.learn.h': 'Lær monteringen',
  'sensorSource.learn.intro':
    'Libell lærer retningen ud fra to løft: først fronten, derefter højre side.',
  'sensorSource.learn.start': 'Lær monteringen',
  'sensorSource.learn.step.front':
    'Løft køretøjets front et par centimeter, og tryk så på knappen.',
  'sensorSource.learn.capture.front': 'Fronten er løftet',
  'sensorSource.learn.step.right':
    'Sænk fronten igen. Løft nu højre side et par centimeter, og tryk så på knappen.',
  'sensorSource.learn.capture.right': 'Højre side er løftet',
  'sensorSource.learn.cancel': 'Annullér',
  'sensorSource.learn.status.learned': 'Montering lært.',
  'sensorSource.learn.status.none': 'Ingen montering lært — boksens egne retninger bruges.',
  'sensorSource.learn.done': 'Færdig! Tjek det: løft fronten, så skal Libell pege på baghjulene.',
  'sensorSource.learn.err.tooSmall':
    'Køretøjet flyttede sig næsten ikke. Løft det lidt mere, og prøv igen.',
  'sensorSource.learn.err.ambiguous':
    'Begge retninger flyttede sig omtrent lige meget. Løft kun fronten, derefter kun højre side, og prøv igen.',
  'sensorSource.learn.err.arrow':
    'Ingen pil peger fremad. Drej boksen, så en af dens pile peger fremad, og prøv igen.',
  'sensorSource.learn.err.mirrored':
    'Boksen ser ud til at vende på hovedet, eller den forkerte side blev løftet. Tjek det, og prøv igen.',
  'sensorSource.learn.err.sameAxis':
    'Begge løft hældede samme vej. Løft først fronten, derefter højre side, og prøv igen.',

  'sensorStatus.title': '{name}-sensor',
  'sensorStatus.reading': 'Hældning nu: {value}',
  'sensorStatus.debug': 'Debuginfo',
  'sensorStatus.debug.intro':
    'Rå værdier direkte fra boksen — til fejlsøgning, hvis noget ikke virker.',
  'sensorStatus.debug.state': 'Forbindelsestilstand: {value}',
  'sensorStatus.debug.deviceId': 'Enheds-id: {value}',
  'sensorStatus.debug.lastSample': 'Seneste aflæsning: {value}',
  'sensorStatus.debug.age': '{s} s siden',
  'sensorStatus.debug.rawAccel': 'Rå accelerometer (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Firmwareniveau: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Rå statusbytes: {value}',
  'sensorStatus.debug.versionBytes': 'Serienummer og firmware (rå): {value}',
  'sensorStatus.debug.copy': 'Kopiér info',
  'sensorStatus.debug.copied': 'Debuginfo kopieret!',
  'sensorStatus.debug.copy.failed': 'Kunne ikke kopiere automatisk.',
  'sensorStatus.advanced': 'Avanceret',
  'sensorStatus.silentReconnect.intro':
    'Denne browser kan endnu ikke selv forbinde til boksen igen, så efter en genstart skal du vælge den på listen igen. I Chrome kan du selv slå det til.',
  'sensorStatus.silentReconnect.steps':
    'Åbn {address}, søg efter »web bluetooth«, sæt »Use the new permissions backend for Web Bluetooth« til Enabled, og tryk på Relaunch. Forbind derefter boksen én gang.',
  'sensorStatus.silentReconnect.copy': 'Kopiér {address}',
  'sensorStatus.silentReconnect.copied': 'Kopieret — indsæt det i Chromes adresselinje.',
  'sensorStatus.debug.connectDelay.intro':
    'Eksperimentelt: prøv kun dette, hvis forbindelsen til din boks er ustabil. Tilføjer ' +
    'en fast pause efter tilslutning, før appen begynder at læse fra den.',
  'sensorStatus.debug.connectDelay.enable': 'Aktivér forbindelsespause',
  'sensorStatus.debug.connectDelay.ms': 'Pause (ms)',

  'about.text':
    'Libell hjælper dig med at sætte din autocamper eller campingvogn i vater med den ' +
    'telefon, du allerede har — uden at gætte.',
  'about.version': 'Version {v}',
  'about.offline':
    'Virker helt offline — netværket bruges kun til at hente opdateringer af selve appen.',
  'about.privacy':
    'Dine indstillinger bliver på telefonen — ingen konto og ingen sporing. Det eneste, Libell sender, er anonyme tal for, hvordan appen bruges, og det kan du slå fra.',
  'about.source': 'Libell er gratis og open source (MIT-licens).',
  'about.source.link': 'Kildekode på GitHub',
  'seo.title': 'Libell – sæt autocamperen eller campingvognen i vater med telefonen',
  'seo.description':
    'En gratis app, der viser, hvilke hjul på autocamperen eller campingvognen der skal op, og på hvilket trin på klodsen. Bruger telefonen eller en sensorboks og virker offline.',
  'menu.privacy': 'Privatliv',
  'menu.privacy.tab': 'Privatliv',
  'privacy.stored.h': 'Gemt på denne telefon',
  'privacy.stored.empty': 'Intet er gemt.',
  'privacy.raw': 'Vis rå data',
  'privacy.raw.hint': 'Præcis som det er gemt. Boksens adgangskode er skjult.',
  'privacy.resetSettings': 'Nulstil kun indstillingerne',
  'privacy.deleteAll': 'Slet alle Libell-data',
  'privacy.deleteAll.confirm':
    'Slet alt, hvad Libell har gemt på denne telefon? Køretøjer, dimensioner og kalibrering forsvinder, og Libell starter forfra som første gang.',
  'privacy.deleteAll.yes': 'Ja, slet alt',
  'privacy.deleteAll.cancel': 'Annullér',
  'privacy.policy': 'Læs privatlivspolitikken',
  'policy.title': 'Privatlivspolitik for Libell',
  'policy.changed': 'Senest ændret {date}',
  'policy.intro':
    'Libell er et frit open source-projekt. Der er ingen konti, ingen reklamer og ingen sporing, og ingen indsamler oplysninger om dig.',
  'policy.stored.h': 'Det, der gemmes på telefonen',
  'policy.stored':
    'Libell gemmer dine køretøjer med deres mål, indstillinger, kalibreringer, målpositioner, valgt sprog og den sensorboks, du sidst brugte. Det hele ligger i browserens lokale lager på din telefon. Det virker omtrent som cookies, men sendes aldrig nogen steder hen. Libell har brug for det for at virke, og derfor er der ingen samtykkeboks.',
  'policy.stored.delete':
    'Under {help} › {tab} i appen ser du alt, hvad der er gemt, og kan slette det hele. Du kan også rydde webstedets data i browseren.',
  'policy.sensors.h': 'Sensorer og Bluetooth',
  'policy.sensors':
    'Telefonens bevægelsessensorer og Bluetooth bruges kun på telefonen og kun til at måle hældningen. Målingerne forlader aldrig telefonen.',
  'policy.counting':
    'For at vide, hvad der skal forbedres, kan Libell tælle brugen anonymt med GoatCounter. Libell spørger dig én gang, om der må tælles, og intet tælles, før du har valgt. Statistikken er offentlig.',
  'policy.counting.ip':
    'Som ved alle forespørgsler på internettet når telefonens IP-adresse og browserens navn frem til GoatCounter. GoatCounter gemmer dem aldrig, men holder dem i hukommelsen i højst otte timer for at genkende det samme besøg. GoatCounter drives fra Irland og har sine servere i Finland og Tyskland, så intet forlader EU.',
  'policy.counting.change':
    'Du kan ændre dit valg når som helst under {help} › {tab}. Uden internet sendes intet, og intet gemmes til senere.',
  'policy.counting.basis':
    'Optællingen bygger på dit samtykke efter GDPR (artikel 6, stk. 1, litra a): du giver det med dit valg og kan trække det tilbage når som helst. Da intet, der kan identificere dig, gemmes, er der intet om dig at vise eller slette. Du kan klage til databeskyttelsesmyndigheden i dit land.',
  'policy.shared.h': 'Det, du selv vælger at dele',
  'policy.shared.feedback':
    'Under {help} › {feedback} kan du åbne en færdig sag på GitHub, som du selv opretter med din egen GitHub-konto. Sagen er offentlig. Ud over din tekst indeholder den appens version, skærmstørrelse, tidspunkt og browserens navn, og du ser det hele, før du opretter den.',
  'policy.shared.vehicle':
    '»{share}« laver et link med køretøjets mål, uden kalibrering. Linket havner kun dér, hvor du selv sender det.',
  'policy.site.h': 'Webstedet',
  'policy.site':
    'Libell ligger på GitHub Pages. Som alle webhoteller ser GitHub din IP-adresse, når siden indlæses. Libell har ikke adgang til GitHubs logfiler.',
  'policy.owner.h': 'Hvem der står bag Libell',
  'policy.owner':
    'Libell tilhører sit open source-projekt, ikke en person eller en virksomhed. Det er gratis og frit at bruge, som du vil, under MIT-licensen, og leveres, som det er, uden garanti.',
  'policy.questions.h': 'Spørgsmål og ændringer',
  'policy.questions':
    'Stil dine spørgsmål som en sag på GitHub. Når Libell ændrer, hvad der gemmes eller sendes, opdateres denne side samtidig.',
  'policy.questions.link': 'Sager på GitHub',
  'policy.languages': 'Andre sprog',
  'policy.open': 'Åbn Libell',
  'stored.vehicle': 'Køretøj',
  'stored.vehicle.detail': '{name}, akselafstand {wheelbase}',
  'stored.settings': 'Indstillinger',
  'stored.settings.detail': 'Dimensioner, klodser, enhed, udseende og lyd',
  'stored.password': 'Sensorboksens adgangskode',
  'stored.language': 'Sprog',
  'stored.phoneCalibration': 'Telefonens kalibrering',
  'stored.zero': 'Køretøjets nulstilling',
  'stored.zeroTrim': 'Finjustering af nulpunktet',
  'stored.targets': 'Mål',
  'stored.targets.active': '{name} (valgt)',
  'stored.hitch': 'Kuglehøjde',
  'stored.rememberedBox': 'Husket sensorboks',
  'stored.notes': 'Appens egne noter',
  'stored.notes.detail': '{n} små markeringer, fx om introduktionen er vist',
  'stored.phone': 'Telefonen',
  'stored.saved': 'gemt',
  'stored.counting.off': 'Slået fra',
  'stored.counting.on': 'Slået til',
  'stored.savedOn': 'gemt {date}',

  'intro.h': 'Velkommen til Libell',
  'intro.how':
    'Læg telefonen fladt i køretøjet, så viser Libell, hvilke hjul der skal op, og hvor meget.',
  'intro.start': 'Kom i gang',
  'intro.later': 'Kig rundt først',
  'onboard.source.sensorIcon':
    'En sensorboks kan forbindes når som helst med sensorikonet øverst til højre.',
  'counting.title': 'Anonym optælling',
  'counting.intro': 'Libell kan tælle brugen anonymt, så vi ved, hvad der skal forbedres.',
  'counting.sent.h': 'Det her tælles',
  'counting.sent':
    'At appen blev åbnet, hvilke funktioner der bruges, hvilken sensormodel der måler (telefonen eller en model som {boxes}), appens version og det sprog, der er valgt i Libell.',
  'counting.notSent.h': 'Det her gemmes aldrig',
  'counting.notSent':
    'Din IP-adresse, dit land, din enhed, skærm, dit styresystem eller din browser, køretøjets mål, dine indstillinger eller noget andet om dig. Kun dit valg gemmes på telefonen.',
  'counting.gpc': 'Hvis din browser beder websteder om ikke at spore dig, tæller Libell ingenting.',
  'counting.later': 'Du kan ændre dit valg når som helst under {help} › {tab}.',
  'counting.toggle': 'Tæl min brug anonymt',
  'counting.dashboard': 'Se statistikken',
  'counting.ask': 'Vil du hjælpe med at gøre Libell bedre?',
  'counting.yes': 'Ja, tæl anonymt',
  'counting.no': 'Nej tak',
  'onboard.sound.h': 'Lyd',
  'onboard.source.h': 'Hvordan vil du måle?',
  'onboard.source.intro':
    'Vælg, hvilken sensor Libell skal læse hældningen fra — de fleste bruger bare telefonen.',
  'onboard.source.phone': 'Denne telefon',
  'onboard.source.externalActive':
    'En sensorboks er aktiv nu. Vælger du denne telefon, springes kalibreringen af telefonen over. For at kalibrere telefonen skal du først åbne boksen med sensorikonet øverst til højre og trykke på »{disconnect}«.',
  'onboard.vehicle.h': 'Hvad vil du sætte i vater?',
  'onboard.vehicle.intro': 'Vælg dit køretøj — resten af guiden tilpasses det.',
  'onboard.step1.h': 'Læg telefonen sådan her',
  'onboard.next': 'Næste',
  'onboard.back': 'Tilbage',
  'onboard.close': 'Luk introduktionen',
  'onboard.done': 'Færdig',
  'onboard.skipStep': 'Spring over',
  'onboard.note.measurements':
    'Springer du over, bruges standarddimensionerne; {lamp} lyser, indtil du har gemt dine egne.',
  'onboard.note.ramps':
    'Springer du over, bruges standardklodserne. Du kan vælge dine egne senere under Indstillinger.',
  'onboard.note.calibrate':
    'Ingen plan flade lige nu? Tryk på »{next}«; {lamp} minder dig om det, indtil det er gjort.',
  'onboard.note.connect':
    'Ingen boks ved hånden? Tryk på »{next}«, og forbind senere med sensorikonet øverst til højre.',
  'onboard.zeroLater':
    'Du nulstiller køretøjet, første gang du parkerer på plant underlag. {lamp} minder dig om det, indtil det er gjort.',
  'onboard.legend.ok': 'Grøn ✓ — det hjul står i vater.',
  'onboard.legend.up': 'Orange ↑ — kør det hjul op på det viste trin.',
  'onboard.legend.no': 'Rød ✕ — intet trin er højt nok; flyt til et fladere sted.',
  'onboard.legend.dim': 'Grå – — ingen klods ved det hjul; tallet viser, hvor meget der mangler.',
  'settings.wheelbase': 'Akselafstand',
  'settings.trackFront': 'Sporvidde for',
  'settings.trackRear': 'Sporvidde bag',
  'settings.tolerance': 'Tolerance',
  'settings.stability': 'Stabilitet',
  'settings.dwellRest': 'Reaktionstid (ms)',
  'settings.dwellMotion': 'Reaktionstid under justering (ms)',
  'settings.dwell.hint': 'Hvor længe en aflæsning skal holde, før tallet ændres.',
  'settings.vehicle': 'Køretøj',
  'vehicle.motorhome': 'Autocamper',
  'vehicle.caravan': 'Campingvogn',
  'settings.axleToJockey': 'Aksel til næsehjul',
  'settings.rearAxle': 'Bagaksel',
  'settings.axle': 'Aksel',
  'axle.single': 'Enkelt',
  'axle.boggie': 'Tandem (boggie)',
  'settings.track': 'Sporvidde',
  'settings.measureHint': 'De står i registreringsattesten. Et par cm forkert gør ikke noget.',
  'settings.measureHint.caravan':
    'Mål fra akslen til næsehjulet. Et par cm forkert gør ikke noget.',
  'settings.measureHint.boggie': 'Med tandemaksel måler du til midten af akselparret.',
  'settings.steps': 'Klodsernes trinhøjder',
  'settings.steps.add': 'Nyt trin',
  'settings.steps.new': 'Ny trinhøjde ({unit})',
  'settings.steps.remove': 'Fjern {value}',
  'settings.ramp': 'Klodsmodel',
  'settings.ramp.custom': 'Eget sæt',
  'settings.ramp.stepless': 'Trinløs kile',
  'settings.ramp.steplessModel': '{name} (trinløs, maks. {max} mm)',
  'settings.stepless.max': 'Trinløs kile, maks. højde',
  'settings.stepless.maxHeading': 'Maks. højde',
  'settings.stepless.set': 'Gem',
  'settings.stepless.new': 'Maks. højde ({unit})',
  'settings.rampCount': 'Antal klodser',
  'settings.drain': 'Afløbsside',
  'settings.rampHint': 'Appen placerer dine klodser, hvor de gør mest gavn.',
  'settings.drainHint': 'Inden for tolerancen holdes denne side lavest, så vandet løber ud.',
  'settings.section.vehicle': 'Køretøj og dimensioner',
  'settings.section.ramps': 'Klodser',
  'settings.general': 'Generelt',
  'settings.language': 'Sprog',
  'settings.language.auto': 'Automatisk (enhedens sprog)',
  'settings.tolerance.hint': 'Hvor tæt på vater der tæller som vater.',
  'settings.stability.hint': 'Udglatter små udsving i sensoren, så tallene ikke flimrer.',
  'drain.none': 'Ingen / er ligegyldigt',
  'drain.left': 'Venstre, midt',
  'drain.right': 'Højre, midt',
  'drain.front': 'For, midt',
  'drain.rear': 'Bag, midt',
  'drain.frontLeft': 'Venstre for',
  'drain.frontRight': 'Højre for',
  'drain.rearLeft': 'Venstre bag',
  'drain.rearRight': 'Højre bag',
  'settings.unit': 'Vis længder i',
  'settings.unitInches': 'tommer (in)',
  'settings.theme': 'Tema',
  'theme.system': 'Følg telefonen',
  'theme.light': 'Lyst',
  'theme.dark': 'Mørkt',
  'settings.appearance': 'Udseende',
  'appearance.classic': 'Klassisk',
  'appearance.modern': 'Moderne',
  'appearance.glossy': 'Blank',
  'settings.sound': 'Klokkelyd ved vater',
  'settings.soundGuidance': 'Løbende lydvejledning',
  'settings.soundGuidance.help':
    'Bippet bliver hurtigere og lysere, jo tættere du kommer på vater.',
  'settings.soundSpeech': 'Talt vejledning',
  'settings.soundSpeech.help':
    'Når køretøjet står stille, siger appen hvilket hjul og hvor meget, for eksempel »Venstre bag, Trin 2«.',
  'settings.soundSpeech.unavailable':
    'Talt vejledning virker ikke på denne telefon: den har ingen dansk stemme, der virker offline. Tonerne virker som normalt.',
  'speech.level': 'I vater',
  'speech.inches': '{n} tommer',
  'speech.inchOne': 'en tomme',
  'speech.inchOneAnd': 'en og {fraction} tomme',
  'speech.inchesAnd': '{n} og {fraction} tommer',
  'speech.inchFraction': '{fraction} tomme',
  'speech.eighth1': 'en ottendedel',
  'speech.eighth2': 'en kvart',
  'speech.eighth3': 'tre ottendedele',
  'speech.eighth4': 'en halv',
  'speech.eighth5': 'fem ottendedele',
  'speech.eighth6': 'tre kvart',
  'speech.eighth7': 'syv ottendedele',
  'settings.undo': 'Fortryd',
  'settings.saved': 'Gemt',
  'settings.more': 'Mere',
  'settings.fineTuning': 'Finjustering',
  'settings.resetAll': 'Gendan standard',
  'settings.err.positive': 'Indtast et tal over 0. Den tidligere værdi gælder stadig.',
  'settings.err.notNegative': 'Indtast 0 eller mere. Den tidligere værdi gælder stadig.',
  'settings.err.range': 'Indtast et tal fra {min} til {max}. Den tidligere værdi gælder stadig.',

  'settings.tab.vehicle': 'Køretøj',
  'settings.tab.ramps': 'Klodser',
  'settings.tab.level': 'Vater',
  'settings.klossar.brandAll': 'Alle',
  'settings.klossar.changeRamp': 'Skift klods',
  'settings.rampCountHint': 'Appen placerer dem, hvor de hjælper mest.',
  'settings.klossar.selected': 'Valgt',
  'settings.klossar.stepsHeading': 'Trinhøjder',

  'status.measuring': 'Måler…',
  'status.almost': 'Næsten i vater — {left} tilbage',
  'status.cantLevel.close': 'Dine klodser er tæt på, men ikke nok her — flyt køretøjet',
  'status.cantLevel.far': 'Dine klodser er langt fra nok her — flyt køretøjet',
  'adjustable.before': 'Stil klodserne på det viste trin, og kør op.',
  'adjustable.after': 'Ikke i vater endnu. Kør ned fra klodserne, så måler appen igen.',

  'calibration.intro':
    'Læg telefonen på en flade, du ved er i vater, og tryk på Kalibrér nu. ' +
    'Den aktuelle hældning bliver referencen.',
  'calibration.status': 'Kalibreret: for/bag {pitch}, side/side {roll}.',
  'calibration.status.none': 'Ikke kalibreret — bruger den rå sensor.',
  'calibration.now': 'Kalibrér nu',
  'calibration.step.phone.done': 'Telefon kalibreret',
  'calibration.step.phone.hint': 'Læg telefonen på noget plant.',
  'calibration.step.flipLink': 'Ingen plan flade? Vend telefonen',
  'calibration.step.vehicle.done': 'Nulstillet',
  'calibration.step.vehicle.hint':
    'Sæt køretøjet i vater med et vaterpas, og læg telefonen på dens faste plads.',
  'calibration.step.vehicle.now': 'Nulstil nu',
  'calibration.clear': 'Slet kalibrering',
  'calibration.err.notRunning':
    'Hældningssensoren kører ikke endnu — tryk først på Start på hovedskærmen.',
  'calibration.warn.notFlat':
    'Kalibreringen er gemt, men det ser ikke plant ud (over 15°), så den er sandsynligvis forkert. Var det ikke meningen? Tryk på Fortryd, læg telefonen på en plan flade, og kalibrér igen.',
  'calibration.undo': 'Fortryd',
  'calibration.sensor.h': 'Kalibrér telefonen',
  'calibration.vehicle.h': 'Nulstil køretøjet',
  'calibration.vehicle.intro':
    'Kalibrering handler om telefonen, ikke om stedet, hvor den ligger. Hælder bordet lidt, viser appen den hældning. Sæt køretøjet i vater én gang med et vaterpas, læg telefonen på dens faste plads, og nulstil.',
  'calibration.vehicle.now': 'Nulstil nu',
  'calibration.vehicle.clear': 'Glem nulpunktet',
  'calibration.vehicle.status': 'Køretøjets nulpunkt: for/bag {pitch}, side/side {roll}.',
  'calibration.vehicle.status.none': 'Intet nulpunkt — telefonens plads regnes som plan.',
  'calibration.vehicle.warn.notFlat':
    'Nulpunktet er gemt, men det ser ikke ud til at være i vater (over 15°). Stod køretøjet ikke i vater? Tryk på Fortryd, sæt køretøjet i vater, og nulstil igen.',
  'calibration.age.today': '(i dag)',
  'calibration.age.days': '(for {n} dage siden)',
  'calibration.check': 'Tjek',
  'calibration.check.good': 'Stadig god — afviger {off}°.',
  'calibration.check.off': 'Afviger {off}° — overvej at kalibrere igen.',
  'calibration.vehicle.check.off': 'Afviger {off}° — overvej at nulstille igen.',
  'calibration.check.none':
    'Ikke kalibreret endnu, så der er intet at tjekke. Læg telefonen på en plan flade, og tryk på »{now}«.',
  'calibration.vehicle.check.none':
    'Intet nulpunkt endnu, så der er intet at tjekke. Sæt køretøjet i vater med et vaterpas, og tryk på »{now}«.',
  'calibration.flip.intro':
    'Ingen plan flade i nærheden? Brug vendekalibrering: læg telefonen et nogenlunde ' +
    'plant sted, aflæs, drej telefonen en halv omgang (180°) på samme sted, og aflæs ' +
    'igen — fladens hældning ophæver sig selv.',
  'calibration.flip.start': 'Kalibrér ved at vende',
  'calibration.flip.rotate':
    'Drej nu telefonen en halv omgang (180°) på samme sted, og tryk på Aflæs.',
  'calibration.flip.capture': 'Aflæs',
  'calibration.flip.done': 'Færdig! Din flade hælder {surface}° — det er udlignet.',
  'calibration.flip.warn.moved':
    'Kalibreringen er gemt, men de to aflæsninger afviger mere end 15°. Flyttede telefonen sig? Tryk på Fortryd, og start forfra.',
  'calibration.pill.notDone': 'MANGLER',
  'calibration.pill.done': 'OK',
  'calibration.pill.none': 'INGEN',

  'targets.normal': 'Normal (i vater)',
  'targets.name.placeholder': 'Navn (f.eks. »Bruseafløb«)',
  'targets.name.label': 'Navn på det nye mål',
  'targets.defaultName': 'Mål {n}',
  'targets.add': 'Gem aktuel hældning som nyt mål',
  'targets.delete': 'Slet {name}',
  'targets.warn.tooSteep':
    'Målet er gemt, men det er stejlere end et normalt mål (over 15°). Var det ikke meningen? Slet det med krydset, og gem igen.',
  'targets.badge': 'Mål: {name}',

  'feedback.intro':
    'Har du fundet et problem eller fået en idé? Udfyld dette, og tryk på knappen — den åbner ' +
    'en færdig rapport på GitHub, som du sender derfra (det kræver en gratis GitHub-konto, ' +
    'som oprettes på et minut).',
  'feedback.category': 'Hvad drejer det sig om?',
  'feedback.cat.bug': 'Fejl',
  'feedback.cat.suggestion': 'Forslag',
  'feedback.cat.other': 'Andet',
  'feedback.title': 'Kort titel',
  'feedback.desc': 'Hvad skete der, eller hvad ønsker du dig?',
  'feedback.submit': 'Åbn rapporten på GitHub',
  'feedback.warn.title': 'Titlen er tom — du kan sende rapporten alligevel.',
  'feedback.warn.desc': 'Beskrivelsen er tom — du kan sende rapporten alligevel.',
  'feedback.warn.both': 'Titel og beskrivelse er tomme — du kan sende rapporten alligevel.',

  'help.screen.h': 'Sådan læser du skærmen',
  'help.screen.lead':
    'Skærmen viser, hvilke hjul der skal løftes, og hvor meget. Trin 2 betyder det andet trin på din klods.',
  'help.screen.t':
    'Grøn ✓: færdig, intet at gøre.\n' +
    'Orange ↑: kør det hjul op på det trin, der vises ved siden af det.\n' +
    'Rød ✕: dine klodser er ikke nok her. Flyt køretøjet.\n' +
    'Grå –: ingen klods ved det hjul. Tallet viser, hvor meget der mangler, hvis du vil lægge noget andet under.\n' +
    'Når boblen hviler i midten, står du i vater.',
  'help.screen.routine':
    'Kør op, vent, til køretøjet står stille, og se igen. Gentag, indtil alle hjul er grønne.',
  'help.what.t':
    'Læg telefonen fladt i køretøjet med toppen mod fronten, samme sted hver gang.\n' +
    'Med en sensorboks er det ligegyldigt, hvordan telefonen ligger.',
  'help.settings.h': 'Dimensionerne',
  'help.measures.h': 'Indtast dimensionerne',
  'help.settings.t':
    'Libell beregner ud fra akselafstand og sporvidde, hvor meget hvert hjul skal hæves.\n' +
    'De står i køretøjets papirer, ellers kan du måle med et målebånd.\n' +
    'Skriv dem i mm, cm eller tommer, alt efter hvad du har valgt under Vis længder i.\n' +
    'På en campingvogn er akselafstanden afstanden fra akslen til næsehjulet.\n' +
    'Med flere køretøjer har hvert sine egne dimensioner, klodser, nulpunkt, mål og sensorboks; vælg et øverst under Køretøj.',
  'help.ramps.t':
    'Skærmen fortæller, hvilket trin på din klods hvert hjul skal op på, så indtast de klodser, du har med.\n' +
    'Vælg en klodsmodel eller et eget sæt, og hvor mange du har. Libell placerer dem, hvor de hjælper mest.\n' +
    'Til en klods uden trin vælger du Trinløs kile og indtaster dens højde. Skærmen viser så »Kør op« og hvor langt.',
  'help.calibration.h': 'Kalibrér og nulstil',
  'help.calibration.t':
    'To ting gør målingerne rigtige: kalibrér telefonen én gang, og nulstil køretøjet én gang.\n' +
    'Kalibrér: læg telefonen på en plan flade, og tryk på Kalibrér nu.\n' +
    'Nulstil: sæt køretøjet i vater med et vaterpas, læg telefonen på dens faste plads, og tryk på Nulstil nu.\n' +
    'Med en sensorboks nulstiller du på boksens side. Den skal ikke kalibreres.\n' +
    'Stadig ikke helt i vater? Finjustér nulpunktet med Venstre op, Højre op, For op eller Bag op under Nulstil køretøjet.\n' +
    'Lampen ⚠ Kalibrér eller ⚠ Nulstil lyser, indtil det er gjort.',
  'help.sensor.h': 'Sensorboks',
  'help.sensor.t':
    'En sensorboks i køretøjet kan måle i stedet for telefonen. Libell virker med disse:\n' +
    '{upright}: står oprejst, vendt en vilkårlig vej.\n' +
    '{flat}: ligger fladt, låget opad, med én pil pegende fremad.\n' +
    'Forbind med sensorikonet øverst til højre. Boksens side fører dig derefter gennem Vælg retning og Nulstil køretøjet.\n' +
    'Det virker i Chrome eller Edge på Android eller en computer. På iPhone skal du bruge browseren Bluefy.\n' +
    'Hvis boksen afviser koden, beder Libell om boksens firecifrede kode.',
  'help.targets.h': 'Mål og lyd',
  'help.targets.t':
    'Gem en hældning, du ønsker, for eksempel mod bruseafløbet, og skift mellem dem.\n' +
    'Campingvogn: gem kuglehøjden, før du kobler fra, så fører »Til kuglehøjden« næsehjulet tilbage dertil.\n' +
    'Med talt vejledning slået til siger appen, hvilket hjul der skal løftes, og hvor meget, så du kan sætte i vater uden at se telefonen.\n' +
    'Knappen midt på den nederste bjælke slår lyden til og fra.',
  'help.trouble.h': 'Hvis noget er galt',
  'help.trouble.t':
    '»Måler…«: køretøjet gynger. Vent, til det står stille.\n' +
    '»Læg telefonen fladt for at måle«: telefonen hælder for meget til at måle.\n' +
    '»Kontakten til boksen er tabt«: tryk på Genforbind, og vælg boksen på listen.\n' +
    '»Venter på hældningssensoren…«: ingen målinger endnu. På iPhone skal du trykke på Start, hver gang du åbner appen; ellers genindlæs.\n' +
    '»Adgang til bevægelsessensorer blev nægtet«: tillad bevægelse og retning for dette websted i browserens indstillinger, og genindlæs.\n' +
    'Stadig forkert? Skriv en rapport under Feedback.',
  'help.open': 'Åbn {name}',
  'help.open.sensor': 'Åbn sensorboksen',
  'help.open.feedback': 'Skriv rapport',

  'main.hint': 'Læg din telefon fladt i køretøjet med overkanten mod fronten.',
  'main.start': 'Start',
  'main.waiting': 'Venter på hældningssensoren…',
  'main.level': 'Dit køretøj står i vater!',
  'main.denied':
    'Adgang til bevægelsessensorer blev nægtet, så Libell kan ikke aflæse hældningen. ' +
    'Tillad adgang til bevægelse og retning for dette websted, og genindlæs.',
  'main.noSensors':
    'Denne enhed har ingen bevægelsessensorer, så Libell kan ikke aflæse hældningen.',
  'main.https':
    'Libell kræver en sikker forbindelse (HTTPS) for at læse hældningssensorerne. ' +
    'Åbn appen via HTTPS, og prøv igen.',

  'diagram.aria': 'Din autocamper set ovenfra med de hjul, der skal løftes',
  'diagram.caravan.aria': 'Din campingvogn set ovenfra med akselhjulene og næsehjulet',
  'diagram.front': 'Front',
  'diagram.step': 'Trin {n}',
  'diagram.driveUp': 'Kør op',
  'diagram.done': 'Klar',
  'diagram.noRamp': 'Ingen klods',
  'diagram.wheel.frontLeft': 'Venstre for',
  'diagram.wheel.frontRight': 'Højre for',
  'diagram.wheel.rearLeft': 'Venstre bag',
  'diagram.wheel.rearRight': 'Højre bag',
  'diagram.notEnough': 'ikke nok',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Skru op',
  'caravan.crankDown': 'Skru ned',
  'caravan.axleLeft': 'Venstre akselhjul',
  'caravan.axleRight': 'Højre akselhjul',
  'caravan.jockeyWheel': 'Næsehjul',
  'help.screen.caravan': 'Campingvogn: næsehjulet viser Skru op eller Skru ned, og hvor meget.',

  'vehicles.title': 'Køretøjer',
  'vehicles.defaultName': 'Mit køretøj',
  'vehicles.numbered': 'Køretøj {n}',
  'vehicles.name.placeholder': 'Navn (f.eks. »Campingvogn«)',
  'vehicles.name.label': 'Køretøjets navn',
  'vehicles.add': 'Nyt køretøj',
  'namePrompt.save': 'Gem',
  'namePrompt.cancel': 'Annullér',
  'choice.rename': 'Omdøb {name}',
  'vehicles.badge': 'Køretøj: {name}',
  'vehicles.delete': 'Fjern {name}',
  'vehicles.remove.confirm': 'Fjern {name} med dets nulpunkt, mål og sensorboks?',
  'vehicles.remove.yes': 'Ja, fjern',
  'vehicles.hint':
    'Dimensioner, klodser, køretøjets nulpunkt, mål og sensorboksen hører til køretøjet. Telefonens kalibrering er fælles.',
  'setup.incoming.addNew': 'Tilføj nyt køretøj',

  'hitch.title': 'Kuglehøjde',
  'hitch.hint':
    'Gem den, mens campingvognen stadig står på kuglen. Før du kobler på igen, viser næsehjulet, hvor langt der skal skrues, så koblingen møder kuglen.',
  'hitch.save': 'Gem kuglehøjde',
  'hitch.go': 'Til kuglehøjden',
  'hitch.done': 'Færdig',
  'hitch.savedNow': 'Kuglehøjde gemt.',
  'hitch.status.none': 'Ingen kuglehøjde gemt endnu.',
  'hitch.status.saved': 'En kuglehøjde er gemt.',
  'hitch.status.active': 'Hovedskærmen viser, hvor langt næsehjulet skal skrues.',
  'hitch.badge': 'Kuglehøjde',
  'hitch.badge.aria': 'Kuglehøjde: tryk for at sætte i vater som normalt igen',
  'hitch.crank.up': 'Skru {amount} op til kuglehøjden',
  'hitch.crank.down': 'Skru {amount} ned til kuglehøjden',
  'hitch.reached': 'Ved kuglehøjden',
  'hitch.offer': 'Gem kuglehøjden først?',
  'hitch.offer.save': 'Gem',
  'hitch.offer.dismiss': 'Ikke nu',

  'zeroTrim.title': 'Finjustér nulpunktet',
  'zeroTrim.hint':
    'Stadig ikke helt i vater? Hvert tryk flytter nulpunktet 0,1°, så appen vil have den side højere.',
  'zeroTrim.left': 'Venstre op',
  'zeroTrim.right': 'Højre op',
  'zeroTrim.front': 'For op',
  'zeroTrim.back': 'Bag op',
  'zeroTrim.side.left': 'Venstre',
  'zeroTrim.side.right': 'Højre',
  'zeroTrim.side.front': 'For',
  'zeroTrim.side.back': 'Bag',
  'zeroTrim.total': 'Finjusteret: {trim}',
  'zeroTrim.none': 'Ikke finjusteret',
  'zeroTrim.reset': 'Ryd finjustering',
  'tilt.frontBack': 'For/bag',
  'tilt.sideSide': 'Side/side',

  'pose.layFlat': 'Læg telefonen fladt for at måle',
  'pose.sensorHint': 'Den måler kun rigtigt, når den ligger fladt med toppen opad.',
  'pose.openSensorPage': 'Vis boksen',
  'pose.sensorExtreme': 'Boksen hælder for meget',
  'pose.sensorUpsideDown': 'Boksen ser ud til at vende på hovedet',
  'pose.sensorNotUpright': 'Boksen ligger ned',
  'pose.sensorHintUpright': 'Den måler kun rigtigt, når den står oprejst.',
  'calibration.external.h': 'Nulstil køretøjet',
  'calibration.external.intro': 'Sæt køretøjet i vater én gang med et vaterpas, og nulstil så.',
  'calibration.external.phoneHidden':
    'Telefonens egen kalibrering er skjult, mens sensorboksen måler. For at kalibrere telefonen skal du først åbne boksen og trykke på »{disconnect}«.',
  'calibration.external.working': 'Nulstiller…',
  'calibration.external.done': '{name} er nulstillet: denne position tæller nu som i vater.',
  'calibration.external.err.notConnected': '{name} er ikke forbundet. Forbind den, og prøv igen.',
  'calibration.external.err.failed':
    'Kunne ikke nulstille {name}. Intet blev ændret. Tjek forbindelsen, og prøv igen.',
  'pose.portrait': 'Drej telefonen til stående — overkanten skal pege fremad',

  'stale.dataUnavailable':
    'Ingen nye sensordata — vejledningen er sat på pause, indtil de kommer igen',

  'sensorFallback.lost': 'Kontakten til boksen er tabt',
  'sensorFallback.autoRetry': 'Prøver igen automatisk…',
  'sensorFallback.connect': 'Forbind boksen',
  'sensorFallback.pick': 'Tryk, og vælg din boks på listen.',
  'sensorFallback.notFound': 'Ingen boks fundet? Tjek, at den er tændt og tæt på.',
  'sensorFallback.retry': 'Genforbind',
  'sensorFallback.usePhone': 'Brug telefonen',
  'mounting.prompt.upright': 'Tryk på den side, som boksens bagside (skruebeslaget) peger mod.',
  'mounting.prompt.arrow':
    'En af boksens pile (på låget eller på printpladen under det) peger fremad. Hvilken side vender mod fronten?',
  'mounting.placement.wide': 'Lang side fremad',
  'mounting.placement.short': 'Kort side fremad',
  'mounting.facing.front': 'Peger fremad',
  'mounting.facing.right': 'Peger mod højre',
  'mounting.facing.rear': 'Peger bagud',
  'mounting.facing.left': 'Peger mod venstre',
  'box.state.connected': 'Forbundet',
  'box.state.lost': 'Kontakt tabt',
  'box.state.password': 'Forkert kode',
  'box.password.label': 'Boksens kode',
  'box.password.retry': 'Prøv igen',
  'box.password.checking': 'Prøver koden…',
  'box.password.invalid': 'Koden er på fire cifre.',
  'box.password.wrong': 'Boksen accepterede heller ikke den kode.',
  'box.password.noAnswer':
    'Boksen svarede ikke. Koden er gemt og prøves, næste gang boksen forbinder.',
  'box.state.notConnected': 'Ikke forbundet',
  'box.state.battery': 'batteri {value}',
  'box.connect': 'Forbind',
  'box.step.position.upright.ok': 'Står oprejst',
  'box.step.position.upright.bad': 'Ligger ned: stil den oprejst, vendt en vilkårlig vej',
  'box.step.position.flat.ok': 'Ligger fladt',
  'box.step.position.flat.bad': 'Hælder for meget: læg den fladt, toppen opad',
  'box.step.position.flat.upsideDown':
    'På hovedet: vend den med låget opad. Producenten fraråder montering på hovedet.',
  'box.step.position.waiting': 'Position: venter på en måling',
  'box.step.direction.todo': 'Vælg retning',
  'box.step.direction.done': 'Retning valgt',
  'box.step.direction.learn': 'Usikker? Lær den ved at løfte fronten',
  'box.step.zero.todo': 'Nulstil køretøjet',
  'box.step.zero.done': 'Nulstillet',
  'box.step.zero.hint': 'Sæt køretøjet i vater med et vaterpas, og nulstil så.',
  'box.forgetDirection': 'Glem retningen',
  'onboard.boxPosition.h': 'Boksens position',
  'onboard.boxPosition.later':
    'Retning og nulpunkt indstilles, første gang du parkerer. Boksens side guider dig, og lampen ⚠ Nulstil minder dig om det, indtil det er gjort.',
  'onboard.boxPosition.notConnected':
    'Der er ikke forbundet nogen boks endnu, så dens position kan ikke vises. Tryk på »{next}«, og forbind senere med sensorikonet øverst til højre.',
  'sensorList.title': 'Sensorboks',
  'sensorList.phone': 'Telefonens egen sensor bruges, når ingen boks er forbundet.',
  'box.step.zero.again': 'Nulstil igen',
};
