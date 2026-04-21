from flask import Flask, request, jsonify
from flask_cors import CORS
import swisseph as swe
from datetime import datetime
import pytz
import math

app = Flask(__name__)
CORS(app)

# -----------------------------------------------------------------------------------------
# TRUE BPHS KNOWLEDGE BASE
# -----------------------------------------------------------------------------------------
NAISARGIKA_BALA = {
    'Surya': 60.00, 'Chandra': 51.43, 'Shukra': 42.85, 'Guru': 34.28,
    'Budh': 25.71, 'Mangal': 17.14, 'Shani': 8.57, 'Rahu': 0.0, 'Ketu': 0.0
}

BPHS_DATA = {
    'Surya': {'id': swe.SUN, 'debilSign': 6, 'paramNeecha': 10, 'digBalaMaxHouse': 10, 'own': [4], 'nat_friends': ['Chandra', 'Mangal', 'Guru'], 'nat_enemies': ['Shukra', 'Shani'], 'combustRange': 0},
    'Chandra': {'id': swe.MOON, 'debilSign': 7, 'paramNeecha': 3, 'digBalaMaxHouse': 4, 'own': [3], 'nat_friends': ['Surya', 'Budh'], 'nat_enemies': [], 'combustRange': 12},
    'Mangal': {'id': swe.MARS, 'debilSign': 3, 'paramNeecha': 28, 'digBalaMaxHouse': 10, 'own': [0, 7], 'nat_friends': ['Surya', 'Chandra', 'Guru'], 'nat_enemies': ['Budh'], 'combustRange': 17},
    'Budh': {'id': swe.MERCURY, 'debilSign': 11, 'paramNeecha': 15, 'digBalaMaxHouse': 1, 'own': [2, 5], 'nat_friends': ['Surya', 'Shukra'], 'nat_enemies': ['Chandra'], 'combustRange': 14},
    'Guru': {'id': swe.JUPITER, 'debilSign': 9, 'paramNeecha': 5, 'digBalaMaxHouse': 1, 'own': [8, 11], 'nat_friends': ['Surya', 'Chandra', 'Mangal'], 'nat_enemies': ['Budh', 'Shukra'], 'combustRange': 11},
    'Shukra': {'id': swe.VENUS, 'debilSign': 5, 'paramNeecha': 27, 'digBalaMaxHouse': 4, 'own': [1, 6], 'nat_friends': ['Budh', 'Shani'], 'nat_enemies': ['Surya', 'Chandra'], 'combustRange': 10},
    'Shani': {'id': swe.SATURN, 'debilSign': 0, 'paramNeecha': 20, 'digBalaMaxHouse': 7, 'own': [9, 10], 'nat_friends': ['Budh', 'Shukra'], 'nat_enemies': ['Surya', 'Chandra', 'Mangal'], 'combustRange': 15},
    'Rahu': {'id': swe.TRUE_NODE, 'debilSign': 7, 'paramNeecha': 15, 'digBalaMaxHouse': -1, 'own': [2, 5], 'nat_friends': ['Budh', 'Shukra', 'Shani'], 'nat_enemies': ['Surya', 'Chandra', 'Mangal'], 'combustRange': 0},
    'Ketu': {'id': swe.TRUE_NODE, 'debilSign': 1, 'paramNeecha': 15, 'digBalaMaxHouse': -1, 'own': [8, 11], 'nat_friends': ['Surya', 'Chandra', 'Mangal'], 'nat_enemies': ['Budh', 'Shukra', 'Shani'], 'combustRange': 0},
}

SIGN_LORDS = { 0: 'Mangal', 1: 'Shukra', 2: 'Budh', 3: 'Chandra', 4: 'Surya', 5: 'Budh', 6: 'Shukra', 7: 'Mangal', 8: 'Guru', 9: 'Shani', 10: 'Shani', 11: 'Guru' }

# --- [BPHS CORE FUNCTIONS] ---

