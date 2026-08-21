/* =====================================================
   PAYA RENGAS DELIVERY V2
   SCRIPT.JS - FULL FINAL
   TERHUBUNG DENGAN ADMIN.HTML
   ===================================================== */


/* =====================================================
   PENGATURAN
===================================================== */

const NOMOR_WA = "6283851564958";

// Ongkir dasar sementara
// Nanti bisa kita ganti menggunakan GPS
const ONGKIR_DASAR = 5000;

// KEY LOCAL STORAGE
const KEY_KERANJANG = "payaRengasKeranjang";
const KEY_PESANAN = "payaRengasPesanan";
const KEY_LOKASI = "payaRengasLokasi";


/* =====================================================
   DATA KERANJANG
===================================================== */

let keranjang =
    JSON.parse(
        localStorage.getItem(KEY_KERANJANG)
    ) || [];


let lokasiPelanggan = null;


/* =====================================================
   SIMPAN KERANJANG
===================================================== */

function simpanKeranjang() {

    localStorage.setItem(
        KEY_KERANJANG,
        JSON.stringify(keranjang)
    );

}


/* =====================================================
   FORMAT RUPIAH
===================================================== */

function rupiah(angka) {

    return "Rp" +
        Number(angka || 0)
            .toLocaleString("id-ID");

}


/* =====================================================
   TAMBAH KERANJANG
===================================================== */

function tambahKeranjang(nama, harga) {

    const produk =
        keranjang.find(
            item => item.nama === nama
        );


    if (produk) {

        produk.jumlah++;

    } else {

        keranjang.push({

            nama: nama,

            harga: Number(harga),

            jumlah: 1

        });

    }


    simpanKeranjang();

    tampilkanKeranjang();

}


/* =====================================================
   TAMBAH JUMLAH
===================================================== */

function tambahJumlah(index) {

    if (!keranjang[index]) {

        return;

    }


    keranjang[index].jumlah++;


    simpanKeranjang();

    tampilkanKeranjang();

}


/* =====================================================
   KURANGI JUMLAH
===================================================== */

function kurangJumlah(index) {

    if (!keranjang[index]) {

        return;

    }


    keranjang[index].jumlah--;


    if (keranjang[index].jumlah <= 0) {

        keranjang.splice(index, 1);

    }


    simpanKeranjang();

    tampilkanKeranjang();

}


/* =====================================================
   HITUNG TOTAL BELANJA
===================================================== */

function hitungTotalBelanja() {

    return keranjang.reduce(

        (total, item) => {

            return total +
                (
                    Number(item.harga) *
                    Number(item.jumlah)
                );

        },

        0

    );

}


/* =====================================================
   HITUNG ONGKIR
===================================================== */

function hitungOngkir() {

    if (keranjang.length === 0) {

        return 0;

    }


    return ONGKIR_DASAR;

}


/* =====================================================
   HITUNG TOTAL PEMBAYARAN
===================================================== */

function hitungTotalPembayaran() {

    return (
        hitungTotalBelanja() +
        hitungOngkir()
    );

}


/* =====================================================
   TAMPILKAN KERANJANG
===================================================== */

