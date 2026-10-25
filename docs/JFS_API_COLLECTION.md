# 📚 DOKUMENTASI KOLEKSI API RESMI JFS J&T CARGO (MASTER ENDPOINTS)

Kumpulan endpoint resmi Gateway JFS J&T Cargo (`https://jfsgw.jtcargo.co.id`) yang dikumpulkan dari jaringan devtools dan operasional untuk kebutuhan integrasi sistem **Monitoring FIFO**.

---

## 🔑 Informasi Autentikasi & Header Standar

Semua request ke Gateway JFS menggunakan header standar berikut:
* **Host Gateway:** `https://jfsgw.jtcargo.co.id`
* **Portal Asal:** `https://jfs.jtcargo.co.id`
* **Header Wajib:**
  * `authtoken`: `[Token JFS Aktif]`
  * `lang`: `ID`
  * `langtype`: `ID`
  * `origin`: `https://jfs.jtcargo.co.id`
  * `referer`: `https://jfs.jtcargo.co.id/`
  * `content-type`: `application/json;charset=UTF-8`
  * `routename`: *(Disesuaikan per modul, misal: `trackingExpress`, `orderTracking`, dll.)*

---

## 1. 🚚 Modul Tracking Express & Rekaman POD (Riwayat Scan Lengkap)

Endpoint yang digunakan untuk menampilkan riwayat pelacakan dinamis, alur scan, rute aktual, dan retur pengembalian:

### A. Riwayat Alur Scan Log (Tabel POD Lengkap 18 Scan)
* **URL:** `POST https://jfsgw.jtcargo.co.id/operatingplatform/podTracking/inner/query/waybillList`
* **Routename:** `trackingExpress`
* **Fungsi:** Mengambil riwayat scan lengkap: jam scan, waktu unggah, jenis scan (Pickup, Scan Kirim, Pindai Penerimaan, Scan Keluar Gudang, Retur), nama pemindai, nomor surat jalan (`DKGX...`), dan deskripsi pergerakan paket.
* **Payload:**
  ```json
  {
    "keywordList": ["570661708357"],
    "countryId": "1"
  }
  ```

### B. Detail Order Operasional (Nama Barang, Pengirim, Penerima, & No. Telepon Lengkap)
* **URL:** `POST https://jfsgw.jtcargo.co.id/operatingplatform/order/getOrderDetail`
* **Routename:** `trackingExpress`
* **Fungsi:** Mengambil data order lengkap tanpa masker sensor (Nama Barang, Pengirim, Perusahaan Pengirim, No HP Pengirim, Penerima, Perusahaan Penerima, No HP Penerima, dan Alamat Lengkap).
* **Payload:**
  ```json
  {
    "waybillNo": "570661708357",
    "countryId": "1"
  }
  ```

### C. Routing Dinamis (Alur Jalur Panah Paling Atas)
* **URL:** `GET https://jfsgw.jtcargo.co.id/transportation/dynamicRoute/listByWaybillNo?waybillNo=570661708357`
* **Routename:** `trackingExpress`
* **Fungsi:** Mengambil alur rencana rute dinamis (contoh: `TGR131A -> GW-Jakarta -> GW-Semarang -> SRG001A -> ...`).

### D. Rute Aktual (Jalur Nyata yang Dilewati Paket)
* **URL:** `POST https://jfsgw.jtcargo.co.id/operatingplatform/podTracking/inner/query/actualRoute`
* **Routename:** `trackingExpress`
* **Payload:**
  ```json
  {
    "keywordList": ["570661708357"],
    "trackingTypeEnum": "WAYBILL",
    "countryId": "1"
  }
  ```

### E. Rute Rencana Pengembalian (Jalur Retur)
* **URL:** `POST https://jfsgw.jtcargo.co.id/operatingplatform/rebackTransferExpress/queryRebackRoute`
* **Routename:** `trackingExpress`
* **Payload:**
  ```json
  {
    "keywordList": ["570661708357"],
    "trackingTypeEnum": "WAYBILL",
    "countryId": "1"
  }
  ```

