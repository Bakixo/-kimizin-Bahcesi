# İkimizin Bahçesi — Alt proje 1+2: Temel ve Günlük Takip

Tarih: 2026-10-11
Durum: Taslak, kullanıcı incelemesinde

## 1. Amaç ve bağlam

"İkimizin Bahçesi", bir çiftin kullandığı Türkçe bir PWA. Takip eden kişi (kız arkadaş) diyet sürecinde alışkanlıklarını ve öğünlerini kaydeder. Destekçi (kullanıcı) onu uygulama içinden destekler.

Temel felsefe her kararı yönlendirir:
- Odak kilo veya kalori değil, alışkanlık ve kendine özen. Kilo takibi yok.
- Kalori tahmini isteğe bağlı ve varsayılan olarak kapalı. Açıksa "yaklaşık" ibaresiyle gösterilir.
- Kötü günler cezalandırılmaz. "Zor gün" seriyi bozmaz.
- Tüm metinler sıcak, yargısız, teşvik edici. "Başarısız", "kaçırdın", "hedefin altında" gibi ifadeler yok.

Başarı ölçütü: Takip eden kişi uygulamayı her gün açmak ister, kayıt tutmak 10 saniyeden kısa sürer, kötü bir günde bile uygulamadan iyi hissederek çıkar.

### Tüm proje parçaları

| # | Parça | Bu spec'te |
|---|-------|-----------|
| 1 | Temel: giriş, eşleşme, roller, RLS, PWA kabuğu, tasarım sistemi | Evet |
| 2 | Günlük takip: alışkanlıklar, öğün/fotoğraf, Claude analizi, ruh hali, zor gün, seri | Evet |
| 3 | Bahçe: ilerleme hesabı, SVG animasyon, günün mesajı | Hayır |
| 4 | Biz ekranı: paylaşım izinleri, tepkiler, ortak hedefler, planlı notlar | Hayır |
| 5 | Bildirimler: Web Push, hatırlatıcılar, sessiz saatler, haftalık özet | Hayır |
| 6 | Ödül sandığı | Hayır |
| 7 | Tarif önerileri | Hayır |

Bu spec'teki veri modeli 3–7. parçaların ihtiyaç duyacağı verileri şimdiden üretir (örneğin alışkanlık kayıtları bahçe hesabını besler). O parçaların ekranları ve mantığı bu spec'in dışında.

## 2. Kısıtlar ve verilen kararlar

- Kullanıcılar yalnızca iki kişi: tek çift. Herkese açık kayıt yok.
- Takip eden kişi iPhone kullanıyor. Uygulama Safari'den "Ana Ekrana Ekle" ile kurulur.
- Giriş: e-postaya hem magic link hem 6 haneli kod gelir.
- Saat dilimi sabit: `Europe/Istanbul`.
- Gün sınırı saat 04:00. Gece 02:00'de yenen bir şey önceki güne sayılır. Gece geç saatlerde kayıt tutan birinin serisi bölünmesin diye bu seçildi.
- Teknoloji: Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (Auth, Postgres, Storage), Vercel.
- Geliştirme ortamı Windows. Docker yok. Yerel Supabase yerine ayrı bir "dev" Supabase bulut projesi kullanılır.
- Claude API yalnızca sunucuda çağrılır.

## 3. Mimari

