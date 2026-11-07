/* 28 mascottes SVG originales, aplats uniquement.
   Tout le dessin est enfermé dans une fonction : seuls CHAR_ART, charArtSVG
   et charFace sont globaux (le jeu n'a pas de modules, des noms comme
   « face » ou « robot » entreraient vite en collision). */
const CHAR_ART = (function(){
const AI='#2B2140', AM='#8C2F3F';
function features(){return '<ellipse cx="47" cy="61" rx="5.4" ry="7" fill="'+AI+'"/><circle cx="49" cy="57" r="2.2" fill="#fff"/><ellipse cx="73" cy="61" rx="5.4" ry="7" fill="'+AI+'"/><circle cx="75" cy="57" r="2.2" fill="#fff"/><ellipse cx="38.5" cy="72" rx="6" ry="3.6" fill="#FF8FA3" opacity=".55"/><ellipse cx="81.5" cy="72" rx="6" ry="3.6" fill="#FF8FA3" opacity=".55"/><path d="M51 75 Q60 85 69 75" fill="none" stroke="'+AM+'" stroke-width="3" stroke-linecap="round"/>'}
function face(skin='#F2C6A5'){return '<ellipse cx="60" cy="58" rx="33" ry="31.5" fill="'+skin+'" stroke="'+AI+'" stroke-width="2.5"/>'+features()}
function human(skin,hair,cloth,hat,extra,back=''){return '<svg viewBox="0 0 120 130">'+back+'<path d="M18 130 Q22 98 60 96 Q98 98 102 130Z" fill="'+cloth+'" stroke="'+AI+'" stroke-width="2.5"/><rect x="52" y="84" width="16" height="16" rx="5" fill="'+skin+'"/><circle cx="27" cy="62" r="6" fill="'+skin+'" stroke="'+AI+'" stroke-width="2"/><circle cx="93" cy="62" r="6" fill="'+skin+'" stroke="'+AI+'" stroke-width="2"/>'+face(skin)+'<path d="M27 56 Q22 21 60 19 Q98 21 93 56 Q80 41 70 42 Q51 49 39 42Z" fill="'+hair+'" stroke="'+AI+'" stroke-width="2.5"/>'+hat+extra+'</svg>'}
function beast(fur,ears,extra,body=''){return '<svg viewBox="0 0 120 130">'+body+ears+'<ellipse cx="60" cy="108" rx="36" ry="23" fill="'+fur+'" stroke="'+AI+'" stroke-width="2.5"/><ellipse cx="60" cy="58" rx="33" ry="31.5" fill="'+fur+'" stroke="'+AI+'" stroke-width="2.5"/>'+features()+extra+'</svg>'}
function robot(head,body,screen,addon){return '<svg viewBox="0 0 120 130">'+addon+'<path d="M25 130 L30 98 H90 L95 130Z" fill="'+body+'" stroke="'+AI+'" stroke-width="2.5"/><rect x="24" y="31" width="72" height="67" rx="12" fill="'+head+'" stroke="'+AI+'" stroke-width="3"/><rect x="32" y="40" width="56" height="47" rx="8" fill="'+screen+'" stroke="'+AI+'" stroke-width="2"/><ellipse cx="47" cy="61" rx="5" ry="7" fill="'+AI+'"/><circle cx="49" cy="57" r="2" fill="#fff"/><ellipse cx="73" cy="61" rx="5" ry="7" fill="'+AI+'"/><circle cx="75" cy="57" r="2" fill="#fff"/><ellipse cx="38" cy="77" rx="5" ry="3" fill="#FF8FA3" opacity=".55"/><ellipse cx="82" cy="77" rx="5" ry="3" fill="#FF8FA3" opacity=".55"/><path d="M51 78 Q60 84 69 78" fill="none" stroke="'+AM+'" stroke-width="2.5"/><path d="M60 31 V15" stroke="'+AI+'" stroke-width="3"/><circle cx="60" cy="12" r="5" fill="#F5C64D" stroke="'+AI+'" stroke-width="2"/></svg>'}
const ART={
pirate:human('#A96848','#30221F','#F7F1E5','<path d="M23 40 Q60 20 97 40 L91 49 Q60 38 29 49Z" fill="#D94E50" stroke="'+AI+'" stroke-width="2.5"/><path d="M89 44 L106 54 L92 58Z" fill="#D94E50" stroke="'+AI+'" stroke-width="2"/>','<path d="M28 105 H92 M23 119 H97" stroke="#D94E50" stroke-width="7"/><circle cx="29" cy="72" r="4" fill="#F4C44E"/>'),
sirene:human('#F0C4AA','#234A70','#25B8B8','<path d="M27 56 Q20 18 60 17 Q100 18 93 58 L90 93 L78 84 L80 51 Q60 39 40 51 L40 89 L29 97Z" fill="#234A70" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M36 101 Q15 117 29 129 Q44 137 60 124 Q76 137 91 129 Q105 117 84 101Z" fill="#27BFC0" stroke="'+AI+'" stroke-width="2.5"/><path d="M55 33 L60 20 L66 33Z" fill="#F4D15A"/>'),
licorne:beast('#FFF6E9','<path d="M42 43 L36 15 L53 35 M78 43 L84 15 L67 35" fill="#FFF6E9" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M55 34 L60 3 L66 34Z" fill="#F4C94E" stroke="'+AI+'" stroke-width="2.5"/><path d="M28 54 Q9 34 26 23 Q38 42 47 42 M72 42 Q87 17 99 28 Q93 47 83 54" fill="#E77FB5" stroke="'+AI+'" stroke-width="2.5"/>'),
danseuse:human('#D99776','#29202C','#EF82AC','<circle cx="82" cy="18" r="11" fill="#29202C" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M60 99 Q24 85 17 111 Q39 108 60 123 Q81 108 103 111 Q96 85 60 99Z" fill="#FFC0D8" stroke="'+AI+'" stroke-width="2.5"/><path d="M38 27 L45 17 L54 25 L61 12 L68 25 L78 17 L83 29Z" fill="#F5D15B" stroke="'+AI+'" stroke-width="2"/>'),
fee:human('#C98663','#70422F','#79D6A5','<path d="M27 55 Q22 22 60 18 Q98 22 93 55Z" fill="#70422F" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M27 80 Q2 43 18 39 Q37 43 46 74 M93 80 Q118 43 102 39 Q83 43 74 74" fill="#BCEFE1" stroke="'+AI+'" stroke-width="2.5"/><g fill="#F6C94E"><circle cx="39" cy="28" r="5"/><circle cx="51" cy="21" r="5"/><circle cx="64" cy="20" r="5"/><circle cx="77" cy="28" r="5"/></g>'),
biche:beast('#D6A64D','<path d="M37 48 Q15 13 27 9 Q43 25 46 43 M83 48 Q105 13 93 9 Q77 25 74 43 M34 25 L21 12 M86 25 L99 12" fill="#C58A55" stroke="'+AI+'" stroke-width="3" stroke-linecap="round"/>','<ellipse cx="60" cy="78" rx="14" ry="9" fill="#F7E4C8"/><circle cx="60" cy="76" r="3" fill="#8C2F3F"/><g fill="#F4E3C9"><circle cx="42" cy="105" r="3"/><circle cx="75" cy="110" r="3"/><circle cx="55" cy="99" r="2"/></g>'),
hibou:beast('#98613F','<path d="M29 50 Q12 8 44 29 L54 45 M91 50 Q108 8 76 29 L66 45" fill="#98613F" stroke="'+AI+'" stroke-width="2.5"/>','<circle cx="47" cy="61" r="12" fill="none" stroke="#F1D9A8" stroke-width="3"/><circle cx="73" cy="61" r="12" fill="none" stroke="#F1D9A8" stroke-width="3"/><path d="M59 61 H61 M56 76 L60 84 L64 76Z" fill="#E8B94F" stroke="'+AI+'" stroke-width="2"/>'),
loup:beast('#8294A9','<path d="M31 51 L19 10 L49 39 M89 51 L101 10 L71 39" fill="#8294A9" stroke="'+AI+'" stroke-width="2.5"/><path d="M27 28 L33 43 M93 28 L87 43" stroke="#F2C9C7" stroke-width="5"/>','<ellipse cx="60" cy="78" rx="18" ry="13" fill="#F2E8DC" stroke="'+AI+'" stroke-width="2"/><ellipse cx="60" cy="73" rx="5" ry="4" fill="'+AI+'"/><path d="M52 87 Q60 94 68 87" fill="none" stroke="'+AM+'" stroke-width="2.5"/>'),
dragonciel:beast('#75C8E9','<path d="M37 46 L29 17 L51 34 M83 46 L91 17 L69 34" fill="#75C8E9" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M37 83 Q4 27 8 17 Q38 26 55 69Z M83 83 Q116 27 112 17 Q82 26 65 69Z" fill="#BCEBFA" stroke="'+AI+'" stroke-width="2.5"/><path d="M44 99 Q60 90 76 99" fill="none" stroke="#D8F7FF" stroke-width="5"/>'),
aigle:beast('#C58C3E','<path d="M34 55 Q2 32 8 15 Q35 23 53 52 M86 55 Q118 32 112 15 Q85 23 67 52" fill="#C58C3E" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M52 70 Q60 87 68 70 L60 96Z" fill="#E8A52F" stroke="'+AI+'" stroke-width="2"/>'),
magicienne:human('#E8B69D','#283A78','#263E86','<path d="M22 36 L60 4 L98 36Z" fill="#263E86" stroke="'+AI+'" stroke-width="2.5"/><ellipse cx="60" cy="37" rx="47" ry="7" fill="#344E9D" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M60 8 L65 20 L78 21 L68 29 L71 42 L60 34 L49 42 L52 29 L42 21 L55 20Z" fill="#F5D76B"/><g fill="#F5D76B"><circle cx="37" cy="112" r="3"/><circle cx="83" cy="120" r="3"/></g>'),
robotmontagne:robot('#A8BDCC','#68859B','#DDF3F8','<rect x="10" y="108" width="100" height="19" rx="9" fill="#607D96" stroke="'+AI+'" stroke-width="2.5"/><g fill="#DDEBF1"><circle cx="27" cy="117" r="5"/><circle cx="49" cy="117" r="5"/><circle cx="71" cy="117" r="5"/><circle cx="93" cy="117" r="5"/></g>'),
princesse:human('#F1C6A9','#D6A044','#F18CB5','<path d="M37 31 L44 13 L54 26 L61 6 L68 26 L78 13 L84 31Z" fill="#F4D05A" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M23 56 Q20 19 60 18 Q100 19 97 57 L92 105 L78 96 L80 53 Q60 39 40 53 L42 96 L28 105Z" fill="#D6A044" stroke="'+AI+'" stroke-width="2.5"/><circle cx="61" cy="21" r="4" fill="#EF83B2"/>'),
sorciere:human('#D9A0A2','#8055B8','#7948B2','<path d="M22 37 L61 4 L99 37Z" fill="#674397" stroke="'+AI+'" stroke-width="2.5"/><ellipse cx="60" cy="37" rx="48" ry="7" fill="#8D66C3" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M84 30 L91 25 L96 31 L91 37Z" fill="#F5D76B"/><path d="M30 112 Q60 124 90 112" stroke="#D0B3F3" stroke-width="4" fill="none"/>'),
chevalier:human('#9B674C','#38271F','#315C98','<path d="M23 54 Q60 18 97 54 L91 63 Q60 48 29 63Z" fill="#B8C7D4" stroke="'+AI+'" stroke-width="2.5"/><path d="M60 19 Q51 5 64 2 Q71 10 65 20Z" fill="#E85E63"/>','<path d="M43 99 L60 116 L77 99" fill="#E8EDF2" stroke="'+AI+'" stroke-width="2"/><path d="M60 109 L66 117 L60 126 L54 117Z" fill="#F4C95C"/>'),
pegase:beast('#FFF8EF','<path d="M39 53 Q17 13 10 21 L31 65 M81 53 Q103 13 110 21 L89 65" fill="#F8F2E9" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M28 42 Q46 13 75 33 Q55 27 42 54" fill="#B8A6D7" stroke="'+AI+'" stroke-width="2.5"/><ellipse cx="60" cy="79" rx="13" ry="8" fill="#F0E3D9"/>'),
exploratrice:human('#89553B','#251E1B','#B58A45','<ellipse cx="60" cy="34" rx="47" ry="9" fill="#795F38" stroke="'+AI+'" stroke-width="2.5"/><path d="M38 34 Q39 10 60 10 Q81 10 82 34Z" fill="#B58A45" stroke="'+AI+'" stroke-width="2.5"/>','<rect x="77" y="106" width="17" height="19" rx="3" fill="#775331" stroke="'+AI+'" stroke-width="2"/>'),
singe:beast('#A85F37','<circle cx="25" cy="39" r="13" fill="#A85F37" stroke="'+AI+'" stroke-width="2.5"/><circle cx="95" cy="39" r="13" fill="#A85F37" stroke="'+AI+'" stroke-width="2.5"/>','<ellipse cx="60" cy="71" rx="23" ry="19" fill="#F0C69D" stroke="'+AI+'" stroke-width="2.5"/><path d="M90 112 Q116 108 108 85" fill="none" stroke="#A85F37" stroke-width="8" stroke-linecap="round"/>'),
perroquet:beast('#38B9BC','<path d="M36 50 Q7 24 22 7 Q48 21 52 47 M84 50 Q113 24 98 7 Q72 21 68 47" fill="#F0C64D" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M59 68 Q86 66 82 83 Q69 95 59 81Z" fill="#F0A44B" stroke="'+AI+'" stroke-width="2.5"/><path d="M59 73 Q43 82 54 92 Q66 92 66 82Z" fill="#E86B57" stroke="'+AI+'" stroke-width="2"/>'),
jaguar:beast('#D7A34E','<circle cx="32" cy="43" r="13" fill="#D7A34E" stroke="'+AI+'" stroke-width="2.5"/><circle cx="88" cy="43" r="13" fill="#D7A34E" stroke="'+AI+'" stroke-width="2.5"/>','<ellipse cx="60" cy="77" rx="17" ry="11" fill="#F7E4C2" stroke="'+AI+'" stroke-width="2"/><g fill="none" stroke="#784B2B" stroke-width="3"><circle cx="36" cy="54" r="4"/><circle cx="84" cy="54" r="4"/><circle cx="42" cy="85" r="4"/><circle cx="78" cy="85" r="4"/><circle cx="60" cy="35" r="4"/></g>'),
horloger:human('#C98A62','#38251C','#80502E','<circle cx="86" cy="53" r="14" fill="none" stroke="#E9C56D" stroke-width="4"/><path d="M96 64 L108 78" stroke="#E9C56D" stroke-width="4" stroke-linecap="round"/>','<path d="M38 78 Q47 88 55 78 M65 78 Q73 88 82 78" fill="none" stroke="#493127" stroke-width="4" stroke-linecap="round"/><path d="M43 100 V130 M77 100 V130" stroke="#E8C18D" stroke-width="3"/>'),
gardienne:human('#A96E55','#1D6264','#237E82','<path d="M27 56 Q22 20 60 19 Q98 20 93 56 L90 102 L78 93 L80 52 Q60 40 40 52 L42 93 L29 102Z" fill="#1D6264" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M14 106 Q60 129 106 106 L112 130 H8Z" fill="#70B8AF" stroke="'+AI+'" stroke-width="2.5"/><path d="M83 81 V99 M77 87 L83 81 L89 87" stroke="#F3D078" stroke-width="2.5" fill="none"/><path d="M80 86 H86 V99 H80Z" fill="#F3D078"/>'),
robotcoucou:robot('#C69A61','#80562F','#F8EBCB','<rect x="13" y="103" width="94" height="25" rx="5" fill="#956A42" stroke="'+AI+'" stroke-width="2.5"/><circle cx="60" cy="115" r="10" fill="#E8C477" stroke="'+AI+'" stroke-width="2"/><path d="M60 115 V107 M60 115 L67 119" stroke="'+AI+'" stroke-width="2.5"/><path d="M82 39 Q90 16 105 25 L111 39 L98 46Z" fill="#E8BC5B" stroke="'+AI+'" stroke-width="2.5"/><circle cx="101" cy="32" r="3" fill="'+AI+'"/>'),
chouette:beast('#354A83','<path d="M29 49 Q12 9 43 28 L53 44 M91 49 Q108 9 77 28 L67 44" fill="#354A83" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M60 22 Q42 4 36 17 Q48 23 60 30 Q72 23 84 17 Q78 4 60 22Z" fill="#F5D76B" stroke="'+AI+'" stroke-width="2"/><path d="M56 78 L60 86 L64 78Z" fill="#E8B95A"/>'),
genie:human('#68C9C3','#176B78','#2DB6B2','<path d="M30 34 Q60 7 90 34 L81 41 Q60 26 39 41Z" fill="#E5B34F" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M28 100 Q10 115 28 125 Q45 132 59 118 Q46 128 39 117 Q34 109 44 102" fill="none" stroke="#68C9C3" stroke-width="10" stroke-linecap="round"/><path d="M78 97 Q94 86 106 96 Q98 105 82 104Z" fill="#E5B34F" stroke="'+AI+'" stroke-width="2.5"/>'),
savante:human('#E8B995','#5A3D35','#F7FAFC','<circle cx="47" cy="61" r="11" fill="none" stroke="#78AFC5" stroke-width="3"/><circle cx="73" cy="61" r="11" fill="none" stroke="#78AFC5" stroke-width="3"/><path d="M58 61 H62" stroke="#78AFC5" stroke-width="3"/>','<path d="M42 99 L60 114 L78 99" fill="#DCEAF0" stroke="'+AI+'" stroke-width="2"/><path d="M90 80 L102 61 L111 66 L99 88Z" fill="#A6DCCF" stroke="'+AI+'" stroke-width="2"/>'),
dragonlave:beast('#E85A3C','<path d="M37 45 L29 13 L51 34 M83 45 L91 13 L69 34" fill="#E85A3C" stroke="'+AI+'" stroke-width="2.5"/>','<path d="M37 84 Q5 29 10 14 Q40 25 56 68Z M83 84 Q115 29 110 14 Q80 25 64 68Z" fill="#F28B45" stroke="'+AI+'" stroke-width="2.5"/><g fill="#FFD16B"><path d="M42 96 L48 86 L54 97Z"/><path d="M57 99 L62 87 L68 99Z"/><path d="M72 96 L78 86 L84 97Z"/></g>'),
robotsavant:robot('#E6EEF2','#607989','#CFE8EB','<path d="M24 81 L10 96 L20 106 M96 81 L110 96 L100 106" fill="none" stroke="#DCE5EA" stroke-width="9" stroke-linecap="round"/><path d="M14 96 L6 103 L14 112 L24 103Z M106 96 L114 103 L106 112 L96 103Z" fill="#A7BBC7" stroke="'+AI+'" stroke-width="2"/>')
};
/* ---- Corrections v34 : visages dégagés, animaux reconnaissables ---- */
const O=(w)=>`stroke="${AI}" stroke-width="${w||2.5}" stroke-linejoin="round"`;
function eyes(xl,xr,y,rx,ry){rx=rx||5.2;ry=ry||6.6;return [xl,xr].map(x=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${AI}"/><circle cx="${x+1.8}" cy="${y-ry*.55}" r="${rx*.42}" fill="#fff"/><circle cx="${x-1.8}" cy="${y+ry*.45}" r="${rx*.2}" fill="#fff"/>`).join('')}
function cheeks(xl,xr,y){return `<ellipse cx="${xl}" cy="${y}" rx="6" ry="3.6" fill="#FF8FA3" opacity=".55"/><ellipse cx="${xr}" cy="${y}" rx="6" ry="3.6" fill="#FF8FA3" opacity=".55"/>`}
function smile(x1,x2,y,d){return `<path d="M${x1} ${y} Q${(x1+x2)/2} ${y+d} ${x2} ${y}" fill="none" stroke="${AM}" stroke-width="3" stroke-linecap="round"/>`}
const svg=(inner)=>`<svg viewBox="0 0 120 130">${inner}</svg>`;

// Sylvie la fée : les ailes passent DERRIÈRE la tête (elles cachaient le visage)
ART.fee=human('#C98663','#70422F','#79D6A5',
  `<path d="M27 55 Q22 22 60 18 Q98 22 93 55Z" fill="#70422F" ${O()}/>`,
  `<g fill="#F6C94E" ${O(1.5)}><circle cx="39" cy="28" r="5"/><circle cx="51" cy="21" r="5"/><circle cx="64" cy="20" r="5"/><circle cx="77" cy="28" r="5"/></g><g fill="#fff"><circle cx="39" cy="28" r="1.6"/><circle cx="51" cy="21" r="1.6"/><circle cx="64" cy="20" r="1.6"/><circle cx="77" cy="28" r="1.6"/></g>`,
  `<path d="M34 104 Q4 78 10 52 Q32 50 46 88Z M86 104 Q116 78 110 52 Q88 50 74 88Z" fill="#BCEFE1" ${O()}/><path d="M18 60 Q30 70 38 92 M102 60 Q90 70 82 92" fill="none" stroke="#8FD9C4" stroke-width="2.5"/>`);

// Dragons : vraie tête de dragon (museau, cornes, crête), ailes derrière le corps
function dragon(o){return svg(
  o.wings+o.tail+
  `<ellipse cx="60" cy="110" rx="31" ry="21" fill="${o.skin}" ${O()}/>`+
  `<ellipse cx="60" cy="114" rx="17" ry="13" fill="${o.belly}"/>`+
  `<path d="M46 106 H74 M45 114 H75 M48 122 H72" stroke="${o.bellyLine}" stroke-width="2.5"/>`+
  o.crest+o.horns+
  `<ellipse cx="60" cy="55" rx="31" ry="28" fill="${o.skin}" ${O()}/>`+
  `<ellipse cx="60" cy="72" rx="20" ry="12.5" fill="${o.snout}" ${O(2)}/>`+
  `<ellipse cx="54" cy="69" rx="2.2" ry="1.5" fill="${AI}"/><ellipse cx="66" cy="69" rx="2.2" ry="1.5" fill="${AI}"/>`+
  eyes(46,74,50)+(o.lashes||'')+cheeks(34,86,62)+smile(52,68,77,6)+(o.extra||''))}
ART.dragonciel=dragon({skin:'#75C8E9',belly:'#E3F8FF',bellyLine:'#B7E6F5',snout:'#B8E7F7',
  wings:`<path d="M40 102 C22 100 6 88 4 64 C12 69 18 67 20 61 C26 69 32 69 36 64 C36 77 40 86 46 90Z" fill="#DDF5FC" ${O()}/><path d="M80 102 C98 100 114 88 116 64 C108 69 102 67 100 61 C94 69 88 69 84 64 C84 77 80 86 74 90Z" fill="#DDF5FC" ${O()}/>`,
  tail:`<path d="M84 120 C104 126 114 110 104 100" fill="none" stroke="#75C8E9" stroke-width="9" stroke-linecap="round"/><path d="M100 99 L113 94 L109 108Z" fill="#4BA8D6" ${O(2)}/>`,
  crest:`<path d="M50 32 L54 18 L60 28 L66 18 L70 32Z" fill="#4BA8D6" ${O(2)}/>`,
  horns:`<path d="M40 38 Q30 16 43 19 Q44 29 49 33Z M80 38 Q90 16 77 19 Q76 29 71 33Z" fill="#FFF1CF" ${O(2)}/>`,
  extra:`<g fill="#fff" opacity=".9"><circle cx="20" cy="74" r="4"/><circle cx="27" cy="71" r="3"/><circle cx="100" cy="74" r="4"/><circle cx="93" cy="71" r="3"/></g>`});
ART.dragonlave=dragon({skin:'#E85A3C',belly:'#FFD16B',bellyLine:'#F4B547',snout:'#F7A07A',
  wings:`<path d="M40 100 L8 62 L19 66 L17 50 L29 60 L32 44 L46 84Z" fill="#F28B45" ${O()}/><path d="M80 100 L112 62 L101 66 L103 50 L91 60 L88 44 L74 84Z" fill="#F28B45" ${O()}/><path d="M40 98 L19 66 M40 98 L29 60 M80 98 L101 66 M80 98 L91 60" stroke="#C9512F" stroke-width="2"/>`,
  tail:`<path d="M84 120 C104 126 112 112 104 102" fill="none" stroke="#E85A3C" stroke-width="9" stroke-linecap="round"/><path d="M104 104 C98 96 104 88 110 86 C108 94 114 96 110 104Z" fill="#FFB04A" ${O(2)}/>`,
  crest:`<path d="M48 33 C42 22 48 13 53 6 C53 16 58 18 59 9 C66 16 64 22 66 12 C74 20 74 28 72 33Z" fill="#FFB04A" ${O(2)}/><path d="M54 32 C51 25 55 20 57 16 C58 22 62 22 63 18 C67 23 66 28 66 32Z" fill="#FFE07A"/>`,
  horns:`<path d="M38 40 Q26 22 40 22 Q42 32 47 35Z M82 40 Q94 22 80 22 Q78 32 73 35Z" fill="#7A2A1E" ${O(2)}/>`,
  lashes:`<path d="M39 45 L35 42 M40 49 L35 48 M81 45 L85 42 M80 49 L85 48" stroke="${AI}" stroke-width="2" stroke-linecap="round"/>`,
  extra:`<g fill="#FFD16B"><circle cx="34" cy="104" r="2.5"/><circle cx="86" cy="106" r="2.5"/><circle cx="40" cy="118" r="2"/></g>`});

// Ariane l'aigle : tête blanche, bec jaune crochu, ailes déployées (et non plus des oreilles)
ART.aigle=svg(
  `<path d="M40 106 C20 104 4 92 2 72 C10 75 14 71 14 64 C20 72 26 72 28 66 C32 77 38 82 46 84Z" fill="#7A4A24" ${O()}/>`+
  `<path d="M80 106 C100 104 116 92 118 72 C110 75 106 71 106 64 C100 72 94 72 92 66 C88 77 82 82 74 84Z" fill="#7A4A24" ${O()}/>`+
  `<path d="M14 76 L24 88 M26 70 L32 84 M106 76 L96 88 M94 70 L88 84" stroke="#A67442" stroke-width="2.5" stroke-linecap="round"/>`+
  `<ellipse cx="60" cy="111" rx="29" ry="21" fill="#8A5A2E" ${O()}/>`+
  `<path d="M48 100 L54 106 L60 100 L66 106 L72 100 M50 110 L56 116 L62 110 L68 116" fill="none" stroke="#B5814E" stroke-width="2.5" stroke-linecap="round"/>`+
  `<path d="M30 60 C28 36 44 26 60 26 C76 26 92 36 90 60 C90 79 76 89 60 89 C44 89 30 79 30 60Z" fill="#FFFDF6" ${O()}/>`+
  `<path d="M46 31 L49 18 L55 28 M58 27 L62 14 L66 27" fill="#FFFDF6" ${O(2)}/>`+
  eyes(48,72,53,4.8,6)+cheeks(38,82,66)+
  `<path d="M50 64 Q60 57 70 64 Q73 77 62 86 Q64 76 58 73 Q51 70 50 64Z" fill="#F4B52F" ${O(2.2)}/><circle cx="64" cy="66" r="1.4" fill="${AI}"/>`);

// Iris la perruche : tête ronde sans oreilles, masque jaune, bec crochu, joues bleues, longue queue
ART.perroquet=svg(
  `<path d="M70 110 L100 130 L86 130 L64 116Z" fill="#3A8FD6" ${O(2)}/><path d="M62 116 L82 130 L72 130Z" fill="#5AB0F2" ${O(2)}/>`+
  `<ellipse cx="60" cy="104" rx="27" ry="25" fill="#4FBF6A" ${O()}/>`+
  `<ellipse cx="57" cy="111" rx="15" ry="13" fill="#8FDE8E"/>`+
  `<path d="M75 88 C92 96 93 116 81 127 C74 116 70 102 75 88Z" fill="#2E9A57" ${O(2)}/><path d="M77 98 Q83 101 86 106 M76 108 Q82 111 84 116" fill="none" stroke="#7BD08A" stroke-width="2"/>`+
  `<path d="M51 30 Q47 14 56 18 Q59 8 64 18 Q73 14 69 30" fill="#36A35A" ${O(2)}/>`+
  `<circle cx="60" cy="53" r="27" fill="#4FBF6A" ${O()}/>`+
  `<ellipse cx="60" cy="61" rx="20" ry="18" fill="#FFE36E"/>`+
  `<path d="M40 40 Q60 30 80 40" fill="none" stroke="#36A35A" stroke-width="2.5"/>`+
  eyes(49,71,52,4.6,5.6)+
  `<ellipse cx="60" cy="58" rx="5" ry="2.6" fill="#5AB0F2"/>`+
  `<path d="M55 61 Q60 57 65 61 Q66 71 59 75 Q61 68 55 65Z" fill="#F2A24B" ${O(2)}/>`+
  `<circle cx="44" cy="68" r="3.6" fill="#3A8FD6"/><circle cx="76" cy="68" r="3.6" fill="#3A8FD6"/>`);

// Chevaux : museau allongé, crinière, oreilles en amande ; pégase = ailes, licorne = corne
function horse(o){return svg(
  (o.wings||'')+
  `<path d="M46 84 L74 84 L78 100 L42 100Z" fill="${o.coat}" ${O()}/>`+
  `<ellipse cx="60" cy="112" rx="28" ry="19" fill="${o.coat}" ${O()}/>`+
  o.maneBack+
  `<path d="M42 35 L39 13 L55 28Z M78 35 L81 13 L65 28Z" fill="${o.coat}" ${O(2)}/><path d="M43 30 L42 19 L50 27Z M77 30 L78 19 L70 27Z" fill="#F2C9D9"/>`+
  `<ellipse cx="60" cy="50" rx="25" ry="24" fill="${o.coat}" ${O()}/>`+
  `<ellipse cx="60" cy="74" rx="18" ry="14" fill="${o.muzzle}" ${O(2.2)}/>`+
  `<ellipse cx="54" cy="76" rx="2.4" ry="1.8" fill="#B08A80"/><ellipse cx="66" cy="76" rx="2.4" ry="1.8" fill="#B08A80"/>`+
  (o.horn||'')+o.forelock+
  eyes(49,71,50,4.8,6.2)+cheeks(39,81,60)+smile(54,66,82,4))}
ART.pegase=horse({coat:'#FFF8EF',muzzle:'#F1E1D6',
  wings:`<path d="M40 104 C18 102 4 86 4 62 C12 68 16 66 18 59 C22 69 28 69 30 63 C32 76 38 84 46 88Z" fill="#fff" ${O()}/><path d="M80 104 C102 102 116 86 116 62 C108 68 104 66 102 59 C98 69 92 69 90 63 C88 76 82 84 74 88Z" fill="#fff" ${O()}/><path d="M12 70 L24 86 M24 66 L32 82 M108 70 L96 86 M96 66 L88 82" stroke="#D8CCEE" stroke-width="2.5" stroke-linecap="round"/>`,
  maneBack:`<path d="M64 25 C38 19 21 44 25 80 C28 92 37 97 43 99 C38 86 38 70 45 55Z" fill="#B8A6D7" ${O(2)}/>`,
  forelock:`<path d="M45 31 C49 15 71 13 77 27 C69 26 64 34 62 45 C58 37 52 33 45 31Z" fill="#B8A6D7" ${O(2)}/>`});
ART.licorne=horse({coat:'#FFFDF8',muzzle:'#FBE8EE',
  maneBack:`<path d="M64 25 C38 19 21 44 25 80 C28 92 37 97 43 99 C38 86 38 70 45 55Z" fill="#F48FB8" ${O(2)}/><path d="M58 28 C40 28 30 46 32 74 C34 84 38 90 42 92 C40 80 40 66 46 54Z" fill="#B79BE0"/><path d="M52 31 C42 36 37 50 38 66 C40 74 42 80 44 82 C43 70 44 60 48 52Z" fill="#7FC8F0"/>`,
  horn:`<path d="M55 30 L60 2 L65 30Z" fill="#F6C94E" ${O(2)}/><path d="M57 22 L63 19 M56 14 L62 11 M58 26 L63 24" stroke="#D99A22" stroke-width="1.8"/>`,
  forelock:`<path d="M64 29 C74 26 81 34 78 46 C74 40 69 37 63 37Z" fill="#B79BE0" ${O(2)}/><path d="M66 31 C73 30 77 35 76 41 C73 37 70 35 66 35Z" fill="#F48FB8"/>`});

// Nocta la chouette des nuits : silhouette ronde de chouette, disque facial, grands yeux dorés, lune sur le ventre
ART.chouette=svg(
  `<ellipse cx="25" cy="88" rx="10" ry="24" fill="#26335E" ${O()} transform="rotate(14 25 88)"/><ellipse cx="95" cy="88" rx="10" ry="24" fill="#26335E" ${O()} transform="rotate(-14 95 88)"/>`+
  `<path d="M34 36 L29 15 L48 28Z M86 36 L91 15 L72 28Z" fill="#354A83" ${O(2)}/>`+
  `<path d="M60 22 C88 22 98 48 96 78 C94 110 80 128 60 128 C40 128 26 110 24 78 C22 48 32 22 60 22Z" fill="#354A83" ${O()}/>`+
  `<ellipse cx="60" cy="104" rx="20" ry="19" fill="#5B6FAE"/>`+
  `<path d="M64 92 A11 11 0 1 0 64 116 A8.5 8.5 0 1 1 64 92Z" fill="#F5D76B"/>`+
  `<g fill="#F5D76B"><circle cx="44" cy="98" r="1.6"/><circle cx="76" cy="112" r="1.6"/><circle cx="48" cy="114" r="1.2"/></g>`+
  `<circle cx="46" cy="56" r="15" fill="#C9D4F2"/><circle cx="74" cy="56" r="15" fill="#C9D4F2"/>`+
  `<circle cx="46" cy="56" r="9" fill="#FFD54A" ${O(2)}/><circle cx="74" cy="56" r="9" fill="#FFD54A" ${O(2)}/>`+
  eyes(46,74,57,4.4,5.2)+
  `<path d="M56 68 L60 79 L64 68Z" fill="#F2A24B" ${O(2)}/>`+cheeks(33,87,72));

// Kiko le singe : le museau clair recouvrait les yeux ; masque clair autour des yeux, yeux dessinés PAR-DESSUS
ART.singe=svg(
  `<path d="M86 116 C108 120 116 100 106 88 C100 82 94 88 98 94" fill="none" stroke="#A85F37" stroke-width="7" stroke-linecap="round"/>`+
  `<circle cx="25" cy="54" r="13" fill="#A85F37" ${O()}/><circle cx="25" cy="54" r="7" fill="#F0C69D"/>`+
  `<circle cx="95" cy="54" r="13" fill="#A85F37" ${O()}/><circle cx="95" cy="54" r="7" fill="#F0C69D"/>`+
  `<ellipse cx="60" cy="110" rx="30" ry="21" fill="#A85F37" ${O()}/><ellipse cx="60" cy="114" rx="16" ry="13" fill="#F0C69D"/>`+
  `<path d="M54 30 Q56 18 62 22 M60 29 Q66 16 70 24" fill="none" stroke="#A85F37" stroke-width="4" stroke-linecap="round"/>`+
  `<ellipse cx="60" cy="56" rx="31" ry="29" fill="#A85F37" ${O()}/>`+
  `<path d="M60 44 C52 36 34 38 34 54 C34 62 38 66 42 70 C40 78 46 88 60 88 C74 88 80 78 78 70 C82 66 86 62 86 54 C86 38 68 36 60 44Z" fill="#F0C69D" ${O(2)}/>`+
  eyes(48,72,55,4.8,6.2)+
  `<ellipse cx="56" cy="70" rx="1.8" ry="1.4" fill="${AI}"/><ellipse cx="64" cy="70" rx="1.8" ry="1.4" fill="${AI}"/>`+
  cheeks(40,80,67)+smile(51,69,77,7));

// Max le robot savant : tête en dôme et lunettes de labo (Bolt a une tête carrée et des chenilles)
ART.robotsavant=svg(
  `<path d="M34 104 L14 96 L10 106 M86 104 L106 96 L110 106" fill="none" stroke="#C9D6DE" stroke-width="8" stroke-linecap="round"/>`+
  `<path d="M6 104 L10 98 L16 104 L10 112Z M114 104 L110 98 L104 104 L110 112Z" fill="#7DCFC9" ${O(2)}/>`+
  `<ellipse cx="60" cy="113" rx="29" ry="20" fill="#F4F8FA" ${O()}/>`+
  `<path d="M47 95 L60 112 L73 95" fill="#DCEAF0" ${O(2)}/>`+
  `<rect x="67" y="108" width="11" height="10" rx="2" fill="#DCEAF0" ${O(1.8)}/><path d="M70 108 V102 M74 108 V103" stroke="#E8573A" stroke-width="2.5" stroke-linecap="round"/>`+
  `<rect x="54" y="82" width="12" height="12" rx="3" fill="#A7BBC7" ${O(2)}/>`+
  `<rect x="55" y="6" width="10" height="20" rx="5" fill="#F4F8FA" ${O(2)}/><rect x="56.5" y="15" width="7" height="9.5" rx="3.5" fill="#7CDB8A"/><circle cx="60" cy="13" r="1.5" fill="#7CDB8A"/>`+
  `<circle cx="29" cy="56" r="6" fill="#A7BBC7" ${O(2)}/><circle cx="91" cy="56" r="6" fill="#A7BBC7" ${O(2)}/>`+
  `<circle cx="60" cy="54" r="31" fill="#E6EEF2" ${O(3)}/>`+
  `<path d="M40 38 Q50 28 64 28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`+
  `<circle cx="47" cy="55" r="11" fill="#CFF3EE" stroke="#4FC3C1" stroke-width="4"/><circle cx="73" cy="55" r="11" fill="#CFF3EE" stroke="#4FC3C1" stroke-width="4"/><path d="M58 55 H62" stroke="#4FC3C1" stroke-width="4"/>`+
  eyes(47,73,56,4.4,5.4)+cheeks(36,84,71)+smile(52,68,73,6));
return ART;
})();
function charArtSVG(id){return CHAR_ART[id]||''}
function charFace(id,cls){const c=CHARACTERS[id],svg=charArtSVG(id);return svg?'<span class="char-art '+(cls||'')+'" role="img" aria-label="'+c.name+' '+c.title+'">'+svg+'</span>':'<span class="'+(cls||'')+'">'+(c?c.emoji:'❔')+'</span>'}
