'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/') 
        router.refresh()
    }

    return (
        <button onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg flex items-center gap-2 transition"
            title="Logout">
            <LogOut size={20} />
        </button>
    )
}