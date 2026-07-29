# Kıraat Ağı

Kıraat araştırmacılarının kişileri ve yönlü hoca-talebe ilişkilerini
kaydettiği, aradığı ve filtrelediği full-stack Next.js uygulaması.

## Gereksinimler

- Node.js 20.9 veya üzeri
- PostgreSQL 16
- PostgreSQL `unaccent` ve `pg_trgm` extension'ları

## Yerel kurulum

1. Yerel PostgreSQL'i başlatın:

   ```bash
   docker compose -f compose.dev.yml up -d
   ```

2. `.env.example` dosyasını `.env` olarak kopyalayın ve değerleri düzenleyin.
   Yerel compose bağlantısı:

   ```text
   postgresql://qiraat_app:qiraat_app@localhost:54329/qiraat_atlas
   ```

3. Kurulum komutlarını çalıştırın:

   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

Başlangıç kullanıcısı `SEED_USERNAME` ve `SEED_PASSWORD` değerlerinden
oluşturulur. Sonradan kullanıcı eklemek veya şifresini yenilemek için:

```bash
npm run user:create -- kullanici-adi guclu-sifre
```

## Kontroller

```bash
npm test
npm run lint
npm run build
```

## Production

Production, mevcut `postgres:5432` servisi içindeki ayrı `qiraat_atlas`
database'ini kullanır. Yeni PostgreSQL container'ı oluşturulmaz.

- `deploy/create-database.sql`: Bir defalık database ve kullanıcı hazırlığı
- `deploy/compose.production.example.yml`: Mevcut Docker ağına eklenecek
  uygulama servisi örneği
- `deploy/backup.sh`: Günlük PostgreSQL yedeği için örnek iş

Migration ve seed işlemleri yeni uygulama sürümü yayına alınmadan önce,
database'e erişebilen güvenli bir yönetim ortamından çalıştırılmalıdır.
