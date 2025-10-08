import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// 🔑 Supabase client
const supabase = createClient(
  "https://udiqxodotepzmjcfaoae.supabase.co", // Project URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaXF4b2RvdGVwem1qY2Zhb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzU3ODMsImV4cCI6MjA3NDUxMTc4M30.GfHWjyYPJW1K7sMMCpNZwzKzgWtQ3oeh6H4O251stlY" // replace with your anon public key
);

console.log(supabase);

// ✅ Import Firebase SDKs directly from the web 
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js"; 
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js"; 
import { getFirestore, collection, addDoc, serverTimestamp, getDoc, updateDoc, increment, doc, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔑 Your Firebase project configuration 
const firebaseConfig = { 
  apiKey: "AIzaSyCbD9g3mgoPtHST1KiNVR1fO8r4Oa5M4MY", 
  authDomain: "musicvideos-5078e.firebaseapp.com", 
  projectId: "musicvideos-5078e", 
  storageBucket: "musicvideos-5078e.firebasestorage.app", 
  messagingSenderId: "341867589149", 
  appId: "1:341867589149:web:b24ab89732838f1496e0f4" 
}; 

// 🚀 Initialize Firebase 
const app = initializeApp(firebaseConfig); 
const auth = getAuth(app);
const storage = getStorage(app); 
const db = getFirestore(app); 

console.log("✅ Firebase connected:", app.name);

// Global variables
let allVideos = [];
let filteredVideos = [];
let currentUser = null;
let userProfile = null;
let currentFilter = 'all'; // 'all' or 'my'

// Event listeners
window.addEventListener("DOMContentLoaded", () => {
  checkAuthState();
  setupEventListeners();
});

// Check authentication state
function checkAuthState() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await loadUserProfile();
      updateUIForLoggedInUser();
      fetchVideos();
    } else {
      currentUser = null;
      userProfile = null;
      updateUIForLoggedOutUser();
      // Always redirect to auth page if not logged in
      window.location.href = 'auth.html';
    }
  });
}

async function loadUserProfile() {
  if (!currentUser) return;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      userProfile = userDoc.data();
      console.log('✅ User profile loaded:', userProfile);
    }
  } catch (error) {
    console.error('❌ Error loading user profile:', error);
  }
}

function updateUIForLoggedInUser() {
  // Update header to show user info
  const header = document.querySelector('.header p');
  if (header && userProfile) {
    header.textContent = `Welcome back, ${userProfile.name}! Share and discover amazing videos`;
  }
  
  // Add logout button
  const controls = document.querySelector('.control-buttons');
  if (controls && !document.getElementById('logoutBtn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'upload-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.style.marginLeft = '10px';
    logoutBtn.onclick = handleLogout;
    controls.appendChild(logoutBtn);
  }
}

function updateUIForLoggedOutUser() {
  // Reset header
  const header = document.querySelector('.header p');
  if (header) {
    header.textContent = 'Share and discover amazing videos';
  }
  
  // Remove logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.remove();
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Failed to logout. Please try again.');
  }
}

function setupEventListeners() {
  //Remove titleHeader
  document.getElementById("watchBtn").addEventListener("click", removeTitleHeader);

  //Add titleHeader
  document.getElementById("navTitle").addEventListener("click", addTitleHeader);

  // Modal controls
  document.getElementById("uploadBtn").addEventListener("click", openUploadModal);
  document.getElementById("closeModal").addEventListener("click", closeUploadModal);
  document.getElementById("uploadForm").addEventListener("submit", handleUpload);
  
  // Search functionality
  document.getElementById("searchInput").addEventListener("input", handleSearch);
  
  // Filter buttons
  document.getElementById("myUploadsBtn").addEventListener("click", () => {
    setFilter('my');
    removeTitleHeader();
  });
  document.getElementById("allVideosBtn").addEventListener("click", () => {
    setFilter('all');
    removeTitleHeader();
  });
  
  // Close modal when clicking outside
  document.getElementById("uploadModal").addEventListener("click", (e) => {
    if (e.target.id === "uploadModal") {
      closeUploadModal();
    }
  });
  
  // File input change handler
  document.getElementById("videoInput").addEventListener("change", handleFileSelect);
}

