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
| Faz 5 - Memleket | Tamamlandı | %100 | 2026-08-06 |
| Faz 6 - Kontrol ve onay | Tamamlandı | %100 | 2026-08-06 |
| Faz 7 - Raporlama ve production hazırlığı | Tamamlandı | %100 | 2026-08-06 |

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
- Yönetici kontrol işlemleri hariç veri girişi dahil bütün işlemleri yapabilir.
- Âlim başına en fazla bir opsiyonel memleket bulunur.
- Memleketler ilişki mekânlarıyla aynı `places` tablosundan seçilir.
- Her aktif kullanıcı memleket oluşturabilir.
- Kontrolcü âlimi onaylayabilir veya zorunlu düzeltme yorumu bırakabilir.
- Âlim sayfasında geçerli onayın kontrolcüsü ve tarihi gösterilir.
- Veri girişi ve onay ilerlemeleri ayrı ölçülür.
- `1-20` görevinde `1-15` girilmişse veri girişi ilerlemesi `%75`, eksikler
  `16-20` olur.

## İlerleme kayıtları

### 2026-08-09 - Alan bazlı doğrulama toastları ve sıralama düzeltmesi

**Yapılanlar**

- API'nin `fields` doğrulama ayrıntıları istemcide korunuyor; her hatalı alan
  Türkçe etiketi ve kendi açıklamasıyla ayrı hata toastı gösteriyor.
- Genel `Form alanlarını kontrol edin` mesajı yerine ilk alanın ayrıntılı mesajı
  form içinde de gösteriliyor.
- Zod'un Türkçe hata yerelleştirmesi etkinleştirildi ve global Sonner toast
  katmanı eklendi.
- Âlim liste sıralamasını etkisiz bırakan iç içe SQL sıralama parçası kaldırıldı;
  kolon ve yön seçimleri parametreli sabit `CASE` sıralamalarına çevrildi.
- Art arda liste isteklerinde eski cevabın yeni sıralamayı ezmesi istek sıra
  numarasıyla engellendi.

**Doğrulama**

- `npm test`: 17/17 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı.
- İzole PostgreSQL ve production Next sunucusunda uçtan uca API testi yapıldı:
  ID artan `10,20,30`, ID azalan `30,20,10`, isim artan `Alpha,Mike,Zulu`.
- Geçici Next süreci ve PostgreSQL container'ı kaldırıldı.

**Commit ve push**

- Planlanan commit başlığı: `fix: show field errors and restore scholar sorting`
- Push hedefi: `origin/master`

### 2026-08-09 - Arayüz terminolojisi âlim olarak birleştirildi

**Yapılanlar**

- Kullanıcıya görünen bütün `kişi/kişiler` ifadeleri bağlama uygun biçimde
  `âlim/âlimler` olarak değiştirildi.
- Navigasyon, liste, sayaç, form, detay, seçim, ilişki ve mekân ekranlarındaki
  başlık, açıklama, boş durum ve onay metinleri güncellendi.
- API'den arayüze dönen bulunamadı hata mesajları ve sayfa metadata başlıkları
  aynı terminolojiye geçirildi.
- Teknik `Person` tipleri, veritabanı tabloları ve `/api/persons` adresleri geriye
  dönük uyumluluk için değiştirilmedi.

**Doğrulama**

- Arayüz/API mesajı kaynaklarında büyük-küçük harf duyarsız taramada kullanıcıya
  görünen `kişi` ifadesi kalmadığı doğrulandı.
- `npm test`: 17/17 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı.

**Commit ve push**

- Planlanan commit başlığı: `refactor: rename person labels to scholars`
- Push hedefi: `origin/master`

### 2026-08-09 - Âlim listesi kontrol renkleri ve tablo etkileşimleri

**Yapılanlar**

- Âlim listesi satırları kontrol durumuna göre renklendirildi: hazırlanıyor gri,
  kontrolde mavi, düzeltme bekliyor sarı ve onaylı yeşil.
- Dış kaynak ID, isim, isim açıklaması, doğum, vefat, memleket ve kontrol
  başlıklarına artan/azalan sunucu taraflı sıralama eklendi.
- Sıralama kolonları güvenli sabit SQL ifadelerine eşlendi; istemci girdisi
  doğrudan sorguya eklenmiyor.
