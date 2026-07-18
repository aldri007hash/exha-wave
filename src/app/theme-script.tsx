export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme');
              if (theme === 'dark' || theme === 'green' || theme === 'purple') {
                document.documentElement.classList.add('theme-' + theme);
              } else if (theme === 'light') {
                document.documentElement.classList.remove('theme-dark', 'theme-green', 'theme-purple');
              } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('theme-dark');
              }
            } catch(e) {}
          })();
        `,
      }}
    />
  )
}