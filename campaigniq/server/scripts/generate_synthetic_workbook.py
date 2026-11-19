"""Generate the synthetic Mahadhan CampaignIQ data workbook.

    python scripts/generate_synthetic_workbook.py            # writes data/seed/mahadhan_synthetic_data.xlsx

The workbook is the single source of demo data for the backend: `campaign_api.workbook` loads it into
SQLite on first start-up (and on demand), and its `ds.*` sheets become the uploaded datasets that the
web screens read through `useDataset()`.

Everything is SYNTHETIC. Volumes are calibrated to public, approximate figures (district crop areas,
mandi prices / MSP, agronomic doses, Mahadhan pack sizes) so the screens look like a real season, but
no number is Mahadhan's actual business data. Generation is deterministic (fixed random seed).
"""

from __future__ import annotations

import json
import math
import random
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVER_DIR))

from openpyxl import Workbook  # noqa: E402
from openpyxl.comments import Comment  # noqa: E402
from openpyxl.styles import Alignment, Font, PatternFill  # noqa: E402
from openpyxl.utils import get_column_letter  # noqa: E402

from campaign_api.engine import DEFAULT_CONFIG, SEGMENT_RULES, calculate_plan  # noqa: E402
from synthetic_extensions import (  # noqa: E402
    ACTIVITY_LINES, CROPS as SCREEN_CROPS, FY_VALUES, OBJECTIVE_THEME, PERIOD_VALUES, PRODUCT_CATEGORY,
    REGIONS, THEMES, build_campaign_rows, build_role_datasets,
)
from synthetic_extensions import (  # noqa: E402
    ACTIVITY_LINES, CROPS as SCREEN_CROPS, FY_VALUES, OBJECTIVE_THEME, PERIOD_VALUES, PRODUCT_CATEGORY,
    REGIONS, THEMES, build_campaign_rows, build_role_datasets,
)

OUTPUT = SERVER_DIR / "data" / "seed" / "mahadhan_synthetic_data.xlsx"
REFERENCE_DATE = date(2026, 11, 18)
WORKBOOK_VERSION = "1.0"
SOURCE_LABEL = "Synthetic data workbook v1.0 (synthetic, not Mahadhan actuals)"
rng = random.Random(20261118)

# --------------------------------------------------------------------------------------------------
# Masters
# --------------------------------------------------------------------------------------------------

STATES = {
    "maharashtra": ("Maharashtra", "West", "mr"),
    "karnataka": ("Karnataka", "South", "kn"),
    "telangana": ("Telangana", "South", "te"),
    "andhra-pradesh": ("Andhra Pradesh", "South", "te"),
    "gujarat": ("Gujarat", "West", "gu"),
    "madhya-pradesh": ("Madhya Pradesh", "West", "hi"),
    "rajasthan": ("Rajasthan", "West", "hi"),
    "tamil-nadu": ("Tamil Nadu", "South", "ta"),
    "uttar-pradesh": ("Uttar Pradesh", "North", "hi"),
    "punjab": ("Punjab", "North", "pa"),
    "haryana": ("Haryana", "North", "hi"),
    "odisha": ("Odisha", "East", "or"),
    "west-bengal": ("West Bengal", "East", "bn"),
    "bihar": ("Bihar", "East", "hi"),
}

# id, name, state, region, (lat, lng), talukas, crop area in hectares (approx. district statistics),
# cluster villages (lead taluka), mean penetration of potential (Mahadhan maturity, synthetic).
DISTRICTS = [
    ("nashik", "Nashik", "maharashtra", "North Maharashtra", (20.00, 73.79),
     ["Niphad", "Yeola", "Sinnar", "Chandwad", "Malegaon", "Baglan", "Dindori", "Kalwan"],
     {"Onion": 195000, "Grapes": 58000, "Tomato": 15000, "Pomegranate": 21000},
     ["Pimpalgaon Baswant", "Lasalgaon", "Ozar", "Vinchur"], 0.60),
    ("jalna", "Jalna", "maharashtra", "Marathwada", (19.84, 75.88),
     ["Ambad", "Partur", "Badnapur", "Jalna", "Mantha", "Bhokardan", "Jafrabad", "Ghansawangi"],
     {"Onion": 15000, "Cotton": 300000, "Soybean": 150000, "Maize": 60000},
     ["Wadi Gaon", "Dhanora", "Ambad HQ", "Pimpalgaon"], 0.30),
    ("dhule", "Dhule", "maharashtra", "North Maharashtra", (20.90, 74.77),
     ["Dhule", "Sakri", "Shirpur", "Shindkheda"],
     {"Onion": 25000, "Cotton": 230000, "Maize": 50000},
     ["Kusumba", "Songir", "Nagaon", "Arvi"], 0.35),
    ("jalgaon", "Jalgaon", "maharashtra", "North Maharashtra", (21.00, 75.56),
     ["Jalgaon", "Raver", "Yawal", "Chopda", "Pachora"],
     {"Banana": 48000, "Cotton": 550000, "Maize": 100000},
     ["Savda", "Faizpur", "Nhavi", "Raver HQ"], 0.42),
    ("ahmednagar", "Ahilyanagar", "maharashtra", "Western Maharashtra", (19.09, 74.74),
     ["Rahuri", "Sangamner", "Shrirampur", "Kopargaon", "Parner", "Nevasa"],
     {"Onion": 150000, "Sugarcane": 120000, "Pomegranate": 25000, "Soybean": 120000},
     ["Rahuri HQ", "Deolali Pravara", "Sonai", "Vambori"], 0.55),
    ("pune", "Pune", "maharashtra", "Western Maharashtra", (18.52, 73.86),
     ["Junnar", "Ambegaon", "Khed", "Shirur", "Baramati", "Indapur"],
     {"Onion": 70000, "Sugarcane": 120000, "Tomato": 15000},
     ["Narayangaon", "Otur", "Manchar", "Alephata"], 0.58),
    ("solapur", "Solapur", "maharashtra", "Western Maharashtra", (17.66, 75.91),
     ["Pandharpur", "Sangola", "Mangalwedha", "Mohol", "Malshiras"],
     {"Pomegranate": 35000, "Sugarcane": 160000, "Onion": 60000, "Grapes": 15000},
     ["Sangola HQ", "Mahud", "Kasegaon", "Jawala"], 0.50),
    ("sangli", "Sangli", "maharashtra", "Western Maharashtra", (16.85, 74.58),
     ["Miraj", "Tasgaon", "Walwa", "Jat", "Palus"],
     {"Grapes": 30000, "Sugarcane": 120000, "Pomegranate": 12000},
     ["Tasgaon HQ", "Manjarde", "Savlaj", "Kavathe Ekand"], 0.55),
    ("kolhapur", "Kolhapur", "maharashtra", "Western Maharashtra", (16.70, 74.24),
     ["Karveer", "Hatkanangale", "Shirol", "Kagal"],
     {"Sugarcane": 150000, "Soybean": 50000},
     ["Hupari", "Kurundwad", "Shirol HQ", "Jaysingpur"], 0.50),
    ("satara", "Satara", "maharashtra", "Western Maharashtra", (17.68, 74.00),
     ["Karad", "Koregaon", "Phaltan", "Khatav"],
     {"Sugarcane": 90000, "Soybean": 70000},
     ["Karad HQ", "Umbraj", "Masur", "Rahimatpur"], 0.45),
    ("chh-sambhajinagar", "Chh. Sambhajinagar", "maharashtra", "Marathwada", (19.88, 75.34),
     ["Paithan", "Vaijapur", "Gangapur", "Kannad", "Sillod"],
     {"Cotton": 400000, "Onion": 30000, "Maize": 180000, "Soybean": 50000},
     ["Paithan HQ", "Bidkin", "Pachod", "Vihamandva"], 0.35),
    ("beed", "Beed", "maharashtra", "Marathwada", (18.99, 75.76),
     ["Beed", "Georai", "Majalgaon", "Ambajogai", "Kaij"],
     {"Cotton": 350000, "Soybean": 250000, "Sugarcane": 60000},
     ["Georai HQ", "Talwada", "Umapur", "Chakalamba"], 0.25),
    ("latur", "Latur", "maharashtra", "Marathwada", (18.40, 76.56),
     ["Latur", "Ausa", "Nilanga", "Udgir"],
     {"Soybean": 450000, "Sugarcane": 50000},
     ["Ausa HQ", "Killari", "Lamjana", "Matola"], 0.30),
    ("belagavi", "Belagavi", "karnataka", "North Karnataka", (15.85, 74.50),
     ["Athani", "Gokak", "Chikkodi", "Raibag", "Belagavi"],
     {"Sugarcane": 250000, "Maize": 150000, "Soybean": 100000},
     ["Athani HQ", "Ugar", "Kagwad", "Telsang"], 0.35),
    ("vijayapura", "Vijayapura", "karnataka", "North Karnataka", (16.83, 75.71),
     ["Vijayapura", "Indi", "Sindagi", "Basavana Bagewadi"],
     {"Grapes": 12000, "Pomegranate": 10000, "Onion": 20000},
     ["Tikota", "Babaleshwar", "Indi HQ", "Horti"], 0.30),
    ("bagalkot", "Bagalkot", "karnataka", "North Karnataka", (16.18, 75.70),
     ["Jamkhandi", "Mudhol", "Bilagi"],
     {"Sugarcane": 120000, "Pomegranate": 8000},
     ["Jamkhandi HQ", "Savalagi", "Terdal", "Rabkavi"], 0.25),
    ("mandya", "Mandya", "karnataka", "South Karnataka", (12.52, 76.90),
     ["Mandya", "Maddur", "Pandavapura"],
     {"Sugarcane": 40000},
     ["Maddur HQ", "Besagarahalli", "Koppa", "Pandavapura HQ"], 0.20),
    ("adilabad", "Adilabad", "telangana", "Telangana", (19.67, 78.53),
     ["Adilabad", "Boath", "Utnoor"],
     {"Cotton": 160000, "Soybean": 50000},
     ["Boath HQ", "Ichoda", "Neradigonda", "Utnoor HQ"], 0.15),
    ("anantapur", "Anantapur", "andhra-pradesh", "Rayalaseema", (14.68, 77.60),
     ["Anantapur", "Dharmavaram", "Kadiri", "Kalyandurg"],
     {"Groundnut": 250000, "Tomato": 15000, "Onion": 8000},
     ["Kalyandurg HQ", "Kambadur", "Beluguppa", "Settur"], 0.15),
    ("bhavnagar", "Bhavnagar", "gujarat", "Saurashtra", (21.76, 72.15),
     ["Mahuva", "Talaja", "Palitana"],
     {"Onion": 35000, "Groundnut": 80000, "Cotton": 250000},
     ["Mahuva HQ", "Talaja HQ", "Bagdana", "Kalsar"], 0.12),
]
DISTRICTS.extend([
    ("indore", "Indore", "madhya-pradesh", "Malwa", (22.72, 75.86), ["Indore", "Depalpur", "Sanwer"], {"Onion": 18000, "Soybean": 100000, "Maize": 50000}, ["Depalpur", "Sanwer", "Mhow", "Rau"], .35),
    ("jaipur", "Jaipur", "rajasthan", "Jaipur Division", (26.91, 75.79), ["Jaipur", "Chomu", "Sanganer"], {"Onion": 22000, "Maize": 60000, "Cotton": 30000}, ["Chomu", "Sanganer", "Amber", "Phagi"], .30),
    ("coimbatore", "Coimbatore", "tamil-nadu", "Kongu Nadu", (11.02, 76.96), ["Coimbatore", "Pollachi", "Sulur"], {"Banana": 30000, "Cotton": 45000, "Sugarcane": 35000}, ["Pollachi", "Mettupalayam", "Sulur", "Annur"], .38),
    ("lucknow", "Lucknow", "uttar-pradesh", "Awadh", (26.85, 80.95), ["Lucknow", "Malihabad", "Mohanlalganj"], {"Onion": 16000, "Maize": 40000, "Soybean": 25000}, ["Malihabad", "Bakshi Ka Talab", "Mohanlalganj", "Sarojini Nagar"], .27),
    ("ludhiana", "Ludhiana", "punjab", "Central Punjab", (30.90, 75.85), ["Ludhiana", "Jagraon", "Samrala"], {"Onion": 12000, "Maize": 45000, "Cotton": 18000}, ["Jagraon", "Samrala", "Payal", "Khanna"], .33),
    ("karnal", "Karnal", "haryana", "Haryana", (29.69, 76.99), ["Karnal", "Indri", "Assandh"], {"Onion": 14000, "Maize": 40000, "Cotton": 18000}, ["Indri", "Assandh", "Gharaunda", "Nilokheri"], .31),
    ("cuttack", "Cuttack", "odisha", "Coastal Odisha", (20.46, 85.88), ["Cuttack", "Niali", "Salipur"], {"Onion": 11000, "Groundnut": 35000, "Maize": 22000}, ["Niali", "Salipur", "Tangi", "Banki"], .24),
    ("hooghly", "Hooghly", "west-bengal", "Burdwan Division", (22.90, 88.40), ["Chinsurah", "Arambagh", "Serampore"], {"Onion": 9000, "Tomato": 14000, "Maize": 21000}, ["Chinsurah", "Arambagh", "Serampore", "Tarakeswar"], .22),
    ("patna", "Patna", "bihar", "Patna Division", (25.61, 85.14), ["Patna", "Barh", "Paliganj"], {"Onion": 10000, "Maize": 26000, "Soybean": 18000}, ["Barh", "Paliganj", "Bikram", "Daniawan"], .21),
])
DISTRICT_BY_ID = {d[0]: d for d in DISTRICTS}

# The nine marketing units of the original seed keep their names and onion figures (golden test case).
PINNED_MUS = {
    # name: (district, taluka, onion acres, amp, treated, competition, villages)
    "Niphad West": ("nashik", "Niphad", 3000, .30, .05, "Low", 10),
    "Yeola North": ("nashik", "Yeola", 3833, .30, .072, "Low", 12),
    "Niphad East": ("nashik", "Niphad", 4400, .30, .132, "Medium", 12),
    "Sinnar East": ("nashik", "Sinnar", 2600, .30, .114, "Medium", 10),
    "Chandwad": ("nashik", "Chandwad", 3400, .30, .174, "Medium", 11),
    "Malegaon": ("nashik", "Malegaon", 2333, .30, .189, "High", 10),
    "Baglan": ("nashik", "Baglan", 2867, .30, .234, "High", 10),
    "Dhule Central": ("dhule", "Dhule", 3100, .30, .075, "Low", 12),
    "Jalgaon East": ("jalgaon", "Jalgaon", 3250, .30, .15, "Medium", 11),
}

