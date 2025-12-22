// --- 1. SAZLAMALAR ---
const CLOUD_NAME = 'djpha04xn'; 
const UPLOAD_PRESET = 'TM BULUT'; 

const firebaseConfig = {
    apiKey: "AIzaSyBxHus6_ULAXhHPD2fjvYeOIObze_2CIuE",
    authDomain: "tm-online-chat.firebaseapp.com",
    projectId: "tm-online-chat",
    databaseURL: "https://tm-online-chat-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

// --- 2. SAHYPA ÝÜKLENENDE ---
window.onload = () => {
    const user = localStorage.getItem("tm_user");
    const displayElement = document.getElementById('display-user');
    
    // Temany barla (Dark Mode)
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    if (window.location.pathname.includes("portal.html")) {
        if (!user) {
            window.location.href = "index.html";
        } else {
            if (displayElement) displayElement.innerText = user;
            loadFiles(user);
        }
    }
};

// --- 3. DARK MODE FUNKSIÝASY ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// --- 4. KÄMIL GÖZLEG (FILTER) ---
function filterFiles() {
    const term = document.getElementById('file-search').value.toLowerCase();
    const items = document.querySelectorAll('.file-item');
    items.forEach(item => {
        const name = item.querySelector('b').innerText.toLowerCase();
        item.style.display = name.includes(term) ? "flex" : "none";
    });
}

// --- 5. FAÝL ÝÜKLEMEK (Tizlik we % bilen) ---
function uploadFile() {
    const fileSelector = document.getElementById('file-selector');
    const file = fileSelector.files[0];
    const pBar = document.getElementById('progress-bar');
    const pContainer = document.getElementById('progress-container');
    const user = localStorage.getItem("tm_user");

    if (!file) return alert("Faýl saýlaň!");
    pContainer.style.display = "block";
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    const startTime = new Date().getTime();

    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            const duration = (new Date().getTime() - startTime) / 1000;
            const mbps = ((e.loaded / duration) / (1024 * 1024)).toFixed(2);

            pBar.style.width = percentComplete + "%";
            pBar.innerHTML = `${percentComplete}% | ${mbps} MB/s`;
        }
    };

    xhr.onload = function() {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
            db.ref('user_files/' + user).push({
                name: file.name, url: data.secure_url, size: fileSizeMB, time: new Date().toLocaleString()
            }).then(() => {
                pBar.innerHTML = "Ýüklendi!";
                setTimeout(() => { location.reload(); }, 1000);
            });
        }
    };
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, true);
    xhr.send(formData);
}

// --- 6. FAÝLLARY ÝÜKLEMEK WE POZMAK ---
function loadFiles(user) {
    db.ref('user_files/' + user).on('value', (snap) => {
        const list = document.getElementById('file-list');
        if (!list) return;
        list.innerHTML = "";
        snap.forEach(child => {
            const f = child.val();
            const ext = f.name.split('.').pop().toLowerCase();
            let icon = "fa-file-alt";
            if(['jpg','png','jpeg','gif'].includes(ext)) icon = "fa-file-image";
            if(['mp4','mov','avi'].includes(ext)) icon = "fa-file-video";
            if(ext === 'pdf') icon = "fa-file-pdf";

            list.innerHTML += `
                <div class="file-item">
                    <div class="f-icon"><i class="fas ${icon}"></i></div>
                    <div class="f-info">
                        <b>${f.name}</b>
                        <span>${f.time} | ${f.size}</span>
                    </div>
                    <div class="f-actions">
                        <a href="${f.url}" target="_blank" class="btn-action download"><i class="fas fa-eye"></i></a>
                        <button onclick="deleteFile('${child.key}')" class="btn-action delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
        });
    });
}

function deleteFile(key) {
    const user = localStorage.getItem("tm_user");
    if (confirm("Pozmalymy?")) db.ref('user_files/' + user + '/' + key).remove();
}

// --- 7. AGZA BOLMAK WE ÇYKYŞ ---
function exit() {
    localStorage.removeItem("tm_user");
    window.location.href = "index.html";
}

// Modaly açyp/ýapmak we beýleki kömekçi funksiýalar bärde dowam edýär...
function openPassModal() { document.getElementById('pass-modal').style.display = "flex"; }
function closePassModal() { document.getElementById('pass-modal').style.display = "none"; }
