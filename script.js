// --- SAZLAMALAR ---
const CLOUD_NAME = 'djpha04xn'; 
const UPLOAD_PRESET = 'TM BULUT'; 

const firebaseConfig = {
    apiKey: "AIzaSyBxHus6_ULAXhHPD2fjvYeOIObze_2CIuE",
    authDomain: "tm-online-chat.firebaseapp.com",
    projectId: "tm-online-chat",
    databaseURL: "https://tm-online-chat-default-rtdb.firebaseio.com"
};

// Firebase-i işe girizmek
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

// --- SAHYPA ÝÜKLENENDE BARLAG ---
window.onload = () => {
    const user = localStorage.getItem("tm_user");
    const displayElement = document.getElementById('display-user');
    
    // Eger portal.html-de bolsak we login edilmedik bolsa yzyna ugrat
    if (window.location.pathname.includes("portal.html")) {
        if (!user) {
            window.location.href = "index.html";
        } else {
            if (displayElement) displayElement.innerText = user;
            loadFiles(user);
        }
    }
};

// --- GIRIŞ (LOGIN) ---
function handleLogin() {
    const user = document.getElementById('username').value.trim().toLowerCase();
    const pass = document.getElementById('password').value.trim();
    const msg = document.getElementById('info-msg');

    if (!user || !pass) {
        msg.style.color = "#ef4444";
        msg.innerText = "Maglumatlary dolduryň!";
        return;
    }

    db.ref('users/' + user).once('value', (snap) => {
        if (snap.exists()) {
            const userData = snap.val();
            if (userData.password === pass) {
                localStorage.setItem("tm_user", user);
                msg.style.color = "#10b981";
                msg.innerText = "Giriş şowly! Garaşyň...";
                setTimeout(() => { window.location.href = "portal.html"; }, 1000);
            } else {
                msg.style.color = "#ef4444";
                msg.innerText = "Parol ýalňyş!";
            }
        } else {
            msg.style.color = "#ef4444";
            msg.innerText = "Ulanyjy tapylmady!";
        }
    });
}

// --- HASAP DÖRETMEK (REGISTER) ---
function handleRegister() {
    const user = document.getElementById('reg-username').value.trim().toLowerCase();
    const pass = document.getElementById('reg-password').value.trim();
    const question = document.getElementById('reg-question').value;
    const answer = document.getElementById('reg-answer').value.trim().toLowerCase();
    const msg = document.getElementById('reg-msg');

    if (!user || !pass || !answer) {
        msg.style.color = "#ef4444";
        msg.innerText = "Ähli meýdançalary dolduryň!";
        return;
    }

    db.ref('users/' + user).set({
        password: pass,
        secret_q: question,
        secret_a: answer
    }, (err) => {
        if (!err) {
            msg.style.color = "#10b981";
            msg.innerText = "Hasap döredildi! Giriş sahypasyna geçilýär...";
            setTimeout(() => { window.location.href = "index.html"; }, 1500);
        } else {
            msg.innerText = "Hata döredi!";
        }
    });
}

// --- FAÝL ÝÜKLEMEK ---
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
    const startTime = new Date().getTime(); // Başlangyç wagty

    // ÝÜKLENIŞ PROSESINI YZARLAMAK
    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            // Göterimi hasaplamak
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            
            // Tizligi hasaplamak (MB/s)
            const currentTime = new Date().getTime();
            const duration = (currentTime - startTime) / 1000; // sekunt
            const bps = e.loaded / duration; // bytes per second
            const mbps = (bps / (1024 * 1024)).toFixed(2); // MB/s

            // Ekrana çykarmak
            pBar.style.width = percentComplete + "%";
            pBar.innerHTML = `${percentComplete}% | ${mbps} MB/s`;
            
            if (percentComplete === 100) {
                pBar.innerHTML = "Serwere ýazylyp dur, garaşyň...";
            }
        }
    };

    xhr.onload = function() {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";

            // Firebase-e ýazmak
            db.ref('user_files/' + user).push({
                name: file.name,
                url: data.secure_url,
                size: fileSizeMB,
                time: new Date().toLocaleString()
            }).then(() => {
                pBar.innerHTML = "Şowly ýüklendi!";
                setTimeout(() => { location.reload(); }, 1000);
            });
        } else {
            alert("Ýüklemekde hata döredi!");
            pContainer.style.display = "none";
        }
    };

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, true);
    xhr.send(formData);
}

// --- FAÝLLARY GÖRKEZMEK ---
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
                        <span>${f.time} | <i class="fas fa-hdd"></i> ${f.size || '?? MB'}</span>
                    </div>
                    <div class="f-actions">
                        <a href="${f.url}" target="_blank" class="btn-action download"><i class="fas fa-eye"></i></a>
                        <button onclick="deleteFile('${child.key}')" class="btn-action delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
        });
    });
}

