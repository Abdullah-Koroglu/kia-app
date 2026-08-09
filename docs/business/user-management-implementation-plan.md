# Kullanıcı Yönetimi, Görev Bazlı Yetkilendirme ve Kontrol Planı

## 1. Belgenin amacı

Bu belge Kıraat Ağı uygulamasına eklenecek kullanıcı yönetimi, veritabanı
tabanlı roller, araştırmacı görevleri, görev kapsamından türeyen veri yazma
yetkileri, araştırmacı ilerleme takibi, âlim memleketi ve kontrol/onay
özelliklerinin implementasyon planını tanımlar.

Plan mevcut Next.js, PostgreSQL, Drizzle ORM, kullanıcı adı/şifre oturumu ve
audit altyapısının üzerine kurulacaktır. Kontrol özelliğinde "âlim", mevcut
domain modelindeki `Person` kaydını; âlim numarası ise `Person.extSourceId`
alanını ifade eder.

Bu belgedeki temel ilke şudur:

```text
Etkin yazma yetkisi = Rol izni + Aktif görev kapsamı
```

Rol, kullanıcının hangi tür işlemi yapabileceğini; görev ise araştırmacının bu
işlemi hangi dış kaynak ID'leri üzerinde yapabileceğini belirler.

## 2. Kesinleşen iş kararları

| Konu | Karar |
|---|---|
| Başlangıç rolleri | Yönetici, Kontrolcü, Araştırmacı |
| Rol saklama | Roller ve rol-yetki ilişkileri veritabanında tutulacak |
| Yeni roller | Sonradan yeni roller eklenebilecek |
| Kullanıcı yönetimi | Yönetici kullanıcı oluşturabilir, devre dışı bırakabilir ve rollerini yönetebilir |
| Görev | Araştırmacıya dış kaynak ID aralığı ve deadline ile atanır |
| Görev-yetki ilişkisi | Araştırmacının yazma kapsamı aktif görevlerinden doğar; ayrıca kopya kapsam yetkisi tutulmaz |
| Çakışan kapsam | Aynı dış kaynak ID aynı anda iki aktif/gecikmiş göreve verilemez |
| Deadline | Yetkiyi kapatmaz; tamamlanmamış görevi gecikmiş olarak işaretler |
| Çoklu görev | Aynı araştırmacının aynı anda birden fazla çakışmayan görevi olabilir |
| Âlim silme | Yalnızca yönetici yetkisiyle yapılabilir |
| Dış kaynak ID değiştirme | Yalnızca yönetici yetkisiyle yapılabilir |
| Yönetici veri girişi | Yönetici kontrol kararları hariç bütün işlemleri görev kapsamına ihtiyaç duymadan yapar |
| Memleket | Âlim başına en fazla bir opsiyonel memleket bulunur |
| Memleket oluşturma | Her aktif, oturum açmış kullanıcı yeni memleket oluşturabilir |
| Kontrol | Yetkili kontrolcü âlimi onaylar veya zorunlu düzeltme yorumu bırakır |
| Onay görünümü | Âlim sayfasında onaylayan kişi ve onay tarihi gösterilir |
| Kendi kaydını kontrol | Araştırmacı kendi sorumluluğundaki âlimi onaylayamaz |

## 3. Hedef yetkilendirme mimarisi

Yetkilendirme iki katmandan oluşur:

1. RBAC: Rolün sahip olduğu genel işlem izinleri.
2. Görev kapsamı: Araştırmacının yazabileceği `extSourceId` aralıkları.

Örnek:

```text
Kullanıcı: Ahmet
Rol: Araştırmacı
Görev: 1-20
Deadline: 31 Ağustos 2026

Ahmet 1-20 arasındaki âlimleri oluşturabilir ve görev kuralları dahilinde
düzenleyebilir. 33 numaralı âlimi arayıp okuyabilir fakat oluşturamaz veya
değiştiremez.
```

