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

/* =====================
   PSEUDO MEMORY (FIX BUG PROMPT)
===================== */
function getPseudo(){
  return localStorage.getItem("pseudo");
}

function setPseudo(p){
  localStorage.setItem("pseudo", p);
}

/* =====================
   CREATE ROOM
===================== */
window.createRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;

  if(!pseudo){
    error("Pseudo requis");
    return;
  }

  setPseudo(pseudo);

  const code = generateCode();

  await db.collection("rooms").doc(code).set({
    host: pseudo,
    players: [pseudo]
  });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

/* =====================
   JOIN ROOM
===================== */
window.joinRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = document.getElementById("code").value;

  if(!pseudo){
    error("Pseudo requis");
    return;
  }

  setPseudo(pseudo);

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

/* =====================
   ROOM SYSTEM
===================== */
if(window.location.pathname.includes("room.html")){

  const code = getCode();
  const ref = db.collection("rooms").doc(code);

  const pseudo = getPseudo();

  ref.onSnapshot(async doc => {

    if(!doc.exists){
      alert("Room supprimée par l'hôte");
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
          ${p === data.host ? `<span>👑</span>` : ""}
        </div>
      `).join("");

    // QR
    const loginURL = `${BASE_URL}/login.html?code=${code}`;

    const qrDiv = document.getElementById("qr");
    qrDiv.innerHTML = "";

    QRCode.toCanvas(document.createElement("canvas"), loginURL, (e, canvas) => {
      qrDiv.appendChild(canvas);
    });
  });
}

/* =====================
   DELETE ROOM (HOST)
===================== */
window.deleteRoom = async () => {
  const code = getCode();

  await db.collection("rooms").doc(code).delete();

  alert("Room supprimée");
  window.location.href = BASE_URL;
};

/* =====================
   LEAVE ROOM (TRANSFER HOST + REMOVE PLAYER)
===================== */
window.leaveRoom = async () => {
  const code = getCode();
  const pseudo = getPseudo();

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists){
    window.location.href = BASE_URL;
    return;
  }

  let data = doc.data();
  let players = data.players || [];

  // retirer joueur
  players = players.filter(p => p !== pseudo);

  // si host quitte → transférer host
  if(data.host === pseudo){
    if(players.length > 0){
      data.host = players[0];
    } else {
      await ref.delete();
      window.location.href = BASE_URL;
      return;
    }
  }

  await ref.update({
    players,
    host: data.host
  });

  window.location.href = BASE_URL;
};

/* =====================
   LOGIN ROOM
===================== */
window.joinFromQR = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = getCode();

  setPseudo(pseudo);

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
