export default function Footer() {
  return (
    <footer className="bg-surface-raised border-t border-border-subtle mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-center text-sm text-fg-subtle">
          © {new Date().getFullYear()} Pronunciation Journal. Track and improve your pronunciation.
        </p>
      </div>
    </footer>
  );
}

