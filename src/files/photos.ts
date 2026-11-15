// รูปบริการใน R2: ตรวจไฟล์, ตั้งชื่อ Key, เขียน และอ่าน
// ชั้นนี้รู้จัก R2 แต่ไม่รู้จัก Action หรือการล็อกอิน (เช็กสิทธิ์ที่ Action ก่อนเรียก)

export const MAX_BYTES = 2 * 1024 * 1024 // 2 MB: รูปจากมือถือย่อแล้วพอ และไม่กิน CPU ของ Worker

// ชนิดไฟล์ที่รับ และ "ลายเซ็น" (Magic Bytes) ต้นไฟล์ของแต่ละชนิด
// file.type มาจาก Browser ซึ่งคนส่งแก้เองได้ จึงเปิดดูไบต์แรกของไฟล์จริงอีกครั้ง
const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/webp": (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
}

export const ACCEPT = Object.keys(SIGNATURES).join(",")

// คืนข้อความภาษาไทยถ้าไฟล์ใช้ไม่ได้, คืน null ถ้าผ่าน
export async function checkPhoto(file: File): Promise<string | null> {
  if (file.size === 0) return "เลือกไฟล์รูปก่อน"
  if (file.size > MAX_BYTES) return "รูปใหญ่เกิน 2 MB ย่อรูปก่อนอัปโหลด"
  const looksLike = SIGNATURES[file.type]
  if (!looksLike) return "รับเฉพาะรูป JPG, PNG หรือ WebP"
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (!looksLike(head)) return "ไฟล์นี้ไม่ใช่รูปตามที่บอก"
  return null
}

// หนึ่งบริการมีหนึ่งรูป: Key เดิมเสมอ อัปโหลดใหม่ = ทับรูปเก่า
// ไม่ใส่นามสกุลใน Key เพราะรับได้หลายชนิด ชนิดจริงเก็บใน httpMetadata.contentType
export function photoKey(serviceId: string): string {
  return `services/${serviceId}`
}

export async function savePhoto(bucket: R2Bucket, serviceId: string, file: File): Promise<void> {
  await bucket.put(photoKey(serviceId), await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })
}

export function readPhoto(bucket: R2Bucket, serviceId: string): Promise<R2ObjectBody | null> {
  return bucket.get(photoKey(serviceId))
}