def get_panchadha_maitri(planet_name, p_sign, all_positions):
    bphs = BPHS_DATA[planet_name]
    
    if p_sign in bphs['own']: 
        return 30.0, ["Swa-Rashi: 30V"]
        
    if planet_name in ['Rahu', 'Ketu']:
        if p_sign == bphs['debilSign']: 
            return 3.75, ["Neecha: 3.75V"]
        return 15.0, ["Mitra (Chhaya): 15V"] 

    lord_name = SIGN_LORDS[p_sign]
    
    nat_score = 0
    if lord_name in bphs['nat_friends']: nat_score = 1
    elif lord_name in bphs['nat_enemies']: nat_score = -1

    temp_score = -1 
    lord_pos = all_positions.get(lord_name)
    if lord_pos:
        dist = (lord_pos['sign'] - p_sign + 12) % 12 + 1
        if dist in [2, 3, 4, 10, 11, 12]: 
            temp_score = 1
            
    comp_score = nat_score + temp_score
    
    scores = {
        2: (22.5, ["Adhi Mitra: 22.5V"]), 
        1: (15.0, ["Mitra: 15V"]), 
        0: (7.5, ["Sama: 7.5V"]), 
        -1: (3.75, ["Shatru: 3.8V"]), 
        -2: (1.875, ["Adhi Shatru: 1.9V"])
    }
    return scores.get(comp_score, (1.875, ["Adhi Shatru: 1.9V"]))

def get_oja_yugma_bala(planet_name, abs_deg):
    if planet_name in ['Rahu', 'Ketu']: 
        return 0.0, []
        
    rashi_is_even = int(abs_deg / 30) % 2 != 0
    nav_is_even = int(abs_deg / (10.0 / 3.0)) % 12 % 2 != 0
    
    v = 0
    if planet_name in ['Chandra', 'Shukra']:
        if rashi_is_even: v += 15
        if nav_is_even: v += 15
    else:
        if not rashi_is_even: v += 15
        if not nav_is_even: v += 15
        
    if v > 0:
        return float(v), [f"Oja/Yugma: {v}V"]
        
    return 0.0, []

def get_ayana_bala(planet_name, declination):
    if planet_name in ['Rahu', 'Ketu']: 
        return 0.0, []
        
    if planet_name in ['Surya', 'Mangal', 'Guru', 'Shukra']: 
        val = (24 + declination) * 1.25
    elif planet_name in ['Chandra', 'Shani']: 
        val = (24 - declination) * 1.25
    else: 
        val = (24 + abs(declination)) * 1.25
        
    val = max(0, min(60, val))
    
    if planet_name == 'Surya': 
        val *= 2
        
    return round(val, 1), [f"Ayana: {round(val, 1)}V"]

def get_nathonnatha_bala(planet_name, sun_deg, asc_deg):
    """BPHS Day/Night Temporal Strength based on distance to Midheaven/Nadir."""
    if planet_name in ['Rahu', 'Ketu']: 
        return 0.0, []
        
    if planet_name == 'Budh': 
        return 60.0, ["Dina/Ratri: 60V"]
        
    midday_pt = (asc_deg + 270) % 360 # 10th Cusp (Zenith)
    midnight_pt = (asc_deg + 90) % 360 # 4th Cusp (Nadir)
    
    if planet_name in ['Surya', 'Guru', 'Shukra']: # Day strong
        dist = abs(sun_deg - midnight_pt)
        if dist > 180: dist = 360 - dist
        v = math.floor(dist / 3)
        return float(v), [f"Dina Bala: {v}V"]
    else: # Night strong (Chandra, Mangal, Shani)
        dist = abs(sun_deg - midday_pt)
        if dist > 180: dist = 360 - dist
        v = math.floor(dist / 3)
        return float(v), [f"Ratri Bala: {v}V"]

def get_paksha_bala(planet_name, sun_deg, moon_deg):
    """BPHS Lunar Phase Strength."""
    if planet_name in ['Rahu', 'Ketu']: 
        return 0.0, []
        
    angle = (moon_deg - sun_deg + 360) % 360
    if angle <= 180:
        val = (angle / 180.0) * 60.0
    else:
        val = ((360 - angle) / 180.0) * 60.0
    
    if planet_name in ['Surya', 'Mangal', 'Shani']: 
        val = 60.0 - val # Malefics get inverse strength
        
    # The Moon's Paksha Bala is doubled
    if planet_name == 'Chandra': 
        val *= 2
        
    return round(val, 1), [f"Paksha: {round(val, 1)}V"]

