"""Decisive test: does `get: {}` return all fields, or nothing?

Follows the lesan-empty-result-diagnosis skill: get a Ghost token, then call the
act twice — once with an empty projection, once with explicit fields — and diff.
"""

import json
import urllib.request

BASE = "http://localhost:1404/lesan"


def call(model, act, details, token=None):
    payload = {"service": "main", "model": model, "act": act, "details": details}
    req = urllib.request.Request(
        BASE,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json",
                 **({"token": token} if token else {})},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.load(r)
    except Exception as exc:
        return {"_transport_error": str(exc)}


# --- Step 1: Ghost token ---------------------------------------------------
login = call(
    "user",
    "login",
    {"set": {"email": "ghost@nejat.ai", "password": "password123"},
     "get": {"user": {"_id": 1, "level": 1}}},
)
if not login.get("success"):
    print("login failed:", json.dumps(login, ensure_ascii=False)[:400])
    raise SystemExit(1)

token = login["body"]["token"]
print("login ok, level =", login["body"]["user"].get("level"))
print()

# --- ware.gets: empty projection vs explicit ------------------------------
print("=" * 62)
print("ware.gets  (validator get: selectStruct('ware', 1))")
print("=" * 62)

empty = call("ware", "gets", {"set": {"page": 1, "limit": 2}, "get": {}}, token)
explicit = call(
    "ware", "gets",
    {"set": {"page": 1, "limit": 2},
     "get": {"name": 1, "enName": 1, "ware_type": 1, "is_active": 1}},
    token,
)

for label, res in (("get: {}", empty), ("get: {name,enName,...}", explicit)):
    print(f"\n--- {label}")
    print("  success:", res.get("success"))
    body = res.get("body")
    if isinstance(body, list):
        print("  rows:", len(body))
        if body:
            print("  first row keys:", sorted(body[0].keys()))
            print("  first row:", json.dumps(body[0], ensure_ascii=False)[:220])
    else:
        print("  body:", json.dumps(body, ensure_ascii=False)[:300])

# --- announcement.gets: empty projection ----------------------------------
print()
print("=" * 62)
print("announcement.gets  (validator get: selectStruct('announcement', 1))")
print("=" * 62)

ann_empty = call("announcement", "gets", {"set": {"page": 1, "limit": 2}, "get": {}}, token)
print("\n--- get: {}")
print("  success:", ann_empty.get("success"))
body = ann_empty.get("body")
if isinstance(body, list):
    print("  rows:", len(body))
    if body:
        print("  first row keys:", sorted(body[0].keys()))
        print("  first row:", json.dumps(body[0], ensure_ascii=False)[:220])
else:
    print("  body:", json.dumps(body, ensure_ascii=False)[:300])
