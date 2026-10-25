import type { Messages } from './en';

/** Swedish. */
export const sv: Messages = {
  'topbar.install': 'Installera',
  'topbar.share': 'Dela Libell',
  'bottombar.settings': 'Inställningar',
  'bottombar.sound.mute': 'Stäng av ljud',
  'bottombar.sound.unmute': 'Slå på ljud',
  'bottombar.help': 'Hjälp',
  'bottombar.label': 'Åtgärder',
  'share.text': 'Få husbilen eller husvagnen i våg med telefonen.',
  'share.copied': 'Länken kopierad!',
  'update.check': 'Sök efter ny version',
  'update.checking': 'Söker efter uppdatering…',
  'update.updating': 'Uppdaterar till den nya versionen…',
  'update.latest': 'Du har den senaste versionen',
  'update.offline': 'Ingen anslutning, kan inte söka efter uppdatering',
  'update.unsupported': 'Uppdateringar är inte tillgängliga här',
  'install.hint': 'Tryck på Dela och sedan "Lägg till på hemskärmen".',
  'install.row': 'Installera Libell som app på hemskärmen.',
  'install.close': 'Dölj',
  'share.vehicle.text': 'Mina fordonsmått för Libell — mått och klossar.',
  'settings.shareVehicle': 'Dela till en annan telefon',
  'setup.incoming.h': 'Inkommande fordonsinställning',
  'setup.incoming.intro': 'En familjemedlem har delat de här fordonsmåtten med dig:',
  'setup.incoming.reminder':
    'Ingen kalibrering följer med — du behöver fortfarande kalibrera den här telefonen.',
  'setup.incoming.apply': 'Ersätt nuvarande fordon',
  'setup.incoming.dismiss': 'Inte nu',
  'setup.incoming.invalid': 'Länken för fordonsinställning gick inte att läsa – inget ändrades.',

  // Main-screen external-sensor indicator (#129): shown only while an
  // external source (today: EasyLevel) is active — never in phone mode.
  'sensorStatus.connected': 'Sensorbox ansluten',
  'sensorStatus.disconnected': 'Sensorbox — tappade kontakten, tryck för detaljer',
  'sensorStatus.stale': 'Sensorbox — ingen ny data, tryck för detaljer',
  'sensorStatus.idle': 'Sensorbox — tryck för att ansluta',
  'sensorStatus.idle.guide': 'Sensorbox — tryck för guide till iPhone',

  'lamp.setup': '⚠ Mått',
  'lamp.setup.title': 'Fordonets mått har aldrig sparats — tryck för att öppna Inställningar',
  'lamp.calibrate': '⚠ Kalibrera',
  'lamp.zero': '⚠ Nollställ',
  'lamp.calibrate.title':
    'Telefonen är inte kalibrerad — tryck för att öppna ”Kalibrera och nollställ”',
  'lamp.zero.title': 'Fordonet är inte nollställt — tryck för att öppna ”Kalibrera och nollställ”',
  'lamp.calibrate.title.sensor': 'Boxen är inte nollställd — tryck för att öppna boxen',

  'menu.title': 'Meny',
  'menu.close': 'Stäng menyn',
  'menu.settings': 'Inställningar',
  'menu.calibration': 'Kalibrera och nollställ',
  'menu.targets': 'Mål',
  'menu.feedback': 'Feedback',
  'menu.help': 'Hjälp',
  'menu.intro': 'Visa introduktionen',
  'menu.about': 'Om Libell',
  'menu.about.tab': 'Om',
  'menu.sensorSource': 'Sensorbox',

  // EasyLevel-boxen via BLE (#116) — ett tillval utöver telefonens egen
  // sensor, visas bara när Web Bluetooth finns (`menu.ts`).
  'sensorSource.connect': 'Anslut {name}-sensor',
  'sensorSource.disconnect': 'Koppla från',
  'sensorSource.status.connecting': 'Ansluter…',
  'sensorSource.err.unsupported': 'Den här webbläsaren stöder inte Web Bluetooth.',
  'sensorSource.unsupported.browser':
    'För att ansluta en Sensorbox, öppna Libell i Chrome eller Edge på Android eller en dator. Telefonens egen sensor fungerar här som vanligt.',
  'sensorSource.err.password':
    '{name}-boxen godtog inte lösenordet. Skriv boxens fyrsiffriga kod nedan och tryck Försök igen. Fabrikskoden är 0000. Kan du inte koden byter du den i Xparkle-appen.',
  'sensorSource.err.failed': 'Kunde inte ansluta till {name}-sensorn.',

  'sensorSource.ios.intro':
    'Safari kan inte ansluta till Bluetooth-sensorer direkt, men det finns en lösning:',
  'sensorSource.ios.step1': 'Installera "Bluefy – Web Bluetooth Browser" från App Store.',
  'sensorSource.ios.step2': 'Öppna Bluefy och tillåt Bluetooth-behörigheten.',
  'sensorSource.ios.step3': 'Gå till samma Libell-adress i Bluefy.',
  'sensorSource.ios.step4': 'Öppna Sensorbox här igen — det fungerar som på Android.',
  'sensorSource.ios.note':
    'Bluefy är en tredjepartsapp som inte byggs av Libell — återanslutning när du öppnar ' +
    'appen kan behöva en manuell tryckning där, istället för att ske tyst.',
  'sensorSource.ios.bluefyLink': 'Hitta Bluefy i App Store',

  'sensorSource.detail.temperature': 'Temperatur: {value}',
  'sensorSource.detail.notAvailable': 'Inte tillgängligt ännu',
  'sensorSource.lowBattery':
    '⚠ Låg batterinivå ({value}) — överväg att byta batteri i sensorboxen snart.',

  // Installationskalibrering (#131, ADR 0014): samma "fordonets nolläge"
  // som R24 redan använder för telefonen, generaliserat till en permanent
  // monterad extern sensor.
  'sensorSource.install.now': 'Nollställ nu',
  'sensorSource.install.clear': 'Glöm nolläget',
  'sensorSource.install.status': 'Nolläge: längsled {pitch}, sidled {roll}.',
  'sensorSource.install.status.none': 'Inget nolläge ännu — boxen mäter som den sitter.',

  // Lär in monteringen (#293): Libell följer boxen medan användaren
  // höjer fronten och sedan höger sida — ingen tillverkarapp behövs.
  'sensorSource.learn.h': 'Lär in monteringen',
  'sensorSource.learn.intro':
    'Libell lär sig riktningen från två lyft: först fronten, sedan höger sida.',
  'sensorSource.learn.start': 'Lär in monteringen',
  'sensorSource.learn.step.front':
    'Höj fordonets front några centimeter och tryck sedan på knappen.',
  'sensorSource.learn.capture.front': 'Fronten är höjd',
  'sensorSource.learn.step.right':
    'Sänk fronten igen. Höj nu höger sida några centimeter och tryck sedan på knappen.',
  'sensorSource.learn.capture.right': 'Höger sida är höjd',
  'sensorSource.learn.cancel': 'Avbryt',
  'sensorSource.learn.status.learned': 'Monteringen är inlärd.',
  'sensorSource.learn.status.none': 'Ingen inlärd montering — boxens egna riktningar används.',
  'sensorSource.learn.done': 'Klart! Kontrollera: höj fronten så ska Libell peka ut bakhjulen.',
  'sensorSource.learn.err.tooSmall': 'Fordonet rörde sig knappt. Höj lite mer och försök igen.',
  'sensorSource.learn.err.ambiguous':
    'Båda riktningarna rörde sig ungefär lika mycket. Höj bara fronten, sedan bara höger sida, och försök igen.',
  'sensorSource.learn.err.arrow':
    'Ingen pil pekar framåt. Vrid boxen så att en av dess pilar pekar framåt och försök igen.',
  'sensorSource.learn.err.mirrored':
    'Boxen verkar sitta upp och ner, eller så lyftes fel sida. Kontrollera och försök igen.',
  'sensorSource.learn.err.sameAxis':
    'Båda lyften lutade åt samma håll. Höj fronten först och sedan höger sida, och försök igen.',

  'sensorStatus.title': '{name}-sensor',
  'sensorStatus.reading': 'Lutning nu: {value}',
  'sensorStatus.debug': 'Felsökningsinfo',
  'sensorStatus.debug.intro':
    'Råa värden direkt från boxen — för felsökning om något inte fungerar som det ska.',
  'sensorStatus.debug.state': 'Anslutningsläge: {value}',
  'sensorStatus.debug.deviceId': 'Enhets-ID: {value}',
  'sensorStatus.debug.lastSample': 'Senaste mätvärde: {value}',
  'sensorStatus.debug.age': '{s} s sedan',
  'sensorStatus.debug.rawAccel': 'Rå accelerometer (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Firmware-nivå: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Råa statusbytes: {value}',
  'sensorStatus.debug.versionBytes': 'Serienummer och firmware (rå): {value}',
  'sensorStatus.debug.copy': 'Kopiera felsökningsinfo',
  'sensorStatus.debug.copied': 'Felsökningsinfo kopierad!',
  'sensorStatus.debug.copy.failed': 'Kunde inte kopiera automatiskt.',
  'sensorStatus.advanced': 'Avancerat',
  'sensorStatus.silentReconnect.intro':
    'Den här webbläsaren kan ännu inte återansluta till boxen av sig själv, så efter en omstart väljer du den i listan igen. I Chrome kan du slå på det själv.',
  'sensorStatus.silentReconnect.steps':
    'Öppna {address}, sök på ”web bluetooth”, sätt ”Use the new permissions backend for Web Bluetooth” till Enabled och tryck Relaunch. Anslut sedan boxen en gång.',
  'sensorStatus.silentReconnect.copy': 'Kopiera {address}',
  'sensorStatus.silentReconnect.copied': 'Kopierat – klistra in i Chromes adressfält.',
  'sensorStatus.debug.connectDelay.intro':
    'Experimentellt: prova bara om boxens anslutning är opålitlig. Lägger till en fast paus efter anslutning, innan appen börjar läsa av den.',
  'sensorStatus.debug.connectDelay.enable': 'Aktivera anslutningsfördröjning',
  'sensorStatus.debug.connectDelay.ms': 'Fördröjning (ms)',

  'about.text':
    'Libell hjälper dig att få husbilen eller husvagnen i våg med telefonen ' +
    'du redan har, utan att gissa.',
  'about.version': 'Version {v}',
  'about.offline':
    'Fungerar helt utan internet — nätet används bara för att hämta appens ' +
    'egna uppdateringar.',
  'about.privacy':
    'Dina inställningar stannar i telefonen — inget konto och ingen spårning. Det enda ' +
    'Libell skickar är anonyma siffror över hur appen används, och det kan du stänga av.',
  'about.source': 'Libell är fri och öppen källkod (MIT-licens).',
  'about.source.link': 'Källkoden på GitHub',
  'seo.title': 'Libell – få husbilen eller husvagnen i våg med telefonen',
  'seo.description':
    'En gratis app som visar vilka hjul på husbilen eller husvagnen som ska upp, och på vilket steg på klossen. Använder telefonen eller en sensorbox och fungerar utan internet.',
  'menu.privacy': 'Integritet',
  'menu.privacy.tab': 'Integritet',
  'privacy.stored.h': 'Sparat på den här telefonen',
  'privacy.stored.empty': 'Inget är sparat.',
  'privacy.raw': 'Visa rådata',
  'privacy.raw.hint': 'Precis som det är sparat. Boxens lösenord är dolt.',
  'privacy.resetSettings': 'Återställ bara inställningarna',
  'privacy.deleteAll': 'Radera all Libell-data',
  'privacy.deleteAll.confirm':
    'Radera allt Libell har sparat på den här telefonen? Fordon, mått och kalibrering försvinner, och Libell börjar om som första gången.',
  'privacy.deleteAll.yes': 'Ja, radera allt',
  'privacy.deleteAll.cancel': 'Avbryt',
  'privacy.policy': 'Läs integritetspolicyn',
  'policy.title': 'Integritetspolicy för Libell',
  'policy.changed': 'Senast ändrad {date}',
  'policy.intro':
    'Libell är ett fritt open source-projekt. Det finns inga konton, ingen reklam och ingen ' +
    'spårning, och ingen samlar in uppgifter om dig.',
  'policy.stored.h': 'Det som sparas i telefonen',
  'policy.stored':
    'Libell sparar dina fordon, mått, inställningar, kalibreringar, mållägen, språkval och ' +
    'den sensorbox du senast använde. Allt ligger i webbläsarens lokala lagring i din ' +
    'telefon. Den fungerar ungefär som cookies, men skickas aldrig någonstans. Libell ' +
    'behöver uppgifterna för att fungera, och därför finns ingen samtyckesruta.',
  'policy.stored.delete':
    'Under {help} › {tab} i appen ser du allt som är sparat och kan radera alltihop. Du kan ' +
    'också rensa webbplatsens data i webbläsaren.',
  'policy.sensors.h': 'Sensorer och Bluetooth',
  'policy.sensors':
    'Telefonens rörelsesensorer och Bluetooth används bara i telefonen och bara för att ' +
    'mäta lutningen. Mätvärdena lämnar aldrig telefonen.',
  'policy.counting':
    'För att veta vad som behöver bli bättre kan Libell räkna användningen anonymt med ' +
    'GoatCounter. Libell frågar dig en gång om räkningen, och ingenting räknas innan du ' +
    'har valt. Statistiken är öppen för alla.',
  'policy.counting.ip':
    'Som vid alla anrop på internet når telefonens IP-adress och webbläsarens namn ' +
    'GoatCounter. GoatCounter sparar dem aldrig, utan håller dem i minnet i högst åtta ' +
    'timmar för att känna igen samma besök. GoatCounter drivs från Irland och har sina ' +
    'servrar i Finland och Tyskland, så ingenting lämnar EU.',
  'policy.counting.change':
    'Du kan ändra ditt val när som helst under {help} › {tab}. Utan internet skickas ' +
    'ingenting, och ingenting sparas till senare.',
  'policy.counting.basis':
    'Räkningen bygger på ett berättigat intresse enligt GDPR (artikel 6.1 f): att veta vad ' +
    'som behöver bli bättre. Eftersom ingenting som pekar ut dig sparas finns det inget ' +
    'om dig att visa eller radera. Du kan klaga hos Integritetsskyddsmyndigheten (IMY) ' +
    'eller dataskyddsmyndigheten i ditt land.',
  'policy.shared.h': 'Det du själv väljer att dela',
  'policy.shared.feedback':
    'Under {help} › {feedback} kan du öppna ett färdigt ärende på GitHub, som du själv postar med ditt eget GitHub-konto. Ärendet är offentligt. Förutom din text innehåller det appens version, skärmstorlek, tidpunkt och webbläsarens namn, och du ser allt innan du postar.',
  'policy.shared.vehicle':
    '”{share}” skapar en länk med fordonets mått, utan kalibrering. Länken hamnar bara där ' +
    'du själv skickar den.',
  'policy.site.h': 'Webbplatsen',
  'policy.site':
    'Libell finns på GitHub Pages. Som alla webbvärdar ser GitHub din IP-adress när sidan ' +
    'laddas. Libell kan inte se GitHubs loggar.',
  'policy.owner.h': 'Vem som står bakom Libell',
  'policy.owner':
    'Libell tillhör sitt open source-projekt, inte en person eller ett företag. Det är ' +
    'gratis och fritt att använda som du vill enligt MIT-licensen, och tillhandahålls i ' +
    'befintligt skick, utan garantier.',
  'policy.questions.h': 'Frågor och ändringar',
  'policy.questions':
    'Ställ dina frågor som ett ärende på GitHub. När Libell ändrar vad som sparas eller ' +
    'skickas uppdateras den här sidan samtidigt.',
  'policy.questions.link': 'Ärenden på GitHub',
  'policy.languages': 'Andra språk',
  'policy.open': 'Öppna Libell',
  'stored.vehicle': 'Fordon',
  'stored.vehicle.detail': '{name}, hjulbas {wheelbase}',
  'stored.settings': 'Inställningar',
  'stored.settings.detail': 'Mått, klossar, enhet, utseende och ljud',
  'stored.password': 'Lösenord till Sensorboxen',
  'stored.language': 'Språk',
  'stored.phoneCalibration': 'Telefonens kalibrering',
  'stored.zero': 'Fordonets nollställning',
  'stored.zeroTrim': 'Finjustering av nolläget',
  'stored.targets': 'Mål',
  'stored.targets.active': '{name} (vald)',
  'stored.hitch': 'Kopplingshöjd',
  'stored.rememberedBox': 'Ihågkommen Sensorbox',
  'stored.notes': 'Appens egna anteckningar',
  'stored.notes.detail': '{n} små markeringar, till exempel om introduktionen är visad',
  'stored.phone': 'Telefonen',
  'stored.saved': 'sparad',
  'stored.counting.off': 'Avstängd',
  'stored.counting.on': 'Påslagen',
  'stored.savedOn': 'sparad {date}',

  'intro.h': 'Välkommen till Libell',
  'intro.how':
    'Lägg telefonen plant i fordonet så visar Libell vilka hjul som ska upp och hur mycket.',
  'intro.start': 'Kom igång',
  'intro.later': 'Titta runt först',
  'onboard.source.sensorIcon':
    'En sensorbox ansluter du när som helst med sensorikonen uppe till höger.',
  'counting.title': 'Anonym räkning',
  'counting.intro':
    'Libell kan räkna användningen anonymt, så att vi vet vad som behöver bli bättre.',
  'counting.sent.h': 'Det här räknas',
  'counting.sent':
    'Att appen öppnades, vilka funktioner som används, vilken sensor som mäter ' +
    '(telefonen eller en modell som {boxes}), appens version och språket som är valt i Libell.',
  'counting.notSent.h': 'Det här sparas aldrig',
  'counting.notSent':
    'Din IP-adress, ditt land, din enhet, skärm, ditt operativsystem eller din webbläsare, ' +
    'fordonets mått, dina inställningar eller något annat om dig. Bara ditt val sparas i ' +
    'telefonen.',
  'counting.gpc': 'Om din webbläsare ber webbplatser att inte spåra dig räknar Libell ingenting.',
  'counting.later': 'Du kan ändra ditt val när som helst under {help} › {tab}.',
  'counting.toggle': 'Räkna min användning anonymt',
  'counting.dashboard': 'Se statistiken',
  'counting.ask': 'Vill du hjälpa till att göra Libell bättre?',
  'counting.yes': 'Ja, räkna anonymt',
  'counting.no': 'Nej tack',
  'onboard.sound.h': 'Ljud',
  'onboard.source.h': 'Hur vill du mäta?',
  'onboard.source.intro':
    'Välj vilken sensor Libell ska läsa lutning från — de flesta använder bara telefonen.',
  'onboard.source.phone': 'Den här telefonen',
  'onboard.source.externalActive':
    'En sensorbox är aktiv nu. Väljer du telefonen hoppar guiden över telefonens kalibrering. Vill du kalibrera telefonen: öppna boxen med sensorikonen uppe till höger och tryck först på "{disconnect}".',
  'onboard.vehicle.h': 'Vad ska nivelleras?',
  'onboard.vehicle.intro': 'Välj fordon — resten av guiden anpassas efter det.',
  'onboard.step1.h': 'Lägg telefonen så här',
  'onboard.next': 'Nästa',
  'onboard.back': 'Tillbaka',
  'onboard.close': 'Stäng introduktionen',
  'onboard.done': 'Klart',
  'onboard.skipStep': 'Hoppa över',
  'onboard.note.measurements':
    'Hoppar du över används standardmåtten, och {lamp} lyser tills du har sparat dina.',
  'onboard.note.ramps':
    'Hoppar du över används standardklossarna. Du kan välja dina senare under Inställningar.',
  'onboard.note.calibrate':
    'Inget plant underlag just nu? Tryck {next}, så påminner {lamp} tills det är gjort.',
  'onboard.note.connect':
    'Ingen box till hands? Tryck {next} och anslut senare med sensorikonen uppe till höger.',
  'onboard.zeroLater':
    'Fordonet nollställer du första gången du parkerar på plan mark. {lamp} påminner tills det är gjort.',
  'onboard.legend.ok': 'Grönt ✓ — hjulet står i våg.',
  'onboard.legend.up': 'Orange ↑ — kör upp hjulet på steget som visas.',
  'onboard.legend.no': 'Rött ✕ — inget steg räcker; flytta till ett planare ställe.',
  'onboard.legend.dim':
    'Grått – — ingen kloss vid det hjulet; siffran visar hur mycket som saknas.',

  'settings.wheelbase': 'Hjulbas',
  'settings.trackFront': 'Spårvidd fram',
  'settings.trackRear': 'Spårvidd bak',
  'settings.tolerance': 'Tolerans',
  'settings.stability': 'Stabilitet',
  'settings.dwellRest': 'Svarsfördröjning (ms)',
  'settings.dwellMotion': 'Svarsfördröjning vid justering (ms)',
  'settings.dwell.hint': 'Hur länge en mätning ska hålla i sig innan siffran ändras.',
  'settings.vehicle': 'Fordon',
  'vehicle.motorhome': 'Husbil',
  'vehicle.caravan': 'Husvagn',
  'settings.axleToJockey': 'Axel till stödhjul',
  'settings.rearAxle': 'Bakaxel',
  'settings.axle': 'Axel',
  'axle.single': 'Enkel',
  'axle.boggie': 'Boggie',
  'settings.track': 'Spårvidd',
  'settings.measureHint': 'Står i registreringsbeviset. Några cm fel gör inget.',
  'settings.measureHint.caravan': 'Mät från axeln till stödhjulet. Några cm fel gör inget.',
  'settings.measureHint.boggie': 'Med boggie mäter du till mitten av axelparet.',
  'settings.steps': 'Klossarnas steghöjder',
  'settings.steps.add': 'Lägg till steg',
  'settings.steps.new': 'Ny steghöjd ({unit})',
  'settings.steps.remove': 'Ta bort {value}',
  'settings.ramp': 'Färdiga klossar',
  'settings.ramp.custom': 'Egen uppsättning',
  'settings.ramp.stepless': 'Steglös kil',
  'settings.ramp.steplessModel': '{name} (steglös, max {max} mm)',
  'settings.stepless.max': 'Steglös kil, maxhöjd',
  'settings.stepless.maxHeading': 'Maxhöjd',
  'settings.stepless.set': 'Spara',
  'settings.stepless.new': 'Maxhöjd ({unit})',
  'settings.rampCount': 'Antal klossar',
  'settings.drain': 'Avloppssida',
  'settings.rampHint': 'Appen väljer var klossarna gör mest nytta.',
  'settings.drainHint': 'Inom toleransen hamnar den här sidan lägst, så att vattnet rinner undan.',
  'settings.section.vehicle': 'Fordon och mått',
  'settings.section.ramps': 'Klossar',
  'settings.general': 'Allmänt',
  'settings.language': 'Språk',
  'settings.language.auto': 'Automatiskt (enhetens språk)',
  'settings.tolerance.hint': 'Hur nära våg som räknas som i våg.',
  'settings.stability.hint': 'Jämnar ut små skakningar i sensorn så att siffrorna inte hoppar.',
  'drain.none': 'Inget / spelar ingen roll',
  'drain.left': 'Vänster, mitt',
  'drain.right': 'Höger, mitt',
  'drain.front': 'Fram, mitt',
  'drain.rear': 'Bak, mitt',
  'drain.frontLeft': 'Vänster fram',
  'drain.frontRight': 'Höger fram',
  'drain.rearLeft': 'Vänster bak',
  'drain.rearRight': 'Höger bak',
  'settings.unit': 'Visa längder i',
  'settings.unitInches': 'tum (in)',
  'settings.theme': 'Tema',
  'theme.system': 'Följ telefonen',
  'theme.light': 'Ljust',
  'theme.dark': 'Mörkt',
  'settings.appearance': 'Utseende',
  'appearance.classic': 'Klassisk',
  'appearance.modern': 'Modern',
  'appearance.glossy': 'Glansig',
  'settings.sound': 'Ljudsignal när det är i våg',
  'settings.soundGuidance': 'Kontinuerlig ljudvägledning',
  'settings.soundGuidance.help': 'Pipet går snabbare och ljusare ju närmare våg du kommer.',
  'settings.soundSpeech': 'Uppläst vägledning',
  'settings.soundSpeech.help':
    'När fordonet står still säger appen vilket hjul och hur mycket, till exempel ”Vänster bak, Steg 2”.',
  'settings.soundSpeech.unavailable':
    'Uppläst vägledning fungerar inte på den här telefonen: den saknar en svensk röst som fungerar utan nät. Tonerna fungerar som vanligt.',
  'speech.level': 'Plant',
  'speech.inches': '{n} tum',
  'speech.inchOne': 'en tum',
  'speech.inchOneAnd': 'en och {fraction} tum',
  'speech.inchesAnd': '{n} och {fraction} tum',
  'speech.inchFraction': '{fraction} tum',
  'speech.eighth1': 'en åttondels',
  'speech.eighth2': 'en kvarts',
  'speech.eighth3': 'tre åttondels',
  'speech.eighth4': 'en halv',
  'speech.eighth5': 'fem åttondels',
  'speech.eighth6': 'tre kvarts',
  'speech.eighth7': 'sju åttondels',
  'settings.undo': 'Ångra',
  'settings.saved': 'Sparat',
  'settings.more': 'Mer',
  'settings.fineTuning': 'Finjustering',
  'settings.resetAll': 'Återställ alla inställningar',
  'settings.err.positive': 'Ange ett tal större än 0. Det förra värdet gäller.',
  'settings.err.notNegative': 'Ange 0 eller mer. Det förra värdet gäller.',
  'settings.err.range': 'Ange ett tal från {min} till {max}. Det förra värdet gäller.',

  'settings.tab.vehicle': 'Fordon',
  'settings.tab.ramps': 'Klossar',
  'settings.tab.level': 'I våg',
  'settings.klossar.brandAll': 'Alla',
  'settings.klossar.changeRamp': 'Byt klossar',
  'settings.rampCountHint': 'Appen lägger dem där de gör mest nytta.',
  'settings.klossar.selected': 'Vald',
  'settings.klossar.stepsHeading': 'Steghöjder',

  'status.measuring': 'Mäter…',
  'status.almost': 'Nästan i våg — {left} kvar',
  'status.cantLevel.close': 'Klossarna räcker nästan här — flytta fordonet',
  'status.cantLevel.far': 'Klossarna räcker inte alls här — flytta fordonet',
  'adjustable.before': 'Sätt klossarna på steget som visas och kör sedan upp.',
  'adjustable.after': 'Inte i våg än. Kör av klossarna, så mäter appen om.',

  'calibration.intro':
    'Lägg telefonen på en yta du vet är plan och tryck sedan på Kalibrera nu. ' +
    'Den aktuella lutningen blir nollpunkten.',
  'calibration.status': 'Kalibrerad: längsled {pitch}, sidled {roll}.',
  'calibration.status.none': 'Inte kalibrerad — använder sensorn som den är.',
  'calibration.now': 'Kalibrera nu',
  'calibration.step.phone.done': 'Telefonen kalibrerad',
  'calibration.step.phone.hint': 'Lägg telefonen på något plant.',
  'calibration.step.flipLink': 'Inget plant underlag? Vänd telefonen',
  'calibration.step.vehicle.done': 'Nollställd',
  'calibration.step.vehicle.hint':
    'Ställ fordonet plant med ett vattenpass och lägg telefonen på sin vanliga plats.',
  'calibration.step.vehicle.now': 'Nollställ nu',
  'calibration.clear': 'Rensa kalibrering',
  'calibration.err.notRunning':
    'Lutningssensorn är inte igång ännu — tryck på Start på huvudskärmen först.',
  'calibration.warn.notFlat':
    'Kalibreringen sparades, men det här ser inte plant ut (över 15°), så den blir troligen fel. Var det inte meningen? Tryck Ångra, lägg telefonen på en plan yta och kalibrera igen.',
  'calibration.undo': 'Ångra',
  'calibration.sensor.h': 'Kalibrera telefonen',
  'calibration.vehicle.h': 'Nollställ fordonet',
  'calibration.vehicle.intro':
    'Kalibreringen gäller telefonen, inte platsen där den ligger. Lutar bordet lite visar appen den lutningen. Ställ fordonet plant en gång med ett vattenpass, lägg telefonen på sin vanliga plats och nollställ.',
  'calibration.vehicle.now': 'Nollställ nu',
  'calibration.vehicle.clear': 'Glöm nolläget',
  'calibration.vehicle.status': 'Fordonets nolläge: längsled {pitch}, sidled {roll}.',
  'calibration.vehicle.status.none': 'Inget nolläge — telefonens plats räknas som plan.',
  'calibration.vehicle.warn.notFlat':
    'Nolläget sparades, men det här ser inte plant ut (över 15°). Stod fordonet inte plant? Tryck Ångra, ställ fordonet plant och nollställ igen.',
  'calibration.age.today': '(idag)',
  'calibration.age.days': '(för {n} dagar sedan)',
  'calibration.check': 'Kontrollera',
  'calibration.check.good': 'Fortfarande bra — avviker {off}°.',
  'calibration.check.off': 'Avviker {off}° — överväg att kalibrera om.',
  'calibration.vehicle.check.off': 'Avviker {off}° — överväg att nollställa om.',
  'calibration.check.none':
    'Inte kalibrerad än, så det finns inget att kontrollera. Lägg telefonen på en plan yta och tryck på "{now}".',
  'calibration.vehicle.check.none':
    'Inget nolläge än, så det finns inget att kontrollera. Ställ fordonet plant med ett vattenpass och tryck på "{now}".',
  'calibration.flip.intro':
    'Ingen plan yta i närheten? Använd vändkalibrering: lägg telefonen på något ' +
    'någorlunda plant, fånga, vrid telefonen ett halvt varv (180°) på samma ' +
    'ställe, fånga igen — ytans lutning tar ut sig själv.',
  'calibration.flip.start': 'Kalibrera genom att vända',
  'calibration.flip.rotate':
    'Vrid nu telefonen ett halvt varv (180°) på samma ställe och tryck sedan på Fånga.',
  'calibration.flip.capture': 'Fånga',
  'calibration.flip.done': 'Klart! Din yta lutar {surface}° — borträknat.',
  'calibration.flip.warn.moved':
    'Kalibreringen sparades, men de två mätningarna skiljer sig mer än 15°. Flyttades telefonen? Tryck Ångra och börja om.',
  // Korta statusetiketter för Modern-kalibreringens kort (#109).
  'calibration.pill.notDone': 'EJ GJORD',
  'calibration.pill.done': 'GJORD',
  'calibration.pill.none': 'INGET',

  // Sparade mål/presets (#122, ADR 0013): ett avsiktligt ICKE-plant mål,
  // skilt från kalibreringslagren ovan — "Normal" (i våg) finns alltid
  // kvar och är inte ett av de sparade målen.
  'targets.normal': 'Normal (i våg)',
  'targets.name.placeholder': 'Namn (t.ex. "Duschavlopp")',
  'targets.name.label': 'Namn på det nya målet',
  'targets.defaultName': 'Mål {n}',
  'targets.add': 'Spara aktuell lutning som nytt mål',
  'targets.delete': 'Ta bort {name}',
  'targets.warn.tooSteep':
    'Målet sparades, men det är brantare än ett vanligt mål (över 15°). Var det inte meningen? Ta bort det med krysset och spara igen.',
  'targets.badge': 'Mål: {name}',

  'feedback.intro':
    'Har du hittat ett problem eller har en idé? Fyll i det här och tryck på ' +
    'knappen — då öppnas en färdig rapport på GitHub som du postar (ett gratis ' +
    'GitHub-konto behövs och skapas på en minut).',
  'feedback.category': 'Vad gäller det?',
  'feedback.cat.bug': 'Bugg',
  'feedback.cat.suggestion': 'Förslag',
  'feedback.cat.other': 'Övrigt',
  'feedback.title': 'Kort rubrik',
  'feedback.desc': 'Vad hände, eller vad önskar du dig?',
  'feedback.submit': 'Öppna rapporten på GitHub',
  'feedback.warn.title': 'Rubriken är tom — du kan skicka rapporten ändå.',
  'feedback.warn.desc': 'Beskrivningen är tom — du kan skicka rapporten ändå.',
  'feedback.warn.both': 'Rubrik och beskrivning är tomma — du kan skicka rapporten ändå.',

  'help.screen.h': 'Så läser du skärmen',
  'help.screen.lead':
    'Skärmen visar vilka hjul som ska upp och hur mycket. Steg 2 betyder klossens andra steg.',
  'help.screen.t':
    'Grönt ✓: klart, inget att göra.\n' +
    'Orange ↑: kör upp hjulet på steget som står bredvid.\n' +
    'Rött ✕: klossarna räcker inte här. Flytta fordonet.\n' +
    'Grått –: ingen kloss vid det hjulet. Siffran visar hur mycket som saknas, om du vill lägga något annat under.\n' +
    'När bubblan vilar i mitten står du i våg.',
  'help.screen.routine':
    'Kör upp, vänta tills fordonet står still och titta igen. Upprepa tills alla hjul är gröna.',
  'help.what.t':
    'Lägg telefonen plant i fordonet med ovansidan mot fronten, på samma plats varje gång.\n' +
    'Med en sensorbox spelar det ingen roll hur telefonen ligger.',
  'help.settings.h': 'Måtten',
  'help.measures.h': 'Fyll i måtten',
  'help.settings.t':
    'Libell räknar ut hur mycket varje hjul ska upp från hjulbasen och spårvidden.\n' +
    'De står i fordonspapperen, annars mäter du med tumstock.\n' +
    'Skriv dem i mm, cm eller tum, det du valt under Visa längder i.\n' +
    'På en husvagn är hjulbasen avståndet från axeln till stödhjulet.\n' +
    'Har du flera fordon har vart och ett egna mått, klossar, nolläge, mål och sensorbox. Välj fordon överst under Fordon.',
  'help.ramps.t':
    'Skärmen säger vilket steg på klossen hjulet ska upp på, så fyll i de klossar du har med dig.\n' +
    'Välj färdiga klossar eller en egen uppsättning, och hur många du har. Libell lägger dem där de gör mest nytta.\n' +
    'Har du en steglös kil, välj Steglös kil och fyll i hur hög den är. Skärmen säger då hur långt du ska köra upp.',
  'help.calibration.h': 'Kalibrera och nollställ',
  'help.calibration.t':
    'Två steg gör mätningen rätt: kalibrera telefonen en gång och nollställ fordonet en gång.\n' +
    'Kalibrera: lägg telefonen på en plan yta och tryck Kalibrera nu.\n' +
    'Nollställ: ställ fordonet plant med ett vattenpass, lägg telefonen på sin vanliga plats och tryck Nollställ nu.\n' +
    'Med en sensorbox nollställer du på boxens sida. Den behöver ingen kalibrering.\n' +
    'Står det ändå inte riktigt plant? Finjustera nolläget med Vänster upp, Höger upp, Fram upp eller Bak upp under nollställningen.\n' +
    'Lampan ⚠ Kalibrera eller ⚠ Nollställ lyser tills det är gjort.',
  'help.sensor.h': 'Sensorbox',
  'help.sensor.t':
    'En sensorbox i fordonet kan mäta i stället för telefonen. Libell fungerar med de här:\n' +
    '{upright}: står upprätt, åt vilket håll som helst.\n' +
    '{flat}: ligger plant med locket upp och en pil framåt.\n' +
    'Anslut med sensorikonen uppe till höger. Boxens sida guidar dig sedan genom Välj riktning och Nollställ fordonet.\n' +
    'Det fungerar i Chrome eller Edge på Android eller en dator. På iPhone behövs webbläsaren Bluefy.\n' +
    'Godtar boxen inte koden ber Libell om boxens fyrsiffriga kod.',
  'help.targets.h': 'Mål och ljud',
  'help.targets.t':
    'Spara en lutning du vill ha, till exempel mot duschavloppet, och växla mellan dem.\n' +
    'Husvagn: spara kopplingshöjden innan du kopplar loss, så leder Till kopplingshöjd stödhjulet tillbaka dit.\n' +
    'Med uppläst vägledning säger appen vilket hjul du ska höja och hur mycket, så du kan nivellera utan att se telefonen.\n' +
    'Knappen mitt i nederkanten slår av och på ljudet.',
  'help.trouble.h': 'Om något krånglar',
  'help.trouble.t':
    '”Mäter…”: fordonet gungar. Vänta tills det står still.\n' +
    '”Lägg telefonen plant för att mäta”: telefonen lutar för mycket för att mäta.\n' +
    '”Tappade kontakten med boxen”: tryck Återanslut och välj boxen i listan.\n' +
    '”Väntar på lutningssensorn…”: inga mätvärden än. På iPhone trycker du Start varje gång du öppnar appen, annars laddar du om.\n' +
    '”Åtkomst till rörelsesensorerna nekades”: tillåt rörelse och orientering för webbplatsen i webbläsarens inställningar och ladda om.\n' +
    'Fortfarande fel? Skriv en rapport under Feedback.',
  'help.open': 'Öppna {name}',
  'help.open.sensor': 'Öppna Sensorbox',
  'help.open.feedback': 'Skriv en rapport',

  'main.hint': 'Lägg telefonen plant i fordonet, med ovansidan mot fronten.',
  'main.start': 'Start',
  'main.waiting': 'Väntar på lutningssensorn…',
  'main.level': 'Fordonet står i våg!',
  'main.denied':
    'Åtkomst till rörelsesensorerna nekades, så Libell kan inte läsa lutningen. ' +
    'Tillåt rörelse och orientering för den här webbplatsen och ladda om.',
  'main.noSensors': 'Den här enheten saknar rörelsesensorer, så Libell kan inte läsa lutningen.',
  'main.https':
    'Libell behöver en säker anslutning (HTTPS) för att läsa lutningssensorerna. ' +
    'Öppna appen via HTTPS och försök igen.',

  'diagram.aria': 'Din husbil ovanifrån, med hjulen som behöver höjas markerade',
  'diagram.caravan.aria': 'Din husvagn ovanifrån, med axelhjulen och stödhjulet',
  'diagram.front': 'Fram',
  'diagram.step': 'Steg {n}',
  'diagram.driveUp': 'Kör upp',
  'diagram.done': 'Klart',
  'diagram.noRamp': 'Ingen kloss',
  'diagram.wheel.frontLeft': 'Vänster fram',
  'diagram.wheel.frontRight': 'Höger fram',
  'diagram.wheel.rearLeft': 'Vänster bak',
  'diagram.wheel.rearRight': 'Höger bak',
  'diagram.notEnough': 'räcker inte',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Veva upp',
  'caravan.crankDown': 'Veva ner',
  'caravan.axleLeft': 'Vänster axelhjul',
  'caravan.axleRight': 'Höger axelhjul',
  'caravan.jockeyWheel': 'Stödhjul',
  'help.screen.caravan': 'Husvagn: stödhjulet visar Veva upp eller Veva ner, och hur mycket.',

  'vehicles.title': 'Fordon',
  'vehicles.defaultName': 'Mitt fordon',
  'vehicles.numbered': 'Fordon {n}',
  'vehicles.name.placeholder': 'Namn (t.ex. "Husvagnen")',
  'vehicles.name.label': 'Fordonets namn',
  'vehicles.add': 'Nytt fordon',
  // The name field shown only when a name is needed (#613).
  'namePrompt.save': 'Spara',
  'namePrompt.cancel': 'Avbryt',
  // Tapping the chosen target or vehicle again edits its name (#613).
  'choice.rename': 'Byt namn på {name}',
  // The active vehicle on the main screen while there are several (#616).
  'vehicles.badge': 'Fordon: {name}',
  'vehicles.delete': 'Ta bort {name}',
  'vehicles.remove.confirm': 'Ta bort {name} med dess nolläge, mål och sensorbox?',
  'vehicles.remove.yes': 'Ja, ta bort',
  'vehicles.hint':
    'Mått, klossar, nolläge, mål och sensorbox hör till fordonet. Telefonens kalibrering delas.',
  'setup.incoming.addNew': 'Lägg till som nytt fordon',

  'hitch.title': 'Kopplingshöjd',
  'hitch.hint':
    'Spara medan husvagnen sitter på dragkroken. Innan du kopplar på igen visar stödhjulet hur mycket du ska veva för att kopplingen ska möta kulan.',
  'hitch.save': 'Spara kopplingshöjd',
  'hitch.go': 'Till kopplingshöjd',
  'hitch.done': 'Klar',
  'hitch.savedNow': 'Kopplingshöjden är sparad.',
  'hitch.status.none': 'Ingen kopplingshöjd sparad än.',
  'hitch.status.saved': 'En kopplingshöjd är sparad.',
  'hitch.status.active': 'Huvudskärmen visar hur mycket du ska veva stödhjulet.',
  'hitch.badge': 'Kopplingshöjd',
  'hitch.badge.aria': 'Kopplingshöjd: tryck för att nivellera som vanligt igen',
  'hitch.crank.up': 'Veva upp {amount} till kopplingshöjd',
  'hitch.crank.down': 'Veva ner {amount} till kopplingshöjd',
  'hitch.reached': 'Vid kopplingshöjd',
  'hitch.offer': 'Spara kopplingshöjd först?',
  'hitch.offer.save': 'Spara',
  'hitch.offer.dismiss': 'Inte nu',

  'zeroTrim.title': 'Finjustera nolläget',
  'zeroTrim.hint':
    'Står det ändå inte riktigt plant? Varje tryck flyttar nolläget 0,1° så att appen vill ha den sidan högre.',
  'zeroTrim.left': 'Vänster upp',
  'zeroTrim.right': 'Höger upp',
  'zeroTrim.front': 'Fram upp',
  'zeroTrim.back': 'Bak upp',
  'zeroTrim.side.left': 'Vänster',
  'zeroTrim.side.right': 'Höger',
  'zeroTrim.side.front': 'Fram',
  'zeroTrim.side.back': 'Bak',
  'zeroTrim.total': 'Finjusterat: {trim}',
  'zeroTrim.none': 'Inte finjusterat',
  'zeroTrim.reset': 'Återställ finjustering',
  'tilt.frontBack': 'Längsled',
  'tilt.sideSide': 'Sidled',

  'pose.layFlat': 'Lägg telefonen plant för att mäta',
  'pose.sensorHint': 'Den mäter bara rätt liggande plant, ovansidan upp.',
  'pose.openSensorPage': 'Visa boxen',
  'pose.sensorExtreme': 'Boxen lutar för mycket',
  'pose.sensorUpsideDown': 'Boxen verkar sitta upp och ner',
  'pose.sensorNotUpright': 'Boxen ligger ner',
  'pose.sensorHintUpright': 'Den mäter bara rätt stående.',
  'calibration.external.h': 'Nollställ fordonet',
  'calibration.external.intro':
    'Ställ fordonet plant en gång med ett vattenpass och nollställ sedan.',
  'calibration.external.phoneHidden':
    'Telefonens egen kalibrering visas inte medan Sensorboxen mäter. Vill du kalibrera telefonen: öppna boxen och tryck först på "{disconnect}".',
  'calibration.external.working': 'Nollställer…',
  'calibration.external.done': '{name} är nollställd: det här läget räknas nu som plant.',
  'calibration.external.err.notConnected': '{name} är inte ansluten. Anslut den och försök igen.',
  'calibration.external.err.failed':
    'Kunde inte nollställa {name}. Inget ändrades. Kontrollera anslutningen och försök igen.',
  'pose.portrait': 'Vänd telefonen på höjden (porträtt) — ovansidan ska peka framåt',

  'stale.dataUnavailable': 'Ingen ny sensordata – vägledningen är pausad tills den kommer tillbaka',

  'sensorFallback.lost': 'Tappade kontakten med boxen',
  'sensorFallback.autoRetry': 'Försöker igen automatiskt…',
  'sensorFallback.connect': 'Anslut boxen',
  'sensorFallback.pick': 'Tryck och välj din box i listan.',
  'sensorFallback.notFound': 'Hittade ingen box? Kontrollera att den är påslagen och nära.',
  'sensorFallback.retry': 'Återanslut',
  'sensorFallback.usePhone': 'Använd telefonen i stället',
  'mounting.prompt.upright': 'Tryck där boxens baksida (skruvfästet) pekar.',
  'mounting.prompt.arrow':
    'En av boxens pilar (på locket eller kretskortet under) pekar framåt. Vilken sida är vänd framåt?',
  'mounting.placement.wide': 'Långsidan framåt',
  'mounting.placement.short': 'Kortsidan framåt',
  'mounting.facing.front': 'Pekar mot fronten',
  'mounting.facing.right': 'Pekar åt höger',
  'mounting.facing.rear': 'Pekar bakåt',
  'mounting.facing.left': 'Pekar åt vänster',
  'box.state.connected': 'Ansluten',
  'box.state.lost': 'Tappade kontakten',
  'box.state.password': 'Fel lösenord',
  'box.password.label': 'Boxens kod',
  'box.password.retry': 'Försök igen',
  'box.password.checking': 'Provar koden…',
  'box.password.invalid': 'Koden är fyra siffror.',
  'box.password.wrong': 'Boxen godtog inte heller den koden.',
  'box.password.noAnswer':
    'Boxen svarade inte. Koden är sparad och provas nästa gång boxen ansluter.',
  'box.state.notConnected': 'Inte ansluten',
  'box.state.battery': 'batteri {value}',
  'box.connect': 'Anslut',
  'box.step.position.upright.ok': 'Står upprätt',
  'box.step.position.upright.bad': 'Ligger ner – ställ den upprätt, åt vilket håll som helst',
  'box.step.position.flat.ok': 'Ligger plant',
  'box.step.position.flat.bad': 'Lutar för mycket – lägg den plant med ovansidan upp',
  'box.step.position.flat.upsideDown':
    'Upp och ner – vänd den med locket uppåt. Tillverkaren avråder från att montera den upp och ner.',
  'box.step.position.waiting': 'Läge: väntar på mätvärde',
  'box.step.direction.todo': 'Välj riktning',
  'box.step.direction.done': 'Riktning vald',
  'box.step.direction.learn': 'Osäker? Lär in genom att höja fronten',
  'box.step.zero.todo': 'Nollställ fordonet',
  'box.step.zero.done': 'Nollställd',
  'box.step.zero.hint': 'Ställ fordonet plant med ett vattenpass och nollställ sedan.',
  'box.forgetDirection': 'Glöm riktningen',
  'onboard.boxPosition.h': 'Boxens läge',
  'onboard.boxPosition.later':
    'Riktning och nollställning gör du första gången du parkerar. Boxens sida guidar dig, och lampan ⚠ Nollställ påminner tills det är gjort.',
  'onboard.boxPosition.notConnected':
    'Ingen box är ansluten än, så läget kan inte visas. Tryck {next} och anslut senare med sensorikonen uppe till höger.',
  'sensorList.title': 'Sensorbox',
  'sensorList.phone': 'Telefonens egen sensor används när ingen box är ansluten.',
  'box.step.zero.again': 'Nollställ igen',
};
