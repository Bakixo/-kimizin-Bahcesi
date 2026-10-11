export const WEEKDAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;
export const WEEKDAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export const ui = {
  appName: "İkimizin Bahçesi",
  tabs: { today: "Bugün", meals: "Öğünler", mood: "Ruh hali", settings: "Ayarlar" },
  login: {
    title: "Bahçene hoş geldin",
    subtitle: "E-posta adresini yaz, sana bir giriş kodu gönderelim.",
    emailLabel: "E-posta adresin",
    sendCode: "Kod gönder",
    sending: "Gönderiyorum…",
    codeSent: "E-postana bir kod ve bir bağlantı gönderdik. İkisinden birini kullanabilirsin.",
    codeLabel: "6 haneli kod",
    verify: "Giriş yap",
    wrongCode: "Bu kod tutmadı. Bir daha bakar mısın?",
    changeEmail: "Farklı bir e-posta kullan",
    linkProblem: "Bağlantı bu cihazda açılmadı. E-postadaki 6 haneli kodu kullanabilirsin.",
  },
  pairing: {
    title: "Bahçeni birlikte kuralım",
    subtitle: "Biriniz destekçi olarak kod oluşturur, diğeriniz o kodla katılır.",
    supporterCta: "Destekçiyim, davet kodu oluştur",
    haveCode: "Kodum var",
    codeLabel: "Davet kodu",
    join: "Bahçeye katıl",
    invalidCode: "Bu kod artık geçerli değil. Destekçinden yeni bir kod isteyebilirsin.",
    yourCode: "Davet kodun",
    codeHint: "Bu kodu 48 saat içinde partnerinle paylaş.",
    newCode: "Yeni kod oluştur",
    waitingPartner: "Partnerinin katılmasını bekliyoruz 🌱",
  },
  supporterWaiting: {
    title: "Bahçe büyüyor 🌱",
    body: "Biz ekranı yakında burada olacak. O zamana kadar ona en güzel desteği zaten veriyorsun.",
  },
  errors: {
    saveFailed: "Kaydedemedim, bir daha dener misin?",
    uploadFailed: "Fotoğrafı yükleyemedim, tekrar dener misin?",
    generic: "Bir şeyler ters gitti ama sorun değil, birazdan tekrar deneyebilirsin.",
  },
  offline: {
    title: "Bağlantı yok gibi",
    body: "Şu an internet yok gibi. Bahçen seni bekliyor, bağlantı gelince devam ederiz.",
  },
  garden: { placeholder: "Bahçen burada filizlenecek" },
  habits: {
    title: "Alışkanlıkların",
    reached: "Bugünün hedefi tamam, harikasın 🌸",
    undo: "Bir azalt",
    extra: "Fazlası da güzel ✨",
  },
  meals: {
    title: "Öğünlerin",
    slots: { breakfast: "Kahvaltı", lunch: "Öğle", dinner: "Akşam", snack: "Ara öğün" },
    add: "Ekle",
    addSnack: "Ara öğün ekle",
    photoButton: "Fotoğraf çek ya da seç",
    changePhoto: "Fotoğrafı değiştir",
    notePlaceholder: "Kısa bir not (isteğe bağlı)",
    save: "Kaydet",
    saving: "Kaydediyorum…",
    cancel: "Vazgeç",
    needSomething: "Bir fotoğraf ya da kısa bir not eklemen yeterli.",
    slotTaken: "Bu öğün için bugün zaten bir kayıt var.",
    analyzing: "Tabağına bakıyorum…",
    failed: "Bu tabağa şimdilik yorum yapamadım, ama kaydın güvende 💚",
    retry: "Tekrar dene",
    retryUpload: "Fotoğrafı tekrar yükle",
    delete: "Sil",
    weekTitle: "Haftalık albüm",
    emptyDay: "Bu gün sessiz geçmiş, o da olur 🌿",
    prevWeek: "Önceki hafta",
    nextWeek: "Sonraki hafta",
    close: "Kapat",
  },
  mood: {
    question: "Bugün nasıl hissediyorsun?",
    energyQuestion: "Enerjin nasıl?",
    saved: "Kaydettim, teşekkürler 💚",
    change: "Değiştir",
    calendarTitle: "Son haftaların",
    emptyCalendar: "Birkaç gün daha kayıt tutunca burada hislerinin haritası belirecek 🌿",
  },
  hardDay: {
    button: "Bugün zor bir gün",
    suggestionTitle: "Küçük bir öneri",
    close: "Teşekkürler",
  },
  settings: {
    title: "Ayarlar",
    nameLabel: "Adın",
    nameSave: "Kaydet",
    calorieToggle: "Yaklaşık kalori tahminini göster",
    calorieHint: "Kapalıyken yorumlarda kalori geçmez.",
    hardDayToggle: "Zor gün dediğimde destekçime haber ver",
    hardDayHint: "Bildirimler yakında geliyor; tercihin şimdiden kaydedilir.",
    habitsTitle: "Alışkanlıklar",
    habitName: "Ad",
    habitUnit: "Birim",
    habitTarget: "Günlük hedef",
    addHabit: "Alışkanlık ekle",
    removeHabit: "Kaldır",
    moveUp: "Yukarı taşı",
    moveDown: "Aşağı taşı",
    saved: "Kaydedildi",
    installGuide: "Ana ekrana ekleme rehberi",
    signOut: "Çıkış yap",
  },
  install: {
    title: "Bahçeni ana ekrana ekle",
    intro: "Böylece uygulama gibi açılır ve ileride nazik hatırlatmalar alabilirsin.",
    step1: "Safari'nin altındaki Paylaş düğmesine dokun.",
    step2: "Listede “Ana Ekrana Ekle”yi seç.",
    step3: "Sağ üstteki “Ekle”ye dokun, sonra bahçeni ana ekrandan aç.",
    later: "Sonra",
  },
} as const;

export function greeting(hour: number, name: string | null): string {
  const base =
    hour >= 5 && hour < 12 ? "Günaydın" : hour >= 12 && hour < 18 ? "İyi günler" : hour >= 18 && hour < 23 ? "İyi akşamlar" : "Merhaba";
  return name ? `${base} ${name}` : base;
}

export function streakLabel(n: number): string {
  return n <= 1 ? "Bugün yeni bir başlangıç 🌱" : `🌿 ${n} gündür buradasın`;
}

export function approxKcal(n: number): string {
  return `yaklaşık ${n} kcal`;
}