Sunucu odaklı Next.js yapısı:
- Okuma: Server Components, `@supabase/ssr` ile kullanıcının oturumu üzerinden.
- Yazma: Server Actions.
- Asıl güvenlik katmanı: Postgres Row Level Security. Uygulama kodundaki kontroller ek katmandır, tek savunma değildir.
- Arka plan işi: Next.js `after()` (Vercel'de `waitUntil`). Fotoğraf analizi cevap döndükten sonra arka planda çalışır.
- Hiçbir kullanıcı akışı `service_role` anahtarını kullanmaz. RLS'i atlaması gereken tek işlem eşleşmedir; o da `security definer` Postgres fonksiyonlarıyla yapılır (bkz. 4). Analiz işi bile kullanıcının kendi oturumuyla yazar (bkz. 7.3).

### Klasör yapısı

```
app/
  (auth)/giris/page.tsx         e-posta gir → kod gir
  (auth)/auth/callback/route.ts magic link dönüşü
  (app)/layout.tsx              alt sekme çubuğu, oturum kontrolü
  (app)/bugun/page.tsx          günlük ekran
  (app)/ogunler/page.tsx        gün kolajı + haftalık albüm
  (app)/ruh-hali/page.tsx       son 5 haftanın ruh hali takvimi
  (app)/ayarlar/page.tsx        alışkanlıklar, hedefler, kalori, zor gün bildirimi
  (app)/eslesme/page.tsx        davet kodu üret / gir
  kurulum/page.tsx              iPhone "Ana Ekrana Ekle" rehberi
  offline/page.tsx              çevrimdışı sayfası
lib/
  supabase/server.ts            Server Component / Action istemcisi
  supabase/client.ts            tarayıcı istemcisi (yalnızca Storage yükleme ve auth)
  supabase/admin.ts             service_role istemcisi, 'server-only'
  claude/analyze-meal.ts        'server-only'
  day.ts                        Istanbul + 04:00 gün sınırı
  streak.ts                     saf seri fonksiyonları
  habits.ts                     varsayılan alışkanlıklar, ilerleme hesabı
  copy/                         tüm Türkçe metin havuzları (zor gün, boş durumlar, hata mesajları)
  image/compress.ts             tarayıcıda fotoğraf küçültme
components/                     UI bileşenleri
supabase/migrations/            şema, RLS, fonksiyonlar, storage politikaları
public/manifest.webmanifest
public/sw.js
public/icons/
tests/                          Vitest birim ve entegrasyon testleri
```

Her dosyanın tek bir sorumluluğu olur. `streak.ts`, `day.ts` ve `habits.ts` veritabanına dokunmayan saf modüllerdir. Bu sayede ayrı ayrı test edilebilirler.

## 4. Giriş ve eşleşme

### Giriş
- Supabase'de "Allow new users to sign up" kapalı. İki kullanıcı Supabase panelinden "Invite user" ile eklenir.
- Giriş ekranı: e-posta alanı → "Kod gönder". Çağrı: `signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } })`.
- Supabase "Magic Link" e-posta şablonu Türkçeleştirilir ve hem `{{ .ConfirmationURL }}` bağlantısını hem `{{ .Token }}` kodunu içerir.
- Kod ekranı: 6 haneli kod alanı (`inputmode="numeric"`, `autocomplete="one-time-code"`). Çağrı: `verifyOtp({ email, token, type: 'email' })`.
- Bağlantı ile giriş: `/auth/callback` route'u `exchangeCodeForSession` yapar ve `/bugun`'a yönlendirir.
- Kayıtlı olmayan bir e-posta girilirse bile ekran "Kod gönderildi" der. Hangi adreslerin kayıtlı olduğu dışarı sızmaz.
- Oturum çerezleri `@supabase/ssr` middleware'i ile yenilenir.

### İlk giriş ve profil
- Auth'ta yeni kullanıcı oluşunca bir trigger `profiles` satırı ekler (`role = null`, `couple_id = null`).
- Rolü olmayan kullanıcı `/eslesme`'ye yönlendirilir.

### Eşleşme
- `/eslesme` iki seçenek sunar: "Destekçiyim, davet kodu oluştur" ve "Kodum var".
- Destekçi kod oluşturur: `create_invite()` fonksiyonu yeni bir `couples` satırı açar, destekçinin profiline `role = 'supporter'` ve `couple_id` yazar. 6 karakterlik kod üretir (karışan karakterler hariç: `0 O 1 I L`). Kod 48 saat geçerlidir.
- Takip eden kişi kodu girer: `join_couple(code)` fonksiyonu kodu doğrular, profiline `role = 'tracker'` ve aynı `couple_id`'yi yazar, kodu kullanılmış olarak işaretler.
- Bu iki fonksiyon `security definer` olarak çalışır ve `auth.uid()` dışında hiçbir kullanıcı kimliği kabul etmez. Bir çiftte en fazla bir destekçi ve bir takip eden olabilir.
- Hatalı veya süresi geçmiş kod: "Bu kod artık geçerli değil. Destekçinden yeni bir kod isteyebilirsin."
- Eşleşme tamamlanınca takip eden kişi için varsayılan alışkanlıklar ve ayarlar oluşturulur (bkz. 6).

### Rollere göre ekranlar (bu spec'te)
- Takip eden: Bugün, Öğünler, Ruh hali, Ayarlar.
- Destekçi: Şimdilik yalnızca sıcak bir bekleme ekranı ("Biz ekranı yakında burada olacak") ve Ayarlar. Biz ekranı 4. parçada eklenir.

## 5. Veri modeli

Tüm tablolarda RLS açıktır. Tüm `day` alanları 04:00 sınırlı Istanbul günüdür (`date` tipi) ve sunucuda `lib/day.ts` ile hesaplanır. İstemcinin gönderdiği gün bilgisine güvenilmez.

```
couples
  id uuid pk
  invite_code text unique null
  invite_expires_at timestamptz null
  created_at timestamptz

profiles
  id uuid pk = auth.users.id
  couple_id uuid null → couples
  role text null check in ('tracker','supporter')
  display_name text null
  created_at timestamptz

user_settings                       (yalnızca takip eden için)
  user_id uuid pk → profiles
  show_calorie_estimate boolean default false
  notify_supporter_on_hard_day boolean default true   (bildirim 5. parçada gönderilir)
  share_meal_photos boolean default true             (4. parçada kullanılır)
  share_habits boolean default true                  (4. parçada kullanılır)
  share_mood boolean default false                   (4. parçada kullanılır)

habits
  id uuid pk
  user_id uuid → profiles
  kind text check in ('water','produce','regular_meals','walk','sleep','custom')
  name text
  unit text                          ('bardak', 'porsiyon', 'öğün', 'kez', 'gece', serbest)
  daily_target int check > 0
  position int
  archived_at timestamptz null        (silmek yerine arşivlenir; geçmiş kayıtlar korunur)

habit_logs
  id uuid pk
  habit_id uuid → habits
  user_id uuid → profiles
  day date
  count int check >= 0
  updated_at timestamptz
  unique (habit_id, day)

meals
  id uuid pk
  user_id uuid → profiles
  day date
  slot text check in ('breakfast','lunch','dinner','snack')
  photo_path text null
  note text null check length <= 280
  analysis_status text check in ('none','pending','done','failed') default 'none'
  analysis jsonb null                 { foods: string[], comment: string, approx_kcal: int | null }
  analysis_attempts int default 0
  analysis_started_at timestamptz null
  created_at timestamptz

mood_logs
  user_id uuid → profiles
  day date
  mood int check 1..5
  energy int check 1..5
  updated_at timestamptz
  pk (user_id, day)

hard_days
  user_id uuid → profiles
  day date
  suggestion_key text
  created_at timestamptz
  pk (user_id, day)
```

### Seri için görünüm
```
active_days (view, security_invoker = true)
  user_id, day
  = meals ∪ habit_logs (count > 0) ∪ hard_days, distinct
```

### RLS politikaları (bu spec)
- `profiles`: Kullanıcı kendi satırını okur. Aynı çiftteki partnerin satırını da okur (yalnızca `display_name` ve `role` için). Doğrudan güncelleme yalnızca `display_name` alanında yapılabilir. `role` ve `couple_id` yalnızca `create_invite` ve `join_couple` fonksiyonlarıyla değişir.
- `couples`: Üyeler kendi çiftlerini okur. Doğrudan yazma yok.
- `user_settings`, `habits`, `habit_logs`, `meals`, `mood_logs`, `hard_days`: Yalnızca `user_id = auth.uid()` için okuma, ekleme, güncelleme ve silme.
- Destekçinin takip edenin verisini okuma izni bu spec'te yok. 4. parçada paylaşım ayarlarına bağlı olarak eklenir.

### Storage
- Bucket: `meal-photos`, özel (public değil).
- Yol: `{user_id}/{meal_id}.jpg`.
- Politika: Yalnızca ilk klasörü `auth.uid()` olan dosyalar okunur, yüklenir ve silinir.
- Görüntüleme: Sunucu 1 saatlik imzalı URL üretir.
- Dosya boyutu sınırı: 5 MB. İzin verilen tür: `image/jpeg`.

## 6. Alışkanlıklar

### Varsayılan alışkanlıklar
Eşleşmede takip eden kişi için oluşturulur:

| kind | Ad | Birim | Hedef |
|------|----|-------|-------|
| water | Su | bardak | 8 |
| produce | Sebze ve meyve | porsiyon | 5 |
| regular_meals | Düzenli öğün | öğün | 3 |
| walk | Yürüyüş | kez | 1 |
| sleep | Uyku | gece | 1 |

### Davranış
- Kart dokunuşla 1 artar. Hedefe ulaşıldıktan sonra da artmaya devam eder (fazlası da kutlanır).
- Kartta küçük bir "−" düğmesi yanlışlıkla yapılan dokunuşu geri alır. Sayı 0'ın altına inmez.
- Hedefi 1 olan alışkanlıklar (yürüyüş, uyku) açma/kapama gibi çalışır.
- Arayüz iyimser günceller (optimistic update). Sunucu hatası olursa eski değere döner ve nazik bir mesaj gösterir: "Kaydedemedim, bir daha dener misin?"
- Ardışık hızlı dokunuşlar 400 ms içinde birleştirilip tek bir Server Action çağrısıyla gönderilir. Sunucu mutlak `count` değeri yazar (artış değil). Bu sayede çift kayıt olmaz.
- Hedefe ulaşınca küçük bir kutlama animasyonu ve sıcak bir mesaj gösterilir. Hedefe ulaşılmasa da kart hiçbir zaman kırmızı veya "eksik" görünmez. İlerleme "3/8" yerine "3 bardak 🌱" ve dolan bir halka ile gösterilir.
- "Düzenli öğün" alışkanlığı elle işaretlenir. Öğün kaydından otomatik sayılmaz, çünkü kullanıcı bazen fotoğraf çekmeden yer.

### Ayarlar
- Her alışkanlığın adı, birimi ve günlük hedefi değiştirilebilir (diyetisyen listesine uyum için).
- Yeni alışkanlık eklenebilir (`kind = 'custom'`).
- Alışkanlık çıkarılınca arşivlenir. Geçmiş kayıtlar bahçe ve özetler için korunur.
- Sıra sürükle-bırak yerine yukarı/aşağı düğmeleriyle değiştirilir (iPhone'da daha güvenilir).

## 7. Öğün günlüğü ve fotoğraf analizi

### 7.1 Kayıt akışı
1. "Bugün" ekranında dört öğün yuvası bulunur: Kahvaltı, Öğle, Akşam, Ara öğün. Ara öğüne günde birden fazla kayıt eklenebilir, diğer yuvalara birer tane.
2. Yuvaya dokununca bir sayfa açılır: "Fotoğraf çek / seç" (`<input type="file" accept="image/*" capture="environment">`), isteğe bağlı not alanı ve "Kaydet" düğmesi. Fotoğraf da not da isteğe bağlıdır, ama en az biri girilmelidir.
3. Fotoğraf tarayıcıda küçültülür (`lib/image/compress.ts`): uzun kenar en fazla 1600 piksel, JPEG kalite 0.8, EXIF yönü uygulanır ve meta verisi silinir (konum bilgisi gitmez). iOS, HEIC formatını `<input>` üzerinden JPEG'e çevirir. Çevirmezse canvas ile yeniden kodlanır.
4. Server Action `createMeal` çağrılır: `meals` satırını ekler (fotoğraf varsa `analysis_status = 'pending'`) ve `meal_id` ile yükleme yolunu döndürür.
5. İstemci fotoğrafı doğrudan Storage'a yükler (`{user_id}/{meal_id}.jpg`).
6. İstemci `startMealAnalysis(meal_id)` Server Action'ını çağırır. Bu action hemen döner ve analizi `after()` içinde başlatır.
7. Ekran fotoğrafı hemen gösterir. Yorum alanında "Tabağına bakıyorum…" yazar. Sayfa, `pending` durumundaki öğünleri her 3 saniyede bir yeniden sorgular (en fazla 60 saniye).

Not eklendiyse ama fotoğraf yoksa analiz yapılmaz (`analysis_status = 'none'`).

### 7.2 Claude çağrısı (`lib/claude/analyze-meal.ts`)
- SDK: `@anthropic-ai/sdk`, yalnızca sunucuda (`import 'server-only'`).
- Model: `claude-opus-5-5`. Effort: `low` (kısa ve basit bir görev). Thinking parametresi gönderilmez (bu modelde zaten adaptif).
- Reddetme durumunda yedek model: sunucu taraflı `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`). `stop_reason === "refusal"` kontrol edilir. Yine reddedilirse öğün `failed` olarak işaretlenir.
- Fotoğraf: sunucu Storage'dan indirir ve base64 `image` bloğu olarak gönderir (`media_type: "image/jpeg"`).
- Çıktı: Zod şemasıyla yapılandırılmış çıktı (`messages.parse` + `zodOutputFormat`):
  ```ts
  z.object({
    is_food: z.boolean(),
    foods: z.array(z.string()).max(8),     // Türkçe yemek adları
    comment: z.string().max(160),          // 1-2 cümle, Türkçe
    approx_kcal: z.number().int().nullable()
  })
  ```
- Sistem promptu (sabit metin, önbelleğe alınabilir) şunları söyler:
  - Türkçe, sıcak ve yargısız bir dille yaz. Tabakta iyi olan bir şeyi fark et.
  - Asla eleştirme, yasaklama, "fazla", "kaçamak", "kötü", "yapmamalısın" deme. Kilo, diyet kuralları veya suçluluk hakkında konuşma.
  - Kalori bilgisi ancak istekte `include_calories: true` varsa verilir. Aksi halde `approx_kcal: null` döner ve yorumda kalori, porsiyon büyüklüğü veya sayı geçmez.
  - Fotoğraf yemek değilse `is_food: false` döner ve şakacı, nazik bir cümle yazılır.
- Kullanıcı mesajı: fotoğraf, öğün yuvası adı, varsa not ve `include_calories` bayrağı.
- `max_tokens`: 1024.

### 7.3 Arka plan işi ve yeniden deneme
- `after()` içindeki iş, isteği yapan kullanıcının çerezlerinden oluşturulmuş Supabase istemcisini kullanır. Yazma işlemi RLS altında yapılır.
- İş başında `analysis_attempts` 1 artar ve `analysis_started_at` güncellenir.
- Başarılı olursa `analysis` yazılır, durum `done` olur. `show_calorie_estimate` kapalıysa sunucu `approx_kcal` değerini her ihtimale karşı `null` yapar.
- Hata olursa (429, 5xx, ağ hatası, zaman aşımı) durum `pending` kalır.
- Kurtarma: "Bugün" veya "Öğünler" sayfası açıldığında, `pending` durumunda olan, `analysis_started_at` değeri 2 dakikadan eski ve `analysis_attempts < 3` olan öğünler için analiz yeniden başlatılır.
- 3 denemeden sonra durum `failed` olur. Ekran şunu gösterir: "Bu tabağa şimdilik yorum yapamadım, ama kaydın güvende 💚". Yanında "Tekrar dene" düğmesi bulunur (sayaç sıfırlanır).
- Analiz başarısız olsa bile öğün kaydı geçerlidir ve seriye sayılır.

### 7.4 Gösterim
- Kalori yalnızca ayar açıksa ve değer varsa gösterilir: "yaklaşık 450 kcal". Küçük ve ikincil bir yazı tipiyle.
- Ayar sonradan kapatılırsa eski kayıtlardaki kalori de gösterilmez.
- Kullanıcı öğünü, notu ve fotoğrafı silebilir. Fotoğraf silinince Storage'daki dosya da silinir.

### 7.5 Öğünler ekranı
- Gün görünümü: Günün fotoğrafları yumuşak köşeli bir kolaj olarak gösterilir (1–4 fotoğraf için ayrı düzenler, 5 ve üzeri için ızgara). Fotoğrafsız öğünler not kartı olarak görünür.
- Haftalık albüm: Pazartesiden başlayan 7 sütun. Her günün küçük kolajı, altında gün adı. Önceki ve sonraki haftaya geçilebilir.
- Fotoğrafa dokununca tam ekran görünüm açılır: yemek adları, yorum ve not.

## 8. Ruh hali ve enerji

- "Bugün" ekranında günde bir kez sorulur: "Bugün nasıl hissediyorsun?"
- Ruh hali: 5 seçenek, her biri yumuşak bir SVG yüz ve etiketle: Çok iyi, İyi, İdare eder, Yorgun, Zor.
- Enerji: 5 seviye, dolan yaprak simgeleriyle (1: "Pilim bitik", 5: "Enerji dolu").
- Aynı gün içinde değiştirilebilir (son seçim geçerli olur).
- `/ruh-hali` ekranı: Son 5 haftanın takvim ızgarası. Her gün ruh haline göre renklenir (yumuşak bir palet, kırmızı yok). Altında haftanın günlerine göre ortalama ruh hali gösterilir ("Pazar günleri genelde daha iyi hissediyorsun").
- Bu görünüm en az 7 günlük kayıt olduktan sonra açılır. Öncesinde sıcak bir boş durum mesajı gösterilir.

## 9. Zor gün

- "Bugün" ekranında her zaman görünen yumuşak bir düğme: "Bugün zor bir gün".
- Basınca:
  1. `hard_days` satırı eklenir (gün başına bir kez; tekrar basılırsa aynı satır kalır).
  2. Tam ekran sakin bir kart açılır: destekleyici bir mesaj ve tek bir küçük öneri.
  3. Mesaj ve öneri `lib/copy/hard-day.ts` havuzundan seçilir. Aynı öneri art arda iki gün gösterilmez.
- Öneri havuzu (ilk sürüm): bir bardak su iç, 10 dakika yürü, bugün erken yat, en sevdiğin şarkıyı aç, derin bir nefes al ve omuzlarını gevşet, bir arkadaşına mesaj at, sıcak bir bitki çayı demle.
- Mesaj örnekleri: "Bazı günler böyle, bu tamamen normal. Bugün sadece kendine nazik ol yeter." / "Zor bir gün bahçeni soldurmaz. Yarın yine buradayız."
- Seriyi bozmaz: zor gün kaydı o günü aktif sayar.
- Destekçiye bildirim 5. parçada eklenir. Bu spec yalnızca `user_settings.notify_supporter_on_hard_day` ayarını ve ayar ekranındaki anahtarı içerir.

## 10. Seri

- Tanım: Bir gün, o gün en az bir öğün kaydı, sayısı 0'dan büyük en az bir alışkanlık kaydı ya da bir zor gün kaydı varsa "aktif" sayılır.
- Güncel seri: Bugünden geriye doğru kesintisiz aktif gün sayısı. Bugün henüz aktif değilse dünden itibaren sayılır (gün bitmeden seri sıfır görünmez).
- En uzun seri de hesaplanır (ödül sandığı için 6. parçada kullanılacak).
- Hesap `lib/streak.ts` içinde saf bir fonksiyondur: girdi sıralı tarih listesi ve bugünün tarihi, çıktı `{ current, longest }`.
- Veri `active_days` görünümünden son 400 gün için okunur.
- Gösterim: "Bugün" ekranının üstünde "🌿 12 gündür buradasın". Seri koptuğunda olumsuz bir mesaj gösterilmez. Seri 0 veya 1 ise "Bugün yeni bir başlangıç" yazar.

## 11. "Bugün" ekranı düzeni

Yukarıdan aşağıya:
1. Selam ve seri: "Günaydın {display_name} 🌿 12 gündür buradasın". Selam günün saatine göre değişir. Ad girilmemişse selam adsız gösterilir.
2. Bahçe alanı için yer tutucu: Şimdilik sade bir illüstrasyon. Gerçek bahçe 3. parçada gelir.
3. Alışkanlık kartları: 2 sütunlu ızgara.
4. Öğün yuvaları.
5. Ruh hali ve enerji (o gün girilmemişse göze çarpar, girildiyse küçük bir özet olarak görünür).
6. "Bugün zor bir gün" düğmesi.

Alt sekme çubuğu: Bugün, Öğünler, Ruh hali, Ayarlar. Sekme çubuğu iPhone'un alt güvenli alanına (`env(safe-area-inset-bottom)`) göre yerleşir.

## 12. PWA

- `public/manifest.webmanifest`: ad "İkimizin Bahçesi", kısa ad "Bahçemiz", `display: standalone`, `start_url: /bugun`, tema rengi, arka plan rengi, 192/512 ikonlar, maskelenebilir ikon. iOS için `apple-touch-icon` ve `apple-mobile-web-app-*` meta etiketleri.
- `public/sw.js` elle yazılır (ek kütüphane yok):
  - Kurulumda uygulama kabuğunu (`/offline`, ikonlar, fontlar) önbelleğe alır.
  - Gezinme isteklerinde önce ağ denenir. Ağ yoksa `/offline` gösterilir: "Şu an internet yok gibi. Bahçen seni bekliyor, bağlantı gelince devam ederiz."
  - Statik `/_next/static/*` dosyaları için önce önbellek kullanılır.
  - API ve Supabase istekleri önbelleğe alınmaz.
  - 5. parçada push olayı dinleyicileri buraya eklenecek.
- `/kurulum`: Tarayıcı `standalone` modda değilse (`navigator.standalone` veya `display-mode: standalone` sorgusu) ve cihaz iOS ise, girişten sonra bir kez gösterilir. Paylaş düğmesi → "Ana Ekrana Ekle" adımlarını basit SVG çizimlerle anlatır. "Sonra" ile geçilebilir. Ayarlardan tekrar açılabilir.

## 13. Tasarım sistemi

- Renkler (Tailwind teması, CSS değişkenleri ile):
  - Zemin: krem/kağıt `#FBF7EF`, kart `#FFFDF8`
  - Yeşiller: adaçayı `#A3B18A`, zeytin `#5F6F3E`, koyu yaprak `#3A4A2A`
  - Vurgu: mürdüm `#6E2A4F`, incir `#8C4A6B`, açık incir `#E9D3DE`
  - Metin: `#2F2A25`, ikincil `#6B635A`
  - Karanlık mod: zemin `#1E1B18`, kart `#2A2622`, yeşiller ve mürdüm açılmış tonlarla. `prefers-color-scheme` ile otomatik.
- Yazı tipleri: Fraunces (başlıklar), Nunito (metin). `next/font/google` ile, `latin-ext` alt kümesi (Türkçe karakterler için).
- Biçim: büyük yuvarlak köşeler (16–24 px), yumuşak gölgeler, en az 44 px dokunma alanı.
- İllüstrasyonlar: düz renkli, el çizimi hissi veren SVG'ler. Bu spec'te ruh hali yüzleri, enerji yaprakları, boş durum çizimleri ve kurulum rehberi çizimleri.
- Hareket: Kısa ve yumuşak animasyonlar (150–300 ms). `prefers-reduced-motion` açıksa animasyon yok.
- Erişilebilirlik: Metin kontrastı en az WCAG AA. Simgeli düğmelerin hepsinde `aria-label` var.
- Dil: Tüm metinler `lib/copy/` altında tutulur. Kod içinde dağınık Türkçe metin bulunmaz. Bu sayede ton tek yerden gözden geçirilebilir.

## 14. Hata durumları

| Durum | Davranış |
|-------|----------|
| Ağ yok | Çevrimdışı sayfası. Kayıt yapılamaz. Bu sürümde çevrimdışı kuyruk yok. |
| Server Action hatası | İyimser güncelleme geri alınır. "Kaydedemedim, bir daha dener misin?" |
| Fotoğraf yükleme hatası | Öğün kaydı silinmez. Fotoğraf alanında "Fotoğrafı yükleyemedim, tekrar dene" düğmesi. |
| Claude analizi hatası | 7.3'teki yeniden deneme. 3 denemeden sonra nazik bir mesaj. |
| Oturum süresi doldu | `/giris`'e yönlendirme. Giriş sonrası kaldığı sayfaya dönüş. |
| Geçersiz davet kodu | Açıklayıcı ve nazik bir mesaj. |

Hiçbir hata mesajı kullanıcıyı suçlamaz ve teknik ayrıntı göstermez. Teknik ayrıntılar sunucu loglarına yazılır.

## 15. Güvenlik

- RLS her tabloda ve Storage bucket'ında açık.
- `ANTHROPIC_API_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu ortam değişkeni (`NEXT_PUBLIC_` öneki yok). Bunları kullanan modüller `import 'server-only'` içerir.
- `service_role` istemcisi bu spec'te hiçbir kullanıcı akışında kullanılmaz. Yalnızca test hazırlık betiklerinde kullanılır.
- Server Action'lar girdiyi Zod ile doğrular. `day` değeri istemciden alınmaz.
- Fotoğraflardaki EXIF/konum bilgisi yüklemeden önce silinir.
- Claude'a giden veriler: yalnızca fotoğraf, öğün yuvası ve not. Ad, e-posta veya kullanıcı kimliği gönderilmez.
- Güvenlik başlıkları: `next.config` içinde temel CSP, `X-Content-Type-Options`, `Referrer-Policy`.

## 16. Test

- **Birim testleri (Vitest):**
  - `day.ts`: 04:00 sınırı, gece yarısı geçişleri, Istanbul saat dilimi (Türkiye'de yaz saati uygulaması yok, sabit UTC+3).
  - `streak.ts`: boş liste, bugün aktif / değil, aradaki boşluklar, zor gün dahil, en uzun seri.
  - `habits.ts`: ilerleme hesabı, hedef aşımı, varsayılan alışkanlıklar.
  - `analyze-meal.ts`: Anthropic istemcisi taklit edilerek (mock) kalori ayarının çıktıya etkisi, `is_food: false`, reddetme ve hata dalları.
  - `copy/`: Yasaklı ifadeler testi. Tüm metin havuzlarında "başarısız", "kaçırdın", "kötü", "yasak", "fazla yedin" gibi ifadeler bulunmadığını doğrular.
- **RLS entegrasyon testleri (Vitest, dev Supabase projesine karşı):** İki test kullanıcısı oluşturulur. Biri diğerinin `meals`, `habit_logs`, `mood_logs`, `hard_days` kayıtlarını ve Storage dosyalarını okuyamaz ve yazamaz. Partner profilinin yalnızca izin verilen alanları okunabilir. `role` ve `couple_id` doğrudan güncellenemez. Bu testler ortam değişkenleri yoksa atlanır.
- **Elle kontrol listesi:** iPhone Safari'de kurulum, kod ile giriş, fotoğraf çekme ve analiz, karanlık mod, çevrimdışı sayfa.

## 17. Kapsam dışı (bu spec)

- Bahçe illüstrasyonu ve ilerleme hesabı (3)
- Destekçinin takip edeni görmesi, tepkiler, ortak hedefler, motivasyon notları (4)
- Tüm bildirimler, hatırlatıcılar, haftalık özet (5)
- Ödül sandığı (6)
- Tarif önerileri (7)
- Çevrimdışı kayıt kuyruğu
- Veri dışa aktarma ve hesap silme ekranı (gerekirse Supabase panelinden yapılır)

## 18. Ortam değişkenleri

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        (yalnızca test betikleri)
ANTHROPIC_API_KEY
NEXT_PUBLIC_SITE_URL             (magic link dönüş adresi)
```
