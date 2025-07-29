const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-4xl font-bold text-red-600">404</h1>
            <p className="text-xl mt-2">Page Not Found</p>
            <p className="text-sm text-gray-500 mt-1">
                The page you are looking for does not exist.
            </p>
        </div>
    )
}

export default NotFound 
