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
  if (pin === '924833') {
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
  document.getElementById('adminFeatures').innerHTML = `
    <h3>Admin Controls</h3>
    <button onclick="toggleEditLock()">Toggle Edit Lock</button>
    <button onclick="showPoolManagement()">Pool Management</button>
    <div id="editLockStatus"></div>
    <!-- Add more admin-only controls here -->
  `;
  updateEditLockStatus();
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
  alert('Pool Management feature coming soon!');
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
      <button type="submit">Register Team</button>
    </form>
    <div id="teamFormMsg"></div>`;
  const playersInputs = document.getElementById('playersInputs');
  let playersHtml = '';
  for(let i=1; i<=10; i++) {
    playersHtml += `<label>Player ${i}: <input type="text" name="player${i}" required></label><br><br>`;
  }
  playersInputs.innerHTML = playersHtml;

  document.getElementById('teamForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const teamName = form.teamName.value.trim();
    const captain = form.captain.value.trim();
    const captainNumber = form.captainNumber.value.trim();
    let players = [];
    for(let i=1; i<=10; i++) {
      players.push(form[`player${i}`].value.trim());
    }
    if(!teamName || !captain || !captainNumber || players.some(p => !p)) {
      document.getElementById('teamFormMsg').innerText = 'All fields are required!';
      return;
    }
    try {
      await database.ref('teams').push({ teamName, captain, captainNumber, players });
      document.getElementById('teamFormMsg').innerText = 'Team registered successfully!';
      form.reset();
    } catch (err) {
      document.getElementById('teamFormMsg').innerText = 'Error registering team.';
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


