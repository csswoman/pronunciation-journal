export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Pronunciation Journal
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Add navigation items here if needed */}
          </div>
        </div>
      </div>
    </nav>
  );
}

