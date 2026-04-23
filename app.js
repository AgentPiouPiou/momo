const baseURL = "https://agentpioupiou.github.io/momo";

function generateCode(){
  return Math.random().toString(36).substring(2,10).toUpperCase();
}

function getCode(){
  return new URLSearchParams(window.location.search).get("code");
}

function error(msg){
  const el = document.getElementById("error");
  if(el) el.innerText = msg;
  console.log(msg);
}

/* =========================
   🏠 CREATE ROOM
========================= */
window.createRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;

  if(!pseudo){
    error("Pseudo requis");
    return;
  }

  const code = generateCode();

  await db.collection("rooms").doc(code).set({
    players: [pseudo]
  });

  // 🔥 REDIRECTION PROPRE GITHUB PAGES
  window.location.href = `${baseURL}/room.html?code=${code}`;
};

/* =========================
   🚪 JOIN ROOM
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

  // 🔥 REDIRECTION
  window.location.href = `${baseURL}/room.html?code=${code}`;
};

/* =========================
   🎮 ROOM PAGE
========================= */
if(window.location.pathname.includes("room.html")){

  const code = getCode();

  document.getElementById("roomCode").innerText = "Room : " + code;

  const ref = db.collection("rooms").doc(code);

  ref.onSnapshot(doc => {
    const data = doc.data();
    const players = data.players || [];

    document.getElementById("players").innerHTML =
      players.map(p => `<div>${p}</div>`).join("");

    // 📱 QR CODE vers login
    const loginURL = `${baseURL}/login.html?code=${code}`;

    const qrDiv = document.getElementById("qr");
    qrDiv.innerHTML = "";

    QRCode.toCanvas(document.createElement("canvas"), loginURL, (err, canvas) => {
      qrDiv.appendChild(canvas);
    });
  });
}

/* =========================
   📱 LOGIN PAGE
========================= */
window.joinFromQR = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = getCode();

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

  // 🔥 retour room
  window.location.href = `${baseURL}/room.html?code=${code}`;
};
