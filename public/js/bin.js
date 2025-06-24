document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('requests')
  const binId = document.body.getAttribute('data-bin-id')
  const binUrl = `${location.origin}/${binId}`

  let counter = 1
  let latestTimestamp = 0
  let isLive = true
  let interval = 3000
  const MAX_REQUESTS = 20
  const waiting = document.getElementById('waiting')
  const copyBtn = document.getElementById('copy-btn')

  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(binUrl).then(() => showToast('Copied to clipboard'))
  })

  window.addEventListener('scroll', () => {
    const isAtTop = window.scrollY === 0
    if (isAtTop && !isLive) {
      isLive = true
      if (!container.childElementCount) waiting?.classList.remove('hidden')
      showToast('Resumed live update')
    } else if (!isAtTop && isLive) {
      isLive = false
      waiting?.classList.add('hidden')
      showToast('Paused live update (scroll down)')
    }
  })

  function showToast(message) {
    let toast = document.getElementById('toast')
    if (!toast) {
      toast = document.createElement('div')
      toast.id = 'toast'
      toast.style.position = 'fixed'
      toast.style.top = '90px'
      toast.style.bottom = 'auto'
      toast.style.left = '50%'
      toast.style.transform = 'translateX(-50%)'
      toast.style.padding = '12px 20px'
      toast.style.background = '#2d3748'
      toast.style.color = '#fff'
      toast.style.borderRadius = '6px'
      toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
      toast.style.opacity = '0'
      toast.style.transition = 'opacity 0.4s ease'
      toast.style.zIndex = '9999'
      document.body.appendChild(toast)
    }

    toast.textContent = message
    toast.style.opacity = '1'
    clearTimeout(toast._timeout)
    toast._timeout = setTimeout(() => {
      toast.style.opacity = '0'
    }, 2000)
  }

  function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ]
    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds)
      if (count >= 1) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`
    }
    return 'just now'
  }

  function updateTimeAgo() {
    document.querySelectorAll('[data-time]').forEach((el) => {
      const iso = el.getAttribute('data-time')
      const date = new Date(iso)
      if (!isNaN(date.getTime())) el.textContent = timeAgo(date)
    })
  }

  function safeJSON(input) {
    try {
      const parsed = JSON.parse(input)
      return typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  function parseBody(body) {
    try {
      const parsed = JSON.parse(body)
      return typeof parsed === 'object' ? parsed : { raw: body }
    } catch {
      return { raw: body }
    }
  }

  function renderSection(title, obj) {
    obj = obj && typeof obj === 'object' ? obj : {}
    const items = Object.entries(obj)
      .map(([k, v]) => `<li><strong>${k}</strong>: ${v}</li>`)
      .join('')
    return `
      <div class="fade-in p-4 border border-grey-light w-1/3">
        <h4 class="mt-0">${title}</h4>
        <ul class="list-reset">${items || '<li class="text-grey"><em>Empty</em></li>'}</ul>
      </div>
    `
  }

  let fetchTimeout
  async function loadRequests() {
    if (!isLive) return scheduleNextFetch()

    try {
      const url = `/api/bin/${binId}/requests${latestTimestamp > 0 ? `?since=${latestTimestamp}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Invalid response')

      if (!data.length && !container.childElementCount && isLive) {
        waiting?.classList.remove('hidden')
        return scheduleNextFetch()
      }

      waiting?.classList.add('hidden')

      for (const req of data) {
        const headers = safeJSON(req.headers)
        const query = safeJSON(req.query)
        const body = parseBody(req.body)

        const createdAt = req.created_at ? new Date(req.created_at) : new Date()
        const createdAtMs = createdAt.getTime()
        if (!isNaN(createdAtMs)) {
          latestTimestamp = Math.max(latestTimestamp, createdAtMs + 1000)
        }

        const html = `
          <div class="request-block mb-4 animate-highlight">
            <div class="fade-in row border border-grey-dark bg-grey-light p-6">
              <h4 class="float-right m-0 text-grey text-normal" data-time="${createdAt.toISOString()}">&nbsp;</h4>
              <h3 class="m-0">
                <strong>${req.method} #${counter++}</strong>
                <span class="text-grey ml-3">${req.path}</span>
              </h3>
            </div>
            <div class="w-full flex">
              ${renderSection('Headers', headers)}
              ${renderSection('Query', query)}
              ${renderSection('Body', body)}
            </div>
          </div>
        `

        container.insertAdjacentHTML('afterbegin', html)

        const all = container.querySelectorAll('.request-block')
        if (all.length > MAX_REQUESTS) all[MAX_REQUESTS].remove()
      }

      interval = 3000
    } catch (err) {
      console.error('[loadRequests] Error:', err)
      interval = Math.min(interval * 2, 60000)
    } finally {
      scheduleNextFetch()
    }
  }

  function scheduleNextFetch() {
    clearTimeout(fetchTimeout)
    fetchTimeout = setTimeout(loadRequests, interval)
  }

  loadRequests()
  setInterval(updateTimeAgo, 1000)
})
