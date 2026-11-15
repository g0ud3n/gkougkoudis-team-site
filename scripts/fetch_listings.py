#!/usr/bin/env python3
"""Fetch the team's live listings from remax-deltaktima.gr into data/listings.json.
Source: WordPress REST (author 62 = gkougkoudis team) + each listing page for details."""
import json, re, html, sys, urllib.request, os, datetime
BASE = "https://cdn.remax-deltaktima.gr"
AUTHOR = 62
UA = {"User-Agent": "Mozilla/5.0 (team-site-builder)"}

def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")

def text(s):
    s = re.sub(r"<script.*?</script>|<style.*?</style>", "", s, flags=re.S)
    s = html.unescape(re.sub(r"<[^>]+>", "\n", s))
    return [l.strip() for l in s.split("\n") if l.strip()]

def after(lines, label):
    for i, l in enumerate(lines):
        if l.rstrip(":") == label and i + 1 < len(lines):
            return lines[i + 1]
    return ""

def parse(page_html, rest):
    L = text(page_html)
    d = {"id": rest["id"], "url": rest["link"], "title": html.unescape(rest["title"]["rendered"]),
         "date": rest["date"], "purpose": "rent" if "purpose-rent" in rest["class_list"] else "sale",
         "types": [c.replace("property-type-", "") for c in rest["class_list"] if c.startswith("property-type-")]}
    m = re.search(r"Κωδικός Ακινήτου:\s*([0-9]{3,5}-[0-9]{3,6})", " ".join(L))
    d["code"] = m.group(1) if m else after(L, "ID")
    # address line = line after the status line (Πωλείται./Ενοικιάζεται.) + title
    d["address"] = next((l for l in L if re.search(r", Ν\. [Α-Ωα-ωάέήίόύώ]+", l) and len(l) < 90), "")
    d["sqm"] = after(L, "Επιφάνεια σε τ.μ.")
    d["year"] = after(L, "Έτος Κατασκευής")
    d["floor"] = after(L, "Όροφος")
    d["bedrooms"] = after(L, "Υπνοδωμάτια")
    d["baths"] = after(L, "Μπάνια")
    d["energy"] = after(L, "Ενεργειακή κλάση")
    m = re.search(r'jet-listing-dynamic-field__content"[^>]*>\s*([0-9][0-9.,]*)\s*€', page_html)
    d["price"] = m.group(1) + " €" if m else ""
    m = re.search(r"Υπεύθυνος συνεργάτης:\s*(.+?)E-mail", " ".join(L))
    d["agent"] = m.group(1).strip() if m else ""
    # description = the paragraph that contains «Υπεύθυνος συνεργάτης», before it
    desc = next((l for l in L if "Υπεύθυνος συνεργάτης" in l), "")
    d["description"] = desc.split("Θέλετε περισσότερες")[0].strip()
    media = json.loads(get(f"{BASE}/wp-json/wp/v2/media?parent={rest['id']}&per_page=100&_fields=id,source_url"))
    feat = rest.get("featured_media")
    media.sort(key=lambda m: (m["id"] != feat, m["id"]))
    d["photos"] = [m["source_url"].replace("cdn.remax-deltaktima.gr", "www.remax-deltaktima.gr") for m in media]
    return d

def main(out):
    rest = json.loads(get(f"{BASE}/wp-json/wp/v2/properties?author={AUTHOR}&per_page=100"))
    items = []
    for r in rest:
        try:
            page = get(r["link"].replace("www.remax-deltaktima.gr", "cdn.remax-deltaktima.gr"))
            items.append(parse(page, r))
        except Exception as e:
            print("skip", r.get("link"), e, file=sys.stderr)
    if len(items) < max(1, len(rest) // 2):
        sys.exit("too few listings parsed, keeping the old file")
    items.sort(key=lambda x: x["date"], reverse=True)
    json.dump({"source": "remax-deltaktima.gr", "updated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "count": len(items), "listings": items},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(items), "listings ->", out)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "data", "listings.json"))
