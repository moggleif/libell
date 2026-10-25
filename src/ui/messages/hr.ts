import type { Messages } from './en';

/** Croatian. */
export const hr: Messages = {
  'topbar.install': 'Instaliraj',
  'topbar.share': 'Podijeli Libell',
  'bottombar.settings': 'Postavke',
  'bottombar.sound.mute': 'Isključi zvuk',
  'bottombar.sound.unmute': 'Uključi zvuk',
  'bottombar.help': 'Pomoć',
  'bottombar.label': 'Radnje',
  'share.text': 'Izravnajte kamper ili kamp-prikolicu pomoću telefona.',
  'share.copied': 'Poveznica kopirana!',
  'update.check': 'Provjeri ima li nove verzije',
  'update.checking': 'Provjeravam ažuriranja…',
  'update.updating': 'Ažuriram na novu verziju…',
  'update.latest': 'Imate najnoviju verziju',
  'update.offline': 'Nema veze, ne mogu provjeriti ažuriranja',
  'update.unsupported': 'Ažuriranja ovdje nisu dostupna',
  'install.hint': 'Dodirnite „Dijeli”, a zatim „Dodaj na početni zaslon”.',
  'install.row': 'Instalirajte Libell kao aplikaciju na početni zaslon.',
  'install.close': 'Sakrij',
  'share.vehicle.text': 'Postavke mog vozila za Libell — mjere i rampe.',
  'settings.shareVehicle': 'Pošalji na drugi telefon',
  'setup.incoming.h': 'Primljene postavke vozila',
  'setup.incoming.intro': 'Član obitelji podijelio je s vama ove mjere vozila:',
  'setup.incoming.reminder':
    'Kalibracija nije uključena — ovaj telefon i dalje morate kalibrirati zasebno.',
  'setup.incoming.apply': 'Zamijeni trenutno vozilo',
  'setup.incoming.dismiss': 'Ne sada',
  'setup.incoming.invalid':
    'Poveznicu s postavkama vozila nije moguće pročitati — ništa nije promijenjeno.',

  'lamp.setup': '⚠ Mjere',
  'lamp.setup.title': 'Mjere vozila nikad nisu spremljene — dodirnite za otvaranje postavki',
  'lamp.calibrate': '⚠ Kalibriraj',
  'lamp.zero': '⚠ Nuliraj',
  'lamp.calibrate.title': 'Telefon nije kalibriran — dodirnite za otvaranje „Kalibriraj i nuliraj”',
  'lamp.zero.title': 'Vozilo nije nulirano — dodirnite za otvaranje „Kalibriraj i nuliraj”',
  'lamp.calibrate.title.sensor': 'Kutija nije nulirana — dodirnite za otvaranje kutije',

  'sensorStatus.connected': 'Senzorska kutija povezana',
  'sensorStatus.disconnected': 'Senzorska kutija — izgubljena veza, dodirnite za detalje',
  'sensorStatus.stale': 'Senzorska kutija — nema novih podataka, dodirnite za detalje',
  'sensorStatus.idle': 'Senzorska kutija — dodirnite za povezivanje',
  'sensorStatus.idle.guide': 'Senzorska kutija — dodirnite za vodič za iPhone',

  'menu.title': 'Izbornik',
  'menu.close': 'Zatvori izbornik',
  'menu.settings': 'Postavke',
  'menu.calibration': 'Kalibriraj i nuliraj',
  'menu.targets': 'Ciljevi',
  'menu.feedback': 'Komentari',
  'menu.help': 'Pomoć',
  'menu.intro': 'Prikaži uvod',
  'menu.about': 'O Libellu',
  'menu.about.tab': 'Info',
  'menu.sensorSource': 'Senzorska kutija',

  'sensorSource.connect': 'Poveži senzor {name}',
  'sensorSource.disconnect': 'Prekini vezu',
  'sensorSource.status.connecting': 'Povezujem…',
  'sensorSource.err.unsupported': 'Ovaj preglednik ne podržava Web Bluetooth.',
  'sensorSource.unsupported.browser':
    'Za povezivanje senzorske kutije otvorite Libell u Chromeu ili Edgeu na Androidu ili na računalu. Vlastiti senzor telefona ovdje radi kao i obično.',
  'sensorSource.err.password':
    'Kutija {name} nije prihvatila svoju lozinku. Upišite četveroznamenkasti kod kutije ispod i dodirnite „Pokušaj ponovno”. Tvornički kod je 0000. Ako ne znate kod, promijenite ga u aplikaciji Xparkle.',
  'sensorSource.err.failed': 'Povezivanje sa senzorom {name} nije uspjelo.',

  'sensorSource.ios.intro':
    'Safari se ne može izravno povezati s Bluetooth senzorima, ali postoji zaobilazno rješenje:',
  'sensorSource.ios.step1': 'Instalirajte „Bluefy – Web Bluetooth Browser” iz App Storea.',
  'sensorSource.ios.step2': 'Otvorite Bluefy i dopustite pristup Bluetoothu.',
  'sensorSource.ios.step3': 'U Bluefyju otvorite ovu istu adresu Libella.',
  'sensorSource.ios.step4': 'Ovdje ponovno otvorite „Senzorska kutija” — radi kao na Androidu.',
  'sensorSource.ios.note':
    'Bluefy je aplikacija treće strane, a ne Libellova — ponovno povezivanje pri otvaranju ' +
    'aplikacije možda će ondje tražiti jedan ručni dodir umjesto da se dogodi samo od sebe.',
  'sensorSource.ios.bluefyLink': 'Pronađi Bluefy u App Storeu',

  'sensorSource.detail.temperature': 'Temperatura: {value}',
  'sensorSource.detail.notAvailable': 'Još nije dostupno',
  'sensorSource.lowBattery':
    '⚠ Slaba baterija ({value}) — uskoro zamijenite bateriju senzorske kutije.',

  'sensorSource.install.now': 'Nuliraj sada',
  'sensorSource.install.clear': 'Zaboravi nulu',
  'sensorSource.install.status': 'Nula: naprijed/natrag {pitch}, bočno {roll}.',
  'sensorSource.install.status.none': 'Još nije nulirano — kutija mjeri onako kako stoji.',

  'sensorSource.learn.h': 'Nauči položaj montaže',
  'sensorSource.learn.intro':
    'Libell uči smjer iz dvaju podizanja: najprije prednjeg dijela, zatim desne strane.',
  'sensorSource.learn.start': 'Nauči montažu',
  'sensorSource.learn.step.front':
    'Podignite prednji dio vozila nekoliko centimetara, zatim pritisnite gumb.',
  'sensorSource.learn.capture.front': 'Prednji dio podignut',
  'sensorSource.learn.step.right':
    'Ponovno spustite prednji dio. Sada podignite desnu stranu nekoliko centimetara, zatim pritisnite gumb.',
  'sensorSource.learn.capture.right': 'Desna strana podignuta',
  'sensorSource.learn.cancel': 'Odustani',
  'sensorSource.learn.status.learned': 'Montaža naučena.',
  'sensorSource.learn.status.none': 'Montaža nije naučena — koriste se smjerovi same kutije.',
  'sensorSource.learn.done':
    'Gotovo! Provjerite: podignite prednji dio i Libell bi trebao pokazati na stražnje kotače.',
  'sensorSource.learn.err.tooSmall':
    'Vozilo se jedva pomaknulo. Podignite ga malo više i pokušajte ponovno.',
  'sensorSource.learn.err.ambiguous':
    'Oba su se smjera pomaknula otprilike jednako. Podignite samo prednji dio, zatim samo desnu stranu, i pokušajte ponovno.',
  'sensorSource.learn.err.arrow':
    'Nijedna strelica ne pokazuje naprijed. Okrenite kutiju tako da jedna od njezinih strelica pokazuje naprijed, zatim pokušajte ponovno.',
  'sensorSource.learn.err.mirrored':
    'Kutija je naizgled naopako ili je podignuta pogrešna strana. Provjerite, zatim pokušajte ponovno.',
  'sensorSource.learn.err.sameAxis':
    'Oba su podizanja nagnula vozilo na istu stranu. Najprije podignite prednji dio, zatim desnu stranu, i pokušajte ponovno.',

  'sensorStatus.title': 'Senzor {name}',
  'sensorStatus.reading': 'Trenutačni nagib: {value}',
  'sensorStatus.debug': 'Informacije za otklanjanje grešaka',
  'sensorStatus.debug.intro':
    'Sirove vrijednosti izravno iz kutije — za otklanjanje grešaka ako nešto ne radi.',
  'sensorStatus.debug.state': 'Stanje veze: {value}',
  'sensorStatus.debug.deviceId': 'ID uređaja: {value}',
  'sensorStatus.debug.lastSample': 'Posljednje očitanje: {value}',
  'sensorStatus.debug.age': 'prije {s} s',
  'sensorStatus.debug.rawAccel': 'Sirovi akcelerometar (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Generacija firmvera: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Sirovi bajtovi stanja: {value}',
  'sensorStatus.debug.versionBytes': 'Serijski broj i firmver (sirovo): {value}',
  'sensorStatus.debug.copy': 'Kopiraj podatke',
  'sensorStatus.debug.copied': 'Informacije za otklanjanje grešaka kopirane!',
  'sensorStatus.debug.copy.failed': 'Automatsko kopiranje nije uspjelo.',
  'sensorStatus.advanced': 'Napredno',
  'sensorStatus.silentReconnect.intro':
    'Ovaj se preglednik još ne može sam ponovno povezati s kutijom, pa je nakon ponovnog pokretanja morate opet odabrati na popisu. U Chromeu to možete sami uključiti.',
  'sensorStatus.silentReconnect.steps':
    'Otvorite {address}, potražite „web bluetooth”, postavite „Use the new permissions backend for Web Bluetooth” na Enabled i dodirnite Relaunch. Zatim jednom povežite kutiju.',
  'sensorStatus.silentReconnect.copy': 'Kopiraj {address}',
  'sensorStatus.silentReconnect.copied': 'Kopirano — zalijepite to u adresnu traku Chromea.',
  'sensorStatus.debug.connectDelay.intro':
    'Eksperimentalno: isprobajte samo ako je veza s kutijom nepouzdana. Dodaje stalnu stanku nakon povezivanja, prije nego što aplikacija počne čitati podatke.',
  'sensorStatus.debug.connectDelay.enable': 'Uključi odgodu povezivanja',
  'sensorStatus.debug.connectDelay.ms': 'Odgoda (ms)',

  'about.text':
    'Libell vam pomaže izravnati kamper ili kamp-prikolicu telefonom koji ' +
    'već imate, bez nagađanja.',
  'about.version': 'Verzija {v}',
  'about.offline':
    'Radi potpuno izvan mreže — mreža se koristi samo za preuzimanje ažuriranja same aplikacije.',
  'about.privacy':
    'Vaše postavke ostaju na telefonu — bez računa i bez praćenja. Libell šalje samo anonimne brojke o tome kako se aplikacija koristi, a to možete isključiti.',
  'about.source': 'Libell je besplatan i otvorenog koda (licenca MIT).',
  'about.source.link': 'Izvorni kod na GitHubu',
  'menu.privacy': 'Privatnost',
  'menu.privacy.tab': 'Podaci',
  'privacy.stored.h': 'Spremljeno na ovom telefonu',
  'privacy.stored.empty': 'Ništa nije spremljeno.',
  'privacy.raw': 'Prikaži sirove podatke',
  'privacy.raw.hint': 'Točno kako je spremljeno. Lozinka kutije je skrivena.',
  'privacy.resetSettings': 'Vrati samo postavke',
  'privacy.deleteAll': 'Izbriši sve podatke Libella',
  'privacy.deleteAll.confirm':
    'Izbrisati sve što je Libell spremio na ovaj telefon? Vozila, mjere i kalibracija nestaju, a Libell kreće ispočetka kao prvi put.',
  'privacy.deleteAll.yes': 'Da, izbriši sve',
  'privacy.deleteAll.cancel': 'Odustani',
  'stored.vehicle': 'Vozilo',
  'stored.vehicle.detail': '{name}, međuosovinski razmak {wheelbase}',
  'stored.settings': 'Postavke',
  'stored.settings.detail': 'Mjere, rampe, jedinica, izgled i zvuk',
  'stored.password': 'Lozinka senzorske kutije',
  'stored.language': 'Jezik',
  'stored.phoneCalibration': 'Kalibracija telefona',
  'stored.zero': 'Nula vozila',
  'stored.zeroTrim': 'Fino podešavanje nule',
  'stored.targets': 'Ciljevi',
  'stored.targets.active': '{name} (odabran)',
  'stored.hitch': 'Visina spajanja',
  'stored.rememberedBox': 'Zapamćena senzorska kutija',
  'stored.notes': 'Vlastite bilješke aplikacije',
  'stored.notes.detail': 'Sitne oznake: {n}, npr. je li uvod prikazan',
  'stored.phone': 'Telefon',
  'stored.saved': 'spremljeno',
  'stored.counting.off': 'Isključeno',
  'stored.counting.on': 'Uključeno',
  'stored.savedOn': 'spremljeno {date}',

  'intro.h': 'Dobro došli u Libell',
  'intro.how':
    'Položite telefon ravno u vozilo i Libell će pokazati koje kotače podići i za koliko.',
  'intro.start': 'Započnite',
  'intro.later': 'Prvo razgledajte',
  'onboard.source.sensorIcon':
    'Senzorsku kutiju možete povezati u bilo kojem trenutku ikonom senzora gore desno.',
  'counting.title': 'Anonimno brojanje',
  'counting.intro': 'Libell može anonimno brojati korištenje kako bismo znali što poboljšati.',
  'counting.sent.h': 'Što se broji',
  'counting.sent':
    'Da je aplikacija otvorena, koje se funkcije koriste, koji model senzora mjeri (telefon ili model poput {boxes}), verzija aplikacije i jezik odabran u Libellu.',
  'counting.notSent.h': 'Što se nikada ne sprema',
  'counting.notSent':
    'Vaša IP adresa, zemlja, uređaj, zaslon, operacijski sustav ili preglednik, mjere vozila, vaše postavke ni bilo što drugo o vama. Na telefon se sprema samo vaš izbor.',
  'counting.gpc': 'Ako vaš preglednik traži od web-mjesta da vas ne prate, Libell ne broji ništa.',
  'counting.later': 'Svoj izbor možete promijeniti bilo kada u {help} › {tab}.',
  'counting.toggle': 'Anonimno brojanje mog korištenja',
  'counting.dashboard': 'Pogledajte statistiku',
  'counting.ask': 'Želite li pomoći da Libell bude bolji?',
  'counting.yes': 'Da, brojati anonimno',
  'counting.no': 'Ne, hvala',
  'onboard.sound.h': 'Zvuk',
  'onboard.source.h': 'Čime želite mjeriti?',
  'onboard.source.intro':
    'Odaberite iz kojeg senzora Libell čita nagib — većina ljudi jednostavno koristi telefon.',
  'onboard.source.phone': 'Ovaj telefon',
  'onboard.source.externalActive':
    'Senzorska kutija je sada aktivna. Odaberete li ovaj telefon, kalibracija telefona se preskače. Za kalibraciju telefona otvorite kutiju ikonom senzora gore desno i najprije dodirnite „{disconnect}”.',
  'onboard.vehicle.h': 'Što izravnavate?',
  'onboard.vehicle.intro': 'Odaberite svoje vozilo — ostatak vodiča prilagodit će se njemu.',
  'onboard.step1.h': 'Postavite telefon ovako',
  'onboard.next': 'Dalje',
  'onboard.back': 'Natrag',
  'onboard.close': 'Zatvori uvod',
  'onboard.done': 'Gotovo',
  'onboard.skipStep': 'Preskoči',
  'onboard.note.measurements':
    'Preskočite li, koriste se zadane mjere; {lamp} svijetli dok ne spremite svoje.',
  'onboard.note.ramps':
    'Preskočite li, koriste se zadane rampe. Svoje možete odabrati kasnije u postavkama.',
  'onboard.note.calibrate':
    'Nemate sada ravnu površinu? Dodirnite {next}; {lamp} podsjeća vas dok to ne obavite.',
  'onboard.note.connect':
    'Nemate kutiju pri ruci? Dodirnite {next} i povežite je kasnije ikonom senzora gore desno.',
  'onboard.zeroLater':
    'Vozilo nulirate prvi put kad parkirate na ravnom terenu. {lamp} podsjeća vas dok to ne obavite.',
  'onboard.legend.ok': 'Zeleno ✓ — taj je kotač vodoravan.',
  'onboard.legend.up': 'Narančasto ↑ — navezite taj kotač na prikazanu stepenicu.',
  'onboard.legend.no':
    'Crveno ✕ — nijedna stepenica nije dovoljna; premjestite se na ravnije mjesto.',
  'onboard.legend.dim': 'Sivo – — pod tim kotačem nema rampe; broj pokazuje koliko nedostaje.',
  'settings.wheelbase': 'Međuosovinski razmak',
  'settings.trackFront': 'Trag kotača sprijeda',
  'settings.trackRear': 'Trag kotača straga',
  'settings.tolerance': 'Tolerancija',
  'settings.stability': 'Stabilnost',
  'settings.dwellRest': 'Odgoda odziva (ms)',
  'settings.dwellMotion': 'Odgoda odziva pri podešavanju (ms)',
  'settings.dwell.hint': 'Koliko dugo očitanje mora potrajati prije nego što se broj promijeni.',
  'settings.vehicle': 'Vozilo',
  'vehicle.motorhome': 'Kamper',
  'vehicle.caravan': 'Kamp-prikolica',
  'settings.axleToJockey': 'Osovina do potpornog kotača',
  'settings.rearAxle': 'Stražnja osovina',
  'settings.axle': 'Osovina',
  'axle.single': 'Jednostruka',
  'axle.boggie': 'Dvostruka (tandem)',
  'settings.track': 'Trag kotača',
  'settings.measureHint': 'Nalaze se u prometnoj dozvoli. Nekoliko cm razlike nije važno.',
  'settings.measureHint.caravan':
    'Izmjerite od osovine do potpornog kotača. Nekoliko cm razlike nije važno.',
  'settings.measureHint.boggie': 'Kod dvostruke osovine mjerite do sredine para osovina.',
  'settings.steps': 'Visine stepenica rampe',
  'settings.steps.add': 'Dodaj',
  'settings.steps.new': 'Visina nove stepenice ({unit})',
  'settings.steps.remove': 'Ukloni {value}',
  'settings.ramp': 'Gotova rampa',
  'settings.ramp.custom': 'Vlastiti set',
  'settings.ramp.stepless': 'Klin bez stepenica',
  'settings.ramp.steplessModel': '{name} (bez stepenica, maks. {max} mm)',
  'settings.stepless.max': 'Klin bez stepenica, maks. visina',
  'settings.stepless.maxHeading': 'Maks. visina',
  'settings.stepless.set': 'Spremi',
  'settings.stepless.new': 'Maks. visina ({unit})',
  'settings.rampCount': 'Broj rampi',
  'settings.drain': 'Strana odvoda',
  'settings.rampHint': 'Aplikacija bira gdje vaše rampe najviše pomažu.',
  'settings.drainHint': 'Unutar tolerancije ta strana ostaje najniža kako bi voda otjecala.',
  'settings.section.vehicle': 'Vozilo i mjere',
  'settings.section.ramps': 'Rampe',
  'settings.general': 'Općenito',
  'settings.language': 'Jezik',
  'settings.language.auto': 'Automatski (jezik uređaja)',
  'settings.tolerance.hint': 'Koliko blizu vodoravnog se računa kao vodoravno.',
  'settings.stability.hint': 'Ublažava sitno podrhtavanje senzora kako brojevi ne bi treperili.',
  'drain.none': 'Nema / nije važno',
  'drain.left': 'Lijevo, sredina',
  'drain.right': 'Desno, sredina',
  'drain.front': 'Sprijeda, sredina',
  'drain.rear': 'Straga, sredina',
  'drain.frontLeft': 'Sprijeda lijevo',
  'drain.frontRight': 'Sprijeda desno',
  'drain.rearLeft': 'Straga lijevo',
  'drain.rearRight': 'Straga desno',
  'settings.unit': 'Prikaži duljine u',
  'settings.unitInches': 'palci (in)',
  'settings.theme': 'Tema',
  'theme.system': 'Prati telefon',
  'theme.light': 'Svijetla',
  'theme.dark': 'Tamna',
  'settings.appearance': 'Izgled',
  'appearance.classic': 'Klasični',
  'appearance.modern': 'Moderni',
  'appearance.glossy': 'Sjajni',
  'settings.sound': 'Zvono kad je vodoravno',
  'settings.soundGuidance': 'Neprekidno zvučno vođenje',
  'settings.soundGuidance.help': 'Zvučni signal postaje brži i viši što ste bliže vodoravnom.',
  'settings.soundSpeech': 'Govorno vođenje',
  'settings.soundSpeech.help':
    'Kad vozilo miruje, aplikacija izgovara koji kotač i koliko, na primjer „Straga lijevo, Stepenica 2”.',
  'settings.soundSpeech.unavailable':
    'Govorno vođenje ne radi na ovom telefonu: nema hrvatskog glasa koji radi izvan mreže. Tonovi rade kao i obično.',
  'speech.level': 'Vodoravno',
  'speech.inches': '{n} palca',
  'speech.inchOne': 'jedan palac',
  'speech.inchOneAnd': 'jedan i {fraction} palca',
  'speech.inchesAnd': '{n} i {fraction} palca',
  'speech.inchFraction': '{fraction} palca',
  'speech.eighth1': 'jedna osmina',
  'speech.eighth2': 'četvrt',
  'speech.eighth3': 'tri osmine',
  'speech.eighth4': 'pol',
  'speech.eighth5': 'pet osmina',
  'speech.eighth6': 'tri četvrtine',
  'speech.eighth7': 'sedam osmina',
  'settings.undo': 'Poništi',
  'settings.saved': 'Spremljeno',
  'settings.more': 'Više',
  'settings.fineTuning': 'Fino podešavanje',
  'settings.resetAll': 'Vrati sve postavke',
  'settings.err.positive': 'Unesite broj veći od 0. I dalje vrijedi prethodna vrijednost.',
  'settings.err.notNegative': 'Unesite 0 ili više. I dalje vrijedi prethodna vrijednost.',
  'settings.err.range': 'Unesite broj od {min} do {max}. I dalje vrijedi prethodna vrijednost.',

  'settings.tab.vehicle': 'Vozilo',
  'settings.tab.ramps': 'Rampe',
  'settings.tab.level': 'Razina',
  'settings.klossar.brandAll': 'Sve',
  'settings.klossar.changeRamp': 'Promijeni rampu',
  'settings.rampCountHint': 'Aplikacija ih postavlja gdje najviše pomažu.',
  'settings.klossar.selected': 'Odabrano',
  'settings.klossar.stepsHeading': 'Visine stepenica',

  'status.measuring': 'Mjerim…',
  'status.almost': 'Gotovo vodoravno — preostaje {left}',
  'status.cantLevel.close': 'Vaše rampe ovdje gotovo dosežu, ali nedovoljno — premjestite vozilo',
  'status.cantLevel.far': 'Vaše rampe ovdje nisu ni približno dovoljne — premjestite vozilo',
  'adjustable.before': 'Namjesti rampe na prikazanu stepenicu, zatim se navezi na njih.',
  'adjustable.after': 'Još nije vodoravno. Odvezi se s rampi i aplikacija će ponovno izmjeriti.',

  'calibration.intro':
    'Položite telefon na površinu za koju znate da je vodoravna, zatim dodirnite „Kalibriraj sada”. ' +
    'Trenutačni nagib postaje nulta točka.',
  'calibration.status': 'Kalibrirano: naprijed/natrag {pitch}, bočno {roll}.',
  'calibration.status.none': 'Nije kalibrirano — koristi se sirovi senzor.',
  'calibration.now': 'Kalibriraj sada',
  'calibration.step.phone.done': 'Telefon kalibriran',
  'calibration.step.phone.hint': 'Položite telefon na nešto ravno.',
  'calibration.step.flipLink': 'Nema ravnine? Okrenite telefon',
  'calibration.step.vehicle.done': 'Nulirano',
  'calibration.step.vehicle.hint':
    'Izravnajte vozilo libelom i stavite telefon na njegovo uobičajeno mjesto.',
  'calibration.step.vehicle.now': 'Nuliraj sada',
  'calibration.clear': 'Obriši kalibraciju',
  'calibration.err.notRunning':
    'Senzor nagiba još ne radi — najprije dodirnite „Pokreni” na glavnom zaslonu.',
  'calibration.warn.notFlat':
    'Kalibracija je spremljena, ali površina ne izgleda ravno (više od 15°), pa je vjerojatno pogrešna. Niste to htjeli? Dodirnite „Poništi”, položite telefon na ravnu površinu i ponovno kalibrirajte.',
  'calibration.undo': 'Poništi',
  'calibration.sensor.h': 'Kalibriraj telefon',
  'calibration.vehicle.h': 'Nuliraj vozilo',
  'calibration.vehicle.intro':
    'Kalibracija se odnosi na telefon, a ne na mjesto na kojem leži. Ako je stol malo nagnut, aplikacija pokazuje taj nagib. Jednom izravnajte vozilo libelom, stavite telefon na njegovo uobičajeno mjesto i nulirajte.',
  'calibration.vehicle.now': 'Nuliraj sada',
  'calibration.vehicle.clear': 'Zaboravi nulu',
  'calibration.vehicle.status': 'Nula vozila: naprijed/natrag {pitch}, bočno {roll}.',
  'calibration.vehicle.status.none': 'Nema nule vozila — mjesto telefona računa se kao ravno.',
  'calibration.vehicle.warn.notFlat':
    'Nula je spremljena, ali ovo ne izgleda vodoravno (više od 15°). Vozilo nije bilo vodoravno? Dodirnite „Poništi”, izravnajte vozilo i ponovno nulirajte.',
  'calibration.age.today': '(danas)',
  'calibration.age.days': '(prije {n} d.)',
  'calibration.check': 'Provjeri',
  'calibration.check.good': 'Još je dobro — odstupanje {off}°.',
  'calibration.check.off': 'Odstupanje {off}° — razmislite o ponovnoj kalibraciji.',
  'calibration.vehicle.check.off': 'Odstupanje {off}° — razmislite o ponovnom nuliranju.',
  'calibration.check.none':
    'Još nije kalibrirano, pa nema što provjeriti. Položite telefon na vodoravnu površinu i dodirnite „{now}”.',
  'calibration.vehicle.check.none':
    'Još nema nule, pa nema što provjeriti. Izravnajte vozilo libelom i dodirnite „{now}”.',
  'calibration.flip.intro':
    'Nemate vodoravnu površinu? Upotrijebite kalibraciju okretanjem: spustite telefon bilo gdje ' +
    'gdje je razmjerno ravno, snimite, okrenite telefon za pola kruga (180°) na istom ' +
    'mjestu i ponovno snimite — nagib površine sam se poništava.',
  'calibration.flip.start': 'Kalibriraj okretanjem',
  'calibration.flip.rotate':
    'Sada okrenite telefon za pola kruga (180°) na istom mjestu, zatim dodirnite „Snimi”.',
  'calibration.flip.capture': 'Snimi',
  'calibration.flip.done': 'Gotovo! Vaša je površina nagnuta {surface}° — to je poništeno.',
  'calibration.flip.warn.moved':
    'Kalibracija je spremljena, ali se dva snimanja razlikuju za više od 15°. Je li se telefon pomaknuo? Dodirnite „Poništi” i počnite ispočetka.',
  'calibration.pill.notDone': 'ČEKA',
  'calibration.pill.done': 'GOTOVO',
  'calibration.pill.none': 'NEMA',

  'targets.normal': 'Normalno (vodoravno)',
  'targets.name.placeholder': 'Naziv (npr. „Odvod tuša”)',
  'targets.name.label': 'Naziv novog cilja',
  'targets.defaultName': 'Cilj {n}',
  'targets.add': 'Spremi nagib kao novi cilj',
  'targets.delete': 'Izbriši {name}',
  'targets.warn.tooSteep':
    'Cilj je spremljen, ali je strmiji od uobičajenog cilja (više od 15°). Niste to htjeli? Izbrišite ga križićem i spremite ponovno.',
  'targets.badge': 'Cilj: {name}',

  'feedback.intro':
    'Pronašli ste problem ili imate ideju? Ispunite ovo i dodirnite gumb — otvara ' +
    'se pripremljena prijava na GitHubu koju ondje objavite (potreban je besplatan ' +
    'GitHub račun, izrađen za minutu).',
  'feedback.category': 'O čemu je riječ?',
  'feedback.cat.bug': 'Greška',
  'feedback.cat.suggestion': 'Prijedlog',
  'feedback.cat.other': 'Ostalo',
  'feedback.title': 'Kratki naslov',
  'feedback.desc': 'Što se dogodilo ili što biste željeli?',
  'feedback.submit': 'Otvori prijavu na GitHubu',
  'feedback.warn.title': 'Naslov je prazan — prijavu svejedno možete poslati.',
  'feedback.warn.desc': 'Opis je prazan — prijavu svejedno možete poslati.',
  'feedback.warn.both': 'Naslov i opis su prazni — prijavu svejedno možete poslati.',

  'help.screen.h': 'Čitanje zaslona',
  'help.screen.lead':
    'Zaslon pokazuje koje kotače treba podići i za koliko. „Stepenica 2” znači drugu stepenicu vaše rampe.',
  'help.screen.t':
    'Zeleno ✓: gotovo, ništa ne treba raditi.\n' +
    'Narančasto ↑: navezite taj kotač na stepenicu prikazanu pokraj njega.\n' +
    'Crveno ✕: vaše rampe ovdje nisu dovoljne. Premjestite vozilo.\n' +
    'Sivo –: pod tim kotačem nema rampe. Broj pokazuje koliko nedostaje, ako želite podmetnuti nešto drugo.\n' +
    'Kad mjehurić miruje u sredini, vozilo je vodoravno.',
  'help.screen.routine':
    'Navezite, pričekajte da se vozilo umiri i pogledajte ponovno. Ponavljajte dok svi kotači ne budu zeleni.',
  'help.what.t':
    'Položite telefon ravno u vozilo, gornjim rubom prema naprijed, svaki put na isto mjesto.\n' +
    'Sa senzorskom kutijom nije važno kako telefon leži.',
  'help.settings.h': 'Mjere',
  'help.measures.h': 'Unesite mjere',
  'help.settings.t':
    'Libell iz međuosovinskog razmaka i traga kotača izračunava koliko se svaki kotač mora podići.\n' +
    'Nalaze se u dokumentima vozila, ili ih izmjerite metrom.\n' +
    'Upišite ih u mm, cm ili palcima, kako ste odabrali pod „Prikaži duljine u”.\n' +
    'Kod kamp-prikolice međuosovinski razmak je udaljenost od osovine do potpornog kotača.\n' +
    'Ako imate više vozila, svako ima svoje mjere, rampe, nulu vozila, ciljeve i senzorsku kutiju; odaberite jedno na vrhu kartice „Vozilo”.',
  'help.ramps.t':
    'Zaslon vam pokazuje na koju stepenicu rampe ide svaki kotač, pa unesite rampe koje vozite sa sobom.\n' +
    'Odaberite gotovu rampu ili vlastiti set te koliko ih imate. Libell ih postavlja gdje najviše pomažu.\n' +
    'Za klin bez stepenica odaberite „Klin bez stepenica” i unesite njegovu visinu. Kartica kotača tada kaže „Navezi” i za koliko.',
  'help.calibration.h': 'Kalibriraj i nuliraj',
  'help.calibration.t':
    'Dva koraka čine očitanja točnima: jednom kalibrirajte telefon i jednom nulirajte vozilo.\n' +
    'Kalibracija: položite telefon na ravnu površinu i dodirnite „Kalibriraj sada”.\n' +
    'Nuliranje: izravnajte vozilo libelom, stavite telefon na njegovo uobičajeno mjesto i dodirnite „Nuliraj sada”.\n' +
    'Sa senzorskom kutijom nulirate na stranici kutije. Ona ne treba kalibraciju.\n' +
    'Još nije sasvim vodoravno? Fino podesite nulu gumbima „Lijevo više”, „Desno više”, „Sprijeda više” ili „Straga više” u „Nuliraj vozilo”.\n' +
    'Lampica „⚠ Kalibriraj” ili „⚠ Nuliraj” svijetli dok to ne obavite.',
  'help.sensor.h': 'Senzorska kutija',
  'help.sensor.t':
    'Senzorska kutija u vozilu može mjeriti umjesto telefona. Libell radi s ovima:\n' +
    '{upright}: stoji uspravno, okrenuta na bilo koju stranu.\n' +
    '{flat}: leži ravno, poklopcem prema gore, s jednom strelicom usmjerenom naprijed.\n' +
    'Povežite je ikonom senzora gore desno. Stranica kutije zatim vas vodi kroz „Odaberi smjer” i „Nuliraj vozilo”.\n' +
    'Radi u Chromeu ili Edgeu na Androidu ili računalu. Na iPhoneu vam treba preglednik Bluefy.\n' +
    'Ako kutija odbije kod, Libell traži četveroznamenkasti kod kutije.',
  'help.targets.h': 'Ciljevi i zvuk',
  'help.targets.t':
    'Spremite željeni nagib, na primjer prema odvodu tuša, i prebacujte se između ciljeva.\n' +
    'Kamp-prikolica: spremite visinu spajanja prije nego što je otkvačite, a „Natrag na visinu spajanja” vodi potporni kotač natrag do nje.\n' +
    'Uz uključeno govorno vođenje aplikacija izgovara koji kotač podići i koliko, pa možete izravnavati bez gledanja u telefon.\n' +
    'Gumb u sredini donje trake uključuje i isključuje zvuk.',
  'help.trouble.h': 'Ako nešto nije u redu',
  'help.trouble.t':
    '„Mjerim…”: vozilo se ljulja. Pričekajte da se umiri.\n' +
    '„Položite telefon ravno za mjerenje”: telefon je previše nagnut za mjerenje.\n' +
    '„Izgubljena veza s kutijom”: dodirnite „Poveži ponovno” i odaberite kutiju na popisu.\n' +
    '„Čekam senzor nagiba…”: još nema očitanja. Na iPhoneu dodirnite „Pokreni” svaki put kad otvorite aplikaciju; inače ponovno učitajte stranicu.\n' +
    '„Pristup pokretu je odbijen”: dopustite pokret i orijentaciju za ovu stranicu u postavkama preglednika i ponovno je učitajte.\n' +
    'I dalje ne radi? Napišite prijavu pod „Komentari”.',
  'help.open': 'Otvori {name}',
  'help.open.sensor': 'Otvori senzorsku kutiju',
  'help.open.feedback': 'Napiši prijavu',

  'main.hint': 'Položite telefon ravno u vozilo, gornjim rubom prema naprijed.',
  'main.start': 'Pokreni',
  'main.waiting': 'Čekam senzor nagiba…',
  'main.level': 'Vaše vozilo je vodoravno!',
  'main.denied':
    'Pristup pokretu je odbijen, pa Libell ne može očitati nagib. ' +
    'Dopustite pristup pokretu i orijentaciji za ovu stranicu i ponovno je učitajte.',
  'main.noSensors': 'Ovaj uređaj nema dostupne senzore pokreta, pa Libell ne može očitati nagib.',
  'main.https':
    'Libell treba sigurnu vezu (HTTPS) za čitanje senzora nagiba. ' +
    'Otvorite aplikaciju preko HTTPS-a i pokušajte ponovno.',

  'diagram.aria': 'Pogled odozgo na vaš kamper koji pokazuje koje kotače treba podići',
  'diagram.caravan.aria':
    'Pogled odozgo na vašu kamp-prikolicu s kotačima osovine i potpornim kotačem',
  'diagram.front': 'Sprijeda',
  'diagram.step': 'Stepenica {n}',
  'diagram.driveUp': 'Navezi',
  'diagram.done': 'Gotovo',
  'diagram.noRamp': 'Bez rampe',
  'diagram.wheel.frontLeft': 'Sprijeda lijevo',
  'diagram.wheel.frontRight': 'Sprijeda desno',
  'diagram.wheel.rearLeft': 'Straga lijevo',
  'diagram.wheel.rearRight': 'Straga desno',
  'diagram.notEnough': 'nedovoljno',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Vrti gore',
  'caravan.crankDown': 'Vrti dolje',
  'caravan.axleLeft': 'Lijevi kotač osovine',
  'caravan.axleRight': 'Desni kotač osovine',
  'caravan.jockeyWheel': 'Potporni kotač',
  'help.screen.caravan':
    'Kamp-prikolica: potporni kotač kaže „Vrti gore” ili „Vrti dolje” i za koliko.',

  'vehicles.title': 'Vozila',
  'vehicles.defaultName': 'Moje vozilo',
  'vehicles.numbered': 'Vozilo {n}',
  'vehicles.name.placeholder': 'Naziv (npr. „Kamp-prikolica”)',
  'vehicles.name.label': 'Naziv vozila',
  'vehicles.add': 'Novo vozilo',
  'namePrompt.save': 'Spremi',
  'namePrompt.cancel': 'Odustani',
  'choice.rename': 'Preimenuj {name}',
  'vehicles.badge': 'Vozilo: {name}',
  'vehicles.delete': 'Ukloni {name}',
  'vehicles.remove.confirm':
    'Ukloniti {name} zajedno s nulom vozila, ciljevima i senzorskom kutijom?',
  'vehicles.remove.yes': 'Da, ukloni',
  'vehicles.hint':
    'Mjere, rampe, nula vozila, ciljevi i senzorska kutija pripadaju vozilu. Kalibracija telefona je zajednička.',
  'setup.incoming.addNew': 'Dodaj kao novo vozilo',

  'hitch.title': 'Visina spajanja',
  'hitch.hint':
    'Spremite je dok je kamp-prikolica još na kuki. Prije ponovnog spajanja potporni kotač pokazuje koliko treba vrtjeti da spojnica dođe na kuglu.',
  'hitch.save': 'Spremi visinu spajanja',
  'hitch.go': 'Natrag na visinu spajanja',
  'hitch.done': 'Gotovo',
  'hitch.savedNow': 'Visina spajanja spremljena.',
  'hitch.status.none': 'Visina spajanja još nije spremljena.',
  'hitch.status.saved': 'Visina spajanja je spremljena.',
  'hitch.status.active': 'Glavni zaslon pokazuje koliko treba vrtjeti potporni kotač.',
  'hitch.badge': 'Visina spajanja',
  'hitch.badge.aria': 'Visina spajanja: dodirnite za uobičajeno izravnavanje',
  'hitch.crank.up': 'Vrtite gore {amount} do visine spajanja',
  'hitch.crank.down': 'Vrtite dolje {amount} do visine spajanja',
  'hitch.reached': 'Na visini spajanja',
  'hitch.offer': 'Najprije spremiti visinu spajanja?',
  'hitch.offer.save': 'Spremi',
  'hitch.offer.dismiss': 'Ne sada',

  'zeroTrim.title': 'Fino podesi nulu',
  'zeroTrim.hint':
    'Još nije sasvim vodoravno? Svaki dodir pomiče nulu za 0,1°, pa aplikacija želi tu stranu više.',
  'zeroTrim.left': 'Lijevo više',
  'zeroTrim.right': 'Desno više',
  'zeroTrim.front': 'Sprijeda više',
  'zeroTrim.back': 'Straga više',
  'zeroTrim.side.left': 'Lijevo',
  'zeroTrim.side.right': 'Desno',
  'zeroTrim.side.front': 'Sprijeda',
  'zeroTrim.side.back': 'Straga',
  'zeroTrim.total': 'Fino podešeno: {trim}',
  'zeroTrim.none': 'Nije fino podešeno',
  'zeroTrim.reset': 'Poništi podešavanje',
  'tilt.frontBack': 'Uzdužno',
  'tilt.sideSide': 'Bočno',

  'pose.layFlat': 'Položite telefon ravno za mjerenje',
  'pose.sensorHint': 'Ispravno mjeri samo kad leži ravno, gornjom stranom prema gore.',
  'pose.openSensorPage': 'Prikaži kutiju',
  'pose.sensorExtreme': 'Kutija je previše nagnuta',
  'pose.sensorUpsideDown': 'Kutija je naizgled naopako',
  'pose.sensorNotUpright': 'Kutija leži',
  'pose.sensorHintUpright': 'Ispravno mjeri samo kad stoji uspravno.',
  'calibration.external.h': 'Nuliraj vozilo',
  'calibration.external.intro': 'Jednom izravnajte vozilo libelom, zatim nulirajte.',
  'calibration.external.phoneHidden':
    'Kalibracija telefona skrivena je dok mjeri senzorska kutija. Za kalibraciju telefona otvorite kutiju i najprije dodirnite „{disconnect}”.',
  'calibration.external.working': 'Nuliram…',
  'calibration.external.done': '{name} je nuliran: ovaj se položaj sada računa kao vodoravan.',
  'calibration.external.err.notConnected': '{name} nije povezan. Povežite ga i pokušajte ponovno.',
  'calibration.external.err.failed':
    'Nuliranje uređaja {name} nije uspjelo. Ništa nije promijenjeno. Provjerite vezu i pokušajte ponovno.',
  'pose.portrait': 'Okrenite telefon uspravno — gornji rub mora biti usmjeren naprijed',

  'stale.dataUnavailable': 'Nema novih podataka senzora — vođenje je pauzirano dok se ne vrate',

  'sensorFallback.lost': 'Izgubljena veza s kutijom',
  'sensorFallback.autoRetry': 'Automatski pokušavam ponovno…',
  'sensorFallback.connect': 'Povežite kutiju',
  'sensorFallback.pick': 'Dodirnite i odaberite svoju kutiju na popisu.',
  'sensorFallback.notFound': 'Kutija nije pronađena? Provjerite je li uključena i u blizini.',
  'sensorFallback.retry': 'Poveži ponovno',
  'sensorFallback.usePhone': 'Koristi telefon',
  'mounting.prompt.upright': 'Dodirnite kamo je okrenuta stražnja strana kutije (nosač s vijkom).',
  'mounting.prompt.arrow':
    'Jedna od strelica kutije (na poklopcu ili na tiskanoj pločici ispod njega) pokazuje naprijed. Koja je strana okrenuta prema prednjem dijelu?',
  'mounting.placement.wide': 'Duža strana naprijed',
  'mounting.placement.short': 'Kraća strana naprijed',
  'mounting.facing.front': 'Pokazuje naprijed',
  'mounting.facing.right': 'Pokazuje udesno',
  'mounting.facing.rear': 'Pokazuje natrag',
  'mounting.facing.left': 'Pokazuje ulijevo',
  'box.state.connected': 'Povezano',
  'box.state.lost': 'Izgubljena veza',
  'box.state.password': 'Pogrešna lozinka',
  'box.password.label': 'Kod kutije',
  'box.password.retry': 'Pokušaj ponovno',
  'box.password.checking': 'Isprobavam kod…',
  'box.password.invalid': 'Kod ima četiri znamenke.',
  'box.password.wrong': 'Kutija nije prihvatila ni taj kod.',
  'box.password.noAnswer':
    'Kutija nije odgovorila. Kod je spremljen i isprobat će se pri sljedećem povezivanju kutije.',
  'box.state.notConnected': 'Nije povezano',
  'box.state.battery': 'baterija {value}',
  'box.connect': 'Poveži',
  'box.step.position.upright.ok': 'Stoji uspravno',
  'box.step.position.upright.bad': 'Leži: postavite je uspravno, okrenutu na bilo koju stranu',
  'box.step.position.flat.ok': 'Leži ravno',
  'box.step.position.flat.bad': 'Previše nagnuta: položite je ravno, gornjom stranom prema gore',
  'box.step.position.flat.upsideDown':
    'Naopako: okrenite je poklopcem prema gore. Proizvođač ne preporučuje montažu naopako.',
  'box.step.position.waiting': 'Položaj: čeka očitanje',
  'box.step.direction.todo': 'Odaberi smjer',
  'box.step.direction.done': 'Smjer postavljen',
  'box.step.direction.learn': 'Niste sigurni? Naučite podizanjem prednjeg dijela',
  'box.step.zero.todo': 'Nuliraj vozilo',
  'box.step.zero.done': 'Nulirano',
  'box.step.zero.hint': 'Izravnajte vozilo libelom, zatim nulirajte.',
  'box.forgetDirection': 'Zaboravi smjer',
  'onboard.boxPosition.h': 'Položaj kutije',
  'onboard.boxPosition.later':
    'Smjer i nula postavljaju se kad prvi put parkirate. Stranica kutije vas vodi, a lampica „⚠ Nuliraj” podsjeća vas dok to ne obavite.',
  'onboard.boxPosition.notConnected':
    'Još nije povezana nijedna kutija, pa se njezin položaj ne može prikazati. Dodirnite {next} i povežite je kasnije ikonom senzora gore desno.',
  'sensorList.title': 'Senzorska kutija',
  'sensorList.phone': 'Kad nijedna kutija nije povezana, koristi se vlastiti senzor telefona.',
  'box.step.zero.again': 'Nuliraj ponovno',
};
