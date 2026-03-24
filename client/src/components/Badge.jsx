const Badge = ({ type = 'info', children, icon }) => {
  return (
    <span className={`badge badge-${type}`}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  )
}

export default Badge
