from flask import Flask, request, jsonify
from flask_cors import CORS
import swisseph as swe
from datetime import datetime
import pytz
import math
import requests 
import time

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
    
    
# -----------------------------------------------------------------------------------------
# TRUE BPHS ASHTAKAVARGA BINDU MATRIX (Positions from which a planet gives 1 Bindu)
# -----------------------------------------------------------------------------------------
BAV_TABLES = {
    'Surya': {
        'Surya': [1,2,4,7,8,9,10,11], 'Chandra': [3,6,10,11], 'Mangal': [1,2,4,7,8,9,10,11],
        'Budh': [3,5,6,9,10,11,12], 'Guru': [5,6,9,11], 'Shukra': [6,7,12], 'Shani': [1,2,4,7,8,9,10,11], 'Asc': [3,4,6,10,11,12]
    },
    'Chandra': {
        'Surya': [3,6,7,8,10,11], 'Chandra': [1,3,6,7,10,11], 'Mangal': [2,3,5,6,9,10,11],
        'Budh': [1,3,4,5,7,8,10,11], 'Guru': [1,4,7,8,10,11,12], 'Shukra': [3,4,5,7,9,10,11], 'Shani': [3,5,6,11], 'Asc': [3,6,10,11]
    },
    'Mangal': {
        'Surya': [3,5,6,10,11], 'Chandra': [3,6,11], 'Mangal': [1,2,4,7,8,10,11],
        'Budh': [3,5,6,11], 'Guru': [6,10,11,12], 'Shukra': [6,8,11,12], 'Shani': [1,4,7,8,9,10,11], 'Asc': [1,3,6,10,11]
    },
    'Budh': {
        'Surya': [5,6,9,11,12], 'Chandra': [2,4,6,8,10,11], 'Mangal': [1,2,4,7,8,9,10,11],
        'Budh': [1,3,5,6,9,10,11,12], 'Guru': [6,8,11,12], 'Shukra': [1,2,3,4,5,8,9,11], 'Shani': [1,2,4,7,8,9,10,11], 'Asc': [1,2,4,6,8,10,11]
    },
    'Guru': {
        'Surya': [1,2,3,4,7,8,9,10,11], 'Chandra': [2,5,7,9,11], 'Mangal': [1,2,4,7,8,10,11],
        'Budh': [1,2,4,5,6,9,10,11], 'Guru': [1,2,3,4,7,8,10,11], 'Shukra': [2,5,6,9,10,11], 'Shani': [3,5,6,12], 'Asc': [1,2,4,5,6,7,9,10,11]
    },
    'Shukra': {
        'Surya': [8,11,12], 'Chandra': [1,2,3,4,5,8,9,11,12], 'Mangal': [3,5,6,9,11,12],
        'Budh': [3,5,6,9,11], 'Guru': [5,8,9,10,11], 'Shukra': [1,2,3,4,5,8,9,10,11], 'Shani': [3,4,5,8,9,10,11], 'Asc': [1,2,3,4,5,8,9,11]
    },
    'Shani': {
        'Surya': [1,2,4,7,8,10,11], 'Chandra': [3,6,11], 'Mangal': [3,5,6,10,11],
        'Budh': [6,8,9,10,11,12], 'Guru': [5,6,11,12], 'Shukra': [6,11,12], 'Shani': [3,5,6,11], 'Asc': [1,3,4,6,10,11]
    }
}

def calculate_sarvashtakavarga(all_positions, asc_sign_index):
    """Calculates the exact 337 points of Parashari SAV."""
    sav = [0] * 12
    # Add Ascendant to positions for BAV calc
    pos_data = {k: v['sign'] for k, v in all_positions.items() if k in BAV_TABLES.keys()}
    pos_data['Asc'] = asc_sign_index
    
    for target_planet, contributors in BAV_TABLES.items():
        for contributor, houses in contributors.items():
            if contributor in pos_data:
                contributor_sign = pos_data[contributor]
                for h in houses:
                    target_sign = (contributor_sign + h - 1) % 12
                    sav[target_sign] += 1
    
    # We must shift the array so index 0 = Lagna (1st House)
    shifted_sav = []
    for i in range(12):
        shifted_sav.append(sav[(asc_sign_index + i) % 12])
        
    return shifted_sav

