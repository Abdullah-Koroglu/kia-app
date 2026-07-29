# Kıraat Ağı - Sayfalar ve Kullanıcı Akışları

## Genel kapsam

Faz 1 arayüzü iki ana iş sayfasından oluşur:

1. Kişiler sayfası
2. Kişi detay sayfası

Authentication için ayrıca sade bir login sayfası bulunur. Dashboard, ayrı
ilişki sayfası, profil sayfası, sözlük yönetim sayfası, analiz sayfası ve ağ
görünümü yapılmaz.

Kullanıcıların yaptığı veri değişiklikleri arka planda audit kaydı oluşturur.
Faz 1'de audit kayıtlarını gösteren sayfa, modal veya API bulunmaz. Audit
kuralları için [audit-plan.md](../technical/audit-plan.md) belgesi esas alınır.

Kişiler ve ilişkiler araştırmacılar tarafından uygulama ekranlarından tek tek
girilir. Faz 1'de toplu import veya dosyadan veri yükleme ekranı bulunmaz.

## Route yapısı

| Route | Açıklama |
|---|---|
| `/login` | Kullanıcı giriş sayfası |
| `/persons` | Kişi listesi ve kişi yönetimi |
| `/persons/[id]` | Kişi detayı, hocaları ve talebeleri |
| `/` | Kullanıcıyı `/persons` sayfasına yönlendirir |

Login olmayan kullanıcı bütün uygulama route'larından `/login` sayfasına
yönlendirilir.

## Ortak sayfa yapısı

Login sonrasındaki sayfalarda sade bir üst bar bulunur:

- Sol tarafta uygulama adı: `Kıraat Ağı`
- Kişiler sayfasına giden bağlantı
- Sağ tarafta giriş yapan kullanıcı adı
- Çıkış butonu

Sidebar, dashboard menüsü ve çok seviyeli navigasyon kullanılmaz.

## 1. Login sayfası

### Amaç

Kullanıcının uygulamaya kullanıcı adı ve şifreyle giriş yapmasını sağlar.

### Alanlar

- Kullanıcı adı
- Şifre
- Giriş butonu

### Davranışlar

- Başarılı girişten sonra kullanıcı `/persons` sayfasına yönlendirilir.
- Hatalı kullanıcı adı veya şifrede sade bir hata mesajı gösterilir.
- Login olmuş kullanıcı `/login` sayfasına giderse `/persons` sayfasına
  yönlendirilir.
- E-posta, kayıt olma ve şifre sıfırlama bağlantısı bulunmaz.

### Arayüz

Sayfanın ortasında küçük bir shadcn `Card` içinde login formu gösterilir.

## 2. Kişiler sayfası

Route:

```text
/persons
```

### Amaç

Kişilerin aranması, listelenmesi, oluşturulması, düzenlenmesi ve detaylarına
gidilmesini sağlar.

### Üst alan

- Sayfa başlığı: `Kişiler`
- Arama kutusu
- `Yeni Kişi` butonu

### Arama

Tek bir arama kutusu kullanılır. Arama aşağıdaki alanlarda çalışır:

- `extSourceId`
- `name`
- `nameDescription`

Arama:

- Büyük/küçük harf duyarsız çalışır.
- Türkçe karakterlerin farklı yazımlarını dikkate alır.
- Yaklaşık eşleşmeyi destekler; küçük yazım farklılıkları ve yazım hataları
  sonuç bulunmasını tamamen engellemez.
- En güçlü eşleşmeleri önce gösterir.

Arama yapıldığında liste ilk sayfaya döner.

### Filtreler

Filtreler kişiler grid'inin üstünde, arama alanıyla birlikte gösterilir:

- Hoca olan kişiye göre
- Talebe olan kişiye göre
- Doğum yılına göre
- Vefat yılına göre

Filtreler birlikte kullanılabilir. Bir filtre değiştiğinde liste ilk sayfaya
döner. Aktif filtreler tek tek veya topluca temizlenebilir.

### Kişiler grid'i

| Sütun | Açıklama |
|---|---|
| Dış Kaynak ID | `extSourceId` |
| İsim | Kişinin kısa gösterim adı |
| İsim Açıklaması | Tam isim ve ayırt edici açıklama |
| Doğum | Varsa Hicrî ve Miladî doğum yılı |
| Vefat | Varsa Hicrî ve Miladî vefat yılı |
| İşlemler | Detay, düzenle ve sil işlemleri |

### Grid davranışları