function removeTitleHeader() {
  const titleHeader = document.getElementById("titleHeader");
  titleHeader.style.display = "none";
}

function addTitleHeader() {
  const titleHeader = document.getElementById("titleHeader");
  titleHeader.style.display = "flex";
}

function openUploadModal() {
  document.getElementById("uploadModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeUploadModal() {
  document.getElementById("uploadModal").style.display = "none";
  document.body.style.overflow = "auto";
  document.getElementById("uploadForm").reset();
  document.getElementById("submitBtn").disabled = false;
  document.getElementById("submitBtn").textContent = "Upload Video";
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  const label = document.querySelector(".file-input-label");
  if (file) {
    label.textContent = `📁 Selected: ${file.name}`;
    label.style.background = "#667eea";
    label.style.color = "white";
    // Auto-detect duration using a temporary video element
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = URL.createObjectURL(file);
      const setDurationFromVideo = () => {
        URL.revokeObjectURL(tempVideo.src);
        const seconds = Number.isFinite(tempVideo.duration) ? Math.round(tempVideo.duration) : 0;
        const mm = Math.floor(seconds / 60);
        const ss = (seconds % 60).toString().padStart(2, '0');
        const mmss = `${mm}:${ss}`;
        const durationField = document.getElementById('videoDuration');
        if (durationField) {
          durationField.value = mmss;
          durationField.dataset.seconds = String(seconds);
        }
      };
      tempVideo.addEventListener('loadedmetadata', setDurationFromVideo, { once: true });
      tempVideo.addEventListener('durationchange', () => {
        if (tempVideo.duration && isFinite(tempVideo.duration)) {
          setDurationFromVideo();
        }
      }, { once: true });
      // Safari sometimes needs a load()
      try { tempVideo.load(); } catch {}
      tempVideo.onerror = () => {
        
      };
    } catch (err) {
      
    }
  } else {
    label.textContent = "📁 Click to select video file";
    label.style.background = "#f8f9ff";
    label.style.color = "#333";
  }
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  applyFilters(searchTerm);
}

function setFilter(filterType) {
  currentFilter = filterType;
  
  // Update button states
  document.getElementById('allVideosBtn').classList.toggle('active', filterType === 'all');
  document.getElementById('myUploadsBtn').classList.toggle('active', filterType === 'my');
  
  // Apply current search term with new filter
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  applyFilters(searchTerm);
}

function applyFilters(searchTerm) {
  let videos = [...allVideos];
  
  // Apply user filter
  if (currentFilter === 'my' && currentUser) {
    videos = videos.filter(video => video.uploadedBy === currentUser.uid);
  }
  
  // Apply search filter
  if (searchTerm) {
    videos = videos.filter(video => 
      video.title.toLowerCase().includes(searchTerm) || 
      video.artist.toLowerCase().includes(searchTerm)
    );
  }
  
  filteredVideos = videos;
  displayVideos(filteredVideos);
}

function handleUpload(e) {
  e.preventDefault();
  uploadVideo();
}

