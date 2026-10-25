import type { Messages } from './en';

/** Norwegian Bokmål. */
export const nb: Messages = {
  'topbar.install': 'Installer',
  'topbar.share': 'Del Libell',
  'bottombar.settings': 'Innstillinger',
  'bottombar.sound.mute': 'Slå av lyd',
  'bottombar.sound.unmute': 'Slå på lyd',
  'bottombar.help': 'Hjelp',
  'bottombar.label': 'Handlinger',
  'share.text': 'Få bobilen eller campingvognen i vater med telefonen.',
  'share.copied': 'Lenken er kopiert!',
  'update.check': 'Se etter ny versjon',
  'update.checking': 'Ser etter oppdateringer…',
  'update.updating': 'Oppdaterer til den nye versjonen…',
  'update.latest': 'Du har den nyeste versjonen',
  'update.offline': 'Ingen tilkobling, kan ikke se etter oppdateringer',
  'update.unsupported': 'Oppdateringer er ikke tilgjengelige her',
  'install.hint': 'Trykk på Del, og deretter «Legg til på Hjem-skjerm».',
  'install.row': 'Installer Libell som app på Hjem-skjermen.',
  'install.close': 'Skjul',
  'share.vehicle.text': 'Kjøretøyoppsettet mitt for Libell — dimensjoner og kiler.',
  'settings.shareVehicle': 'Del til en annen telefon',
  'setup.incoming.h': 'Mottatt kjøretøyoppsett',
  'setup.incoming.intro': 'Et familiemedlem har delt disse kjøretøydimensjonene med deg:',
  'setup.incoming.reminder':
    'Dette inkluderer ingen kalibrering — du må fortsatt kalibrere på denne telefonen.',
  'setup.incoming.apply': 'Erstatt nåværende kjøretøy',
  'setup.incoming.dismiss': 'Ikke nå',
  'setup.incoming.invalid': 'Lenken til kjøretøyoppsettet kunne ikke leses — ingenting ble endret.',

  'lamp.setup': '⚠ Dimensjoner',
  'lamp.setup.title': 'Kjøretøyets dimensjoner er aldri lagret — trykk for å åpne Innstillinger',
  'lamp.calibrate': '⚠ Kalibrer',
  'lamp.zero': '⚠ Nullstill',
  'lamp.calibrate.title': 'Telefonen er ikke kalibrert — trykk for å åpne «Kalibrer og nullstill»',
  'lamp.zero.title': 'Kjøretøyet er ikke nullstilt — trykk for å åpne «Kalibrer og nullstill»',
  'lamp.calibrate.title.sensor': 'Boksen er ikke nullstilt — trykk for å åpne boksen',

  'sensorStatus.connected': 'Sensorboks tilkoblet',
  'sensorStatus.disconnected': 'Sensorboks — mistet kontakt, trykk for detaljer',
  'sensorStatus.stale': 'Sensorboks — ingen nye data, trykk for detaljer',
  'sensorStatus.idle': 'Sensorboks — trykk for å koble til',
  'sensorStatus.idle.guide': 'Sensorboks — trykk for veiledning for iPhone',

  'menu.title': 'Meny',
  'menu.close': 'Lukk menyen',
  'menu.settings': 'Innstillinger',
  'menu.calibration': 'Kalibrer og nullstill',
  'menu.targets': 'Mål',
  'menu.feedback': 'Tilbakemelding',
  'menu.help': 'Hjelp',
  'menu.intro': 'Vis introduksjonen',
  'menu.about': 'Om Libell',
  'menu.about.tab': 'Om',
  'menu.sensorSource': 'Sensorboks',

  'sensorSource.connect': 'Koble til {name}-sensoren',
  'sensorSource.disconnect': 'Koble fra',
  'sensorSource.status.connecting': 'Kobler til…',
  'sensorSource.err.unsupported': 'Web Bluetooth støttes ikke i denne nettleseren.',
  'sensorSource.unsupported.browser':
    'For å koble til en sensorboks, åpne Libell i Chrome eller Edge på Android eller på en datamaskin. Telefonens egen sensor fungerer her som vanlig.',
  'sensorSource.err.password':
    '{name}-boksen godtok ikke passordet sitt. Skriv inn boksens firesifrede kode nedenfor og trykk på Prøv igjen. Fabrikkoden er 0000. Hvis du ikke kan koden, endrer du den i Xparkle-appen.',
  'sensorSource.err.failed': 'Kunne ikke koble til {name}-sensoren.',

  'sensorSource.ios.intro':
    'Safari kan ikke koble til Bluetooth-sensorer direkte, men det finnes en løsning:',
  'sensorSource.ios.step1': 'Installer «Bluefy – Web Bluetooth Browser» fra App Store.',
  'sensorSource.ios.step2': 'Åpne Bluefy og gi tillatelse til Bluetooth.',
  'sensorSource.ios.step3': 'Gå til den samme Libell-adressen i Bluefy.',
  'sensorSource.ios.step4': 'Åpne Sensorboks her igjen — da fungerer det som på Android.',
  'sensorSource.ios.note':
    'Bluefy er en app fra en tredjepart, ikke laget av Libell — når du åpner appen, kan det hende du må trykke én gang der for å koble til igjen, i stedet for at det skjer automatisk.',
  'sensorSource.ios.bluefyLink': 'Finn Bluefy i App Store',

  'sensorSource.detail.temperature': 'Temperatur: {value}',
  'sensorSource.detail.notAvailable': 'Ikke mottatt ennå',
  'sensorSource.lowBattery': '⚠ Lavt batteri ({value}) — bytt batteriet i sensorboksen snart.',

  'sensorSource.install.now': 'Nullstill nå',
  'sensorSource.install.clear': 'Glem nullpunktet',
  'sensorSource.install.status': 'Nullpunkt: foran/bak {pitch}, side/side {roll}.',
  'sensorSource.install.status.none': 'Ikke nullstilt ennå — boksen måler slik den står.',

  'sensorSource.learn.h': 'Lær monteringen',
  'sensorSource.learn.intro':
    'Libell lærer retningen fra to løft: først fronten, deretter høyre side.',
  'sensorSource.learn.start': 'Lær monteringen',
  'sensorSource.learn.step.front':
    'Løft fronten av kjøretøyet noen centimeter, og trykk deretter på knappen.',
  'sensorSource.learn.capture.front': 'Fronten er løftet',
  'sensorSource.learn.step.right':
    'Senk fronten igjen. Løft nå høyre side noen centimeter, og trykk deretter på knappen.',
  'sensorSource.learn.capture.right': 'Høyre side er løftet',
  'sensorSource.learn.cancel': 'Avbryt',
  'sensorSource.learn.status.learned': 'Monteringen er lært.',
  'sensorSource.learn.status.none': 'Ingen montering lært — boksens egne retninger brukes.',
  'sensorSource.learn.done': 'Ferdig! Kontroller: løft fronten, så skal Libell peke på bakhjulene.',
  'sensorSource.learn.err.tooSmall':
    'Kjøretøyet beveget seg nesten ikke. Løft det litt mer og prøv igjen.',
  'sensorSource.learn.err.ambiguous':
    'Begge retningene beveget seg omtrent like mye. Løft bare fronten, deretter bare høyre side, og prøv igjen.',
  'sensorSource.learn.err.arrow':
    'Ingen pil peker forover. Snu boksen slik at en av pilene peker forover, og prøv igjen.',
  'sensorSource.learn.err.mirrored':
    'Boksen ser ut til å ligge opp ned, eller feil side ble løftet. Kontroller og prøv igjen.',
  'sensorSource.learn.err.sameAxis':
    'Begge løftene vippet samme vei. Løft fronten først, deretter høyre side, og prøv igjen.',

  'sensorStatus.title': '{name}-sensor',
  'sensorStatus.reading': 'Helning nå: {value}',
  'sensorStatus.debug': 'Feilsøkingsinfo',
  'sensorStatus.debug.intro': 'Råverdier rett fra boksen — til feilsøking hvis noe ikke fungerer.',
  'sensorStatus.debug.state': 'Tilkoblingsstatus: {value}',
  'sensorStatus.debug.deviceId': 'Enhets-ID: {value}',
  'sensorStatus.debug.lastSample': 'Siste måling: {value}',
  'sensorStatus.debug.age': '{s} s siden',
  'sensorStatus.debug.rawAccel': 'Rått akselerometer (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Fastvarenivå: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Rå statusbyte: {value}',
  'sensorStatus.debug.versionBytes': 'Serienummer og fastvare (rått): {value}',
  'sensorStatus.debug.copy': 'Kopier info',
  'sensorStatus.debug.copied': 'Feilsøkingsinfo kopiert!',
  'sensorStatus.debug.copy.failed': 'Kunne ikke kopiere automatisk.',
  'sensorStatus.advanced': 'Avansert',
  'sensorStatus.silentReconnect.intro':
    'Denne nettleseren kan ennå ikke koble til boksen igjen av seg selv, så etter en omstart velger du den i listen på nytt. I Chrome kan du slå dette på selv.',
  'sensorStatus.silentReconnect.steps':
    'Åpne {address}, søk etter «web bluetooth», sett «Use the new permissions backend for Web Bluetooth» til Enabled og trykk på Relaunch. Koble deretter til boksen én gang.',
  'sensorStatus.silentReconnect.copy': 'Kopier {address}',
  'sensorStatus.silentReconnect.copied': 'Kopiert — lim det inn i adressefeltet i Chrome.',
  'sensorStatus.debug.connectDelay.intro':
    'Eksperimentelt: prøv dette bare hvis tilkoblingen til boksen er ustabil. Legger inn en fast pause etter tilkobling, før appen begynner å lese fra den.',
  'sensorStatus.debug.connectDelay.enable': 'Slå på tilkoblingspause',
  'sensorStatus.debug.connectDelay.ms': 'Pause (ms)',

  'about.text':
    'Libell hjelper deg å få bobilen eller campingvognen i vater med telefonen du allerede har, uten gjetting.',
  'about.version': 'Versjon {v}',
  'about.offline':
    'Fungerer helt uten nett — nettet brukes bare til å hente oppdateringer av selve appen.',
  'about.privacy':
    'Innstillingene dine blir på telefonen — ingen konto og ingen sporing. Det eneste Libell sender, er anonyme tall for hvordan appen brukes, og det kan du slå av.',
  'about.source': 'Libell er gratis og åpen kildekode (MIT-lisens).',
  'about.source.link': 'Kildekode på GitHub',
  'seo.title': 'Libell – få bobilen eller campingvognen i vater med telefonen',
  'seo.description':
    'En gratis app som viser hvilke hjul på bobilen eller campingvognen som skal opp, og på hvilket trinn på kilen. Bruker telefonen eller en sensorboks og fungerer uten nett.',
  'menu.privacy': 'Personvern',
  'menu.privacy.tab': 'Personvern',
  'privacy.stored.h': 'Lagret på denne telefonen',
  'privacy.stored.empty': 'Ingenting er lagret.',
  'privacy.raw': 'Vis rådata',
  'privacy.raw.hint': 'Nøyaktig slik det er lagret. Boksens passord er skjult.',
  'privacy.resetSettings': 'Tilbakestill bare innstillingene',
  'privacy.deleteAll': 'Slett alle Libell-data',
  'privacy.deleteAll.confirm':
    'Slette alt Libell har lagret på denne telefonen? Kjøretøy, dimensjoner og kalibrering forsvinner, og Libell starter på nytt som første gang.',
  'privacy.deleteAll.yes': 'Ja, slett alt',
  'privacy.deleteAll.cancel': 'Avbryt',
  'privacy.policy': 'Les personvernerklæringen',
  'policy.title': 'Personvernerklæring for Libell',
  'policy.changed': 'Sist endret {date}',
  'policy.intro':
    'Libell er et fritt åpen kildekode-prosjekt. Det finnes ingen kontoer, ingen reklame og ingen sporing, og ingen samler inn opplysninger om deg.',
  'policy.stored.h': 'Det som lagres på telefonen',
  'policy.stored':
    'Libell lagrer kjøretøyene dine med mål, innstillinger, kalibreringer, målposisjoner, valgt språk og sensorboksen du sist brukte. Alt ligger i nettleserens lokale lagring på telefonen din. Den fungerer omtrent som informasjonskapsler, men sendes aldri noe sted. Libell trenger dette for å fungere, og derfor finnes det ingen samtykkeboks.',
  'policy.stored.delete':
    'Under {help} › {tab} i appen ser du alt som er lagret, og kan slette alt sammen. Du kan også tømme nettstedsdataene i nettleseren.',
  'policy.sensors.h': 'Sensorer og Bluetooth',
  'policy.sensors':
    'Telefonens bevegelsessensorer og Bluetooth brukes bare på telefonen og bare til å måle helningen. Måleverdiene forlater aldri telefonen.',
  'policy.counting':
    'For å vite hva som bør bli bedre, kan Libell telle bruken anonymt med GoatCounter. Libell spør deg én gang om det kan telles, og ingenting telles før du har valgt. Statistikken er offentlig.',
  'policy.counting.ip':
    'Som ved alle forespørsler på internett når telefonens IP-adresse og nettleserens navn GoatCounter. GoatCounter lagrer dem aldri, men holder dem i minnet i høyst åtte timer for å kjenne igjen det samme besøket. GoatCounter drives fra Irland og har serverne sine i Finland og Tyskland, så ingenting forlater EU.',
  'policy.counting.change':
    'Du kan endre valget ditt når som helst under {help} › {tab}. Uten internett sendes ingenting, og ingenting lagres til senere.',
  'policy.counting.basis':
    'Tellingen bygger på samtykket ditt etter GDPR (artikkel 6 nr. 1 bokstav a): du gir det med valget ditt og kan trekke det tilbake når som helst. Siden ingenting som kan identifisere deg lagres, finnes det ingenting om deg å vise eller slette. Du kan klage til datatilsynet i landet ditt.',
  'policy.shared.h': 'Det du selv velger å dele',
  'policy.shared.feedback':
    'Under {help} › {feedback} kan du åpne en ferdig sak på GitHub, som du selv publiserer med din egen GitHub-konto. Saken er offentlig. I tillegg til teksten din inneholder den appens versjon, skjermstørrelse, tidspunkt og nettleserens navn, og du ser alt før du publiserer.',
  'policy.shared.vehicle':
    '«{share}» lager en lenke med kjøretøyets mål, uten kalibrering. Lenken havner bare der du selv sender den.',
  'policy.site.h': 'Nettstedet',
  'policy.site':
    'Libell ligger på GitHub Pages. Som alle nettverter ser GitHub IP-adressen din når siden lastes. Libell har ikke tilgang til GitHubs logger.',
  'policy.owner.h': 'Hvem som står bak Libell',
  'policy.owner':
    'Libell tilhører sitt åpen kildekode-prosjekt, ikke en person eller et selskap. Det er gratis og fritt å bruke som du vil under MIT-lisensen, og leveres som det er, uten garanti.',
  'policy.questions.h': 'Spørsmål og endringer',
  'policy.questions':
    'Still spørsmålene dine som en sak på GitHub. Når Libell endrer hva som lagres eller sendes, oppdateres denne siden samtidig.',
  'policy.questions.link': 'Saker på GitHub',
  'policy.languages': 'Andre språk',
  'policy.open': 'Åpne Libell',
  'stored.vehicle': 'Kjøretøy',
  'stored.vehicle.detail': '{name}, akselavstand {wheelbase}',
  'stored.settings': 'Innstillinger',
  'stored.settings.detail': 'Dimensjoner, kiler, enhet, utseende og lyd',
  'stored.password': 'Sensorboksens passord',
  'stored.language': 'Språk',
  'stored.phoneCalibration': 'Telefonens kalibrering',
  'stored.zero': 'Kjøretøyets nullstilling',
  'stored.zeroTrim': 'Finjustering av nullpunktet',
  'stored.targets': 'Mål',
  'stored.targets.active': '{name} (valgt)',
  'stored.hitch': 'Koblingshøyde',
  'stored.rememberedBox': 'Husket sensorboks',
  'stored.notes': 'Appens egne notater',
  'stored.notes.detail': '{n} små merker, for eksempel om introduksjonen er vist',
  'stored.phone': 'Telefonen',
  'stored.saved': 'lagret',
  'stored.counting.off': 'Slått av',
  'stored.counting.on': 'Slått på',
  'stored.savedOn': 'lagret {date}',

  'intro.h': 'Velkommen til Libell',
  'intro.how':
    'Legg telefonen flatt i kjøretøyet, så viser Libell hvilke hjul som skal opp, og hvor mye.',
  'intro.start': 'Kom i gang',
  'intro.later': 'Se deg rundt først',
  'onboard.source.sensorIcon':
    'En sensorboks kan kobles til når som helst med sensorikonet øverst til høyre.',
  'counting.title': 'Anonym telling',
  'counting.intro': 'Libell kan telle bruken anonymt, så vi vet hva som bør bli bedre.',
  'counting.sent.h': 'Dette telles',
  'counting.sent':
    'At appen ble åpnet, hvilke funksjoner som brukes, hvilken sensormodell som måler (telefonen eller en modell som {boxes}), appens versjon og språket som er valgt i Libell.',
  'counting.notSent.h': 'Dette lagres aldri',
  'counting.notSent':
    'IP-adressen din, landet, enheten, skjermen, operativsystemet eller nettleseren din, kjøretøyets mål, innstillingene dine eller noe annet om deg. Bare valget ditt lagres på telefonen.',
  'counting.gpc':
    'Hvis nettleseren din ber nettsteder om ikke å spore deg, teller Libell ingenting.',
  'counting.later': 'Du kan endre valget ditt når som helst under {help} › {tab}.',
  'counting.toggle': 'Tell bruken min anonymt',
  'counting.dashboard': 'Se statistikken',
  'counting.ask': 'Vil du hjelpe til med å gjøre Libell bedre?',
  'counting.yes': 'Ja, tell anonymt',
  'counting.no': 'Nei takk',
  'onboard.sound.h': 'Lyd',
  'onboard.source.h': 'Hvordan vil du måle?',
  'onboard.source.intro':
    'Velg hvilken sensor Libell skal lese helningen fra — de fleste bruker bare telefonen.',
  'onboard.source.phone': 'Denne telefonen',
  'onboard.source.externalActive':
    'En sensorboks er aktiv nå. Velger du denne telefonen, hoppes kalibreringen av telefonen over. For å kalibrere telefonen, åpne boksen med sensorikonet øverst til høyre og trykk først på «{disconnect}».',
  'onboard.vehicle.h': 'Hva skal i vater?',
  'onboard.vehicle.intro': 'Velg kjøretøy — resten av veiledningen tilpasses det.',
  'onboard.step1.h': 'Legg telefonen slik',
  'onboard.next': 'Neste',
  'onboard.back': 'Tilbake',
  'onboard.close': 'Lukk introduksjonen',
  'onboard.done': 'Ferdig',
  'onboard.skipStep': 'Hopp over',
  'onboard.note.measurements':
    'Hopper du over, brukes standarddimensjonene; {lamp} lyser til du lagrer dine egne.',
  'onboard.note.ramps':
    'Hopper du over, brukes standardkilene. Du kan velge dine egne senere under Innstillinger.',
  'onboard.note.calibrate':
    'Ingen plan flate akkurat nå? Trykk på {next}; {lamp} minner deg på det til det er gjort.',
  'onboard.note.connect':
    'Ingen boks for hånden? Trykk på {next} og koble til senere med sensorikonet øverst til høyre.',
  'onboard.zeroLater':
    'Du nullstiller kjøretøyet første gang du parkerer på plan grunn. {lamp} minner deg på det til det er gjort.',
  'onboard.legend.ok': 'Grønn ✓ — det hjulet står i vater.',
  'onboard.legend.up': 'Oransje ↑ — kjør det hjulet opp på trinnet som vises.',
  'onboard.legend.no': 'Rød ✕ — ikke noe trinn er nok; flytt til et flatere sted.',
  'onboard.legend.dim': 'Grå – — ingen kile ved det hjulet; tallet viser hvor mye som mangler.',

  'settings.wheelbase': 'Akselavstand',
  'settings.trackFront': 'Sporvidde foran',
  'settings.trackRear': 'Sporvidde bak',
  'settings.tolerance': 'Toleranse',
  'settings.stability': 'Stabilitet',
  'settings.dwellRest': 'Reaksjonstid (ms)',
  'settings.dwellMotion': 'Reaksjonstid under justering (ms)',
  'settings.dwell.hint': 'Hvor lenge en måling må holde seg før tallet endres.',
  'settings.vehicle': 'Kjøretøy',
  'vehicle.motorhome': 'Bobil',
  'vehicle.caravan': 'Campingvogn',
  'settings.axleToJockey': 'Aksel til nesehjul',
  'settings.rearAxle': 'Bakaksel',
  'settings.axle': 'Aksel',
  'axle.single': 'Enkel',
  'axle.boggie': 'Tandem (boggi)',
  'settings.track': 'Sporvidde',
  'settings.measureHint': 'De står i vognkortet. Noen cm feil gjør ingenting.',
  'settings.measureHint.caravan':
    'Avstanden måles fra akselen til nesehjulet. Noen cm feil gjør ingenting.',
  'settings.measureHint.boggie': 'Med tandemaksel måler du til midten av akselparet.',
  'settings.steps': 'Trinnhøyder på kilene',
  'settings.steps.add': 'Nytt trinn',
  'settings.steps.new': 'Ny trinnhøyde ({unit})',
  'settings.steps.remove': 'Fjern {value}',
  'settings.ramp': 'Kilemodell',
  'settings.ramp.custom': 'Eget sett',
  'settings.ramp.stepless': 'Trinnløs kile',
  'settings.ramp.steplessModel': '{name} (trinnløs, maks {max} mm)',
  'settings.stepless.max': 'Trinnløs kile, maks høyde',
  'settings.stepless.maxHeading': 'Maks høyde',
  'settings.stepless.set': 'Lagre',
  'settings.stepless.new': 'Maks høyde ({unit})',
  'settings.rampCount': 'Antall kiler',
  'settings.drain': 'Avløpsside',
  'settings.rampHint': 'Appen velger hvor kilene dine gjør mest nytte.',
  'settings.drainHint':
    'Innenfor toleransen blir denne siden liggende lavest, så vannet renner ut.',
  'settings.section.vehicle': 'Kjøretøy og dimensjoner',
  'settings.section.ramps': 'Kiler',
  'settings.general': 'Generelt',
  'settings.language': 'Språk',
  'settings.language.auto': 'Automatisk (enhetens språk)',
  'settings.tolerance.hint': 'Hvor nær vater som regnes som i vater.',
  'settings.stability.hint': 'Jevner ut små sensorrystelser så tallene ikke flimrer.',
  'drain.none': 'Ingen / spiller ingen rolle',
  'drain.left': 'Venstre, midten',
  'drain.right': 'Høyre, midten',
  'drain.front': 'Foran, midten',
  'drain.rear': 'Bak, midten',
  'drain.frontLeft': 'Foran venstre',
  'drain.frontRight': 'Foran høyre',
  'drain.rearLeft': 'Bak venstre',
  'drain.rearRight': 'Bak høyre',
  'settings.unit': 'Vis lengder i',
  'settings.unitInches': 'tommer (in)',
  'settings.theme': 'Tema',
  'theme.system': 'Følg telefonen',
  'theme.light': 'Lyst',
  'theme.dark': 'Mørkt',
  'settings.appearance': 'Utseende',
  'appearance.classic': 'Klassisk',
  'appearance.modern': 'Moderne',
  'appearance.glossy': 'Blank',
  'settings.sound': 'Lydsignal ved vater',
  'settings.soundGuidance': 'Kontinuerlig lydveiledning',
  'settings.soundGuidance.help': 'Pipet blir raskere og lysere jo nærmere vater du kommer.',
  'settings.soundSpeech': 'Talt veiledning',
  'settings.soundSpeech.help':
    'Når kjøretøyet står stille, sier appen hvilket hjul og hvor mye, for eksempel «Bak venstre, Trinn 2».',
  'settings.soundSpeech.unavailable':
    'Talt veiledning fungerer ikke på denne telefonen: den har ingen norsk stemme som fungerer uten nett. Tonene fungerer som vanlig.',
  'speech.level': 'Vater',
  'speech.inches': '{n} tommer',
  'speech.inchOne': 'en tomme',
  'speech.inchOneAnd': 'en og {fraction} tomme',
  'speech.inchesAnd': '{n} og {fraction} tommer',
  'speech.inchFraction': '{fraction} tomme',
  'speech.eighth1': 'en åttendedels',
  'speech.eighth2': 'en kvart',
  'speech.eighth3': 'tre åttendedels',
  'speech.eighth4': 'en halv',
  'speech.eighth5': 'fem åttendedels',
  'speech.eighth6': 'tre kvart',
  'speech.eighth7': 'sju åttendedels',
  'settings.undo': 'Angre',
  'settings.saved': 'Lagret',
  'settings.more': 'Mer',
  'settings.fineTuning': 'Finjustering',
  'settings.resetAll': 'Tilbakestill alt',
  'settings.err.positive': 'Skriv inn et tall over 0. Den forrige verdien gjelder fortsatt.',
  'settings.err.notNegative': 'Skriv inn 0 eller mer. Den forrige verdien gjelder fortsatt.',
  'settings.err.range':
    'Skriv inn et tall fra {min} til {max}. Den forrige verdien gjelder fortsatt.',
  'settings.tab.vehicle': 'Kjøretøy',
  'settings.tab.ramps': 'Kiler',
  'settings.tab.level': 'Vater',
  'settings.klossar.brandAll': 'Alle',
  'settings.klossar.changeRamp': 'Bytt kile',
  'settings.rampCountHint': 'Appen legger dem der de hjelper mest.',
  'settings.klossar.selected': 'Valgt',
  'settings.klossar.stepsHeading': 'Trinnhøyder',

  'status.measuring': 'Måler…',
  'status.almost': 'Nesten i vater — {left} igjen',
  'status.cantLevel.close': 'Kilene dine er nesten nok, men ikke helt her — flytt kjøretøyet',
  'status.cantLevel.far': 'Kilene dine er langt fra nok her — flytt kjøretøyet',
  'adjustable.before': 'Still inn kilene på trinnet som vises, og kjør opp etterpå.',
  'adjustable.after': 'Ikke i vater ennå. Kjør ned fra kilene, så måler appen på nytt.',

  'calibration.intro':
    'Legg telefonen på en flate du vet er i vater, og trykk på Kalibrer nå. Den nåværende helningen blir nullpunktet.',
  'calibration.status': 'Kalibrert: foran/bak {pitch}, side/side {roll}.',
  'calibration.status.none': 'Ikke kalibrert — bruker den rå sensoren.',
  'calibration.now': 'Kalibrer nå',
  'calibration.step.phone.done': 'Telefonen er kalibrert',
  'calibration.step.phone.hint': 'Legg telefonen på noe flatt.',
  'calibration.step.flipLink': 'Ingen plan flate? Snu telefonen',
  'calibration.step.vehicle.done': 'Nullstilt',
  'calibration.step.vehicle.hint':
    'Sett kjøretøyet i vater med et vaterpass, og legg telefonen på sin vanlige plass.',
  'calibration.step.vehicle.now': 'Nullstill nå',
  'calibration.clear': 'Slett kalibrering',
  'calibration.err.notRunning':
    'Helningssensoren er ikke startet ennå — trykk først på Start på hovedskjermen.',
  'calibration.warn.notFlat':
    'Kalibreringen er lagret, men dette ser ikke flatt ut (over 15°), så den er trolig feil. Var det ikke meningen? Trykk på Angre, legg telefonen på en plan flate og kalibrer på nytt.',
  'calibration.undo': 'Angre',
  'calibration.sensor.h': 'Kalibrer telefonen',
  'calibration.vehicle.h': 'Nullstill kjøretøyet',
  'calibration.vehicle.intro':
    'Kalibrering handler om telefonen, ikke om stedet den ligger. Heller bordet litt, viser appen den helningen. Sett kjøretøyet i vater én gang med et vaterpass, legg telefonen på sin vanlige plass og nullstill.',
  'calibration.vehicle.now': 'Nullstill nå',
  'calibration.vehicle.clear': 'Glem nullpunktet',
  'calibration.vehicle.status': 'Kjøretøyets nullpunkt: foran/bak {pitch}, side/side {roll}.',
  'calibration.vehicle.status.none':
    'Intet nullpunkt for kjøretøyet — telefonens plass regnes som flat.',
  'calibration.vehicle.warn.notFlat':
    'Nullpunktet er lagret, men dette ser ikke ut til å være i vater (over 15°). Stod ikke kjøretøyet i vater? Trykk på Angre, sett kjøretøyet i vater og nullstill på nytt.',
  'calibration.age.today': '(i dag)',
  'calibration.age.days': '({n} dager siden)',
  'calibration.check': 'Sjekk',
  'calibration.check.good': 'Fortsatt bra — avvik {off}°.',
  'calibration.check.off': 'Avvik {off}° — vurder å kalibrere på nytt.',
  'calibration.vehicle.check.off': 'Avvik {off}° — vurder å nullstille på nytt.',
  'calibration.check.none':
    'Ikke kalibrert ennå, så det er ingenting å kontrollere. Legg telefonen på en flate i vater og trykk på «{now}».',
  'calibration.vehicle.check.none':
    'Intet nullpunkt ennå, så det er ingenting å kontrollere. Sett kjøretøyet i vater med et vaterpass og trykk på «{now}».',
  'calibration.flip.intro':
    'Ingen flate i vater i nærheten? Bruk snukalibrering: legg telefonen et sted som er noenlunde flatt, les av, snu telefonen en halv omdreining (180°) på samme sted og les av igjen — helningen i underlaget opphever seg selv.',
  'calibration.flip.start': 'Kalibrer ved å snu',
  'calibration.flip.rotate':
    'Snu nå telefonen en halv omdreining (180°) på samme sted, og trykk på Les av.',
  'calibration.flip.capture': 'Les av',
  'calibration.flip.done': 'Ferdig! Underlaget heller {surface}° — det er trukket fra.',
  'calibration.flip.warn.moved':
    'Kalibreringen er lagret, men de to avlesningene skiller seg med mer enn 15°. Flyttet telefonen seg? Trykk på Angre og begynn på nytt.',
  'calibration.pill.notDone': 'IKKE GJORT',
  'calibration.pill.done': 'GJORT',
  'calibration.pill.none': 'INGEN',

  'targets.normal': 'Normal (vater)',
  'targets.name.placeholder': 'Navn (f.eks. «Dusjsluk»)',
  'targets.name.label': 'Navn på det nye målet',
  'targets.defaultName': 'Mål {n}',
  'targets.add': 'Lagre helningen som nytt mål',
  'targets.delete': 'Slett {name}',
  'targets.warn.tooSteep':
    'Målet er lagret, men det er brattere enn et vanlig mål (over 15°). Var det ikke meningen? Slett det med krysset og lagre på nytt.',
  'targets.badge': 'Mål: {name}',

  'feedback.intro':
    'Har du funnet et problem eller fått en idé? Fyll ut dette og trykk på knappen — da åpnes en ferdig rapport på GitHub som du publiserer der (du trenger en gratis GitHub-konto, som lages på et minutt).',
  'feedback.category': 'Hva gjelder det?',
  'feedback.cat.bug': 'Feil',
  'feedback.cat.suggestion': 'Forslag',
  'feedback.cat.other': 'Annet',
  'feedback.title': 'Kort tittel',
  'feedback.desc': 'Hva skjedde, eller hva ønsker du deg?',
  'feedback.submit': 'Åpne rapporten på GitHub',
  'feedback.warn.title': 'Tittelen er tom — du kan sende rapporten likevel.',
  'feedback.warn.desc': 'Beskrivelsen er tom — du kan sende rapporten likevel.',
  'feedback.warn.both': 'Tittelen og beskrivelsen er tomme — du kan sende rapporten likevel.',

  'help.screen.h': 'Slik leser du skjermen',
  'help.screen.lead':
    'Skjermen viser hvilke hjul som skal heves, og hvor mye. Trinn 2 betyr det andre trinnet på kilen din.',
  'help.screen.t':
    'Grønn ✓: ferdig, ingenting å gjøre.\n' +
    'Oransje ↑: kjør det hjulet opp på trinnet som vises ved siden av.\n' +
    'Rød ✕: kilene dine er ikke nok her. Flytt kjøretøyet.\n' +
    'Grå –: ingen kile ved det hjulet. Tallet viser hvor mye som mangler, hvis du vil legge noe annet under.\n' +
    'Når boblen ligger i midten, står du i vater.',
  'help.screen.routine':
    'Kjør opp, vent til kjøretøyet står stille og se igjen. Gjenta til alle hjul er grønne.',
  'help.what.t':
    'Legg telefonen flatt i kjøretøyet, med toppen mot fronten, på samme sted hver gang.\n' +
    'Med en sensorboks spiller det ingen rolle hvordan telefonen ligger.',
  'help.settings.h': 'Dimensjonene',
  'help.measures.h': 'Skriv inn dimensjonene',
  'help.settings.t':
    'Libell regner ut hvor mye hvert hjul må heves ut fra akselavstand og sporvidde.\n' +
    'De står i vognkortet, eller du kan måle med et målebånd.\n' +
    'Skriv dem inn i mm, cm eller tommer, det du har valgt under «Vis lengder i».\n' +
    'På en campingvogn er akselavstanden avstanden fra akselen til nesehjulet.\n' +
    'Med flere kjøretøy har hvert sine egne dimensjoner, kiler, nullpunkt, mål og sensorboks; velg et øverst under «Kjøretøy».',
  'help.ramps.t':
    'Skjermen viser hvilket trinn på kilen hvert hjul skal opp på, så legg inn kilene du har med.\n' +
    'Velg en kilemodell eller et eget sett, og hvor mange du har. Libell legger dem der de hjelper mest.\n' +
    'For en kile uten trinn velger du «Trinnløs kile» og skriver inn høyden. Skjermen sier da hvor langt du skal kjøre opp.',
  'help.calibration.h': 'Kalibrer og nullstill',
  'help.calibration.t':
    'To trinn gjør målingene riktige: kalibrer telefonen én gang og nullstill kjøretøyet én gang.\n' +
    'Kalibrer: legg telefonen på en plan flate og trykk på Kalibrer nå.\n' +
    'Nullstill: sett kjøretøyet i vater med et vaterpass, legg telefonen på sin vanlige plass og trykk på Nullstill nå.\n' +
    'Med en sensorboks nullstiller du på boksens side. Den trenger ingen kalibrering.\n' +
    'Fortsatt ikke helt i vater? Finjuster nullpunktet med Venstre opp, Høyre opp, Front opp eller Bak opp under «Nullstill kjøretøyet».\n' +
    'Lampen ⚠ Kalibrer eller ⚠ Nullstill lyser til det er gjort.',
  'help.sensor.h': 'Sensorboks',
  'help.sensor.t':
    'En sensorboks i kjøretøyet kan måle i stedet for telefonen. Libell fungerer med disse:\n' +
    '{upright}: står oppreist, vendt hvilken vei som helst.\n' +
    '{flat}: ligger flatt, lokket opp, med én pil pekende forover.\n' +
    'Koble til med sensorikonet øverst til høyre. Boksens side tar deg deretter gjennom «Velg retning» og «Nullstill kjøretøyet».\n' +
    'Det fungerer i Chrome eller Edge på Android eller en datamaskin. På iPhone trenger du nettleseren Bluefy.\n' +
    'Hvis boksen avviser koden, ber Libell om boksens firesifrede kode.',
  'help.targets.h': 'Mål og lyd',
  'help.targets.t':
    'Lagre en helning du vil ha, for eksempel mot dusjsluket, og bytt mellom dem.\n' +
    'Campingvogn: lagre koblingshøyden før du kobler fra, så leder «Til koblingshøyde» nesehjulet tilbake dit.\n' +
    'Med talt veiledning på sier appen hvilket hjul som skal heves og hvor mye, så du kan sette i vater uten å se på telefonen.\n' +
    'Knappen midt på den nederste linjen slår lyden av og på.',
  'help.trouble.h': 'Hvis noe er galt',
  'help.trouble.t':
    '«Måler…»: kjøretøyet gynger. Vent til det står stille.\n' +
    '«Legg telefonen flatt for å måle»: telefonen heller for mye til å måle.\n' +
    '«Mistet kontakten med boksen»: trykk på Koble til igjen og velg boksen i listen.\n' +
    '«Venter på helningssensoren…»: ingen målinger ennå. På iPhone trykker du på Start hver gang du åpner appen; ellers last inn siden på nytt.\n' +
    '«Tilgang til bevegelse ble avslått»: tillat bevegelse og retning for dette nettstedet i nettleserinnstillingene og last inn på nytt.\n' +
    'Fortsatt feil? Skriv en rapport under «Tilbakemelding».',
  'help.open': 'Åpne {name}',
  'help.open.sensor': 'Åpne sensorboksen',
  'help.open.feedback': 'Skriv en rapport',

  'main.hint': 'Legg telefonen flatt i kjøretøyet, med toppkanten mot fronten.',
  'main.start': 'Start',
  'main.waiting': 'Venter på helningssensoren…',
  'main.level': 'Kjøretøyet står i vater!',
  'main.denied':
    'Tilgang til bevegelse ble avslått, så Libell kan ikke lese helningen. Tillat tilgang til bevegelse og retning for dette nettstedet og last inn siden på nytt.',
  'main.noSensors':
    'Denne enheten har ingen tilgjengelige bevegelsessensorer, så Libell kan ikke lese helningen.',
  'main.https':
    'Libell trenger en sikker tilkobling (HTTPS) for å lese helningssensorene. Åpne appen via HTTPS og prøv igjen.',

  'diagram.aria': 'Bobilen sett ovenfra, med hvilke hjul som må heves',
  'diagram.caravan.aria': 'Campingvognen sett ovenfra, med akselhjulene og nesehjulet',
  'diagram.front': 'Front',
  'diagram.step': 'Trinn {n}',
  'diagram.driveUp': 'Kjør opp',
  'diagram.done': 'Ferdig',
  'diagram.noRamp': 'Ingen kile',
  'diagram.wheel.frontLeft': 'Foran venstre',
  'diagram.wheel.frontRight': 'Foran høyre',
  'diagram.wheel.rearLeft': 'Bak venstre',
  'diagram.wheel.rearRight': 'Bak høyre',
  'diagram.notEnough': 'ikke nok',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Sveiv opp',
  'caravan.crankDown': 'Sveiv ned',
  'caravan.axleLeft': 'Venstre akselhjul',
  'caravan.axleRight': 'Høyre akselhjul',
  'caravan.jockeyWheel': 'Nesehjul',
  'help.screen.caravan': 'Campingvogn: nesehjulet viser Sveiv opp eller Sveiv ned, og hvor mye.',

  'vehicles.title': 'Kjøretøy',
  'vehicles.defaultName': 'Mitt kjøretøy',
  'vehicles.numbered': 'Kjøretøy {n}',
  'vehicles.name.placeholder': 'Navn (f.eks. «Campingvogn»)',
  'vehicles.name.label': 'Kjøretøyets navn',
  'vehicles.add': 'Nytt kjøretøy',
  'namePrompt.save': 'Lagre',
  'namePrompt.cancel': 'Avbryt',
  'choice.rename': 'Gi nytt navn til {name}',
  'vehicles.badge': 'Kjøretøy: {name}',
  'vehicles.delete': 'Fjern {name}',
  'vehicles.remove.confirm': 'Fjerne {name} med nullpunkt, mål og sensorboks?',
  'vehicles.remove.yes': 'Ja, fjern',
  'vehicles.hint':
    'Dimensjoner, kiler, kjøretøyets nullpunkt, mål og sensorboksen hører til kjøretøyet. Telefonens kalibrering er felles.',
  'setup.incoming.addNew': 'Legg til som nytt kjøretøy',

  'hitch.title': 'Koblingshøyde',
  'hitch.hint':
    'Lagre den mens campingvognen fortsatt står på kulen. Før du kobler på igjen, viser nesehjulet hvor mye du skal sveive så koblingen møter kulen.',
  'hitch.save': 'Lagre koblingshøyde',
  'hitch.go': 'Til koblingshøyde',
  'hitch.done': 'Ferdig',
  'hitch.savedNow': 'Koblingshøyden er lagret.',
  'hitch.status.none': 'Ingen koblingshøyde er lagret ennå.',
  'hitch.status.saved': 'En koblingshøyde er lagret.',
  'hitch.status.active': 'Hovedskjermen viser hvor mye nesehjulet skal sveives.',
  'hitch.badge': 'Koblingshøyde',
  'hitch.badge.aria': 'Koblingshøyde: trykk for å sette i vater som vanlig igjen',
  'hitch.crank.up': 'Sveiv opp {amount} til koblingshøyde',
  'hitch.crank.down': 'Sveiv ned {amount} til koblingshøyde',
  'hitch.reached': 'Ved koblingshøyde',
  'hitch.offer': 'Lagre koblingshøyden først?',
  'hitch.offer.save': 'Lagre',
  'hitch.offer.dismiss': 'Ikke nå',

  'zeroTrim.title': 'Finjuster nullpunktet',
  'zeroTrim.hint':
    'Fortsatt ikke helt i vater? Hvert trykk flytter nullpunktet 0,1°, så appen vil ha den siden høyere.',
  'zeroTrim.left': 'Venstre opp',
  'zeroTrim.right': 'Høyre opp',
  'zeroTrim.front': 'Front opp',
  'zeroTrim.back': 'Bak opp',
  'zeroTrim.side.left': 'Venstre',
  'zeroTrim.side.right': 'Høyre',
  'zeroTrim.side.front': 'Front',
  'zeroTrim.side.back': 'Bak',
  'zeroTrim.total': 'Finjustert: {trim}',
  'zeroTrim.none': 'Ikke finjustert',
  'zeroTrim.reset': 'Fjern finjustering',

  'tilt.frontBack': 'Foran/bak',
  'tilt.sideSide': 'Side/side',

  'pose.layFlat': 'Legg telefonen flatt for å måle',
  'pose.sensorHint': 'Den måler bare riktig når den ligger flatt, toppen opp.',
  'pose.openSensorPage': 'Vis boksen',
  'pose.sensorExtreme': 'Boksen heller for mye',
  'pose.sensorUpsideDown': 'Boksen ser ut til å ligge opp ned',
  'pose.sensorNotUpright': 'Boksen ligger ned',
  'pose.sensorHintUpright': 'Den måler bare riktig når den står oppreist.',

  'calibration.external.h': 'Nullstill kjøretøyet',
  'calibration.external.intro': 'Sett kjøretøyet i vater én gang med et vaterpass, og nullstill.',
  'calibration.external.phoneHidden':
    'Telefonens egen kalibrering er skjult mens sensorboksen måler. For å kalibrere telefonen, åpne boksen og trykk først på «{disconnect}».',
  'calibration.external.working': 'Nullstiller…',
  'calibration.external.done': '{name} er nullstilt: denne posisjonen regnes nå som i vater.',
  'calibration.external.err.notConnected': '{name} er ikke tilkoblet. Koble den til og prøv igjen.',
  'calibration.external.err.failed':
    'Kunne ikke nullstille {name}. Ingenting ble endret. Kontroller tilkoblingen og prøv igjen.',

  'pose.portrait': 'Vend telefonen til stående — toppkanten skal peke forover',
  'stale.dataUnavailable':
    'Ingen nye sensordata — veiledningen er satt på pause til de kommer tilbake',

  'sensorFallback.lost': 'Mistet kontakten med boksen',
  'sensorFallback.autoRetry': 'Prøver igjen automatisk…',
  'sensorFallback.connect': 'Koble til boksen',
  'sensorFallback.pick': 'Trykk og velg boksen din i listen.',
  'sensorFallback.notFound': 'Fant ingen boks? Kontroller at den er på og i nærheten.',
  'sensorFallback.retry': 'Koble til igjen',
  'sensorFallback.usePhone': 'Bruk telefonen i stedet',

  'mounting.prompt.upright': 'Trykk der baksiden av boksen (skruefestet) peker.',
  'mounting.prompt.arrow':
    'En av pilene på boksen (på lokket, eller på kretskortet under det) peker forover. Hvilken side vender mot fronten?',
  'mounting.placement.wide': 'Langsiden forover',
  'mounting.placement.short': 'Kortsiden forover',
  'mounting.facing.front': 'Peker mot fronten',
  'mounting.facing.right': 'Peker mot høyre',
  'mounting.facing.rear': 'Peker bakover',
  'mounting.facing.left': 'Peker mot venstre',

  'box.state.connected': 'Tilkoblet',
  'box.state.lost': 'Mistet kontakt',
  'box.state.password': 'Feil passord',
  'box.password.label': 'Boksens kode',
  'box.password.retry': 'Prøv igjen',
  'box.password.checking': 'Prøver koden…',
  'box.password.invalid': 'Koden har fire sifre.',
  'box.password.wrong': 'Boksen godtok ikke den koden heller.',
  'box.password.noAnswer':
    'Boksen svarte ikke. Koden er lagret og prøves neste gang boksen kobler seg til.',
  'box.state.notConnected': 'Ikke tilkoblet',
  'box.state.battery': 'batteri {value}',
  'box.connect': 'Koble til',

  'box.step.position.upright.ok': 'Står oppreist',
  'box.step.position.upright.bad': 'Ligger ned: sett den oppreist, vendt hvilken vei som helst',
  'box.step.position.flat.ok': 'Ligger flatt',
  'box.step.position.flat.bad': 'Heller for mye: legg den flatt, toppen opp',
  'box.step.position.flat.upsideDown':
    'Opp ned: snu den med lokket opp. Produsenten fraråder å montere den opp ned.',
  'box.step.position.waiting': 'Posisjon: venter på måling',
  'box.step.direction.todo': 'Velg retning',
  'box.step.direction.done': 'Retning valgt',
  'box.step.direction.learn': 'Usikker? Lær den ved å løfte fronten',
  'box.step.zero.todo': 'Nullstill kjøretøyet',
  'box.step.zero.done': 'Nullstilt',
  'box.step.zero.hint': 'Sett kjøretøyet i vater med et vaterpass, og nullstill.',
  'box.forgetDirection': 'Glem retningen',
  'onboard.boxPosition.h': 'Boksens posisjon',
  'onboard.boxPosition.later':
    'Retning og nullpunkt stilles inn første gang du parkerer. Boksens side veileder deg, og lampen ⚠ Nullstill minner deg på det til det er gjort.',
  'onboard.boxPosition.notConnected':
    'Ingen boks er tilkoblet ennå, så posisjonen kan ikke vises. Trykk på {next} og koble til senere med sensorikonet øverst til høyre.',
  'sensorList.title': 'Sensorboks',
  'sensorList.phone': 'Telefonens egen sensor brukes når ingen boks er tilkoblet.',
  'box.step.zero.again': 'Nullstill igjen',
};