- Liste varsayılan olarak `extSourceId` değerine göre artan sıralanır.
- Sayfa başına varsayılan 50 kişi gösterilir.
- Listenin altında sade sayfalama kontrolleri bulunur.
- Kişinin ismine veya satırdaki detay işlemine tıklanınca
  `/persons/[id]` sayfası açılır.
- Uzun isim açıklamaları tek satırda kısaltılarak gösterilebilir.

### İşlemler

- Detaya git
- Düzenle
- Sil

İşlemler sade butonlar veya shadcn `DropdownMenu` içinde gösterilebilir.

## Kişi oluşturma ve düzenleme modalı

`Yeni Kişi` butonu oluşturma modalını açar. Griddeki `Düzenle` işlemi aynı
modalı mevcut bilgilerle açar.

### Alanlar

| Alan | Zorunlu |
|---|---:|
| Dış kaynak ID | Evet |
| Kısa isim | Evet |
| İsim açıklaması | Hayır |
| Hicrî doğum yılı | Hayır |
| Miladî doğum yılı | Hayır |
| Hicrî vefat yılı | Hayır |
| Miladî vefat yılı | Hayır |
| Detay notu | Hayır |

### Butonlar

- Kaydet
- İptal

### Kurallar

- `extSourceId` boş bırakılamaz ve benzersiz olmalıdır.
- `extSourceId` yalnızca integer değer kabul eder.
- Kısa isim boş bırakılamaz.
- Sayısal yıl alanlarına metin girilemez.
- Aynı takvimde doğum ve vefat yılı girilmişse vefat yılı doğum yılından
  küçük olamaz.
- Kayıt başarılı olduğunda modal kapanır ve grid güncellenir.
- Hata durumunda modal açık kalır ve ilgili hata gösterilir.

### Kullanılacak arayüz parçaları

- shadcn `Dialog`
- shadcn `Input`
- shadcn `Textarea`
- shadcn `Button`
- Form alanı hata mesajları

## Kişi silme akışı

- Silme işleminden önce shadcn `AlertDialog` ile onay istenir.
- Kişinin herhangi bir hoca veya talebe ilişkisi varsa kişi silinemez.
- Böyle bir durumda kullanıcıya önce kişinin ilişkilerini silmesi gerektiği
  bildirilir.
- İlişkisi bulunmayan kişi onay sonrasında silinebilir.

İlişkilerin kişiyle beraber otomatik silinmesi uygulanmaz.

## 3. Kişi detay sayfası

Route:

```text
/persons/[id]
```

### Amaç

Seçilen kişinin temel bilgilerini, hocalarını ve talebelerini aynı sayfada
gösterir. İlişki ekleme, düzenleme ve silme işlemleri buradan yapılır.

### Sayfa sıralaması

```text
Kişilere Dön

HOCALARI
[Hocalar grid'i]
[Hoca Ekle]

KİŞİ BİLGİLERİ
İsim
Dış kaynak ID / İsim açıklaması
Doğum ve vefat bilgileri
Detay notu
[Kişiyi Düzenle]

[Talebe Ekle]
[Talebeler grid'i]
TALEBELERİ
```

Görsel yerleşimde kişinin ismi sayfanın orta bölümünde belirgin biçimde
gösterilir. Hocalar üstte, talebeler altta bulunur.

### Kişi bilgi alanı

- Kısa isim
- Dış kaynak ID
- İsim açıklaması
- Hicrî ve Miladî doğum yılı
- Hicrî ve Miladî vefat yılı
- Detay notu
- Kişiyi düzenle butonu

## Hocalar grid'i

Seçilen kişinin ders aldığı kişileri gösterir.

| Sütun | Açıklama |
|---|---|
| Dış Kaynak ID | Hocanın `extSourceId` değeri |
| Hoca | Hocanın kısa adı |
| Yöntem | Arz, Semâ vb. |
| Kapsam | Kıraat, hatim, harfler vb. |
| Kesinlik | İlişkinin kesinlik değeri |
| Mekân | Varsa ilişkinin gerçekleştiği yer |
| Not | İlişki detay notunun kısa gösterimi |
| İşlemler | Düzenle ve sil |

### Davranışlar

- Grid'in üstünde yöntem, kapsam, kesinlik ve mekân filtreleri bulunur.
- Filtreler birlikte kullanılabilir ve topluca temizlenebilir.
- Hoca ismine tıklanınca hocanın detay sayfasına gidilir.
- Uzun ilişki notu grid içinde tek satır kısaltılarak gösterilir.
- Tam not ilişki düzenleme modalında görülebilir.
- `Hoca Ekle` butonu hoca ekleme modalını açar.