async function uploadVideo() {
  // Check if user is authenticated
  if (!currentUser) {
    alert("Please log in to upload videos!");
    window.location.href = 'auth.html';
    return;
  }

  const fileInput = document.getElementById("videoInput");
  const file = fileInput.files[0];

  const titleInput = document.getElementById("videoTitle").value.trim();
  const artistInput = document.getElementById("videoArtist").value.trim();
  const durationInput = document.getElementById("videoDuration").value.trim();
  const durationDetectedSeconds = parseInt(document.getElementById("videoDuration").dataset.seconds || '0', 10);

  if (!file) {
    alert("Please choose a video first!");
    return;
  }

  if (!titleInput || !artistInput) {
    alert("Please fill in title and artist!");
    return;
  }

  // Determine duration seconds: prefer auto-detected; fallback to parsing
  let durationInSeconds = Number.isFinite(durationDetectedSeconds) && durationDetectedSeconds > 0
    ? durationDetectedSeconds
    : (parseDurationToSeconds(durationInput) ?? 0);

  // Fallback: read duration from file metadata right before upload if still 0
  if (!durationInSeconds && file) {
    durationInSeconds = await getVideoDurationSeconds(file).catch(() => 0);
    if (durationInSeconds > 0) {
      const mm = Math.floor(durationInSeconds / 60);
      const ss = (durationInSeconds % 60).toString().padStart(2, '0');
      const durationField = document.getElementById('videoDuration');
      if (durationField) {
        durationField.value = `${mm}:${ss}`;
        durationField.dataset.seconds = String(durationInSeconds);
      }
    }
  }

  // Disable submit button and show loading
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Uploading...";

  try {
    // Use the generated filename everywhere
    const fileName = generateFileName(titleInput, file);

    const { data, error } = await supabase.storage
      .from("video")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("❌ Upload failed:", error.message);
      alert("Upload failed: " + error.message);
      return;
    }

    // Get public URL using the SAME generated filename
    const { data: urlData } = supabase.storage
      .from("video")
      .getPublicUrl(fileName);

    const videoUrl = urlData.publicUrl;

    // Ensure we use the user's profile name from users collection
    console.log('[upload] userProfile at start:', userProfile);
    let profileName = userProfile?.name;
    console.log('[upload] profileName from userProfile:', profileName);
    if (!profileName && currentUser?.uid) {
      try {
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          console.log('[upload] full profile data:', profileData);
          profileName = profileData.name;
          console.log('[upload] loaded profile name from users:', profileName);
        } else {
          console.log('[upload] no users profile doc found for', currentUser.uid);
        }
      } catch (e) {
        console.warn('[upload] failed to load users profile:', e);
      }
    }

    // Final uploaderName: use profileName, never use artist
    const chosenUploaderName = profileName || 'User';
    console.log('[upload] uploaderName to store:', chosenUploaderName);
    // Ensure duration string (MM:SS)
    const durationString = document.getElementById("videoDuration").value.trim();
    await saveVideoDetails({
      title: titleInput,
      artist: artistInput,
      duration: durationString, // duration in MM:SS format (auto-filled)
      durationSeconds: durationInSeconds, // duration in seconds for calculations
      videoUrl,
      uploadedBy: currentUser.uid,
      uploaderName: chosenUploaderName,
      uploaderEmail: currentUser.email
    });

    // Update user's video count
    await updateUserVideoCount();

    // Close modal and refresh videos
    closeUploadModal();
    await fetchVideos();
    alert("✅ Video uploaded successfully!");

  } catch (error) {
    console.error("❌ Upload error:", error);
    alert("Upload failed: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Upload Video";
  }
}

async function saveVideoDetails({ title, artist, duration, durationSeconds, videoUrl, uploadedBy, uploaderName, uploaderEmail }) {
try {
  const docRef = await addDoc(collection(db, "videos"), {
    title: title,
    artist: artist,
    duration: duration, // in MM:SS format
    durationSeconds: durationSeconds, // in seconds for calculations
    video_url: videoUrl,
    uploadedBy: uploadedBy, // User ID
    uploaderName: uploaderName, // User's display name
    uploaderEmail: uploaderEmail, // User's email
    uploadedAt: serverTimestamp() // automatically sets the current time
  });
  console.log("✅ Video metadata saved with ID:", docRef.id);
  return docRef.id;
} catch (error) {
  console.error("❌ Error saving video metadata:", error);
}
}

async function updateUserVideoCount(change = 1) {
  if (!currentUser) return;
  
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      videosCount: increment(change)
    });
    console.log(`✅ User video count updated by ${change}`);
  } catch (error) {
    console.error("❌ Error updating user video count:", error);
  }
}

function generateFileName(title, file) {
// 1. Normalize title
let safeTitle = title
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_"); // replace non-alphanumeric with _

// 2. Get original file extension
const extension = file.name.split('.').pop();

// 3. Append timestamp to ensure uniqueness
const timestamp = Date.now();

// 4. Combine into new filename
return `uploads/${safeTitle}_${timestamp}.${extension}`;
}

