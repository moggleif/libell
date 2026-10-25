import type { Messages } from './en';

/** French. */
export const fr: Messages = {
  'topbar.install': 'Installer',
  'topbar.share': 'Partager Libell',
  'bottombar.settings': 'Réglages',
  'bottombar.sound.mute': 'Couper le son',
  'bottombar.sound.unmute': 'Activer le son',
  'bottombar.help': 'Aide',
  'bottombar.label': 'Actions',
  'share.text': 'Mettez votre camping-car ou votre caravane de niveau avec votre téléphone.',
  'share.copied': 'Lien copié !',
  'update.check': 'Rechercher une nouvelle version',
  'update.checking': 'Recherche de mises à jour…',
  'update.updating': 'Mise à jour vers la nouvelle version…',
  'update.latest': 'Vous avez la dernière version',
  'update.offline': 'Pas de connexion, impossible de rechercher des mises à jour',
  'update.unsupported': 'Les mises à jour ne sont pas disponibles ici',
  'install.hint': 'Touchez Partager, puis « Sur l’écran d’accueil ».',
  'install.row': 'Installez Libell comme appli sur l’écran d’accueil.',
  'install.close': 'Masquer',
  'share.vehicle.text': 'La configuration de mon véhicule pour Libell — mesures et rampes.',
  'settings.shareVehicle': 'Partager vers un autre téléphone',
  'setup.incoming.h': 'Configuration de véhicule reçue',
  'setup.incoming.intro': 'Un proche a partagé ces mesures de véhicule avec vous :',
  'setup.incoming.reminder':
    'Cela ne comprend aucun étalonnage — vous devrez tout de même étalonner sur ce téléphone.',
  'setup.incoming.apply': 'Remplacer le véhicule actuel',
  'setup.incoming.dismiss': 'Pas maintenant',
  'setup.incoming.invalid': 'Ce lien de configuration n’a pas pu être lu — rien n’a été modifié.',

  'lamp.setup': '⚠ Mesures',
  'lamp.setup.title':
    'Les mesures du véhicule n’ont jamais été enregistrées — touchez pour ouvrir les Réglages',
  'lamp.calibrate': '⚠ Étalonner',
  'lamp.zero': '⚠ Mettre à zéro',
  'lamp.calibrate.title':
    'Le téléphone n’est pas étalonné — touchez pour ouvrir « Étalonner et mettre à zéro »',
  'lamp.zero.title':
    'Le véhicule n’est pas mis à zéro — touchez pour ouvrir « Étalonner et mettre à zéro »',
  'lamp.calibrate.title.sensor': 'Le boîtier n’est pas mis à zéro — touchez pour ouvrir le boîtier',

  'sensorStatus.connected': 'Boîtier capteur connecté',
  'sensorStatus.disconnected': 'Boîtier capteur — contact perdu, touchez pour les détails',
  'sensorStatus.stale': 'Boîtier capteur — plus de nouvelles données, touchez pour les détails',
  'sensorStatus.idle': 'Boîtier capteur — touchez pour connecter',
  'sensorStatus.idle.guide': 'Boîtier capteur — touchez pour le guide iPhone',

  'menu.title': 'Menu',
  'menu.close': 'Fermer le menu',
  'menu.settings': 'Réglages',
  'menu.calibration': 'Étalonner et mettre à zéro',
  'menu.targets': 'Cibles',
  'menu.feedback': 'Commentaires',
  'menu.help': 'Aide',
  'menu.intro': 'Afficher l’introduction',
  'menu.about': 'À propos de Libell',
  'menu.about.tab': 'À propos',
  'menu.sensorSource': 'Boîtier capteur',

  'sensorSource.connect': 'Connecter le capteur {name}',
  'sensorSource.disconnect': 'Déconnecter',
  'sensorSource.status.connecting': 'Connexion…',
  'sensorSource.err.unsupported': 'Web Bluetooth n’est pas pris en charge par ce navigateur.',
  'sensorSource.unsupported.browser':
    'Pour connecter un boîtier capteur, ouvrez Libell dans Chrome ou Edge sur Android ou sur un ordinateur. Le capteur du téléphone fonctionne ici comme d’habitude.',
  'sensorSource.err.password':
    'Le boîtier {name} n’a pas accepté son mot de passe. Saisissez ci-dessous le code à quatre chiffres du boîtier et touchez Réessayer. Le code d’usine est 0000. Si vous ne connaissez pas le code, changez-le dans l’application Xparkle.',
  'sensorSource.err.failed': 'Impossible de se connecter au capteur {name}.',

  'sensorSource.ios.intro':
    'Safari ne peut pas se connecter directement aux capteurs Bluetooth, mais il existe une solution :',
  'sensorSource.ios.step1': 'Installez « Bluefy – Web Bluetooth Browser » depuis l’App Store.',
  'sensorSource.ios.step2': 'Ouvrez Bluefy et autorisez l’accès au Bluetooth.',
  'sensorSource.ios.step3': 'Dans Bluefy, ouvrez cette même adresse Libell.',
  'sensorSource.ios.step4': 'Rouvrez Boîtier capteur ici — cela fonctionne comme sur Android.',
  'sensorSource.ios.note':
    'Bluefy est une application tierce, pas développée par Libell — la reconnexion à ' +
    'l’ouverture peut y demander une touche manuelle au lieu de se faire toute seule.',
  'sensorSource.ios.bluefyLink': 'Trouver Bluefy dans l’App Store',

  'sensorSource.detail.temperature': 'Température : {value}',
  'sensorSource.detail.notAvailable': 'Pas encore disponible',
  'sensorSource.lowBattery':
    '⚠ Batterie faible ({value}) — pensez à remplacer bientôt la pile du boîtier.',

  'sensorSource.install.now': 'Mettre à zéro',
  'sensorSource.install.clear': 'Oublier le zéro',
  'sensorSource.install.status': 'Zéro : longitudinal {pitch}, latéral {roll}.',
  'sensorSource.install.status.none':
    'Pas encore mis à zéro — le boîtier mesure tel qu’il est posé.',

  'sensorSource.learn.h': 'Apprendre le montage',
  'sensorSource.learn.intro':
    'Libell apprend l’orientation à partir de deux levées : d’abord l’avant, puis le côté droit.',
  'sensorSource.learn.start': 'Apprendre le montage',
  'sensorSource.learn.step.front':
    'Soulevez l’avant du véhicule de quelques centimètres, puis appuyez sur le bouton.',
  'sensorSource.learn.capture.front': 'L’avant est soulevé',
  'sensorSource.learn.step.right':
    'Redescendez l’avant. Soulevez maintenant le côté droit de quelques centimètres, puis appuyez sur le bouton.',
  'sensorSource.learn.capture.right': 'Le côté droit est soulevé',
  'sensorSource.learn.cancel': 'Annuler',
  'sensorSource.learn.status.learned': 'Montage appris.',
  'sensorSource.learn.status.none':
    'Aucun montage appris — les directions du boîtier sont utilisées.',
  'sensorSource.learn.done':
    'Terminé ! Vérifiez : soulevez l’avant et Libell doit indiquer les roues arrière.',
  'sensorSource.learn.err.tooSmall':
    'Le véhicule a à peine bougé. Soulevez un peu plus et réessayez.',
  'sensorSource.learn.err.ambiguous':
    'Les deux directions ont bougé à peu près autant. Soulevez seulement l’avant, puis seulement le côté droit, et réessayez.',
  'sensorSource.learn.err.arrow':
    'Aucune flèche ne pointe vers l’avant. Tournez le boîtier pour qu’une de ses flèches pointe vers l’avant, puis réessayez.',
  'sensorSource.learn.err.mirrored':
    'Le boîtier semble à l’envers, ou le mauvais côté a été soulevé. Vérifiez, puis réessayez.',
  'sensorSource.learn.err.sameAxis':
    'Les deux levages ont incliné dans le même sens. Soulevez d’abord l’avant, puis le côté droit, et réessayez.',

  'sensorStatus.title': 'Capteur {name}',
  'sensorStatus.reading': 'Inclinaison actuelle : {value}',
  'sensorStatus.debug': 'Infos de débogage',
  'sensorStatus.debug.intro':
    'Valeurs brutes directement du boîtier — pour le dépannage si quelque chose ne fonctionne pas.',
  'sensorStatus.debug.state': 'État de la connexion : {value}',
  'sensorStatus.debug.deviceId': 'ID de l’appareil : {value}',
  'sensorStatus.debug.lastSample': 'Dernière mesure : {value}',
  'sensorStatus.debug.age': 'il y a {s} s',
  'sensorStatus.debug.rawAccel': 'Accéléromètre brut (x/y/z) : {value}',
  'sensorStatus.debug.firmwareTier': 'Niveau de micrologiciel : {value}',
  'sensorStatus.debug.rawStatusBytes': 'Octets d’état bruts : {value}',
  'sensorStatus.debug.versionBytes': 'Numéro de série et micrologiciel (bruts) : {value}',
  'sensorStatus.debug.copy': 'Copier les infos de débogage',
  'sensorStatus.debug.copied': 'Infos de débogage copiées !',
  'sensorStatus.debug.copy.failed': 'La copie automatique a échoué.',
  'sensorStatus.advanced': 'Avancé',
  'sensorStatus.silentReconnect.intro':
    'Ce navigateur ne sait pas encore se reconnecter seul au boîtier : après un redémarrage, vous le choisissez à nouveau dans la liste. Dans Chrome, vous pouvez l’activer vous-même.',
  'sensorStatus.silentReconnect.steps':
    'Ouvrez {address}, cherchez « web bluetooth », réglez « Use the new permissions backend for Web Bluetooth » sur Enabled et touchez Relaunch. Connectez ensuite le boîtier une fois.',
  'sensorStatus.silentReconnect.copy': 'Copier {address}',
  'sensorStatus.silentReconnect.copied': 'Copié — collez-le dans la barre d’adresse de Chrome.',
  'sensorStatus.debug.connectDelay.intro':
    'Expérimental : à essayer seulement si la connexion de votre boîtier est instable. ' +
    'Ajoute une pause fixe après la connexion, avant que l’application ne commence à lire.',
  'sensorStatus.debug.connectDelay.enable': 'Activer le délai de connexion',
  'sensorStatus.debug.connectDelay.ms': 'Délai (ms)',

  'about.text':
    'Libell vous aide à mettre de niveau votre camping-car ou votre caravane avec le ' +
    'téléphone que vous avez déjà, sans deviner.',
  'about.version': 'Version {v}',
  'about.offline':
    'Fonctionne entièrement hors ligne — le réseau ne sert qu’à télécharger les mises ' +
    'à jour de l’application elle-même.',
  'about.privacy':
    'Vos réglages restent sur votre téléphone — pas de compte et pas de suivi. Libell n’envoie que des comptages anonymes de l’utilisation de l’app, et vous pouvez les désactiver.',
  'about.source': 'Libell est gratuit et open source (licence MIT).',
  'about.source.link': 'Code source sur GitHub',
  'seo.title': 'Libell – camping-car ou caravane de niveau avec votre téléphone',
  'seo.description':
    'Une app gratuite qui indique quelles roues de votre camping-car ou caravane surélever, et sur quel palier de la rampe. Utilise votre téléphone ou un boîtier capteur, et fonctionne hors ligne.',
  'menu.privacy': 'Confidentialité',
  'menu.privacy.tab': 'Données',
  'privacy.stored.h': 'Enregistré sur ce téléphone',
  'privacy.stored.empty': 'Rien n’est enregistré.',
  'privacy.raw': 'Voir les données brutes',
  'privacy.raw.hint': 'Exactement comme enregistré. Le mot de passe du boîtier est masqué.',
  'privacy.resetSettings': 'Réinitialiser seulement les réglages',
  'privacy.deleteAll': 'Effacer toutes les données Libell',
  'privacy.deleteAll.confirm':
    'Effacer tout ce que Libell a enregistré sur ce téléphone ? Les véhicules, les mesures et l’étalonnage sont supprimés, et Libell redémarre comme la première fois.',
  'privacy.deleteAll.yes': 'Oui, tout effacer',
  'privacy.deleteAll.cancel': 'Annuler',
  'stored.vehicle': 'Véhicule',
  'stored.vehicle.detail': '{name}, empattement {wheelbase}',
  'stored.settings': 'Réglages',
  'stored.settings.detail': 'Mesures, rampes, unité, apparence et son',
  'stored.password': 'Mot de passe du boîtier capteur',
  'stored.language': 'Langue',
  'stored.phoneCalibration': 'Étalonnage du téléphone',
  'stored.zero': 'Zéro du véhicule',
  'stored.zeroTrim': 'Ajustement fin du zéro',
  'stored.targets': 'Cibles',
  'stored.targets.active': '{name} (choisie)',
  'stored.hitch': 'Hauteur d’attelage',
  'stored.rememberedBox': 'Boîtier capteur mémorisé',
  'stored.notes': 'Notes propres à l’app',
  'stored.notes.detail': '{n} petites marques, par exemple si l’introduction a été vue',
  'stored.phone': 'Le téléphone',
  'stored.saved': 'enregistré',
  'stored.counting.off': 'Désactivé',
  'stored.counting.on': 'Activé',
  'stored.savedOn': 'enregistré le {date}',

  'intro.h': 'Bienvenue dans Libell',
  'intro.how':
    'Posez le téléphone à plat dans le véhicule : Libell indique quelles roues surélever, et de combien.',
  'intro.start': 'Commencer',
  'intro.later': 'Explorer d’abord',
  'onboard.source.sensorIcon':
    'Un boîtier capteur se connecte à tout moment avec l’icône du capteur en haut à droite.',
  'counting.title': 'Comptage anonyme',
  'counting.intro':
    'Libell peut compter l’utilisation de façon anonyme, pour savoir quoi améliorer.',
  'counting.sent.h': 'Ce qui est compté',
  'counting.sent':
    'Que l’app a été ouverte, quelles fonctions sont utilisées, quel modèle de capteur mesure (le téléphone ou un modèle comme {boxes}), la version de l’app et la langue choisie dans Libell.',
  'counting.notSent.h': 'Ce qui n’est jamais enregistré',
  'counting.notSent':
    'Votre adresse IP, votre pays, appareil, écran, système d’exploitation ou navigateur, les mesures du véhicule, vos réglages, ni rien d’autre sur vous. Seul votre choix est enregistré sur le téléphone.',
  'counting.gpc':
    'Si votre navigateur demande aux sites de ne pas vous suivre, Libell ne compte rien.',
  'counting.later': 'Vous pouvez changer votre choix à tout moment dans {help} › {tab}.',
  'counting.toggle': 'Compter mon utilisation anonymement',
  'counting.dashboard': 'Voir les statistiques',
  'counting.ask': 'Voulez-vous aider à améliorer Libell ?',
  'counting.yes': 'Oui, compter anonymement',
  'counting.no': 'Non merci',
  'onboard.sound.h': 'Son',
  'onboard.source.h': 'Comment voulez-vous mesurer ?',
  'onboard.source.intro':
    'Choisissez le capteur dont Libell doit lire l’inclinaison — la plupart des gens ' +
    'utilisent simplement le téléphone.',
  'onboard.source.phone': 'Ce téléphone',
  'onboard.source.externalActive':
    'Un boîtier capteur est actif. Si vous choisissez ce téléphone, le guide saute l’étalonnage du téléphone. Pour étalonner le téléphone, ouvrez le boîtier avec l’icône du capteur en haut à droite et touchez d’abord « {disconnect} ».',
  'onboard.vehicle.h': 'Que mettez-vous de niveau ?',
  'onboard.vehicle.intro': 'Choisissez votre véhicule — la suite du guide s’y adapte.',
  'onboard.step1.h': 'Posez le téléphone comme ceci',
  'onboard.next': 'Suivant',
  'onboard.back': 'Retour',
  'onboard.close': 'Fermer l’introduction',
  'onboard.done': 'Terminé',
  'onboard.skipStep': 'Passer',
  'onboard.note.measurements':
    'Si vous passez, les mesures par défaut sont utilisées et {lamp} reste allumé jusqu’à ce que vous enregistriez les vôtres.',
  'onboard.note.ramps':
    'Si vous passez, les rampes par défaut sont utilisées. Vous pourrez choisir les vôtres plus tard dans les Réglages.',
  'onboard.note.calibrate':
    'Pas de surface plane pour l’instant ? Touchez « {next} » ; {lamp} vous le rappelle jusqu’à ce que ce soit fait.',
  'onboard.note.connect':
    'Pas de boîtier sous la main ? Touchez « {next} » et connectez-le plus tard avec l’icône du capteur en haut à droite.',
  'onboard.zeroLater':
    'Vous mettez le véhicule à zéro la première fois que vous vous garez sur un sol plat. {lamp} vous le rappelle jusqu’à ce que ce soit fait.',
  'onboard.legend.ok': 'Vert ✓ — cette roue est de niveau.',
  'onboard.legend.up': 'Orange ↑ — montez cette roue sur le palier indiqué.',
  'onboard.legend.no': 'Rouge ✕ — aucun palier ne suffit ; allez sur un endroit plus plat.',
  'onboard.legend.dim': 'Gris – — pas de rampe à cette roue ; le chiffre indique ce qui manque.',
  'settings.wheelbase': 'Empattement',
  'settings.trackFront': 'Voie avant',
  'settings.trackRear': 'Voie arrière',
  'settings.tolerance': 'Tolérance',
  'settings.stability': 'Stabilité',
  'settings.dwellRest': 'Délai de réponse (ms)',
  'settings.dwellMotion': 'Délai de réponse pendant le réglage (ms)',
  'settings.dwell.hint': 'Combien de temps une mesure doit tenir avant que le nombre change.',
  'settings.vehicle': 'Véhicule',
  'vehicle.motorhome': 'Camping-car',
  'vehicle.caravan': 'Caravane',
  'settings.axleToJockey': 'Essieu à la roue jockey',
  'settings.rearAxle': 'Essieu arrière',
  'settings.axle': 'Essieu',
  'axle.single': 'Simple',
  'axle.boggie': 'Tandem (double essieu)',
  'settings.track': 'Voie',
  'settings.measureHint':
    'Elles figurent sur la carte grise. Quelques cm d’écart ne changent rien.',
  'settings.measureHint.caravan':
    'Mesurez de l’essieu à la roue jockey. Quelques cm d’écart ne changent rien.',
  'settings.measureHint.boggie':
    'Avec un double essieu, mesurez jusqu’au centre de la paire d’essieux.',
  'settings.steps': 'Hauteurs des paliers de rampe',
  'settings.steps.add': 'Ajouter un palier',
  'settings.steps.new': 'Nouvelle hauteur de palier ({unit})',
  'settings.steps.remove': 'Supprimer {value}',
  'settings.ramp': 'Rampe toute faite',
  'settings.ramp.custom': 'Jeu personnalisé',
  'settings.ramp.stepless': 'Cale sans paliers',
  'settings.ramp.steplessModel': '{name} (sans paliers, max {max} mm)',
  'settings.stepless.max': 'Cale sans paliers, hauteur max',
  'settings.stepless.maxHeading': 'Hauteur max',
  'settings.stepless.set': 'Enregistrer',
  'settings.stepless.new': 'Hauteur max ({unit})',
  'settings.rampCount': 'Nombre de rampes',
  'settings.drain': 'Côté de l’évacuation',
  'settings.rampHint': 'L’application choisit où vos rampes sont le plus utiles.',
  'settings.drainHint': 'Dans la tolérance, ce côté reste le plus bas pour que l’eau s’écoule.',
  'settings.section.vehicle': 'Véhicule et mesures',
  'settings.section.ramps': 'Rampes',
  'settings.general': 'Général',
  'settings.language': 'Langue',
  'settings.language.auto': 'Automatique (langue de l’appareil)',
  'settings.tolerance.hint':
    'À quel point il faut être proche du niveau pour compter comme de niveau.',
  'settings.stability.hint':
    'Lisse les petites variations du capteur pour que les nombres ne clignotent pas.',
  'drain.none': 'Aucun / peu importe',
  'drain.left': 'Gauche, milieu',
  'drain.right': 'Droite, milieu',
  'drain.front': 'Avant, milieu',
  'drain.rear': 'Arrière, milieu',
  'drain.frontLeft': 'Avant gauche',
  'drain.frontRight': 'Avant droite',
  'drain.rearLeft': 'Arrière gauche',
  'drain.rearRight': 'Arrière droite',
  'settings.unit': 'Afficher les longueurs en',
  'settings.unitInches': 'pouces (in)',
  'settings.theme': 'Thème',
  'theme.system': 'Suivre le téléphone',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
  'settings.appearance': 'Apparence',
  'appearance.classic': 'Classique',
  'appearance.modern': 'Moderne',
  'appearance.glossy': 'Brillant',
  'settings.sound': 'Carillon quand c’est de niveau',
  'settings.soundGuidance': 'Guidage sonore continu',
  'settings.soundGuidance.help':
    'Le bip s’accélère et monte à mesure que vous approchez du niveau.',
  'settings.soundSpeech': 'Guidage vocal',
  'settings.soundSpeech.help':
    'Quand le véhicule est immobile, l’application dit quelle roue et de combien, par exemple « Arrière gauche, Palier 2 ».',
  'settings.soundSpeech.unavailable':
    'Le guidage vocal ne fonctionne pas sur ce téléphone : il n’a pas de voix française utilisable hors ligne. Les bips fonctionnent normalement.',
  'speech.level': 'À niveau',
  'speech.inches': '{n} pouces',
  'speech.inchOne': 'un pouce',
  'speech.inchOneAnd': 'un pouce et {fraction}',
  'speech.inchesAnd': '{n} pouces et {fraction}',
  'speech.inchFraction': '{fraction} de pouce',
  'speech.eighth1': 'un huitième',
  'speech.eighth2': 'un quart',
  'speech.eighth3': 'trois huitièmes',
  'speech.eighth4': 'un demi',
  'speech.eighth5': 'cinq huitièmes',
  'speech.eighth6': 'trois quarts',
  'speech.eighth7': 'sept huitièmes',
  'settings.undo': 'Annuler',
  'settings.saved': 'Enregistré',
  'settings.more': 'Plus',
  'settings.fineTuning': 'Réglage fin',
  'settings.resetAll': 'Réinitialiser tous les réglages',
  'settings.err.positive':
    'Saisissez un nombre supérieur à 0. La valeur précédente reste en vigueur.',
  'settings.err.notNegative': 'Saisissez 0 ou plus. La valeur précédente reste en vigueur.',
  'settings.err.range':
    'Saisissez un nombre de {min} à {max}. La valeur précédente reste en vigueur.',

  'settings.tab.vehicle': 'Véhicule',
  'settings.tab.ramps': 'Rampes',
  'settings.tab.level': 'Niveau',
  'settings.klossar.brandAll': 'Toutes',
  'settings.klossar.changeRamp': 'Changer de rampe',
  'settings.rampCountHint': 'L’application les place au mieux.',
  'settings.klossar.selected': 'Sélectionné',
  'settings.klossar.stepsHeading': 'Hauteurs des paliers',

  'status.measuring': 'Mesure…',
  'status.almost': 'Presque de niveau — il reste {left}',
  'status.cantLevel.close':
    'Vos rampes approchent mais ne suffisent pas ici — déplacez le véhicule',
  'status.cantLevel.far': 'Vos rampes sont loin du compte ici — déplacez le véhicule',
  'adjustable.before': 'Réglez les rampes sur le palier indiqué avant de monter dessus.',
  'adjustable.after':
    'Pas encore à niveau. Descendez des rampes et l’application mesure à nouveau.',

  'calibration.intro':
    'Posez le téléphone sur une surface dont vous savez qu’elle est de niveau, puis ' +
    'touchez Étalonner maintenant. L’inclinaison actuelle devient le point zéro.',
  'calibration.status': 'Étalonné : longitudinal {pitch}, latéral {roll}.',
  'calibration.status.none': 'Non étalonné — capteur brut utilisé.',
  'calibration.now': 'Étalonner maintenant',
  'calibration.step.phone.done': 'Téléphone étalonné',
  'calibration.step.phone.hint': 'Posez le téléphone sur une surface plane.',
  'calibration.step.flipLink': 'Pas de surface plane ? Retournez le téléphone',
  'calibration.step.vehicle.done': 'Mis à zéro',
  'calibration.step.vehicle.hint':
    'Mettez le véhicule de niveau avec un niveau à bulle et posez le téléphone à sa place habituelle.',
  'calibration.step.vehicle.now': 'Mettre à zéro',
  'calibration.clear': 'Effacer l’étalonnage',
  'calibration.err.notRunning':
    'Le capteur d’inclinaison n’est pas encore actif — touchez d’abord Démarrer sur ' +
    'l’écran principal.',
  'calibration.warn.notFlat':
    'Étalonnage enregistré, mais cela ne semble pas plat (plus de 15°), il est donc probablement faux. Ce n’était pas voulu ? Touchez Annuler, posez le téléphone sur une surface plane et étalonnez à nouveau.',
  'calibration.undo': 'Annuler',
  'calibration.sensor.h': 'Étalonner le téléphone',
  'calibration.vehicle.h': 'Mettre le véhicule à zéro',
  'calibration.vehicle.intro':
    'L’étalonnage concerne le téléphone, pas l’endroit où il repose. Si la table penche un peu, l’application affiche cette inclinaison. Mettez le véhicule de niveau une fois avec un niveau à bulle, posez le téléphone à sa place habituelle et mettez à zéro.',
  'calibration.vehicle.now': 'Mettre à zéro',
  'calibration.vehicle.clear': 'Oublier le zéro',
  'calibration.vehicle.status': 'Zéro du véhicule : longitudinal {pitch}, latéral {roll}.',
  'calibration.vehicle.status.none':
    'Aucun zéro du véhicule — l’emplacement du téléphone compte comme plat.',
  'calibration.vehicle.warn.notFlat':
    'Zéro enregistré, mais cela ne semble pas de niveau (plus de 15°). Le véhicule n’était pas de niveau ? Touchez Annuler, mettez le véhicule de niveau et remettez à zéro.',
  'calibration.age.today': '(aujourd’hui)',
  'calibration.age.days': '(il y a {n} jours)',
  'calibration.check': 'Vérifier',
  'calibration.check.good': 'Toujours bon — écart de {off}°.',
  'calibration.check.off': 'Écart de {off}° — pensez à réétalonner.',
  'calibration.vehicle.check.off': 'Écart de {off}° — pensez à refaire le zéro.',
  'calibration.check.none':
    'Pas encore étalonné, il n’y a donc rien à vérifier. Posez le téléphone sur une surface plane et touchez « {now} ».',
  'calibration.vehicle.check.none':
    'Pas encore de zéro, il n’y a donc rien à vérifier. Mettez le véhicule de niveau avec un niveau à bulle et touchez « {now} ».',
  'calibration.flip.intro':
    'Pas de surface de niveau à proximité ? Utilisez l’étalonnage par retournement : posez ' +
    'le téléphone n’importe où d’assez plat, capturez, faites-lui faire un demi-tour (180°) ' +
    'au même endroit, capturez à nouveau — l’inclinaison de la surface s’annule d’elle-même.',
  'calibration.flip.start': 'Étalonner par retournement',
  'calibration.flip.rotate':
    'Faites maintenant tourner le téléphone d’un demi-tour (180°) au même endroit, puis touchez Capturer.',
  'calibration.flip.capture': 'Capturer',
  'calibration.flip.done': 'Terminé ! Votre surface penche de {surface}° — compensé.',
  'calibration.flip.warn.moved':
    'Étalonnage enregistré, mais les deux captures diffèrent de plus de 15°. Le téléphone a-t-il bougé ? Touchez Annuler et recommencez.',
  'calibration.pill.notDone': 'NON FAIT',
  'calibration.pill.done': 'FAIT',
  'calibration.pill.none': 'AUCUN',

  'targets.normal': 'Normal (de niveau)',
  'targets.name.placeholder': 'Nom (par ex. « Évacuation douche »)',
  'targets.name.label': 'Nom de la nouvelle cible',
  'targets.defaultName': 'Cible {n}',
  'targets.add': 'Enregistrer l’inclinaison actuelle comme nouvelle cible',
  'targets.delete': 'Supprimer {name}',
  'targets.warn.tooSteep':
    'Cible enregistrée, mais elle est plus raide qu’une cible habituelle (plus de 15°). Ce n’était pas voulu ? Supprimez-la avec la croix et enregistrez à nouveau.',
  'targets.badge': 'Cible : {name}',

  'feedback.intro':
    'Un problème ou une idée ? Remplissez ceci et touchez le bouton — cela ouvre un ' +
    'rapport prêt à l’emploi sur GitHub où vous le publiez (un compte GitHub gratuit est ' +
    'nécessaire, créé en une minute).',
  'feedback.category': 'De quoi s’agit-il ?',
  'feedback.cat.bug': 'Bogue',
  'feedback.cat.suggestion': 'Suggestion',
  'feedback.cat.other': 'Autre',
  'feedback.title': 'Titre court',
  'feedback.desc': 'Que s’est-il passé, ou que souhaitez-vous ?',
  'feedback.submit': 'Ouvrir le rapport sur GitHub',
  'feedback.warn.title': 'Le titre est vide — vous pouvez tout de même envoyer le rapport.',
  'feedback.warn.desc': 'La description est vide — vous pouvez tout de même envoyer le rapport.',
  'feedback.warn.both':
    'Le titre et la description sont vides — vous pouvez tout de même envoyer le rapport.',

  'help.screen.h': 'Lire l’écran',
  'help.screen.lead':
    'L’écran montre quelles roues lever et de combien. Palier 2 désigne le deuxième palier de votre rampe.',
  'help.screen.t':
    'Vert ✓ : c’est fait, rien à faire.\n' +
    'Orange ↑ : montez cette roue sur le palier indiqué à côté.\n' +
    'Rouge ✕ : vos rampes ne suffisent pas ici. Déplacez le véhicule.\n' +
    'Gris – : pas de rampe à cette roue. Le chiffre indique ce qui manque, si vous voulez glisser autre chose dessous.\n' +
    'Quand la bulle repose au milieu, vous êtes de niveau.',
  'help.screen.routine':
    'Montez, attendez que le véhicule ne bouge plus et regardez de nouveau. Recommencez jusqu’à ce que toutes les roues soient vertes.',
  'help.what.t':
    'Posez le téléphone à plat dans le véhicule, le haut vers l’avant, toujours au même endroit.\n' +
    'Avec un boîtier capteur, la position du téléphone n’a pas d’importance.',
  'help.settings.h': 'Les mesures',
  'help.measures.h': 'Saisir les mesures',
  'help.settings.t':
    'Libell calcule de combien lever chaque roue à partir de l’empattement et de la voie.\n' +
    'Ils figurent sur les papiers du véhicule, sinon prenez un mètre ruban.\n' +
    'Saisissez-les en mm, cm ou pouces, selon votre choix dans Afficher les longueurs en.\n' +
    'Sur une caravane, l’empattement est la distance entre l’essieu et la roue jockey.\n' +
    'Avec plusieurs véhicules, chacun garde ses mesures, rampes, zéro, cibles et boîtier capteur ; choisissez-le en haut de Véhicule.',
  'help.ramps.t':
    'L’écran indique sur quel palier de votre rampe monter chaque roue : saisissez donc les rampes que vous emportez.\n' +
    'Choisissez une rampe toute faite ou un jeu personnalisé, et combien vous en avez. Libell les place là où elles servent le plus.\n' +
    'Pour une cale sans paliers, choisissez Cale sans paliers et saisissez sa hauteur. L’écran indique alors de combien monter.',
  'help.calibration.h': 'Étalonner et mettre à zéro',
  'help.calibration.t':
    'Deux étapes rendent la mesure juste : étalonner le téléphone une fois et mettre le véhicule à zéro une fois.\n' +
    'Étalonner : posez le téléphone sur une surface plane et touchez Étalonner maintenant.\n' +
    'Mettre à zéro : mettez le véhicule de niveau avec un niveau à bulle, posez le téléphone à sa place habituelle et touchez Mettre à zéro.\n' +
    'Avec un boîtier capteur, la mise à zéro se fait sur la page du boîtier. Il n’a pas besoin d’étalonnage.\n' +
    'Toujours pas tout à fait de niveau ? Affinez le zéro avec Gauche, Droite, Avant ou Arrière plus haut, sous la mise à zéro.\n' +
    'Le voyant ⚠ Étalonner ou ⚠ Mettre à zéro reste allumé tant que ce n’est pas fait.',
  'help.sensor.h': 'Boîtier capteur',
  'help.sensor.t':
    'Un boîtier capteur dans le véhicule peut mesurer à la place du téléphone. Libell fonctionne avec ceux-ci :\n' +
    '{upright} : posé debout, dans n’importe quel sens.\n' +
    '{flat} : posé à plat, couvercle en haut, une flèche vers l’avant.\n' +
    'Connectez-le avec l’icône du capteur en haut à droite. La page du boîtier vous guide ensuite pour Choisir l’orientation et Mettre le véhicule à zéro.\n' +
    'Cela fonctionne dans Chrome ou Edge sur Android ou un ordinateur. Sur iPhone, il faut le navigateur Bluefy.\n' +
    'Si le boîtier refuse le code, Libell demande le code à quatre chiffres du boîtier.',
  'help.targets.h': 'Cibles et son',
  'help.targets.t':
    'Enregistrez une inclinaison voulue, par exemple vers l’évacuation de la douche, et passez de l’une à l’autre.\n' +
    'Caravane : enregistrez la hauteur d’attelage avant de dételer, et « Revenir à la hauteur d’attelage » y ramène la roue jockey.\n' +
    'Avec le guidage vocal, l’application dit quelle roue lever et de combien, pour niveler sans voir le téléphone.\n' +
    'Le bouton au milieu de la barre du bas active et coupe le son.',
  'help.trouble.h': 'En cas de souci',
  'help.trouble.t':
    '« Mesure… » : le véhicule bouge. Attendez qu’il soit immobile.\n' +
    '« Posez le téléphone à plat pour mesurer » : le téléphone est trop incliné pour mesurer.\n' +
    '« Contact perdu avec le boîtier » : touchez Reconnecter et choisissez le boîtier dans la liste.\n' +
    '« En attente du capteur d’inclinaison… » : pas encore de mesure. Sur iPhone, touchez Démarrer à chaque ouverture de l’application, sinon rechargez.\n' +
    '« L’accès aux mouvements a été refusé » : autorisez mouvement et orientation pour ce site dans les réglages du navigateur, puis rechargez.\n' +
    'Toujours un souci ? Écrivez un rapport sous Commentaires.',
  'help.open': 'Ouvrir {name}',
  'help.open.sensor': 'Ouvrir le boîtier capteur',
  'help.open.feedback': 'Écrire un rapport',

  'main.hint': 'Posez votre téléphone à plat dans le véhicule, le bord supérieur vers l’avant.',
  'main.start': 'Démarrer',
  'main.waiting': 'En attente du capteur d’inclinaison…',
  'main.level': 'Votre véhicule est de niveau !',
  'main.denied':
    'L’accès aux mouvements a été refusé, Libell ne peut donc pas lire l’inclinaison. ' +
    'Autorisez l’accès au mouvement et à l’orientation pour ce site, puis rechargez.',
  'main.noSensors':
    'Cet appareil n’expose pas de capteurs de mouvement, Libell ne peut donc pas lire l’inclinaison.',
  'main.https':
    'Libell a besoin d’une connexion sécurisée (HTTPS) pour lire les capteurs ' +
    'd’inclinaison. Ouvrez l’application en HTTPS et réessayez.',

  'diagram.aria': 'Vue de dessus de votre camping-car montrant les roues à surélever',
  'diagram.caravan.aria':
    'Vue de dessus de votre caravane montrant les roues d’essieu et la roue jockey',
  'diagram.front': 'Avant',
  'diagram.step': 'Palier {n}',
  'diagram.driveUp': 'Monter',
  'diagram.done': 'Terminé',
  'diagram.noRamp': 'Aucune rampe',
  'diagram.wheel.frontLeft': 'Avant gauche',
  'diagram.wheel.frontRight': 'Avant droite',
  'diagram.wheel.rearLeft': 'Arrière gauche',
  'diagram.wheel.rearRight': 'Arrière droite',
  'diagram.notEnough': 'insuffisant',
  'diagram.speech.wheel': '{wheel} : {instruction}',
  'caravan.crankUp': 'Monter à la manivelle',
  'caravan.crankDown': 'Descendre à la manivelle',
  'caravan.axleLeft': 'Roue d’essieu gauche',
  'caravan.axleRight': 'Roue d’essieu droite',
  'caravan.jockeyWheel': 'Roue jockey',
  'help.screen.caravan':
    'Caravane : la roue jockey indique Monter ou Descendre à la manivelle, et de combien.',

  'vehicles.title': 'Véhicules',
  'vehicles.defaultName': 'Mon véhicule',
  'vehicles.numbered': 'Véhicule {n}',
  'vehicles.name.placeholder': 'Nom (par ex. « Caravane »)',
  'vehicles.name.label': 'Nom du véhicule',
  'vehicles.add': 'Nouveau véhicule',
  // The name field shown only when a name is needed (#613).
  'namePrompt.save': 'Enregistrer',
  'namePrompt.cancel': 'Annuler',
  // Tapping the chosen target or vehicle again edits its name (#613).
  'choice.rename': 'Renommer {name}',
  // The active vehicle on the main screen while there are several (#616).
  'vehicles.badge': 'Véhicule : {name}',
  'vehicles.delete': 'Supprimer {name}',
  'vehicles.remove.confirm': 'Supprimer {name} avec son zéro, ses cibles et son boîtier capteur ?',
  'vehicles.remove.yes': 'Oui, supprimer',
  'vehicles.hint':
    'Les mesures, les rampes, le zéro, les cibles et le boîtier capteur appartiennent au véhicule. L’étalonnage du téléphone est partagé.',
  'setup.incoming.addNew': 'Ajouter comme nouveau véhicule',

  'hitch.title': 'Hauteur d’attelage',
  'hitch.hint':
    'Enregistrez-la tant que la caravane est encore sur la boule. Avant de la ré-atteler, la roue jockey indique de combien tourner la manivelle pour que le coupleur retrouve la boule.',
  'hitch.save': 'Enregistrer la hauteur d’attelage',
  'hitch.go': 'Revenir à la hauteur d’attelage',
  'hitch.done': 'Terminé',
  'hitch.savedNow': 'Hauteur d’attelage enregistrée.',
  'hitch.status.none': 'Aucune hauteur d’attelage enregistrée.',
  'hitch.status.saved': 'Une hauteur d’attelage est enregistrée.',
  'hitch.status.active':
    'L’écran principal indique de combien tourner la manivelle de la roue jockey.',
  'hitch.badge': 'Hauteur d’attelage',
  'hitch.badge.aria': 'Hauteur d’attelage : touchez pour niveler comme d’habitude',
  'hitch.crank.up': 'Monter de {amount} à la manivelle jusqu’à la hauteur d’attelage',
  'hitch.crank.down': 'Descendre de {amount} à la manivelle jusqu’à la hauteur d’attelage',
  'hitch.reached': 'À la hauteur d’attelage',
  'hitch.offer': 'Enregistrer d’abord la hauteur d’attelage ?',
  'hitch.offer.save': 'Enregistrer',
  'hitch.offer.dismiss': 'Pas maintenant',

  'zeroTrim.title': 'Affiner le zéro',
  'zeroTrim.hint':
    'Toujours pas tout à fait de niveau ? Chaque appui déplace le zéro de 0,1°, pour que l’application veuille ce côté plus haut.',
  'zeroTrim.left': 'Gauche plus haut',
  'zeroTrim.right': 'Droite plus haut',
  'zeroTrim.front': 'Avant plus haut',
  'zeroTrim.back': 'Arrière plus haut',
  'zeroTrim.side.left': 'Gauche',
  'zeroTrim.side.right': 'Droite',
  'zeroTrim.side.front': 'Avant',
  'zeroTrim.side.back': 'Arrière',
  'zeroTrim.total': 'Affiné : {trim}',
  'zeroTrim.none': 'Non affiné',
  'zeroTrim.reset': 'Annuler l’affinage',
  'tilt.frontBack': 'Longitudinal',
  'tilt.sideSide': 'Latéral',

  'pose.layFlat': 'Posez le téléphone à plat pour mesurer',
  'pose.sensorHint': 'Il ne mesure correctement qu’à plat, face vers le haut.',
  'pose.openSensorPage': 'Voir le boîtier',
  'pose.sensorExtreme': 'Le boîtier est trop incliné',
  'pose.sensorUpsideDown': 'Le boîtier semble à l’envers',
  'pose.sensorNotUpright': 'Le boîtier est couché',
  'pose.sensorHintUpright': 'Il ne mesure correctement que debout.',
  'calibration.external.h': 'Mettre le véhicule à zéro',
  'calibration.external.intro':
    'Mettez le véhicule de niveau une fois avec un niveau à bulle, puis mettez à zéro.',
  'calibration.external.phoneHidden':
    'L’étalonnage du téléphone est masqué tant que le boîtier capteur mesure. Pour étalonner le téléphone, ouvrez le boîtier et touchez d’abord « {disconnect} ».',
  'calibration.external.working': 'Mise à zéro…',
  'calibration.external.done':
    '{name} est mis à zéro : cette position compte désormais comme le niveau.',
  'calibration.external.err.notConnected': '{name} n’est pas connecté. Connectez-le et réessayez.',
  'calibration.external.err.failed':
    'Impossible de mettre {name} à zéro. Rien n’a été modifié. Vérifiez la connexion et réessayez.',
  'pose.portrait':
    'Tournez le téléphone à la verticale (portrait) — le bord supérieur doit pointer vers l’avant',

  'stale.dataUnavailable':
    'Aucune nouvelle donnée du capteur — le guidage est en pause jusqu’à son retour',

  'sensorFallback.lost': 'Contact perdu avec le boîtier',
  'sensorFallback.autoRetry': 'Nouvelle tentative automatique…',
  'sensorFallback.connect': 'Connectez le boîtier',
  'sensorFallback.pick': 'Touchez puis choisissez votre boîtier dans la liste.',
  'sensorFallback.notFound': 'Aucun boîtier trouvé ? Vérifiez qu’il est allumé et à proximité.',
  'sensorFallback.retry': 'Reconnecter',
  'sensorFallback.usePhone': 'Utiliser plutôt le téléphone',
  'mounting.prompt.upright':
    'Touchez le côté vers lequel pointe l’arrière du boîtier (la fixation à vis).',
  'mounting.prompt.arrow':
    'Une des flèches du boîtier (sur le couvercle ou le circuit dessous) pointe vers l’avant. Quel côté est tourné vers l’avant ?',
  'mounting.placement.wide': 'Côté large vers l’avant',
  'mounting.placement.short': 'Côté étroit vers l’avant',
  'mounting.facing.front': 'Vers l’avant',
  'mounting.facing.right': 'Vers la droite',
  'mounting.facing.rear': 'Vers l’arrière',
  'mounting.facing.left': 'Vers la gauche',
  'box.state.connected': 'Connecté',
  'box.state.lost': 'Contact perdu',
  'box.state.password': 'Mot de passe incorrect',
  'box.password.label': 'Code du boîtier',
  'box.password.retry': 'Réessayer',
  'box.password.checking': 'Essai du code…',
  'box.password.invalid': 'Le code comporte quatre chiffres.',
  'box.password.wrong': 'Le boîtier n’a pas accepté ce code non plus.',
  'box.password.noAnswer':
    'Le boîtier n’a pas répondu. Le code est enregistré et sera essayé à la prochaine connexion du boîtier.',
  'box.state.notConnected': 'Non connecté',
  'box.state.battery': 'batterie {value}',
  'box.connect': 'Connecter',
  'box.step.position.upright.ok': 'Debout',
  'box.step.position.upright.bad': 'Couché : mettez-le debout, dans n’importe quel sens',
  'box.step.position.flat.ok': 'À plat',
  'box.step.position.flat.bad': 'Trop incliné : posez-le à plat, face vers le haut',
  'box.step.position.flat.upsideDown':
    'À l’envers : retournez-le, couvercle vers le haut. Le fabricant déconseille de le monter à l’envers.',
  'box.step.position.waiting': 'Position : en attente d’une mesure',
  'box.step.direction.todo': 'Choisir l’orientation',
  'box.step.direction.done': 'Orientation choisie',
  'box.step.direction.learn': 'Pas sûr ? Apprenez-la en levant l’avant',
  'box.step.zero.todo': 'Mettre le véhicule à zéro',
  'box.step.zero.done': 'Mis à zéro',
  'box.step.zero.hint': 'Mettez le véhicule de niveau avec un niveau à bulle, puis mettez à zéro.',
  'box.forgetDirection': 'Oublier l’orientation',
  'onboard.boxPosition.h': 'Position du boîtier',
  'onboard.boxPosition.later':
    'La direction et le zéro se règlent la première fois que vous vous garez. La page du boîtier vous guide, et le voyant ⚠ Mettre à zéro vous le rappelle jusque-là.',
  'onboard.boxPosition.notConnected':
    'Aucun boîtier n’est encore connecté, sa position ne peut donc pas être affichée. Touchez « {next} » et connectez-le plus tard avec l’icône du capteur en haut à droite.',
  'sensorList.title': 'Boîtier capteur',
  'sensorList.phone': 'Le capteur du téléphone est utilisé quand aucun boîtier n’est connecté.',
  'box.step.zero.again': 'Remettre à zéro',
};
