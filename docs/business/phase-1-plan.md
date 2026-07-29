# Kıraat Ağı - Faz 1 Alt Faz Planı

Bu plan yalnızca Faz 1'in business kapsamını böler. Tech stack ve uygulama
mimarisi kararları ayrıca ele alınacaktır.

Entity tanımları için [entity-model.md](./entity-model.md) belgesi esas alınır.
Sayfalar ve kullanıcı akışları için [page-flows.md](./page-flows.md) belgesi
esas alınır.
Sunucu ve ortak PostgreSQL kararları için
[deployment-constraints.md](../technical/deployment-constraints.md) belgesi
esas alınır.
Audit altyapısı için [audit-plan.md](../technical/audit-plan.md) belgesi esas
alınır.

## Faz 1.0 - Karar kesinleştirme

- `Person`, `Relation`, `Method`, `Scope`, `Certainty` ve `Place` alanlarının
  kesinleştirilmesi
- Zorunlu alanların ve doğrulama kurallarının belirlenmesi
- `extSourceId` değerinin zorunlu, benzersiz ve integer olduğunun
  kesinleştirilmesi
- İlişkinin yönünün her zaman `Hoca -> Talebe` olduğunun kesinleştirilmesi
- Bir kişinin kendisiyle ilişkisinin yasak, farklı kişiler üzerinden oluşan
  döngülerin izinli olduğunun kesinleştirilmesi
- Faz 1 kapsam dışı konularının belgelenmesi

### Çıktı

Uygulamaya geçirilmeye hazır, birbiriyle uyumlu business ve teknik planlar.

## Faz 1.1 - Teknik temel

- Next.js ve TypeScript projesinin kurulması
- Tailwind CSS ve shadcn/ui temel kurulumunun yapılması
- ORM ve migration aracının seçilmesi
- PostgreSQL bağlantısının hazırlanması
- İlk database migration'larının oluşturulması
- Environment variable yapısının hazırlanması
- Temel test ve kod kalite altyapısının kurulması

## Faz 1.2 - Authentication ve audit omurgası

- Seed üzerinden kullanıcı oluşturma
- Kullanıcı adı ve şifreyle login
- Güvenli session cookie'si
- Logout ve login olmayan kullanıcı yönlendirmeleri
- Kişi ve ilişki create, update ve delete işlemlerinde kullanılacak ortak audit
  altyapısı
- İşlemi yapan kullanıcıyı ve işlem zamanını kaydetme
- Değişen alanların eski ve yeni değerlerini kaydetme
- Create ve delete işlemlerinde tam kayıt görüntüsünü koruma
- Login başarı, login hatası ve logout olaylarını kaydetme
- Seed işlemlerini `SYSTEM` olarak kaydetme
- Şifre, token ve secret alanlarını audit dışında bırakma
- Audit ile domain değişikliğini aynı transaction içinde çalıştırma

Audit omurgası veri değiştiren ekranlardan önce hazırlanır. Faz 1'de audit
görüntüleme ekranı ve audit API'si yapılmaz.

## Faz 1.3 - Sözlük seedleri ve kişi yönetimi

### Sözlükler

- Yöntemlerin seed ile oluşturulması
- Kapsamların seed ile oluşturulması
- Kesinlik derecelerinin seed ile oluşturulması
- Mekânların seed ile oluşturulması
- İlişki girişinde sözlük değerlerinin seçilebilir olması

Faz 1'de ayrı sözlük yönetim ekranı ve kullanıcı tarafından yeni sözlük değeri
ekleme işlemi bulunmaz.

### Kişi yönetimi

- Integer dış kaynak ID'siyle kişi ekleme
- Kişi düzenleme
- Kişi silme
- Kişi listeleme ve sayfalama
- `extSourceId` ile kişi bulma
- İsim ve isim açıklamasında arama
- Kişi detaylarını görüntüleme

Arama büyük/küçük harf duyarsız, Türkçe karakter farklılıklarına toleranslı ve
yaklaşık eşleşmeyi destekleyecek şekilde hazırlanır.

## Faz 1.4 - İlişki yönetimi ve kişi detay görünümü

- Hoca veya talebe olacak kayıtlı kişiyi arayıp seçme
- Seçilecek kişi kayıtlı değilse ilişki akışı içinden yeni kişi oluşturma ve
  otomatik seçme
- Yöntem, kapsam ve kesinlik seçme
- Opsiyonel mekân seçme
- İlişki detay notu yazma
- İlişki düzenleme
- İlişki silme
- Kişi detayında hocaları ve talebeleri ayrı listelerde gösterme