### F. Paket Bermasalah & Catatan Alasan Retur
* **URL:** `POST https://jfsgw.jtcargo.co.id/operatingplatform/abnormalPieceScanList/pageList`
* **Routename:** `trackingExpress`
* **Fungsi:** Mengambil daftar scan paket bermasalah serta alasan retur (contoh: `[Pengirim minta retur / 寄件人要求退件]`, paket rusak, dll.).
* **Payload:**
  ```json
  {
    "current": 1,
    "size": 100,
    "waybillId": "570661708357",
    "abnormalTypeCode": 6,
    "countryId": "1"
  }
  ```

### G. Riwayat Perubahan Alamat Pengiriman
* **URL:** `GET https://jfsgw.jtcargo.co.id/operatingplatform/addressAdmin/addressList?waybillNo=570661708357`
* **Routename:** `trackingExpress`
* **Fungsi:** Mengecek riwayat jika ada revisi alamat pengiriman dari customer / marketplace.

### H. Komparasi Kode Segmen Rute
* **URL:** `POST https://jfsgw.jtcargo.co.id/operatingplatform/podTracking/inner/query/segmentCodeCompareList`
* **Routename:** `trackingExpress`
* **Payload:**
  ```json
  {
    "waybillNos": ["570661708357"],
    "countryId": "1"
  }
  ```

### I. OPS Check List by Bill Code
* **URL:** `POST https://jfsgw.jtcargo.co.id/operatingplatform/opsCheck/getCheckListByBillCode`
* **Routename:** `trackingExpress`
* **Payload:**
  ```json
  {
    "billCode": "570661708357",
    "countryId": "1"
  }
  ```

### J. Detail Integrasi Waybill ke J&T Express / Drop-off
* **URL:** `POST https://jfsgw.jtcargo.co.id/operatingplatform/waybillToJt/waybillToJtDetail`
* **Routename:** `trackingExpress`
* **Payload:**
  ```json
  {
    "wayBillNo": "570661708357",
    "countryId": "1"
  }
  ```

### K. Rekaman Event Abnormal Kualitas Layanan
* **URL:** `POST https://jfsgw.jtcargo.co.id/servicequality/abnormalEventRecord/selectByTaskNoOrNetworkCode`
* **Routename:** `trackingExpress`
* **Payload:**
  ```json
  {
    "current": "1",
    "size": "1",
    "networkCode": "SRG001A",
    "scanTime": "2026-10-25 17:56:48",
    "countryId": "1"
  }
  ```

---

## 2. 📊 Modul Monitoring FIFO & Stok Realtime Gateway (Inbound Inventory)

Endpoint yang digunakan sistem untuk memantau paket stuck/aging di GW-Jakarta:

### A. Pencarian Stok Realtime (List Paket)
* **URL:** `POST https://jfsgw.jtcargo.co.id/jfs-report-leader/report/dynamicReport/findByPagination?sqlCode=realtime_inv_man_dtl&dcr_key=57b048fb-bc8c-4d24-982b-a750b7ce8693`
* **Routename:** `Bd-theme-4d718ae8-fa85-4edc-b98c-1a0f75e5f9f3|businessIndicatorIndex`
* **Payload:**
  ```json
  {
    "beginDate": "2026-08-25 00:00:00",
    "endDate": "2026-10-24 23:59:59",
    "scanSiteCode": "JKT99A",
    "queryFlag": "2",
    "billCode": "",
    "scanSiteCodeName": "GW-Jakarta",
    "scanSiteCodeTypeId": 335,
    "scanSiteCodeId": 220,
    "isOverDate": "",
    "operateSiteType": "all",
    "expressTypeCode": "",
    "codNeed": "",
    "invOverTm": "",
    "shipHour": "",
    "customerCode": "",
    "isRefund": "",
    "sqlCode": "realtime_inv_man_dtl",
    "current": 1,
    "size": 100,
    "convertResultFromDictionCode": "is_receiver_pay|124,isProblemPiece|124,cod_need|124,is_refund|124",
    "convertResultFromDictionOriCode": "",
    "paginationSearchType": "list",
    "countryId": "1"
  }
  ```

