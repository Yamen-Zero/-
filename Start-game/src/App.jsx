import { useState, useEffect, useRef } from "react"; import { motion } from "framer-motion";

// 🔥 Firebase import { initializeApp } from "firebase/app"; import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";

const firebaseConfig = { apiKey: "YOUR_KEY", authDomain: "YOUR_DOMAIN", projectId: "YOUR_PROJECT_ID", };

const app = initializeApp(firebaseConfig); const db = getFirestore(app);

// 🔊 sounds const SFX = { click: "/sounds/click.mp3", correct: "/sounds/correct.mp3", wrong: "/sounds/wrong.mp3", win: "/sounds/win.mp3" };

// 🧠 questions const questions = { 1: [ { q: "5 + 3 = ?", options: [6,7,8,9], answer: 8 }, { q: "2 + 2 = ?", options: [3,4,5,6], answer: 4 } ], 2: [ { q: "10 - 3 = ?", options: [5,6,7,8], answer: 7 }, { q: "6 × 2 = ?", options: [10,11,12,13], answer: 12 } ], 3: [ { q: "12 ÷ 3 = ?", options: [2,3,4,5], answer: 4 }, { q: "15 + 5 = ?", options: [18,19,20,21], answer: 20 } ] };

export default function Game() { const [screen, setScreen] = useState("start"); const [name, setName] = useState(""); const [level, setLevel] = useState(1); const [qIndex, setQIndex] = useState(0); const [score, setScore] = useState(0); const [unlocked, setUnlocked] = useState({2:false,3:false}); const [time, setTime] = useState(10); const [leaderboard, setLeaderboard] = useState([]);

const audio = useRef({});

useEffect(()=>{ Object.keys(SFX).forEach(k=> audio.current[k] = new Audio(SFX[k])); loadLeaderboard(); },[]);

const play = (k)=>{ const a = audio.current[k]; if(a){ a.currentTime=0; a.play(); } };

// ☁️ تحميل لوحة الشرف من Firebase const loadLeaderboard = async () => { const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(5)); const snapshot = await getDocs(q);

let data = [];
snapshot.forEach(doc => data.push(doc.data()));

setLeaderboard(data);

};

const startLevel = (lvl) => { play("click"); setLevel(lvl); setQIndex(0); setScore(0); setTime(10); setScreen("game"); };

useEffect(()=>{ if(screen !== "game") return; if(time === 0){ next(); return; } const t = setTimeout(()=> setTime(time-1), 1000); return ()=> clearTimeout(t); },[time, screen]);

const next = ()=>{ if(qIndex + 1 < questions[level].length){ setQIndex(qIndex+1); setTime(10); } else { finishLevel(); } };

const answer = (opt) => { if(opt === questions[level][qIndex].answer){ setScore(s=>s+1); play("correct"); } else { play("wrong"); } next(); };

// ☁️ حفظ في Firebase const saveLeaderboard = async (entry)=>{ await addDoc(collection(db, "leaderboard"), entry); loadLeaderboard(); };

const finishLevel = () => { let percentage = Math.round((score / questions[level].length) * 100);

if(level === 1 && percentage >= 70){
  setUnlocked(u=>({...u,2:true}));
}
if(level === 2 && percentage >= 75){
  setUnlocked(u=>({...u,3:true}));
}

saveLeaderboard({ name, score: percentage });
if(percentage >= 70) play("win");
setScreen("result");

};

if(screen === "start"){ return ( <div className="p-10 text-center"> <h1 className="text-3xl">🎮 تحدي نافس الذكي</h1> <input className="mt-4 p-2 border" placeholder="اسمك" value={name} onChange={e=>setName(e.target.value)} /> <button onClick={()=> name && setScreen("menu")} className="mt-5 p-3 bg-blue-500 text-white">ابدأ</button> </div> ); }

if(screen === "menu"){ return ( <div className="p-10 text-center"> <h2>📚 اختر المستوى</h2> <button onClick={()=>startLevel(1)} className="block m-2 p-3 bg-green-500 text-white">المستوى 1</button> <button disabled={!unlocked[2]} onClick={()=>startLevel(2)} className="block m-2 p-3 bg-yellow-500 text-white">المستوى 2</button> <button disabled={!unlocked[3]} onClick={()=>startLevel(3)} className="block m-2 p-3 bg-red-500 text-white">المستوى 3</button>

<button onClick={()=>{loadLeaderboard(); setScreen("leaderboard");}} className="mt-5 p-3 bg-purple-500 text-white">🏆 لوحة الشرف</button>
  </div>
);

}

if(screen === "game"){ let q = questions[level][qIndex]; return ( <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-10 text-center"> <h3>⏱ {time}</h3> <h2>السؤال {qIndex+1}</h2> <p className="text-xl">{q.q}</p> {q.options.map((o,i)=>( <button key={i} onClick={()=>answer(o)} className="block m-2 p-3 bg-gray-200"> {o} </button> ))} </motion.div> ); }

if(screen === "leaderboard"){ return ( <div className="p-10 text-center"> <h2>🏆 لوحة الشرف (أونلاين)</h2> {leaderboard.map((p,i)=>( <p key={i}>{i+1}. {p.name} - {p.score}%</p> ))} <button onClick={()=>setScreen("menu")} className="mt-5 p-3 bg-blue-500 text-white">رجوع</button> </div> ); }

if(screen === "result"){ let percentage = Math.round((score / questions[level].length) * 100); return ( <div className="p-10 text-center"> <h2>🎉 النتيجة</h2> <p>{percentage}%</p> <button onClick={()=>setScreen("menu")} className="mt-5 p-3 bg-blue-500 text-white">العودة</button> </div> ); } 