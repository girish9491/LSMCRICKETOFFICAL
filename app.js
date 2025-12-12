// Spin Wheel logic: randomly pair teams from each pool, store in localStorage, and show result
function handleSpinWheel() {
  let pools = localStorage.getItem('lsm_pools');
  if (!pools) return;
  let data = JSON.parse(pools);
  let allPools = ['A', 'B', 'C', 'D'];
  let matches = [];
  let used = {};
  // For each pool, shuffle teams and pair them
  allPools.forEach(pool => {
    let teams = [...(data[pool] || [])];
    teams = shuffleArray(teams);
    for (let i = 0; i < teams.length; i += 2) {
      if (teams[i+1]) {
        matches.push({ team1: teams[i], team2: teams[i+1], pool });
        used[teams[i]] = true;
        used[teams[i+1]] = true;
      }
    }
  });
  // If any team left without a match (should not happen if even count), pair with next available
  allPools.forEach(pool => {
    let teams = data[pool] || [];
    teams.forEach(t => {
      if (!used[t]) {
        // Find another unpaired team
        for (let p2 of allPools) {
          if (p2 === pool) continue;
          let t2 = (data[p2] || []).find(x => !used[x]);
          if (t2) {
            matches.push({ team1: t, team2: t2, pool: pool + '/' + p2 });
            used[t] = true;
            used[t2] = true;
            break;
          }
        }
      }
    });
  });
  localStorage.setItem('lsm_matches', JSON.stringify(matches));
  let msg = document.getElementById('spinResultMsg');
  if (msg) {
    msg.innerHTML = `<span style='color:#125ea2;font-weight:bold;'>Matches scheduled! Check the Schedule tab.</span>`;
  }
  renderScheduleTab();
}