Yetki denetimi yalnızca arayüzde buton gizleyerek yapılmayacaktır. Bütün yazma
işlemleri API ve veritabanı transaction'ı içinde yeniden denetlenecektir.

## 4. Rol ve permission veri modeli

### 4.1 `roles`

| Alan | Tip | Kural |
|---|---|---|
| `id` | UUID | Primary key |
| `code` | varchar | Benzersiz, değişmeyen teknik kod |
| `name` | varchar | Kullanıcıya gösterilen rol adı |
| `description` | text | Opsiyonel açıklama |
| `isSystem` | boolean | Seed rollerini korur |
| `isActive` | boolean | Pasif rol yeni kullanıcıya atanamaz |
| `createdAt` | timestamptz | Sistem zamanı |
| `updatedAt` | timestamptz | Sistem zamanı |

Başlangıç kodları:

```text
MANAGER
CONTROLLER
RESEARCHER
```

### 4.2 `permissions`

| Alan | Tip | Kural |
|---|---|---|
| `id` | UUID | Primary key |
| `code` | varchar | Benzersiz teknik izin kodu |
| `name` | varchar | Arayüz adı |
| `description` | text | İzin kapsamı |
| `createdAt` | timestamptz | Sistem zamanı |

Başlangıç permission kodları:

```text
USER_VIEW
USER_CREATE
USER_UPDATE
USER_DISABLE
USER_ASSIGN_ROLE
USER_RESET_PASSWORD
ROLE_VIEW
ROLE_MANAGE

ASSIGNMENT_VIEW_ALL
ASSIGNMENT_VIEW_OWN
ASSIGNMENT_CREATE
ASSIGNMENT_UPDATE
ASSIGNMENT_CANCEL
ASSIGNMENT_COMPLETE

PERSON_VIEW
PERSON_CREATE_IN_ASSIGNMENT
PERSON_UPDATE_IN_ASSIGNMENT
PERSON_DELETE
PERSON_CHANGE_EXTERNAL_ID

RELATION_VIEW
RELATION_CREATE_IN_ASSIGNMENT
RELATION_UPDATE_IN_ASSIGNMENT
RELATION_DELETE_IN_ASSIGNMENT

HOMELAND_VIEW
HOMELAND_CREATE

REVIEW_QUEUE_VIEW
PERSON_REVIEW_VIEW
PERSON_APPROVE
PERSON_REQUEST_CHANGES
PERSON_REVIEW_COMMENT
PERSON_APPROVAL_REVOKE
```

### 4.3 `role_permissions`

Many-to-many rol-permission bağlantısıdır. `(roleId, permissionId)` benzersiz
olacaktır.

### 4.4 `user_roles`

| Alan | Açıklama |
|---|---|
| `userId` | Rol atanan kullanıcı |
| `roleId` | Atanan rol |
| `assignedByUserId` | Atamayı yapan yönetici |
| `assignedAt` | Atama zamanı |

Bir kullanıcı birden fazla rol alabilir. Etkin izinleri aktif rollerinin
permission birleşimidir.

## 5. Başlangıç rol matrisi

| İşlem | Yönetici | Kontrolcü | Araştırmacı |
|---|---:|---:|---:|
| Kullanıcıları görme ve yönetme | Evet | Hayır | Hayır |
| Rol atama | Evet | Hayır | Hayır |
| Görev oluşturma/değiştirme | Evet | Hayır | Hayır |
| Tüm ilerlemeyi görme | Evet | Hayır | Hayır |
| Kendi görevini görme | Rol ayrıca verilirse | Hayır | Evet |
| Âlim oluşturma | Evet, görev kapsamı aranmaz | Hayır | Yalnızca görev kapsamında |
| Âlim silme | Evet | Hayır | Hayır |
| Dış kaynak ID değiştirme | Evet | Hayır | Hayır |
| Kontrol kuyruğunu görme | Kontrolcü rolü de varsa | Evet | Hayır |
| Âlimi onaylama/düzeltme isteme | Kontrolcü rolü de varsa | Evet | Hayır |
| Memleket oluşturma | Evet | Evet | Evet |

