import { useState } from 'react'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import Sidebar from './components/Sidebar'
import UploadZone from './components/UploadZone'
import ChatWindow from './components/ChatWindow'
import { getSession } from './lib/api'

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [session, setSession] = useState(null)          // active session data
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploaded = (data) => {
    setSession(data)
    setActiveSessionId(data.session_id)
    setRefreshTrigger(r => r + 1)
  }

  const handleSelectSession = async (id) => {
    try {
      const data = await getSession(id)
      // reconstruct session shape expected by ChatWindow
      setSession({
        session_id: data.session_id,
        filename: data.filename,
        pages: data.pages,
        chunk_count: 0,
      })
      setActiveSessionId(id)
    } catch {
      alert('Could not load session.')
    }
  }

  const handleDeleted = () => {
    setSession(null)
    setActiveSessionId(null)
    setRefreshTrigger(r => r + 1)
  }

  const handleNewMessage = () => setRefreshTrigger(r => r + 1)

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0b0f]">
      {/* Sidebar */}
      <Sidebar
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleted={handleDeleted}
        refreshTrigger={refreshTrigger}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {session ? (
            <ChatWindow
              session={session}
              onNewMessage={handleNewMessage}
              onReset={() => { setSession(null); setActiveSessionId(null) }}
            />
          ) : (
            <UploadZone onUploaded={handleUploaded} />
          )}
        </div>
      </div>
    </div>
  )
}
