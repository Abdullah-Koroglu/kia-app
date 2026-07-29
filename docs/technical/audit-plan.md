# Kıraat Ağı - Audit Altyapısı Planı

## Amaç

Uygulamadaki veri değişikliklerinin kim tarafından, ne zaman ve nasıl
yapıldığını geriye dönük olarak inceleyebilmek için audit altyapısı
kurulacaktır.

Faz 1'de audit kayıtları için kullanıcı arayüzü veya dışarı açık API
hazırlanmayacaktır. Kayıtlar yalnızca altyapıda ve PostgreSQL database'inde
tutulacaktır.

## Audit kapsamı

Aşağıdaki işlemler audit kaydı oluşturur:

- Kişi oluşturma
- Kişi güncelleme
- Kişi silme
- İlişki oluşturma
- İlişki güncelleme
- İlişki silme
- Yöntem, kapsam, kesinlik ve mekân seed işlemleri
- Kullanıcı seed işlemleri
- Başarılı login
- Başarısız login denemesi
- Logout

Faz 1'de yalnızca veri okuma, listeleme, arama ve filtreleme işlemleri audit
kapsamında değildir.

## Audit modeli

Audit altyapısı iki teknik tablodan oluşur:

1. `AuditEvent`
2. `AuditFieldChange`

Bu tablolar domain entity'si değildir ve uygulamanın normal kullanıcı
arayüzünde gösterilmez.

## AuditEvent

Bir create, update, delete veya authentication işleminin ana audit kaydıdır.

| Alan | Zorunlu | Açıklama |
|---|---:|---|
| `id` | Evet | Audit olayının benzersiz ID'si |
| `actorUserId` | Hayır | İşlemi yapan kullanıcının `User.id` değeri |
| `actorUsername` | Evet | İşlem anındaki kullanıcı adının kopyası |
| `actorType` | Evet | `USER` veya `SYSTEM` |
| `action` | Evet | Gerçekleştirilen işlem |
| `entityType` | Hayır | İşlem yapılan entity tipi |
| `entityId` | Hayır | İşlem yapılan kaydın ID'si |
| `occurredAt` | Evet | İşlemin UTC zamanı |
| `requestId` | Hayır | Aynı isteğe ait logları birleştiren istek ID'si |
| `source` | Evet | İşlemin kaynağı |
| `route` | Hayır | İşlemin gerçekleştiği uygulama route'u |
| `httpMethod` | Hayır | Varsa HTTP metodu |
| `ipAddress` | Hayır | İstek sahibinin IP adresi |
| `userAgent` | Hayır | Tarayıcı veya istemci bilgisi |
| `beforeSnapshot` | Hayır | İşlem öncesindeki tam kaydın JSON görüntüsü |
| `afterSnapshot` | Hayır | İşlem sonrasındaki tam kaydın JSON görüntüsü |
| `metadata` | Hayır | İşleme özel ek teknik bilgiler |

### actorUserId ve actorUsername

`actorUserId`, mümkün olduğunda işlemi yapan kullanıcıyı gösterir.
`actorUsername` ayrıca saklanır; böylece kullanıcı kaydı ileride silinse veya
kullanıcı adı değişse bile audit kaydında işlem anındaki kullanıcı adı korunur.

Seed ve migration gibi işlemlerde:

```text
actorUserId: null
actorUsername: system
actorType: SYSTEM
```

kullanılır.

### action değerleri

Başlangıç değerleri:

- `CREATE`
- `UPDATE`
- `DELETE`
- `LOGIN_SUCCESS`
- `LOGIN_FAILED`
- `LOGOUT`
- `SEED`

### source değerleri

Başlangıç değerleri:

- `WEB`
- `SEED`
- `MIGRATION`
- `DATABASE_ADMIN`

## AuditFieldChange

Bir update işleminde değişen her alanın eski ve yeni değerini ayrı ayrı tutar.

| Alan | Zorunlu | Açıklama |
|---|---:|---|
| `id` | Evet | Alan değişikliği kaydının ID'si |
| `auditEventId` | Evet | Bağlı olduğu `AuditEvent.id` |
| `fieldName` | Evet | Değişen alanın adı |
| `oldValue` | Hayır | Alanın işlem öncesindeki değeri |
| `newValue` | Hayır | Alanın işlem sonrasındaki değeri |

Eski ve yeni değerler JSON uyumlu biçimde saklanır. Böylece metin, sayı,
boolean ve `null` değerleri tip bilgisi kaybolmadan tutulabilir.

## İşlem bazında kayıt davranışı

### Create

- `beforeSnapshot` boş olur.
- `afterSnapshot` oluşturulan kaydın tamamını içerir.
- Gerekirse oluşturulan alanlar `AuditFieldChange` kayıtlarıyla da
  gösterilebilir.

### Update

- `beforeSnapshot` güncelleme öncesindeki kaydı içerir.
- `afterSnapshot` güncelleme sonrasındaki kaydı içerir.
- Yalnızca gerçekten değişen alanlar için `AuditFieldChange` oluşturulur.
- Her değişiklikte alan adı, eski değer ve yeni değer kaydedilir.

