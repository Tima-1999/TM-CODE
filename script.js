// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxHus6_ULAXhHPD2fjvYeOIObze_2CIuE",
    authDomain: "tm-online-chat.firebaseapp.com",
    projectId: "tm-online-chat",
    storageBucket: "tm-online-chat.firebasestorage.app",
    messagingSenderId: "479912188862",
    appId: "1:479912188862:web:28101509de77f653a577ef",
    databaseURL: "https://tm-online-chat-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = localStorage.getItem('tm_chat_user');
let isLoginMode = true;

// Authentication
function handleAuth() {
    const user = document.getElementById('user-name').value.trim();
    const pass = document.getElementById('user-pass').value.trim();
    if(!user || !pass) return alert("Doly ýazyň!");

    if(isLoginMode) {
        db.ref('users/' + user).once('value', s => {
            if(s.exists() && s.val().pass === pass) loginSuccess(user);
            else alert("Ýalňyş maglumat!");
        });
    } else {
        db.ref('users/' + user).set({ pass: pass }).then(() => loginSuccess(user));
    }
}

function loginSuccess(user) {
    currentUser = user;
    localStorage.setItem('tm_chat_user', user);
    showView('view-app');
    initChat();
}

function initChat() {
    document.getElementById('current-user').innerText = currentUser;
    
    // Onlayn statusy
    db.ref('presence/' + currentUser).set(true);
    db.ref('presence/' + currentUser).onDisconnect().remove();

    // Habarlary okamak
    db.ref('messages').limitToLast(50).on('value', s => {
        const box = document.getElementById('chat-box');
        box.innerHTML = "";
        s.forEach(snap => {
            const m = snap.val();
            const isMe = m.user === currentUser;
            box.innerHTML += `
                <div class="msg ${isMe ? 'my-msg' : 'other-msg'}">
                    <small class="msg-info">${m.user}</small>
                    ${m.type === 'img' ? `<img src="${m.text}" class="img-fluid rounded">` : m.text}
                </div>
            `;
        });
        box.scrollTop = box.scrollHeight;
    });

    // Onlayn sanawy
    db.ref('presence').on('value', s => {
        const list = document.getElementById('user-list');
        list.innerHTML = "";
        s.forEach(snap => {
            list.innerHTML += `<div class="p-2 border-bottom border-secondary small"><i class="fas fa-circle text-success me-2"></i> ${snap.key}</div>`;
        });
    });
}

// Funksiyalar
function sendMessage() {
    const inp = document.getElementById('msg-field');
    if(!inp.value.trim()) return;
    db.ref('messages').push({ user: currentUser, text: inp.value, type: 'text', time: Date.now() });
    inp.value = "";
    db.ref('typing/' + currentUser).remove();
}

function handleTyping() {
    db.ref('typing/' + currentUser).set(true);
    setTimeout(() => db.ref('typing/' + currentUser).remove(), 3000);
}

db.ref('typing').on('value', s => {
    const users = Object.keys(s.val() || {}).filter(u => u !== currentUser);
    document.getElementById('typing-notif').innerText = users.length ? users.join(', ') + " ýazýar..." : "";
});

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    document.getElementById(id).classList.add('active-view');
}

if(currentUser) loginSuccess(currentUser);

// Giriş we Registrasiýa arasynda geçiş funksiýasy
function toggleAuth() {
    isLoginMode = !isLoginMode; // Režimi üýtgedýär (true -> false)
    
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    const toggleLink = document.getElementById('auth-toggle');

    if (isLoginMode) {
        title.innerText = "Giriş";
        btn.innerText = "Giriş Et";
        toggleLink.innerHTML = `Hasap ýokmy? <a href="javascript:toggleAuth()" class="text-info">Täze açyň</a>`;
    } else {
        title.innerText = "Registrasiýa";
        btn.innerText = "Hasap Aç";
        toggleLink.innerHTML = `Hasabyňyz barmy? <a href="javascript:toggleAuth()" class="text-info">Giriş ediň</a>`;
    }
}
