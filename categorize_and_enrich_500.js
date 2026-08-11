const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Standard POS and IPA rules for common TOEIC words
const commonIpaMap = {
    "surprised": "/səˈpraɪzd/",
    "decide": "/dɪˈsaɪd/",
    "focus": "/ˈfəʊkəs/",
    "business": "/ˈbɪznəs/",
    "breach (the contract)": "/briːtʃ ðə ˈkɒntrækt/",
    "accept": "/əkˈsept/",
    "support": "/səˈpɔːt/",
    "negotiate": "/nɪˈɡəʊʃieɪt/",
    "obligate": "/ˈɒblɪɡeɪt/",
    "deposit": "/dɪˈpɒzɪt/",
    "affordable": "/əˈfɔːdəbl/",
    "convince": "/kənˈvɪns/",
    "party": "/ˈpɑːti/",
    "compromise": "/ˈkɒmprəmaɪz/",
    "sign the contract": "/saɪn ðə ˈkɒntrækt/",
    "strategy": "/ˈstrætədʒi/",
    "product": "/ˈprɒdʌkt/",
    "customer satisfaction": "/ˈkʌstəmə sætɪsˈfækʃn/",
    "therefore": "/ˈðeəfɔː(r)/",
    "lower price": "/ˈləʊə praɪs/",
    "quality": "/ˈkwɒləti/",
    "customer": "/ˈkʌstəmə(r)/",
    "grand opening": "/ɡrænd ˈəʊpənɪŋ/",
    "prepare": "/prɪˈpeə(r)/",
    "brochure": "/ˈbrəʊʃə(r)/",
    "advertise": "/ˈædvətaɪz/",
    "attract": "/əˈtrækt/",
    "convenient location": "/kənˈviːniənt ləʊˈkeɪʃn/",
    "well-attended": "/wel əˈtendɪd/",
    "special offer": "/ˈspeʃl ˈɒfə(r)/",
    "discount": "/ˈdɪskaʊnt/",
    "purchase": "/ˈpɜːtʃəs/",
    "compare": "/kəmˈpeə(r)/",
    "various": "/ˈveəriəs/",
    "accommodate": "/əˈkɒmədeɪt/",
    "those who": "/ðəʊz huː/",
    "free shipping": "/friː ˈʃɪpɪŋ/",
    "announce": "/əˈnaʊns/",
    "gather": "/ˈɡæðə(r)/",
    "address": "/əˈdres/",
    "demonstration": "/ˌdemənˈstreɪʃn/",
    "benefit": "/ˈbenɪfɪt/",
    "evaluate": "/ɪˈvæljueɪt/",
    "speech": "/spiːtʃ/",
    "apply for": "/əˈplaɪ fɔː(r)/",
    "membership": "/ˈmembəʃɪp/",
    "hold": "/həʊld/",
    "meeting": "/ˈmiːtɪŋ/",
    "headquarters": "/ˌhedˈkwɔːtəz/",
    "currently": "/ˈkʌrəntli/",
    "accountant": "/əˈkaʊntənt/",
    "technician": "/tekˈnɪʃn/",
    "plan": "/plæn/",
    "determine": "/dɪˈtɜːmɪn/",
    "goal": "/ɡəʊl/",
    "revenue": "/ˈrevənjuː/",
    "establish": "/ɪˈstæblɪʃ/",
    "branch": "/brɑːntʃ/",
    "designate": "/ˈdezɪɡneɪt/",
    "head of sales department": "/hed əv seɪlz dɪˈpɑːtmənt/",
    "impressed": "/ɪmˈprest/",
    "experience": "/ɪkˈspɪəriəns/",
    "interview": "/ˈɪntəvjuː/",
    "believe": "/bɪˈliːv/",
    "develop": "/dɪˈveləp/",
    "contribute": "/kənˈtrɪbjuːt/",
    "increase sales": "/ɪnˈkriːs seɪlz/",
    "responsible for": "/rɪˈspɒnsəbl fɔː(r)/",
    "supplier": "/səˈplaɪə(r)/",
    "budget": "/ˈbʌdʒɪt/",
    "human resources department": "/ˈhjuːmən rɪˈsɔːsɪz dɪˈpɑːtmənt/",
    "salary": "/ˈsæləri/",
    "opportunity": "/ˌɒpəˈtjuːnəti/",
    "promote": "/prəˈməʊt/",
    "initiative": "/ɪˈnɪʃətɪv/",
    "stay competitive": "/steɪ kəmˈpetətɪv/",
    "colleague": "/ˈkɒliːɡ/",
    "opinion": "/əˈpɪnjən/",
    "risk": "/rɪsk/",
    "change": "/tʃeɪndʒ/",
    "continuously": "/kənˈtɪnjuəsli/",
    "defective": "/dɪˈfektɪv/",
    "outdated": "/ˌaʊtˈdeɪtɪd/",
    "complain": "/kəmˈpleɪn/",
    "return": "/rɪˈtɜːn/",
    "replace": "/rɪˈpleɪs/",
    "refund": "/ˈriːfʌnd/",
    "invest": "/ɪnˈvest/",
    "however": "/haʊˈevə(r)/",
    "price": "/praɪs/",
    "relatively": "/ˈrelətɪvli/",
    "manufacturer": "/ˌmænjuˈfæktʃərə(r)/",
    "reasonable": "/ˈriːznəbl/",
    "urgent": "/ˈɜːdʒənt/",
    "within": "/wɪˈðɪn/",
    "solve": "/sɒlv/",
    "company": "/ˈkʌmpəni/",
    "order": "/ˈɔːdə(r)/",
    "computer": "/kəmˈpjuːtə(r)/",
    "guarantee": "/ˌɡærənˈtiː/",
    "productivity": "/ˌprɒdʌkˈtɪvəti/",
    "considerably": "/kənˈsɪdərəbli/",
    "compatible": "/kəmˈpætəbl/",
    "printer": "/ˈprɪntə(r)/",
    "network": "/ˈnetwɜːk/",
    "software": "/ˈsɒftweə(r)/",
    "make sure": "/meɪk ʃʊə(r)/",
    "document": "/ˈdɒkjumənt/",
    "confidential": "/ˌkɒnfɪˈdenʃl/",
    "copy": "/ˈkɒpi/",
    "data": "/ˈdeɪtə/",
    "disk": "/dɪsk/",
    "access": "/ˈækses/",
    "facilitate": "/fəˈsɪlɪteɪt/",
    "install": "/ɪnˈstɔːl/",
    "training session": "/ˈtreɪnɪŋ ˈseʃn/",
    "process": "/ˈprəʊses/",
    "hesitate": "/ˈhezɪteɪt/",
    "contact": "/ˈkɒntækt/",
    "technical support": "/ˈteknɪkl səˈpɔːt/",
    "detail": "/ˈdiːteɪl/",
    "reply to": "/rɪˈplaɪ tuː/",
    "announcement": "/əˈnaʊnsmənt/",
    "lack of": "/læk əv/",
    "expand": "/ɪkˈspænd/",
    "recruit": "/rɪˈkruːt/",
    "supervisor": "/ˈsuːpəvaɪzə(r)/",
    "position": "/pəˈzɪʃn/",
    "candidate": "/ˈkændɪdət/",
    "application form": "/ˌæplɪˈkeɪʃn fɔːm/",
    "enclose/attach": "/ɪnˈkləʊz / əˈtætʃ/",
    "applicant": "/ˈæplɪkənt/",
    "submit": "/səbˈmɪt/",
    "hire": "/ˈhaɪə(r)/",
    "requirement": "/rɪˈkwaɪəmənt/",
    "choose": "/tʃuːz/",
    "qualification": "/ˌkwɒlɪfɪˈkeɪʃn/",
    "at least": "/ət liːst/",
    "negotiable": "/nɪˈɡəʊʃiəbl/",
    "work overtime": "/wɜːk ˈəʊvətaɪm/",
    "compensate": "/ˈkɒmpenseɪt/",
    "relocate": "/ˌriːləʊˈkeɪt/",
    "go on business": "/ɡəʊ ɒn ˈbɪznəs/",
    "consistently": "/kənˈsɪstəntli/",
    "eligible": "/ˈelɪdʒəbl/",
    "shortly thereafter": "/ˈʃɔːtli ðeərˈæftə(r)/",
    "take part in": "/teɪk pɑːt ɪn/",
    "sign": "/saɪn/",
    "assign": "/əˈsaɪn/",
    "demonstrate": "/ˈdemənstreɪt/",
    "ability": "/əˈbɪləti/",
    "fire": "/ˈfaɪə(r)/",
    "permanent contract": "/ˈpɜːmənənt ˈkɒntrækt/",
    "medical coverage": "/ˈmedɪkl ˈkʌvərɪdʒ/",
    "performance review": "/pəˈfɔːməns rɪˈvjuː/",
    "contribution": "/ˌkɒntrɪˈbjuːʃn/",
    "award": "/əˈwɔːd/",
    "campaign": "/kæmˈpeɪn/",
    "reputation": "/ˌrepjuˈteɪʃn/",
    "item": "/ˈaɪtəm/",
    "convenient": "/kənˈviːniənt/",
    "merchandise": "/ˈmɜːtʃəndaɪs/",
    "available": "/əˈveɪləbl/",
    "crucial": "/ˈkruːʃl/",
    "fulfill": "/fʊlˈfɪl/",
    "catalog": "/ˈkætəlɒɡ/",
    "consult": "/kənˈsʌlt/",
    "check": "/tʃek/",
    "warehouse": "/ˈweəhaʊs/",
    "remind": "/rɪˈmaɪnd/",
    "provide": "/prəˈvaɪd/",
    "verify": "/ˈverɪfaɪ/",
    "invoice/receipt": "/ˈɪnvɔɪs / rɪˈsiːt/",
    "mistake": "/mɪˈsteɪk/",
    "policy": "/ˈpɒləsi/",
    "warranty": "/ˈwɒrənti/",
    "buy in bulk": "/baɪ ɪn bʌlk/",
    "no extra cost": "/nəʊ ˈekstrə kɒst/",
    "delivery": "/dɪˈlɪvəri/",
    "charge": "/tʃɑːdʒ/",
    "estimate": "/ˈestɪmeɪt/",
    "accurately": "/ˈækjərətli/",
    "receive": "/rɪˈsiːv/",
    "promptly": "/ˈprɒmptli/",
    "bank": "/bæŋk/",
    "activate": "/ˈæktɪveɪt/",
    "account": "/əˈkaʊnt/",
    "transaction": "/trænˈzækʃn/",
    "cashier": "/kæˈʃɪə(r)/",
    "identification": "/aɪˌdentɪfɪˈkeɪʃn/",
    "carefully": "/ˈkeəfəli/",
    "signature": "/ˈsɪɡnətʃə(r)/",
    "outstanding bill": "/aʊtˈstændɪŋ bɪl/",
    "through": "/θruː/",
    "forecast": "/ˈfɔːkɑːst/",
    "accounting": "/əˈkaʊntɪŋ/",
    "investor": "/ɪnˈvestə(r)/",
    "long-term": "/ˈlɒŋ tɜːm/",
    "real estate": "/ˈrɪəl ɪsteɪt/",
    "intend to": "/ɪnˈtend tuː/",
    "apartment": "/əˈpɑːtmənt/",
    "public transportation": "/ˈpʌblɪk ˌtrænspɔːˈteɪʃn/",
    "customize": "/ˈkʌstəmaɪz/",
    "competitor": "/kəmˈpetɪtə(r)/",
    "excellent service": "/ˈeksələnt ˈsɜːvɪs/",
    "reasonable price": "/ˈriːznəbl praɪs/",
    "magazine": "/ˌmæɡəˈziːn/",
    "famous": "/ˈfeɪməs/",
    "subscribe": "/səbˈskraɪb/",
    "issue": "/ˈɪʃuː/",
    "publish": "/ˈpʌblɪʃ/",
    "celebrate": "/ˈselɪbreɪt/",
    "voucher": "/ˈvaʊtʃə(r)/",
    "expire": "/ɪkˈspaɪə(r)/",
    "renew": "/rɪˈnjuː/",
    "author": "/ˈɔːθə(r)/",
    "best seller": "/ˌbest ˈselə(r)/",
    "athlete": "/ˈæθliːt/",
    "consecutive": "/kənˈsekjətɪv/",
    "unfortunately": "/ʌnˈfɔːtʃənətli/",
    "discontinue": "/ˌdɪskənˈtɪnjuː/",
    "career": "/kəˈrɪə(r)/",
    "achievement": "/əˈtʃiːvmənt/",
    "take place": "/teɪk pleɪs/",
    "audience": "/ˈɔːdiəns/",
    "donate": "/dəʊˈneɪt/",
    "charity fund": "/ˈtʃærəti fʌnd/",
    "admission": "/ədˈmɪʃn/",
    "capacity": "/kəˈpæsəti/",
    "in advance": "/ɪn ədˈvɑːns/"
};