Örnek:

```text
Entity: Person
Entity ID: 125
Action: UPDATE
Actor: arastirmaci1

fieldName: name
oldValue: "Âsım"
newValue: "Âsım b. Ebî'n-Necûd"
```

### Delete

- `beforeSnapshot` silinmeden önceki kaydın tamamını içerir.
- `afterSnapshot` boş olur.
- `entityId` korunur.
- Audit kaydı silinen domain kaydına foreign key ile bağlanmaz. Böylece domain
  kaydı silindiğinde audit geçmişi kaybolmaz.

### Authentication

Başarılı ve başarısız login denemelerinde:

- Kullanıcı adı
- Zaman
- IP adresi
- User agent
- Sonuç

kaydedilir.

Başarısız login kaydında şifre veya şifre hash'i bulunmaz.

## Transaction kuralı

Domain kaydındaki değişiklik ve audit kaydı mümkün olduğunda aynı database
transaction'ı içinde oluşturulur.

Böylece:

- Domain işlemi başarılıysa audit kaydı da oluşur.
- Audit kaydı oluşturulamazsa domain işlemi de tamamlanmaz.
- Domain işlemi geri alınırsa ona ait audit kaydı da geri alınır.

Başarısız login gibi domain değişikliği oluşturmayan güvenlik olayları ayrı
audit kaydı olarak yazılır.

## Kullanıcı bilgisinin güvenilirliği

- `actorUserId` ve `actorUsername` formdan veya client request body'den
  alınmaz.
- İşlemi yapan kullanıcı server tarafındaki doğrulanmış session'dan belirlenir.
- Client, başka bir kullanıcı adına audit kaydı oluşturamaz.
- Seed ve migration işlemleri açıkça `SYSTEM` olarak işaretlenir.

## Hassas alanlar

Aşağıdaki bilgiler audit tablolarına hiçbir koşulda yazılmaz:

- Normal şifre
- `passwordHash`
- Session token
- Authentication cookie
- `DATABASE_URL`
- Database şifresi
- Uygulama secret değerleri
- Authorization header

Snapshot oluşturulmadan önce hassas alanlar merkezi bir filtreyle çıkarılır.
Bu filtre hem `beforeSnapshot` ve `afterSnapshot` hem de alan değişiklikleri
için geçerlidir.

## IP ve proxy notu

Uygulama reverse proxy arkasında çalışıyorsa gerçek istemci IP'si yalnızca
güvenilen proxy tarafından iletilen header üzerinden alınır. Client tarafından
gönderilen rastgele IP header'ları güvenilir kabul edilmez.

## Değiştirilemezlik

Audit kayıtları append-only kabul edilir:

- Normal uygulama akışı audit kaydı oluşturabilir.
- Audit kayıtları uygulama arayüzünden güncellenemez.
- Audit kayıtları uygulama arayüzünden silinemez.
- Audit tabloları için update ve delete işlemi normal uygulama
  fonksiyonlarında bulunmaz.
- Zorunlu bakım işlemleri yalnızca yetkili database yöneticisi tarafından
  gerçekleştirilir.

## Saklama

Faz 1'de audit kayıtları için otomatik silme süresi uygulanmaz. Kayıtlar
database yedeklerine dahil edilir ve süresiz saklanır.

Audit tablolarının büyüklüğü ilerleyen fazlarda ölçülür; gerekirse arşivleme
politikası daha sonra eklenir.

## Audit için index ihtiyacı

Aşağıdaki sorguların hızlı çalışabilmesi için uygun index'ler planlanır:

- Entity tipi ve entity ID'sine göre geçmiş
- Kullanıcıya göre yapılan işlemler
- İşlem zamanına göre sıralama
- Aksiyon tipine göre filtreleme
- Request ID ile aynı isteğin kayıtlarını bulma

## Faz 1'de UI ve API sınırı

- Audit listeleme sayfası yapılmaz.
- Audit detay modalı yapılmaz.
- Audit arama ve filtreleme ekranı yapılmaz.
- Audit kayıtlarını dışarı açan public API yapılmaz.
- Domain create, update ve delete işlemleri audit üretmek zorundadır.

## Tamamlanma ölçütleri

- Person create, update ve delete işlemleri audit oluşturur.
- Relation create, update ve delete işlemleri audit oluşturur.
- Update işleminde değişen her alanın eski ve yeni değeri görülebilir.
- Create ve delete işlemlerinde tam kayıt görüntüsü korunur.
- İşlemi yapan kullanıcı ve işlem zamanı kaydedilir.
- Seed işlemleri `SYSTEM` olarak kaydedilir.
- Login başarı, login hatası ve logout olayları kaydedilir.
- Şifre, hash, token ve secret değerleri audit'e yazılmaz.
- Domain değişikliği ile audit kaydı aynı transaction içinde çalışır.
- Audit kayıtları uygulamanın normal akışından değiştirilemez veya silinemez.
- Audit kayıtları database yedeğine dahil edilir.

