@AGENTS.md

# İkimizin Bahçesi — Claude Code için proje rehberi

Bu dosya, projeye hangi bilgisayardan ve hangi Claude Code oturumundan girilirse girilsin aynı bağlamla devam edilebilsin diye yazıldı. Önce bunu, sonra aşağıda adı geçen spec ve planı oku.

## Proje ne?

Bir çiftin kullandığı Türkçe bir PWA. Takip eden kişi (kız arkadaş, iPhone kullanıyor) diyet sürecinde alışkanlıklarını ve öğünlerini kaydeder. Destekçi (repo sahibi Bakixo) onu uygulama içinden destekler. Yalnızca iki kullanıcı var, herkese açık kayıt yok.

Felsefe her kararı yönlendirir: odak kilo değil alışkanlık ve kendine özen, kötü günler cezalandırılmaz, tüm metinler sıcak ve yargısız. Ayrıntı: spec §1.

## Geliştiriciler

İki kişi geliştiriyor: Bakixo (repo sahibi) ve bir arkadaşı (collaborator). Her ikisi de Claude Code kullanıyor.

- `main`'e doğrudan commit atılmaz. Her iş kendi dalında yapılır, Pull Request ile birleştirilir.
- İşe başlamadan `git pull`. Aynı dalda iki kişi aynı anda çalışmaz.
- Commit mesajları İngilizce, conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Kullanıcıyla konuşma dili Türkçe. Uygulamadaki tüm metinler Türkçe.

## Belgeler (doğruluk kaynağı)

- Spec: `docs/superpowers/specs/2026-10-11-temel-ve-gunluk-takip-design.md`. Bağlayıcı otorite budur.
- Plan: `docs/superpowers/plans/2026-10-11-temel-ve-gunluk-takip.md`. Task 0–20, her task'ın tam kodu, testleri ve beklenen çıktıları planın içinde.
- Prototipler: `docs/prototypes/` (aşağıya bak).

Planın başındaki **Global Constraints** ve **Review Focus** bölümleri her task için geçerlidir. Okumadan kod yazma.

## Teknoloji

Next.js 16.4 (App Router) + React 19 + TypeScript, Tailwind CSS 4, Supabase (Auth, Postgres + RLS, Storage), `@anthropic-ai/sdk` (yalnızca sunucuda), Zod 4, Vitest 5, Vercel.

Next.js 16 eğitim verindeki Next.js'ten farklı. Kod yazmadan önce `node_modules/next/dist/docs/` içindeki ilgili rehberi oku (bkz. `AGENTS.md`). Örneğin Task 8'de oturum yenileme dosyasının adı (`proxy.ts` mi `middleware.ts` mi) oradan doğrulanacak.

Geliştirme ortamı Windows, Docker yok. Yerel Supabase yerine bulutta ayrı bir `bahce-dev` Supabase projesi kullanılır.

## Komutlar

```
npm install
npm test            # vitest run (birim testler)
npm run test:rls    # RLS entegrasyon testleri (dev Supabase gerekir, Task 7'den sonra)
npm run typecheck
npm run lint
npm run dev         # http://localhost:3000
npm run db:push     # supabase/migrations -> dev projesi
npm run db:types    # lib/supabase/database.types.ts üretir
```

## Şu anki durum (2026-10-11)

Plan, superpowers `executing-plans` yöntemiyle task task yürütülüyor. Aktif dal: `feat/temel-gunluk-takip`.

| Task | Durum |
|------|-------|
| 0. Elle hazırlık (Supabase, kullanıcılar, Anthropic anahtarı, `.env.local`) | **Bekliyor — insan yapacak** |
| 1. Proje iskeleti, test altyapısı | Tamam |
| 2. `lib/day.ts` gün hesabı | Tamam |
| 3. `lib/streak.ts` seri hesabı | Tamam |
| 4. `lib/habits.ts`, `lib/debounce-save.ts` | Tamam |
| 5. `lib/copy/` Türkçe metin havuzları + yasaklı ifade testi | Tamam |
| 6–20 | Başlanmadı. Task 6 için Task 0 şart. |

41 birim test geçiyor, typecheck ve lint temiz.

