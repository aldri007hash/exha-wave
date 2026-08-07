"use client"
import { useState, useEffect } from "react"
import { Download, ChevronLeft, ChevronRight, UserCheck, Trash2, Plus } from "lucide-react"
import { useSession } from "next-auth/react"

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [tierFilter, setTierFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")

  // Modal states
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showSuspend, setShowSuspend] = useState(false)
  const [showBan, setShowBan] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [suspendMonths, setSuspendMonths] = useState(1)
  const [reason, setReason] = useState("")
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMessage, setNotifMessage] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState("USER")
  const [addingUser, setAddingUser] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (searchTerm.trim()) params.set("search", searchTerm.trim())
    if (tierFilter) params.set("tier", tierFilter)
    if (statusFilter) params.set("status", statusFilter)
    if (roleFilter) params.set("role", roleFilter)

    const res = await fetch(`/api/admin/users?${params.toString()}`)
    const data = await res.json()
    setUsers(data.users || [])
    setTotalPages(data.pagination?.totalPages || 1)
    setTotalUsers(data.pagination?.total || 0)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [page, tierFilter, statusFilter, roleFilter])

  const handleSearch = () => { setPage(1); fetchUsers() }
  const handleExport = () => { window.open("/api/admin/users/export", "_blank") }

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return
    setAddingUser(true)
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole }),
    })
    if (res.ok) {
      setShowAddUser(false)
      setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserRole("USER")
      fetchUsers()
    } else {
      const data = await res.json()
      alert(data.error || "Gagal menambah user")
    }
    setAddingUser(false)
  }

  const handleBan = async () => {
    if (!selectedUser || !reason.trim()) return
    await fetch("/api/admin/users", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, action: "ban", reason }),
    })
    setShowBan(false); setReason(""); fetchUsers()
  }

  const handleSuspend = async () => {
    if (!selectedUser) return
    await fetch("/api/admin/users", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, action: "suspend", months: suspendMonths, reason }),
    })
    setShowSuspend(false); setReason(""); fetchUsers()
  }

  const handleUnban = async (user: any) => {
    await fetch("/api/admin/users", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, action: user.status === "BANNED" ? "unban" : "unsuspend" }),
    })
    fetchUsers()
  }

  const handleChangeRole = async (user: any) => {
    const newRole = user.role === "TALENT" ? "USER" : "TALENT"
    if (!confirm(user.role === "TALENT" ? `Jadikan ${user.name} sebagai USER biasa?` : `Jadikan ${user.name} sebagai TALENT?`)) return
    await fetch("/api/admin/users", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, action: "change_role", role: newRole }),
    })
    fetchUsers()
  }

  const handleDelete = async (user: any) => {
    if (!confirm(`HAPUS PERMANEN ${user.name}?`)) return
    await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, action: "delete" }) })
    fetchUsers()
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      USER: "bg-gray-100 text-gray-700", TALENT: "bg-purple-100 text-purple-700",
      ADMIN: "bg-blue-100 text-blue-700", SUPER_ADMIN: "bg-red-100 text-red-700",
    }
    return `px-2 py-0.5 rounded-full text-xs ${colors[role] || "bg-gray-100 text-gray-700"}`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">User Management ({totalUsers})</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full"><Download size={16} /> Export CSV</button>
          {isSuperAdmin && (
            <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full"><Plus size={16} /> Tambah User</button>
          )}
          <button onClick={() => { setSelectedUser(null); setShowNotif(true) }} className="bg-primary text-white px-4 py-2 rounded-full">Broadcast Semua</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]"><label className="block text-sm mb-1">Cari (nama/email)</label><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="Ketik..." className="border rounded px-3 py-2 w-full bg-transparent" /></div>
        <div><label className="block text-sm mb-1">Role</label><select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }} className="border rounded px-3 py-2 bg-transparent"><option value="">Semua</option><option value="USER">User</option><option value="TALENT">Talent</option><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></div>
        <div><label className="block text-sm mb-1">Tier</label><select value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(1) }} className="border rounded px-3 py-2 bg-transparent"><option value="">Semua</option><option value="BRONZE">Bronze</option><option value="SILVER">Silver</option><option value="GOLD">Gold</option><option value="EXHAS_FRIEND">Exha's Friend</option></select></div>
        <div><label className="block text-sm mb-1">Status</label><select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="border rounded px-3 py-2 bg-transparent"><option value="">Semua</option><option value="ACTIVE">Active</option><option value="BANNED">Banned</option><option value="SUSPENDED">Suspended</option></select></div>
        <button onClick={handleSearch} className="bg-primary text-white px-4 py-2 rounded-full">Cari</button>
        <button onClick={() => { setSearchTerm(""); setTierFilter(""); setStatusFilter(""); setRoleFilter(""); setPage(1) }} className="border px-4 py-2 rounded-full">Reset</button>
      </div>

      {/* Tabel */}
      {loading ? <p className="text-center py-12">Memuat...</p> : (
        <>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Nama</th><th className="text-left py-2">Email</th><th className="text-left py-2">Role</th><th className="text-left py-2">Tier</th><th className="text-left py-2">Point</th><th className="text-left py-2">Status</th><th className="text-left py-2">Aksi</th></tr></thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b">
                  <td className="py-2">{user.name}</td><td className="py-2">{user.email}</td>
                  <td className="py-2"><span className={roleBadge(user.role)}>{user.role}</span></td>
                  <td className="py-2">{user.tier}</td><td className="py-2">{user.points}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${user.status === "ACTIVE" ? "bg-green-100 text-green-700" : user.status === "BANNED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{user.status}</span></td>
                  <td className="py-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => { setSelectedUser(user); setShowDetail(true) }} className="text-blue-500 text-xs">Detail</button>
                      {user.role !== "SUPER_ADMIN" && <button onClick={() => handleChangeRole(user)} className="text-purple-500 text-xs"><UserCheck size={14} /></button>}
                      {user.status === "ACTIVE" ? (<><button onClick={() => { setSelectedUser(user); setShowBan(true) }} className="text-red-500 text-xs">Ban</button><button onClick={() => { setSelectedUser(user); setShowSuspend(true) }} className="text-yellow-500 text-xs">Suspend</button></>) : <button onClick={() => handleUnban(user)} className="text-green-500 text-xs">{user.status === "BANNED" ? "Unban" : "Unsuspend"}</button>}
                      {user.role !== "SUPER_ADMIN" && <button onClick={() => handleDelete(user)} className="text-red-500 text-xs"><Trash2 size={14} /></button>}
                      <button onClick={() => { setSelectedUser(user); setShowNotif(true) }} className="text-blue-400 text-xs">Notif</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {totalPages > 1 && (<div className="flex justify-center items-center gap-2 mt-6"><button onClick={() => setPage(page-1)} disabled={page<=1} className="p-2 border rounded-full"><ChevronLeft size={18} /></button>{Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} onClick={()=>setPage(p)} className={`w-10 h-10 rounded-full text-sm ${p===page?"bg-primary text-white":"border"}`}>{p}</button>)}<button onClick={()=>setPage(page+1)} disabled={page>=totalPages} className="p-2 border rounded-full"><ChevronRight size={18} /></button></div>)}
        </>
      )}

      {/* Modal Tambah User */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-96">
            <h3 className="font-heading font-semibold mb-4">Tambah User Baru</h3>
            <input placeholder="Nama" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="border rounded px-3 py-2 w-full mb-3 bg-transparent" />
            <input placeholder="Email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="border rounded px-3 py-2 w-full mb-3 bg-transparent" />
            <input placeholder="Password" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="border rounded px-3 py-2 w-full mb-3 bg-transparent" />
            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="border rounded px-3 py-2 w-full mb-4 bg-transparent">
              <option value="USER">User</option>
              <option value="TALENT">Talent</option>
              <option value="ADMIN">Admin</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddUser(false)} className="border px-4 py-2 rounded-full">Batal</button>
              <button onClick={handleAddUser} disabled={addingUser} className="bg-primary text-white px-4 py-2 rounded-full disabled:opacity-50">{addingUser ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail, Ban, Suspend, Notif (tetap sama seperti sebelumnya) */}
      {showDetail && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-background rounded-xl p-6 w-96 max-h-96 overflow-y-auto"><h3 className="font-heading font-semibold mb-4">Detail {selectedUser.name}</h3><p>Email: {selectedUser.email}</p><p>Role: <span className={roleBadge(selectedUser.role)}>{selectedUser.role}</span></p><p>Telepon: {selectedUser.phone || "-"}</p><p>Tier: {selectedUser.tier}</p><p>Point: {selectedUser.points}</p><p>Total Belanja: Rp {selectedUser.totalSpent?.toLocaleString()}</p><p>Status: {selectedUser.status}</p>{selectedUser.banReason && <p className="text-red-500">Alasan: {selectedUser.banReason}</p>}{selectedUser.suspendUntil && <p className="text-yellow-500">Suspend hingga: {new Date(selectedUser.suspendUntil).toLocaleDateString("id-ID")}</p>}<button onClick={() => setShowDetail(false)} className="mt-4 border px-4 py-2 rounded-full w-full">Tutup</button></div></div>
      )}
      {showBan && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-background rounded-xl p-6 w-96"><h3 className="font-heading font-semibold mb-4">Ban {selectedUser.name}</h3><input placeholder="Alasan ban" value={reason} onChange={e => setReason(e.target.value)} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" /><div className="flex gap-2 justify-end"><button onClick={() => setShowBan(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={handleBan} className="bg-red-500 text-white px-4 py-2 rounded-full">Ban</button></div></div></div>
      )}
      {showSuspend && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-background rounded-xl p-6 w-96"><h3 className="font-heading font-semibold mb-4">Suspend {selectedUser.name}</h3><select value={suspendMonths} onChange={e => setSuspendMonths(Number(e.target.value))} className="border rounded px-3 py-2 w-full mb-2 bg-transparent"><option value={1}>1 Bulan</option><option value={3}>3 Bulan</option><option value={5}>5 Bulan</option><option value={12}>12 Bulan</option></select><input placeholder="Alasan" value={reason} onChange={e => setReason(e.target.value)} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" /><div className="flex gap-2 justify-end"><button onClick={() => setShowSuspend(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={handleSuspend} className="bg-yellow-500 text-white px-4 py-2 rounded-full">Suspend</button></div></div></div>
      )}
      {showNotif && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-background rounded-xl p-6 w-full max-w-lg"><h3 className="font-heading font-semibold mb-4">{selectedUser ? `Notif ke ${selectedUser.name}` : "Broadcast ke Semua User"}</h3><div className="bg-card border border-border rounded-lg p-4 mb-4"><p className="text-xs text-gray-400 mb-2">📱 Preview Notifikasi</p><div className="border-l-4 border-primary pl-3"><p className="font-semibold text-sm">{notifTitle || "Judul notifikasi..."}</p><p className="text-sm text-gray-500 mt-1">{notifMessage || "Pesan notifikasi..."}</p></div></div><input placeholder="Judul" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="border rounded px-3 py-2 w-full mb-2 bg-transparent" /><textarea placeholder="Pesan" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} className="border rounded px-3 py-2 w-full mb-4 bg-transparent" rows={3} />{!selectedUser && <p className="text-sm text-yellow-500 mb-2">⚠️ Notifikasi akan dikirim ke semua user ({totalUsers} user).</p>}<div className="flex gap-2 justify-end"><button onClick={() => setShowNotif(false)} className="border px-4 py-2 rounded-full">Batal</button><button onClick={() => { fetch("/api/admin/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: selectedUser?.id || null, title: notifTitle, message: notifMessage }) }); setShowNotif(false); setNotifTitle(""); setNotifMessage("") }} className="bg-primary text-white px-4 py-2 rounded-full">Kirim</button></div></div></div>
      )}
    </div>
  )
}
