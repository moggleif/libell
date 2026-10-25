import type { Messages } from './en';

/** Catalan. */
export const ca: Messages = {
  'topbar.install': 'Instal·la',
  'topbar.share': 'Comparteix Libell',
  'bottombar.settings': 'Configuració',
  'bottombar.sound.mute': 'Silencia el so',
  'bottombar.sound.unmute': 'Activa el so',
  'bottombar.help': 'Ajuda',
  'bottombar.label': 'Accions',
  'share.text': 'Anivella l’autocaravana o la caravana amb el mòbil.',
  'share.copied': 'Enllaç copiat!',
  'update.check': 'Cerca una versió nova',
  'update.checking': 'S’estan cercant actualitzacions…',
  'update.updating': 'S’està actualitzant a la versió nova…',
  'update.latest': 'Tens la versió més recent',
  'update.offline': 'Sense connexió, no es poden cercar actualitzacions',
  'update.unsupported': 'Les actualitzacions no estan disponibles aquí',
  'install.hint': 'Toca Comparteix i després «Afegeix a la pantalla d’inici».',
  'install.row': 'Instal·la Libell com a app a la pantalla d’inici.',
  'install.close': 'Amaga',
  'share.vehicle.text': 'La configuració del meu vehicle per a Libell — mesures i rampes.',
  'settings.shareVehicle': 'Envia a un altre mòbil',
  'setup.incoming.h': 'Configuració de vehicle rebuda',
  'setup.incoming.intro': 'Un familiar t’ha compartit aquestes mesures del vehicle:',
  'setup.incoming.reminder': 'No inclou cap calibratge — encara has de calibrar aquest mòbil.',
  'setup.incoming.apply': 'Reemplaça el vehicle actual',
  'setup.incoming.dismiss': 'Ara no',
  'setup.incoming.invalid':
    'No s’ha pogut llegir l’enllaç de configuració del vehicle — no s’ha canviat res.',

  'lamp.setup': '⚠ Mesures',
  'lamp.setup.title': 'Les mesures del vehicle no s’han desat mai — toca per obrir Configuració',
  'lamp.calibrate': '⚠ Calibra',
  'lamp.zero': '⚠ Zero',
  'lamp.calibrate.title': 'El mòbil no està calibrat — toca per obrir «Calibra i posa a zero»',
  'lamp.zero.title': 'El vehicle no està posat a zero — toca per obrir «Calibra i posa a zero»',
  'lamp.calibrate.title.sensor': 'La caixa no està posada a zero — toca per obrir la caixa',

  'sensorStatus.connected': 'Caixa sensora connectada',
  'sensorStatus.disconnected': 'Caixa sensora — contacte perdut, toca per veure’n els detalls',
  'sensorStatus.stale': 'Caixa sensora — sense dades noves, toca per veure’n els detalls',
  'sensorStatus.idle': 'Caixa sensora — toca per connectar',
  'sensorStatus.idle.guide': 'Caixa sensora — toca per a la guia d’iPhone',

  'menu.title': 'Menú',
  'menu.close': 'Tanca el menú',
  'menu.settings': 'Configuració',
  'menu.calibration': 'Calibra i posa a zero',
  'menu.targets': 'Objectius',
  'menu.feedback': 'Opinió',
  'menu.help': 'Ajuda',
  'menu.intro': 'Introducció',
  'menu.about': 'Quant a Libell',
  'menu.about.tab': 'Info',
  'menu.sensorSource': 'Caixa sensora',

  'sensorSource.connect': 'Connecta el sensor {name}',
  'sensorSource.disconnect': 'Desconnecta',
  'sensorSource.status.connecting': 'Connectant…',
  'sensorSource.err.unsupported': 'Aquest navegador no admet Web Bluetooth.',
  'sensorSource.unsupported.browser':
    'Per connectar una caixa sensora, obre Libell al Chrome o a l’Edge en un Android o en un ordinador. El sensor del mòbil funciona aquí com sempre.',
  'sensorSource.err.password':
    'La caixa {name} no ha acceptat la contrasenya. Escriu a sota el codi de quatre xifres de la caixa i toca Reintenta. El codi de fàbrica és 0000. Si no saps el codi, canvia’l a l’app Xparkle.',
  'sensorSource.err.failed': 'No s’ha pogut connectar al sensor {name}.',

  'sensorSource.ios.intro':
    'Safari no es pot connectar directament a sensors Bluetooth, però hi ha una alternativa:',
  'sensorSource.ios.step1': 'Instal·la «Bluefy – Web Bluetooth Browser» de l’App Store.',
  'sensorSource.ios.step2': 'Obre Bluefy i permet l’accés a Bluetooth.',
  'sensorSource.ios.step3': 'A Bluefy, ves a aquesta mateixa adreça de Libell.',
  'sensorSource.ios.step4': 'Torna a obrir «Caixa sensora» aquí — funciona com a Android.',
  'sensorSource.ios.note':
    'Bluefy és una app de tercers, no feta per Libell — quan obres l’app, pot ser que la ' +
    'reconnexió necessiti un toc manual allà, en lloc de fer-se sola.',
  'sensorSource.ios.bluefyLink': 'Cerca Bluefy a l’App Store',

  'sensorSource.detail.temperature': 'Temperatura: {value}',
  'sensorSource.detail.notAvailable': 'Pendent',
  'sensorSource.lowBattery':
    '⚠ Bateria baixa ({value}) — convé canviar aviat la pila de la caixa sensora.',

  'sensorSource.install.now': 'Posa a zero',
  'sensorSource.install.clear': 'Oblida el zero',
  'sensorSource.install.status': 'Zero: longitudinal {pitch}, lateral {roll}.',
  'sensorSource.install.status.none': 'Encara sense zero — la caixa mesura tal com està.',

  'sensorSource.learn.h': 'Aprèn el muntatge',
  'sensorSource.learn.intro':
    'Libell aprèn la direcció a partir de dues elevacions: primer el davant, després el costat dret.',
  'sensorSource.learn.start': 'Aprèn el muntatge',
  'sensorSource.learn.step.front':
    'Aixeca uns quants centímetres el davant del vehicle i després prem el botó.',
  'sensorSource.learn.capture.front': 'Davant aixecat',
  'sensorSource.learn.step.right':
    'Torna a baixar el davant. Ara aixeca uns quants centímetres el costat dret i després prem el botó.',
  'sensorSource.learn.capture.right': 'Costat dret aixecat',
  'sensorSource.learn.cancel': 'Cancel·la',
  'sensorSource.learn.status.learned': 'Muntatge après.',
  'sensorSource.learn.status.none':
    'Cap muntatge après — s’utilitzen les direccions de la mateixa caixa.',
  'sensorSource.learn.done':
    'Fet! Comprova-ho: aixeca el davant i Libell hauria d’indicar les rodes del darrere.',
  'sensorSource.learn.err.tooSmall':
    'El vehicle gairebé no s’ha mogut. Aixeca’l una mica més i torna-ho a provar.',
  'sensorSource.learn.err.ambiguous':
    'Les dues direccions s’han mogut gairebé igual. Aixeca només el davant, després només el costat dret, i torna-ho a provar.',
  'sensorSource.learn.err.arrow':
    'Cap fletxa no apunta endavant. Gira la caixa perquè una de les fletxes apunti endavant i torna-ho a provar.',
  'sensorSource.learn.err.mirrored':
    'Sembla que la caixa està de cap per avall, o s’ha aixecat el costat equivocat. Comprova-ho i torna-ho a provar.',
  'sensorSource.learn.err.sameAxis':
    'Les dues elevacions han inclinat en el mateix eix. Aixeca primer el davant, després el costat dret, i torna-ho a provar.',

  'sensorStatus.title': 'Sensor {name}',
  'sensorStatus.reading': 'Inclinació ara: {value}',
  'sensorStatus.debug': 'Dades de depuració',
  'sensorStatus.debug.intro':
    'Valors en brut directament de la caixa — per resoldre problemes si alguna cosa no funciona.',
  'sensorStatus.debug.state': 'Estat de la connexió: {value}',
  'sensorStatus.debug.deviceId': 'ID del dispositiu: {value}',
  'sensorStatus.debug.lastSample': 'Última mostra: {value}',
  'sensorStatus.debug.age': 'fa {s} s',
  'sensorStatus.debug.rawAccel': 'Acceleròmetre en brut (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Nivell de firmware: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Bytes d’estat en brut: {value}',
  'sensorStatus.debug.versionBytes': 'Número de sèrie i firmware (en brut): {value}',
  'sensorStatus.debug.copy': 'Copia les dades',
  'sensorStatus.debug.copied': 'Dades de depuració copiades!',
  'sensorStatus.debug.copy.failed': 'No s’ha pogut copiar automàticament.',
  'sensorStatus.advanced': 'Avançat',
  'sensorStatus.silentReconnect.intro':
    'Aquest navegador encara no es pot tornar a connectar sol a la caixa, així que després de reiniciar l’has de tornar a triar a la llista. Al Chrome ho pots activar tu mateix.',
  'sensorStatus.silentReconnect.steps':
    'Obre {address}, cerca «web bluetooth», posa «Use the new permissions backend for Web Bluetooth» a Enabled i toca Relaunch. Després connecta la caixa una vegada.',
  'sensorStatus.silentReconnect.copy': 'Copia {address}',
  'sensorStatus.silentReconnect.copied': 'Copiat — enganxa-ho a la barra d’adreces del Chrome.',
  'sensorStatus.debug.connectDelay.intro':
    'Experimental: prova-ho només si la connexió de la caixa no és fiable. Afegeix una pausa fixa després de connectar, abans que l’app en comenci a llegir.',
  'sensorStatus.debug.connectDelay.enable': 'Activa la pausa de connexió',
  'sensorStatus.debug.connectDelay.ms': 'Pausa (ms)',

  'about.text':
    'Libell t’ajuda a anivellar l’autocaravana o la caravana amb el mòbil que ja ' +
    'tens, sense endevinar.',
  'about.version': 'Versió {v}',
  'about.offline':
    'Funciona completament sense connexió — la xarxa només s’utilitza per baixar actualitzacions de la mateixa app.',
  'about.privacy':
    'La teva configuració es queda al mòbil — sense compte i sense seguiment. L’únic que envia Libell són recomptes anònims de com es fa servir l’app, i ho pots desactivar.',
  'about.source': 'Libell és lliure i de codi obert (llicència MIT).',
  'about.source.link': 'Codi font a GitHub',
  'menu.privacy': 'Privadesa',
  'menu.privacy.tab': 'Privadesa',
  'privacy.stored.h': 'Desat en aquest mòbil',
  'privacy.stored.empty': 'No hi ha res desat.',
  'privacy.raw': 'Mostra les dades en brut',
  'privacy.raw.hint': 'Tal com estan desades. La contrasenya de la caixa està amagada.',
  'privacy.resetSettings': 'Restableix només la configuració',
  'privacy.deleteAll': 'Esborra totes les dades de Libell',
  'privacy.deleteAll.confirm':
    'Vols esborrar tot el que Libell ha desat en aquest mòbil? Els vehicles, les mesures i el calibratge desapareixen, i Libell torna a començar com la primera vegada.',
  'privacy.deleteAll.yes': 'Sí, esborra-ho tot',
  'privacy.deleteAll.cancel': 'Cancel·la',
  'stored.vehicle': 'Vehicle',
  'stored.vehicle.detail': '{name}, distància entre eixos {wheelbase}',
  'stored.settings': 'Configuració',
  'stored.settings.detail': 'Mesures, rampes, unitat, aparença i so',
  'stored.password': 'Contrasenya de la caixa sensora',
  'stored.language': 'Idioma',
  'stored.phoneCalibration': 'Calibratge del mòbil',
  'stored.zero': 'Zero del vehicle',
  'stored.zeroTrim': 'Ajust fi del zero',
  'stored.targets': 'Objectius',
  'stored.targets.active': '{name} (triat)',
  'stored.hitch': 'Alçada d’enganxament',
  'stored.rememberedBox': 'Caixa sensora recordada',
  'stored.notes': 'Notes pròpies de l’app',
  'stored.notes.detail': '{n} marques petites, per exemple si ja s’ha vist la introducció',
  'stored.phone': 'El mòbil',
  'stored.saved': 'desat',
  'stored.savedOn': 'desat el {date}',

  'intro.h': 'Benvinguda a Libell',
  'intro.how':
    'Posa el mòbil pla dins el vehicle i Libell et mostra quines rodes cal pujar i quant.',
  'intro.start': 'Comença',
  'intro.later': 'Fes una ullada primer',
  'onboard.source.sensorIcon':
    'Pots connectar una caixa sensora quan vulguis amb la icona del sensor a dalt a la dreta.',
  'counting.title': 'Recompte anònim',
  'counting.intro': 'Libell compta l’ús de manera anònima, per saber què cal millorar.',
  'counting.sent.h': 'Què es compta',
  'counting.sent':
    'Que s’ha obert l’app, quines funcions es fan servir, quin model de sensor mesura (el mòbil o un model com {boxes}), la versió de l’app i l’idioma triat a Libell.',
  'counting.notSent.h': 'Què no es desa mai',
  'counting.notSent':
    'La teva adreça IP, país, dispositiu, pantalla, sistema operatiu o navegador, les mesures del vehicle, la teva configuració, ni res més sobre tu. No es desa res al mòbil per al recompte.',
  'counting.gpc':
    'Si el teu navegador demana als llocs web que no et rastregin, Libell no compta res.',
  'counting.toggle': 'Compta el meu ús de manera anònima',
  'counting.dashboard': 'Mira les estadístiques',
  'onboard.sound.h': 'So',
  'onboard.source.h': 'Com vols mesurar?',
  'onboard.source.intro':
    'Tria de quin sensor ha de llegir Libell la inclinació — la majoria de gent fa servir el mòbil.',
  'onboard.source.phone': 'Aquest mòbil',
  'onboard.source.externalActive':
    'Ara hi ha una caixa sensora activa. Si tries aquest mòbil, s’omet el calibratge del mòbil. Per calibrar el mòbil, obre la caixa amb la icona del sensor a dalt a la dreta i toca primer «{disconnect}».',
  'onboard.vehicle.h': 'Què vols anivellar?',
  'onboard.vehicle.intro': 'Tria el teu vehicle — la resta d’aquesta guia s’hi adapta.',
  'onboard.step1.h': 'Col·loca el mòbil així',
  'onboard.next': 'Següent',
  'onboard.back': 'Enrere',
  'onboard.close': 'Tanca la introducció',
  'onboard.done': 'Fet',
  'onboard.skipStep': 'Omet',
  'onboard.note.measurements':
    'Si ho omets, s’utilitzen les mesures per defecte; {lamp} queda encès fins que desis les teves.',
  'onboard.note.ramps':
    'Si ho omets, s’utilitzen les rampes per defecte. Pots triar les teves més tard a Configuració.',
  'onboard.note.calibrate':
    'Ara no tens cap superfície plana? Toca {next}; {lamp} t’ho recorda fins que estigui fet.',
  'onboard.note.connect':
    'No tens cap caixa a mà? Toca {next} i connecta-la més tard amb la icona del sensor a dalt a la dreta.',
  'onboard.zeroLater':
    'Poses el vehicle a zero el primer cop que aparques en un terreny pla. {lamp} t’ho recorda fins que estigui fet.',
  'onboard.legend.ok': 'Verd ✓ — aquesta roda està anivellada.',
  'onboard.legend.up': 'Taronja ↑ — puja aquesta roda al graó indicat.',
  'onboard.legend.no': 'Vermell ✕ — cap graó no és prou alt; ves a un lloc més pla.',
  'onboard.legend.dim': 'Gris – — cap rampa en aquesta roda; la xifra indica quant hi falta.',
  'settings.wheelbase': 'Distància entre eixos',
  'settings.trackFront': 'Amplada de via davantera',
  'settings.trackRear': 'Amplada de via posterior',
  'settings.tolerance': 'Tolerància',
  'settings.stability': 'Estabilitat',
  'settings.dwellRest': 'Retard de resposta (ms)',
  'settings.dwellMotion': 'Retard de resposta en ajustar (ms)',
  'settings.dwell.hint': 'Quant de temps s’ha de mantenir una lectura abans que el número canviï.',
  'settings.vehicle': 'Vehicle',
  'vehicle.motorhome': 'Autocaravana',
  'vehicle.caravan': 'Caravana',
  'settings.axleToJockey': 'De l’eix a la roda jockey',
  'settings.rearAxle': 'Eix del darrere',
  'settings.axle': 'Eix',
  'axle.single': 'Simple',
  'axle.boggie': 'Doble (tàndem)',
  'settings.track': 'Amplada de via',
  'settings.measureHint':
    'Són a la fitxa tècnica del vehicle. Uns quants cm de diferència no importen.',
  'settings.measureHint.caravan':
    'Mesura des de l’eix fins a la roda jockey. Uns quants cm de diferència no importen.',
  'settings.measureHint.boggie': 'Amb un eix doble, mesura fins al centre del parell d’eixos.',
  'settings.steps': 'Alçades dels graons de la rampa',
  'settings.steps.add': 'Nou graó',
  'settings.steps.new': 'Alçada del graó nou ({unit})',
  'settings.steps.remove': 'Elimina {value}',
  'settings.ramp': 'Rampa comercial',
  'settings.ramp.custom': 'Joc personalitzat',
  'settings.ramp.stepless': 'Falca sense graons',
  'settings.ramp.steplessModel': '{name} (sense graons, màx. {max} mm)',
  'settings.stepless.max': 'Falca sense graons, alçada màx.',
  'settings.stepless.maxHeading': 'Alçada màxima',
  'settings.stepless.set': 'Desa',
  'settings.stepless.new': 'Alçada màxima ({unit})',
  'settings.rampCount': 'Nombre de rampes',
  'settings.drain': 'Costat del desguàs',
  'settings.rampHint': 'L’app tria on les rampes ajuden més.',
  'settings.drainHint':
    'Dins de la tolerància, aquest costat queda més baix perquè l’aigua escorri.',
  'settings.section.vehicle': 'Vehicle i mesures',
  'settings.section.ramps': 'Rampes',
  'settings.general': 'General',
  'settings.language': 'Idioma',
  'settings.language.auto': 'Automàtic (idioma del dispositiu)',
  'settings.tolerance.hint': 'Quina desviació encara compta com a anivellat.',
  'settings.stability.hint':
    'Suavitza les petites oscil·lacions del sensor perquè els números no parpellegin.',
  'drain.none': 'Cap / no importa',
  'drain.left': 'Esquerra, al mig',
  'drain.right': 'Dreta, al mig',
  'drain.front': 'Davant, al mig',
  'drain.rear': 'Darrere, al mig',
  'drain.frontLeft': 'Davant esquerra',
  'drain.frontRight': 'Davant dreta',
  'drain.rearLeft': 'Darrere esquerra',
  'drain.rearRight': 'Darrere dreta',
  'settings.unit': 'Mostra les longituds en',
  'settings.unitInches': 'polzades (in)',
  'settings.theme': 'Tema',
  'theme.system': 'Com el mòbil',
  'theme.light': 'Clar',
  'theme.dark': 'Fosc',
  'settings.appearance': 'Aparença',
  'appearance.classic': 'Clàssic',
  'appearance.modern': 'Modern',
  'appearance.glossy': 'Brillant',
  'settings.sound': 'Avís sonor en anivellar',
  'settings.soundGuidance': 'Guia sonora contínua',
  'settings.soundGuidance.help':
    'El so és més ràpid i més agut com més a prop estàs de l’anivellament.',
  'settings.soundSpeech': 'Guia per veu',
  'settings.soundSpeech.help':
    'Quan el vehicle està aturat, l’app diu quina roda i quant, per exemple «Darrere esquerra, Graó 2».',
  'settings.soundSpeech.unavailable':
    'La guia per veu no funciona en aquest mòbil: no té cap veu en català que funcioni sense connexió. Els sons funcionen com sempre.',
  'speech.level': 'Anivellat',
  'speech.inches': '{n} polzades',
  'speech.inchOne': 'una polzada',
  'speech.inchOneAnd': 'una polzada i {fraction}',
  'speech.inchesAnd': '{n} polzades i {fraction}',
  'speech.inchFraction': '{fraction} de polzada',
  'speech.eighth1': 'un vuitè',
  'speech.eighth2': 'un quart',
  'speech.eighth3': 'tres vuitens',
  'speech.eighth4': 'mitja',
  'speech.eighth5': 'cinc vuitens',
  'speech.eighth6': 'tres quarts',
  'speech.eighth7': 'set vuitens',
  'settings.undo': 'Desfés',
  'settings.saved': 'Desat',
  'settings.more': 'Més',
  'settings.fineTuning': 'Ajust fi',
  'settings.resetAll': 'Restableix-ho tot',
  'settings.err.positive': 'Introdueix un nombre més gran que 0. Es manté el valor anterior.',
  'settings.err.notNegative': 'Introdueix 0 o més. Es manté el valor anterior.',
  'settings.err.range': 'Introdueix un nombre entre {min} i {max}. Es manté el valor anterior.',

  'settings.tab.vehicle': 'Vehicle',
  'settings.tab.ramps': 'Rampes',
  'settings.tab.level': 'Nivell',
  'settings.klossar.brandAll': 'Totes',
  'settings.klossar.changeRamp': 'Canvia rampa',
  'settings.rampCountHint': 'L’app les col·loca on ajuden més.',
  'settings.klossar.selected': 'Triada',
  'settings.klossar.stepsHeading': 'Alçades dels graons',

  'status.measuring': 'Mesurant…',
  'status.almost': 'Gairebé anivellat — falten {left}',
  'status.cantLevel.close': 'Les rampes no hi arriben per poc — mou el vehicle',
  'status.cantLevel.far': 'Les rampes no hi arriben ni de lluny — mou el vehicle',
  'adjustable.before': 'Ajusta les rampes al graó indicat abans de pujar-hi.',
  'adjustable.after': 'Encara no està anivellat. Baixa de les rampes i l’app tornarà a mesurar.',

  'calibration.intro':
    'Posa el mòbil sobre una superfície que saps que és plana i toca Calibra ara. ' +
    'La inclinació actual passa a ser el punt zero.',
  'calibration.status': 'Calibrat: longitudinal {pitch}, lateral {roll}.',
  'calibration.status.none': 'No calibrat — s’utilitza el sensor en brut.',
  'calibration.now': 'Calibra ara',
  'calibration.step.phone.done': 'Mòbil calibrat',
  'calibration.step.phone.hint': 'Posa el mòbil sobre una cosa plana.',
  'calibration.step.flipLink': 'Cap lloc pla? Gira el mòbil',
  'calibration.step.vehicle.done': 'Posat a zero',
  'calibration.step.vehicle.hint':
    'Anivella el vehicle amb un nivell de bombolla i posa el mòbil al lloc de sempre.',
  'calibration.step.vehicle.now': 'Posa a zero',
  'calibration.clear': 'Esborra calibratge',
  'calibration.err.notRunning':
    'El sensor d’inclinació encara no funciona — toca primer Inicia a la pantalla principal.',
  'calibration.warn.notFlat':
    'Calibratge desat, però no sembla pla (més de 15°), així que probablement és erroni. No era el que volies? Toca Desfés, posa el mòbil sobre una superfície plana i torna a calibrar.',
  'calibration.undo': 'Desfés',
  'calibration.sensor.h': 'Calibra el mòbil',
  'calibration.vehicle.h': 'Posa el vehicle a zero',
  'calibration.vehicle.intro':
    'El calibratge és del mòbil, no del lloc on és. Si la taula fa una mica de pendent, l’app mostra aquesta inclinació. Anivella el vehicle una vegada amb un nivell de bombolla, posa el mòbil al lloc de sempre i posa el vehicle a zero.',
  'calibration.vehicle.now': 'Posa a zero',
  'calibration.vehicle.clear': 'Oblida el zero',
  'calibration.vehicle.status': 'Zero del vehicle: longitudinal {pitch}, lateral {roll}.',
  'calibration.vehicle.status.none': 'Sense zero del vehicle — el lloc del mòbil compta com a pla.',
  'calibration.vehicle.warn.notFlat':
    'Zero desat, però no sembla anivellat (més de 15°). El vehicle no estava anivellat? Toca Desfés, anivella el vehicle i torna’l a posar a zero.',
  'calibration.age.today': '(avui)',
  'calibration.age.days': '(fa {n} dies)',
  'calibration.check': 'Comprova',
  'calibration.check.good': 'Encara és correcte — desviació de {off}°.',
  'calibration.check.off': 'Desviació de {off}° — convé tornar a calibrar.',
  'calibration.vehicle.check.off': 'Desviació de {off}° — convé tornar a posar a zero.',
  'calibration.check.none':
    'Encara no està calibrat, així que no hi ha res a comprovar. Posa el mòbil sobre una superfície plana i toca «{now}».',
  'calibration.vehicle.check.none':
    'Encara no hi ha zero, així que no hi ha res a comprovar. Anivella el vehicle amb un nivell de bombolla i toca «{now}».',
  'calibration.flip.intro':
    'No hi ha cap superfície plana a prop? Fes servir el calibratge per gir: posa el mòbil en ' +
    'qualsevol lloc raonablement pla, captura, gira el mòbil mitja volta (180°) al mateix ' +
    'lloc i torna a capturar — la inclinació de la superfície s’anul·la sola.',
  'calibration.flip.start': 'Calibra girant',
  'calibration.flip.rotate': 'Ara gira el mòbil mitja volta (180°) al mateix lloc i toca Captura.',
  'calibration.flip.capture': 'Captura',
  'calibration.flip.done': 'Fet! La superfície fa un pendent de {surface}° — compensat.',
  'calibration.flip.warn.moved':
    'Calibratge desat, però les dues captures difereixen més de 15°. S’ha mogut el mòbil? Toca Desfés i torna a començar.',
  'calibration.pill.notDone': 'PENDENT',
  'calibration.pill.done': 'FET',
  'calibration.pill.none': 'CAP',

  'targets.normal': 'Normal (anivellat)',
  'targets.name.placeholder': 'Nom (p. ex. «Desguàs de la dutxa»)',
  'targets.name.label': 'Nom de l’objectiu nou',
  'targets.defaultName': 'Objectiu {n}',
  'targets.add': 'Desa la inclinació com a objectiu',
  'targets.delete': 'Elimina {name}',
  'targets.warn.tooSteep':
    'Objectiu desat, però és més inclinat que un objectiu habitual (més de 15°). No era el que volies? Elimina’l amb la creu i torna’l a desar.',
  'targets.badge': 'Objectiu: {name}',

  'feedback.intro':
    'Has trobat un problema o tens una idea? Omple això i toca el botó — obre ' +
    'un informe ja preparat a GitHub on el publiques (cal un compte gratuït de ' +
    'GitHub, que es crea en un minut).',
  'feedback.category': 'De què es tracta?',
  'feedback.cat.bug': 'Error',
  'feedback.cat.suggestion': 'Suggeriment',
  'feedback.cat.other': 'Altres',
  'feedback.title': 'Títol breu',
  'feedback.desc': 'Què ha passat, o què t’agradaria?',
  'feedback.submit': 'Obre l’informe a GitHub',
  'feedback.warn.title': 'El títol és buit — pots enviar l’informe igualment.',
  'feedback.warn.desc': 'La descripció és buida — pots enviar l’informe igualment.',
  'feedback.warn.both': 'El títol i la descripció són buits — pots enviar l’informe igualment.',

  'help.screen.h': 'Com llegir la pantalla',
  'help.screen.lead':
    'La pantalla mostra quines rodes cal aixecar i quant. Graó 2 vol dir el segon graó de la rampa.',
  'help.screen.t':
    'Verd ✓: fet, no cal fer res.\n' +
    'Taronja ↑: puja aquesta roda al graó indicat al costat.\n' +
    'Vermell ✕: les rampes no hi arriben aquí. Mou el vehicle.\n' +
    'Gris –: cap rampa en aquesta roda. La xifra mostra quant hi falta, per si vols posar-hi una altra cosa a sota.\n' +
    'Quan la bombolla queda al centre, estàs anivellat.',
  'help.screen.routine':
    'Puja, espera que el vehicle estigui quiet i torna a mirar. Repeteix fins que totes les rodes estiguin en verd.',
  'help.what.t':
    'Posa el mòbil pla dins del vehicle, amb la part de dalt cap endavant, sempre al mateix lloc.\n' +
    'Amb una caixa sensora no importa com estigui el mòbil.',
  'help.settings.h': 'Les mesures',
  'help.measures.h': 'Introdueix les mesures',
  'help.settings.t':
    'Libell calcula quant s’ha d’aixecar cada roda a partir de la distància entre eixos i l’amplada de via.\n' +
    'Són a la documentació del vehicle, o mesura-les amb una cinta.\n' +
    'Escriu-les en mm, cm o polzades, segons el que hagis triat a «Mostra les longituds en».\n' +
    'En una caravana, la distància entre eixos és la distància de l’eix a la roda jockey.\n' +
    'Amb diversos vehicles, cadascun té les seves mesures, rampes, zero del vehicle, objectius i caixa sensora; tria’n un a dalt de Vehicle.',
  'help.ramps.t':
    'La pantalla et diu a quin graó de la rampa ha de pujar cada roda, així que introdueix les rampes que portes.\n' +
    'Tria una rampa comercial o un joc personalitzat, i quantes en tens. Libell les col·loca on ajuden més.\n' +
    'Per a una rampa sense graons, tria «Falca sense graons» i introdueix-ne l’alçada. Llavors la pantalla diu quant has de pujar.',
  'help.calibration.h': 'Calibra i posa a zero',
  'help.calibration.t':
    'Dos passos fan que les lectures siguin correctes: calibra el mòbil una vegada i posa el vehicle a zero una vegada.\n' +
    'Calibrar: posa el mòbil sobre una superfície plana i toca Calibra ara.\n' +
    'Posar a zero: anivella el vehicle amb un nivell de bombolla, posa el mòbil al lloc de sempre i toca Posa a zero.\n' +
    'Amb una caixa sensora, el zero es fa a la pàgina de la caixa. No necessita calibratge.\n' +
    'Encara no està ben anivellat? Ajusta el zero amb Esquerra amunt, Dreta amunt, Davant amunt o Darrere amunt a «Posa el vehicle a zero».\n' +
    'El llum ⚠ Calibra o ⚠ Zero queda encès fins que estigui fet.',
  'help.sensor.h': 'Caixa sensora',
  'help.sensor.t':
    'Una caixa sensora al vehicle pot mesurar en lloc del mòbil. Libell funciona amb aquestes:\n' +
    '{upright}: dreta, encarada cap a qualsevol costat.\n' +
    '{flat}: plana, amb la tapa amunt i una fletxa apuntant endavant.\n' +
    'Connecta-la amb la icona del sensor a dalt a la dreta. Llavors la pàgina de la caixa et guia per «Tria la direcció» i «Posa el vehicle a zero».\n' +
    'Funciona al Chrome o a l’Edge en un Android o un ordinador. A l’iPhone necessites el navegador Bluefy.\n' +
    'Si la caixa rebutja el codi, Libell et demana el codi de quatre xifres de la caixa.',
  'help.targets.h': 'Objectius i so',
  'help.targets.t':
    'Desa una inclinació que vulguis, per exemple cap al desguàs de la dutxa, i canvia entre elles.\n' +
    'Caravana: desa l’alçada d’enganxament abans de desenganxar, i «Torna a l’enganxament» guia la roda jockey fins a ella.\n' +
    'Amb la guia per veu activada, l’app diu quina roda cal aixecar i quant, així pots anivellar sense mirar el mòbil.\n' +
    'El botó del mig de la barra inferior activa i desactiva el so.',
  'help.trouble.h': 'Si alguna cosa falla',
  'help.trouble.t':
    '«Mesurant…»: el vehicle es balanceja. Espera que estigui quiet.\n' +
    '«Posa el mòbil pla per mesurar»: el mòbil està massa inclinat per mesurar.\n' +
    '«S’ha perdut el contacte amb la caixa»: toca Reconnecta i tria la caixa a la llista.\n' +
    '«Esperant el sensor d’inclinació…»: encara no hi ha lectures. A l’iPhone, toca Inicia cada vegada que obres l’app; si no, torna a carregar la pàgina.\n' +
    '«S’ha denegat l’accés al moviment»: permet el moviment i l’orientació per a aquest lloc a la configuració del navegador i torna a carregar la pàgina.\n' +
    'Encara falla? Escriu un informe a Opinió.',
  'help.open': 'Obre {name}',
  'help.open.sensor': 'Obre la caixa',
  'help.open.feedback': 'Fes un informe',

  'main.hint': 'Posa el mòbil pla dins del vehicle, amb la vora de dalt cap endavant.',
  'main.start': 'Inicia',
  'main.waiting': 'Esperant el sensor d’inclinació…',
  'main.level': 'El vehicle està anivellat!',
  'main.denied':
    'S’ha denegat l’accés al moviment, així que Libell no pot llegir la inclinació. ' +
    'Permet l’accés al moviment i l’orientació per a aquest lloc i torna a carregar la pàgina.',
  'main.noSensors':
    'Aquest dispositiu no ofereix sensors de moviment, així que Libell no pot llegir la inclinació.',
  'main.https':
    'Libell necessita una connexió segura (HTTPS) per llegir els sensors d’inclinació. ' +
    'Obre l’app per HTTPS i torna-ho a provar.',

  'diagram.aria': 'Vista superior de l’autocaravana que mostra quines rodes cal aixecar',
  'diagram.caravan.aria': 'Vista superior de la caravana amb les rodes de l’eix i la roda jockey',
  'diagram.front': 'Davant',
  'diagram.step': 'Graó {n}',
  'diagram.driveUp': 'Puja',
  'diagram.done': 'Fet',
  'diagram.noRamp': 'Cap rampa',
  'diagram.wheel.frontLeft': 'Davant esquerra',
  'diagram.wheel.frontRight': 'Davant dreta',
  'diagram.wheel.rearLeft': 'Darrere esquerra',
  'diagram.wheel.rearRight': 'Darrere dreta',
  'diagram.notEnough': 'insuficient',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Manovella amunt',
  'caravan.crankDown': 'Manovella avall',
  'caravan.axleLeft': 'Roda esquerra de l’eix',
  'caravan.axleRight': 'Roda dreta de l’eix',
  'caravan.jockeyWheel': 'Roda jockey',
  'help.screen.caravan': 'Caravana: la roda jockey diu Manovella amunt o Manovella avall, i quant.',

  'vehicles.title': 'Vehicles',
  'vehicles.defaultName': 'El meu vehicle',
  'vehicles.numbered': 'Vehicle {n}',
  'vehicles.name.placeholder': 'Nom (p. ex. «Caravana»)',
  'vehicles.name.label': 'Nom del vehicle',
  'vehicles.add': 'Vehicle nou',
  'namePrompt.save': 'Desa',
  'namePrompt.cancel': 'Cancel·la',
  'choice.rename': 'Canvia el nom de {name}',
  'vehicles.badge': 'Vehicle: {name}',
  'vehicles.delete': 'Elimina {name}',
  'vehicles.remove.confirm':
    'Vols eliminar {name} amb el seu zero del vehicle, objectius i caixa sensora?',
  'vehicles.remove.yes': 'Sí, elimina',
  'vehicles.hint':
    'Les mesures, les rampes, el zero del vehicle, els objectius i la caixa sensora pertanyen al vehicle. El calibratge del mòbil és compartit.',
  'setup.incoming.addNew': 'Afegeix com a nou',

  'hitch.title': 'Alçada d’enganxament',
  'hitch.hint':
    'Desa-la mentre la caravana encara és a la bola de remolc. Abans de tornar a enganxar, la roda jockey mostra quant has de girar la manovella perquè l’acoblament coincideixi amb la bola.',
  'hitch.save': 'Desa l’alçada',
  'hitch.go': 'Torna a l’enganxament',
  'hitch.done': 'Fet',
  'hitch.savedNow': 'Alçada d’enganxament desada.',
  'hitch.status.none': 'Encara no hi ha cap alçada d’enganxament desada.',
  'hitch.status.saved': 'Hi ha una alçada d’enganxament desada.',
  'hitch.status.active':
    'La pantalla principal mostra quant cal girar la manovella de la roda jockey.',
  'hitch.badge': 'Enganxament',
  'hitch.badge.aria': 'Alçada d’enganxament: toca per tornar a anivellar com sempre',
  'hitch.crank.up': 'Manovella amunt {amount} fins a l’alçada d’enganxament',
  'hitch.crank.down': 'Manovella avall {amount} fins a l’alçada d’enganxament',
  'hitch.reached': 'A l’alçada d’enganxament',
  'hitch.offer': 'Vols desar primer l’alçada d’enganxament?',
  'hitch.offer.save': 'Desa',
  'hitch.offer.dismiss': 'Ara no',

  'zeroTrim.title': 'Ajusta el zero',
  'zeroTrim.hint':
    'Encara no està ben anivellat? Cada toc mou el zero 0,1°, de manera que l’app vol aquest costat més alt.',
  'zeroTrim.left': 'Esquerra amunt',
  'zeroTrim.right': 'Dreta amunt',
  'zeroTrim.front': 'Davant amunt',
  'zeroTrim.back': 'Darrere amunt',
  'zeroTrim.side.left': 'Esquerra',
  'zeroTrim.side.right': 'Dreta',
  'zeroTrim.side.front': 'Davant',
  'zeroTrim.side.back': 'Darrere',
  'zeroTrim.total': 'Ajustat: {trim}',
  'zeroTrim.none': 'Sense ajust',
  'zeroTrim.reset': 'Treu l’ajust',
  'tilt.frontBack': 'Longitudinal',
  'tilt.sideSide': 'Lateral',

  'pose.layFlat': 'Posa el mòbil pla per mesurar',
  'pose.sensorHint': 'Només mesura bé plana, amb la part de dalt amunt.',
  'pose.openSensorPage': 'Obre la caixa',
  'pose.sensorExtreme': 'La caixa està massa inclinada',
  'pose.sensorUpsideDown': 'Sembla que la caixa està de cap per avall',
  'pose.sensorNotUpright': 'La caixa està ajaguda',
  'pose.sensorHintUpright': 'Només mesura bé si està dreta.',
  'calibration.external.h': 'Posa el vehicle a zero',
  'calibration.external.intro':
    'Anivella el vehicle una vegada amb un nivell de bombolla i després posa’l a zero.',
  'calibration.external.phoneHidden':
    'El calibratge del mòbil s’amaga mentre mesura la caixa sensora. Per calibrar el mòbil, obre la caixa i toca primer «{disconnect}».',
  'calibration.external.working': 'Posant a zero…',
  'calibration.external.done': '{name} està a zero: aquesta posició ara compta com a anivellada.',
  'calibration.external.err.notConnected':
    '{name} no està connectat. Connecta’l i torna-ho a provar.',
  'calibration.external.err.failed':
    'No s’ha pogut posar {name} a zero. No s’ha canviat res. Comprova la connexió i torna-ho a provar.',
  'pose.portrait': 'Posa el mòbil en vertical — la vora de dalt ha d’apuntar endavant',

  'stale.dataUnavailable':
    'No hi ha dades noves del sensor — la guia queda en pausa fins que tornin',

  'sensorFallback.lost': 'S’ha perdut el contacte amb la caixa',
  'sensorFallback.autoRetry': 'S’està tornant a provar automàticament…',
  'sensorFallback.connect': 'Connecta la caixa',
  'sensorFallback.pick': 'Toca i tria la caixa a la llista.',
  'sensorFallback.notFound': 'No es troba cap caixa? Comprova que estigui engegada i a prop.',
  'sensorFallback.retry': 'Reconnecta',
  'sensorFallback.usePhone': 'Fes servir el mòbil',
  'mounting.prompt.upright':
    'Toca cap on apunta la part del darrere de la caixa (el suport de cargol).',
  'mounting.prompt.arrow':
    'Una de les fletxes de la caixa (a la tapa, o a la placa de circuit de sota) apunta endavant. Quin costat mira cap al davant?',
  'mounting.placement.wide': 'Costat llarg davant',
  'mounting.placement.short': 'Costat curt davant',
  'mounting.facing.front': 'Apunta endavant',
  'mounting.facing.right': 'Apunta a la dreta',
  'mounting.facing.rear': 'Apunta enrere',
  'mounting.facing.left': 'Apunta a l’esquerra',
  'box.state.connected': 'Connectada',
  'box.state.lost': 'Contacte perdut',
  'box.state.password': 'Codi erroni',
  'box.password.label': 'Codi de la caixa',
  'box.password.retry': 'Reintenta',
  'box.password.checking': 'Provant el codi…',
  'box.password.invalid': 'El codi té quatre xifres.',
  'box.password.wrong': 'La caixa tampoc no ha acceptat aquest codi.',
  'box.password.noAnswer':
    'La caixa no ha respost. El codi s’ha desat i es provarà la pròxima vegada que la caixa es connecti.',
  'box.state.notConnected': 'No connectada',
  'box.state.battery': 'bateria {value}',
  'box.connect': 'Connecta',
  'box.step.position.upright.ok': 'Està dreta',
  'box.step.position.upright.bad': 'Ajaguda: posa-la dreta, encarada cap a qualsevol costat',
  'box.step.position.flat.ok': 'Està plana',
  'box.step.position.flat.bad': 'Massa inclinada: posa-la plana, amb la part de dalt amunt',
  'box.step.position.flat.upsideDown':
    'De cap per avall: gira-la amb la tapa amunt. El fabricant desaconsella muntar-la de cap per avall.',
  'box.step.position.waiting': 'Posició: esperant una lectura',
  'box.step.direction.todo': 'Tria la direcció',
  'box.step.direction.done': 'Direcció fixada',
  'box.step.direction.learn': 'No ho saps? Aprèn-la aixecant el davant',
  'box.step.zero.todo': 'Posa el vehicle a zero',
  'box.step.zero.done': 'Posat a zero',
  'box.step.zero.hint': 'Anivella el vehicle amb un nivell de bombolla i després posa’l a zero.',
  'box.forgetDirection': 'Oblida la direcció',
  'onboard.boxPosition.h': 'La posició de la caixa',
  'onboard.boxPosition.later':
    'La direcció i el zero es fixen el primer cop que aparques. La pàgina de la caixa et guia, i el llum ⚠ Zero t’ho recorda fins que estigui fet.',
  'onboard.boxPosition.notConnected':
    'Encara no hi ha cap caixa connectada, així que no se’n pot mostrar la posició. Toca {next} i connecta-la més tard amb la icona del sensor a dalt a la dreta.',
  'sensorList.title': 'Caixa sensora',
  'sensorList.phone': 'Quan no hi ha cap caixa connectada, s’utilitza el sensor del mateix mòbil.',
  'box.step.zero.again': 'Refés el zero',
};
