# Kullanıcı Yönetimi Implementasyon Seyir Defteri

## Amaç

Bu belge kullanıcı yönetimi, görev bazlı yetkilendirme, memleket ve kontrol
özelliklerinin faz faz ilerlemesini izler. Her geliştirme adımında aşağıdaki
bilgiler güncellenecektir:

- Yapılan değişiklik
- Etkilenen faz
- Tamamlanan ve kalan işler
- Çalıştırılan doğrulamalar
- Bilinen risk veya bloke durumları
- Commit başlığı
- Push durumu
- Bir sonraki adım

Ana plan:
[Kullanıcı Yönetimi, Görev Bazlı Yetkilendirme ve Kontrol Planı](./user-management-implementation-plan.md)

## Genel durum

| Faz | Durum | İlerleme | Son güncelleme |
|---|---|---:|---|
| Faz 0 - Dokümantasyon ve kararlar | Tamamlandı | %100 | 2026-08-06 |
| Faz 1 - RBAC ve kullanıcı güvenliği | Tamamlandı | %100 | 2026-08-06 |
| Faz 2 - Kullanıcı yönetimi | Tamamlandı | %100 | 2026-08-06 |
| Faz 3 - Görev yönetimi | Tamamlandı | %100 | 2026-08-06 |
| Faz 4 - Görev bazlı veri yetkilendirmesi | Tamamlandı | %100 | 2026-08-06 |
| Faz 5 - Memleket | Başlanmadı | %0 | 2026-08-06 |
| Faz 6 - Kontrol ve onay | Başlanmadı | %0 | 2026-08-06 |
| Faz 7 - Raporlama ve production hazırlığı | Başlanmadı | %0 | 2026-08-06 |

Durum değerleri:

```text
Başlanmadı
Devam ediyor
Bloke
Tamamlandı
```

## Kesinleşen kararlar

- Başlangıç rolleri yönetici, kontrolcü ve araştırmacıdır.
- Roller ve permission'lar veritabanında tutulacaktır.
- Araştırmacının veri yazma kapsamı aktif görevlerinden türeyecektir.
- Deadline geçince görev kapanmayacak ve yazma yetkisi devam edecektir.
- Deadline'ı geçmiş eksik görev gecikmiş olarak gösterilecektir.
- Aynı araştırmacıya birden fazla çakışmayan görev verilebilir.
- Aktif veya gecikmiş görev kapsamları çakışamaz.
- Âlim silme ve dış kaynak ID değiştirme yalnızca yöneticidedir.
- Yönetici rolü tek başına araştırmacı veri girişi sağlamaz.
- Âlim başına en fazla bir opsiyonel memleket bulunur.
- Her aktif kullanıcı memleket oluşturabilir.
- Kontrolcü âlimi onaylayabilir veya zorunlu düzeltme yorumu bırakabilir.
- Âlim sayfasında geçerli onayın kontrolcüsü ve tarihi gösterilir.
- Veri girişi ve onay ilerlemeleri ayrı ölçülür.
- `1-20` görevinde `1-15` girilmişse veri girişi ilerlemesi `%75`, eksikler
  `16-20` olur.

## İlerleme kayıtları

### 2026-08-06 - Faz 4 tamamlandı

**Yapılanlar**

- Person kayıtlarına oluşturan, son güncelleyen ve oluşturulduğu görev
  bağlantıları eklendi.
- Araştırmacı âlim oluşturma/güncelleme işlemleri başlamış aktif görev
  kapsamıyla sınırlandırıldı; deadline geçmesi yetkiyi kapatmıyor.
- Âlim silme yalnızca `PERSON_DELETE`, dış kaynak ID değiştirme yalnızca
  `PERSON_CHANGE_EXTERNAL_ID` yetkisine bağlandı.
- Yönetici rolüyle görev verisi değiştirilemez; yalnızca dış kaynak ID alanı
  değiştirilebilir.
- İlişki oluşturma, güncelleme ve silmede en az bir tarafın araştırmacının
  aktif görev kapsamında olması zorunlu hale getirildi.
- Hızlı âlim oluşturma mevcut person endpoint'i üzerinden aynı kapsam
  denetimine tabi tutuldu.
- Person liste/detay API'leri capability bilgileri döndürüyor; arayüz yetkisiz
  oluşturma, düzenleme, silme ve ilişki butonlarını göstermiyor.
- Görev kartlarında ilerleme yüzdesiyle birlikte eksik dış kaynak ID listesi
  gösteriliyor.

**Doğrulama**

- `npm test`: 10/10 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı.
- İlk doğrulamada görev kartındaki JSX kapanış hatası yakalanıp okunabilir çok
  satırlı yapıya çevrilerek düzeltildi.

**Commit ve push**

- Commit başlığı: `feat: enforce assignment scoped data access`
- Push hedefi: `origin/master`