# -----------------------------------------------------------------------------------------
# TRUE BPHS SHODASHAVARGA (DIVISIONAL CHART) ENGINE
# -----------------------------------------------------------------------------------------
def calculate_vargas(all_positions, asc_abs_deg):
    """Calculates all essential Parashari Divisional Charts (Vargas) for event triggers."""
    vargas = {
        "D2": {}, "D3": {}, "D4": {}, "D7": {}, 
        "D9": {}, "D10": {}, "D12": {}, "D20": {}, 
        "D24": {}, "D30": {}
    }
    
    def get_varga_sign(div, abs_deg, sign_idx, deg_in_sign):
        if div == "D2": 
            if sign_idx % 2 == 0: 
                return 4 if deg_in_sign < 15 else 3 
            else: 
                return 3 if deg_in_sign < 15 else 4
                
        elif div == "D3": 
            part = int(deg_in_sign / 10)
            if part == 0: return sign_idx
            elif part == 1: return (sign_idx + 4) % 12
            else: return (sign_idx + 8) % 12
            
        elif div == "D4": 
            part = int(deg_in_sign / 7.5)
            if part == 0: return sign_idx
            elif part == 1: return (sign_idx + 3) % 12
            elif part == 2: return (sign_idx + 6) % 12
            else: return (sign_idx + 9) % 12
            
        elif div == "D7": 
            part = int(deg_in_sign / (30 / 7.0))
            if sign_idx % 2 == 0: return (sign_idx + part) % 12 
            else: return (sign_idx + 6 + part) % 12 
            
        elif div == "D9": 
            return int((abs_deg * 9) / 30) % 12
            
        elif div == "D10": 
            part = int(deg_in_sign / 3.0)
            if sign_idx % 2 == 0: return (sign_idx + part) % 12
            else: return (sign_idx + 8 + part) % 12
            
        elif div == "D12": 
            part = int(deg_in_sign / 2.5)
            return (sign_idx + part) % 12
            
        elif div == "D20": 
            part = int(deg_in_sign / 1.5)
            modality = sign_idx % 3
            if modality == 0: return (0 + part) % 12 
            elif modality == 1: return (8 + part) % 12 
            else: return (4 + part) % 12 
            
        elif div == "D24": 
            part = int(deg_in_sign / 1.25)
            if sign_idx % 2 == 0: return (4 + part) % 12 
            else: return (3 + part) % 12 
            
        elif div == "D30": 
            deg = deg_in_sign
            if sign_idx % 2 == 0: 
                if deg <= 5: return 0 
                elif deg <= 10: return 10 
                elif deg <= 18: return 8 
                elif deg <= 25: return 2 
                else: return 6 
            else: 
                if deg <= 5: return 1 
                elif deg <= 12: return 5 
                elif deg <= 20: return 11 
                elif deg <= 25: return 9 
                else: return 7
        return 0

    asc_sign_idx = int(asc_abs_deg / 30)
    asc_deg_in_sign = asc_abs_deg % 30
    
    varga_lagnas = {}
    for div in vargas.keys():
        varga_lagnas[div] = get_varga_sign(div, asc_abs_deg, asc_sign_idx, asc_deg_in_sign)

    for p_name, p_data in all_positions.items():
        abs_deg = p_data['abs_deg']
        sign_idx = p_data['sign']
        deg_in_sign = p_data['deg']
        
        for div in vargas.keys():
            v_sign = get_varga_sign(div, abs_deg, sign_idx, deg_in_sign)
            v_house = (v_sign - varga_lagnas[div] + 12) % 12 + 1
            vargas[div][p_name] = {"sign": v_sign + 1, "house": v_house}
            
    return vargas

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

        # Pass 3: True Ashtakavarga
        sav_array = calculate_sarvashtakavarga(all_positions, asc_sign_index)
        
        # --- PASS 3.2: RESTORE OUTER PLANETS (Arun, Varun, Yama) ---
        outer_planets_map = {'Arun': swe.URANUS, 'Varun': swe.NEPTUNE, 'Yama': swe.PLUTO}
        outer_positions = {}
        
        for op_name, swe_id in outer_planets_map.items():
            pos, _ = swe.calc_ut(jd_ut, swe_id, flags)
            lon_deg = pos[0]
            sign_index = int(lon_deg / 30)
            house_idx = (sign_index - asc_sign_index + 12) % 12
            
            op_data = {
                'abs_deg': lon_deg, 
                'deg': lon_deg % 30, 
                'sign': sign_index, 
                'house': house_idx + 1, 
                'speed': pos[3]
            }
            outer_positions[op_name] = op_data
            
            # Format them safely for the UI
            graha_obj = {
                **op_data,
                'name': op_name,
                'type': 'outer',
                'shadbala': 0,
                'shadbala_log': ["Modern Planet: No classical Shadbala"]
            }
            grahas.append(graha_obj)
            houses_array[house_idx].append(graha_obj)
            
        # Combine standard and outer planets so Vargas are calculated for EVERYONE
        combined_for_vargas = {**all_positions, **outer_positions}
        
        # --- PASS 3.5: VARGA CHARTS (D9 & D10) ---
        varga_data = calculate_vargas(combined_for_vargas, asc_deg)
 
           
        # --- PASS 4: RESTORE UPAGRAHAS (Aprakasha & Kala Velas) ---
        # 1. Aprakasha Grahas based on Sun's Longitude
        aprakasha = {}
        aprakasha['Dhuma'] = (sun_deg + 133.333333) % 360
        aprakasha['Vyatipata'] = (360 - aprakasha['Dhuma']) % 360
        aprakasha['Parivesha'] = (aprakasha['Vyatipata'] + 180) % 360
        aprakasha['Indrachap'] = (360 - aprakasha['Parivesha']) % 360
        aprakasha['Upaketu'] = (aprakasha['Indrachap'] + 16.666667) % 360

        for name, u_deg in aprakasha.items():
            u_sign_idx = int(u_deg / 30)
            u_house_idx = (u_sign_idx - asc_sign_index + 12) % 12
            houses_array[u_house_idx].append({
                'name': name, 'type': 'upagraha', 'abs_deg': u_deg, 'deg': u_deg % 30, 'house': u_house_idx + 1
            })

        # 2. Kala Velas based on Sunrise/Sunset segments
        geopos = (lon, lat, 0.0) 
        rise_flags = swe.CALC_RISE | swe.BIT_DISC_CENTER | swe.BIT_NO_REFRACTION
        set_flags = swe.CALC_SET | swe.BIT_DISC_CENTER | swe.BIT_NO_REFRACTION
        
        res_rise1 = swe.rise_trans(jd_ut - 1.0, swe.SUN, rise_flags, geopos)
        sunrise1 = res_rise1[1][0]
        
        res_set1 = swe.rise_trans(sunrise1, swe.SUN, set_flags, geopos)
        sunset1 = res_set1[1][0]
        
        res_rise2 = swe.rise_trans(sunset1, swe.SUN, rise_flags, geopos)
        sunrise2 = res_rise2[1][0]

        is_daytime = sunrise1 <= jd_ut < sunset1

        if is_daytime:
            start_jd = sunrise1
            end_jd = sunset1
            wk_day = swe.day_of_week(start_jd + 0.5) 
        else:
            if jd_ut >= sunset1:
                start_jd = sunset1
                end_jd = sunrise2
                wk_day = swe.day_of_week(sunrise1 + 0.5) 
            else:
                res_set_prev = swe.rise_trans(sunrise1 - 1.0, swe.SUN, set_flags, geopos)
                start_jd = res_set_prev[1][0]
                end_jd = sunrise1
                wk_day = swe.day_of_week(start_jd - 0.5)

        lord_index = (wk_day + 1) % 7 
        if not is_daytime:
            lord_index = (lord_index + 4) % 7
            
        segment_len = (end_jd - start_jd) / 8.0
        owners = [(lord_index + i) % 7 for i in range(7)]
        
        upagraha_segments = {
            'Kaal': owners.index(0), 'Mrityu': owners.index(2),
            'Ardhaprahar': owners.index(3), 'Yaamgandak': owners.index(4),
            'Gulika': owners.index(6)
        }
        
        for name, seg_idx in upagraha_segments.items():
            u_start_jd = start_jd + (seg_idx * segment_len)
            houses_u, ascmc_u = swe.houses_ex(u_start_jd, lat, lon, b'E', flags)
            u_deg = ascmc_u[0]
            u_sign_idx = int(u_deg / 30)
            u_house_idx = (u_sign_idx - asc_sign_index + 12) % 12
            houses_array[u_house_idx].append({
                'name': name, 'type': 'upagraha', 'abs_deg': u_deg, 'deg': u_deg % 30, 'house': u_house_idx + 1
            })

        return jsonify({
            'status': 'success', 
            'asc_sign': asc_sign_index + 1, 
            'asc_degree': asc_deg, 
            'houses': houses_array, 
            'grahas_data': grahas,
            'sav_data': sav_array,
            'vargas': varga_data # <--- NEW VARGA DATA OUTPUT
        })
        

    except Exception as e: 
        return jsonify({'status': 'error', 'message': str(e)}), 500


