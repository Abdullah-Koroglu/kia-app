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
| Faz 1 - RBAC ve kullanıcı güvenliği | Başlanmadı | %0 | 2026-08-06 |
| Faz 2 - Kullanıcı yönetimi | Başlanmadı | %0 | 2026-08-06 |
| Faz 3 - Görev yönetimi | Başlanmadı | %0 | 2026-08-06 |
| Faz 4 - Görev bazlı veri yetkilendirmesi | Başlanmadı | %0 | 2026-08-06 |
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

- [ ] Drizzle rol/permission/user-role şeması
- [ ] Kullanıcı aktiflik ve profil alanları
- [ ] Migration üretimi ve incelemesi
- [ ] Başlangıç rol/permission seed'i
- [ ] Mevcut kullanıcı yönetici backfill'i
- [ ] Auth user context genişletmesi
- [ ] Merkezi permission servisi
- [ ] Son yönetici koruması
- [ ] Unit ve entegrasyon testleri
- [ ] Commit ve push

### Faz 2 - Kullanıcı yönetimi

- [ ] Kullanıcı liste/oluşturma/güncelleme API'leri
- [ ] Rol atama API'si
- [ ] Aktif/pasif kullanıcı akışı
- [ ] Şifre sıfırlama
- [ ] Kullanıcı yönetim ekranı
- [ ] Navigasyon permission görünürlüğü
- [ ] Audit ve testler
- [ ] Commit ve push

### Faz 3 - Görev yönetimi

- [ ] Assignment ve scope şeması
- [ ] Çakışma koruması
- [ ] Görev CRUD API'leri
- [ ] Deadline/gecikme hesabı
- [ ] Yönetici görev ekranları
- [ ] Araştırmacı Görevlerim ekranı
- [ ] Testler
- [ ] Commit ve push

### Faz 4 - Görev bazlı veri yetkilendirmesi

- [ ] Person create/update scope denetimi
- [ ] Yöneticiye özel delete ve dış kaynak ID değişikliği
- [ ] Relation kapsam denetimi
- [ ] Hızlı oluşturma kapsam denetimi
- [ ] API capability sonuçları
- [ ] UI işlem görünürlüğü
- [ ] İlerleme sorguları
- [ ] Testler
- [ ] Commit ve push

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
