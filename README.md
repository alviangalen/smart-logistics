# SMART-LOGISTICS // AWS CLOUD OPERATIONS & TELEMETRY CONSOLE

Platform dashboard pengujian, integrasi, dan pemantauan riil untuk layanan komputasi awan Amazon Web Services (AWS) berbasis skenario manajemen logistik, armada rantai dingin (cold-chain), dan pergudangan modern.

---

## 1. Pemetaan Spesifikasi 8 Modul & Layanan AWS

| Modul | Nama Modul | Layanan AWS Terkait | Fungsi Operasional & Protokol |
|---|---|---|---|
| **01** | Ingestion & Cluster Health | Amazon EC2, Auto Scaling Group (ASG), Amazon ECS (Node.js), Amazon EKS (Golang) | Uji probe kesehatan instance dan klaster komputasi kontainer melalui HTTP GET, pengujian latensi dan uptime. |
| **02** | IoT Telemetry & Cold-Chain | AWS IoT Core (MQTT over WebSocket), AWS IoT Events, Redis / Amazon ElastiCache | Pembacaan aliran payload sensor suhu muatan beku (-20°C s/d -15°C), status pintu kargo, status kompresor, dan alarm anomali secara real-time via WebSocket / Redis Cache. Status ditandai *Disconnected* bila terputus. |
| **03** | Map & Asset Tracking | Amazon Location Service, Amazon Route 53, Amazon CloudFront | Peta pelacak armada geospasial berbasis vector tile MapLibre GL dengan integrasi Amazon Location Service Maps dan pemantauan perimeter geofence. |
| **04** | Order Pipeline & Events | AWS Step Functions, Amazon SQS, Amazon DynamoDB, Amazon RDS | Form inisiasi order pengiriman logistik yang mengeksekusi State Machine via API Gateway dan tabel pelacakan progres pemrosesan pesanan. |
| **05** | Document & POD Storage | Amazon S3 (Pre-signed URL Upload), Amazon S3 Glacier | Uploader bukti pengiriman (Proof of Delivery) langsung ke S3 via pre-signed URL dan tabel manajemen kelas penyimpanan S3 (STANDARD, GLACIER, DEEP_ARCHIVE). |
| **06** | Media Streaming | Amazon Kinesis Video Streams (KVS) | Pemutar live video dashcam armada berbasis HLS (`hls.js`). Jika streaming tidak aktif/offline, sistem menampilkan label *"Stream tidak aktif"*. |
| **07** | Predictive ETA & Analytics | Amazon SageMaker (Real-time Endpoint), Amazon OpenSearch Service | Form inferensi parameter muatan rute untuk kalkulasi estimasi durasi tiba (ETA) model ML SageMaker, serta bar pencarian manifest kargo terindeks OpenSearch. |
| **08** | Observability & Cloud Budgets | Amazon CloudWatch (Metrics & Alarms), AWS Budgets | Pemantauan utilisasi beban komputasi CPU/Memory CloudWatch, daftar status alarm, dan pemantauan batas anggaran biaya AWS bulanan. |

---

## 2. Struktur Direktori Proyek

```text
smart-logistics/
├── .env.example                       # Spesifikasi lengkap seluruh parameter AWS
├── .env.local                         # Konfigurasi lokal (tidak di-commit ke Git)
├── index.html                         # Dokumen HTML utama antarmuka
├── package.json                       # Konfigurasi dependensi npm
├── postcss.config.js                  # Konfigurasi PostCSS
├── tailwind.config.js                 # Konfigurasi Tailwind CSS (tema solid enterprise)
├── tsconfig.json                      # Konfigurasi TypeScript
├── vite.config.ts                     # Konfigurasi Vite bundler
└── src/
    ├── App.tsx                        # Root layout, router modul, dan modal konfigurasi
    ├── index.css                      # Tailwind directives, MapLibre styles, flat reset
    ├── main.tsx                       # Entrypoint React DOM
    ├── config/
    │   └── env.ts                     # Environment loader dengan dukungan override runtime
    ├── context/
    │   └── TroubleshootingContext.tsx # Store state log diagnostik dan audit jaringan
    ├── services/
    │   └── httpClient.ts              # Diagnostic HTTP client (latency probe, error parser)
    ├── types/
    │   └── index.ts                   # Definisi tipe TypeScript untuk seluruh modul AWS
    └── components/
        ├── common/
        │   ├── Header.tsx             # Universal console header (clock, region, status)
        │   ├── Sidebar.tsx            # Navigasi 8 modul operasional
        │   ├── StatusBadge.tsx        # Flat status pill indicator
        │   ├── EmptyState.tsx         # Render state "Tidak ada data" & error backend
        │   ├── TroubleshootingDrawer.tsx # Diagnostic drawer URL, latency, payload
        │   └── EnvironmentConfigModal.tsx # Editor parameter .env langsung di browser
        └── modules/
            ├── ClusterHealthModule.tsx       # Modul 1: Ingestion & Cluster Health
            ├── IoTTelemetryModule.tsx        # Modul 2: IoT Telemetry & Cold-Chain
            ├── AssetTrackingModule.tsx       # Modul 3: Map & Asset Tracking
            ├── OrderPipelineModule.tsx       # Modul 4: Order Pipeline & Events
            ├── StorageModule.tsx             # Modul 5: Document & POD Storage
            ├── MediaStreamingModule.tsx      # Modul 6: Media Streaming Kinesis
            ├── PredictiveAnalyticsModule.tsx # Modul 7: Predictive ETA & OpenSearch
            ├── ObservabilityModule.tsx       # Modul 8: Observability & AWS Budgets
            └── GlobalTroubleshootModule.tsx  # Konsol Audit Global seluruh permintaan
```

---

## 3. Panduan Menjalankan Aplikasi

### Kebutuhan Sistem
- Node.js versi 18.x atau lebih baru (direkomendasikan v20+ atau v22+)
- npm versi 9+

### Instalasi Dependensi
```bash
npm install
```

### Konfigurasi Endpoint
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan parameter endpoint target AWS Anda. Anda juga dapat mengubah atau menguji endpoint langsung melalui tombol **"SETTING ENDPOINT"** di pojok kanan atas dashboard tanpa perlu mem-build ulang aplikasi.

### Menjalankan Mode Development
```bash
npm run dev
```
Aplikasi akan aktif secara default di `http://localhost:5173`.

### Membangun Bundle Produksi
```bash
npm run build
```
Hasil kompilasi siap didistribusikan melalui AWS S3 Bucket + CloudFront Distribution atau AWS Amplify.

---

## 4. Mode Troubleshooting & Verifikasi Infrastruktur

Ketika menguji koneksi ke endpoint AWS:
1. Klik tombol **Uji Probe** atau aksi submit pada modul terkait.
2. Buka panel **Troubleshooting & Diagnostic Log** yang terletak di bagian bawah modul.
3. Anda dapat memverifikasi:
   - Target Request URL & HTTP Method
   - HTTP Status Code (misal: `200 OK`, `403 Forbidden`, `404 Not Found`, atau `ECONNREFUSED`)
   - Latensi jaringan riil dalam milidetik (`ms`)
   - Payload JSON mentah yang dikembalikan oleh backend AWS atau stack API Gateway.
