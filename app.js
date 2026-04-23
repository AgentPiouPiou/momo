const BASE_URL = "https://agentpioupiou.github.io/momo";

function generateCode(){
  return Math.random().toString(36).substring(2,10).toUpperCase();
}

function getCode(){
  return new URLSearchParams(window.location.search).get("code");
}

function error(msg){
  const el = document.getElementById("error");
  if(el) el.innerText = msg;
}

/* =========================
   CREATE ROOM
========================= */
window.createRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;

  if(!pseudo){
    error("Pseudo requis");
    return;
  }

  const code = generateCode();

  await db.collection("rooms").doc(code).set({
    host: pseudo,
    players: [pseudo]
  });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

/* =========================
   JOIN ROOM
========================= */
window.joinRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = document.getElementById("code").value;

  if(!pseudo){
    error("Pseudo requis");
    return;
  }

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists){
    error("Room inexistante");
    return;
  }

  let players = doc.data().players || [];
  players.push(pseudo);

  await ref.update({ players });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

/* =========================
   ROOM
========================= */
if(window.location.pathname.includes("room.html")){

  const code = getCode();
  const pseudo = prompt("Ton pseudo ?");
  const ref = db.collection("rooms").doc(code);

  ref.onSnapshot(doc => {

    if(!doc.exists){
      alert("Room supprimée");
      window.location.href = BASE_URL;
      return;
    }

    const data = doc.data();
    const isHost = data.host === pseudo;

    document.getElementById("deleteBtn").style.display = isHost ? "flex" : "none";

    document.getElementById("roomCode").innerText = "Code : " + code;

    document.getElementById("players").innerHTML =
      (data.players || []).map(p => `
        <div class="player">
          ${p}
          ${p === data.host ? `
            <svg class="crown" viewBox="0 0 24 24">
              <path fill="#f1c40f" d="M3 17l2-9 5 6 5-6 2 9H3z"/>
            </svg>
          ` : ""}
        </div>
      `).join("");

    const loginURL = `${BASE_URL}/login.html?code=${code}`;

    const qrDiv = document.getElementById("qr");
    qrDiv.innerHTML = "";

    QRCode.toCanvas(document.createElement("canvas"), loginURL, (e, canvas) => {
      qrDiv.appendChild(canvas);
    });
  });
}

/* =========================
   DELETE ROOM
========================= */
window.deleteRoom = async () => {
  const code = getCode();

  await db.collection("rooms").doc(code).delete();

  alert("Room supprimée");
  window.location.href = BASE_URL;
};

/* =========================
   LEAVE
========================= */
window.leaveRoom = async () => {
  window.location.href = BASE_URL;
};

/* =========================
   LOGIN
========================= */
window.joinFromQR = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = getCode();

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists){
    alert("Room supprimée");
    window.location.href = BASE_URL;
    return;
  }

  let players = doc.data().players || [];
  players.push(pseudo);

  await ref.update({ players });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};