Yönetici, kontrolcü ve araştırmacı sorumlulukları birbirinden ayrıdır. Bir
kullanıcının birden fazla sorumluluğu varsa birden fazla rol atanır.

## 6. Kullanıcı modeli ve güvenliği

Mevcut `users` tablosuna aşağıdaki alanlar eklenecektir:

```text
display_name
is_active
must_change_password
last_login_at
created_by_user_id
disabled_at
disabled_by_user_id
```

Kurallar:

- Kullanıcı kaydı fiziksel olarak silinmez; devre dışı bırakılır.
- Pasif kullanıcı giriş yapamaz.
- Kullanıcı pasife alındığında bütün aktif session kayıtları silinir.
- Sistemde en az bir aktif yönetici kalır.
- Son aktif yönetici rolü kaldırılamaz ve son yönetici pasife alınamaz.
- Şifre ve hash hiçbir API cevabına veya audit snapshot'ına yazılmaz.
- Kullanıcı adı büyük/küçük harf duyarsız benzersiz kabul edilir.
- Rol değişiklikleri bir sonraki istekte etkili olur; auth context izinleri
  veritabanından güncel olarak okur.

## 7. Araştırmacı görev modeli

### 7.1 `research_assignments`

| Alan | Açıklama |
|---|---|
| `id` | UUID |
| `researcherUserId` | Görevin sahibi araştırmacı |
| `title` | Görev başlığı |
| `description` | Yönetici açıklaması |
| `startsAt` | Başlangıç zamanı |
| `deadlineAt` | Hedef bitiş zamanı |
| `status` | `DRAFT`, `ACTIVE`, `COMPLETED`, `CANCELLED` |
| `assignedByUserId` | Görevi veren yönetici |
| `completedAt` | Tamamlanma zamanı |
| `completedByUserId` | Tamamlayan yönetici |
| `cancelledAt` | İptal zamanı |
| `cancelledByUserId` | İptal eden yönetici |
| `createdAt` | Oluşturulma zamanı |
| `updatedAt` | Güncellenme zamanı |

`OVERDUE` veritabanında ayrı durum olarak tutulmayacaktır:

```text
isOverdue =
  status == ACTIVE
  and deadlineAt < now()
  and completedCount < assignedCount
```

Deadline geçmesi görevi veya araştırmacının kapsam yetkisini kapatmaz.

### 7.2 `research_assignment_scopes`

| Alan | Açıklama |
|---|---|
| `id` | UUID |
| `assignmentId` | Bağlı görev |
| `startExtSourceId` | Dahil başlangıç ID'si |
| `endExtSourceId` | Dahil bitiş ID'si |
| `createdAt` | Oluşturulma zamanı |

Constraint'ler:

```text
startExtSourceId > 0
endExtSourceId > 0
startExtSourceId <= endExtSourceId
```

Bir görev birden fazla aralık içerebilir. Aynı görevin kendi aralıkları da
birbiriyle çakışamaz.

### 7.3 Kapsam çakışması

- `ACTIVE` ve deadline'ı geçmiş ama hâlâ `ACTIVE` görevler kapsamı sahiplenir.
- Başka bir araştırmacıya veya aynı araştırmacının başka görevine çakışan
  aralık verilemez.
- `COMPLETED` veya `CANCELLED` görevler yeni kapsam atamasını engellemez.
- Eski kapsam yeniden dağıtılacaksa yönetici önce eski görevi iptal etmeli
  veya aralığını küçültmelidir.
- Kontrol transaction içinde yapılmalı ve eşzamanlı çakışan atamalar
  engellenmelidir.

Örnek:

```text
Eski aktif/gecikmiş görev: 1-20
Yeni görev 21-40: Verilebilir
Yeni görev 15-30: Verilemez
```

## 8. Görevden türeyen veri yetkileri

Merkezi authorization servisi aşağıdaki sorumlulukları taşıyacaktır:

