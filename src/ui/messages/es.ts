import type { Messages } from './en';

/** Spanish. */
export const es: Messages = {
  'topbar.install': 'Instalar',
  'topbar.share': 'Compartir Libell',
  'bottombar.settings': 'Ajustes',
  'bottombar.sound.mute': 'Silenciar el sonido',
  'bottombar.sound.unmute': 'Activar el sonido',
  'bottombar.help': 'Ayuda',
  'share.text': 'Nivela tu autocaravana o caravana con el móvil.',
  'share.copied': '¡Enlace copiado!',
  'update.check': 'Buscar una versión nueva',
  'update.checking': 'Buscando actualizaciones…',
  'update.updating': 'Actualizando a la nueva versión…',
  'update.latest': 'Tienes la última versión',
  'update.offline': 'Sin conexión, no se pueden buscar actualizaciones',
  'update.unsupported': 'Las actualizaciones no están disponibles aquí',
  'install.hint': 'Toca Compartir y luego «Añadir a pantalla de inicio».',
  'share.vehicle.text': 'La configuración de mi vehículo para Libell: medidas y rampas.',
  'settings.shareVehicle': 'Compartir con otro teléfono',
  'setup.incoming.h': 'Configuración de vehículo recibida',
  'setup.incoming.intro': 'Alguien de tu familia ha compartido contigo estas medidas del vehículo:',
  'setup.incoming.reminder':
    'Esto no incluye ninguna calibración: tendrás que calibrar igualmente en este móvil.',
  'setup.incoming.apply': 'Usar estos valores',
  'setup.incoming.dismiss': 'Ahora no',
  'setup.incoming.invalid':
    'No se ha podido leer ese enlace de configuración: no se ha cambiado nada.',

  'lamp.setup': '⚠ Medidas',
  'lamp.setup.title': 'Las medidas del vehículo nunca se han guardado: toca para abrir Ajustes',
  'lamp.calibrate': '⚠ Calibrar',
  'lamp.zero': '⚠ Poner a cero',
  'lamp.calibrate.title': 'El móvil no está calibrado: toca para abrir «Calibrar y poner a cero»',
  'lamp.zero.title': 'El vehículo no está puesto a cero: toca para abrir «Calibrar y poner a cero»',
  'lamp.calibrate.title.sensor': 'La caja no está puesta a cero: toca para abrir la caja',

  'sensorStatus.connected': 'Caja sensora conectada',
  'sensorStatus.disconnected': 'Caja sensora: se perdió el contacto, toca para ver los detalles',
  'sensorStatus.stale': 'Caja sensora: no llegan datos nuevos, toca para ver los detalles',
  'sensorStatus.idle': 'Caja sensora: toca para conectar',
  'sensorStatus.idle.guide': 'Caja sensora: toca para ver la guía de iPhone',

  'menu.title': 'Menú',
  'menu.close': 'Cerrar el menú',
  'menu.settings': 'Ajustes',
  'menu.calibration': 'Calibrar y poner a cero',
  'menu.targets': 'Objetivos',
  'menu.feedback': 'Comentarios',
  'menu.help': 'Ayuda',
  'menu.intro': 'Mostrar la introducción',
  'menu.about': 'Acerca de Libell',
  'menu.about.tab': 'Acerca de',
  'menu.sensorSource': 'Caja sensora',

  'sensorSource.connect': 'Conectar el sensor {name}',
  'sensorSource.disconnect': 'Desconectar',
  'sensorSource.status.connecting': 'Conectando…',
  'sensorSource.err.unsupported': 'Este navegador no admite Web Bluetooth.',
  'sensorSource.unsupported.browser':
    'Para conectar una caja sensora, abre Libell en Chrome o Edge en Android o en un ordenador. El sensor del móvil funciona aquí como siempre.',
  'sensorSource.err.password':
    'La caja {name} no ha aceptado su contraseña. Escribe abajo el código de cuatro cifras de la caja y toca Reintentar. El código de fábrica es 0000. Si no sabes el código, cámbialo en la aplicación Xparkle.',
  'sensorSource.err.failed': 'No se ha podido conectar con el sensor {name}.',

  'sensorSource.ios.intro':
    'Safari no puede conectarse directamente a sensores Bluetooth, pero hay una solución:',
  'sensorSource.ios.step1': 'Instala «Bluefy – Web Bluetooth Browser» desde la App Store.',
  'sensorSource.ios.step2': 'Abre Bluefy y concede el permiso de Bluetooth.',
  'sensorSource.ios.step3': 'En Bluefy, ve a esta misma dirección de Libell.',
  'sensorSource.ios.step4': 'Vuelve a abrir Caja sensora aquí: funciona igual que en Android.',
  'sensorSource.ios.note':
    'Bluefy es una aplicación de terceros, no creada por Libell: puede que reconectar al ' +
    'abrir la app requiera un toque manual allí en lugar de hacerse solo.',
  'sensorSource.ios.bluefyLink': 'Buscar Bluefy en la App Store',

  'sensorSource.detail.temperature': 'Temperatura: {value}',
  'sensorSource.detail.notAvailable': 'Aún no disponible',
  'sensorSource.lowBattery':
    '⚠ Batería baja ({value}): conviene cambiar pronto la pila de la caja del sensor.',

  'sensorSource.install.now': 'Poner a cero',
  'sensorSource.install.clear': 'Olvidar el cero',
  'sensorSource.install.status': 'Cero: delante/detrás {pitch}, lado/lado {roll}.',
  'sensorSource.install.status.none': 'Aún sin poner a cero: la caja mide tal como está montada.',

  'sensorSource.learn.h': 'Aprender el montaje',
  'sensorSource.learn.intro':
    'Libell aprende la orientación con dos elevaciones: primero la parte delantera y luego el lado derecho.',
  'sensorSource.learn.start': 'Aprender el montaje',
  'sensorSource.learn.step.front':
    'Levanta la parte delantera del vehículo unos centímetros y pulsa el botón.',
  'sensorSource.learn.capture.front': 'La parte delantera está levantada',
  'sensorSource.learn.step.right':
    'Baja otra vez la parte delantera. Ahora levanta el lado derecho unos centímetros y pulsa el botón.',
  'sensorSource.learn.capture.right': 'El lado derecho está levantado',
  'sensorSource.learn.cancel': 'Cancelar',
  'sensorSource.learn.status.learned': 'Montaje aprendido.',
  'sensorSource.learn.status.none':
    'Ningún montaje aprendido: se usan las direcciones propias de la caja.',
  'sensorSource.learn.done':
    '¡Listo! Compruébalo: levanta la parte delantera y Libell debería señalar las ruedas traseras.',
  'sensorSource.learn.err.tooSmall':
    'El vehículo apenas se movió. Levántalo un poco más e inténtalo de nuevo.',
  'sensorSource.learn.err.ambiguous':
    'Las dos direcciones se movieron casi lo mismo. Levanta solo la parte delantera, luego solo el lado derecho, e inténtalo de nuevo.',
  'sensorSource.learn.err.arrow':
    'Ninguna flecha apunta hacia delante. Gira la caja para que una de sus flechas apunte hacia delante e inténtalo de nuevo.',
  'sensorSource.learn.err.mirrored':
    'La caja parece estar al revés, o se levantó el lado equivocado. Compruébalo e inténtalo de nuevo.',
  'sensorSource.learn.err.sameAxis':
    'Los dos levantamientos inclinaron hacia el mismo lado. Levanta primero la parte delantera y luego el lado derecho, e inténtalo de nuevo.',

  'sensorStatus.title': 'Sensor {name}',
  'sensorStatus.reading': 'Inclinación ahora: {value}',
  'sensorStatus.debug': 'Información de depuración',
  'sensorStatus.debug.intro':
    'Valores en bruto directamente de la caja: para resolver problemas si algo no funciona.',
  'sensorStatus.debug.state': 'Estado de la conexión: {value}',
  'sensorStatus.debug.deviceId': 'ID del dispositivo: {value}',
  'sensorStatus.debug.lastSample': 'Última muestra: {value}',
  'sensorStatus.debug.age': 'hace {s} s',
  'sensorStatus.debug.rawAccel': 'Acelerómetro en bruto (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Nivel de firmware: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Bytes de estado en bruto: {value}',
  'sensorStatus.debug.copy': 'Copiar la información de depuración',
  'sensorStatus.debug.copied': '¡Información de depuración copiada!',
  'sensorStatus.debug.copy.failed': 'No se ha podido copiar automáticamente.',
  'sensorStatus.advanced': 'Avanzado',
  'sensorStatus.silentReconnect.intro':
    'Este navegador aún no puede volver a conectarse a la caja por sí solo, así que tras un reinicio la eliges de nuevo en la lista. En Chrome puedes activarlo tú mismo.',
  'sensorStatus.silentReconnect.steps':
    'Abre {address}, busca «web bluetooth», pon «Use the new permissions backend for Web Bluetooth» en Enabled y toca Relaunch. Después conecta la caja una vez.',
  'sensorStatus.silentReconnect.copy': 'Copiar {address}',
  'sensorStatus.silentReconnect.copied': 'Copiado: pégalo en la barra de direcciones de Chrome.',
  'sensorStatus.debug.connectDelay.intro':
    'Experimental: pruébalo solo si la conexión de tu caja es inestable. Añade una pausa ' +
    'fija después de conectar, antes de que la app empiece a leer.',
  'sensorStatus.debug.connectDelay.enable': 'Activar la pausa de conexión',
  'sensorStatus.debug.connectDelay.ms': 'Pausa (ms)',

  'about.text':
    'Libell te ayuda a nivelar tu autocaravana o caravana con el móvil que ya tienes, ' +
    'sin adivinar.',
  'about.version': 'Versión {v}',
  'about.offline':
    'Funciona totalmente sin conexión: la red solo se usa para descargar actualizaciones ' +
    'de la propia app.',
  'about.privacy':
    'Todo se queda en tu móvil: sin cuenta, sin seguimiento y sin que ningún dato salga ' +
    'del dispositivo.',
  'about.source': 'Libell es gratuita y de código abierto (licencia MIT).',
  'about.source.link': 'Código fuente en GitHub',

  'onboard.welcome.h': 'Te damos la bienvenida a Libell',
  'onboard.welcome.t':
    'Esta guía rápida configura tu vehículo y tu móvil. Puedes saltarte cualquier paso y ' +
    'terminarlo más tarde desde Ajustes.',
  'onboard.welcome.sensor':
    'Puedes conectar una caja sensora cuando quieras con el icono del sensor arriba a la derecha.',
  'onboard.sound.h': 'Sonido',
  'onboard.source.h': '¿Cómo quieres medir?',
  'onboard.source.intro':
    'Elige de qué sensor debe leer Libell la inclinación: la mayoría simplemente usa el móvil.',
  'onboard.source.phone': 'Este móvil',
  'onboard.source.externalActive':
    'Hay una caja sensora activa. Si eliges este móvil, la guía omite la calibración del móvil. Para calibrarlo, abre la caja con el icono del sensor arriba a la derecha y toca primero «{disconnect}».',
  'onboard.vehicle.h': '¿Qué vas a nivelar?',
  'onboard.vehicle.intro': 'Elige tu vehículo: el resto de la guía se adapta a él.',
  'onboard.step1.h': 'Coloca el móvil así',
  'onboard.next': 'Siguiente',
  'onboard.back': 'Atrás',
  'onboard.close': 'Cerrar la introducción',
  'onboard.done': 'Listo',
  'onboard.skipStep': 'Saltar',
  'onboard.note.measurements':
    'Si lo saltas, se usan las medidas predeterminadas y {lamp} sigue encendido hasta que guardes las tuyas.',
  'onboard.note.ramps':
    'Si lo saltas, se usan las rampas predeterminadas. Puedes elegir las tuyas más tarde en Ajustes.',
  'onboard.note.calibrate':
    '¿No tienes una superficie plana ahora? Toca «{next}»; {lamp} te lo recordará hasta que esté hecho.',
  'onboard.note.connect':
    '¿No tienes la caja a mano? Toca «{next}» y conéctala más tarde con el icono del sensor arriba a la derecha.',
  'onboard.zeroLater':
    'El vehículo se pone a cero la primera vez que aparcas en suelo llano. {lamp} te lo recordará hasta que esté hecho.',
  'onboard.legend.ok': 'Verde ✓: esa rueda está nivelada.',
  'onboard.legend.up': 'Naranja ↑: sube esa rueda al escalón indicado.',
  'onboard.legend.no': 'Rojo ✕: ningún escalón basta; muévete a un sitio más llano.',
  'onboard.legend.dim': 'Gris –: ninguna rampa en esa rueda; la cifra indica cuánto falta.',
  'settings.wheelbase': 'Distancia entre ejes',
  'settings.trackFront': 'Ancho de vía delantero',
  'settings.trackRear': 'Ancho de vía trasero',
  'settings.tolerance': 'Tolerancia',
  'settings.stability': 'Estabilidad',
  'settings.dwellRest': 'Retardo de respuesta (ms)',
  'settings.dwellMotion': 'Retardo de respuesta al ajustar (ms)',
  'settings.dwell.hint': 'Cuánto debe mantenerse una lectura antes de que cambie el número.',
  'settings.vehicle': 'Vehículo',
  'vehicle.motorhome': 'Autocaravana',
  'vehicle.caravan': 'Caravana',
  'settings.axleToJockey': 'Del eje a la rueda jockey',
  'settings.rearAxle': 'Eje trasero',
  'settings.axle': 'Eje',
  'axle.single': 'Simple',
  'axle.boggie': 'Tándem (doble eje)',
  'settings.track': 'Ancho de vía',
  'settings.measureHint': 'Figuran en la documentación del vehículo. Unos cm de error no importan.',
  'settings.measureHint.caravan':
    'Mide desde el eje hasta la rueda jockey. Unos cm de error no importan.',
  'settings.measureHint.boggie': 'Con doble eje, mide hasta el centro del par de ejes.',
  'settings.steps': 'Alturas de los escalones de la rampa',
  'settings.steps.add': 'Añadir escalón',
  'settings.steps.remove': 'Quitar {value}',
  'settings.ramp': 'Rampa prefabricada',
  'settings.ramp.custom': 'Juego personalizado',
  'settings.rampCount': 'Número de rampas',
  'settings.drain': 'Lado del desagüe',
  'settings.rampHint': 'La app elige dónde tus rampas hacen más falta.',
  'settings.drainHint':
    'Dentro de la tolerancia, este lado queda más bajo para que el agua desagüe.',
  'settings.section.vehicle': 'Vehículo y medidas',
  'settings.section.ramps': 'Rampas',
  'settings.general': 'General',
  'settings.language': 'Idioma',
  'settings.language.auto': 'Automático (idioma del dispositivo)',
  'settings.tolerance.hint': 'Cuánto hay que acercarse al nivel para contar como nivelado.',
  'settings.stability.hint':
    'Suaviza las pequeñas fluctuaciones del sensor para que los números no parpadeen.',
  'drain.none': 'Ninguno / da igual',
  'drain.left': 'Izquierda, centro',
  'drain.right': 'Derecha, centro',
  'drain.front': 'Delante, centro',
  'drain.rear': 'Detrás, centro',
  'drain.frontLeft': 'Delantero izquierdo',
  'drain.frontRight': 'Delantero derecho',
  'drain.rearLeft': 'Trasero izquierdo',
  'drain.rearRight': 'Trasero derecho',
  'settings.unit': 'Mostrar las longitudes en',
  'settings.theme': 'Tema',
  'theme.system': 'Seguir al móvil',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
  'settings.appearance': 'Aspecto',
  'appearance.classic': 'Clásico',
  'appearance.modern': 'Moderno',
  'appearance.glossy': 'Brillante',
  'settings.sound': 'Sonido al quedar nivelado',
  'settings.soundGuidance': 'Guía sonora continua',
  'settings.soundGuidance.help': 'El pitido se acelera y sube a medida que te acercas al nivel.',
  'settings.undo': 'Deshacer',
  'settings.saved': 'Guardado',
  'settings.more': 'Más',
  'settings.fineTuning': 'Ajuste fino',
  'settings.resetAll': 'Restablecer todos los ajustes',
  'settings.err.positive': 'Introduce un número mayor que 0. Sigue valiendo el valor anterior.',
  'settings.err.notNegative': 'Introduce 0 o más. Sigue valiendo el valor anterior.',

  'settings.tab.vehicle': 'Vehículo',
  'settings.tab.ramps': 'Rampas',
  'settings.tab.level': 'Nivelación',
  'settings.klossar.brandAll': 'Todas',
  'settings.klossar.changeRamp': 'Cambiar rampa',
  'settings.rampCountHint': 'La app las coloca donde más ayudan.',
  'settings.klossar.selected': 'Seleccionado',
  'settings.klossar.stepsHeading': 'Alturas de los escalones',

  'status.measuring': 'Midiendo…',
  'status.almost': 'Casi nivelado: faltan {left}',
  'status.cantLevel.close': 'Tus rampas se acercan pero no bastan aquí: mueve el vehículo',
  'status.cantLevel.far': 'Aquí tus rampas se quedan muy cortas: mueve el vehículo',

  'calibration.intro':
    'Pon el móvil sobre una superficie que sepas que está nivelada y toca Calibrar ahora. ' +
    'La inclinación actual se convierte en el punto cero.',
  'calibration.status': 'Calibrado: delante/detrás {pitch}, lado/lado {roll}.',
  'calibration.status.none': 'Sin calibrar: se usa el sensor en bruto.',
  'calibration.now': 'Calibrar ahora',
  'calibration.step.phone.done': 'Teléfono calibrado',
  'calibration.step.phone.hint': 'Deja el teléfono sobre algo plano.',
  'calibration.step.flipLink': '¿Nada plano? Gira el teléfono',
  'calibration.step.vehicle.done': 'Puesto a cero',
  'calibration.step.vehicle.hint':
    'Nivela el vehículo con un nivel de burbuja y pon el teléfono en su sitio habitual.',
  'calibration.step.vehicle.now': 'Poner a cero',
  'calibration.clear': 'Borrar la calibración',
  'calibration.err.notRunning':
    'El sensor de inclinación aún no está en marcha: toca primero Iniciar en la pantalla principal.',
  'calibration.warn.notFlat':
    'Esto no parece plano (más de 15°), así que la calibración será incorrecta. Pon el móvil sobre una superficie plana, o calibra de todos modos.',
  'calibration.anyway': 'Calibrar de todos modos',
  'calibration.sensor.h': 'Calibrar el móvil',
  'calibration.vehicle.h': 'Poner el vehículo a cero',
  'calibration.vehicle.intro':
    'La calibración es del móvil, no del sitio donde está apoyado. Si la mesa se inclina un poco, la app muestra esa inclinación. Nivela el vehículo una vez con un nivel de burbuja, pon el móvil en su sitio habitual y ponlo a cero.',
  'calibration.vehicle.now': 'Poner a cero',
  'calibration.vehicle.clear': 'Olvidar el cero',
  'calibration.vehicle.status': 'Cero del vehículo: delante/detrás {pitch}, lado/lado {roll}.',
  'calibration.vehicle.status.none': 'Sin cero del vehículo: el sitio del móvil cuenta como plano.',
  'calibration.vehicle.warn.notFlat':
    'Esto no parece nivelado (más de 15°). ¿Está el vehículo realmente nivelado? Pon a cero de todos modos si estás seguro.',
  'calibration.vehicle.anyway': 'Poner a cero de todos modos',
  'calibration.age.today': '(hoy)',
  'calibration.age.days': '(hace {n} días)',
  'calibration.check': 'Comprobar',
  'calibration.check.good': 'Sigue bien: desviación de {off}°.',
  'calibration.check.off': 'Desviación de {off}°: conviene recalibrar.',
  'calibration.vehicle.check.off': 'Desviación de {off}°: conviene volver a poner a cero.',
  'calibration.check.none':
    'Aún sin calibrar, así que no hay nada que comprobar. Pon el móvil sobre una superficie plana y toca «{now}».',
  'calibration.vehicle.check.none':
    'Aún sin cero, así que no hay nada que comprobar. Nivela el vehículo con un nivel de burbuja y toca «{now}».',
  'calibration.flip.intro':
    '¿No tienes cerca ninguna superficie nivelada? Usa la calibración por giro: pon el ' +
    'móvil en cualquier sitio razonablemente plano, captura, gíralo media vuelta (180°) en ' +
    'el mismo sitio y captura otra vez: la inclinación de la superficie se cancela sola.',
  'calibration.flip.start': 'Calibrar girando',
  'calibration.flip.rotate':
    'Ahora gira el móvil media vuelta (180°) en el mismo sitio y toca Capturar.',
  'calibration.flip.capture': 'Capturar',
  'calibration.flip.done': '¡Listo! Tu superficie se inclina {surface}°: compensado.',
  'calibration.flip.warn.moved':
    'Las dos capturas difieren más de 15°: ¿se ha movido el móvil? Empieza de nuevo, o calibra de todos modos.',
  'calibration.pill.notDone': 'SIN HACER',
  'calibration.pill.done': 'HECHO',
  'calibration.pill.none': 'NINGUNO',

  'targets.normal': 'Normal (nivelado)',
  'targets.name.placeholder': 'Nombre (p. ej. «Desagüe de la ducha»)',
  'targets.defaultName': 'Objetivo {n}',
  'targets.add': 'Guardar la inclinación actual como nuevo objetivo',
  'targets.delete': 'Eliminar {name}',
  'targets.warn.tooSteep':
    'Esto parece más inclinado que un objetivo intencionado (más de 15°). Inténtalo de nuevo, o guárdalo de todos modos.',
  'targets.anyway': 'Guardar de todos modos',
  'targets.badge': 'Objetivo: {name}',

  'feedback.intro':
    '¿Has encontrado un problema o tienes una idea? Rellena esto y toca el botón: se ' +
    'abrirá un informe ya preparado en GitHub donde publicarlo (hace falta una cuenta ' +
    'gratuita de GitHub, que se crea en un minuto).',
  'feedback.category': '¿Sobre qué es?',
  'feedback.cat.bug': 'Error',
  'feedback.cat.suggestion': 'Sugerencia',
  'feedback.cat.other': 'Otro',
  'feedback.title': 'Título breve',
  'feedback.desc': '¿Qué ha pasado, o qué te gustaría?',
  'feedback.submit': 'Abrir el informe en GitHub',
  'feedback.warn.title': 'El título está vacío: puedes enviar el informe de todos modos.',
  'feedback.warn.desc': 'La descripción está vacía: puedes enviar el informe de todos modos.',
  'feedback.warn.both':
    'El título y la descripción están vacíos: puedes enviar el informe de todos modos.',

  'help.screen.h': 'Cómo leer la pantalla',
  'help.screen.t':
    'Verde ✓: hecho, nada que hacer.\n' +
    'Naranja ↑: sube esa rueda al escalón indicado al lado.\n' +
    'Rojo ✕: tus rampas no bastan aquí. Mueve el vehículo.\n' +
    'Gris –: ninguna rampa en esa rueda. La cifra indica cuánto falta, por si quieres poner otra cosa debajo.\n' +
    'Cuando la burbuja reposa en el centro, estás nivelado.',
  'help.what.t':
    'Coloca el móvil plano en el vehículo, con la parte de arriba hacia delante, siempre en el mismo sitio.\n' +
    'Con una caja sensora da igual cómo esté el móvil.',
  'help.settings.h': 'Las medidas',
  'help.measures.h': 'Introduce las medidas',
  'help.settings.t':
    'Distancia entre ejes y ancho de vía. Vienen en la documentación del vehículo; si no, mide con una cinta métrica.\n' +
    'En una caravana, la distancia entre ejes va del eje a la rueda jockey.',
  'help.ramps.t':
    'Elige tus rampas o escribe la altura de los escalones. Libell las coloca donde más ayudan.',
  'help.calibration.h': 'Calibrar y poner a cero',
  'help.calibration.t':
    'Calibra el móvil una vez: colócalo sobre una superficie plana y toca Calibrar ahora.\n' +
    'Después pon a cero cuando el vehículo esté nivelado, con el móvil en su sitio habitual.\n' +
    'Con una caja sensora, la puesta a cero se hace en la página de la caja. No necesita calibración.\n' +
    'La luz ⚠ Calibrar o ⚠ Poner a cero sigue encendida hasta que esté hecho.',
  'help.sensor.h': 'Caja sensora',
  'help.sensor.t':
    'Una caja en el vehículo puede medir en lugar del móvil.\n' +
    'Toca el icono del sensor arriba a la derecha para conectarla. La página de la caja muestra el resto paso a paso.\n' +
    'El Xparkle debe ir de pie.\n' +
    'Una caja con flechas va plana, tapa arriba, con una flecha hacia delante.\n' +
    'En iPhone necesitas el navegador Bluefy.',
  'help.targets.h': 'Objetivos y sonido',
  'help.targets.t':
    'Guarda una inclinación que quieras, por ejemplo hacia el desagüe de la ducha, y cambia entre ellas.\n' +
    'El botón en el centro de la barra inferior activa y quita el sonido.',
  'help.trouble.h': 'Si algo falla',
  'help.trouble.t':
    '«Midiendo…»: el vehículo se mueve. Espera a que esté quieto.\n' +
    '«Deja el móvil plano para medir»: el móvil está demasiado inclinado para medir.\n' +
    '«Se perdió el contacto con la caja»: toca Reconectar y elige la caja en la lista.\n' +
    'En iPhone: toca Iniciar cada vez que abras la app.\n' +
    '¿Sigue fallando? Escribe un informe en Comentarios.',
  'help.open': 'Abrir {name}',
  'help.open.sensor': 'Abrir la caja sensora',
  'help.open.feedback': 'Escribir un informe',

  'main.hint': 'Deja el móvil plano dentro del vehículo, con el borde superior hacia delante.',
  'main.start': 'Iniciar',
  'main.waiting': 'Esperando al sensor de inclinación…',
  'main.level': '¡Tu vehículo está nivelado!',
  'main.denied':
    'Se ha denegado el acceso al movimiento, así que Libell no puede leer la inclinación. ' +
    'Permite el acceso a movimiento y orientación para este sitio y recarga.',
  'main.noSensors':
    'Este dispositivo no expone sensores de movimiento, así que Libell no puede leer la inclinación.',
  'main.https':
    'Libell necesita una conexión segura (HTTPS) para leer los sensores de inclinación. ' +
    'Abre la app por HTTPS e inténtalo de nuevo.',

  'diagram.aria': 'Vista desde arriba de tu autocaravana con las ruedas que hay que subir marcadas',
  'diagram.caravan.aria':
    'Vista desde arriba de tu caravana con las ruedas del eje y la rueda jockey',
  'diagram.front': 'Delante',
  'diagram.step': 'Escalón {n}',
  'diagram.done': 'Hecho',
  'diagram.noRamp': 'Sin rampa',
  'diagram.wheel.frontLeft': 'Delantera izquierda',
  'diagram.wheel.frontRight': 'Delantera derecha',
  'diagram.wheel.rearLeft': 'Trasera izquierda',
  'diagram.wheel.rearRight': 'Trasera derecha',
  'diagram.notEnough': 'no alcanza',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Subir con la manivela',
  'caravan.crankDown': 'Bajar con la manivela',
  'caravan.axleLeft': 'Rueda izquierda del eje',
  'caravan.axleRight': 'Rueda derecha del eje',
  'caravan.jockeyWheel': 'Rueda jockey',
  'help.screen.caravan':
    'Caravana: la rueda jockey indica Subir o Bajar con la manivela, y cuánto.',

  'tilt.frontBack': 'Delante/detrás',
  'tilt.sideSide': 'Lado/lado',

  'pose.layFlat': 'Deja el móvil plano para medir',
  'pose.sensorHint': 'Solo mide bien en plano, con la cara hacia arriba.',
  'pose.openSensorPage': 'Ver la caja',
  'pose.sensorExtreme': 'La caja está demasiado inclinada',
  'pose.sensorUpsideDown': 'La caja parece estar del revés',
  'pose.sensorNotUpright': 'La caja está tumbada',
  'pose.sensorHintUpright': 'Solo mide bien de pie.',
  'calibration.external.h': 'Poner el vehículo a cero',
  'calibration.external.intro':
    'Nivela el vehículo una vez con un nivel de burbuja y luego pon a cero.',
  'calibration.external.phoneHidden':
    'La calibración del móvil está oculta mientras mide la caja sensora. Para calibrar el móvil, abre la caja y toca primero «{disconnect}».',
  'calibration.external.working': 'Poniendo a cero…',
  'calibration.external.done':
    '{name} está puesto a cero: esta posición cuenta ahora como nivelada.',
  'calibration.external.err.notConnected':
    '{name} no está conectado. Conéctalo e inténtalo de nuevo.',
  'calibration.external.err.failed':
    'No se pudo poner {name} a cero. No se ha cambiado nada. Comprueba la conexión e inténtalo de nuevo.',
  'pose.portrait':
    'Pon el móvil en vertical (retrato): el borde superior debe apuntar hacia delante',

  'stale.dataUnavailable':
    'No llegan datos nuevos del sensor: la guía está en pausa hasta que vuelvan',

  'sensorFallback.lost': 'Se perdió el contacto con la caja',
  'sensorFallback.autoRetry': 'Reintentando automáticamente…',
  'sensorFallback.connect': 'Conecta la caja',
  'sensorFallback.pick': 'Toca y elige tu caja en la lista.',
  'sensorFallback.notFound': '¿No aparece ninguna caja? Comprueba que esté encendida y cerca.',
  'sensorFallback.retry': 'Reconectar',
  'sensorFallback.usePhone': 'Usar el móvil en su lugar',
  'mounting.prompt.upright':
    'Toca el lado hacia el que apunta la parte trasera de la caja (el soporte de tornillo).',
  'mounting.prompt.arrow':
    'Una de las flechas de la caja (en la tapa o en la placa de debajo) apunta hacia delante. ¿Qué lado mira hacia delante?',
  'mounting.placement.wide': 'Lado largo hacia delante',
  'mounting.placement.short': 'Lado corto hacia delante',
  'mounting.facing.front': 'Hacia delante',
  'mounting.facing.right': 'Hacia la derecha',
  'mounting.facing.rear': 'Hacia atrás',
  'mounting.facing.left': 'Hacia la izquierda',
  'box.state.connected': 'Conectada',
  'box.state.lost': 'Se perdió el contacto',
  'box.state.password': 'Contraseña incorrecta',
  'box.password.label': 'Código de la caja',
  'box.password.retry': 'Reintentar',
  'box.password.checking': 'Probando el código…',
  'box.password.invalid': 'El código tiene cuatro cifras.',
  'box.password.wrong': 'La caja tampoco ha aceptado ese código.',
  'box.password.noAnswer':
    'La caja no ha respondido. El código está guardado y se probará la próxima vez que se conecte la caja.',
  'box.state.notConnected': 'No conectada',
  'box.state.battery': 'batería {value}',
  'box.connect': 'Conectar',
  'box.step.position.upright.ok': 'Está de pie',
  'box.step.position.upright.bad': 'Tumbada: ponla de pie, hacia cualquier lado',
  'box.step.position.flat.ok': 'Está en plano',
  'box.step.position.flat.bad': 'Demasiado inclinada: ponla en plano, cara arriba',
  'box.step.position.flat.upsideDown':
    'Al revés: dale la vuelta con la tapa hacia arriba. El fabricante desaconseja montarla al revés.',
  'box.step.position.waiting': 'Posición: esperando una lectura',
  'box.step.direction.todo': 'Elegir la orientación',
  'box.step.direction.done': 'Orientación elegida',
  'box.step.direction.learn': '¿No estás seguro? Apréndela levantando la parte delantera',
  'box.step.zero.todo': 'Poner el vehículo a cero',
  'box.step.zero.done': 'Puesta a cero',
  'box.step.zero.hint': 'Nivela el vehículo con un nivel de burbuja y luego pon a cero.',
  'box.forgetDirection': 'Olvidar la orientación',
  'onboard.boxPosition.h': 'Posición de la caja',
  'onboard.boxPosition.later':
    'La dirección y el cero se ajustan la primera vez que aparcas. La página de la caja te guía y el piloto ⚠ Poner a cero te lo recuerda hasta entonces.',
  'onboard.boxPosition.notConnected':
    'Todavía no hay ninguna caja conectada, así que no se puede mostrar su posición. Toca «{next}» y conéctala más tarde con el icono del sensor arriba a la derecha.',
  'sensorList.title': 'Caja sensora',
  'sensorList.phone': 'Se usa el sensor del propio móvil cuando no hay ninguna caja conectada.',
  'box.step.zero.again': 'Volver a poner a cero',
};