SERVER_PAID_API_KEY = "your api key"

# 1. COST-SAVING WATERFALL: Ordered from cheapest/fastest to most expensive.
# Over 95% of traffic will be absorbed by the Flash-Lite models at a fraction of a cent.
FALLBACK_MODELS = [
    "gemini-2.5-flash-lite",        # Extreme low cost, high speed
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",             # Standard cost
    "gemini-3.1-flash-preview",
    "gemini-2.0-flash",
    "gemini-2.5-pro",               # High cost, reliable fallback
    "gemini-3.1-pro-preview"
]

# 2. BUDGET PROTECTION: Simple in-memory rate tracker
# Note: This is a lightweight dictionary for a single-server setup. 
# If Eprashala scales to multiple server workers (like Gunicorn), you will want to swap this for Redis.
IP_USAGE_TRACKER = {}
DAILY_LIMIT_PER_IP = 30  # Adjust this number based on your budget comfort level

def is_ip_rate_limited(ip_address):
    """Returns True if the IP has exceeded the daily limit for the server key."""
    current_date = time.strftime("%Y-%m-%d")
    
    # Initialize or reset the daily count for this IP
    if ip_address not in IP_USAGE_TRACKER or IP_USAGE_TRACKER[ip_address]['date'] != current_date:
        IP_USAGE_TRACKER[ip_address] = {'date': current_date, 'count': 0}
    
    if IP_USAGE_TRACKER[ip_address]['count'] >= DAILY_LIMIT_PER_IP:
        return True
        
    # Increment the count
    IP_USAGE_TRACKER[ip_address]['count'] += 1
    return False

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    payload = request.json
    user_key = request.headers.get('X-Custom-Api-Key')
    client_ip = request.remote_addr
    
    keys_to_try = []
    
    # TIER 1: User's Custom Key (No cost to you, no rate limits applied)
    if user_key and len(user_key) > 10:
        keys_to_try.append({"type": "User Key", "key": user_key})
    
    # TIER 2: Your Paid Key (Costs you money, so we enforce the rate limit)
    else:
        if is_ip_rate_limited(client_ip):
            print(f"[RATE LIMIT] IP {client_ip} hit the daily limit.")
            # Plain text response for the TTS engine
            limit_msg = "You have reached your daily limit for free consultations. To continue seeking wisdom, please add your personal A I key in the settings menu."
            return jsonify({
                "candidates": [{"content": {"parts": [{"text": limit_msg}]}}]
            }), 200
            
    # Add the server key as the final safety net
    keys_to_try.append({"type": "Server Paid Key", "key": SERVER_PAID_API_KEY})

    last_error_message = "Unknown Error"

    # MATRIX LOOP: Iterate through Keys first, then Models
    for key_tier in keys_to_try:
        current_api_key = key_tier["key"]
        key_type = key_tier["type"]
        
        print(f"\n=== [AUTH] Initiating session with {key_type} ===")

        for model_name in FALLBACK_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={current_api_key}"
            
            try:
                print(f"[DEBUG] Attempting {model_name}...")
                
                # 15-second timeout to prevent UI hanging
                response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=15)
                status = response.status_code
                
                if status == 200:
                    print(f"[SUCCESS] {model_name} responded successfully via {key_type}.")
                    return jsonify(response.json()), 200
                
                data = response.json()
                gemini_error = data.get('error', {}).get('message', 'Unknown API Error')
                
                # FATAL KEY ERRORS (400, 401, 403)
                # If a key is invalid/unauthorized, we break and switch to the next key.
                if status in [400, 401, 403]:
                    print(f"[AUTH ERROR] {key_type} rejected ({status}): {gemini_error}. Switching to next key tier.")
                    last_error_message = f"{status} Error on {key_type}: {gemini_error}"
                    break 
                
                # SOFT ERRORS / QUOTA ERRORS (429, 500, 503)
                # If the key is good but the model is busy, we continue to the NEXT MODEL.
                print(f"[WARNING] {model_name} overloaded/quota hit ({status}). Trying next model...")
                last_error_message = f"{status} Error on {model_name}: {gemini_error}"
                continue

            except requests.exceptions.Timeout:
                print(f"[WARNING] {model_name} timed out after 15s. Trying next model...")
                last_error_message = f"Timeout on {model_name}"
                continue
                
            except Exception as e:
                print(f"[CRITICAL ERROR] Python Exception on {model_name}: {str(e)}")
                last_error_message = f"Internal Error on {model_name}: {str(e)}"
                continue
                
    # ALL FAILURES EXHAUSTED
    print(f"[FAILURE] All fallbacks exhausted. Last error: {last_error_message}")
    
    # Plain text fallback response for TTS engine compatibility
    custom_msg = "I am experiencing a disturbance in the cosmic connection. The cosmic energy is currently overwhelmed. Please grant me a moment and try speaking to me again."
    
    return jsonify({
        "candidates": [{"content": {"parts": [{"text": custom_msg}]}}]
    }), 200

