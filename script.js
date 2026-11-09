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

// Halaman pelanggan tidak memerlukan sesi login Supabase.
// Isolasi dari sesi Admin agar permintaan data publik tetap memakai
// publishable/anon key dan tidak mewarisi sesi authenticated di browser.
const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
                storageKey: "paya-rengas-pelanggan-public-auth"
            }
        }
    );


/* =====================================================
   PENGATURAN
===================================================== */

const NOMOR_WA = "6283870471254";

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
   ATURAN ONGKIR BERDASARKAN JARAK
===================================================== */

const MAKS_JARAK_PESANAN_KM = 15;

function hitungJarakKm(lat1, lon1, lat2, lon2) {
    const toRad = nilai => Number(nilai) * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(Number(lat2) - Number(lat1));
    const dLon = toRad(Number(lon2) - Number(lon1));
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(Number(lat1))) *
        Math.cos(toRad(Number(lat2))) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function getWarungTerpilih() {
    return warungMitraList.find(
        item => Number(item.id) === Number(keranjang[0]?.warung_id || selectedWarungId || 0)
    ) || null;
}

function hitungJarakPelangganKeWarung() {
    const warung = getWarungTerpilih();
    if (!warung || !lokasiPelanggan) return null;
    const latWarung = Number(warung.latitude);
    const lonWarung = Number(warung.longitude);
    const latPelanggan = Number(lokasiPelanggan.latitude);
    const lonPelanggan = Number(lokasiPelanggan.longitude);
    if (
        !Number.isFinite(latWarung) || !Number.isFinite(lonWarung) ||
        !Number.isFinite(latPelanggan) || !Number.isFinite(lonPelanggan)
    ) return null;
    return hitungJarakKm(latWarung, lonWarung, latPelanggan, lonPelanggan);
}

/* =====================================================
   ONGKIR DARI PENGATURAN ADMIN / SUPABASE
===================================================== */
let pengaturanOngkirPelanggan = null;

async function muatPengaturanOngkirPelanggan() {
    try {
        const hasil = await supabaseClient
            .from("pengaturan_ongkir")
            .select("tarif_0_05,tarif_05_15,tarif_15_25,tarif_25_35,tarif_35_45,tarif_45_55,tarif_55_65,tambahan_diatas_65,aktif")
            .eq("aktif", true)
            .order("id", { ascending: false })
            .limit(1);

        if (hasil.error) throw new Error(hasil.error.message);

        pengaturanOngkirPelanggan = hasil.data?.[0] || null;

        if (!pengaturanOngkirPelanggan) {
            console.warn("Pengaturan ongkir aktif belum tersedia di Supabase.");
        }

        return pengaturanOngkirPelanggan;
    } catch (error) {
        console.error("GAGAL MEMUAT PENGATURAN ONGKIR:", error);
        pengaturanOngkirPelanggan = null;
        return null;
    }
}

function tentukanOngkirDariJarak(jarakKm) {
    if (!Number.isFinite(Number(jarakKm))) return null;

    const jarak = Number(jarakKm);
    if (jarak < 0) return null;

    const o = pengaturanOngkirPelanggan;
    if (!o) return null;

    if (jarak <= 0.5) return Number(o.tarif_0_05 || 0);
    if (jarak <= 1.5) return Number(o.tarif_05_15 || 0);
    if (jarak <= 2.5) return Number(o.tarif_15_25 || 0);
    if (jarak <= 3.5) return Number(o.tarif_25_35 || 0);
    if (jarak <= 4.5) return Number(o.tarif_35_45 || 0);
    if (jarak <= 5.5) return Number(o.tarif_45_55 || 0);
    if (jarak <= 6.5) return Number(o.tarif_55_65 || 0);

    const tambahanPerKm = Number(o.tambahan_diatas_65 || 0);
    if (tambahanPerKm <= 0) return null;

    return tambahanPerKm * Math.ceil(jarak - 6.5);
}

function formatJarakKm(jarakKm) {
    if (!Number.isFinite(Number(jarakKm))) return "-";
    return Number(jarakKm).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " km";
}