```text
hasPermission
requirePermission
findActiveAssignmentForExtSourceId
requirePersonCreateScope
requirePersonMutationScope
requireRelationMutationScope
```

### 8.1 Âlim oluşturma

Araştırmacı için:

1. Kullanıcı aktif olmalıdır.
2. Araştırmacı rolü ve `PERSON_CREATE_IN_ASSIGNMENT` izni bulunmalıdır.
3. `extSourceId`, başlamış ve iptal edilmemiş aktif bir görev kapsamına
   girmelidir.
4. Deadline geçmiş olabilir; bu işlem hakkını engellemez.
5. ID daha önce oluşturulmamış olmalıdır.

### 8.2 Âlim düzenleme

- Araştırmacı yalnızca aktif görev kapsamındaki âlimi düzenleyebilir.
- `extSourceId` araştırmacı tarafından değiştirilemez.
- Yönetici `extSourceId` değiştirirse görev ilerlemeleri yeniden hesaplanır ve
  mevcut onay geçersiz hale gelir.
- Onaylanmış kayıt araştırmacı tarafından doğrudan değiştirilemez; önce
  düzeltme talebi veya yönetici/kontrolcü yeniden açma işlemi gerekir.

### 8.3 Âlim silme

- Yalnızca `PERSON_DELETE` permission'ı olan yönetici silebilir.
- İlişkili âlimin silinememesiyle ilgili mevcut restrict kuralı korunur.
- Silme audit edilir ve görev ilerlemesi anında yeniden hesaplanır.

### 8.4 İlişki işlemleri

- Araştırmacının işlem yaptığı ana âlim görev kapsamında olmalıdır.
- Karşı taraf görev dışında olabilir ve okunup seçilebilir.
- Görev dışındaki iki âlim arasında ilişki oluşturulamaz.
- Hızlı âlim oluşturma yalnızca yeni âlimin ID'si de görev kapsamındaysa
  kullanılabilir.
- İlişki ekleme, değiştirme ve silme ilgili âlimin kontrol versiyonunu artırır.

### 8.5 Okuma

Araştırmacı ağda ilişki kurabilmek için görev dışındaki âlimleri okuyabilir ve
arayabilir. Görev kapsamı yazma işlemlerini sınırlar.

## 9. İlerleme modeli

### 9.1 Veri girişi ilerlemesi

```text
assignedCount = aralıklardaki benzersiz dış kaynak ID sayısı
createdCount = kapsamda Person kaydı bulunan ID sayısı
missingCount = assignedCount - createdCount
entryProgress = createdCount / assignedCount * 100
```

Örnek:

```text
Görev: 1-20
Girilen: 1-15
Toplam: 20
Tamamlanan: 15
Eksik: 5
İlerleme: %75
Eksik ID'ler: 16, 17, 18, 19, 20
```

### 9.2 Kontrol ilerlemesi

Veri girişi ve kontrol birbirinden ayrı gösterilecektir:

```text
Veri girişi: 15/20 (%75)
Onay: 10/20 (%50)
Düzeltme bekleyen: 2
Kontrol bekleyen: 3
Eksik: 5
```

### 9.3 Görev tamamlanması

Görev `%100` veri girişinde otomatik kapanmaz. Tamamlanmaya hazır olması için:

- Bütün atanmış dış kaynak ID'leri oluşturulmuş olmalı.
- Bütün âlimler güncel veri versiyonlarıyla onaylanmış olmalı.

Yönetici görevi `COMPLETED` durumuna getirir. Deadline geçmiş ancak eksikleri
bulunan görev `ACTIVE` kalır ve gecikmiş görünür.

## 10. Memleket ve mekân modeli

Memleket ayrı bir sözlük değildir. İlişki mekânları ve kişi memleketleri ortak
`places` tablosundan seçilir. `persons.homelandId`, `places.id` alanına nullable
foreign key'dir; bir âlimin sıfır veya bir memleketi olabilir.

