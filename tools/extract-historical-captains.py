#!/usr/bin/env python3
"""Extract Sutton CC match captains from Play-Cricket (2009 onward).

Requires an authorised Play-Cricket API key supplied through PC_API_TOKEN.
No secret is stored, printed or committed. Uses only completed matches and
Sutton teams; output is for manual historical review, not automatic publication.
"""
import argparse
import collections
import csv
import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "https://play-cricket.com/api/v2/"
def get(endpoint, params):
    token = os.getenv("PC_API_TOKEN")
    if not token:
        raise SystemExit("Set PC_API_TOKEN in your environment (never commit the key).")
    url = BASE + endpoint + "?" + urllib.parse.urlencode({**params, "api_token": token})
    req = urllib.request.Request(url, headers={"User-Agent": "SuttonCC-HistoricalCaptains/1.0"})
    with urllib.request.urlopen(req, timeout=35) as resp:
        return json.load(resp)

def items(payload, *keys):
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return []
    for key in keys:
        if isinstance(payload.get(key), list):
            return payload[key]
    return []

def find_captains(obj, trail=""):
    found = []
    if isinstance(obj, dict):
        name = obj.get("player_name") or obj.get("name") or obj.get("full_name")
        cap = obj.get("captain")
        if name and str(cap).strip().lower() in ("true", "yes", "y", "1"):
            found.append({"name": str(name), "path": trail, "raw": obj})
        for key, val in obj.items():
            if isinstance(val, (dict, list)):
                found.extend(find_captains(val, trail + "/" + key))
    elif isinstance(obj, list):
        for i, val in enumerate(obj):
            found.extend(find_captains(val, trail + "/" + str(i)))
    return found

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-id", type=int, default=6168)
    ap.add_argument("--start", type=int, default=2009)
    ap.add_argument("--end", type=int, default=2026)
    ap.add_argument("--output", default="captains-research")
    args = ap.parse_args()
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    rows = []
    for season in range(args.start, args.end + 1):
        try:
            payload = get("matches.json", {"site_id": args.site_id, "season": season})
            matches = items(payload, "matches", "match")
            print(f"{season}: {len(matches)} match listings")
        except Exception as exc:
            print(f"{season}: match listings error: {type(exc).__name__}")
            continue
        for match in matches:
            mid = match.get("id") or match.get("match_id")
            if not mid: continue
            try:
                detail = get("match_detail.json", {"match_id": mid})
                captains = find_captains(detail)
                # Retain evidence path/team fields for manual checks: a scorecard
                # includes opposition captains as well as Sutton captains.
                for c in captains:
                    rows.append({
                        "season":season, "match_id":mid,
                        "date":match.get("match_date") or match.get("date") or "",
                        "home_team":match.get("home_team_name") or match.get("home_team") or "",
                        "away_team":match.get("away_team_name") or match.get("away_team") or "",
                        "captain_name":c["name"],"data_path":c["path"],
                        "player_site_id":c["raw"].get("site_id", ""),
                        "team_id":c["raw"].get("team_id",""),
                        "review_status":"Needs team/opposition verification"
                    })
                time.sleep(0.15)
            except Exception as exc:
                print(f"  Match {mid}: {type(exc).__name__}")
    fields = ["season","match_id","date","home_team","away_team","captain_name",
              "data_path","player_site_id","team_id","review_status"]
    with (out/"captain-appearances.csv").open("w",newline="",encoding="utf-8") as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
    counts=collections.Counter((r["season"],r["captain_name"]) for r in rows)
    with (out/"captain-candidates.csv").open("w",newline="",encoding="utf-8") as f:
        w=csv.writer(f);w.writerow(["season","captain_name","match_appearances_unverified"])
        for (year,name),n in sorted(counts.items()):
            w.writerow([year,name,n])
    print(f"Wrote {len(rows)} unverified captain records to {out}/")
    print("IMPORTANT: Opposition captains may be included; confirm Sutton team,")
    print("match status and stand-in vs season captain before publishing.")

if __name__=="__main__":
    main()
