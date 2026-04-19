import json
import re
import ssl
import urllib.request
from pathlib import Path

ctx = ssl._create_unverified_context()


def get_json(url: str, timeout: int = 12):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8", "ignore"))


text = Path("js/constants.js").read_text()
arr = re.search(r"const BSA_SEED_ZIPS = \[(.*?)\];", text, re.S)
if not arr:
    raise SystemExit("Could not locate BSA_SEED_ZIPS in js/constants.js")
zips = re.findall(r"'([0-9]{5})'", arr.group(1))

councils = {}
for z in zips:
    try:
        data = get_json(f"https://api.scouting.org/organizations/v2/zip/{z}/council")
    except Exception:
        continue

    number = data.get("councilNumber")
    if not number or number in councils:
        continue

    addr = data.get("primaryAddress") or {}
    zip_code = "".join(ch for ch in str(addr.get("zipCode") or data.get("zipCode") or z) if ch.isdigit())[:5]
    if zip_code:
        zip_code = zip_code.zfill(5)

    item = {
        "number": number,
        "name": data.get("councilName") or f"Council {number}",
        "zip": zip_code,
        "city": addr.get("city") or "",
        "state": addr.get("state") or "",
        "address": addr.get("address1") or "",
    }

    if zip_code:
        try:
            g = get_json(f"https://api.zippopotam.us/us/{zip_code}")
            place = (g.get("places") or [{}])[0]
            item["lat"] = float(place.get("latitude"))
            item["lng"] = float(place.get("longitude"))
            if not item["city"]:
                item["city"] = place.get("place name") or ""
            if not item["state"]:
                item["state"] = place.get("state abbreviation") or ""
        except Exception:
            pass

    councils[number] = item

out = [v for v in councils.values() if "lat" in v and "lng" in v]
out.sort(key=lambda x: (x.get("state", ""), x.get("name", "")))
Path("data/bsa-councils.json").write_text(json.dumps(out, indent=2))

print(f"seed zips: {len(zips)}")
print(f"councils geocoded: {len(out)}")
