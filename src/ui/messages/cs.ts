import type { Messages } from './en';

/** Czech (Čeština). */
export const cs: Messages = {
  'topbar.install': 'Instalovat',
  'topbar.share': 'Sdílet Libell',
  'bottombar.settings': 'Nastavení',
  'bottombar.sound.mute': 'Ztlumit zvuk',
  'bottombar.sound.unmute': 'Zapnout zvuk',
  'bottombar.help': 'Nápověda',
  'bottombar.label': 'Akce',
  'share.text': 'Vyrovnejte obytný vůz nebo karavan pomocí telefonu.',
  'share.copied': 'Odkaz zkopírován!',
  'update.check': 'Zkontrolovat novou verzi',
  'update.checking': 'Hledání aktualizací…',
  'update.updating': 'Aktualizace na novou verzi…',
  'update.latest': 'Máte nejnovější verzi',
  'update.offline': 'Bez připojení, aktualizace nelze zkontrolovat',
  'update.unsupported': 'Aktualizace tu nejsou k dispozici',
  'install.hint': 'Klepněte na Sdílet a pak na „Přidat na plochu“.',
  'install.row': 'Nainstalujte si Libell jako aplikaci na plochu.',
  'install.close': 'Skrýt',
  'share.vehicle.text': 'Nastavení mého vozidla pro Libell — rozměry a nájezdy.',
  'settings.shareVehicle': 'Poslat na jiný telefon',
  'setup.incoming.h': 'Přijaté nastavení vozidla',
  'setup.incoming.intro': 'Člen rodiny s vámi sdílel tyto rozměry vozidla:',
  'setup.incoming.reminder':
    'Neobsahuje žádnou kalibraci — v tomto telefonu musíte kalibrovat zvlášť.',
  'setup.incoming.apply': 'Nahradit současné vozidlo',
  'setup.incoming.dismiss': 'Teď ne',
  'setup.incoming.invalid': 'Odkaz s nastavením vozidla nelze přečíst — nic se nezměnilo.',

  'lamp.setup': '⚠ Rozměry',
  'lamp.setup.title': 'Rozměry vozidla nebyly nikdy uloženy — klepnutím otevřete Nastavení',
  'lamp.calibrate': '⚠ Kalibrace',
  'lamp.zero': '⚠ Nula',
  'lamp.calibrate.title': 'Telefon není zkalibrovaný — klepnutím otevřete „Kalibrace a nula“',
  'lamp.zero.title': 'Vozidlo není vynulované — klepnutím otevřete „Kalibrace a nula“',
  'lamp.calibrate.title.sensor': 'Box není vynulovaný — klepnutím otevřete stránku boxu',

  'sensorStatus.connected': 'Senzorový box připojen',
  'sensorStatus.disconnected': 'Senzorový box — spojení ztraceno, klepněte pro podrobnosti',
  'sensorStatus.stale': 'Senzorový box — žádná nová data, klepněte pro podrobnosti',
  'sensorStatus.idle': 'Senzorový box — klepnutím připojíte',
  'sensorStatus.idle.guide': 'Senzorový box — klepnutím otevřete návod pro iPhone',

  'menu.title': 'Menu',
  'menu.close': 'Zavřít menu',
  'menu.settings': 'Nastavení',
  'menu.calibration': 'Kalibrace a nula',
  'menu.targets': 'Cíle',
  'menu.feedback': 'Podněty',
  'menu.help': 'Nápověda',
  'menu.intro': 'Zobrazit úvod',
  'menu.about': 'O aplikaci Libell',
  'menu.about.tab': 'Info',
  'menu.sensorSource': 'Senzorový box',

  'sensorSource.connect': 'Připojit senzor {name}',
  'sensorSource.disconnect': 'Odpojit',
  'sensorSource.status.connecting': 'Připojování…',
  'sensorSource.err.unsupported': 'Tento prohlížeč nepodporuje Web Bluetooth.',
  'sensorSource.unsupported.browser':
    'Chcete-li připojit senzorový box, otevřete Libell v Chrome nebo Edge na Androidu nebo v počítači. Vlastní senzor telefonu tu funguje jako obvykle.',
  'sensorSource.err.password':
    'Box {name} nepřijal své heslo. Zadejte níže čtyřmístný kód boxu a klepněte na Opakovat. Tovární kód je 0000. Pokud kód neznáte, změňte ho v aplikaci Xparkle.',
  'sensorSource.err.failed': 'K senzoru {name} se nelze připojit.',

  'sensorSource.ios.intro':
    'Safari se k senzorům Bluetooth nedokáže připojit přímo, ale existuje náhradní řešení:',
  'sensorSource.ios.step1': 'Nainstalujte z App Storu „Bluefy – Web Bluetooth Browser“.',
  'sensorSource.ios.step2': 'Otevřete Bluefy a povolte oprávnění pro Bluetooth.',
  'sensorSource.ios.step3': 'V Bluefy přejděte na stejnou adresu Libell.',
  'sensorSource.ios.step4': 'Tady znovu otevřete Senzorový box — funguje stejně jako na Androidu.',
  'sensorSource.ios.note':
    'Bluefy je aplikace třetí strany, Libell ji nevytvořil — opětovné připojení po otevření ' +
    'aplikace tam může vyžadovat jedno ruční klepnutí, místo aby proběhlo samo.',
  'sensorSource.ios.bluefyLink': 'Najít Bluefy v App Storu',

  'sensorSource.detail.temperature': 'Teplota: {value}',
  'sensorSource.detail.notAvailable': 'Zatím nedostupné',
  'sensorSource.lowBattery':
    '⚠ Slabá baterie ({value}) — zvažte brzkou výměnu baterie senzorového boxu.',

  'sensorSource.install.now': 'Nulovat',
  'sensorSource.install.clear': 'Smazat nulu',
  'sensorSource.install.status': 'Nula: podélně {pitch}, příčně {roll}.',
  'sensorSource.install.status.none': 'Zatím nevynulováno — box měří tak, jak je umístěn.',

  'sensorSource.learn.h': 'Naučit uchycení',
  'sensorSource.learn.intro':
    'Libell zjistí směr ze dvou zvednutí: nejprve přídě, pak pravé strany.',
  'sensorSource.learn.start': 'Naučit uchycení',
  'sensorSource.learn.step.front':
    'Zvedněte příď vozidla o několik centimetrů a pak stiskněte tlačítko.',
  'sensorSource.learn.capture.front': 'Příď je zvednutá',
  'sensorSource.learn.step.right':
    'Příď zase spusťte. Teď zvedněte pravou stranu o několik centimetrů a pak stiskněte tlačítko.',
  'sensorSource.learn.capture.right': 'Pravá strana je zvednutá',
  'sensorSource.learn.cancel': 'Zrušit',
  'sensorSource.learn.status.learned': 'Uchycení naučeno.',
  'sensorSource.learn.status.none': 'Uchycení není naučené — použijí se vlastní směry boxu.',
  'sensorSource.learn.done':
    'Hotovo! Ověřte to: zvedněte příď a Libell by měl ukázat na zadní kola.',
  'sensorSource.learn.err.tooSmall':
    'Vozidlo se téměř nepohnulo. Zvedněte ho trochu víc a zkuste to znovu.',
  'sensorSource.learn.err.ambiguous':
    'Oba směry se pohnuly zhruba stejně. Zvedněte jen příď, pak jen pravou stranu, a zkuste to znovu.',
  'sensorSource.learn.err.arrow':
    'Žádná šipka nemíří dopředu. Otočte box tak, aby jedna z jeho šipek mířila dopředu, a zkuste to znovu.',
  'sensorSource.learn.err.mirrored':
    'Box je zřejmě vzhůru nohama, nebo byla zvednuta nesprávná strana. Zkontrolujte to a zkuste to znovu.',
  'sensorSource.learn.err.sameAxis':
    'Obě zvednutí naklonila vozidlo stejným směrem. Zvedněte nejprve příď, pak pravou stranu, a zkuste to znovu.',

  'sensorStatus.title': 'Senzor {name}',
  'sensorStatus.reading': 'Aktuální náklon: {value}',
  'sensorStatus.debug': 'Ladicí informace',
  'sensorStatus.debug.intro':
    'Surové hodnoty přímo z boxu — pro řešení potíží, když něco nefunguje.',
  'sensorStatus.debug.state': 'Stav připojení: {value}',
  'sensorStatus.debug.deviceId': 'ID zařízení: {value}',
  'sensorStatus.debug.lastSample': 'Poslední vzorek: {value}',
  'sensorStatus.debug.age': 'před {s} s',
  'sensorStatus.debug.rawAccel': 'Surový akcelerometr (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Generace firmwaru: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Surové stavové bajty: {value}',
  'sensorStatus.debug.versionBytes': 'Sériové číslo a firmware (surově): {value}',
  'sensorStatus.debug.copy': 'Kopírovat info',
  'sensorStatus.debug.copied': 'Ladicí informace zkopírovány!',
  'sensorStatus.debug.copy.failed': 'Automatické kopírování se nezdařilo.',
  'sensorStatus.advanced': 'Pokročilé',
  'sensorStatus.silentReconnect.intro':
    'Tento prohlížeč se zatím neumí k boxu znovu připojit sám, takže ho po restartu znovu vyberete v seznamu. V Chrome si to můžete zapnout sami.',
  'sensorStatus.silentReconnect.steps':
    'Otevřete {address}, vyhledejte „web bluetooth“, nastavte „Use the new permissions backend for Web Bluetooth“ na Enabled a klepněte na Relaunch. Pak box jednou připojte.',
  'sensorStatus.silentReconnect.copy': 'Kopírovat {address}',
  'sensorStatus.silentReconnect.copied': 'Zkopírováno — vložte to do adresního řádku Chrome.',
  'sensorStatus.debug.connectDelay.intro':
    'Experimentální: zkuste to jen tehdy, když je připojení boxu nespolehlivé. Přidá pevnou pauzu po připojení, než z něj aplikace začne číst.',
  'sensorStatus.debug.connectDelay.enable': 'Zapnout prodlevu připojení',
  'sensorStatus.debug.connectDelay.ms': 'Prodleva (ms)',

  'about.text':
    'Libell vám pomůže vyrovnat obytný vůz nebo karavan telefonem, který už máte, ' +
    'a to bez hádání.',
  'about.version': 'Verze {v}',
  'about.offline':
    'Funguje zcela offline — síť se používá jen ke stažení aktualizací samotné aplikace.',
  'about.privacy':
    'Vaše nastavení zůstává v telefonu — žádný účet a žádné sledování. Libell odesílá jen anonymní počty toho, jak se aplikace používá, a to můžete vypnout.',
  'about.source': 'Libell je svobodný software s otevřeným kódem (licence MIT).',
  'about.source.link': 'Kód na GitHubu',
  'seo.title': 'Libell – vyrovnejte obytný vůz nebo karavan telefonem',
  'seo.description':
    'Bezplatná aplikace, která ukáže, která kola obytného vozu nebo karavanu zvednout a na který stupeň nájezdu. Používá telefon nebo senzorový box a funguje offline.',
  'menu.privacy': 'Soukromí',
  'menu.privacy.tab': 'Soukromí',
  'privacy.stored.h': 'Uloženo v tomto telefonu',
  'privacy.stored.empty': 'Nic není uloženo.',
  'privacy.raw': 'Zobrazit surová data',
  'privacy.raw.hint': 'Přesně tak, jak jsou uložena. Heslo boxu je skryté.',
  'privacy.resetSettings': 'Obnovit jen nastavení',
  'privacy.deleteAll': 'Smazat všechna data Libell',
  'privacy.deleteAll.confirm':
    'Smazat vše, co Libell uložil v tomto telefonu? Vozidla, rozměry a kalibrace zmizí a Libell začne znovu jako poprvé.',
  'privacy.deleteAll.yes': 'Ano, smazat vše',
  'privacy.deleteAll.cancel': 'Zrušit',
  'privacy.policy': 'Přečíst zásady ochrany soukromí',
  'policy.title': 'Zásady ochrany soukromí aplikace Libell',
  'policy.changed': 'Naposledy změněno {date}',
  'policy.intro':
    'Libell je svobodný open source projekt. Nemá účty, reklamy ani sledování a nikdo o vás nesbírá žádné údaje.',
  'policy.stored.h': 'Co se ukládá do telefonu',
  'policy.stored':
    'Libell ukládá vaše vozidla, rozměry, nastavení, kalibrace, cíle, zvolený jazyk a naposledy použitý senzorový box. Vše je v místním úložišti prohlížeče ve vašem telefonu. Funguje podobně jako cookies, ale nikdy se nikam neposílá. Libell ho potřebuje ke své činnosti, a proto tu není žádné okno se souhlasem.',
  'policy.stored.delete':
    'V aplikaci v {help} › {tab} vidíte vše, co je uloženo, a můžete to celé smazat. Data webu můžete smazat i v prohlížeči.',
  'policy.sensors.h': 'Senzory a Bluetooth',
  'policy.sensors':
    'Pohybové senzory a Bluetooth telefonu se používají jen v telefonu a jen k měření náklonu. Naměřené hodnoty nikdy neopustí telefon.',
  'policy.counting':
    'Aby bylo jasné, co zlepšit, může Libell anonymně počítat používání pomocí služby GoatCounter. Libell se vás jednou zeptá, zda smí počítat, a dokud nezvolíte, nepočítá se nic. Statistiky jsou veřejné.',
  'policy.counting.ip':
    'Jako u každého požadavku na internetu se k GoatCounteru dostane IP adresa telefonu a název prohlížeče. GoatCounter je nikdy neukládá, drží je v paměti nejvýše osm hodin, aby poznal stejnou návštěvu. GoatCounter je provozován z Irska a jeho servery jsou ve Finsku a Německu, takže nic neopouští EU.',
  'policy.counting.change':
    'Svou volbu můžete kdykoli změnit v {help} › {tab}. Bez internetu se nic neposílá a nic se neukládá na později.',
  'policy.counting.basis':
    'Počítání se opírá o oprávněný zájem podle GDPR (čl. 6 odst. 1 písm. f): vědět, co zlepšit. Protože se neukládá nic, co by vás identifikovalo, není o vás co ukázat ani smazat. Stížnost můžete podat u úřadu pro ochranu osobních údajů ve své zemi.',
  'policy.shared.h': 'Co se sami rozhodnete sdílet',
  'policy.shared.feedback':
    'V {help} › {feedback} můžete otevřít připravené hlášení na GitHubu, které sami zveřejníte pod svým vlastním účtem GitHub. Hlášení je veřejné. Kromě vašeho textu obsahuje verzi aplikace, velikost obrazovky, čas a název prohlížeče a vše vidíte před zveřejněním.',
  'policy.shared.vehicle':
    '„{share}“ vytvoří odkaz s rozměry vozidla, bez kalibrace. Odkaz se dostane jen tam, kam ho sami pošlete.',
  'policy.site.h': 'Web',
  'policy.site':
    'Libell běží na GitHub Pages. Jako každý hosting vidí GitHub vaši IP adresu, když se stránka načítá. Libell nemá přístup k záznamům GitHubu.',
  'policy.owner.h': 'Kdo stojí za Libell',
  'policy.owner':
    'Libell patří svému open source projektu, ne osobě ani firmě. Je zdarma a můžete ho používat, jak chcete, podle licence MIT. Poskytuje se tak, jak je, bez záruky.',
  'policy.questions.h': 'Dotazy a změny',
  'policy.questions':
    'Své dotazy pište jako hlášení na GitHubu. Když Libell změní, co ukládá nebo posílá, tato stránka se zároveň aktualizuje.',
  'policy.questions.link': 'Hlášení na GitHubu',
  'policy.languages': 'Další jazyky',
  'policy.open': 'Otevřít Libell',
  'stored.vehicle': 'Vozidlo',
  'stored.vehicle.detail': '{name}, rozvor {wheelbase}',
  'stored.settings': 'Nastavení',
  'stored.settings.detail': 'Rozměry, nájezdy, jednotka, vzhled a zvuk',
  'stored.password': 'Heslo senzorového boxu',
  'stored.language': 'Jazyk',
  'stored.phoneCalibration': 'Kalibrace telefonu',
  'stored.zero': 'Nula vozidla',
  'stored.zeroTrim': 'Doladění nuly',
  'stored.targets': 'Cíle',
  'stored.targets.active': '{name} (vybraný)',
  'stored.hitch': 'Výška spojky',
  'stored.rememberedBox': 'Zapamatovaný senzorový box',
  'stored.notes': 'Vlastní poznámky aplikace',
  'stored.notes.detail': 'Drobné značky: {n}, např. zda byl zobrazen úvod',
  'stored.phone': 'Telefon',
  'stored.saved': 'uloženo',
  'stored.counting.off': 'Vypnuto',
  'stored.savedOn': 'uloženo {date}',

  'intro.h': 'Vítejte v Libell',
  'intro.how': 'Položte telefon naplocho do vozidla a Libell ukáže, která kola zvednout a o kolik.',
  'intro.start': 'Začít',
  'intro.later': 'Nejdřív se rozhlédnout',
  'onboard.source.sensorIcon':
    'Senzorový box můžete kdykoli připojit pomocí ikony senzoru vpravo nahoře.',
  'counting.title': 'Anonymní počítání',
  'counting.intro': 'Libell anonymně počítá používání, abychom věděli, co zlepšit.',
  'counting.sent.h': 'Co se počítá',
  'counting.sent':
    'Že byla aplikace otevřena, které funkce se používají, jaký model senzoru měří (telefon nebo model jako {boxes}), verze aplikace a jazyk zvolený v Libell.',
  'counting.notSent.h': 'Co se nikdy neukládá',
  'counting.notSent':
    'Vaše IP adresa, země, zařízení, obrazovka, operační systém ani prohlížeč, rozměry vozidla, vaše nastavení ani nic jiného o vás. Kvůli počítání se do telefonu nic neukládá.',
  'counting.gpc': 'Pokud váš prohlížeč žádá weby, aby vás nesledovaly, Libell nepočítá nic.',
  'counting.later': 'Kdykoli ho můžete vypnout v {help} › {tab}.',
  'counting.toggle': 'Anonymně počítat mé používání',
  'counting.dashboard': 'Zobrazit statistiky',
  'onboard.sound.h': 'Zvuk',
  'onboard.source.h': 'Čím chcete měřit?',
  'onboard.source.intro':
    'Vyberte, ze kterého senzoru má Libell číst náklon — většina lidí prostě používá telefon.',
  'onboard.source.phone': 'Tento telefon',
  'onboard.source.externalActive':
    'Právě je aktivní senzorový box. Když zvolíte tento telefon, kalibrace telefonu se přeskočí. Chcete-li telefon kalibrovat, otevřete box ikonou senzoru vpravo nahoře a nejprve klepněte na „{disconnect}“.',
  'onboard.vehicle.h': 'Co vyrovnáváte?',
  'onboard.vehicle.intro': 'Vyberte své vozidlo — zbytek průvodce se mu přizpůsobí.',
  'onboard.step1.h': 'Položte telefon takto',
  'onboard.next': 'Další',
  'onboard.back': 'Zpět',
  'onboard.close': 'Zavřít úvod',
  'onboard.done': 'Hotovo',
  'onboard.skipStep': 'Přeskočit',
  'onboard.note.measurements':
    'Když krok přeskočíte, použijí se výchozí rozměry; {lamp} svítí, dokud neuložíte své.',
  'onboard.note.ramps':
    'Když krok přeskočíte, použijí se výchozí nájezdy. Své můžete vybrat později v Nastavení.',
  'onboard.note.calibrate':
    'Teď nemáte po ruce rovnou plochu? Klepněte na {next}; {lamp} vám to bude připomínat, dokud to neuděláte.',
  'onboard.note.connect':
    'Nemáte box po ruce? Klepněte na {next} a připojte ho později ikonou senzoru vpravo nahoře.',
  'onboard.zeroLater':
    'Vozidlo vynulujete, až poprvé zaparkujete na rovině. {lamp} vám to bude připomínat, dokud to neuděláte.',
  'onboard.legend.ok': 'Zelená ✓ — toto kolo je vyrovnané.',
  'onboard.legend.up': 'Oranžová ↑ — najeďte tímto kolem na zobrazený stupeň.',
  'onboard.legend.no': 'Červená ✕ — žádný stupeň nestačí; přejeďte na rovnější místo.',
  'onboard.legend.dim': 'Šedá – — u tohoto kola není nájezd; číslo ukazuje, kolik chybí.',
  'settings.wheelbase': 'Rozvor',
  'settings.trackFront': 'Rozchod vpředu',
  'settings.trackRear': 'Rozchod vzadu',
  'settings.tolerance': 'Tolerance',
  'settings.stability': 'Stabilita',
  'settings.dwellRest': 'Prodleva odezvy (ms)',
  'settings.dwellMotion': 'Prodleva odezvy při úpravách (ms)',
  'settings.dwell.hint': 'Jak dlouho musí hodnota vydržet, než se číslo změní.',
  'settings.vehicle': 'Vozidlo',
  'vehicle.motorhome': 'Obytný vůz',
  'vehicle.caravan': 'Karavan',
  'settings.axleToJockey': 'Náprava – příďové kolo',
  'settings.rearAxle': 'Zadní náprava',
  'settings.axle': 'Náprava',
  'axle.single': 'Jednoduchá',
  'axle.boggie': 'Tandem (dvojnáprava)',
  'settings.track': 'Rozchod',
  'settings.measureHint': 'Najdete je v technickém průkazu. Pár cm sem nebo tam nevadí.',
  'settings.measureHint.caravan': 'Měřte od nápravy k příďovému kolu. Pár cm sem nebo tam nevadí.',
  'settings.measureHint.boggie': 'U tandemové nápravy měřte ke středu dvojice náprav.',
  'settings.steps': 'Výšky stupňů nájezdu',
  'settings.steps.add': 'Přidat',
  'settings.steps.new': 'Výška nového stupně ({unit})',
  'settings.steps.remove': 'Odebrat {value}',
  'settings.ramp': 'Hotový nájezd',
  'settings.ramp.custom': 'Vlastní sada',
  'settings.ramp.stepless': 'Plynulý klín',
  'settings.ramp.steplessModel': '{name} (plynulý, max. {max} mm)',
  'settings.stepless.max': 'Plynulý klín, max. výška',
  'settings.stepless.maxHeading': 'Max. výška',
  'settings.stepless.set': 'Uložit',
  'settings.stepless.new': 'Max. výška ({unit})',
  'settings.rampCount': 'Počet nájezdů',
  'settings.drain': 'Strana odtoku',
  'settings.rampHint': 'Aplikace umístí nájezdy tam, kde nejvíc pomohou.',
  'settings.drainHint': 'V rámci tolerance zůstane tato strana nejníž, aby voda odtékala.',
  'settings.section.vehicle': 'Vozidlo a rozměry',
  'settings.section.ramps': 'Nájezdy',
  'settings.general': 'Obecné',
  'settings.language': 'Jazyk',
  'settings.language.auto': 'Automaticky (jazyk zařízení)',
  'settings.tolerance.hint': 'Jak blízko k vodorovné poloze se ještě počítá jako vyrovnáno.',
  'settings.stability.hint': 'Vyhlazuje drobné kolísání senzoru, aby čísla neblikala.',
  'drain.none': 'Žádný / nezáleží',
  'drain.left': 'Vlevo, uprostřed',
  'drain.right': 'Vpravo, uprostřed',
  'drain.front': 'Vpředu, uprostřed',
  'drain.rear': 'Vzadu, uprostřed',
  'drain.frontLeft': 'Vpředu vlevo',
  'drain.frontRight': 'Vpředu vpravo',
  'drain.rearLeft': 'Vzadu vlevo',
  'drain.rearRight': 'Vzadu vpravo',
  'settings.unit': 'Zobrazit délky v',
  'settings.unitInches': 'palce (in)',
  'settings.theme': 'Motiv',
  'theme.system': 'Podle telefonu',
  'theme.light': 'Světlý',
  'theme.dark': 'Tmavý',
  'settings.appearance': 'Vzhled',
  'appearance.classic': 'Klasický',
  'appearance.modern': 'Moderní',
  'appearance.glossy': 'Lesklý',
  'settings.sound': 'Tón při vyrovnání',
  'settings.soundGuidance': 'Nepřetržité zvukové navádění',
  'settings.soundGuidance.help': 'Pípání se zrychluje a zvyšuje, čím blíž jste k vyrovnání.',
  'settings.soundSpeech': 'Hlasové navádění',
  'settings.soundSpeech.help':
    'Když vozidlo stojí, aplikace řekne, které kolo a o kolik, například „Vzadu vlevo, Stupeň 2“.',
  'settings.soundSpeech.unavailable':
    'Hlasové navádění na tomto telefonu nefunguje: nemá český hlas, který funguje offline. Tóny fungují jako obvykle.',
  'speech.level': 'Vyrovnáno',
  'speech.inches': '{n} palce',
  'speech.inchOne': 'jeden palec',
  'speech.inchOneAnd': 'jeden a {fraction} palce',
  'speech.inchesAnd': '{n} a {fraction} palce',
  'speech.inchFraction': '{fraction} palce',
  'speech.eighth1': 'jedna osmina',
  'speech.eighth2': 'čtvrt',
  'speech.eighth3': 'tři osminy',
  'speech.eighth4': 'půl',
  'speech.eighth5': 'pět osmin',
  'speech.eighth6': 'tři čtvrtě',
  'speech.eighth7': 'sedm osmin',
  'settings.undo': 'Zpět',
  'settings.saved': 'Uloženo',
  'settings.more': 'Více',
  'settings.fineTuning': 'Jemné ladění',
  'settings.resetAll': 'Obnovit výchozí',
  'settings.err.positive': 'Zadejte číslo větší než 0. Nadále platí předchozí hodnota.',
  'settings.err.notNegative': 'Zadejte 0 nebo víc. Nadále platí předchozí hodnota.',
  'settings.err.range': 'Zadejte číslo od {min} do {max}. Nadále platí předchozí hodnota.',

  'settings.tab.vehicle': 'Vozidlo',
  'settings.tab.ramps': 'Nájezdy',
  'settings.tab.level': 'Rovina',
  'settings.klossar.brandAll': 'Vše',
  'settings.klossar.changeRamp': 'Jiný nájezd',
  'settings.rampCountHint': 'Aplikace je umístí tam, kde nejvíc pomohou.',
  'settings.klossar.selected': 'Vybráno',
  'settings.klossar.stepsHeading': 'Výšky stupňů',

  'status.measuring': 'Měření…',
  'status.almost': 'Téměř vyrovnáno — zbývá {left}',
  'status.cantLevel.close': 'Vaše nájezdy tu skoro stačí, ale ne úplně — přeparkujte vozidlo',
  'status.cantLevel.far': 'Vaše nájezdy tu zdaleka nestačí — přeparkujte vozidlo',
  'adjustable.before': 'Nastavte nájezdy na zobrazený stupeň a pak najeďte.',
  'adjustable.after': 'Ještě není vyrovnáno. Sjeďte z nájezdů a aplikace změří znovu.',

  'calibration.intro':
    'Položte telefon na plochu, o které víte, že je vodorovná, a klepněte na Kalibrovat. ' +
    'Aktuální náklon se stane referenčním bodem.',
  'calibration.status': 'Kalibrováno: podélně {pitch}, příčně {roll}.',
  'calibration.status.none': 'Nekalibrováno — používá se surový senzor.',
  'calibration.now': 'Kalibrovat',
  'calibration.step.phone.done': 'Telefon zkalibrován',
  'calibration.step.phone.hint': 'Položte telefon na něco rovného.',
  'calibration.step.flipLink': 'Nic rovného? Otočte telefon',
  'calibration.step.vehicle.done': 'Vynulováno',
  'calibration.step.vehicle.hint':
    'Vyrovnejte vozidlo vodováhou a položte telefon na jeho obvyklé místo.',
  'calibration.step.vehicle.now': 'Nulovat',
  'calibration.clear': 'Smazat kalibraci',
  'calibration.err.notRunning':
    'Senzor náklonu ještě neběží — nejprve klepněte na hlavní obrazovce na Start.',
  'calibration.warn.notFlat':
    'Kalibrace uložena, ale plocha nevypadá rovně (přes 15°), takže je asi chybná. Nechtěli jste to? Klepněte na Zpět, položte telefon na rovnou plochu a kalibrujte znovu.',
  'calibration.undo': 'Zpět',
  'calibration.sensor.h': 'Kalibrovat telefon',
  'calibration.vehicle.h': 'Vynulovat vozidlo',
  'calibration.vehicle.intro':
    'Kalibrace se týká telefonu, ne místa, kde leží. Když je stůl trochu nakloněný, aplikace ten náklon ukáže. Jednou vyrovnejte vozidlo vodováhou, položte telefon na jeho obvyklé místo a vynulujte.',
  'calibration.vehicle.now': 'Nulovat',
  'calibration.vehicle.clear': 'Smazat nulu',
  'calibration.vehicle.status': 'Nula vozidla: podélně {pitch}, příčně {roll}.',
  'calibration.vehicle.status.none': 'Vozidlo nemá nulu — místo telefonu se počítá jako rovné.',
  'calibration.vehicle.warn.notFlat':
    'Nula uložena, ale nevypadá to vodorovně (přes 15°). Nebylo vozidlo vyrovnané? Klepněte na Zpět, vyrovnejte vozidlo a vynulujte znovu.',
  'calibration.age.today': '(dnes)',
  'calibration.age.days': '(před {n} d)',
  'calibration.check': 'Ověřit',
  'calibration.check.good': 'Stále v pořádku — odchylka {off}°.',
  'calibration.check.off': 'Odchylka {off}° — zvažte novou kalibraci.',
  'calibration.vehicle.check.off': 'Odchylka {off}° — zvažte nové vynulování.',
  'calibration.check.none':
    'Zatím nekalibrováno, takže není co ověřit. Položte telefon na vodorovnou plochu a klepněte na „{now}“.',
  'calibration.vehicle.check.none':
    'Zatím bez nuly, takže není co ověřit. Vyrovnejte vozidlo vodováhou a klepněte na „{now}“.',
  'calibration.flip.intro':
    'Žádná vodorovná plocha poblíž? Použijte kalibraci otočením: položte telefon kamkoli, ' +
    'kde je to přibližně rovné, změřte, otočte telefon o půl otáčky (180°) na stejném ' +
    'místě a změřte znovu — náklon plochy se vyruší.',
  'calibration.flip.start': 'Kalibrovat otočením',
  'calibration.flip.rotate':
    'Nyní otočte telefon o půl otáčky (180°) na stejném místě a klepněte na Změřit.',
  'calibration.flip.capture': 'Změřit',
  'calibration.flip.done': 'Hotovo! Vaše plocha se naklání o {surface}° — vyrušeno.',
  'calibration.flip.warn.moved':
    'Kalibrace uložena, ale obě měření se liší o víc než 15°. Pohnul se telefon? Klepněte na Zpět a začněte znovu.',
  'calibration.pill.notDone': 'NEHOTOVO',
  'calibration.pill.done': 'HOTOVO',
  'calibration.pill.none': 'ŽÁDNÁ',

  'targets.normal': 'Normální (vodorovně)',
  'targets.name.placeholder': 'Název (např. „Odtok sprchy“)',
  'targets.name.label': 'Název nového cíle',
  'targets.defaultName': 'Cíl {n}',
  'targets.add': 'Uložit současný náklon jako cíl',
  'targets.delete': 'Smazat {name}',
  'targets.warn.tooSteep':
    'Cíl uložen, ale je strmější než obvyklý cíl (přes 15°). Nechtěli jste to? Smažte ho křížkem a uložte znovu.',
  'targets.badge': 'Cíl: {name}',

  'feedback.intro':
    'Našli jste problém nebo máte nápad? Vyplňte formulář a klepněte na tlačítko — otevře ' +
    'se připravené hlášení na GitHubu, kde ho odešlete (je potřeba bezplatný účet GitHub, ' +
    'založíte ho za minutu).',
  'feedback.category': 'Čeho se to týká?',
  'feedback.cat.bug': 'Chyba',
  'feedback.cat.suggestion': 'Návrh',
  'feedback.cat.other': 'Jiné',
  'feedback.title': 'Krátký název',
  'feedback.desc': 'Co se stalo, nebo co byste si přáli?',
  'feedback.submit': 'Otevřít na GitHubu',
  'feedback.warn.title': 'Název je prázdný — hlášení přesto můžete odeslat.',
  'feedback.warn.desc': 'Popis je prázdný — hlášení přesto můžete odeslat.',
  'feedback.warn.both': 'Název i popis jsou prázdné — hlášení přesto můžete odeslat.',

  'help.screen.h': 'Jak číst obrazovku',
  'help.screen.lead':
    'Obrazovka ukazuje, která kola zvednout a o kolik. Stupeň 2 znamená druhý stupeň vašeho nájezdu.',
  'help.screen.t':
    'Zelená ✓: hotovo, nic dělat nemusíte.\n' +
    'Oranžová ↑: najeďte tímto kolem na stupeň zobrazený vedle něj.\n' +
    'Červená ✕: vaše nájezdy tu nestačí. Přeparkujte vozidlo.\n' +
    'Šedá –: u tohoto kola není nájezd. Číslo ukazuje, kolik chybí, pokud pod kolo chcete podložit něco jiného.\n' +
    'Když bublina spočine uprostřed, je vozidlo vyrovnané.',
  'help.screen.routine':
    'Najeďte, počkejte, až se vozidlo uklidní, a podívejte se znovu. Opakujte, dokud nejsou všechna kola zelená.',
  'help.what.t':
    'Položte telefon naplocho do vozidla, horní hranou dopředu, pokaždé na stejné místo.\n' +
    'Se senzorovým boxem nezáleží na tom, jak telefon leží.',
  'help.settings.h': 'Rozměry',
  'help.measures.h': 'Zadejte rozměry',
  'help.settings.t':
    'Libell z rozvoru a rozchodu vypočítá, o kolik musí každé kolo stoupnout.\n' +
    'Najdete je v technickém průkazu vozidla, nebo je změřte metrem.\n' +
    'Zadejte je v mm, cm nebo palcích, podle toho, co jste zvolili v Zobrazit délky v.\n' +
    'U karavanu je rozvor vzdálenost od nápravy k příďovému kolu.\n' +
    'Máte-li více vozidel, každé má své rozměry, nájezdy, nulu vozidla, cíle a senzorový box; vyberte jedno nahoře na kartě Vozidlo.',
  'help.ramps.t':
    'Obrazovka vám řekne, na který stupeň nájezdu má každé kolo najet, proto zadejte nájezdy, které vozíte.\n' +
    'Vyberte hotový nájezd nebo vlastní sadu a kolik jich máte. Libell je umístí tam, kde nejvíc pomohou.\n' +
    'Pro nájezd bez stupňů zvolte Plynulý klín a zadejte jeho výšku. Obrazovka pak ukáže, o kolik najet.',
  'help.calibration.h': 'Kalibrace a nula',
  'help.calibration.t':
    'Dva kroky zajistí správné hodnoty: jednou kalibrujte telefon a jednou vynulujte vozidlo.\n' +
    'Kalibrace: položte telefon na rovnou plochu a klepněte na Kalibrovat.\n' +
    'Nula: vyrovnejte vozidlo vodováhou, položte telefon na jeho obvyklé místo a klepněte na Nulovat.\n' +
    'Se senzorovým boxem nulujete na stránce boxu. Ten kalibraci nepotřebuje.\n' +
    'Stále ne úplně rovně? Dolaďte nulu tlačítky Levá výš, Pravá výš, Příď výš nebo Záď výš v části Vynulovat vozidlo.\n' +
    'Kontrolka ⚠ Kalibrace nebo ⚠ Nula svítí, dokud to není hotové.',
  'help.sensor.h': 'Senzorový box',
  'help.sensor.t':
    'Senzorový box ve vozidle může měřit místo telefonu. Libell funguje s těmito:\n' +
    '{upright}: stojí svisle, natočený libovolně.\n' +
    '{flat}: leží naplocho, víčkem nahoru, jednou šipkou dopředu.\n' +
    'Připojte ho ikonou senzoru vpravo nahoře. Stránka boxu vás pak provede kroky Zvolit směr a Vynulovat vozidlo.\n' +
    'Funguje v Chrome nebo Edge na Androidu či v počítači. Na iPhonu potřebujete prohlížeč Bluefy.\n' +
    'Pokud box odmítne kód, Libell se zeptá na jeho čtyřmístný kód.',
  'help.targets.h': 'Cíle a zvuk',
  'help.targets.t':
    'Uložte si požadovaný náklon jako cíl, například směrem k odtoku sprchy, a přepínejte mezi cíli.\n' +
    'Karavan: před odpojením uložte výšku spojky a Zpět na výšku spojky pak navede příďové kolo zpět na ni.\n' +
    'Se zapnutým hlasovým naváděním aplikace řekne, které kolo zvednout a o kolik, takže můžete vyrovnávat, aniž byste viděli na telefon.\n' +
    'Tlačítko uprostřed spodní lišty zapíná a vypíná zvuk.',
  'help.trouble.h': 'Když něco nefunguje',
  'help.trouble.t':
    '„Měření…“: vozidlo se houpe. Počkejte, až se uklidní.\n' +
    '„Položte telefon naplocho pro měření“: telefon je na měření příliš nakloněný.\n' +
    '„Spojení s boxem ztraceno“: klepněte na Připojit a vyberte box v seznamu.\n' +
    '„Čekání na senzor náklonu…“: zatím žádné hodnoty. Na iPhonu klepněte při každém otevření aplikace na Start; jinak stránku znovu načtěte.\n' +
    '„Přístup k pohybu byl odepřen“: povolte pro tento web v nastavení prohlížeče pohyb a orientaci a stránku znovu načtěte.\n' +
    'Stále něco nesedí? Napište hlášení v části Podněty.',
  'help.open': 'Otevřít {name}',
  'help.open.sensor': 'Otevřít box',
  'help.open.feedback': 'Napsat hlášení',

  'main.hint': 'Položte telefon naplocho do vozidla, horní hranou dopředu.',
  'main.start': 'Start',
  'main.waiting': 'Čekání na senzor náklonu…',
  'main.level': 'Vaše vozidlo je vyrovnané!',
  'main.denied':
    'Přístup k pohybu byl odepřen, takže Libell nemůže číst náklon. ' +
    'Povolte pro tento web přístup k pohybu a orientaci a stránku znovu načtěte.',
  'main.noSensors': 'Toto zařízení neposkytuje pohybové senzory, takže Libell nemůže číst náklon.',
  'main.https':
    'Libell potřebuje ke čtení senzorů náklonu zabezpečené připojení (HTTPS). ' +
    'Otevřete aplikaci přes HTTPS a zkuste to znovu.',

  'diagram.aria': 'Pohled shora na váš obytný vůz, který ukazuje, která kola je třeba zvednout',
  'diagram.caravan.aria': 'Pohled shora na váš karavan s koly nápravy a příďovým kolem',
  'diagram.front': 'Příď',
  'diagram.step': 'Stupeň {n}',
  'diagram.driveUp': 'Najet',
  'diagram.done': 'Hotovo',
  'diagram.noRamp': 'Bez nájezdu',
  'diagram.wheel.frontLeft': 'Vpředu vlevo',
  'diagram.wheel.frontRight': 'Vpředu vpravo',
  'diagram.wheel.rearLeft': 'Vzadu vlevo',
  'diagram.wheel.rearRight': 'Vzadu vpravo',
  'diagram.notEnough': 'nestačí',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Točit nahoru',
  'caravan.crankDown': 'Točit dolů',
  'caravan.axleLeft': 'Levé kolo nápravy',
  'caravan.axleRight': 'Pravé kolo nápravy',
  'caravan.jockeyWheel': 'Příďové kolo',
  'help.screen.caravan': 'Karavan: u příďového kola je Točit nahoru nebo Točit dolů a o kolik.',

  'vehicles.title': 'Vozidla',
  'vehicles.defaultName': 'Moje vozidlo',
  'vehicles.numbered': 'Vozidlo {n}',
  'vehicles.name.placeholder': 'Název (např. „Karavan“)',
  'vehicles.name.label': 'Název vozidla',
  'vehicles.add': 'Nové vozidlo',
  'namePrompt.save': 'Uložit',
  'namePrompt.cancel': 'Zrušit',
  'choice.rename': 'Přejmenovat {name}',
  'vehicles.badge': 'Vozidlo: {name}',
  'vehicles.delete': 'Smazat {name}',
  'vehicles.remove.confirm': 'Smazat {name} včetně nuly vozidla, cílů a senzorového boxu?',
  'vehicles.remove.yes': 'Ano, smazat',
  'vehicles.hint':
    'Rozměry, nájezdy, nula vozidla, cíle a senzorový box patří k vozidlu. Kalibrace telefonu je společná.',
  'setup.incoming.addNew': 'Přidat jako nové',

  'hitch.title': 'Výška spojky',
  'hitch.hint':
    'Uložte ji, dokud je karavan ještě zapřažený na kouli. Před dalším zapřažením příďové kolo ukáže, o kolik točit, aby spojka dosedla na kouli.',
  'hitch.save': 'Uložit výšku',
  'hitch.go': 'Zpět na výšku spojky',
  'hitch.done': 'Hotovo',
  'hitch.savedNow': 'Výška spojky uložena.',
  'hitch.status.none': 'Výška spojky zatím není uložena.',
  'hitch.status.saved': 'Výška spojky je uložena.',
  'hitch.status.active': 'Hlavní obrazovka ukazuje, o kolik točit příďovým kolem.',
  'hitch.badge': 'Výška spojky',
  'hitch.badge.aria': 'Výška spojky: klepnutím se vrátíte k běžnému vyrovnávání',
  'hitch.crank.up': 'Točte nahoru o {amount} na výšku spojky',
  'hitch.crank.down': 'Točte dolů o {amount} na výšku spojky',
  'hitch.reached': 'Na výšce spojky',
  'hitch.offer': 'Nejdřív uložit výšku spojky?',
  'hitch.offer.save': 'Uložit',
  'hitch.offer.dismiss': 'Teď ne',

  'zeroTrim.title': 'Doladit nulu',
  'zeroTrim.hint':
    'Stále ne úplně rovně? Každé klepnutí posune nulu o 0,1°, takže aplikace bude chtít tuto stranu výš.',
  'zeroTrim.left': 'Levá výš',
  'zeroTrim.right': 'Pravá výš',
  'zeroTrim.front': 'Příď výš',
  'zeroTrim.back': 'Záď výš',
  'zeroTrim.side.left': 'Levá',
  'zeroTrim.side.right': 'Pravá',
  'zeroTrim.side.front': 'Příď',
  'zeroTrim.side.back': 'Záď',
  'zeroTrim.total': 'Doladěno: {trim}',
  'zeroTrim.none': 'Nedoladěno',
  'zeroTrim.reset': 'Zrušit doladění',
  'tilt.frontBack': 'Podélně',
  'tilt.sideSide': 'Příčně',

  'pose.layFlat': 'Položte telefon naplocho pro měření',
  'pose.sensorHint': 'Měří správně jen naplocho, horní stranou nahoru.',
  'pose.openSensorPage': 'Ukázat box',
  'pose.sensorExtreme': 'Box je příliš nakloněný',
  'pose.sensorUpsideDown': 'Box je zřejmě vzhůru nohama',
  'pose.sensorNotUpright': 'Box leží',
  'pose.sensorHintUpright': 'Měří správně jen ve svislé poloze.',
  'calibration.external.h': 'Vynulovat vozidlo',
  'calibration.external.intro': 'Jednou vyrovnejte vozidlo vodováhou a pak vynulujte.',
  'calibration.external.phoneHidden':
    'Kalibrace telefonu je skrytá, dokud měří senzorový box. Chcete-li kalibrovat telefon, otevřete box a nejprve klepněte na „{disconnect}“.',
  'calibration.external.working': 'Nulování…',
  'calibration.external.done': '{name} je vynulovaný: tato poloha teď platí jako vodorovná.',
  'calibration.external.err.notConnected': '{name} není připojen. Připojte ho a zkuste to znovu.',
  'calibration.external.err.failed':
    '{name} nelze vynulovat. Nic se nezměnilo. Zkontrolujte připojení a zkuste to znovu.',
  'pose.portrait': 'Otočte telefon na výšku — horní hrana musí mířit dopředu',

  'stale.dataUnavailable':
    'Žádná nová data ze senzoru — navádění je pozastaveno, dokud se neobnoví',

  'sensorFallback.lost': 'Spojení s boxem ztraceno',
  'sensorFallback.autoRetry': 'Automaticky zkouším znovu…',
  'sensorFallback.connect': 'Připojte box',
  'sensorFallback.pick': 'Klepněte a vyberte svůj box v seznamu.',
  'sensorFallback.notFound': 'Box nenalezen? Zkontrolujte, že je zapnutý a nablízku.',
  'sensorFallback.retry': 'Připojit',
  'sensorFallback.usePhone': 'Použít raději telefon',
  'mounting.prompt.upright': 'Klepněte na směr, kam míří zadní strana boxu (úchyt na šroub).',
  'mounting.prompt.arrow':
    'Jedna ze šipek boxu (na víčku nebo na desce plošných spojů pod ním) míří dopředu. Která strana míří k přídi?',
  'mounting.placement.wide': 'Dlouhá strana vpřed',
  'mounting.placement.short': 'Krátká strana vpřed',
  'mounting.facing.front': 'Míří dopředu',
  'mounting.facing.right': 'Míří doprava',
  'mounting.facing.rear': 'Míří dozadu',
  'mounting.facing.left': 'Míří doleva',
  'box.state.connected': 'Připojeno',
  'box.state.lost': 'Spojení ztraceno',
  'box.state.password': 'Špatné heslo',
  'box.password.label': 'Kód boxu',
  'box.password.retry': 'Opakovat',
  'box.password.checking': 'Zkouším kód…',
  'box.password.invalid': 'Kód má čtyři číslice.',
  'box.password.wrong': 'Box nepřijal ani tento kód.',
  'box.password.noAnswer': 'Box neodpověděl. Kód je uložen a zkusí se při příštím připojení boxu.',
  'box.state.notConnected': 'Nepřipojeno',
  'box.state.battery': 'baterie {value}',
  'box.connect': 'Připojit',
  'box.step.position.upright.ok': 'Stojí svisle',
  'box.step.position.upright.bad': 'Leží: postavte ho svisle, natočený libovolně',
  'box.step.position.flat.ok': 'Naplocho',
  'box.step.position.flat.bad': 'Příliš nakloněný: položte ho naplocho, horní stranou nahoru',
  'box.step.position.flat.upsideDown':
    'Vzhůru nohama: otočte ho víčkem nahoru. Výrobce nedoporučuje montáž vzhůru nohama.',
  'box.step.position.waiting': 'Poloha: čekám na měření',
  'box.step.direction.todo': 'Zvolit směr',
  'box.step.direction.done': 'Směr nastaven',
  'box.step.direction.learn': 'Nevíte? Zjistěte ho zvednutím přídě',
  'box.step.zero.todo': 'Vynulovat vozidlo',
  'box.step.zero.done': 'Vynulováno',
  'box.step.zero.hint': 'Vyrovnejte vozidlo vodováhou a pak vynulujte.',
  'box.forgetDirection': 'Smazat směr',
  'onboard.boxPosition.h': 'Poloha boxu',
  'onboard.boxPosition.later':
    'Směr a nula se nastaví, až poprvé zaparkujete. Stránka boxu vás provede a kontrolka ⚠ Nula vám to bude připomínat, dokud to neuděláte.',
  'onboard.boxPosition.notConnected':
    'Zatím není připojen žádný box, takže jeho polohu nelze zobrazit. Klepněte na {next} a připojte ho později ikonou senzoru vpravo nahoře.',
  'sensorList.title': 'Senzorový box',
  'sensorList.phone': 'Když není připojen žádný box, použije se vlastní senzor telefonu.',
  'box.step.zero.again': 'Znovu nulovat',
};