// --- PAROL DIKELTMEK (FORGOT PASSWORD) ---
function showSecretQuestion() {
    const user = document.getElementById('forgot-username').value.trim().toLowerCase();
    const msg = document.getElementById('forgot-msg');
    const recoverySection = document.getElementById('recovery-section');
    const displayQ = document.getElementById('display-question');

    if (!user) {
        msg.innerText = "Ilki loginiňizi ýazyň!";
        msg.style.color = "#ef4444";
        return;
    }

    db.ref('users/' + user).once('value', (snap) => {
        if (snap.exists()) {
            const data = snap.val();
            displayQ.innerText = "Sorag: " + data.secret_q;
            recoverySection.style.display = "block";
            msg.innerText = "Hasap tapyldy. Jogap beriň.";
            msg.style.color = "#3b82f6";
        } else {
            msg.innerText = "Beýle ulanyjy ýok!";
            msg.style.color = "#ef4444";
            recoverySection.style.display = "none";
        }
    });
}

function resetPassword() {
    const user = document.getElementById('forgot-username').value.trim().toLowerCase();
    const answer = document.getElementById('forgot-answer').value.trim().toLowerCase();
    const newPass = document.getElementById('new-password').value.trim();
    const msg = document.getElementById('forgot-msg');

    if (!answer || !newPass) {
        msg.innerText = "Ähli ýerleri dolduryň!";
        msg.style.color = "#f59e0b";
        return;
    }

    db.ref('users/' + user).once('value', (snap) => {
        const data = snap.val();
        if (data.secret_a === answer) {
            db.ref('users/' + user).update({ password: newPass }).then(() => {
                msg.style.color = "#10b981";
                msg.innerText = "Parol şowly üýtgedildi! Giriş edip bilersiňiz.";
                setTimeout(() => { window.location.href = "index.html"; }, 2000);
            });
        } else {
            msg.style.color = "#ef4444";
            msg.innerText = "Gizlin jogap ýalňyş!";
        }
    });
}

// --- PORTAL IÇINDE PAROL ÜÝTGETMEK (MODAL) ---
function openPassModal() { document.getElementById('pass-modal').style.display = "flex"; }
function closePassModal() { 
    document.getElementById('pass-modal').style.display = "none";
    document.getElementById('change-msg').innerText = "";
}

function changeUserPassword() {
    const user = localStorage.getItem("tm_user");
    const oldPass = document.getElementById('old-pass').value;
    const newPass = document.getElementById('change-new-pass').value;
    const msg = document.getElementById('change-msg');

    if (!oldPass || !newPass) {
        msg.innerText = "Ähli öýjükleri dolduryň!";
        msg.style.color = "#ef4444";
        return;
    }

    db.ref('users/' + user).once('value', (snap) => {
        if (snap.exists() && snap.val().password === oldPass) {
            db.ref('users/' + user).update({ password: newPass }).then(() => {
                msg.style.color = "#10b981";
                msg.innerText = "Parol şowly çalşyldy!";
                setTimeout(() => { closePassModal(); }, 1500);
            });
        } else {
            msg.style.color = "#ef4444";
            msg.innerText = "Köne parol ýalňyş!";
        }
    });
}

// --- BEÝLEKI FUNKSIÝALAR ---
function deleteFile(key) {
    const user = localStorage.getItem("tm_user");
    if (confirm("Faýly pozmalymy?")) {
        db.ref('user_files/' + user + '/' + key).remove();
    }
}

function exit() {
    localStorage.removeItem("tm_user");
    window.location.href = "index.html";
}

function filterFiles() {
    const term = document.getElementById('file-search').value.toLowerCase();
    const items = document.querySelectorAll('.file-item');
    items.forEach(item => {
        const name = item.querySelector('b').innerText.toLowerCase();
        item.style.display = name.includes(term) ? "flex" : "none";
    });
}



// --- JEMI TÄZELENEN LOGIKA ---

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Sahypa ýüklenende temany barla
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

// Kämil Gözleg Funksiýasy
function filterFiles() {
    const term = document.getElementById('file-search').value.toLowerCase();
    const items = document.querySelectorAll('.file-item');
    items.forEach(item => {
        const name = item.querySelector('b').innerText.toLowerCase();
        if(name.includes(term)) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
}

// Faýl ýükleýiş (Tizlik we % bilen) - Öňki XMLHttpRequest kody bärde dowam edýär
// ... (Ýokarda beren XMLHttpRequest uploadFile funksiýaňy bärde ulan)