## Talebeler grid'i

Seçilen kişiden ders veya rivayet alan kişileri gösterir.

| Sütun | Açıklama |
|---|---|
| Dış Kaynak ID | Talebenin `extSourceId` değeri |
| Talebe | Talebenin kısa adı |
| Yöntem | Arz, Semâ vb. |
| Kapsam | Kıraat, hatim, harfler vb. |
| Kesinlik | İlişkinin kesinlik değeri |
| Mekân | Varsa ilişkinin gerçekleştiği yer |
| Not | İlişki detay notunun kısa gösterimi |
| İşlemler | Düzenle ve sil |

### Davranışlar

- Grid'in üstünde yöntem, kapsam, kesinlik ve mekân filtreleri bulunur.
- Filtreler birlikte kullanılabilir ve topluca temizlenebilir.
- Talebe ismine tıklanınca talebenin detay sayfasına gidilir.
- Uzun ilişki notu grid içinde tek satır kısaltılarak gösterilir.
- Tam not ilişki düzenleme modalında görülebilir.
- `Talebe Ekle` butonu talebe ekleme modalını açar.

## İlişki oluşturma ve düzenleme modalı

Aynı modal ilişki ekleme ve düzenleme için kullanılır.

### Hoca ekleme modu

- Detay sayfasındaki mevcut kişi otomatik olarak talebedir.
- Mevcut kişi modal içinde gösterilir fakat değiştirilemez.
- Kullanıcı hoca olacak kişiyi arayıp seçer.
- Aranan kişi henüz kayıtlı değilse seçim alanındaki `Yeni Kişi Oluştur`
  işlemiyle kişi oluşturma modalı açılır.
- Yeni kişi başarıyla oluşturulduğunda ilişki modalına dönülür ve oluşturulan
  kişi otomatik seçilir.

Oluşan ilişki:

```text
Seçilen kişi -> Detay sayfasındaki kişi
```

### Talebe ekleme modu

- Detay sayfasındaki mevcut kişi otomatik olarak hocadır.
- Mevcut kişi modal içinde gösterilir fakat değiştirilemez.
- Kullanıcı talebe olacak kişiyi arayıp seçer.
- Aranan kişi henüz kayıtlı değilse seçim alanındaki `Yeni Kişi Oluştur`
  işlemiyle kişi oluşturma modalı açılır.
- Yeni kişi başarıyla oluşturulduğunda ilişki modalına dönülür ve oluşturulan
  kişi otomatik seçilir.

Oluşan ilişki:

```text
Detay sayfasındaki kişi -> Seçilen kişi
```

### Modal alanları

| Alan | Zorunlu |
|---|---:|
| Hoca veya talebe seçimi | Evet |
| Yöntem | Evet |
| Kapsam | Evet |
| Kesinlik | Evet |
| Mekân | Hayır |
| Detay notu | Hayır |

### Butonlar

- Kaydet
- İptal

### Kurallar

- Bir kişi kendisinin hocası veya talebesi olarak seçilemez.
- Farklı kişiler üzerinden oluşan döngüsel ilişkilere izin verilir; Faz 1'de
  döngü kontrolü yapılmaz.
- Yöntem, kapsam ve kesinlik boş bırakılamaz.
- Mekân bilinmiyorsa boş bırakılır.
- Tamamen aynı ilişki ikinci kez oluşturulamaz.
- Aynı iki kişi arasında farklı yöntem veya kapsamlarla ayrı ilişkiler
  oluşturulabilir.
- Düzenleme sırasında mevcut ilişki bilgileri modalda hazır gelir.
- Başarılı kayıttan sonra modal kapanır ve ilgili grid güncellenir.

### Kullanılacak arayüz parçaları

- shadcn `Dialog`
- Kişi arama ve seçme alanı
- shadcn `Select`
- shadcn `Textarea`
- shadcn `Button`

## İlişki silme akışı

- Griddeki sil işlemi shadcn `AlertDialog` açar.
- Kullanıcıya hoca ve talebe isimleriyle hangi ilişkinin silineceği gösterilir.
- Kullanıcı onaylarsa yalnızca seçilen ilişki silinir.
- Kişi kayıtları silinmez.
- İşlem sonrasında ilgili grid güncellenir.

## Sözlük değerleri

Faz 1'de ayrı sözlük yönetim sayfası bulunmaz.