Bir task bitince bu tabloyu güncelle ve aynı commit'e ekle; böylece öbür geliştiricinin Claude'u nerede kalındığını görür.

### Plandan sapma kararları (rulings)

- Task 1: `create-next-app` `_scaffold` adını reddetti; `ikimizin-bahcesi` adıyla kurulup köke taşındı.
- Task 1: Vitest 5 `@types/node >= 22` istiyor; `@types/node` `^24` yapıldı.
- Task 1: `.superpowers` `.gitignore`'a eklendi, örnek SVG'ler silindi, Next'in ürettiği `AGENTS.md` tutuldu.
- Task 4: Varsayılan alışkanlıklar yalnızca SQL'de (Task 6 `join_couple`) yaşar; TypeScript'te `DEFAULT_HABITS` yok.

Yeni bir sapma kararı alırsan buraya bir satır ekle: ne, neden, yanlışsa maliyeti.

### Sıradaki adım

1. Task 0'ı insan yapar (planın Task 0 bölümünde adım adım). `.env.local` asla commit edilmez (`.gitignore`'da `.env*`). Değerler iki geliştirici arasında özel kanaldan paylaşılır.
2. Task 0 bittiyse Task 6'dan devam: migration'lar, `npm run db:push`, `npm run db:types`.
3. Her task: planın o bölümünü oku, testi önce yaz ve kırmızıyı gör, sonra kodu yaz, testleri çalıştır, planın commit adımıyla commit et.
4. Task 20'den sonra bütün dalı gözden geçir, PR aç, `main`'e birleştir.

## Kesin kurallar (kısa)

- Saat dilimi `Europe/Istanbul`, gün sınırı 04:00, gün yalnızca sunucuda `lib/day.ts` ile hesaplanır.
- Kullanıcıya görünen her metin `lib/copy/` altında. Yasaklı ifadeler testle korunuyor ("başarısız", "kaçırdın", "kötü", "yasak", "fazla yedin", "hedefin altında", "tembel", "ceza", "suçlu", "kilo").
- Kırmızı renk yok, hedefe ulaşılmayan alışkanlık "eksik" görünmez.
- Claude modeli `claude-opus-5-5`, `output_config.effort: "low"`, `max_tokens: 1024`, `fallbacks: "default"` + beta `server-side-fallback-2026-07-01`. `thinking` gönderilmez.
- `ANTHROPIC_API_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` asla `NEXT_PUBLIC_` önekli olmaz; kullanan modüller `import 'server-only'` içerir. Kullanıcı akışları service role kullanmaz.
- Her tabloda ve `meal-photos` bucket'ında RLS açık.

## Kullanıcının verdiği kararlar (tekrar sorma)