function tampilkanKeranjang() {

    const pesanan =
        document.getElementById("pesanan");


    const totalElement =
        document.getElementById("total");


    if (!pesanan) {

        updateCheckout();

        return;

    }


    /* KERANJANG KOSONG */

    if (keranjang.length === 0) {

        pesanan.innerHTML = `

            <div class="keranjang-kosong">

                🛒 Keranjang masih kosong.

                <br>

                Silakan pilih makanan terlebih dahulu.

            </div>

        `;


        if (totalElement) {

            totalElement.innerHTML =
                "Total : Rp0";

        }


        updateCheckout();

        return;

    }


    /* ISI KERANJANG */

    let html = "";


    keranjang.forEach(

        function(item, index) {

            const subtotal =
                Number(item.harga) *
                Number(item.jumlah);


            html += `

                <div class="item-keranjang">

                    <div class="item-info">

                        <h3>
                            ${escapeHTML(item.nama)}
                        </h3>

                        <p>
                            ${rupiah(item.harga)}
                            ×
                            ${item.jumlah}
                        </p>

                    </div>


                    <div class="item-control">

                        <button
                            onclick="kurangJumlah(${index})">
                            −
                        </button>


                        <span>
                            ${item.jumlah}
                        </span>


                        <button
                            onclick="tambahJumlah(${index})">
                            +
                        </button>

                    </div>


                    <div class="item-subtotal">

                        ${rupiah(subtotal)}

                    </div>

                </div>

            `;

        }

    );


    pesanan.innerHTML = html;


    const totalBelanja =
        hitungTotalBelanja();


    const ongkir =
        hitungOngkir();


    const totalBayar =
        hitungTotalPembayaran();


    if (totalElement) {

        totalElement.innerHTML = `

            <div class="total-detail">

                <div>

                    Total Belanja

                    <strong>
                        ${rupiah(totalBelanja)}
                    </strong>

                </div>


                <div>

                    Ongkos Kirim

                    <strong>
                        ${rupiah(ongkir)}
                    </strong>

                </div>


                <div class="total-akhir">

                    Total Pembayaran

                    <strong>
                        ${rupiah(totalBayar)}
                    </strong>

                </div>

            </div>

        `;

    }


    updateCheckout();

}


/* =====================================================
   UPDATE CHECKOUT
===================================================== */

function updateCheckout() {

    const totalBelanja =
        hitungTotalBelanja();


    const ongkir =
        hitungOngkir();


    const totalBayar =
        hitungTotalPembayaran();


    /* TOTAL BELANJA */

    const checkoutTotal =
        document.getElementById(
            "checkoutTotal"
        );


    if (checkoutTotal) {

        checkoutTotal.innerText =
            rupiah(totalBelanja);

    }


    /* ONGKIR */

    const checkoutOngkir =
        document.getElementById(
            "checkoutOngkir"
        );


    if (checkoutOngkir) {

        checkoutOngkir.innerText =
            rupiah(ongkir);

    }


    /* TOTAL PEMBAYARAN */

    const checkoutBayar =
        document.getElementById(
            "checkoutBayar"
        );


    if (checkoutBayar) {

        checkoutBayar.innerText =
            rupiah(totalBayar);

    }


    /* ID ALTERNATIF */

    const totalBelanjaElement =
        document.getElementById(
            "totalBelanja"
        );


    if (totalBelanjaElement) {

        totalBelanjaElement.innerText =
            rupiah(totalBelanja);

    }


    const ongkirElement =
        document.getElementById(
            "ongkir"
        );


    if (ongkirElement) {

        ongkirElement.innerText =
            rupiah(ongkir);

    }


    const totalPembayaranElement =
        document.getElementById(
            "totalPembayaran"
        );


    if (totalPembayaranElement) {

        totalPembayaranElement.innerText =
            rupiah(totalBayar);

    }

}


/* =====================================================
   KOSONGKAN KERANJANG
===================================================== */

function kosongkanKeranjang() {

    if (keranjang.length === 0) {

        return;

    }


    const yakin =
        confirm(
            "Apakah Anda yakin ingin mengosongkan keranjang?"
        );


    if (!yakin) {

        return;

    }


    keranjang = [];


    simpanKeranjang();


    tampilkanKeranjang();

}


/* =====================================================
   AMBIL LOKASI GPS
===================================================== */

function ambilLokasi() {

    if (!navigator.geolocation) {

        alert(
            "GPS tidak tersedia pada perangkat ini."
        );

        return;

    }


    const status =
        document.getElementById(
            "statusLokasi"
        );


    if (status) {

        status.innerHTML =
            "📍 Sedang mengambil lokasi...";

    }


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            lokasiPelanggan = {

                latitude: latitude,

                longitude: longitude

            };


            localStorage.setItem(

                KEY_LOKASI,

                JSON.stringify(
                    lokasiPelanggan
                )

            );


            const linkGoogleMaps =
                `https://www.google.com/maps?q=${latitude},${longitude}`;


            if (status) {

                status.innerHTML = `

                    📍 Lokasi berhasil diambil.

                    <br>

                    <a
                        href="${linkGoogleMaps}"
                        target="_blank">

                        Lihat Lokasi di Google Maps

                    </a>

                `;

            }


            alert(
                "Lokasi berhasil diambil."
            );

        },


        function(error) {

            console.log(error);


            if (status) {

                status.innerHTML =
                    "📍 Lokasi belum diambil.";

            }


            alert(
                "Lokasi belum berhasil diambil. Pastikan izin lokasi sudah diberikan."
            );

        },


        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0

        }

    );

}


