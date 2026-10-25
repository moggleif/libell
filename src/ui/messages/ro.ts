import type { Messages } from './en';

/** Romanian. */
export const ro: Messages = {
  'topbar.install': 'Instalați',
  'topbar.share': 'Distribuiți Libell',
  'bottombar.settings': 'Setări',
  'bottombar.sound.mute': 'Dezactivați sunetul',
  'bottombar.sound.unmute': 'Activați sunetul',
  'bottombar.help': 'Ajutor',
  'bottombar.label': 'Acțiuni',
  'share.text': 'Nivelați-vă autorulota sau rulota cu telefonul.',
  'share.copied': 'Link copiat!',
  'update.check': 'Căutați o versiune nouă',
  'update.checking': 'Se caută actualizări…',
  'update.updating': 'Se actualizează la versiunea nouă…',
  'update.latest': 'Aveți cea mai nouă versiune',
  'update.offline': 'Fără conexiune, nu se pot căuta actualizări',
  'update.unsupported': 'Actualizările nu sunt disponibile aici',
  'install.hint': 'Atingeți Partajează, apoi „Adaugă pe ecranul principal”.',
  'install.row': 'Instalați Libell ca aplicație pe ecranul principal.',
  'install.close': 'Ascundeți',
  'share.vehicle.text': 'Configurația vehiculului meu pentru Libell — dimensiuni și rampe.',
  'settings.shareVehicle': 'Trimiteți pe alt telefon',
  'setup.incoming.h': 'Configurație de vehicul primită',
  'setup.incoming.intro': 'Un membru al familiei v-a trimis aceste dimensiuni ale vehiculului:',
  'setup.incoming.reminder':
    'Nu include nicio calibrare — va trebui totuși să calibrați pe acest telefon.',
  'setup.incoming.apply': 'Înlocuiți vehiculul actual',
  'setup.incoming.dismiss': 'Nu acum',
  'setup.incoming.invalid':
    'Linkul de configurare a vehiculului nu a putut fi citit — nu s-a modificat nimic.',

  'lamp.setup': '⚠ Dimensiuni',
  'lamp.setup.title':
    'Dimensiunile vehiculului nu au fost salvate niciodată — atingeți pentru a deschide Setări',
  'lamp.calibrate': '⚠ Calibrare',
  'lamp.zero': '⚠ Zero',
  'lamp.calibrate.title':
    'Telefonul nu este calibrat — atingeți pentru a deschide „Calibrare și zero”',
  'lamp.zero.title':
    'Vehiculul nu este adus la zero — atingeți pentru a deschide „Calibrare și zero”',
  'lamp.calibrate.title.sensor':
    'Modulul nu este adus la zero — atingeți pentru a deschide pagina modulului',

  'sensorStatus.connected': 'Modul senzor conectat',
  'sensorStatus.disconnected': 'Modul senzor — contact pierdut, atingeți pentru detalii',
  'sensorStatus.stale': 'Modul senzor — nu sosesc date noi, atingeți pentru detalii',
  'sensorStatus.idle': 'Modul senzor — atingeți pentru a conecta',
  'sensorStatus.idle.guide': 'Modul senzor — atingeți pentru ghidul de configurare pe iPhone',

  'menu.title': 'Meniu',
  'menu.close': 'Închideți meniul',
  'menu.settings': 'Setări',
  'menu.calibration': 'Calibrare și zero',
  'menu.targets': 'Ținte',
  'menu.feedback': 'Feedback',
  'menu.help': 'Ajutor',
  'menu.intro': 'Arătați introducerea',
  'menu.about': 'Despre Libell',
  'menu.about.tab': 'Despre',
  'menu.sensorSource': 'Modul senzor',

  'sensorSource.connect': 'Conectați senzorul {name}',
  'sensorSource.disconnect': 'Deconectați',
  'sensorSource.status.connecting': 'Se conectează…',
  'sensorSource.err.unsupported': 'Web Bluetooth nu este acceptat în acest browser.',
  'sensorSource.unsupported.browser':
    'Pentru a conecta un modul senzor, deschideți Libell în Chrome sau Edge pe Android ori pe un computer. Senzorul propriu al telefonului funcționează aici ca de obicei.',
  'sensorSource.err.password':
    'Modulul {name} nu și-a acceptat parola. Introduceți mai jos codul de patru cifre al modulului și atingeți Reîncercați. Codul din fabrică este 0000. Dacă nu știți codul, schimbați-l în aplicația Xparkle.',
  'sensorSource.err.failed': 'Nu s-a putut conecta la senzorul {name}.',

  'sensorSource.ios.intro':
    'Safari nu se poate conecta direct la senzori Bluetooth, dar există o soluție:',
  'sensorSource.ios.step1': 'Instalați „Bluefy – Web Bluetooth Browser” din App Store.',
  'sensorSource.ios.step2': 'Deschideți Bluefy și permiteți accesul la Bluetooth.',
  'sensorSource.ios.step3': 'În Bluefy, accesați aceeași adresă Libell.',
  'sensorSource.ios.step4': 'Deschideți din nou Modul senzor aici — funcționează ca pe Android.',
  'sensorSource.ios.note':
    'Bluefy este o aplicație terță, nu este făcută de Libell — la deschiderea ' +
    'aplicației, reconectarea poate cere o atingere manuală acolo, în loc să se facă singură.',
  'sensorSource.ios.bluefyLink': 'Găsiți Bluefy în App Store',

  'sensorSource.detail.temperature': 'Temperatură: {value}',
  'sensorSource.detail.notAvailable': 'Încă indisponibil',
  'sensorSource.lowBattery':
    '⚠ Baterie descărcată ({value}) — înlocuiți în curând bateria modulului senzor.',

  'sensorSource.install.now': 'Aduceți la zero',
  'sensorSource.install.clear': 'Ștergeți zeroul',
  'sensorSource.install.status': 'Zero: față/spate {pitch}, lateral {roll}.',
  'sensorSource.install.status.none':
    'Încă nu este adus la zero — modulul măsoară așa cum este montat.',

  'sensorSource.learn.h': 'Învățați montajul',
  'sensorSource.learn.intro':
    'Libell învață direcția din două ridicări: întâi partea din față, apoi partea dreaptă.',
  'sensorSource.learn.start': 'Învățați montajul',
  'sensorSource.learn.step.front':
    'Ridicați partea din față a vehiculului câțiva centimetri, apoi apăsați butonul.',
  'sensorSource.learn.capture.front': 'Fața e ridicată',
  'sensorSource.learn.step.right':
    'Coborâți din nou partea din față. Acum ridicați partea dreaptă câțiva centimetri, apoi apăsați butonul.',
  'sensorSource.learn.capture.right': 'Dreapta e ridicată',
  'sensorSource.learn.cancel': 'Anulați',
  'sensorSource.learn.status.learned': 'Montaj învățat.',
  'sensorSource.learn.status.none':
    'Niciun montaj învățat — se folosesc direcțiile proprii ale modulului.',
  'sensorSource.learn.done':
    'Gata! Verificați: ridicați partea din față, iar Libell ar trebui să indice roțile din spate.',
  'sensorSource.learn.err.tooSmall':
    'Vehiculul aproape nu s-a mișcat. Ridicați-l puțin mai mult și încercați din nou.',
  'sensorSource.learn.err.ambiguous':
    'Ambele direcții s-au mișcat cam la fel. Ridicați doar partea din față, apoi doar partea dreaptă, și încercați din nou.',
  'sensorSource.learn.err.arrow':
    'Nicio săgeată nu indică înainte. Rotiți modulul astfel încât una dintre săgeți să indice înainte, apoi încercați din nou.',
  'sensorSource.learn.err.mirrored':
    'Modulul pare întors cu capul în jos sau a fost ridicată partea greșită. Verificați, apoi încercați din nou.',
  'sensorSource.learn.err.sameAxis':
    'Ambele ridicări au înclinat în același fel. Ridicați întâi partea din față, apoi partea dreaptă, și încercați din nou.',

  'sensorStatus.title': 'Senzor {name}',
  'sensorStatus.reading': 'Înclinare acum: {value}',
  'sensorStatus.debug': 'Info depanare',
  'sensorStatus.debug.intro':
    'Valori brute direct de la modul — pentru depanare, dacă ceva nu funcționează.',
  'sensorStatus.debug.state': 'Stare conexiune: {value}',
  'sensorStatus.debug.deviceId': 'ID dispozitiv: {value}',
  'sensorStatus.debug.lastSample': 'Ultima citire: {value}',
  'sensorStatus.debug.age': 'acum {s} s',
  'sensorStatus.debug.rawAccel': 'Accelerometru brut (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Generație firmware: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Octeți de stare bruți: {value}',
  'sensorStatus.debug.versionBytes': 'Număr de serie și firmware (brut): {value}',
  'sensorStatus.debug.copy': 'Copiați info',
  'sensorStatus.debug.copied': 'Info de depanare copiate!',
  'sensorStatus.debug.copy.failed': 'Nu s-a putut copia automat.',
  'sensorStatus.advanced': 'Avansat',
  'sensorStatus.silentReconnect.intro':
    'Acest browser nu se poate încă reconecta singur la modul, așa că după o repornire îl alegeți din nou din listă. În Chrome puteți activa singur această funcție.',
  'sensorStatus.silentReconnect.steps':
    'Deschideți {address}, căutați „web bluetooth”, setați „Use the new permissions backend for Web Bluetooth” la Enabled și atingeți Relaunch. Apoi conectați modulul o dată.',
  'sensorStatus.silentReconnect.copy': 'Copiați {address}',
  'sensorStatus.silentReconnect.copied': 'Copiat — lipiți-l în bara de adrese din Chrome.',
  'sensorStatus.debug.connectDelay.intro':
    'Experimental: încercați doar dacă legătura cu modulul este instabilă. Adaugă o pauză fixă după conectare, înainte ca aplicația să înceapă să citească.',
  'sensorStatus.debug.connectDelay.enable': 'Pauză după conectare',
  'sensorStatus.debug.connectDelay.ms': 'Pauză (ms)',

  'about.text':
    'Libell vă ajută să nivelați autorulota sau rulota cu telefonul pe care ' +
    'îl aveți deja, fără să ghiciți.',
  'about.version': 'Versiunea {v}',
  'about.offline':
    'Funcționează complet offline — rețeaua este folosită doar pentru actualizările aplicației.',
  'about.privacy':
    'Setările dvs. rămân pe telefon — fără cont și fără urmărire. Libell trimite doar numere anonime despre cum este folosită aplicația, iar asta puteți dezactiva.',
  'about.source': 'Libell este gratuit și open source (licență MIT).',
  'about.source.link': 'Codul sursă pe GitHub',
  'menu.privacy': 'Confidențialitate',
  'menu.privacy.tab': 'Date',
  'privacy.stored.h': 'Salvat pe acest telefon',
  'privacy.stored.empty': 'Nu este salvat nimic.',
  'privacy.raw': 'Afișați datele brute',
  'privacy.raw.hint': 'Exact cum sunt salvate. Parola modulului este ascunsă.',
  'privacy.resetSettings': 'Resetați doar setările',
  'privacy.deleteAll': 'Ștergeți toate datele Libell',
  'privacy.deleteAll.confirm':
    'Ștergeți tot ce a salvat Libell pe acest telefon? Vehiculele, dimensiunile și calibrarea dispar, iar Libell pornește din nou ca prima dată.',
  'privacy.deleteAll.yes': 'Da, ștergeți tot',
  'privacy.deleteAll.cancel': 'Anulați',
  'stored.vehicle': 'Vehicul',
  'stored.vehicle.detail': '{name}, ampatament {wheelbase}',
  'stored.settings': 'Setări',
  'stored.settings.detail': 'Dimensiuni, rampe, unitate, aspect și sunet',
  'stored.password': 'Parola modulului senzor',
  'stored.language': 'Limbă',
  'stored.phoneCalibration': 'Calibrarea telefonului',
  'stored.zero': 'Zeroul vehiculului',
  'stored.zeroTrim': 'Reglajul fin al zeroului',
  'stored.targets': 'Ținte',
  'stored.targets.active': '{name} (aleasă)',
  'stored.hitch': 'Înălțime de cuplare',
  'stored.rememberedBox': 'Modul senzor memorat',
  'stored.notes': 'Notițele proprii ale aplicației',
  'stored.notes.detail': '{n} mici marcaje, de exemplu dacă introducerea a fost afișată',
  'stored.phone': 'Telefonul',
  'stored.saved': 'salvat',
  'stored.counting.off': 'Dezactivată',
  'stored.counting.on': 'Activată',
  'stored.savedOn': 'salvat pe {date}',

  'intro.h': 'Bun venit în Libell',
  'intro.how':
    'Așezați telefonul culcat în vehicul, iar Libell arată ce roți trebuie ridicate și cu cât.',
  'intro.start': 'Să începem',
  'intro.later': 'Mai întâi explorez',
  'onboard.source.sensorIcon':
    'Un modul senzor poate fi conectat oricând cu pictograma senzorului din dreapta sus.',
  'counting.title': 'Numărare anonimă',
  'counting.intro': 'Libell poate număra anonim utilizarea, ca să știm ce să îmbunătățim.',
  'counting.sent.h': 'Ce se numără',
  'counting.sent':
    'Că aplicația a fost deschisă, ce funcții se folosesc, ce model de senzor măsoară (telefonul sau un model precum {boxes}), versiunea aplicației și limba aleasă în Libell.',
  'counting.notSent.h': 'Ce nu se salvează niciodată',
  'counting.notSent':
    'Adresa dvs. IP, țara, dispozitivul, ecranul, sistemul de operare sau browserul, dimensiunile vehiculului, setările dvs. sau orice altceva despre dvs. Pe telefon se salvează doar alegerea dvs.',
  'counting.gpc':
    'Dacă browserul dvs. cere site-urilor să nu vă urmărească, Libell nu numără nimic.',
  'counting.later': 'Vă puteți schimba alegerea oricând din {help} › {tab}.',
  'counting.toggle': 'Numărarea anonimă a utilizării mele',
  'counting.dashboard': 'Vedeți statisticile',
  'counting.ask': 'Vreți să ajutați la îmbunătățirea Libell?',
  'counting.yes': 'Da, cu numărare anonimă',
  'counting.no': 'Nu, mulțumesc',
  'onboard.sound.h': 'Sunet',
  'onboard.source.h': 'Cum doriți să măsurați?',
  'onboard.source.intro':
    'Alegeți senzorul din care Libell citește înclinarea — majoritatea folosesc pur și simplu telefonul.',
  'onboard.source.phone': 'Acest telefon',
  'onboard.source.externalActive':
    'Acum este activ un modul senzor. Dacă alegeți acest telefon, calibrarea telefonului este sărită. Pentru a calibra telefonul, deschideți modulul cu pictograma senzorului din dreapta sus și atingeți întâi „{disconnect}”.',
  'onboard.vehicle.h': 'Ce nivelați?',
  'onboard.vehicle.intro': 'Alegeți vehiculul — restul ghidului se potrivește cu el.',
  'onboard.step1.h': 'Așezați telefonul astfel',
  'onboard.next': 'Înainte',
  'onboard.back': 'Înapoi',
  'onboard.close': 'Închideți introducerea',
  'onboard.done': 'Gata',
  'onboard.skipStep': 'Săriți',
  'onboard.note.measurements':
    'Dacă săriți, se folosesc dimensiunile implicite; lampa {lamp} rămâne aprinsă până le salvați pe ale dumneavoastră.',
  'onboard.note.ramps':
    'Dacă săriți, se folosesc rampele implicite. Le puteți alege pe ale dumneavoastră mai târziu în Setări.',
  'onboard.note.calibrate':
    'Nicio suprafață plană acum? Atingeți {next}; {lamp} vă amintește până când este gata.',
  'onboard.note.connect':
    'Niciun modul la îndemână? Atingeți {next} și conectați-l mai târziu cu pictograma senzorului din dreapta sus.',
  'onboard.zeroLater':
    'Aduceți vehiculul la zero prima dată când parcați pe teren drept. {lamp} vă amintește până când este gata.',
  'onboard.legend.ok': 'Verde ✓ — roata respectivă este nivelată.',
  'onboard.legend.up': 'Portocaliu ↑ — urcați roata pe treapta afișată.',
  'onboard.legend.no': 'Roșu ✕ — nicio treaptă nu ajunge; mutați-vă într-un loc mai drept.',
  'onboard.legend.dim': 'Gri – — nicio rampă la acea roată; cifra arată cât lipsește.',
  'settings.wheelbase': 'Ampatament',
  'settings.trackFront': 'Ecartament față',
  'settings.trackRear': 'Ecartament spate',
  'settings.tolerance': 'Toleranță',
  'settings.stability': 'Stabilitate',
  'settings.dwellRest': 'Întârziere răspuns (ms)',
  'settings.dwellMotion': 'Întârziere la ajustare (ms)',
  'settings.dwell.hint': 'Cât timp trebuie să rămână o citire înainte ca cifra să se schimbe.',
  'settings.vehicle': 'Vehicul',
  'vehicle.motorhome': 'Autorulotă',
  'vehicle.caravan': 'Rulotă',
  'settings.axleToJockey': 'Axă până la roata jockey',
  'settings.rearAxle': 'Axa spate',
  'settings.axle': 'Axă',
  'axle.single': 'Simplă',
  'axle.boggie': 'Tandem (boggie)',
  'settings.track': 'Ecartament',
  'settings.measureHint':
    'Le găsiți în certificatul de înmatriculare. Câțiva cm diferență nu contează.',
  'settings.measureHint.caravan':
    'Măsurați de la axă până la roata jockey. Câțiva cm diferență nu contează.',
  'settings.measureHint.boggie': 'La axa tandem, măsurați până la mijlocul perechii de axe.',
  'settings.steps': 'Înălțimi de treaptă',
  'settings.steps.add': 'Adăugați',
  'settings.steps.new': 'Înălțimea treptei noi ({unit})',
  'settings.steps.remove': 'Eliminați {value}',
  'settings.ramp': 'Rampă de serie',
  'settings.ramp.custom': 'Set propriu',
  'settings.ramp.stepless': 'Pană fără trepte',
  'settings.ramp.steplessModel': '{name} (fără trepte, max. {max} mm)',
  'settings.stepless.max': 'Pană fără trepte, înălțime max.',
  'settings.stepless.maxHeading': 'Înălțime max.',
  'settings.stepless.set': 'Salvați',
  'settings.stepless.new': 'Înălțime maximă ({unit})',
  'settings.rampCount': 'Număr de rampe',
  'settings.drain': 'Partea scurgerii',
  'settings.rampHint': 'Aplicația alege unde rampele ajută cel mai mult.',
  'settings.drainHint':
    'În limita toleranței, această parte rămâne cea mai joasă, ca apa să se scurgă.',
  'settings.section.vehicle': 'Vehicul și dimensiuni',
  'settings.section.ramps': 'Rampe',
  'settings.general': 'General',
  'settings.language': 'Limbă',
  'settings.language.auto': 'Automat (limba dispozitivului)',
  'settings.tolerance.hint': 'Cât de aproape de orizontală contează ca nivelat.',
  'settings.stability.hint':
    'Netezește micile fluctuații ale senzorului, ca cifrele să nu pâlpâie.',
  'drain.none': 'Niciuna / nu contează',
  'drain.left': 'Stânga, la mijloc',
  'drain.right': 'Dreapta, la mijloc',
  'drain.front': 'Față, la mijloc',
  'drain.rear': 'Spate, la mijloc',
  'drain.frontLeft': 'Față stânga',
  'drain.frontRight': 'Față dreapta',
  'drain.rearLeft': 'Spate stânga',
  'drain.rearRight': 'Spate dreapta',
  'settings.unit': 'Afișați lungimile în',
  'settings.unitInches': 'inchi (in)',
  'settings.theme': 'Temă',
  'theme.system': 'Ca telefonul',
  'theme.light': 'Luminoasă',
  'theme.dark': 'Întunecată',
  'settings.appearance': 'Aspect',
  'appearance.classic': 'Clasic',
  'appearance.modern': 'Modern',
  'appearance.glossy': 'Lucios',
  'settings.sound': 'Semnal când e nivelat',
  'settings.soundGuidance': 'Ghidare sonoră continuă',
  'settings.soundGuidance.help':
    'Semnalul devine mai rapid și mai înalt pe măsură ce vă apropiați de nivel.',
  'settings.soundSpeech': 'Ghidare vocală',
  'settings.soundSpeech.help':
    'Când vehiculul stă nemișcat, aplicația spune ce roată și cât, de exemplu „Spate stânga, Treapta 2”.',
  'settings.soundSpeech.unavailable':
    'Ghidarea vocală nu funcționează pe acest telefon: nu are o voce în limba română care să funcționeze offline. Tonurile funcționează ca de obicei.',
  'speech.level': 'Nivelat',
  'speech.inches': '{n} inchi',
  'speech.inchOne': 'un inch',
  'speech.inchOneAnd': 'un inch și {fraction}',
  'speech.inchesAnd': '{n} inchi și {fraction}',
  'speech.inchFraction': '{fraction} de inch',
  'speech.eighth1': 'o optime',
  'speech.eighth2': 'un sfert',
  'speech.eighth3': 'trei optimi',
  'speech.eighth4': 'o jumătate',
  'speech.eighth5': 'cinci optimi',
  'speech.eighth6': 'trei sferturi',
  'speech.eighth7': 'șapte optimi',
  'settings.undo': 'Anulați',
  'settings.saved': 'Salvat',
  'settings.more': 'Mai mult',
  'settings.fineTuning': 'Reglaj fin',
  'settings.resetAll': 'Resetați tot',
  'settings.err.positive':
    'Introduceți un număr mai mare decât 0. Valoarea anterioară rămâne valabilă.',
  'settings.err.notNegative': 'Introduceți 0 sau mai mult. Valoarea anterioară rămâne valabilă.',
  'settings.err.range':
    'Introduceți un număr între {min} și {max}. Valoarea anterioară rămâne valabilă.',

  'settings.tab.vehicle': 'Vehicul',
  'settings.tab.ramps': 'Rampe',
  'settings.tab.level': 'Nivel',
  'settings.klossar.brandAll': 'Toate',
  'settings.klossar.changeRamp': 'Altă rampă',
  'settings.rampCountHint': 'Aplicația le pune unde ajută cel mai mult.',
  'settings.klossar.selected': 'Aleasă',
  'settings.klossar.stepsHeading': 'Înălțimi de treaptă',

  'status.measuring': 'Se măsoară…',
  'status.almost': 'Aproape nivelat — mai sunt {left}',
  'status.cantLevel.close':
    'Rampele dumneavoastră aproape ajung, dar nu destul aici — mutați vehiculul',
  'status.cantLevel.far': 'Rampele dumneavoastră nu ajung nici pe departe aici — mutați vehiculul',
  'adjustable.before': 'Reglați rampele pe treapta afișată înainte de a urca.',
  'adjustable.after': 'Încă nu este nivelat. Coborâți de pe rampe și aplicația măsoară din nou.',

  'calibration.intro':
    'Puneți telefonul pe o suprafață despre care știți că e orizontală, apoi atingeți Calibrați. ' +
    'Înclinarea actuală devine punctul zero.',
  'calibration.status': 'Calibrat: față/spate {pitch}, lateral {roll}.',
  'calibration.status.none': 'Necalibrat — se folosește senzorul brut.',
  'calibration.now': 'Calibrați',
  'calibration.step.phone.done': 'Telefon calibrat',
  'calibration.step.phone.hint': 'Așezați telefonul pe ceva plan.',
  'calibration.step.flipLink': 'Nimic plan? Întoarceți telefonul',
  'calibration.step.vehicle.done': 'Adus la zero',
  'calibration.step.vehicle.hint':
    'Nivelați vehiculul cu o nivelă cu bulă și puneți telefonul în locul obișnuit.',
  'calibration.step.vehicle.now': 'Aduceți la zero',
  'calibration.clear': 'Ștergeți calibrarea',
  'calibration.err.notRunning':
    'Senzorul de înclinare nu funcționează încă — atingeți întâi Start pe ecranul principal.',
  'calibration.warn.notFlat':
    'Calibrare salvată, dar suprafața nu pare plană (peste 15°), deci probabil e greșită. Nu asta doreați? Atingeți Anulați, așezați telefonul pe o suprafață plană și calibrați din nou.',
  'calibration.undo': 'Anulați',
  'calibration.sensor.h': 'Calibrați telefonul',
  'calibration.vehicle.h': 'Aduceți vehiculul la zero',
  'calibration.vehicle.intro':
    'Calibrarea privește telefonul, nu locul unde stă. Dacă masa e puțin înclinată, aplicația arată acea înclinare. Nivelați vehiculul o dată cu o nivelă cu bulă, puneți telefonul în locul obișnuit și aduceți la zero.',
  'calibration.vehicle.now': 'Aduceți la zero',
  'calibration.vehicle.clear': 'Ștergeți zeroul',
  'calibration.vehicle.status': 'Zeroul vehiculului: față/spate {pitch}, lateral {roll}.',
  'calibration.vehicle.status.none':
    'Vehiculul nu e adus la zero — locul telefonului contează ca orizontal.',
  'calibration.vehicle.warn.notFlat':
    'Zero salvat, dar nu pare orizontal (peste 15°). Nu era vehiculul nivelat? Atingeți Anulați, nivelați vehiculul și aduceți din nou la zero.',
  'calibration.age.today': '(azi)',
  'calibration.age.days': '(acum {n} zile)',
  'calibration.check': 'Verificați',
  'calibration.check.good': 'Încă în regulă — abatere {off}°.',
  'calibration.check.off': 'Abatere {off}° — recalibrați.',
  'calibration.vehicle.check.off': 'Abatere {off}° — aduceți din nou la zero.',
  'calibration.check.none':
    'Încă necalibrat, deci nu e nimic de verificat. Așezați telefonul pe o suprafață orizontală și atingeți „{now}”.',
  'calibration.vehicle.check.none':
    'Încă fără zero, deci nu e nimic de verificat. Nivelați vehiculul cu o nivelă cu bulă și atingeți „{now}”.',
  'calibration.flip.intro':
    'Nicio suprafață orizontală prin preajmă? Folosiți calibrarea prin întoarcere: puneți telefonul oriunde ' +
    'aproximativ plan, măsurați, rotiți telefonul o jumătate de tură (180°) în același ' +
    'loc, măsurați din nou — înclinarea suprafeței se anulează singură.',
  'calibration.flip.start': 'Calibrați prin întoarcere',
  'calibration.flip.rotate':
    'Acum rotiți telefonul o jumătate de tură (180°) în același loc, apoi atingeți Măsurați.',
  'calibration.flip.capture': 'Măsurați',
  'calibration.flip.done': 'Gata! Suprafața este înclinată {surface}° — înclinare anulată.',
  'calibration.flip.warn.moved':
    'Calibrare salvată, dar cele două măsurători diferă cu peste 15°. S-a mișcat telefonul? Atingeți Anulați și reluați.',
  'calibration.pill.notDone': 'NEFĂCUT',
  'calibration.pill.done': 'GATA',
  'calibration.pill.none': 'NICIUNUL',

  'targets.normal': 'Normal (orizontal)',
  'targets.name.placeholder': 'Nume (ex. „Scurgere duș”)',
  'targets.name.label': 'Numele țintei noi',
  'targets.defaultName': 'Ținta {n}',
  'targets.add': 'Salvați înclinarea ca țintă nouă',
  'targets.delete': 'Ștergeți {name}',
  'targets.warn.tooSteep':
    'Țintă salvată, dar este mai abruptă decât o țintă obișnuită (peste 15°). Nu asta doreați? Ștergeți-o cu crucea și salvați din nou.',
  'targets.badge': 'Țintă: {name}',

  'feedback.intro':
    'Ați găsit o problemă sau aveți o idee? Completați formularul și atingeți butonul — se deschide ' +
    'un raport gata făcut pe GitHub, unde îl publicați (aveți nevoie de un cont GitHub ' +
    'gratuit, creat într-un minut).',
  'feedback.category': 'Despre ce este vorba?',
  'feedback.cat.bug': 'Eroare',
  'feedback.cat.suggestion': 'Sugestie',
  'feedback.cat.other': 'Altceva',
  'feedback.title': 'Titlu scurt',
  'feedback.desc': 'Ce s-a întâmplat sau ce v-ați dori?',
  'feedback.submit': 'Deschideți pe GitHub',
  'feedback.warn.title': 'Titlul este gol — puteți trimite raportul oricum.',
  'feedback.warn.desc': 'Descrierea este goală — puteți trimite raportul oricum.',
  'feedback.warn.both': 'Titlul și descrierea sunt goale — puteți trimite raportul oricum.',

  'help.screen.h': 'Citirea ecranului',
  'help.screen.lead':
    'Ecranul arată ce roți trebuie ridicate și cu cât. Treapta 2 înseamnă a doua treaptă a rampei.',
  'help.screen.t':
    'Verde ✓: gata, nimic de făcut.\n' +
    'Portocaliu ↑: urcați roata pe treapta afișată lângă ea.\n' +
    'Roșu ✕: rampele nu ajung aici. Mutați vehiculul.\n' +
    'Gri –: nicio rampă la acea roată. Cifra arată cât lipsește, dacă vreți să puneți altceva sub ea.\n' +
    'Când bula stă la mijloc, vehiculul este nivelat.',
  'help.screen.routine':
    'Urcați, așteptați până când vehiculul stă nemișcat și priviți din nou. Repetați până când toate roțile sunt verzi.',
  'help.what.t':
    'Așezați telefonul orizontal în vehicul, cu partea de sus spre față, de fiecare dată în același loc.\n' +
    'Cu un modul senzor nu contează cum stă telefonul.',
  'help.settings.h': 'Dimensiunile',
  'help.measures.h': 'Introduceți dimensiunile',
  'help.settings.t':
    'Libell calculează cât trebuie ridicată fiecare roată din ampatament și ecartament.\n' +
    'Le găsiți în actele vehiculului sau le măsurați cu ruleta.\n' +
    'Introduceți-le în mm, cm sau inchi, cum ați ales la Afișați lungimile în.\n' +
    'La o rulotă, ampatamentul este distanța de la axă până la roata jockey.\n' +
    'Cu mai multe vehicule, fiecare își păstrează dimensiunile, rampele, zeroul vehiculului, țintele și modulul senzor; alegeți unul în partea de sus a filei Vehicul.',
  'help.ramps.t':
    'Ecranul vă spune pe ce treaptă a rampei urcă fiecare roată, așa că introduceți rampele pe care le aveți.\n' +
    'Alegeți o rampă de serie sau un set propriu și câte aveți. Libell le pune unde ajută cel mai mult.\n' +
    'Dacă aveți o pană fără trepte, alegeți Pană fără trepte și introduceți înălțimea ei. Ecranul spune apoi cât să urcați.',
  'help.calibration.h': 'Calibrare și zero',
  'help.calibration.t':
    'Doi pași fac citirile corecte: calibrați telefonul o dată și aduceți vehiculul la zero o dată.\n' +
    'Calibrare: așezați telefonul pe o suprafață plană și atingeți Calibrați.\n' +
    'Zero: nivelați vehiculul cu o nivelă cu bulă, puneți telefonul în locul obișnuit și atingeți Aduceți la zero.\n' +
    'Cu un modul senzor, aduceți la zero pe pagina modulului. Acesta nu are nevoie de calibrare.\n' +
    'Tot nu e chiar nivelat? Reglați fin zeroul cu Stânga sus, Dreapta sus, Față sus sau Spate sus în Aduceți vehiculul la zero.\n' +
    'Lampa ⚠ Calibrare sau ⚠ Zero rămâne aprinsă până când este gata.',
  'help.sensor.h': 'Modul senzor',
  'help.sensor.t':
    'Un modul senzor din vehicul poate măsura în locul telefonului. Libell funcționează cu acestea:\n' +
    '{upright}: stă vertical, orientat în orice direcție.\n' +
    '{flat}: stă orizontal, cu capacul în sus și o săgeată spre înainte.\n' +
    'Conectați-l cu pictograma senzorului din dreapta sus. Pagina modulului vă conduce apoi prin Alegeți direcția și Aduceți vehiculul la zero.\n' +
    'Funcționează în Chrome sau Edge pe Android ori pe computer. Pe iPhone aveți nevoie de browserul Bluefy.\n' +
    'Dacă modulul respinge codul, Libell cere codul de patru cifre al modulului.',
  'help.targets.h': 'Ținte și sunet',
  'help.targets.t':
    'Salvați înclinarea dorită, de exemplu spre scurgerea dușului, și comutați între ele.\n' +
    'Rulotă: salvați înălțimea de cuplare înainte de a decupla, iar Înapoi la cuplare readuce roata jockey la ea.\n' +
    'Cu ghidarea vocală pornită, aplicația spune ce roată să ridicați și cu cât, ca să puteți nivela fără să vă uitați la telefon.\n' +
    'Butonul din mijlocul barei de jos pornește și oprește sunetul.',
  'help.trouble.h': 'Dacă ceva nu e în regulă',
  'help.trouble.t':
    '„Se măsoară…”: vehiculul se mișcă. Așteptați până stă nemișcat.\n' +
    '„Așezați telefonul orizontal pentru a măsura”: telefonul este prea înclinat pentru a măsura.\n' +
    '„Contact pierdut cu modulul”: atingeți Reconectați și alegeți modulul din listă.\n' +
    '„Se așteaptă senzorul de înclinare…”: încă nicio citire. Pe iPhone, atingeți Start de fiecare dată când deschideți aplicația; altfel reîncărcați.\n' +
    '„Accesul la mișcare a fost refuzat”: permiteți mișcarea și orientarea pentru acest site în setările browserului și reîncărcați.\n' +
    'Tot nu merge? Scrieți un raport la Feedback.',
  'help.open': 'Deschideți {name}',
  'help.open.sensor': 'Deschideți modulul',
  'help.open.feedback': 'Scrieți un raport',

  'main.hint': 'Așezați telefonul orizontal în vehicul, cu marginea de sus spre față.',
  'main.start': 'Start',
  'main.waiting': 'Se așteaptă senzorul de înclinare…',
  'main.level': 'Vehiculul este nivelat!',
  'main.denied':
    'Accesul la mișcare a fost refuzat, așa că Libell nu poate citi înclinarea. ' +
    'Permiteți accesul la mișcare și orientare pentru acest site și reîncărcați.',
  'main.noSensors':
    'Acest dispozitiv nu oferă senzori de mișcare, așa că Libell nu poate citi înclinarea.',
  'main.https':
    'Libell are nevoie de o conexiune securizată (HTTPS) pentru a citi senzorii de înclinare. ' +
    'Deschideți aplicația prin HTTPS și încercați din nou.',

  'diagram.aria': 'Vedere de sus a autorulotei, care arată ce roți trebuie ridicate',
  'diagram.caravan.aria': 'Vedere de sus a rulotei, cu roțile axei și roata jockey',
  'diagram.front': 'Față',
  'diagram.step': 'Treapta {n}',
  'diagram.driveUp': 'Urcați',
  'diagram.done': 'Gata',
  'diagram.noRamp': 'Fără rampă',
  'diagram.wheel.frontLeft': 'Față stânga',
  'diagram.wheel.frontRight': 'Față dreapta',
  'diagram.wheel.rearLeft': 'Spate stânga',
  'diagram.wheel.rearRight': 'Spate dreapta',
  'diagram.notEnough': 'nu ajunge',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Manivela sus',
  'caravan.crankDown': 'Manivela jos',
  'caravan.axleLeft': 'Roata stângă a axei',
  'caravan.axleRight': 'Roata dreaptă a axei',
  'caravan.jockeyWheel': 'Roata jockey',
  'help.screen.caravan': 'Rulotă: roata jockey arată Manivela sus sau Manivela jos și cu cât.',

  'vehicles.title': 'Vehicule',
  'vehicles.defaultName': 'Vehiculul meu',
  'vehicles.numbered': 'Vehiculul {n}',
  'vehicles.name.placeholder': 'Nume (ex. „Rulotă”)',
  'vehicles.name.label': 'Numele vehiculului',
  'vehicles.add': 'Vehicul nou',
  'namePrompt.save': 'Salvați',
  'namePrompt.cancel': 'Anulați',
  'choice.rename': 'Redenumiți {name}',
  'vehicles.badge': 'Vehicul: {name}',
  'vehicles.delete': 'Eliminați {name}',
  'vehicles.remove.confirm':
    'Eliminați {name} împreună cu zeroul vehiculului, țintele și modulul senzor?',
  'vehicles.remove.yes': 'Da, eliminați',
  'vehicles.hint':
    'Dimensiunile, rampele, zeroul vehiculului, țintele și modulul senzor aparțin vehiculului. Calibrarea telefonului este comună.',
  'setup.incoming.addNew': 'Adăugați ca vehicul nou',

  'hitch.title': 'Înălțime de cuplare',
  'hitch.hint':
    'Salvați-o cât timp rulota este încă pe cârligul de remorcare. Înainte de a cupla din nou, roata jockey arată cât să rotiți manivela pentru ca cuplajul să întâlnească bila.',
  'hitch.save': 'Salvați înălțimea',
  'hitch.go': 'Înapoi la cuplare',
  'hitch.done': 'Gata',
  'hitch.savedNow': 'Înălțimea de cuplare a fost salvată.',
  'hitch.status.none': 'Încă nu este salvată nicio înălțime de cuplare.',
  'hitch.status.saved': 'Este salvată o înălțime de cuplare.',
  'hitch.status.active': 'Ecranul principal arată cât să rotiți manivela roții jockey.',
  'hitch.badge': 'Înălțime cuplare',
  'hitch.badge.aria': 'Înălțime de cuplare: atingeți pentru a nivela din nou normal',
  'hitch.crank.up': 'Manivela sus {amount} până la înălțimea de cuplare',
  'hitch.crank.down': 'Manivela jos {amount} până la înălțimea de cuplare',
  'hitch.reached': 'La înălțimea de cuplare',
  'hitch.offer': 'Salvați întâi înălțimea de cuplare?',
  'hitch.offer.save': 'Salvați',
  'hitch.offer.dismiss': 'Nu acum',

  'zeroTrim.title': 'Reglați fin zeroul',
  'zeroTrim.hint':
    'Tot nu e chiar nivelat? Fiecare atingere mută zeroul cu 0,1°, astfel încât aplicația vrea partea respectivă mai sus.',
  'zeroTrim.left': 'Stânga sus',
  'zeroTrim.right': 'Dreapta sus',
  'zeroTrim.front': 'Față sus',
  'zeroTrim.back': 'Spate sus',
  'zeroTrim.side.left': 'Stânga',
  'zeroTrim.side.right': 'Dreapta',
  'zeroTrim.side.front': 'Față',
  'zeroTrim.side.back': 'Spate',
  'zeroTrim.total': 'Reglat fin: {trim}',
  'zeroTrim.none': 'Fără reglaj fin',
  'zeroTrim.reset': 'Resetați reglajul',
  'tilt.frontBack': 'Față/spate',
  'tilt.sideSide': 'Lateral',

  'pose.layFlat': 'Așezați telefonul orizontal pentru a măsura',
  'pose.sensorHint': 'Măsoară corect doar culcat orizontal, cu fața în sus.',
  'pose.openSensorPage': 'Arătați modulul',
  'pose.sensorExtreme': 'Modulul este prea înclinat',
  'pose.sensorUpsideDown': 'Modulul pare întors cu capul în jos',
  'pose.sensorNotUpright': 'Modulul stă culcat',
  'pose.sensorHintUpright': 'Măsoară corect doar în poziție verticală.',
  'calibration.external.h': 'Aduceți vehiculul la zero',
  'calibration.external.intro':
    'Nivelați vehiculul o dată cu o nivelă cu bulă, apoi aduceți la zero.',
  'calibration.external.phoneHidden':
    'Calibrarea proprie a telefonului este ascunsă cât timp măsoară modulul senzor. Pentru a calibra telefonul, deschideți modulul și atingeți întâi „{disconnect}”.',
  'calibration.external.working': 'Se aduce la zero…',
  'calibration.external.done':
    '{name} este adus la zero: această poziție contează acum ca orizontală.',
  'calibration.external.err.notConnected':
    '{name} nu este conectat. Conectați-l și încercați din nou.',
  'calibration.external.err.failed':
    '{name} nu a putut fi adus la zero. Nu s-a modificat nimic. Verificați conexiunea și încercați din nou.',
  'pose.portrait': 'Rotiți telefonul vertical — marginea de sus trebuie să indice înainte',

  'stale.dataUnavailable': 'Nu sosesc date noi de la senzor — ghidarea este întreruptă până revin',

  'sensorFallback.lost': 'Contact pierdut cu modulul',
  'sensorFallback.autoRetry': 'Se reîncearcă automat…',
  'sensorFallback.connect': 'Conectați modulul',
  'sensorFallback.pick': 'Atingeți și alegeți modulul din listă.',
  'sensorFallback.notFound': 'Niciun modul găsit? Verificați că este pornit și aproape.',
  'sensorFallback.retry': 'Reconectați',
  'sensorFallback.usePhone': 'Folosiți telefonul',
  'mounting.prompt.upright':
    'Atingeți direcția în care indică spatele modulului (prinderea cu șurub).',
  'mounting.prompt.arrow':
    'Una dintre săgețile modulului (pe capac sau pe placa de circuit de sub el) indică înainte. Ce latură este spre față?',
  'mounting.placement.wide': 'Latura lungă în față',
  'mounting.placement.short': 'Latura scurtă în față',
  'mounting.facing.front': 'Indică spre față',
  'mounting.facing.right': 'Indică spre dreapta',
  'mounting.facing.rear': 'Indică spre spate',
  'mounting.facing.left': 'Indică spre stânga',
  'box.state.connected': 'Conectat',
  'box.state.lost': 'Contact pierdut',
  'box.state.password': 'Parolă greșită',
  'box.password.label': 'Codul modulului',
  'box.password.retry': 'Reîncercați',
  'box.password.checking': 'Se încearcă codul…',
  'box.password.invalid': 'Codul are patru cifre.',
  'box.password.wrong': 'Modulul nu a acceptat nici acest cod.',
  'box.password.noAnswer':
    'Modulul nu a răspuns. Codul este salvat și va fi încercat data viitoare când modulul se conectează.',
  'box.state.notConnected': 'Neconectat',
  'box.state.battery': 'baterie {value}',
  'box.connect': 'Conectați',
  'box.step.position.upright.ok': 'Stă vertical',
  'box.step.position.upright.bad': 'Stă culcat: puneți-l vertical, orientat în orice direcție',
  'box.step.position.flat.ok': 'Stă orizontal',
  'box.step.position.flat.bad': 'Prea înclinat: așezați-l orizontal, cu fața în sus',
  'box.step.position.flat.upsideDown':
    'Cu capul în jos: întoarceți-l cu capacul în sus. Producătorul nu recomandă montarea cu capul în jos.',
  'box.step.position.waiting': 'Poziție: se așteaptă o citire',
  'box.step.direction.todo': 'Alegeți direcția',
  'box.step.direction.done': 'Direcție setată',
  'box.step.direction.learn': 'Nesigur? Învățați ridicând fața',
  'box.step.zero.todo': 'Aduceți vehiculul la zero',
  'box.step.zero.done': 'Adus la zero',
  'box.step.zero.hint': 'Nivelați vehiculul cu o nivelă cu bulă, apoi aduceți la zero.',
  'box.forgetDirection': 'Ștergeți direcția',
  'onboard.boxPosition.h': 'Poziția modulului',
  'onboard.boxPosition.later':
    'Direcția și zeroul se setează prima dată când parcați. Pagina modulului vă ghidează, iar lampa ⚠ Zero vă amintește până când este gata.',
  'onboard.boxPosition.notConnected':
    'Încă nu este conectat niciun modul, așa că poziția lui nu poate fi afișată. Atingeți {next} și conectați-l mai târziu cu pictograma senzorului din dreapta sus.',
  'sensorList.title': 'Modul senzor',
  'sensorList.phone':
    'Senzorul propriu al telefonului este folosit când nu e conectat niciun modul.',
  'box.step.zero.again': 'Readuceți la zero',
};
