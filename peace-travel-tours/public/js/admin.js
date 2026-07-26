let allBookings = [];
let activeFilter = 'all';

(async function init() {
  try {
    const { user } = await apiFetch('/api/auth/me');
    if (!user) { window.location.href = '/login.html'; return; }
    if (user.role !== 'admin') { window.location.href = '/dashboard.html'; return; }
    await loadBookings();
  } catch (e) {
    window.location.href = '/login.html';
  }
})();

document.querySelectorAll('.filter-bar button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-bar button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
  });
});

async function loadBookings() {
  const { bookings } = await apiFetch('/api/admin/bookings');
  allBookings = bookings;
  render();
}

function render() {
  renderStats();
  renderList();
}

function renderStats() {
  const total = allBookings.length;
  const pending = allBookings.filter(b => b.status === 'pending').length;
  const quoted = allBookings.filter(b => b.status === 'quoted').length;
  const closed = allBookings.filter(b => b.status === 'closed').length;
  document.getElementById('stat-row').innerHTML = `
    <div class="stat-card"><div class="num">${total}</div><div class="label">Total requests</div></div>
    <div class="stat-card"><div class="num">${pending}</div><div class="label">Pending</div></div>
    <div class="stat-card"><div class="num">${quoted}</div><div class="label">Quoted</div></div>
    <div class="stat-card"><div class="num">${closed}</div><div class="label">Closed</div></div>
  `;
}

function renderList() {
  const container = document.getElementById('admin-list');
  const filtered = activeFilter === 'all' ? allBookings : allBookings.filter(b => b.status === activeFilter);

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">No requests here yet.</div>`;
    return;
  }

  container.innerHTML = filtered.map(b => `
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <h3 style="margin-bottom:2px;">${b.type === 'flight' ? '✈ Flight' : '🧳 Package'} — ${escapeHtml(b.destination)}</h3>
          <p style="font-size:13.5px;">${escapeHtml(b.customer_name)} · ${escapeHtml(b.customer_email)}${b.customer_phone ? ' · ' + escapeHtml(b.customer_phone) : ''}</p>
        </div>
        <span class="badge badge-${b.status}">${b.status}</span>
      </div>

      <div class="section-divider"></div>

      <div class="grid" style="grid-template-columns:repeat(3,1fr);gap:12px;">
        <div><div style="font-size:12px;color:var(--ink-faint);">Depart</div><div>${formatDate(b.depart_date)}</div></div>
        <div><div style="font-size:12px;color:var(--ink-faint);">Return</div><div>${formatDate(b.return_date)}</div></div>
        <div><div style="font-size:12px;color:var(--ink-faint);">Trip length</div><div>${b.trip_days ? b.trip_days + ' days' : '—'}</div></div>
        <div><div style="font-size:12px;color:var(--ink-faint);">Passengers</div><div>${b.passengers}</div></div>
        <div><div style="font-size:12px;color:var(--ink-faint);">Class</div><div style="text-transform:capitalize;">${b.travel_class.replace('_',' ')}</div></div>
        <div><div style="font-size:12px;color:var(--ink-faint);">Submitted</div><div>${formatDate(b.created_at.split(' ')[0])}</div></div>
      </div>

      ${b.notes ? `<p style="margin-top:14px;font-size:14px;"><strong>Notes:</strong> ${escapeHtml(b.notes)}</p>` : ''}

      <div class="section-divider"></div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
        <button class="btn btn-sm ${b.status === 'pending' ? 'btn-primary' : 'btn-ghost'}" onclick="updateStatus(${b.id}, 'pending')">Mark pending</button>
        <button class="btn btn-sm ${b.status === 'quoted' ? 'btn-primary' : 'btn-ghost'}" onclick="updateStatus(${b.id}, 'quoted')">Mark quoted</button>
        <button class="btn btn-sm ${b.status === 'closed' ? 'btn-primary' : 'btn-ghost'}" onclick="updateStatus(${b.id}, 'closed')">Mark closed</button>
      </div>

      <div class="reply-box">
        <textarea rows="2" id="reply-${b.id}" placeholder="Write a note for the customer (they'll see it on their dashboard)...">${escapeHtml(b.admin_reply || '')}</textarea>
        <button class="btn btn-primary btn-sm" onclick="saveReply(${b.id})">Save</button>
      </div>
    </div>
  `).join('');
}

async function updateStatus(id, status) {
  try {
    await apiFetch(`/api/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await loadBookings();
  } catch (e) {
    alert(e.message);
  }
}

async function saveReply(id) {
  const text = document.getElementById(`reply-${id}`).value.trim();
  try {
    await apiFetch(`/api/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ admin_reply: text }) });
    await loadBookings();
  } catch (e) {
    alert(e.message);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