CROPS = [
    # name, stage anchor, stages (name, start_day, end_day)
    ("Banana", "planting", [("Establishment", 0, 60), ("Vegetative growth", 61, 180), ("Shooting", 181, 240), ("Bunch development", 241, 330), ("Harvest", 331, 365)]),
    ("Cotton", "sowing", [("Emergence", 0, 20), ("Vegetative growth", 21, 50), ("Square formation", 51, 75), ("Flowering & boll development", 76, 120), ("Boll opening", 121, 160)]),
    ("Grapes", "pruning", [("Bud break", 0, 20), ("Shoot growth", 21, 45), ("Flowering & fruit set", 46, 70), ("Berry development", 71, 110), ("Ripening", 111, 150)]),
    ("Groundnut", "sowing", [("Emergence", 0, 15), ("Vegetative growth", 16, 35), ("Pegging", 36, 60), ("Pod development", 61, 95), ("Maturity", 96, 115)]),
    ("Maize", "sowing", [("Emergence", 0, 15), ("Vegetative growth", 16, 45), ("Tasseling & silking", 46, 65), ("Grain filling", 66, 95), ("Maturity", 96, 110)]),
    ("Onion", "transplanting", [("Establishment", 0, 20), ("Vegetative growth", 21, 45), ("Bulb initiation", 46, 70), ("Bulb development", 71, 100), ("Maturity", 101, 125)]),
    ("Pomegranate", "pruning", [("Bahar treatment", 0, 25), ("Flowering", 26, 60), ("Fruit set", 61, 90), ("Fruit development", 91, 150), ("Maturity", 151, 180)]),
    ("Soybean", "sowing", [("Emergence", 0, 15), ("Vegetative growth", 16, 40), ("Flowering", 41, 60), ("Pod filling", 61, 90), ("Maturity", 91, 105)]),
    ("Sugarcane", "planting", [("Germination", 0, 45), ("Tillering", 46, 120), ("Grand growth", 121, 270), ("Maturity", 271, 365)]),
    ("Tomato", "transplanting", [("Establishment", 0, 20), ("Vegetative growth", 21, 40), ("Flowering", 41, 60), ("Fruiting", 61, 100), ("Harvest", 101, 140)]),
]
CROP_NAMES = [c[0] for c in CROPS]

# Agronomy / market calibration per crop: base AMP share, avg crop area per farmer (acres),
# control yield (q/acre), farm-gate price (Rs/quintal, ~2025-26 mandi / MSP level), soil deficiencies.
CROP_PARAMS = {
    "Onion": dict(amp=.30, farm=2.0, yield_q=95, price=1900, soil=["Sulphur", "Zinc"]),
    "Grapes": dict(amp=.45, farm=2.5, yield_q=110, price=4500, soil=["Potassium", "Magnesium", "Boron"]),
    "Pomegranate": dict(amp=.42, farm=2.2, yield_q=45, price=7500, soil=["Zinc", "Boron", "Calcium"]),
    "Sugarcane": dict(amp=.32, farm=2.4, yield_q=420, price=340, soil=["Zinc", "Iron", "Sulphur"]),
    "Cotton": dict(amp=.22, farm=3.2, yield_q=9, price=7500, soil=["Sulphur", "Zinc", "Boron"]),
    "Soybean": dict(amp=.20, farm=3.0, yield_q=8.5, price=4900, soil=["Sulphur", "Zinc"]),
    "Maize": dict(amp=.22, farm=2.5, yield_q=28, price=2150, soil=["Zinc"]),
    "Groundnut": dict(amp=.25, farm=2.6, yield_q=9, price=6500, soil=["Sulphur", "Calcium", "Boron"]),
    "Tomato": dict(amp=.35, farm=1.5, yield_q=180, price=1400, soil=["Calcium", "Boron"]),
    "Banana": dict(amp=.38, farm=2.0, yield_q=280, price=1500, soil=["Potassium", "Zinc", "Magnesium"]),
}

RABI_CROPS = {"Onion", "Grapes", "Pomegranate", "Sugarcane", "Banana", "Tomato", "Maize", "Groundnut"}
KHARIF_CROPS = {"Cotton", "Soybean", "Maize", "Onion", "Tomato", "Groundnut", "Pomegranate", "Sugarcane", "Banana"}

# Anchor-date windows (month, day) -> (month, day), by season type.
ANCHOR_WINDOWS = {
    "rabi": {"Onion": ((12, 5), (13, 5)), "Grapes": ((10, 1), (10, 25)), "Pomegranate": ((9, 25), (10, 20)),
             "Sugarcane": ((10, 15), (11, 25)), "Banana": ((10, 10), (11, 15)), "Tomato": ((11, 10), (12, 20)),
             "Maize": ((11, 1), (11, 25)), "Groundnut": ((13, 10), (14, 5))},
    "kharif": {"Cotton": ((6, 10), (7, 5)), "Soybean": ((6, 20), (7, 10)), "Maize": ((6, 20), (7, 10)),
               "Onion": ((8, 1), (8, 25)), "Tomato": ((7, 1), (7, 30)), "Groundnut": ((6, 25), (7, 15)),
               "Pomegranate": ((6, 1), (6, 25)), "Sugarcane": ((7, 15), (8, 15)), "Banana": ((6, 5), (6, 30))},
}

# season id, name, type, start, end, budget lock, base year for anchors, filter id (masters.json)
SEASONS = [
    (1, "Rabi 2025-26", "rabi", date(2025, 10, 1), date(2026, 3, 31), date(2025, 11, 30), 2025, "rabi-2025-26"),
    (2, "Kharif 2026", "kharif", date(2026, 6, 1), date(2026, 10, 31), date(2026, 5, 31), 2026, "kharif-2026"),
    (3, "Late Rabi 2026-27", "rabi", date(2026, 10, 1), date(2027, 3, 31), date(2026, 11, 30), 2026, "late-rabi-2026-27"),
]
CURRENT_SEASON = 3

# Products (approximate MRP per pack, Rs; replace with the current Mahadhan price list).
# id, name, category, family key (products.json), pack kg, price, {crop: (dose packs/acre, stage index)}
PRODUCTS = []
_pid = 1
# Croptek basal + top-dress dose (50 kg bags per acre), typical complex-fertiliser rates per crop.
for crop, dose, stage in [("Onion", 3.0, 0), ("Grapes", 4.0, 0), ("Pomegranate", 3.0, 0), ("Sugarcane", 4.0, 0),
                          ("Cotton", 2.0, 1), ("Soybean", 2.0, 0), ("Maize", 2.0, 0), ("Groundnut", 2.0, 0),
                          ("Tomato", 3.0, 0), ("Banana", 4.0, 0)]:
    price = {"Sugarcane": 1750, "Grapes": 1950, "Pomegranate": 1950, "Banana": 1900}.get(crop, 1850)
    PRODUCTS.append((_pid, f"Croptek {crop}", "Croptek", "croptek", 50, price, {crop: (dose, stage)}))
    _pid += 1
PRODUCTS += [
    (11, "Smartek 10:26:26", "Smartek", "smartek", 50, 1725,
     {"Sugarcane": (2.0, 0), "Cotton": (1.5, 0), "Soybean": (1.0, 0), "Maize": (1.5, 0), "Banana": (2.0, 0), "Groundnut": (1.0, 0)}),
    (12, "Mahadhan 24:24:0", "Complex NP", "mahadhan-24-24-0", 50, 1650,
     {"Onion": (1.5, 0), "Cotton": (1.0, 0), "Soybean": (1.0, 0), "Maize": (1.5, 0), "Sugarcane": (2.0, 1)}),
    (13, "Mahadhan Bensulf 90", "Bensulf", "bensulf", 10, 1050,
     {"Onion": (0.6, 2), "Groundnut": (0.6, 2), "Soybean": (0.5, 1), "Cotton": (0.5, 2), "Sugarcane": (0.8, 1), "Grapes": (0.6, 1)}),
    (14, "Solutek 19:19:19", "Solutek", "solutek", 25, 3600,
     {"Grapes": (0.8, 1), "Pomegranate": (0.8, 1), "Tomato": (0.6, 2), "Banana": (0.6, 1), "Onion": (0.4, 1)}),
    (15, "Solutek 0:52:34", "Solutek", "solutek", 25, 4600,
     {"Grapes": (0.6, 2), "Pomegranate": (0.6, 2)}),
    (16, "Solutek 13:0:45", "Solutek", "solutek", 25, 3900,
     {"Banana": (0.8, 3), "Tomato": (0.6, 3), "Grapes": (0.4, 3)}),
]
CROPTEK_BY_CROP = {p[1].replace("Croptek ", ""): p for p in PRODUCTS if p[2] == "Croptek"}

ACTIVITIES = [
    # name, kind, r, k, unit cost, split pre/on/post, bucket  (same business defaults as the engine seed)
    ("Crop demo with control strip", "demo", 25, .12, 6500, 0, 1, 0, "proven"),
    ("Early field day + harvest days", "field_day", 150, .05, 20000, 1 / 3, 0, 2 / 3, "proven"),
    ("Group farmer meeting (8–10)", "group_meeting", 10, .10, 1500, .65, .35, 0, "proven"),
    ("One-to-one contact", "one_to_one", 1, .15, 100, .65, .35, 0, "proven"),
    ("Large farmer meeting (75–100)", "large_meeting", 90, .04, 12000, .75, .25, 0, "proven"),
    ("Multiplier meet", "multiplier_meet", 60, .06, 15000, 1, 0, 0, "scaling"),
    ("HVC / branded van campaign", "hvc", 300, .02, 25000, .25, .75, 0, "proven"),
    ("Tray pe Charcha (retailer counter)", "retailer", 30, .08, 3000, .3, .7, 0, "scaling"),
    ("Wall painting / hoarding", "wall_painting", 500, .005, 4000, .5, .5, 0, "proven"),
    ("Key influencer engagement", "influencer", 20, .05, 5000, .4, .4, .2, "pilot"),
]
ACT_ID = {a[0]: i + 1 for i, a in enumerate(ACTIVITIES)}
ACT_BY_ID = {i + 1: a for i, a in enumerate(ACTIVITIES)}
PLAYBOOKS = {
    "Emerging": {"Crop demo with control strip": .40, "Early field day + harvest days": .30, "Group farmer meeting (8–10)": .20, "One-to-one contact": .10},
    "Growing": {"Group farmer meeting (8–10)": .25, "Large farmer meeting (75–100)": .20, "Key influencer engagement": .15, "Crop demo with control strip": .20, "Tray pe Charcha (retailer counter)": .20},
    "Maturing": {"HVC / branded van campaign": .35, "Tray pe Charcha (retailer counter)": .30, "Large farmer meeting (75–100)": .20, "Wall painting / hoarding": .15},
    "Matured": {"Wall painting / hoarding": .40, "Tray pe Charcha (retailer counter)": .35, "HVC / branded van campaign": .25},
}
CONFIG = {
    "max_activities_per_mdo_week": "6", "active_weeks": "16", "retention_focus": "0.2", "amber_factor": "0.9",
    "contingency_pct": "0", "innovative_farmers_mapped": "null", "demo_farmers_per_village": "3",
    "callback_sample_pct": "0.1", "prior_strength": "50", "dealer_lead_time_days": "15",
    "rainfall_risk_threshold_pct": "-30", "rainfall_risk_window_days": "15", "pre_season_days": "120",
    "on_season_days": "90", "post_season_days": "60", "skip_sundays": "true", "envelope_tolerance_pct": "0.05",
    "attendance_floor_pct": "0.5", "max_cost_multiple": "1.2", "late_report_days": "3", "market_stale_days": "90",
    "envelope_split": '{"proven": 0.7, "scaling": 0.2, "pilot": 0.1}',
}

FIRST_NAMES = {
    "mr": ["Ramesh", "Suresh", "Sunil", "Anil", "Vijay", "Santosh", "Dnyaneshwar", "Balasaheb", "Prakash", "Dattatray",
           "Shivaji", "Sanjay", "Ganesh", "Vitthal", "Bhausaheb", "Sachin", "Rahul", "Nitin", "Ashok", "Kailas", "Sharad",
           "Dilip", "Madhukar", "Rajendra", "Sopan", "Pandurang", "Laxman", "Tukaram", "Mangesh", "Yogesh",
           "Sunita", "Sangita", "Manisha", "Lata", "Rekha", "Kavita"],
    "kn": ["Basavaraj", "Mallikarjun", "Siddappa", "Shivanand", "Ramappa", "Mahantesh", "Hanamant", "Prakash", "Shankar",
           "Girish", "Manjunath", "Channappa", "Shobha", "Savitri"],
    "te": ["Srinivas", "Venkatesh", "Ramesh", "Narasimha", "Raju", "Mahesh", "Krishna", "Anjaneyulu", "Ravi", "Suresh",
           "Lakshmi", "Padma"],
    "gu": ["Bhavesh", "Mahesh", "Ramesh", "Hitesh", "Jayesh", "Kantibhai", "Vallabhbhai", "Jagdish", "Paresh", "Dinesh",
           "Hansa", "Geeta"],
}
SURNAMES = {
    "mr": ["Patil", "Jadhav", "Deshmukh", "Shinde", "Pawar", "More", "Kale", "Gaikwad", "Chavan", "Bhosale", "Kadam",
           "Salunkhe", "Wagh", "Thorat", "Sonawane", "Kulkarni", "Aher", "Darade", "Gite", "Sangle"],
    "kn": ["Patil", "Gowda", "Hiremath", "Kambar", "Naik", "Biradar", "Kulkarni", "Desai", "Pujari", "Hosamani"],
    "te": ["Reddy", "Rao", "Naidu", "Goud", "Yadav", "Chowdary"],
    "gu": ["Patel", "Solanki", "Chauhan", "Parmar", "Vaghela", "Makwana", "Gohil"],
}
DEALER_NAMES = {
    "mr": ["Krushi Seva Kendra", "Shree Ganesh Agro", "Kisan Agro Agencies", "Om Sai Fertilisers", "Jai Kisan Traders",
           "Mahalaxmi Agro Centre", "Annapurna Krushi Bhandar", "Shetkari Agro Mart", "Samarth Agro Services", "Shivshakti Krushi Kendra"],
    "kn": ["Sri Basaveshwara Agro Kendra", "Raitha Mitra Agro", "Sri Siddeshwara Fertilisers", "Annadata Agro Centre", "Kisan Agro Point"],
    "te": ["Sri Lakshmi Agro Agencies", "Rythu Seva Kendram", "Venkateswara Fertilisers", "Kisan Agro Point"],
    "gu": ["Khedut Agro Centre", "Jalaram Agro", "Shree Krishna Fertilisers", "Kisan Seva Kendra"],
}


def lang_of(state_id: str) -> str:
    return STATES[state_id][2]