async function fetchVideos() {
const videoGrid = document.getElementById("videoGrid");
videoGrid.innerHTML = '<div class="loading">Loading videos...</div>';

try {
  const q = query(collection(db, "videos"), orderBy("uploadedAt", "desc")); // latest first
  const querySnapshot = await getDocs(q);

    allVideos = [];
    const uploaderIds = new Set();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      console.log('[fetch] video doc', docSnap.id, {
        title: data?.title,
        artist: data?.artist,
        uploadedBy: data?.uploadedBy,
        uploaderName: data?.uploaderName,
        uploaderEmail: data?.uploaderEmail
      });
      if (data.uploadedBy) uploaderIds.add(data.uploadedBy);
      allVideos.push({
        id: docSnap.id,
        title: data.title,
        artist: data.artist,
        videoUrl: data.video_url,
        uploadedAt: data.uploadedAt,
        uploadedBy: data.uploadedBy,
        duration: data.duration,
        durationSeconds: data.durationSeconds,
        uploaderName: data.uploaderName || 'Unknown',
        uploaderEmail: data.uploaderEmail
      });
    });

    // Fetch uploader display names from users collection, prefer 'name' field
    const uploaderNameMap = new Map();
    await Promise.all(
      Array.from(uploaderIds).map(async (uid) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const u = userDoc.data();
            console.log('[fetch] users profile', uid, u);
            if (u && u.name) {
              uploaderNameMap.set(uid, u.name);
              console.log('[fetch] profile name found for', uid, '=>', u.name);
            } else {
              console.log('[fetch] no profile name for', uid, 'profile:', u);
            }
          } else {
            console.log('[fetch] no users doc for', uid);
          }
        } catch (e) {
          console.warn('Could not load user profile for', uid, e);
        }
      })
    );

    // Overwrite uploaderName with profile name when available
    allVideos = allVideos.map(v => {
      const finalName = uploaderNameMap.get(v.uploadedBy) || v.uploaderName;
      if (v.uploaderName !== finalName) {
        console.log('[fetch] overriding uploaderName for video', v.id, 'from', v.uploaderName, 'to', finalName);
      } else {
        console.log('[fetch] keeping uploaderName for video', v.id, 'as', finalName);
      }
      return { ...v, uploaderName: finalName };
    });

    // Apply current filters
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    applyFilters(searchTerm);

} catch (error) {
  console.error("❌ Error fetching videos:", error);
  videoGrid.innerHTML = '<div class="empty-state"><h3>Error loading videos</h3><p>Please try again later</p></div>';
}
}

function displayVideos(videos) {
  const videoGrid = document.getElementById("videoGrid");
  
  if (videos.length === 0) {
    let emptyMessage = '';
    if (currentFilter === 'my') {
      emptyMessage = '<div class="empty-state"><h3>No uploads yet</h3><p>You haven\'t uploaded any videos. Click the upload button to get started!</p></div>';
    } else {
      emptyMessage = '<div class="empty-state"><h3>No videos found</h3><p>Upload your first video to get started!</p></div>';
    }
    videoGrid.innerHTML = emptyMessage;
    return;
  }

videoGrid.innerHTML = "";

videos.forEach(video => {
  const card = document.createElement("div");
  card.className = "video-card";
  
  const uploadDate = video.uploadedAt ? 
    new Date(video.uploadedAt.seconds * 1000).toLocaleDateString() : 
    'Unknown date';

    // Check if current user can delete this video
    const canDelete = currentUser && (video.uploadedBy === currentUser.uid);
    
    card.innerHTML = `
      <div class="video-container">
        <video width="100%" controls>
          <source src="${video.videoUrl}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        ${canDelete ? `
        <div class="video-actions">
          <button class="action-btn" data-delete-id="${video.id}" title="Delete video">
            🗑️
          </button>
        </div>
        ` : ''}
      </div>
      <div class="video-info">
        <h3 class="video-title">${video.title}</h3>
        <p class="video-artist">${video.artist}</p>
        <p class="video-artist">Uploaded by: ${video.uploaderName}</p>
        
        <p class="video-date">${uploadDate}</p>
      </div>
    `;

{/* <p class="video-duration">Duration: ${video.duration || formatSecondsToMMSS(video.durationSeconds || 0)}</p> */}

  // Navigate to video page when clicking the card or video (but not the delete button)
  card.addEventListener('click', (e)=>{
    const target = e.target;
    if (target.closest('[data-delete-id]')) return; // ignore clicks on delete
    window.location.href = `video.html?id=${video.id}`;
  });

  // Wire delete button
  if (canDelete) {
    const delBtn = card.querySelector('[data-delete-id]');
    delBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const vid = delBtn.getAttribute('data-delete-id');
      deleteVideo(vid);
    });
  }

  videoGrid.appendChild(card);
});
}

