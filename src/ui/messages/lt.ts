import type { Messages } from './en';

/** Lithuanian (Lietuvių). */
export const lt: Messages = {
  'topbar.install': 'Įdiegti',
  'topbar.share': 'Bendrinti Libell',
  'bottombar.settings': 'Nustatymai',
  'bottombar.sound.mute': 'Išjungti garsą',
  'bottombar.sound.unmute': 'Įjungti garsą',
  'bottombar.help': 'Pagalba',
  'bottombar.label': 'Veiksmai',
  'share.text': 'Išlyginkite savo kemperį ar karavaną telefonu.',
  'share.copied': 'Nuoroda nukopijuota!',
  'update.check': 'Patikrinti, ar yra nauja versija',
  'update.checking': 'Ieškoma atnaujinimų…',
  'update.updating': 'Atnaujinama į naują versiją…',
  'update.latest': 'Naudojate naujausią versiją',
  'update.offline': 'Nėra ryšio, negalima patikrinti atnaujinimų',
  'update.unsupported': 'Atnaujinimai čia nepasiekiami',
  'install.hint': 'Palieskite „Bendrinti“, tada „Įtraukti į pradžios ekraną“.',
  'install.row': 'Įdiekite Libell kaip programėlę pradžios ekrane.',
  'install.close': 'Slėpti',
  'share.vehicle.text': 'Mano transporto priemonės nustatymai Libell — matmenys ir pakylos.',
  'settings.shareVehicle': 'Siųsti į kitą telefoną',
  'setup.incoming.h': 'Gauti transporto priemonės nustatymai',
  'setup.incoming.intro': 'Šeimos narys pasidalijo su jumis šiais transporto priemonės matmenimis:',
  'setup.incoming.reminder':
    'Kalibravimas čia neįtrauktas — šį telefoną vis tiek reikės sukalibruoti.',
  'setup.incoming.apply': 'Pakeisti esamą',
  'setup.incoming.dismiss': 'Ne dabar',
  'setup.incoming.invalid':
    'Nepavyko perskaityti transporto priemonės nustatymų nuorodos — niekas nepakeista.',

  'lamp.setup': '⚠ Matmenys',
  'lamp.setup.title':
    'Transporto priemonės matmenys dar neišsaugoti — palieskite ir atsidarys „Nustatymai“',
  'lamp.calibrate': '⚠ Kalibruoti',
  'lamp.zero': '⚠ Nulinti',
  'lamp.calibrate.title':
    'Telefonas nesukalibruotas — palieskite ir atsidarys „Kalibruoti ir nulinti“',
  'lamp.zero.title':
    'Transporto priemonė nenulinta — palieskite ir atsidarys „Kalibruoti ir nulinti“',
  'lamp.calibrate.title.sensor': 'Dėžutė nenulinta — palieskite ir atsidarys dėžutės puslapis',

  'sensorStatus.connected': 'Jutiklio dėžutė prijungta',
  'sensorStatus.disconnected':
    'Jutiklio dėžutė — ryšys prarastas, palieskite dėl išsamesnės informacijos',
  'sensorStatus.stale':
    'Jutiklio dėžutė — naujų duomenų nėra, palieskite dėl išsamesnės informacijos',
  'sensorStatus.idle': 'Jutiklio dėžutė — palieskite, kad prijungtumėte',
  'sensorStatus.idle.guide': 'Jutiklio dėžutė — palieskite, kad atvertumėte iPhone sąrankos vadovą',

  'menu.title': 'Meniu',
  'menu.close': 'Uždaryti meniu',
  'menu.settings': 'Nustatymai',
  'menu.calibration': 'Kalibruoti ir nulinti',
  'menu.targets': 'Tikslai',
  'menu.feedback': 'Atsiliepimai',
  'menu.help': 'Pagalba',
  'menu.intro': 'Rodyti įvadą',
  'menu.about': 'Apie Libell',
  'menu.about.tab': 'Apie',
  'menu.sensorSource': 'Jutiklio dėžutė',

  'sensorSource.connect': 'Prijungti {name} jutiklį',
  'sensorSource.disconnect': 'Atjungti',
  'sensorSource.status.connecting': 'Jungiamasi…',
  'sensorSource.err.unsupported': 'Ši naršyklė nepalaiko Web Bluetooth.',
  'sensorSource.unsupported.browser':
    'Norėdami prijungti jutiklio dėžutę, atidarykite Libell naršyklėje Chrome arba Edge, Android telefone ar kompiuteryje. Paties telefono jutiklis čia veikia kaip įprasta.',
  'sensorSource.err.password':
    'Dėžutė {name} nepriėmė savo slaptažodžio. Žemiau įveskite dėžutės keturių skaitmenų kodą ir palieskite „Bandyti vėl“. Gamyklinis kodas yra 0000. Jei kodo nežinote, pakeiskite jį programėlėje Xparkle.',
  'sensorSource.err.failed': 'Nepavyko prisijungti prie {name} jutiklio.',

  'sensorSource.ios.intro':
    'Safari negali tiesiogiai prisijungti prie Bluetooth jutiklių, bet yra išeitis:',
  'sensorSource.ios.step1': 'Įdiekite „Bluefy – Web Bluetooth Browser“ iš App Store.',
  'sensorSource.ios.step2': 'Atidarykite Bluefy ir leiskite naudoti Bluetooth.',
  'sensorSource.ios.step3': 'Bluefy naršyklėje atidarykite tą patį Libell adresą.',
  'sensorSource.ios.step4':
    'Čia vėl atidarykite „Jutiklio dėžutė“ — viskas veiks kaip Android telefone.',
  'sensorSource.ios.note':
    'Bluefy yra trečiosios šalies programėlė, ne Libell kūrinys — atidarius programėlę, ' +
    'pakartotiniam prisijungimui ten gali prireikti vieno rankinio palietimo, užuot jungiantis savaime.',
  'sensorSource.ios.bluefyLink': 'Rasti Bluefy App Store',

  'sensorSource.detail.temperature': 'Temperatūra: {value}',
  'sensorSource.detail.notAvailable': 'Dar nėra',
  'sensorSource.lowBattery':
    '⚠ Senka baterija ({value}) — verta netrukus pakeisti jutiklio dėžutės bateriją.',

  'sensorSource.install.now': 'Nulinti dabar',
  'sensorSource.install.clear': 'Pamiršti nulį',
  'sensorSource.install.status': 'Nulis: išilgai {pitch}, skersai {roll}.',
  'sensorSource.install.status.none': 'Dar nenulinta — dėžutė matuoja taip, kaip pritvirtinta.',

  'sensorSource.learn.h': 'Atpažinti montavimą',
  'sensorSource.learn.intro':
    'Libell atpažįsta kryptį iš dviejų pakėlimų: pirmiausia priekio, tada dešiniojo šono.',
  'sensorSource.learn.start': 'Atpažinti montavimą',
  'sensorSource.learn.step.front':
    'Pakelkite transporto priemonės priekį keliais centimetrais, tada paspauskite mygtuką.',
  'sensorSource.learn.capture.front': 'Priekis pakeltas',
  'sensorSource.learn.step.right':
    'Vėl nuleiskite priekį. Dabar pakelkite dešinįjį šoną keliais centimetrais, tada paspauskite mygtuką.',
  'sensorSource.learn.capture.right': 'Dešinysis šonas pakeltas',
  'sensorSource.learn.cancel': 'Atšaukti',
  'sensorSource.learn.status.learned': 'Montavimas atpažintas.',
  'sensorSource.learn.status.none': 'Montavimas neatpažintas — naudojamos pačios dėžutės kryptys.',
  'sensorSource.learn.done':
    'Atlikta! Patikrinkite: pakelkite priekį, ir Libell turėtų nurodyti galinius ratus.',
  'sensorSource.learn.err.tooSmall':
    'Transporto priemonė beveik nepajudėjo. Pakelkite šiek tiek daugiau ir bandykite dar kartą.',
  'sensorSource.learn.err.ambiguous':
    'Abi kryptys pakrypo panašiai. Pakelkite tik priekį, tada tik dešinįjį šoną, ir bandykite dar kartą.',
  'sensorSource.learn.err.arrow':
    'Nė viena rodyklė nerodo į priekį. Pasukite dėžutę taip, kad viena jos rodyklė rodytų į priekį, ir bandykite dar kartą.',
  'sensorSource.learn.err.mirrored':
    'Atrodo, kad dėžutė apversta arba pakeltas ne tas šonas. Patikrinkite ir bandykite dar kartą.',
  'sensorSource.learn.err.sameAxis':
    'Abu pakėlimai pakreipė ta pačia kryptimi. Pirmiausia pakelkite priekį, tada dešinįjį šoną, ir bandykite dar kartą.',

  'sensorStatus.title': 'Jutiklis {name}',
  'sensorStatus.reading': 'Dabartinis polinkis: {value}',
  'sensorStatus.debug': 'Derinimo informacija',
  'sensorStatus.debug.intro':
    'Neapdorotos reikšmės tiesiai iš dėžutės — trikčių šalinimui, jei kas nors neveikia.',
  'sensorStatus.debug.state': 'Ryšio būsena: {value}',
  'sensorStatus.debug.deviceId': 'Įrenginio ID: {value}',
  'sensorStatus.debug.lastSample': 'Paskutinis matavimas: {value}',
  'sensorStatus.debug.age': 'prieš {s} s',
  'sensorStatus.debug.rawAccel': 'Neapdorotas akselerometras (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Mikroprogramos lygis: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Neapdoroti būsenos baitai: {value}',
  'sensorStatus.debug.versionBytes': 'Serijos numeris ir mikroprograma (neapdoroti): {value}',
  'sensorStatus.debug.copy': 'Kopijuoti duomenis',
  'sensorStatus.debug.copied': 'Derinimo informacija nukopijuota!',
  'sensorStatus.debug.copy.failed': 'Nepavyko nukopijuoti automatiškai.',
  'sensorStatus.advanced': 'Išplėstiniai',
  'sensorStatus.silentReconnect.intro':
    'Ši naršyklė dar negali pati iš naujo prisijungti prie dėžutės, todėl po paleidimo iš naujo ją reikia vėl pasirinkti sąraše. Chrome naršyklėje tai galite įjungti patys.',
  'sensorStatus.silentReconnect.steps':
    'Atidarykite {address}, ieškokite „web bluetooth“, nustatykite „Use the new permissions backend for Web Bluetooth“ į Enabled ir palieskite Relaunch. Tada vieną kartą prijunkite dėžutę.',
  'sensorStatus.silentReconnect.copy': 'Kopijuoti {address}',
  'sensorStatus.silentReconnect.copied': 'Nukopijuota — įklijuokite į Chrome adreso juostą.',
  'sensorStatus.debug.connectDelay.intro':
    'Eksperimentinė funkcija: bandykite tik tada, jei dėžutės ryšys nepatikimas. Po prisijungimo prideda fiksuotą pauzę, prieš programėlei pradedant skaityti duomenis.',
  'sensorStatus.debug.connectDelay.enable': 'Įjungti prisijungimo delsą',
  'sensorStatus.debug.connectDelay.ms': 'Delsa (ms)',

  'about.text':
    'Libell padeda išlyginti kemperį ar karavaną jau turimu telefonu, ' + 'be jokio spėliojimo.',
  'about.version': 'Versija {v}',
  'about.offline':
    'Veikia visiškai be interneto — tinklas naudojamas tik pačios programėlės atnaujinimams atsisiųsti.',
  'about.privacy':
    'Jūsų nustatymai lieka telefone — jokios paskyros ir jokio sekimo. Libell siunčia tik anoniminius skaičius apie tai, kaip naudojama programėlė, ir tai galite išjungti.',
  'about.source': 'Libell yra nemokama atvirojo kodo programėlė (MIT licencija).',
  'about.source.link': 'Šaltinio kodas GitHub',
  'menu.privacy': 'Privatumas',
  'menu.privacy.tab': 'Privatumas',
  'privacy.stored.h': 'Išsaugota šiame telefone',
  'privacy.stored.empty': 'Nieko neišsaugota.',
  'privacy.raw': 'Rodyti neapdorotus duomenis',
  'privacy.raw.hint': 'Tiksliai taip, kaip išsaugota. Dėžutės slaptažodis paslėptas.',
  'privacy.resetSettings': 'Atkurti tik nustatymus',
  'privacy.deleteAll': 'Ištrinti visus Libell duomenis',
  'privacy.deleteAll.confirm':
    'Ištrinti viską, ką Libell išsaugojo šiame telefone? Transporto priemonės, matmenys ir kalibravimas dings, o Libell pradės iš naujo kaip pirmą kartą.',
  'privacy.deleteAll.yes': 'Taip, ištrinti viską',
  'privacy.deleteAll.cancel': 'Atšaukti',
  'stored.vehicle': 'Transporto priemonė',
  'stored.vehicle.detail': '{name}, ratų bazė {wheelbase}',
  'stored.settings': 'Nustatymai',
  'stored.settings.detail': 'Matmenys, pakylos, vienetai, išvaizda ir garsas',
  'stored.password': 'Jutiklio dėžutės slaptažodis',
  'stored.language': 'Kalba',
  'stored.phoneCalibration': 'Telefono kalibravimas',
  'stored.zero': 'Transporto priemonės nulis',
  'stored.zeroTrim': 'Nulio patikslinimas',
  'stored.targets': 'Tikslai',
  'stored.targets.active': '{name} (pasirinktas)',
  'stored.hitch': 'Prikabinimo aukštis',
  'stored.rememberedBox': 'Įsiminta jutiklio dėžutė',
  'stored.notes': 'Pačios programėlės pastabos',
  'stored.notes.detail': 'Smulkios žymos: {n}, pvz., ar įvadas jau parodytas',
  'stored.phone': 'Telefonas',
  'stored.saved': 'išsaugota',
  'stored.counting.off': 'Išjungtas',
  'stored.savedOn': 'išsaugota {date}',

  'intro.h': 'Sveiki atvykę į Libell',
  'intro.how':
    'Padėkite telefoną transporto priemonėje gulsčiai, ir Libell parodys, kuriuos ratus pakelti ir kiek.',
  'intro.start': 'Pradėti',
  'intro.later': 'Pirma apsižvalgyti',
  'onboard.source.sensorIcon':
    'Jutiklio dėžutę bet kada galima prijungti jutiklio piktograma viršuje dešinėje.',
  'counting.title': 'Anoniminis skaičiavimas',
  'counting.intro': 'Libell anonimiškai skaičiuoja naudojimą, kad žinotume, ką tobulinti.',
  'counting.sent.h': 'Kas skaičiuojama',
  'counting.sent':
    'Kad programėlė buvo atidaryta, kokios funkcijos naudojamos, koks jutiklio modelis matuoja (telefonas ar modelis, pvz., {boxes}), programėlės versija ir Libell programėlėje pasirinkta kalba.',
  'counting.notSent.h': 'Kas niekada nesaugoma',
  'counting.notSent':
    'Jūsų IP adresas, šalis, įrenginys, ekranas, operacinė sistema ar naršyklė, transporto priemonės matmenys, jūsų nustatymai ar bet kas kita apie jus. Skaičiavimui telefone nieko nesaugoma.',
  'counting.gpc': 'Jei jūsų naršyklė prašo svetainių jūsų nesekti, Libell nieko neskaičiuoja.',
  'counting.later': 'Bet kada galite jį išjungti: {help} › {tab}.',
  'counting.toggle': 'Anonimiškai skaičiuoti mano naudojimą',
  'counting.dashboard': 'Peržiūrėti statistiką',
  'onboard.sound.h': 'Garsas',
  'onboard.source.h': 'Kuo norite matuoti?',
  'onboard.source.intro':
    'Pasirinkite, iš kurio jutiklio Libell turi skaityti polinkį — dauguma tiesiog naudoja telefoną.',
  'onboard.source.phone': 'Šis telefonas',
  'onboard.source.externalActive':
    'Dabar aktyvi jutiklio dėžutė. Pasirinkus šį telefoną, telefono kalibravimas praleidžiamas. Norėdami sukalibruoti telefoną, pirmiausia atidarykite dėžutę jutiklio piktograma viršuje dešinėje ir palieskite „{disconnect}“.',
  'onboard.vehicle.h': 'Ką lyginate?',
  'onboard.vehicle.intro':
    'Pasirinkite transporto priemonę — likusi vadovo dalis bus pritaikyta jai.',
  'onboard.step1.h': 'Padėkite telefoną taip',
  'onboard.next': 'Toliau',
  'onboard.back': 'Atgal',
  'onboard.close': 'Uždaryti įvadą',
  'onboard.done': 'Baigti',
  'onboard.skipStep': 'Praleisti',
  'onboard.note.measurements':
    'Praleidus bus naudojami numatytieji matmenys; {lamp} švies, kol išsaugosite savo.',
  'onboard.note.ramps':
    'Praleidus bus naudojamos numatytosios pakylos. Savąsias galėsite pasirinkti vėliau nustatymuose.',
  'onboard.note.calibrate':
    'Šiuo metu nėra lygaus paviršiaus? Palieskite {next}; {lamp} primins, kol tai atliksite.',
  'onboard.note.connect':
    'Dėžutės nėra po ranka? Palieskite {next} ir prijunkite vėliau jutiklio piktograma viršuje dešinėje.',
  'onboard.zeroLater':
    'Transporto priemonę nulinsite, kai pirmą kartą pastatysite ją ant lygaus pagrindo. {lamp} primins, kol tai atliksite.',
  'onboard.legend.ok': 'Žalia ✓ — tas ratas lygus.',
  'onboard.legend.up': 'Oranžinė ↑ — užvažiuokite tuo ratu ant nurodytos pakopos.',
  'onboard.legend.no': 'Raudona ✕ — jokios pakopos nepakanka; pervažiuokite į lygesnę vietą.',
  'onboard.legend.dim': 'Pilka – — prie to rato nėra pakylos; skaičius rodo, kiek trūksta.',
  'settings.wheelbase': 'Ratų bazė',
  'settings.trackFront': 'Priekio vėžė',
  'settings.trackRear': 'Galo vėžė',
  'settings.tolerance': 'Tolerancija',
  'settings.stability': 'Stabilumas',
  'settings.dwellRest': 'Reakcijos delsa (ms)',
  'settings.dwellMotion': 'Reakcijos delsa reguliuojant (ms)',
  'settings.dwell.hint': 'Kiek laiko rodmuo turi išsilaikyti, kol pasikeis skaičius.',
  'settings.vehicle': 'Transporto priemonė',
  'vehicle.motorhome': 'Kemperis',
  'vehicle.caravan': 'Karavanas',
  'settings.axleToJockey': 'Nuo ašies iki atraminio ratuko',
  'settings.rearAxle': 'Galinė ašis',
  'settings.axle': 'Ašis',
  'axle.single': 'Viena',
  'axle.boggie': 'Dviguba (tandemas)',
  'settings.track': 'Vėžė',
  'settings.measureHint': 'Juos rasite registracijos liudijime. Keli cm paklaidos nesvarbu.',
  'settings.measureHint.caravan':
    'Matuokite nuo ašies iki atraminio ratuko. Keli cm paklaidos nesvarbu.',
  'settings.measureHint.boggie': 'Esant dvigubai ašiai, matuokite iki ašių poros vidurio.',
  'settings.steps': 'Pakylos pakopų aukščiai',
  'settings.steps.add': 'Pridėti pakopą',
  'settings.steps.new': 'Naujos pakopos aukštis ({unit})',
  'settings.steps.remove': 'Pašalinti {value}',
  'settings.ramp': 'Gamyklinė pakyla',
  'settings.ramp.custom': 'Savas rinkinys',
  'settings.ramp.stepless': 'Bepakopis pleištas',
  'settings.ramp.steplessModel': '{name} (bepakopis, maks. {max} mm)',
  'settings.stepless.max': 'Bepakopis pleištas, maks. aukštis',
  'settings.stepless.maxHeading': 'Maks. aukštis',
  'settings.stepless.set': 'Išsaugoti',
  'settings.stepless.new': 'Maks. aukštis ({unit})',
  'settings.rampCount': 'Pakylų skaičius',
  'settings.drain': 'Nutekėjimo pusė',
  'settings.rampHint': 'Programėlė parenka, kur pakylos naudingiausios.',
  'settings.drainHint': 'Tolerancijos ribose ši pusė paliekama žemiausia, kad nutekėtų vanduo.',
  'settings.section.vehicle': 'Transporto priemonė ir matmenys',
  'settings.section.ramps': 'Pakylos',
  'settings.general': 'Bendrieji',
  'settings.language': 'Kalba',
  'settings.language.auto': 'Automatiškai (įrenginio kalba)',
  'settings.tolerance.hint': 'Koks nuokrypis nuo lygumo dar laikomas lygiu.',
  'settings.stability.hint': 'Išlygina smulkų jutiklio drebėjimą, kad skaičiai nemirgėtų.',
  'drain.none': 'Nėra / nesvarbu',
  'drain.left': 'Kairė, vidurys',
  'drain.right': 'Dešinė, vidurys',
  'drain.front': 'Priekis, vidurys',
  'drain.rear': 'Galas, vidurys',
  'drain.frontLeft': 'Priekyje kairėje',
  'drain.frontRight': 'Priekyje dešinėje',
  'drain.rearLeft': 'Gale kairėje',
  'drain.rearRight': 'Gale dešinėje',
  'settings.unit': 'Ilgius rodyti',
  'settings.unitInches': 'coliai (in)',
  'settings.theme': 'Tema',
  'theme.system': 'Kaip telefone',
  'theme.light': 'Šviesi',
  'theme.dark': 'Tamsi',
  'settings.appearance': 'Išvaizda',
  'appearance.classic': 'Klasikinė',
  'appearance.modern': 'Moderni',
  'appearance.glossy': 'Blizgi',
  'settings.sound': 'Signalas, kai lygu',
  'settings.soundGuidance': 'Nuolatinis garsinis vedimas',
  'settings.soundGuidance.help': 'Pyptelėjimai greitėja ir aukštėja, kuo arčiau lygumo.',
  'settings.soundSpeech': 'Balsinis vedimas',
  'settings.soundSpeech.help':
    'Kai transporto priemonė stovi vietoje, programėlė pasako, kurį ratą ir kiek kelti, pavyzdžiui, „Galinis kairysis, Pakopa 2“.',
  'settings.soundSpeech.unavailable':
    'Balsinis vedimas šiame telefone neveikia: jame nėra lietuviško balso, veikiančio be interneto. Garsiniai signalai veikia kaip įprasta.',
  'speech.level': 'Lygu',
  'speech.inches': '{n} coliai',
  'speech.inchOne': 'vienas colis',
  'speech.inchOneAnd': 'vienas ir {fraction} colio',
  'speech.inchesAnd': '{n} ir {fraction} colio',
  'speech.inchFraction': '{fraction} colio',
  'speech.eighth1': 'viena aštuntoji',
  'speech.eighth2': 'ketvirtis',
  'speech.eighth3': 'trys aštuntosios',
  'speech.eighth4': 'pusė',
  'speech.eighth5': 'penkios aštuntosios',
  'speech.eighth6': 'trys ketvirtadaliai',
  'speech.eighth7': 'septynios aštuntosios',
  'settings.undo': 'Anuliuoti',
  'settings.saved': 'Išsaugota',
  'settings.more': 'Daugiau',
  'settings.fineTuning': 'Smulkus reguliavimas',
  'settings.resetAll': 'Atkurti visus nustatymus',
  'settings.err.positive': 'Įveskite skaičių, didesnį už 0. Galioja ankstesnė reikšmė.',
  'settings.err.notNegative': 'Įveskite 0 arba daugiau. Galioja ankstesnė reikšmė.',
  'settings.err.range': 'Įveskite skaičių nuo {min} iki {max}. Galioja ankstesnė reikšmė.',

  'settings.tab.vehicle': 'Transporto priemonė',
  'settings.tab.ramps': 'Pakylos',
  'settings.tab.level': 'Lygis',
  'settings.klossar.brandAll': 'Visos',
  'settings.klossar.changeRamp': 'Keisti pakylą',
  'settings.rampCountHint': 'Programėlė jas padeda ten, kur jos naudingiausios.',
  'settings.klossar.selected': 'Pasirinkta',
  'settings.klossar.stepsHeading': 'Pakopų aukščiai',

  'status.measuring': 'Matuojama…',
  'status.almost': 'Beveik lygu — liko {left}',
  'status.cantLevel.close':
    'Pakylų čia beveik pakanka, bet ne visai — perstatykite transporto priemonę',
  'status.cantLevel.far': 'Pakylų čia toli gražu nepakanka — perstatykite transporto priemonę',
  'adjustable.before': 'Nustatykite pakylas ant rodomos pakopos ir tada užvažiuokite.',
  'adjustable.after': 'Dar nelygu. Nuvažiuokite nuo pakylų, ir programėlė išmatuos iš naujo.',

  'calibration.intro':
    'Padėkite telefoną ant paviršiaus, kuris tikrai lygus, ir palieskite „Kalibruoti dabar“. ' +
    'Dabartinis polinkis taps nuliniu tašku.',
  'calibration.status': 'Sukalibruota: išilgai {pitch}, skersai {roll}.',
  'calibration.status.none': 'Nesukalibruota — naudojamas neapdorotas jutiklis.',
  'calibration.now': 'Kalibruoti dabar',
  'calibration.step.phone.done': 'Telefonas sukalibruotas',
  'calibration.step.phone.hint': 'Padėkite telefoną ant ko nors lygaus.',
  'calibration.step.flipLink': 'Nėra lygaus pagrindo? Pasukite telefoną',
  'calibration.step.vehicle.done': 'Nulinta',
  'calibration.step.vehicle.hint':
    'Išlyginkite transporto priemonę gulsčiuku ir padėkite telefoną į įprastą vietą.',
  'calibration.step.vehicle.now': 'Nulinti dabar',
  'calibration.clear': 'Ištrinti kalibravimą',
  'calibration.err.notRunning':
    'Polinkio jutiklis dar neveikia — pirmiausia pagrindiniame ekrane palieskite „Pradėti“.',
  'calibration.warn.notFlat':
    'Kalibravimas išsaugotas, bet paviršius neatrodo lygus (daugiau nei 15°), tad jis greičiausiai klaidingas. Ne to norėjote? Palieskite „Anuliuoti“, padėkite telefoną ant lygaus paviršiaus ir kalibruokite iš naujo.',
  'calibration.undo': 'Anuliuoti',
  'calibration.sensor.h': 'Kalibruoti telefoną',
  'calibration.vehicle.h': 'Nulinti transporto priemonę',
  'calibration.vehicle.intro':
    'Kalibravimas susijęs su telefonu, o ne su vieta, kur jis guli. Jei stalas šiek tiek pasviręs, programėlė rodo tą polinkį. Vieną kartą išlyginkite transporto priemonę gulsčiuku, padėkite telefoną į įprastą vietą ir nulinkite.',
  'calibration.vehicle.now': 'Nulinti dabar',
  'calibration.vehicle.clear': 'Pamiršti nulį',
  'calibration.vehicle.status': 'Transporto priemonės nulis: išilgai {pitch}, skersai {roll}.',
  'calibration.vehicle.status.none':
    'Transporto priemonės nulio nėra — telefono vieta laikoma lygia.',
  'calibration.vehicle.warn.notFlat':
    'Nulis išsaugotas, bet padėtis neatrodo lygi (daugiau nei 15°). Gal transporto priemonė nebuvo išlyginta? Palieskite „Anuliuoti“, išlyginkite transporto priemonę ir nulinkite iš naujo.',
  'calibration.age.today': '(šiandien)',
  'calibration.age.days': '(prieš {n} d.)',
  'calibration.check': 'Tikrinti',
  'calibration.check.good': 'Vis dar gerai — nuokrypis {off}°.',
  'calibration.check.off': 'Nuokrypis {off}° — verta kalibruoti iš naujo.',
  'calibration.vehicle.check.off': 'Nuokrypis {off}° — verta nulinti iš naujo.',
  'calibration.check.none':
    'Dar nesukalibruota, tad nėra ką tikrinti. Padėkite telefoną ant lygaus paviršiaus ir palieskite „{now}“.',
  'calibration.vehicle.check.none':
    'Nulio dar nėra, tad nėra ką tikrinti. Išlyginkite transporto priemonę gulsčiuku ir palieskite „{now}“.',
  'calibration.flip.intro':
    'Nėra lygaus paviršiaus? Kalibruokite pasukdami: padėkite telefoną bet kur ant ' +
    'pakankamai lygaus paviršiaus, užfiksuokite, pasukite telefoną puse apsisukimo (180°) toje ' +
    'pačioje vietoje ir užfiksuokite dar kartą — paviršiaus polinkis kompensuojamas.',
  'calibration.flip.start': 'Kalibruoti pasukant',
  'calibration.flip.rotate':
    'Dabar pasukite telefoną puse apsisukimo (180°) toje pačioje vietoje ir palieskite „Fiksuoti“.',
  'calibration.flip.capture': 'Fiksuoti',
  'calibration.flip.done': 'Atlikta! Jūsų paviršius pasviręs {surface}° — tai kompensuota.',
  'calibration.flip.warn.moved':
    'Kalibravimas išsaugotas, bet du matavimai skiriasi daugiau nei 15°. Ar telefonas pajudėjo? Palieskite „Anuliuoti“ ir pradėkite iš naujo.',
  'calibration.pill.notDone': 'NEATLIKTA',
  'calibration.pill.done': 'ATLIKTA',
  'calibration.pill.none': 'NĖRA',

  'targets.normal': 'Įprastas (lygu)',
  'targets.name.placeholder': 'Pavadinimas (pvz., „Dušo nuotakas“)',
  'targets.name.label': 'Naujo tikslo pavadinimas',
  'targets.defaultName': 'Tikslas {n}',
  'targets.add': 'Išsaugoti polinkį kaip tikslą',
  'targets.delete': 'Ištrinti {name}',
  'targets.warn.tooSteep':
    'Tikslas išsaugotas, bet jis statesnis nei įprasta (daugiau nei 15°). Ne to norėjote? Ištrinkite jį kryželiu ir išsaugokite iš naujo.',
  'targets.badge': 'Tikslas: {name}',

  'feedback.intro':
    'Radote problemą ar turite idėją? Užpildykite formą ir palieskite mygtuką — atsidarys ' +
    'paruoštas pranešimas GitHub, kurį ten paskelbsite (reikia nemokamos GitHub paskyros, ' +
    'ją susikursite per minutę).',
  'feedback.category': 'Apie ką tai?',
  'feedback.cat.bug': 'Klaida',
  'feedback.cat.suggestion': 'Pasiūlymas',
  'feedback.cat.other': 'Kita',
  'feedback.title': 'Trumpas pavadinimas',
  'feedback.desc': 'Kas nutiko arba ko norėtumėte?',
  'feedback.submit': 'Atverti pranešimą GitHub',
  'feedback.warn.title': 'Pavadinimas tuščias — pranešimą vis tiek galite išsiųsti.',
  'feedback.warn.desc': 'Aprašymas tuščias — pranešimą vis tiek galite išsiųsti.',
  'feedback.warn.both': 'Pavadinimas ir aprašymas tušti — pranešimą vis tiek galite išsiųsti.',

  'help.screen.h': 'Kaip skaityti ekraną',
  'help.screen.lead':
    'Ekranas rodo, kuriuos ratus ir kiek reikia pakelti. „Pakopa 2“ reiškia antrąją jūsų pakylos pakopą.',
  'help.screen.t':
    'Žalia ✓: atlikta, nieko daryti nereikia.\n' +
    'Oranžinė ↑: užvažiuokite tuo ratu ant šalia nurodytos pakopos.\n' +
    'Raudona ✕: jūsų pakylų čia nepakanka. Perstatykite transporto priemonę.\n' +
    'Pilka –: prie to rato nėra pakylos. Skaičius rodo, kiek trūksta, jei norite pakišti ką nors kita.\n' +
    'Kai burbulas ramiai stovi viduryje, viskas lygu.',
  'help.screen.routine':
    'Užvažiuokite, palaukite, kol transporto priemonė nurims, ir pažiūrėkite dar kartą. Kartokite, kol visi ratai bus žali.',
  'help.what.t':
    'Padėkite telefoną transporto priemonėje plokščiai, viršumi į priekį, kiekvieną kartą toje pačioje vietoje.\n' +
    'Su jutiklio dėžute nesvarbu, kaip guli telefonas.',
  'help.settings.h': 'Matmenys',
  'help.measures.h': 'Įveskite matmenis',
  'help.settings.t':
    'Libell apskaičiuoja, kiek reikia pakelti kiekvieną ratą, pagal ratų bazę ir vėžę.\n' +
    'Juos rasite transporto priemonės dokumentuose arba išmatuokite matavimo juosta.\n' +
    'Įveskite juos mm, cm arba coliais — kaip pasirinkote ties „Ilgius rodyti“.\n' +
    'Karavano ratų bazė yra atstumas nuo ašies iki atraminio ratuko.\n' +
    'Jei turite kelias transporto priemones, kiekviena turi savo matmenis, pakylas, nulį, tikslus ir jutiklio dėžutę; pasirinkite vieną skilties „Transporto priemonė“ viršuje.',
  'help.ramps.t':
    'Ekranas nurodo, ant kurios pakylos pakopos užvažiuoti kiekvienu ratu, todėl įveskite pakylas, kurias vežatės.\n' +
    'Pasirinkite gamyklinę pakylą arba savą rinkinį ir kiek jų turite. Libell padeda jas ten, kur jos naudingiausios.\n' +
    'Pakylai be pakopų pasirinkite „Bepakopis pleištas“ ir įveskite jo aukštį. Tada ekranas nurodys, kiek užvažiuoti.',
  'help.calibration.h': 'Kalibruoti ir nulinti',
  'help.calibration.t':
    'Du žingsniai užtikrina teisingus rodmenis: vieną kartą sukalibruokite telefoną ir vieną kartą nulinkite transporto priemonę.\n' +
    'Kalibruoti: padėkite telefoną ant lygaus paviršiaus ir palieskite „Kalibruoti dabar“.\n' +
    'Nulinti: išlyginkite transporto priemonę gulsčiuku, padėkite telefoną į įprastą vietą ir palieskite „Nulinti dabar“.\n' +
    'Su jutiklio dėžute nulinama dėžutės puslapyje. Jos kalibruoti nereikia.\n' +
    'Vis dar ne visai lygu? Pareguliuokite nulį mygtukais „Kairė aukštyn“, „Dešinė aukštyn“, „Priekis aukštyn“ arba „Galas aukštyn“ kortelėje „Nulinti transporto priemonę“.\n' +
    'Lemputė „⚠ Kalibruoti“ arba „⚠ Nulinti“ šviečia, kol tai neatlikta.',
  'help.sensor.h': 'Jutiklio dėžutė',
  'help.sensor.t':
    'Jutiklio dėžutė transporto priemonėje gali matuoti vietoj telefono. Libell veikia su šiomis:\n' +
    '{upright}: stovi vertikaliai, atsukta bet kuria kryptimi.\n' +
    '{flat}: guli plokščiai, dangteliu aukštyn, viena rodykle į priekį.\n' +
    'Prijunkite jutiklio piktograma viršuje dešinėje. Tada dėžutės puslapis padės atlikti „Pasirinkti kryptį“ ir „Nulinti transporto priemonę“.\n' +
    'Veikia naršyklėse Chrome arba Edge, Android telefone ar kompiuteryje. iPhone reikia naršyklės Bluefy.\n' +
    'Jei dėžutė atmeta kodą, Libell paprašys dėžutės keturių skaitmenų kodo.',
  'help.targets.h': 'Tikslai ir garsas',
  'help.targets.t':
    'Išsaugokite norimą polinkį kaip tikslą, pavyzdžiui, link dušo nuotako, ir perjunkite tarp tikslų.\n' +
    'Karavanas: prieš atkabindami išsaugokite prikabinimo aukštį, o „Į prikabinimo aukštį“ padės atraminiu ratuku jį vėl pasiekti.\n' +
    'Įjungus balsinį vedimą, programėlė pasako, kurį ratą ir kiek pakelti, tad galite lyginti nežiūrėdami į telefoną.\n' +
    'Mygtukas apatinės juostos viduryje įjungia ir išjungia garsą.',
  'help.trouble.h': 'Jei kas nors negerai',
  'help.trouble.t':
    '„Matuojama…“: transporto priemonė siūbuoja. Palaukite, kol ji nurims.\n' +
    '„Padėkite telefoną plokščiai, kad būtų galima matuoti“: telefonas per daug pakreiptas, kad galėtų matuoti.\n' +
    '„Prarastas ryšys su dėžute“: palieskite „Prijungti vėl“ ir pasirinkite dėžutę sąraše.\n' +
    '„Laukiama polinkio jutiklio…“: rodmenų dar nėra. iPhone telefone palieskite „Pradėti“ kiekvieną kartą atidarę programėlę; kitu atveju įkelkite puslapį iš naujo.\n' +
    '„Prieiga prie judesio jutiklių buvo atmesta“: naršyklės nustatymuose leiskite šiai svetainei pasiekti judesį ir orientaciją ir įkelkite puslapį iš naujo.\n' +
    'Vis dar negerai? Parašykite pranešimą skiltyje „Atsiliepimai“.',
  'help.open': 'Atidaryti: {name}',
  'help.open.sensor': 'Atidaryti dėžutę',
  'help.open.feedback': 'Rašyti pranešimą',

  'main.hint':
    'Padėkite telefoną plokščiai transporto priemonės viduje, viršutiniu kraštu į priekį.',
  'main.start': 'Pradėti',
  'main.waiting': 'Laukiama polinkio jutiklio…',
  'main.level': 'Jūsų transporto priemonė lygi!',
  'main.denied':
    'Prieiga prie judesio jutiklių buvo atmesta, todėl Libell negali nuskaityti polinkio. ' +
    'Leiskite šiai svetainei pasiekti judesį ir orientaciją ir įkelkite puslapį iš naujo.',
  'main.noSensors':
    'Šis įrenginys nesuteikia prieigos prie judesio jutiklių, todėl Libell negali nuskaityti polinkio.',
  'main.https':
    'Libell reikia saugaus ryšio (HTTPS), kad galėtų nuskaityti polinkio jutiklius. ' +
    'Atidarykite programėlę per HTTPS ir bandykite dar kartą.',

  'diagram.aria': 'Kemperio vaizdas iš viršaus, rodantis, kuriuos ratus reikia pakelti',
  'diagram.caravan.aria': 'Karavano vaizdas iš viršaus su ašies ratais ir atraminiu ratuku',
  'diagram.front': 'Priekis',
  'diagram.step': 'Pakopa {n}',
  'diagram.driveUp': 'Užvažiuoti',
  'diagram.done': 'Atlikta',
  'diagram.noRamp': 'Be pakylos',
  'diagram.wheel.frontLeft': 'Priekinis kairysis',
  'diagram.wheel.frontRight': 'Priekinis dešinysis',
  'diagram.wheel.rearLeft': 'Galinis kairysis',
  'diagram.wheel.rearRight': 'Galinis dešinysis',
  'diagram.notEnough': 'nepakanka',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Sukti aukštyn',
  'caravan.crankDown': 'Sukti žemyn',
  'caravan.axleLeft': 'Kairysis ašies ratas',
  'caravan.axleRight': 'Dešinysis ašies ratas',
  'caravan.jockeyWheel': 'Atraminis ratukas',
  'help.screen.caravan':
    'Karavanas: ant atraminio ratuko kortelės rodoma „Sukti aukštyn“ arba „Sukti žemyn“ ir kiek.',

  'vehicles.title': 'Transporto priemonės',
  'vehicles.defaultName': 'Mano transporto priemonė',
  'vehicles.numbered': 'Transporto priemonė {n}',
  'vehicles.name.placeholder': 'Pavadinimas (pvz., „Karavanas“)',
  'vehicles.name.label': 'Transporto priemonės pavadinimas',
  'vehicles.add': 'Pridėti naują',
  'namePrompt.save': 'Išsaugoti',
  'namePrompt.cancel': 'Atšaukti',
  'choice.rename': 'Pervadinti {name}',
  'vehicles.badge': 'Transporto priemonė: {name}',
  'vehicles.delete': 'Pašalinti {name}',
  'vehicles.remove.confirm': 'Pašalinti {name} kartu su nuliu, tikslais ir jutiklio dėžute?',
  'vehicles.remove.yes': 'Taip, pašalinti',
  'vehicles.hint':
    'Matmenys, pakylos, transporto priemonės nulis, tikslai ir jutiklio dėžutė priklauso transporto priemonei. Telefono kalibravimas yra bendras.',
  'setup.incoming.addNew': 'Pridėti kaip naują',

  'hitch.title': 'Prikabinimo aukštis',
  'hitch.hint':
    'Išsaugokite jį, kol karavanas dar ant kablio rutulio. Prieš vėl prikabinant, atraminis ratukas parodys, kiek sukti, kad mova atsidurtų ties rutuliu.',
  'hitch.save': 'Išsaugoti aukštį',
  'hitch.go': 'Į prikabinimo aukštį',
  'hitch.done': 'Baigti',
  'hitch.savedNow': 'Prikabinimo aukštis išsaugotas.',
  'hitch.status.none': 'Prikabinimo aukštis dar neišsaugotas.',
  'hitch.status.saved': 'Prikabinimo aukštis yra išsaugotas.',
  'hitch.status.active': 'Pagrindiniame ekrane rodoma, kiek sukti atraminį ratuką.',
  'hitch.badge': 'Prikabinimo aukštis',
  'hitch.badge.aria': 'Prikabinimo aukštis: palieskite, kad vėl lygintumėte įprastai',
  'hitch.crank.up': 'Sukite aukštyn {amount} iki prikabinimo aukščio',
  'hitch.crank.down': 'Sukite žemyn {amount} iki prikabinimo aukščio',
  'hitch.reached': 'Prikabinimo aukštis pasiektas',
  'hitch.offer': 'Pirma išsaugoti prikabinimo aukštį?',
  'hitch.offer.save': 'Išsaugoti',
  'hitch.offer.dismiss': 'Ne dabar',

  'zeroTrim.title': 'Pareguliuoti nulį',
  'zeroTrim.hint':
    'Vis dar ne visai lygu? Kiekvienas palietimas paslenka nulį 0,1°, kad programėlė norėtų tą pusę aukščiau.',
  'zeroTrim.left': 'Kairė aukštyn',
  'zeroTrim.right': 'Dešinė aukštyn',
  'zeroTrim.front': 'Priekis aukštyn',
  'zeroTrim.back': 'Galas aukštyn',
  'zeroTrim.side.left': 'Kairė',
  'zeroTrim.side.right': 'Dešinė',
  'zeroTrim.side.front': 'Priekis',
  'zeroTrim.side.back': 'Galas',
  'zeroTrim.total': 'Pareguliuota: {trim}',
  'zeroTrim.none': 'Nepareguliuota',
  'zeroTrim.reset': 'Atstatyti reguliavimą',
  'tilt.frontBack': 'Išilgai',
  'tilt.sideSide': 'Skersai',

  'pose.layFlat': 'Padėkite telefoną plokščiai, kad būtų galima matuoti',
  'pose.sensorHint': 'Ji teisingai matuoja tik gulėdama plokščiai, viršumi aukštyn.',
  'pose.openSensorPage': 'Rodyti dėžutę',
  'pose.sensorExtreme': 'Dėžutė per daug pakrypusi',
  'pose.sensorUpsideDown': 'Atrodo, kad dėžutė apversta',
  'pose.sensorNotUpright': 'Dėžutė guli',
  'pose.sensorHintUpright': 'Ji teisingai matuoja tik stovėdama vertikaliai.',
  'calibration.external.h': 'Nulinti transporto priemonę',
  'calibration.external.intro':
    'Vieną kartą išlyginkite transporto priemonę gulsčiuku, tada nulinkite.',
  'calibration.external.phoneHidden':
    'Kol matuoja jutiklio dėžutė, telefono kalibravimas paslėptas. Norėdami sukalibruoti telefoną, atidarykite dėžutę ir pirmiausia palieskite „{disconnect}“.',
  'calibration.external.working': 'Nulinama…',
  'calibration.external.done': 'Dėžutė {name} nulinta: ši padėtis dabar laikoma lygia.',
  'calibration.external.err.notConnected':
    'Dėžutė {name} neprijungta. Prijunkite ją ir bandykite dar kartą.',
  'calibration.external.err.failed':
    'Nepavyko nulinti dėžutės {name}. Niekas nepakeista. Patikrinkite ryšį ir bandykite dar kartą.',
  'pose.portrait':
    'Pasukite telefoną vertikaliai — viršutinis kraštas turi būti nukreiptas į priekį',

  'stale.dataUnavailable':
    'Naujų jutiklio duomenų nėra — vedimas pristabdytas, kol jie vėl atsiras',

  'sensorFallback.lost': 'Prarastas ryšys su dėžute',
  'sensorFallback.autoRetry': 'Automatiškai bandoma dar kartą…',
  'sensorFallback.connect': 'Prijunkite dėžutę',
  'sensorFallback.pick': 'Palieskite ir pasirinkite savo dėžutę sąraše.',
  'sensorFallback.notFound': 'Dėžutės nerasta? Patikrinkite, ar ji įjungta ir netoliese.',
  'sensorFallback.retry': 'Prijungti vėl',
  'sensorFallback.usePhone': 'Naudoti telefoną',
  'mounting.prompt.upright': 'Palieskite ten, kur nukreipta dėžutės nugarėlė (varžto laikiklis).',
  'mounting.prompt.arrow':
    'Viena iš dėžutės rodyklių (ant dangtelio arba ant plokštės po juo) rodo į priekį. Kuri pusė atsukta į priekį?',
  'mounting.placement.wide': 'Ilgoji pusė į priekį',
  'mounting.placement.short': 'Trumpoji pusė į priekį',
  'mounting.facing.front': 'Rodo į priekį',
  'mounting.facing.right': 'Rodo į dešinę',
  'mounting.facing.rear': 'Rodo atgal',
  'mounting.facing.left': 'Rodo į kairę',
  'box.state.connected': 'Prijungta',
  'box.state.lost': 'Ryšys prarastas',
  'box.state.password': 'Blogas kodas',
  'box.password.label': 'Dėžutės kodas',
  'box.password.retry': 'Bandyti vėl',
  'box.password.checking': 'Bandomas kodas…',
  'box.password.invalid': 'Kodą sudaro keturi skaitmenys.',
  'box.password.wrong': 'Dėžutė nepriėmė ir šio kodo.',
  'box.password.noAnswer':
    'Dėžutė neatsakė. Kodas išsaugotas ir bus išbandytas kitą kartą, kai dėžutė prisijungs.',
  'box.state.notConnected': 'Neprijungta',
  'box.state.battery': 'baterija {value}',
  'box.connect': 'Prijungti',
  'box.step.position.upright.ok': 'Stovi vertikaliai',
  'box.step.position.upright.bad': 'Guli: pastatykite ją vertikaliai, atsuktą bet kuria kryptimi',
  'box.step.position.flat.ok': 'Guli plokščiai',
  'box.step.position.flat.bad': 'Per daug pakrypusi: paguldykite ją plokščiai, viršumi aukštyn',
  'box.step.position.flat.upsideDown':
    'Apversta: pasukite ją dangteliu aukštyn. Gamintojas nerekomenduoja jos montuoti apverstos.',
  'box.step.position.waiting': 'Padėtis: laukiama rodmens',
  'box.step.direction.todo': 'Pasirinkti kryptį',
  'box.step.direction.done': 'Kryptis nustatyta',
  'box.step.direction.learn': 'Nežinote? Atpažinkite pakeldami priekį',
  'box.step.zero.todo': 'Nulinti transporto priemonę',
  'box.step.zero.done': 'Nulinta',
  'box.step.zero.hint': 'Išlyginkite transporto priemonę gulsčiuku, tada nulinkite.',
  'box.forgetDirection': 'Pamiršti kryptį',
  'onboard.boxPosition.h': 'Dėžutės padėtis',
  'onboard.boxPosition.later':
    'Kryptis ir nulis nustatomi, kai pirmą kartą pastatysite transporto priemonę. Dėžutės puslapis jus palydės, o lemputė „⚠ Nulinti“ primins, kol tai atliksite.',
  'onboard.boxPosition.notConnected':
    'Dėžutė dar neprijungta, todėl jos padėties parodyti negalima. Palieskite {next} ir prijunkite vėliau jutiklio piktograma viršuje dešinėje.',
  'sensorList.title': 'Jutiklio dėžutė',
  'sensorList.phone': 'Kai dėžutė neprijungta, naudojamas paties telefono jutiklis.',
  'box.step.zero.again': 'Nulinti vėl',
};
