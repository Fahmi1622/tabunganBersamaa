import React, { useEffect, useState } from "react";
import { db, auth, provider } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [partnerId, setPartnerId] = useState(localStorage.getItem("partner") || "");
  const [inputPartner, setInputPartner] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("in");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!partnerId) return;

    const q = query(
      collection(db, "tabungan"),
      where("groupId", "==", partnerId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(data);
    });

    return () => unsub();
  }, [partnerId]);

  const buatPasangan = () => {
    const id = Math.random().toString(36).substring(2, 8);
    setPartnerId(id);
    localStorage.setItem("partner", id);
    alert("Kode pasangan kamu: " + id);
  };

  const joinPasangan = () => {
    setPartnerId(inputPartner);
    localStorage.setItem("partner", inputPartner);
  };

  const simpan = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return alert("Isi yang bener ya 😆");

    await addDoc(collection(db, "tabungan"), {
      amount: Number(amount),
      desc,
      type,
      user: user.displayName,
      groupId: partnerId,
      timestamp: serverTimestamp()
    });

    setAmount("");
    setDesc("");
  };

  const hapus = async (id) => {
    if (!window.confirm("Yakin hapus? 😢")) return;
    await deleteDoc(doc(db, "tabungan", id));
  };

  const saldo = transactions.reduce((acc, t) =>
    t.type === "in" ? acc + t.amount : acc - t.amount
  , 0);

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <h2>💖 Tabungan Kita 💖</h2>
        <button onClick={() => signInWithPopup(auth, provider)}>
          Login Google 💕
        </button>
      </div>
    );
  }

  if (!partnerId) {
    return (
      <div style={{ textAlign: "center", padding: 30 }}>
        <h2>Hai {user.displayName} 💕</h2>
        <button onClick={buatPasangan}>💖 Buat Tabungan Berdua</button>
        <div style={{ marginTop: 20 }}>
          <input
            placeholder="Masukkan kode pasangan"
            value={inputPartner}
            onChange={(e) => setInputPartner(e.target.value)}
          />
          <button onClick={joinPasangan}>💞 Join</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff0f5", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 400, margin: "auto" }}>
        <h3>💑 {user.displayName}</h3>
        <button onClick={() => signOut(auth)}>Logout</button>

        <div style={{
          background: "white",
          padding: 20,
          borderRadius: 20,
          marginTop: 20,
          textAlign: "center"
        }}>
          <h2>💰 Rp {saldo.toLocaleString("id-ID")}</h2>
          <p>Tabungan kalian berdua 💖</p>
        </div>

        <form onSubmit={simpan} style={{ marginTop: 20 }}>
          <input placeholder="Jumlah" value={amount} onChange={e => setAmount(e.target.value)} />
          <input placeholder="Untuk apa?" value={desc} onChange={e => setDesc(e.target.value)} />

          <div>
            <button type="button" onClick={() => setType("in")}>➕</button>
            <button type="button" onClick={() => setType("out")}>➖</button>
          </div>

          <button type="submit">Simpan 💕</button>
        </form>

        {transactions.map(t => (
          <div key={t.id} style={{
            background: "white",
            padding: 10,
            borderRadius: 15,
            marginTop: 10
          }}>
            {t.desc} - {t.amount} <br />
            <small>{t.user}</small>
            <button onClick={() => hapus(t.id)}>❌</button>
          </div>
        ))}
      </div>
    </div>
  );
}