# -----------------------------------------------------------------------------------------
# NEW: LIGHTWEIGHT GOCHAR (TRANSIT) ENDPOINT FOR EVENT PREDICTOR
# -----------------------------------------------------------------------------------------
@app.route('/api/gochar', methods=['POST', 'OPTIONS'])
def get_gochar_transits():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        data = request.json
        dates = data.get('dates', []) # Expects a list of timestamp strings or ISO dates
        lat = float(data.get('lat', 19.3654))
        lon = float(data.get('lon', 73.3685))
        
        results = {}
        flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        
        for date_str in dates:
            # Parse the incoming date (handling ISO strings from JS)
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            jd_ut = swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute/60.0)
            
            # We only need Jupiter (Blessing) and Saturn (Karma) for major event triggers
            guru_pos, _ = swe.calc_ut(jd_ut, swe.JUPITER, flags)
            shani_pos, _ = swe.calc_ut(jd_ut, swe.SATURN, flags)
            
            guru_sign = int(guru_pos[0] / 30) + 1
            shani_sign = int(shani_pos[0] / 30) + 1
            
            results[date_str] = {
                'Guru': guru_sign,
                'Shani': shani_sign
            }
            
        return jsonify({'status': 'success', 'transits': results}), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
# =========================================================================================
if __name__ == '__main__': 
    app.run(debug=True)