// Utility: shuffle array
function shuffleArray(arr) {
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Render scheduled matches in Schedule tab
function renderScheduleTab() {
  let matches = [];
  try {
    matches = JSON.parse(localStorage.getItem('lsm_matches')) || [];
  } catch {}
  let scheduleDiv = document.getElementById('schedule');
  if (!scheduleDiv) return;
  let html = '<h2>Schedule</h2>';
  if (matches.length === 0) {
    html += '<p>Coming soon...</p>';
  } else {
    if (isAdmin) {
      html += `<div style='text-align:center;margin-bottom:16px;'><button onclick='deleteAllMatches()' style='background:#b71c1c;color:#fff;font-weight:bold;padding:10px 28px;border-radius:10px;font-size:1.1rem;'>Delete All Matches</button></div>`;
    }
    html += '<div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;">';
    matches.forEach((m, idx) => {
      html += `<div style="background:linear-gradient(135deg,#ffd700 0%,#125ea2 100%);color:#222;font-weight:bold;padding:16px 18px;border-radius:12px;min-width:180px;box-shadow:0 2px 12px rgba(0,0,0,0.18);margin-bottom:10px;text-align:center;position:relative;">
        <div id='matchDisplay${idx}'>
          <div style='font-size:1.1rem;margin-bottom:6px;'>${m.team1} <span style='color:#b71c1c;'>vs</span> ${m.team2}</div>
          <div style='font-size:0.98rem;color:#125ea2;'>Pool: ${m.pool}</div>
        </div>
        ${isAdmin ? `
        <div style='margin-top:8px;'>
          <button onclick='editMatch(${idx})' style='background:#125ea2;color:#fff;padding:4px 12px;border-radius:6px;font-size:0.98rem;margin-right:6px;'>Edit</button>
          <button onclick='deleteMatch(${idx})' style='background:#b71c1c;color:#fff;padding:4px 12px;border-radius:6px;font-size:0.98rem;'>Delete</button>
        </div>
        <div id='editMatchForm${idx}' style='display:none;margin-top:8px;'>
          <input id='editTeam1_${idx}' value='${m.team1}' style='padding:4px 8px;border-radius:6px;border:1px solid #ccc;margin-right:6px;max-width:90px;'>
          <input id='editTeam2_${idx}' value='${m.team2}' style='padding:4px 8px;border-radius:6px;border:1px solid #ccc;margin-right:6px;max-width:90px;'>
          <input id='editPool_${idx}' value='${m.pool}' style='padding:4px 8px;border-radius:6px;border:1px solid #ccc;max-width:60px;'>
          <button onclick='saveMatch(${idx})' style='background:#ffd700;color:#222;padding:4px 12px;border-radius:6px;font-size:0.98rem;margin-left:6px;'>Save</button>
          <button onclick='cancelEditMatch(${idx})' style='background:#ccc;color:#222;padding:4px 12px;border-radius:6px;font-size:0.98rem;margin-left:6px;'>Cancel</button>
        </div>
        ` : ''}
      </div>`;
    });
    html += '</div>';
  }
  scheduleDiv.innerHTML = html;
}

// Admin controls for matches
window.deleteAllMatches = function() {
  if (confirm('Are you sure you want to delete all matches?')) {
    localStorage.removeItem('lsm_matches');
    renderScheduleTab();
  }
}
window.deleteMatch = function(idx) {
  let matches = JSON.parse(localStorage.getItem('lsm_matches')) || [];
  if (confirm('Delete this match?')) {
    matches.splice(idx, 1);
    localStorage.setItem('lsm_matches', JSON.stringify(matches));
    renderScheduleTab();
  }
}
window.editMatch = function(idx) {
  document.getElementById('matchDisplay'+idx).style.display = 'none';
  document.getElementById('editMatchForm'+idx).style.display = 'block';
}
window.cancelEditMatch = function(idx) {
  document.getElementById('matchDisplay'+idx).style.display = 'block';
  document.getElementById('editMatchForm'+idx).style.display = 'none';
}
window.saveMatch = function(idx) {
  let matches = JSON.parse(localStorage.getItem('lsm_matches')) || [];
  let t1 = document.getElementById('editTeam1_'+idx).value.trim();
  let t2 = document.getElementById('editTeam2_'+idx).value.trim();
  let pool = document.getElementById('editPool_'+idx).value.trim();
  if (!t1 || !t2) { alert('Team names required'); return; }
  matches[idx] = { team1: t1, team2: t2, pool };
  localStorage.setItem('lsm_matches', JSON.stringify(matches));
  renderScheduleTab();
}

// On page load, render schedule and Spin Wheel for all users
document.addEventListener('DOMContentLoaded', function() {
  renderScheduleTab();
  // Render Spin Wheel for all users on the public section
  let publicSpinSection = document.getElementById('spinWheelPublicSection');
  if (publicSpinSection) {
    // Temporarily swap the section for rendering
    let orig = document.getElementById('spinWheelHomeSection');
    let origId = null;
    if (orig) {
      origId = orig.id;
      orig.id = '';
    }
    publicSpinSection.id = 'spinWheelHomeSection';
    renderSpinWheelHome();
    publicSpinSection.id = 'spinWheelPublicSection';
    if (orig && origId) orig.id = origId;
  }
});
// Firebase Configuration (replace with your own config if needed)
const firebaseConfig = {
  apiKey: "AIzaSyBj8Jw68aiH1c3O-QMVi15Y6y5Gl1rZ_zs",
  authDomain: "lsm-cricket-tournament.firebaseapp.com",
  databaseURL: "https://lsm-cricket-tournament-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lsm-cricket-tournament",
  storageBucket: "lsm-cricket-tournament.firebasestorage.app",
  messagingSenderId: "711928597764",
  appId: "1:711928597764:web:e3368e0962dd37d8191451"
};
let database;
try {
  firebase.initializeApp(firebaseConfig);
  database = firebase.database();
} catch (error) {
  console.log("Firebase initialization error:", error);
}

// Admin Panel logic
let isAdmin = false;

function openAdminPanel() {
  document.getElementById('adminPanelModal').style.display = 'block';
  document.getElementById('adminPincodeSection').style.display = 'block';
  document.getElementById('adminControls').style.display = 'none';
  document.getElementById('adminPincodeInput').value = '';
  document.getElementById('adminPincodeError').innerText = '';
  // Hide prize popup when admin panel is opened
  var prizePopup = document.getElementById('prizePopup');
  if (prizePopup) prizePopup.style.display = 'none';
}

function closeAdminPanel() {
  document.getElementById('adminPanelModal').style.display = 'none';
}

function verifyAdminPincode() {
  const pin = document.getElementById('adminPincodeInput').value;
  if (pin === 'sunmoonstars') {
    isAdmin = true;
    document.getElementById('adminPincodeSection').style.display = 'none';
    document.getElementById('adminControls').style.display = 'block';
    renderAdminFeatures();
  } else {
    document.getElementById('adminPincodeError').innerText = 'Incorrect pincode!';
    isAdmin = false;
    document.getElementById('adminControls').style.display = 'none';
  }
}

function renderAdminFeatures() {
  // Example admin features, add more as needed
  let html = `
    <h3>Admin Controls</h3>
    <button onclick="toggleEditLock()">Toggle Edit Lock</button>
    <button onclick="showPoolManagement()">Pool Management</button>
    <div id="editLockStatus"></div>
    <div id="spinLockSection"></div>
    <!-- Add more admin-only controls here -->
  `;
  document.getElementById('adminFeatures').innerHTML = html;
  updateEditLockStatus();
  updateSpinLockSection();
}

function updateSpinLockSection() {
  // Only show if all teams are assigned (All Teams is empty)
  let pools = localStorage.getItem('lsm_pools');
  let allEmpty = false;
  if (pools) {
    let data = JSON.parse(pools);
    allEmpty = Array.isArray(data.all) && data.all.length === 0;
  }
  let section = document.getElementById('spinLockSection');
  if (!section) return;
  if (allEmpty) {
    let locked = localStorage.getItem('lsm_spin_locked') !== 'false';
    section.innerHTML = `<button id="spinLockBtn" onclick="toggleSpinLock()" style="background:${locked ? '#b71c1c' : '#125ea2'};color:#fff;font-weight:bold;padding:10px 28px;border-radius:10px;font-size:1.1rem;margin-top:12px;">${locked ? 'Unlock Spin Wheel' : 'Lock Spin Wheel'}</button><div style="margin-top:8px;color:#ffd700;">${locked ? 'Spin Wheel is locked' : 'Spin Wheel is unlocked'}</div>`;
  } else {
    section.innerHTML = '';
  }
}

function toggleSpinLock() {
  let locked = localStorage.getItem('lsm_spin_locked') !== 'false';
  localStorage.setItem('lsm_spin_locked', locked ? 'false' : 'true');
  updateSpinLockSection();
  renderSpinWheelHome();
}

let editLock = false;
function toggleEditLock() {
  editLock = !editLock;
  updateEditLockStatus();
}
function updateEditLockStatus() {
  document.getElementById('editLockStatus').innerText = editLock ? 'Edit Locked (Only admin can edit teams)' : 'Edit Unlocked (Anyone can edit teams)';
}

function showPoolManagement() {
  document.getElementById('poolManagementModal').style.display = 'block';
  renderPoolManagement();
}
function closePoolManagement() {
  document.getElementById('poolManagementModal').style.display = 'none';
}
// Attach to window for dynamic onclick
window.showPoolManagement = showPoolManagement;
window.closePoolManagement = closePoolManagement;

// --- Pool Management Logic ---
let poolData = {
  all: [],
  A: [],
  B: [],
  C: [],
  D: []
};

function renderPoolManagement() {
  // Load teams from Firebase and localStorage
  database.ref('teams').once('value', snapshot => {
    let allTeams = [];
    snapshot.forEach(child => {
      const team = child.val();
      allTeams.push(team.teamName);
    });
    // Load from localStorage if exists
    let saved = localStorage.getItem('lsm_pools');
    if (saved) {
      poolData = JSON.parse(saved);
      // Remove teams that no longer exist
      let allAssigned = [...poolData.A, ...poolData.B, ...poolData.C, ...poolData.D];
      poolData.all = allTeams.filter(t => !allAssigned.includes(t));
    } else {
      poolData = { all: allTeams, A: [], B: [], C: [], D: [] };
    }
    updatePoolUI();
  });
}

function updatePoolUI() {
  const lists = {
    all: document.getElementById('allTeamsList'),
    A: document.getElementById('poolAList'),
    B: document.getElementById('poolBList'),
    C: document.getElementById('poolCList'),
    D: document.getElementById('poolDList')
  };
  Object.entries(lists).forEach(([key, ul]) => {
    ul.innerHTML = '';
    poolData[key].forEach(team => {
      let li = document.createElement('li');
      li.textContent = team;
      li.setAttribute('draggable', 'true');
      li.style.cssText = 'background:#fff;color:#125ea2;font-weight:bold;padding:6px 8px;margin:6px 0;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.08);cursor:grab;text-align:center;';
      li.ondragstart = e => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ team, from: key }));
      };
      ul.appendChild(li);
    });
    // Dragover and drop events
    ul.ondragover = e => { e.preventDefault(); ul.style.background = '#ffd70022'; };
    ul.ondragleave = e => { ul.style.background = ''; };
    ul.ondrop = e => {
      e.preventDefault();
      ul.style.background = '';
      let data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.from !== key) {
        // Remove from old
        let idx = poolData[data.from].indexOf(data.team);
        if (idx > -1) poolData[data.from].splice(idx, 1);
        // Add to new
        poolData[key].push(data.team);
        updatePoolUI();
      }
    };
  });
}


