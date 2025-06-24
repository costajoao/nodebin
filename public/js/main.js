document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle')
  const icon = document.getElementById('theme-icon')
  const body = document.body

  function setIcon(isDark) {
    icon.innerHTML = isDark ? '<i class="fa fa-sun"></i>' : '<i class="fa fa-moon"></i>'
  }

  const isDark = localStorage.getItem('theme') === 'dark'
  if (isDark) body.classList.add('dark')
  setIcon(isDark)

  toggle?.addEventListener('click', () => {
    const nowDark = body.classList.toggle('dark')
    localStorage.setItem('theme', nowDark ? 'dark' : 'light')
    setIcon(nowDark)
  })
})
