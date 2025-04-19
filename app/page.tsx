"use client"; // Required for onClick handlers if using useRouter, good practice for Link too

import Link from 'next/link'; // Use Next.js Link for navigation

export default function HomePage() {
  // Basic styling consistent with other pages
  const containerClasses = "flex flex-col items-center justify-center min-h-screen bg-black text-white p-4";
  const buttonClasses = "px-8 py-4 w-[300px] text-center border border-gray-600 rounded text-lg hover:bg-gray-700 transition-colors duration-150 ease-in-out"; // Shared button style

  return (
    <div className={containerClasses}>
      <h1 className="text-4xl font-light mb-12 text-slate-300">Learn Georgian</h1>
      {/* <p className="text-sm text-slate-400 mb-12">Mark's Georgian Learning App. </p> */}

      <div className="flex flex-col space-y-6"> {/* Stack buttons vertically with space */}
        <Link href="/review" className={buttonClasses}>
          Words with Images
        </Link>

        <Link href="/phrases" className={buttonClasses}>
          Words and Phrases
        </Link>
      </div>

      {/* Optional: Add a footer or other elements later if needed */}
      {/* <footer className="absolute bottom-4 text-xs text-gray-500">
        Footer text
      </footer> */}
    </div>
  );
}
