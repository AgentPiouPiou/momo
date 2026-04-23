const BASE_URL = "https://agentpioupiou.github.io/momo";

function generateCode(){
  return Math.random().toString(36).substring(2,10).toUpperCase();
}

function getCode(){
  return new URLSearchParams(window.location.search).get("code");
}

function getPseudo(){
  return localStorage.getItem("pseudo");
}

function setPseudo(p){
  localStorage.setItem("pseudo", p);
}

function notify(msg){
  alert(msg);
}

/* ================= CREATE ================= */
window.createRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;
  if(!pseudo) return;

  setPseudo(pseudo);

  const code = generateCode();

  await db.collection("rooms").doc(code).set({
    host: pseudo,
    players: [pseudo]
  });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

/* ================= JOIN ================= */
window.joinRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = document.getElementById("code").value;

  if(!pseudo) return;

  setPseudo(pseudo);

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists) return;

  let players = doc.data().players || [];
  players.push(pseudo);

  await ref.update({ players });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

/* ================= ROOM ================= */
if(window.location.pathname.includes("room.html")){

  const code = getCode();
  const pseudo = getPseudo();
  const ref = db.collection("rooms").doc(code);

  ref.onSnapshot(async doc => {

    if(!doc.exists){
      notify("Room supprimée");
      window.location.href = BASE_URL;
      return;
    }

    const data = doc.data();
    const isHost = data.host === pseudo;

    document.getElementById("deleteBtn").style.display = isHost ? "flex" : "none";

    document.getElementById("roomCode").innerText = "CODE : " + code;

    const players = data.players || [];

    document.getElementById("players").innerHTML =
      players.map(p => `
        <div class="player">
          ${p}
          ${p === data.host ? `<svg class="crown" viewBox="0 0 24 24"><path fill="#f1c40f" d="M3 17l2-9 5 6 5-6 2 9H3z"/></svg>` : ""}
        </div>
      `).join("");

    // QR
    const url = `${BASE_URL}/login.html?code=${code}`;
    const qrDiv = document.getElementById("qr");
    qrDiv.innerHTML = "";
    QRCode.toCanvas(document.createElement("canvas"), url, (e,c)=>{
      qrDiv.appendChild(c);
    });
  });
}

/* ================= DELETE ROOM ================= */
window.deleteRoom = async () => {
  const code = getCode();

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  const players = doc.data().players || [];

  await ref.delete();

  players.forEach(() => notify("Room supprimée par l'hôte"));

  window.location.href = BASE_URL;
};

/* ================= LEAVE ================= */
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
  let players = data.players.filter(p => p !== pseudo);

  // host leave → transfer obligatoire
  if(data.host === pseudo){

    if(players.length === 0){
      await ref.delete();
      window.location.href = BASE_URL;
      return;
    }

    document.getElementById("hostModal").style.display = "flex";

    const select = document.getElementById("hostSelect");
    select.innerHTML = players.map(p => `<option>${p}</option>`).join("");

    window.pendingPlayers = players;
    return;
  }

  await ref.update({ players });

  window.location.href = BASE_URL;
};

/* ================= NEW HOST ================= */
window.confirmNewHost = async () => {
  const code = getCode();
  const newHost = document.getElementById("hostSelect").value;

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists) return;

  let data = doc.data();

  let players = data.players.filter(p => p !== getPseudo());

  await ref.update({
    host: newHost,
    players
  });

  window.location.href = BASE_URL;
};

/* ================= LOGIN ================= */
window.joinFromQR = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = getCode();

  setPseudo(pseudo);

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists){
    notify("Room supprimée");
    window.location.href = BASE_URL;
    return;
  }

  let players = doc.data().players || [];
  players.push(pseudo);

  await ref.update({ players });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};
