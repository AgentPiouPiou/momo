const BASE_URL = "https://agentpioupiou.github.io/momo";

let avatarBase64 = null;

// --------------------
// CAMERA PREVIEW
// --------------------
const input = document.getElementById("avatarInput");

if(input){
  input.addEventListener("change", function(){
    const file = this.files[0];
    const reader = new FileReader();

    reader.onload = function(e){
      avatarBase64 = e.target.result;

      const img = document.getElementById("preview");
      img.src = avatarBase64;
      img.style.display = "block";
    };

    reader.readAsDataURL(file);
  });
}

// --------------------
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

// --------------------
// CREATE ROOM
// --------------------
window.createRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;

  if(!pseudo){
    error("Pseudo requis");
    return;
  }

  if(!avatarBase64){
    error("Photo obligatoire");
    return;
  }

  const code = generateCode();

  await db.collection("rooms").doc(code).set({
    players: [{
      name: pseudo,
      avatar: avatarBase64
    }]
  });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

// --------------------
// JOIN ROOM
// --------------------
window.joinRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = document.getElementById("code").value;

  if(!pseudo){
    error("Pseudo requis");
    return;
  }

  if(!avatarBase64){
    error("Photo obligatoire");
    return;
  }

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists){
    error("Room inexistante");
    return;
  }

  let players = doc.data().players || [];

  players.push({
    name: pseudo,
    avatar: avatarBase64
  });

  await ref.update({ players });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

// --------------------
// ROOM PAGE
// --------------------
if(window.location.pathname.includes("room.html")){

  const code = getCode();

  document.getElementById("roomCode").innerText = "Room : " + code;

  const ref = db.collection("rooms").doc(code);

  ref.onSnapshot(doc => {
    const data = doc.data();
    const players = data.players || [];

    document.getElementById("players").innerHTML =
      players.map(p => `
        <div class="player">
          <img class="avatar" src="${p.avatar}">
          <div>${p.name}</div>
        </div>
      `).join("");

    const loginURL = `${BASE_URL}/login.html?code=${code}`;

    const qrDiv = document.getElementById("qr");
    qrDiv.innerHTML = "";

    QRCode.toCanvas(document.createElement("canvas"), loginURL, (err, canvas) => {
      qrDiv.appendChild(canvas);
    });
  });
}

// --------------------
// LOGIN PAGE
// --------------------
window.joinFromQR = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = getCode();

  if(!pseudo){
    error("Pseudo requis");
    return;
  }

  if(!avatarBase64){
    error("Photo obligatoire");
    return;
  }

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists){
    error("Room inexistante");
    return;
  }

  let players = doc.data().players || [];

  players.push({
    name: pseudo,
    avatar: avatarBase64
  });

  await ref.update({ players });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};
