/* =====================================================
   PAYA RENGAS DELIVERY
   SCRIPT.JS - V3 ONLINE SUPABASE
   ===================================================== */


/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://kktamroqhsheiiifffoo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_0SQdiECEZD6oNp-bjZcTyg_FJYHeJv8";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =====================================================
   PENGATURAN
===================================================== */

const NOMOR_WA = "6283851564958";

/*
   ID WARUNG
   Tadi abang sudah membuat data warung
   dengan kode/id 1.
*/
const WARUNG_ID = 1;


/* =====================================================
   LOCAL STORAGE
===================================================== */

const KEY_KERANJANG =
    "payaRengasKeranjang";

const KEY_LOKASI =
    "payaRengasLokasi";

const KEY_PESANAN =
    "payaRengasPesanan";


/* =====================================================
   DATA KERANJANG
===================================================== */

let keranjang =
    JSON.parse(
        localStorage.getItem(KEY_KERANJANG)
    ) || [];


let lokasiPelanggan = null;


/* =====================================================
   FORMAT RUPIAH
===================================================== */

function rupiah(angka) {

    return "Rp" +
        Number(angka || 0)
            .toLocaleString("id-ID");

}


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
   KURANG JUMLAH
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


    const pilihan =
        document.getElementById(
            "pilihanOngkir"
        );


    if (!pilihan) {
        return 5000;
    }


    const option =
        pilihan.options[
            pilihan.selectedIndex
        ];


    if (!option) {
        return 5000;
    }


    const ongkir =
        Number(
            option.getAttribute(
                "data-ongkir"
            )
        );


    if (Number.isNaN(ongkir)) {
        return 5000;
    }


    return ongkir;

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
        document.getElementById(
            "pesanan"
        );


    const totalElement =
        document.getElementById(
            "total"
        );


    if (!pesanan) {

        updateCheckout();

        return;

    }


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
                            type="button"
                            onclick="kurangJumlah(${index})">

                            −

                        </button>


                        <span>
                            ${item.jumlah}
                        </span>


                        <button
                            type="button"
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


    /*
       ID lama jika masih digunakan
    */

    const checkoutTotal =
        document.getElementById(
            "checkoutTotal"
        );


    if (checkoutTotal) {

        checkoutTotal.innerText =
            rupiah(totalBelanja);

    }


    const checkoutOngkir =
        document.getElementById(
            "checkoutOngkir"
        );


    if (checkoutOngkir) {

        checkoutOngkir.innerText =
            rupiah(ongkir);

    }


    const checkoutBayar =
        document.getElementById(
            "checkoutBayar"
        );


    if (checkoutBayar) {

        checkoutBayar.innerText =
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


    const statusCheckout =
        document.getElementById(
            "statusLokasiCheckout"
        );


    if (status) {

        status.innerHTML =
            "📍 Sedang mengambil lokasi...";

    }


    if (statusCheckout) {

        statusCheckout.innerHTML =
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


            const teks = `

                📍 Lokasi berhasil diambil.

                <br>

                <a
                    href="${linkGoogleMaps}"
                    target="_blank">

                    Lihat Lokasi di Google Maps

                </a>

            `;


            if (status) {

                status.innerHTML = teks;

            }


            if (statusCheckout) {

                statusCheckout.innerHTML =
                    teks;

            }


            alert(
                "Lokasi berhasil diambil."
            );

        },


        function(error) {

            console.log(
                "GPS Error:",
                error
            );


            if (status) {

                status.innerHTML =
                    "📍 Lokasi belum berhasil diambil.";

            }


            if (statusCheckout) {

                statusCheckout.innerHTML =
                    "📍 Lokasi belum berhasil diambil.";

            }


            alert(
                "Lokasi belum berhasil diambil. Pastikan izin lokasi diberikan."
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


        if (!lokasiPelanggan) {
            return;
        }


        const linkGoogleMaps =
            `https://www.google.com/maps?q=${lokasiPelanggan.latitude},${lokasiPelanggan.longitude}`;


        const teks = `

            📍 Lokasi tersimpan.

            <br>

            <a
                href="${linkGoogleMaps}"
                target="_blank">

                Lihat Lokasi

            </a>

        `;


        const status =
            document.getElementById(
                "statusLokasi"
            );


        const statusCheckout =
            document.getElementById(
                "statusLokasiCheckout"
            );


        if (status) {

            status.innerHTML = teks;

        }


        if (statusCheckout) {

            statusCheckout.innerHTML =
                teks;

        }

    }

    catch(error) {

        console.log(
            "Gagal memuat lokasi:",
            error
        );

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


    const pilihanOngkir =
        document.getElementById(
            "pilihanOngkir"
        );


    let pilihanPengantaran = "";


    if (pilihanOngkir) {

        pilihanPengantaran =
            pilihanOngkir.value;

    }


    return {

        nama:
            namaElement
                ? namaElement.value.trim()
                : "",


        whatsapp:
            waElement
                ? waElement.value.trim()
                : "",


        alamat:
            alamatElement
                ? alamatElement.value.trim()
                : "",


        catatan:
            catatanElement
                ? catatanElement.value.trim()
                : "",


        pilihanPengantaran:
            pilihanPengantaran

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


    if (!data.pilihanPengantaran) {

        alert(
            "Silakan pilih pengantaran."
        );


        const input =
            document.getElementById(
                "pilihanOngkir"
            );


        if (input) {
            input.focus();
        }


        return false;

    }


    return true;

}


/* =====================================================
   DETAIL ITEM
===================================================== */

function buatDetailItemPesanan() {

    return keranjang.map(

        function(item) {

            return {

                nama:
                    item.nama,

                harga:
                    Number(item.harga),

                jumlah:
                    Number(item.jumlah),

                subtotal:
                    Number(item.harga) *
                    Number(item.jumlah)

            };

        }

    );

}


/* =====================================================
   SIMPAN PESANAN LOKAL
   SEBAGAI BACKUP
===================================================== */

function simpanPesananLokal(pesanan) {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    KEY_PESANAN
                )
            ) || [];


        data.push(pesanan);


        localStorage.setItem(

            KEY_PESANAN,

            JSON.stringify(data)

        );

    }

    catch(error) {

        console.log(
            "Backup lokal gagal:",
            error
        );

    }

}


