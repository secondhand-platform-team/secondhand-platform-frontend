interface ReLifeLogoProps {
  className?: string;
  collapsed?: boolean;
}

export const ReLifeLogo = ({
  className = "",
  collapsed = false,
}: ReLifeLogoProps) => (
  <div className={`flex items-center gap-3 ${className}`}>
    {/* Icon */}
    <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center backdrop-blur-sm">
      <img
        src="/icon-logo.png"
        alt="ReLife"
        className="w-6 h-6 object-contain"
      />
    </div>

    {/* Text */}
    {!collapsed && (
      <div className="flex flex-col leading-tight">
        <span className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-white">
          Re<span className="text-green-600">Life</span>
        </span>

        <span className="text-[10px] font-medium tracking-[0.25em] text-green-600/80 uppercase">
          ADMIN
        </span>
      </div>
    )}
  </div>
);