Mekânlar yöneticinin `/admin/places` ekranından oluşturulabilir, yeniden
adlandırılabilir ve kullanılmıyorsa silinebilir. Bir ilişkide veya kişinin
memleketinde kullanılan mekân referans bütünlüğünü korumak için silinemez.

Kurallar:

- Bütün aktif ve oturum açmış kullanıcılar memleket oluşturabilir.
- Rol veya görev kapsamı aranmaz.
- Authentication, doğrulama, mükerrer kontrolü ve audit zorunludur.
- Yeni memleket seçim formunda otomatik seçilir.
- Memleket değişikliği kontrol versiyonunu artırır.

## 11. Kontrol ve onay modeli

### 11.1 Kontrol durumları

```text
NOT_READY
READY_FOR_REVIEW
CHANGES_REQUESTED
APPROVED
```

| Durum | Anlamı |
|---|---|
| `NOT_READY` | Araştırmacı veri girişine devam ediyor |
| `READY_FOR_REVIEW` | Araştırmacı kontrol için gönderdi |
| `CHANGES_REQUESTED` | Kontrolcü zorunlu yorumla düzeltme istedi |
| `APPROVED` | Güncel veri versiyonu onaylandı |

### 11.2 Kontrol akışı

```text
Araştırmacı âlimi oluşturur ve ilişkilerini tamamlar
                       |
                       v
                Kontrole gönderir
                       |
          +------------+-------------+
          |                          |
          v                          v
       Onaylanır              Düzeltme istenir
       APPROVED              CHANGES_REQUESTED
                                     |
                                     v
                         Araştırmacı düzeltir ve
                         yeniden kontrole gönderir
```

Kontrol, âlimin yalnızca temel alanlarını değil sayfasındaki çalışma bütününü
kapsar:

- Dış kaynak ID, isim ve açıklama
- Doğum/vefat bilgileri
- Memleket ve detay notu
- Hocalar ve talebeler
- İlişki yöntemi, kapsamı, kesinliği, mekânı ve notları

### 11.3 `person_reviews`

| Alan | Açıklama |
|---|---|
| `id` | UUID |
| `personId` | İncelenen âlim |
| `reviewerUserId` | Kontrol işlemini yapan kullanıcı |
| `action` | Review eylemi |
| `comment` | Kontrol/düzeltme yorumu |
| `personVersion` | İncelenen veri versiyonu |
| `createdAt` | İşlem zamanı |

Eylemler:

```text
SUBMITTED
APPROVED
CHANGES_REQUESTED
RESUBMITTED
APPROVAL_REVOKED
```

Kurallar:

- `CHANGES_REQUESTED` için yorum zorunludur.
- `APPROVED` için yorum opsiyoneldir.
- Review geçmişi silinmez veya sessizce değiştirilmez.
- Yeni açıklama yeni review/yorum kaydı olarak eklenir.
- Araştırmacı kendi görev kapsamındaki âlimi onaylayamaz.
- Kontrolcü aynı âlimde araştırmacı sorumluluğu taşıyorsa onay veremez.

### 11.4 Veri versiyonlama

`persons` tablosuna aşağıdaki alanlar eklenir:

```text
review_status
content_version
approved_version
approved_at
approved_by_user_id
submitted_for_review_at
submitted_for_review_by_user_id
created_by_user_id
created_under_assignment_id
updated_by_user_id
```

Âlim veya kontrol kapsamındaki ilişkileri değiştiğinde `contentVersion`
artırılır. Onay sırasında `approvedVersion = contentVersion` yapılır.

Geçerli onay:

```text
reviewStatus == APPROVED
and approvedVersion == contentVersion
```

Onay sonrası veri değiştirilirse eski onay geçmişte korunur fakat güncel kayıt
yeniden kontrol gerektirir.

### 11.5 Âlim sayfasındaki gösterim

Onaylanan kayıtta:

```text
Bu âlim Mehmet Yılmaz tarafından 6 Ağustos 2026 14:35 tarihinde
onaylanmıştır.
```