**Sonraki adım**

- Faz 5: Tek memleket sözlüğü, person bağlantısı, arama/seçim ve tüm aktif
  kullanıcılar için hızlı memleket oluşturma.

### 2026-08-06 - Faz 3 tamamlandı

**Yapılanlar**

- Araştırmacı görev ve çoklu dış kaynak ID kapsamı şemaları eklendi.
- Görev durumları, başlangıç/deadline, tamamlayan ve iptal eden kullanıcı
  alanları eklendi.
- Görev içi ve görevler arası kapsam çakışmaları engellendi.
- Eşzamanlı görev atamalarında PostgreSQL transaction advisory lock koruması
  eklendi.
- Deadline geçince görevin aktif/yazılabilir kalması ve gecikmiş görünmesi
  uygulandı.
- Yönetici görev oluşturma, düzenleme, iptal ve tamamlama API/ekranları eklendi.
- Araştırmacının kendi görevlerini ve temel veri girişi ilerlemesini gördüğü
  ekran eklendi.
- Aynı araştırmacıya çakışmayan birden fazla görev verilebiliyor.

**Doğrulama**

- `npm test`: 10/10 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı; görev API ve sayfaları üretildi.

**Commit ve push**

- Commit başlığı: `feat: implement researcher assignments`
- Push hedefi: `origin/master`

**Sonraki adım**

- Faz 4: Person/relation yazma işlemlerini görev kapsamıyla sınırlandırma,
  API capability sonuçları ve ayrıntılı ilerleme görünümü.

### 2026-08-06 - Faz 2 tamamlandı

**Yapılanlar**

- Kullanıcı listeleme, oluşturma ve profil güncelleme API'leri eklendi.
- Çoklu rol atama, şifre sıfırlama ve aktif/pasif kullanıcı akışları eklendi.
- Pasife alınan kullanıcının aktif session kayıtları sonlandırılıyor.
- Kendi hesabını pasife alma ve son aktif yöneticiyi kaldırma/pasife alma
  engellendi.
- Özel rol oluşturma, rol permission'larını düzenleme ve rol aktifliği API'leri
  eklendi.
- Kullanıcı Yönetimi ve Roller/Yetkiler yönetim ekranları eklendi.
- Header navigasyonu kullanıcının permission'larına göre genişletildi.
- Kullanıcı ve rol form doğrulamaları test edildi.

**Doğrulama**

- `npm test`: 8/8 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı; yeni admin ve API route'ları üretildi.

**Commit ve push**

- Commit başlığı: `feat: implement user and role management`
- Push hedefi: `origin/master`

**Sonraki adım**

- Faz 3: Görev/kapsam şeması, çakışma koruması, deadline-gecikme hesabı ve
  yönetici/araştırmacı görev ekranları.

### 2026-08-06 - Faz 1 tamamlandı

**Yapılanlar**

- `roles`, `permissions`, `role_permissions` ve `user_roles` şemaları eklendi.
- Kullanıcılara görünen ad, aktiflik, şifre değiştirme, son giriş ve devre dışı
  bırakma alanları eklendi.
- Yönetici, kontrolcü ve araştırmacı rolleri ile permission eşleşmeleri
  migration ve seed içine alındı.
- Migration mevcut kullanıcıları yönetici rolüyle güvenli biçimde backfill
  edecek şekilde hazırlandı.
- Auth context kullanıcının aktif rollerini ve permission'larını döndürecek
  şekilde genişletildi.
- Pasif kullanıcının login ve mevcut session kullanımına devam etmesi
  engellendi.
- Merkezi `requirePermission` ve API permission helper'ı eklendi.
- CLI kullanıcı oluşturma aracı rol atamasını destekleyecek şekilde yenilendi.

**Doğrulama**

- `npm test`: 6/6 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı.
- `git diff --check`: commit öncesinde çalıştırılacak.

**Commit ve push**

- Commit başlığı: `feat: add database backed authorization`
- Push hedefi: `origin/master`

**Sonraki adım**

- Faz 2: Kullanıcı listeleme, oluşturma, güncelleme, rol atama, aktif/pasif ve
  şifre sıfırlama API/arayüzlerinin implementasyonu.

### 2026-08-06 - Faz 0 tamamlandı

**Yapılanlar**

- Mevcut kullanıcı, session, person, relation ve audit yapısı incelendi.
- Rol/permission, kullanıcı güvenliği ve çoklu rol modeli tanımlandı.
- Araştırmacı görevleri ve çakışmayan dış kaynak ID kapsamları tanımlandı.
- Deadline sonrasında yetkinin devam etmesi kesinleştirildi.
- Veri girişi ve kontrol ilerleme ölçümleri ayrıştırıldı.
- Tek memleket modeli tanımlandı.
- Kontrole gönderme, düzeltme isteme, yeniden gönderme ve onay akışı
  tanımlandı.