def get_vara_bala(planet_name, jd_ut):
    """BPHS Lord of the Day Strength (45V)."""
    if planet_name in ['Rahu', 'Ketu']: 
        return 0.0, []
        
    # swe.day_of_week returns 0=Monday...6=Sunday
    day_lords = {0: 'Chandra', 1: 'Mangal', 2: 'Budh', 3: 'Guru', 4: 'Shukra', 5: 'Shani', 6: 'Surya'}
    lord = day_lords.get(swe.day_of_week(jd_ut))
    
    if planet_name == lord: 
        return 45.0, ["Vara (Day Lord): 45V"]
        
    return 0.0, []

def get_drik_bala(target_name, target_deg, all_positions):
    """BPHS Exact Angular Aspect Strength (Drishti / 4)."""
    if target_name in ['Rahu', 'Ketu']: 
        return 0.0, []
        
    benefics = ['Guru', 'Shukra', 'Budh', 'Chandra']
    total_drik_v = 0
    
    for a_name, a_data in all_positions.items():
        if a_name == target_name or a_name in ['Rahu', 'Ketu']: 
            continue
            
        angle = (target_deg - a_data['abs_deg'] + 360) % 360
        drishti = 0
        
        # Standard Parashari Aspect formula
        if 30 < angle <= 60: drishti = (angle - 30) / 2
        elif 60 < angle <= 90: drishti = angle - 60 + 15
        elif 90 < angle <= 120: drishti = (120 - angle) / 2 + 30
        elif 120 < angle <= 150: drishti = 150 - angle
        elif 150 < angle <= 180: drishti = (angle - 150) * 2
        elif 180 < angle <= 300: drishti = (300 - angle) / 2
        
        # Special 100% Aspects
        if a_name == 'Shani' and ((60 < angle <= 90) or (270 < angle <= 300)): 
            drishti = 60
        elif a_name == 'Guru' and ((120 < angle <= 150) or (240 < angle <= 270)): 
            drishti = 60
        elif a_name == 'Mangal' and ((90 < angle <= 120) or (210 < angle <= 240)): 
            drishti = 60
            
        drishti = min(60, max(0, drishti))
        drik_strength = drishti / 4.0 
        
        if drishti > 0:
            if a_name in benefics: 
                total_drik_v += drik_strength
            else: 
                total_drik_v -= drik_strength
                
    if total_drik_v != 0:
        val = round(total_drik_v, 1)
        if val > 0:
            return val, [f"Shubh Drik: +{val}V"]
        else:
            return val, [f"Pap Drik: {val}V"]
            
    return 0.0, []


def calculate_shadbala_metrics(p_name, p_data, all_positions, asc_abs_deg, sun_deg, moon_deg, jd_ut):
    bphs = BPHS_DATA[p_name]
    total_v = 0
    log = []

    abs_deg = p_data['abs_deg']
    sign_index = p_data['sign']
    house_num = p_data['house']
    speed = p_data['speed']
    decl = p_data['declination']

    # 1. Sthana Bala
    dist_neecha = abs(abs_deg - ((bphs['debilSign'] * 30) + bphs['paramNeecha']))
    if dist_neecha > 180: dist_neecha = 360 - dist_neecha
    uchcha_v = math.floor(dist_neecha / 3)
    total_v += uchcha_v
    log.append(f"Uchcha: {uchcha_v}V")

    sthana_v, sthana_log = get_panchadha_maitri(p_name, sign_index, all_positions)
    oja_v, oja_log = get_oja_yugma_bala(p_name, abs_deg)
    
    total_v += sthana_v + oja_v
    log.extend(sthana_log)
    log.extend(oja_log)

    # 2. Dig Bala
    if bphs['digBalaMaxHouse'] != -1:
        if bphs['digBalaMaxHouse'] == 10: max_d = 270
        elif bphs['digBalaMaxHouse'] == 4: max_d = 90
        elif bphs['digBalaMaxHouse'] == 7: max_d = 180
        else: max_d = 0
        
        dist_zero = abs(abs_deg - ((asc_abs_deg + max_d + 180) % 360))
        if dist_zero > 180: dist_zero = 360 - dist_zero
        dig_v = math.floor(dist_zero / 3)
        total_v += dig_v
        log.append(f"Dig Bala: {dig_v}V")

    if house_num in [1, 4, 7, 10]: bhava_v = 60
    elif house_num in [2, 5, 8, 11]: bhava_v = 30
    else: bhava_v = 15
    total_v += bhava_v
    log.append(f"Bhava: {bhava_v}V")

    # 3. Cheshta Bala & Astangata
    if p_name not in ['Surya', 'Chandra', 'Rahu', 'Ketu']:
        if speed < 0:
            total_v += 60
            log.append("Vakri: 60V")
            
        if sun_deg is not None:
            dist_sun = abs(abs_deg - sun_deg)
            if dist_sun > 180: dist_sun = 360 - dist_sun
            if dist_sun <= bphs['combustRange']:
                penalty = math.floor(total_v / 2)
                total_v -= penalty
                log.append(f"Combust: -{penalty}V")

    # 4. Kala Bala (Ayana, Nathonnatha, Paksha, Vara)
    ayana_v, ayana_log = get_ayana_bala(p_name, decl)
    nath_v, nath_log = get_nathonnatha_bala(p_name, sun_deg, asc_abs_deg)
    paksha_v, paksha_log = get_paksha_bala(p_name, sun_deg, moon_deg)
    vara_v, vara_log = get_vara_bala(p_name, jd_ut)
    
    total_v += ayana_v + nath_v + paksha_v + vara_v
    log.extend(ayana_log)
    log.extend(nath_log)
    log.extend(paksha_log)
    log.extend(vara_log)

    # 5. Drik Bala
    drik_v, drik_log = get_drik_bala(p_name, abs_deg, all_positions)
    total_v += drik_v
    log.extend(drik_log)

    # 6. Naisargika Bala
    nais_v = NAISARGIKA_BALA.get(p_name, 0)
    if nais_v > 0:
        total_v += nais_v
        log.append(f"Naisargika: {round(nais_v, 1)}V")

    return max(0, round(total_v, 1)), log

