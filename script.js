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
let selectedWarungId =
    Number(localStorage.getItem("payaRengasWarungTerpilih") || 0);

let warungMitraList = [];

let produkMitraList = [];


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

function tambahKeranjang(nama, harga, warungId) {

    const idWarung = Number(warungId || selectedWarungId || 0);


    if (!idWarung) {

        alert("Silakan pilih Warung Mitra terlebih dahulu.");

        return;

    }


    const warungDiKeranjang =
        keranjang.length
            ? Number(keranjang[0].warung_id || 0)
            : 0;


    if (
        warungDiKeranjang &&
        warungDiKeranjang !== idWarung
    ) {

        alert(
            "Keranjang hanya dapat berisi produk dari satu Warung Mitra. Silakan kosongkan keranjang terlebih dahulu."
        );

        return;

    }


    const produk =
        keranjang.find(
            item =>
                item.nama === nama &&
                Number(item.warung_id || 0) === idWarung
        );


    if (produk) {

        produk.jumlah++;

    } else {

        keranjang.push({

            nama: nama,

            harga: Number(harga),

            jumlah: 1,

            warung_id: idWarung

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

                warung_id:
                    Number(item.warung_id || selectedWarungId || 0),

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
            Number(keranjang[0]?.warung_id || selectedWarungId || 0),

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


    const warungPesanan =
        warungMitraList.find(
            item => Number(item.id) === Number(keranjang[0]?.warung_id || selectedWarungId || 0)
        );

    if (warungPesanan) {

        pesan +=
            "*Warung Mitra:* " +
            warungPesanan.nama +
            "\n\n";

    }


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

            warung_id:
                Number(keranjang[0]?.warung_id || selectedWarungId || 0),

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
   WARUNG MITRA + PRODUK SUPABASE
===================================================== */

function gambarProdukURL(gambar) {

    const nilai = String(gambar || "").trim();

    if (!nilai) {
        return "images/banner.jpg";
    }

    if (
        nilai.startsWith("data:") ||
        nilai.startsWith("http://") ||
        nilai.startsWith("https://") ||
        nilai.startsWith("/") ||
        nilai.startsWith("./")
    ) {
        return nilai;
    }

    if (nilai.startsWith("images/")) {
        return nilai;
    }

    return "images/" + nilai;

}


function bintangProduk(rating) {

    const nilai = Math.min(
        5,
        Math.max(1, Number(rating || 5))
    );

    return "⭐".repeat(nilai) + "☆".repeat(5 - nilai);

}


async function muatWarungMitra() {

    const select =
        document.getElementById("pilihWarungMitra");

    const info =
        document.getElementById("infoWarungMitra");


    if (!select) {
        return;
    }


    try {

        const hasil =
            await supabaseClient
                .from("warung")
                .select("id,nama,alamat,status,latitude,longitude")
                .order("nama", { ascending: true });


        if (hasil.error) {
            throw new Error(hasil.error.message);
        }


        warungMitraList =
            (hasil.data || []).filter(
                warung =>
                    String(warung.status || "Aktif").toLowerCase() !== "nonaktif"
            );


        select.innerHTML =
            '<option value="">-- Pilih Warung Mitra --</option>';


        warungMitraList.forEach(function(warung) {

            const option =
                document.createElement("option");

            option.value =
                warung.id;

            option.textContent =
                warung.nama +
                (warung.alamat ? " — " + warung.alamat : "");

            select.appendChild(option);

        });


        if (!warungMitraList.length) {

            select.innerHTML =
                '<option value="">Belum ada Warung Mitra</option>';

            if (info) {
                info.textContent =
                    "Tambahkan Warung Mitra melalui Admin terlebih dahulu.";
            }

            renderProdukMitra([]);
            return;

        }


        let warungIdAwal =
            Number(selectedWarungId || 0);


        const adaDiDaftar =
            warungMitraList.some(
                warung => Number(warung.id) === warungIdAwal
            );


        if (!adaDiDaftar) {
            warungIdAwal =
                Number(
                    keranjang[0]?.warung_id ||
                    warungMitraList[0].id
                );
        }


        selectedWarungId = warungIdAwal;

        localStorage.setItem(
            "payaRengasWarungTerpilih",
            String(selectedWarungId)
        );

        select.value =
            String(selectedWarungId);


        tampilkanInfoWarung();

        await muatProdukMitra();

    } catch (error) {

        console.error(
            "ERROR LOAD WARUNG MITRA:",
            error
        );

        select.innerHTML =
            '<option value="">❌ Gagal memuat Warung Mitra</option>';

        const status =
            document.getElementById("statusMenuSupabase");

        if (status) {
            status.textContent =
                "❌ Gagal memuat Warung Mitra: " + error.message;
        }

    }

}


function tampilkanInfoWarung() {

    const info =
        document.getElementById("infoWarungMitra");

    const warung =
        warungMitraList.find(
            item => Number(item.id) === Number(selectedWarungId)
        );


    if (!info || !warung) {
        return;
    }


    info.innerHTML =
        "🏪 <strong>" +
        escapeHTML(warung.nama) +
        "</strong>" +
        (warung.alamat ? " — " + escapeHTML(warung.alamat) : "");

}


async function pilihWarungMitra(id) {

    const idBaru = Number(id || 0);


    if (!idBaru) {
        return;
    }


    const warungDiKeranjang =
        keranjang.length
            ? Number(keranjang[0].warung_id || 0)
            : 0;


    if (
        warungDiKeranjang &&
        warungDiKeranjang !== idBaru
    ) {

        const yakin =
            confirm(
                "Keranjang berisi produk dari Warung Mitra lain. Ganti warung dan kosongkan keranjang?"
            );

        if (!yakin) {

            const select =
                document.getElementById("pilihWarungMitra");

            if (select) {
                select.value = String(selectedWarungId);
            }

            return;

        }


        keranjang = [];
        simpanKeranjang();
        tampilkanKeranjang();

    }


    selectedWarungId = idBaru;

    localStorage.setItem(
        "payaRengasWarungTerpilih",
        String(selectedWarungId)
    );

    tampilkanInfoWarung();

    await muatProdukMitra();

}


async function muatProdukMitra() {

    const container =
        document.getElementById("daftarProdukSupabase");

    const status =
        document.getElementById("statusMenuSupabase");


    if (!container || !selectedWarungId) {
        return;
    }


    container.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:30px;">⏳ Memuat produk...</div>';


    try {

        const hasil =
            await supabaseClient
                .from("produk")
                .select("id,warung_id,nama,kategori,harga,deskripsi,gambar,status")
                .eq("warung_id", selectedWarungId)
                .order("id", { ascending: true });


        if (hasil.error) {
            throw new Error(hasil.error.message);
        }


        produkMitraList =
            (hasil.data || []).filter(
                produk =>
                    String(produk.status || "tersedia").toLowerCase() !== "habis"
            );


        renderProdukMitra(produkMitraList);


        if (status) {
            status.textContent =
                produkMitraList.length
                    ? "✅ " + produkMitraList.length + " produk tersedia di Warung Mitra ini."
                    : "ℹ️ Belum ada produk tersedia di Warung Mitra ini.";
        }

    } catch (error) {

        console.error(
            "ERROR LOAD PRODUK MITRA:",
            error
        );

        produkMitraList = [];

        renderProdukMitra([]);

        if (status) {
            status.textContent =
                "❌ Gagal memuat produk: " + error.message;
        }

    }

}


function renderProdukMitra(products) {

    const container =
        document.getElementById("daftarProdukSupabase");

    if (!container) {
        return;
    }


    if (!products.length) {

        container.innerHTML = `

            <div style="grid-column:1/-1;text-align:center;padding:35px;">

                <div style="font-size:42px;">🍽️</div>

                <h3>Belum ada produk</h3>

                <p>Produk Warung Mitra ini akan tampil di sini setelah ditambahkan dari Admin.</p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        products.map(function(product) {

            const nama =
                escapeHTML(product.nama || "Produk");

            const kategori =
                String(product.kategori || "");

            const deskripsi =
                escapeHTML(product.deskripsi || "");

            const harga =
                Number(product.harga || 0);

            const gambar =
                gambarProdukURL(product.gambar);

            const rating =
                Number(product.rating || 5);


            return `

                <div class="card" data-kategori="${escapeHTML(kategori)}" data-nama="${escapeHTML(product.nama || "")}">

                    <img
                        src="${gambar}"
                        alt="${nama}"
                        onerror="this.src='images/banner.jpg'">

                    <h3>${nama}</h3>

                    <p>${deskripsi}</p>

                    <div class="rating">
                        ${bintangProduk(rating)}
                    </div>

                    <h4>
                        ${rupiah(harga)}
                    </h4>

                    <button
                        type="button"
                        onclick="tambahProdukMitra(${Number(product.id)})">

                        🛒 Pesan

                    </button>

                </div>

            `;

        })
        .join("");

}


function tambahProdukMitra(id) {

    const product =
        produkMitraList.find(
            item => Number(item.id) === Number(id)
        );

    if (!product) {
        return;
    }

    tambahKeranjang(
        product.nama || "Produk",
        Number(product.harga || 0),
        Number(product.warung_id || selectedWarungId || 0)
    );

}


function filterProdukMitra() {

    const keyword =
        (
            document.getElementById("search")?.value || ""
        ).toLowerCase().trim();


    const kategoriAktif =
        document.querySelector(".kategori-btn.active")?.dataset.kategori || "semua";


    const hasil =
        produkMitraList.filter(function(product) {

            const nama =
                String(product.nama || "").toLowerCase();

            const deskripsi =
                String(product.deskripsi || "").toLowerCase();

            const kategori =
                String(product.kategori || "").toLowerCase();

            const cocokCari =
                !keyword ||
                nama.includes(keyword) ||
                deskripsi.includes(keyword);

            const cocokKategori =
                kategoriAktif === "semua" ||
                (kategoriAktif === "promo"
                    ? kategori.includes("promo")
                    : kategori === kategoriAktif);

            return cocokCari && cocokKategori;

        });


    renderProdukMitra(hasil);

}


/* =====================================================
   EVENT HALAMAN
===================================================== */

document.addEventListener(

    "DOMContentLoaded",

    async function() {

        /*
           TAMPILKAN KERANJANG
        */

        tampilkanKeranjang();


        /*
           MUAT WARUNG + PRODUK DARI SUPABASE
        */

        await muatWarungMitra();


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


        const pilihWarung =
            document.getElementById("pilihWarungMitra");

        if (pilihWarung) {
            pilihWarung.addEventListener(
                "change",
                function() {
                    pilihWarungMitra(this.value);
                }
            );
        }


        const searchInput =
            document.getElementById("search");

        if (searchInput) {
            searchInput.addEventListener(
                "input",
                filterProdukMitra
            );
        }


        document
            .querySelectorAll(".kategori-btn")
            .forEach(function(button) {

                const teks =
                    button.textContent.toLowerCase();

                if (teks.includes("makanan")) {
                    button.dataset.kategori = "makanan";
                } else if (teks.includes("minuman")) {
                    button.dataset.kategori = "minuman";
                } else if (teks.includes("snack")) {
                    button.dataset.kategori = "snack";
                } else if (teks.includes("promo")) {
                    button.dataset.kategori = "promo";
                } else {
                    button.dataset.kategori = "semua";
                }

                button.addEventListener(
                    "click",
                    function() {

                        document
                            .querySelectorAll(".kategori-btn")
                            .forEach(function(item) {
                                item.classList.remove("active");
                            });

                        button.classList.add("active");

                        filterProdukMitra();
                    }
                );

            });

    }

);

/* =====================================================
   TAMBAH WARUNG SUPABASE
===================================================== */

async function tambahWarung() {

    const nama =
        document.getElementById("namaWarung").value.trim();

    const alamat =
        document.getElementById("alamatWarung").value.trim();

    const noWa =
        document.getElementById("noWaWarung").value.trim();

    if (!nama) {
        alert("Silakan isi nama warung.");
        return;
    }

    if (!alamat) {
        alert("Silakan isi alamat warung.");
        return;
    }

    try {

        const hasil =
            await supabaseClient
                .from("warung")
                .insert({
                    nama: nama,
                    alamat: alamat,
                    no_wa: noWa || null
                })
                .select()
                .single();

        if (hasil.error) {
            throw new Error(hasil.error.message);
        }

        document.getElementById("hasilWarung").innerHTML =
            "✅ Warung berhasil disimpan. ID Warung: " +
            hasil.data.id;

        document.getElementById("namaWarung").value = "";
        document.getElementById("alamatWarung").value = "";
        document.getElementById("noWaWarung").value = "";

        alert("✅ Warung berhasil disimpan ke Supabase.");

    } catch (error) {

        console.error("ERROR TAMBAH WARUNG:", error);

        alert(
            "❌ Gagal menyimpan warung:\n\n" +
            error.message
        );

    }

}
/* =====================================================
   SELESAI
===================================================== */
