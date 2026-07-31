const Kommagetallen = (() => {
  const fmt = n => `${Math.floor(n/10)},${n%10}`;
  const fmt100 = n => {
    const geheel=Math.floor(n/100),rest=String(n%100).padStart(2,'0');
    if(rest==='00')return String(geheel);
    return `${geheel},${rest[1]==='0'?rest[0]:rest}`;
  };
  const fmtAlgemeen = n => {
    const afgerond=Math.round((n+Number.EPSILON)*1000000)/1000000;
    const delen=String(afgerond).split('.');
    delen[0]=delen[0].replace(/\B(?=(\d{3})+(?!\d))/g,' ');
    return delen.length===2?`${delen[0]},${delen[1]}`:delen[0];
  };
  const willekeurig=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
  function uniekeGetallen(aantal,maak){
    const waarden=[],gezien=new Set();
    for(let poging=0;poging<500&&waarden.length<aantal;poging++){
      const waarde=maak(waarden.length,poging);
      if(!gezien.has(waarde)){gezien.add(waarde);waarden.push(waarde);}
    }
    return waarden;
  }
  function maakHonderdste(variant,index){
    let a,b;
    for(let p=0;p<200;p++){
      const aE=1+Math.floor(Math.random()*7),aT=1+Math.floor(Math.random()*8),aH=1+Math.floor(Math.random()*8);
      a=aE*100+aT*10+aH;
      if(variant==='splitsen-honderdsten'||variant==='kort-honderdsten'){
        const bE=1+Math.floor(Math.random()*Math.max(1,Math.min(3,9-aE)));
        const bT=1+Math.floor(Math.random()*Math.max(1,9-aT));
        const bH=1+Math.floor(Math.random()*Math.max(1,9-aH));
        b=bE*100+bT*10+bH;
      }else{
        const soort=index%3;
        const bE=soort===0?1+Math.floor(Math.random()*Math.max(1,Math.min(3,9-aE))):0;
        const bT=soort===1?1+Math.floor(Math.random()*Math.max(1,9-aT)):0;
        const bH=soort===2?1+Math.floor(Math.random()*Math.max(1,9-aH)):0;
        b=bE*100+bT*10+bH;
      }
      if(b>0&&a+b<1000&&Math.floor(a/100)+Math.floor(b/100)<10&&Math.floor(a/10)%10+Math.floor(b/10)%10<10&&a%10+b%10<10)break;
    }
    const som=a+b,bE=Math.floor(b/100),bT=Math.floor(b/10)%10,bH=b%10;
    const delen=[bE*100,bT*10,bH].filter(d=>d>0);
    let tussen=a;
    const stappen=delen.map(d=>{const voor=tussen;tussen+=d;return `${fmt100(voor)} + ${d>=100?String(d/100):d>=10?`0,${d/10}0`:`0,0${d}`} = ${fmt100(tussen)}`;});
    return {sleutel:`kh-${a}-${b}-${variant}-${index}`,a,b,som,antwoord:fmt100(som),aTekst:fmt100(a),bTekst:fmt100(b),
      variant,brug:'zonder',decimalen:2,honderdsten:true,aHonderdsten:a,bHonderdsten:b,somHonderdsten:som,
      delen,deelTeksten:delen.map(d=>d>=100?String(d/100):d>=10?`0,${d/10}0`:`0,0${d}`),stappen};
  }
  function maakRoosterHonderdste(brug='zonder'){
    let rijen=[],kolommen=[],geldig=false;
    for(let poging=0;poging<400&&!geldig;poging++){
      rijen=uniekeGetallen(2,()=>willekeurig(1,5)*100+willekeurig(0,9)*10+willekeurig(0,9));
      kolommen=uniekeGetallen(5,()=>willekeurig(0,3)*100+willekeurig(0,9)*10+willekeurig(0,9)||1);
      const bruggen=rijen.flatMap(r=>kolommen.map(k=>r%100+k%100>=100));
      geldig=rijen.every(r=>kolommen.every(k=>r+k<1000))&&
        (brug==='zonder'?bruggen.every(v=>!v):brug==='met'?bruggen.every(Boolean):bruggen.some(Boolean)&&bruggen.some(v=>!v));
    }
    const inhoud=`${rijen.join(',')}|${kolommen.join(',')}`;
    return {sleutel:`krh-${brug}-${inhoud}`,variant:'rooster-honderdsten',rooster:true,bewerking:'optellen',brug,
      decimalen:2,honderdsten:true,rijen,kolommen,antwoorden:rijen.map(r=>kolommen.map(k=>fmt100(r+k)))};
  }
  function maakAftrekHonderdste(variant,index){
    let a,b;
    for(let p=0;p<300;p++){
      const aE=willekeurig(2,9),aT=willekeurig(1,9),aH=willekeurig(1,9);
      const soort=index%4;
      const bE=soort===0?willekeurig(1,aE-1):willekeurig(0,aE-1);
      const bT=soort===1?0:willekeurig(0,aT);
      const bH=soort===2?0:willekeurig(0,aH);
      a=aE*100+aT*10+aH;b=bE*100+bT*10+bH;
      if(b>0&&a>b)break;
    }
    const verschil=a-b,bE=Math.floor(b/100),bT=Math.floor(b/10)%10,bH=b%10;
    const delen=[bE*100,bT*10,bH].filter(Boolean);
    const deelTekst=d=>d>=100?String(d/100):d>=10?`0,${d/10}0`:`0,0${d}`;
    let tussen=a;
    const stappen=delen.map(d=>{const voor=tussen;tussen-=d;return `${fmt100(voor)} − ${deelTekst(d)} = ${fmt100(tussen)}`;});
    return {sleutel:`kah-${a}-${b}-${variant}-${index}`,a,b,som:verschil,verschil,antwoord:fmt100(verschil),
      aTekst:fmt100(a),bTekst:fmt100(b),variant,brug:'zonder',bewerking:'aftrekken',decimalen:2,honderdsten:true,
      aHonderdsten:a,bHonderdsten:b,verschilHonderdsten:verschil,
      aE:Math.floor(a/100),aT:Math.floor(a/10)%10,aH:a%10,bE,bT,bH,delen,deelTeksten:delen.map(deelTekst),stappen};
  }
  function maakAftrekRoosterHonderdste(brug='zonder'){
    let rijen=[],kolommen=[],geldig=false;
    for(let poging=0;poging<400&&!geldig;poging++){
      rijen=uniekeGetallen(2,()=>willekeurig(5,9)*100+willekeurig(0,9)*10+willekeurig(0,9));
      kolommen=uniekeGetallen(5,()=>willekeurig(0,4)*100+willekeurig(0,9)*10+willekeurig(0,9)||1);
      const bruggen=rijen.flatMap(r=>kolommen.map(k=>r%100<k%100));
      geldig=rijen.every(r=>kolommen.every(k=>r>k))&&
        (brug==='zonder'?bruggen.every(v=>!v):brug==='met'?bruggen.every(Boolean):bruggen.some(Boolean)&&bruggen.some(v=>!v));
    }
    const inhoud=`${rijen.join(',')}|${kolommen.join(',')}`;
    return {sleutel:`karh-${brug}-${inhoud}`,variant:'aftrek-rooster-honderdsten',rooster:true,bewerking:'aftrekken',brug,
      decimalen:2,honderdsten:true,rijen,kolommen,antwoorden:rijen.map(r=>kolommen.map(k=>fmt100(r-k)))};
  }
  function maakAftrekHonderdsteBrug(variant,index){
    let a,b;
    if(variant==='aftrek-compenseren-honderdsten'||variant==='aftrek-transformeren-honderdsten'){
      const rest=97+willekeurig(0,2),bE=willekeurig(1,4);
      b=bE*100+rest;
      a=willekeurig(bE+2,9)*100+willekeurig(0,9)*10+willekeurig(0,9);
      const verschil=a-b,correctie=100-rest,afgerond=b+correctie,tussenverschil=a-afgerond;
      const basis={sleutel:`kahb-${a}-${b}-${variant}-${index}`,a,b,som:verschil,verschil,antwoord:fmt100(verschil),
        aTekst:fmt100(a),bTekst:fmt100(b),variant,brug:'met',bewerking:'aftrekken',decimalen:2,honderdsten:true,
        correctie,afgerond,tussenverschil};
      if(variant==='aftrek-transformeren-honderdsten'){
        basis.nieuwA=a+correctie;basis.nieuwB=b+correctie;basis.transformCorr=correctie;
      }
      return basis;
    }
    for(let p=0;p<300;p++){
      a=willekeurig(3,9)*100+willekeurig(0,9)*10+willekeurig(0,9);
      b=willekeurig(1,Math.floor(a/100)-1)*100+willekeurig(1,9)*10+willekeurig(1,9);
      const brugH=a%10<b%10,brugT=Math.floor(a/10)%10-(brugH?1:0)<Math.floor(b/10)%10;
      if(a>b&&(brugH||brugT))break;
    }
    const verschil=a-b,bE=Math.floor(b/100),bT=Math.floor(b/10)%10,bH=b%10;
    const delen=[bE*100,bT*10,bH].filter(Boolean);
    const deelTekst=d=>d>=100?String(d/100):d>=10?`0,${d/10}0`:`0,0${d}`;
    let tussen=a;
    const stappen=delen.map(d=>{const voor=tussen;tussen-=d;return `${fmt100(voor)} − ${deelTekst(d)} = ${fmt100(tussen)}`;});
    return {sleutel:`kahb-${a}-${b}-${variant}-${index}`,a,b,som:verschil,verschil,antwoord:fmt100(verschil),
      aTekst:fmt100(a),bTekst:fmt100(b),variant,brug:'met',bewerking:'aftrekken',decimalen:2,honderdsten:true,
      aHonderdsten:a,bHonderdsten:b,verschilHonderdsten:verschil,delen,deelTeksten:delen.map(deelTekst),stappen};
  }
  function maakGetalpuzzel(decimalen=2,index=0){
    const schaal=decimalen===2?100:10,maximum=decimalen===2?1400:140;
    let waarden;
    for(let poging=0;poging<200;poging++){
      waarden=Array.from({length:4},()=>willekeurig(schaal,maximum));
      if(new Set(waarden).size===4)break;
    }
    const tekst=n=>decimalen===2?fmt100(n):fmt(n);
    const bewerkingen=waarden.map((n,i)=>{
      const verschil=waarden[(i+1)%4]-n;
      return `${verschil>=0?'+':'−'} ${tekst(Math.abs(verschil))}`;
    });
    return {sleutel:`kp-${decimalen}-${waarden.join('-')}-${index}`,variant:'getalpuzzel',puzzel:true,decimalen,
      waarden,antwoorden:[tekst(waarden[1]),tekst(waarden[3])],bewerkingen,antwoord:tekst(waarden[1])};
  }
  function maakHonderdsteBrug(variant,index){
    let a,b;
    if(variant==='honderdsten-brug'||variant==='tussenstappen-honderdsten-brug'||variant==='kort-honderdsten-brug'){
      for(let p=0;p<300;p++){
        a=willekeurig(1,6)*100+willekeurig(0,9)*10+willekeurig(1,9);
        b=willekeurig(0,2)*100+willekeurig(0,9)*10+willekeurig(1,9);
        const brugH=a%10+b%10>=10;
        const brugT=Math.floor(a/10)%10+Math.floor(b/10)%10+(brugH?1:0)>=10;
        if(b>0&&a+b<1000&&(brugH||brugT))break;
      }
      const som=a+b,bE=Math.floor(b/100),bT=Math.floor(b/10)%10,bH=b%10;
      const delen=[bE*100,bT*10,bH].filter(Boolean);
      const deelTekst=d=>d>=100?String(d/100):d>=10?`0,${d/10}0`:`0,0${d}`;
      let tussen=a;
      const stappen=delen.map(d=>{const voor=tussen;tussen+=d;return `${fmt100(voor)} + ${deelTekst(d)} = ${fmt100(tussen)}`;});
      return {sleutel:`khbn-${a}-${b}-${variant}-${index}`,a,b,som,antwoord:fmt100(som),aTekst:fmt100(a),bTekst:fmt100(b),
        variant,brug:'met',decimalen:2,honderdsten:true,aHonderdsten:a,bHonderdsten:b,somHonderdsten:som,delen,stappen};
    }
    if(variant==='splitsen-honderdsten-brug'){
      for(let p=0;p<200;p++){
        const aE=1+Math.floor(Math.random()*6),aT=2+Math.floor(Math.random()*7),aH=1+Math.floor(Math.random()*8);
        const bE=1+Math.floor(Math.random()*Math.max(1,Math.min(2,8-aE)));
        const bT=10-aT+Math.floor(Math.random()*aT),bH=1+Math.floor(Math.random()*Math.max(1,9-aH));
        a=aE*100+aT*10+aH;b=bE*100+bT*10+bH;
        if(a+b<1000&&aH+bH<10&&aT+bT>=10)break;
      }
      const som=a+b,bE=Math.floor(b/100),bT=Math.floor(b/10)%10,bH=b%10;
      const delen=[bE*100,bT*10,bH],deelTeksten=[String(bE),`0,${bT}0`,`0,0${bH}`];
      let tussen=a;
      const stappen=delen.map((d,i)=>{const voor=tussen;tussen+=d;return `${fmt100(voor)} + ${deelTeksten[i]} = ${fmt100(tussen)}`;});
      return {sleutel:`khb-${a}-${b}-${variant}-${index}`,a,b,som,antwoord:fmt100(som),aTekst:fmt100(a),bTekst:fmt100(b),
        variant,brug:'met',decimalen:2,honderdsten:true,delen,deelTeksten,stappen};
    }
    if(variant==='compenseren-honderdsten'){
      const aE=1+Math.floor(Math.random()*6),aT=1+Math.floor(Math.random()*8),aH=1+Math.floor(Math.random()*8);
      const bE=Math.floor(Math.random()*3),bH=97+Math.floor(Math.random()*3);
      a=aE*100+aT*10+aH;b=bE*100+bH;
      const correctie=100-bH,som=a+b,afgerond=b+correctie,tussensom=a+afgerond;
      return {sleutel:`khc-${a}-${b}-${index}`,a,b,som,antwoord:fmt100(som),aTekst:fmt100(a),bTekst:fmt100(b),
        variant,brug:'met',decimalen:2,honderdsten:true,correctie,afgerond,tussensom};
    }
    const doelTweede=index%2===0;
    const nabij=97+Math.floor(Math.random()*3),corr=100-nabij;
    if(doelTweede){
      a=(2+Math.floor(Math.random()*5))*100+(12+Math.floor(Math.random()*69));
      b=Math.floor(Math.random()*3)*100+nabij;
    }else{
      a=(2+Math.floor(Math.random()*5))*100+nabij;
      b=(1+Math.floor(Math.random()*2))*100+(12+Math.floor(Math.random()*69));
    }
    const corrA=doelTweede?-corr:corr,corrB=-corrA,nieuwA=a+corrA,nieuwB=b+corrB,som=a+b;
    return {sleutel:`kht-${a}-${b}-${index}`,a,b,som,antwoord:fmt100(som),aTekst:fmt100(a),bTekst:fmt100(b),
      variant,brug:'met',decimalen:2,honderdsten:true,transformDoel:doelTweede?'tweede':'eerste',correctie:corr,corrA,corrB,
      nieuwA,nieuwB};
  }
  function maak(brug,variant,index){
    let a,b;
    for(let p=0;p<100;p++){
      const ah=1+Math.floor(Math.random()*8),at=1+Math.floor(Math.random()*8);
      a=ah*10+at;
      if(variant==='compenseren'){
        const minimum=Math.max(7,10-at);
        const bt=minimum+Math.floor(Math.random()*(10-minimum));
        const geheel=Math.floor(Math.random()*Math.min(4,10-ah));
        b=geheel*10+bt;
      }else if(brug==='met'){
        const totVol=10-at;
        const bt=totVol+Math.floor(Math.random()*at);
        const geheel=index%2===0?0:1+Math.floor(Math.random()*Math.min(3,9-ah));
        b=geheel*10+bt;
      }else if(variant==='splitsen')b=10*(1+Math.floor(Math.random()*Math.min(3,9-ah)))+1+Math.floor(Math.random()*(9-at));
      else b=index%3===0?10*(1+Math.floor(Math.random()*Math.min(4,9-ah))):1+Math.floor(Math.random()*(9-at));
      if(b>0&&a+b<=100)break;
    }
    const naar=10-a%10,heelDeel=Math.floor(b/10)*10,tiendeDeel=b%10;
    const deel1=(brug==='zonder'||b>=10)?heelDeel:naar,deel2=b-deel1,som=a+b;
    const o={sleutel:`k-${a}-${b}-${variant}-${index}`,a,b,som,antwoord:fmt(som),aTekst:fmt(a),bTekst:b%10===0?String(b/10):fmt(b),variant,brug,naar,rest:Math.max(0,b-naar),deel1,deel2};
    if(variant==='compenseren'){
      const corr=10-b%10;
      o.strategieTerm='b';o.correctie=corr;o.afgerond=b+corr;o.tussensom=som+corr;
    }
    if(variant==='transformeren'){
      const verschuif=10-b%10;
      o.verschuif=verschuif;o.nieuwA=a-verschuif;o.nieuwB=b+verschuif;o.richting='naar-b';
    }
    return o;
  }
  function maakVermenigvuldiging(variant,index){
    const factor=willekeurig(2,9);
    const geheel=willekeurig(1,5);
    const tienden=willekeurig(1,9);
    const komma=geheel*10+tienden;
    const product=factor*komma;
    return {
      sleutel:`kvm-${factor}-${komma}-${variant}-${index}`,
      variant,bewerking:'vermenigvuldigen',decimalen:1,
      factor,komma,geheel,tienden,product,
      kommaTekst:fmt(komma),
      antwoord:fmt(product),
      splitsing:`(${factor} × ${geheel}) + (${factor} × 0,${tienden})`,
      tussenstap:`${factor*geheel} + ${fmt(factor*tienden)}`
    };
  }
  function maakVermenigvuldigingCompenseren(variant,index){
    const factor=willekeurig(2,9);
    const geheel=willekeurig(1,6);
    const tienden=willekeurig(7,9);
    const komma=geheel*10+tienden;
    const afgerond=geheel+1;
    const correctie=10-tienden;
    const product=factor*komma;
    return {
      sleutel:`kvmc-${factor}-${komma}-${variant}-${index}`,
      variant,bewerking:'vermenigvuldigen',decimalen:1,
      factor,komma,geheel,tienden,afgerond,correctie,product,
      kommaTekst:fmt(komma),
      correctieTekst:`0,${correctie}`,
      antwoord:fmt(product),
      compensatie:`(${factor} × ${afgerond}) − (${factor} × 0,${correctie})`,
      tussenstap:`${factor*afgerond} − ${fmt(factor*correctie)}`
    };
  }
  function maakDeling(variant,metRest,index){
    let deler,eerstQuotient,tweedeQuotient,rest,eersteDeel,tweedeDeel,deeltal;
    for(let poging=0;poging<200;poging++){
      deler=willekeurig(2,9);
      eerstQuotient=willekeurig(1,2);
      tweedeQuotient=willekeurig(1,8);
      rest=metRest?willekeurig(1,deler-1):0;
      eersteDeel=deler*eerstQuotient;
      tweedeDeel=deler*tweedeQuotient+rest;
      deeltal=eersteDeel*10+tweedeDeel;
      if(!metRest&&tweedeDeel%10===0)continue;
      if(deeltal<=99&&tweedeDeel<40)break;
    }
    const quotient=eerstQuotient*10+tweedeQuotient;
    const restTekst=rest?` R0,${rest}`:'';
    return {
      sleutel:`kvd-${deeltal}-${deler}-${rest}-${variant}-${index}`,
      variant,bewerking:'delen',decimalen:1,metRest,
      deeltal,deler,eersteDeel,tweedeDeel,quotient,rest,
      deeltalTekst:fmt(deeltal),
      tweedeDeelTekst:fmt(tweedeDeel),
      antwoord:`${fmt(quotient)}${restTekst}`,
      splitsing:`(${eersteDeel} : ${deler}) + (${fmt(tweedeDeel)} : ${deler})`,
      tussenstap:`${eerstQuotient} + ${fmt(tweedeQuotient)}${restTekst}`
    };
  }
  function maakNulregel(index){
    const decimalen=willekeurig(1,3),schaal=10**decimalen;
    const geheel=index%4===0?0:willekeurig(0,25),fractie=willekeurig(1,schaal-1);
    const getal=(geheel*schaal+fractie)/schaal;
    const macht=[10,100,1000][index%3];
    const omgekeerd=index%2===1;
    return {
      sleutel:`kvn-${getal}-${macht}-${omgekeerd}`,
      variant:'vermenigvuldigen-nulregel',bewerking:'vermenigvuldigen',nulregel:true,
      aTekst:omgekeerd?fmtAlgemeen(macht):fmtAlgemeen(getal),
      bTekst:omgekeerd?fmtAlgemeen(getal):fmtAlgemeen(macht),
      antwoord:fmtAlgemeen(getal*macht)
    };
  }
  function maakFactoren(index){
    let kommaRaw=willekeurig(2,99);
    if(kommaRaw%10===0)kommaRaw++;
    const komma=kommaRaw/10;
    const factor=willekeurig(2,9);
    const macht=[10,100,1000][index%3];
    const geheel=factor*macht;
    const tussen=komma*factor;
    return {
      sleutel:`kvf-${komma}-${factor}-${macht}`,
      variant:'vermenigvuldigen-factoren',bewerking:'vermenigvuldigen',factoren:true,
      kommaTekst:fmtAlgemeen(komma),factor,macht,geheelTekst:fmtAlgemeen(geheel),
      ontbinding:`${fmtAlgemeen(komma)} × (${factor} × ${fmtAlgemeen(macht)})`,
      schakeling:`(${fmtAlgemeen(komma)} × ${factor}) × ${fmtAlgemeen(macht)}`,
      tussenstap:`${fmtAlgemeen(tussen)} × ${fmtAlgemeen(macht)}`,
      antwoord:fmtAlgemeen(tussen*macht)
    };
  }
  function maakDeelNulregel(index){
    const decimalen=willekeurig(0,2),schaal=10**decimalen;
    const geheel=index%4===0?willekeurig(1,9):willekeurig(1,99);
    const fractie=decimalen?willekeurig(1,schaal-1):0;
    const getal=(geheel*schaal+fractie)/schaal;
    const macht=[10,100,1000][index%3];
    return {
      sleutel:`kdn-${getal}-${macht}`,
      variant:'delen-nulregel',bewerking:'delen',nulregel:true,
      deeltalTekst:fmtAlgemeen(getal),delerTekst:fmtAlgemeen(macht),
      antwoord:fmtAlgemeen(getal/macht)
    };
  }
  function maakDeelFactoren(index){
    const factor=willekeurig(2,9),macht=[10,100,1000][index%3];
    let tussenRaw=index%3===2?willekeurig(1,25)*10:willekeurig(1,99);
    if(tussenRaw%10===0&&index%3!==2)tussenRaw++;
    const tussen=tussenRaw/10,deeltal=tussen*factor,deler=factor*macht;
    return {
      sleutel:`kdf-${deeltal}-${factor}-${macht}`,
      variant:'delen-factoren',bewerking:'delen',factoren:true,
      deeltalTekst:fmtAlgemeen(deeltal),delerTekst:fmtAlgemeen(deler),
      ontbinding:`(${fmtAlgemeen(deeltal)} : ${factor}) : ${fmtAlgemeen(macht)}`,
      tussenstap:`${fmtAlgemeen(tussen)} : ${fmtAlgemeen(macht)}`,
      antwoord:fmtAlgemeen(tussen/macht)
    };
  }
  function maakAftrek(brug,variant,index,voorbeeld=false){
    let a,b;
    for(let p=0;p<200;p++){
      const ah=2+Math.floor(Math.random()*8),
        at=variant==='aftrek-brug-transformeren'?(index%2===0?4+Math.floor(Math.random()*3):1+Math.floor(Math.random()*2)):variant==='aftrek-brug-compenseren'?Math.floor(Math.random()*7):brug==='met'?(index%3===0?0:1+Math.floor(Math.random()*8)):Math.floor(Math.random()*10);
      a=ah*10+at;
      if(variant==='aftrek-brug-transformeren'){
        const bt=index%2===0?7+Math.floor(Math.random()*3):4+Math.floor(Math.random()*4);
        const bh=1+Math.floor(Math.random()*Math.max(1,ah-1));
        b=bh*10+bt;
      }else if(variant==='aftrek-brug-compenseren'){
        const bt=7+Math.floor(Math.random()*3);
        const bh=1+Math.floor(Math.random()*Math.max(1,ah-1));
        b=bh*10+bt;
      }else if(variant==='aftrek-brug-aanvullen'){
        const aanvulTienden=Math.min(9,at+1+Math.floor(Math.random()*Math.min(4,9-at)));
        b=a-aanvulTienden;
      }else if(brug==='met'){
        const bh=at===0?0:1+Math.floor(Math.random()*Math.min(3,ah-1));
        const bt=at===0?1+Math.floor(Math.random()*9):at+1+Math.floor(Math.random()*(9-at));
        b=bh*10+bt;
      }else if(variant==='aftrek-aanvullen'){
        const verschil=1+Math.floor(Math.random()*Math.max(1,at||5));
        b=a-verschil;
      }else{
        const bh=index%3===0?1+Math.floor(Math.random()*Math.min(4,ah)):Math.floor(Math.random()*ah);
        const bt=index%3===1?Math.floor(Math.random()*(at+1)):Math.floor(Math.random()*(at+1));
        b=bh*10+bt;
      }
      if(b>0&&b<a&&(brug==='met'?a%10<b%10:(Math.floor(a/10)>=Math.floor(b/10)&&a%10>=b%10)))break;
    }
    const verschil=a-b;
    const aE=Math.floor(a/10),aT=a%10,bE=Math.floor(b/10),bT=b%10;
    const o={sleutel:`ka-${a}-${b}-${variant}-${index}`,a,b,som:verschil,verschil,antwoord:fmt(verschil),
      aTekst:aT===0?String(aE):fmt(a),bTekst:b%10===0?String(b/10):fmt(b),variant,brug,bewerking:'aftrekken',
      aE,aT,bE,bT,voorbeeld};
    if(brug==='met'){
      if(aT===0&&bE===0){
        o.split1=a-10;o.split2=10;o.split1Tekst=String(aE-1);o.split2Tekst='1';
        o.tussen1=10-b;o.stap1=`1 − ${o.bTekst} = ${fmt(o.tussen1)}`;
        o.stap2=`${aE-1} + ${fmt(o.tussen1)} = ${o.antwoord}`;
      }else{
        o.split1=bE*10;o.split2=bT;o.split1Tekst=String(bE);o.split2Tekst=fmt(bT);
        o.tussen1=a-o.split1;o.stap1=`${o.aTekst} − ${bE} = ${fmt(o.tussen1)}`;
        o.stap2=`${fmt(o.tussen1)} − ${fmt(bT)} = ${o.antwoord}`;
      }
    }
    if(variant==='aftrek-brug-compenseren'){
      const corr=10-bT;
      o.correctie=corr;o.afgerond=b+corr;o.tussenverschil=a-o.afgerond;
    }
    if(variant==='aftrek-brug-transformeren'){
      const rondTweede=(10-bT)<aT;
      const corr=rondTweede?10-bT:-aT;
      o.transformCorr=corr;o.nieuwA=a+corr;o.nieuwB=b+corr;o.transformDoel=rondTweede?'tweede':'eerste';
    }
    return o;
  }
  function maakRooster(bewerking,brug){
    const aftrek=bewerking==='aftrekken';
    let rijen=[],kolommen=[],geldig=false;
    const heeftBrug=(r,k)=>aftrek?r%10<k%10:r%10+k%10>=10;
    for(let poging=0;poging<300&&!geldig;poging++){
      if(aftrek){
        if(brug==='zonder'){
          rijen=uniekeGetallen(4,()=>willekeurig(6,9)*10+willekeurig(5,9));
          const minT=Math.min(...rijen.map(n=>n%10));
          kolommen=uniekeGetallen(5,()=>willekeurig(0,4)*10+willekeurig(0,minT));
        }else if(brug==='met'){
          rijen=uniekeGetallen(4,()=>willekeurig(6,9)*10+willekeurig(0,4));
          const maxT=Math.max(...rijen.map(n=>n%10));
          kolommen=uniekeGetallen(5,()=>willekeurig(0,4)*10+willekeurig(maxT+1,9));
        }else{
          rijen=uniekeGetallen(4,()=>willekeurig(6,9)*10+willekeurig(0,9));
          kolommen=uniekeGetallen(5,()=>willekeurig(0,4)*10+willekeurig(0,9));
        }
      }else{
        if(brug==='zonder'){
          rijen=uniekeGetallen(4,()=>willekeurig(1,4)*10+willekeurig(0,5));
          const maxT=Math.max(...rijen.map(n=>n%10));
          kolommen=uniekeGetallen(5,()=>willekeurig(0,4)*10+willekeurig(0,9-maxT));
        }else if(brug==='met'){
          rijen=uniekeGetallen(4,()=>willekeurig(1,4)*10+willekeurig(5,9));
          const minT=Math.min(...rijen.map(n=>n%10));
          kolommen=uniekeGetallen(5,()=>willekeurig(0,4)*10+willekeurig(10-minT,9));
        }else{
          rijen=uniekeGetallen(4,()=>willekeurig(1,4)*10+willekeurig(0,9));
          kolommen=uniekeGetallen(5,()=>willekeurig(0,4)*10+willekeurig(0,9));
        }
      }
      const bruggen=rijen.flatMap(r=>kolommen.map(k=>heeftBrug(r,k)));
      const positief=!aftrek||rijen.every(r=>kolommen.every(k=>r>k));
      geldig=rijen.length===4&&kolommen.length===5&&positief&&
        (brug==='zonder'?bruggen.every(v=>!v):brug==='met'?bruggen.every(Boolean):bruggen.some(Boolean)&&bruggen.some(v=>!v));
    }
    const inhoud=`${rijen.join(',')}|${kolommen.join(',')}`;
    return {
      sleutel:`kr-${bewerking}-${brug}-${inhoud}`,
      variant:aftrek?'aftrek-rooster':'rooster',rooster:true,bewerking,brug,
      rijen,kolommen,
      antwoorden:rijen.map(r=>kolommen.map(k=>fmt(aftrek?r-k:r+k)))
    };
  }
  function genereer({bewerking='optellen',brug='zonder',variant='kort',aantalOefeningen=6,toonVoorbeeld=false,decimalen=1,restsoort='zonder'}={}){
    if(variant==='delen-nulregel'||variant==='delen-factoren'){
      const uit=[],gezien=new Set(),maakOef=variant==='delen-nulregel'?maakDeelNulregel:maakDeelFactoren;
      for(let i=0;i<aantalOefeningen*50&&uit.length<aantalOefeningen;i++){
        const oef=maakOef(i);
        if(!gezien.has(oef.sleutel)){gezien.add(oef.sleutel);uit.push(oef);}
      }
      return uit;
    }
    if(variant==='vermenigvuldigen-nulregel'||variant==='vermenigvuldigen-factoren'){
      const uit=[],gezien=new Set(),maakOef=variant==='vermenigvuldigen-nulregel'?maakNulregel:maakFactoren;
      for(let i=0;i<aantalOefeningen*50&&uit.length<aantalOefeningen;i++){
        const oef=maakOef(i);
        if(!gezien.has(oef.sleutel)){gezien.add(oef.sleutel);uit.push(oef);}
      }
      return uit;
    }
    if(variant==='delen-haakjes'||variant==='delen-zelf'){
      const uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*60&&uit.length<aantalOefeningen;i++){
        const metRest=restsoort==='gemengd'?uit.length%2===1:restsoort==='met';
        const oef=maakDeling(variant,metRest,i);
        const sleutel=`${oef.deeltal}-${oef.deler}`;
        if(!gezien.has(sleutel)){gezien.add(sleutel);uit.push(oef);}
      }
      return restsoort==='gemengd'?uit.sort(()=>Math.random()-.5):uit;
    }
    if(variant==='vermenigvuldigen-compenseren-haakjes'||variant==='vermenigvuldigen-compenseren-zelf'){
      const uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*50&&uit.length<aantalOefeningen;i++){
        const oef=maakVermenigvuldigingCompenseren(variant,i);
        const sleutel=`${oef.factor}-${oef.komma}`;
        if(!gezien.has(sleutel)){gezien.add(sleutel);uit.push(oef);}
      }
      return uit;
    }
    if(variant==='vermenigvuldigen-haakjes'||variant==='vermenigvuldigen-zelf'){
      const uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*50&&uit.length<aantalOefeningen;i++){
        const oef=maakVermenigvuldiging(variant,i);
        const sleutel=`${oef.factor}-${oef.komma}`;
        if(!gezien.has(sleutel)){gezien.add(sleutel);uit.push(oef);}
      }
      return uit;
    }
    if(variant==='getalpuzzel'){
      const uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*30&&uit.length<aantalOefeningen;i++){
        const oef=maakGetalpuzzel(decimalen,i);
        if(!gezien.has(oef.sleutel)){gezien.add(oef.sleutel);uit.push(oef);}
      }
      return uit;
    }
    if(variant==='kort-bewerkingen-gemengd'){
      const uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*80&&uit.length<aantalOefeningen;i++){
        const aftrek=uit.length%2===1;
        const gekozenBrug=brug==='gemengd'?(Math.floor(uit.length/2)%2===0?'zonder':'met'):brug;
        let oef;
        if(decimalen===2){
          if(aftrek){
            const v=gekozenBrug==='met'?'aftrek-kort-honderdsten-brug':'aftrek-kort-honderdsten';
            oef=gekozenBrug==='met'?maakAftrekHonderdsteBrug(v,i):maakAftrekHonderdste(v,i);
          }else{
            const v=gekozenBrug==='met'?'kort-honderdsten-brug':'kort-honderdsten';
            oef=gekozenBrug==='met'?maakHonderdsteBrug(v,i):maakHonderdste(v,i);
          }
        }else{
          const v=aftrek?'aftrek-kort':'kort';
          oef=aftrek?maakAftrek(gekozenBrug,v,i):maak(gekozenBrug,v,i);
        }
        oef.brug=gekozenBrug;oef.bewerking=aftrek?'aftrekken':'optellen';
        const sleutel=`${oef.bewerking}-${oef.a}-${oef.b}`;
        if(!gezien.has(sleutel)){gezien.add(sleutel);uit.push(oef);}
      }
      return uit.sort(()=>Math.random()-.5);
    }
    if(variant==='rooster-bewerkingen-gemengd'){
      const uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*80&&uit.length<aantalOefeningen;i++){
        const aftrek=uit.length%2===1;
        const gekozenBrug=brug==='gemengd'?(Math.floor(uit.length/2)%2===0?'zonder':'met'):brug;
        const oef=decimalen===2?(aftrek?maakAftrekRoosterHonderdste(gekozenBrug):maakRoosterHonderdste(gekozenBrug)):maakRooster(aftrek?'aftrekken':'optellen',gekozenBrug);
        if(!gezien.has(oef.sleutel)){gezien.add(oef.sleutel);uit.push(oef);}
      }
      return uit;
    }
    if(variant==='kort-honderdsten-gemengd'||variant==='aftrek-kort-honderdsten-gemengd'){
      const aftrek=variant.startsWith('aftrek-'),uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*60&&uit.length<aantalOefeningen;i++){
        const met=uit.length%2===1;
        const basis=aftrek?(met?'aftrek-honderdsten-brug':'aftrek-kort-honderdsten'):(met?'kort-honderdsten-brug':'kort-honderdsten');
        const oef=aftrek?(met?maakAftrekHonderdsteBrug(basis,i):maakAftrekHonderdste(basis,i)):(met?maakHonderdsteBrug(basis,i):maakHonderdste(basis,i));
        oef.variant=variant;oef.brug=met?'met':'zonder';
        const sleutel=`${oef.a}-${oef.b}`;
        if(!gezien.has(sleutel)){gezien.add(sleutel);uit.push(oef);}
      }
      return uit.sort(()=>Math.random()-.5);
    }
    if(variant==='rooster-honderdsten'){
      return uniekeRoosters(()=>maakRoosterHonderdste(brug),aantalOefeningen);
    }
    if(variant==='aftrek-rooster-honderdsten'){
      return uniekeRoosters(()=>maakAftrekRoosterHonderdste(brug),aantalOefeningen);
    }
    if(['aftrek-schijfjes-honderdsten','aftrek-splitsen-honderdsten','aftrek-honderdsten','aftrek-kort-honderdsten'].includes(variant)){
      const uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*50&&uit.length<aantalOefeningen;i++){
        const oef=maakAftrekHonderdste(variant,i),sleutel=`${oef.a}-${oef.b}`;
        if(!gezien.has(sleutel)){gezien.add(sleutel);uit.push(oef);}
      }
      return uit;
    }
    if(['aftrek-splitsen-honderdsten-brug','aftrek-compenseren-honderdsten','aftrek-transformeren-honderdsten','aftrek-honderdsten-brug','aftrek-kort-honderdsten-brug'].includes(variant)){
      const uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*50&&uit.length<aantalOefeningen;i++){
        const oef=maakAftrekHonderdsteBrug(variant,i),sleutel=`${oef.a}-${oef.b}`;
        if(!gezien.has(sleutel)){gezien.add(sleutel);uit.push(oef);}
      }
      return uit;
    }
    if(variant==='splitsen-honderdsten-brug'||variant==='compenseren-honderdsten'||variant==='transformeren-honderdsten'||variant==='honderdsten-brug'||variant==='tussenstappen-honderdsten-brug'||variant==='kort-honderdsten-brug'){
      const uit=[],gezien=new Set();
      for(let i=0;i<aantalOefeningen*50&&uit.length<aantalOefeningen;i++){
        const oef=maakHonderdsteBrug(variant,i),sleutel=`${oef.a}+${oef.b}`;
        if(!gezien.has(sleutel)){gezien.add(sleutel);uit.push(oef);}
      }
      return uit;
    }
    if(variant==='honderdsten'||variant==='splitsen-honderdsten'||variant==='kort-honderdsten'){
      return Array.from({length:aantalOefeningen},(_,i)=>maakHonderdste(variant,i));
    }
    if(variant==='rooster'||variant==='aftrek-rooster'){
      return uniekeRoosters(()=>maakRooster(bewerking,brug),aantalOefeningen);
    }
    if(brug==='gemengd'&&(variant==='kort'||variant==='aftrek-kort')){
      const uit=[],gezien=new Set(),aftrek=bewerking==='aftrekken';
      for(let i=0;i<aantalOefeningen*50&&uit.length<aantalOefeningen;i++){
        const soort=uit.length%2===0?'zonder':'met';
        const o=aftrek?maakAftrek(soort,variant,i):maak(soort,variant,i);
        o.brug=soort;
        const sleutel=`${o.a}-${o.b}`;
        if(!gezien.has(sleutel)){gezien.add(sleutel);uit.push(o);}
      }
      return uit.sort(()=>Math.random()-.5);
    }
    const uit=[],gezien=new Set();
    for(let i=0;i<aantalOefeningen*40&&uit.length<aantalOefeningen;i++){
      const o=bewerking==='aftrekken'?maakAftrek(brug,variant,i,toonVoorbeeld&&uit.length===0):maak(brug,variant,i),k=`${o.a}${bewerking==='aftrekken'?'-':'+'}${o.b}`;
      if(!gezien.has(k)){gezien.add(k);uit.push(o);}
    }
    return uit;
  }
  function uniekeRoosters(maak,aantal){
    const uit=[],gezien=new Set();
    for(let poging=0;poging<aantal*100&&uit.length<aantal;poging++){
      const rooster=maak();
      if(!gezien.has(rooster.sleutel)){gezien.add(rooster.sleutel);uit.push(rooster);}
    }
    return uit;
  }
  return {genereer,fmt,fmt100,fmtAlgemeen};
})();
