const words = [
    { en: 'overhead', vi: 'Ở trên đầu', ipa: '/ˌoʊvərˈhed/', category: 'Tính từ', example_en: 'Overhead bin.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'compartment', vi: 'Ngăn chứa', ipa: '/kəmˈpɑːrtmənt/', category: 'Danh từ', example_en: 'Glove compartment. / Overhead compartment.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'virtually', vi: 'Hầu như / Gần như', ipa: '/ˈvɜːrtʃuəli/', category: 'Trạng từ', example_en: 'Virtually impossible.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'fulfill', vi: 'Hoàn thành / Đáp ứng', ipa: '/fʊlˈfɪl/', category: 'Động từ', example_en: 'Fulfill a request.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'assure', vi: 'Cam đoan / Đảm bảo', ipa: '/əˈʃʊr/', category: 'Động từ', example_en: 'I assure you.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'remain', vi: 'Vẫn / Còn lại', ipa: '/rɪˈmeɪn/', category: 'Động từ', example_en: 'Remain seated.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'showcase', vi: 'Trưng bày / Tủ trưng bày', ipa: '/ˈʃoʊkeɪs/', category: 'Danh từ / Động từ', example_en: 'Showcase new products.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'talented', vi: 'Có tài', ipa: '/ˈtæləntɪd/', category: 'Tính từ', example_en: 'Talented artist.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'enter', vi: 'Đi vào / Nhập (dữ liệu)', ipa: '/ˈentər/', category: 'Động từ', example_en: 'Enter the room.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'trend', vi: 'Xu hướng', ipa: '/trend/', category: 'Danh từ', example_en: 'Fashion trend.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'informal', vi: 'Thân mật / Không trang trọng', ipa: '/ɪnˈfɔːrml/', category: 'Tính từ', example_en: 'Informal meeting.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'inappropriate', vi: 'Không phù hợp', ipa: '/ˌɪnəˈproʊpriət/', category: 'Tính từ', example_en: 'Inappropriate behavior.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'recipient', vi: 'Người nhận', ipa: '/rɪˈsɪpiənt/', category: 'Danh từ', example_en: 'Award recipient.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'tow', vi: 'Kéo đi', ipa: '/toʊ/', category: 'Động từ', example_en: 'The truck is towing the car.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'proceeds', vi: 'Tiền thu được/Lợi nhuận', ipa: '/ˈproʊsiːdz/', category: 'Danh từ', example_en: 'Charity proceeds.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'hands-on', vi: 'Thực tế / Tận tay', ipa: '/ˌhændz ˈɑːn/', category: 'Tính từ', example_en: 'Hands-on experience.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' },
    { en: 'drawing', vi: 'Bốc thăm trúng thưởng', ipa: '/ˈdrɔːɪŋ/', category: 'Danh từ', example_en: 'Raffle drawing.', master_group: 'Từ Vựng ETS 2026', sub_group: 'Từ vựng Test 10 LC' }
];

async function insertWords() {
    for (const word of words) {
        try {
            const res = await fetch('http://localhost:5000/api/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(word)
            });
            if (res.ok) {
                console.log('Inserted:', word.en);
            } else {
                console.error('Failed:', word.en, await res.text());
            }
        } catch (err) {
            console.error('Error:', word.en, err.message);
        }
    }
}

insertWords();
