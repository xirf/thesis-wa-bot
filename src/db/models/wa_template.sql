/*
 Navicat Premium Data Transfer

 Source Server         : Postregsql
 Source Server Type    : PostgreSQL
 Source Server Version : 150003 (150003)
 Source Host           : localhost:5432
 Source Catalog        : wa
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 150003 (150003)
 File Encoding         : 65001

 Date: 14/09/2023 00:27:40
*/


-- ----------------------------
-- Table structure for wa_template
-- ----------------------------
DROP TABLE IF EXISTS "public"."wa_template";
CREATE TABLE "public"."wa_template" (
  "id" int4 NOT NULL DEFAULT nextval('wa_template_id_seq'::regclass),
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "template" text COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Records of wa_template
-- ----------------------------
INSERT INTO "public"."wa_template" VALUES (10, 'msg.reg.umum.schedules', 'Berikut adalah jadwal dari *[dokter]*

[jadwal]

Silahkan balas dengan *nomor jadwal* yang Anda inginkan.');
INSERT INTO "public"."wa_template" VALUES (1, 'msg.welcome', 'Selamat [time], [name].
{if:kontrol}
Jadwal kontrol Anda berikutnya adalah:
Tanggal: [kontrol]
{else}
*Selamat datang di Asisten WA RSU Darmayu!👋*
  
Silahkan pilih menu berikut:
1. Mendaftar pasien
2. Lihat jadwal dokter
  
Silahkan balas dengan nomor yang Anda inginkan😊');
INSERT INTO "public"."wa_template" VALUES (2, 'msg.reg.selectRegtype', 'Silahkan pilih jenis pendaftaran Anda

1. Pasien umum
2. Pasien BPJS

Silahkan balas dengan nomor yang anda inginkan');
INSERT INTO "public"."wa_template" VALUES (0, 'msg.err.invalidInput', 'Mohon maaf pilihan tidak tersedia, silahkan coba kembali');
INSERT INTO "public"."wa_template" VALUES (4, 'msg.reg.umum', 'Silakan masukkan nomor Rekam Medis Anda.

Nomor ini dapat Anda temukan pada kartu anggota atau berkas medis sebelumnya.

Jika Anda tidak memiliki nomor Rekam Medis, silakan datang ke RSU Darmayu agar kami dapat memberikan nomor kepada Anda.
');
INSERT INTO "public"."wa_template" VALUES (6, 'msg.err.RMNotFound', 'Mohon maaf, nomor Rekam Medis yang Anda masukkan tidak ditemukan😢.
Silakan coba lagi.

Jika Anda tidak memiliki nomor rekam medis, kami sarankan Anda untuk pergi ke Rumah Sakit guna mendapatkan nomor RM.
');
INSERT INTO "public"."wa_template" VALUES (5, 'msg.reg.umum.img', 'https://cdn.discordapp.com/attachments/1126126535812858000/1150469622894698596/download.jpg');
INSERT INTO "public"."wa_template" VALUES (9, 'msg.err.endOfRoute', 'Terima kasih, Percakapan ini selesai.

Jika Anda ingin memulai ulang atau memiliki pertanyaan lebih lanjut, kami akan membantu Anda

Terima kasih😇
');
INSERT INTO "public"."wa_template" VALUES (7, 'msg.reg.umum.poli', 'Nomor Rekam Medis Anda ditemukan sebagai *[nama]*
Jika ini bukan pasien yang Anda cari, balas dengan "batal".

Pilih poli kunjungan Anda:
[poli]

Silahkan balas dengan *nomor poli* yang Anda inginkan.
');
INSERT INTO "public"."wa_template" VALUES (15, 'schedule.showDoctor', 'Berikut adalah daftar dokter yang memiliki kemiripan dengan pencarian Anda:

[dokter]

Silakan pilih dengan memberikan *nomor dokter* yang Anda inginkan. 

Jika Anda ingin mencari lagi, cukup balas dengan selain nomor dokter😊');
INSERT INTO "public"."wa_template" VALUES (14, 'schedule.getname', 'Silahkan masukkan nama Dokter yang ingin dicari');
INSERT INTO "public"."wa_template" VALUES (16, 'schedule', 'Berikut adalah jadwal dari *[dokter]*

[jadwal]');
INSERT INTO "public"."wa_template" VALUES (17, 'thanks', 'Sama-sama kami senang dapat membantu anda 😇');
INSERT INTO "public"."wa_template" VALUES (8, 'msg.reg.umum.dokter', 'Berikut adalah dokter yang tersedia:

[dokter]

Silahkan balas dengan *nomor dokter* yang Anda inginkan.');
INSERT INTO "public"."wa_template" VALUES (3, 'msg.reg.bpjs', 'Mohon maaf🙇‍♀️,

Kami ingin memberi tahu bahwa saat ini sistem kami belum mendukung registrasi pasien BPJS.

Hal ini disebabkan oleh alur pendaftaran memerlukan pengecekan berkas secara manual dan koordinasi dengan berbagai pihak🏢

Kami dengan tulus memohon maaf atas ketidaknyamanan ini.

Untuk melakukan pendaftaran pasien BPJS, kami sarankan Anda untuk mengunjungi RSU Darmayu, tempat Anda dapat mendaftar dengan lebih mudah.

Kami ingin memberi jaminan bahwa kami akan terus melakukan perbaikan dan peningkatan pada sistem kami.
Dengan demikian, kami berharap fitur pendaftaran pasien BPJS akan segera tersedia di masa mendatang.

Terima kasih atas pengertian dan kesabaran Anda.
');
INSERT INTO "public"."wa_template" VALUES (12, 'reg.success', 'Jadwal kunjungan Anda telah dibuat! 🎉

Kode Antrian: *[kode]*

Detail kunjungan:
- Poli: [poli]
- Dokter: [dokter]
- Tanggal: *[tanggal]*
- Jam: *[jam]*

Simpan kode Antrian ini dengan baik. 📋 
Tunjukkan kode ini ke loket saat kunjungan Anda.

Setelah ini Anda akan dibawa ke menu utama 😊');
INSERT INTO "public"."wa_template" VALUES (11, 'msg.reg.confirm', 'Berikut adalah ringkasan kunjungan Anda:

- Poli: *[poli]*
- Dokter: *[dokter]*
- Tanggal: *[tanggal]*
- Jam: *[jam]*

Apakah ini jadwal kunjungan yang benar? Mohon konfirmasi dengan jawaban *"Ya"* atau *"Tidak"*');
INSERT INTO "public"."wa_template" VALUES (13, 'msg.reg.cancel', 'Operasi berhasil dibatalkan😊

Setelah ini, Anda akan dibawa ke menu utama ');
INSERT INTO "public"."wa_template" VALUES (18, 'birthday.image', 'https://akcdn.detik.net.id/community/media/visual/2022/12/08/ucapan-selamat-ulang-tahun-islami-untuk-anak.jpeg?w=700&q=100');
INSERT INTO "public"."wa_template" VALUES (20, 'checkup', 'Halo [name],

Ini adalah pengingat untuk kontrol rutin Anda di rumah sakit. Kesehatan adalah investasi berharga, jadi pastikan untuk tidak melewatkan jadwal kontrol Anda.

Tanggal Kontrol: *[date]*
Waktu Kontrol: *[time]* WIB
Lokasi: *[location]*

Ingatlah untuk membawa semua catatan medis yang diperlukan dan pertanyaan yang ingin Anda ajukan kepada dokter Anda.

Kesehatan adalah kekayaan. Jaga diri Anda dengan mengikuti kontrol rutin Anda. Terima kasih!

Salam,

Tim Kesehatan RSU Darmayu');
INSERT INTO "public"."wa_template" VALUES (19, 'birthday', 'Selamat ulang tahun yang penuh berkah! 🎂🎉

Hari ini adalah hari spesial yang mengingatkan kita untuk merayakan hidup dan kesehatan. 💪🫶
Kami di tim kesehatan selalu mendukungmu dalam menjaga kesehatan. 💯

Semoga kamu memiliki hari yang menyenangkan dan sehat selalu! 😊');

-- ----------------------------
-- Primary Key structure for table wa_template
-- ----------------------------
ALTER TABLE "public"."wa_template" ADD CONSTRAINT "wa_template_pkey" PRIMARY KEY ("id");