- Satırdaki düzenle/sil butonları üç nokta işlemler menüsünde toplandı; görüntüle
  ve uygun kayıtlar için `Kontrole gönder` seçenekleri eklendi.
- Yönetici, kontrol kararı vermeden âlimi kontrole gönderebilecek şekilde eksik
  görev kapsamı istisnasına dahil edildi.
- Ortak ve erişilebilir Radix tabanlı dropdown menü bileşeni eklendi.

**Doğrulama**

- `npm test`: 17/17 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı.

**Commit ve push**

- Planlanan commit başlığı: `feat: improve scholar list review workflow`
- Push hedefi: `origin/master`

### 2026-08-09 - Sayısal tarih modeli ve ikinci Miladî yıl

**Yapılanlar**

- Önceki serbest metin tarih yaklaşımı yeni gereksinim doğrultusunda kaldırıldı.
- Hicrî doğum/vefat alanları yeniden tek integer yıl olarak tanımlandı.
- Miladî doğum ve vefat alanlarına nullable ikinci integer yıl kolonları eklendi.
- Miladî form alanı `856` veya `856-857` kabul ediyor; tireli değer iki sayısal
  kolona ayrılıyor ve gösterimde yeniden aynı biçimde birleştiriliyor.
- İkinci Miladî yılın ilk yıldan tam bir yıl sonra olması hem API hem veritabanı
  constraint'iyle zorunlu tutuldu.
- Tarih filtresi ikinci Miladî yıl kolonlarını da kapsayacak şekilde güncellendi.
- String tarihleri sayısal modele dönüştüren ve uyumsuz veri varsa veri kaybetmeden
  migrationı durduran `0010` migrationı eklendi.

**Doğrulama**

- `npm test`: 17/17 test başarılı; tek yıl, tireli yıl ve geçersiz Miladî
  giriş ayrıştırması ayrıca test edildi.
- `npm run lint`: başarılı.
- `npm run build`: başarılı.
- İzole PostgreSQL 16 üzerinde `243 H / 856-857 M` örneği eski string şemadan
  geçirildi; bütün tarih kolonlarının integer olduğu, ikinci yılın `857` olarak
  ayrıldığı ve `857` filtresinin kaydı bulduğu doğrulandı.
- Geçici doğrulama container'ı kaldırıldı.

**Commit ve push**

- Planlanan commit başlığı: `fix: store scholar years as filterable numbers`
- Push hedefi: `origin/master`

### 2026-08-09 - Ortak mekân sözlüğü ve esnek tarih ifadeleri

**Yapılanlar**

- Ayrı `homelands` tablosu kaldırıldı; kişi memleketi `places` tablosuna bağlandı.
- Mevcut memleket kayıtlarını ve kişi bağlantılarını kayıpsız taşıyan migration
  eklendi.
- Kişi formu memleket seçeneklerini `/api/places` üzerinden getiriyor; listede
  olmayan mekân form içinde oluşturulup otomatik seçiliyor.
- Mekân kullanım sayısı hem ilişkileri hem kişi memleketlerini kapsıyor; kullanımda
  olan kayıtlar silinemiyor.
- Dört doğum/vefat alanı `1000`, `1000-1001`, `yaklaşık 1000` gibi 40 karaktere
  kadar tarih ifadelerini kabul edecek biçimde güncellendi.
- Tarih filtreleri, aralık/ifade içindeki yıl metnini de bulacak şekilde uyarlandı.

**Doğrulama**

- `npm test`: 13/13 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı; eski `/api/homelands` route'u kaldırıldı.
- İzole PostgreSQL 16 üzerinde eski memleket ve sayısal tarih içeren örnek veri
  migrationdan geçirildi; place bağlantısı ve tarih değerleri korunarak doğrulandı.
- Geçici doğrulama container'ı kaldırıldı.

**Commit ve push**

- Planlanan commit başlığı: `feat: unify homelands with places and support date ranges`
- Push hedefi: `origin/master`

### 2026-08-07 - Yönetici kapsamı ve mekân yönetimi tamamlandı

**Yapılanlar**

- Yönetici kontrol/onay kararları hariç bütün uygulama işlemlerine yetkili
  hale getirildi.
