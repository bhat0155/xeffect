export default function Footer(){
    const year = new Date().getFullYear();
      return (
    <footer className="border-t border-base-300">
      <div className="max-w-5xl mx-auto px-6 py-4 text-sm opacity-80 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>© {year} XEffect</div>
        <div>Made with ❤️ by{" "} 
            <a
            href="https://www.ekamsingh.ca/"
            target="_blank"
            rel="noreferrer"
            className="link link-hover">
            Ekam
            </a></div>
      </div>
    </footer>
  );
}