import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js"; 
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = { 
  apiKey: "AIzaSyCbD9g3mgoPtHST1KiNVR1fO8r4Oa5M4MY", 
  authDomain: "musicvideos-5078e.firebaseapp.com", 
  projectId: "musicvideos-5078e", 
  storageBucket: "musicvideos-5078e.firebasestorage.app", 
  messagingSenderId: "341867589149", 
  appId: "1:341867589149:web:b24ab89732838f1496e0f4" 
}; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function qs(param){
  const url = new URL(window.location.href);
  return url.searchParams.get(param);
}

function formatSecondsToMMSS(totalSeconds) {
  const minutes = Math.floor((totalSeconds || 0) / 60);
  const seconds = (totalSeconds || 0) % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function loadVideoAndSidebar(videoId){
  if(!videoId){
    window.location.href = 'index.html';
    return;
  }

  // Load selected video
  const docRef = doc(db, 'videos', videoId);
  const snap = await getDoc(docRef);
  if(!snap.exists()){
    window.location.href = 'index.html';
    return;
  }
  const data = snap.data();
  

  document.getElementById('playerSource').src = data.video_url;
  const player = document.getElementById('player');
  // Load the video source; do not autoplay or mute
  player.load();
  document.getElementById('videoTitle').textContent = data.title;
  
  // Set artist name
  document.getElementById('videoArtist').textContent = data.artist || 'Unknown Artist';
  
  // Set uploader name
  let displayName = data.uploaderName || 'Unknown';
  // Prefer profile name from users collection if available
  if (data.uploadedBy) {
    try {
      const userDoc = await getDoc(doc(db, 'users', data.uploadedBy));
      if (userDoc.exists()) {
        if (userDoc.data().name) {
          displayName = userDoc.data().name;
        }
      }
    } catch (e) {
      
    }
  }
  document.getElementById('videoUploader').textContent = `Uploaded by: ${displayName}`;
  document.getElementById('videoDuration').textContent = `Duration: ${data.duration || formatSecondsToMMSS(data.durationSeconds)}`;
  const dateStr = data.uploadedAt ? new Date(data.uploadedAt.seconds * 1000).toLocaleString() : 'Unknown date';
  document.getElementById('videoDate').textContent = dateStr;

  // Do not autoplay; wait for user interaction to start playback with sound

  // Load sidebar list (other videos)
  const q = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'));
  const qsnap = await getDocs(q);
  const sidebarList = document.getElementById('sidebarList');
  sidebarList.innerHTML = '';
  qsnap.forEach((d)=>{
    if(d.id === videoId) return; // skip current
    const v = d.data();
    const item = document.createElement('div');
    item.className = 'video-card';
    item.style.display = 'grid';
    item.style.gridTemplateColumns = '120px 1fr';
    item.style.gap = '10px';
    item.style.cursor = 'pointer';

    item.innerHTML = `
      <div class="video-container-sidebar" style="height: 100px;">
        <video muted>
          <source src="${v.video_url}" type="video/mp4">
        </video>
      </div>
      <div class="video-info-sidebar" style="padding:0;">
        <div class="video-title-sidebar" style="font-size:1rem;">${v.title}</div>
        <div class="video-artist-sidebar" style="font-size:0.85rem;">${v.artist || ''}</div>
      </div>
    `;

    item.addEventListener('click', ()=>{
      window.location.href = `video.html?id=${d.id}`;
    });

    sidebarList.appendChild(item);
  });
}

window.addEventListener('DOMContentLoaded', ()=>{
  onAuthStateChanged(auth, (user)=>{
    if(!user){
      // optional: enforce auth to watch
      // window.location.href = 'auth.html';
    }
    const id = qs('id');
    loadVideoAndSidebar(id);
  });
});


