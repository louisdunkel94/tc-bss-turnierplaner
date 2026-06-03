function tcToggleTheme() {
  const dark = document.documentElement.classList.toggle('dark')
  localStorage.setItem('tc-theme', dark ? 'dark' : 'light')
  document.querySelectorAll('.theme-icon').forEach(el =>
    el.textContent = dark ? 'light_mode' : 'dark_mode'
  )
}

document.addEventListener('DOMContentLoaded', () => {
  const dark = document.documentElement.classList.contains('dark')
  document.querySelectorAll('.theme-icon').forEach(el =>
    el.textContent = dark ? 'light_mode' : 'dark_mode'
  )
})