// Save pools button logic (works even after DOM reload)
function setupSavePoolsBtn() {
  let saveBtn = document.getElementById('savePoolsBtn');
  if (saveBtn) {
    saveBtn.onclick = function() {
      localStorage.setItem('lsm_pools', JSON.stringify(poolData));
      alert('Pools saved!');
    };
  }
}

// On DOMContentLoaded, setup Save button and restore pools if modal is opened
document.addEventListener('DOMContentLoaded', function() {
  setupSavePoolsBtn();
  // If modal is opened, always reload pool data from storage
  let poolModal = document.getElementById('poolManagementModal');
  if (poolModal) {
    poolModal.addEventListener('show', renderPoolManagement);
  }
});

// Also call setupSavePoolsBtn after rendering pool management (in case modal is re-rendered)
function renderPoolManagement() {
  // Load teams from Firebase and localStorage
  database.ref('teams').once('value', snapshot => {
    let allTeams = [];
    snapshot.forEach(child => {
      const team = child.val();
      allTeams.push(team.teamName);
    });
    // Load from localStorage if exists
    let saved = localStorage.getItem('lsm_pools');
    if (saved) {
      poolData = JSON.parse(saved);
      // Remove teams that no longer exist
      let allAssigned = [...poolData.A, ...poolData.B, ...poolData.C, ...poolData.D];
      poolData.all = allTeams.filter(t => !allAssigned.includes(t));
    } else {
      poolData = { all: allTeams, A: [], B: [], C: [], D: [] };
    }
    updatePoolUI();
    setupSavePoolsBtn();
  });
}

