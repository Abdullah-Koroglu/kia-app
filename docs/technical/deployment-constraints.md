# Kıraat Ağı - Sunucu ve Veritabanı Kısıtları

## Mevcut sunucu yapısı

Sunucuda Docker Compose ile çalışan ortak bir PostgreSQL 16 servisi
bulunmaktadır.

Mevcut production PostgreSQL bağlantı noktası:

```text
Host: postgres
Port: 5432
Mevcut database: fitcoach
```

`postgres`, Docker Compose ağı içindeki servis adıdır. Kıraat Ağı uygulaması
aynı Docker Compose ağına dahil edildiğinde PostgreSQL'e bu servis adı
üzerinden erişecektir.

## Kıraat Ağı için alınan karar

- Yeni bir PostgreSQL container'ı kurulmayacak.
- Mevcut production `postgres` servisi ortak kullanılacak.
- Uygulama tek bir full-stack Next.js projesi olarak çalışacak.
- Kıraat Ağı için ayrı bir database oluşturulacak.
- Kıraat Ağı için ayrı bir database kullanıcısı oluşturulacak.
- Yeni kullanıcı yalnızca Kıraat Ağı database'i üzerinde yetkili olacak.
- Mevcut `fitcoach` database'i ve kullanıcısı Kıraat Ağı tarafından
  kullanılmayacak.

Önerilen başlangıç isimleri:

```text
Database: qiraat_atlas
User: qiraat_app
```

Kesin isimler tech stack ve deployment görüşmesinde değiştirilebilir.

Uygulamanın teknik yaklaşımı için [tech-stack.md](./tech-stack.md) belgesi
esas alınır.

## Uygulama bağlantısı

Kıraat Ağı uygulamasının bağlantı bilgisi environment variable üzerinden
verilecektir.

Örnek bağlantı biçimi:

```text
postgresql://qiraat_app:<password>@postgres:5432/qiraat_atlas
```

Kurallar:

- Şifre kaynak koduna veya Docker Compose dosyasına açık şekilde yazılmaz.
- Bağlantı bilgisi environment variable veya sunucunun secret yönetimiyle
  sağlanır.
- Uygulama migration'ları yalnızca `qiraat_atlas` database'inde çalışır.
- Uygulamanın `fitcoach` database'ine erişim yetkisi olmaz.

## İlk kurulum ihtiyacı

Mevcut PostgreSQL volume'u daha önce oluşturulduğu için yalnızca
`POSTGRES_DB`, `POSTGRES_USER` gibi container environment değerlerini
değiştirmek yeni database ve kullanıcıyı otomatik oluşturmaz.

Bu nedenle sunucuda bir defaya mahsus şu işlemler yapılacaktır:

1. `qiraat_app` database kullanıcısını oluşturmak.
2. `qiraat_atlas` database'ini oluşturmak.
3. Database sahipliğini veya gerekli yetkileri `qiraat_app` kullanıcısına
   vermek.
4. Uygulama bağlantısını doğrulamak.
5. Uygulamanın migration'larını yeni database üzerinde çalıştırmak.
6. Yaklaşık ve Türkçe karakter toleranslı arama için `unaccent` ve `pg_trgm`
   extension'larını etkinleştirmek ve uygulama kullanıcısının kullanım
   yetkisini doğrulamak.

Kesin SQL komutları, seçilecek ORM ve migration yönteminden sonra
hazırlanacaktır.

## Docker Compose sonucu

Kıraat Ağı servisi eklendiğinde:

- Yeni bir `postgres` servisi tanımlanmaz.
- Yeni bir PostgreSQL portu dışarı açılmaz.
- Uygulama servisi mevcut `postgres` servisine bağımlı olur.
- Uygulamanın `DATABASE_URL` değeri `qiraat_atlas` database'ini gösterir.
- Kıraat Ağı servisi mevcut PostgreSQL servisinin bulunduğu Docker ağına
  katılır.

## Yedekleme

Mevcut `pg_backup` servisi şu anda yalnızca `fitcoach` database'ini hedefliyor.
Bu nedenle `qiraat_atlas` database'i için yedekleme ayrıca ele alınmalıdır.

Tech stack ve deployment görüşmesinde aşağıdaki iki seçenekten biri
kararlaştırılacaktır:

1. `qiraat_atlas` için ayrı bir günlük yedekleme işi oluşturmak.
2. PostgreSQL sunucusundaki gerekli database'leri birlikte yedekleyen bir
   yapı kurmak.

Faz 1 production kurulumu, `qiraat_atlas` database'inin düzenli yedeği
doğrulanmadan tamamlanmış kabul edilmez.

## Staging notu

Mevcut sistemde staging için ayrı bir `staging_postgres` container'ı
bulunmaktadır. Kıraat Ağı için staging ortamı istenirse production database'i
kullanılmamalıdır. Bunun yerine staging PostgreSQL servisi içinde ayrı bir
`qiraat_atlas_staging` database'i oluşturulabilir.