- Onayın güncelliğini korumak için içerik versiyonlama planlandı.
- API, UI, audit, migration, test ve yayın planları oluşturuldu.

**Dosyalar**

- `docs/business/user-management-implementation-plan.md`
- `docs/business/user-management-progress-log.md`

**Doğrulama**

- Markdown dosyalarının repository içinde okunabilirliği kontrol edildi.
- `git diff --check` çalıştırıldı ve hata bulunmadı.
- Bu adım yalnızca dokümantasyon içerdiği için uygulama test/build sonucu
  değiştirmemelidir.

**Commit ve push**

- Commit başlığı: `docs: add user management implementation roadmap`
- Push hedefi: `origin/master`

**Sonraki adım**

- Faz 1: RBAC şeması, seed/backfill, auth context ve merkezi authorization
  altyapısının implementasyonu.

## Faz kontrol listeleri

### Faz 1 - RBAC ve kullanıcı güvenliği

- [x] Drizzle rol/permission/user-role şeması
- [x] Kullanıcı aktiflik ve profil alanları
- [x] Migration üretimi ve incelemesi
- [x] Başlangıç rol/permission seed'i
- [x] Mevcut kullanıcı yönetici backfill'i
- [x] Auth user context genişletmesi
- [x] Merkezi permission servisi
- [x] Son yönetici koruması (servis katmanı için kural hazır; Faz 2 API'de uygulanacak)
- [x] Unit ve entegrasyon testleri
- [x] Commit ve push

### Faz 2 - Kullanıcı yönetimi

- [x] Kullanıcı liste/oluşturma/güncelleme API'leri
- [x] Rol atama API'si
- [x] Aktif/pasif kullanıcı akışı
- [x] Şifre sıfırlama
- [x] Kullanıcı yönetim ekranı
- [x] Navigasyon permission görünürlüğü
- [x] Audit ve testler
- [x] Commit ve push

### Faz 3 - Görev yönetimi

- [x] Assignment ve scope şeması
- [x] Çakışma koruması
- [x] Görev CRUD API'leri
- [x] Deadline/gecikme hesabı
- [x] Yönetici görev ekranları
- [x] Araştırmacı Görevlerim ekranı
- [x] Testler
- [x] Commit ve push

### Faz 4 - Görev bazlı veri yetkilendirmesi

- [x] Person create/update scope denetimi
- [x] Yöneticiye özel delete ve dış kaynak ID değişikliği
- [x] Relation kapsam denetimi
- [x] Hızlı oluşturma kapsam denetimi
- [x] API capability sonuçları
- [x] UI işlem görünürlüğü
- [x] İlerleme sorguları
- [x] Testler
- [x] Commit ve push

### Faz 5 - Memleket

- [ ] Homeland şeması
- [ ] Person nullable homeland bağlantısı
- [ ] Arama ve oluşturma API'leri
- [ ] Seçim/hızlı oluşturma UI'ı
- [ ] Normalizasyon ve mükerrer kontrolü
- [ ] Audit ve testler
- [ ] Commit ve push

### Faz 6 - Kontrol ve onay

- [ ] Review durumu ve geçmiş şeması
- [ ] İçerik versiyonlama
- [ ] Kontrole gönderme
- [ ] Düzeltme isteme ve yorum
- [ ] Yeniden gönderme
- [ ] Onay ve onay geri alma
- [ ] Kendi kaydını onaylama engeli
- [ ] Kontrol kuyruğu UI'ı
- [ ] Âlim sayfasında onay/geçmiş görünümü
- [ ] Yarış durumu ve entegrasyon testleri
- [ ] Commit ve push

### Faz 7 - Raporlama ve production hazırlığı

- [ ] Yönetici araştırmacı ilerleme görünümü
- [ ] Gecikmiş görev raporu
- [ ] Veri girişi ve kontrol metrikleri
- [ ] Sorgu/indeks optimizasyonu
- [ ] Migration ve backfill provası
- [ ] Production smoke test
- [ ] Operasyon dokümantasyonu
- [ ] Commit ve push

## Kayıt tutma kuralı

Her anlamlı ve doğrulanmış geliştirme adımı sonrasında:

1. İlgili fazın checklist'i ve yüzdesi güncellenir.
2. Tarihli yeni ilerleme kaydı eklenir.
3. Çalıştırılan test/lint/build komutları ve sonuçları yazılır.
4. Bilinen riskler ve sonraki adım kaydedilir.
5. Kod ve seyir defteri aynı anlamlı commit içinde tutulur.
6. Commit mevcut uzak branche push edilir.

Henüz doğrulanmamış veya tamamlanmamış işler tamamlandı olarak işaretlenmez.