/* =====================================================
   MUAT LOKASI
===================================================== */

function muatLokasi() {

    const data =
        localStorage.getItem(
            KEY_LOKASI
        );


    if (!data) {

        return;

    }


    try {

        lokasiPelanggan =
            JSON.parse(data);


        const status =
            document.getElementById(
                "statusLokasi"
            );


        if (
            status &&
            lokasiPelanggan
        ) {

            const linkGoogleMaps =
                `https://www.google.com/maps?q=${lokasiPelanggan.latitude},${lokasiPelanggan.longitude}`;


            status.innerHTML = `

                📍 Lokasi tersimpan.

                <br>

                <a
                    href="${linkGoogleMaps}"
                    target="_blank">

                    Lihat Lokasi

                </a>

            `;

        }

    }

    catch(error) {

        console.log(error);

    }

}


/* =====================================================
   AMBIL DATA PELANGGAN
===================================================== */

function ambilDataPelanggan() {

    const namaElement =
        document.getElementById(
            "namaPelanggan"
        );


    const waElement =
        document.getElementById(
            "nomorWhatsApp"
        );


    const alamatElement =
        document.getElementById(
            "alamatPengantaran"
        );


    const catatanElement =
        document.getElementById(
            "catatanPesanan"
        );


    return {

        nama:
            namaElement ?
            namaElement.value.trim() :
            "",


        whatsapp:
            waElement ?
            waElement.value.trim() :
            "",


        alamat:
            alamatElement ?
            alamatElement.value.trim() :
            "",


        catatan:
            catatanElement ?
            catatanElement.value.trim() :
            ""

    };

}


/* =====================================================
   VALIDASI CHECKOUT
===================================================== */

function validasiCheckout() {

    if (keranjang.length === 0) {

        alert(
            "Keranjang masih kosong. Silakan pilih pesanan terlebih dahulu."
        );

        return false;

    }


    const data =
        ambilDataPelanggan();


    if (!data.nama) {

        alert(
            "Silakan isi Nama Pelanggan."
        );


        const input =
            document.getElementById(
                "namaPelanggan"
            );


        if (input) {

            input.focus();

        }


        return false;

    }


    if (!data.whatsapp) {

        alert(
            "Silakan isi Nomor WhatsApp."
        );


        const input =
            document.getElementById(
                "nomorWhatsApp"
            );


        if (input) {

            input.focus();

        }


        return false;

    }


    if (!data.alamat) {

        alert(
            "Silakan isi Alamat Pengantaran."
        );


        const input =
            document.getElementById(
                "alamatPengantaran"
            );


        if (input) {

            input.focus();

        }


        return false;

    }


    return true;

}


/* =====================================================
   BUAT DETAIL ITEM PESANAN
===================================================== */

function buatDetailItemPesanan() {

    return keranjang.map(

        function(item) {

            return {

                nama: item.nama,

                harga: Number(item.harga),

                jumlah: Number(item.jumlah),

                subtotal:
                    Number(item.harga) *
                    Number(item.jumlah)

            };

        }

    );

}


/* =====================================================
   AMBIL SEMUA PESANAN
===================================================== */

function ambilSemuaPesanan() {

    const data =
        localStorage.getItem(
            KEY_PESANAN
        );


    if (!data) {

        return [];

    }


    try {

        const hasil =
            JSON.parse(data);


        if (Array.isArray(hasil)) {

            return hasil;

        }


        return [];

    }

    catch(error) {

        console.log(error);

        return [];

    }

}


/* =====================================================
   SIMPAN SEMUA PESANAN
===================================================== */

function simpanSemuaPesanan(pesanan) {

    localStorage.setItem(

        KEY_PESANAN,

        JSON.stringify(pesanan)

    );

}


