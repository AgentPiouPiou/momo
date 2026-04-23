// 🔑 utils
function generateCode(){
  return Math.random().toString(36).substring(2,10).toUpperCase();
}

function getCode(){
  return window.location.pathname.split("/").pop();
}

// ❌ erreur
function error(msg){
  const el = document.getElementById("error");
  if(el) el.innerText = msg;
  console.log(msg);
}

// ======================
// 🏠 CREATE ROOM
// ======================
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

  window.location.href = code;
};

// ======================
// 🚪 JOIN ROOM
// ======================
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

  window.location.href = code;
};

// ======================
// 🎮 ROOM PAGE
// ======================
if(window.location.pathname.length > 2 && !window.location.pathname.includes("login")){

  const code = getCode();

  document.getElementById("roomCode").innerText = "Room : " + code;

  const ref = db.collection("rooms").doc(code);

  // live players
  ref.onSnapshot(doc => {
    const data = doc.data();
    const players = data.players || [];

    document.getElementById("players").innerHTML =
      players.map(p => `<div>${p}</div>`).join("");

    // QR CODE
    const loginURL = `https://agentpioupiou.github.io/momo/${code}/login`;

    const qrDiv = document.getElementById("qr");
    qrDiv.innerHTML = "";

    QRCode.toCanvas(document.createElement("canvas"), loginURL, function (err, canvas) {
      qrDiv.appendChild(canvas);
    });
  });
}

// ======================
// 📱 LOGIN QR PAGE
// ======================
window.joinFromQR = async () => {
  const pseudo = document.getElementById("pseudo").value;

  if(!pseudo){
    error("Pseudo requis");
    return;
  }

  const code = window.location.pathname.split("/")[2];

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists){
    error("Room inexistante");
    return;
  }

  let players = doc.data().players || [];
  players.push(pseudo);

  await ref.update({ players });

  window.location.href = `https://agentpioupiou.github.io/momo/${code}`;
};
