import type { Messages } from './en';

/** Estonian. */
export const et: Messages = {
  'topbar.install': 'Paigalda',
  'topbar.share': 'Jaga Libelli',
  'bottombar.settings': 'Seaded',
  'bottombar.sound.mute': 'Lülita heli välja',
  'bottombar.sound.unmute': 'Lülita heli sisse',
  'bottombar.help': 'Abi',
  'bottombar.label': 'Toimingud',
  'share.text': 'Loodi oma matkaauto või haagissuvila telefoniga.',
  'share.copied': 'Link kopeeritud!',
  'update.check': 'Otsi uut versiooni',
  'update.checking': 'Otsin uuendusi…',
  'update.updating': 'Uuendan uuele versioonile…',
  'update.latest': 'Sul on uusim versioon',
  'update.offline': 'Ühendus puudub, uuendusi ei saa otsida',
  'update.unsupported': 'Uuendused pole siin saadaval',
  'install.hint': 'Puuduta „Jaga“, seejärel „Lisa avakuvale“.',
  'install.row': 'Paigalda Libell rakendusena avakuvale.',
  'install.close': 'Peida',
  'share.vehicle.text': 'Minu sõiduki seadistus Libelli jaoks — mõõdud ja kiilud.',
  'settings.shareVehicle': 'Saada teise telefoni',
  'setup.incoming.h': 'Saabunud sõiduki seadistus',
  'setup.incoming.intro': 'Pereliige jagas sinuga neid sõiduki mõõte:',
  'setup.incoming.reminder':
    'Kalibreerimist see ei sisalda — selles telefonis pead ikkagi ise kalibreerima.',
  'setup.incoming.apply': 'Asenda praegune sõiduk',
  'setup.incoming.dismiss': 'Hiljem',
  'setup.incoming.invalid': 'Sõiduki seadistuse linki ei õnnestunud lugeda — midagi ei muudetud.',

  'lamp.setup': '⚠ Mõõdud',
  'lamp.setup.title': 'Sõiduki mõõte pole kunagi salvestatud — puuduta, et avada Seaded',
  'lamp.calibrate': '⚠ Kalibreeri',
  'lamp.zero': '⚠ Nulli',
  'lamp.calibrate.title': 'Telefon pole kalibreeritud — puuduta, et avada „Kalibreeri ja nulli“',
  'lamp.zero.title': 'Sõiduk pole nullitud — puuduta, et avada „Kalibreeri ja nulli“',
  'lamp.calibrate.title.sensor': 'Välisandur pole nullitud — puuduta, et avada välisanduri leht',

  'sensorStatus.connected': 'Välisandur on ühendatud',
  'sensorStatus.disconnected': 'Välisandur — ühendus kadus, puuduta üksikasjade nägemiseks',
  'sensorStatus.stale': 'Välisandur — uusi andmeid pole, puuduta üksikasjade nägemiseks',
  'sensorStatus.idle': 'Välisandur — puuduta ühendamiseks',
  'sensorStatus.idle.guide': 'Välisandur — puuduta iPhone’i juhendi avamiseks',

  'menu.title': 'Menüü',
  'menu.close': 'Sulge menüü',
  'menu.settings': 'Seaded',
  'menu.calibration': 'Kalibreeri ja nulli',
  'menu.targets': 'Sihtasendid',
  'menu.feedback': 'Tagasiside',
  'menu.help': 'Abi',
  'menu.intro': 'Näita tutvustust',
  'menu.about': 'Libellist',
  'menu.about.tab': 'Teave',
  'menu.sensorSource': 'Välisandur',

  'sensorSource.connect': 'Ühenda välisandur {name}',
  'sensorSource.disconnect': 'Lahuta',
  'sensorSource.status.connecting': 'Ühendan…',
  'sensorSource.err.unsupported': 'See brauser ei toeta Web Bluetoothi.',
  'sensorSource.unsupported.browser':
    'Välisanduri ühendamiseks ava Libell Androidis või arvutis Chrome’is või Edge’is. Telefoni enda andur töötab siin nagu tavaliselt.',
  'sensorSource.err.password':
    '{name} välisandur ei aktsepteerinud oma parooli. Sisesta allpool välisanduri neljakohaline kood ja puuduta „Proovi uuesti“. Tehase kood on 0000. Kui sa koodi ei tea, muuda see Xparkle’i rakenduses.',
  'sensorSource.err.failed': 'Välisanduriga {name} ei õnnestunud ühendust luua.',

  'sensorSource.ios.intro':
    'Safari ei saa Bluetooth-anduritega otse ühendust luua, kuid on olemas lahendus:',
  'sensorSource.ios.step1': 'Paigalda App Store’ist „Bluefy – Web Bluetooth Browser“.',
  'sensorSource.ios.step2': 'Ava Bluefy ja luba Bluetoothi kasutamine.',
  'sensorSource.ios.step3': 'Mine Bluefys samale Libelli aadressile.',
  'sensorSource.ios.step4': 'Ava siin uuesti „Välisandur“ — see töötab nagu Androidis.',
  'sensorSource.ios.note':
    'Bluefy on kolmanda osapoole rakendus, mitte Libelli tehtud — rakenduse avamisel ' +
    'võib uuesti ühendamine vajada seal ühte käsitsi puudutust, selle asemel et toimuda märkamatult.',
  'sensorSource.ios.bluefyLink': 'Leia Bluefy App Store’ist',

  'sensorSource.detail.temperature': 'Temperatuur: {value}',
  'sensorSource.detail.notAvailable': 'Veel puudub',
  'sensorSource.lowBattery':
    '⚠ Patarei on tühjenemas ({value}) — vaheta peagi välisanduri patarei.',

  'sensorSource.install.now': 'Nulli kohe',
  'sensorSource.install.clear': 'Unusta nullpunkt',
  'sensorSource.install.status': 'Nullpunkt: piki {pitch}, risti {roll}.',
  'sensorSource.install.status.none':
    'Veel nullimata — välisandur mõõdab nii, nagu ta paigaldatud on.',

  'sensorSource.learn.h': 'Õpi paigaldus',
  'sensorSource.learn.intro':
    'Libell õpib suuna kahest tõstmisest: kõigepealt esiosa, siis parem külg.',
  'sensorSource.learn.start': 'Õpi paigaldus',
  'sensorSource.learn.step.front':
    'Tõsta sõiduki esiosa mõne sentimeetri võrra ja vajuta siis nuppu.',
  'sensorSource.learn.capture.front': 'Esiosa on üleval',
  'sensorSource.learn.step.right':
    'Lase esiosa uuesti alla. Nüüd tõsta paremat külge mõne sentimeetri võrra ja vajuta siis nuppu.',
  'sensorSource.learn.capture.right': 'Parem külg üleval',
  'sensorSource.learn.cancel': 'Tühista',
  'sensorSource.learn.status.learned': 'Paigaldus on õpitud.',
  'sensorSource.learn.status.none': 'Paigaldust pole õpitud — kasutatakse välisanduri enda suundi.',
  'sensorSource.learn.done': 'Valmis! Kontrolli: tõsta esiosa ja Libell peaks näitama tagarattaid.',
  'sensorSource.learn.err.tooSmall': 'Sõiduk vaevu liikus. Tõsta veidi rohkem ja proovi uuesti.',
  'sensorSource.learn.err.ambiguous':
    'Mõlemad suunad liikusid umbes sama palju. Tõsta ainult esiosa, siis ainult paremat külge ja proovi uuesti.',
  'sensorSource.learn.err.arrow':
    'Ükski nool ei osuta ettepoole. Pööra välisandurit nii, et üks selle nooltest osutaks ette, ja proovi uuesti.',
  'sensorSource.learn.err.mirrored':
    'Välisandur paistab olevat tagurpidi või tõsteti vale külge. Kontrolli ja proovi uuesti.',
  'sensorSource.learn.err.sameAxis':
    'Mõlemad tõstmised kallutasid samas suunas. Tõsta kõigepealt esiosa, siis parem külg ja proovi uuesti.',

  'sensorStatus.title': '{name} välisandur',
  'sensorStatus.reading': 'Kalle praegu: {value}',
  'sensorStatus.debug': 'Silumisteave',
  'sensorStatus.debug.intro':
    'Toorväärtused otse välisandurist — veaotsinguks, kui miski ei tööta.',
  'sensorStatus.debug.state': 'Ühenduse olek: {value}',
  'sensorStatus.debug.deviceId': 'Seadme ID: {value}',
  'sensorStatus.debug.lastSample': 'Viimane näit: {value}',
  'sensorStatus.debug.age': '{s} s tagasi',
  'sensorStatus.debug.rawAccel': 'Kiirendusanduri toorväärtused (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Püsivara põlvkond: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Olekubaidid (toored): {value}',
  'sensorStatus.debug.versionBytes': 'Seerianumber ja püsivara (toored): {value}',
  'sensorStatus.debug.copy': 'Kopeeri teave',
  'sensorStatus.debug.copied': 'Silumisteave kopeeritud!',
  'sensorStatus.debug.copy.failed': 'Automaatne kopeerimine ei õnnestunud.',
  'sensorStatus.advanced': 'Täpsemalt',
  'sensorStatus.silentReconnect.intro':
    'See brauser ei oska veel ise välisanduriga uuesti ühendust luua, seega pead pärast taaskäivitust selle loendist uuesti valima. Chrome’is saad selle ise sisse lülitada.',
  'sensorStatus.silentReconnect.steps':
    'Ava {address}, otsi „web bluetooth“, sea „Use the new permissions backend for Web Bluetooth“ väärtuseks Enabled ja puuduta Relaunch. Seejärel ühenda välisandur üks kord.',
  'sensorStatus.silentReconnect.copy': 'Kopeeri {address}',
  'sensorStatus.silentReconnect.copied': 'Kopeeritud — kleebi see Chrome’i aadressiribale.',
  'sensorStatus.debug.connectDelay.intro':
    'Katseline: proovi seda ainult siis, kui välisanduri ühendus on ebakindel. Lisab pärast ühendamist kindla pausi, enne kui rakendus hakkab sealt lugema.',
  'sensorStatus.debug.connectDelay.enable': 'Ühendamisviivitus sisse',
  'sensorStatus.debug.connectDelay.ms': 'Viivitus (ms)',

  'about.text':
    'Libell aitab sul matkaauto või haagissuvila loodi seada telefoniga, mis sul juba ' +
    'olemas on, ilma arvamata.',
  'about.version': 'Versioon {v}',
  'about.offline':
    'Töötab täielikult võrguühenduseta — võrku kasutatakse ainult rakenduse enda uuenduste laadimiseks.',
  'about.privacy':
    'Sinu seaded jäävad telefoni — pole kontot ega jälitamist. Libell saadab ainult anonüümseid arve selle kohta, kuidas rakendust kasutatakse, ja selle saad välja lülitada.',
  'about.source': 'Libell on tasuta ja avatud lähtekoodiga (MIT-litsents).',
  'about.source.link': 'Lähtekood GitHubis',
  'menu.privacy': 'Privaatsus',
  'menu.privacy.tab': 'Privaatsus',
  'privacy.stored.h': 'Selles telefonis salvestatud',
  'privacy.stored.empty': 'Midagi pole salvestatud.',
  'privacy.raw': 'Näita tooreid andmeid',
  'privacy.raw.hint': 'Täpselt nii, nagu salvestatud. Välisanduri parool on peidetud.',
  'privacy.resetSettings': 'Lähtesta ainult seaded',
  'privacy.deleteAll': 'Kustuta kõik Libelli andmed',
  'privacy.deleteAll.confirm':
    'Kas kustutada kõik, mida Libell on sellesse telefoni salvestanud? Sõidukid, mõõdud ja kalibreering kaovad ning Libell alustab uuesti nagu esimesel korral.',
  'privacy.deleteAll.yes': 'Jah, kustuta kõik',
  'privacy.deleteAll.cancel': 'Tühista',
  'stored.vehicle': 'Sõiduk',
  'stored.vehicle.detail': '{name}, teljevahe {wheelbase}',
  'stored.settings': 'Seaded',
  'stored.settings.detail': 'Mõõdud, kiilud, ühik, välimus ja heli',
  'stored.password': 'Välisanduri parool',
  'stored.language': 'Keel',
  'stored.phoneCalibration': 'Telefoni kalibreering',
  'stored.zero': 'Sõiduki nullpunkt',
  'stored.zeroTrim': 'Nullpunkti peenhäälestus',
  'stored.targets': 'Sihtasendid',
  'stored.targets.active': '{name} (valitud)',
  'stored.hitch': 'Haakekõrgus',
  'stored.rememberedBox': 'Meelde jäetud välisandur',
  'stored.notes': 'Rakenduse enda märkmed',
  'stored.notes.detail': 'Väikesed märked: {n}, näiteks kas tutvustust on näidatud',
  'stored.phone': 'Telefon',
  'stored.saved': 'salvestatud',
  'stored.counting.off': 'Välja lülitatud',
  'stored.savedOn': 'salvestatud {date}',

  'intro.h': 'Tere tulemast Libelli',
  'intro.how':
    'Pane telefon sõidukis lapiti ja Libell näitab, milliseid rattaid tõsta ja kui palju.',
  'intro.start': 'Alusta',
  'intro.later': 'Vaata enne ringi',
  'onboard.source.sensorIcon':
    'Välisanduri saad igal ajal ühendada üleval paremal oleva anduri ikooniga.',
  'counting.title': 'Anonüümne loendamine',
  'counting.intro': 'Libell loendab kasutust anonüümselt, et teaksime, mida parandada.',
  'counting.sent.h': 'Mida loendatakse',
  'counting.sent':
    'Et rakendus avati, milliseid funktsioone kasutatakse, milline andurimudel mõõdab (telefon või mudel nagu {boxes}), rakenduse versioon ja Libellis valitud keel.',
  'counting.notSent.h': 'Mida kunagi ei salvestata',
  'counting.notSent':
    'Sinu IP-aadressi, riiki, seadet, ekraani, operatsioonisüsteemi ega brauserit, sõiduki mõõte, sinu seadeid ega midagi muud sinu kohta. Loendamiseks ei salvestata telefoni midagi.',
  'counting.gpc': 'Kui su brauser palub veebisaitidel sind mitte jälgida, ei loenda Libell midagi.',
  'counting.later': 'Saad selle igal ajal välja lülitada: {help} › {tab}.',
  'counting.toggle': 'Loenda minu kasutust anonüümselt',
  'counting.dashboard': 'Vaata statistikat',
  'onboard.sound.h': 'Heli',
  'onboard.source.h': 'Millega soovid mõõta?',
  'onboard.source.intro':
    'Vali, millisest andurist Libell kallet loeb — enamik kasutab lihtsalt telefoni.',
  'onboard.source.phone': 'See telefon',
  'onboard.source.externalActive':
    'Praegu on aktiivne välisandur. Kui valid selle telefoni, jääb telefoni kalibreerimine vahele. Telefoni kalibreerimiseks ava välisandur üleval paremal oleva anduri ikooniga ja puuduta kõigepealt „{disconnect}“.',
  'onboard.vehicle.h': 'Mida sa loodid?',
  'onboard.vehicle.intro': 'Vali oma sõiduk — ülejäänud juhend kohandub selle järgi.',
  'onboard.step1.h': 'Aseta telefon nii',
  'onboard.next': 'Edasi',
  'onboard.back': 'Tagasi',
  'onboard.close': 'Sulge tutvustus',
  'onboard.done': 'Valmis',
  'onboard.skipStep': 'Jäta vahele',
  'onboard.note.measurements':
    'Kui jätad vahele, kasutatakse vaikimisi mõõte; {lamp} põleb, kuni salvestad enda omad.',
  'onboard.note.ramps':
    'Kui jätad vahele, kasutatakse vaikimisi kiile. Enda omad saad hiljem seadetes valida.',
  'onboard.note.calibrate':
    'Praegu pole tasast pinda? Puuduta „{next}“; {lamp} tuletab meelde, kuni see on tehtud.',
  'onboard.note.connect':
    'Välisandurit pole käepärast? Puuduta „{next}“ ja ühenda hiljem üleval paremal oleva anduri ikooniga.',
  'onboard.zeroLater':
    'Sõiduki nullid esimesel korral, kui pargid tasasele pinnale. {lamp} tuletab meelde, kuni see on tehtud.',
  'onboard.legend.ok': 'Roheline ✓ — see ratas on loodis.',
  'onboard.legend.up': 'Oranž ↑ — sõida selle rattaga näidatud astmele.',
  'onboard.legend.no': 'Punane ✕ — ükski aste ei piisa; liigu tasasemasse kohta.',
  'onboard.legend.dim': 'Hall – — selle ratta all pole kiilu; number näitab, kui palju puudu jääb.',
  'settings.wheelbase': 'Teljevahe',
  'settings.trackFront': 'Rööpmelaius ees',
  'settings.trackRear': 'Rööpmelaius taga',
  'settings.tolerance': 'Tolerants',
  'settings.stability': 'Stabiilsus',
  'settings.dwellRest': 'Reageerimisviivitus (ms)',
  'settings.dwellMotion': 'Reageerimisviivitus reguleerimisel (ms)',
  'settings.dwell.hint': 'Kui kaua peab näit püsima, enne kui number muutub.',
  'settings.vehicle': 'Sõiduk',
  'vehicle.motorhome': 'Matkaauto',
  'vehicle.caravan': 'Haagissuvila',
  'settings.axleToJockey': 'Teljest tugirattani',
  'settings.rearAxle': 'Tagatelg',
  'settings.axle': 'Telg',
  'axle.single': 'Üks telg',
  'axle.boggie': 'Tandemtelg (boogie)',
  'settings.track': 'Rööpmelaius',
  'settings.measureHint': 'Need on kirjas registreerimistunnistusel. Mõne cm viga ei loe.',
  'settings.measureHint.caravan': 'Mõõda teljest tugirattani. Mõne cm viga ei loe.',
  'settings.measureHint.boggie': 'Tandemtelje korral mõõda telgede paari keskkohani.',
  'settings.steps': 'Kiilu astmete kõrgused',
  'settings.steps.add': 'Lisa aste',
  'settings.steps.new': 'Uue astme kõrgus ({unit})',
  'settings.steps.remove': 'Eemalda {value}',
  'settings.ramp': 'Valmis kiil',
  'settings.ramp.custom': 'Oma komplekt',
  'settings.ramp.stepless': 'Astmeteta kiil',
  'settings.ramp.steplessModel': '{name} (astmeteta, max {max} mm)',
  'settings.stepless.max': 'Astmeteta kiil, max kõrgus',
  'settings.stepless.maxHeading': 'Max kõrgus',
  'settings.stepless.set': 'Salvesta',
  'settings.stepless.new': 'Max kõrgus ({unit})',
  'settings.rampCount': 'Kiilude arv',
  'settings.drain': 'Äravoolu pool',
  'settings.rampHint': 'Rakendus valib, kus sinu kiilud kõige rohkem aitavad.',
  'settings.drainHint':
    'Tolerantsi piires jäetakse see pool kõige madalamaks, et vesi ära voolaks.',
  'settings.section.vehicle': 'Sõiduk ja mõõdud',
  'settings.section.ramps': 'Kiilud',
  'settings.general': 'Üldine',
  'settings.language': 'Keel',
  'settings.language.auto': 'Automaatne (seadme keel)',
  'settings.tolerance.hint': 'Kui lähedal loodile loetakse sõiduk loodis olevaks.',
  'settings.stability.hint': 'Silub anduri väikest värinat, et numbrid ei vilguks.',
  'drain.none': 'Puudub / pole oluline',
  'drain.left': 'Vasak, keskel',
  'drain.right': 'Parem, keskel',
  'drain.front': 'Ees, keskel',
  'drain.rear': 'Taga, keskel',
  'drain.frontLeft': 'Ees vasakul',
  'drain.frontRight': 'Ees paremal',
  'drain.rearLeft': 'Taga vasakul',
  'drain.rearRight': 'Taga paremal',
  'settings.unit': 'Pikkuste ühik',
  'settings.unitInches': 'tollid (in)',
  'settings.theme': 'Teema',
  'theme.system': 'Nagu telefonis',
  'theme.light': 'Hele',
  'theme.dark': 'Tume',
  'settings.appearance': 'Välimus',
  'appearance.classic': 'Klassikaline',
  'appearance.modern': 'Moodne',
  'appearance.glossy': 'Läikiv',
  'settings.sound': 'Helin, kui loodis',
  'settings.soundGuidance': 'Pidev helijuhendamine',
  'settings.soundGuidance.help':
    'Piiks muutub kiiremaks ja kõrgemaks, mida lähemale loodile jõuad.',
  'settings.soundSpeech': 'Hääljuhendamine',
  'settings.soundSpeech.help':
    'Kui sõiduk seisab paigal, ütleb rakendus, milline ratas ja kui palju, näiteks „Vasak tagaratas, aste 2“.',
  'settings.soundSpeech.unavailable':
    'Hääljuhendamine ei tööta selles telefonis: sellel pole eestikeelset häält, mis töötaks võrguühenduseta. Helisignaalid töötavad nagu tavaliselt.',
  'speech.level': 'Loodis',
  'speech.inches': '{n} tolli',
  'speech.inchOne': 'üks toll',
  'speech.inchOneAnd': 'üks ja {fraction} tolli',
  'speech.inchesAnd': '{n} ja {fraction} tolli',
  'speech.inchFraction': '{fraction} tolli',
  'speech.eighth1': 'üks kaheksandik',
  'speech.eighth2': 'veerand',
  'speech.eighth3': 'kolm kaheksandikku',
  'speech.eighth4': 'pool',
  'speech.eighth5': 'viis kaheksandikku',
  'speech.eighth6': 'kolm veerandit',
  'speech.eighth7': 'seitse kaheksandikku',
  'settings.undo': 'Võta tagasi',
  'settings.saved': 'Salvestatud',
  'settings.more': 'Veel',
  'settings.fineTuning': 'Peenhäälestus',
  'settings.resetAll': 'Lähtesta kõik seaded',
  'settings.err.positive': 'Sisesta arv üle 0. Kehtib endine väärtus.',
  'settings.err.notNegative': 'Sisesta 0 või rohkem. Kehtib endine väärtus.',
  'settings.err.range': 'Sisesta arv vahemikus {min} kuni {max}. Kehtib endine väärtus.',

  'settings.tab.vehicle': 'Sõiduk',
  'settings.tab.ramps': 'Kiilud',
  'settings.tab.level': 'Loodis',
  'settings.klossar.brandAll': 'Kõik',
  'settings.klossar.changeRamp': 'Vaheta kiil',
  'settings.rampCountHint': 'Rakendus paneb need sinna, kus need kõige rohkem aitavad.',
  'settings.klossar.selected': 'Valitud',
  'settings.klossar.stepsHeading': 'Astmete kõrgused',

  'status.measuring': 'Mõõdan…',
  'status.almost': 'Peaaegu loodis — veel {left}',
  'status.cantLevel.close': 'Sinu kiilud jäävad siin napilt lühikeseks — liiguta sõidukit',
  'status.cantLevel.far': 'Sinu kiilud jäävad siin kaugelt lühikeseks — liiguta sõidukit',
  'adjustable.before': 'Sea kiilud näidatud astmele ja sõida siis peale.',
  'adjustable.after': 'Veel pole loodis. Sõida kiiludelt maha, siis rakendus mõõdab uuesti.',

  'calibration.intro':
    'Aseta telefon pinnale, mis on kindlasti loodis, ja puuduta „Kalibreeri kohe“. ' +
    'Praegusest kaldest saab nullpunkt.',
  'calibration.status': 'Kalibreeritud: piki {pitch}, risti {roll}.',
  'calibration.status.none': 'Kalibreerimata — kasutatakse anduri toorväärtusi.',
  'calibration.now': 'Kalibreeri kohe',
  'calibration.step.phone.done': 'Telefon kalibreeritud',
  'calibration.step.phone.hint': 'Aseta telefon millelegi tasasele.',
  'calibration.step.flipLink': 'Pole tasast pinda? Pööra telefoni',
  'calibration.step.vehicle.done': 'Nullitud',
  'calibration.step.vehicle.hint':
    'Loodi sõiduk vesiloodiga ja pane telefon oma tavalisele kohale.',
  'calibration.step.vehicle.now': 'Nulli kohe',
  'calibration.clear': 'Kustuta kalibreering',
  'calibration.err.notRunning': 'Kaldeandur ei tööta veel — puuduta kõigepealt põhikuval „Alusta“.',
  'calibration.warn.notFlat':
    'Kalibreering salvestati, kuid see ei paista tasane (üle 15°), seega on see tõenäoliselt vale. Polnud see, mida mõtlesid? Puuduta „Võta tagasi“, aseta telefon tasasele pinnale ja kalibreeri uuesti.',
  'calibration.undo': 'Võta tagasi',
  'calibration.sensor.h': 'Kalibreeri telefon',
  'calibration.vehicle.h': 'Nulli sõiduk',
  'calibration.vehicle.intro':
    'Kalibreerimine puudutab telefoni, mitte kohta, kus see lebab. Kui laud on veidi kaldu, näitab rakendus seda kallet. Loodi sõiduk üks kord vesiloodiga, pane telefon oma tavalisele kohale ja nulli.',
  'calibration.vehicle.now': 'Nulli kohe',
  'calibration.vehicle.clear': 'Unusta nullpunkt',
  'calibration.vehicle.status': 'Sõiduki nullpunkt: piki {pitch}, risti {roll}.',
  'calibration.vehicle.status.none': 'Sõiduki nullpunkt puudub — telefoni koht loetakse tasaseks.',
  'calibration.vehicle.warn.notFlat':
    'Nullpunkt salvestati, kuid see ei paista loodis olevat (üle 15°). Kas sõiduk polnud loodis? Puuduta „Võta tagasi“, loodi sõiduk ja nulli uuesti.',
  'calibration.age.today': '(täna)',
  'calibration.age.days': '({n} päeva tagasi)',
  'calibration.check': 'Kontrolli',
  'calibration.check.good': 'Endiselt korras — erinevus {off}°.',
  'calibration.check.off': 'Erinevus {off}° — kaalu uuesti kalibreerimist.',
  'calibration.vehicle.check.off': 'Erinevus {off}° — kaalu uuesti nullimist.',
  'calibration.check.none':
    'Veel pole kalibreeritud, seega pole midagi kontrollida. Aseta telefon loodis pinnale ja puuduta „{now}“.',
  'calibration.vehicle.check.none':
    'Nullpunkti veel pole, seega pole midagi kontrollida. Loodi sõiduk vesiloodiga ja puuduta „{now}“.',
  'calibration.flip.intro':
    'Pole loodis pinda käepärast? Kasuta pööramisega kalibreerimist: aseta telefon ükskõik kuhu ' +
    'enam-vähem tasasele pinnale, mõõda, pööra telefoni samal kohal pool pööret (180°), ' +
    'mõõda uuesti — pinna kalle tühistab end ise.',
  'calibration.flip.start': 'Kalibreeri pöörates',
  'calibration.flip.rotate':
    'Nüüd pööra telefoni samal kohal pool pööret (180°) ja puuduta „Mõõda“.',
  'calibration.flip.capture': 'Mõõda',
  'calibration.flip.done': 'Valmis! Sinu pind on {surface}° kaldu — see on tühistatud.',
  'calibration.flip.warn.moved':
    'Kalibreering salvestati, kuid kaks mõõtmist erinevad üle 15°. Kas telefon liikus? Puuduta „Võta tagasi“ ja alusta otsast.',
  'calibration.pill.notDone': 'TEGEMATA',
  'calibration.pill.done': 'TEHTUD',
  'calibration.pill.none': 'PUUDUB',

  'targets.normal': 'Tavaline (loodis)',
  'targets.name.placeholder': 'Nimi (nt „Duši äravool“)',
  'targets.name.label': 'Uue sihtasendi nimi',
  'targets.defaultName': 'Sihtasend {n}',
  'targets.add': 'Salvesta kalle sihtasendiks',
  'targets.delete': 'Kustuta {name}',
  'targets.warn.tooSteep':
    'Sihtasend salvestati, kuid see on tavalisest järsem (üle 15°). Polnud see, mida mõtlesid? Kustuta see ristiga ja salvesta uuesti.',
  'targets.badge': 'Sihtasend: {name}',

  'feedback.intro':
    'Leidsid probleemi või on sul idee? Täida see vorm ja puuduta nuppu — see avab ' +
    'GitHubis valmis aruande, mille sa seal postitad (vaja on tasuta GitHubi kontot, ' +
    'mille loomine võtab minuti).',
  'feedback.category': 'Millest see räägib?',
  'feedback.cat.bug': 'Viga',
  'feedback.cat.suggestion': 'Ettepanek',
  'feedback.cat.other': 'Muu',
  'feedback.title': 'Lühike pealkiri',
  'feedback.desc': 'Mis juhtus või mida sa soovid?',
  'feedback.submit': 'Ava aruanne GitHubis',
  'feedback.warn.title': 'Pealkiri on tühi — aruande saad siiski saata.',
  'feedback.warn.desc': 'Kirjeldus on tühi — aruande saad siiski saata.',
  'feedback.warn.both': 'Pealkiri ja kirjeldus on tühjad — aruande saad siiski saata.',

  'help.screen.h': 'Ekraani lugemine',
  'help.screen.lead':
    'Ekraan näitab, milliseid rattaid ja kui palju tõsta. Aste 2 tähendab sinu kiilu teist astet.',
  'help.screen.t':
    'Roheline ✓: valmis, midagi pole vaja teha.\n' +
    'Oranž ↑: sõida selle rattaga selle kõrval näidatud astmele.\n' +
    'Punane ✕: sinu kiiludest siin ei piisa. Liiguta sõidukit.\n' +
    'Hall –: selle ratta all pole kiilu. Number näitab, kui palju puudu jääb, kui tahad selle alla midagi muud panna.\n' +
    'Kui mull püsib keskel, oled loodis.',
  'help.screen.routine':
    'Sõida peale, oota, kuni sõiduk on paigal, ja vaata uuesti. Korda, kuni kõik rattad on rohelised.',
  'help.what.t':
    'Aseta telefon sõidukis lapiti, ülaserv ettepoole, iga kord samale kohale.\n' +
    'Välisanduri korral pole oluline, kuidas telefon lebab.',
  'help.settings.h': 'Mõõdud',
  'help.measures.h': 'Sisesta mõõdud',
  'help.settings.t':
    'Libell arvutab teljevahe ja rööpmelaiuse põhjal, kui palju iga ratast tuleb tõsta.\n' +
    'Need on kirjas sõiduki dokumentides või mõõda need mõõdulindiga.\n' +
    'Sisesta need mm, cm või tollides, vastavalt sellele, mille valisid seadega „Pikkuste ühik“.\n' +
    'Haagissuvila puhul on teljevahe kaugus teljest tugirattani.\n' +
    'Mitme sõiduki korral on igal oma mõõdud, kiilud, sõiduki nullpunkt, sihtasendid ja välisandur; vali sõiduk vahekaardi „Sõiduk“ ülaosas.',
  'help.ramps.t':
    'Ekraan ütleb, millisele kiilu astmele iga ratas sõidab, seega sisesta kiilud, mis sul kaasas on.\n' +
    'Vali valmis kiil või oma komplekt ja mitu sul neid on. Libell paneb need sinna, kus need kõige rohkem aitavad.\n' +
    'Astmeteta kiilu korral vali „Astmeteta kiil“ ja sisesta selle kõrgus. Ekraan näitab siis „Sõida peale“ ja kui kõrgele.',
  'help.calibration.h': 'Kalibreeri ja nulli',
  'help.calibration.t':
    'Kaks sammu teevad näidud õigeks: kalibreeri telefon üks kord ja nulli sõiduk üks kord.\n' +
    'Kalibreerimine: aseta telefon tasasele pinnale ja puuduta „Kalibreeri kohe“.\n' +
    'Nullimine: loodi sõiduk vesiloodiga, pane telefon oma tavalisele kohale ja puuduta „Nulli kohe“.\n' +
    'Välisanduri korral nullid välisanduri lehel. Seda pole vaja kalibreerida.\n' +
    'Ikka pole päris loodis? Peenhäälesta nullpunkti nuppudega „Vasak üles“, „Parem üles“, „Ees üles“ või „Taga üles“ kaardil „Nulli sõiduk“.\n' +
    'Märgutuli ⚠ Kalibreeri või ⚠ Nulli põleb, kuni see on tehtud.',
  'help.sensor.h': 'Välisandur',
  'help.sensor.t':
    'Sõidukisse paigaldatud välisandur saab telefoni asemel mõõta. Libell töötab nendega:\n' +
    '{upright}: seisab püsti, ükskõik mis suunas.\n' +
    '{flat}: lebab lapiti, kaas üleval, üks nool osutab ettepoole.\n' +
    'Ühenda üleval paremal oleva anduri ikooniga. Välisanduri leht juhatab sind seejärel läbi sammude „Vali suund“ ja „Nulli sõiduk“.\n' +
    'See töötab Androidis või arvutis Chrome’is või Edge’is. iPhone’is on vaja Bluefy brauserit.\n' +
    'Kui välisandur koodi tagasi lükkab, küsib Libell välisanduri neljakohalist koodi.',
  'help.targets.h': 'Sihtasendid ja heli',
  'help.targets.t':
    'Salvesta soovitud kalle, näiteks duši äravoolu suunas, ja vaheta nende vahel.\n' +
    'Haagissuvila: salvesta haakekõrgus enne lahtihaakimist ning „Tagasi haakekõrgusele“ juhatab tugiratta selle juurde tagasi.\n' +
    'Kui hääljuhendamine on sees, ütleb rakendus, millist ratast ja kui palju tõsta, nii et saad loodida telefoni nägemata.\n' +
    'Alumise riba keskmine nupp lülitab heli sisse ja välja.',
  'help.trouble.h': 'Kui miski on valesti',
  'help.trouble.t':
    '„Mõõdan…“: sõiduk kõigub. Oota, kuni see on paigal.\n' +
    '„Mõõtmiseks aseta telefon lapiti“: telefon on mõõtmiseks liiga kaldu.\n' +
    '„Ühendus välisanduriga kadus“: puuduta „Ühenda uuesti“ ja vali loendist välisandur.\n' +
    '„Ootan kaldeandurit…“: näite pole veel. iPhone’is puuduta iga kord rakendust avades „Alusta“; muidu laadi leht uuesti.\n' +
    '„Juurdepääs liikumisandmetele keelati“: luba brauseri seadetes sellele saidile liikumise ja asendi kasutamine ning laadi leht uuesti.\n' +
    'Ikka valesti? Kirjuta aruanne vahekaardil „Tagasiside“.',
  'help.open': 'Ava {name}',
  'help.open.sensor': 'Ava välisandur',
  'help.open.feedback': 'Kirjuta aruanne',

  'main.hint': 'Aseta telefon sõidukis lapiti, ülaserv sõiduki esiosa poole.',
  'main.start': 'Alusta',
  'main.waiting': 'Ootan kaldeandurit…',
  'main.level': 'Sinu sõiduk on loodis!',
  'main.denied':
    'Juurdepääs liikumisandmetele keelati, seega ei saa Libell kallet lugeda. ' +
    'Luba sellele saidile juurdepääs liikumisele ja asendile ning laadi leht uuesti.',
  'main.noSensors': 'See seade ei paku liikumisandureid, seega ei saa Libell kallet lugeda.',
  'main.https':
    'Libell vajab kaldeandurite lugemiseks turvalist ühendust (HTTPS). ' +
    'Ava rakendus HTTPS-i kaudu ja proovi uuesti.',

  'diagram.aria': 'Pealtvaade sinu matkaautost, mis näitab, milliseid rattaid tuleb tõsta',
  'diagram.caravan.aria': 'Pealtvaade sinu haagissuvilast, mis näitab telje rattaid ja tugiratast',
  'diagram.front': 'Ees',
  'diagram.step': 'Aste {n}',
  'diagram.driveUp': 'Sõida peale',
  'diagram.done': 'Valmis',
  'diagram.noRamp': 'Kiilu pole',
  'diagram.wheel.frontLeft': 'Vasak esiratas',
  'diagram.wheel.frontRight': 'Parem esiratas',
  'diagram.wheel.rearLeft': 'Vasak tagaratas',
  'diagram.wheel.rearRight': 'Parem tagaratas',
  'diagram.notEnough': 'ei piisa',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Keera üles',
  'caravan.crankDown': 'Keera alla',
  'caravan.axleLeft': 'Vasak telje ratas',
  'caravan.axleRight': 'Parem telje ratas',
  'caravan.jockeyWheel': 'Tugiratas',
  'help.screen.caravan':
    'Haagissuvila: tugiratta kaart ütleb „Keera üles“ või „Keera alla“ ja kui palju.',

  'vehicles.title': 'Sõidukid',
  'vehicles.defaultName': 'Minu sõiduk',
  'vehicles.numbered': 'Sõiduk {n}',
  'vehicles.name.placeholder': 'Nimi (nt „Haagissuvila“)',
  'vehicles.name.label': 'Sõiduki nimi',
  'vehicles.add': 'Uus sõiduk',
  'namePrompt.save': 'Salvesta',
  'namePrompt.cancel': 'Tühista',
  'choice.rename': 'Nimeta ümber {name}',
  'vehicles.badge': 'Sõiduk: {name}',
  'vehicles.delete': 'Eemalda {name}',
  'vehicles.remove.confirm':
    'Kas eemaldada {name} koos sõiduki nullpunkti, sihtasendite ja välisanduriga?',
  'vehicles.remove.yes': 'Jah, eemalda',
  'vehicles.hint':
    'Mõõdud, kiilud, sõiduki nullpunkt, sihtasendid ja välisandur kuuluvad sõidukile. Telefoni kalibreering on ühine.',
  'setup.incoming.addNew': 'Lisa uue sõidukina',

  'hitch.title': 'Haakekõrgus',
  'hitch.hint':
    'Salvesta see, kui haagissuvila on veel haakekuulil. Enne uuesti haakimist näitab tugiratas, kui palju keerata, et haakeseade jõuaks kuuli kõrgusele.',
  'hitch.save': 'Salvesta haakekõrgus',
  'hitch.go': 'Tagasi haakekõrgusele',
  'hitch.done': 'Valmis',
  'hitch.savedNow': 'Haakekõrgus salvestatud.',
  'hitch.status.none': 'Haakekõrgust pole veel salvestatud.',
  'hitch.status.saved': 'Haakekõrgus on salvestatud.',
  'hitch.status.active': 'Põhikuva näitab, kui palju tugiratast keerata.',
  'hitch.badge': 'Haakekõrgus',
  'hitch.badge.aria': 'Haakekõrgus: puuduta, et taas tavapäraselt loodida',
  'hitch.crank.up': 'Keera {amount} üles haakekõrgusele',
  'hitch.crank.down': 'Keera {amount} alla haakekõrgusele',
  'hitch.reached': 'Haakekõrgusel',
  'hitch.offer': 'Kas salvestada enne haakekõrgus?',
  'hitch.offer.save': 'Salvesta',
  'hitch.offer.dismiss': 'Hiljem',

  'zeroTrim.title': 'Peenhäälesta nullpunkti',
  'zeroTrim.hint':
    'Ikka pole päris loodis? Iga puudutus nihutab nullpunkti 0,1°, nii et rakendus tahab seda poolt kõrgemale.',
  'zeroTrim.left': 'Vasak üles',
  'zeroTrim.right': 'Parem üles',
  'zeroTrim.front': 'Ees üles',
  'zeroTrim.back': 'Taga üles',
  'zeroTrim.side.left': 'Vasak',
  'zeroTrim.side.right': 'Parem',
  'zeroTrim.side.front': 'Ees',
  'zeroTrim.side.back': 'Taga',
  'zeroTrim.total': 'Peenhäälestatud: {trim}',
  'zeroTrim.none': 'Peenhäälestamata',
  'zeroTrim.reset': 'Lähtesta peenhäälestus',
  'tilt.frontBack': 'Piki',
  'tilt.sideSide': 'Risti',

  'pose.layFlat': 'Mõõtmiseks aseta telefon lapiti',
  'pose.sensorHint': 'See mõõdab õigesti ainult lapiti, pealmine pool üleval.',
  'pose.openSensorPage': 'Ava välisandur',
  'pose.sensorExtreme': 'Välisandur on liiga kaldu',
  'pose.sensorUpsideDown': 'Välisandur paistab olevat tagurpidi',
  'pose.sensorNotUpright': 'Välisandur lebab pikali',
  'pose.sensorHintUpright': 'See mõõdab õigesti ainult püsti seistes.',
  'calibration.external.h': 'Nulli sõiduk',
  'calibration.external.intro': 'Loodi sõiduk üks kord vesiloodiga ja nulli siis.',
  'calibration.external.phoneHidden':
    'Telefoni enda kalibreerimine on peidetud, kuni välisandur mõõdab. Telefoni kalibreerimiseks ava välisandur ja puuduta kõigepealt „{disconnect}“.',
  'calibration.external.working': 'Nullin…',
  'calibration.external.done': '{name} on nullitud: see asend loetakse nüüd loodis olevaks.',
  'calibration.external.err.notConnected': '{name} pole ühendatud. Ühenda see ja proovi uuesti.',
  'calibration.external.err.failed':
    '{name} nullimine ei õnnestunud. Midagi ei muudetud. Kontrolli ühendust ja proovi uuesti.',
  'pose.portrait': 'Pööra telefon püstpaigutusse — ülaserv peab osutama ettepoole',

  'stale.dataUnavailable': 'Uusi anduriandmeid pole — juhendamine on peatatud, kuni need naasevad',

  'sensorFallback.lost': 'Ühendus välisanduriga kadus',
  'sensorFallback.autoRetry': 'Proovin automaatselt uuesti…',
  'sensorFallback.connect': 'Ühenda välisandur',
  'sensorFallback.pick': 'Puuduta ja vali loendist oma välisandur.',
  'sensorFallback.notFound': 'Välisandurit ei leitud? Kontrolli, et see on sees ja lähedal.',
  'sensorFallback.retry': 'Ühenda uuesti',
  'sensorFallback.usePhone': 'Kasuta telefoni',
  'mounting.prompt.upright': 'Puuduta suunda, kuhu välisanduri tagakülg (kruvikinnitus) osutab.',
  'mounting.prompt.arrow':
    'Üks välisanduri nooltest (kaanel või selle all oleval trükkplaadil) osutab ettepoole. Milline külg on sõiduki esiosa poole?',
  'mounting.placement.wide': 'Pikk külg ees',
  'mounting.placement.short': 'Lühike külg ees',
  'mounting.facing.front': 'Osutab ette',
  'mounting.facing.right': 'Osutab paremale',
  'mounting.facing.rear': 'Osutab taha',
  'mounting.facing.left': 'Osutab vasakule',
  'box.state.connected': 'Ühendatud',
  'box.state.lost': 'Ühendus kadus',
  'box.state.password': 'Vale parool',
  'box.password.label': 'Välisanduri kood',
  'box.password.retry': 'Proovi uuesti',
  'box.password.checking': 'Proovin koodi…',
  'box.password.invalid': 'Kood on neljakohaline.',
  'box.password.wrong': 'Välisandur ei aktsepteerinud ka seda koodi.',
  'box.password.noAnswer':
    'Välisandur ei vastanud. Kood on salvestatud ja seda proovitakse järgmisel ühendamisel.',
  'box.state.notConnected': 'Ühendamata',
  'box.state.battery': 'patarei {value}',
  'box.connect': 'Ühenda',
  'box.step.position.upright.ok': 'Seisab püsti',
  'box.step.position.upright.bad': 'Lebab pikali: aseta see püsti, ükskõik mis suunas',
  'box.step.position.flat.ok': 'Lebab lapiti',
  'box.step.position.flat.bad': 'Liiga kaldu: aseta see lapiti, pealmine pool üleval',
  'box.step.position.flat.upsideDown':
    'Tagurpidi: pööra see kaas üles. Tootja ei soovita seda tagurpidi paigaldada.',
  'box.step.position.waiting': 'Asend: ootan näitu',
  'box.step.direction.todo': 'Vali suund',
  'box.step.direction.done': 'Suund määratud',
  'box.step.direction.learn': 'Pole kindel? Õpi see esiosa tõstes',
  'box.step.zero.todo': 'Nulli sõiduk',
  'box.step.zero.done': 'Nullitud',
  'box.step.zero.hint': 'Loodi sõiduk vesiloodiga ja nulli siis.',
  'box.forgetDirection': 'Unusta suund',
  'onboard.boxPosition.h': 'Välisanduri asend',
  'onboard.boxPosition.later':
    'Suund ja nullpunkt määratakse esimesel parkimisel. Välisanduri leht juhatab sind ning märgutuli ⚠ Nulli tuletab meelde, kuni see on tehtud.',
  'onboard.boxPosition.notConnected':
    'Ühtegi välisandurit pole veel ühendatud, seega ei saa selle asendit näidata. Puuduta „{next}“ ja ühenda hiljem üleval paremal oleva anduri ikooniga.',
  'sensorList.title': 'Välisandur',
  'sensorList.phone': 'Kui välisandurit pole ühendatud, kasutatakse telefoni enda andurit.',
  'box.step.zero.again': 'Nulli uuesti',
};
