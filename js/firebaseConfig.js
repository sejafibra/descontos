// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC95aDwbm43uv7UPB7YDT5VjCe5USz2mZ8",
  authDomain: "descontos-4ab4b.firebaseapp.com",
  projectId: "descontos-4ab4b",
  storageBucket: "descontos-4ab4b.appspot.com",
  messagingSenderId: "907559767912",
  appId: "1:907559767912:web:d9974a77e46a5ef08ed0dd"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Referências globais
const auth = firebase.auth();
const db = firebase.firestore();