// Tab navigation
// Tab navigation with toggle/minimize feature
let currentTabId = null;
function showTab(tabId) {
  var prizePopup = document.getElementById('prizePopup');
  // Close admin panel when any tab button is clicked
  closeAdminPanel();
  if (currentTabId === tabId) {
    // If the same tab is clicked again, minimize/hide it
    document.getElementById(tabId).style.display = 'none';
    currentTabId = null;
    // Show prize popup again when all tabs are hidden
    if (prizePopup) prizePopup.style.display = 'block';
    return;
  }
  document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
  currentTabId = tabId;
  if (prizePopup) prizePopup.style.display = 'none';
  if(tabId === 'addTeam') renderAddTeamForm();
  if(tabId === 'teamsRegistered') renderTeamsRegistered();
  if(tabId === 'archives') {
    renderArchiveImages();
    renderArchiveVideos();
  }
}
function showArchiveTab(tab) {
  document.getElementById('archive-images').style.display = tab === 'images' ? 'block' : 'none';
  document.getElementById('archive-videos').style.display = tab === 'videos' ? 'block' : 'none';
}

// Add Team Form
function renderAddTeamForm() {
  const addTeamDiv = document.getElementById('addTeam');
  addTeamDiv.innerHTML = `<h2>Add Team</h2>
    <form id="teamForm">
      <label>Team Name: <input type="text" name="teamName" required></label><br><br>
      <label>Captain Name: <input type="text" name="captain" required></label><br><br>
      <label>Captain Number: <input type="text" name="captainNumber" required></label><br><br>
      <div id="playersInputs"></div>
      <label>Player 11: <input type="text" name="player11" required></label><br><br>
      <label>Player 12: <input type="text" name="player12" required></label><br><br>
      <button type="submit" id="registerBtn" disabled>Register Team</button>
    </form>
    <div id="teamFormMsg" style="color:red;"></div>`;
  const playersInputs = document.getElementById('playersInputs');
  let playersHtml = '';
  for(let i=1; i<=10; i++) {
    playersHtml += `<label>Player ${i}: <input type="text" name="player${i}" required></label><br><br>`;
  }
  playersInputs.innerHTML = playersHtml;

  // Validation logic
  const form = document.getElementById('teamForm');
  const registerBtn = document.getElementById('registerBtn');
  const teamFormMsg = document.getElementById('teamFormMsg');
  function validateTeamForm() {
    const teamName = form.teamName.value.trim();
    const captain = form.captain.value.trim();
    const captainNumber = form.captainNumber.value.trim();
    let allPlayersFilled = true;
    for(let i=1; i<=10; i++) {
      if(!form[`player${i}`].value.trim()) allPlayersFilled = false;
    }
    if(!teamName || !captain || !captainNumber || !allPlayersFilled) {
      registerBtn.disabled = true;
      teamFormMsg.innerText = 'Please fill all the mandatory players.';
    } else {
      registerBtn.disabled = false;
      teamFormMsg.innerText = '';
    }
  }
  form.addEventListener('input', validateTeamForm);
  validateTeamForm();

  form.onsubmit = async function(e) {
    e.preventDefault();
    const teamName = form.teamName.value.trim();
    const captain = form.captain.value.trim();
    const captainNumber = form.captainNumber.value.trim();
    let players = [];
    for(let i=1; i<=12; i++) {
      players.push(form[`player${i}`].value.trim());
    }
    // Only check first 10 players for mandatory
    if(!teamName || !captain || !captainNumber || players.slice(0,10).some(p => !p)) {
      teamFormMsg.innerText = 'Please fill all the mandatory players.';
      return;
    }
    try {
      await database.ref('teams').push({ teamName, captain, captainNumber, players });
      teamFormMsg.style.color = 'green';
      teamFormMsg.innerText = 'Team registered successfully!';
      form.reset();
      validateTeamForm();
      setTimeout(()=>{ teamFormMsg.innerText = ''; teamFormMsg.style.color = 'red'; }, 2000);
    } catch (err) {
      teamFormMsg.innerText = 'Error registering team.';
    }
  };
}

