// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBn6QMgzKYf4CsyMvXWl7IykmBlN_EJoN0",
  authDomain: "jeu-multijoueur-3cdc7.firebaseapp.com",
  projectId: "jeu-multijoueur-3cdc7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🔑 utils
function generateCode(){
  return Math.random().toString(36).substring(2,10).toUpperCase();
}

function showError(msg){
  const el = document.getElementById("error");
  if(el) el.innerText = msg;
  console.error(msg);
}

// =====================
// ACCUEIL
// =====================

if(location.pathname.includes("index.html") || location.pathname === "/"){

  window.createRoom = async () => {
    try {
      const pseudo = document.getElementById("pseudo").value;

      if(!pseudo){
        showError("Entre un pseudo");
        return;
      }

      const code = generateCode();

      console.log("Création room:", code);

      await db.collection("rooms").doc(code).set({
        players: [pseudo]
      });

      location.href = "room.html?code=" + code;

    } catch (e) {
      showError("Erreur createRoom: " + e.message);
    }
  };

  window.joinRoom = async () => {
    try {
      const pseudo = document.getElementById("pseudo").value;
      const code = document.getElementById("code").value;

      if(!pseudo){
        showError("Entre un pseudo");
        return;
      }

      if(!code){
        showError("Entre un code");
        return;
      }

      const ref = db.collection("rooms").doc(code);
      const doc = await ref.get();

      if(!doc.exists){
        showError("Room inexistante");
        return;
      }

      let players = doc.data().players;
      players.push(pseudo);

      await ref.update({ players });

      location.href = "room.html?code=" + code;

    } catch (e) {
      showError("Erreur joinRoom: " + e.message);
    }
  };
}

// =====================
// ROOM
// =====================

if(location.pathname.includes("room.html")){

  const code = new URLSearchParams(location.search).get("code");

  document.getElementById("roomCode").innerText = "Room : " + code;

  const ref = db.collection("rooms").doc(code);

  ref.onSnapshot(doc => {

    if(!doc.exists){
      showError("Room introuvable");
      return;
    }

    const players = doc.data().players || [];

    console.log("Players:", players);

    const div = document.getElementById("players");
    div.innerHTML = "";

    players.forEach(p => {
      div.innerHTML += `<div>${p}</div>`;
    });

  }, err => {
    showError("Firestore error: " + err.message);
  });
}
