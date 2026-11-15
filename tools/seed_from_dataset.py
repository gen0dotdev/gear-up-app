"""สร้าง seed/0001_sample.sql (ข้อมูลตัวอย่างของ D1) จาก dataset.py ของ gen0

ข้อมูลตัวอย่างทุกคอร์สมาจาก dataset.py ไฟล์เดียว ถ้าแก้ข้อมูล ให้แก้ที่นั่นก่อน แล้วรันไฟล์นี้ใหม่
ไม่แก้ไฟล์ SQL ด้วยมือ (แนวเดียวกับ tools/seed_from_dataset.py ของ gear-up-api)

    python3 tools/seed_from_dataset.py ../../gen0/apps/web/scripts/coding/dataset.py

ต้องมี repo gen0 ในเครื่อง (ผู้เรียนไม่ต้องรันไฟล์นี้ seed/0001_sample.sql อยู่ใน repo แล้ว)
รหัสจองสุ่มด้วย Seed เดียวกับ gear-up-api (1117) จึงได้รหัสชุดเดียวกัน เช่น B201 = GU-7K2P
"""
import importlib.util
import json
import random
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "seed" / "0001_sample.sql"

NOTES = {
    "moved to 15:00": "ย้ายไปรอบ 15:00",
    "no-show": "ไม่มาตามนัด",
    "came back at 15:00": "กลับมารอบ 15:00",
}
CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def load(path):
    spec = importlib.util.spec_from_file_location("dataset", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.check()  # ตัวเลขทุกตัวใน data sheet ต้องถูกก่อน
    return mod


def codes(ids):
    # เหมือน gear-up-api ทุกบรรทัด: Seed คงที่ รันกี่ครั้งก็ได้รหัสเดิม
    rng = random.Random(1117)
    out, used = {}, set()
    for bid in ids:
        while True:
            c = "GU-" + "".join(rng.choice(CODE_CHARS) for _ in range(4))
            if c not in used:
                break
        used.add(c)
        out[bid] = c
    out["B201"] = "GU-7K2P"
    return out


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def insert(table, cols, rows):
    values = ",\n  ".join("(" + ", ".join(q(v) for v in r) + ")" for r in rows)
    return f"INSERT INTO {table} ({', '.join(cols)}) VALUES\n  {values};"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    d = load(sys.argv[1])
    code = codes([b[0] for b in d.BOOKINGS])
    slot_rows = [(day, t) for day in (d.TODAY, d.TOMORROW) for t in d.SLOTS]
    slot_id = {r: i + 1 for i, r in enumerate(slot_rows)}

    parts = [
        "-- ข้อมูลตัวอย่างของ Gear Up (16-17 พ.ย. 2026) สร้างโดย tools/seed_from_dataset.py ห้ามแก้มือ",
        "-- รันซ้ำได้: ลบข้อมูลร้านเดิมก่อน (ไม่แตะตาราง Login ของ Better Auth)",
        "DELETE FROM bookings;",
        "DELETE FROM slots;",
        "DELETE FROM cars;",
        "DELETE FROM customers;",
        "DELETE FROM mechanics;",
        "DELETE FROM services;",
        insert("services", ["id", "name", "minutes", "price", "price_big"], [list(s) for s in d.SERVICES]),
        # services ของช่างเก็บเป็นข้อความ JSON (SQLite ไม่มี Array)
        insert("mechanics", ["id", "name", "services"],
               [[m[0], m[1], json.dumps(m[2], separators=(",", ":"))] for m in d.MECHANICS]),
        insert("customers", ["id", "name", "phone"], [[c[0], c[1], c[2]] for c in d.CUSTOMERS]),
        insert("cars", ["plate", "customer_id", "model", "size"], [[c[4], c[0], c[3], c[5]] for c in d.CUSTOMERS]),
        # id ของรอบใส่เองให้คงที่ (1-4 = 16 พ.ย., 5-8 = 17 พ.ย.) การจองอ้างด้วยเลขนี้
        insert("slots", ["id", "day", "time", "bays"], [[slot_id[r], r[0], r[1], d.BAYS] for r in slot_rows]),
        insert("bookings",
               ["id", "code", "slot_id", "plate", "service_id", "mechanic_id", "status", "note", "price", "phone"],
               [[b[0], code[b[0]], slot_id[(b[1], b[2])], d.CUSTOMER[b[3]][4], b[4], b[5], b[6],
                 NOTES.get(b[7]) if b[7] else None,
                 d.price_for(b[4], d.CUSTOMER[b[3]][5]), d.CUSTOMER[b[3]][2]] for b in d.BOOKINGS]),
    ]
    OUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