Düzeltme istenen kayıtta kontrolcü, tarih ve yorum gösterilir. Ayrıca açılır
bir kontrol geçmişi alanında gönderim, düzeltme, yeniden gönderim ve onay
olayları kronolojik olarak listelenir.

## 12. API planı

### 12.1 Kullanıcı ve rol yönetimi

```text
GET    /api/users
POST   /api/users
GET    /api/users/[id]
PATCH  /api/users/[id]
POST   /api/users/[id]/disable
POST   /api/users/[id]/enable
POST   /api/users/[id]/reset-password
PUT    /api/users/[id]/roles

GET    /api/roles
POST   /api/roles
PATCH  /api/roles/[id]
GET    /api/permissions
PUT    /api/roles/[id]/permissions
```

### 12.2 Görev ve ilerleme

```text
GET    /api/assignments
POST   /api/assignments
GET    /api/assignments/[id]
PATCH  /api/assignments/[id]
POST   /api/assignments/[id]/cancel
POST   /api/assignments/[id]/complete
GET    /api/assignments/[id]/progress
GET    /api/researchers/progress
GET    /api/me/assignments
```

### 12.3 Memleket ve mekân

```text
GET  /api/places
POST /api/places
PATCH /api/places/[id]
DELETE /api/places/[id]
```

### 12.4 Kontrol

```text
POST /api/persons/[id]/submit-review
GET  /api/persons/[id]/reviews
GET  /api/reviews
POST /api/persons/[id]/reviews/approve
POST /api/persons/[id]/reviews/request-changes
POST /api/persons/[id]/reviews/revoke-approval
```

Hata kodları:

```text
401: Oturum yok veya geçersiz
403: Rol, permission veya görev kapsamı yetersiz
404: Kayıt bulunamadı
409: Çakışma veya mükerrer kayıt
400/422: Form doğrulama hatası
```

## 13. Arayüz planı

### 13.1 Navigasyon

Permission'a göre aşağıdaki bağlantılar gösterilir:

```text
Kişiler
Görevlerim
Araştırmacılar
Kullanıcı Yönetimi
Kontrol
```

### 13.2 Kullanıcı yönetimi

Route: `/admin/users`

Liste; kullanıcı adı, görünen ad, roller, aktiflik, aktif görev sayısı, son
giriş ve işlemleri gösterir. Yönetici kullanıcı oluşturabilir, düzenleyebilir,
rol atayabilir, şifre sıfırlayabilir ve hesabı aktif/pasif yapabilir.

### 13.3 Araştırmacı ilerlemesi

Route'lar:

```text
/admin/researchers
/admin/researchers/[userId]
```

Yönetici şu metrikleri görür:

- Aktif ve gecikmiş görev sayısı
- Atanmış, girilmiş ve eksik âlim sayısı
- Veri girişi yüzdesi
- Onay yüzdesi
- Kontrol ve düzeltme bekleyen sayısı
- En yakın/geçmiş deadline
- Son veri giriş zamanı

### 13.4 Araştırmacının görev ekranı

Route'lar:

```text
/my-assignments
/my-assignments/[id]
```

Görev detayında kapsam, deadline, gecikme, ilerleme, onay ilerlemesi, eksik
ID'ler ve kontrol yorumları gösterilir. Eksik ID'ye tıklanınca âlim formu ID
önceden doldurulmuş şekilde açılabilir.

### 13.5 Kontrol kuyruğu

Route: `/reviews`

Filtreler; durum, araştırmacı, görev, dış kaynak ID, gönderim tarihi ve
deadline durumudur. Kontrolcü âlim detayından onay veya düzeltme talebi
verebilir.

### 13.6 Mevcut kişiler ekranı

- `Yeni Kişi` yalnızca kapsamlı oluşturma hakkı varsa gösterilir.
- Araştırmacının görev dışındaki satırlarında düzenle/sil işlemleri gösterilmez.
- API her kayıt için `canEdit`, `canDelete`, `canSubmitReview` gibi capability
  değerleri döndürebilir.
- UI capability bilgisini kullanır; güvenlik yine API'de uygulanır.

