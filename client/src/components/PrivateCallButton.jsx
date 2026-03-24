import { useCall } from '@context/CallContext'

const PrivateCallButton = ({ bookingId, label = 'Call', className = '', title, subtitle }) => {
  const { currentCall, isSupported, isSecureCallingContext, startVoiceCall } = useCall()

  if (!bookingId || !isSupported) return null

  const isDisabled = Boolean(currentCall) || !isSecureCallingContext
  const disabledReason = !isSecureCallingContext
    ? 'In-app calling needs HTTPS or localhost on this device/browser'
    : currentCall
      ? 'Finish the current call first'
      : ''

  return (
    <button
      type="button"
      onClick={() => startVoiceCall({ bookingId, title, subtitle })}
      className={className || 'btn-outline btn-sm'}
      disabled={isDisabled}
      title={disabledReason}
    >
      {label}
    </button>
  )
}

export default PrivateCallButton
