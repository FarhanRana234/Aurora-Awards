import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   GLOBALS
========================= */
const VOTING_END = new Date("2026-01-15T23:59:59");
const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
localStorage.setItem("deviceId", deviceId);

let candidates = { vendors: [], stars: [] };

/* =========================
   COUNTDOWN
========================= */
const countdownEl = document.getElementById("countdown");

function updateCountdown() {
  if (!countdownEl) return;
  const now = new Date();
  const diff = VOTING_END - now;

  if (diff <= 0) {
    countdownEl.textContent = "Voting Closed";
    document.body.classList.add("voting-ended");
    document.querySelectorAll(".vote-btn").forEach(btn => {
      btn.disabled = true;
      btn.textContent = "Closed";
    });
    showWinners(); // Automatically show winners
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);

  countdownEl.textContent = `${d}d ${h}h ${m}m`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

/* =========================
   LOAD CANDIDATES
========================= */
async function loadCandidates() {
  const res = await fetch("js/candidates.json");
  const data = await res.json();
  candidates.vendors = data.vendors;
  candidates.stars = data.stars;

  // Ensure Firestore candidates exist
  for (const type of ["vendors", "stars"]) {
    for (const c of candidates[type]) {
      const ref = doc(db, "candidates", c.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...c, type: type, votes: 0 });
      }
    }
  }

  renderCandidates("vendors");
  renderCandidates("stars");
}

/* =========================
   RENDER CANDIDATES
========================= */
function renderCandidates(type) {
  const listEl = document.getElementById(type === "vendors" ? "vendorList" : "starList");
  if (!listEl) return;

  listEl.innerHTML = "";
  candidates[type].forEach(c => {
    const card = document.createElement("div");
    card.className = "candidate-card";
    card.innerHTML = `
      <img src="${c.image}" class="candidate-img">
      <h3 class="candidate-name">${c.name}</h3>
      <button class="vote-btn" data-id="${c.id}" data-type="${type}">Vote</button>
    `;
    listEl.appendChild(card);
  });
}

/* =========================
   VOTING LOGIC
========================= */
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("vote-btn")) return;
  if (document.body.classList.contains("voting-ended")) return;

  const candidateId = e.target.dataset.id;
  const type = e.target.dataset.type;

  const voteRef = doc(db, "votes", deviceId);
  const userVoteSnap = await getDoc(voteRef);
  let prevVote = null;

  if (userVoteSnap.exists()) prevVote = userVoteSnap.data()[`${type}Vote`];

  // Remove previous vote
  if (prevVote && prevVote !== candidateId) {
    await updateDoc(doc(db, "candidates", prevVote), { votes: increment(-1) });
  }

  // Add new vote
  await updateDoc(doc(db, "candidates", candidateId), { votes: increment(1) });

  // Save user vote
  await setDoc(voteRef, { [`${type}Vote`]: candidateId }, { merge: true });

  alert("Vote recorded successfully!");
});

/* =========================
   WINNER CALCULATION
========================= */
async function getWinner(type) {
  const snap = await getDocs(collection(db, "candidates"));
  let winner = null;
  snap.forEach(docSnap => {
    const c = docSnap.data();
    if (c.type !== type) return;
    if (!winner || c.votes > winner.votes) winner = { ...c };
  });
  return winner;
}

/* =========================
   SHOW WINNERS
========================= */
async function showWinners() {
  const section = document.getElementById("winnersSection");
  if (!section) return;

  section.classList.remove("hidden");

  const vendorWinner = await getWinner("vendors");
  const starWinner = await getWinner("stars");

  document.getElementById("vendorWinner").innerHTML = `
    <h3>Vendor of the Month</h3>
    <p>${vendorWinner ? vendorWinner.name : "No votes"}</p>
  `;

  document.getElementById("starWinner").innerHTML = `
    <h3>Star of the Month</h3>
    <p>${starWinner ? starWinner.name : "No votes"}</p>
  `;
}

/* =========================
   INIT
========================= */
loadCandidates();