// Teams Registered
function renderTeamsRegistered() {
  const teamsDiv = document.getElementById('teamsRegistered');
  teamsDiv.innerHTML = '<h2>Teams Registered</h2><ul id="teamsList"></ul>';
  const teamsList = document.getElementById('teamsList');
  database.ref('teams').once('value', snapshot => {
    teamsList.innerHTML = '';
    snapshot.forEach(child => {
      const team = child.val();
      const teamKey = child.key;
      // Exclude captain from players list
      const filteredPlayers = team.players.filter(p => p !== team.captain).slice(0, 10);
      let deleteBtn = '';
      if (isAdmin) {
        deleteBtn = `<button style='margin-left:16px;background:#b71c1c;color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:bold;' onclick="deleteTeam('${teamKey}')">Delete</button>`;
      }
      let playersHtml = '';
      if (isAdmin && !editLock) {
        // Editable player names
        playersHtml = `<form id="editPlayersForm-${teamKey}" style="display:inline;">`;
        filteredPlayers.forEach((player, idx) => {
          playersHtml += `<input type="text" name="player${idx}" value="${player}" style="margin:2px 6px 2px 0;padding:2px 6px;border-radius:4px;border:1px solid #ccc;max-width:110px;">`;
        });
        playersHtml += `<button type="submit" style="margin-left:8px;background:#125ea2;color:#fff;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;font-weight:bold;">Save</button></form>`;
      } else {
        // Plain text player names
        playersHtml = `<span style="color:#fff;">Players: ${filteredPlayers.join(', ')}</span>`;
      }
      teamsList.innerHTML += `<li style="background:rgba(20,20,40,0.65);color:#fff;padding:10px 18px;margin-bottom:12px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.18);">
        <span style="font-size:1.3em;font-weight:bold;color:#ffd700;">${team.teamName}</span> <span style="color:#90caf9;">(Captain: ${team.captain}${team.captainNumber ? ', ' + team.captainNumber : ''})</span><br>
        ${playersHtml}
        ${deleteBtn}
      </li>`;
      // Add save handler for each form
      if (isAdmin && !editLock) {
        setTimeout(() => {
          const form = document.getElementById(`editPlayersForm-${teamKey}`);
          if (form) {
            form.onsubmit = function(e) {
              e.preventDefault();
              const newPlayers = [];
              for (let i = 0; i < filteredPlayers.length; i++) {
                newPlayers.push(form[`player${i}`].value.trim());
              }
              // Add captain back to the players array
              const updatedPlayers = [team.captain, ...newPlayers];
              database.ref('teams/' + teamKey + '/players').set(updatedPlayers)
                .then(() => {
                  // After save, temporarily lock editing for this team to show names only
                  editLock = true;
                  renderTeamsRegistered();
                  setTimeout(() => { editLock = false; }, 500); // unlock after short delay for other teams
                })
                .catch(() => {
                  alert('Error saving players.');
                });
            };
          }
        }, 0);
      }
    });
    if(!snapshot.exists()) teamsList.innerHTML = '<li>No teams registered yet.</li>';
  });
}

