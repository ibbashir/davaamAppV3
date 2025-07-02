

export default function Unauthorized() {
    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
    )
}