function updateInfoJarakOngkir() {
    const info = document.getElementById("infoJarakOngkir");
    if (!info) return;
    if (!keranjang.length) {
        info.innerHTML = "🛒 Tambahkan produk ke keranjang untuk menghitung ongkir.";
        return;
    }
    const warung = getWarungTerpilih();
    if (!warung) {
        info.innerHTML = "🏪 Silakan pilih Warung Mitra terlebih dahulu.";
        return;
    }
    const latWarung = Number(warung.latitude);
    const lonWarung = Number(warung.longitude);
    if (!Number.isFinite(latWarung) || !Number.isFinite(lonWarung)) {
        info.innerHTML = "⚠️ Lokasi GPS Warung Mitra belum tersedia. Admin harus mengambil dan menyimpan lokasi GPS warung terlebih dahulu.";
        return;
    }
    if (!lokasiPelanggan) {
        info.innerHTML = "📍 Tekan <strong>Ambil Lokasi Saya</strong> untuk menghitung jarak dan ongkir otomatis.";
        return;
    }
    const jarakKm = hitungJarakPelangganKeWarung();
    const ongkir = tentukanOngkirDariJarak(jarakKm);
    if (jarakKm === null || ongkir === null) {
        const jarakTampil = jarakKm === null ? "-" : formatJarakKm(jarakKm);
        info.innerHTML = "❌ Jarak pengantaran <strong>" + jarakTampil + "</strong>. Pesanan tidak dapat diterima karena jarak lebih dari 15 km.";
        return;
    }
    info.innerHTML = "📏 Jarak Warung → Pelanggan: <strong>" + formatJarakKm(jarakKm) + "</strong><br>🚚 Ongkos Kirim: <strong>" + rupiah(ongkir) + "</strong><br>✅ Pengantaran tersedia.";
}



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

    const warungAktif = warungMitraList.find(
        item => Number(item.id) === idWarung
    );

    if (!warungAktif ||
        String(warungAktif.status || "Aktif").toLowerCase() === "nonaktif" ||
        warungAktif.buka === false) {
        alert("🏪 Warung ini sedang tutup atau nonaktif. Silakan pilih Warung Mitra lain.");
        return;
    }


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
    if (keranjang.length === 0) return 0;
    const ongkir = tentukanOngkirDariJarak(hitungJarakPelangganKeWarung());
    return ongkir === null ? 0 : ongkir;
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


            updateInfoJarakOngkir();
            updateCheckout();
            tampilkanKeranjang();

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

        updateInfoJarakOngkir();
        updateCheckout();

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


    const pilihanPengantaran =
        "Antar otomatis berdasarkan jarak";


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


    if (!lokasiPelanggan) {

        alert(
            "📍 Silakan ambil Lokasi Saya terlebih dahulu agar jarak dan ongkir dapat dihitung."
        );

        return false;

    }


    const warung = getWarungTerpilih();

    if (!warung) {

        alert(
            "Silakan pilih Warung Mitra terlebih dahulu."
        );

        return false;

    }


    const jarakKm = hitungJarakPelangganKeWarung();

    if (jarakKm === null) {

        alert(
            "⚠️ Lokasi GPS Warung Mitra belum tersedia. Pesanan belum dapat diproses."
        );

        return false;

    }


    if (jarakKm > MAKS_JARAK_PESANAN_KM) {

        alert(
            "❌ Pesanan tidak dapat diterima. Jarak pengantaran " +
            formatJarakKm(jarakKm) +
            " dan batas maksimal pengantaran adalah 15 km."
        );

        return false;

    }


    if (tentukanOngkirDariJarak(jarakKm) === null) {

        alert(
            "❌ Ongkir belum dapat ditentukan untuk jarak tersebut."
        );

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


    const jarakKm =
        hitungJarakPelangganKeWarung();


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

        items:
            buatDetailItemPesanan(),

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

        jarak_km:
            Number(jarakKm),

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


    const jarakKm =
        hitungJarakPelangganKeWarung();


    if (jarakKm !== null) {

        pesan +=
            "Jarak: " +
            formatJarakKm(jarakKm) +
            "\n";

    }


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

    const warungSekarang = getWarungTerpilih();
    if (!warungSekarang ||
        String(warungSekarang.status || "Aktif").toLowerCase() === "nonaktif" ||
        warungSekarang.buka === false) {
        alert("🏪 Warung yang dipilih sedang tutup atau nonaktif. Silakan pilih Warung Mitra lain.");
        return;
    }

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

            jarakKm:
                hitungJarakPelangganKeWarung(),

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
    const select = document.getElementById("pilihWarungMitra");
    const grid = document.getElementById("daftarWarungMitra");
    const info = document.getElementById("infoWarungMitra");
    if (!grid) return;

    try {
        const hasil = await supabaseClient.from("warung")
            .select("id,nama,alamat,status,buka,latitude,longitude,foto_url")
            .order("nama", { ascending: true });
        if (hasil.error) throw new Error(hasil.error.message);

        warungMitraList = (hasil.data || []).filter(w =>
            String(w.status || "Aktif").toLowerCase() !== "nonaktif"
        );

        if (select) {
            select.innerHTML = '<option value="">-- Pilih Warung --</option>';
            warungMitraList.forEach(w => {
                const option = document.createElement("option");
                option.value = w.id;
                option.textContent = w.nama || "Warung";
                select.appendChild(option);
            });
        }

        renderKartuWarungMitra(warungMitraList);

        if (!warungMitraList.length) {
            if (info) info.textContent = "Belum ada warung aktif. Silakan tambahkan warung melalui dashboard admin.";
            renderProdukMitra([]);
            return;
        }

        let warungIdAwal = Number(selectedWarungId || keranjang[0]?.warung_id || 0);
        const valid = warungMitraList.some(w => Number(w.id) === warungIdAwal);
        if (!valid) warungIdAwal = 0;

        if (warungIdAwal) {
            selectedWarungId = warungIdAwal;
            if (select) select.value = String(selectedWarungId);
            tampilkanInfoWarung();
            tandaiWarungTerpilih();
            await muatProdukMitra();
        } else {
            selectedWarungId = 0;
            if (info) info.textContent = "Pilih salah satu warung untuk melihat menu.";
            renderProdukMitra([]);
        }

        const search = document.getElementById("pintarCariWarung");
        if (search && !search.dataset.bound) {
            search.dataset.bound = "1";
            search.addEventListener("input", () => {
                const q = search.value.trim().toLowerCase();
                renderKartuWarungMitra(warungMitraList.filter(w =>
                    String(w.nama || "").toLowerCase().includes(q) ||
                    String(w.alamat || "").toLowerCase().includes(q)
                ));
            });
        }
    } catch (error) {
        console.error("ERROR LOAD WARUNG MITRA:", error);
        grid.innerHTML = '<div class="pintar-warung-empty">Gagal memuat warung. Coba muat ulang halaman.</div>';
        const status = document.getElementById("statusMenuSupabase");
        if (status) status.textContent = "Gagal memuat warung: " + error.message;
    }
}

