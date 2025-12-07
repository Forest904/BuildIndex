#!/usr/bin/env python3
"""
Normalize the raw device CSVs under datasets/ into a single devices table.
The script reads the known laptop/phone/tablet exports, cleans units, standardizes
brands/models, and emits datasets/devices.csv with a unified schema.
"""
from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
DATASETS_DIR = ROOT / "datasets"
OUTPUT_PATH = DATASETS_DIR / "devices.csv"

DEVICE_FIELDS = [
    "id",
    "category",
    "brand",
    "model",
    "status",
    "price",
    "currency",
    "release_year",
    "cpu_brand",
    "cpu_model",
    "cpu_cores",
    "cpu_threads",
    "cpu_clock_ghz",
    "gpu_name",
    "ram_gb",
    "storage_gb",
    "storage_type",
    "screen_size_in",
    "resolution_width",
    "resolution_height",
    "refresh_rate_hz",
    "os",
    "touchscreen",
    "battery_mah",
    "fast_charging_w",
    "fast_charging",
    "sim_slots",
    "network_tech",
    "spec_score",
]

BRAND_NORMALIZATION: Dict[str, str] = {
    "apple": "Apple",
    "asus": "Asus",
    "alurin": "Alurin",
    "dell": "Dell",
    "hp": "HP",
    "hewlett packard": "HP",
    "lenovo": "Lenovo",
    "msi": "MSI",
    "oneplus": "OnePlus",
    "realme": "Realme",
    "samsung": "Samsung",
    "samsung electronics": "Samsung",
    "xiaomi": "Xiaomi",
}

CORE_WORDS = {
    "single": 1,
    "dual": 2,
    "triple": 3,
    "quad": 4,
    "penta": 5,
    "hexa": 6,
    "octa": 8,
    "deca": 10,
}


def slug(value: Optional[str]) -> str:
    if value is None:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", str(value).lower()).strip()


def clean_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = re.sub(r"\s+", " ", str(value)).strip()
    cleaned = cleaned.encode("ascii", "ignore").decode()
    return cleaned or None


def normalize_brand(brand: Optional[str]) -> Optional[str]:
    if not brand:
        return None
    key = slug(brand)
    return BRAND_NORMALIZATION.get(key, brand.strip())


