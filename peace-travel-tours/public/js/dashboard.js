let currentType = 'flight';

const btnFlight = document.getElementById('btn-flight');
const btnPackage = document.getElementById('btn-package');
const panelTitle = document.getElementById('panel-title');
const panelSub = document.getElementById('panel-sub');
const typeInput = document.getElementById('type');
const greeting = document.getElementById('greeting');

function setType(type) {
  currentType = type;
  typeInput.value = type;
  btnFlight.classList.toggle('active', type === 'flight');
  btnPackage.classList.toggle('active', type === 'package');
  if (type === 'flight') {
    panelTitle.textContent = 'Flight request';
    panelSub.textContent = "Tell us where you're flying and when — we'll check current fares.";
  } else {
    panelTitle.textContent = 'Package request';
    panelSub.textContent = 'Tell us your destination and dates — we\'ll put together package options (flight + stay, or Umrah/Hajj).';
  }
}

btnFlight.addEventListener('click', () => setType('flight'));
btnPackage.addEventListener('click', () => setType('package'));

// Require login, personalize greeting
(async function init() {
  try {
    const { user } = await apiFetch('/api/auth/me');
    if (!user) {
      window.location.href = '/login.html';
      return;
    }
    if (user.role === 'admin') {
      window.location.href = '/admin.html';
      return;
    }
    greeting.textContent = `Let's plan your trip, ${user.name.split(' ')[0]}`;
    loadRequests();
  } catch (e) {
    window.location.href = '/login.html';
  }
})();

document.getElementById('booking-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('msg');
  const btn = document.getElementById('submit-btn');
  msg.classList.remove('show');
  btn.disabled = true; btn.textContent = 'Sending…';

  const payload = {
    type: currentType,
    origin: document.getElementById('origin').value.trim(),
    destination: document.getElementById('destination').value.trim(),
    depart_date: document.getElementById('depart_date').value,
    return_date: document.getElementById('return_date').value,
    trip_days: document.getElementById('trip_days').value,
    passengers: document.getElementById('passengers').value,
    travel_class: document.getElementById('travel_class').value,
    notes: document.getElementById('notes').value.trim(),
  };

  try {
    await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
    showMsg(msg, "Request sent! Check your email for confirmation — we'll follow up with pricing soon.", 'success');
    document.getElementById('booking-form').reset();
    setType(currentType);
    loadRequests();
  } catch (err) {
    showMsg(msg, err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Send request';
  }
});

async function loadRequests() {
  const container = document.getElementById('requests-container');
  try {
    const { bookings } = await apiFetch('/api/bookings/mine');
    if (!bookings.length) {
      container.innerHTML = `<div class="empty-state">You haven't sent any requests yet — fill out the form above to get started.</div>`;
      return;
    }
    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Type</th><th>Destination</th><th>Depart</th><th>Return</th><th>Pax</th><th>Class</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${bookings.map(b => `
              <tr>
                <td>${b.type === 'flight' ? 'Flight' : 'Package'}</td>
                <td>${escapeHtml(b.destination)}</td>
                <td>${formatDate(b.depart_date)}</td>
                <td>${formatDate(b.return_date)}</td>
                <td>${b.passengers}</td>
                <td style="text-transform:capitalize;">${b.travel_class.replace('_', ' ')}</td>
                <td><span class="badge badge-${b.status}">${b.status}</span></td>
              </tr>
              ${b.admin_reply ? `<tr><td colspan="7" style="background:var(--sky-pale);font-size:13.5px;"><strong>Reply from Peace Travel:</strong> ${escapeHtml(b.admin_reply)}</td></tr>` : ''}
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Could not load your requests right now.</div>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
