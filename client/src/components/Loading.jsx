const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 border-r-primary-500 animate-spin"></div>
      </div>
      <p className="text-gray-600 font-medium animate-pulse">Loading...</p>
    </div>
  )
}

export default Loading