async function deleteVideo(videoId) {
  // Check if user is authenticated
  if (!currentUser) {
    alert("Please log in to delete videos!");
    return;
  }

  // Find the video to check ownership
  const video = allVideos.find(v => v.id === videoId);
  if (!video) {
    alert("Video not found!");
    return;
  }

  // Check if user owns this video
  if (video.uploadedBy !== currentUser.uid) {
    alert("You can only delete your own videos!");
    return;
  }

  if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
    return;
  }

  try {
    // Extract filename from video URL for Supabase deletion
    const videoUrl = video.videoUrl;
    const fileName = extractFileNameFromUrl(videoUrl);
    
    // Delete from Supabase storage first
    if (fileName) {
      console.log("🗑️ Deleting file from Supabase:", fileName);
      
      // Use the anon key for public operations
      const { error: storageError } = await supabase.storage
        .from('video')
        .remove([fileName]);
      
      if (storageError) {
        console.error("❌ Supabase storage deletion failed:", storageError);
        // Show warning but continue with Firestore deletion
        console.warn("⚠️ Continuing with database cleanup despite storage error");
      } else {
        console.log("✅ Video file deleted from Supabase storage");
      }
    } else {
      console.warn("⚠️ Could not extract filename, skipping storage deletion");
    }
    
    // Delete from Firestore
    const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
    await deleteDoc(doc(db, "videos", videoId));
    
    // Update user's video count
    await updateUserVideoCount(-1);
    
    // Refresh the video list
    await fetchVideos();
    alert("✅ Video deleted successfully!");
    
  } catch (error) {
    console.error("❌ Error deleting video:", error);
    alert("Failed to delete video: " + error.message);
  }
}

// Helper function to parse MM:SS format to seconds
function parseDurationToSeconds(durationStr) {
  try {
    // Check if format is MM:SS
    const timePattern = /^(\d+):([0-5][0-9])$/;
    const match = durationStr.match(timePattern);
    
    if (!match) {
      return null; // Invalid format
    }
    
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    
    // Convert to total seconds
    return minutes * 60 + seconds;
  } catch (error) {
    console.error("Error parsing duration:", error);
    return null;
  }
}

// Helper function to format seconds to MM:SS
function formatSecondsToMMSS(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to extract filename from Supabase URL
function extractFileNameFromUrl(url) {
  try {
    // Supabase URLs look like: https://udiqxodotepzmjcfaoae.supabase.co/storage/v1/object/public/video/uploads/filename.mp4
    const urlParts = url.split('/');
    const videoIndex = urlParts.indexOf('video');
    
    if (videoIndex !== -1 && videoIndex + 1 < urlParts.length) {
      // Get everything after 'video/' which should be the file path
      const filePath = urlParts.slice(videoIndex + 1).join('/');
      return filePath;
    }
    
    console.warn("Could not extract filename from URL:", url);
    return null;
  } catch (error) {
    console.error("Error extracting filename:", error);
    return null;
  }
}

// Helper to read duration from a File via a temporary video element
async function getVideoDurationSeconds(file) {
  return new Promise((resolve) => {
    try {
      const el = document.createElement('video');
      el.preload = 'metadata';
      el.src = URL.createObjectURL(file);
      const cleanup = () => {
        try { URL.revokeObjectURL(el.src); } catch {}
      };
      el.addEventListener('loadedmetadata', () => {
        const dur = Number.isFinite(el.duration) ? Math.round(el.duration) : 0;
        cleanup();
        resolve(dur);
      }, { once: true });
      el.addEventListener('error', () => { cleanup(); resolve(0); }, { once: true });
      try { el.load(); } catch {}
    } catch { resolve(0); }
  });
}

// Make deleteVideo globally accessible
window.deleteVideo = deleteVideo;