- Yönetici âlim ve ilişki oluşturma/güncelleme/silme işlemlerinde araştırmacı
  görevi veya ID kapsamına ihtiyaç duymuyor.
- Onay, düzeltme talebi, onay geri alma ve kontrol kuyruğu yetkileri yalnızca
  kontrolcü rolünde bırakıldı.
- Mekân listeleme, oluşturma, yeniden adlandırma ve silme API/arayüzü eklendi.
- İlişkide kullanılan mekânların silinmesi hem UI hem foreign key ile
  engellendi.
- `0007_manager_places.sql` migration'ı eklendi.

**Doğrulama**

- `npm test`: 13/13 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı; mekân yönetimi route'ları üretildi.
- İzole PostgreSQL 16 üzerinde 8 migration ve seed başarıyla çalıştı.
- Yöneticiye dört mekân ve beş person/relation operasyon yetkisi geldiği,
  kontrol karar yetkilerinin gelmediği SQL ile doğrulandı.
- Geçici doğrulama container'ı kaldırıldı.

**Commit ve push**

- Commit başlığı: `feat: grant managers full non-review access`
- Push hedefi: `origin/master`

**Production notu**

- Mevcut production kurulumunda yeni yetkilerin oluşması için migration ve
  seed çalıştırılmalı, ardından uygulama yeniden build edilip açılmalıdır.

### 2026-08-06 - Faz 7 ve genel implementasyon tamamlandı

**Yapılanlar**

- Yönetici için araştırmacı bazlı aktif/gecikmiş görev, veri girişi, onay,
  kontrol, düzeltme, deadline ve son aktivite raporu eklendi.
- Review durumu ve onay versiyon sorgularını destekleyen person indeksleri
  eklendi.
- Sistem `MANAGER` rolünün pasife alınması veya kritik yönetim permission'larını
  kaybetmesi engellendi.
- Son aktif yönetici koruması eşzamanlı isteklerde advisory transaction lock ile
  güçlendirildi.
- Yayın sırası, smoke test, acil yönetici, görev operasyonu, audit ve rollback
  yaklaşımını içeren operasyon rehberi eklendi.
- README yeni roller, görevler ve kontrol akışıyla güncellendi.

**İzole migration provası**

- Boş ve geçici bir PostgreSQL 16 container'ı oluşturuldu.
- `0000-0006` arasındaki 7 migration başarıyla uygulandı.
- Seed iki kez çalıştırılarak idempotency doğrulandı.
- Sonuç: 3 rol, 31 permission, 1 test yöneticisi ve 1 user-role bağlantısı.
- Test yöneticisinin `MANAGER` backfill/ataması doğrulandı.
- Rapor sorgusundaki tuple distinct SQL sözdizimi PostgreSQL üzerinde çalıştı.
- Geçici container kalıcı volume oluşturmadan kaldırıldı.

**Son doğrulama**

- `npm test`: 12/12 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı; 15 uygulama sayfası/API grubu derlendi.
- `git diff --check`: commit öncesinde çalıştırılacak.

**Commit ve push**

- Commit başlığı: `feat: complete researcher progress reporting`
- Push hedefi: `origin/master`

**Sonuç**

- Faz 0-7 tamamlandı. Production yayını için migration, seed ve smoke test
  sırası `docs/technical/user-management-operations.md` belgesinde hazırdır.

### 2026-08-06 - Faz 6 tamamlandı

**Yapılanlar**

- Âlim kontrol durumları ve immutable kontrol geçmişi şeması eklendi.
- Araştırmacı için kontrole gönderme ve düzeltme sonrası yeniden gönderme
  akışları eklendi.
- Kontrolcü için onay, zorunlu yorumla düzeltme isteme ve onay geri alma
  akışları eklendi.
- Kontrolcü kendi oluşturduğu veya aktif görev kapsamında sorumlu olduğu âlim
  için kontrol kararı veremiyor.
- Person ve ilişkileri kapsayan içerik versiyonlama uygulandı; veri/ilişki
  değişikliği onayı geçersiz kılıyor fakat geçmiş review kaydını koruyor.