- Kullanım: yalnızca bu çift. Telefon: iPhone (Safari'den Ana Ekrana Ekle; push yalnızca iOS 16.4+ kurulu PWA).
- Giriş: e-postaya hem magic link hem 6 haneli kod (iOS PWA depolaması Safari'den ayrı olduğu için).
- Tasarım: krem kâğıt zemin, adaçayı/zeytin yeşili, mürdüm/incir vurgu, Fraunces (başlık) + Nunito (metin), karanlık mod.
- Mimari: sunucu odaklı (Server Components + Server Actions + RLS), fotoğraf analizi `after()` ile arka planda, takılı "bekliyor" kayıtlar sayfa açılışında yeniden denenir.
- **2026-10-11 yön değişikliği (spec'ten önce gelir):** Uygulama alttaki sekme çubuğuyla üç bölüm: **Bahçe** (ana sayfa, 3D tarla), **Öğünler** (günlük kalori hedefi + dolan bar; "2 yumurta" gibi serbest metin yazılır, ortalama kalori tablodan, bilinmeyen yiyecek Claude'dan, o da yoksa kullanıcıdan alınır), **Görevler** (su L, yürüyüş dk, sebze porsiyon, düzenli öğün, uyku; ilerledikçe bahçe büyür). Kalori artık varsayılan olarak açık ve ana özellik; spec'teki "kalori varsayılan kapalı" kararının yerini alır. Dil yine yargısız: hedef aşılınca kırmızı/suçlayıcı uyarı yok. Hedef Mifflin-St Jeor ile hesaplanır, 1.400 kcal tabanı var. Prototip: `docs/prototypes/bahce-3d.html`. Spec ve plan bu yöne göre güncellenecek.
- **2026-10-11 çok çift (spec'ten önce gelir):** Uygulama tek bir çifte özel değil; her çift kendi bahçesini kurar. Kayıt açık (e-posta kodu/link), partner 6 haneli davet koduyla katılır, bir kişi aynı anda tek bahçede. İki kişi de kendi programını tutar (kalori takibi Profil'den kapatılabilir; kapalıyken kişi destekçi gibi yalnızca görevlerle katkı verir). Ada ikiye bölünür: sol yarı bir partnerin, sağ yarı diğerinin, ortadaki taş yolda yalnızca ortak hedeflerle büyüyen "Biz ağacı" ve bank. Her partnerin bir rengi var (çiçek/meyve rengi). Bahçe ekranında partner akışı, kalp tepkisi ve nazik dürtme (sessiz saatlere uyar). Alttaki 4. sekme **Profil**: ad, renk, partner, davet kodu, kalori takibi anahtarı, kalori hedefi hesaplayıcı, görev hedefleri, partnerin neleri göreceği (kalori sayıları varsayılan gizli), bildirimler, komşular, tema, hesap. **Komşu bahçeler:** arkadaş çiftler kodla komşu olur, birbirinin bahçesini ziyaret edip günde bir tohum bırakır (ziyaretçinin renginde açar); sıralama/yarış yok, komşular kalori/öğün/görev ayrıntısı görmez.
- Kullanıcı küçük ayrıntılarda onay istenmesini sevmiyor: makul varsayılanla ilerle, kararı not et.
- Görsel işler: paylaşmadan önce tarayıcıda render alıp ekran görüntüsüne bak.

## Proje parçaları (yol haritası)

1–2. Temel + Günlük takip — şu anki plan.
3. Bahçe ekranı — ilerlemeye göre büyüyen bahçe. **Karar: gerçek 3D, three.js** (spec'teki "SVG/Lottie" ifadesinin yerine geçer). Referans tarz: "The Farmer Was Replaced" — izometrik low-poly yüzen toprak ada, kare tarla, sıcak gün batımı ışığı. Yalnızca bahçe ekranında lazy-load edilir.
4. Biz ekranı (paylaşım izinleri, tepkiler, ortak hedefler, notlar).
5. Bildirimler (Web Push, hatırlatıcılar, sessiz saatler, haftalık özet).
6. Ödül sandığı.
7. Tarif önerileri.

Her parça kendi spec → plan → uygulama döngüsüyle yapılır.

## Prototipler

- `docs/prototypes/bahce-3d.html`: 3D bahçe prototipi (three.js 0.169.0, CDN'den). Tarayıcıda açılır (`npx serve docs/prototypes` ya da `python -m http.server`). Alışkanlık halkaları bahçeyi büyütür: Su yağmur yağdırır, Sebze ekin diker, Öğün çalı/ağaç/ayçiçeği getirir, Yürüyüş kelebek, Uyku ateş böceği; "Zor gün" mesaj gösterir.
- Tıklanabilir telefon prototipi claude.ai'da Bakixo'nun hesabında özel bir artifact olarak duruyor; erişim gerekiyorsa ondan paylaşmasını iste.

3D bahçe performans dersleri (gerçek bahçe ekranında da uygula): prototip ilk hâlinde ~976 draw call ile telefonda takılıyordu. Düzeltme: her bitkiyi `mergeGeometries` + vertex color ile tek mesh'e "bake" et, tüm tarla karolarını tek mesh yap (karo değişince renk tamponunun ilgili dilimini yeniden yaz), sallanmayı bitkinin tamamına uygula, shadow map 1024 ve `autoUpdate=false` (yalnızca bir şey hareket ederken güncelle), `pixelRatio <= 1.5`, sahne ekran dışındayken veya sekme gizliyken render'ı durdur. Sonuç ~40 draw call.
