-- ข้อมูลตัวอย่างของ Gear Up (16-17 พ.ย. 2026) สร้างโดย tools/seed_from_dataset.py ห้ามแก้มือ
-- รันซ้ำได้: ลบข้อมูลร้านเดิมก่อน (ไม่แตะตาราง Login ของ Better Auth)
DELETE FROM bookings;
DELETE FROM slots;
DELETE FROM cars;
DELETE FROM customers;
DELETE FROM mechanics;
DELETE FROM services;
INSERT INTO services (id, name, minutes, price, price_big) VALUES
  ('oil', 'เปลี่ยนน้ำมันเครื่อง', 45, 1200, 1600),
  ('tyres', 'สลับยางและถ่วงล้อ', 60, 800, 800),
  ('brakes', 'เปลี่ยนผ้าเบรก', 90, 2500, 2500),
  ('check', 'เช็กระยะ', 120, 3500, 3500);
INSERT INTO mechanics (id, name, services) VALUES
  ('tum', 'ช่างตั้ม', '["oil","check"]'),
  ('ohm', 'ช่างโอม', '["tyres","brakes"]'),
  ('beer', 'ช่างเบียร์', '["oil","tyres","brakes","check"]');
INSERT INTO customers (id, name, phone) VALUES
  ('C01', 'คุณปอนด์', '081-234-1001'),
  ('C02', 'คุณฟ้า', '081-234-1002'),
  ('C03', 'คุณต้อม', '081-234-1003'),
  ('C04', 'คุณก้อง', '081-234-1004'),
  ('C05', 'คุณอ้อม', '081-234-1005'),
  ('C06', 'คุณวิน', '081-234-1006'),
  ('C07', 'คุณชมพู่', '081-234-1007'),
  ('C08', 'คุณป้อม', '081-234-1008'),
  ('C09', 'คุณเปิ้ล', '081-234-1009'),
  ('C10', 'คุณข้าวหอม', '081-234-1010'),
  ('C11', 'คุณนัท', '081-234-1011'),
  ('C12', 'คุณปิง', '081-234-1012'),
  ('C13', 'คุณจ๋า', '081-234-1013'),
  ('C14', 'คุณภูผา', '081-234-1014'),
  ('C15', 'คุณปาล์ม', '081-234-1015'),
  ('C16', 'คุณมุก', '081-234-1016'),
  ('C17', 'คุณแป้ง', '081-234-1017');
INSERT INTO cars (plate, customer_id, model, size) VALUES
  ('1กข-1234', 'C01', 'Toyota Yaris', 'small'),
  ('2กค-5678', 'C02', 'Honda City', 'small'),
  ('3ขง-9012', 'C03', 'Isuzu D-Max', 'big'),
  ('4คจ-3456', 'C04', 'Toyota Fortuner', 'big'),
  ('5งฉ-7890', 'C05', 'Mazda 2', 'small'),
  ('6จช-2345', 'C06', 'Ford Ranger', 'big'),
  ('7ฉซ-6789', 'C07', 'Honda Jazz', 'small'),
  ('8ชฌ-0123', 'C08', 'Nissan Almera', 'small'),
  ('9ซญ-4567', 'C09', 'Mitsubishi Triton', 'big'),
  ('1ฌฎ-8901', 'C10', 'Toyota Corolla Cross', 'big'),
  ('2ญฐ-3344', 'C11', 'Honda Civic', 'small'),
  ('3ฎฑ-5566', 'C12', 'Toyota Hilux Revo', 'big'),
  ('4ฐฒ-7788', 'C13', 'Suzuki Swift', 'small'),
  ('5ฑณ-9900', 'C14', 'Isuzu MU-X', 'big'),
  ('6ฒด-1122', 'C15', 'Mazda CX-3', 'small'),
  ('7ณต-3344', 'C16', 'Toyota Vios', 'small'),
  ('8ดถ-5566', 'C17', 'Nissan Navara', 'big');
INSERT INTO slots (id, day, time, bays) VALUES
  (1, '2026-11-16', '09:00', 4),
  (2, '2026-11-16', '11:00', 4),
  (3, '2026-11-16', '13:00', 4),
  (4, '2026-11-16', '15:00', 4),
  (5, '2026-11-17', '09:00', 4),
  (6, '2026-11-17', '11:00', 4),
  (7, '2026-11-17', '13:00', 4),
  (8, '2026-11-17', '15:00', 4);
INSERT INTO bookings (id, code, slot_id, plate, service_id, mechanic_id, status, note, price, phone) VALUES
  ('B201', 'GU-7K2P', 5, '1กข-1234', 'oil', 'tum', 'booked', NULL, 1200, '081-234-1001'),
  ('B202', 'GU-BURY', 5, '3ขง-9012', 'tyres', 'ohm', 'booked', NULL, 800, '081-234-1003'),
  ('B203', 'GU-CRED', 5, '5งฉ-7890', 'check', 'beer', 'booked', NULL, 3500, '081-234-1005'),
  ('B204', 'GU-MPVG', 6, '2กค-5678', 'oil', 'tum', 'booked', NULL, 1200, '081-234-1002'),
  ('B205', 'GU-BBNN', 6, '4คจ-3456', 'oil', 'tum', 'booked', NULL, 1600, '081-234-1004'),
  ('B206', 'GU-S9DS', 6, '6จช-2345', 'brakes', 'ohm', 'booked', NULL, 2500, '081-234-1006'),
  ('B207', 'GU-FTAR', 6, '7ฉซ-6789', 'check', 'beer', 'booked', NULL, 3500, '081-234-1007'),
  ('B208', 'GU-8W6N', 7, '8ชฌ-0123', 'brakes', 'ohm', 'booked', NULL, 2500, '081-234-1008'),
  ('B209', 'GU-4RNZ', 7, '9ซญ-4567', 'oil', 'tum', 'cancelled', 'ย้ายไปรอบ 15:00', 1600, '081-234-1009'),
  ('B210', 'GU-R5YH', 8, '1ฌฎ-8901', 'tyres', 'ohm', 'booked', NULL, 800, '081-234-1010'),
  ('B211', 'GU-SN4F', 8, '9ซญ-4567', 'oil', 'tum', 'booked', NULL, 1600, '081-234-1009'),
  ('B101', 'GU-AMRR', 1, '2ญฐ-3344', 'check', 'tum', 'done', NULL, 3500, '081-234-1011'),
  ('B102', 'GU-GN5X', 1, '3ฎฑ-5566', 'oil', 'beer', 'done', NULL, 1600, '081-234-1012'),
  ('B103', 'GU-3D5C', 2, '4ฐฒ-7788', 'tyres', 'ohm', 'done', NULL, 800, '081-234-1013'),
  ('B104', 'GU-HPC9', 2, '5ฑณ-9900', 'brakes', 'ohm', 'done', NULL, 2500, '081-234-1014'),
  ('B105', 'GU-ZTFZ', 2, '6ฒด-1122', 'oil', 'tum', 'cancelled', 'ไม่มาตามนัด', 1200, '081-234-1015'),
  ('B106', 'GU-9YXG', 3, '7ณต-3344', 'oil', 'tum', 'done', NULL, 1200, '081-234-1016'),
  ('B107', 'GU-53QD', 3, '8ดถ-5566', 'check', 'beer', 'done', NULL, 3500, '081-234-1017'),
  ('B108', 'GU-KBWD', 4, '6ฒด-1122', 'oil', 'tum', 'done', 'กลับมารอบ 15:00', 1200, '081-234-1015');