function renderKartuWarungMitra(warungs) {
    const grid = document.getElementById("daftarWarungMitra");
    if (!grid) return;
    if (!warungs.length) {
        grid.innerHTML = '<div class="pintar-warung-empty">Warung tidak ditemukan.</div>';
        return;
    }
    grid.innerHTML = warungs.map(w => {
        const isOpen = w.buka !== false;
        const selected = Number(w.id) === Number(selectedWarungId);
        const name = escapeHTML(w.nama || "Warung Mitra");
        const address = escapeHTML(w.alamat || "Warung mitra PINTAR");
        const fotoUrl = String(w.foto_url || "").trim();
        const gambarWarung = fotoUrl
            ? `<img src="${escapeHTML(fotoUrl)}" alt="Foto ${name}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex';"><span class="pintar-food-emoji" style="display:none;">🍲</span>`
            : `<span class="pintar-food-emoji">🍲</span>`;
        return `<button type="button" class="pintar-warung-card ${selected ? "is-selected" : ""}"
            onclick="pilihWarungMitra(${Number(w.id)})" aria-label="Pilih ${name}">
            <div class="pintar-warung-art">${gambarWarung}</div>
            <div class="pintar-warung-copy">
              <div class="pintar-warung-name">${name}</div>
              <div class="pintar-warung-address">${address}</div>
              <span class="pintar-warung-status ${isOpen ? "" : "closed"}">${isOpen ? "● BUKA" : "● TUTUP"}</span>
            </div>
        </button>`;
    }).join("");
}