def person(lang: str, initial: bool = False) -> str:
    lang = lang if lang in FIRST_NAMES else {"hi": "mr", "pa": "mr", "or": "mr", "bn": "mr", "ta": "te"}.get(lang, "mr")
    first = rng.choice(FIRST_NAMES[lang])
    last = rng.choice(SURNAMES[lang])
    return f"{first[0]}. {last}" if initial else f"{first} {last}"


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def anchor_for(season, crop: str) -> date:
    (m1, d1), (m2, d2) = ANCHOR_WINDOWS[season[2]][crop]
    base = season[6]
    start = date(base + (m1 - 1) // 12, (m1 - 1) % 12 + 1, d1)
    end = date(base + (m2 - 1) // 12, (m2 - 1) % 12 + 1, d2)
    return start + timedelta(days=rng.randint(0, (end - start).days))


def cr(value_rs: float) -> str:
    return f"₹{value_rs / 1e7:.2f} Cr"


def lakh(value_rs: float) -> str:
    """Indian display convention: lakh below one crore, crore above."""
    return f"₹{value_rs / 1e5:.0f} L" if value_rs < 1e7 else f"₹{value_rs / 1e7:.1f} Cr"


def short_date(value: date) -> str:
    return value.strftime("%d %b '%y")


# --------------------------------------------------------------------------------------------------
# Build tables
# --------------------------------------------------------------------------------------------------

T: dict[str, list[dict]] = defaultdict(list)

# geography: state -> district -> MU
geo_id = 0
state_geo: dict[str, int] = {}
district_geo: dict[str, int] = {}
for state_id, (state_name, _zone, _lang) in STATES.items():
    geo_id += 1
    state_geo[state_id] = geo_id
    T["geo_unit"].append(dict(id=geo_id, name=state_name, level="state", parent_id=None))
for d in DISTRICTS:
    geo_id += 1
    district_geo[d[0]] = geo_id
    T["geo_unit"].append(dict(id=geo_id, name=d[1], level="district", parent_id=state_geo[d[2]]))

MUS = []  # dicts with id, name, district, taluka, villages, mdo_count, lat, lng
for name, (district, taluka, *_rest) in PINNED_MUS.items():
    MUS.append(dict(name=name, district=district, taluka=taluka, villages=_rest[-1]))
pinned_talukas = {(v[0], v[1]) for v in PINNED_MUS.values()}
for d in DISTRICTS:
    for taluka in d[5]:
        if (d[0], taluka) in pinned_talukas:
            continue
        MUS.append(dict(name=taluka, district=d[0], taluka=taluka, villages=rng.randint(10, 14)))
for index, mu in enumerate(MUS, start=1):
    d = DISTRICT_BY_ID[mu["district"]]
    geo_id += 1
    mu.update(id=index, geo=geo_id, lat=round(d[4][0] + rng.uniform(-.25, .25), 4), lng=round(d[4][1] + rng.uniform(-.25, .25), 4))
    mu["mdo_count"] = 1 if mu["name"] == "Niphad West" else (2 if mu["villages"] >= 13 else 1)
    T["geo_unit"].append(dict(id=geo_id, name=mu["name"], level="mu", parent_id=district_geo[mu["district"]]))
MU_BY_ID = {mu["id"]: mu for mu in MUS}

# field force: zone -> region -> territory (district) -> MDO per MU
staff_id = 0
staff_by_district: dict[str, list[dict]] = defaultdict(list)
zones_done, regions_done = set(), set()
for d in DISTRICTS:
    state_name, zone, lang = STATES[d[2]]
    if zone not in zones_done:
        zones_done.add(zone)
        staff_id += 1
        T["field_staff"].append(dict(id=staff_id, name=person("mr"), role="Zonal Manager", zone=f"{zone} Zone", region=None,
                                     territory=None, district=None, mu_id=None, phone=f"+9100001{staff_id:05d}"))
    if d[3] not in regions_done:
        regions_done.add(d[3])
        staff_id += 1
        T["field_staff"].append(dict(id=staff_id, name=person(lang), role="Regional Manager", zone=f"{zone} Zone", region=d[3],
                                     territory=None, district=None, mu_id=None, phone=f"+9100001{staff_id:05d}"))
    staff_id += 1
    tm = dict(id=staff_id, name=person(lang), role="Field Sales Manager", zone=f"{zone} Zone", region=d[3], territory=d[1],
              district=d[1], mu_id=None, phone=f"+9100001{staff_id:05d}")
    T["field_staff"].append(tm)
    staff_by_district[d[0]].append(tm)
for mu in MUS:
    d = DISTRICT_BY_ID[mu["district"]]
    state_name, zone, lang = STATES[d[2]]
    for i in range(mu["mdo_count"]):
        staff_id += 1
        mdo = dict(id=staff_id, name=person(lang), role="MDO (Market Development Officer)", zone=f"{zone} Zone", region=d[3],
                   territory=d[1], district=d[1], mu_id=mu["id"], phone=f"+9100001{staff_id:05d}")
        T["field_staff"].append(mdo)
        staff_by_district[mu["district"]].append(mdo)
        if i == 0:
            mu["mdo_user_id"] = staff_id

for mu in MUS:
    T["mu"].append(dict(id=mu["id"], geo_unit_id=mu["geo"], name=mu["name"], taluka=mu["taluka"],
                        district_name=DISTRICT_BY_ID[mu["district"]][1], villages_count=mu["villages"],
                        mdo_count=mu["mdo_count"], mdo_user_id=mu.get("mdo_user_id"), lat=mu["lat"], lng=mu["lng"]))

# crops + stages
CROP_ID = {}
STAGE_IDS: dict[str, list[int]] = {}
stage_id = 0
for index, (name, anchor, stages) in enumerate(CROPS, start=1):
    CROP_ID[name] = index
    T["crop"].append(dict(id=index, name=name, stage_anchor=anchor))
    STAGE_IDS[name] = []
    for stage_name, start, end in stages:
        stage_id += 1
        STAGE_IDS[name].append(stage_id)
        T["crop_stage"].append(dict(id=stage_id, crop_id=index, crop_name=name, stage_name=stage_name, start_day=start, end_day=end))

for s in SEASONS:
    T["season"].append(dict(id=s[0], name=s[1], start_date=s[3], end_date=s[4], budget_lock_date=s[5], filter_id=s[7]))

for p in PRODUCTS:
    T["product"].append(dict(id=p[0], name=p[1], category=PRODUCT_CATEGORY.get(p[2], p[2]), filter_id=p[3], pack_kg=p[4], price_per_pack=p[5], placeholder=1))
    for crop, (dose, stage_index) in p[6].items():
        stages = STAGE_IDS[crop]
        T["crop_product_dose"].append(dict(crop_id=CROP_ID[crop], product_id=p[0], stage_id=stages[min(stage_index, len(stages) - 1)],
                                           dose_packs_per_acre=dose, crop_name=crop, product_name=p[1]))
DOSE = {(row["crop_id"], row["product_id"]): row["dose_packs_per_acre"] for row in T["crop_product_dose"]}
PRODUCT_BY_ID = {p[0]: p for p in PRODUCTS}

for rule in SEGMENT_RULES:
    T["segment_rule"].append(dict(segment=rule["segment"], min_pen=rule["min_pen"],
                                  max_pen=None if rule["max_pen"] == float("inf") else rule["max_pen"],
                                  objective=rule["objective"], spend_cap_pct=rule["spend_cap_pct"]))
for index, a in enumerate(ACTIVITIES, start=1):
    T["activity_type"].append(dict(id=index, name=a[0], kind=a[1], r_default=a[2], k_default=a[3], unit_cost=a[4],
                                   phase_split_pre=round(a[5], 6), phase_split_on=round(a[6], 6), phase_split_post=round(a[7], 6),
                                   evidence_required=1 if a[1] == "demo" else 0, bucket=a[8]))
for segment, mix in PLAYBOOKS.items():
    for activity, share in mix.items():
        T["playbook"].append(dict(segment=segment, activity_type_id=ACT_ID[activity], activity_name=activity, share_pct=share))
for key, value in CONFIG.items():
    T["config"].append(dict(key=key, value=value))

# market data ---------------------------------------------------------------------------------------
district_rain = {}
for d in DISTRICTS:
    district_rain[d[0]] = {1: rng.uniform(-15, 20), 2: rng.uniform(-25, 25), 3: rng.uniform(-18, 22)}
for district_id in ("anantapur", "bhavnagar", "beed", "solapur", "belagavi"):  # rabi moisture-deficit districts
    district_rain[district_id][3] = rng.uniform(-38, -31)

MARKET = {}  # (mu_id, crop, season_id) -> row
for mu in MUS:
    d = DISTRICT_BY_ID[mu["district"]]
    n_talukas = len(d[5])
    pinned = PINNED_MUS.get(mu["name"])
    for crop, area_ha in d[6].items():
        params = CROP_PARAMS[crop]
        base_acres = area_ha * 2.471 / n_talukas * (mu["villages"] / 130) * rng.uniform(.75, 1.25)
        amp = clamp(params["amp"] + rng.uniform(-.05, .05), .12, .65)
        penetration = clamp(rng.gauss(d[8], .17), .04, .96)
        competition = rng.choice(["Low", "Medium", "Medium", "High"])
        dealers = rng.randint(4, 18)
        farm = round(params["farm"] * rng.uniform(.85, 1.15), 1)
        for s in SEASONS:
            season_id = s[0]
            growth = {1: rng.uniform(.65, .85), 2: rng.uniform(.80, .95), 3: 1.0}[season_id]
            acres = round(base_acres * rng.uniform(.92, 1.08))
            treated = amp * penetration * growth
            row_amp, row_comp, row_farm = amp, competition, farm
            if pinned and crop == "Onion":
                _d, _t, p_acres, p_amp, p_treated, p_comp, _v = pinned
                row_amp, row_comp = p_amp, p_comp
                acres = p_acres if season_id == CURRENT_SEASON else round(p_acres * rng.uniform(.92, 1.05))
                treated = p_treated if season_id == CURRENT_SEASON else p_treated * growth
                row_farm = 2.0
            as_of = (s[3] + timedelta(days=rng.randint(0, 40)))
            if season_id == CURRENT_SEASON:
                as_of = min(as_of, REFERENCE_DATE - timedelta(days=3))
            row = dict(
                mu_id=mu["id"], crop_id=CROP_ID[crop], season_id=season_id, mu_name=mu["name"], district=d[1], crop_name=crop,
                season_name=s[1], crop_area_acres=acres, amp_pct=round(row_amp, 4), current_treated_pct=round(treated, 4),
                avg_area_per_farmer=row_farm, competition_note=row_comp,
                soil_deficiency_json='["' + '", "'.join(params["soil"][: rng.randint(1, len(params["soil"]))]) + '"]',
                rainfall_dev_pct=round(district_rain[d[0]][season_id] + rng.uniform(-5, 5)),
                crop_price=round(params["price"] * rng.uniform(.92, 1.08) / 10) * 10, active_dealers=dealers,
                source="Synthetic · calibrated to approx. district crop statistics", as_of_date=as_of,
            )
            MARKET[(mu["id"], crop, season_id)] = row
            T["market_data"].append(row)

# campaign plans -------------------------------------------------------------------------------------
RULES = SEGMENT_RULES
CONFIG_VALUES = {**DEFAULT_CONFIG}
for key, value in CONFIG.items():
    if key in CONFIG_VALUES:
        CONFIG_VALUES[key] = json.loads(value)


def segment_of(penetration: float) -> str:
    return next((r["segment"] for r in RULES if r["min_pen"] <= penetration < r["max_pen"]), RULES[-1]["segment"])


def playbook_lines(segment: str) -> list[dict]:
    lines = []
    for activity, share in PLAYBOOKS[segment].items():
        a = ACTIVITIES[ACT_ID[activity] - 1]
        lines.append({"share_pct": share, "activity": {
            "activity_type_id": ACT_ID[activity], "name": a[0], "kind": a[1], "r": a[2], "k": a[3], "c": a[4],
            "phase_split_pre": a[5], "phase_split_on": a[6], "phase_split_post": a[7], "bucket": a[8]}})
    return sorted(lines, key=lambda line: line["activity"]["activity_type_id"])


def run_plan(market: dict, mu: dict, product: tuple, target: float) -> dict:
    penetration = market["current_treated_pct"] / market["amp_pct"]
    config = {**CONFIG_VALUES, "mdo_count": mu["mdo_count"], "villages_count": mu["villages"]}
    return calculate_plan({
        "crop_area": market["crop_area_acres"], "amp_pct": market["amp_pct"], "current_treated_pct": market["current_treated_pct"],
        "target_treated_pct": target, "dose_packs_per_acre": DOSE[(market["crop_id"], product[0])], "pack_kg": product[4],
        "price_per_pack": product[5], "avg_area_per_farmer": market["avg_area_per_farmer"], "segment_rules": RULES,
        "lines": playbook_lines(segment_of(penetration)), "config": config,
    })


UPLIFT = {"Emerging": .16, "Growing": .12, "Maturing": .07, "Matured": .04}
PLANS = []
plan_id = 0


def add_plan(mu: dict, crop: str, season, status: str, target: float | None = None, anchor: date | None = None) -> None:
    global plan_id
    market = MARKET[(mu["id"], crop, season[0])]
    product = CROPTEK_BY_CROP[crop]
    penetration = market["current_treated_pct"] / market["amp_pct"]
    segment = segment_of(penetration)
    if target is None and segment in ("Matured", "Maturing"):
        # Retention plan (spec 5.9): hold the treated share, spend against total value.
        target = market["current_treated_pct"]
        result = run_plan(market, mu, product, target)
    elif target is None:
        # Growth plan: among uplift levels, keep the submittable target closest to the segment norm
        # (too small -> fixed minimum units blow the spend ratio; too big -> field capacity / demo farmers run out).
        norm = UPLIFT[segment] * rng.uniform(.8, 1.2)
        best = None
        for factor in (1, .85, 1.2, .7, 1.45, .55, 1.75, .4, 2.1, .3):
            candidate = round(min(market["amp_pct"], market["current_treated_pct"] + market["amp_pct"] * norm * factor), 4)
            outcome = run_plan(market, mu, product, candidate)
            if best is None:
                best = (candidate, outcome)
            if outcome["can_submit"]:
                best = (candidate, outcome)
                break
        target, result = best
    else:
        result = run_plan(market, mu, product, target)
    if not result["can_submit"]:
        status = "draft"
    plan_id += 1
    anchor = anchor or anchor_for(season, crop)
    created = min(datetime.combine(anchor - timedelta(days=rng.randint(130, 170)), datetime.min.time()) + timedelta(hours=rng.randint(9, 18)),
                  datetime.combine(REFERENCE_DATE - timedelta(days=2), datetime.min.time()) + timedelta(hours=11))
    plan = dict(id=plan_id, mu_id=mu["id"], crop_id=CROP_ID[crop], season_id=season[0], product_id=product[0],
                target_treated_pct=target, anchor_date=anchor, status=status, version=1,
                created_by=staff_by_district[mu["district"]][0]["name"] + " (TM)", created_at=created,
                mu_name=mu["name"], district=DISTRICT_BY_ID[mu["district"]][1], crop_name=crop, season_name=season[1],
                product_name=product[1], segment=result["segment"], incremental_acres=round(result["incremental_area"], 1),
                planned_packs=round(result["y_packs"], 1), total_units=result["total_units"], budget_total=round(result["budget_total"]),
                spend_ratio=round(result["spend_ratio"], 4))
    plan["_result"] = result
    PLANS.append(plan)
    T["campaign_plan"].append(plan)


def main_crop(district: tuple, crops: set, rank: int = 0) -> str | None:
    eligible = sorted((c for c in district[6] if c in crops), key=lambda c: -district[6][c])
    return eligible[rank] if len(eligible) > rank else None


CURRENT = SEASONS[2]
STATUS_WEIGHTS = [("live", .55), ("locked", .10), ("approved", .10), ("submitted", .12), ("draft", .13)]


def pick_status() -> str:
    x, acc = rng.random(), 0.0
    for status, weight in STATUS_WEIGHTS:
        acc += weight
        if x <= acc:
            return status
    return "draft"


for mu in MUS:
    d = DISTRICT_BY_ID[mu["district"]]
    if mu["name"] == "Niphad West":
        add_plan(mu, "Onion", CURRENT, "live", target=.10, anchor=date(2026, 12, 15))
    else:
        # Croptek Onion is the lead rabi campaign wherever onion is grown; otherwise the largest rabi crop.
        crop = "Onion" if "Onion" in d[6] else main_crop(d, RABI_CROPS)
        if crop and rng.random() < .8:
            add_plan(mu, crop, CURRENT, pick_status())
    rabi_rest = [c for c in sorted(d[6], key=lambda c: -d[6][c]) if c in RABI_CROPS and c != "Onion"]
    second = rabi_rest[0] if "Onion" in d[6] and rabi_rest else main_crop(d, RABI_CROPS, 1)
    if second and rng.random() < .35:
        add_plan(mu, second, CURRENT, pick_status())
    kharif_crop = main_crop(d, KHARIF_CROPS)
    if kharif_crop and rng.random() < .5:
        add_plan(mu, kharif_crop, SEASONS[1], "closed")
    rabi_prev = main_crop(d, RABI_CROPS)
    if rabi_prev and rng.random() < .4:
        add_plan(mu, rabi_prev, SEASONS[0], "closed")

# farmers -------------------------------------------------------------------------------------------
FARMERS_BY_MU: dict[int, list[int]] = defaultdict(list)
farmer_id = 0
event_mus = {p["mu_id"] for p in PLANS if p["status"] in ("live", "closed") and p["season_id"] >= 2}
for mu in MUS:
    if mu["id"] not in event_mus:
        continue
    d = DISTRICT_BY_ID[mu["district"]]
    lang = lang_of(d[2])
    main = main_crop(d, RABI_CROPS) or next(iter(d[6]))
    for i in range(rng.randint(45, 90)):
        farmer_id += 1
        FARMERS_BY_MU[mu["id"]].append(farmer_id)
        area = round(clamp(rng.lognormvariate(math.log(CROP_PARAMS[main]["farm"] * 1.6), .55), .5, 25), 1)
        consent_record = rng.random() < .93
        T["farmer"].append(dict(id=farmer_id, mu_id=mu["id"], mu_name=mu["name"], name=person(lang), phone=f"+9100000{farmer_id:05d}",
                                farmer_type="innovative" if rng.random() < .22 else "potential", area_acres=area,
                                consent_advice=1 if consent_record and rng.random() < .9 else 0, consent_record=1 if consent_record else 0,
                                consent_proof_url=f"consent/{mu['id']}/{farmer_id}.jpg" if consent_record else None, language=lang))
for phone_id in rng.sample(range(1, farmer_id + 1), 6):
    T["consent_withdrawal"].append(dict(phone=f"+9100000{phone_id:05d}",
                                        withdrawn_at=datetime.combine(REFERENCE_DATE - timedelta(days=rng.randint(3, 120)), datetime.min.time()) + timedelta(hours=14),
                                        reason=rng.choice(["Does not want WhatsApp advisories", "Changed phone number", "Requested by farmer on call-back"])))
    for f in T["farmer"]:
        if f["id"] == phone_id:
            f["consent_advice"] = 0

# events, contacts, callbacks, flags, demo results ------------------------------------------------------


def spread(start: date, end: date, count: int) -> list[date]:
    if count <= 0:
        return []
    span = max((end - start).days, 0)
    days = []
    for i in range(count):
        day = start + timedelta(days=round(span * (i + .5) / count))
        if day.weekday() == 6:
            day += timedelta(days=1)
        days.append(day)
    return days


def phase_counts(n: int, splits: list[float]) -> list[int]:
    raw = [n * s for s in splits]
    counts = [math.floor(v) for v in raw]
    for index in sorted(range(3), key=lambda i: raw[i] - counts[i], reverse=True)[: n - sum(counts)]:
        counts[index] += 1
    return counts


event_id = 0
callback_id = 0
used_hashes: list[str] = []
for plan in PLANS:
    if plan["status"] not in ("live", "closed") or plan["season_id"] == 1:
        continue
    mu = MU_BY_ID[plan["mu_id"]]
    farmers = FARMERS_BY_MU.get(mu["id"], [])
    anchor = plan["anchor_date"]
    windows = [(anchor - timedelta(days=120), anchor - timedelta(days=1)), (anchor, anchor + timedelta(days=90)),
               (anchor + timedelta(days=91), anchor + timedelta(days=150))]
    crop = plan["crop_name"]
    for line in plan["_result"]["lines"]:
        a = ACT_BY_ID[line["activity_type_id"]]
        for count, (start, end) in zip(phase_counts(line["n"], [a[5], a[6], a[7]]), windows):
            for scheduled in spread(start, end, count):
                event_id += 1
                due = scheduled < REFERENCE_DATE
                done = due and rng.random() < (.93 if plan["status"] == "closed" else .9)
                ev = dict(id=event_id, plan_id=plan["id"], activity_type_id=line["activity_type_id"], activity_name=a[0],
                          mu_name=mu["name"], scheduled_date=scheduled, status="done" if done else "scheduled", actual_date=None,
                          attendance=None, actual_cost=None, gps_lat=None, gps_lng=None, photo_hash=None)
                flags = []
                if done:
                    actual = min(scheduled + timedelta(days=rng.choice([0, 0, 0, 1, 2])), REFERENCE_DATE - timedelta(days=1))
                    attendance = max(1, round(a[2] * rng.uniform(.55, 1.15))) if a[2] > 1 else 1
                    if rng.random() < .04:
                        attendance = max(1, round(a[2] * rng.uniform(.2, .45)))
                    cost = round(a[4] * rng.uniform(.85, 1.12))
                    if rng.random() < .03:
                        cost = round(a[4] * rng.uniform(1.22, 1.45))
                    ev.update(actual_date=actual, attendance=attendance, actual_cost=cost)
                    if rng.random() > .03:
                        ev.update(gps_lat=round(mu["lat"] + rng.uniform(-.04, .04), 5), gps_lng=round(mu["lng"] + rng.uniform(-.04, .04), 5))
                    else:
                        flags.append(("missing_gps", "Field report is missing GPS coordinates"))
                    if used_hashes and rng.random() < .01:
                        ev["photo_hash"] = rng.choice(used_hashes)
                        flags.append(("photo_reuse", "Photo hash has already been used on another event"))
                    else:
                        ev["photo_hash"] = f"{rng.getrandbits(64):016x}"
                        used_hashes.append(ev["photo_hash"])
                    if a[2] > 1 and attendance < a[2] * .5:
                        flags.append(("low_attendance", f"Attendance {attendance} is below 50% of reach {a[2]}"))
                    if cost > a[4] * 1.2:
                        flags.append(("cost_overrun", f"Actual cost exceeds 120% of planned ₹{a[4]:,}"))
                    if rng.random() < .02:
                        flags.append(("late_report", "Report was submitted more than 3 days after the activity"))
                T["activity_event"].append(ev)
                age = (REFERENCE_DATE - scheduled).days
                for flag_type, detail in flags:
                    T["audit_flag"].append(dict(activity_event_id=event_id, flag_type=flag_type, detail=detail,
                                                resolved=1 if age > 21 and rng.random() < .7 else 0))
                if not done or not farmers:
                    continue
                contact_n = 1 if a[1] == "one_to_one" else min(len(farmers), ev["attendance"], rng.randint(4, 6) if a[1] in ("hvc", "wall_painting") else 10)
                contacts = rng.sample(farmers, contact_n)
                for f in contacts:
                    T["event_contact"].append(dict(activity_event_id=event_id, farmer_id=f))
                sample = rng.sample(contacts, max(1, math.ceil(len(contacts) * .1)))
                for f in sample:
                    callback_id += 1
                    called = None
                    days_since = (REFERENCE_DATE - ev["actual_date"]).days
                    if days_since > 6 and rng.random() < .88:
                        called = datetime.combine(min(ev["actual_date"] + timedelta(days=rng.randint(3, 12)), REFERENCE_DATE - timedelta(days=1)),
                                                  datetime.min.time()) + timedelta(hours=rng.randint(10, 18), minutes=rng.choice([0, 15, 30, 45]))
                    will_buy = bought = None
                    if called:
                        # stated intent ~ the activity's conversion k (so learned k stays close to the planning default)
                        will_buy = 1 if rng.random() < clamp(a[3] * rng.uniform(.75, 1.15), .003, .6) else 0
                        if (REFERENCE_DATE - called.date()).days > 14 or rng.random() < .5:
                            bought = 1 if (will_buy and rng.random() < .72) or (not will_buy and rng.random() < .02) else 0
                    T["callback"].append(dict(id=callback_id, farmer_id=f, activity_event_id=event_id, called_at=called,
                                              will_buy=will_buy, bought=bought, motivating_activity_type_id=line["activity_type_id"]))
                if a[1] == "demo" and plan["season_id"] == 2:
                    params = CROP_PARAMS[crop]
                    control = round(params["yield_q"] * rng.uniform(.85, 1.1), 1)
                    T["demo_result"].append(dict(activity_event_id=event_id, treated_yield=round(control * rng.uniform(1.05, 1.15), 1),
                                                 control_yield=control, unit="q/acre", price=round(params["price"] * rng.uniform(.95, 1.05) / 10) * 10,
                                                 crop_name=crop))

# sales & purchase orders ---------------------------------------------------------------------------
plan_lookup = {(p["mu_id"], p["crop_name"], p["season_id"]): p for p in PLANS}
sales = defaultdict(lambda: [0.0, 0.0])
for (mu_id, crop, season_id), market in MARKET.items():
    season = SEASONS[season_id - 1]
    if crop not in (RABI_CROPS if season[2] == "rabi" else KHARIF_CROPS):
        continue
    plan = plan_lookup.get((mu_id, crop, season_id))
    anchor = plan["anchor_date"] if plan else anchor_for(season, crop)
    products = [CROPTEK_BY_CROP[crop][0]] + [pid for pid in (13, 14, 11) if (CROP_ID[crop], pid) in DOSE and rng.random() < .35]
    for pid in products:
        share = 1.0 if pid == products[0] else rng.uniform(.15, .35)
        treated = plan["target_treated_pct"] if plan and season_id == CURRENT_SEASON else market["current_treated_pct"]
        packs = market["crop_area_acres"] * treated * DOSE[(CROP_ID[crop], pid)] * share * rng.uniform(.85, 1.1)
        for offset, weight in [(-1, .25), (0, .35), (1, .25), (2, .15)]:
            month_date = date(anchor.year + (anchor.month - 1 + offset) // 12, (anchor.month - 1 + offset) % 12 + 1, 1)
            po_date = date(month_date.year + (month_date.month - 2) // 12, (month_date.month - 2) % 12 + 1, 1)
            if month_date <= REFERENCE_DATE.replace(day=1):
                liquidated = packs * weight * (rng.uniform(.4, .6) if month_date == REFERENCE_DATE.replace(day=1) else 1)
                sales[(mu_id, crop, pid, month_date.strftime("%Y-%m"))][0] += liquidated
            if po_date <= REFERENCE_DATE.replace(day=1):
                sales[(mu_id, crop, pid, po_date.strftime("%Y-%m"))][1] += packs * weight * rng.uniform(1.1, 1.35)
for (mu_id, crop, pid, month), (liquidated, po) in sorted(sales.items(), key=lambda item: (item[0][3], item[0][0], item[0][1])):
    T["sales_import"].append(dict(mu_id=mu_id, crop_id=CROP_ID[crop], product_id=pid, month=month,
                                  packs_liquidated=round(liquidated), po_packs=round(po),
                                  mu_name=MU_BY_ID[mu_id]["name"], crop_name=crop, product_name=PRODUCT_BY_ID[pid][1]))

# --------------------------------------------------------------------------------------------------
# Screen datasets (ds.* sheets -> /api/datasets/{name})
# --------------------------------------------------------------------------------------------------
DS: dict[str, list[dict]] = defaultdict(list)
CUR_FILTER = CURRENT[7]


def district_stats(d: tuple, crop: str, season_id: int = CURRENT_SEASON) -> dict:
    rows = [MARKET[(mu["id"], crop, season_id)] for mu in MUS if mu["district"] == d[0]]
    pen = sum(r["current_treated_pct"] / r["amp_pct"] for r in rows) / len(rows)
    amp = sum(r["amp_pct"] for r in rows) / len(rows)
    acres = d[6][crop] * 2.471
    return dict(acres=acres, amp=amp, pen=pen, treated=amp * pen, gap_pp=amp * (1 - pen) * 100,
                dealers=sum(r["active_dealers"] for r in rows), farmers=acres / CROP_PARAMS[crop]["farm"])


def readiness_label(score: float) -> str:
    return "High" if score >= 0.66 else "Medium" if score >= 0.4 else "Low"


# Pinned storyline rows (Jalna · Onion · current season) = the narrative the screens are written around.
PIN = dict(season=CUR_FILTER, state="maharashtra", district="jalna", crop="onion")
PINNED_ROWS = {
    "atlas.taluka_ranking": [
        dict(rank=1, taluka="Ambad", score=94, potential="₹52 L", gap="28 pp", retailers=74, readiness="High"),
        dict(rank=2, taluka="Partur", score=91, potential="₹46 L", gap="25 pp", retailers=61, readiness="High"),
        dict(rank=3, taluka="Badnapur", score=89, potential="₹39 L", gap="21 pp", retailers=58, readiness="High"),
        dict(rank=4, taluka="Jalna", score=86, potential="₹34 L", gap="18 pp", retailers=82, readiness="Medium"),
        dict(rank=5, taluka="Mantha", score=83, potential="₹29 L", gap="19 pp", retailers=47, readiness="Medium"),
        dict(rank=6, taluka="Bhokardan", score=79, potential="₹27 L", gap="17 pp", retailers=44, readiness="Medium"),
        dict(rank=7, taluka="Ghansawangi", score=74, potential="₹22 L", gap="16 pp", retailers=36, readiness="Medium"),
        dict(rank=8, taluka="Jafrabad", score=68, potential="₹17 L", gap="14 pp", retailers=29, readiness="Low"),
    ],
    "nutrition.triggers": [
        dict(n=1, trigger="Upcoming Bulb-Initiation Window", geo="Ambad/Jalna", audience="Eligible conventional NPK farmers", intervention="Stage-specific farmer education plus retailer activation", reach="≈ 12.4K farmers", urgency="High", status="Draft recommendation — agronomy approval required", campaign=0),
        dict(n=2, trigger="Trial-to-Adoption Follow-up", geo="Ambad/Jalna", audience="Existing trial users", intervention="Field follow-up plus approved advisory communication", reach="≈ 2.8K farmers", urgency="High", status="Eligible farmer list to be validated", campaign=2),
        dict(n=3, trigger="Retailer Nutrition Awareness Activation", geo="Ambad/Jalna", audience="Selected high-influence retailers", intervention="Product education plus retailer-led farmer meetings", reach="≈ 86 retailers", urgency="Medium", status="Stock and content readiness check pending", campaign=1),
        dict(n=4, trigger="Crop-Stage Shift Monitoring", geo="Ambad/Jalna", audience="Programme coverage area farmers", intervention="Reassess campaign date and communication schedule", reach="≈ 15.2K farmers", urgency="Conditional", status="Monitoring — no confirmed trigger event", campaign=0),
    ],
    "readiness.village_demand": [
        dict(village="Wadi Gaon", farmers=368, adopters=107, demand=42.0, retailer="Wadi Gaon (R1)", visibility="Limited", arrival="05 Jan '27"),
        dict(village="Dhanora", farmers=344, adopters=100, demand=39.3, retailer="Dhanora (R2)", visibility="Adequate", arrival="10 Jan '27"),
        dict(village="Ambad HQ", farmers=386, adopters=115, demand=45.2, retailer="Ambad Mkt (R3)", visibility="Adequate", arrival="10 Jan '27"),
        dict(village="Pimpalgaon", farmers=272, adopters=79, demand=31.0, retailer="Pimpalgaon (R4)", visibility="Limited", arrival="15 Jan '27"),
        dict(village="Other Villages", farmers=462, adopters=131, demand=51.5, retailer="Mixed (R5–R7)", visibility="Unverified", arrival="20 Jan '27"),
    ],
    "readiness.stock_heatmap": [
        dict(village="Wadi Gaon", demand=36.0, supply=31.0, cov=86, gap=5.0, retailers=12, vis="High", risk="Medium"),
        dict(village="Dhanora", demand=34.0, supply=20.0, cov=59, gap=14.0, retailers=10, vis="Medium", risk="High"),
        dict(village="Ambad HQ", demand=38.0, supply=31.0, cov=82, gap=7.0, retailers=14, vis="High", risk="Medium"),
        dict(village="Pimpalgaon", demand=27.0, supply=18.0, cov=67, gap=9.0, retailers=8, vis="Medium", risk="High"),
        dict(village="Other Villages", demand=74.0, supply=66.0, cov=89, gap=8.0, retailers=26, vis="Medium", risk="Medium"),
    ],
    "readiness.dealers": [
        dict(name="Shree Agri Seva", village="Ambad HQ", mapped=6, stock="6.5 MT (Estimated)", demand=8.0, gap=1.5, influence="High", licence="Compliant", training="Completed", data="ERP-confirmed", owner="TM – R. Patil", deadline="20 Jan '27", action="Activate & confirm sales plan"),
        dict(name="Dhanora Agro Mart", village="Dhanora", mapped=5, stock="2.8 MT (Unverified)", demand=9.0, gap=6.2, influence="High", licence="Compliant", training="Not Started", data="Reported", owner="FO – S. Jadhav", deadline="12 Jan '27", action="Assign activation & raise dispatch"),
        dict(name="Ambad Krushi Centre", village="Ambad HQ", mapped=8, stock="8.0 MT (Estimated)", demand=10.0, gap=2.0, influence="Medium", licence="Compliant", training="Completed", data="ERP-confirmed", owner="TM – R. Patil", deadline="20 Jan '27", action="Confirm stock & drive conversion"),
        dict(name="Pimpalgaon Agri Stores", village="Pimpalgaon", mapped=4, stock="3.0 MT (Unverified)", demand=6.5, gap=3.5, influence="High", licence="Compliant", training="In Progress", data="Unverified", owner="FO – A. More", deadline="12 Jan '27", action="Validate inventory & replenish"),
        dict(name="Wadi Gaon Kisan Point", village="Wadi Gaon", mapped=7, stock="5.5 MT (Estimated)", demand=6.0, gap=0.5, influence="Medium", licence="Compliant", training="Completed", data="Estimated", owner="FO – P. Kale", deadline="22 Jan '27", action="Maintain stock & execute activation"),
        dict(name="Maharashtra Agri Traders", village="Other Villages", mapped=10, stock="14.0 MT (Estimated)", demand=16.0, gap=2.0, influence="High", licence="Compliant", training="Completed", data="Reported", owner="TM – M. Deshmukh", deadline="24 Jan '27", action="Drive broader retailer activation"),
        dict(name="Kisan Seva Depot", village="Other Villages", mapped=8, stock="11.0 MT (Unverified)", demand=14.0, gap=3.0, influence="Medium", licence="Compliant", training="In Progress", data="Unverified", owner="FO – N. Gaikwad", deadline="24 Jan '27", action="Validate & raise stock transfer"),
    ],
    "readiness.cluster_supply": [
        dict(village="Wadi Gaon", demand=36, supply=31, gap=5, retailers=12, status="Ready"),
        dict(village="Dhanora", demand=34, supply=20, gap=14, retailers=11, status="High Risk"),
        dict(village="Ambad HQ", demand=38, supply=31, gap=7, retailers=14, status="Moderate"),
        dict(village="Pimpalgaon", demand=27, supply=18, gap=9, retailers=9, status="High Risk"),
        dict(village="Other Villages", demand=74, supply=66, gap=8, retailers=28, status="Moderate"),
    ],
    "impact.cluster_conversion": [
        dict(cluster="Wadi Gaon", trials=126, rate=68, adopters=86, signal="ok", text="On track"),
        dict(cluster="Dhanora", trials=72, rate=32, adopters=23, signal="risk", text="At risk: Observed alongside stock receipt delay and delayed demo execution — investigate further."),
        dict(cluster="Ambad HQ", trials=108, rate=69, adopters=75, signal="ok", text="On track"),
        dict(cluster="Pimpalgaon", trials=78, rate=58, adopters=45, signal="moderate", text="Moderate: Monitor conversion to drive repeat."),
        dict(cluster="Other Villages", trials=34, rate=50, adopters=17, signal="ok", text="On track"),
    ],
    "impact.channel_effectiveness": [
        dict(channel="Retailer Activation", reached=482, trials=188, conv="58%", cei="3.29", rel="Highest"),
        dict(channel="Demonstration Plots", reached=276, trials=104, conv="56%", cei="2.88", rel="High"),
        dict(channel="Farmer Meetings", reached=318, trials=72, conv="49%", cei="2.07", rel="Medium"),
        dict(channel="Digital Advisory", reached=416, trials=68, conv="41%", cei="1.96", rel="Medium"),
        dict(channel="Field Follow-ups", reached=307, trials=88, conv="55%", cei="2.76", rel="High"),
    ],
    "impact.geo_performance": [
        dict(cluster="Wadi Gaon", trials=126, adopters=86, conv="68%", vs="+8 pp", dir="up"),
        dict(cluster="Ambad HQ", trials=108, adopters=75, conv="69%", vs="+9 pp", dir="up"),
        dict(cluster="Dhanora", trials=72, adopters=23, conv="32%", vs="−28 pp", dir="down"),
        dict(cluster="Pimpalgaon", trials=62, adopters=37, conv="60%", vs="+0 pp", dir="flat"),
        dict(cluster="Other Villages", trials=112, adopters=63, conv="56%", vs="−4 pp", dir="down"),
    ],
}
ORCH_PIN = [
    dict(owner="S. Patil", role="Sr. Field Owner", cluster="Wadi Gaon", task="Retailer visits (8)", load="7 / 10", status="On Track"),
    dict(owner="R. Jadhav", role="Field Owner", cluster="Dhanora", task="Demo (revised) + farmer meet", load="9 / 12", status="At Risk"),
    dict(owner="M. Deshmukh", role="Field Owner", cluster="Ambad HQ", task="Advance retailer activation (6)", load="6 / 10", status="On Track"),
    dict(owner="P. Koli", role="Field Owner", cluster="Pimpalgaon", task="Stock receipt follow-up + demo", load="10 / 12", status="Delayed"),
    dict(owner="V. Shinde", role="Field Owner", cluster="Other Villages", task="Farmer meetings (4)", load="5 / 10", status="On Track"),
]
TOP_MARKET_PIN = [
    dict(rank=1, geo="Jalna", crop="Onion", score=92, potential="₹2.4 Cr", gap="24 pp", readiness="High"),
    dict(rank=2, geo="Dhule", crop="Onion", score=88, potential="₹1.8 Cr", gap="18 pp", readiness="High"),
    dict(rank=3, geo="Nashik", crop="Onion", score=78, potential="₹1.6 Cr", gap="16 pp", readiness="Medium"),
    dict(rank=4, geo="Sangli", crop="Onion", score=76, potential="₹1.1 Cr", gap="15 pp", readiness="Medium"),
    dict(rank=5, geo="Anantapur", crop="Onion", score=74, potential="₹1.0 Cr", gap="17 pp", readiness="Medium"),
]
CAMPAIGN_PIN = [
    dict(name="Croptek Onion Adoption", objective="Competitive conversion", crop="Onion", geography="Dhule & Jalna, MH", region="Maharashtra", budget="₹0.80 Cr", stage="Execute", progress=72, trial="27%*", risk="Medium", roi="2.1x", next="Resolve stock gap", campaign_type="adoption", product="croptek"),
    dict(name="Solutek Grape Advisory", objective="Stage-based education", crop="Grapes", geography="Nashik, MH", region="Maharashtra", budget="₹0.46 Cr", stage="Deploy", progress=61, trial="31%*", risk="Low", roi="2.8x", next="Launch stage burst", campaign_type="awareness", product="solutek"),
    dict(name="Smartek Sugarcane Push", objective="Repeat adoption", crop="Sugarcane", geography="North Karnataka", region="Karnataka", budget="₹0.95 Cr", stage="Scale", progress=84, trial="36%*", risk="Low", roi="3.0x", next="Expand cluster", campaign_type="retention", product="smartek"),
    dict(name="Cotton Micronutrient Recovery", objective="Underperforming territories", crop="Cotton", geography="Telangana", region="Telangana", budget="₹0.38 Cr", stage="Review", progress=49, trial="16%*", risk="High", roi="1.2x", next="Diagnose adoption drop", campaign_type="adoption", product="croptek"),
    dict(name="Dealer Activation South", objective="Channel readiness", crop="Multi-crop", geography="AP & Telangana", region="AP & Telangana", budget="₹0.55 Cr", stage="Execute", progress=68, trial="24%*", risk="Medium", roi="1.9x", next="Increase field follow-up", campaign_type="channel", product="croptek"),
]


def scope(d: tuple, crop: str | None, season_filter: str = CUR_FILTER) -> dict:
    out = dict(season=season_filter, state=d[2], district=d[0])
    if crop:
        out["crop"] = crop.lower()
    return out


def is_pinned(d: tuple, crop: str, season_filter: str = CUR_FILTER) -> bool:
    return d[0] == "jalna" and crop == "Onion" and season_filter == CUR_FILTER


# atlas.top_markets: ranked districts per crop (scoped by crop + season only)
crop_districts = defaultdict(list)
for d in DISTRICTS:
    for crop in d[6]:
        crop_districts[crop].append(d)
for crop, districts in crop_districts.items():
    params = CROP_PARAMS[crop]
    dose = DOSE[(CROP_ID[crop], CROPTEK_BY_CROP[crop][0])]
    candidates = []
    for d in districts:
        st = district_stats(d, crop)
        potential = st["acres"] * st["gap_pp"] / 100 * dose * CROPTEK_BY_CROP[crop][5] * .35
        readiness = clamp(st["dealers"] / (12 * sum(1 for mu in MUS if mu["district"] == d[0])) + rng.uniform(-.1, .15), 0, 1)
        candidates.append(dict(d=d, st=st, potential=potential, readiness=readiness))
    max_pot = max(c["potential"] for c in candidates)
    for c in candidates:
        c["score"] = round(45 + 25 * (c["st"]["gap_pp"] / 40) + 15 * math.sqrt(c["potential"] / max_pot) + 15 * c["readiness"])
    rows = []
    if crop == "Onion":
        rows = [dict(r) for r in TOP_MARKET_PIN]
        pinned_names = {r["geo"] for r in rows}
        rest = sorted((c for c in candidates if c["d"][1] not in pinned_names), key=lambda c: -c["score"])
        for index, c in enumerate(rest, start=6):
            rows.append(dict(rank=index, geo=c["d"][1], crop=crop, score=min(c["score"], 73 - index + 6), potential=cr(c["potential"]),
                             gap=f"{c['st']['gap_pp']:.0f} pp", readiness=readiness_label(c["readiness"])))
    else:
        for index, c in enumerate(sorted(candidates, key=lambda c: -c["score"]), start=1):
            rows.append(dict(rank=index, geo=c["d"][1], crop=crop, score=min(c["score"], 96), potential=cr(c["potential"]),
                             gap=f"{c['st']['gap_pp']:.0f} pp", readiness=readiness_label(c["readiness"])))
    for row in rows:
        DS["atlas.top_markets"].append({**row, "season": CUR_FILTER, "crop": crop.lower()})

# per district x crop datasets
for d in DISTRICTS:
    lang = lang_of(d[2])
    villages = d[7]
    mdos = [s for s in staff_by_district[d[0]] if s["role"].startswith("MDO")]
    tm = staff_by_district[d[0]][0]
    # orchestration.owners (district scope)
    if d[0] == "jalna":
        owner_rows = ORCH_PIN
    else:
        owner_rows = []
        tasks = ["Retailer visits ({})", "Crop demo + farmer meet", "Advance retailer activation ({})", "Stock receipt follow-up + demo", "Farmer meetings ({})"]
        for index, village in enumerate(villages + ["Other Villages"]):
            cap = rng.choice([10, 10, 12])
            load = rng.randint(4, cap)
            ratio = load / cap
            status = "Delayed" if ratio > .9 and rng.random() < .6 else "At Risk" if ratio > .8 else "On Track"
            owner = mdos[index % len(mdos)]["name"] if mdos else person(lang)
            first, _, last = owner.partition(" ")
            owner_rows.append(dict(owner=f"{first[0]}. {last}", role="Sr. Field Owner" if index == 0 else "Field Owner", cluster=village,
                                   task=tasks[index].format(rng.randint(3, 9)), load=f"{load} / {cap}", status=status))
    for row in owner_rows:
        DS["orchestration.owners"].append({**row, "season": CUR_FILTER, "state": d[2], "district": d[0]})

    for crop in d[6]:
        sc = scope(d, crop)
        params = CROP_PARAMS[crop]
        st = district_stats(d, crop)
        dose = DOSE[(CROP_ID[crop], CROPTEK_BY_CROP[crop][0])]
        stages = next(c[2] for c in CROPS if c[0] == crop)
        season_type_crops = RABI_CROPS
        anchor = anchor_for(CURRENT, crop) if crop in season_type_crops else REFERENCE_DATE + timedelta(days=200)
        pinned = is_pinned(d, crop)

        if pinned:
            for name, rows in PINNED_ROWS.items():
                for row in rows:
                    DS[name].append({**row, **PIN})
            continue

        # atlas.taluka_ranking
        taluka_rows = []
        for taluka in d[5]:
            mus = [mu for mu in MUS if mu["district"] == d[0] and mu["taluka"] == taluka]
            mrows = [MARKET[(mu["id"], crop, CURRENT_SEASON)] for mu in mus]
            pen = sum(r["current_treated_pct"] / r["amp_pct"] for r in mrows) / len(mrows)
            amp = sum(r["amp_pct"] for r in mrows) / len(mrows)
            gap = amp * (1 - pen) * 100
            taluka_acres = st["acres"] / len(d[5]) * rng.uniform(.6, 1.4)
            potential = taluka_acres * gap / 100 * dose * CROPTEK_BY_CROP[crop][5] * .35
            retailers = round(sum(r["active_dealers"] for r in mrows) * rng.uniform(3.2, 4.8))
            readiness = clamp(retailers / 80 + rng.uniform(-.1, .1), 0, 1)
            taluka_rows.append(dict(taluka=taluka, gap=gap, potential=potential, retailers=retailers, readiness=readiness))
        max_pot = max(r["potential"] for r in taluka_rows)
        for r in taluka_rows:
            r["score"] = round(clamp(48 + 26 * (r["gap"] / 35) + 14 * math.sqrt(r["potential"] / max_pot) + 12 * r["readiness"], 35, 97))
        for rank, r in enumerate(sorted(taluka_rows, key=lambda r: -r["score"]), start=1):
            DS["atlas.taluka_ranking"].append(dict(rank=rank, taluka=r["taluka"], score=r["score"], potential=lakh(r["potential"]),
                                                   gap=f"{r['gap']:.0f} pp", retailers=r["retailers"], readiness=readiness_label(r["readiness"]), **sc))

        # nutrition.triggers
        lead = d[5][0]
        next_stage = stages[2][0] if len(stages) > 2 else stages[1][0]
        reach = st["farmers"] * rng.uniform(.04, .07)
        trial_users = reach * rng.uniform(.15, .25)
        rain = district_rain[d[0]][CURRENT_SEASON]
        triggers = [
            dict(trigger=f"Upcoming {next_stage.title()} Window", audience="Eligible conventional NPK farmers",
                 intervention="Stage-specific farmer education plus retailer activation", reach=f"≈ {reach / 1000:.1f}K farmers", urgency="High",
                 status="Draft recommendation — agronomy approval required", campaign=0),
            dict(trigger="Trial-to-Adoption Follow-up", audience="Existing trial users", intervention="Field follow-up plus approved advisory communication",
                 reach=f"≈ {trial_users / 1000:.1f}K farmers", urgency="High" if st["pen"] < .5 else "Medium", status="Eligible farmer list to be validated", campaign=2),
            dict(trigger="Retailer Nutrition Awareness Activation", audience="Selected high-influence retailers",
                 intervention="Product education plus retailer-led farmer meetings", reach=f"≈ {round(st['dealers'] * rng.uniform(1.2, 1.8))} retailers",
                 urgency="Medium", status="Stock and content readiness check pending", campaign=1),
        ]
        if rain <= -20:
            triggers.insert(0, dict(trigger="Moisture-Stress Nutrition Advisory", audience="Rainfed plots in deficit talukas",
                                    intervention="Shift basal dose advisory; promote soluble / sulphur nutrition", reach=f"≈ {reach * .6 / 1000:.1f}K farmers",
                                    urgency="High", status=f"Rainfall {rain:.0f}% vs normal — confirm with IMD feed", campaign=0))
        else:
            triggers.append(dict(trigger="Crop-Stage Shift Monitoring", audience="Programme coverage area farmers",
                                 intervention="Reassess campaign date and communication schedule", reach=f"≈ {reach * 1.2 / 1000:.1f}K farmers",
                                 urgency="Conditional", status="Monitoring — no confirmed trigger event", campaign=0))
        for n, row in enumerate(triggers, start=1):
            DS["nutrition.triggers"].append(dict(n=n, geo=f"{lead}/{d[1]}", **row, **sc))

        # readiness datasets
        cluster_rows = []
        for index, village in enumerate(villages + ["Other Villages"]):
            other = village == "Other Villages"
            # crop growers per village (district growers / talukas / ~130 villages), "Other" = rest of the cluster
            farmers = round((st["farmers"] / len(d[5]) / 130) * (rng.uniform(5, 7) if other else rng.uniform(1.4, 2.4)))
            adopters = round(farmers * rng.uniform(.22, .36))
            demand = round(adopters * params["farm"] * dose * 50 / 1000, 1)
            cov = rng.uniform(.55, .97)
            cluster_rows.append(dict(village=village, farmers=farmers, adopters=adopters, demand=demand, cov=cov,
                                     retailers=rng.randint(18, 30) if other else rng.randint(6, 15)))
            DS["readiness.village_demand"].append(dict(
                village=village, farmers=farmers, adopters=adopters, demand=demand,
                retailer="Mixed (R5–R7)" if other else f"{village} (R{index + 1})",
                visibility="Unverified" if other else rng.choice(["Adequate", "Adequate", "Limited"]),
                arrival=short_date(anchor - timedelta(days=rng.randint(15, 35))), **sc))
        for c in cluster_rows:
            in_season = round(c["demand"] * rng.uniform(.8, .95), 1)
            supply = round(in_season * c["cov"], 1)
            cov_pct = round(supply / in_season * 100) if in_season else 0
            DS["readiness.stock_heatmap"].append(dict(village=c["village"], demand=in_season, supply=supply, cov=cov_pct,
                                                      gap=round(in_season - supply, 1), retailers=c["retailers"],
                                                      vis=rng.choice(["High", "Medium", "Medium", "Low"]),
                                                      risk="High" if cov_pct < 70 else "Medium" if cov_pct < 90 else "Low", **sc))
            DS["readiness.cluster_supply"].append(dict(village=c["village"], demand=round(in_season), supply=round(supply),
                                                       gap=round(in_season - supply), retailers=c["retailers"],
                                                       status="Ready" if cov_pct >= 85 else "Moderate" if cov_pct >= 70 else "High Risk", **sc))
        dealer_lang = lang if lang in DEALER_NAMES else {"hi": "mr", "pa": "mr", "or": "mr", "bn": "mr", "ta": "te"}.get(lang, "mr")
        dealer_pool = rng.sample(DEALER_NAMES[dealer_lang], min(6, len(DEALER_NAMES[dealer_lang])))
        for index, base in enumerate(dealer_pool):
            village = (villages + ["Other Villages"])[index % 5]
            demand = round(rng.uniform(4, 16), 1)
            stock = round(demand * rng.uniform(.3, 1.05), 1)
            quality = rng.choice(["ERP-confirmed", "ERP-confirmed", "Reported", "Estimated", "Unverified"])
            stock_tag = {"ERP-confirmed": "Estimated", "Reported": "Unverified", "Estimated": "Estimated", "Unverified": "Unverified"}[quality]
            owner_person = tm if index % 3 == 0 else (mdos[index % len(mdos)] if mdos else tm)
            first, _, last = owner_person["name"].partition(" ")
            gap = round(max(demand - stock, 0), 1)
            DS["readiness.dealers"].append(dict(
                name=base if base.startswith(("Sri", "Shree", "Om", "Jai")) else f"{village.replace(' HQ', '')} {base}",
                village=village, mapped=rng.randint(3, 10), stock=f"{stock} MT ({stock_tag})", demand=demand, gap=gap,
                influence=rng.choice(["High", "High", "Medium", "Low"]), licence="Compliant" if rng.random() < .9 else "Renewal due",
                training=rng.choice(["Completed", "Completed", "In Progress", "Not Started"]), data=quality,
                owner=f"{'TM' if owner_person is tm else 'FO'} – {first[0]}. {last}",
                deadline=short_date(anchor - timedelta(days=rng.randint(10, 30))),
                action="Assign activation & raise dispatch" if gap > 4 else "Validate inventory & replenish" if gap > 2 else "Confirm stock & drive conversion",
                **sc))

    # impact datasets for every crop and every season
    for crop in d[6]:
        for season in SEASONS:
            if is_pinned(d, crop, season[7]):
                continue
            sc = scope(d, crop, season[7])
            maturity = district_stats(d, crop, season[0])["pen"]
            clusters = []
            for village in villages + ["Other Villages"]:
                trials = rng.randint(30, 140)
                rate = round(clamp(rng.gauss(35 + 40 * maturity, 12), 18, 82))
                clusters.append(dict(cluster=village, trials=trials, rate=rate, adopters=round(trials * rate / 100)))
            avg = sum(c["adopters"] for c in clusters) / sum(c["trials"] for c in clusters) * 100
            for c in clusters:
                signal = "ok" if c["rate"] >= 60 else "moderate" if c["rate"] >= 40 else "risk"
                text = {"ok": "On track", "moderate": "Moderate: Monitor conversion to drive repeat.",
                        "risk": rng.choice(["At risk: Observed alongside late stock receipt — investigate further.",
                                            "At risk: Demo attendance below plan — review field execution.",
                                            "At risk: Competitor price offers reported by retailers — validate."])}[signal]
                DS["impact.cluster_conversion"].append(dict(**c, signal=signal, text=text, **sc))
                diff = c["rate"] - avg
                DS["impact.geo_performance"].append(dict(cluster=c["cluster"], trials=c["trials"], adopters=c["adopters"], conv=f"{c['rate']}%",
                                                         vs=f"{'+' if diff >= 0 else '−'}{abs(diff):.0f} pp",
                                                         dir="flat" if abs(diff) < 2 else "up" if diff > 0 else "down", **sc))
            channels = [("Retailer Activation", 1.15), ("Demonstration Plots", 1.05), ("Farmer Meetings", .9), ("Digital Advisory", .75), ("Field Follow-ups", 1.0)]
            ch_rows = []
            for channel, strength in channels:
                reached = rng.randint(200, 520)
                trials = round(reached * clamp(rng.gauss(.25 * strength, .05), .08, .5))
                conv = round(clamp(rng.gauss((35 + 30 * maturity) * strength, 6), 20, 80))
                cei = round(conv / 100 * trials / reached * 10 * rng.uniform(1.6, 2.2), 2)
                ch_rows.append(dict(channel=channel, reached=reached, trials=trials, conv=f"{conv}%", cei=f"{cei:.2f}"))
            ranked = sorted(ch_rows, key=lambda r: -float(r["cei"]))
            for row in ch_rows:
                position = ranked.index(row)
                row["rel"] = "Highest" if position == 0 else "High" if position <= 2 else "Medium"
                DS["impact.channel_effectiveness"].append({**row, **sc})
# portfolio.campaigns: 5 storyline campaigns + campaigns aggregated from district x crop plans
state_short = {"maharashtra": "MH", "karnataka": "KA", "telangana": "TS", "andhra-pradesh": "AP", "gujarat": "GJ", "madhya-pradesh": "MP", "rajasthan": "RJ", "tamil-nadu": "TN", "uttar-pradesh": "UP", "punjab": "PB", "haryana": "HR", "odisha": "OD", "west-bengal": "WB", "bihar": "BR"}
for season in SEASONS:
    groups = defaultdict(list)
    for p in PLANS:
        if p["season_id"] == season[0]:
            d = DISTRICT_BY_ID[MU_BY_ID[p["mu_id"]]["district"]]
            groups[(d[0], p["crop_name"])].append(p)
    rows = [dict(r) for r in CAMPAIGN_PIN] if season[0] == CURRENT_SEASON else []
    taken = {("jalna", "Onion"), ("dhule", "Onion"), ("nashik", "Grapes")} if season[0] == CURRENT_SEASON else set()
    ordered = sorted(groups.items(), key=lambda item: -sum(p["budget_total"] for p in item[1]))
    target_rows = 28 if season[0] == CURRENT_SEASON else 20
    for (district_id, crop), plans in ordered:
        if len(rows) >= target_rows:
            break
        if (district_id, crop) in taken:
            continue
        d = DISTRICT_BY_ID[district_id]
        budget = sum(p["budget_total"] for p in plans)
        segment = max(set(p["segment"] for p in plans), key=[p["segment"] for p in plans].count)
        objective, ctype = {"Emerging": ("New-market adoption", "adoption"), "Growing": ("Competitive conversion", "adoption"),
                            "Maturing": ("Repeat adoption", "retention"), "Matured": ("Loyalty & visibility", "awareness")}[segment]
        done = [e for e in T["activity_event"] if e["plan_id"] in {p["id"] for p in plans}]
        progress = round(sum(1 for e in done if e["status"] == "done") / len(done) * 100) if done else (100 if season[0] != CURRENT_SEASON else rng.randint(5, 25))
        if season[0] != CURRENT_SEASON:
            stage = "Review"
            progress = max(progress, 88)
        else:
            stage = "Deploy" if progress < 35 else "Execute" if progress < 75 else "Scale"
        trial = rng.uniform(14, 38)
        roi = clamp(rng.gauss(1.4 + trial / 25, .35), .7, 3.6)
        risk = "High" if roi < 1.3 else "Medium" if roi < 2.2 else "Low"
        nxt = {"High": "Diagnose adoption drop", "Medium": rng.choice(["Resolve stock gap", "Increase field follow-up", "Re-plan demo calendar"]),
               "Low": rng.choice(["Expand cluster", "Launch stage burst", "Scale retailer counters"])}[risk]
        if season[0] != CURRENT_SEASON:
            nxt = "Close-out review & learnings"
        rows.append(dict(name=f"Croptek {crop} {('Adoption' if ctype == 'adoption' else 'Retention' if ctype == 'retention' else 'Awareness')} — {d[1]}",
                         objective=objective, crop=crop, geography=f"{d[1]}, {state_short[d[2]]}", region=STATES[d[2]][0], budget=cr(budget),
                         stage=stage, progress=progress, trial=f"{trial:.0f}%*", risk=risk, roi=f"{roi:.1f}x", next=nxt,
                         campaign_type=ctype, product="croptek"))
    for row in rows:
        DS["portfolio.campaigns"].append({**row, "season": season[7]})

# Replace display-shaped rows with one canonical, fully filterable campaign dataset.
STATE_REGIONS = {name: values[1] for values in STATES.values() for name in [values[0]]}
STATE_DISTRICTS = {STATES[d[2]][0]: d[1] for d in DISTRICTS}
DS["portfolio.campaigns"] = build_campaign_rows(STATE_REGIONS, STATE_DISTRICTS)
for dataset_name, dataset_rows in build_role_datasets(DS["portfolio.campaigns"]).items():
    DS[dataset_name] = dataset_rows

# --------------------------------------------------------------------------------------------------
# Write workbook
# --------------------------------------------------------------------------------------------------
HEADER_FILL = PatternFill("solid", fgColor="1F5E3B")
HEADER_FONT = Font(name="Arial", bold=True, color="FFFFFF", size=10)
INFO_FILL = PatternFill("solid", fgColor="E8F1EC")
INFO_FONT = Font(name="Arial", bold=True, color="1F5E3B", size=10)

TABLE_DOCS = {
    "geo_unit": "Geography tree: state -> district -> marketing unit (MU).",
    "mu": "Marketing units (~10-14 villages, the planning unit). taluka, lat/lng and mdo_user_id are new attributes.",
    "field_staff": "Field force hierarchy: Zonal Manager -> Regional Manager -> Field Sales Manager -> MDO (one per MU).",
    "crop": "Crop master with the agronomic anchor event (sowing / transplanting / planting / pruning).",
    "crop_stage": "Crop stage windows in days from the anchor date.",
    "season": "Seasons. filter_id links to the web filter bar (masters.json).",
    "product": "Mahadhan product master (approximate MRP per pack). filter_id links to products.json.",
    "crop_product_dose": "Recommended dose (packs per acre) per crop x product and the stage it is applied.",
    "market_data": "Per MU x crop x season: crop area, AMP, treated share, farmer size, soil, rainfall, price, dealers.",
    "segment_rule": "Segmentation rule: penetration of potential band -> segment, objective, spend cap.",
    "activity_type": "Demand-generation activity library: reach r, conversion k, unit cost c, phase split, bucket.",
    "playbook": "Activity mix (share) used for each segment.",
    "config": "Planning engine parameters.",
    "campaign_plan": "Campaign plans per MU x crop x season. Columns after created_at are computed by the engine (info only).",
    "activity_event": "Field activity calendar & execution reports (attendance, cost, GPS, photo hash).",
    "farmer": "Farmer registry with consent flags. Names are synthetic; phone numbers are non-dialable placeholders.",
    "consent_withdrawal": "Farmers who withdrew advisory consent.",
    "event_contact": "Which farmers were contacted at which event.",
    "callback": "Call-centre call-backs after events (will buy / bought) - the source of learned conversion k.",
    "audit_flag": "Field-report audit flags (missing GPS, photo reuse, low attendance, cost overrun, late report).",
    "sales_import": "Monthly liquidation (packs sold to farmers) and purchase orders per MU x crop x product.",
    "demo_result": "Demo plot yields: treated vs control (q/acre) and farm-gate price.",
}
DS_DOCS = {
    "portfolio.campaigns": "Campaign portfolio (Command Centre).", "atlas.top_markets": "Top opportunity markets by crop (Opportunity Atlas).",
    "atlas.taluka_ranking": "Taluka ranking inside a district.", "nutrition.triggers": "Crop-stage campaign trigger queue.",
    "readiness.village_demand": "Village demand projection.", "readiness.stock_heatmap": "Village stock coverage.",
    "readiness.dealers": "Dealer & retailer readiness.", "readiness.cluster_supply": "Cluster supply status.",
    "orchestration.owners": "Field owner workload.", "impact.cluster_conversion": "Cluster trial-to-adoption.",
    "impact.channel_effectiveness": "Channel effectiveness.", "impact.geo_performance": "Geography performance vs average.",
}
DS_DOCS.update({
    "bh.region_performance": "Business Head regional performance and reconciled commercial measures.",
    "bh.investment_roi": "Business Head investment and pending-attribution return metrics.",
    "bh.theme_pipeline": "Business Head strategic theme pipeline by market.",
    "bh.interventions": "Business Head intervention and activity status.",
    "mh.regional_opportunity": "Marketing Head regional opportunity and penetration.",
    "mh.plan_alignment": "Marketing Head alignment to business and crop plans.",
    "mh.campaign_mix_calendar": "Marketing Head campaign mix and seasonal calendar.",
    "mh.approvals": "Marketing Head campaign approval status.",
    "pm.portfolio_abp": "Zonal Manager portfolio ABP and sales plan.",
    "pm.territory_plans": "Zonal Manager territory plan summary.",
    "pm.activity_approvals": "Zonal Manager activity approval queue.",
    "pm.impact_uplift": "Zonal Manager measured campaign impact and attribution status.",
    "tm.territory_plan": "Field Sales Manager territory plan and targets.",
    "tm.outlets": "Territory retailer and dealer coverage.",
    "tm.village_coverage": "Field Sales Manager village coverage and adoption.",
    "tm.campaign_activities": "Editable activity lines for campaign budget calculations.",
    "tm.execution_weekly": "Weekly campaign execution tracking.",
    "tm.impact": "Territory campaign impact and adoption results.",
})
PCT_COLUMNS = {"amp_pct", "current_treated_pct", "target_treated_pct", "spend_cap_pct", "min_pen", "max_pen", "share_pct",
               "k_default", "phase_split_pre", "phase_split_on", "phase_split_post", "spend_ratio"}
INFO_COLUMNS = {"mu_name", "district", "district_name", "crop_name", "season_name", "product_name", "activity_name", "segment",
                "incremental_acres", "planned_packs", "total_units", "budget_total", "spend_ratio", "filter_id"}

wb = Workbook()
wb._named_styles["Normal"].font = Font(name="Arial", size=10)


def write_sheet(title: str, rows: list[dict], note: str | None = None) -> None:
    ws = wb.create_sheet(title)
    columns = list(rows[0].keys())
    for col_index, column in enumerate(columns, start=1):
        cell = ws.cell(row=1, column=col_index, value=column)
        info = column in INFO_COLUMNS
        cell.fill = INFO_FILL if info else HEADER_FILL
        cell.font = INFO_FONT if info else HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        if info:
            cell.comment = Comment("Reference / computed column - for reading only, ignored by the loader.", "CampaignIQ")
    widths = [max(len(c), 8) for c in columns]
    for row_index, row in enumerate(rows, start=2):
        for col_index, column in enumerate(columns, start=1):
            value = row.get(column)
            cell = ws.cell(row=row_index, column=col_index, value=value)
            if isinstance(value, datetime):
                cell.number_format = "yyyy-mm-dd hh:mm"
            elif isinstance(value, date):
                cell.number_format = "yyyy-mm-dd"
            elif column in PCT_COLUMNS and isinstance(value, (int, float)):
                cell.number_format = "0.0%"
            elif isinstance(value, float):
                cell.number_format = "#,##0.0"
            elif isinstance(value, int) and column not in ("id",) and not column.endswith("_id") and value >= 1000:
                cell.number_format = "#,##0"
            if row_index <= 200 and value is not None:
                widths[col_index - 1] = max(widths[col_index - 1], min(len(str(value)), 60))
    for col_index, width in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(col_index)].width = width + 2
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(columns))}{len(rows) + 1}"
    ws.row_dimensions[1].height = 30


def strip(rows: list[dict]) -> list[dict]:
    return [{k: v for k, v in row.items() if k != "_result"} for row in rows]


TABLE_ORDER = ["geo_unit", "mu", "field_staff", "crop", "crop_stage", "season", "product", "crop_product_dose", "market_data",
               "segment_rule", "activity_type", "playbook", "config", "campaign_plan", "activity_event", "farmer",
               "consent_withdrawal", "event_contact", "callback", "audit_flag", "sales_import", "demo_result"]

readme = wb.active
readme.title = "README"
summary = wb.create_sheet("Summary")
meta_rows = [dict(key="reference_date", value=REFERENCE_DATE.isoformat()), dict(key="shift_dates", value="true"),
             dict(key="version", value=WORKBOOK_VERSION), dict(key="source_label", value=SOURCE_LABEL),
             dict(key="generated_by", value="server/scripts/generate_synthetic_workbook.py (seed 20261118)")]
for table in TABLE_ORDER:
    write_sheet(table, strip(T[table]))
DS_ORDER = list(DS_DOCS)
for name in DS_ORDER:
    write_sheet(f"ds.{name}", DS[name])
write_sheet("_meta", meta_rows)

# Column-level data dictionary for all retained tables and screen datasets.
dictionary_rows = []
unit_by_column = {"investment_lakh": "INR lakh", "actual_sales_lakh": "INR lakh", "abp_lakh": "INR lakh", "trial_to_purchase_pct": "%", "planned_pct": "%", "observed_pct": "%", "adopters": "farmers", "trials": "farmers", "roi": "x", "quarter": "quarter number", "units": "activity units"}
allowed_by_column = {"region": list(REGIONS), "state": list(STATE_REGIONS), "crop": SCREEN_CROPS, "theme": THEMES, "product": list(PRODUCT_CATEGORY), "product_category": sorted(set(PRODUCT_CATEGORY.values())), "period": PERIOD_VALUES, "fy": FY_VALUES}
def dictionary_type(value):
    if isinstance(value, bool): return "boolean"
    if isinstance(value, (int, float)): return "number"
    return "string"
for sheet_name, records in [(name, strip(T[name])) for name in TABLE_ORDER] + [(f"ds.{name}", DS[name]) for name in DS_ORDER]:
    for column in (records[0].keys() if records else []):
        value = next((record.get(column) for record in records if record.get(column) is not None), None)
        dictionary_rows.append({"sheet": sheet_name, "column": column, "type": dictionary_type(value), "unit": unit_by_column.get(column, ""), "description": f"{column.replace('_', ' ').capitalize()} in {sheet_name}.", "allowed_values": ", ".join(allowed_by_column.get(column, []))})
write_sheet("Data dictionary", dictionary_rows)

# README ---------------------------------------------------------------------------------------------
lines = [
    ("Mahadhan CampaignIQ — Synthetic Data Workbook", "title"),
    (f"Version {WORKBOOK_VERSION} · reference date {REFERENCE_DATE:%d %b %Y} · generated by server/scripts/generate_synthetic_workbook.py", "sub"),
    ("", None),
    ("What this is", "h"),
    ("Status: synthetic. No workbook values represent actual Mahadhan transactions.", None),
    ("All data in this workbook is SYNTHETIC. It is calibrated to public, approximate figures so the portal behaves like a real season, but it is NOT Mahadhan's actual sales, farmer or field data.", None),
    ("The backend loads this file into its database on first start-up; every sheet named ds.* becomes a live dataset behind the matching screen panel.", None),
    ("", None),
    ("How to use / patch it", "h"),
    ("1. Edit values in the table sheets (dark green headers). Light green headers are reference / computed columns and are ignored by the loader.", None),
    ("2. Keep sheet names and header names unchanged. ids link the sheets (e.g. market_data.mu_id -> mu.id).", None),
    ("3. Reload: `python -m campaign_api.workbook data/seed/mahadhan_synthetic_data.xlsx` (wipes and reloads the database), or POST the file to /api/import/workbook with the admin token.", None),
    ("4. Campaign plan budgets, activity counts and checks are recomputed by the planning engine at load time, so edits to targets or market data stay consistent.", None),
    ("5. Dates are relative to the reference date; on load they are shifted forward by (today - reference date) so the season stays 'live'. Set CAMPAIGNIQ_SEED_SHIFT_DATES=0 to disable.", None),
    ("6. To move to real data: replace rows sheet by sheet with exports from ERP / DMS / CRM / call-centre systems using the same columns.", None),
    ("", None),
    ("Calibration assumptions (all approximate — replace with Mahadhan / agronomy-approved values)", "h"),
    ("Geography: 20 districts across Maharashtra, Karnataka, Telangana, Andhra Pradesh and Gujarat; real taluka and town names; 1 MU per taluka (Nashik, Dhule, Jalgaon keep the original MU names).", None),
    ("Crop area: district crop area in hectares rounded from public state agriculture statistics, × 2.471 acres/ha, apportioned to an MU as villages/130 of a taluka.", None),
    ("AMP (addressable share of area): onion 30%, grapes 45%, pomegranate 42%, sugarcane 32%, tomato 35%, banana 38%, groundnut 25%, cotton/maize 22%, soybean 20% (±5 pp per MU).", None),
    ("Penetration of potential: district maturity centred on Mahadhan's core belt (Nashik/Pune/Ahilyanagar/Sangli ~55-60%) down to new markets (Telangana, AP, Gujarat ~12-15%).", None),
    ("Prices: Croptek 50 kg ₹1,750-1,950; Smartek 10:26:26 ₹1,725; 24:24:0 ₹1,650; Bensulf 10 kg ₹1,050; Solutek 25 kg ₹3,600-4,600 (approximate MRP).", None),
    ("Doses: Croptek 2 bags/acre (cotton, soybean, maize, groundnut), 3 (onion, tomato, pomegranate), 4 (grapes, sugarcane, banana); Bensulf 5-8 kg/acre; Solutek 10-20 kg/acre via fertigation.", None),
    ("Plans: Emerging / Growing MUs get growth targets; Maturing ('Consolidate') and Matured MUs get retention plans (spec 5.9). Plans whose checks stay red (mostly Growing onion just above the 20% spend cap) stay drafts awaiting a cheaper mix.", None),
    ("Farm-gate prices (₹/quintal): onion 1,900, grapes 4,500, pomegranate 7,500, sugarcane 340 (FRP), cotton 7,500, soybean 4,900, maize 2,150, groundnut 6,500, tomato 1,400, banana 1,500.", None),
    ("Activities, reach, conversion, unit cost and playbooks: unchanged CampaignIQ engine defaults.", None),
    ("Execution: ~90% of due activities reported, attendance 55-115% of planned reach, cost 85-112% of unit cost, ~3% missing GPS, ~1% photo reuse.", None),
    ("Call-backs: 10% of contacted farmers sampled; 'will buy' rate ≈ 0.75-1.15× the activity's default conversion k; ~72% of 'will buy' convert.", None),
    ("Storyline anchors: the Jalna · Onion · Late Rabi 2026-27 rows of the ds.* sheets keep the figures the screen narratives are written around.", None),
    ("", None),
    ("Sheets", "h"),
]
readme.column_dimensions["A"].width = 34
readme.column_dimensions["B"].width = 120
readme.column_dimensions["C"].width = 12
row_no = 1
for text, kind in lines:
    cell = readme.cell(row=row_no, column=1, value=text)
    if kind == "title":
        cell.font = Font(name="Arial", bold=True, size=16, color="1F5E3B")
    elif kind == "sub":
        cell.font = Font(name="Arial", italic=True, size=10, color="555555")
    elif kind == "h":
        cell.font = Font(name="Arial", bold=True, size=12, color="1F5E3B")
    row_no += 1
for col, label in enumerate(["Sheet", "Contents", "Rows"], start=1):
    c = readme.cell(row=row_no, column=col, value=label)
    c.fill, c.font = HEADER_FILL, HEADER_FONT
row_no += 1
for table in TABLE_ORDER:
    readme.cell(row=row_no, column=1, value=table)
    readme.cell(row=row_no, column=2, value=TABLE_DOCS[table])
    readme.cell(row=row_no, column=3, value=f"=COUNTA('{table}'!A:A)-1")
    row_no += 1
for name in DS_ORDER:
    readme.cell(row=row_no, column=1, value=f"ds.{name}")
    readme.cell(row=row_no, column=2, value=f"Screen dataset → GET /api/datasets/{name}. {DS_DOCS[name]} Scope columns (season, state, district, crop …) drive the filter bar.")
    readme.cell(row=row_no, column=3, value=f"=COUNTA('ds.{name}'!A:A)-1")
    row_no += 1
readme.cell(row=row_no, column=1, value="Data dictionary")
readme.cell(row=row_no, column=2, value="Column types, units, descriptions and allowed values.")
readme.cell(row=row_no, column=3, value=f"=COUNTA('Data dictionary'!A:A)-1")
row_no += 1
readme.cell(row=row_no, column=1, value="_meta")
readme.cell(row=row_no, column=2, value="Loader settings: reference date, date shifting, version, source label.")
for r in readme.iter_rows(min_row=1, max_row=row_no, max_col=2):
    for cell in r:
        cell.alignment = Alignment(wrap_text=True, vertical="top")

# Summary (live formulas over the data sheets) ------------------------------------------------------------
summary.column_dimensions["A"].width = 16
for col in "BCDEFGH":
    summary.column_dimensions[col].width = 18
summary["A1"] = "Summary — current season (Late Rabi 2026-27)"
summary["A1"].font = Font(name="Arial", bold=True, size=14, color="1F5E3B")
summary["A2"] = "Formulas read the data sheets, so this sheet updates when you edit them."
summary["A2"].font = Font(name="Arial", italic=True, size=9, color="555555")
headers = ["Crop", "MU rows", "Crop area (acres)", "Treated acres", "Treated share", "Plans", "Plan budget (₹)", "Planned packs"]
for col, label in enumerate(headers, start=1):
    c = summary.cell(row=4, column=col, value=label)
    c.fill, c.font = HEADER_FILL, HEADER_FONT
    c.alignment = Alignment(horizontal="center", wrap_text=True)
md_cols = {c: get_column_letter(i + 1) for i, c in enumerate(T["market_data"][0].keys())}
plan_cols = {c: get_column_letter(i + 1) for i, c in enumerate(strip(T["campaign_plan"])[0].keys())}
md_n, plan_n = len(T["market_data"]) + 1, len(T["campaign_plan"]) + 1
season_name = CURRENT[1]
summary["J4"], summary["K4"] = "Season", season_name
summary["J4"].font = Font(name="Arial", bold=True)
# treated acres helper column on market_data (area x treated share), right of the data
treated_col = get_column_letter(len(md_cols) + 1)
ws_md = wb["market_data"]
ws_md[f"{treated_col}1"] = "treated_acres"
ws_md[f"{treated_col}1"].fill, ws_md[f"{treated_col}1"].font = INFO_FILL, INFO_FONT
for r in range(2, md_n + 1):
    ws_md[f"{treated_col}{r}"] = f"={md_cols['crop_area_acres']}{r}*{md_cols['current_treated_pct']}{r}"
    ws_md[f"{treated_col}{r}"].number_format = "#,##0"
row = 5
for crop in CROP_NAMES:
    md = lambda col: f"market_data!${md_cols[col]}$2:${md_cols[col]}${md_n}"  # noqa: E731
    pl = lambda col: f"campaign_plan!${plan_cols[col]}$2:${plan_cols[col]}${plan_n}"  # noqa: E731
    summary.cell(row=row, column=1, value=crop)
    summary.cell(row=row, column=2, value=f'=COUNTIFS({md("crop_name")},$A{row},{md("season_name")},$K$4)')
    summary.cell(row=row, column=3, value=f'=SUMIFS({md("crop_area_acres")},{md("crop_name")},$A{row},{md("season_name")},$K$4)').number_format = "#,##0"
    summary.cell(row=row, column=4, value=f'=SUMIFS(market_data!${treated_col}$2:${treated_col}${md_n},{md("crop_name")},$A{row},{md("season_name")},$K$4)').number_format = "#,##0"
    summary.cell(row=row, column=5, value=f"=IF(C{row}=0,0,D{row}/C{row})").number_format = "0.0%"
    summary.cell(row=row, column=6, value=f'=COUNTIFS({pl("crop_name")},$A{row},{pl("season_name")},$K$4)')
    summary.cell(row=row, column=7, value=f'=SUMIFS({pl("budget_total")},{pl("crop_name")},$A{row},{pl("season_name")},$K$4)').number_format = "₹#,##0"
    summary.cell(row=row, column=8, value=f'=SUMIFS({pl("planned_packs")},{pl("crop_name")},$A{row},{pl("season_name")},$K$4)').number_format = "#,##0"
    row += 1
summary.cell(row=row, column=1, value="Total").font = Font(name="Arial", bold=True)
for col in (2, 3, 4, 6, 7, 8):
    letter = get_column_letter(col)
    c = summary.cell(row=row, column=col, value=f"=SUM({letter}5:{letter}{row - 1})")
    c.font = Font(name="Arial", bold=True)
    c.number_format = "₹#,##0" if col == 7 else "#,##0"
c = summary.cell(row=row, column=5, value=f"=IF(C{row}=0,0,D{row}/C{row})")
c.font, c.number_format = Font(name="Arial", bold=True), "0.0%"
summary.freeze_panes = "A5"

wb.calculation.fullCalcOnLoad = True
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
wb.save(OUTPUT)

# Filter-bar masters (server/data/reference/*.json) are written from the same lists so every generated
# district / crop / product can be selected in the web app.
REFERENCE_DIR = SERVER_DIR / "data" / "reference"
state_names = {state_id: info[0] for state_id, info in STATES.items()}
region_members = {region: [state_id for state_id, info in STATES.items() if info[1] == region] for region in REGIONS}
geography = {
    "_comment": "Canonical hierarchy: region -> state -> district -> taluka/territory -> marketing unit -> village. Existing state/district/taluka filter fields remain stable.",
    "country": "India",
    "regions": [{"id": region.lower(), "name": region, "states": ids} for region, ids in region_members.items()],
    "states": [
        {"id": state_id, "name": state_names[state_id], "region": STATES[state_id][1], "districts": [
            {"id": d[0], "name": d[1], "talukas": d[5], "territories": d[5], "villages": d[7], "has_data": True,
             "marketing_units": [{"id": str(mu["id"]), "name": mu["name"], "taluka": mu["taluka"],
                                 "village_count": mu["villages"], "villages": d[7] if idx == 0 else []}
                                 for idx, mu in enumerate(MUS) if mu["district"] == d[0]]}
            for d in DISTRICTS if d[2] == state_id]}
        for state_id in STATES
    ],
}
families = {"croptek": ("Croptek", "Speciality nutrition", [50, 25]), "smartek": ("Smartek", "Speciality nutrition", [50, 25]),
            "solutek": ("Solutek", "Water-soluble fertiliser", [25, 1]), "bensulf": ("Bensulf", "Sulphur nutrition", [10, 3]),
            "mahadhan-24-24-0": ("Mahadhan 24:24:0", "Complex fertiliser", [50])}
product_master = {
    "_comment": "Canonical product master with screen category names. Product references use the exact names below.",
    "products": [
        {"id": key, "name": name, "family": family, "category": PRODUCT_CATEGORY[name], "pack_sizes_kg": packs,
         "crops": sorted({crop.lower() for p in PRODUCTS if p[3] == key for crop in p[6]}), "active": True}
        for key, (name, family, packs) in families.items()
    ],
}
reference_masters = json.loads((REFERENCE_DIR / "masters.json").read_text(encoding="utf-8"))
reference_masters["crops"] = [{"id": name.lower(), "name": name} for name in SCREEN_CROPS]
reference_masters["seasons"] = [{"id": item[7], "name": item[1], "current": item[0] == CURRENT_SEASON} for item in SEASONS]

reference_masters["financial_years"] = [{"id": fy.lower().replace(" ", "-"), "name": fy} for fy in FY_VALUES]
reference_masters["crop_seasons"] = [{"id": name.lower().replace(" ", "-"), "name": name} for name in ("Kharif", "Rabi", "Late Rabi")]
reference_masters["themes"] = [{"id": name.lower().replace(" & ", "-").replace(" ", "-"), "name": name} for name in THEMES]
objective_names = set(OBJECTIVE_THEME)
objective_names.update(row.get("objective", "") for row in CAMPAIGN_PIN)
reference_masters["campaign_objectives"] = [{"id": name.lower().replace(" ", "-"), "name": name, "theme": OBJECTIVE_THEME.get(name, THEMES[0])} for name in sorted(objective_names) if name]
reference_masters["activity_costs"] = [
    {"activity": "demonstration", "base_cost_lakh_per_unit": 1.10},
    {"activity": "retailer activation", "base_cost_lakh_per_unit": 0.25},
    {"activity": "farmer meeting", "base_cost_lakh_per_unit": 0.20},
    {"activity": "digital advisory", "base_cost_lakh_per_unit": 0.30},
    {"activity": "follow-up", "base_cost_lakh_per_unit": 0.15},
    {"activity": "default", "base_cost_lakh_per_unit": 0.20},
]
people = [{"id": str(person_row["id"]), "name": person_row["name"], "role": person_row["role"], "region": person_row.get("region"), "territory": person_row.get("territory"), "mu_id": person_row.get("mu_id")} for person_row in T["field_staff"]]
for name, role, region in [("Sayak Patil", "Business Head", None), ("R. Jadhav", "Marketing Head", "West"), ("S. Patil", "Marketing Head", "South"), ("V. Shinde", "Marketing Head", "North"), ("P. Kale", "Marketing Head", "East")]:
    if not any(person_row["name"] == name and person_row["role"] == role for person_row in people):
        people.append({"id": f"screen-{len(people)+1}", "name": name, "role": role, "region": region})
reference_masters["people"] = people
for path, payload in (("geography.json", geography), ("products.json", product_master), ("masters.json", reference_masters)):
    (REFERENCE_DIR / path).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# Register every generated dataset with the shared web/API catalog and export static snapshots.
CATALOG_PATH = SERVER_DIR / "data" / "datasets" / "catalog.json"
catalog_data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
SCREEN_MAP = {
    "portfolio.campaigns": ["s1.1", "s1.2", "s1.3", "bh.2"],
    "bh.region_performance": ["bh.3", "bh.3a"], "bh.investment_roi": ["bh.5", "bh.5a"],
    "bh.theme_pipeline": ["bh.7", "bh.7a"], "bh.interventions": ["bh.9"],
    "mh.regional_opportunity": ["mh.1", "mh.2"], "mh.plan_alignment": ["mh.3"],
    "mh.campaign_mix_calendar": ["mh.6"], "mh.approvals": ["mh.7", "mh.8"],
    "pm.portfolio_abp": ["pm.1"], "pm.territory_plans": ["pm.2", "pm.3"],
    "pm.activity_approvals": ["pm.7"], "pm.impact_uplift": ["pm.9"],
    "tm.territory_plan": ["tm.1"], "tm.outlets": ["tm.2"], "tm.village_coverage": ["tm.4"],
    "tm.campaign_activities": ["cw.2"], "tm.execution_weekly": ["tm.ex1"], "tm.impact": ["tm.ex2"],
}
entries = catalog_data.setdefault("datasets", [])
by_name = {entry["name"]: entry for entry in entries}
for name in DS_ORDER:
    records = DS[name]
    columns = []
    for key in (records[0].keys() if records else []):
        value = next((row.get(key) for row in records if row.get(key) is not None), None)
        typ = "boolean" if isinstance(value, bool) else "number" if isinstance(value, (int, float)) else "string"
        columns.append({"name": key, "type": typ, "description": f"{key.replace('_', ' ').capitalize()} in {name}."})
    existing = by_name.get(name)
    if existing:
        old = {column["name"]: column for column in existing.get("columns", [])}
        old.update({column["name"]: column for column in columns})
        existing["columns"] = list(old.values())
        existing["screens"] = sorted(set(existing.get("screens", []) + SCREEN_MAP.get(name, [])))
        existing["screen"] = SCREEN_MAP.get(name, [existing.get("screen", "")])[0]
    else:
        entry = {"name": name, "title": name.replace(".", " ").replace("_", " ").title(), "screen": SCREEN_MAP[name][0],
                 "screens": SCREEN_MAP[name], "source_system": "CampaignIQ canonical synthetic workbook", "refresh": "daily",
                 "description": DS_DOCS[name], "columns": columns}
        entries.append(entry)
        by_name[name] = entry
CATALOG_PATH.write_text(json.dumps(catalog_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
SNAPSHOT_DIR = SERVER_DIR.parent / "web" / "src" / "data" / "snapshot"
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
for name in DS_ORDER:
    payload = json.loads(json.dumps(DS[name], ensure_ascii=False, default=lambda value: value.isoformat() if hasattr(value, "isoformat") else str(value)))
    (SNAPSHOT_DIR / f"{name.replace('.', '__')}.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

counts = {name: len(T[name]) for name in TABLE_ORDER}
counts.update({f"ds.{name}": len(DS[name]) for name in DS_ORDER})
print(f"Wrote {OUTPUT}")
for name, count in list(counts.items())[:12]:
    print(f"  {name:34s} {count:>7,}")
if len(counts) > 12:
    print(f"  ... {len(counts) - 12} additional sheets; total rows {sum(counts.values()):,}")
print(f"  canonical ds datasets: {len(DS_ORDER)}; snapshots: {len(DS_ORDER)}")