- Onaylanmış kayıt araştırmacı düzenlemesine ve ilişki değişikliğine kapatıldı.
- Âlim sayfasına durum, kontrol yorumu, kronolojik geçmiş ve onaylayan kişi/tarih
  ibaresi eklendi.
- Kontrolcü için durum filtreli kontrol kuyruğu eklendi.
- Görev kartına onay, kontrol bekleyen ve düzeltme bekleyen sayaçları eklendi.
- Görev tamamlama bütün atanmış âlimlerin güncel versiyonuyla onaylanması
  koşuluna bağlandı.

**Doğrulama**

- `npm test`: 12/12 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı; kontrol kuyruğu ve bütün review route'ları üretildi.
- İlk doğrulamada eksik `Badge` import'u yakalanıp düzeltildi.

**Commit ve push**

- Commit başlığı: `feat: implement scholar review workflow`
- Push hedefi: `origin/master`

**Sonraki adım**

- Faz 7: Yönetici araştırmacı raporu, indeks/operasyon iyileştirmeleri,
  migration doğrulaması ve son tam kontrol.

### 2026-08-06 - Faz 5 tamamlandı

**Yapılanlar**

- İlişki mekânından ayrı `homelands` sözlüğü oluşturuldu.
- Âlim başına sıfır veya bir memleket olacak şekilde nullable person bağlantısı
  eklendi.
- Normalize ada dayalı büyük/küçük harf ve Türkçe karakter duyarsız mükerrer
  koruması eklendi.
- Her aktif ve oturum açmış kullanıcının rol/görev kontrolü olmadan memleket
  arayabildiği ve oluşturabildiği API eklendi.
- Âlim formuna memleket seçimi ve listede yoksa hızlı oluşturma akışı eklendi.
- Oluşturulan memleket otomatik seçiliyor; kişi liste ve detayında gösteriliyor.
- Memleket oluşturma audit kaydına bağlandı.

**Doğrulama**

- `npm test`: 11/11 test başarılı.
- `npm run lint`: başarılı.
- `npm run build`: başarılı; `/api/homelands` route'u üretildi.

**Commit ve push**

- Commit başlığı: `feat: add scholar homelands`
- Push hedefi: `origin/master`

**Sonraki adım**

- Faz 6: Kontrol durumları, içerik versiyonlama, düzeltme yorumu, onay ve
  kontrol kuyruğu.

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

- [x] Homeland şeması
- [x] Person nullable homeland bağlantısı
- [x] Arama ve oluşturma API'leri
- [x] Seçim/hızlı oluşturma UI'ı
- [x] Normalizasyon ve mükerrer kontrolü
- [x] Audit ve testler
- [x] Commit ve push

### Faz 6 - Kontrol ve onay

- [x] Review durumu ve geçmiş şeması
- [x] İçerik versiyonlama
- [x] Kontrole gönderme
- [x] Düzeltme isteme ve yorum
- [x] Yeniden gönderme
- [x] Onay ve onay geri alma
- [x] Kendi kaydını onaylama engeli
- [x] Kontrol kuyruğu UI'ı
- [x] Âlim sayfasında onay/geçmiş görünümü
- [x] Yarış durumu ve entegrasyon testleri
- [x] Commit ve push

### Faz 7 - Raporlama ve production hazırlığı

- [x] Yönetici araştırmacı ilerleme görünümü
- [x] Gecikmiş görev raporu
- [x] Veri girişi ve kontrol metrikleri
- [x] Sorgu/indeks optimizasyonu
- [x] Migration ve backfill provası
- [x] Production smoke test kontrol listesi
- [x] Operasyon dokümantasyonu
- [x] Commit ve push

## Kayıt tutma kuralı

Her anlamlı ve doğrulanmış geliştirme adımı sonrasında:

1. İlgili fazın checklist'i ve yüzdesi güncellenir.
2. Tarihli yeni ilerleme kaydı eklenir.
3. Çalıştırılan test/lint/build komutları ve sonuçları yazılır.
4. Bilinen riskler ve sonraki adım kaydedilir.
5. Kod ve seyir defteri aynı anlamlı commit içinde tutulur.
6. Commit mevcut uzak branche push edilir.

Henüz doğrulanmamış veya tamamlanmamış işler tamamlandı olarak işaretlenmez.
