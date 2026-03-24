import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'
import { useToast } from '@context/ToastContext'
import { getApiUrl } from '@api/api'

const CallContext = createContext(null)

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export const CallProvider = ({ children }) => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [currentCall, setCurrentCall] = useState(null)
  const remoteAudioRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const incomingOfferRef = useRef(null)
  const remoteCandidatesRef = useRef([])
  const currentCallRef = useRef(null)

  const headers = useMemo(() => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  useEffect(() => {
    currentCallRef.current = currentCall
  }, [currentCall])

  const stopTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
  }

  const resetPeer = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null
      peerConnectionRef.current.onicecandidate = null
      peerConnectionRef.current.onconnectionstatechange = null
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    remoteCandidatesRef.current = []
    incomingOfferRef.current = null
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
  }

  const clearCallLocally = () => {
    stopTracks()
    resetPeer()
    setCurrentCall(null)
  }

  const getMicrophoneStream = async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      throw new Error('In-app calling needs HTTPS or localhost on this browser/device')
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('In-app calling is not supported in this browser')
    }
    return navigator.mediaDevices.getUserMedia({ audio: true })
  }

  const createPeerConnection = (bookingId, callId) => {
    const connection = new RTCPeerConnection(ICE_SERVERS)

    connection.ontrack = (event) => {
      const [stream] = event.streams
      if (remoteAudioRef.current && stream) {
        remoteAudioRef.current.srcObject = stream
        remoteAudioRef.current.play?.().catch(() => {})
      }
    }

    connection.onicecandidate = (event) => {
      if (!event.candidate) return

      axios
        .post(
          `/api/calls/${bookingId}/ice`,
          { callId, candidate: event.candidate },
          { headers }
        )
        .catch(() => {})
    }

    connection.onconnectionstatechange = () => {
      const state = connection.connectionState
      if (state === 'connected') {
        setCurrentCall((prev) => (prev ? { ...prev, status: 'connected' } : prev))
      }

      if (['failed', 'disconnected', 'closed'].includes(state)) {
        if (currentCallRef.current) {
          showToast('Call ended', 'info')
        }
        clearCallLocally()
      }
    }

    peerConnectionRef.current = connection
    return connection
  }

  const attachLocalAudio = (stream, connection) => {
    stream.getTracks().forEach((track) => connection.addTrack(track, stream))
    localStreamRef.current = stream
  }

  const flushRemoteCandidates = async (connection) => {
    const queued = [...remoteCandidatesRef.current]
    remoteCandidatesRef.current = []
    for (const candidate of queued) {
      try {
        await connection.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        return
      }
    }
  }

  const startVoiceCall = async ({ bookingId, title, subtitle }) => {
    try {
      if (currentCallRef.current) {
        showToast('Finish the current call first', 'danger')
        return
      }

      const stream = await getMicrophoneStream()
      const provisionalCallId = `local-${Date.now()}`
      const connection = createPeerConnection(bookingId, provisionalCallId)
      attachLocalAudio(stream, connection)

      const offer = await connection.createOffer({
        offerToReceiveAudio: true,
      })
      await connection.setLocalDescription(offer)

      const response = await axios.post(
        `/api/calls/${bookingId}/start`,
        {
          offer: connection.localDescription,
          meta: { title, subtitle },
        },
        { headers }
      )

      const callId = response.data.callId
      peerConnectionRef.current.onicecandidate = (event) => {
        if (!event.candidate) return
        axios
          .post(
            `/api/calls/${bookingId}/ice`,
            { callId, candidate: event.candidate },
            { headers }
          )
          .catch(() => {})
      }

      setCurrentCall({
        bookingId,
        callId,
        title,
        subtitle,
        status: 'calling',
        muted: false,
        isIncoming: false,
      })
    } catch (error) {
      stopTracks()
      resetPeer()
      showToast(error.response?.data?.message || error.message || 'Unable to start call', 'danger')
    }
  }

  const acceptIncomingCall = async () => {
    const call = currentCallRef.current
    if (!call || !call.isIncoming || !incomingOfferRef.current) return

    try {
      const stream = await getMicrophoneStream()
      const connection = createPeerConnection(call.bookingId, call.callId)
      attachLocalAudio(stream, connection)

      await connection.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current))
      await flushRemoteCandidates(connection)

      const answer = await connection.createAnswer()
      await connection.setLocalDescription(answer)

      await axios.post(
        `/api/calls/${call.bookingId}/answer`,
        { callId: call.callId, answer: connection.localDescription },
        { headers }
      )

      setCurrentCall((prev) => (prev ? { ...prev, status: 'connecting' } : prev))
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Unable to answer call', 'danger')
      clearCallLocally()
    }
  }

  const endCurrentCall = async ({ silent = false } = {}) => {
    const call = currentCallRef.current
    if (call?.bookingId && call?.callId) {
      await axios
        .post(
          `/api/calls/${call.bookingId}/end`,
          { callId: call.callId },
          { headers }
        )
        .catch(() => {})
    }

    clearCallLocally()
    if (!silent) {
      showToast('Call ended', 'info')
    }
  }

  const declineIncomingCall = async () => {
    await endCurrentCall({ silent: true })
  }

  const toggleMute = () => {
    const stream = localStreamRef.current
    if (!stream) return

    const nextMuted = !currentCallRef.current?.muted
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted
    })
    setCurrentCall((prev) => (prev ? { ...prev, muted: nextMuted } : prev))
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!user?.id || !token) return undefined

    const source = new EventSource(getApiUrl(`/stream?token=${encodeURIComponent(token)}`))

    source.addEventListener('call_signal', async (event) => {
      const payload = JSON.parse(event.data)

      if (payload.type === 'incoming_call') {
        if (currentCallRef.current) return

        incomingOfferRef.current = payload.offer
        remoteCandidatesRef.current = []
        setCurrentCall({
          bookingId: payload.bookingId,
          callId: payload.callId,
          title: payload.meta?.title || payload.fromName || 'Incoming call',
          subtitle: payload.meta?.subtitle || '',
          status: 'ringing',
          muted: false,
          isIncoming: true,
        })
        showToast(`Incoming call from ${payload.fromName || 'your trip partner'}`, 'info')
        return
      }

      if (!currentCallRef.current || payload.callId !== currentCallRef.current.callId) return

      if (payload.type === 'call_answer' && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer))
          await flushRemoteCandidates(peerConnectionRef.current)
          setCurrentCall((prev) => (prev ? { ...prev, status: 'connecting' } : prev))
        } catch {
          showToast('Failed to connect the call', 'danger')
          clearCallLocally()
        }
        return
      }

      if (payload.type === 'ice_candidate') {
        if (peerConnectionRef.current?.remoteDescription) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
          } catch {}
        } else {
          remoteCandidatesRef.current.push(payload.candidate)
        }
        return
      }

      if (payload.type === 'call_ended') {
        showToast('Call ended by the other user', 'info')
        clearCallLocally()
      }
    })

    return () => source.close()
  }, [headers, showToast, user?.id])

  useEffect(() => {
    return () => {
      stopTracks()
      resetPeer()
    }
  }, [])

  return (
    <CallContext.Provider
      value={{
        startVoiceCall,
        endCurrentCall,
        acceptIncomingCall,
        declineIncomingCall,
        toggleMute,
        currentCall,
        isSupported: typeof window !== 'undefined' && Boolean(window.RTCPeerConnection),
        isSecureCallingContext: typeof window !== 'undefined' ? window.isSecureContext : false,
      }}
    >
      {children}

      <audio ref={remoteAudioRef} autoPlay playsInline />

      {currentCall && (
        <div className="fixed bottom-6 right-6 z-[70] w-[22rem] max-w-[calc(100vw-2rem)] rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
            {currentCall.status === 'ringing' ? 'Incoming call' : 'Internet call'}
          </p>
          <h3 className="mt-2 text-lg font-bold text-slate-900">{currentCall.title}</h3>
          {currentCall.subtitle && <p className="mt-1 text-sm text-slate-600">{currentCall.subtitle}</p>}
          <p className="mt-4 text-sm font-medium text-slate-500">
            {currentCall.status === 'ringing'
              ? 'Audio call request'
              : currentCall.status === 'calling'
                ? 'Calling...'
                : currentCall.status === 'connecting'
                  ? 'Connecting audio...'
                  : 'Connected'}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {currentCall.status === 'ringing' ? (
              <>
                <button type="button" onClick={acceptIncomingCall} className="btn-primary btn-sm flex-1">
                  Answer
                </button>
                <button type="button" onClick={declineIncomingCall} className="btn-secondary btn-sm flex-1">
                  Decline
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={toggleMute} className="btn-outline btn-sm flex-1">
                  {currentCall.muted ? 'Unmute' : 'Mute'}
                </button>
                <button type="button" onClick={() => endCurrentCall()} className="btn-danger btn-sm flex-1">
                  End Call
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </CallContext.Provider>
  )
}

export const useCall = () => {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used within CallProvider')
  }
  return context
}
