/* Breuken optellen en aftrekken: gelijknamig en ongelijknamig. */
const Breuken = (() => {
  const delers = [2, 3, 4, 5, 6, 8, 9, 10, 12];
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const lcm = (a, b) => a * b / gcd(a, b);
  const kies = a => a[Math.floor(Math.random() * a.length)];

  function maakEen(config) {
    const soort = config.soort || 'gelijknamig';
    const bewerking = config.bewerking === 'gemengd' ? kies(['optellen', 'aftrekken']) : (config.bewerking || 'optellen');
    const op = bewerking === 'aftrekken' ? '-' : '+';
    let n1, n2, d1, d2, doel;
    for (let poging = 0; poging < 80; poging++) {
      d1 = kies(delers);
      if (soort === 'gelijknamig') d2 = d1;
      else {
        d2 = kies(delers.filter(d => d !== d1 && (d % d1 === 0 || d1 % d === 0)));
        if (!d2) continue;
      }
      n1 = 1 + Math.floor(Math.random() * (d1 - 1));
      n2 = 1 + Math.floor(Math.random() * (d2 - 1));
      doel = lcm(d1, d2);
      const g1 = n1 * (doel / d1), g2 = n2 * (doel / d2);
      const resultaat = bewerking === 'optellen' ? g1 + g2 : g1 - g2;
      if (resultaat > 0 && resultaat < doel) break;
    }
    const g1 = n1 * (doel / d1), g2 = n2 * (doel / d2);
    const teller = bewerking === 'optellen' ? g1 + g2 : g1 - g2;
    return {
      sleutel: `${n1}/${d1}${op}${n2}/${d2}`,
      type: soort, bewerking, op, n1, d1, n2, d2, doel,
      factor1: doel / d1, factor2: doel / d2,
      g1, g2, teller, antwoord: `${teller}/${doel}`
    };
  }

  function genereer(config = {}) {
    if (config.soort === 'vermenigvuldigen') return genereerVermenigvuldigen(config);
    if (config.soort === 'gemengde-getallen') return genereerGemengde(config);
    const aantal = config.aantalOefeningen || 6;
    const uit = [], gezien = new Set();
    for (let i = 0; i < aantal * 30 && uit.length < aantal; i++) {
      const oef = maakEen(config);
      if (!gezien.has(oef.sleutel)) { gezien.add(oef.sleutel); uit.push(oef); }
    }
    return uit;
  }

  function vereenvoudig(n,d){
    const g=gcd(n,d),sn=n/g,sd=d/g,heel=Math.floor(sn/sd),rest=sn%sd;
    return {n:sn,d:sd,heel,rest,tekst:sd===1?String(sn):(heel?`${heel} ${rest}/${sd}`:`${sn}/${sd}`)};
  }

  function maakVermenigvuldiging(vorm,volgnummer=0){
    const noemers=[3,4,5,6,7,8,9,10,12];
    if(vorm==='gemengd-vermenigvuldigen'){
      vorm=['van-getal','getal-maal-breuk','breuk-maal-getal','breuk-maal-getal','getal-maal-breuk','van-getal'][volgnummer%6];
    }
    let d=kies(noemers),n=1+Math.floor(Math.random()*(d-1)),getal;
    if(vorm==='van-getal'||vorm==='breuk-maal-getal'){
      const factor=2+Math.floor(Math.random()*9);
      getal=d*factor;
      const antwoord=n*factor;
      return {type:'breuk-vermenigvuldigen',vorm,
        sleutel:`${vorm}-${n}/${d}-${getal}`,n,d,getal,antwoord:String(antwoord),antwoordN:antwoord,antwoordD:1,deel:getal/d};
    }
    const geheel=2+Math.floor(Math.random()*8),product=n*geheel,vereenvoudigd=vereenvoudig(product,d);
    return {type:'breuk-vermenigvuldigen',vorm:'getal-maal-breuk',sleutel:`${vorm}-${geheel}-${n}/${d}`,
      n,d,getal:geheel,product,antwoord:vereenvoudigd.tekst,antwoordN:vereenvoudigd.n,antwoordD:vereenvoudigd.d,
      heel:vereenvoudigd.heel,rest:vereenvoudigd.rest};
  }

  function maakVerbindpuzzel(){
    const groepen=[
      {doel:'12',sommen:[[3,5,20],[3,10,40]]},{doel:'15',sommen:[[5,9,27],[3,5,25]]},
      {doel:'18',sommen:[[3,4,24],[6,7,21]]},{doel:'21',sommen:[[3,5,35],[3,4,28]]},
      {doel:'28',sommen:[[4,5,35],[7,8,32]]},{doel:'3/4',sommen:[[3,8,2],[3,12,3]]},
      {doel:'1 1/2',sommen:[[3,4,2],[3,8,4]]},{doel:'2 1/4',sommen:[[3,8,6],[3,12,9]]}
    ].sort(()=>Math.random()-.5).slice(0,4);
    const items=[];
    groepen.forEach(g=>g.sommen.forEach(([n,d,getal],i)=>items.push({n,d,getal,antwoord:g.doel,kant:i===0?'links':'rechts'})));
    return {type:'breuk-vermenigvuldigen',vorm:'verbinden',sleutel:`verbinden-${groepen.map(g=>g.doel).sort().join('-')}`,doelen:groepen.map(g=>g.doel).sort(()=>Math.random()-.5),items};
  }

  const vraagstukContexten=[
    ['bibliotheek','boeken op een thematafel','boeken'],
    ['schooltuin','bloembollen in de perken','bloembollen'],
    ['sportclub','waterflessen voor een toernooi','waterflessen'],
    ['bakkerij','broodjes voor bestellingen','broodjes'],
    ['dierenasiel','zakjes dierenvoer in de voorraadkast','zakjes dierenvoer'],
    ['knutselatelier','gekleurde vellen papier','vellen papier'],
    ['fietsenwinkel','fietshelmen in het magazijn','fietshelmen'],
    ['jeugdbeweging','bekers voor het kamp','bekers'],
    ['muziekschool','muziekmappen in de kast','muziekmappen'],
    ['fruitwinkel','mandjes met peren','mandjes'],
    ['zwembad','drijfplankjes voor de zwemles','drijfplankjes'],
    ['museum','postkaarten in de museumwinkel','postkaarten'],
    ['boerderij','kisten met aardappelen','kisten'],
    ['theaterzaal','programmaboekjes voor de voorstelling','programmaboekjes'],
    ['speelgoedwinkel','dozen bouwstenen','dozen'],
    ['schoolfeest','stoelen voor de bezoekers','stoelen'],
    ['natuurcentrum','potjes zaad voor een workshop','potjes'],
    ['buurtfeest','lampionnen voor de versiering','lampionnen'],
    ['kookklas','kommen voor de kookles','kommen'],
    ['wetenschapsklas','proefbuisjes voor experimenten','proefbuisjes']
  ];

  function recenteVraagstukIds(){
    try{return JSON.parse(localStorage.getItem('rekenbundel-breukvraagstukken-recent')||'[]');}catch(e){return [];}
  }
  function onthoudVraagstukId(id){
    try{
      const nieuw=[id,...recenteVraagstukIds().filter(v=>v!==id)].slice(0,14);
      localStorage.setItem('rekenbundel-breukvraagstukken-recent',JSON.stringify(nieuw));
    }catch(e){}
  }
  function maakBreukVraagstuk(uitgesloten=new Set()){
    const recent=recenteVraagstukIds();
    let kandidaten=vraagstukContexten.map((_,i)=>i).filter(i=>!uitgesloten.has(i)&&!recent.includes(i));
    if(!kandidaten.length)kandidaten=vraagstukContexten.map((_,i)=>i).filter(i=>!uitgesloten.has(i));
    const id=kies(kandidaten.length?kandidaten:vraagstukContexten.map((_,i)=>i));
    onthoudVraagstukId(id);
    const [plaats,voorraad,eenheid]=vraagstukContexten[id];
    const d=kies([3,4,5,6,7,8,9,10]),n=kies(Array.from({length:d-1},(_,i)=>i+1).filter(v=>gcd(v,d)===1));
    const factor=4+Math.floor(Math.random()*12);
    const zoekGeheel=id%2===0;
    const geheel=d*factor,deel=n*factor;
    const naam=kies(['Noor','Milan','Amina','Lars','Ella','Yassin','Lina','Ruben']);
    const regels=zoekGeheel
      ? [`${naam} helpt in de ${plaats}.`,`Er zijn al ${deel} ${eenheid} klaargezet.`,`Dat is ${n}/${d} van alle ${voorraad} die nodig zijn.`]
      : [`In de ${plaats} zijn ${geheel} ${eenheid} klaargezet.`,`${n}/${d} daarvan wordt vandaag gebruikt.`,`De rest blijft bewaard voor later.`];
    const vraag=zoekGeheel
      ? `Hoeveel ${eenheid} zijn er in totaal nodig?`
      : `Hoeveel ${eenheid} worden vandaag gebruikt?`;
    const antwoord=zoekGeheel?geheel:deel;
    const antwoordzin=zoekGeheel
      ? `Er zijn in totaal ${antwoord} ${eenheid} nodig.`
      : `Vandaag worden ${antwoord} ${eenheid} gebruikt.`;
    return {type:'breuk-vermenigvuldigen',vorm:'vraagstuk',contextId:id,
      sleutel:`vraagstuk-${id}-${n}/${d}-${geheel}-${zoekGeheel?'geheel':'deel'}`,
      n,d,gegeven:zoekGeheel?deel:geheel,geheel,deelPerBreuk:factor,antwoord,
      zoekGeheel,regels,vraag,antwoordzin,eenheid};
  }

  function genereerVermenigvuldigen(config={}){
    const aantal=config.aantalOefeningen||6,vorm=config.variant||'van-getal';
    if(vorm==='verbinden')return [maakVerbindpuzzel()];
    if(vorm==='vraagstukken'){
      const gekozen=new Set(),vragen=[];
      while(vragen.length<aantal&&gekozen.size<vraagstukContexten.length){
        const oef=maakBreukVraagstuk(gekozen);gekozen.add(oef.contextId);vragen.push(oef);
      }
      return vragen;
    }
    const uit=[],gezien=new Set();
    for(let i=0;i<aantal*60&&uit.length<aantal;i++){
      const oef=maakVermenigvuldiging(vorm,uit.length);
      if(!gezien.has(oef.sleutel)){gezien.add(oef.sleutel);uit.push(oef);}
    }
    return uit;
  }

  function genereerGemengde(config = {}) {
    const aantal = config.aantalOefeningen || 6, uit = [], gezien = new Set();
    for (let poging=0; poging<aantal*50 && uit.length<aantal; poging++) {
      const bewerking = config.bewerking === 'gemengd' ? kies(['optellen','aftrekken']) : (config.bewerking || 'optellen');
      let d1=kies([2,3,4,5,6,8,10,12]);
      if (bewerking==='aftrekken') {
        const patroon=uit.length%3;
        if(patroon===0&&d1===2)d1=3;
        let w1,w2,n1,n2;
        if(patroon===0){w1=2+Math.floor(Math.random()*3);w2=1+Math.floor(Math.random()*(w1-1));n1=2+Math.floor(Math.random()*Math.max(1,d1-2));n2=1+Math.floor(Math.random()*Math.max(1,n1-1));}
        else {w1=1+Math.floor(Math.random()*4);w2=patroon===2&&w1>1?Math.floor(Math.random()*w1):0;n1=0;n2=1+Math.floor(Math.random()*(d1-1));}
        const totaal=(w1*d1+n1)-(w2*d1+n2); if(totaal<=0)continue;
        const heel=Math.floor(totaal/d1),rest=totaal%d1,sleutel=`${w1}-${n1}/${d1}-aftrekken-${w2}-${n2}/${d1}`;
        if(gezien.has(sleutel))continue;gezien.add(sleutel);
        uit.push({sleutel,type:'gemengde-getallen',vorm:uit.length%2===0?'strook':'taart',bewerking,op:'-',w1,n1,d1,w2,n2,d2:d1,doel:d1,ongelijknamig:false,cn1:n1,cn2:n2,factor1:1,factor2:1,g1:w1*d1+n1,g2:w2*d1+n2,totaal,heel,rest,antwoord:rest?`${heel} ${rest}/${d1}`:String(heel),aftrekVorm:'eerste'});
        continue;
      }
      const noemerKeuze=config.gemengdeNoemers||'gemengd';
      const moetOngelijk=noemerKeuze==='ongelijknamig'||(noemerKeuze==='gemengd'&&uit.length%2===1);
      let d2=moetOngelijk?kies([2,3,4,5,6,8,10,12].filter(d=>d!==d1&&(d%d1===0||d1%d===0))):d1;
      if (!d2) d2=d1;
      // De eerste oefenvormen vertrekken, zoals in de methode, van gewone
      // breuken die samen een gemengd getal kunnen vormen. Daarna volgen ook
      // oefeningen met gemengde termen.
      const gewoneBreuken = uit.length % 2 === 0;
      let w1=gewoneBreuken?0:1+Math.floor(Math.random()*3), w2=gewoneBreuken?0:1+Math.floor(Math.random()*2);
      let n1=1+Math.floor(Math.random()*(d1-1)), n2=1+Math.floor(Math.random()*(d2-1));
      let doel=lcm(d1,d2), a=(w1*d1+n1)*(doel/d1), b=(w2*d2+n2)*(doel/d2);
      if (bewerking==='aftrekken' && a<=b) { [w1,w2]=[w2,w1]; [n1,n2]=[n2,n1]; [d1,d2]=[d2,d1]; doel=lcm(d1,d2); a=(w1*d1+n1)*(doel/d1); b=(w2*d2+n2)*(doel/d2); }
      if (gewoneBreuken && bewerking==='optellen' && a+b<doel) continue;
      const totaal = bewerking==='optellen' ? a+b : a-b;
      if (totaal<=0) continue;
      const heel=Math.floor(totaal/doel), rest=totaal%doel;
      const sleutel=`${w1}-${n1}/${d1}-${bewerking}-${w2}-${n2}/${d2}`;
      if (gezien.has(sleutel)) continue; gezien.add(sleutel);
      uit.push({ sleutel, type:'gemengde-getallen', vorm:uit.length%2===0?'strook':'taart', bewerking, op:bewerking==='aftrekken'?'-':'+', w1,n1,d1,w2,n2,d2,doel, ongelijknamig:d1!==d2,
        cn1:n1*(doel/d1),cn2:n2*(doel/d2),factor1:doel/d1,factor2:doel/d2,
        g1:(w1*d1+n1)*(doel/d1), g2:(w2*d2+n2)*(doel/d2), totaal, heel, rest,
        antwoord: rest ? `${heel} ${rest}/${doel}` : String(heel) });
    }
    return uit;
  }
  return { genereer };
})();
