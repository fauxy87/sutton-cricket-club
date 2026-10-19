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


def field(obj, *keys):
    if not isinstance(obj, dict): return ""
    for key in keys:
        val = obj.get(key)
        if val is not None and not isinstance(val, (dict, list)) and str(val).strip():
            return str(val).strip()
    return ""

def identify_side(match, site_id):
    """Use club identity, never generic team names such as '1st XI'."""
    home_id = field(match, "home_club_id", "home_site_id", "home_club_site_id")
    away_id = field(match, "away_club_id", "away_site_id", "away_club_site_id")
    home_club = field(match, "home_club_name", "home_site_name")
    away_club = field(match, "away_club_name", "away_site_name")
    def is_sutton(name):
        return name.casefold().replace(".", "").strip() in ("sutton cc", "sutton cricket club")
    home = home_id == str(site_id) or is_sutton(home_club)
    away = away_id == str(site_id) or is_sutton(away_club)
    if home == away:
        return "", "ambiguous club identity (needs manual check)"
    # Reject name/ID contradictions instead of silently picking a side.
    if (home and away_id == str(site_id)) or (away and home_id == str(site_id)):
        return "", "conflicting club identity"
    return ("home_team" if home else "away_team"), ("club ID" if (home_id if home else away_id) == str(site_id) else "club name")

def captain_side(path):
    if "/home_team/" in path: return "home_team"
    if "/away_team/" in path: return "away_team"
    return ""

def captain_team(match, side):
    prefix = "home" if side == "home_team" else "away"
    return field(match, prefix + "_team_name", prefix + "_team") or "Unidentified Sutton team"

def classify_team(name):
    n = name.casefold()
    if "women" in n or "ladies" in n or "female" in n: return "Women"
    if "midweek" in n or "mid-week" in n: return "Midweek XI"
    if "sunday" in n or "development" in n: return "Sunday XI"
    if "2nd" in n or "second" in n: return "2nd XI"
    if "1st" in n or "first" in n: return "1st XI"
    return "Other / check"

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
                details = items(detail, "match_details", "match_detail")
                info = details[0] if details else {}
                # Only authoritative club fields may establish the Sutton side.
                side, basis = identify_side(match, args.site_id)
                if not side:
                    side, basis = identify_side(info, args.site_id)
                for c in find_captains(detail):
                    listed_side = captain_side(c["path"])
                    status = ("Sutton side verified" if side and side == listed_side
                              else "Opposition excluded" if side and listed_side and side != listed_side
                              else "Needs Sutton side verification")
                    team_name = captain_team(match, side) if side else ""
                    rows.append({
                        "season": season, "match_id": mid,
                        "date": field(match, "match_date", "date"),
                        "home_team": field(match, "home_team_name", "home_team"),
                        "away_team": field(match, "away_team_name", "away_team"),
                        "home_club": field(match, "home_club_name", "home_site_name") or field(info, "home_club_name", "home_site_name"),
                        "away_club": field(match, "away_club_name", "away_site_name") or field(info, "away_club_name", "away_site_name"),
                        "captain_name": c["name"], "data_path": c["path"],
                        "captain_side": listed_side, "sutton_side": side,
                        "sutton_team": team_name, "team_group": classify_team(team_name) if side else "",
                        "identity_basis": basis, "review_status": status
                    })
                time.sleep(0.15)
            except Exception as exc:
                print(f"  Match {mid}: {type(exc).__name__}")
    fields = ["season","match_id","date","home_team","away_team","home_club","away_club",
              "captain_name","data_path","captain_side","sutton_side","sutton_team",
              "team_group","identity_basis","review_status"]
    with (out/"captain-appearances.csv").open("w",newline="",encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    verified = [r for r in rows if r["review_status"] == "Sutton side verified"]
    counts = collections.Counter((r["season"],r["team_group"],r["sutton_team"],r["captain_name"]) for r in verified)
    totals = collections.Counter((r["season"],r["team_group"],r["sutton_team"]) for r in verified)
    with (out/"sutton-captain-candidates.csv").open("w",newline="",encoding="utf-8") as f:
        w=csv.writer(f)
        w.writerow(["season","team_group","sutton_team","captain_name","captain_matches","team_matches_with_identified_captain","review_note"])
        for (year,group,team,name),n in sorted(counts.items()):
            total=totals[(year,group,team)]
            note = "Possible stand-in / verify" if n < total else "Verify season appointment against AGM"
            w.writerow([year,group,team,name,n,total,note])
    with (out/"needs-manual-review.csv").open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
        w.writerows(r for r in rows if r["review_status"] == "Needs Sutton side verification")
    print(f"Records: {len(rows)}; verified Sutton captain appearances: {len(verified)}; unclassified: {sum(r['review_status'] == 'Needs Sutton side verification' for r in rows)}")
    print("Only verified Sutton-side appearances appear in the candidate summary.")
    print("Stand-ins and season appointments must still be checked against AGM records.")

if __name__ == "__main__":
    main()
