// Island ของกระดานงาน: จุดเริ่มที่หน้า /admin วางไว้ (client:load)
// แต่ละ Island เป็น React แอปเล็ก ๆ ของตัวเอง จึงต้องมี QueryClientProvider ของตัวเอง
// (เหมือน main.tsx ของคอร์ส react-basics)
import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Board from "./Board.tsx"

type Props = { today: string; tomorrow: string }

export default function AdminBoard(props: Props) {
  // useState: สร้าง QueryClient ครั้งเดียวต่อ Island ไม่สร้างใหม่ทุกครั้งที่ Render
  const [client] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={client}>
      <Board {...props} />
    </QueryClientProvider>
  )
}
