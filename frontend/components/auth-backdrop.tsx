export function AuthBackdrop() {
  return (
    <div className="auth-backdrop" aria-hidden="true">
      <div className="auth-backdrop-glow auth-backdrop-glow-a" />
      <div className="auth-backdrop-glow auth-backdrop-glow-b" />
      <div className="auth-backdrop-glow auth-backdrop-glow-c" />
      <div className="auth-backdrop-grid" />
      <svg className="auth-backdrop-art" viewBox="0 0 800 600" fill="none">
        <circle cx="120" cy="100" r="88" stroke="currentColor" strokeWidth="1.25" opacity="0.35" />
        <circle cx="120" cy="100" r="56" stroke="currentColor" strokeWidth="1" opacity="0.25" />
        <circle cx="680" cy="480" r="110" stroke="currentColor" strokeWidth="1.25" opacity="0.3" />
        <circle cx="680" cy="480" r="72" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        <path
          d="M40 320h120M160 280v80M280 80v140M280 80h90M520 40v90M520 130h70M640 200h100M740 160v80"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.28"
        />
        <path
          d="M90 420l22 22 44-52M610 90l18 18 36-42"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
        <rect
          x="430"
          y="360"
          width="72"
          height="72"
          rx="10"
          stroke="currentColor"
          strokeWidth="1.25"
          opacity="0.28"
        />
        <rect
          x="454"
          y="384"
          width="24"
          height="24"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.25"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}