// Delete team by key (admin only)
function deleteTeam(teamKey) {
  if (!isAdmin) return;
  if (confirm('Are you sure you want to delete this team?')) {
    database.ref('teams/' + teamKey).remove()
      .then(() => {
        renderTeamsRegistered();
      })
      .catch(() => {
        alert('Error deleting team.');
      });
  }
}

// Archives (placeholder for upload)

// Dynamically show images and videos from root folder
function renderArchiveImages() {
  const imageExtensions = ['.jpg', '.JPG'];
  const imageFiles = [
    'cricket-bg.jpg',
    'photo1.JPG',
    'photo2.JPG',
    'photo3.JPG',
    'photo4.JPG',
    'photo5.JPG'
  ];
  let html = '<h3>Images</h3><div style="display:flex;flex-wrap:wrap;gap:18px;">';
  imageFiles.forEach(file => {
    if (imageExtensions.some(ext => file.endsWith(ext))) {
      html += `<div style="background:rgba(20,20,40,0.65);padding:8px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.18);"><img src="${file}" alt="${file}" style="max-width:180px;max-height:140px;border-radius:8px;"></div>`;
    }
  });
  html += '</div>';
  document.getElementById('archive-images').innerHTML = html;
}

function renderArchiveVideos() {
  const videoExtensions = ['.mp4', '.MP4'];
  const videoFiles = [
    'video1.mp4',
    'video2.MP4',
    'video3.MP4',
    'video4.mp4',
    'video5.mp4'
  ];
  let html = '<h3>Videos</h3><div style="display:flex;flex-wrap:wrap;gap:18px;">';
  videoFiles.forEach(file => {
    if (videoExtensions.some(ext => file.endsWith(ext))) {
      html += `<div style="background:rgba(20,20,40,0.65);padding:8px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.18);"><video src="${file}" controls style="max-width:220px;max-height:160px;border-radius:8px;"></video></div>`;
    }
  });
  html += '</div>';
  document.getElementById('archive-videos').innerHTML = html;
}

// Call these when switching archive tabs

// Hide all tab-content by default on load

document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');

