import type { Messages } from './en';

/** Portuguese (European Portuguese, Portugal). */
export const pt: Messages = {
  'topbar.install': 'Instalar',
  'topbar.share': 'Partilhar o Libell',
  'bottombar.settings': 'Definições',
  'bottombar.sound.mute': 'Desligar o som',
  'bottombar.sound.unmute': 'Ligar o som',
  'bottombar.help': 'Ajuda',
  'bottombar.label': 'Ações',
  'share.text': 'Nivele a sua autocaravana ou caravana com o telemóvel.',
  'share.copied': 'Ligação copiada!',
  'update.check': 'Procurar uma nova versão',
  'update.checking': 'A procurar atualizações…',
  'update.updating': 'A atualizar para a nova versão…',
  'update.latest': 'Tem a versão mais recente',
  'update.offline': 'Sem ligação, não é possível procurar atualizações',
  'update.unsupported': 'As atualizações não estão disponíveis aqui',
  'install.hint': 'Toque em Partilhar e depois em «Adicionar ao ecrã principal».',
  'install.row': 'Instale o Libell como app no ecrã principal.',
  'install.close': 'Ocultar',
  'share.vehicle.text': 'A configuração do meu veículo para o Libell — medidas e rampas.',
  'settings.shareVehicle': 'Enviar a outro telemóvel',
  'setup.incoming.h': 'Configuração de veículo recebida',
  'setup.incoming.intro': 'Um familiar partilhou consigo estas medidas do veículo:',
  'setup.incoming.reminder':
    'Isto não inclui nenhuma calibração — terá na mesma de calibrar este telemóvel.',
  'setup.incoming.apply': 'Substituir o veículo atual',
  'setup.incoming.dismiss': 'Agora não',
  'setup.incoming.invalid':
    'Não foi possível ler essa ligação de configuração do veículo — nada foi alterado.',

  'lamp.setup': '⚠ Medidas',
  'lamp.setup.title':
    'As medidas do veículo nunca foram guardadas — toque para abrir as Definições',
  'lamp.calibrate': '⚠ Calibrar',
  'lamp.zero': '⚠ Pôr a zero',
  'lamp.calibrate.title':
    'O telemóvel não está calibrado — toque para abrir «Calibrar e pôr a zero»',
  'lamp.zero.title': 'O veículo não está a zero — toque para abrir «Calibrar e pôr a zero»',
  'lamp.calibrate.title.sensor': 'A caixa não está a zero — toque para abrir a caixa',
  'sensorStatus.connected': 'Caixa de sensor ligada',
  'sensorStatus.disconnected': 'Caixa de sensor — contacto perdido, toque para ver detalhes',
  'sensorStatus.stale': 'Caixa de sensor — sem dados novos, toque para ver detalhes',
  'sensorStatus.idle': 'Caixa de sensor — toque para ligar',
  'sensorStatus.idle.guide': 'Caixa de sensor — toque para ver o guia para iPhone',
  'menu.title': 'Menu',
  'menu.close': 'Fechar o menu',
  'menu.settings': 'Definições',
  'menu.calibration': 'Calibrar e pôr a zero',
  'menu.targets': 'Alvos',
  'menu.feedback': 'Opinião',
  'menu.help': 'Ajuda',
  'menu.intro': 'Ver introdução',
  'menu.about': 'Sobre o Libell',
  'menu.about.tab': 'Sobre',
  'menu.sensorSource': 'Caixa de sensor',
  'sensorSource.connect': 'Ligar o sensor {name}',
  'sensorSource.disconnect': 'Desligar',
  'sensorSource.status.connecting': 'A ligar…',
  'sensorSource.err.unsupported': 'Este navegador não suporta Web Bluetooth.',
  'sensorSource.unsupported.browser':
    'Para ligar uma caixa de sensor, abra o Libell no Chrome ou no Edge, num Android ou num computador. O sensor do próprio telemóvel funciona aqui normalmente.',
  'sensorSource.err.password':
    'A caixa {name} não aceitou a palavra-passe. Escreva abaixo o código de quatro dígitos da caixa e toque em Tentar de novo. O código de fábrica é 0000. Se não souber o código, altere-o na app Xparkle.',
  'sensorSource.err.failed': 'Não foi possível ligar ao sensor {name}.',
  'sensorSource.ios.intro':
    'O Safari não consegue ligar-se diretamente a sensores Bluetooth, mas há uma alternativa:',
  'sensorSource.ios.step1': 'Instale «Bluefy – Web Bluetooth Browser» a partir da App Store.',
  'sensorSource.ios.step2': 'Abra o Bluefy e conceda a permissão de Bluetooth.',
  'sensorSource.ios.step3': 'No Bluefy, abra este mesmo endereço do Libell.',
  'sensorSource.ios.step4': 'Abra aí de novo Caixa de sensor — funciona como no Android.',
  'sensorSource.ios.note':
    'O Bluefy é uma app de terceiros, não feita pelo Libell — ao abrir a app, voltar a ligar pode exigir um toque manual em vez de acontecer automaticamente.',
  'sensorSource.ios.bluefyLink': 'Bluefy na App Store',
  'sensorSource.detail.temperature': 'Temperatura: {value}',
  'sensorSource.detail.notAvailable': 'Ainda indisponível',
  'sensorSource.lowBattery':
    '⚠ Bateria fraca ({value}) — convém substituir em breve a bateria da caixa de sensor.',
  'sensorSource.install.now': 'Pôr a zero',
  'sensorSource.install.clear': 'Esquecer o zero',
  'sensorSource.install.status': 'Zero: frente/trás {pitch}, lado/lado {roll}.',
  'sensorSource.install.status.none': 'Ainda não está a zero — a caixa mede tal como está.',
  'sensorSource.learn.h': 'Aprender a montagem',
  'sensorSource.learn.intro':
    'O Libell aprende a direção com duas elevações: primeiro a frente, depois o lado direito.',
  'sensorSource.learn.start': 'Aprender montagem',
  'sensorSource.learn.step.front':
    'Levante a frente do veículo alguns centímetros e depois carregue no botão.',
  'sensorSource.learn.capture.front': 'Frente levantada',
  'sensorSource.learn.step.right':
    'Baixe de novo a frente. Agora levante o lado direito alguns centímetros e depois carregue no botão.',
  'sensorSource.learn.capture.right': 'Lado direito levantado',
  'sensorSource.learn.cancel': 'Cancelar',
  'sensorSource.learn.status.learned': 'Montagem aprendida.',
  'sensorSource.learn.status.none':
    'Nenhuma montagem aprendida — são usadas as direções da própria caixa.',
  'sensorSource.learn.done':
    'Pronto! Confirme: levante a frente e o Libell deve indicar as rodas traseiras.',
  'sensorSource.learn.err.tooSmall':
    'O veículo quase não se mexeu. Levante-o um pouco mais e tente de novo.',
  'sensorSource.learn.err.ambiguous':
    'As duas direções mexeram-se quase o mesmo. Levante só a frente, depois só o lado direito, e tente de novo.',
  'sensorSource.learn.err.arrow':
    'Nenhuma seta aponta para a frente. Rode a caixa para que uma das setas aponte para a frente e tente de novo.',
  'sensorSource.learn.err.mirrored':
    'A caixa parece estar ao contrário, ou foi levantado o lado errado. Verifique e tente de novo.',
  'sensorSource.learn.err.sameAxis':
    'As duas elevações inclinaram no mesmo sentido. Levante primeiro a frente, depois o lado direito, e tente de novo.',
  'sensorStatus.title': 'Sensor {name}',
  'sensorStatus.reading': 'Inclinação agora: {value}',
  'sensorStatus.debug': 'Info de diagnóstico',
  'sensorStatus.debug.intro':
    'Valores em bruto vindos da caixa — para diagnóstico, se algo não estiver a funcionar.',
  'sensorStatus.debug.state': 'Estado da ligação: {value}',
  'sensorStatus.debug.deviceId': 'ID do dispositivo: {value}',
  'sensorStatus.debug.lastSample': 'Última leitura: {value}',
  'sensorStatus.debug.age': 'há {s} s',
  'sensorStatus.debug.rawAccel': 'Acelerómetro em bruto (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Geração do firmware: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Bytes de estado em bruto: {value}',
  'sensorStatus.debug.versionBytes': 'Número de série e firmware (em bruto): {value}',
  'sensorStatus.debug.copy': 'Copiar diagnóstico',
  'sensorStatus.debug.copied': 'Informação de diagnóstico copiada!',
  'sensorStatus.debug.copy.failed': 'Não foi possível copiar automaticamente.',
  'sensorStatus.advanced': 'Avançado',
  'sensorStatus.silentReconnect.intro':
    'Este navegador ainda não consegue voltar a ligar-se à caixa sozinho, por isso, depois de reiniciar, tem de a escolher de novo na lista. No Chrome pode ativar isto.',
  'sensorStatus.silentReconnect.steps':
    'Abra {address}, pesquise «web bluetooth», defina «Use the new permissions backend for Web Bluetooth» como Enabled e toque em Relaunch. Depois ligue a caixa uma vez.',
  'sensorStatus.silentReconnect.copy': 'Copiar {address}',
  'sensorStatus.silentReconnect.copied': 'Copiado — cole na barra de endereço do Chrome.',
  'sensorStatus.debug.connectDelay.intro':
    'Experimental: experimente só se a ligação da sua caixa for instável. Acrescenta uma pausa fixa depois de ligar, antes de a app começar a ler dela.',
  'sensorStatus.debug.connectDelay.enable': 'Ativar pausa ao ligar',
  'sensorStatus.debug.connectDelay.ms': 'Pausa (ms)',

  'about.text':
    'O Libell ajuda-o a nivelar a sua autocaravana ou caravana com o telemóvel que já tem, sem adivinhar.',
  'about.version': 'Versão {v}',
  'about.offline':
    'Funciona totalmente offline — a rede só é usada para obter atualizações da própria app.',
  'about.privacy':
    'As suas definições ficam no telemóvel — sem conta e sem rastreio. O Libell só envia contagens anónimas de como a app é usada, e pode desativar isso.',
  'about.source': 'O Libell é gratuito e de código aberto (licença MIT).',
  'about.source.link': 'Código no GitHub',
  'menu.privacy': 'Privacidade',
  'menu.privacy.tab': 'Privacidade',
  'privacy.stored.h': 'Guardado neste telemóvel',
  'privacy.stored.empty': 'Não há nada guardado.',
  'privacy.raw': 'Ver dados em bruto',
  'privacy.raw.hint': 'Exatamente como guardados. A palavra-passe da caixa está oculta.',
  'privacy.resetSettings': 'Repor só as definições',
  'privacy.deleteAll': 'Apagar todos os dados do Libell',
  'privacy.deleteAll.confirm':
    'Apagar tudo o que o Libell guardou neste telemóvel? Os veículos, as medidas e a calibração são removidos, e o Libell recomeça como da primeira vez.',
  'privacy.deleteAll.yes': 'Sim, apagar tudo',
  'privacy.deleteAll.cancel': 'Cancelar',
  'stored.vehicle': 'Veículo',
  'stored.vehicle.detail': '{name}, distância entre eixos {wheelbase}',
  'stored.settings': 'Definições',
  'stored.settings.detail': 'Medidas, rampas, unidade, aparência e som',
  'stored.password': 'Palavra-passe da caixa de sensor',
  'stored.language': 'Idioma',
  'stored.phoneCalibration': 'Calibração do telemóvel',
  'stored.zero': 'Zero do veículo',
  'stored.zeroTrim': 'Afinação do zero',
  'stored.targets': 'Alvos',
  'stored.targets.active': '{name} (escolhido)',
  'stored.hitch': 'Altura de engate',
  'stored.rememberedBox': 'Caixa de sensor memorizada',
  'stored.notes': 'Notas da própria app',
  'stored.notes.detail': '{n} pequenas marcas, por exemplo se a introdução já foi vista',
  'stored.phone': 'O telemóvel',
  'stored.saved': 'guardado',
  'stored.counting.off': 'Desativada',
  'stored.counting.on': 'Ativada',
  'stored.savedOn': 'guardado a {date}',

  'intro.h': 'Bem-vindo ao Libell',
  'intro.how':
    'Coloque o telemóvel deitado no veículo e o Libell mostra que rodas levantar e quanto.',
  'intro.start': 'Começar',
  'intro.later': 'Explorar primeiro',
  'onboard.source.sensorIcon':
    'Pode ligar uma caixa de sensor a qualquer momento com o ícone do sensor no canto superior direito.',
  'counting.title': 'Contagem anónima',
  'counting.intro': 'O Libell pode contar o uso anonimamente, para sabermos o que melhorar.',
  'counting.sent.h': 'O que é contado',
  'counting.sent':
    'Que a app foi aberta, que funções são usadas, que sensor mede (o telemóvel ou um modelo como {boxes}), a versão da app e o idioma escolhido no Libell.',
  'counting.notSent.h': 'O que nunca é guardado',
  'counting.notSent':
    'O seu IP, país, dispositivo, ecrã, sistema operativo, navegador, as medidas do veículo, as suas definições ou qualquer outra coisa sobre si. No telemóvel só fica guardada a sua escolha.',
  'counting.gpc': 'Se o seu navegador pedir aos sites que não o sigam, o Libell não conta nada.',
  'counting.later': 'Pode mudar a sua escolha quando quiser em {help} › {tab}.',
  'counting.toggle': 'Contar a minha utilização de forma anónima',
  'counting.dashboard': 'Ver as estatísticas',
  'counting.ask': 'Quer ajudar a melhorar o Libell?',
  'counting.yes': 'Sim, contar anonimamente',
  'counting.no': 'Não, obrigado',
  'onboard.sound.h': 'Som',
  'onboard.source.h': 'Como quer medir?',
  'onboard.source.intro':
    'Escolha o sensor de onde o Libell deve ler a inclinação — a maioria usa simplesmente o telemóvel.',
  'onboard.source.phone': 'Este telemóvel',
  'onboard.source.externalActive':
    'Está ativa uma caixa de sensor. Se escolher este telemóvel, a calibração do telemóvel é saltada. Para calibrar o telemóvel, abra a caixa com o ícone do sensor no canto superior direito e toque primeiro em «{disconnect}».',
  'onboard.vehicle.h': 'O que vai nivelar?',
  'onboard.vehicle.intro': 'Escolha o seu veículo — o resto deste guia adapta-se a ele.',
  'onboard.step1.h': 'Coloque o telemóvel assim',
  'onboard.next': 'Seguinte',
  'onboard.back': 'Voltar',
  'onboard.close': 'Fechar a introdução',
  'onboard.done': 'Concluir',
  'onboard.skipStep': 'Saltar',
  'onboard.note.measurements':
    'Se saltar, são usadas as medidas predefinidas; {lamp} fica aceso até guardar as suas.',
  'onboard.note.ramps':
    'Se saltar, são usadas as rampas predefinidas. Pode escolher as suas mais tarde nas Definições.',
  'onboard.note.calibrate':
    'Não tem uma superfície plana agora? Toque em «{next}»; {lamp} lembra-o até estar feito.',
  'onboard.note.connect':
    'Não tem a caixa à mão? Toque em «{next}» e ligue-a mais tarde com o ícone do sensor no canto superior direito.',
  'onboard.zeroLater':
    'Põe o veículo a zero na primeira vez que estacionar em terreno nivelado. {lamp} lembra-o até estar feito.',
  'onboard.legend.ok': 'Verde ✓ — essa roda está nivelada.',
  'onboard.legend.up': 'Laranja ↑ — subir essa roda para o degrau indicado.',
  'onboard.legend.no': 'Vermelho ✕ — nenhum degrau chega; mude para um sítio mais plano.',
  'onboard.legend.dim': 'Cinzento – — sem rampa nessa roda; o número mostra quanto falta.',

  'settings.wheelbase': 'Distância entre eixos',
  'settings.trackFront': 'Via dianteira',
  'settings.trackRear': 'Via traseira',
  'settings.tolerance': 'Tolerância',
  'settings.stability': 'Estabilidade',
  'settings.dwellRest': 'Tempo de resposta (ms)',
  'settings.dwellMotion': 'Tempo de resposta ao ajustar (ms)',
  'settings.dwell.hint': 'Quanto tempo uma leitura tem de se manter antes de o número mudar.',
  'settings.vehicle': 'Veículo',
  'vehicle.motorhome': 'Autocaravana',
  'vehicle.caravan': 'Caravana',
  'settings.axleToJockey': 'Eixo até à roda de apoio',
  'settings.rearAxle': 'Eixo traseiro',
  'settings.axle': 'Eixo',
  'axle.single': 'Simples',
  'axle.boggie': 'Duplo (tandem)',
  'settings.track': 'Via',
  'settings.measureHint': 'Estão no certificado de matrícula. Alguns cm de diferença não importam.',
  'settings.measureHint.caravan':
    'Meça do eixo até à roda de apoio. Alguns cm de diferença não importam.',
  'settings.measureHint.boggie': 'Com eixo duplo, meça até ao centro do par de eixos.',
  'settings.steps': 'Alturas dos degraus da rampa',
  'settings.steps.add': 'Juntar degrau',
  'settings.steps.new': 'Nova altura de degrau ({unit})',
  'settings.steps.remove': 'Remover {value}',
  'settings.ramp': 'Rampa de fábrica',
  'settings.ramp.custom': 'Conjunto próprio',
  'settings.ramp.stepless': 'Calço sem degraus',
  'settings.ramp.steplessModel': '{name} (sem degraus, máx. {max} mm)',
  'settings.stepless.max': 'Calço sem degraus, altura máx.',
  'settings.stepless.maxHeading': 'Altura máx.',
  'settings.stepless.set': 'Guardar',
  'settings.stepless.new': 'Altura máxima ({unit})',
  'settings.rampCount': 'Número de rampas',
  'settings.drain': 'Lado do escoamento',
  'settings.rampHint': 'A app escolhe onde as suas rampas ajudam mais.',
  'settings.drainHint': 'Dentro da tolerância, este lado fica o mais baixo para a água escoar.',
  'settings.section.vehicle': 'Veículo e medidas',
  'settings.section.ramps': 'Rampas',
  'settings.general': 'Geral',
  'settings.language': 'Idioma',
  'settings.language.auto': 'Automático (idioma do dispositivo)',
  'settings.tolerance.hint': 'Quão perto do nivelado ainda conta como nivelado.',
  'settings.stability.hint':
    'Suaviza pequenas oscilações do sensor para que os números não tremam.',
  'drain.none': 'Nenhum / tanto faz',
  'drain.left': 'Esquerda, ao meio',
  'drain.right': 'Direita, ao meio',
  'drain.front': 'Frente, ao meio',
  'drain.rear': 'Trás, ao meio',
  'drain.frontLeft': 'Frente esquerda',
  'drain.frontRight': 'Frente direita',
  'drain.rearLeft': 'Trás esquerda',
  'drain.rearRight': 'Trás direita',
  'settings.unit': 'Mostrar comprimentos em',
  'settings.unitInches': 'polegadas (in)',
  'settings.theme': 'Tema',
  'theme.system': 'Igual ao telemóvel',
  'theme.light': 'Claro',
  'theme.dark': 'Escuro',
  'settings.appearance': 'Aspeto',
  'appearance.classic': 'Clássico',
  'appearance.modern': 'Moderno',
  'appearance.glossy': 'Brilhante',
  'settings.sound': 'Sinal ao nivelar',
  'settings.soundGuidance': 'Orientação sonora contínua',
  'settings.soundGuidance.help':
    'O sinal fica mais rápido e mais agudo quanto mais perto estiver do nivelado.',
  'settings.soundSpeech': 'Orientação falada',
  'settings.soundSpeech.help':
    'Quando o veículo está parado, a app diz que roda e quanto, por exemplo «Trás esquerda, Degrau 2».',
  'settings.soundSpeech.unavailable':
    'A orientação falada não funciona neste telemóvel: não tem uma voz em português que funcione offline. Os sinais sonoros funcionam normalmente.',
  'speech.level': 'Nivelado',
  'speech.inches': '{n} polegadas',
  'speech.inchOne': 'uma polegada',
  'speech.inchOneAnd': 'uma polegada e {fraction}',
  'speech.inchesAnd': '{n} polegadas e {fraction}',
  'speech.inchFraction': '{fraction} de polegada',
  'speech.eighth1': 'um oitavo',
  'speech.eighth2': 'um quarto',
  'speech.eighth3': 'três oitavos',
  'speech.eighth4': 'meia',
  'speech.eighth5': 'cinco oitavos',
  'speech.eighth6': 'três quartos',
  'speech.eighth7': 'sete oitavos',
  'settings.undo': 'Anular',
  'settings.saved': 'Guardado',
  'settings.more': 'Mais',
  'settings.fineTuning': 'Ajuste fino',
  'settings.resetAll': 'Repor definições',
  'settings.err.positive': 'Introduza um número acima de 0. O valor anterior mantém-se.',
  'settings.err.notNegative': 'Introduza 0 ou mais. O valor anterior mantém-se.',
  'settings.err.range': 'Introduza um número de {min} a {max}. O valor anterior mantém-se.',
  'settings.tab.vehicle': 'Veículo',
  'settings.tab.ramps': 'Rampas',
  'settings.tab.level': 'Nível',
  'settings.klossar.brandAll': 'Todas',
  'settings.klossar.changeRamp': 'Mudar rampa',
  'settings.rampCountHint': 'A app coloca-as onde ajudam mais.',
  'settings.klossar.selected': 'Em uso',
  'settings.klossar.stepsHeading': 'Alturas dos degraus',

  'status.measuring': 'A medir…',
  'status.almost': 'Quase nivelado — faltam {left}',
  'status.cantLevel.close':
    'As suas rampas quase chegam, mas aqui não bastam — mude o veículo de sítio',
  'status.cantLevel.far': 'As suas rampas aqui ficam muito aquém — mude o veículo de sítio',
  'adjustable.before': 'Ajuste as rampas ao degrau indicado antes de subir para elas.',
  'adjustable.after': 'Ainda não está nivelado. Desça das rampas e a app volta a medir.',

  'calibration.intro':
    'Coloque o telemóvel numa superfície que sabe estar nivelada e toque em Calibrar agora. A inclinação atual passa a ser o ponto zero.',
  'calibration.status': 'Calibrado: frente/trás {pitch}, lado/lado {roll}.',
  'calibration.status.none': 'Não calibrado — a usar o sensor em bruto.',
  'calibration.now': 'Calibrar agora',
  'calibration.step.phone.done': 'Telemóvel calibrado',
  'calibration.step.phone.hint': 'Pouse o telemóvel em algo plano.',
  'calibration.step.flipLink': 'Sem superfície plana? Rodar',
  'calibration.step.vehicle.done': 'Posto a zero',
  'calibration.step.vehicle.hint':
    'Nivele o veículo com um nível de bolha e coloque o telemóvel no sítio habitual.',
  'calibration.step.vehicle.now': 'Pôr a zero',
  'calibration.clear': 'Apagar calibração',
  'calibration.err.notRunning':
    'O sensor de inclinação ainda não está ativo — toque primeiro em Iniciar no ecrã principal.',
  'calibration.warn.notFlat':
    'Calibração guardada, mas isto não parece plano (mais de 15°), por isso deve estar errada. Não era isso? Toque em Anular, pouse o telemóvel numa superfície plana e calibre de novo.',
  'calibration.undo': 'Anular',
  'calibration.sensor.h': 'Calibrar o telemóvel',
  'calibration.vehicle.h': 'Pôr o veículo a zero',
  'calibration.vehicle.intro':
    'A calibração diz respeito ao telemóvel, não ao sítio onde está. Se a mesa estiver um pouco inclinada, a app mostra essa inclinação. Nivele o veículo uma vez com um nível de bolha, coloque o telemóvel no sítio habitual e ponha a zero.',
  'calibration.vehicle.now': 'Pôr a zero',
  'calibration.vehicle.clear': 'Esquecer o zero',
  'calibration.vehicle.status': 'Zero do veículo: frente/trás {pitch}, lado/lado {roll}.',
  'calibration.vehicle.status.none': 'Sem zero do veículo — o sítio do telemóvel conta como plano.',
  'calibration.vehicle.warn.notFlat':
    'Zero guardado, mas isto não parece nivelado (mais de 15°). O veículo não estava nivelado? Toque em Anular, nivele o veículo e ponha a zero de novo.',
  'calibration.age.today': '(hoje)',
  'calibration.age.days': '(há {n} dias)',
  'calibration.check': 'Verificar',
  'calibration.check.good': 'Continua bom — desvio de {off}°.',
  'calibration.check.off': 'Desvio de {off}° — convém calibrar de novo.',
  'calibration.vehicle.check.off': 'Desvio de {off}° — convém pôr a zero de novo.',
  'calibration.check.none':
    'Ainda não calibrado, por isso não há nada a verificar. Pouse o telemóvel numa superfície nivelada e toque em «{now}».',
  'calibration.vehicle.check.none':
    'Ainda sem zero, por isso não há nada a verificar. Nivele o veículo com um nível de bolha e toque em «{now}».',
  'calibration.flip.intro':
    'Não há uma superfície nivelada por perto? Use a calibração por rotação: pouse o telemóvel num sítio razoavelmente plano, capture, rode o telemóvel meia volta (180°) no mesmo sítio e capture de novo — a inclinação da superfície anula-se a si própria.',
  'calibration.flip.start': 'Calibrar a rodar',
  'calibration.flip.rotate':
    'Agora rode o telemóvel meia volta (180°) no mesmo sítio e toque em Capturar.',
  'calibration.flip.capture': 'Capturar',
  'calibration.flip.done': 'Pronto! A sua superfície inclina {surface}° — compensado.',
  'calibration.flip.warn.moved':
    'Calibração guardada, mas as duas capturas diferem mais de 15°. O telemóvel mexeu-se? Toque em Anular e comece de novo.',
  'calibration.pill.notDone': 'PENDENTE',
  'calibration.pill.done': 'FEITO',
  'calibration.pill.none': 'NENHUM',

  'targets.normal': 'Normal (nivelado)',
  'targets.name.placeholder': 'Nome (ex. «Ralo do duche»)',
  'targets.name.label': 'Nome do novo alvo',
  'targets.defaultName': 'Alvo {n}',
  'targets.add': 'Guardar inclinação como alvo',
  'targets.delete': 'Apagar {name}',
  'targets.warn.tooSteep':
    'Alvo guardado, mas é mais inclinado do que um alvo habitual (mais de 15°). Não era isso? Apague-o com a cruz e guarde de novo.',
  'targets.badge': 'Alvo: {name}',

  'feedback.intro':
    'Encontrou um problema ou tem uma ideia? Preencha isto e toque no botão — abre um relatório já pronto no GitHub, que publica lá (é precisa uma conta gratuita do GitHub, criada num minuto).',
  'feedback.category': 'Sobre o que é?',
  'feedback.cat.bug': 'Erro',
  'feedback.cat.suggestion': 'Sugestão',
  'feedback.cat.other': 'Outro',
  'feedback.title': 'Título curto',
  'feedback.desc': 'O que aconteceu, ou o que gostaria de ter?',
  'feedback.submit': 'Abrir relatório no GitHub',
  'feedback.warn.title': 'O título está vazio — pode enviar o relatório na mesma.',
  'feedback.warn.desc': 'A descrição está vazia — pode enviar o relatório na mesma.',
  'feedback.warn.both': 'O título e a descrição estão vazios — pode enviar o relatório na mesma.',

  'help.screen.h': 'Ler o ecrã',
  'help.screen.lead':
    'O ecrã mostra que rodas levantar e quanto. Degrau 2 significa o segundo degrau da sua rampa.',
  'help.screen.t':
    'Verde ✓: feito, nada a fazer.\n' +
    'Laranja ↑: subir essa roda para o degrau indicado ao lado.\n' +
    'Vermelho ✕: as suas rampas não chegam aqui. Mude o veículo de sítio.\n' +
    'Cinzento –: sem rampa nessa roda. O número mostra quanto falta, se quiser pôr outra coisa por baixo.\n' +
    'Quando a bolha fica parada no meio, está nivelado.',
  'help.screen.routine':
    'Depois de subir, espere até o veículo estar parado e volte a olhar. Repita até todas as rodas estarem verdes.',
  'help.what.t':
    'Pouse o telemóvel deitado no veículo, com o topo virado para a frente, sempre no mesmo sítio.\n' +
    'Com uma caixa de sensor, não importa como o telemóvel está pousado.',
  'help.settings.h': 'As medidas',
  'help.measures.h': 'Introduzir as medidas',
  'help.settings.t':
    'O Libell calcula quanto cada roda tem de subir a partir da distância entre eixos e da via.\n' +
    'Estão nos documentos do veículo, ou meça com uma fita métrica.\n' +
    'Introduza-as em mm, cm ou polegadas, conforme o que escolheu em Mostrar comprimentos em.\n' +
    'Numa caravana, a distância entre eixos é a distância do eixo à roda de apoio.\n' +
    'Com vários veículos, cada um guarda as suas medidas, rampas, zero do veículo, alvos e caixa de sensor; escolha um no topo de Veículo.',
  'help.ramps.t':
    'O ecrã diz para que degrau da sua rampa vai cada roda, por isso indique as rampas que leva.\n' +
    'Escolha uma rampa de fábrica ou um conjunto próprio, e quantas tem. O Libell coloca-as onde ajudam mais.\n' +
    'Para uma rampa sem degraus, escolha Calço sem degraus e indique a altura. O ecrã diz então quanto subir.',
  'help.calibration.h': 'Calibrar e pôr a zero',
  'help.calibration.t':
    'Dois passos tornam as leituras corretas: calibrar o telemóvel uma vez e pôr o veículo a zero uma vez.\n' +
    'Calibrar: pouse o telemóvel numa superfície plana e toque em Calibrar agora.\n' +
    'Pôr a zero: nivele o veículo com um nível de bolha, coloque o telemóvel no sítio habitual e toque em Pôr a zero.\n' +
    'Com uma caixa de sensor, põe a zero na página da caixa. Não precisa de calibração.\n' +
    'Ainda não está bem nivelado? Afine o zero com Esq. acima, Dir. acima, Frente acima ou Trás acima em Pôr o veículo a zero.\n' +
    'A luz ⚠ Calibrar ou ⚠ Pôr a zero fica acesa até estar feito.',
  'help.sensor.h': 'Caixa de sensor',
  'help.sensor.t':
    'Uma caixa de sensor no veículo pode medir em vez do telemóvel. O Libell funciona com estas:\n' +
    '{upright}: fica de pé, virada para qualquer lado.\n' +
    '{flat}: fica deitada, tampa para cima, com uma seta a apontar para a frente.\n' +
    'Ligue com o ícone do sensor no canto superior direito. A página da caixa guia-o depois por Escolher a direção e Pôr o veículo a zero.\n' +
    'Funciona no Chrome ou no Edge, num Android ou num computador. No iPhone precisa do navegador Bluefy.\n' +
    'Se a caixa recusar o código, o Libell pede o código de quatro dígitos da caixa.',
  'help.targets.h': 'Alvos e som',
  'help.targets.t':
    'Guarde uma inclinação que queira, por exemplo para o ralo do duche, e alterne entre elas.\n' +
    'Caravana: guarde a altura de engate antes de desengatar, e Ir à altura de engate leva a roda de apoio de volta a ela.\n' +
    'Com a orientação falada ligada, a app diz que roda levantar e quanto, para que possa nivelar sem ver o telemóvel.\n' +
    'O botão no meio da barra inferior liga e desliga o som.',
  'help.trouble.h': 'Se algo não estiver bem',
  'help.trouble.t':
    '«A medir…»: o veículo está a balançar. Espere até estar parado.\n' +
    '«Pouse o telemóvel deitado para medir»: o telemóvel está demasiado inclinado para medir.\n' +
    '«Perdeu-se o contacto com a caixa»: toque em Religar e escolha a caixa na lista.\n' +
    '«A aguardar o sensor de inclinação…»: ainda sem leituras. No iPhone, toque em Iniciar sempre que abrir a app; caso contrário, recarregue.\n' +
    '«O acesso ao movimento foi recusado»: permita movimento e orientação para este site nas definições do navegador e recarregue.\n' +
    'Continua errado? Escreva um relatório em Opinião.',
  'help.open': 'Abrir {name}',
  'help.open.sensor': 'Abrir a caixa',
  'help.open.feedback': 'Escrever relatório',

  'main.hint': 'Pouse o telemóvel deitado dentro do veículo, com o topo virado para a frente.',
  'main.start': 'Iniciar',
  'main.waiting': 'A aguardar o sensor de inclinação…',
  'main.level': 'O seu veículo está nivelado!',
  'main.denied':
    'O acesso ao movimento foi recusado, por isso o Libell não consegue ler a inclinação. Permita o acesso a movimento e orientação para este site e recarregue.',
  'main.noSensors':
    'Este dispositivo não disponibiliza sensores de movimento, por isso o Libell não consegue ler a inclinação.',
  'main.https':
    'O Libell precisa de uma ligação segura (HTTPS) para ler os sensores de inclinação. Abra a app por HTTPS e tente de novo.',

  'diagram.aria': 'Vista de cima da sua autocaravana, com as rodas que é preciso levantar',
  'diagram.caravan.aria': 'Vista de cima da sua caravana, com as rodas do eixo e a roda de apoio',
  'diagram.front': 'Frente',
  'diagram.step': 'Degrau {n}',
  'diagram.driveUp': 'Subir',
  'diagram.done': 'Feito',
  'diagram.noRamp': 'Sem rampa',
  'diagram.wheel.frontLeft': 'Frente esquerda',
  'diagram.wheel.frontRight': 'Frente direita',
  'diagram.wheel.rearLeft': 'Trás esquerda',
  'diagram.wheel.rearRight': 'Trás direita',
  'diagram.notEnough': 'não chega',
  'diagram.speech.wheel': '{wheel}: {instruction}',
  'caravan.crankUp': 'Manivela acima',
  'caravan.crankDown': 'Manivela abaixo',
  'caravan.axleLeft': 'Roda esquerda do eixo',
  'caravan.axleRight': 'Roda direita do eixo',
  'caravan.jockeyWheel': 'Roda de apoio',
  'help.screen.caravan':
    'Caravana: a roda de apoio diz Manivela acima ou Manivela abaixo, e quanto.',

  'vehicles.title': 'Veículos',
  'vehicles.defaultName': 'O meu veículo',
  'vehicles.numbered': 'Veículo {n}',
  'vehicles.name.placeholder': 'Nome (ex. «Caravana»)',
  'vehicles.name.label': 'Nome do veículo',
  'vehicles.add': 'Novo veículo',
  'namePrompt.save': 'Guardar',
  'namePrompt.cancel': 'Cancelar',
  'choice.rename': 'Mudar o nome de {name}',
  'vehicles.badge': 'Veículo: {name}',
  'vehicles.delete': 'Remover {name}',
  'vehicles.remove.confirm': 'Remover {name} com o zero do veículo, alvos e caixa de sensor?',
  'vehicles.remove.yes': 'Sim, remover',
  'vehicles.hint':
    'As medidas, as rampas, o zero do veículo, os alvos e a caixa de sensor pertencem ao veículo. A calibração do telemóvel é partilhada.',
  'setup.incoming.addNew': 'Juntar como novo veículo',

  'hitch.title': 'Altura de engate',
  'hitch.hint':
    'Guarde-a enquanto a caravana ainda está na bola de engate. Antes de voltar a engatar, a roda de apoio mostra quanto rodar a manivela para a cabeça de engate encontrar a bola.',
  'hitch.save': 'Guardar altura',
  'hitch.go': 'Ir à altura de engate',
  'hitch.done': 'Feito',
  'hitch.savedNow': 'Altura de engate guardada.',
  'hitch.status.none': 'Ainda não há altura de engate guardada.',
  'hitch.status.saved': 'Há uma altura de engate guardada.',
  'hitch.status.active': 'O ecrã principal mostra quanto rodar a manivela da roda de apoio.',
  'hitch.badge': 'Engate',
  'hitch.badge.aria': 'Altura de engate: toque para voltar a nivelar normalmente',
  'hitch.crank.up': 'Subir {amount} com a manivela até à altura de engate',
  'hitch.crank.down': 'Baixar {amount} com a manivela até à altura de engate',
  'hitch.reached': 'Na altura de engate',
  'hitch.offer': 'Guardar primeiro a altura de engate?',
  'hitch.offer.save': 'Guardar',
  'hitch.offer.dismiss': 'Agora não',

  'zeroTrim.title': 'Afinar o zero',
  'zeroTrim.hint':
    'Ainda não está bem nivelado? Cada toque desloca o zero 0,1°, para que a app queira esse lado mais alto.',
  'zeroTrim.left': 'Esq. acima',
  'zeroTrim.right': 'Dir. acima',
  'zeroTrim.front': 'Frente acima',
  'zeroTrim.back': 'Trás acima',
  'zeroTrim.side.left': 'Esq.',
  'zeroTrim.side.right': 'Dir.',
  'zeroTrim.side.front': 'Frente',
  'zeroTrim.side.back': 'Trás',
  'zeroTrim.total': 'Afinado: {trim}',
  'zeroTrim.none': 'Não afinado',
  'zeroTrim.reset': 'Repor afinação',

  'tilt.frontBack': 'Frente/trás',
  'tilt.sideSide': 'Lado/lado',
  'pose.layFlat': 'Pouse o telemóvel deitado para medir',
  'pose.sensorHint': 'Só mede bem deitada, com o topo para cima.',
  'pose.openSensorPage': 'Ver a caixa',
  'pose.sensorExtreme': 'A caixa está demasiado inclinada',
  'pose.sensorUpsideDown': 'A caixa parece estar ao contrário',
  'pose.sensorNotUpright': 'A caixa está deitada',
  'pose.sensorHintUpright': 'Só mede bem de pé.',
  'calibration.external.h': 'Pôr o veículo a zero',
  'calibration.external.intro': 'Nivele o veículo uma vez com um nível de bolha e ponha a zero.',
  'calibration.external.phoneHidden':
    'A calibração do próprio telemóvel fica oculta enquanto a caixa de sensor mede. Para calibrar o telemóvel, abra a caixa e toque primeiro em «{disconnect}».',
  'calibration.external.working': 'A pôr a zero…',
  'calibration.external.done': '{name} está a zero: esta posição conta agora como nivelada.',
  'calibration.external.err.notConnected': '{name} não está ligado. Ligue-o e tente de novo.',
  'calibration.external.err.failed':
    'Não foi possível pôr {name} a zero. Nada foi alterado. Verifique a ligação e tente de novo.',
  'pose.portrait': 'Rode o telemóvel para a vertical — o topo tem de apontar para a frente',
  'stale.dataUnavailable': 'Sem dados novos do sensor — a orientação fica em pausa até voltarem',
  'sensorFallback.lost': 'Perdeu-se o contacto com a caixa',
  'sensorFallback.autoRetry': 'A tentar de novo automaticamente…',
  'sensorFallback.connect': 'Ligue a caixa',
  'sensorFallback.pick': 'Toque e escolha a sua caixa na lista.',
  'sensorFallback.notFound': 'Não encontra a caixa? Verifique se está ligada e perto.',
  'sensorFallback.retry': 'Religar',
  'sensorFallback.usePhone': 'Usar o telemóvel',
  'mounting.prompt.upright':
    'Toque no lado para onde aponta a traseira da caixa (o suporte do parafuso).',
  'mounting.prompt.arrow':
    'Uma das setas da caixa (na tampa, ou na placa de circuito por baixo) aponta para a frente. Que lado fica virado para a frente?',
  'mounting.placement.wide': 'Lado longo à frente',
  'mounting.placement.short': 'Lado curto à frente',
  'mounting.facing.front': 'Aponta para a frente',
  'mounting.facing.right': 'Aponta para a direita',
  'mounting.facing.rear': 'Aponta para trás',
  'mounting.facing.left': 'Aponta para a esquerda',
  'box.state.connected': 'Ligada',
  'box.state.lost': 'Contacto perdido',
  'box.state.password': 'Código errado',
  'box.password.label': 'Código da caixa',
  'box.password.retry': 'Tentar de novo',
  'box.password.checking': 'A testar o código…',
  'box.password.invalid': 'O código tem quatro dígitos.',
  'box.password.wrong': 'A caixa também não aceitou esse código.',
  'box.password.noAnswer':
    'A caixa não respondeu. O código fica guardado e é testado da próxima vez que a caixa ligar.',
  'box.state.notConnected': 'Desligada',
  'box.state.battery': 'bateria {value}',
  'box.connect': 'Ligar',
  'box.step.position.upright.ok': 'De pé',
  'box.step.position.upright.bad': 'Deitada: ponha-a de pé, virada para qualquer lado',
  'box.step.position.flat.ok': 'Deitada',
  'box.step.position.flat.bad': 'Demasiado inclinada: deite-a, com o topo para cima',
  'box.step.position.flat.upsideDown':
    'Ao contrário: vire-a com a tampa para cima. O fabricante desaconselha montá-la ao contrário.',
  'box.step.position.waiting': 'Posição: à espera',
  'box.step.direction.todo': 'Escolher a direção',
  'box.step.direction.done': 'Direção definida',
  'box.step.direction.learn': 'Dúvidas? Aprenda-a levantando a frente',
  'box.step.zero.todo': 'Pôr o veículo a zero',
  'box.step.zero.done': 'Posto a zero',
  'box.step.zero.hint': 'Nivele o veículo com um nível de bolha e depois ponha a zero.',
  'box.forgetDirection': 'Esquecer a direção',
  'onboard.boxPosition.h': 'Posição da caixa',
  'onboard.boxPosition.later':
    'A direção e o zero definem-se na primeira vez que estacionar. A página da caixa guia-o, e a luz ⚠ Pôr a zero lembra-o até estar feito.',
  'onboard.boxPosition.notConnected':
    'Ainda não há nenhuma caixa ligada, por isso a posição não pode ser mostrada. Toque em «{next}» e ligue-a mais tarde com o ícone do sensor no canto superior direito.',
  'sensorList.title': 'Caixa de sensor',
  'sensorList.phone': 'É usado o sensor do próprio telemóvel quando nenhuma caixa está ligada.',
  'box.step.zero.again': 'Pôr a zero de novo',
};