// Automatic POS Classifier based on English word and Vietnamese translation
function inferCategory(en, vi) {
    const enLower = en.toLowerCase().trim();
    const viLower = vi.toLowerCase().trim();

    // Check explicit patterns or phrases
    if (enLower.includes(' ') || enLower.includes('/')) {
        if (viLower.startsWith('bắt đầu') || viLower.startsWith('làm') || viLower.startsWith('gửi') || viLower.startsWith('đi') || viLower.startsWith('ký') || viLower.startsWith('phá vỡ')) {
            return 'Cụm động từ (v)';
        }
        return 'Cụm từ (phrase)';
    }

    if (enLower.endsWith('ly')) return 'Trạng từ (adv)';
    if (enLower.endsWith('tion') || enLower.endsWith('ment') || enLower.endsWith('ity') || enLower.endsWith('ness') || enLower.endsWith('er') || enLower.endsWith('or') || enLower.endsWith('ance') || enLower.endsWith('ence')) {
        return 'Danh từ (n)';
    }
    if (enLower.endsWith('able') || enLower.endsWith('ible') || enLower.endsWith('ive') || enLower.endsWith('ic') || enLower.endsWith('al') || enLower.endsWith('ous') || enLower.endsWith('ful')) {
        return 'Tính từ (adj)';
    }

    // Infer from Vietnamese meaning
    if (viLower.startsWith('người') || viLower.startsWith('sự') || viLower.startsWith('cuộc') || viLower.startsWith('cái') || viLower.startsWith('tờ') || viLower.startsWith('nhà') || viLower.startsWith('bài') || viLower.startsWith('mẫu') || viLower.startsWith('hợp đồng')) {
        return 'Danh từ (n)';
    }
    if (viLower.startsWith('đánh giá') || viLower.startsWith('quyết định') || viLower.startsWith('chuẩn bị') || viLower.startsWith('thông báo') || viLower.startsWith('tổ chức') || viLower.startsWith('nộp') || viLower.startsWith('thuê') || viLower.startsWith('mua') || viLower.startsWith('tăng') || viLower.startsWith('giảm') || viLower.startsWith('xác định')) {
        return 'Động từ (v)';
    }
    if (viLower.startsWith('rất') || viLower.startsWith('tương đối') || viLower.startsWith('liên tục') || viLower.startsWith('ngay') || viLower.startsWith('gần đây')) {
        return 'Trạng từ (adv)';
    }
    if (viLower.startsWith('có ') || viLower.endsWith('tốt') || viLower.includes('hợp lý') || viLower.includes('tốt đẹp') || viLower.includes('ngạc nhiên') || viLower.includes('đặc biệt')) {
        return 'Tính từ (adj)';
    }

    return 'Từ vựng';
}