/* =====================================================
   CARI / BUAT PELANGGAN SUPABASE
===================================================== */

async function cariAtauBuatPelanggan(data) {

    /*
       Cari berdasarkan nomor WhatsApp
    */

    const hasilCari =
        await supabaseClient
            .from("pelanggan")
            .select("id")
            .eq("no_wa", data.whatsapp)
            .limit(1);


    if (
        hasilCari.error
    ) {

        throw new Error(
            "Gagal mencari pelanggan: " +
            hasilCari.error.message
        );

    }


    if (
        hasilCari.data &&
        hasilCari.data.length > 0
    ) {

        return hasilCari.data[0].id;

    }


    /*
       Kalau belum ada,
       buat pelanggan baru
    */

    const pelangganBaru =
        await supabaseClient
            .from("pelanggan")
            .insert({

                nama:
                    data.nama,

                no_wa:
                    data.whatsapp,

                alamat:
                    data.alamat,

                latitude:
                    lokasiPelanggan
                        ? lokasiPelanggan.latitude
                        : null,

                longitude:
                    lokasiPelanggan
                        ? lokasiPelanggan.longitude
                        : null

            })
            .select("id")
            .single();


    if (
        pelangganBaru.error
    ) {

        throw new Error(
            "Gagal menyimpan pelanggan: " +
            pelangganBaru.error.message
        );

    }


    return pelangganBaru.data.id;

}


/* =====================================================
   SIMPAN PESANAN KE SUPABASE
===================================================== */

