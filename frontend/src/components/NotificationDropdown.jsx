import { useState } from 'react'
import { Bell } from 'lucide-react'
export default function NotificationDropdown() {
  const [open,setOpen]=useState(false)
  return <div className="relative"><button type="button" aria-label="Open notifications" aria-expanded={open} onClick={()=>setOpen(!open)} className="secondary-button"><Bell className="h-4 w-4"/></button>{open && <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border bg-white p-4 shadow-lg"><h2 className="font-semibold">Notifications</h2><p className="mt-2 text-sm">No notification service is connected.</p><button className="secondary-button mt-3" onClick={()=>setOpen(false)}>Close notifications</button></div>}</div>
}