## 14. Audit kapsamı

Mevcut audit altyapısı genişletilecektir. Aşağıdaki entity ve eylemler audit
edilir:

- Kullanıcı oluşturma, düzenleme, aktif/pasif yapma ve şifre sıfırlama
- Rol atama/kaldırma ve rol permission değişiklikleri
- Görev oluşturma, kapsam/deadline değiştirme, tamamlama ve iptal
- Âlim oluşturma, düzenleme, silme ve dış kaynak ID değiştirme
- Memleket oluşturma
- Kontrole gönderme, düzeltme isteme, onay ve onay geri alma
- Önemli authorization reddi olayları

Metadata'da görev ID, dış kaynak ID, hedef kullanıcı, eski/yeni kapsam,
eski/yeni deadline ve red sebebi tutulur. Şifre, token ve secret değerleri
hiçbir durumda audit edilmez.

## 15. Migration ve yayın sırası

1. Rol, permission, role-permission ve user-role tablolarını oluştur.
2. Kullanıcı aktiflik/profil alanlarını ekle.
3. Başlangıç rollerini ve permission eşleşmelerini seed et.
4. Mevcut production kullanıcısını yönetici rolüyle backfill et.
5. En az bir aktif yönetici olduğunu doğrula.
6. Görev ve görev kapsamı tablolarını oluştur.
7. Memleket ve `persons.homelandId` alanını ekle.
8. Person sahiplik ve kontrol-versiyon alanlarını ekle.
9. Review geçmişi tablosunu oluştur.
10. Auth context ve authorization servislerini yayınla.
11. Mevcut person/relation API'lerine kapsam kontrollerini ekle.
12. Yönetim, görev, ilerleme ve kontrol ekranlarını yayınla.
13. CLI kullanıcı oluşturma ve seed script'lerini yeni modele geçir.

Güvenli yayın sırası:

```text
Migration -> seed/backfill doğrulaması -> uygulama deploy -> smoke test
```

## 16. Test planı

### 16.1 Unit testleri

- Birden fazla rolün permission birleşimi
- Pasif rol ve kullanıcı davranışı
- ID aralığı kapsam denetimi
- Deadline geçince yetkinin devam etmesi
- Çakışan görev tespiti
- Birden fazla görev ve kapsam
- Veri girişi ve onay ilerlemesi
- Memleket normalizasyonu
- Review durum geçişleri
- Onay versiyonu geçerliliği

### 16.2 API entegrasyon testleri

- Yönetici kullanıcı ve görev oluşturabilir.
- Araştırmacı kullanıcı yönetemez ve âlim silemez.
- `1-20` görevi olan araştırmacı `20`yi oluşturabilir, `21`i oluşturamaz.
- Deadline geçmiş `1-20` görevi yazma hakkı vermeye devam eder.
- `1-20` aktifken `15-30` görevi verilemez, `21-40` verilebilir.
- Araştırmacı dış kaynak ID değiştiremez; yönetici değiştirebilir.
- Araştırmacı görev dışı kişiyi okuyabilir ancak değiştiremez.
- Görev dışındaki iki âlim arasında ilişki oluşturulamaz.
- Her aktif kullanıcı memleket oluşturabilir.
- Kontrolcü düzeltme yorumu olmadan düzeltme isteyemez.
- Kullanıcı kendi sorumluluğundaki âlimi onaylayamaz.
- Onay sonrası veri/ilişki değişikliği onayı geçersiz kılar.
- Son aktif yönetici pasife alınamaz.

### 16.3 Yarış durumu testleri

- Aynı dış kaynak ID'nin eşzamanlı oluşturulması
- Eşzamanlı çakışan görev ataması
- Rol kaldırılırken devam eden yazma isteği
- Review sırasında veri versiyonu değişmesi
- Aynı versiyona eşzamanlı iki kontrol kararı

### 16.4 Uçtan uca senaryo

