// bphs.js
const bphsData = {
    'karaka': {
        title: "Bhav Karak (House Significators)",
        html: `<table class="bphs-table">
            <tr><th>Bhava (House)</th><th>Primary Karaka(s)</th><th>Core Significations</th></tr>
            <tr><td>1st (Lagna)</td><td>Surya (Sun)</td><td>Self, Vitality, Body, Soul</td></tr>
            <tr><td>2nd</td><td>Guru (Jupiter)</td><td>Wealth, Speech, Family, Food</td></tr>
            <tr><td>3rd</td><td>Mangal (Mars)</td><td>Courage, Siblings, Effort, Valor</td></tr>
            <tr><td>4th</td><td>Chandra (Moon), Budh (Mercury)</td><td>Mother, Mind, Home, Vehicles, Education</td></tr>
            <tr><td>5th</td><td>Guru (Jupiter)</td><td>Children, Intellect, Mantra, Past Punya</td></tr>
            <tr><td>6th</td><td>Mangal (Mars), Shani (Saturn)</td><td>Diseases, Debts, Enemies, Service</td></tr>
            <tr><td>7th</td><td>Shukra (Venus)</td><td>Spouse, Partnerships, Desires</td></tr>
            <tr><td>8th</td><td>Shani (Saturn)</td><td>Longevity, Occult, Sudden Changes</td></tr>
            <tr><td>9th</td><td>Guru (Jupiter), Surya (Sun)</td><td>Dharma, Father, Guru, Luck</td></tr>
            <tr><td>10th</td><td>Surya, Budh, Guru, Shani</td><td>Karma, Profession, Status, Authority</td></tr>
            <tr><td>11th</td><td>Guru (Jupiter)</td><td>Gains, Elder Siblings, Desires Fulfilled</td></tr>
            <tr><td>12th</td><td>Shani (Saturn), Ketu</td><td>Losses, Moksha, Foreign Lands, Isolation</td></tr>
        </table>`
    },
    'swami': {
        title: "Rashi Swami (Sign Lords)",
        html: `<table class="bphs-table">
            <tr><th>Rashi (Sign)</th><th>Number</th><th>Swami (Lord)</th></tr>
            <tr><td>Aries (Mesh)</td><td>1</td><td>Mangal (Mars)</td></tr>
            <tr><td>Taurus (Vrish)</td><td>2</td><td>Shukra (Venus)</td></tr>
            <tr><td>Gemini (Mithun)</td><td>3</td><td>Budh (Mercury)</td></tr>
            <tr><td>Cancer (Karka)</td><td>4</td><td>Chandra (Moon)</td></tr>
            <tr><td>Leo (Simha)</td><td>5</td><td>Surya (Sun)</td></tr>
            <tr><td>Virgo (Kanya)</td><td>6</td><td>Budh (Mercury)</td></tr>
            <tr><td>Libra (Tula)</td><td>7</td><td>Shukra (Venus)</td></tr>
            <tr><td>Scorpio (Vrishchik)</td><td>8</td><td>Mangal (Mars) / Ketu</td></tr>
            <tr><td>Sagittarius (Dhanu)</td><td>9</td><td>Guru (Jupiter)</td></tr>
            <tr><td>Capricorn (Makar)</td><td>10</td><td>Shani (Saturn)</td></tr>
            <tr><td>Aquarius (Kumbha)</td><td>11</td><td>Shani (Saturn) / Rahu</td></tr>
            <tr><td>Pisces (Meen)</td><td>12</td><td>Guru (Jupiter)</td></tr>
        </table>`
    },
    'combustion': {
        title: "Combustion (Asta) Orbs from Surya",
        html: `<table class="bphs-table">
            <tr><th>Graha</th><th>Direct Combustion Orb</th><th>Retrograde (Vakri) Orb</th></tr>
            <tr><td>Chandra</td><td>12°</td><td>-</td></tr>
            <tr><td>Mangal</td><td>17°</td><td>17°</td></tr>
            <tr><td>Budh</td><td>14°</td><td>12°</td></tr>
            <tr><td>Guru</td><td>11°</td><td>11°</td></tr>
            <tr><td>Shukra</td><td>10°</td><td>8°</td></tr>
            <tr><td>Shani</td><td>15°</td><td>15°</td></tr>
        </table>`
    },
    'dignity': {
        title: "Ucha (Exaltation) & Neecha (Debilitation)",
        html: `<table class="bphs-table">
            <tr><th>Graha</th><th>Ucha Rashi (Exact Degree)</th><th>Neecha Rashi (Exact Degree)</th></tr>
            <tr><td>Surya</td><td>Aries (10°)</td><td>Libra (10°)</td></tr>
            <tr><td>Chandra</td><td>Taurus (3°)</td><td>Scorpio (3°)</td></tr>
            <tr><td>Mangal</td><td>Capricorn (28°)</td><td>Cancer (28°)</td></tr>
            <tr><td>Budh</td><td>Virgo (15°)</td><td>Pisces (15°)</td></tr>
            <tr><td>Guru</td><td>Cancer (5°)</td><td>Capricorn (5°)</td></tr>
            <tr><td>Shukra</td><td>Pisces (27°)</td><td>Virgo (27°)</td></tr>
            <tr><td>Shani</td><td>Libra (20°)</td><td>Aries (20°)</td></tr>
            <tr><td>Rahu</td><td>Taurus / Gemini</td><td>Scorpio / Sagittarius</td></tr>
            <tr><td>Ketu</td><td>Scorpio / Sagittarius</td><td>Taurus / Gemini</td></tr>
        </table>`
    },
    'mooltrikona': {
        title: "Mooltrikona (Root Trine) Positions",
        html: `<table class="bphs-table">
            <tr><th>Graha</th><th>Mooltrikona Rashi</th><th>Degree Range</th></tr>
            <tr><td>Surya</td><td>Leo</td><td>0° to 20°</td></tr>
            <tr><td>Chandra</td><td>Taurus</td><td>4° to 20°</td></tr>
            <tr><td>Mangal</td><td>Aries</td><td>0° to 12°</td></tr>
            <tr><td>Budh</td><td>Virgo</td><td>16° to 20°</td></tr>
            <tr><td>Guru</td><td>Sagittarius</td><td>0° to 10°</td></tr>
            <tr><td>Shukra</td><td>Libra</td><td>0° to 15°</td></tr>
            <tr><td>Shani</td><td>Aquarius</td><td>0° to 20°</td></tr>
        </table>`
    },
    'drishti': {
        title: "Graha Drishti (Aspects)",
        html: `<table class="bphs-table">
            <tr><th>Graha</th><th>Normal Drishti</th><th>Special Drishti</th></tr>
            <tr><td>Surya, Chandra, Budh, Shukra</td><td>7th House</td><td>-</td></tr>
            <tr><td>Mangal</td><td>7th House</td><td>4th & 8th House</td></tr>
            <tr><td>Guru</td><td>7th House</td><td>5th & 9th House</td></tr>
            <tr><td>Shani</td><td>7th House</td><td>3rd & 10th House</td></tr>
            <tr><td>Rahu / Ketu</td><td>7th House</td><td>5th & 9th House</td></tr>
        </table>`
    },
    'digbala': {
        title: "Digbala (Directional Strength)",
        html: `<table class="bphs-table">
            <tr><th>Direction</th><th>Bhava (House)</th><th>Grahas with Digbala (Maximum Power)</th><th>Zero Digbala House</th></tr>
            <tr><td>East</td><td>1st House (Lagna)</td><td>Guru, Budh</td><td>7th House</td></tr>
            <tr><td>North</td><td>4th House (Nadir)</td><td>Chandra, Shukra</td><td>10th House</td></tr>
            <tr><td>West</td><td>7th House (Descendant)</td><td>Shani</td><td>1st House</td></tr>
            <tr><td>South</td><td>10th House (Zenith)</td><td>Surya, Mangal</td><td>4th House</td></tr>
        </table>`
    },
    'awastha': {
        title: "Awastha (Planetary Age/State) by Sign",
        html: `<table class="bphs-table matrix-table" style="font-size:12px;">
            <tr><th style="width: 120px;">Rashi (Sign)</th><th>0° to 6°</th><th>6° to 12°</th><th>12° to 18°</th><th>18° to 24°</th><th>24° to 30°</th></tr>
            <tr><th style="color:#ef4444;">1. Aries (Odd)</th><td>Bala 👶</td><td>Kumara 👦</td><td>Yuva 👨</td><td>Vriddha 👴</td><td>Mrita 💀</td></tr>
            <tr><th style="color:#fbcfe8;">2. Taurus (Even)</th><td>Mrita 💀</td><td>Vriddha 👴</td><td>Yuva 👨</td><td>Kumara 👦</td><td>Bala 👶</td></tr>
            <tr><th style="color:#10b981;">3. Gemini (Odd)</th><td>Bala 👶</td><td>Kumara 👦</td><td>Yuva 👨</td><td>Vriddha 👴</td><td>Mrita 💀</td></tr>
            <tr><th style="color:#f8fafc;">4. Cancer (Even)</th><td>Mrita 💀</td><td>Vriddha 👴</td><td>Yuva 👨</td><td>Kumara 👦</td><td>Bala 👶</td></tr>
            <tr><th style="color:#f1c40f;">5. Leo (Odd)</th><td>Bala 👶</td><td>Kumara 👦</td><td>Yuva 👨</td><td>Vriddha 👴</td><td>Mrita 💀</td></tr>
            <tr><th style="color:#10b981;">6. Virgo (Even)</th><td>Mrita 💀</td><td>Vriddha 👴</td><td>Yuva 👨</td><td>Kumara 👦</td><td>Bala 👶</td></tr>
            <tr><th style="color:#fbcfe8;">7. Libra (Odd)</th><td>Bala 👶</td><td>Kumara 👦</td><td>Yuva 👨</td><td>Vriddha 👴</td><td>Mrita 💀</td></tr>
            <tr><th style="color:#ef4444;">8. Scorpio (Even)</th><td>Mrita 💀</td><td>Vriddha 👴</td><td>Yuva 👨</td><td>Kumara 👦</td><td>Bala 👶</td></tr>
            <tr><th style="color:#f59e0b;">9. Sagittarius (Odd)</th><td>Bala 👶</td><td>Kumara 👦</td><td>Yuva 👨</td><td>Vriddha 👴</td><td>Mrita 💀</td></tr>
            <tr><th style="color:#e2e8f0;">10. Capricorn (Even)</th><td>Mrita 💀</td><td>Vriddha 👴</td><td>Yuva 👨</td><td>Kumara 👦</td><td>Bala 👶</td></tr>
            <tr><th style="color:#e2e8f0;">11. Aquarius (Odd)</th><td>Bala 👶</td><td>Kumara 👦</td><td>Yuva 👨</td><td>Vriddha 👴</td><td>Mrita 💀</td></tr>
            <tr><th style="color:#f59e0b;">12. Pisces (Even)</th><td>Mrita 💀</td><td>Vriddha 👴</td><td>Yuva 👨</td><td>Kumara 👦</td><td>Bala 👶</td></tr>
        </table>`
    },
    'maitri': {
        title: "Naisargika Maitri (Planetary Friendship Matrix)",
        html: `<table class="bphs-table matrix-table">
            <tr><th>Planet A \\ B</th><th>Surya</th><th>Chandra</th><th>Mangal</th><th>Budh</th><th>Guru</th><th>Shukra</th><th>Shani</th></tr>
            <tr><th style="color:#f1c40f;">Surya</th><td class="text-neutral">-</td><td class="text-friend">Friend</td><td class="text-friend">Friend</td><td class="text-neutral">Neutral</td><td class="text-friend">Friend</td><td class="text-enemy">Enemy</td><td class="text-enemy">Enemy</td></tr>
            <tr><th style="color:#f8fafc;">Chandra</th><td class="text-friend">Friend</td><td class="text-neutral">-</td><td class="text-neutral">Neutral</td><td class="text-friend">Friend</td><td class="text-neutral">Neutral</td><td class="text-neutral">Neutral</td><td class="text-neutral">Neutral</td></tr>
            <tr><th style="color:#ef4444;">Mangal</th><td class="text-friend">Friend</td><td class="text-friend">Friend</td><td class="text-neutral">-</td><td class="text-enemy">Enemy</td><td class="text-friend">Friend</td><td class="text-neutral">Neutral</td><td class="text-neutral">Neutral</td></tr>
            <tr><th style="color:#10b981;">Budh</th><td class="text-friend">Friend</td><td class="text-enemy">Enemy</td><td class="text-neutral">Neutral</td><td class="text-neutral">-</td><td class="text-neutral">Neutral</td><td class="text-friend">Friend</td><td class="text-neutral">Neutral</td></tr>
            <tr><th style="color:#f59e0b;">Guru</th><td class="text-friend">Friend</td><td class="text-friend">Friend</td><td class="text-friend">Friend</td><td class="text-enemy">Enemy</td><td class="text-neutral">-</td><td class="text-enemy">Enemy</td><td class="text-neutral">Neutral</td></tr>
            <tr><th style="color:#fbcfe8;">Shukra</th><td class="text-enemy">Enemy</td><td class="text-enemy">Enemy</td><td class="text-neutral">Neutral</td><td class="text-friend">Friend</td><td class="text-neutral">Neutral</td><td class="text-neutral">-</td><td class="text-friend">Friend</td></tr>
            <tr><th style="color:#e2e8f0;">Shani</th><td class="text-enemy">Enemy</td><td class="text-enemy">Enemy</td><td class="text-enemy">Enemy</td><td class="text-friend">Friend</td><td class="text-neutral">Neutral</td><td class="text-friend">Friend</td><td class="text-neutral">-</td></tr>
        </table>`
    },
    'nakshatra': {
        title: "27 Nakshatras & Ruling Lords",
        html: `
        <div style="margin-bottom: 12px; font-size: 12px; background: rgba(0,0,0,0.5); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <span style="color:#f97316; font-weight:bold;">■ Orange (Shubh / Auspicious)</span> &nbsp;|&nbsp;
            <span style="color:#f472b6; font-weight:bold;">■ Pink (Good / Gentle)</span> &nbsp;|&nbsp;
            <span style="color:#ffffff; font-weight:bold;">■ White (Neutral / Mixed)</span> &nbsp;|&nbsp;
            <span style="color:#ef4444; font-weight:bold;">■ Red (Very Bad / Fierce)</span>
        </div>
        <table class="bphs-table" style="font-size:13px;">
            <tr><th>#</th><th>Nakshatra</th><th>Lord (Swami)</th><th>Nature / Gana</th><th>Core Characteristic</th></tr>
            <tr><td>1</td><td style="color:#f472b6; font-weight:bold;">Ashwini</td><td style="color:#78716c">Ketu</td><td>Swift (Light)</td><td>Speed, Healing, Beginnings</td></tr>
            <tr><td>2</td><td style="color:#ef4444; font-weight:bold;">Bharani</td><td style="color:#fbcfe8">Shukra</td><td>Fierce (Severe)</td><td>Restraint, Transformation, Struggle</td></tr>
            <tr><td>3</td><td style="color:#ffffff; font-weight:bold;">Krittika</td><td style="color:#f1c40f">Surya</td><td>Mixed (Neutral)</td><td>Purification, Cutting, Ambition</td></tr>
            <tr><td>4</td><td style="color:#f97316; font-weight:bold;">Rohini</td><td style="color:#f8fafc">Chandra</td><td>Fixed (Stable)</td><td>Growth, Fertility, Material Desires</td></tr>
            <tr><td>5</td><td style="color:#f472b6; font-weight:bold;">Mrigashira</td><td style="color:#ef4444">Mangal</td><td>Tender (Gentle)</td><td>Seeking, Searching, Curiosity</td></tr>
            <tr><td>6</td><td style="color:#ef4444; font-weight:bold;">Ardra</td><td style="color:#94a3b8">Rahu</td><td>Sharp (Dreadful)</td><td>Destruction, Storms, Effort</td></tr>
            <tr><td>7</td><td style="color:#f97316; font-weight:bold;">Punarvasu</td><td style="color:#f59e0b">Guru</td><td>Movable (Chara)</td><td>Renewal, Return of Light, Safety</td></tr>
            <tr><td>8</td><td style="color:#f97316; font-weight:bold;">Pushya</td><td style="color:#e2e8f0">Shani</td><td>Swift (Highly Shubh)</td><td>Nourishment, Auspiciousness, Care</td></tr>
            <tr><td>9</td><td style="color:#ef4444; font-weight:bold;">Ashlesha</td><td style="color:#10b981">Budh</td><td>Sharp (Dreadful)</td><td>Clinging, Poison, Mysticism</td></tr>
            <tr><td>10</td><td style="color:#ef4444; font-weight:bold;">Magha</td><td style="color:#78716c">Ketu</td><td>Fierce (Severe)</td><td>Royalty, Ancestors, Heritage</td></tr>
            <tr><td>11</td><td style="color:#ef4444; font-weight:bold;">Purva Phalguni</td><td style="color:#fbcfe8">Shukra</td><td>Fierce (Severe)</td><td>Rest, Relaxation, Enjoyment</td></tr>
            <tr><td>12</td><td style="color:#f97316; font-weight:bold;">Uttara Phalguni</td><td style="color:#f1c40f">Surya</td><td>Fixed (Stable)</td><td>Patronage, Charity, Contracts</td></tr>
            <tr><td>13</td><td style="color:#f472b6; font-weight:bold;">Hasta</td><td style="color:#f8fafc">Chandra</td><td>Swift (Light)</td><td>Skill with hands, Grasping, Craft</td></tr>
            <tr><td>14</td><td style="color:#f472b6; font-weight:bold;">Chitra</td><td style="color:#ef4444">Mangal</td><td>Tender (Gentle)</td><td>Architecture, Brilliance, Magic</td></tr>
            <tr><td>15</td><td style="color:#f97316; font-weight:bold;">Swati</td><td style="color:#94a3b8">Rahu</td><td>Movable (Chara)</td><td>Independence, Wind, Scatter</td></tr>
            <tr><td>16</td><td style="color:#ffffff; font-weight:bold;">Vishakha</td><td style="color:#f59e0b">Guru</td><td>Mixed (Neutral)</td><td>Purpose, Triumph, Fixation</td></tr>
            <tr><td>17</td><td style="color:#f472b6; font-weight:bold;">Anuradha</td><td style="color:#e2e8f0">Shani</td><td>Tender (Gentle)</td><td>Success, Devotion, Friendship</td></tr>
            <tr><td>18</td><td style="color:#ef4444; font-weight:bold;">Jyeshtha</td><td style="color:#10b981">Budh</td><td>Sharp (Dreadful)</td><td>Seniority, Protection, Eldest</td></tr>
            <tr><td>19</td><td style="color:#ef4444; font-weight:bold;">Mula</td><td style="color:#78716c">Ketu</td><td>Sharp (Dreadful)</td><td>Roots, Destruction, Unearthing</td></tr>
            <tr><td>20</td><td style="color:#ef4444; font-weight:bold;">Purva Ashadha</td><td style="color:#fbcfe8">Shukra</td><td>Fierce (Severe)</td><td>Invincibility, Water, Faith</td></tr>
            <tr><td>21</td><td style="color:#f97316; font-weight:bold;">Uttara Ashadha</td><td style="color:#f1c40f">Surya</td><td>Fixed (Stable)</td><td>Unchallenged Victory, Alliance</td></tr>
            <tr><td>22</td><td style="color:#f97316; font-weight:bold;">Shravana</td><td style="color:#f8fafc">Chandra</td><td>Movable (Chara)</td><td>Listening, Learning, Wisdom</td></tr>
            <tr><td>23</td><td style="color:#f97316; font-weight:bold;">Dhanishta</td><td style="color:#ef4444">Mangal</td><td>Movable (Chara)</td><td>Symphony, Wealth, Rhythm</td></tr>
            <tr><td>24</td><td style="color:#f97316; font-weight:bold;">Shatabhisha</td><td style="color:#94a3b8">Rahu</td><td>Movable (Chara)</td><td>Healing, Veils, 100 Physicians</td></tr>
            <tr><td>25</td><td style="color:#ef4444; font-weight:bold;">Purva Bhadrapada</td><td style="color:#f59e0b">Guru</td><td>Fierce (Severe)</td><td>Fire, Transformation, Zeal</td></tr>
            <tr><td>26</td><td style="color:#f97316; font-weight:bold;">Uttara Bhadrapada</td><td style="color:#e2e8f0">Shani</td><td>Fixed (Stable)</td><td>Deep Sleep, Depth, Wisdom</td></tr>
            <tr><td>27</td><td style="color:#f472b6; font-weight:bold;">Revati</td><td style="color:#10b981">Budh</td><td>Tender (Gentle)</td><td>Nourishment, Safe Journey, Wealth</td></tr>
        </table>`
    },
    'yamartha': {
        title: "11. Yamartha (Planetary Shifts & Upagraha Kaalas)",
        html: `
        <div style="margin-bottom: 15px; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
            <strong>Note:</strong> Standard timings assume a 6:00 AM Sunrise and 12-hour day. The day (Dinamaana) is divided into 8 equal parts called <strong>Yamardhas</strong> (approx 1.5 hours each). 
        </div>
        <table class="bphs-table matrix-table" style="font-size:12px;">
            <tr>
                <th style="width: 110px;">Kaala (Shift)</th>
                <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
            </tr>
            <tr>
                <th style="color:#ef4444;">Rahu Kaal<br><span style="font-size:10px; color:#94a3b8;">(Poison/Obstacles)</span></th>
                <td>16:30 - 18:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 8)</span></td>
                <td>07:30 - 09:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 2)</span></td>
                <td>15:00 - 16:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 7)</span></td>
                <td>12:00 - 13:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 5)</span></td>
                <td>13:30 - 15:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 6)</span></td>
                <td>10:30 - 12:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 4)</span></td>
                <td>09:00 - 10:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 3)</span></td>
            </tr>
            <tr>
                <th style="color:#f59e0b;">Yama Gandak<br><span style="font-size:10px; color:#94a3b8;">(Death/Danger)</span></th>
                <td>12:00 - 13:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 5)</span></td>
                <td>10:30 - 12:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 4)</span></td>
                <td>09:00 - 10:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 3)</span></td>
                <td>07:30 - 09:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 2)</span></td>
                <td>06:00 - 07:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 1)</span></td>
                <td>15:00 - 16:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 7)</span></td>
                <td>13:30 - 15:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 6)</span></td>
            </tr>
            <tr>
                <th style="color:#6ee7b7;">Gulika Kaal<br><span style="font-size:10px; color:#94a3b8;">(Delay/Repetition)</span></th>
                <td>15:00 - 16:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 7)</span></td>
                <td>13:30 - 15:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 6)</span></td>
                <td>12:00 - 13:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 5)</span></td>
                <td>10:30 - 12:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 4)</span></td>
                <td>09:00 - 10:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 3)</span></td>
                <td>07:30 - 09:00<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 2)</span></td>
                <td>06:00 - 07:30<br><span style="color:#f1c40f; font-size:10px;">(Yamardha 1)</span></td>
            </tr>
        </table>
        <div style="margin-top: 15px;">
            <table class="bphs-table" style="font-size:13px;">
                <tr><th>Upagraha</th><th>Ruling Planet</th><th>Deep Details & Traits</th></tr>
                <tr><td style="color:#ef4444; font-weight:bold;">Rahu Kaal</td><td>Rahu</td><td>Highly inauspicious segment. Avoid starting new ventures, business deals, or auspicious travel. It clouds judgment and creates illusions.</td></tr>
                <tr><td style="color:#f59e0b; font-weight:bold;">Yamagandak</td><td>Ketu / Guru</td><td>The "Time of Death". Extremely unfavorable for medical surgeries, beginning treatments, or taking major life risks. Promotes loss.</td></tr>
                <tr><td style="color:#6ee7b7; font-weight:bold;">Gulika Kaal</td><td>Shani (Son of Saturn)</td><td>Whatever begins here repeats. <strong>Good for:</strong> Buying a house, accumulating wealth. <strong>Bad for:</strong> Funerals, taking loans, or selling property.</td></tr>
            </table>
        </div>`
    },
    'panchang': {
        title: "12. Panchang: Bhadra, Panchak & Karana",
        html: `
        <div style="margin-bottom: 15px; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
            These timeframes represent specific shifts in the lunar cycle and spatial orientation that dictate whether an action will yield fruitful or destructive results.
        </div>
        <table class="bphs-table" style="font-size:13px;">
            <tr><th style="width: 120px;">Element</th><th>Nature</th><th>Deep Details & Calculation</th></tr>
            <tr>
                <td style="color:#ef4444; font-weight:bold;">Bhadra Kaal<br><span style="font-size:11px; color:#94a3b8;">(Vishti Karana)</span></td>
                <td>Highly Inauspicious</td>
                <td>Bhadra is the Vishti Karana (half of a specific Tithi). When Bhadra resides in Mrityu Loka (Earth), it is forbidden to do any auspicious work (marriages, Griha Pravesh). However, Bhadra is favorable for destructive acts like filing lawsuits, warfare, or occult practices.</td>
            </tr>
            <tr>
                <td style="color:#f97316; font-weight:bold;">Panchak<br><span style="font-size:11px; color:#94a3b8;">(Group of 5)</span></td>
                <td>Mixed / Caution</td>
                <td>Occurs when Chandra (Moon) transits the last 5 Nakshatras (Dhanishta 3rd pada to Revati), mapping to Aquarius and Pisces. <strong>Forbidden Acts:</strong> Traveling South (Yama's direction), gathering wood, building a house roof, making a bed, or cremating a body (risks 5 deaths in the family without proper Shanti puja).</td>
            </tr>
        </table>

        <h4 style="color: var(--accent-gold); margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase;">The 11 Karanas (Half-Tithis)</h4>
        <table class="bphs-table matrix-table" style="font-size:12px;">
            <tr><th>Type</th><th colspan="7">Names & Rulers</th></tr>
            <tr>
                <th style="color:#34d399;">7 Chara (Movable)</th>
                <td><strong>Bava</strong><br>(Indra)</td>
                <td><strong>Balava</strong><br>(Brahma)</td>
                <td><strong>Kaulava</strong><br>(Mitra)</td>
                <td><strong>Taitila</strong><br>(Vishwakarma)</td>
                <td><strong>Gara</strong><br>(Prithvi)</td>
                <td><strong>Vanija</strong><br>(Lakshmi)</td>
                <td style="color:#ef4444;"><strong>Vishti (Bhadra)</strong><br>(Yama)</td>
            </tr>
            <tr>
                <th style="color:#60a5fa;">4 Sthira (Fixed)</th>
                <td><strong>Shakuni</strong><br>(Kali)</td>
                <td><strong>Chatushpada</strong><br>(Vrishabha)</td>
                <td><strong>Naga</strong><br>(Naga)</td>
                <td><strong>Kintughna</strong><br>(Vayu)</td>
                <td colspan="3" style="color:#94a3b8; font-style:italic;">Occur only during Amavasya and Purnima transitions.</td>
            </tr>
        </table>`
    },
    'karakas_deep': {
        title: "13. Sthir (Fixed) & Chara (Variable) Karakas",
        html: `
        <div style="margin-bottom: 15px; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
            In Jaimini and Parashari systems, <strong>Karakas (Significators)</strong> are divided into Fixed (Sthir) and Variable (Chara). While Sthir Karakas remain the same for everyone, Chara Karakas are unique to a person's birth chart based on planetary degrees.
        </div>

        <h4 style="color: var(--accent-gold); margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase;">Sthir Karakas (Fixed Significators)</h4>
        <table class="bphs-table" style="font-size:13px;">
            <tr><th style="width: 120px;">Planet</th><th>Represents (Sthir Karaka)</th></tr>
            <tr><td style="color:#f1c40f; font-weight:bold;">Surya (Sun)</td><td>Father, Soul, Vitality, Authority</td></tr>
            <tr><td style="color:#f8fafc; font-weight:bold;">Chandra (Moon)</td><td>Mother, Mind, Emotions</td></tr>
            <tr><td style="color:#ef4444; font-weight:bold;">Mangal (Mars)</td><td>Younger Siblings, Courage, Property</td></tr>
            <tr><td style="color:#10b981; font-weight:bold;">Budh (Mercury)</td><td>Maternal Uncles, Intellect, Speech</td></tr>
            <tr><td style="color:#f59e0b; font-weight:bold;">Guru (Jupiter)</td><td>Children, Wealth, Guru, Husband (in female chart)</td></tr>
            <tr><td style="color:#fbcfe8; font-weight:bold;">Shukra (Venus)</td><td>Spouse/Wife (in male chart), Marriage, Vehicles</td></tr>
            <tr><td style="color:#e2e8f0; font-weight:bold;">Shani (Saturn)</td><td>Longevity, Sorrows, Elder Siblings, Subordinates</td></tr>
            <tr><td style="color:#94a3b8; font-weight:bold;">Rahu & Ketu</td><td>Paternal (Rahu) & Maternal (Ketu) Grandparents</td></tr>
        </table>

        <h4 style="color: var(--accent-gold); margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase;">Chara Karakas (Variable / Jaimini Scheme)</h4>
        <div style="margin-bottom: 10px; font-size: 12px; color: #94a3b8;">
            Based strictly on the degree of the planet within its respective sign (0° to 30°). The planet with the highest degree becomes the Atmakaraka (King of the Chart).
        </div>
        <table class="bphs-table matrix-table" style="font-size:12px;">
            <tr><th>Rank (by Degree)</th><th>Title</th><th>Symbol</th><th>Signification</th></tr>
            <tr><th style="color:#f1c40f;">1st (Highest °)</th><td><strong>Atmakaraka</strong></td><td>AK</td><td>The Soul, Core Self, Life Purpose (The King)</td></tr>
            <tr><th style="color:#60a5fa;">2nd</th><td><strong>Amatyakaraka</strong></td><td>AmK</td><td>Career, Mind, Minister, Advisors to the Soul</td></tr>
            <tr><th style="color:#34d399;">3rd</th><td><strong>Bhratrikaraka</strong></td><td>BK</td><td>Siblings, Guru, Spiritual Guide</td></tr>
            <tr><th style="color:#fbcfe8;">4th</th><td><strong>Matrikaraka</strong></td><td>MK</td><td>Mother, Home, Comforts, Education</td></tr>
            <tr><th style="color:#ef4444;">5th</th><td><strong>Pitrikaraka</strong></td><td>PiK</td><td>Father, Ancestors, Superiors, Children, Intellect, Followers, Creativity</td></tr>
            <tr><th style="color:#e2e8f0;">6th</th><td><strong>Gnatikaraka</strong></td><td>GK</td><td>Obstacles, Enemies, Diseases, Rivals</td></tr>
            <tr><th style="color:#f472b6;">7th (Lowest °)</th><td><strong>Darakaraka</strong></td><td>DK</td><td>Spouse, Partnerships, Wealth Accumulation</td></tr>
        </table>`
    }
};