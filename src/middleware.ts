// Middleware: ทำงานก่อนทุกหน้าและทุก Action
// 1. ถาม Better Auth ว่าคำขอนี้ล็อกอินเป็นใคร แล้วใส่ไว้ใน locals (user, session)
// 2. ด่านของหน้าเว็บ: /admin ต้องเป็นพนักงาน, /admin/services ต้องเป็น admin
// 3. ด่านของ Action: board.* ต้องเป็นพนักงาน, catalog.* ต้องเป็น admin
//
// ข้อ 3 เป็น "ชั้นที่สอง" Action ทุกตัวก็เช็กเองอีกครั้งด้วย requireStaff / requireAdmin (src/actions/guard.ts)
// ทำไมสองชั้น: ถ้าวันหนึ่ง AI เพิ่ม Action ใหม่แล้วลืมบรรทัด requireStaff
// middleware ยังกันไว้ (ถ้าอยู่ในกลุ่ม board / catalog) และถ้าลืมใส่กลุ่มในตาราง Action ก็ยังเช็กเอง
// ตารางสิทธิ์ทั้งหมดอยู่ที่ src/auth/access.ts ที่เดียว
import { defineMiddleware } from "astro:middleware"
import { ActionError, getActionContext } from "astro:actions"
import { ACTION_RULES, can, PAGE_RULES, ruleFor } from "./auth/access.ts"
import { getAuth } from "./server/auth.ts"

export const onRequest = defineMiddleware(async (context, next) => {
  // Better Auth จัดการ /api/auth/* เอง (src/pages/api/auth/[...all].ts)
  if (context.url.pathname.startsWith("/api/auth/")) return next()

  // 1. ใครล็อกอินอยู่ (อ่าน Cookie แล้วหา Session ใน D1)
  const found = await getAuth(context.request).api.getSession({ headers: context.request.headers })
  context.locals.user = found?.user ?? null
  context.locals.session = found?.session ?? null
  const role = context.locals.user?.role

  // 3. Action: ชื่อ Action อยู่ใน getActionContext (เรียกจากฟอร์มหรือจาก React ก็ได้)
  const { action, setActionResult, serializeActionResult } = getActionContext(context)
  if (action) {
    const need = ruleFor(ACTION_RULES, action.name)
    if (need && !can(role, need)) {
      const error = context.locals.user
        ? new ActionError({ code: "FORBIDDEN", message: "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้" })
        : new ActionError({ code: "UNAUTHORIZED", message: "กรุณาล็อกอินก่อน" })
      const result = serializeActionResult({ data: undefined, error })
      // เรียกแบบ RPC (fetch จาก React): ตอบ Error กลับไปเลย Action ไม่ได้รัน
      if (action.calledFrom === "rpc") {
        if (result.type === "empty") return new Response(null, { status: 204 })
        return new Response(result.body, { status: result.status, headers: { "Content-Type": result.contentType } })
      }
      // เรียกจากฟอร์ม: ให้หน้าเว็บแสดง Error แทนผลลัพธ์ (Astro จะไม่รัน Action นี้)
      setActionResult(action.name, result)
    }
  }

  // 2. หน้าเว็บ
  const need = ruleFor(PAGE_RULES, context.url.pathname)
  if (need && !can(role, need)) {
    if (!context.locals.user) {
      const back = encodeURIComponent(context.url.pathname)
      return context.redirect(`/login?next=${back}`)
    }
    return new Response("บัญชีนี้ไม่มีสิทธิ์เปิดหน้านี้", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  }

  return next()
})
