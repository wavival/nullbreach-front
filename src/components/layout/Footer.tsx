export function Footer() {
  return (
    <footer
      className="flex justify-center items-center text-center border-t"
      style={{
        backgroundColor: "#0F172A",
        borderTopColor: "#334155",
        padding: "20px",
        color: "#94A3B8",
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <span>
        © 2026 Valentina Ramírez ·{" "}
        <a
          href="https://wavival.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-hover ease-hover hover:underline underline-offset-2"
          style={{ color: "#3B82F6" }}
        >
          wavival.dev
        </a>
      </span>
    </footer>
  );
}
