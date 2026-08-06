# Kullanıcı Yönetimi Operasyon Rehberi

## Yayın sırası

1. Veritabanının doğrulanmış yedeğini alın.
2. Yeni uygulama imajını hazırlayın fakat trafiğe açmayın.
3. Uygulamayla aynı `DATABASE_URL` kullanılarak `npm run db:migrate` çalıştırın.
4. `npm run db:seed` çalıştırarak rol, permission ve sözlük değerlerini
   idempotent biçimde güncelleyin.
5. En az bir aktif `MANAGER` kullanıcısı olduğunu kontrol edin.
6. Uygulamayı yayınlayıp smoke testleri tamamlayın.

Migration'lar mevcut kayıtları silmez. Mevcut kullanıcılar ilk RBAC
migration'ında yönetici rolüyle backfill edilir. Kullanıcılar ve kontrol
geçmişi fiziksel olarak silinmez.

## Smoke test

- Yönetici mevcut hesabıyla giriş yapabiliyor.
- `/admin/users`, `/admin/roles`, `/admin/assignments` ve
  `/admin/researchers` açılıyor.
- Araştırmacıya çakışmayan bir görev atanabiliyor.
- Araştırmacı görev kapsamındaki ID'yi oluşturabiliyor, kapsam dışındaki için
  `403` alıyor.
- Deadline geçmiş görev yazma hakkı vermeye devam ediyor ve gecikmiş görünüyor.
- Memleket form içinden oluşturulup âlime atanabiliyor.
- Araştırmacı âlimi kontrole gönderebiliyor.
- Kontrolcü düzeltme isteyip onay verebiliyor.
- Onaylayan kişi ve tarih âlim sayfasında görünüyor.
- Onaylı âlim değiştirildiğinde eski onay güncel olmaktan çıkıyor.

## Yönetici kilitlenmesini önleme

- Son aktif yönetici pasife alınamaz.
- Son aktif yöneticinin yönetici rolü kaldırılamaz.
- Kullanıcı pasife alındığında bütün session kayıtları silinir.
- Acil yönetici hazırlamak için migration ve seed sonrasında:

```bash
npm run user:create -- <kullanıcı-adı> <en-az-10-karakter-şifre> MANAGER
```

komutu kullanılabilir.

## Görev kapsamı operasyonu

- Aktif ve gecikmiş görevlerin ID aralıkları çakışamaz.
- Kapsam aktarılacaksa eski görev iptal edilmeli veya kapsamı küçültülmelidir.
- Deadline görevi kapatmaz; yalnızca gecikme metriği üretir.
- Görev ancak bütün ID'ler girilmiş ve güncel içerik versiyonları onaylanmışsa
  tamamlanabilir.

## İzleme ve audit

Kullanıcı/rol, görev, âlim/ilişki, memleket ve kontrol değişiklikleri
`audit_events` ile gerektiğinde `audit_field_changes` tablolarından izlenir.
Audit şifre, password hash, session token veya secret içermez.

## Geri dönüş yaklaşımı

Uygulama kodu önceki imaja döndürülebilir; yeni tablolar ve sütunlar hemen
silinmemelidir. Şema rollback'i veri kaybı riski nedeniyle yedek ve ayrı bakım
planı gerektirir. Önceki uygulama sürümü yeni nullable alanları ve ek tabloları
görmezden gelebilir.
