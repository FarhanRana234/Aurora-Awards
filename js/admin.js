// js/admin.js
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const adminCandidateList = document.getElementById("adminCandidateList");
const resetVotesBtn = document.getElementById("resetVotes");
const endVotingBtn = document.getElementById("endVoting"); // optional

/* =========================
   LOAD AND RENDER CANDIDATES
========================= */
async function loadAndRenderCandidates() {
  const candidatesSnap = await getDocs(collection(db, "candidates"));
  adminCandidateList.innerHTML = "";

  candidatesSnap.forEach(docSnap => {
    const candidate = docSnap.data();
    const candidateCard = document.createElement("div");
    candidateCard.className = "admin-candidate-card";

    candidateCard.innerHTML = `
      <img src="${candidate.image}" alt="${candidate.name}" />
      <h3>${candidate.name}</h3>
      <p>Votes: <span class="vote-count" id="vote-${candidate.id}">${candidate.votes || 0}</span></p>
      <div class="vote-buttons">
        <button class="add-vote">+1</button>
        <button class="remove-vote">-1</button>
      </div>
    `;

    // +1 vote
    candidateCard.querySelector(".add-vote").addEventListener("click", async () => {
      await updateDoc(doc(db, "candidates", candidate.id), { votes: increment(1) });
    });

    // -1 vote
    candidateCard.querySelector(".remove-vote").addEventListener("click", async () => {
      await updateDoc(doc(db, "candidates", candidate.id), { votes: increment(-1) });
    });

    // Real-time vote count listener
    onSnapshot(doc(db, "candidates", candidate.id), snapshot => {
      const votesEl = document.getElementById(`vote-${candidate.id}`);
      if (votesEl) votesEl.textContent = snapshot.data()?.votes || 0;
    });

    adminCandidateList.appendChild(candidateCard);
  });
}

/* =========================
   RESET ALL VOTES
========================= */
resetVotesBtn.addEventListener("click", async () => {
  const confirmReset = confirm("Are you sure you want to reset all votes?");
  if (!confirmReset) return;

  const candidatesSnap = await getDocs(collection(db, "candidates"));
  for (const candidateDoc of candidatesSnap.docs) {
    await updateDoc(doc(db, "candidates", candidateDoc.id), { votes: 0 });
  }

  // Clear all device votes
  const votesSnap = await getDocs(collection(db, "votes"));
  for (const voteDoc of votesSnap.docs) {
    await setDoc(doc(db, "votes", voteDoc.id), {}, { merge: true });
  }
});

/* =========================
   END VOTING (OPTIONAL)
========================= */
endVotingBtn.addEventListener("click", () => {
  alert("Voting ended! You can implement additional logic here.");
});

/* =========================
   INIT
========================= */
loadAndRenderCandidates();
