const BASE_URL = "https://agentpioupiou.github.io/momo";

/* ===== UTILS ===== */
function generateCode(){
  return Math.floor(100000 + Math.random() * 900000).toString();
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

/* ===== CREATE ===== */
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

/* ===== JOIN ===== */
window.joinRoom = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = document.getElementById("code").value;

  if(!pseudo) return;

  setPseudo(pseudo);

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists){
    alert("Room introuvable");
    return;
  }

  let players = doc.data().players || [];

  if(!players.includes(pseudo)){
    players.push(pseudo);
  }

  await ref.update({ players });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

/* ===== ROOM ===== */
if(window.location.pathname.includes("room.html")){

  const code = getCode();
  const pseudo = getPseudo();
  const ref = db.collection("rooms").doc(code);

  ref.onSnapshot(doc => {

    if(!doc.exists){
      window.location.href = BASE_URL;
      return;
    }

    const data = doc.data();
    const players = data.players || [];

    // si on n'est plus dans la room → sortie silencieuse
    if(!players.includes(pseudo)){
      window.location.href = BASE_URL;
      return;
    }

    document.getElementById("roomCode").innerText = code;

    document.getElementById("players").innerHTML =
      players.map(p => `
        <div class="player">
          ${p} ${p === data.host ? "👑" : ""}
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

/* ===== LEAVE ===== */
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

  // dernier joueur → delete
  if(players.length === 0){
    await ref.delete();
    window.location.href = BASE_URL;
    return;
  }

  // host quitte
  if(data.host === pseudo){
    await ref.update({
      host: players[0],
      players
    });

    window.location.href = BASE_URL;
    return;
  }

  await ref.update({ players });

  window.location.href = BASE_URL;
};

/* ===== JOIN QR ===== */
window.joinFromQR = async () => {
  const pseudo = document.getElementById("pseudo").value;
  const code = getCode();

  setPseudo(pseudo);

  const ref = db.collection("rooms").doc(code);
  const doc = await ref.get();

  if(!doc.exists){
    window.location.href = BASE_URL;
    return;
  }

  let players = doc.data().players || [];
  players.push(pseudo);

  await ref.update({ players });

  window.location.href = `${BASE_URL}/room.html?code=${code}`;
};

/* ===== QR SCAN ===== */
window.startQRScan = async () => {

  const video = document.getElementById("camera");
  video.style.display = "block";

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  video.srcObject = stream;
  video.play();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const scan = () => {
    if(video.readyState === video.HAVE_ENOUGH_DATA){

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if(code){
        stream.getTracks().forEach(t => t.stop());
        window.location.href = code.data;
        return;
      }
    }

    requestAnimationFrame(scan);
  };

  scan();
};
