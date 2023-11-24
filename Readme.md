<center><h1>WhatsApp Bot</h1></center>

# 1. Installasi

## 1.1. System Requirements

    - NodeJS v18.17.0 atau diatasnya
    - PostgreSQL v15.0 atau diatasnya
    - PM2 v5.1.0 atau diatasnya

## 1.2. Instalasi

1. Clone repository ini `https://github.com/xirf/simrs-bot`
2. install dependencies `npm install`
3. copy file `.env.example` menjadi `.env` dan sesuaikan konfigurasi yang dibutuhkan
4. install PM2 (opsional) `npm install pm2 -g`
5. jalankan aplikasi `npm run start` atau `pm2 start ecosystem.config.js`

Catatan:
PM2 digunakan untuk menjalankan aplikasi secara background dan otomatis restart jika terjadi error. selain itu PM2 menyediakan monitoring dan fitur lainnya yang sangat berguna untuk aplikasi yang berjalan secara terus menerus.
[Pelajari disini](https://pm2.keymetrics.io/docs/usage/quick-start/ "pelajari selengkapnya")

# 2. Konfigurasi

Tidak semua konfigurasi yang ada di file `.env` harus diubah. berikut adalah penjelasan dari setiap konfigurasi yang ada di file `.env`

| Konfigurasi  | Deskripsi                           |
| ------------ | ----------------------------------- |
| DB_HOST      | Host dari database                  |
| DB_PORT      | Port dari database                  |
| DB_USER      | Username dari database              |
| DB_PASSWORD  | Password dari database              |
| DB_DATABASE  | Nama database                       |
| TBL_SESSIONS | Nama tabel untuk menyimpan session  |
| TBL_STATE    | Nama tabel untuk menyimpan state    |
| TBL_TEMPLATE | Nama tabel untuk menyimpan template |

Bagian table (TBL\_...) akan dibuat secara otomatis jika tidak ada namun migrasi data tidak akan dijalankan, sehingga data harus diisi secara manual terutama pada table template

### CATATAN

Contoh isi dari table template dapat dilihat di file `src/db/models/wa_template.sql` harap mengubah data tersebut sesuai dengan kebutuhan namun jangan mengubah kolom nama kecuali Anda ingin mengatur ulang semua routes yang ada di file `src/commands/*`

# 2. Directory Stucture

Struktur direktori dari project ini adalah sebagai berikut:

```bash
simrs
└── src                 # Root
    ├── commands        # Command Handler
    │   └── routes      # Conversation routes
    ├── config          # Configuration files
    ├── db              # Database
    ├── job             # Cronjob handler
    ├── lib             # Library files
    │   ├── NLP         # Natural Language Processing
    │   └── whatsapp    # WhatsApp API
    ├── types           # Typescript types and interfaces
    └── utils           # Utility functions
```

# 3. Routes / Conversation flow

Routes atau flow dari percakapan yang ada di aplikasi ini dapat dilihat di file `src/commands/conversationFlow.ts`. file ini berisi objek berisi routes yang dijalankan.

Secara default "msg.welcome" akan dijalankan pertama kali setelah user mengirimkan pesan pertama kali. kemudian routes dapat berubah sesuai dengan input pengguna dan transittion condition yang ada di setiap routes.

## 3.1. Routes Cache

Setiap state user seperti rute sekarang dan input disimpan di dalam routes dengan ketentuan

1. routes disimpan pada cache sesuai dengan nomor pengirim
2. data input dan state disimpan pada cache sesuai dengan format `data.<nomor pengirim>`
3. setiap cache berupa objek dan berlaku selama 1 jam setelah terakhir diakses
4. state akan dihapus jika user tidak mengirimkan pesan selama 1 jam ini agar tidak terjadi memory leak
5. jika user mengirimkan pesan maka waktu akan direset kembali menjadi 1 jam

## 3.2. Routes Structure

Setiap routes memiliki struktur sebagai berikut

```ts
interface ConversationRoute {
	handler: (
		msg: WAMessage
	) => Promise<AnyMessageContent | AnyMessageContent[]>;
	// add object called error in awaitResponse to return error message
	awaitResponse?: (
		msg: WAMessage
	) => Promise<
		string | number | "batal" | "invalid" | { error: AnyMessageContent }
	>;
	transitions?: {
		condition: (resp: string | number | any) => boolean;
		nextRoute: string;
	}[];
}
```

### 3.2.1. handler

handler adalah fungsi yang akan dijalankan ketika rute dijalankan. fungsi ini harus mengembalikan pesan yang akan dikirimkan ke pengguna. fungsi ini menerima parameter `msg` yang berisi pesan yang dikirimkan oleh pengguna

### 3.2.2. awaitResponse

awaitResponse adalah fungsi yang akan dijalankan ketika pengguna mengirimkan pesan.

Dengan fungsi ini kita dapat memvalidasi input pengguna sebelum pergi ke route selanjutnya. fungsi ini dapat mengembalikan data apapun namun terdapat beberapa nilai khusus yang dapat dikembalikan untuk mengubah perilaku aplikasi
| Nilai | Deskripsi |
| --- | --- |
| "batal" | menghentikan percakapan dan menghapus state |
| "invalid" | mengirimkan pesan error dan tetap berada di rute sekarang dengan mengirimkan pesan pada rute sekarang |
| { error: AnyMessageContent } | mengirimkan pesan error dan tetap berada di rute sekarang |

awaitResponse dapat mengembalikan nilai selain yang tertera di atas. nilai tersebut akan digunakan untuk menentukan `condition` pada transitions

### 3.2.3. transitions

transitions adalah array yang berisi objek yang berisi kondisi dan rute selanjutnya. kondisi dapat berupa fungsi yang mengembalikan boolean atau nilai yang dapat dibandingkan dengan input pengguna.

#### 3.2.4. Catatan

-   jika awaitResponse dan transitions tidak didefinisikan maka aplikasi akan menghapus state dan mengembalikan pengguna ke `msg.welcome` namun tetap mengeksekusi `handler`
-   `condition` pada transitions akan dijalankan setelah `awaitResponse` dijalankan
-   jika `nextRoute` pada transitions tidak didefinisikan maka aplikasi akan menghapus state dan mengembalikan pengguna ke `msg.welcome` namun tetap mengeksekusi `handler`

# 4. Database

Aplikasi hanya melakukan pengecekan pada table yang didefinisikan pada file `.env` dan menganggap bahwa table lain seperti pasien, dokter, dan lainnya sudah ada dan tidak perlu dibuat secara otomatis.

# 5. Cronjob

Cronjob dijalankan setiap hari pada jam 6 pagi untuk menjalankan file yang ada di dalam folder `src/job` setiap file akan dipanggil secar dinamis dengan nama file sebagai nama jobnya.

Job akan mendapatkan 2 parameter yaitu `sock` dan `reply` yang merupakan instance dari `makeWAScoket` dan `reply` merupakan fungsi untuk mengirimkan pesan ke pengguna dengan memberikan typing effect

# 6. Legal

Aplikasi ini dibuat sebagai DEMO untuk mempraktekkan bagaimana membuat sistem pengingat dan pendaftaran dengan bot whatsapp. Aplikasi sama sekali tidak berafiliasi atau didukung oleh WhatsApp. Gunakan sesuai kebijaksanaan Anda sendiri. Pengembang (penulis) tidak bertanggung jawab atas penyalahgunaan atau kerusakan yang disebabkan oleh aplikasi ini.

SIMRS-BOT dan pengelolanya tidak dapat dimintai pertanggungjawaban atas penyalahgunaan aplikasi ini, sebagaimana dinyatakan dalam lisensi MIT. Pengelola (pengembang) sama sekali tidak membenarkan penggunaan aplikasi ini dalam praktik-praktik yang melanggar Ketentuan Layanan WhatsApp. Pengelola aplikasi ini meminta tanggung jawab pribadi para penggunanya untuk menggunakan aplikasi ini dengan cara yang adil, sebagaimana aplikasi ini dimaksudkan untuk digunakan.
