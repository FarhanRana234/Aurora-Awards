import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   GLOBALS
========================= */
const VOTING_END = new Date("2026-01-15T23:59:59");
const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
localStorage.setItem("deviceId", deviceId);

const countdownEl = document.getElementById("countdown");
let candidates = { vendors: [], stars: [] };

/* =========================
   COUNTDOWN
========================= */
function updateCountdown() {
  if (!countdownEl) return;

  const now = new Date();
  const diff = VOTING_END - now;

  if (diff <= 0) {
    countdownEl.textContent = "Voting Closed";
    document.body.classList.add("voting-ended");
    lockVoting();
    showWinners();
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
   LOAD CANDIDATES FROM JSON
========================= */
async function loadCandidatesJSON() {
  const res = await fetch("js/candidates.json");
  const data = await res.json();
  candidates.vendors = data.vendors;
  candidates.stars = data.stars;
  renderCandidates("vendors");
  renderCandidates("stars");
  setupVotesListener("vendors");
  setupVotesListener("stars");
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
      <p id="votes-${c.id}">Votes: 0</p>
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
  const userVote = await getDoc(voteRef);

  let prevVote = null;
  if (userVote.exists()) prevVote = userVote.data()[`${type}Vote`];

  // Remove previous vote if exists
  if (prevVote && prevVote !== candidateId) {
    await updateDoc(doc(db, type, prevVote), { votes: increment(-1) });
  }

  // Add new vote
  await updateDoc(doc(db, type, candidateId), { votes: increment(1) });

  // Save user vote
  await setDoc(voteRef, { [`${type}Vote`]: candidateId }, { merge: true });

  alert("Vote recorded successfully!");
});

/* =========================
   LISTEN FOR VOTES CHANGES
========================= */
function setupVotesListener(type) {
  candidates[type].forEach(c => {
    const candidateDoc = doc(db, type, c.id);
    onSnapshot(candidateDoc, snapshot => {
      const votes = snapshot.data()?.votes || 0;
      const votesEl = document.getElementById(`votes-${c.id}`);
      if (votesEl) votesEl.textContent = `Votes: ${votes}`;
    });
  });
}

/* =========================
   LOCK VOTING
========================= */
function lockVoting() {
  document.querySelectorAll(".vote-btn").forEach(btn => {
    btn.disabled = true;
    btn.textContent = "Closed";
  });
  document.getElementById("votingClosed")?.classList.remove("hidden");
}

/* =========================
   WINNER CALCULATION
========================= */
async function getWinner(type) {
  const snap = await getDocs(collection(db, type));
  let winner = null;

  snap.forEach(docSnap => {
    const c = docSnap.data();
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

// =========================
// INIT
// =========================
loadCandidatesJSON();
