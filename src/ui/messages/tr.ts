import type { Messages } from './en';

/** Turkish. */
export const tr: Messages = {
  'topbar.install': 'Yükle',
  'topbar.share': 'Libell’i paylaş',
  'bottombar.settings': 'Ayarlar',
  'bottombar.sound.mute': 'Sesi kapat',
  'bottombar.sound.unmute': 'Sesi aç',
  'bottombar.help': 'Yardım',
  'bottombar.label': 'İşlemler',
  'share.text': 'Motokaravanınızı veya karavanınızı telefonunuzla seviyeleyin.',
  'share.copied': 'Bağlantı kopyalandı!',
  'update.check': 'Yeni sürümü kontrol et',
  'update.checking': 'Güncellemeler kontrol ediliyor…',
  'update.updating': 'Yeni sürüme güncelleniyor…',
  'update.latest': 'En son sürümü kullanıyorsunuz',
  'update.offline': 'Bağlantı yok, güncellemeler kontrol edilemiyor',
  'update.unsupported': 'Güncellemeler burada kullanılamıyor',
  'install.hint': 'Paylaş’a, ardından “Ana Ekrana Ekle”ye dokunun.',
  'install.row': 'Libell’i ana ekrana uygulama olarak yükleyin.',
  'install.close': 'Gizle',
  'share.vehicle.text': 'Libell için araç ayarlarım — ölçüler ve takozlar.',
  'settings.shareVehicle': 'Başka telefona gönder',
  'setup.incoming.h': 'Gelen araç ayarları',
  'setup.incoming.intro': 'Bir aile üyeniz bu araç ölçülerini sizinle paylaştı:',
  'setup.incoming.reminder':
    'Buna kalibrasyon dahil değildir — bu telefonu yine de kendiniz kalibre etmeniz gerekir.',
  'setup.incoming.apply': 'Mevcut aracı değiştir',
  'setup.incoming.dismiss': 'Sonra',
  'setup.incoming.invalid': 'Araç ayarı bağlantısı okunamadı — hiçbir şey değiştirilmedi.',

  'lamp.setup': '⚠ Ölçüler',
  'lamp.setup.title': 'Araç ölçüleri hiç kaydedilmedi — Ayarlar’ı açmak için dokunun',
  'lamp.calibrate': '⚠ Kalibre et',
  'lamp.zero': '⚠ Sıfırla',
  'lamp.calibrate.title':
    'Telefon kalibre edilmedi — “Kalibre et ve sıfırla” sayfasını açmak için dokunun',
  'lamp.zero.title': 'Araç sıfırlanmadı — “Kalibre et ve sıfırla” sayfasını açmak için dokunun',
  'lamp.calibrate.title.sensor': 'Kutu sıfırlanmadı — kutuyu açmak için dokunun',
  'sensorStatus.connected': 'Sensör kutusu bağlı',
  'sensorStatus.disconnected': 'Sensör kutusu — bağlantı koptu, ayrıntılar için dokunun',
  'sensorStatus.stale': 'Sensör kutusu — yeni veri yok, ayrıntılar için dokunun',
  'sensorStatus.idle': 'Sensör kutusu — bağlanmak için dokunun',
  'sensorStatus.idle.guide': 'Sensör kutusu — iPhone kurulum rehberi için dokunun',
  'menu.title': 'Menü',
  'menu.close': 'Menüyü kapat',
  'menu.settings': 'Ayarlar',
  'menu.calibration': 'Kalibre et ve sıfırla',
  'menu.targets': 'Hedefler',
  'menu.feedback': 'Geri bildirim',
  'menu.help': 'Yardım',
  'menu.intro': 'Tanıtımı göster',
  'menu.about': 'Libell hakkında',
  'menu.about.tab': 'Hakkında',
  'menu.sensorSource': 'Sensör kutusu',
  'sensorSource.connect': '{name} sensörünü bağla',
  'sensorSource.disconnect': 'Bağlantıyı kes',
  'sensorSource.status.connecting': 'Bağlanıyor…',
  'sensorSource.err.unsupported': 'Bu tarayıcı Web Bluetooth’u desteklemiyor.',
  'sensorSource.unsupported.browser':
    'Bir sensör kutusu bağlamak için Libell’i Android’de veya bilgisayarda Chrome ya da Edge ile açın. Telefonun kendi sensörü burada her zamanki gibi çalışır.',
  'sensorSource.err.password':
    '{name} kutusu parolasını kabul etmedi. Kutunun dört haneli kodunu aşağıya yazın ve “Tekrar dene”ye dokunun. Fabrika kodu 0000’dır. Kodu bilmiyorsanız Xparkle uygulamasında değiştirin.',
  'sensorSource.err.failed': '{name} sensörüne bağlanılamadı.',
  'sensorSource.ios.intro':
    'Safari Bluetooth sensörlerine doğrudan bağlanamaz, ama bir çözüm yolu var:',
  'sensorSource.ios.step1': '“Bluefy – Web Bluetooth Browser” uygulamasını App Store’dan yükleyin.',
  'sensorSource.ios.step2': 'Bluefy’ı açın ve Bluetooth iznini verin.',
  'sensorSource.ios.step3': 'Bluefy’da aynı Libell adresine gidin.',
  'sensorSource.ios.step4':
    '“Sensör kutusu” sayfasını burada yeniden açın — Android’deki gibi çalışır.',
  'sensorSource.ios.note':
    'Bluefy, Libell tarafından yapılmamış üçüncü taraf bir uygulamadır — uygulamayı açtığınızda yeniden bağlanma sessizce olmayabilir, orada bir kez elle dokunmanız gerekebilir.',
  'sensorSource.ios.bluefyLink': 'Bluefy’ı App Store’da bul',
  'sensorSource.detail.temperature': 'Sıcaklık: {value}',
  'sensorSource.detail.notAvailable': 'Henüz yok',
  'sensorSource.lowBattery':
    '⚠ Pil zayıf ({value}) — sensör kutusunun pilini yakında değiştirmeyi düşünün.',
  'sensorSource.install.now': 'Sıfırla',
  'sensorSource.install.clear': 'Sıfırı unut',
  'sensorSource.install.status': 'Sıfır: ön/arka {pitch}, sağ/sol {roll}.',
  'sensorSource.install.status.none': 'Henüz sıfırlanmadı — kutu durduğu gibi ölçüyor.',
  'sensorSource.learn.h': 'Montajı öğren',
  'sensorSource.learn.intro':
    'Libell yönü iki kaldırmadan öğrenir: önce ön taraf, sonra sağ taraf.',
  'sensorSource.learn.start': 'Montajı öğren',
  'sensorSource.learn.step.front': 'Aracın önünü birkaç santimetre kaldırın, sonra düğmeye basın.',
  'sensorSource.learn.capture.front': 'Ön kaldırıldı',
  'sensorSource.learn.step.right':
    'Önü yeniden indirin. Şimdi sağ tarafı birkaç santimetre kaldırın, sonra düğmeye basın.',
  'sensorSource.learn.capture.right': 'Sağ taraf kaldırıldı',
  'sensorSource.learn.cancel': 'İptal',
  'sensorSource.learn.status.learned': 'Montaj öğrenildi.',
  'sensorSource.learn.status.none': 'Montaj öğrenilmedi — kutunun kendi yönleri kullanılıyor.',
  'sensorSource.learn.done':
    'Tamam! Kontrol edin: önü kaldırınca Libell arka tekerlekleri göstermeli.',
  'sensorSource.learn.err.tooSmall':
    'Araç neredeyse hiç hareket etmedi. Biraz daha kaldırıp tekrar deneyin.',
  'sensorSource.learn.err.ambiguous':
    'İki yön de yaklaşık aynı ölçüde hareket etti. Önce yalnızca önü, sonra yalnızca sağ tarafı kaldırıp tekrar deneyin.',
  'sensorSource.learn.err.arrow':
    'Hiçbir ok ileriyi göstermiyor. Kutuyu oklarından biri ileriyi gösterecek şekilde döndürüp tekrar deneyin.',
  'sensorSource.learn.err.mirrored':
    'Kutu ters duruyor gibi ya da yanlış taraf kaldırıldı. Kontrol edip tekrar deneyin.',
  'sensorSource.learn.err.sameAxis':
    'İki kaldırma da aracı aynı yöne eğdi. Önce önü, sonra sağ tarafı kaldırıp tekrar deneyin.',
  'sensorStatus.title': '{name} sensörü',
  'sensorStatus.reading': 'Şu anki eğim: {value}',
  'sensorStatus.debug': 'Tanı bilgisi',
  'sensorStatus.debug.intro':
    'Doğrudan kutudan gelen ham değerler — bir şey çalışmıyorsa sorun gidermek için.',
  'sensorStatus.debug.state': 'Bağlantı durumu: {value}',
  'sensorStatus.debug.deviceId': 'Cihaz kimliği: {value}',
  'sensorStatus.debug.lastSample': 'Son örnek: {value}',
  'sensorStatus.debug.age': '{s} sn önce',
  'sensorStatus.debug.rawAccel': 'Ham ivmeölçer (x/y/z): {value}',
  'sensorStatus.debug.firmwareTier': 'Donanım yazılımı kuşağı: {value}',
  'sensorStatus.debug.rawStatusBytes': 'Ham durum baytları: {value}',
  'sensorStatus.debug.versionBytes': 'Seri numarası ve donanım yazılımı (ham): {value}',
  'sensorStatus.debug.copy': 'Bilgiyi kopyala',
  'sensorStatus.debug.copied': 'Tanı bilgisi kopyalandı!',
  'sensorStatus.debug.copy.failed': 'Otomatik kopyalanamadı.',
  'sensorStatus.advanced': 'Gelişmiş',
  'sensorStatus.silentReconnect.intro':
    'Bu tarayıcı kutuya henüz kendiliğinden yeniden bağlanamıyor, bu yüzden yeniden başlattıktan sonra kutuyu listeden tekrar seçersiniz. Chrome’da bunu kendiniz açabilirsiniz.',
  'sensorStatus.silentReconnect.steps':
    '{address} adresini açın, “web bluetooth” diye arayın, “Use the new permissions backend for Web Bluetooth” seçeneğini Enabled yapın ve Relaunch’a dokunun. Ardından kutuyu bir kez bağlayın.',
  'sensorStatus.silentReconnect.copy': 'Kopyala: {address}',
  'sensorStatus.silentReconnect.copied': 'Kopyalandı — Chrome’un adres çubuğuna yapıştırın.',
  'sensorStatus.debug.connectDelay.intro':
    'Deneysel: yalnızca kutunuzun bağlantısı güvenilmezse deneyin. Bağlandıktan sonra, uygulama okumaya başlamadan önce sabit bir bekleme ekler.',
  'sensorStatus.debug.connectDelay.enable': 'Bağlantı gecikmesini aç',
  'sensorStatus.debug.connectDelay.ms': 'Gecikme (ms)',

  'about.text':
    'Libell, motokaravanınızı veya karavanınızı zaten sahip olduğunuz telefonla, tahmin yürütmeden seviyelemenize yardımcı olur.',
  'about.version': 'Sürüm {v}',
  'about.offline':
    'Tamamen çevrimdışı çalışır — ağ yalnızca uygulamanın kendi güncellemelerini almak için kullanılır.',
  'about.privacy':
    'Her şey telefonunuzda kalır — hesap yok, izleme yok ve hiçbir veri cihazdan çıkmaz.',
  'about.source': 'Libell ücretsiz ve açık kaynaklıdır (MIT lisansı).',
  'about.source.link': 'GitHub’da kaynak kodu',

  'intro.h': 'Libell’e hoş geldiniz',
  'intro.how':
    'Telefonu araçta düz bırakın; Libell hangi tekerleklerin ne kadar yükseltileceğini gösterir.',
  'intro.start': 'Başlayın',
  'intro.later': 'Önce göz atın',
  'onboard.source.sensorIcon':
    'Sensör kutusu, sağ üstteki sensör simgesiyle istediğiniz zaman bağlanabilir.',
  'onboard.sound.h': 'Ses',
  'onboard.source.h': 'Nasıl ölçmek istiyorsunuz?',
  'onboard.source.intro':
    'Libell’in eğimi hangi sensörden okuyacağını seçin — çoğu kişi yalnızca telefonu kullanır.',
  'onboard.source.phone': 'Bu telefon',
  'onboard.source.externalActive':
    'Şu anda bir sensör kutusu etkin. Bu telefonu seçerseniz telefon kalibrasyonu atlanır. Telefonu kalibre etmek için önce sağ üstteki sensör simgesiyle kutuyu açın ve “{disconnect}” düğmesine dokunun.',
  'onboard.vehicle.h': 'Neyi seviyeliyorsunuz?',
  'onboard.vehicle.intro': 'Aracınızı seçin — rehberin geri kalanı ona göre uyarlanır.',
  'onboard.step1.h': 'Telefonu şöyle yerleştirin',
  'onboard.next': 'İleri',
  'onboard.back': 'Geri',
  'onboard.close': 'Tanıtımı kapat',
  'onboard.done': 'Bitti',
  'onboard.skipStep': 'Atla',
  'onboard.note.measurements':
    'Atlarsanız varsayılan ölçüler kullanılır; kendi ölçülerinizi kaydedene kadar {lamp} yanık kalır.',
  'onboard.note.ramps':
    'Atlarsanız varsayılan takozlar kullanılır. Kendi takozlarınızı daha sonra Ayarlar’dan seçebilirsiniz.',
  'onboard.note.calibrate':
    'Şu an düz bir yüzey yok mu? {next} düğmesine dokunun; iş bitene kadar {lamp} size hatırlatır.',
  'onboard.note.connect':
    'Kutu yanınızda değil mi? {next} düğmesine dokunun ve daha sonra sağ üstteki sensör simgesiyle bağlanın.',
  'onboard.zeroLater':
    'Aracı ilk kez düz bir zemine park ettiğinizde sıfırlarsınız. İş bitene kadar {lamp} size hatırlatır.',
  'onboard.legend.ok': 'Yeşil ✓ — o tekerlek düz.',
  'onboard.legend.up': 'Turuncu ↑ — o tekerleği gösterilen basamağa yukarı sürün.',
  'onboard.legend.no': 'Kırmızı ✕ — hiçbir basamak yetmiyor; daha düz bir yere geçin.',
  'onboard.legend.dim': 'Gri – — o tekerlekte takoz yok; sayı ne kadar eksik olduğunu gösterir.',

  'settings.wheelbase': 'Dingil mesafesi',
  'settings.trackFront': 'Ön iz genişliği',
  'settings.trackRear': 'Arka iz genişliği',
  'settings.tolerance': 'Tolerans',
  'settings.stability': 'Kararlılık',
  'settings.dwellRest': 'Tepki gecikmesi (ms)',
  'settings.dwellMotion': 'Ayar sırasında tepki gecikmesi (ms)',
  'settings.dwell.hint': 'Sayının değişmesi için bir ölçümün ne kadar sabit kalması gerektiği.',
  'settings.vehicle': 'Araç',
  'vehicle.motorhome': 'Motokaravan',
  'vehicle.caravan': 'Karavan',
  'settings.axleToJockey': 'Dingilden jokey tekerine',
  'settings.rearAxle': 'Arka dingil',
  'settings.axle': 'Dingil',
  'axle.single': 'Tek',
  'axle.boggie': 'Çift (tandem)',
  'settings.track': 'İz genişliği',
  'settings.measureHint': 'Ruhsatta yazar. Birkaç cm sapma önemli değil.',
  'settings.measureHint.caravan':
    'Dingilden jokey tekerine kadar ölçün. Birkaç cm sapma önemli değil.',
  'settings.measureHint.boggie': 'Çift dingilde, dingil çiftinin ortasına kadar ölçün.',
  'settings.steps': 'Basamak yükseklikleri',
  'settings.steps.add': 'Ekle',
  'settings.steps.new': 'Yeni basamak yüksekliği ({unit})',
  'settings.steps.remove': 'Kaldır: {value}',
  'settings.ramp': 'Hazır takoz',
  'settings.ramp.custom': 'Özel set',
  'settings.ramp.stepless': 'Basamaksız takoz',
  'settings.ramp.steplessModel': '{name} (basamaksız, en fazla {max} mm)',
  'settings.stepless.max': 'Basamaksız takoz, azami yükseklik',
  'settings.stepless.maxHeading': 'Azami yükseklik',
  'settings.stepless.set': 'Kaydet',
  'settings.stepless.new': 'Azami yükseklik ({unit})',
  'settings.rampCount': 'Takoz sayısı',
  'settings.drain': 'Tahliye tarafı',
  'settings.rampHint': 'Uygulama takozlarınızı en çok işe yarayacakları yere koyar.',
  'settings.drainHint': 'Tolerans içinde bu taraf en alçakta bırakılır, böylece su akar.',
  'settings.section.vehicle': 'Araç ve ölçüler',
  'settings.section.ramps': 'Takozlar',
  'settings.general': 'Genel',
  'settings.language': 'Dil',
  'settings.language.auto': 'Otomatik (cihaz dili)',
  'settings.tolerance.hint': 'Düze ne kadar yakın olunca düz sayılacağı.',
  'settings.stability.hint': 'Sayılar titremesin diye küçük sensör dalgalanmalarını yumuşatır.',
  'drain.none': 'Yok / fark etmez',
  'drain.left': 'Sol, orta',
  'drain.right': 'Sağ, orta',
  'drain.front': 'Ön, orta',
  'drain.rear': 'Arka, orta',
  'drain.frontLeft': 'Sol ön',
  'drain.frontRight': 'Sağ ön',
  'drain.rearLeft': 'Sol arka',
  'drain.rearRight': 'Sağ arka',
  'settings.unit': 'Uzunluk birimi',
  'settings.unitInches': 'inç (in)',
  'settings.theme': 'Tema',
  'theme.system': 'Telefona uy',
  'theme.light': 'Açık',
  'theme.dark': 'Koyu',
  'settings.appearance': 'Görünüm',
  'appearance.classic': 'Klasik',
  'appearance.modern': 'Modern',
  'appearance.glossy': 'Parlak',
  'settings.sound': 'Düz olunca ses çal',
  'settings.soundGuidance': 'Sürekli sesli yönlendirme',
  'settings.soundGuidance.help': 'Düze yaklaştıkça bip sesi hızlanır ve incelir.',
  'settings.soundSpeech': 'Sözlü yönlendirme',
  'settings.soundSpeech.help':
    'Araç hareketsizken uygulama hangi tekerleğin ne kadar kalkacağını söyler, örneğin “Sol arka, Basamak 2”.',
  'settings.soundSpeech.unavailable':
    'Sözlü yönlendirme bu telefonda çalışmıyor: çevrimdışı çalışan bir Türkçe ses yok. Bip sesleri her zamanki gibi çalışır.',
  'speech.level': 'Düz',
  'speech.inches': '{n} inç',
  'speech.inchOne': 'bir inç',
  'speech.inchOneAnd': 'bir tam {fraction} inç',
  'speech.inchesAnd': '{n} tam {fraction} inç',
  'speech.inchFraction': '{fraction} inç',
  'speech.eighth1': 'sekizde bir',
  'speech.eighth2': 'dörtte bir',
  'speech.eighth3': 'sekizde üç',
  'speech.eighth4': 'yarım',
  'speech.eighth5': 'sekizde beş',
  'speech.eighth6': 'dörtte üç',
  'speech.eighth7': 'sekizde yedi',
  'settings.undo': 'Geri al',
  'settings.saved': 'Kaydedildi',
  'settings.more': 'Diğer',
  'settings.fineTuning': 'İnce ayar',
  'settings.resetAll': 'Varsayılanlara dön',
  'settings.err.positive': '0’dan büyük bir sayı girin. Önceki değer geçerli kalır.',
  'settings.err.notNegative': '0 veya daha büyük bir sayı girin. Önceki değer geçerli kalır.',
  'settings.err.range': '{min} ile {max} arasında bir sayı girin. Önceki değer geçerli kalır.',
  'settings.tab.vehicle': 'Araç',
  'settings.tab.ramps': 'Takozlar',
  'settings.tab.level': 'Seviye',
  'settings.klossar.brandAll': 'Tümü',
  'settings.klossar.changeRamp': 'Takoz değiştir',
  'settings.rampCountHint': 'Uygulama onları en çok işe yarayacakları yere koyar.',
  'settings.klossar.selected': 'Seçili',
  'settings.klossar.stepsHeading': 'Basamak yükseklikleri',

  'status.measuring': 'Ölçülüyor…',
  'status.almost': 'Neredeyse düz — {left} kaldı',
  'status.cantLevel.close': 'Takozlarınız burada az farkla yetmiyor — aracın yerini değiştirin',
  'status.cantLevel.far': 'Takozlarınız burada çok yetersiz — aracın yerini değiştirin',
  'adjustable.before': 'Takozları gösterilen basamağa ayarlayın, sonra yukarı sürün.',
  'adjustable.after': 'Henüz düz değil. Aracı takozlardan indirin, uygulama yeniden ölçer.',

  'calibration.intro':
    'Telefonu düz olduğunu bildiğiniz bir yüzeye koyun, sonra “Kalibre et”e dokunun. Mevcut eğim referans noktası olur.',
  'calibration.status': 'Kalibre edildi: ön/arka {pitch}, sağ/sol {roll}.',
  'calibration.status.none': 'Kalibre edilmedi — ham sensör kullanılıyor.',
  'calibration.now': 'Kalibre et',
  'calibration.step.phone.done': 'Telefon kalibre edildi',
  'calibration.step.phone.hint': 'Telefonu düz bir şeyin üstüne koyun.',
  'calibration.step.flipLink': 'Düz yer yok mu? Telefonu döndür',
  'calibration.step.vehicle.done': 'Sıfırlandı',
  'calibration.step.vehicle.hint':
    'Aracı su terazisiyle seviyeleyin ve telefonu her zamanki yerine koyun.',
  'calibration.step.vehicle.now': 'Sıfırla',
  'calibration.clear': 'Kalibrasyonu sil',
  'calibration.err.notRunning':
    'Eğim sensörü henüz çalışmıyor — önce ana ekranda “Başlat”a dokunun.',
  'calibration.warn.notFlat':
    'Kalibrasyon kaydedildi, ama yüzey düz görünmüyor (15°’den fazla), yani muhtemelen yanlış. İstediğiniz bu değil mi? “Geri al”a dokunun, telefonu düz bir yüzeye koyun ve yeniden kalibre edin.',
  'calibration.undo': 'Geri al',
  'calibration.sensor.h': 'Telefon kalibrasyonu',
  'calibration.vehicle.h': 'Araç sıfırlama',
  'calibration.vehicle.intro':
    'Kalibrasyon telefonla ilgilidir, telefonun durduğu yerle değil. Masa biraz eğikse uygulama o eğimi gösterir. Aracı bir kez su terazisiyle seviyeleyin, telefonu her zamanki yerine koyun ve sıfırlayın.',
  'calibration.vehicle.now': 'Sıfırla',
  'calibration.vehicle.clear': 'Sıfırı unut',
  'calibration.vehicle.status': 'Araç sıfırı: ön/arka {pitch}, sağ/sol {roll}.',
  'calibration.vehicle.status.none': 'Araç sıfırı yok — telefonun yeri düz sayılıyor.',
  'calibration.vehicle.warn.notFlat':
    'Sıfır kaydedildi, ama düz görünmüyor (15°’den fazla). Araç düz değil miydi? “Geri al”a dokunun, aracı seviyeleyin ve yeniden sıfırlayın.',
  'calibration.age.today': '(bugün)',
  'calibration.age.days': '({n} gün önce)',
  'calibration.check': 'Kontrol',
  'calibration.check.good': 'Hâlâ iyi — sapma {off}°.',
  'calibration.check.off': 'Sapma {off}° — yeniden kalibre etmeyi düşünün.',
  'calibration.vehicle.check.off': 'Sapma {off}° — yeniden sıfırlamayı düşünün.',
  'calibration.check.none':
    'Henüz kalibre edilmedi, kontrol edilecek bir şey yok. Telefonu düz bir yüzeye koyun ve “{now}” düğmesine dokunun.',
  'calibration.vehicle.check.none':
    'Henüz sıfır yok, kontrol edilecek bir şey yok. Aracı su terazisiyle seviyeleyin ve “{now}” düğmesine dokunun.',
  'calibration.flip.intro':
    'Yakında düz bir yüzey yok mu? Döndürerek kalibrasyonu kullanın: telefonu makul ölçüde düz herhangi bir yere koyun, ölçün, telefonu aynı yerde yarım tur (180°) döndürün, yeniden ölçün — yüzeyin eğimi hesaptan kendiliğinden düşer.',
  'calibration.flip.start': 'Döndürerek kalibre et',
  'calibration.flip.rotate':
    'Şimdi telefonu aynı yerde yarım tur (180°) döndürün, sonra “Ölç”e dokunun.',
  'calibration.flip.capture': 'Ölç',
  'calibration.flip.done': 'Tamam! Yüzeyiniz {surface}° eğik — hesaptan düşüldü.',
  'calibration.flip.warn.moved':
    'Kalibrasyon kaydedildi, ama iki ölçüm arasında 15°’den fazla fark var. Telefon kıpırdadı mı? “Geri al”a dokunun ve baştan başlayın.',
  'calibration.pill.notDone': 'BEKLİYOR',
  'calibration.pill.done': 'TAMAM',
  'calibration.pill.none': 'YOK',

  'targets.normal': 'Normal (düz)',
  'targets.name.placeholder': 'Ad (ör. “Duş gideri”)',
  'targets.name.label': 'Yeni hedefin adı',
  'targets.defaultName': 'Hedef {n}',
  'targets.add': 'Eğimi yeni hedef olarak kaydet',
  'targets.delete': 'Sil: {name}',
  'targets.warn.tooSteep':
    'Hedef kaydedildi, ama normal bir hedeften daha dik (15°’den fazla). İstediğiniz bu değil mi? Çarpıyla silip yeniden kaydedin.',
  'targets.badge': 'Hedef: {name}',

  'feedback.intro':
    'Bir sorun mu buldunuz ya da bir fikriniz mi var? Formu doldurup düğmeye dokunun — GitHub’da hazır bir rapor açılır, onu orada gönderirsiniz (bir dakikada açılan ücretsiz bir GitHub hesabı gerekir).',
  'feedback.category': 'Konu nedir?',
  'feedback.cat.bug': 'Hata',
  'feedback.cat.suggestion': 'Öneri',
  'feedback.cat.other': 'Diğer',
  'feedback.title': 'Kısa başlık',
  'feedback.desc': 'Ne oldu ya da ne istiyorsunuz?',
  'feedback.submit': 'Raporu GitHub’da aç',
  'feedback.warn.title': 'Başlık boş — raporu yine de gönderebilirsiniz.',
  'feedback.warn.desc': 'Açıklama boş — raporu yine de gönderebilirsiniz.',
  'feedback.warn.both': 'Başlık ve açıklama boş — raporu yine de gönderebilirsiniz.',

  'help.screen.h': 'Ekran nasıl okunur',
  'help.screen.lead':
    'Ekran hangi tekerleklerin ne kadar kaldırılacağını gösterir. Basamak 2, takozunuzun ikinci basamağı demektir.',
  'help.screen.t':
    'Yeşil ✓: tamam, yapacak bir şey yok.\n' +
    'Turuncu ↑: o tekerleği yanında gösterilen basamağa yukarı sürün.\n' +
    'Kırmızı ✕: takozlarınız burada yetmiyor. Aracın yerini değiştirin.\n' +
    'Gri –: o tekerlekte takoz yok. Altına başka bir şey koymak isterseniz sayı ne kadar eksik olduğunu gösterir.\n' +
    'Kabarcık ortada durduğunda araç düzdür.',
  'help.screen.routine':
    'Yukarı sürün, araç hareketsiz kalana kadar bekleyin ve tekrar bakın. Bütün tekerlekler yeşil olana kadar tekrarlayın.',
  'help.what.t':
    'Telefonu araçta düz yatırın, üst kenarı öne doğru, her seferinde aynı yere.\n' +
    'Sensör kutusuyla telefonun nasıl durduğu fark etmez.',
  'help.settings.h': 'Ölçüler',
  'help.measures.h': 'Ölçüleri girin',
  'help.settings.t':
    'Libell her tekerleğin ne kadar kalkması gerektiğini dingil mesafesi ve iz genişliğinden hesaplar.\n' +
    'Bunlar araç belgelerinde yazar; ya da şeritmetreyle ölçün.\n' +
    'Onları “Uzunluk birimi” altında ne seçtiyseniz ona göre mm, cm ya da inç olarak girin.\n' +
    'Karavanda dingil mesafesi, dingilden jokey tekerine olan mesafedir.\n' +
    'Birden çok aracınız varsa her biri kendi ölçülerini, takozlarını, araç sıfırını, hedeflerini ve sensör kutusunu saklar; “Araç” sekmesinin üstünden birini seçin.',
  'help.ramps.t':
    'Ekran her tekerleğin takozunuzun hangi basamağına yukarı sürüleceğini söyler, bu yüzden yanınızdaki takozları girin.\n' +
    'Hazır bir takoz ya da özel bir set seçin ve kaç tane olduğunu belirtin. Libell onları en çok işe yarayacakları yere koyar.\n' +
    'Basamaksız bir takoz için “Basamaksız takoz”u seçin ve yüksekliğini girin. Ekran o zaman ne kadar yukarı sürüleceğini söyler.',
  'help.calibration.h': 'Kalibre et ve sıfırla',
  'help.calibration.t':
    'Doğru ölçüm için iki adım gerekir: telefonu bir kez kalibre edin ve aracı bir kez sıfırlayın.\n' +
    'Kalibre etmek: telefonu düz bir yüzeye koyun ve “Kalibre et”e dokunun.\n' +
    'Sıfırlamak: aracı su terazisiyle seviyeleyin, telefonu her zamanki yerine koyun ve “Sıfırla”ya dokunun.\n' +
    'Sensör kutusuyla sıfırlamayı kutunun sayfasında yaparsınız. Kutunun kalibrasyona ihtiyacı yoktur.\n' +
    'Hâlâ tam düz değil mi? “Araç sıfırlama” bölümünde “Sol yukarı”, “Sağ yukarı”, “Ön yukarı” veya “Arka yukarı” ile sıfıra ince ayar yapın.\n' +
    'İş bitene kadar ⚠ Kalibre et veya ⚠ Sıfırla lambası yanık kalır.',
  'help.sensor.h': 'Sensör kutusu',
  'help.sensor.t':
    'Araçtaki bir sensör kutusu telefonun yerine ölçüm yapabilir. Libell şunlarla çalışır:\n' +
    '{upright}: dik durur, yönü fark etmez.\n' +
    '{flat}: düz yatar, kapağı yukarıda, oklarından biri ileriyi gösterir.\n' +
    'Sağ üstteki sensör simgesiyle bağlanın. Ardından kutunun sayfası sizi “Yönü seç” ve “Araç sıfırlama” adımlarından geçirir.\n' +
    'Android’de veya bilgisayarda Chrome ya da Edge ile çalışır. iPhone’da Bluefy tarayıcısı gerekir.\n' +
    'Kutu kodu reddederse Libell kutunun dört haneli kodunu sorar.',
  'help.targets.h': 'Hedefler ve ses',
  'help.targets.t':
    'İstediğiniz bir eğimi, örneğin duş giderine doğru, kaydedin ve hedefler arasında geçiş yapın.\n' +
    'Karavan: ayırmadan önce bağlama yüksekliğini kaydedin; “Yüksekliğe dön” jokey tekerini oraya geri yönlendirir.\n' +
    'Sözlü yönlendirme açıkken uygulama hangi tekerleğin ne kadar kalkacağını söyler, böylece telefona bakmadan seviyeleyebilirsiniz.\n' +
    'Alt çubuğun ortasındaki düğme sesi açar ve kapatır.',
  'help.trouble.h': 'Bir sorun varsa',
  'help.trouble.t':
    '“Ölçülüyor…”: araç sallanıyor. Hareketsiz kalana kadar bekleyin.\n' +
    '“Ölçmek için telefonu düz yatırın”: telefon ölçüm için fazla eğik.\n' +
    '“Kutuyla bağlantı koptu”: “Tekrar bağlan”a dokunun ve listeden kutuyu seçin.\n' +
    '“Eğim sensörü bekleniyor…”: henüz ölçüm yok. iPhone’da uygulamayı her açtığınızda “Başlat”a dokunun; aksi halde sayfayı yeniden yükleyin.\n' +
    '“Hareket erişimi reddedildi”: tarayıcı ayarlarından bu site için hareket ve yön erişimine izin verin ve sayfayı yeniden yükleyin.\n' +
    'Hâlâ sorun mu var? “Geri bildirim” altında bir rapor yazın.',
  'help.open': 'Aç: {name}',
  'help.open.sensor': 'Sensör kutusunu aç',
  'help.open.feedback': 'Rapor yaz',

  'main.hint': 'Telefonunuzu aracın içinde düz yatırın, üst kenarı öne doğru.',
  'main.start': 'Başlat',
  'main.waiting': 'Eğim sensörü bekleniyor…',
  'main.level': 'Aracınız düz!',
  'main.denied':
    'Hareket erişimi reddedildi, bu yüzden Libell eğimi okuyamıyor. Bu site için hareket ve yön erişimine izin verin ve sayfayı yeniden yükleyin.',
  'main.noSensors':
    'Bu cihaz hareket sensörlerine erişim sunmuyor, bu yüzden Libell eğimi okuyamıyor.',
  'main.https':
    'Libell’in eğim sensörlerini okuyabilmesi için güvenli bağlantı (HTTPS) gerekir. Uygulamayı HTTPS üzerinden açıp tekrar deneyin.',

  'diagram.aria':
    'Motokaravanınızın kuşbakışı görünümü; hangi tekerleklerin kaldırılması gerektiğini gösterir',
  'diagram.caravan.aria':
    'Karavanınızın kuşbakışı görünümü; dingil tekerleklerini ve jokey tekerini gösterir',
  'diagram.front': 'Ön',
  'diagram.step': 'Basamak {n}',
  'diagram.driveUp': 'Yukarı sür',
  'diagram.done': 'Tamam',
  'diagram.noRamp': 'Takoz yok',
  'diagram.wheel.frontLeft': 'Sol ön',
  'diagram.wheel.frontRight': 'Sağ ön',
  'diagram.wheel.rearLeft': 'Sol arka',
  'diagram.wheel.rearRight': 'Sağ arka',
  'diagram.notEnough': 'yetmiyor',
  'diagram.speech.wheel': '{wheel}: {instruction}',

  'caravan.crankUp': 'Yukarı çevir',
  'caravan.crankDown': 'Aşağı çevir',
  'caravan.axleLeft': 'Sol dingil tekerleği',
  'caravan.axleRight': 'Sağ dingil tekerleği',
  'caravan.jockeyWheel': 'Jokey tekeri',
  'help.screen.caravan':
    'Karavan: jokey tekeri “Yukarı çevir” ya da “Aşağı çevir” der ve ne kadar olduğunu gösterir.',

  'vehicles.title': 'Araçlar',
  'vehicles.defaultName': 'Aracım',
  'vehicles.numbered': 'Araç {n}',
  'vehicles.name.placeholder': 'Ad (ör. “Karavan”)',
  'vehicles.name.label': 'Araç adı',
  'vehicles.add': 'Yeni araç',
  'namePrompt.save': 'Kaydet',
  'namePrompt.cancel': 'İptal',
  'choice.rename': 'Yeniden adlandır: {name}',
  'vehicles.badge': 'Araç: {name}',
  'vehicles.delete': 'Kaldır: {name}',
  'vehicles.remove.confirm':
    '{name} araç sıfırı, hedefleri ve sensör kutusuyla birlikte kaldırılsın mı?',
  'vehicles.remove.yes': 'Evet, kaldır',
  'vehicles.hint':
    'Ölçüler, takozlar, araç sıfırı, hedefler ve sensör kutusu araca aittir. Telefonun kalibrasyonu ortaktır.',
  'setup.incoming.addNew': 'Yeni araç olarak ekle',

  'hitch.title': 'Bağlama yüksekliği',
  'hitch.hint':
    'Karavan henüz çeki topundayken kaydedin. Yeniden bağlamadan önce jokey tekeri, kaplinin topa oturması için ne kadar çevireceğinizi gösterir.',
  'hitch.save': 'Yüksekliği kaydet',
  'hitch.go': 'Yüksekliğe dön',
  'hitch.done': 'Bitti',
  'hitch.savedNow': 'Bağlama yüksekliği kaydedildi.',
  'hitch.status.none': 'Henüz bağlama yüksekliği kaydedilmedi.',
  'hitch.status.saved': 'Bir bağlama yüksekliği kayıtlı.',
  'hitch.status.active': 'Ana ekran jokey tekerini ne kadar çevireceğinizi gösteriyor.',
  'hitch.badge': 'Bağlama modu',
  'hitch.badge.aria': 'Bağlama yüksekliği: normal seviyelemeye dönmek için dokunun',
  'hitch.crank.up': 'Bağlama yüksekliği için {amount} yukarı çevirin',
  'hitch.crank.down': 'Bağlama yüksekliği için {amount} aşağı çevirin',
  'hitch.reached': 'Bağlama yüksekliğinde',
  'hitch.offer': 'Önce bağlama yüksekliği kaydedilsin mi?',
  'hitch.offer.save': 'Kaydet',
  'hitch.offer.dismiss': 'Sonra',

  'zeroTrim.title': 'Sıfıra ince ayar',
  'zeroTrim.hint':
    'Hâlâ tam düz değil mi? Her dokunuş sıfırı 0,1° kaydırır, böylece uygulama o tarafı daha yüksek ister.',
  'zeroTrim.left': 'Sol yukarı',
  'zeroTrim.right': 'Sağ yukarı',
  'zeroTrim.front': 'Ön yukarı',
  'zeroTrim.back': 'Arka yukarı',
  'zeroTrim.side.left': 'Sol',
  'zeroTrim.side.right': 'Sağ',
  'zeroTrim.side.front': 'Ön',
  'zeroTrim.side.back': 'Arka',
  'zeroTrim.total': 'İnce ayar: {trim}',
  'zeroTrim.none': 'İnce ayar yok',
  'zeroTrim.reset': 'İnce ayarı kaldır',

  'tilt.frontBack': 'Ön/arka',
  'tilt.sideSide': 'Sağ/sol',

  'pose.layFlat': 'Ölçmek için telefonu düz yatırın',
  'pose.sensorHint': 'Yalnızca düz yatarken, üstü yukarıdayken doğru ölçer.',
  'pose.openSensorPage': 'Kutuyu göster',
  'pose.sensorExtreme': 'Kutu fazla eğik',
  'pose.sensorUpsideDown': 'Kutu ters duruyor gibi',
  'pose.sensorNotUpright': 'Kutu yatık duruyor',
  'pose.sensorHintUpright': 'Yalnızca dik dururken doğru ölçer.',

  'calibration.external.h': 'Araç sıfırlama',
  'calibration.external.intro': 'Aracı bir kez su terazisiyle seviyeleyin, sonra sıfırlayın.',
  'calibration.external.phoneHidden':
    'Sensör kutusu ölçüm yaparken telefonun kendi kalibrasyonu gizlenir. Telefonu kalibre etmek için önce kutuyu açın ve “{disconnect}” düğmesine dokunun.',
  'calibration.external.working': 'Sıfırlanıyor…',
  'calibration.external.done': '{name} sıfırlandı: bu konum artık düz sayılıyor.',
  'calibration.external.err.notConnected': '{name} bağlı değil. Bağlayıp tekrar deneyin.',
  'calibration.external.err.failed':
    '{name} sıfırlanamadı. Hiçbir şey değiştirilmedi. Bağlantıyı kontrol edip tekrar deneyin.',

  'pose.portrait': 'Telefonu dikey konuma getirin — üst kenar öne bakmalı',
  'stale.dataUnavailable': 'Yeni sensör verisi yok — veri gelene kadar yönlendirme duraklatıldı',

  'sensorFallback.lost': 'Kutuyla bağlantı koptu',
  'sensorFallback.autoRetry': 'Otomatik olarak yeniden deneniyor…',
  'sensorFallback.connect': 'Kutuyu bağlayın',
  'sensorFallback.pick': 'Dokunun ve listeden kutunuzu seçin.',
  'sensorFallback.notFound': 'Kutu bulunamadı mı? Açık ve yakında olduğunu kontrol edin.',
  'sensorFallback.retry': 'Tekrar bağlan',
  'sensorFallback.usePhone': 'Telefonu kullan',

  'mounting.prompt.upright': 'Kutunun arkasının (vida bağlantısı) baktığı yöne dokunun.',
  'mounting.prompt.arrow':
    'Kutunun oklarından biri (kapakta ya da altındaki devre kartında) ileriyi gösterir. Hangi kenar öne bakıyor?',
  'mounting.placement.wide': 'Uzun kenar önde',
  'mounting.placement.short': 'Kısa kenar önde',
  'mounting.facing.front': 'Öne bakıyor',
  'mounting.facing.right': 'Sağa bakıyor',
  'mounting.facing.rear': 'Arkaya bakıyor',
  'mounting.facing.left': 'Sola bakıyor',

  'box.state.connected': 'Bağlı',
  'box.state.lost': 'Bağlantı koptu',
  'box.state.password': 'Yanlış parola',
  'box.password.label': 'Kutu kodu',
  'box.password.retry': 'Tekrar dene',
  'box.password.checking': 'Kod deneniyor…',
  'box.password.invalid': 'Kod dört hanelidir.',
  'box.password.wrong': 'Kutu bu kodu da kabul etmedi.',
  'box.password.noAnswer':
    'Kutu yanıt vermedi. Kod kaydedildi ve kutu bir sonraki bağlanışında denenecek.',
  'box.state.notConnected': 'Bağlı değil',
  'box.state.battery': 'pil {value}',
  'box.connect': 'Bağlan',
  'box.step.position.upright.ok': 'Dik duruyor',
  'box.step.position.upright.bad': 'Yatık: dik koyun, yönü fark etmez',
  'box.step.position.flat.ok': 'Düz yatıyor',
  'box.step.position.flat.bad': 'Fazla eğik: düz yatırın, üstü yukarı',
  'box.step.position.flat.upsideDown':
    'Ters duruyor: kapağı yukarı gelecek şekilde döndürün. Üretici ters montajı önermiyor.',
  'box.step.position.waiting': 'Konum: ölçüm bekleniyor',
  'box.step.direction.todo': 'Yönü seç',
  'box.step.direction.done': 'Yön ayarlandı',
  'box.step.direction.learn': 'Emin değilseniz önü kaldırıp öğretin',
  'box.step.zero.todo': 'Araç sıfırlama',
  'box.step.zero.done': 'Sıfırlandı',
  'box.step.zero.hint': 'Aracı su terazisiyle seviyeleyin, sonra sıfırlayın.',
  'box.forgetDirection': 'Yönü unut',

  'onboard.boxPosition.h': 'Kutunun konumu',
  'onboard.boxPosition.later':
    'Yön ve sıfır, ilk park ettiğinizde ayarlanır. Kutunun sayfası size yol gösterir ve iş bitene kadar ⚠ Sıfırla lambası size hatırlatır.',
  'onboard.boxPosition.notConnected':
    'Henüz bağlı bir kutu yok, bu yüzden konumu gösterilemiyor. {next} düğmesine dokunun ve daha sonra sağ üstteki sensör simgesiyle bağlanın.',

  'sensorList.title': 'Sensör kutusu',
  'sensorList.phone': 'Bağlı bir kutu yokken telefonun kendi sensörü kullanılır.',
  'box.step.zero.again': 'Tekrar sıfırla',
};
