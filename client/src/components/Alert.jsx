const Alert = ({ type = 'info', title, message, onClose }) => {
  const icons = {
    success: 'OK',
    warning: '!',
    danger: 'X',
    info: 'i',
  }

  return (
    <div className={`alert alert-${type} animate-slide-up`} role="alert">
      <span className="grid h-6 w-6 place-content-center rounded-full bg-white/70 text-xs font-bold">{icons[type]}</span>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-lg leading-none hover:opacity-70 transition" aria-label="Close alert">
          x
        </button>
      )}
    </div>
  )
}

export default Alert