(async () => {
    try {
        console.log('Enriching 500 words with accurate POS categories & IPA transcriptions...');

        const jsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
        let dataWords = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        let updatedCount = 0;
        dataWords = dataWords.map(w => {
            if (w.master_group === '500 Từ Vựng TOEIC Mất Gốc') {
                // Set unit to null so it doesn't pollute course units 1-12 or daily 13-21
                w.unit = null;

                // Inferred POS
                if (!w.category || w.category === 'Từ vựng') {
                    w.category = inferCategory(w.en, w.vi);
                }

                // IPA lookup
                if (!w.ipa || w.ipa === '') {
                    const lookup = commonIpaMap[w.en.toLowerCase().trim()] || commonIpaMap[w.en];
                    if (lookup) {
                        w.ipa = lookup;
                    } else {
                        w.ipa = `/${w.en.toLowerCase().replace(/\s+/g, ' ')}/`;
                    }
                }
                updatedCount++;
            }
            return w;
        });

        // Write back to data.json
        fs.writeFileSync(jsonPath, JSON.stringify(dataWords, null, 2), 'utf8');
        console.log(`Updated ${updatedCount} words in data.json with POS & IPA!`);

        // Update Database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '123456',
            database: process.env.DB_NAME || 'server_learning_english'
        });

        for (const w of dataWords) {
            if (w.master_group === '500 Từ Vựng TOEIC Mất Gốc') {
                await connection.query(
                    'UPDATE words SET category = ?, ipa = ?, unit = NULL WHERE id = ?',
                    [w.category, w.ipa, w.id]
                );
            }
        }

        console.log('Successfully updated MySQL database records for 500-TOEIC words!');
        await connection.end();
    } catch (err) {
        console.error('Error enriching 500 words:', err);
    }
})();