Aşağıdaki değerler seed ile oluşturulur:

- Yöntemler
- Kapsamlar
- Kesinlik dereceleri
- Mekânlar

İlişki modalında bu değerler seçim alanı olarak gösterilir. Yeni sözlük değeri
eklemek Faz 1 kullanıcı arayüzünün parçası değildir.

## Ortak ekran durumları

### Yükleniyor

Grid veya detay verisi yüklenirken sade bir yükleniyor göstergesi gösterilir.

### Boş liste

- Kişi yoksa: `Henüz kişi bulunmuyor.`
- Hoca yoksa: `Bu kişinin kayıtlı hocası bulunmuyor.`
- Talebe yoksa: `Bu kişinin kayıtlı talebesi bulunmuyor.`
- Arama sonucu yoksa: `Aramanızla eşleşen kişi bulunamadı.`

### Hata

Kullanıcıya teknik ayrıntı içermeyen kısa bir hata mesajı gösterilir:

```text
İşlem tamamlanamadı. Lütfen tekrar deneyin.
```

Alan doğrulama hataları ilgili form alanının altında gösterilir.

## Arayüz sadelik kuralları

- Dashboard yapılmaz.
- Ağ görünümü, ilişki zinciri ve analiz sayfaları yapılmaz.
- Sidebar kullanılmaz.
- Ayrı ilişki listeleme sayfası yapılmaz.
- Ayrı sözlük yönetim sayfası yapılmaz.
- Create ve update işlemleri modal içinde yapılır.
- Silme işlemleri onay penceresiyle gerçekleştirilir.
- Ham CSS mümkün olduğunca yazılmaz.
- Tailwind CSS ve shadcn/ui bileşenleri kullanılır.
- Gereksiz animasyon, grafik, kart kalabalığı ve dekoratif alan yapılmaz.
- Masaüstü veri girişi önceliklidir; mobil kullanılabilirlik korunur.

## Temel kullanıcı akışları

### Kişi oluşturma

```text
Login -> Kişiler -> Yeni Kişi -> Formu doldur -> Kaydet -> Liste güncellenir
```

### Kişi düzenleme

```text
Kişiler -> Düzenle -> Bilgileri değiştir -> Kaydet -> Liste güncellenir
```

### Kişi detayına gitme

```text
Kişiler -> Kişi adına tıkla -> Kişi detay sayfası
```

### Hoca ekleme

```text
Kişi detayı -> Hoca Ekle -> Hocayı ve ilişki bilgilerini seç -> Kaydet
```

### Talebe ekleme

```text
Kişi detayı -> Talebe Ekle -> Talebeyi ve ilişki bilgilerini seç -> Kaydet
```

### İlişkili kişinin detayına gitme

```text
Kişi detayı -> Hoca veya talebe adına tıkla -> İlgili kişinin detay sayfası
```

### İlişki düzenleme

```text
Kişi detayı -> İlişkiyi düzenle -> Bilgileri değiştir -> Kaydet
```

### İlişki silme

```text
Kişi detayı -> İlişkiyi sil -> Onayla -> Grid güncellenir
```

## Sayfa kapsamı tamamlanma ölçütü

- Login olmayan kullanıcı uygulama ekranlarına erişemez.
- Kullanıcı kişi arayabilir ve sayfalı listede görüntüleyebilir.
- Kişi araması büyük/küçük harf, Türkçe karakter farklılıkları ve yaklaşık
  eşleşmeyi destekler.
- Kişi, hoca ve talebe listelerinin filtreleri ilgili listenin üstünde
  gösterilir.
- Kişi modal üzerinden oluşturulabilir ve düzenlenebilir.
- İlişkisi olmayan kişi onayla silinebilir.
- Kişi detayında hocalar üstte, kişi ortada ve talebeler altta gösterilir.
- Hoca ve talebe ilişkileri modal üzerinden oluşturulabilir ve düzenlenebilir.
- İlişkide seçilecek kişi kayıtlı değilse ilişki akışı bozulmadan yeni kişi
  oluşturulabilir ve otomatik seçilebilir.
- İlişki onayla silinebilir.
- İlişkili kişinin adına tıklanarak onun detayına gidilebilir.
- Sözlük değerleri seed üzerinden gelir.
- Arayüz shadcn/ui ve Tailwind CSS ağırlıklı, sade ve iş odaklıdır.
- Kişi ve ilişki değişiklikleri kullanıcıya ek işlem yaptırmadan arka planda
  audit kaydı oluşturur.
