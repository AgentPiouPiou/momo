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

function error(msg){
  const el = document.getElementById("error");
  if(el) el.innerText = msg;
}

/* =========================
   CREATE ROOM
========================= */
window.createRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;
  if(!pseudo) return error("Pseudo requis");

  setPseudo(pseudo);

  const code = generateCode();

  await db.collection("rooms").doc(code).set({
    host: pseudo,
    players: [pseudo]
  });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

/* =========================
   JOIN ROOM (SAFE)
========================= */
window.joinRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = document.getElementById("code").value;

  if(!pseudo) return error("Pseudo requis");

  setPseudo(pseudo);

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists) return error("Room inexistante");

  let players = doc.data().players || [];

  if(!players.includes(pseudo)){
    players.push(pseudo);
  }

  await ref.update({ players });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

/* =========================
   ROOM LIVE
========================= */
if(window.location.pathname.includes("room.html")){

  const code = getCode();
  const pseudo = getPseudo();
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

    document.getElementById("roomCode").innerText = "CODE : " + code;

    const players = data.players || [];

    document.getElementById("players").innerHTML =
      players.map(p => `
        <div class="player">
          ${p}
          ${p === data.host ? "👑" : ""}
        </div>
      `).join("");

    const url = `${BASE_URL}/login.html?code=${code}`;
    const qrDiv = document.getElementById("qr");
    qrDiv.innerHTML = "";

    QRCode.toCanvas(document.createElement("canvas"), url, (e,c)=>{
      qrDiv.appendChild(c);
    });
  });
}

/* =========================
   DELETE ROOM (HOST)
========================= */
window.deleteRoom = async () => {
  const code = getCode();

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  const players = doc.data().players || [];

  await ref.delete();

  players.forEach(() => {
    alert("Room supprimée par l'hôte");
  });

  window.location.href = BASE_URL;
};

/* =========================
   LEAVE ROOM (FIX HOST TRANSFER)
========================= */
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
  let players = (data.players || []).filter(p => p !== pseudo);

  // HOST LEAVE → transfert automatique
  if(data.host === pseudo){

    if(players.length === 0){
      await ref.delete();
      window.location.href = BASE_URL;
      return;
    }

    const newHost = players[0];

    await ref.update({
      host: newHost,
      players
    });

    window.location.href = BASE_URL;
    return;
  }

  await ref.update({ players });

  window.location.href = BASE_URL;
};

/* =========================
   LOGIN QR
========================= */
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
