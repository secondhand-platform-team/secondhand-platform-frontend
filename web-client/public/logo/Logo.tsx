export const ReLifeLogo = ({ className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {/* Biểu tượng SVG: Mũi tên tuần hoàn hình chiếc lá */}
    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md shadow-green-200 dark:shadow-green-900">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-6 h-6 text-white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13.81 2.82852C15.9312 3.29292 17.8427 4.54013 19.1412 6.30561M21.1715 10.19C21.4111 11.2332 21.5 12.1648 21.5 13C21.5 18.2467 17.2467 22.5 12 22.5C6.75329 22.5 2.5 18.2467 2.5 13C2.5 7.75329 6.75329 3.5 12 3.5C12.1691 3.5 12.3375 3.50444 12.505 3.51323"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M11 6.5L13.5 3.5L11 0.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 11.5L14 13.5M14 13.5L12 15.5M14 13.5L16 15.5M14 13.5L12 11.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
    {/* Tên thương hiệu */}
    <span className="text-2xl font-extrabold tracking-tighter text-gray-950 dark:text-white">
      Re<span className="text-green-600">Life</span>
    </span>
  </div>
);