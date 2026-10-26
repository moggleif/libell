import type { Messages } from './en';

/** Slovenian. */
export const sl: Messages = {
  'topbar.install': 'Namesti',
  'topbar.share': 'Deli Libell',
  'bottombar.settings': 'Nastavitve',
  'bottombar.sound.mute': 'Izklopi zvok',
  'bottombar.sound.unmute': 'Vklopi zvok',
  'bottombar.help': 'Pomoč',
  'bottombar.label': 'Dejanja',
  'share.text': 'Izravnajte avtodom ali počitniško prikolico s telefonom.',
  'share.copied': 'Povezava kopirana!',
  'update.check': 'Preveri, ali je na voljo nova različica',
  'update.checking': 'Preverjanje posodobitev…',
  'update.updating': 'Posodabljanje na novo različico…',
  'update.latest': 'Imate najnovejšo različico',
  'update.offline': 'Ni povezave, posodobitev ni mogoče preveriti',
  'update.unsupported': 'Posodobitve tukaj niso na voljo',
  'install.hint': 'Tapnite „Deli“, nato „Dodaj na začetni zaslon“.',
  'install.row': 'Namestite Libell kot aplikacijo na začetni zaslon.',
  'install.close': 'Skrij',
  'share.vehicle.text': 'Nastavitve mojega vozila za Libell — mere in rampe.',
  'settings.shareVehicle': 'Pošlji na drug telefon',
  'setup.incoming.h': 'Prejete nastavitve vozila',
  'setup.incoming.intro': 'Družinski član vam je poslal te mere vozila:',
  'setup.incoming.reminder':
    'Kalibracija ni vključena — ta telefon boste morali še vedno kalibrirati.',
  'setup.incoming.apply': 'Zamenjaj trenutno vozilo',
  'setup.incoming.dismiss': 'Ne zdaj',
  'setup.incoming.invalid':
    'Povezave z nastavitvami vozila ni bilo mogoče prebrati — nič ni bilo spremenjeno.',

  'lamp.setup': '⚠ Mere',
  'lamp.setup.title': 'Mere vozila še niso bile shranjene — tapnite, da odprete Nastavitve',
  'lamp.calibrate': '⚠ Kalibracija',
  'lamp.zero': '⚠ Ničla',
  'lamp.calibrate.title': 'Telefon ni kalibriran — tapnite, da odprete „Kalibracija in ničla“',
  'lamp.zero.title': 'Ničla vozila ni nastavljena — tapnite, da odprete „Kalibracija in ničla“',
  'lamp.calibrate.title.sensor': 'Ničla enote ni nastavljena — tapnite, da odprete enoto',
  'sensorStatus.connected': 'Senzorska enota povezana',
  'sensorStatus.disconnected': 'Senzorska enota — ni povezave, tapnite za podrobnosti',
  'sensorStatus.stale': 'Senzorska enota — ni novih podatkov, tapnite za podrobnosti',
  'sensorStatus.idle': 'Senzorska enota — tapnite za povezavo',
  'sensorStatus.idle.guide': 'Senzorska enota — tapnite za navodila za iPhone',

  'menu.title': 'Meni',
  'menu.close': 'Zapri meni',
  'menu.settings': 'Nastavitve',
  'menu.calibration': 'Kalibracija in ničla',
  'menu.targets': 'Cilji',
  'menu.feedback': 'Odziv',
  'menu.help': 'Pomoč',
  'menu.intro': 'Prikaži uvod',
  'menu.about': 'O aplikaciji Libell',
  'menu.about.tab': 'Info',
  'menu.sensorSource': 'Senzorska enota',
  'sensorSource.connect': 'Poveži senzor {name}',
  'sensorSource.disconnect': 'Odklopi',
  'sensorSource.status.connecting': 'Povezovanje…',
  'sensorSource.err.unsupported': 'Ta brskalnik ne podpira Web Bluetooth.',
  'sensorSource.unsupported.browser':
    'Za povezavo senzorske enote odprite Libell v brskalniku Chrome ali Edge v Androidu ali na računalniku. Lastni senzor telefona tukaj deluje kot običajno.',
  'sensorSource.err.password':
    'Enota {name} ni sprejela gesla. Spodaj vnesite štirimestno kodo enote in tapnite „Ponovi“. Tovarniška koda je 0000. Če kode ne poznate, jo spremenite v aplikaciji Xparkle.',
  'sensorSource.err.failed': 'Povezava s senzorjem {name} ni uspela.',
  'sensorSource.ios.intro':
    'Safari se ne more neposredno povezati s senzorji Bluetooth, vendar obstaja rešitev:',
  'sensorSource.ios.step1': 'Iz trgovine App Store namestite „Bluefy – Web Bluetooth Browser“.',
  'sensorSource.ios.step2': 'Odprite Bluefy in dovolite dostop do Bluetootha.',
  'sensorSource.ios.step3': 'V Bluefyju odprite isti naslov Libell.',
  'sensorSource.ios.step4': 'Tukaj znova odprite „Senzorska enota“ — deluje kot v Androidu.',
  'sensorSource.ios.note':
    'Bluefy je aplikacija drugega ponudnika, ki je ni izdelal Libell — ponovna povezava ob odprtju aplikacije bo tam morda zahtevala en ročni dotik, namesto da bi potekala samodejno.',
  'sensorSource.ios.bluefyLink': 'Poišči Bluefy v App Store',
  'sensorSource.detail.temperature': 'Temperatura: {value}',
  'sensorSource.detail.notAvailable': 'Še ni na voljo',
  'sensorSource.lowBattery':
    '⚠ Baterija je skoraj prazna ({value}) — kmalu zamenjajte baterijo senzorske enote.',
  'sensorSource.install.now': 'Nastavi ničlo',
  'sensorSource.install.clear': 'Pozabi ničlo',
  'sensorSource.install.status': 'Ničla: vzdolžno {pitch}, prečno {roll}.',
  'sensorSource.install.status.none': 'Ničla še ni nastavljena — enota meri tako, kot stoji.',
  'sensorSource.learn.h': 'Zaznaj namestitev',
  'sensorSource.learn.intro':
    'Libell zazna smer iz dveh dvigov: najprej sprednjega dela, nato desne strani.',
  'sensorSource.learn.start': 'Zaznaj namestitev',
  'sensorSource.learn.step.front':
    'Dvignite sprednji del vozila za nekaj centimetrov, nato pritisnite gumb.',
  'sensorSource.learn.capture.front': 'Spredaj dvignjeno',
  'sensorSource.learn.step.right':
    'Sprednji del znova spustite. Zdaj dvignite desno stran za nekaj centimetrov, nato pritisnite gumb.',
  'sensorSource.learn.capture.right': 'Desna stran dvignjena',
  'sensorSource.learn.cancel': 'Prekliči',
  'sensorSource.learn.status.learned': 'Namestitev zaznana.',
  'sensorSource.learn.status.none': 'Namestitev ni zaznana — uporabljajo se lastne smeri enote.',
  'sensorSource.learn.done':
    'Končano! Preverite: dvignite sprednji del in Libell bi moral pokazati zadnji kolesi.',
  'sensorSource.learn.err.tooSmall':
    'Vozilo se je komaj premaknilo. Dvignite ga malo bolj in poskusite znova.',
  'sensorSource.learn.err.ambiguous':
    'Obe smeri sta se spremenili približno enako. Dvignite samo sprednji del, nato samo desno stran, in poskusite znova.',
  'sensorSource.learn.err.arrow':
    'Nobena puščica ne kaže naprej. Obrnite enoto tako, da ena od njenih puščic kaže naprej, nato poskusite znova.',
  'sensorSource.learn.err.mirrored':
    'Enota je videti obrnjena na glavo ali pa je bila dvignjena napačna stran. Preverite in poskusite znova.',
  'sensorSource.learn.err.sameAxis':
    'Oba dviga sta nagnila vozilo v isto smer. Najprej dvignite sprednji del, nato desno stran, in poskusite znova.',
  'sensorStatus.title': 'Senzor {name}',
  'sensorStatus.reading': 'Trenutni nagib: {value}',
  'sensorStatus.debug': 'Diagnostični podatki',
  'sensorStatus.debug.intro':
    'Surove vrednosti neposredno iz enote — za odpravljanje težav, če kaj ne deluje.',
  'sensorStatus.debug.state': 'Stanje povezave: {value}',
  'sensorStatus.debug.deviceId': 'ID naprave: {value}',
  'sensorStatus.debug.lastSample': 'Zadnja meritev: {value}',
  'sensorStatus.debug.age': 'pred {s} s',
  'sensorStatus.debug.rawAccel': 'Pospeškomer, surovo (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Generacija firmvera: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Surovi bajti stanja: {value}',
  'sensorStatus.debug.versionBytes': 'Serijska številka in firmver (surovo): {value}',
  'sensorStatus.debug.copy': 'Kopiraj podatke',
  'sensorStatus.debug.copied': 'Diagnostični podatki kopirani!',
  'sensorStatus.debug.copy.failed': 'Samodejno kopiranje ni uspelo.',
  'sensorStatus.advanced': 'Napredno',
  'sensorStatus.silentReconnect.intro':
    'Ta brskalnik se z enoto še ne more sam znova povezati, zato jo po ponovnem zagonu znova izberete na seznamu. V Chromu lahko to vklopite sami.',
  'sensorStatus.silentReconnect.steps':
    'Odprite {address}, poiščite „web bluetooth“, nastavite „Use the new permissions backend for Web Bluetooth“ na Enabled in tapnite Relaunch. Nato enoto enkrat povežite.',
  'sensorStatus.silentReconnect.copy': 'Kopiraj {address}',
  'sensorStatus.silentReconnect.copied': 'Kopirano — prilepite v naslovno vrstico Chroma.',
  'sensorStatus.debug.connectDelay.intro':
    'Poskusno: uporabite le, če je povezava z enoto nezanesljiva. Doda stalen premor po povezavi, preden aplikacija začne brati podatke.',
  'sensorStatus.debug.connectDelay.enable': 'Vklopi zakasnitev povezave',
  'sensorStatus.debug.connectDelay.ms': 'Zakasnitev (ms)',

  'about.text':
    'Libell vam pomaga izravnati avtodom ali počitniško prikolico s telefonom, ki ga že imate, brez ugibanja.',
  'about.version': 'Različica {v}',
  'about.offline':
    'Deluje popolnoma brez povezave — omrežje se uporablja le za prenos posodobitev same aplikacije.',
  'about.privacy':
    'Vaše nastavitve ostanejo na telefonu — brez računa in brez sledenja. Libell pošilja le anonimne številke o tem, kako se aplikacija uporablja, in to lahko izklopite.',
  'about.source': 'Libell je brezplačen in odprtokoden (licenca MIT).',
  'about.source.link': 'Koda na GitHubu',
  'seo.title': 'Libell – izravnajte avtodom ali počitniško prikolico s telefonom',
  'seo.description':
    'Brezplačna aplikacija, ki pokaže, katera kolesa avtodoma ali počitniške prikolice dvigniti in na katero stopnico rampe. Uporablja telefon ali senzorsko enoto in deluje brez povezave.',
  'landing.how.h': 'Kako deluje',
  'landing.how.phone':
    'Telefon položite ravno v vozilo, z zgornjim robom proti sprednjemu delu. Libell pokaže avtodom ali počitniško prikolico od zgoraj in za vsako kolo, na katero stopnico rampe zapeljete.',
  'landing.how.ramps':
    'Vnesite rampe, ki jih vozite s seboj, in Libell načrtuje z njimi: katera kolesa dvigniti, na katero stopnico in kdaj rampe ne zadoščajo in je bolje premakniti vozilo.',
  'landing.how.caravan':
    'Pri počitniški prikolici Libell izravna os in pove, za koliko vrtite oporno kolo gor ali dol.',
  'landing.how.box':
    'Namesto telefona lahko meri senzorska enota, nameščena v vozilu. Libell deluje z {boxes}.',
  'landing.how.app':
    'Libell deluje v brskalniku brez računa in ga lahko namestite na začetni zaslon. Je brezplačen in odprtokoden.',
  'landing.faq.h': 'Pogosta vprašanja',
  'landing.faq.level.q': 'Kako izravnati avtodom s telefonom?',
  'landing.faq.level.a':
    'Odprite Libell, vnesite mere vozila in rampe ter telefon položite ravno, z vrhom proti sprednjemu delu. Z vsakim oranžnim kolesom zapeljite na prikazano stopnico, počakajte, da se vozilo umiri, in ponovno poglejte. Ko so vsa kolesa zelena, stojite vodoravno.',
  'landing.faq.free.q': 'Ali Libell kaj stane?',
  'landing.faq.free.a':
    'Ne. Libell je brezplačen, brez oglasov in brez računa, njegova izvorna koda pa je odprta (licenca MIT).',
  'landing.faq.box.q': 'Ali potrebujem senzorsko enoto?',
  'landing.faq.box.a':
    'Ne, dovolj je senzor v telefonu. Senzorska enota ostane nameščena v vozilu, zato je telefon prost in mu ni treba ležati na istem mestu.',
  'landing.faq.offline.q': 'Ali deluje brez interneta?',
  'landing.faq.privacy.q': 'Kaj Libell shrani o meni?',
  'menu.privacy': 'Zasebnost',
  'menu.privacy.tab': 'Zasebnost',
  'privacy.stored.h': 'Shranjeno v tem telefonu',
  'privacy.stored.empty': 'Nič ni shranjeno.',
  'privacy.raw': 'Pokaži surove podatke',
  'privacy.raw.hint': 'Natanko tako, kot je shranjeno. Geslo enote je skrito.',
  'privacy.resetSettings': 'Ponastavi samo nastavitve',
  'privacy.deleteAll': 'Izbriši vse podatke Libell',
  'privacy.deleteAll.confirm':
    'Izbrisati vse, kar je Libell shranil v ta telefon? Vozila, mere in kalibracija izginejo, Libell pa se zažene znova kot prvič.',
  'privacy.deleteAll.yes': 'Da, izbriši vse',
  'privacy.deleteAll.cancel': 'Prekliči',
  'privacy.policy': 'Preberite pravilnik o zasebnosti',
  'policy.title': 'Pravilnik o zasebnosti aplikacije Libell',
  'policy.changed': 'Nazadnje spremenjeno {date}',
  'policy.intro':
    'Libell je prost odprtokodni projekt. Ni računov, oglasov ali sledenja in nihče ne zbira podatkov o vas.',
  'policy.stored.h': 'Kaj se shrani v telefon',
  'policy.stored':
    'Libell shrani vaša vozila, mere, nastavitve, kalibracije, cilje, izbrani jezik in senzorsko enoto, ki ste jo nazadnje uporabili. Vse je v lokalni shrambi brskalnika na vašem telefonu. Deluje podobno kot piškotki, vendar se nikoli nikamor ne pošlje. Libell jo potrebuje za delovanje, zato ni okna za privolitev.',
  'policy.stored.delete':
    'V aplikaciji pod {help} › {tab} vidite vse, kar je shranjeno, in lahko vse izbrišete. Podatke spletnega mesta lahko izbrišete tudi v brskalniku.',
  'policy.sensors.h': 'Senzorji in Bluetooth',
  'policy.sensors':
    'Senzorji gibanja in Bluetooth telefona se uporabljajo samo na telefonu in samo za merjenje nagiba. Odčitki nikoli ne zapustijo telefona.',
  'policy.counting':
    'Da bi vedeli, kaj izboljšati, lahko Libell anonimno šteje uporabo z GoatCounterjem. Libell vas enkrat vpraša, ali sme šteti, in nič se ne šteje, dokler ne izberete. Statistika je javna.',
  'policy.counting.ip':
    'Kot pri vsaki zahtevi na internetu pridejo naslov IP telefona in ime brskalnika do GoatCounterja. GoatCounter jih nikoli ne shrani, ampak jih hrani v pomnilniku največ osem ur, da prepozna isti obisk. GoatCounter upravljajo z Irske, strežniki pa so na Finskem in v Nemčiji, zato nič ne zapusti EU.',
  'policy.counting.change':
    'Svojo izbiro lahko kadar koli spremenite pod {help} › {tab}. Brez interneta se nič ne pošlje in nič se ne hrani za pozneje.',
  'policy.counting.basis':
    'Štetje temelji na vaši privolitvi po GDPR-ju (člen 6(1)(a)): daste jo s svojo izbiro in jo lahko kadar koli prekličete. Ker se ne shrani nič, kar bi vas identificiralo, o vas ni ničesar za prikaz ali izbris. Pritožbo lahko vložite pri organu za varstvo podatkov v svoji državi.',
  'policy.shared.h': 'Kaj se sami odločite deliti',
  'policy.shared.feedback':
    'Pod {help} › {feedback} lahko odprete pripravljeno prijavo na GitHubu, ki jo objavite sami s svojim računom GitHub. Prijava je javna. Poleg vašega besedila vsebuje različico aplikacije, velikost zaslona, čas in ime brskalnika, vse pa vidite pred objavo.',
  'policy.shared.vehicle':
    '„{share}“ ustvari povezavo z merami vozila, brez kalibracije. Povezava pride samo tja, kamor jo pošljete sami.',
  'policy.site.h': 'Spletno mesto',
  'policy.site':
    'Libell gostuje na GitHub Pages. Kot vsak spletni gostitelj GitHub vidi vaš naslov IP, ko se stran naloži. Libell nima dostopa do GitHubovih dnevnikov.',
  'policy.owner.h': 'Kdo stoji za Libellom',
  'policy.owner':
    'Libell pripada svojemu odprtokodnemu projektu, ne osebi ali podjetju. Je brezplačen in ga lahko uporabljate, kakor želite, pod licenco MIT, ponujen pa je takšen, kot je, brez jamstva.',
  'policy.questions.h': 'Vprašanja in spremembe',
  'policy.questions':
    'Vprašanja zastavite kot prijavo na GitHubu. Ko Libell spremeni, kaj shranjuje ali pošilja, se ta stran hkrati posodobi.',
  'policy.questions.link': 'Prijave na GitHubu',
  'policy.languages': 'Drugi jeziki',
  'policy.open': 'Odprite Libell',
  'stored.vehicle': 'Vozilo',
  'stored.vehicle.detail': '{name}, medosna razdalja {wheelbase}',
  'stored.settings': 'Nastavitve',
  'stored.settings.detail': 'Mere, rampe, enota, videz in zvok',
  'stored.password': 'Geslo senzorske enote',
  'stored.language': 'Jezik',
  'stored.phoneCalibration': 'Kalibracija telefona',
  'stored.zero': 'Ničla vozila',
  'stored.zeroTrim': 'Fina nastavitev ničle',
  'stored.targets': 'Cilji',
  'stored.targets.active': '{name} (izbran)',
  'stored.hitch': 'Višina priklopa',
  'stored.rememberedBox': 'Zapomnjena senzorska enota',
  'stored.notes': 'Lastni zapiski aplikacije',
  'stored.notes.detail': 'Drobne oznake: {n}, npr. ali je bil uvod prikazan',
  'stored.phone': 'Telefon',
  'stored.saved': 'shranjeno',
  'stored.counting.off': 'Izklopljeno',
  'stored.counting.on': 'Vklopljeno',
  'stored.savedOn': 'shranjeno {date}',

  'intro.h': 'Dobrodošli v Libellu',
  'intro.how':
    'Položite telefon ravno v vozilo in Libell pokaže, katera kolesa dvigniti in za koliko.',
  'intro.start': 'Začnite',
  'intro.later': 'Najprej razglejte',
  'onboard.source.sensorIcon':
    'Senzorsko enoto lahko kadar koli povežete z ikono senzorja zgoraj desno.',
  'counting.title': 'Anonimno štetje',
  'counting.intro': 'Libell lahko anonimno šteje uporabo, da vemo, kaj izboljšati.',
  'counting.sent.h': 'Kaj se šteje',
  'counting.sent':
    'Da je bila aplikacija odprta, katere funkcije se uporabljajo, kateri model senzorja meri (telefon ali model, kot je {boxes}), različica aplikacije in jezik, izbran v Libellu.',
  'counting.notSent.h': 'Česa se nikoli ne shrani',
  'counting.notSent':
    'Vašega naslova IP, države, naprave, zaslona, operacijskega sistema ali brskalnika, mer vozila, vaših nastavitev ali česar koli drugega o vas. V telefon se shrani samo vaša izbira.',
  'counting.gpc':
    'Če vaš brskalnik prosi spletna mesta, naj vam ne sledijo, Libell ne šteje ničesar.',
  'counting.later': 'Svojo izbiro lahko kadar koli spremenite v {help} › {tab}.',
  'counting.toggle': 'Anonimno štetje moje uporabe',
  'counting.dashboard': 'Oglejte si statistiko',
  'counting.ask': 'Bi radi pomagali izboljšati Libell?',
  'counting.yes': 'Da, šteti anonimno',
  'counting.no': 'Ne, hvala',
  'onboard.sound.h': 'Zvok',
  'onboard.source.h': 'S čim želite meriti?',
  'onboard.source.intro':
    'Izberite, iz katerega senzorja naj Libell bere nagib — večina uporabnikov uporablja kar telefon.',
  'onboard.source.phone': 'Ta telefon',
  'onboard.source.externalActive':
    'Senzorska enota je zdaj aktivna. Če izberete ta telefon, se kalibracija telefona preskoči. Za kalibracijo telefona najprej odprite enoto z ikono senzorja zgoraj desno in tapnite „{disconnect}“.',
  'onboard.vehicle.h': 'Kaj izravnavate?',
  'onboard.vehicle.intro': 'Izberite vozilo — preostanek vodnika se mu prilagodi.',
  'onboard.step1.h': 'Telefon položite takole',
  'onboard.next': 'Naprej',
  'onboard.back': 'Nazaj',
  'onboard.close': 'Zapri uvod',
  'onboard.done': 'Končano',
  'onboard.skipStep': 'Preskoči',
  'onboard.note.measurements':
    'Če preskočite, se uporabijo privzete mere; lučka „{lamp}“ sveti, dokler ne shranite svojih.',
  'onboard.note.ramps':
    'Če preskočite, se uporabijo privzete rampe. Svoje lahko izberete pozneje v Nastavitvah.',
  'onboard.note.calibrate':
    'Trenutno nimate ravne površine? Tapnite „{next}“; lučka „{lamp}“ vas opominja, dokler tega ne storite.',
  'onboard.note.connect':
    'Enote nimate pri roki? Tapnite „{next}“ in jo povežite pozneje z ikono senzorja zgoraj desno.',
  'onboard.zeroLater':
    'Ničlo vozila nastavite, ko prvič parkirate na ravnem. Lučka „{lamp}“ vas opominja, dokler tega ne storite.',
  'onboard.legend.ok': 'Zeleno ✓ — to kolo je vodoravno.',
  'onboard.legend.up': 'Oranžno ↑ — zapeljite kolo na prikazano stopnico.',
  'onboard.legend.no': 'Rdeče ✕ — nobena stopnica ne zadošča; premaknite se na bolj ravno mesto.',
  'onboard.legend.dim': 'Sivo – — pri tem kolesu ni rampe; številka pokaže, koliko manjka.',

  'settings.wheelbase': 'Medosna razdalja',
  'settings.trackFront': 'Kolotek spredaj',
  'settings.trackRear': 'Kolotek zadaj',
  'settings.tolerance': 'Toleranca',
  'settings.stability': 'Stabilnost',
  'settings.dwellRest': 'Zakasnitev odziva (ms)',
  'settings.dwellMotion': 'Zakasnitev odziva med prilagajanjem (ms)',
  'settings.dwell.hint': 'Kako dolgo mora meritev zdržati, preden se številka spremeni.',
  'settings.vehicle': 'Vozilo',
  'vehicle.motorhome': 'Avtodom',
  'vehicle.caravan': 'Počitniška prikolica',
  'settings.axleToJockey': 'Od osi do opornega kolesa',
  'settings.rearAxle': 'Zadnja os',
  'settings.axle': 'Os',
  'axle.single': 'Enojna',
  'axle.boggie': 'Tandem (dvojna)',
  'settings.track': 'Kolotek',
  'settings.measureHint': 'Najdete jih v dokumentih vozila. Nekaj cm razlike ni pomembno.',
  'settings.measureHint.caravan':
    'Izmerite od osi do opornega kolesa. Nekaj cm razlike ni pomembno.',
  'settings.measureHint.boggie': 'Pri tandemski osi merite do sredine para osi.',
  'settings.steps': 'Višine stopnic rampe',
  'settings.steps.add': 'Dodaj stopnico',
  'settings.steps.new': 'Višina nove stopnice ({unit})',
  'settings.steps.remove': 'Odstrani {value}',
  'settings.ramp': 'Gotova rampa',
  'settings.ramp.custom': 'Lasten nabor',
  'settings.ramp.stepless': 'Klin brez stopnic',
  'settings.ramp.steplessModel': '{name} (brez stopnic, največ {max} mm)',
  'settings.stepless.max': 'Klin brez stopnic, največja višina',
  'settings.stepless.maxHeading': 'Največja višina',
  'settings.stepless.set': 'Shrani',
  'settings.stepless.new': 'Največja višina ({unit})',
  'settings.rampCount': 'Število ramp',
  'settings.drain': 'Stran odtoka',
  'settings.rampHint': 'Aplikacija postavi rampe tja, kjer najbolj pomagajo.',
  'settings.drainHint': 'V okviru tolerance ostane ta stran najnižja, da voda odteče.',
  'settings.section.vehicle': 'Vozilo in mere',
  'settings.section.ramps': 'Rampe',
  'settings.general': 'Splošno',
  'settings.language': 'Jezik',
  'settings.language.auto': 'Samodejno (jezik naprave)',
  'settings.tolerance.hint': 'Kako blizu vodoravne lege še šteje kot vodoravno.',
  'settings.stability.hint': 'Zgladi drobno tresenje senzorja, da številke ne utripajo.',
  'drain.none': 'Brez / ni pomembno',
  'drain.left': 'Levo, sredina',
  'drain.right': 'Desno, sredina',
  'drain.front': 'Spredaj, sredina',
  'drain.rear': 'Zadaj, sredina',
  'drain.frontLeft': 'Spredaj levo',
  'drain.frontRight': 'Spredaj desno',
  'drain.rearLeft': 'Zadaj levo',
  'drain.rearRight': 'Zadaj desno',
  'settings.unit': 'Dolžine prikaži v',
  'settings.unitInches': 'palci (in)',
  'settings.theme': 'Tema',
  'theme.system': 'Kot v telefonu',
  'theme.light': 'Svetla',
  'theme.dark': 'Temna',
  'settings.appearance': 'Videz',
  'appearance.classic': 'Klasičen',
  'appearance.modern': 'Sodoben',
  'appearance.glossy': 'Bleščeč',
  'settings.sound': 'Zvok, ko je vodoravno',
  'settings.soundGuidance': 'Neprekinjeno zvočno vodenje',
  'settings.soundGuidance.help':
    'Piskanje postaja hitrejše in višje, čim bližje ste vodoravni legi.',
  'settings.soundSpeech': 'Glasovno vodenje',
  'settings.soundSpeech.help':
    'Ko vozilo miruje, aplikacija pove, katero kolo in koliko, na primer „Zadaj levo, Stopnica 2“.',
  'settings.soundSpeech.unavailable':
    'Glasovno vodenje na tem telefonu ne deluje: nima slovenskega glasu, ki bi deloval brez povezave. Toni delujejo kot običajno.',
  'speech.level': 'Vodoravno',
  'speech.inches': '{n} palci',
  'speech.inchOne': 'en palec',
  'speech.inchOneAnd': 'en palec in {fraction}',
  'speech.inchesAnd': '{n} in {fraction} palca',
  'speech.inchFraction': '{fraction} palca',
  'speech.eighth1': 'ena osmina',
  'speech.eighth2': 'četrt',
  'speech.eighth3': 'tri osmine',
  'speech.eighth4': 'pol',
  'speech.eighth5': 'pet osmin',
  'speech.eighth6': 'tri četrtine',
  'speech.eighth7': 'sedem osmin',
  'settings.undo': 'Razveljavi',
  'settings.saved': 'Shranjeno',
  'settings.more': 'Več',
  'settings.fineTuning': 'Natančna nastavitev',
  'settings.resetAll': 'Ponastavi vse',
  'settings.err.positive': 'Vnesite število, večje od 0. Še vedno velja prejšnja vrednost.',
  'settings.err.notNegative': 'Vnesite 0 ali več. Še vedno velja prejšnja vrednost.',
  'settings.err.range': 'Vnesite število od {min} do {max}. Še vedno velja prejšnja vrednost.',
  'settings.tab.vehicle': 'Vozilo',
  'settings.tab.ramps': 'Rampe',
  'settings.tab.level': 'Izravnava',
  'settings.klossar.brandAll': 'Vse',
  'settings.klossar.changeRamp': 'Druga rampa',
  'settings.rampCountHint': 'Aplikacija jih postavi tja, kjer najbolj pomagajo.',
  'settings.klossar.selected': 'Izbrano',
  'settings.klossar.stepsHeading': 'Višine stopnic',

  'status.measuring': 'Merjenje…',
  'status.almost': 'Skoraj vodoravno — še {left}',
  'status.cantLevel.close': 'Rampe tukaj skoraj zadoščajo, a ne povsem — premaknite vozilo',
  'status.cantLevel.far': 'Rampe tukaj še zdaleč ne zadoščajo — premaknite vozilo',
  'adjustable.before': 'Nastavi rampe na prikazano stopnico, nato zapelji nanje.',
  'adjustable.after': 'Še ni vodoravno. Zapelji z ramp in aplikacija bo izmerila znova.',

  'calibration.intro':
    'Telefon položite na površino, za katero veste, da je vodoravna, in tapnite „Kalibriraj“. Trenutni nagib postane izhodišče.',
  'calibration.status': 'Kalibrirano: vzdolžno {pitch}, prečno {roll}.',
  'calibration.status.none': 'Ni kalibrirano — uporablja se surovi senzor.',
  'calibration.now': 'Kalibriraj',
  'calibration.step.phone.done': 'Telefon kalibriran',
  'calibration.step.phone.hint': 'Telefon položite na nekaj ravnega.',
  'calibration.step.flipLink': 'Ni ravne podlage? Obrni telefon',
  'calibration.step.vehicle.done': 'Ničla nastavljena',
  'calibration.step.vehicle.hint':
    'Vozilo izravnajte z libelo in telefon položite na njegovo običajno mesto.',
  'calibration.step.vehicle.now': 'Nastavi ničlo',
  'calibration.clear': 'Izbriši kalibracijo',
  'calibration.err.notRunning':
    'Senzor nagiba še ne deluje — najprej tapnite „Začni“ na glavnem zaslonu.',
  'calibration.warn.notFlat':
    'Kalibracija je shranjena, vendar površina ni videti ravna (več kot 15°), zato je verjetno napačna. Niste tega želeli? Tapnite „Razveljavi“, položite telefon na ravno površino in ponovno kalibrirajte.',
  'calibration.undo': 'Razveljavi',
  'calibration.sensor.h': 'Kalibriraj telefon',
  'calibration.vehicle.h': 'Nastavi ničlo vozila',
  'calibration.vehicle.intro':
    'Kalibracija se nanaša na telefon, ne na mesto, kjer leži. Če je miza nekoliko nagnjena, aplikacija pokaže ta nagib. Vozilo enkrat izravnajte z libelo, telefon položite na običajno mesto in nastavite ničlo.',
  'calibration.vehicle.now': 'Nastavi ničlo',
  'calibration.vehicle.clear': 'Pozabi ničlo',
  'calibration.vehicle.status': 'Ničla vozila: vzdolžno {pitch}, prečno {roll}.',
  'calibration.vehicle.status.none': 'Ni ničle vozila — mesto telefona šteje kot vodoravno.',
  'calibration.vehicle.warn.notFlat':
    'Ničla je shranjena, vendar to ni videti vodoravno (več kot 15°). Vozilo ni bilo vodoravno? Tapnite „Razveljavi“, izravnajte vozilo in ponovno nastavite ničlo.',
  'calibration.age.today': '(danes)',
  'calibration.age.days': '(pred {n} d)',
  'calibration.check': 'Preveri',
  'calibration.check.good': 'Še vedno dobro — odstopanje {off}°.',
  'calibration.check.off': 'Odstopanje {off}° — razmislite o ponovni kalibraciji.',
  'calibration.vehicle.check.off': 'Odstopanje {off}° — razmislite o ponovni nastavitvi ničle.',
  'calibration.check.none':
    'Telefon še ni kalibriran, zato ni kaj preveriti. Položite ga na vodoravno površino in tapnite „{now}“.',
  'calibration.vehicle.check.none':
    'Ničla še ni nastavljena, zato ni kaj preveriti. Vozilo izravnajte z libelo in tapnite „{now}“.',
  'calibration.flip.intro':
    'Ni vodoravne površine v bližini? Uporabite kalibracijo z obračanjem: telefon položite na katero koli približno ravno mesto, zajemite meritev, telefon na istem mestu zavrtite za pol obrata (180°) in ponovno zajemite — nagib površine se izniči.',
  'calibration.flip.start': 'Kalibriraj z obratom',
  'calibration.flip.rotate':
    'Zdaj telefon na istem mestu zavrtite za pol obrata (180°) in tapnite „Zajemi“.',
  'calibration.flip.capture': 'Zajemi',
  'calibration.flip.done': 'Končano! Površina je nagnjena za {surface}° — to je izničeno.',
  'calibration.flip.warn.moved':
    'Kalibracija je shranjena, vendar se meritvi razlikujeta za več kot 15°. Se je telefon premaknil? Tapnite „Razveljavi“ in začnite znova.',
  'calibration.pill.notDone': 'ČAKA',
  'calibration.pill.done': 'GOTOVO',
  'calibration.pill.none': 'NI',

  'targets.normal': 'Običajno (vodoravno)',
  'targets.name.placeholder': 'Ime (npr. „Odtok prhe“)',
  'targets.name.label': 'Ime novega cilja',
  'targets.defaultName': 'Cilj {n}',
  'targets.add': 'Shrani nagib kot nov cilj',
  'targets.delete': 'Izbriši {name}',
  'targets.warn.tooSteep':
    'Cilj je shranjen, vendar je bolj strm od običajnega cilja (več kot 15°). Niste tega želeli? Izbrišite ga s križcem in shranite znova.',
  'targets.badge': 'Cilj: {name}',

  'feedback.intro':
    'Ste našli težavo ali imate idejo? Izpolnite obrazec in tapnite gumb — odpre se pripravljeno poročilo na GitHubu, kjer ga objavite (potreben je brezplačen račun GitHub, ustvarite ga v minuti).',
  'feedback.category': 'Na kaj se nanaša?',
  'feedback.cat.bug': 'Napaka',
  'feedback.cat.suggestion': 'Predlog',
  'feedback.cat.other': 'Drugo',
  'feedback.title': 'Kratek naslov',
  'feedback.desc': 'Kaj se je zgodilo ali kaj si želite?',
  'feedback.submit': 'Odpri na GitHubu',
  'feedback.warn.title': 'Naslov je prazen — poročilo lahko vseeno pošljete.',
  'feedback.warn.desc': 'Opis je prazen — poročilo lahko vseeno pošljete.',
  'feedback.warn.both': 'Naslov in opis sta prazna — poročilo lahko vseeno pošljete.',

  'help.screen.h': 'Branje zaslona',
  'help.screen.lead':
    'Zaslon pokaže, katera kolesa je treba dvigniti in za koliko. „Stopnica 2“ pomeni drugo stopnico vaše rampe.',
  'help.screen.t':
    'Zeleno ✓: končano, ni treba storiti ničesar.\n' +
    'Oranžno ↑: zapeljite to kolo na stopnico, prikazano poleg njega.\n' +
    'Rdeče ✕: vaše rampe tukaj ne zadoščajo. Premaknite vozilo.\n' +
    'Sivo –: pri tem kolesu ni rampe. Številka pokaže, koliko manjka, če želite podenj podložiti kaj drugega.\n' +
    'Ko mehurček miruje na sredini, je vozilo vodoravno.',
  'help.screen.routine':
    'Zapeljite gor, počakajte, da se vozilo umiri, in poglejte znova. Ponavljajte, dokler niso vsa kolesa zelena.',
  'help.what.t':
    'Telefon položite ravno v vozilo, z zgornjim robom naprej, vsakič na isto mesto.\n' +
    'S senzorsko enoto ni pomembno, kako telefon leži.',
  'help.settings.h': 'Mere',
  'help.measures.h': 'Vnesite mere',
  'help.settings.t':
    'Libell iz medosne razdalje in koloteka izračuna, za koliko je treba dvigniti vsako kolo.\n' +
    'Najdete ju v dokumentih vozila ali ju izmerite z metrom.\n' +
    'Vnesite ju v mm, cm ali palcih, odvisno od izbire pod „Dolžine prikaži v“.\n' +
    'Pri počitniški prikolici je medosna razdalja razdalja od osi do opornega kolesa.\n' +
    'Pri več vozilih ima vsako svoje mere, rampe, ničlo vozila, cilje in senzorsko enoto; izberite ga na vrhu zavihka „Vozilo“.',
  'help.ramps.t':
    'Zaslon pokaže, na katero stopnico rampe zapeljete s posameznim kolesom, zato vnesite rampe, ki jih vozite s seboj.\n' +
    'Izberite gotovo rampo ali lasten nabor in koliko ramp imate. Libell jih postavi tja, kjer najbolj pomagajo.\n' +
    'Za rampo brez stopnic izberite „Klin brez stopnic“ in vnesite njegovo višino. Zaslon nato pove, koliko naj zapeljete gor.\n' +
    'Nastavljivo rampo, kot je Lippert LEVEL9, nastavite na pravo stopnico, preden zapeljete nanjo. Vrstica nad vozilom pove, kdaj zapeljati z nje in jo znova nastaviti.',
  'help.calibration.h': 'Kalibracija in ničla',
  'help.calibration.t':
    'Za pravilne meritve sta potrebna dva koraka: enkrat kalibrirajte telefon in enkrat nastavite ničlo vozila.\n' +
    'Kalibracija: telefon položite na ravno površino in tapnite „Kalibriraj“.\n' +
    'Ničla: vozilo izravnajte z libelo, telefon položite na običajno mesto in tapnite „Nastavi ničlo“.\n' +
    'S senzorsko enoto ničlo nastavite na strani enote. Kalibracije ne potrebuje.\n' +
    'Še vedno ni povsem vodoravno? Ničlo natančno prilagodite z „Levo gor“, „Desno gor“, „Spredaj gor“ ali „Zadaj gor“ v „Nastavi ničlo vozila“.\n' +
    'Lučka „⚠ Kalibracija“ ali „⚠ Ničla“ sveti, dokler to ni opravljeno.',
  'help.sensor.h': 'Senzorska enota',
  'help.sensor.t':
    'Senzorska enota v vozilu lahko meri namesto telefona. Libell deluje s temi:\n' +
    '{upright}: stoji pokonci, obrnjena v katero koli smer.\n' +
    '{flat}: leži ravno, s pokrovom navzgor in z eno puščico, usmerjeno naprej.\n' +
    'Povežite jo z ikono senzorja zgoraj desno. Stran enote vas nato vodi skozi „Izberi smer“ in „Nastavi ničlo vozila“.\n' +
    'Deluje v brskalniku Chrome ali Edge v Androidu ali na računalniku. Na iPhonu potrebujete brskalnik Bluefy.\n' +
    'Če enota zavrne kodo, vas Libell vpraša za njeno štirimestno kodo.',
  'help.targets.h': 'Cilji in zvok',
  'help.targets.t':
    'Shranite želeni nagib kot cilj, na primer proti odtoku prhe, in preklapljajte med cilji.\n' +
    'Počitniška prikolica: pred odklopom shranite višino priklopa, „Na višino priklopa“ pa vas z opornim kolesom vodi nazaj nanjo.\n' +
    'Ko je glasovno vodenje vklopljeno, aplikacija pove, katero kolo dvigniti in za koliko, tako da lahko izravnavate, ne da bi gledali telefon.\n' +
    'Gumb na sredini spodnje vrstice vklopi in izklopi zvok.',
  'help.trouble.h': 'Če kaj ni v redu',
  'help.trouble.t':
    '„Merjenje…“: vozilo se ziblje. Počakajte, da se umiri.\n' +
    '„Za merjenje položite telefon ravno“: telefon je preveč nagnjen za merjenje.\n' +
    '„Povezava z enoto je prekinjena“: tapnite „Poveži znova“ in izberite enoto na seznamu.\n' +
    '„Čakam na senzor nagiba…“: še ni meritev. Na iPhonu tapnite „Začni“ ob vsakem odprtju aplikacije; sicer znova naložite stran.\n' +
    '„Dostop do senzorjev gibanja je bil zavrnjen“: v nastavitvah brskalnika tej strani dovolite dostop do gibanja in usmerjenosti ter znova naložite stran.\n' +
    'Še vedno ni v redu? Napišite poročilo v zavihku „Odziv“.',
  'help.open': 'Odpri: {name}',
  'help.open.sensor': 'Odpri enoto',
  'help.open.feedback': 'Napiši odziv',

  'main.hint': 'Telefon položite ravno v vozilo, z zgornjim robom proti sprednjemu delu.',
  'main.start': 'Začni',
  'main.waiting': 'Čakam na senzor nagiba…',
  'main.level': 'Vozilo je vodoravno!',
  'main.denied':
    'Dostop do senzorjev gibanja je bil zavrnjen, zato Libell ne more brati nagiba. Tej strani dovolite dostop do gibanja in usmerjenosti ter znova naložite stran.',
  'main.noSensors':
    'Ta naprava ne omogoča dostopa do senzorjev gibanja, zato Libell ne more brati nagiba.',
  'main.https':
    'Libell za branje senzorjev nagiba potrebuje varno povezavo (HTTPS). Aplikacijo odprite prek HTTPS in poskusite znova.',

  'diagram.aria': 'Pogled na avtodom od zgoraj, ki kaže, katera kolesa je treba dvigniti',
  'diagram.caravan.aria':
    'Pogled na počitniško prikolico od zgoraj s kolesoma na osi in opornim kolesom',
  'diagram.front': 'Spredaj',
  'diagram.step': 'Stopnica {n}',
  'diagram.driveUp': 'Zapelji',
  'diagram.done': 'Končano',
  'diagram.noRamp': 'Ni rampe',
  'diagram.wheel.frontLeft': 'Spredaj levo',
  'diagram.wheel.frontRight': 'Spredaj desno',
  'diagram.wheel.rearLeft': 'Zadaj levo',
  'diagram.wheel.rearRight': 'Zadaj desno',
  'diagram.notEnough': 'premalo',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Vrti gor',
  'caravan.crankDown': 'Vrti dol',
  'caravan.axleLeft': 'Levo kolo na osi',
  'caravan.axleRight': 'Desno kolo na osi',
  'caravan.jockeyWheel': 'Oporno kolo',
  'help.screen.caravan':
    'Počitniška prikolica: pri opornem kolesu piše „Vrti gor“ ali „Vrti dol“ in za koliko.',

  'vehicles.title': 'Vozila',
  'vehicles.defaultName': 'Moje vozilo',
  'vehicles.numbered': 'Vozilo {n}',
  'vehicles.name.placeholder': 'Ime (npr. „Prikolica“)',
  'vehicles.name.label': 'Ime vozila',
  'vehicles.add': 'Novo vozilo',
  'namePrompt.save': 'Shrani',
  'namePrompt.cancel': 'Prekliči',
  'choice.rename': 'Preimenuj {name}',
  'vehicles.badge': 'Vozilo: {name}',
  'vehicles.delete': 'Odstrani {name}',
  'vehicles.remove.confirm':
    'Želite odstraniti {name} skupaj z ničlo vozila, cilji in senzorsko enoto?',
  'vehicles.remove.yes': 'Da, odstrani',
  'vehicles.hint':
    'Mere, rampe, ničla vozila, cilji in senzorska enota pripadajo vozilu. Kalibracija telefona je skupna.',
  'setup.incoming.addNew': 'Dodaj kot novo vozilo',

  'hitch.title': 'Višina priklopa',
  'hitch.hint':
    'Shranite jo, ko je prikolica še na krogli vlečne kljuke. Preden jo znova priklopite, oporno kolo pokaže, za koliko je treba vrteti, da priklopna glava sede na kroglo.',
  'hitch.save': 'Shrani višino',
  'hitch.go': 'Na višino priklopa',
  'hitch.done': 'Končano',
  'hitch.savedNow': 'Višina priklopa shranjena.',
  'hitch.status.none': 'Višina priklopa še ni shranjena.',
  'hitch.status.saved': 'Višina priklopa je shranjena.',
  'hitch.status.active': 'Glavni zaslon kaže, za koliko je treba vrteti oporno kolo.',
  'hitch.badge': 'Višina priklopa',
  'hitch.badge.aria': 'Višina priklopa: tapnite za običajno izravnavo',
  'hitch.crank.up': 'Vrti gor za {amount} do višine priklopa',
  'hitch.crank.down': 'Vrti dol za {amount} do višine priklopa',
  'hitch.reached': 'Na višini priklopa',
  'hitch.offer': 'Želite najprej shraniti višino priklopa?',
  'hitch.offer.save': 'Shrani',
  'hitch.offer.dismiss': 'Ne zdaj',

  'zeroTrim.title': 'Natančno prilagodi ničlo',
  'zeroTrim.hint':
    'Še vedno ni povsem vodoravno? Vsak dotik premakne ničlo za 0,1°, tako da aplikacija želi to stran višje.',
  'zeroTrim.left': 'Levo gor',
  'zeroTrim.right': 'Desno gor',
  'zeroTrim.front': 'Spredaj gor',
  'zeroTrim.back': 'Zadaj gor',
  'zeroTrim.side.left': 'Levo',
  'zeroTrim.side.right': 'Desno',
  'zeroTrim.side.front': 'Spredaj',
  'zeroTrim.side.back': 'Zadaj',
  'zeroTrim.total': 'Prilagojeno: {trim}',
  'zeroTrim.none': 'Ni prilagojeno',
  'zeroTrim.reset': 'Ponastavi prilagoditev',

  'tilt.frontBack': 'Vzdolžno',
  'tilt.sideSide': 'Prečno',

  'pose.layFlat': 'Za merjenje položite telefon ravno',
  'pose.sensorHint': 'Pravilno meri le, ko leži ravno, z zgornjo stranjo navzgor.',
  'pose.openSensorPage': 'Pokaži enoto',
  'pose.sensorExtreme': 'Enota je preveč nagnjena',
  'pose.sensorUpsideDown': 'Enota je videti obrnjena na glavo',
  'pose.sensorNotUpright': 'Enota leži',
  'pose.sensorHintUpright': 'Pravilno meri le, ko stoji pokonci.',
  'calibration.external.h': 'Nastavi ničlo vozila',
  'calibration.external.intro': 'Vozilo enkrat izravnajte z libelo, nato nastavite ničlo.',
  'calibration.external.phoneHidden':
    'Lastna kalibracija telefona je skrita, medtem ko meri senzorska enota. Za kalibracijo telefona odprite enoto in najprej tapnite „{disconnect}“.',
  'calibration.external.working': 'Nastavljanje ničle…',
  'calibration.external.done': '{name}: ničla je nastavljena, ta položaj zdaj šteje kot vodoravno.',
  'calibration.external.err.notConnected':
    '{name}: ni povezave. Povežite enoto in poskusite znova.',
  'calibration.external.err.failed':
    'Ničle za {name} ni bilo mogoče nastaviti. Nič ni bilo spremenjeno. Preverite povezavo in poskusite znova.',
  'pose.portrait': 'Obrnite telefon pokončno — zgornji rob mora kazati naprej',
  'stale.dataUnavailable':
    'Ni novih podatkov senzorja — vodenje je zaustavljeno, dokler se ne vrnejo',
  'sensorFallback.lost': 'Povezava z enoto je prekinjena',
  'sensorFallback.autoRetry': 'Samodejni ponovni poskus…',
  'sensorFallback.connect': 'Povežite enoto',
  'sensorFallback.pick': 'Tapnite in izberite svojo enoto na seznamu.',
  'sensorFallback.notFound': 'Enote ni mogoče najti? Preverite, ali je vklopljena in blizu.',
  'sensorFallback.retry': 'Poveži znova',
  'sensorFallback.usePhone': 'Uporabi telefon',

  'mounting.prompt.upright': 'Tapnite smer, v katero kaže hrbtna stran enote (nosilec z vijakom).',
  'mounting.prompt.arrow':
    'Ena od puščic enote (na pokrovu ali na tiskanem vezju pod njim) kaže naprej. Katera stran je obrnjena naprej?',
  'mounting.placement.wide': 'Dolga stran naprej',
  'mounting.placement.short': 'Kratka stran naprej',
  'mounting.facing.front': 'Kaže naprej',
  'mounting.facing.right': 'Kaže desno',
  'mounting.facing.rear': 'Kaže nazaj',
  'mounting.facing.left': 'Kaže levo',

  'box.state.connected': 'Povezano',
  'box.state.lost': 'Ni povezave',
  'box.state.password': 'Napačno geslo',
  'box.password.label': 'Koda enote',
  'box.password.retry': 'Ponovi',
  'box.password.checking': 'Preverjanje kode…',
  'box.password.invalid': 'Koda ima štiri števke.',
  'box.password.wrong': 'Enota tudi te kode ni sprejela.',
  'box.password.noAnswer':
    'Enota ni odgovorila. Koda je shranjena in bo preizkušena ob naslednji povezavi enote.',
  'box.state.notConnected': 'Ni povezano',
  'box.state.battery': 'baterija {value}',
  'box.connect': 'Poveži',
  'box.step.position.upright.ok': 'Stoji pokonci',
  'box.step.position.upright.bad': 'Leži: postavite jo pokonci, v katero koli smer',
  'box.step.position.flat.ok': 'Leži ravno',
  'box.step.position.flat.bad': 'Preveč nagnjena: položite jo ravno, z zgornjo stranjo navzgor',
  'box.step.position.flat.upsideDown':
    'Obrnjena na glavo: obrnite jo s pokrovom navzgor. Proizvajalec odsvetuje namestitev na glavo.',
  'box.step.position.waiting': 'Položaj: čakam na meritev',
  'box.step.direction.todo': 'Izberi smer',
  'box.step.direction.done': 'Smer nastavljena',
  'box.step.direction.learn': 'Ni jasno? Zaznaj smer z dvigom spredaj',
  'box.step.zero.todo': 'Nastavi ničlo vozila',
  'box.step.zero.done': 'Ničla nastavljena',
  'box.step.zero.hint': 'Vozilo izravnajte z libelo, nato nastavite ničlo.',
  'box.forgetDirection': 'Pozabi smer',
  'onboard.boxPosition.h': 'Položaj enote',
  'onboard.boxPosition.later':
    'Smer in ničlo nastavite ob prvem parkiranju. Stran enote vas bo vodila, lučka „⚠ Ničla“ pa vas opominja, dokler to ni opravljeno.',
  'onboard.boxPosition.notConnected':
    'Nobena enota še ni povezana, zato njenega položaja ni mogoče prikazati. Tapnite „{next}“ in jo povežite pozneje z ikono senzorja zgoraj desno.',
  'sensorList.title': 'Senzorska enota',
  'sensorList.phone': 'Ko ni povezana nobena enota, se uporablja lastni senzor telefona.',
  'box.step.zero.again': 'Nova ničla',
};