// Export Registered Teams to Excel
function exportTeamsToExcel() {
  database.ref('teams').once('value', snapshot => {
    let rows = [['Team Name', 'Captain', 'Players']];
    snapshot.forEach(child => {
      const team = child.val();
      // Exclude captain from players list
      const filteredPlayers = team.players.filter(p => p !== team.captain).slice(0, 10);
      rows.push([team.teamName, team.captain, filteredPlayers.join(', ')]);
    });
    // Convert to CSV
    let csvContent = rows.map(e => e.map(a => '"' + a.replace(/"/g, '""') + '"').join(",")).join("\n");
    let blob = new Blob([csvContent], { type: 'text/csv' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'registered_teams.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function renderSpinWheelHome() {
  let section = document.getElementById('spinWheelHomeSection');
  if (!section) return;
  let pools = localStorage.getItem('lsm_pools');
  let allAssigned = false;
  let teamsLeft = 1;
  if (pools) {
    let data = JSON.parse(pools);
    allAssigned = Array.isArray(data.all) && data.all.length === 0;
    teamsLeft = Array.isArray(data.all) ? data.all.length : 1;
  }
  section.style.display = 'block';
  let locked = localStorage.getItem('lsm_spin_locked') !== 'false';
  let now = new Date();
  let spinDate = new Date('2026-01-04T19:00:00+05:30');
  let beforeCountdown = now < spinDate;
  let disabled = !allAssigned || locked || beforeCountdown;
  let btnText = !allAssigned ? 'Assign all teams to pools' : (locked ? 'Spin Locked by Admin' : (beforeCountdown ? 'Spin Opens Jan 4, 7PM' : 'Spin'));
  let notification = '';
  if (!allAssigned) {
    notification = `<div style='color:#b71c1c;font-weight:bold;margin-bottom:10px;'>Move all teams to pools to enable Spin.</div>`;
  } else {
    notification = `<div style='color:#125ea2;font-weight:bold;margin-bottom:10px;'>All teams are assigned to Pools, Get ready for Spin!</div>`;
  }
  section.innerHTML = `
    <div style=\"margin-bottom:24px;text-align:center;\">
      <div style=\"font-size:2.1rem;color:#fff;font-weight:bold;letter-spacing:1px;\">Tournament Starts In</div>
      <div style=\"width:60px;height:4px;background:linear-gradient(90deg,#00eaff 0%,#125ea2 100%);margin:12px auto 0 auto;border-radius:2px;\"></div>
    </div>
    <div id=\"spinCountdown\" style=\"margin-bottom:32px;display:flex;justify-content:center;align-items:center;gap:28px;\"></div>
    ${notification}
    <div style=\"margin-bottom:16px;\">
      <svg width=\"96\" height=\"96\" viewBox=\"0 0 96 96\"><circle cx=\"48\" cy=\"48\" r=\"44\" fill=\"#ffd700\" stroke=\"#125ea2\" stroke-width=\"6\"/><circle cx=\"48\" cy=\"48\" r=\"28\" fill=\"#fff\" stroke=\"#b71c1c\" stroke-width=\"4\"/><text x=\"48\" y=\"60\" text-anchor=\"middle\" font-size=\"32\" fill=\"#125ea2\" font-weight=\"bold\">🎡</text></svg>
    </div>
    <button id=\"spinWheelBtn\" style=\"background:linear-gradient(135deg,#ffd700 0%,#125ea2 100%);color:#222;font-weight:bold;padding:18px 40px;border-radius:16px;font-size:1.4rem;box-shadow:0 2px 12px rgba(0,0,0,0.18);${disabled ? 'opacity:0.6;cursor:not-allowed;' : ''}\" ${disabled ? 'disabled' : ''}>${btnText}</button>
    <div id=\"spinResultMsg\" style=\"margin-top:12px;font-size:1.05rem;color:#125ea2;\"></div>
  `;
  if (!disabled) document.getElementById('spinWheelBtn').onclick = handleSpinWheel;
  updateSpinCountdown();
}

// Countdown timer for Spin Wheel
function updateSpinCountdown() {
  let countdownDiv = document.getElementById('spinCountdown');
  if (!countdownDiv) return;
  let now = new Date();
  let spinDate = new Date('2026-01-10T00:00:00+05:30');
  if (now >= spinDate) {
    // Hide the countdown/tournament start section
    var countdownSection = countdownDiv.parentElement;
    if (countdownSection) countdownSection.style.display = 'none';
    return;
  }
  let diff = spinDate - now;
  let d = Math.floor(diff / (1000*60*60*24));
  let h = Math.floor((diff / (1000*60*60)) % 24);
  let m = Math.floor((diff / (1000*60)) % 60);
  let s = Math.floor((diff / 1000) % 60);
  // Only show days and hours on mobile (≤600px), else show all
  if (window.innerWidth <= 600) {
    countdownDiv.innerHTML = `
      <div style=\"display:flex;gap:18px;\">
        <div style=\"background:#10131a;border-radius:16px;padding:18px 18px;box-shadow:0 2px 18px rgba(0,0,0,0.18);display:flex;flex-direction:column;align-items:center;min-width:70px;\">
          <span style=\"color:#00eaff;font-size:2.1rem;font-family:'Montserrat',monospace;font-weight:700;text-shadow:0 0 12px #00eaff99;\">${d}</span>
          <span style=\"color:#fff;font-size:0.95rem;letter-spacing:1px;margin-top:6px;opacity:0.85;\">DAYS</span>
        </div>
        <div style=\"color:#00eaff;font-size:2.1rem;align-self:center;\">:</div>
        <div style=\"background:#10131a;border-radius:16px;padding:18px 18px;box-shadow:0 2px 18px rgba(0,0,0,0.18);display:flex;flex-direction:column;align-items:center;min-width:70px;\">
          <span style=\"color:#00eaff;font-size:2.1rem;font-family:'Montserrat',monospace;font-weight:700;text-shadow:0 0 12px #00eaff99;\">${String(h).padStart(2,'0')}</span>
          <span style=\"color:#fff;font-size:0.95rem;letter-spacing:1px;margin-top:6px;opacity:0.85;\">HOURS</span>
        </div>
      </div>
    `;
  } else {
    countdownDiv.innerHTML = `
      <div style=\"display:flex;gap:18px;\">
        <div style=\"background:#10131a;border-radius:16px;padding:18px 28px;box-shadow:0 2px 18px rgba(0,0,0,0.18);display:flex;flex-direction:column;align-items:center;min-width:90px;\">
          <span style=\"color:#00eaff;font-size:2.6rem;font-family:'Montserrat',monospace;font-weight:700;text-shadow:0 0 12px #00eaff99;\">${d}</span>
          <span style=\"color:#fff;font-size:1.05rem;letter-spacing:1px;margin-top:6px;opacity:0.85;\">DAYS</span>
        </div>
        <div style=\"color:#00eaff;font-size:2.5rem;align-self:center;\">:</div>
        <div style=\"background:#10131a;border-radius:16px;padding:18px 28px;box-shadow:0 2px 18px rgba(0,0,0,0.18);display:flex;flex-direction:column;align-items:center;min-width:90px;\">
          <span style=\"color:#00eaff;font-size:2.6rem;font-family:'Montserrat',monospace;font-weight:700;text-shadow:0 0 12px #00eaff99;\">${String(h).padStart(2,'0')}</span>
          <span style=\"color:#fff;font-size:1.05rem;letter-spacing:1px;margin-top:6px;opacity:0.85;\">HOURS</span>
        </div>
        <div style=\"color:#00eaff;font-size:2.5rem;align-self:center;\">:</div>
        <div style=\"background:#10131a;border-radius:16px;padding:18px 28px;box-shadow:0 2px 18px rgba(0,0,0,0.18);display:flex;flex-direction:column;align-items:center;min-width:90px;\">
          <span style=\"color:#00eaff;font-size:2.6rem;font-family:'Montserrat',monospace;font-weight:700;text-shadow:0 0 12px #00eaff99;\">${String(m).padStart(2,'0')}</span>
          <span style=\"color:#fff;font-size:1.05rem;letter-spacing:1px;margin-top:6px;opacity:0.85;\">MINUTES</span>
        </div>
        <div style=\"color:#00eaff;font-size:2.5rem;align-self:center;\">:</div>
        <div style=\"background:#10131a;border-radius:16px;padding:18px 28px;box-shadow:0 2px 18px rgba(0,0,0,0.18);display:flex;flex-direction:column;align-items:center;min-width:90px;\">
          <span style=\"color:#00eaff;font-size:2.6rem;font-family:'Montserrat',monospace;font-weight:700;text-shadow:0 0 12px #00eaff99;\">${String(s).padStart(2,'0')}</span>
          <span style=\"color:#fff;font-size:1.05rem;letter-spacing:1px;margin-top:6px;opacity:0.85;\">SECONDS</span>
        </div>
      </div>
    `;
  }
  setTimeout(updateSpinCountdown, 1000);
}