function tandaiWarungTerpilih() {
    document.querySelectorAll(".pintar-warung-card").forEach(card => {
        card.classList.toggle("is-selected",
            Number((card.getAttribute("onclick") || "").match(/\d+/)?.[0]) === Number(selectedWarungId));
    });
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
        (warung.alamat ? " — " + escapeHTML(warung.alamat) : "") +
        (warung.buka === false ? " — ⚪ Tutup" : " — 🟡 Buka");

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

            tandaiWarungTerpilih();
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

    const select = document.getElementById("pilihWarungMitra");
    if (select) select.value = String(selectedWarungId);
    tampilkanInfoWarung();
    tandaiWarungTerpilih();

    await muatProdukMitra();
    updateInfoJarakOngkir();
    updateCheckout();

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
           STARTUP CEPAT:
           Dashboard dan event dipasang segera. Data Supabase serta GPS
           berjalan paralel agar tampilan tidak menunggu jaringan.
        */

        tampilkanKeranjang();
        updateInfoJarakOngkir();
        updateCheckout();

        // Ambil pengaturan ongkir dan warung secara bersamaan, tanpa await.
        // Kedua fungsi memiliki penanganan error masing-masing.
        void Promise.allSettled([
            muatPengaturanOngkirPelanggan(),
            muatWarungMitra()
        ]).then(() => {
            updateInfoJarakOngkir();
            updateCheckout();
        });

        // GPS tidak boleh menahan dashboard atau pemuatan warung.
        try {
            muatLokasi();
        } catch (error) {
            console.warn("GPS belum dapat dimuat:", error);
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


/* PINTAR OJEK MAP: Leaflet + OpenStreetMap */
let petaOjek=null, markerJemputOjek=null, markerTujuanOjek=null, garisRuteOjek=null;
function siapkanPetaOjek(){
 const el=document.getElementById('pintarOjekMap'); if(!el||!window.L)return;
 if(!petaOjek){petaOjek=L.map(el).setView([3.8,98.3],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(petaOjek);}
 setTimeout(()=>petaOjek.invalidateSize(),250);
 if(koordinatJemputOjek){if(markerJemputOjek)petaOjek.removeLayer(markerJemputOjek);markerJemputOjek=L.marker([koordinatJemputOjek.lat,koordinatJemputOjek.lng]).addTo(petaOjek).bindPopup('Lokasi jemput');petaOjek.setView([koordinatJemputOjek.lat,koordinatJemputOjek.lng],15);}
 if(koordinatTujuanOjek){if(markerTujuanOjek)petaOjek.removeLayer(markerTujuanOjek);markerTujuanOjek=L.marker([koordinatTujuanOjek.lat,koordinatTujuanOjek.lng]).addTo(petaOjek).bindPopup('Lokasi tujuan');}
}
function gambarRuteOjek(coords){if(!window.L||!petaOjek||!coords)return;if(garisRuteOjek)petaOjek.removeLayer(garisRuteOjek);garisRuteOjek=L.geoJSON({type:'LineString',coordinates:coords},{style:{color:'#1677d2',weight:5}}).addTo(petaOjek);petaOjek.fitBounds(garisRuteOjek.getBounds(),{padding:[25,25]});}
/* PINTAR OJEK — MAPS, GPS & JARAK RUTE JALAN */
let jenisLayananOjekAktif=null, tarifOjekPelanggan=null;
let koordinatJemputOjek=null, koordinatTujuanOjek=null, jarakRuteOjekKm=null, tarifHitungOjek=null;

async function muatTarifOjekPelanggan(){
  try{const {data,error}=await supabaseClient.from('pengaturan_tarif_ojek').select('*').eq('aktif',true).order('id',{ascending:false}).limit(1).maybeSingle();if(error)throw error;tarifOjekPelanggan=data;return data;}
  catch(e){console.error('Tarif Ojek:',e);tarifOjekPelanggan=null;return null;}
}
function bukaFormOjek(jenis){
  jenisLayananOjekAktif=jenis;koordinatJemputOjek=null;koordinatTujuanOjek=null;jarakRuteOjekKm=null;tarifHitungOjek=null;
  const form=document.getElementById('formOjekPintar');if(form)form.style.display='block';
  const food=document.querySelector('.menu');if(food)food.style.display='none';setTimeout(siapkanPetaOjek,100);
  const barang=jenis==='ojek_barang';
  document.getElementById('judulFormOjek').textContent=barang?'📦 Pesan Ojek Antar Barang':'🛵 Pesan Ojek Penumpang';
  document.getElementById('labelDetailOjek').style.display=barang?'block':'none';
  document.getElementById('btnKirimOjek').textContent=barang?'Pesan Antar Barang':'Pesan Ojek Penumpang';
  document.getElementById('ojekJemput').value='';document.getElementById('ojekTujuan').value='';
  document.getElementById('ojekJarak').textContent='Jarak dan tarif akan dihitung otomatis setelah tujuan dipilih.';
  document.getElementById('ojekTarifInfo').textContent='Tarif akan muncul otomatis setelah alamat tujuan dipilih.';
  document.getElementById('hasilCariTujuanOjek').innerHTML='';
  document.getElementById('ojekPesanStatus').textContent='Mengambil lokasi GPS dan memuat tarif...';
  muatTarifOjekPelanggan().then(()=>{if(!tarifOjekPelanggan)document.getElementById('ojekPesanStatus').textContent='Tarif belum dapat dimuat. Hubungi Admin.';});
  form.scrollIntoView({behavior:'smooth',block:'start'});
  ambilLokasiJemputOjek();
}
function tutupFormOjek(){document.getElementById('formOjekPintar').style.display='none';const food=document.querySelector('.menu');if(food)food.style.display='';}
function setJemputOjek(lat,lng,label){
  koordinatJemputOjek={lat:Number(lat),lng:Number(lng)};setTimeout(siapkanPetaOjek,50);
  document.getElementById('ojekJemput').value=label||`Titik jemput (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
  hitungRuteDanTarifOjek();
}
function ambilLokasiJemputOjek(){
  const status=document.getElementById('ojekPesanStatus');
  if(!navigator.geolocation){status.textContent='Browser tidak mendukung GPS.';return;}
  status.textContent='Meminta izin lokasi GPS...';
  navigator.geolocation.getCurrentPosition(async pos=>{
    setJemputOjek(pos.coords.latitude,pos.coords.longitude,`Lokasi saya (${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)})`);
    status.textContent='Lokasi jemput GPS berhasil diambil. Sekarang ketik alamat tujuan.';
    await hitungRuteDanTarifOjek();
  },err=>{status.textContent='GPS tidak berhasil: '+(err.code===1?'izin lokasi ditolak':err.code===2?'posisi tidak tersedia':'waktu mendapatkan lokasi habis')+'. Izinkan lokasi pada browser lalu coba lagi.';},{enableHighAccuracy:true,timeout:20000,maximumAge:30000});
}
async function cariTujuanOjek(){
  const input=document.getElementById('ojekTujuan');
  const out=document.getElementById('hasilCariTujuanOjek');
  const q=input.value.trim();
  if(q.length<3){out.textContent='Ketik minimal 3 karakter alamat atau nama tempat.';return;}
  out.textContent='Mencari alamat di Kabupaten Langkat...';

  // Batas wilayah perkiraan Kabupaten Langkat: hasil Langkat diprioritaskan,
  // tetapi pencarian tidak dikunci agar tempat di perbatasan tetap dapat ditemukan.
  const viewbox='97.20,4.35,98.75,3.20';
  const base='https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&countrycodes=id&viewbox='+viewbox;

  async function cari(query){
    const response=await fetch(base+'&q='+encodeURIComponent(query),{
      headers:{'Accept':'application/json'}
    });
    if(!response.ok) throw new Error('Layanan pencarian alamat sedang tidak tersedia');
    return await response.json();
  }

  try{
    // Cari dengan konteks Langkat dahulu, lalu cari teks asli dengan bias peta Langkat.
    const batches=await Promise.all([
      cari(q+', Kabupaten Langkat, Sumatera Utara, Indonesia'),
      cari(q+', Langkat, Sumatera Utara, Indonesia'),
      cari(q)
    ]);

    const semua=[];
    const seen=new Set();
    for(const batch of batches){
      for(const item of batch){
        const key=item.place_id || `${item.lat},${item.lon}`;
        if(!seen.has(key)){seen.add(key);semua.push(item);}
      }
    }

    if(!semua.length){
      out.textContent='Alamat belum ditemukan. Coba nama tempat terdekat, nama desa/kecamatan, atau pilih titik tujuan pada peta.';
      return;
    }

    // Hasil yang menyebut Langkat didahulukan; hasil lain tetap ditampilkan
    // agar tujuan dekat perbatasan Kabupaten Langkat tidak hilang.
    semua.sort((a,b)=>{
      const aLangkat=/langkat/i.test(a.display_name||'')?1:0;
      const bLangkat=/langkat/i.test(b.display_name||'')?1:0;
      return bLangkat-aLangkat;
    });

    out.innerHTML='';
    semua.slice(0,10).forEach(item=>{
      const button=document.createElement('button');
      button.type='button';
      button.textContent=item.display_name;
      button.style='display:block;width:100%;text-align:left;padding:10px;margin:5px 0;border:1px solid #ddd;border-radius:8px;background:white;cursor:pointer;white-space:normal';
      button.onclick=()=>setTujuanOjek(Number(item.lat),Number(item.lon),item.display_name);
      out.appendChild(button);
    });
  }catch(error){
    console.error('Pencarian tujuan Ojek:',error);
    out.textContent=(error.message||'Pencarian alamat gagal')+'. Coba lagi atau pilih titik tujuan pada peta.';
  }
}
function setTujuanOjek(lat,lng,label){
  koordinatTujuanOjek={lat:Number(lat),lng:Number(lng)};setTimeout(siapkanPetaOjek,50);
  document.getElementById('ojekTujuan').value=label||`Tujuan (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
  hitungRuteDanTarifOjek();
}
async function hitungRuteDanTarifOjek(){
  const dist=document.getElementById('ojekJarak'),info=document.getElementById('ojekTarifInfo');
  if(!koordinatJemputOjek||!koordinatTujuanOjek){jarakRuteOjekKm=null;tarifHitungOjek=null;return;}
  dist.textContent='Menghitung jarak rute jalan...';info.textContent='Menghitung tarif...';
  try{
    const a=koordinatJemputOjek,b=koordinatTujuanOjek;
    const url=`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const response=await fetch(url);if(!response.ok)throw new Error('Layanan rute tidak merespons');
    const result=await response.json();if(result.code!=='Ok'||!result.routes?.length)throw new Error('Rute jalan tidak ditemukan');
    const route=result.routes[0];jarakRuteOjekKm=route.distance/1000;if(route.geometry&&route.geometry.coordinates)gambarRuteOjek(route.geometry.coordinates);
    dist.textContent=`Jarak rute jalan: ${jarakRuteOjekKm.toFixed(2)} km · Perkiraan waktu: ${Math.round(route.duration/60)} menit`;
    hitungTarifDariJarakRuteOjek();
  }catch(e){jarakRuteOjekKm=null;tarifHitungOjek=null;dist.textContent='Rute jalan gagal dihitung. Coba pilih titik tujuan lain atau ulangi.';info.textContent='Tarif belum dapat ditentukan tanpa jarak rute.';console.error('OSRM route:',e);}
}
function hitungTarifDariJarakRuteOjek(){
  const info=document.getElementById('ojekTarifInfo'),km=jarakRuteOjekKm;
  if(!tarifOjekPelanggan||!Number.isFinite(km)){info.textContent='Tarif atau jarak rute belum tersedia.';return null;}
  if(km>100){info.textContent='Jarak di atas 100 km belum dilayani pada tahap uji coba.';return null;}
  const p=jenisLayananOjekAktif==='ojek_barang'?'barang':'penumpang';
  const band=km<=.5?'0_05':km<=1.5?'05_15':km<=2.5?'15_25':km<=3.5?'25_35':km<=4.5?'35_45':km<=5.5?'45_55':'55_65';
  let fare=Number(tarifOjekPelanggan[`${p}_tarif_${band}`]);
  if(km>6.5)fare+=Math.ceil(km-6.5)*Number(tarifOjekPelanggan[`${p}_tambahan_diatas_65`]);
  if(!Number.isFinite(fare)||fare<=0){info.textContent='Tarif untuk jarak ini belum diatur Admin.';return null;}
  tarifHitungOjek=fare;info.textContent=`Tarif ${p==='barang'?'Ojek Barang':'Ojek Penumpang'}: Rp${fare.toLocaleString('id-ID')} (berdasarkan ${km.toFixed(2)} km rute jalan)`;return fare;
}
function hitungTarifOjekPelanggan(){return hitungTarifDariJarakRuteOjek();}
async function konfirmasiPesananOjek(){
  const btn=document.getElementById('btnKirimOjek'),status=document.getElementById('ojekPesanStatus');
  const nama=document.getElementById('ojekNama').value.trim(),wa=document.getElementById('ojekWa').value.trim();
  const jemput=document.getElementById('ojekJemput').value.trim(),tujuan=document.getElementById('ojekTujuan').value.trim();
  const detail=document.getElementById('ojekDetailBarang').value.trim(),catatan=document.getElementById('ojekCatatan').value.trim();
  const tarif=hitungTarifDariJarakRuteOjek(),barang=jenisLayananOjekAktif==='ojek_barang';
  if(!nama||!wa||!jemput||!tujuan||!koordinatJemputOjek||!koordinatTujuanOjek||!jarakRuteOjekKm||!tarif){alert('Lengkapi data dan pastikan GPS serta rute jalan berhasil dihitung.');return;}
  if(barang&&!detail){alert('Isi keterangan barang.');return;}
  btn.disabled=true;btn.textContent='Menyimpan pesanan...';
  try{
    const payload={pelanggan_id:null,warung_id:null,items:[],nama_pelanggan:nama,no_wa:wa,"alamat pengantara":tujuan,catatan,total_belanja:0,ongkir:tarif,jarak_km:Number(jarakRuteOjekKm.toFixed(3)),total_pembayaran:tarif,status:'baru',metode_pembayaran:'WhatsApp',latitude:koordinatJemputOjek.lat,longitude:koordinatJemputOjek.lng,jenis_layanan:jenisLayananOjekAktif,lokasi_jemput:jemput,lokasi_tujuan:tujuan,detail_barang:barang?detail:null,tarif_ojek:tarif,tujuan_latitude:koordinatTujuanOjek.lat,tujuan_longitude:koordinatTujuanOjek.lng};
    const {data:order,error}=await supabaseClient.from('pesanan').insert(payload).select('id,created_at').single();if(error)throw error;
    status.textContent=`Pesanan #${order.id} berhasil masuk. Menghubungi Admin...`;
    const txt=`PESANAN ${barang?'OJEK ANTAR BARANG':'OJEK PENUMPANG'} PINTAR\nNomor: #${order.id}\nNama: ${nama}\nWA: ${wa}\nJemput: ${jemput}\nTujuan: ${tujuan}\nJarak rute jalan: ${jarakRuteOjekKm.toFixed(2)} km\nTarif: Rp${tarif.toLocaleString('id-ID')}\n${barang?'Barang: '+detail+'\n':''}Catatan: ${catatan||'-'}`;
    window.open(`https://wa.me/${NOMOR_WA}?text=${encodeURIComponent(txt)}`,'_blank');btn.textContent='Pesanan terkirim';
  }catch(e){console.error(e);status.textContent='Gagal menyimpan pesanan: '+(e.message||e);alert('Pesanan belum tersimpan: '+(e.message||e));btn.disabled=false;btn.textContent=barang?'Pesan Antar Barang':'Pesan Ojek Penumpang';}
}

// PINTAR OJEK: expose click handlers globally (GitHub Pages classic script).
window.bukaFormOjek = bukaFormOjek;
window.tutupFormOjek = tutupFormOjek;
window.hitungTarifOjekPelanggan = hitungTarifOjekPelanggan;
window.konfirmasiPesananOjek = konfirmasiPesananOjek;
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.pr-service-ojek').forEach(function(card){
    card.addEventListener('click', function(){
      const kind = card.querySelector('h3')?.textContent.includes('Barang') ? 'ojek_barang' : 'ojek_penumpang';
      window.bukaFormOjek(kind);
    });
  });
});

window.ambilLokasiJemputOjek=ambilLokasiJemputOjek;window.cariTujuanOjek=cariTujuanOjek;

window.setJemputOjek=setJemputOjek;