/* =====================================================
   SIMPAN PESANAN KE ADMIN
===================================================== */

function simpanPesananKeAdmin() {

    const data =
        ambilDataPelanggan();


    const totalBelanja =
        hitungTotalBelanja();


    const ongkir =
        hitungOngkir();


    const totalBayar =
        hitungTotalPembayaran();


    const daftarPesanan =
        ambilSemuaPesanan();


    const waktu =
        new Date();


    const pesananBaru = {

        id:
            "PRD-" +
            Date.now(),


        tanggal:
            waktu.toLocaleDateString(
                "id-ID"
            ),


        waktu:
            waktu.toLocaleString(
                "id-ID"
            ),


        timestamp:
            Date.now(),


        nama:
            data.nama,


        namaPelanggan:
            data.nama,


        whatsapp:
            data.whatsapp,


        noWhatsapp:
            data.whatsapp,


        nomorWhatsApp:
            data.whatsapp,


        alamat:
            data.alamat,


        alamatPengantaran:
            data.alamat,


        catatan:
            data.catatan,


        catatanPesanan:
            data.catatan,


        items:
            buatDetailItemPesanan(),


        pesanan:
            buatDetailItemPesanan(),


        totalBelanja:
            totalBelanja,


        ongkir:
            ongkir,


        biayaKirim:
            ongkir,


        total:
            totalBayar,


        totalPembayaran:
            totalBayar,


        status:
            "baru",


        lokasi:
            lokasiPelanggan ?
            {

                latitude:
                    lokasiPelanggan.latitude,

                longitude:
                    lokasiPelanggan.longitude

            } :
            null,


        lokasiGPS:
            lokasiPelanggan ?
            {

                latitude:
                    lokasiPelanggan.latitude,

                longitude:
                    lokasiPelanggan.longitude

            } :
            null

    };


    daftarPesanan.push(
        pesananBaru
    );


    simpanSemuaPesanan(
        daftarPesanan
    );


    return pesananBaru;

}


/* =====================================================
   BUAT PESAN WHATSAPP
===================================================== */

function buatPesanWhatsApp() {

    const data =
        ambilDataPelanggan();


    let pesan = "";


    pesan +=
        "*PAYA RENGAS DELIVERY*\n";

    pesan +=
        "====================\n\n";


    pesan +=
        "*Data Pelanggan*\n";


    pesan +=
        "Nama: " +
        data.nama +
        "\n";


    pesan +=
        "No. WhatsApp: " +
        data.whatsapp +
        "\n\n";


    pesan +=
        "*Pesanan*\n";


    keranjang.forEach(

        function(item, index) {

            const subtotal =
                Number(item.harga) *
                Number(item.jumlah);


            pesan +=
                `${index + 1}. ${item.nama} x${item.jumlah} = ${rupiah(subtotal)}\n`;

        }

    );


    const totalBelanja =
        hitungTotalBelanja();


    const ongkir =
        hitungOngkir();


    const totalBayar =
        hitungTotalPembayaran();


    pesan += "\n";


    pesan +=
        "*Ringkasan Pembayaran*\n";


    pesan +=
        "Total Belanja: " +
        rupiah(totalBelanja) +
        "\n";


    pesan +=
        "Ongkos Kirim: " +
        rupiah(ongkir) +
        "\n";


    pesan +=
        "Total Pembayaran: " +
        rupiah(totalBayar) +
        "\n\n";


    pesan +=
        "*Alamat Pengantaran*\n";


    pesan +=
        data.alamat +
        "\n";


    if (data.catatan) {

        pesan += "\n";


        pesan +=
            "*Catatan Pesanan*\n";


        pesan +=
            data.catatan +
            "\n";

    }


    if (lokasiPelanggan) {

        pesan += "\n";


        pesan +=
            "*Lokasi GPS*\n";


        pesan +=
            `https://www.google.com/maps?q=${lokasiPelanggan.latitude},${lokasiPelanggan.longitude}\n`;

    }


    pesan += "\n";


    pesan +=
        "Terima kasih sudah berbelanja di Paya Rengas Delivery.";


    return pesan;

}


/* =====================================================
   BUAT PESAN KERANJANG
===================================================== */