### B. Hitung Total Stok Realtime (Count)
* **URL:** Sama seperti di atas dengan `paginationSearchType: "count"`.

---

## 3. 🔎 Modul PTO (Pelacakan Total Order - OMS)

Endpoint untuk mencari order dan detail pelanggan di level OMS:

### A. Status Query (Pencarian Order Massal / Tanggal)
* **URL:** `POST https://jfsgw.jtcargo.co.id/customerplatform/omsOrderStatus/statusQuery`
* **Routename:** `orderTracking`
* **Payload:**
  ```json
  {
    "siteCode": "JKT99A",
    "startDate": "2026-09-25 00:00:00",
    "endDate": "2026-10-25 23:59:59",
    "current": 1,
    "size": 100,
    "countryId": "1",
    "p_billType": 1,
    "p_billNo": "2018..."
  }
  ```

### B. Order Detail OMS
* **URL:** `GET https://jfsgw.jtcargo.co.id/customerplatform/omsOrderStatus/detail?id=[orderId]`
* **Routename:** `orderTrackingView`

### C. Order Detail by Log
* **URL:** `GET https://jfsgw.jtcargo.co.id/customerplatform/omsOrderStatus/detailByLog?id=[orderId]`
* **Routename:** `orderTrackingView`

---

## 4. 🗃️ Kumpulan Curl Siap Pakai

Berikut curl lengkap untuk pengujian manual via terminal:

```bash
# 1. Riwayat Scan Log (Tabel POD 18 Baris)
curl --url 'https://jfsgw.jtcargo.co.id/operatingplatform/podTracking/inner/query/waybillList' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'authtoken: 47e7163935ac49a49fe296c94c1d613e' \
  -H 'content-type: application/json;charset=UTF-8' \
  -H 'lang: ID' \
  -H 'origin: https://jfs.jtcargo.co.id' \
  -H 'referer: https://jfs.jtcargo.co.id/' \
  -H 'routename: trackingExpress' \
  --data-raw '{"keywordList":["570661708357"],"countryId":"1"}'

# 2. Detail Order Lengkap (Nama Barang, Pengirim, Penerima, No HP)
curl --url 'https://jfsgw.jtcargo.co.id/operatingplatform/order/getOrderDetail' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'authtoken: 47e7163935ac49a49fe296c94c1d613e' \
  -H 'content-type: application/json;charset=UTF-8' \
  -H 'lang: ID' \
  -H 'origin: https://jfs.jtcargo.co.id' \
  -H 'referer: https://jfs.jtcargo.co.id/' \
  -H 'routename: trackingExpress' \
  --data-raw '{"waybillNo":"570661708357","countryId":"1"}'

# 3. Alasan Paket Bermasalah / Retur
curl --url 'https://jfsgw.jtcargo.co.id/operatingplatform/abnormalPieceScanList/pageList' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'authtoken: 47e7163935ac49a49fe296c94c1d613e' \
  -H 'content-type: application/json;charset=UTF-8' \
  -H 'lang: ID' \
  -H 'origin: https://jfs.jtcargo.co.id' \
  -H 'referer: https://jfs.jtcargo.co.id/' \
  -H 'routename: trackingExpress' \
  --data-raw '{"current":1,"size":100,"waybillId":"570661708357","abnormalTypeCode":6,"countryId":"1"}'
```

---
*Dokumentasi ini dibuat otomatis dan tersimpan permanen di repository GitHub Monitoring FIFO.*

