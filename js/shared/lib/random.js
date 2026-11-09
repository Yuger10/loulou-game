function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function shuffle(arr){ return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]); }
