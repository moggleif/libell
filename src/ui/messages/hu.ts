import type { Messages } from './en';

/** Hungarian (Magyar). */
export const hu: Messages = {
  'topbar.install': 'Telepítés',
  'topbar.share': 'Libell megosztása',
  'bottombar.settings': 'Beállítások',
  'bottombar.sound.mute': 'Hang némítása',
  'bottombar.sound.unmute': 'Hang bekapcsolása',
  'bottombar.help': 'Súgó',
  'bottombar.label': 'Műveletek',
  'share.text': 'Szintezd be a lakóautód vagy a lakókocsid a telefonoddal.',
  'share.copied': 'Link másolva!',
  'update.check': 'Új verzió keresése',
  'update.checking': 'Frissítések keresése…',
  'update.updating': 'Frissítés az új verzióra…',
  'update.latest': 'Már a legújabb verziót használod',
  'update.offline': 'Nincs kapcsolat, nem lehet frissítést keresni',
  'update.unsupported': 'A frissítés itt nem érhető el',
  'install.hint': 'Koppints a Megosztás gombra, majd a „Főképernyőhöz adás” pontra.',
  'share.vehicle.text': 'A járművem beállításai a Libellhez — méretek és rámpák.',
  'settings.shareVehicle': 'Küldés másik telefonra',
  'setup.incoming.h': 'Kapott járműbeállítás',
  'setup.incoming.intro': 'Egy családtagod megosztotta veled ezeket a járműméreteket:',
  'setup.incoming.reminder': 'Kalibrálást nem tartalmaz — ezen a telefonon is kalibrálnod kell.',
  'setup.incoming.apply': 'A jelenlegi jármű cseréje',
  'setup.incoming.dismiss': 'Később',
  'setup.incoming.invalid': 'A járműbeállítás linkje nem olvasható — semmi sem változott.',

  'lamp.setup': '⚠ Méretek',
  'lamp.setup.title':
    'A jármű méretei még nincsenek elmentve — koppints a Beállítások megnyitásához',
  'lamp.calibrate': '⚠ Kalibráld',
  'lamp.zero': '⚠ Nullázd',
  'lamp.calibrate.title':
    'A telefon nincs kalibrálva — koppints a „Kalibrálás és nullázás” megnyitásához',
  'lamp.zero.title': 'A jármű nincs nullázva — koppints a „Kalibrálás és nullázás” megnyitásához',
  'lamp.calibrate.title.sensor': 'A doboz nincs nullázva — koppints a doboz megnyitásához',

  'sensorStatus.connected': 'Szenzordoboz csatlakoztatva',
  'sensorStatus.disconnected': 'Szenzordoboz — kapcsolat megszakadt, koppints a részletekért',
  'sensorStatus.stale': 'Szenzordoboz — nincs új adat, koppints a részletekért',
  'sensorStatus.idle': 'Szenzordoboz — koppints a csatlakoztatáshoz',
  'sensorStatus.idle.guide': 'Szenzordoboz — koppints az iPhone-os útmutatóért',

  'menu.title': 'Menü',
  'menu.close': 'Menü bezárása',
  'menu.settings': 'Beállítások',
  'menu.calibration': 'Kalibrálás és nullázás',
  'menu.targets': 'Célok',
  'menu.feedback': 'Visszajelzés',
  'menu.help': 'Súgó',
  'menu.intro': 'Bevezető mutatása',
  'menu.about': 'A Libellről',
  'menu.about.tab': 'Infó',
  'menu.sensorSource': 'Szenzordoboz',

  'sensorSource.connect': '{name} szenzor csatlakoztatása',
  'sensorSource.disconnect': 'Leválasztás',
  'sensorSource.status.connecting': 'Csatlakozás…',
  'sensorSource.err.unsupported': 'Ez a böngésző nem támogatja a Web Bluetooth-t.',
  'sensorSource.unsupported.browser':
    'Szenzordoboz csatlakoztatásához nyisd meg a Libellt Chrome-ban vagy Edge-ben, Androidon vagy számítógépen. A telefon saját szenzora itt is a szokott módon működik.',
  'sensorSource.err.password':
    'A doboz ({name}) nem fogadta el a jelszavát. Írd be lent a doboz négyjegyű kódját, és koppints az „Újra” gombra. A gyári kód 0000. Ha nem tudod a kódot, változtasd meg az Xparkle alkalmazásban.',
  'sensorSource.err.failed': 'Nem sikerült csatlakozni a szenzorhoz ({name}).',

  'sensorSource.ios.intro':
    'A Safari nem tud közvetlenül Bluetooth-szenzorokhoz csatlakozni, de van megoldás:',
  'sensorSource.ios.step1':
    'Telepítsd a „Bluefy – Web Bluetooth Browser” alkalmazást az App Store-ból.',
  'sensorSource.ios.step2': 'Nyisd meg a Bluefyt, és engedélyezd a Bluetooth-hozzáférést.',
  'sensorSource.ios.step3': 'A Bluefyban nyisd meg ugyanezt a Libell-címet.',
  'sensorSource.ios.step4':
    'Itt nyisd meg újra a Szenzordoboz oldalt — ugyanúgy működik, mint Androidon.',
  'sensorSource.ios.note':
    'A Bluefy külső fejlesztő alkalmazása, nem a Libell készítette — az alkalmazás ' +
    'megnyitásakor az újracsatlakozáshoz ott egy kézi koppintás kellhet, nem történik ' +
    'meg magától.',
  'sensorSource.ios.bluefyLink': 'Bluefy az App Store-ban',

  'sensorSource.detail.temperature': 'Hőmérséklet: {value}',
  'sensorSource.detail.notAvailable': 'Még nem elérhető',
  'sensorSource.lowBattery':
    '⚠ Alacsony töltöttség ({value}) — hamarosan érdemes kicserélni a szenzordoboz elemét.',

  'sensorSource.install.now': 'Nullázás',
  'sensorSource.install.clear': 'Nullpont törlése',
  'sensorSource.install.status': 'Nullpont: hosszirány {pitch}, oldalirány {roll}.',
  'sensorSource.install.status.none': 'Még nincs nullázva — a doboz úgy mér, ahogy áll.',

  'sensorSource.learn.h': 'Beépítés betanítása',
  'sensorSource.learn.intro':
    'A Libell két emelésből tanulja meg az irányt: előbb a jármű elejét emeled meg, aztán a jobb oldalát.',
  'sensorSource.learn.start': 'Betanítás',
  'sensorSource.learn.step.front':
    'Emeld meg a jármű elejét néhány centiméterrel, majd nyomd meg a gombot.',
  'sensorSource.learn.capture.front': 'Az eleje megemelve',
  'sensorSource.learn.step.right':
    'Engedd le újra az elejét. Most emeld meg a jobb oldalát néhány centiméterrel, majd nyomd meg a gombot.',
  'sensorSource.learn.capture.right': 'A jobb oldal megemelve',
  'sensorSource.learn.cancel': 'Mégse',
  'sensorSource.learn.status.learned': 'Beépítés betanítva.',
  'sensorSource.learn.status.none': 'Nincs betanított beépítés — a doboz saját irányai érvényesek.',
  'sensorSource.learn.done':
    'Kész! Ellenőrizd: emeld meg az elejét, és a Libellnek a hátsó kerekeket kell mutatnia.',
  'sensorSource.learn.err.tooSmall':
    'A jármű alig mozdult. Emeld meg kicsit jobban, és próbáld újra.',
  'sensorSource.learn.err.ambiguous':
    'Mindkét irányban nagyjából ugyanannyit mozdult. Csak az elejét, aztán csak a jobb oldalát emeld meg, és próbáld újra.',
  'sensorSource.learn.err.arrow':
    'Egyik nyíl sem mutat előre. Fordítsd el a dobozt, hogy az egyik nyila előre mutasson, majd próbáld újra.',
  'sensorSource.learn.err.mirrored':
    'Úgy tűnik, a doboz fejjel lefelé van, vagy rossz oldalt emeltél meg. Ellenőrizd, majd próbáld újra.',
  'sensorSource.learn.err.sameAxis':
    'Mindkét emelés ugyanarra döntötte. Előbb az elejét, aztán a jobb oldalát emeld meg, és próbáld újra.',

  'sensorStatus.title': '{name} szenzor',
  'sensorStatus.reading': 'Aktuális dőlés: {value}',
  'sensorStatus.debug': 'Hibakeresési adatok',
  'sensorStatus.debug.intro':
    'Nyers értékek közvetlenül a dobozból — hibakereséshez, ha valami nem működik.',
  'sensorStatus.debug.state': 'Kapcsolat állapota: {value}',
  'sensorStatus.debug.deviceId': 'Eszközazonosító: {value}',
  'sensorStatus.debug.lastSample': 'Utolsó mérés: {value}',
  'sensorStatus.debug.age': '{s} mp-e',
  'sensorStatus.debug.rawAccel': 'Nyers gyorsulásmérő (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Firmware-szint: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Nyers állapotbájtok: {value}',
  'sensorStatus.debug.versionBytes': 'Sorozatszám és firmware (nyers): {value}',
  'sensorStatus.debug.copy': 'Másolás',
  'sensorStatus.debug.copied': 'Hibakeresési adatok másolva!',
  'sensorStatus.debug.copy.failed': 'Az automatikus másolás nem sikerült.',
  'sensorStatus.advanced': 'Speciális',
  'sensorStatus.silentReconnect.intro':
    'Ez a böngésző még nem tud magától újracsatlakozni a dobozhoz, ezért újraindítás után újra ki kell választanod a listában. A Chrome-ban ezt magad is bekapcsolhatod.',
  'sensorStatus.silentReconnect.steps':
    'Nyisd meg ezt a címet: {address}, keress rá a „web bluetooth” kifejezésre, állítsd a „Use the new permissions backend for Web Bluetooth” beállítást Enabled értékre, és koppints a Relaunch gombra. Ezután egyszer csatlakoztasd a dobozt.',
  'sensorStatus.silentReconnect.copy': '{address} másolása',
  'sensorStatus.silentReconnect.copied': 'Másolva — illeszd be a Chrome címsorába.',
  'sensorStatus.debug.connectDelay.intro':
    'Kísérleti: csak akkor próbáld ki, ha a doboz kapcsolata megbízhatatlan. Csatlakozás után fix szünetet tart, mielőtt az alkalmazás olvasni kezd belőle.',
  'sensorStatus.debug.connectDelay.enable': 'Csatlakozási késleltetés',
  'sensorStatus.debug.connectDelay.ms': 'Késleltetés (ms)',

  'about.text':
    'A Libell segít beszintezni a lakóautód vagy a lakókocsid a meglévő ' +
    'telefonoddal, találgatás nélkül.',
  'about.version': 'Verzió: {v}',
  'about.offline':
    'Teljesen offline működik — a hálózatot csak az alkalmazás saját frissítéseinek letöltésére használja.',
  'about.privacy':
    'Minden a telefonodon marad — nincs fiók, nincs követés, és semmilyen adat ' +
    'nem hagyja el az eszközt.',
  'about.source': 'A Libell ingyenes és nyílt forráskódú (MIT-licenc).',
  'about.source.link': 'Forráskód a GitHubon',

  'onboard.welcome.h': 'Üdvözöl a Libell',
  'onboard.welcome.t':
    'Ez a rövid útmutató beállítja a járművedet és a telefonodat. Minden lépés kihagyható, ' +
    'és később a Beállításokban befejezhető.',
  'onboard.welcome.sensor':
    'Szenzordobozt bármikor csatlakoztathatsz a jobb felső sarokban lévő szenzorikonnal.',
  'onboard.sound.h': 'Hang',
  'onboard.source.h': 'Mivel szeretnél mérni?',
  'onboard.source.intro':
    'Válaszd ki, melyik szenzorból olvassa a Libell a dőlést — a legtöbben egyszerűen a telefont használják.',
  'onboard.source.phone': 'Ez a telefon',
  'onboard.source.externalActive':
    'Most egy szenzordoboz aktív. Ha ezt a telefont választod, a telefon kalibrálása kimarad. A telefon kalibrálásához nyisd meg a dobozt a jobb felső szenzorikonnal, és előbb koppints a „{disconnect}” gombra.',
  'onboard.vehicle.h': 'Mit szintezel?',
  'onboard.vehicle.intro': 'Válaszd ki a járművet — az útmutató többi része ehhez igazodik.',
  'onboard.step1.h': 'Így helyezd el a telefont',
  'onboard.next': 'Tovább',
  'onboard.back': 'Vissza',
  'onboard.close': 'A bevezető bezárása',
  'onboard.done': 'Kész',
  'onboard.skipStep': 'Kihagyás',
  'onboard.note.measurements':
    'Ha kihagyod, az alapértelmezett méretek érvényesek; a {lamp} jelzés világít, amíg el nem mented a sajátjaidat.',
  'onboard.note.ramps':
    'Ha kihagyod, az alapértelmezett rámpák érvényesek. A sajátjaidat később a Beállításokban választhatod ki.',
  'onboard.note.calibrate':
    'Most nincs kéznél sík felület? Koppints a „{next}” gombra; a {lamp} jelzés emlékeztet, amíg el nem végzed.',
  'onboard.note.connect':
    'Nincs kéznél doboz? Koppints a „{next}” gombra, és csatlakoztasd később a jobb felső szenzorikonnal.',
  'onboard.zeroLater':
    'A járművet akkor nullázod, amikor először vízszintes talajon parkolsz. A {lamp} jelzés emlékeztet, amíg el nem végzed.',
  'onboard.legend.ok': 'Zöld ✓ — az a kerék vízszintben van.',
  'onboard.legend.up': 'Narancs ↑ — azzal a kerékkel hajts fel a jelzett lépcsőre.',
  'onboard.legend.no': 'Piros ✕ — egyik lépcső sem elég; állj át egy vízszintesebb helyre.',
  'onboard.legend.dim': 'Szürke – — annál a keréknél nincs rámpa; a szám mutatja, mennyi hiányzik.',
  'settings.wheelbase': 'Tengelytáv',
  'settings.trackFront': 'Nyomtáv elöl',
  'settings.trackRear': 'Nyomtáv hátul',
  'settings.tolerance': 'Tűrés',
  'settings.stability': 'Stabilitás',
  'settings.dwellRest': 'Reakcióidő (ms)',
  'settings.dwellMotion': 'Reakcióidő állítás közben (ms)',
  'settings.dwell.hint':
    'Mennyi ideig kell egy mérésnek állandónak lennie, mielőtt a szám megváltozik.',
  'settings.vehicle': 'Jármű',
  'vehicle.motorhome': 'Lakóautó',
  'vehicle.caravan': 'Lakókocsi',
  'settings.axleToJockey': 'Tengelytől az orrkerékig',
  'settings.rearAxle': 'Hátsó tengely',
  'settings.axle': 'Tengely',
  'axle.single': 'Egyes',
  'axle.boggie': 'Tandem (ikertengely)',
  'settings.track': 'Nyomtáv',
  'settings.measureHint': 'A forgalmi engedélyben megtalálod. Néhány cm eltérés nem számít.',
  'settings.measureHint.caravan': 'Mérd a tengelytől az orrkerékig. Néhány cm eltérés nem számít.',
  'settings.measureHint.boggie': 'Tandemtengelynél a tengelypár közepéig mérj.',
  'settings.steps': 'Rámpalépcsők magassága',
  'settings.steps.add': 'Új lépcső',
  'settings.steps.new': 'Új lépcsőmagasság ({unit})',
  'settings.steps.remove': '{value} eltávolítása',
  'settings.ramp': 'Gyári rámpa',
  'settings.ramp.custom': 'Saját készlet',
  'settings.ramp.stepless': 'Fokozatmentes ék',
  'settings.ramp.steplessModel': '{name} (fokozatmentes, max. {max} mm)',
  'settings.stepless.max': 'Fokozatmentes ék, max. magasság',
  'settings.stepless.maxHeading': 'Max. magasság',
  'settings.stepless.set': 'Mentés',
  'settings.stepless.new': 'Max. magasság ({unit})',
  'settings.rampCount': 'Rámpák száma',
  'settings.drain': 'Lefolyó oldala',
  'settings.rampHint': 'Az alkalmazás oda teszi a rámpákat, ahol a legtöbbet segítenek.',
  'settings.drainHint': 'A tűrésen belül ez az oldal marad a legalacsonyabb, hogy a víz lefolyjon.',
  'settings.section.vehicle': 'Jármű és méretek',
  'settings.section.ramps': 'Rámpák',
  'settings.general': 'Általános',
  'settings.language': 'Nyelv',
  'settings.language.auto': 'Automatikus (eszköz nyelve)',
  'settings.tolerance.hint':
    'Milyen közel kell lennie a vízszinteshez, hogy vízszintesnek számítson.',
  'settings.stability.hint': 'Kisimítja a szenzor apró remegését, hogy a számok ne villogjanak.',
  'drain.none': 'Nincs / nem számít',
  'drain.left': 'Bal, középen',
  'drain.right': 'Jobb, középen',
  'drain.front': 'Elöl, középen',
  'drain.rear': 'Hátul, középen',
  'drain.frontLeft': 'Bal elöl',
  'drain.frontRight': 'Jobb elöl',
  'drain.rearLeft': 'Bal hátul',
  'drain.rearRight': 'Jobb hátul',
  'settings.unit': 'Hosszúságok mértékegysége',
  'settings.unitInches': 'hüvelyk (in)',
  'settings.theme': 'Téma',
  'theme.system': 'A telefont követi',
  'theme.light': 'Világos',
  'theme.dark': 'Sötét',
  'settings.appearance': 'Megjelenés',
  'appearance.classic': 'Klasszikus',
  'appearance.modern': 'Modern',
  'appearance.glossy': 'Fényes',
  'settings.sound': 'Hangjelzés, ha vízszintes',
  'settings.soundGuidance': 'Folyamatos hangvezetés',
  'settings.soundGuidance.help':
    'A sípolás annál gyorsabb és magasabb, minél közelebb vagy a vízszinteshez.',
  'settings.soundSpeech': 'Hangos útmutatás',
  'settings.soundSpeech.help':
    'Amikor a jármű áll, az alkalmazás bemondja, melyik kerék és mennyit, például: „Bal hátsó, 2. lépcső”.',
  'settings.soundSpeech.unavailable':
    'A hangos útmutatás ezen a telefonon nem működik: nincs rajta offline is működő magyar hang. A hangjelzések a szokott módon működnek.',
  'speech.level': 'Vízszintes',
  'speech.inches': '{n} hüvelyk',
  'speech.inchOne': 'egy hüvelyk',
  'speech.inchOneAnd': 'egy és {fraction} hüvelyk',
  'speech.inchesAnd': '{n} és {fraction} hüvelyk',
  'speech.inchFraction': '{fraction} hüvelyk',
  'speech.eighth1': 'egy nyolcad',
  'speech.eighth2': 'egy negyed',
  'speech.eighth3': 'három nyolcad',
  'speech.eighth4': 'fél',
  'speech.eighth5': 'öt nyolcad',
  'speech.eighth6': 'három negyed',
  'speech.eighth7': 'hét nyolcad',
  'settings.undo': 'Visszavonás',
  'settings.saved': 'Mentve',
  'settings.more': 'Több',
  'settings.fineTuning': 'Finomhangolás',
  'settings.resetAll': 'Minden visszaállítása',
  'settings.err.positive': 'Adj meg 0-nál nagyobb számot. Az előző érték marad érvényben.',
  'settings.err.notNegative': 'Adj meg 0-t vagy nagyobbat. Az előző érték marad érvényben.',
  'settings.err.range': 'Adj meg egy számot {min} és {max} között. Az előző érték marad érvényben.',

  'settings.tab.vehicle': 'Jármű',
  'settings.tab.ramps': 'Rámpák',
  'settings.tab.level': 'Szint',
  'settings.klossar.brandAll': 'Mind',
  'settings.klossar.changeRamp': 'Rámpacsere',
  'settings.rampCountHint': 'Az alkalmazás oda teszi őket, ahol a legtöbbet segítenek.',
  'settings.klossar.selected': 'Aktív',
  'settings.klossar.stepsHeading': 'Lépcsőmagasságok',

  'status.measuring': 'Mérés…',
  'status.almost': 'Majdnem vízszintes — még {left}',
  'status.cantLevel.close':
    'A rámpáid itt majdnem elegendők, de nem eléggé — állj odébb a járművel',
  'status.cantLevel.far': 'A rámpáid itt messze nem elegendők — állj odébb a járművel',

  'calibration.intro':
    'Tedd a telefont egy biztosan vízszintes felületre, majd koppints a Kalibrálás gombra. ' +
    'A jelenlegi dőlés lesz a nullpont.',
  'calibration.status': 'Kalibrálva: hosszirány {pitch}, oldalirány {roll}.',
  'calibration.status.none': 'Nincs kalibrálva — a nyers szenzorértékeket használja.',
  'calibration.now': 'Kalibrálás',
  'calibration.step.phone.done': 'Telefon kalibrálva',
  'calibration.step.phone.hint': 'Fektesd a telefont valami sík felületre.',
  'calibration.step.flipLink': 'Nincs sík hely? Forgasd meg',
  'calibration.step.vehicle.done': 'Nullázva',
  'calibration.step.vehicle.hint':
    'Szintezd be a járművet vízmértékkel, és tedd a telefont a szokott helyére.',
  'calibration.step.vehicle.now': 'Nullázás',
  'calibration.clear': 'Kalibrálás törlése',
  'calibration.err.notRunning':
    'A dőlésérzékelő még nem fut — előbb koppints a Start gombra a főképernyőn.',
  'calibration.warn.notFlat':
    'A kalibrálás elmentve, de ez nem tűnik síknak (15° fölött), így valószínűleg hibás. Nem ezt akartad? Koppints a Visszavonás gombra, fektesd a telefont sík felületre, és kalibrálj újra.',
  'calibration.undo': 'Visszavonás',
  'calibration.sensor.h': 'A telefon kalibrálása',
  'calibration.vehicle.h': 'A jármű nullázása',
  'calibration.vehicle.intro':
    'A kalibrálás a telefonról szól, nem arról a helyről, ahol fekszik. Ha az asztal kicsit lejt, az alkalmazás azt a dőlést mutatja. Egyszer szintezd be a járművet vízmértékkel, tedd a telefont a szokott helyére, és nullázz.',
  'calibration.vehicle.now': 'Nullázás',
  'calibration.vehicle.clear': 'Nullpont törlése',
  'calibration.vehicle.status': 'Jármű nullpontja: hosszirány {pitch}, oldalirány {roll}.',
  'calibration.vehicle.status.none': 'Nincs jármű-nullpont — a telefon helye számít vízszintesnek.',
  'calibration.vehicle.warn.notFlat':
    'A nullpont elmentve, de ez nem tűnik vízszintesnek (15° fölött). Nem volt vízszintes a jármű? Koppints a Visszavonás gombra, szintezd be a járművet, és nullázz újra.',
  'calibration.age.today': '(ma)',
  'calibration.age.days': '({n} napja)',
  'calibration.check': 'Ellenőrzés',
  'calibration.check.good': 'Még jó — eltérés: {off}°.',
  'calibration.check.off': 'Eltérés: {off}° — érdemes újra kalibrálni.',
  'calibration.vehicle.check.off': 'Eltérés: {off}° — érdemes újra nullázni.',
  'calibration.check.none':
    'Még nincs kalibrálva, így nincs mit ellenőrizni. Fektesd a telefont vízszintes felületre, és koppints a „{now}” gombra.',
  'calibration.vehicle.check.none':
    'Még nincs nullpont, így nincs mit ellenőrizni. Szintezd be a járművet vízmértékkel, és koppints a „{now}” gombra.',
  'calibration.flip.intro':
    'Nincs a közelben vízszintes felület? Használd a forgatásos kalibrálást: tedd le a telefont ' +
    'bárhol, ahol nagyjából sík, végezz egy mérést, forgasd el a telefont fél fordulattal (180°) ' +
    'ugyanazon a helyen, és mérj újra — a felület dőlése kiegyenlíti önmagát.',
  'calibration.flip.start': 'Kalibrálás forgatással',
  'calibration.flip.rotate':
    'Most forgasd el a telefont fél fordulattal (180°) ugyanazon a helyen, majd koppints a Mérés gombra.',
  'calibration.flip.capture': 'Mérés',
  'calibration.flip.done': 'Kész! A felület dőlése {surface}° — kiegyenlítve.',
  'calibration.flip.warn.moved':
    'A kalibrálás elmentve, de a két mérés több mint 15°-kal eltér. Elmozdult a telefon? Koppints a Visszavonás gombra, és kezdd elölről.',
  'calibration.pill.notDone': 'HIÁNYZIK',
  'calibration.pill.done': 'KÉSZ',
  'calibration.pill.none': 'NINCS',

  'targets.normal': 'Normál (vízszintes)',
  'targets.name.placeholder': 'Név (pl. „Zuhanylefolyó”)',
  'targets.name.label': 'Az új cél neve',
  'targets.defaultName': 'Cél {n}',
  'targets.add': 'Mostani dőlés mentése célként',
  'targets.delete': '{name} törlése',
  'targets.warn.tooSteep':
    'A cél elmentve, de meredekebb a szokásosnál (15° fölött). Nem ezt akartad? Töröld a kereszttel, és mentsd újra.',
  'targets.badge': 'Cél: {name}',

  'feedback.intro':
    'Hibát találtál, vagy van egy ötleted? Töltsd ki, és koppints a gombra — megnyílik ' +
    'egy előre kitöltött bejelentés a GitHubon, ahol elküldheted (ehhez ingyenes GitHub-fiók ' +
    'kell, egy perc alatt létrehozható).',
  'feedback.category': 'Miről szól?',
  'feedback.cat.bug': 'Hiba',
  'feedback.cat.suggestion': 'Javaslat',
  'feedback.cat.other': 'Egyéb',
  'feedback.title': 'Rövid cím',
  'feedback.desc': 'Mi történt, vagy mit szeretnél?',
  'feedback.submit': 'Megnyitás a GitHubon',
  'feedback.warn.title': 'A cím üres — a bejelentést így is elküldheted.',
  'feedback.warn.desc': 'A leírás üres — a bejelentést így is elküldheted.',
  'feedback.warn.both': 'A cím és a leírás üres — a bejelentést így is elküldheted.',

  'help.screen.h': 'A képernyő értelmezése',
  'help.screen.lead':
    'A képernyő megmutatja, mely kerekeket kell megemelni, és mennyivel. A 2. lépcső a rámpád második lépcsőjét jelenti.',
  'help.screen.t':
    'Zöld ✓: kész, nincs teendő.\n' +
    'Narancs ↑: azzal a kerékkel hajts fel a mellette jelzett lépcsőre.\n' +
    'Piros ✕: a rámpáid itt nem elegendők. Állj odébb a járművel.\n' +
    'Szürke –: annál a keréknél nincs rámpa. A szám mutatja, mennyi hiányzik, ha valami mást tennél alá.\n' +
    'Ha a buborék középen nyugszik, vízszintben vagy.',
  'help.screen.routine':
    'Hajts fel, várj, amíg a jármű megáll, és nézd meg újra. Ismételd, amíg minden kerék zöld nem lesz.',
  'help.what.t':
    'Fektesd a telefont laposan a járműbe, a tetejével előre, mindig ugyanarra a helyre.\n' +
    'Szenzordoboz esetén mindegy, hogyan fekszik a telefon.',
  'help.settings.h': 'A méretek',
  'help.measures.h': 'Add meg a méreteket',
  'help.settings.t':
    'A Libell a tengelytávból és a nyomtávból számolja ki, mennyivel kell az egyes kerekeket megemelni.\n' +
    'Ezek a jármű papírjaiban szerepelnek, vagy mérd le őket mérőszalaggal.\n' +
    'Írd be őket mm-ben, cm-ben vagy hüvelykben, ahogy a Hosszúságok mértékegysége alatt választottad.\n' +
    'Lakókocsinál a tengelytáv a tengely és az orrkerék közötti távolság.\n' +
    'Több jármű esetén mindegyiknek saját méretei, rámpái, jármű-nullpontja, céljai és szenzordoboza van; a Jármű lap tetején válassz közülük.',
  'help.ramps.t':
    'A képernyő megmondja, melyik kerék a rámpád melyik lépcsőjére menjen fel, ezért add meg a nálad lévő rámpákat.\n' +
    'Válassz gyári rámpát vagy saját készletet, és add meg, hány darabod van. A Libell oda teszi őket, ahol a legtöbbet segítenek.\n' +
    'Lépcső nélküli rámpához válaszd a Fokozatmentes ék lehetőséget, és add meg a magasságát. A képernyő ekkor megmondja, mennyit hajts fel.',
  'help.calibration.h': 'Kalibrálás és nullázás',
  'help.calibration.t':
    'Két lépés teszi pontossá a méréseket: a telefont egyszer kalibrálod, a járművet egyszer nullázod.\n' +
    'Kalibrálás: fektesd a telefont sík felületre, és koppints a Kalibrálás gombra.\n' +
    'Nullázás: szintezd be a járművet vízmértékkel, tedd a telefont a szokott helyére, és koppints a Nullázás gombra.\n' +
    'Szenzordoboz esetén a doboz oldalán nullázol. A doboznak nincs szüksége kalibrálásra.\n' +
    'Még mindig nem egészen vízszintes? Finomhangold a nullpontot „A jármű nullázása” részben a Bal fel, Jobb fel, Elöl fel vagy Hátul fel gombbal.\n' +
    'A ⚠ Kalibráld vagy ⚠ Nullázd jelzés addig világít, amíg el nem végzed.',
  'help.sensor.h': 'Szenzordoboz',
  'help.sensor.t':
    'A járműbe szerelt szenzordoboz a telefon helyett is mérhet. A Libell ezekkel működik:\n' +
    '{upright}: függőlegesen áll, bármerre nézhet.\n' +
    '{flat}: laposan fekszik, fedéllel felfelé, az egyik nyila előre mutat.\n' +
    'Csatlakoztasd a jobb felső szenzorikonnal. A doboz oldala ezután végigvezet az „Irány kiválasztása” és „A jármű nullázása” lépéseken.\n' +
    'Androidon vagy számítógépen Chrome-ban vagy Edge-ben működik. iPhone-on a Bluefy böngésző kell hozzá.\n' +
    'Ha a doboz elutasítja a kódot, a Libell elkéri a doboz négyjegyű kódját.',
  'help.targets.h': 'Célok és hang',
  'help.targets.t':
    'Ments el egy kívánt dőlést célként, például a zuhanylefolyó felé, és válts közöttük.\n' +
    'Lakókocsi: lecsatolás előtt mentsd el a kapcsolási magasságot, és a „Vissza a magassághoz” visszavezeti oda az orrkereket.\n' +
    'Bekapcsolt hangos útmutatásnál az alkalmazás bemondja, melyik kereket mennyivel emeld, így a telefon nézése nélkül is szintezhetsz.\n' +
    'Az alsó sáv közepén lévő gomb be- és kikapcsolja a hangot.',
  'help.trouble.h': 'Ha valami nem stimmel',
  'help.trouble.t':
    '„Mérés…”: a jármű mozog. Várj, amíg megáll.\n' +
    '„Méréshez fektesd le laposan a telefont”: a telefon túlságosan meg van döntve a méréshez.\n' +
    '„Megszakadt a kapcsolat a dobozzal”: koppints az Újracsatlakozás gombra, és válaszd ki a dobozt a listában.\n' +
    '„Várakozás a dőlésérzékelőre…”: még nincs mérés. iPhone-on koppints a Start gombra minden alkalommal, amikor megnyitod az alkalmazást; egyébként töltsd újra az oldalt.\n' +
    '„A mozgásérzékelők elérése le van tiltva”: engedélyezd a mozgás- és tájolásérzékelőket ennek a webhelynek a böngésző beállításaiban, és töltsd újra az oldalt.\n' +
    'Még mindig hibás? Írj bejelentést a Visszajelzés alatt.',
  'help.open': '{name} megnyitása',
  'help.open.sensor': 'A doboz megnyitása',
  'help.open.feedback': 'Bejelentés írása',

  'main.hint': 'Fektesd a telefont laposan a járműbe, a felső szélével előre.',
  'main.start': 'Start',
  'main.waiting': 'Várakozás a dőlésérzékelőre…',
  'main.level': 'A járműved vízszintben van!',
  'main.denied':
    'A mozgásérzékelők elérése le van tiltva, ezért a Libell nem tudja leolvasni a dőlést. ' +
    'Engedélyezd a mozgás- és tájolásérzékelők elérését ennek a webhelynek, és töltsd újra az oldalt.',
  'main.noSensors':
    'Ez az eszköz nem biztosít mozgásérzékelőket, ezért a Libell nem tudja leolvasni a dőlést.',
  'main.https':
    'A Libellnek biztonságos kapcsolat (HTTPS) kell a dőlésérzékelők olvasásához. ' +
    'Nyisd meg az alkalmazást HTTPS-en keresztül, és próbáld újra.',

  'diagram.aria': 'A lakóautód felülnézeti rajza, amely mutatja, mely kerekeket kell megemelni',
  'diagram.caravan.aria': 'A lakókocsid felülnézeti rajza a tengely kerekeivel és az orrkerékkel',
  'diagram.front': 'Elöl',
  'diagram.step': '{n}. lépcső',
  'diagram.driveUp': 'Hajts fel',
  'diagram.done': 'Kész',
  'diagram.noRamp': 'Nincs rámpa',
  'diagram.wheel.frontLeft': 'Bal első',
  'diagram.wheel.frontRight': 'Jobb első',
  'diagram.wheel.rearLeft': 'Bal hátsó',
  'diagram.wheel.rearRight': 'Jobb hátsó',
  'diagram.notEnough': 'nem elég',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Tekerd fel',
  'caravan.crankDown': 'Tekerd le',
  'caravan.axleLeft': 'Bal tengelykerék',
  'caravan.axleRight': 'Jobb tengelykerék',
  'caravan.jockeyWheel': 'Orrkerék',
  'help.screen.caravan':
    'Lakókocsi: az orrkeréknél „Tekerd fel” vagy „Tekerd le” látható, és hogy mennyivel.',

  'vehicles.title': 'Járművek',
  'vehicles.defaultName': 'Saját jármű',
  'vehicles.numbered': 'Jármű {n}',
  'vehicles.name.placeholder': 'Név (pl. „Lakókocsi”)',
  'vehicles.name.label': 'Jármű neve',
  'vehicles.add': 'Új jármű',
  'namePrompt.save': 'Mentés',
  'namePrompt.cancel': 'Mégse',
  'choice.rename': '{name} átnevezése',
  'vehicles.badge': 'Jármű: {name}',
  'vehicles.delete': '{name} eltávolítása',
  'vehicles.remove.confirm':
    'Eltávolítod ezt a járművet ({name}) a jármű-nullponttal, a célokkal és a szenzordobozzal együtt?',
  'vehicles.remove.yes': 'Igen, törlés',
  'vehicles.hint':
    'A méretek, a rámpák, a jármű-nullpont, a célok és a szenzordoboz a járműhöz tartoznak. A telefon kalibrálása közös.',
  'setup.incoming.addNew': 'Mentés új járműként',

  'hitch.title': 'Kapcsolási magasság',
  'hitch.hint':
    'Mentsd el, amíg a lakókocsi még a vonógömbön van. Mielőtt újra rákapcsolod, az orrkerék mutatja, mennyit kell tekerni, hogy a kapcsolófej a gömbre illeszkedjen.',
  'hitch.save': 'Magasság mentése',
  'hitch.go': 'Vissza a magassághoz',
  'hitch.done': 'Kész',
  'hitch.savedNow': 'Kapcsolási magasság elmentve.',
  'hitch.status.none': 'Még nincs elmentett kapcsolási magasság.',
  'hitch.status.saved': 'Van elmentett kapcsolási magasság.',
  'hitch.status.active': 'A főképernyő mutatja, mennyit kell tekerni az orrkereken.',
  'hitch.badge': 'Rákapcsolás',
  'hitch.badge.aria': 'Kapcsolási magasság: koppints a szokásos szintezéshez',
  'hitch.crank.up': 'Tekerd fel {amount} értékkel a kapcsolási magasságig',
  'hitch.crank.down': 'Tekerd le {amount} értékkel a kapcsolási magasságig',
  'hitch.reached': 'Kapcsolási magasságon',
  'hitch.offer': 'Előbb elmented a kapcsolási magasságot?',
  'hitch.offer.save': 'Mentés',
  'hitch.offer.dismiss': 'Később',

  'zeroTrim.title': 'A nullpont finomhangolása',
  'zeroTrim.hint':
    'Még mindig nem egészen vízszintes? Minden koppintás 0,1°-kal tolja el a nullpontot, így az alkalmazás azt az oldalt magasabbra kéri.',
  'zeroTrim.left': 'Bal fel',
  'zeroTrim.right': 'Jobb fel',
  'zeroTrim.front': 'Elöl fel',
  'zeroTrim.back': 'Hátul fel',
  'zeroTrim.side.left': 'Bal',
  'zeroTrim.side.right': 'Jobb',
  'zeroTrim.side.front': 'Elöl',
  'zeroTrim.side.back': 'Hátul',
  'zeroTrim.total': 'Finomhangolva: {trim}',
  'zeroTrim.none': 'Nincs finomhangolva',
  'zeroTrim.reset': 'Visszaállítás',
  'tilt.frontBack': 'Hosszirány',
  'tilt.sideSide': 'Oldalirány',

  'pose.layFlat': 'Méréshez fektesd le laposan a telefont',
  'pose.sensorHint': 'Csak laposan, tetejével felfelé fekve mér pontosan.',
  'pose.openSensorPage': 'A doboz oldala',
  'pose.sensorExtreme': 'A doboz túlságosan meg van döntve',
  'pose.sensorUpsideDown': 'A doboz fejjel lefelé áll',
  'pose.sensorNotUpright': 'A doboz fekszik',
  'pose.sensorHintUpright': 'Csak függőlegesen állva mér pontosan.',
  'calibration.external.h': 'A jármű nullázása',
  'calibration.external.intro': 'Szintezd be egyszer a járművet vízmértékkel, majd nullázz.',
  'calibration.external.phoneHidden':
    'A telefon saját kalibrálása rejtve van, amíg a szenzordoboz mér. A telefon kalibrálásához nyisd meg a dobozt, és előbb koppints a „{disconnect}” gombra.',
  'calibration.external.working': 'Nullázás…',
  'calibration.external.done': '{name} nullázva: mostantól ez a helyzet számít vízszintesnek.',
  'calibration.external.err.notConnected':
    '{name} nincs csatlakoztatva. Csatlakoztasd, és próbáld újra.',
  'calibration.external.err.failed':
    'Nem sikerült nullázni: {name}. Semmi sem változott. Ellenőrizd a kapcsolatot, és próbáld újra.',
  'pose.portrait': 'Fordítsd álló helyzetbe a telefont — a felső szélének előre kell mutatnia',

  'stale.dataUnavailable': 'Nincs új szenzoradat — az útmutatás szünetel, amíg vissza nem tér',

  'sensorFallback.lost': 'Megszakadt a kapcsolat a dobozzal',
  'sensorFallback.autoRetry': 'Automatikus újrapróbálás…',
  'sensorFallback.connect': 'Csatlakoztasd a dobozt',
  'sensorFallback.pick': 'Koppints, és válaszd ki a dobozodat a listában.',
  'sensorFallback.notFound':
    'Nem található doboz? Ellenőrizd, hogy be van-e kapcsolva és közel van-e.',
  'sensorFallback.retry': 'Újracsatlakozás',
  'sensorFallback.usePhone': 'Inkább a telefon',
  'mounting.prompt.upright': 'Koppints arra, amerre a doboz hátulja (a csavaros rögzítés) néz.',
  'mounting.prompt.arrow':
    'A doboz egyik nyila (a fedelén, vagy alatta az áramköri lapon) előre mutat. Melyik oldala néz a jármű eleje felé?',
  'mounting.placement.wide': 'Hosszú oldal elöl',
  'mounting.placement.short': 'Rövid oldal elöl',
  'mounting.facing.front': 'Előre mutat',
  'mounting.facing.right': 'Jobbra mutat',
  'mounting.facing.rear': 'Hátra mutat',
  'mounting.facing.left': 'Balra mutat',
  'box.state.connected': 'Csatlakozva',
  'box.state.lost': 'Kapcsolat megszakadt',
  'box.state.password': 'Hibás jelszó',
  'box.password.label': 'Doboz kódja',
  'box.password.retry': 'Újra',
  'box.password.checking': 'Kód kipróbálása…',
  'box.password.invalid': 'A kód négy számjegyből áll.',
  'box.password.wrong': 'A doboz ezt a kódot sem fogadta el.',
  'box.password.noAnswer':
    'A doboz nem válaszolt. A kód elmentve, és a doboz következő csatlakozásakor kipróbálja.',
  'box.state.notConnected': 'Nincs kapcsolat',
  'box.state.battery': 'akku {value}',
  'box.connect': 'Csatlakozás',
  'box.step.position.upright.ok': 'Függőlegesen áll',
  'box.step.position.upright.bad': 'Fekszik: állítsd függőlegesbe, bármerre nézhet',
  'box.step.position.flat.ok': 'Laposan fekszik',
  'box.step.position.flat.bad': 'Túlságosan megdől: fektesd laposan, tetejével felfelé',
  'box.step.position.flat.upsideDown':
    'Fejjel lefelé: fordítsd fedéllel felfelé. A gyártó nem javasolja a fejjel lefelé szerelést.',
  'box.step.position.waiting': 'Helyzet: mérésre vár',
  'box.step.direction.todo': 'Irány kiválasztása',
  'box.step.direction.done': 'Irány beállítva',
  'box.step.direction.learn': 'Bizonytalan? Tanítsd be az eleje emelésével',
  'box.step.zero.todo': 'A jármű nullázása',
  'box.step.zero.done': 'Nullázva',
  'box.step.zero.hint': 'Szintezd be a járművet vízmértékkel, majd nullázz.',
  'box.forgetDirection': 'Irány törlése',
  'onboard.boxPosition.h': 'A doboz helyzete',
  'onboard.boxPosition.later':
    'Az irány beállítását és a nullázást az első parkoláskor végzed el. A doboz oldala végigvezet, a ⚠ Nullázd jelzés pedig emlékeztet, amíg el nem végzed.',
  'onboard.boxPosition.notConnected':
    'Még nincs csatlakoztatott doboz, ezért a helyzete nem látható. Koppints a „{next}” gombra, és csatlakoztasd később a jobb felső szenzorikonnal.',
  'sensorList.title': 'Szenzordoboz',
  'sensorList.phone': 'Ha nincs csatlakoztatott doboz, a telefon saját szenzorát használja.',
  'box.step.zero.again': 'Újranullázás',
};