def parse_float(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    s = str(value).strip().replace(",", "")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        match = re.findall(r"[\d.]+", s)
        if not match:
            return None
        try:
            return float(match[0])
        except ValueError:
            return None


def parse_int(value: Optional[str]) -> Optional[int]:
    number = parse_float(value)
    return int(number) if number is not None else None


def parse_memory_gb(value: Optional[str]) -> Optional[float]:
    """Handle inputs like '8 GB', '8GB', '8192 MB', '1 TB'."""
    if value is None:
        return None
    s = str(value).strip().lower().replace(",", "")
    if not s:
        return None
    match = re.findall(r"[\d.]+", s)
    if not match:
        return None
    amount = float(match[0])
    if "tb" in s:
        amount *= 1024
    elif "mb" in s:
        amount /= 1024
    return round(amount, 2)


def derive_storage_type(ssd_gb: Optional[float], hdd_gb: Optional[float], hinted: Optional[str] = None) -> Optional[str]:
    hinted_clean = (hinted or "").strip() or None
    if hinted_clean:
        return hinted_clean
    if ssd_gb and hdd_gb:
        return "SSD+HDD"
    if ssd_gb:
        return "SSD"
    if hdd_gb:
        return "HDD"
    return None


def parse_screen_size_in(value: Optional[str]) -> Optional[float]:
    return parse_float(value)


def parse_resolution(value: Optional[str]) -> Tuple[Optional[int], Optional[int]]:
    if not value:
        return (None, None)
    numbers = re.findall(r"\d+", str(value))
    if len(numbers) >= 2:
        return int(numbers[0]), int(numbers[1])
    return (None, None)


def parse_refresh_rate(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    numbers = re.findall(r"\d+", str(value))
    return int(numbers[0]) if numbers else None


def parse_touch(value: Optional[str]) -> Optional[bool]:
    if value is None:
        return None
    s = str(value).lower()
    if any(token in s for token in ["yes", "y", "true", "touch"]):
        return True
    if any(token in s for token in ["no", "n", "false"]):
        return False
    return None


def parse_bool(value: Optional[str]) -> Optional[bool]:
    if value is None:
        return None
    s = str(value).strip().lower()
    if s in {"1", "true", "yes", "y", "on"}:
        return True
    if s in {"0", "false", "no", "n", "off"}:
        return False
    return None


def parse_sim_slots(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    s = str(value).lower()
    if "dual" in s:
        return 2
    if "single" in s:
        return 1
    if "wi-fi" in s or "wifi" in s:
        return 0
    return None


def parse_cpu_cores_text(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    s = str(value).lower()
    for word, count in CORE_WORDS.items():
        if word in s:
            return count
    match = re.search(r"(\d+)\s*core", s)
    if match:
        return int(match.group(1))
    return parse_int(value)


def parse_cpu_clock(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    match = re.search(r"([\d.]+)\s*ghz", str(value).lower())
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return None
    return None


def parse_battery_mah(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    match = re.findall(r"\d+", str(value))
    return int(match[0]) if match else None


def parse_fast_charging_w(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    match = re.search(r"(\d+)\s*w", str(value).lower())
    if match:
        return int(match.group(1))
    return parse_int(value)


def guess_cpu_brand(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    s = str(text).lower()
    if "intel" in s:
        return "Intel"
    if "amd" in s or "ryzen" in s:
        return "AMD"
    if "apple" in s or "bionic" in s or "m1" in s or "m2" in s:
        return "Apple"
    if "snapdragon" in s or "qualcomm" in s:
        return "Qualcomm"
    if "helio" in s or "mediatek" in s:
        return "MediaTek"
    if "exynos" in s:
        return "Samsung"
    return None


def clean_os(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    s = str(value).lower()
    if "windows" in s:
        return "Windows"
    if "android" in s:
        return "Android"
    if "ios" in s or "ipados" in s:
        return "iOS"
    if "mac" in s:
        return "macOS"
    if "chrome" in s:
        return "ChromeOS"
    return value.strip()


def base_device(category: str) -> Dict[str, Optional[str]]:
    return {
        "id": None,
        "category": category,
        "brand": None,
        "model": None,
        "status": None,
        "price": None,
        "currency": None,
        "release_year": None,
        "cpu_brand": None,
        "cpu_model": None,
        "cpu_cores": None,
        "cpu_threads": None,
        "cpu_clock_ghz": None,
        "gpu_name": None,
        "ram_gb": None,
        "storage_gb": None,
        "storage_type": None,
        "screen_size_in": None,
        "resolution_width": None,
        "resolution_height": None,
        "refresh_rate_hz": None,
        "os": None,
        "touchscreen": None,
        "battery_mah": None,
        "fast_charging_w": None,
        "fast_charging": None,
        "sim_slots": None,
        "network_tech": None,
        "spec_score": None,
    }


def normalize_laptop_catalog() -> List[Dict[str, Optional[str]]]:
    path = DATASETS_DIR / "laptop.csv"
    if not path.exists():
        return []
    devices: List[Dict[str, Optional[str]]] = []
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            device = base_device("laptop")
            device["brand"] = normalize_brand(row.get("brand"))
            device["model"] = clean_text(row.get("model_name"))
            device["cpu_model"] = clean_text(row.get("processor_name"))
            device["cpu_brand"] = guess_cpu_brand(device["cpu_model"])
            device["cpu_cores"] = parse_int(row.get("no_of_cores"))
            device["cpu_threads"] = parse_int(row.get("no_of_threads"))
            device["gpu_name"] = clean_text(row.get("graphics"))
            device["ram_gb"] = parse_memory_gb(row.get("ram(GB)"))

            ssd_gb = parse_memory_gb(row.get("ssd(GB)"))
            hdd_gb = parse_memory_gb(row.get("Hard Disk(GB)"))
            storage_total = (ssd_gb or 0) + (hdd_gb or 0)
            device["storage_gb"] = storage_total if storage_total else None
            device["storage_type"] = derive_storage_type(ssd_gb, hdd_gb)

            device["screen_size_in"] = parse_screen_size_in(row.get("screen_size(inches)"))
            res_w, res_h = parse_resolution(row.get("resolution (pixels)"))
            device["resolution_width"] = res_w
            device["resolution_height"] = res_h
            device["os"] = clean_os(row.get("Operating System"))
            device["price"] = parse_float(row.get("price"))
            device["spec_score"] = parse_float(row.get("spec_score"))
            devices.append(device)
    return devices


def normalize_laptop_prices() -> List[Dict[str, Optional[str]]]:
    path = DATASETS_DIR / "Laptops Price Dataset export 2025-12-06 13-15-48.csv"
    if not path.exists():
        return []
    devices: List[Dict[str, Optional[str]]] = []
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            device = base_device("laptop")
            device["status"] = (row.get("Status") or "").strip() or None
            device["brand"] = normalize_brand(row.get("Brand"))
            device["model"] = clean_text(row.get("Laptop") or row.get("Model"))
            device["cpu_model"] = clean_text(row.get("CPU"))
            device["cpu_brand"] = guess_cpu_brand(device["cpu_model"])
            device["ram_gb"] = parse_memory_gb(row.get("RAM"))
            device["storage_gb"] = parse_memory_gb(row.get("Storage"))
            device["storage_type"] = clean_text(row.get("Storage type")) or derive_storage_type(None, None)
            device["gpu_name"] = clean_text(row.get("GPU"))
            device["screen_size_in"] = parse_screen_size_in(row.get("Screen"))
            device["touchscreen"] = parse_touch(row.get("Touch"))
            device["price"] = parse_float(row.get("Final Price"))
            device["os"] = None
            devices.append(device)
    return devices


def normalize_smartphones() -> List[Dict[str, Optional[str]]]:
    path = DATASETS_DIR / "Real World Smartphone's Dataset export 2025-12-06 13-23-56.csv"
    if not path.exists():
        return []
    devices: List[Dict[str, Optional[str]]] = []
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            device = base_device("phone")
            device["brand"] = normalize_brand(row.get("brand_name"))
            device["model"] = clean_text(row.get("model"))
            device["price"] = parse_float(row.get("price"))
            device["cpu_model"] = clean_text(row.get("processor_brand"))
            device["cpu_brand"] = guess_cpu_brand(device["cpu_model"])
            device["cpu_cores"] = parse_int(row.get("num_cores"))
            device["cpu_clock_ghz"] = parse_float(row.get("processor_speed"))
            device["ram_gb"] = parse_memory_gb(row.get("ram_capacity"))
            device["storage_gb"] = parse_memory_gb(row.get("internal_memory"))
            device["battery_mah"] = parse_int(row.get("battery_capacity"))
            device["fast_charging"] = parse_bool(row.get("fast_charging_available"))
            device["fast_charging_w"] = parse_fast_charging_w(row.get("fast_charging"))
            device["screen_size_in"] = parse_screen_size_in(row.get("screen_size"))
            device["refresh_rate_hz"] = parse_int(row.get("refresh_rate"))
            device["resolution_height"] = parse_int(row.get("resolution_height"))
            device["resolution_width"] = parse_int(row.get("resolution_width"))
            device["os"] = clean_os(row.get("os"))
            device["touchscreen"] = True
            device["network_tech"] = "5G" if parse_bool(row.get("5G_or_not")) else "4G/3G"
            devices.append(device)
    return devices


def extract_brand_from_name(name: str) -> Optional[str]:
    if not name:
        return None
    first = name.split()[0]
    return normalize_brand(first)


def parse_ram_and_storage(text: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
    if not text:
        return (None, None)
    numbers = re.findall(r"\d+", str(text))
    ram = float(numbers[0]) if numbers else None
    storage = float(numbers[1]) if len(numbers) > 1 else None
    return ram, storage


def normalize_tablets() -> List[Dict[str, Optional[str]]]:
    path = DATASETS_DIR / "tablets.csv"
    if not path.exists():
        return []
    devices: List[Dict[str, Optional[str]]] = []
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            device = base_device("tablet")
            name = (row.get("name") or "").strip()
            device["brand"] = extract_brand_from_name(name)
            device["model"] = clean_text(name)
            device["price"] = parse_float(row.get("price"))
            device["spec_score"] = parse_float(row.get("specs"))
            device["sim_slots"] = parse_sim_slots(row.get("sim"))
            device["battery_mah"] = parse_battery_mah(row.get("battery"))
            device["fast_charging_w"] = parse_fast_charging_w(row.get("battery"))
            device["fast_charging"] = device["fast_charging_w"] is not None
            ram_gb, storage_gb = parse_ram_and_storage(row.get("ram"))
            device["ram_gb"] = ram_gb
            device["storage_gb"] = storage_gb
            device["network_tech"] = (row.get("networks") or "").strip() or None
            processor_text = (row.get("processor") or "").strip()
            device["cpu_model"] = processor_text or None
            device["cpu_brand"] = guess_cpu_brand(processor_text)
            device["cpu_cores"] = parse_cpu_cores_text(processor_text)
            device["cpu_clock_ghz"] = parse_cpu_clock(processor_text)

            screen_text = row.get("screen_size")
            device["screen_size_in"] = parse_screen_size_in(screen_text)
            res_w, res_h = parse_resolution(screen_text)
            device["resolution_width"] = res_w
            device["resolution_height"] = res_h
            device["refresh_rate_hz"] = parse_refresh_rate(screen_text)
            device["os"] = clean_os(row.get("os"))
            device["touchscreen"] = True
            devices.append(device)
    return devices


def main() -> None:
    all_devices: List[Dict[str, Optional[str]]] = []
    all_devices.extend(normalize_laptop_catalog())
    all_devices.extend(normalize_laptop_prices())
    all_devices.extend(normalize_smartphones())
    all_devices.extend(normalize_tablets())

    for idx, device in enumerate(all_devices, start=1):
        device["id"] = idx

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=DEVICE_FIELDS)
        writer.writeheader()
        writer.writerows(all_devices)
    print(f"Wrote {len(all_devices)} rows to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
