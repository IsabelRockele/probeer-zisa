/* Percentages berekenen: verhoudingstappen en lange breukstreep. */
const Percentages = (() => {
  const kies = a => a[Math.floor(Math.random() * a.length)];
  const gcd = (a,b) => b ? gcd(b,a%b) : a;
  const procenten = [3,4,5,6,7,8,9,10,12,15,20,25,30,35,40,45,50,60,70,75,80,90];

  function maakEen(variant='stappen'){
    const procent=kies(procenten);
    const stapNoemer=procent%10===0?10:100;
    const stapTeller=procent%10===0?procent/10:procent;
    const vereenvoudig=gcd(procent,100);
    const vereenvoudigdN=procent/vereenvoudig,vereenvoudigdD=100/vereenvoudig;
    const basis=variant==='stappen'?stapNoemer:vereenvoudigdD;
    const factor=2+Math.floor(Math.random()*18);
    const geheel=basis*factor;
    const antwoord=geheel*procent/100;
    return {
      sleutel:`${variant}-${procent}-${geheel}`,type:'percentage',variant,
      procent,geheel,antwoord,stapTeller,stapNoemer,
      vereenvoudigdN,vereenvoudigdD,
      eenProcent:geheel/100,
      eenBreukdeel:geheel/stapNoemer
    };
  }

  function genereer(config={}){
    const aantal=config.aantalOefeningen||4,variant=config.variant||'stappen';
    const uit=[],gezien=new Set();
    for(let i=0;i<aantal*50&&uit.length<aantal;i++){
      const oef=maakEen(variant);
      if(!gezien.has(oef.sleutel)){gezien.add(oef.sleutel);uit.push(oef);}
    }
    return uit;
  }
  return {genereer};
})();
