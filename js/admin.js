// js/admin.js
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  increment,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const adminCandidateList = document.getElementById("adminCandidateList");
const resetVotesBtn = document.getElementById("resetVotes");
const endVotingBtn = document.getElementById("endVoting"); // optional
const candidatesJSON = "js/candidates.json"; // path to your JSON file

/* ===============================
   LOAD CANDIDATES JSON
=============================== */
async function loadCandidatesJSON() {
  const res = await fetch(candidatesJSON);
  const data = await res.json();
  return [...data.vendors, ...data.stars]; // combine both
}

/* ===============================
   RENDER CANDIDATES
=============================== */
async function renderCandidates() {
  adminCandidateList.innerHTML = ""; // clear list
  const candidates = await loadCandidatesJSON();

  for (const candidate of candidates) {
    const docRef = doc(db, "candidates", candidate.id);
    const docSnap = await getDoc(docRef);

    let votes = 0;
    if (docSnap.exists()) {
      votes = docSnap.data().votes || 0;
    } else {
      await setDoc(docRef, { votes: 0 }, { merge: true });
      votes = 0;
    }

    const candidateCard = document.createElement("div");
    candidateCard.className = "admin-candidate-card";
    candidateCard.innerHTML = `
      <img src="${candidate.image}" alt="${candidate.name}" />
      <h3>${candidate.name}</h3>
      <p>Votes: <span class="vote-count">${votes}</span></p>
      <div class="vote-buttons">
        <button class="add-vote">+1</button>
        <button class="remove-vote">-1</button>
      </div>
    `;

    // +1 vote
    candidateCard.querySelector(".add-vote").addEventListener("click", async () => {
      await updateDoc(docRef, { votes: increment(1) });
      renderCandidates(); // refresh UI
    });

    // -1 vote
    candidateCard.querySelector(".remove-vote").addEventListener("click", async () => {
      await updateDoc(docRef, { votes: increment(-1) });
      renderCandidates(); // refresh UI
    });

    adminCandidateList.appendChild(candidateCard);
  }
}

/* ===============================
   RESET ALL VOTES
=============================== */
resetVotesBtn.addEventListener("click", async () => {
  const confirmReset = confirm("Are you sure you want to reset all votes?");
  if (!confirmReset) return;

  const candidates = await loadCandidatesJSON();
  for (const candidate of candidates) {
    await setDoc(doc(db, "candidates", candidate.id), { votes: 0 }, { merge: true });
  }
  renderCandidates();
});

/* ===============================
   END VOTING (OPTIONAL)
=============================== */
endVotingBtn.addEventListener("click", () => {
  alert("Voting ended! You can implement additional logic here.");
});

/* ===============================
   INITIAL LOAD
=============================== */
renderCandidates();
