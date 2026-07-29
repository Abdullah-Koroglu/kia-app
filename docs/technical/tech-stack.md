# Kıraat Ağı - Teknik Yön ve Uygulama İlkeleri

## Genel yaklaşım

Uygulama tek bir full-stack Next.js projesi olarak geliştirilecektir.

Temel amaçlar:

- Tek repository ve tek uygulama
- Basit geliştirme ve deployment süreci
- Gereksiz katmanlardan kaçınma
- Sade, açık ve hızlı veri giriş ekranları
- Faz 1 ihtiyaçlarının dışına çıkmama

Kesin paket sürümleri proje kurulurken belirlenecektir.

## Uygulama

- Full-stack framework: `Next.js`
- Dil: `TypeScript`
- Arayüz: `React`
- Stil sistemi: `Tailwind CSS`
- Hazır bileşenler: `shadcn/ui`
- Veritabanı: Mevcut sunucudaki ortak `PostgreSQL 16`
- Uygulama database'i: Ayrı `qiraat_atlas` database'i

Sunucu ve database ayrıntıları için
[deployment-constraints.md](./deployment-constraints.md) belgesi esas alınır.

## Arayüz ilkeleri

- Ekranlar sade, açık, yalın ve iş odaklı olacaktır.
- Mümkün olan her yerde `shadcn/ui` bileşenleri kullanılacaktır.
- Hazır bir shadcn bileşeniyle çözülebilen ihtiyaç için yeni bir görsel
  component tasarlanmayacaktır.
- Sayfa düzenini kurmak için gereken küçük uygulama component'leri
  oluşturulabilir; ancak yeni bir tasarım sistemi yazılmayacaktır.
- Ham CSS mümkün olduğunca yazılmayacaktır.
- Stil ve yerleşim için Tailwind class'ları kullanılacaktır.
- Gösterişli animasyonlar, yoğun renk kullanımı ve dekoratif ekranlar
  yapılmayacaktır.
- Veri tabloları, formlar, dialog'lar, butonlar, seçim alanları ve bildirimler
  shadcn yaklaşımıyla hazırlanacaktır.
- Mobil kullanılabilirlik korunacak; asıl öncelik masaüstü veri girişidir.

## Authentication

Authentication basit kullanıcı adı ve şifre modeliyle çalışacaktır.

Faz 1'de:

- E-posta alanı olmayacaktır.
- E-posta doğrulaması olmayacaktır.
- Şifre sıfırlama e-postası olmayacaktır.
- Sosyal giriş olmayacaktır.
- Kullanıcı kendi kendine kayıt olmayacaktır.
- Kullanıcı yönetim ekranı olmayacaktır.
- Kullanıcılar seed işlemiyle oluşturulacaktır.
- Bütün kullanıcılar aynı yetkilere sahip olacaktır.
- Uygulamanın tamamı login gerektirecektir.
- Karmaşık üyelik ve profil ekranları olmayacaktır.

### User entity'si

| Alan | Zorunlu | Açıklama |
|---|---:|---|
| `id` | Evet | Dahili kullanıcı ID'si |
| `username` | Evet | Benzersiz giriş adı |
| `passwordHash` | Evet | Güvenli şekilde hash'lenmiş şifre |
| `createdAt` | Sistem | Oluşturulma zamanı |
| `updatedAt` | Sistem | Son güncelleme zamanı |

### Şifre kararı

Şifreler veritabanında çıplak metin olarak tutulmayacaktır. Bunun yerine sade
bir parola hash kontrolü kullanılacaktır.

Bu karar:

- Kullanıcı açısından ek ekran oluşturmaz.
- E-posta veya şifre sıfırlama sistemi gerektirmez.
- Authentication akışını büyütmez.
- Veritabanına erişilmesi halinde gerçek şifrelerin doğrudan okunmasını
  engeller.

### Seed ile kullanıcı oluşturma

Kullanıcı oluşturmak için elle hash üretilmeyecektir. Kullanıcı adı ve normal
şifre seed işlemine verilir; seed şifreyi hashleyerek `User` tablosuna
kaydeder.

Kurallar:

- Başlangıç kullanıcıları seed ile oluşturulur.
- Seed tekrar çalıştırıldığında aynı kullanıcı adını mükerrer oluşturmaz.
- Seed normal şifreyi otomatik olarak hash'ler.
- Normal şifre tabloda saklanmaz.
- Kullanıcı bilgileri kaynak koduna açık şekilde yazılmaz; deployment
  environment değerlerinden alınır.
- Faz 1'de kullanıcı ekleme, silme ve şifre değiştirme ekranı bulunmaz.

Authentication akışı yalnızca şunlardan oluşur:

1. Kullanıcı adı ve şifre formu
2. Bilgilerin kontrol edilmesi
3. Başarılı girişte güvenli oturum cookie'si
4. Çıkış işlemi
5. Giriş yapılmamış kullanıcının bütün uygulama ekranlarından login sayfasına
   yönlendirilmesi

## Yetkilendirme

Rol ve ayrıntılı permission sistemi olmayacaktır. Login olan bütün kullanıcılar
aynı işlemleri yapabilir.

## Backend yaklaşımı

- Ayrı bir backend projesi kurulmayacaktır.
- Next.js içindeki server tarafı özellikleri kullanılacaktır.
- Database erişimi yalnızca server tarafında yapılacaktır.
- Database bağlantı bilgisi tarayıcıya gönderilmeyecektir.
- Form doğrulamaları hem kullanıcı arayüzünde hem server tarafında
  uygulanacaktır.
- İş kuralları entity modelinde tanımlanan sade kurallarla sınırlı olacaktır.
- Domain create, update ve delete işlemleri arka planda audit kaydı
  oluşturacaktır.
- Faz 1'de aynı kaydı iki kullanıcının eşzamanlı düzenlemesi beklenmemektedir.
  Optimistic locking, kayıt versiyonu veya düzenleme kilidi uygulanmayacaktır.

## Arama yaklaşımı

Kişi araması aşağıdaki davranışları birlikte destekleyecektir:

- Büyük/küçük harf duyarsız arama
- Türkçe karakterlerin farklı yazımlarına tolerans
- Yaklaşık eşleşme ve küçük yazım hatalarına tolerans
- Eşleşme gücüne göre sonuç sıralama

Bu davranış server tarafında uygulanır. Arama metni uygulama tarafında
Türkçe karakter, Unicode ve büyük/küçük harf farklılıklarını azaltacak şekilde
normalize edilir. PostgreSQL tarafında `unaccent` ve `pg_trgm` extension'ları
kullanılarak benzerlik araması yapılır. Sonuçlar tam ID eşleşmesi, tam metin
eşleşmesi ve benzerlik skoruna göre sıralanır.

Production ve staging ortamlarında bu iki extension'ın etkin olduğu ve
uygulama kullanıcısının gerekli kullanım yetkisine sahip olduğu deployment
öncesinde doğrulanır.

Business entity'leri için
[entity-model.md](../business/entity-model.md) belgesi esas alınır.
Audit altyapısı için [audit-plan.md](./audit-plan.md) belgesi esas alınır.

## Kapsam dışında

- Ayrı frontend ve backend uygulamaları
- Microservice mimarisi
- E-posta altyapısı
- Kullanıcı kayıt ekranı
- Kullanıcı yönetim ekranı
- E-posta doğrulaması
- Şifre sıfırlama e-postası
- Sosyal giriş
- Rol ve permission sistemi
- Login gerektirmeyen uygulama ekranları
- Özel tasarım sistemi
- Büyük miktarda ham CSS
- Gereksiz client-side state yönetim kütüphaneleri
- Faz 1 için zorunlu olmayan cache veya queue altyapısı
- Optimistic locking veya kayıt düzenleme kilidi
- Ağ görünümü ve ilişki zinciri hesaplamaları
- Analiz ekranları
- Audit kayıtlarını gösteren kullanıcı arayüzü veya dışarı açık API

## Henüz kesinleştirilecek teknik kararlar

- ORM ve migration aracı
- Authentication oturumunun kullanılacağı sade teknik yöntem
- Production uygulama servisinin adı, portu ve domain'i