async function simpanPesananKeSupabase() {

    const data =
        ambilDataPelanggan();


    const totalBelanja =
        hitungTotalBelanja();


    const ongkir =
        hitungOngkir();


    const totalPembayaran =
        hitungTotalPembayaran();


    /*
       1. Cari / buat pelanggan
    */

    const pelangganId =
        await cariAtauBuatPelanggan(data);


    /*
       2. Buat pesanan
    */

    const pesananData = {

        pelanggan_id:
            pelangganId,

        warung_id:
            WARUNG_ID,

        nama_pelanggan:
            data.nama,

        no_wa:
            data.whatsapp,

        "alamat pengantara":
            data.alamat,

        catatan:
            data.catatan,

        total_belanja:
            totalBelanja,

        ongkir:
            ongkir,

        total_pembayaran:
            totalPembayaran,

        status:
            "baru",

        metode_pembayaran:
            "WhatsApp",

        latitude:
            lokasiPelanggan
                ? lokasiPelanggan.latitude
                : null,

        longitude:
            lokasiPelanggan
                ? lokasiPelanggan.longitude
                : null

    };


    const hasil =
        await supabaseClient
            .from("pesanan")
            .insert(
                pesananData
            )
            .select()
            .single();


    if (hasil.error) {

        throw new Error(
            "Gagal menyimpan pesanan: " +
            hasil.error.message
        );

    }


    return hasil.data;

}


/* =====================================================
   PESAN WHATSAPP
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
        "*Pengantaran*\n";


    pesan +=
        data.pilihanPengantaran +
        "\n";


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
   KIRIM WA
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
   PESAN KERANJANG
===================================================== */

function buatPesanKeranjang() {

    let pesan =
        "*PAYA RENGAS DELIVERY*\n\n";


    pesan +=
        "*Pesanan:*\n";


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
            "Lokasi GPS: " +
            `https://www.google.com/maps?q=${lokasiPelanggan.latitude},${lokasiPelanggan.longitude}`;

    }


    return pesan;

}


/* =====================================================
   KONFIRMASI PESAN
===================================================== */

async function konfirmasiPesan() {

    /*
       VALIDASI
    */

    if (!validasiCheckout()) {
        return;
    }


    /*
       Tombol dibuat tidak aktif
       sementara proses berlangsung
    */

    const tombol =
        document.getElementById(
            "konfirmasiPesan"
        );


    if (tombol) {

        tombol.disabled = true;

        tombol.innerText =
            "⏳ Menyimpan Pesanan...";

    }


    try {

        /*
           SIMPAN KE SUPABASE
        */

        const pesanan =
            await simpanPesananKeSupabase();


        /*
           BACKUP LOKAL
        */

        const data =
            ambilDataPelanggan();


        simpanPesananLokal({

            id:
                pesanan.id,

            created_at:
                pesanan.created_at,

            nama:
                data.nama,

            whatsapp:
                data.whatsapp,

            alamat:
                data.alamat,

            catatan:
                data.catatan,

            items:
                buatDetailItemPesanan(),

            totalBelanja:
                hitungTotalBelanja(),

            ongkir:
                hitungOngkir(),

            totalPembayaran:
                hitungTotalPembayaran(),

            status:
                "baru"

        });


        /*
           BUAT WA
        */

        const pesan =
            buatPesanWhatsApp();


        const url =
            "https://wa.me/" +
            NOMOR_WA +
            "?text=" +
            encodeURIComponent(
                pesan
            );


        /*
           BUKA WA
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
           BERHASIL
        */

        alert(
            "✅ Pesanan berhasil disimpan ke Paya Rengas Delivery."
        );

    }

    catch(error) {

        console.error(
            "ERROR PESANAN:",
            error
        );


        alert(
            "❌ Pesanan belum berhasil disimpan ke server.\n\n" +
            error.message +
            "\n\nSilakan cek koneksi internet."
        );

    }

    finally {

        if (tombol) {

            tombol.disabled = false;

            tombol.innerText =
                "💬 Konfirmasi & Pesan Sekarang";

        }

    }

}


/* =====================================================
   ALTERNATIF TOMBOL
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
   EVENT HALAMAN
===================================================== */

document.addEventListener(

    "DOMContentLoaded",

    function() {

        /*
           TAMPILKAN KERANJANG
        */

        tampilkanKeranjang();


        /*
           MUAT GPS
        */

        muatLokasi();


        /*
           UPDATE CHECKOUT
        */

        updateCheckout();


        /*
           PERUBAHAN ONGKIR
        */

        const pilihanOngkir =
            document.getElementById(
                "pilihanOngkir"
            );


        if (pilihanOngkir) {

            pilihanOngkir.addEventListener(

                "change",

                function() {

                    updateCheckout();

                    tampilkanKeranjang();

                }

            );

        }


        /*
           TOMBOL KONFIRMASI
        */

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