### Temel kontroller

- Bir kişi kendisinin hocası veya talebesi olamaz.
- Farklı kişiler üzerinden tekrar aynı kişiye dönen ilişki döngülerine izin
  verilir.
- Gerekli sözlük alanları boş bırakılamaz.
- Tamamen aynı ilişki ikinci kez oluşturulamaz.
- Aynı iki kişi arasında farklı yöntem veya kapsamlarla ayrı ilişkiler
  oluşturulabilir.

Faz 1'de aynı kaydı iki kullanıcının eşzamanlı düzenlemesi beklenmez; kayıt
kilidi veya optimistic locking yapılmaz.

## Faz 1.5 - Manuel veri girişi ve veri doğrulama

- Araştırmacıların kişileri uygulama ekranından tek tek oluşturması
- Araştırmacıların ilişkileri kişi detay ekranından tek tek oluşturması
- Her kişinin dış kaynak ID'sinin kontrol edilmesi
- Eksik zorunlu alanların raporlanması
- Kendisini işaret eden ilişkilerin bulunmadığının doğrulanması
- Aynı ilişkinin yanlışlıkla tekrar girilmediğinin doğrulanması
- Kişi ve ilişki değişikliklerinin audit kaydı oluşturduğunun doğrulanması

Faz 1'de toplu import, CSV/JSON yükleme veya otomatik veri aktarımı yapılmaz.
Yaklaşık 4.000 kişinin sisteme girilmesi yazılım geliştirme tesliminden ayrı
ilerleyen manuel araştırma ve veri giriş çalışmasıdır.

## Faz 1.6 - Arama ve filtreleme

- `extSourceId` ile doğrudan arama
- Kişi adı ve isim açıklamasında yaklaşık arama
- Hoca veya talebeye göre kişi filtreleme
- Doğum veya vefat yılına göre kişi filtreleme
- Hoca ve talebe listelerinde yönteme göre filtreleme
- Hoca ve talebe listelerinde kapsama göre filtreleme
- Hoca ve talebe listelerinde kesinliğe göre filtreleme
- Hoca ve talebe listelerinde mekâna göre filtreleme

Filtreler ayrı bir sayfada değil, filtreledikleri listenin üstünde gösterilir.

## Faz 1.7 - Son kontroller ve production hazırlığı

- Login ve yetkisiz erişim kontrolleri
- Kişi ve ilişki CRUD kabul testleri
- Arama, yaklaşık eşleşme ve filtreleme kontrolleri
- Audit transaction ve hassas veri kontrolleri
- Migration'ların production database'inde doğrulanması
- Uygulama health check ve hata loglarının doğrulanması
- `qiraat_atlas` yedekleme ve geri yükleme testinin yapılması
- Production environment ve secret değerlerinin doğrulanması
- Gerçek veriyle temel performans kontrolü

## Faz 1 dışında bırakılan konular

- Ağ görünümü
- İlişki zinciri bulma ve zincir analizleri
- Analiz ve istatistik sayfaları
- Ortak hoca veya ortak talebe hesaplamaları
- Etki skoru
- Toplu veri importu
- Sözlük yönetim ekranı
- Audit görüntüleme ekranı ve audit API'si
- Eşzamanlı düzenleme kilidi ve optimistic locking
- Rol ve ayrıntılı permission sistemi

## Faz 1 tamamlanma ölçütü

Faz 1 şu koşullarda tamamlanmış kabul edilir:

- Kullanıcı güvenli biçimde login ve logout olabiliyor.
- Kişiler integer `extSourceId` ile kaydedilebiliyor ve bulunabiliyor.
- Kişi araması büyük/küçük harf, Türkçe karakter farklılıkları ve yaklaşık
  eşleşmeyi destekliyor.
- Hoca-talebe ilişkileri yöntem, kapsam ve kesinlikle girilebiliyor.
- İlişkiye opsiyonel mekân eklenebiliyor.
- Kişi ve ilişki detay notları tutulabiliyor.
- Kişinin hocaları ve talebeleri görüntülenebiliyor.
- Kişi ve ilişki listeleri kendi üstlerindeki filtrelerle filtrelenebiliyor.
- İlişkide seçilecek kişi mevcut değilse akış içinden oluşturulabiliyor.
- Veri değişikliklerinde kullanıcı, zaman, eski değer ve yeni değer audit
  kayıtlarında tutuluyor.
- Yedekleme ve geri yükleme doğrulanmış durumda.