@app.route('/calculate', methods=['POST'])
def calculate_chart():
    try:
        data = request.json
        date_str = data.get('date')
        time_str = data.get('time')
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))

        local_tz = pytz.timezone('Asia/Kolkata')
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
        local_dt = local_tz.localize(dt)
        utc_dt = local_dt.astimezone(pytz.utc)
        
        jd_ut = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, 
                           utc_dt.hour + utc_dt.minute/60.0 + utc_dt.second/3600.0)
        
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED
        flags_eq = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED | swe.FLG_EQUATORIAL
        
        cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'E', flags)
        asc_deg = ascmc[0]
        asc_sign_index = int(asc_deg / 30)

        # PASS 1: Raw Astronomical Data
        all_positions = {}
        for name, p_data in BPHS_DATA.items():
            if name == 'Ketu':
                pos, _ = swe.calc_ut(jd_ut, swe.TRUE_NODE, flags)
                lon_deg = (pos[0] + 180) % 360
                speed = pos[3]
                decl = 0
            else:
                pos, _ = swe.calc_ut(jd_ut, p_data['id'], flags)
                pos_eq, _ = swe.calc_ut(jd_ut, p_data['id'], flags_eq)
                lon_deg = pos[0]
                speed = pos[3]
                decl = pos_eq[1]

            sign_index = int(lon_deg / 30)
            house_idx = (sign_index - asc_sign_index + 12) % 12
            
            all_positions[name] = {
                'abs_deg': lon_deg, 
                'deg': lon_deg % 30, 
                'sign': sign_index, 
                'house': house_idx + 1, 
                'speed': speed, 
                'declination': decl
            }

        sun_deg = all_positions['Surya']['abs_deg']
        moon_deg = all_positions['Chandra']['abs_deg']

        # PASS 2: Complete Shadbala Calculation
        grahas = []
        for name, p_data in all_positions.items():
            total_v, log = calculate_shadbala_metrics(name, p_data, all_positions, asc_deg, sun_deg, moon_deg, jd_ut)
            grahas.append({ 
                **p_data, 
                'name': name, 
                'type': 'graha', 
                'shadbala': total_v, 
                'shadbala_log': log 
            })

        houses_array = [[] for _ in range(12)]
        for g in grahas: 
            houses_array[g['house'] - 1].append(g)

        return jsonify({
            'status': 'success', 
            'asc_sign': asc_sign_index + 1, 
            'asc_degree': asc_deg, 
            'houses': houses_array, 
            'grahas_data': grahas
        })

    except Exception as e: 
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__': 
    app.run(debug=True)