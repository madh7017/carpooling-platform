const Card = ({ children, className = '', hover = true, compact = false }) => {
  const baseClass = compact ? 'card-compact' : 'card'
  const hoverClass = hover ? 'card-hover' : ''
  
  return (
    <div className={`${baseClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  )
}

export default Card
