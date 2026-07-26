// Shared helpers used across pages.

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

// Updates the nav bar depending on whether someone is logged in, and as a user or admin.
async function refreshNav() {
  const navSlot = document.getElementById('nav-auth-slot');
  if (!navSlot) return;

  try {
    const { user } = await apiFetch('/api/auth/me');
    if (!user) {
      navSlot.innerHTML = `
        <a href="/login.html" class="btn btn-ghost btn-sm">Log in</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Get a quote</a>`;
      return;
    }
    if (user.role === 'admin') {
      navSlot.innerHTML = `
        <span style="font-size:14px;color:var(--ink-soft);">Hi, ${user.name.split(' ')[0]}</span>
        <a href="/admin.html" class="btn btn-ghost btn-sm">Admin panel</a>
        <button id="nav-logout" class="btn btn-primary btn-sm">Log out</button>`;
    } else {
      navSlot.innerHTML = `
        <span style="font-size:14px;color:var(--ink-soft);">Hi, ${user.name.split(' ')[0]}</span>
        <a href="/dashboard.html" class="btn btn-ghost btn-sm">My dashboard</a>
        <button id="nav-logout" class="btn btn-primary btn-sm">Log out</button>`;
    }
    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
      });
    }
  } catch (e) {
    navSlot.innerHTML = `
      <a href="/login.html" class="btn btn-ghost btn-sm">Log in</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Get a quote</a>`;
  }
}

document.addEventListener('DOMContentLoaded', refreshNav);

function showMsg(el, message, type = 'error') {
  el.textContent = message;
  el.className = `form-msg show ${type}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