1. Yönetici araştırmacı kullanıcı oluşturur.
2. Araştırmacıya `1-20` görevi verir.
3. Araştırmacı `1-15` kayıtlarını girer.
4. Sistem veri girişini `%75`, eksikleri `16-20` gösterir.
5. Deadline geçince görev gecikmiş görünür fakat araştırmacı girişe devam eder.
6. Yönetici aynı araştırmacıya çakışmayan `21-40` görevini verebilir.
7. Araştırmacı âlimi kontrole gönderir.
8. Kontrolcü düzeltme ister; araştırmacı düzeltip yeniden gönderir.
9. Kontrolcü onaylar.
10. Âlim sayfasında kontrolcü adı ve tarih görünür.

## 17. Fazlandırılmış implementasyon

### Faz 0 - Dokümantasyon ve temel kararlar

- Bu implementasyon planı
- Seyir defteri
- İş kuralları ve kabul ölçütlerinin sabitlenmesi

### Faz 1 - RBAC ve kullanıcı güvenliği

- Rol/permission tabloları ve seed
- Kullanıcı aktifliği ve çoklu rol
- Auth context
- Merkezi authorization servisi
- Mevcut kullanıcı backfill'i
- Testler

### Faz 2 - Kullanıcı yönetimi

- Kullanıcı ve rol API'leri
- Kullanıcı yönetim ekranı
- Şifre sıfırlama ve aktif/pasif akışı
- Yönetici güvenlik kuralları
- Audit ve testler

### Faz 3 - Görev yönetimi

- Görev ve kapsam tabloları
- Çakışma koruması
- Görev API'leri
- Yönetici görev ekranları
- Araştırmacının Görevlerim ekranı
- Deadline/gecikme ve testler

### Faz 4 - Görev bazlı veri yetkilendirmesi

- Person create/update/delete denetimleri
- Dış kaynak ID yönetici kuralı
- Relation denetimleri
- Hızlı kişi oluşturma güvenliği
- UI capability görünümü
- İlerleme hesapları ve testler

### Faz 5 - Memleket

- Homeland tablosu ve API
- Person bağlantısı
- Seçim ve hızlı oluşturma arayüzü
- Normalizasyon, audit ve testler

### Faz 6 - Kontrol ve onay

- Review durumları ve geçmişi
- Veri versiyonlama
- Kontrole gönderme/düzeltme/onay API'leri
- Kontrol kuyruğu
- Âlim sayfasında onay ve geçmiş gösterimi
- Bağımsız kontrol ve yarış durumu testleri

### Faz 7 - Raporlama ve production hazırlığı

- Yönetici araştırmacı ilerleme panosu
- Veri girişi ve kontrol metrikleri
- Geciken görev raporu
- Sorgu/indeks optimizasyonları
- Migration/backfill provası
- Production smoke test ve operasyon dokümantasyonu

## 18. Tamamlanma ölçütleri

- Roller ve permission'lar veritabanından yönetilir.
- Yönetici kullanıcı ve görev yönetebilir.
- Araştırmacı yalnızca aktif görev kapsamındaki dış kaynak ID'lerinde yazabilir.
- Deadline geçmesi yazma yetkisini kaldırmaz ve görev gecikmiş görünür.
- Aktif/gecikmiş görev kapsamları çakışamaz.
- İlerleme hem veri girişi hem kontrol için ayrı hesaplanır.
- Yönetici araştırmacıların bugüne kadarki ilerlemesini görebilir.
- Araştırmacı görevlerini, eksik ID'leri, aşamaları ve yorumları görebilir.
- Âlimin en fazla bir opsiyonel memleketi olabilir.
- Her aktif kullanıcı memleket oluşturabilir.
- Kontrolcü onay veya zorunlu düzeltme yorumu verebilir.
- Güncel onay âlim sayfasında onaylayan kişi ve tarihle görünür.
- Onay sonrası içerik değişikliği eski onayı güncel olmaktan çıkarır.
- Bütün kritik değişiklikler audit edilir ve yetki kontrolleri API'de uygulanır.