function buatPesanKeranjang() {

    let pesan =
        "PAYA RENGAS DELIVERY\n\n";


    pesan +=
        "Pesanan:\n";


    keranjang.forEach(

        function(item) {

            const subtotal =
                Number(item.harga) *
                Number(item.jumlah);


            pesan +=
                `${item.nama} x${item.jumlah} = ${rupiah(subtotal)}\n`;

        }

    );


    pesan += "\n";


    pesan +=
        "Total Belanja: " +
        rupiah(
            hitungTotalBelanja()
        ) +
        "\n";


    pesan +=
        "Ongkos Kirim: " +
        rupiah(
            hitungOngkir()
        ) +
        "\n";


    pesan +=
        "Total Pembayaran: " +
        rupiah(
            hitungTotalPembayaran()
        );


    if (lokasiPelanggan) {

        pesan += "\n\n";


        pesan +=
            "Lokasi: " +
            `https://www.google.com/maps?q=${lokasiPelanggan.latitude},${lokasiPelanggan.longitude}`;

    }


    return pesan;

}


/* =====================================================
   KIRIM WA DARI KERANJANG
===================================================== */

function kirimWA() {

    if (keranjang.length === 0) {

        alert(
            "Keranjang masih kosong."
        );

        return;

    }


    const pesan =
        buatPesanKeranjang();


    const url =
        "https://wa.me/" +
        NOMOR_WA +
        "?text=" +
        encodeURIComponent(pesan);


    window.open(
        url,
        "_blank"
    );

}


/* =====================================================
   KONFIRMASI & PESAN SEKARANG
===================================================== */

function konfirmasiPesan() {

    /* VALIDASI */

    if (!validasiCheckout()) {

        return;

    }


    /*
       SIMPAN PESANAN TERLEBIH DAHULU
       AGAR MASUK KE ADMIN
    */

    const pesananBaru =
        simpanPesananKeAdmin();


    if (!pesananBaru) {

        alert(
            "Pesanan gagal disimpan."
        );

        return;

    }


    /* BUAT PESAN WA */

    const pesan =
        buatPesanWhatsApp();


    const url =
        "https://wa.me/" +
        NOMOR_WA +
        "?text=" +
        encodeURIComponent(pesan);


    /*
       BUKA WHATSAPP
    */

    window.open(
        url,
        "_blank"
    );


    /*
       KOSONGKAN KERANJANG
    */

    keranjang = [];


    simpanKeranjang();


    tampilkanKeranjang();


    /*
       PESAN BERHASIL
    */

    alert(
        "Pesanan berhasil dibuat dan sudah masuk ke Admin Paya Rengas Delivery."
    );

}


/* =====================================================
   FUNGSI ALTERNATIF TOMBOL CHECKOUT
===================================================== */

function konfirmasiDanPesan() {

    konfirmasiPesan();

}


function pesanSekarang() {

    konfirmasiPesan();

}


function checkoutPesanan() {

    konfirmasiPesan();

}


/* =====================================================
   UPDATE CHECKOUT
===================================================== */

function isiDataCheckout() {

    updateCheckout();

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {

    return String(text ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   EVENT SAAT HALAMAN SELESAI DIMUAT
===================================================== */

document.addEventListener(

    "DOMContentLoaded",

    function() {

        /* MUAT KERANJANG */

        tampilkanKeranjang();


        /* MUAT GPS */

        muatLokasi();


        /* UPDATE CHECKOUT */

        updateCheckout();


        /* TOMBOL KONFIRMASI */

        const tombolCheckout =
            document.getElementById(
                "btnKonfirmasi"
            );


        if (tombolCheckout) {

            tombolCheckout.onclick =
                konfirmasiPesan;

        }


        const tombolKonfirmasi =
            document.getElementById(
                "konfirmasiPesan"
            );


        if (tombolKonfirmasi) {

            tombolKonfirmasi.onclick =
                konfirmasiPesan;

        }


        const tombolPesan =
            document.getElementById(
                "btnPesanSekarang"
            );


        if (tombolPesan) {

            tombolPesan.onclick =
                konfirmasiPesan;

        }

    }

);


/* =====================================================
   SELESAI
===================================================== */