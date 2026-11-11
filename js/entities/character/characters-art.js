/* 32 mascottes SVG originales, aplats uniquement.
   Tout le dessin est enfermé dans une fonction : seuls CHAR_ART, charArtSVG
   et charFace sont globaux (le jeu n'a pas de modules, des noms comme
   « face » ou « robot » entreraient vite en collision). */
import { CHARACTERS } from './characters.js';

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

// Jago et Maïa : le museau clair recouvrait la bouche ; nez et bouche dessinés PAR-DESSUS
ART.jaguar=ART.jaguar.replace('</svg>',
  `<path d="M55 71 Q60 68 65 71 Q63 76 60 76 Q57 76 55 71Z" fill="#6B3A2A"/>`+
  `<path d="M60 76 V79 M52 79 Q56 85 60 79 Q64 85 68 79" fill="none" stroke="${AM}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
ART.biche=ART.biche.replace('</svg>',
  `<path d="M60 79 V81 M54 81 Q60 87 66 81" fill="none" stroke="${AM}" stroke-width="2.6" stroke-linecap="round"/></svg>`);

// Prince Tao : la visière descendait sur les yeux ; casque relevé sur le front, plumet rouge
ART.chevalier=human('#9B674C','#38271F','#315C98',
  `<path d="M25 46 C27 20 44 12 60 12 C76 12 93 20 95 46 C86 38 74 34 60 34 C46 34 34 38 25 46Z" fill="#C9D3DE" ${O()}/>`+
  `<path d="M30 42 C40 36 50 34 60 34 C70 34 80 36 90 42" fill="none" stroke="#97A6B6" stroke-width="3"/>`+
  `<path d="M38 26 Q60 18 82 26" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`+
  `<path d="M60 12 C56 2 64 -2 70 2 C66 6 68 9 64 12Z" fill="#E85E63" ${O(2)}/>`,
  `<path d="M43 99 L60 116 L77 99" fill="#E8EDF2" ${O(2)}/><path d="M60 109 L66 117 L60 126 L54 117Z" fill="#F4C95C" ${O(2)}/>`+
  `<path d="M22 130 C22 112 28 103 36 99 L39 130Z M98 130 C98 112 92 103 84 99 L81 130Z" fill="#97A6B6" ${O(2)}/>`);

// Hector le hibou : ressemblait à un chat à lunettes ; corps de hibou, aigrettes, disque facial, ailes, ventre plumeux
ART.hibou=svg(
  `<ellipse cx="24" cy="92" rx="10" ry="24" fill="#7A4A2A" ${O()} transform="rotate(14 24 92)"/><ellipse cx="96" cy="92" rx="10" ry="24" fill="#7A4A2A" ${O()} transform="rotate(-14 96 92)"/>`+
  `<path d="M36 34 L30 12 L50 28Z M84 34 L90 12 L70 28Z" fill="#98613F" ${O(2)}/>`+
  `<path d="M60 22 C88 22 98 48 96 78 C94 110 80 128 60 128 C40 128 26 110 24 78 C22 48 32 22 60 22Z" fill="#98613F" ${O()}/>`+
  `<ellipse cx="60" cy="104" rx="21" ry="20" fill="#E8C9A0"/>`+
  `<path d="M48 96 q4 4 8 0 q4 4 8 0 q4 4 8 0 M46 106 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 M50 116 q4 4 8 0 q4 4 8 0 q4 4 8 0" fill="none" stroke="#B88A5A" stroke-width="2" stroke-linecap="round"/>`+
  `<circle cx="46" cy="56" r="15" fill="#E8C9A0"/><circle cx="74" cy="56" r="15" fill="#E8C9A0"/>`+
  eyes(46,74,57,4.8,6)+
  `<circle cx="46" cy="57" r="11" fill="none" stroke="#5A3A22" stroke-width="2.5"/><circle cx="74" cy="57" r="11" fill="none" stroke="#5A3A22" stroke-width="2.5"/><path d="M57 55 Q60 52 63 55" fill="none" stroke="#5A3A22" stroke-width="2.5"/>`+
  `<path d="M56 68 L60 79 L64 68Z" fill="#E8B94F" ${O(2)}/>`+cheeks(33,87,72));

// ---- Pays Squishy : personnages tout ronds, le visage sur le corps ----
// Mimi la chatte mochi : boule blanc-rose, oreilles pointues, nœud, petites pattes
ART.mochichat=svg(
  `<path d="M96 104 C114 104 116 84 104 80" fill="none" stroke="#F3D3DE" stroke-width="9" stroke-linecap="round"/>`+
  `<path d="M28 52 L26 22 L50 38Z M92 52 L94 22 L70 38Z" fill="#FFF4F7" ${O()}/><path d="M31 44 L30 29 L43 38Z M89 44 L90 29 L77 38Z" fill="#FFB3CC"/>`+
  `<path d="M60 30 C92 30 108 54 108 80 C108 108 88 124 60 124 C32 124 12 108 12 80 C12 54 28 30 60 30Z" fill="#FFF4F7" ${O()}/>`+
  `<ellipse cx="40" cy="120" rx="10" ry="6" fill="#FFF4F7" ${O(2)}/><ellipse cx="80" cy="120" rx="10" ry="6" fill="#FFF4F7" ${O(2)}/>`+
  `<path d="M76 34 L88 26 L88 42Z M76 34 L64 26 L64 42Z" fill="#FF8FB8" ${O(2)}/><circle cx="76" cy="34" r="4" fill="#E2679A" ${O(1.5)}/>`+
  eyes(45,75,74,5.4,6.8)+cheeks(32,88,86)+
  `<path d="M57 82 L63 82 L60 86Z" fill="#FF8FB8"/><path d="M60 86 Q55 92 51 88 M60 86 Q65 92 69 88" fill="none" stroke="${AM}" stroke-width="2.4" stroke-linecap="round"/>`+
  `<path d="M22 80 H8 M23 86 L10 90 M98 80 H112 M97 86 L110 90" stroke="#D9B8C4" stroke-width="2" stroke-linecap="round"/>`);

// Pépito le donut : glaçage rose ondulé, vermicelles, visage sous le trou
ART.donut=svg(
  `<ellipse cx="60" cy="74" rx="52" ry="50" fill="#E8B07A" ${O()}/>`+
  `<path d="M60 30 C78 28 98 40 102 58 C106 72 98 76 100 88 C102 100 90 112 76 108 C68 114 52 114 44 108 C30 112 18 100 20 88 C22 76 14 72 18 58 C22 40 42 28 60 30Z" fill="#FF9CC8" ${O(2.4)}/>`+
  `<ellipse cx="60" cy="56" rx="13" ry="11" fill="#C98B52" ${O(2.4)}/><ellipse cx="60" cy="58" rx="8" ry="5" fill="#A86F3E"/>`+
  `<g stroke-linecap="round" stroke-width="4"><path d="M36 46 l6 -4" stroke="#FFE07A"/><path d="M84 46 l-6 -4" stroke="#6FB8F5"/><path d="M30 64 l2 7" stroke="#6ED38C"/><path d="M90 64 l-2 7" stroke="#FFE07A"/><path d="M44 36 l5 2" stroke="#BFA3EC"/><path d="M76 36 l-5 2" stroke="#fff"/><path d="M36 100 l6 3" stroke="#6FB8F5"/><path d="M84 100 l-6 3" stroke="#BFA3EC"/></g>`+
  eyes(46,74,84,5,6.4)+cheeks(34,86,94)+smile(52,68,95,7)+
  `<path d="M60 30 C78 28 98 40 102 58" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>`);

// Avo l'avocat : forme de poire, chair vert clair, noyau-ventre, petites joues
ART.avocat=svg(
  `<path d="M60 6 C80 6 88 26 92 44 C100 62 108 78 106 96 C104 116 86 128 60 128 C34 128 16 116 14 96 C12 78 20 62 28 44 C32 26 40 6 60 6Z" fill="#3E8E4A" ${O()}/>`+
  `<path d="M60 16 C75 16 81 32 84 47 C90 62 97 78 95 94 C93 110 80 118 60 118 C40 118 27 110 25 94 C23 78 30 62 36 47 C39 32 45 16 60 16Z" fill="#CDEB9A"/>`+
  `<path d="M60 22 C72 22 77 36 79 48 C84 60 90 74 89 88" fill="none" stroke="#E6F7C4" stroke-width="5" stroke-linecap="round"/>`+
  `<circle cx="60" cy="92" r="19" fill="#A0673A" ${O(2.4)}/><ellipse cx="54" cy="86" rx="5" ry="3.5" fill="#C99364" transform="rotate(-30 54 86)"/>`+
  eyes(49,71,52,4.8,6.2)+cheeks(39,81,62)+smile(54,66,63,6)+
  `<path d="M22 94 Q12 92 12 84 M98 94 Q108 92 108 84" fill="none" stroke="#3E8E4A" stroke-width="5" stroke-linecap="round"/>`);

// Bulle la petite phoque : boule gris-bleu, museau blanc, moustaches, nageoires
ART.phoque=svg(
  `<path d="M100 112 C112 112 118 104 116 96 C110 102 104 104 96 104Z" fill="#9DB3C8" ${O(2)}/>`+
  `<path d="M60 26 C90 26 106 50 106 78 C106 108 86 124 60 124 C34 124 14 108 14 78 C14 50 30 26 60 26Z" fill="#C9D6E3" ${O()}/>`+
  `<ellipse cx="60" cy="104" rx="26" ry="16" fill="#E6EEF5"/>`+
  `<ellipse cx="22" cy="104" rx="12" ry="7" fill="#9DB3C8" ${O(2)} transform="rotate(-30 22 104)"/><ellipse cx="98" cy="104" rx="12" ry="7" fill="#9DB3C8" ${O(2)} transform="rotate(30 98 104)"/>`+
  `<path d="M38 44 Q46 38 54 42" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`+
  eyes(44,76,62,5.4,6.8)+cheeks(30,90,74)+
  `<ellipse cx="51" cy="78" rx="10" ry="8" fill="#fff" ${O(2)}/><ellipse cx="69" cy="78" rx="10" ry="8" fill="#fff" ${O(2)}/>`+
  `<ellipse cx="60" cy="72" rx="5" ry="3.6" fill="${AI}"/>`+
  `<g fill="#8FA4B8"><circle cx="47" cy="78" r="1.3"/><circle cx="53" cy="81" r="1.3"/><circle cx="67" cy="81" r="1.3"/><circle cx="73" cy="78" r="1.3"/></g>`+
  `<path d="M42 78 H28 M43 83 L30 87 M78 78 H92 M77 83 L90 87" stroke="#7C8E99" stroke-width="1.8" stroke-linecap="round"/>`+
  `<path d="M56 88 Q60 92 64 88" fill="none" stroke="${AM}" stroke-width="2.4" stroke-linecap="round"/>`);

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
// ---- Saison 2, le Monde des Boîtes (v55) ----
// Capucine la capybara : corps carré tout doux, museau, lunettes rondes, carnet de directrice
ART.capucine=svg(
  `<ellipse cx="30" cy="34" rx="9" ry="8" fill="#A06A3E" ${O()}/><ellipse cx="90" cy="34" rx="9" ry="8" fill="#A06A3E" ${O()}/>`+
  `<rect x="14" y="28" width="92" height="96" rx="34" fill="#C08A55" ${O()}/>`+
  `<ellipse cx="60" cy="106" rx="30" ry="16" fill="#E2B98A"/>`+
  `<path d="M30 44 Q40 36 52 38" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>`+
  eyes(44,76,58,4.4,5.6)+
  `<circle cx="44" cy="58" r="11" fill="none" stroke="#5A3A22" stroke-width="2.5"/><circle cx="76" cy="58" r="11" fill="none" stroke="#5A3A22" stroke-width="2.5"/><path d="M55 57 Q60 54 65 57" fill="none" stroke="#5A3A22" stroke-width="2.5"/>`+
  `<ellipse cx="60" cy="82" rx="20" ry="13" fill="#9C6B42" ${O(2)}/><ellipse cx="53" cy="79" rx="3" ry="2.2" fill="${AI}"/><ellipse cx="67" cy="79" rx="3" ry="2.2" fill="${AI}"/>`+
  `<path d="M54 88 Q60 92 66 88" fill="none" stroke="${AM}" stroke-width="2.4" stroke-linecap="round"/>`+cheeks(28,92,74)+
  `<rect x="80" y="96" width="24" height="28" rx="3" fill="#FFF7E8" ${O(2)}/><path d="M85 104 H99 M85 110 H99 M85 116 H95" stroke="#C79A63" stroke-width="2"/>`);

// Kiki le chat-dans-la-boîte : la tête et les pattes dépassent d'un carton ouvert
ART.kiki=svg(
  `<path d="M30 46 L26 14 L52 32Z M90 46 L94 14 L68 32Z" fill="#F2A65A" ${O()}/><path d="M33 38 L31 22 L45 32Z M87 38 L89 22 L75 32Z" fill="#FFC9D6"/>`+
  `<ellipse cx="60" cy="58" rx="36" ry="32" fill="#F2A65A" ${O()}/>`+
  `<path d="M46 30 L49 40 M60 27 V38 M74 30 L71 40" stroke="#D9803A" stroke-width="4" stroke-linecap="round"/>`+
  eyes(46,74,56,5,6.4)+cheeks(34,86,68)+
  `<path d="M57 66 L63 66 L60 70Z" fill="#FF8FB8"/><path d="M60 70 Q55 76 51 72 M60 70 Q65 76 69 72" fill="none" stroke="${AM}" stroke-width="2.4" stroke-linecap="round"/>`+
  `<path d="M24 64 H10 M25 70 L12 74 M96 64 H110 M95 70 L108 74" stroke="#B5763A" stroke-width="2" stroke-linecap="round"/>`+
  `<path d="M14 84 L60 76 L106 84 L106 128 L14 128Z" fill="#E3B57E" ${O()}/><path d="M14 84 L2 70 L48 64 L60 76Z M106 84 L118 70 L72 64 L60 76Z" fill="#EFC896" ${O(2)}/>`+
  `<ellipse cx="42" cy="86" rx="9" ry="6" fill="#F2A65A" ${O(2)}/><ellipse cx="78" cy="86" rx="9" ry="6" fill="#F2A65A" ${O(2)}/>`+
  `<path d="M60 92 V128" stroke="#C79A63" stroke-width="6"/>`);

// Boulon le robot en carton : tête-boîte avec une bande de scotch, il tient un cube
ART.boulon=svg(
  `<path d="M25 130 L30 98 H90 L95 130Z" fill="#D19C62" ${O()}/>`+
  `<rect x="24" y="31" width="72" height="67" rx="10" fill="#E3B57E" ${O(3)}/>`+
  `<rect x="54" y="32.5" width="12" height="64" fill="#F3D9A8" opacity=".9"/>`+
  `<rect x="32" y="42" width="56" height="44" rx="8" fill="#FFF4E0" ${O(2)}/>`+
  eyes(47,73,61,5,6.4)+cheeks(38,82,74)+smile(52,68,75,6)+
  `<path d="M60 31 V15" stroke="${AI}" stroke-width="3"/><circle cx="60" cy="12" r="5" fill="#FF9CC8" ${O(2)}/>`+
  `<path d="M24 50 L12 44 M96 50 L108 44" stroke="#8A5A2B" stroke-width="3" stroke-linecap="round"/>`+
  `<rect x="14" y="100" width="28" height="26" rx="3" fill="#C9E7FB" ${O(2)}/><path d="M14 110 H42 M28 100 V126" stroke="#5B8FC7" stroke-width="2"/>`);

// Lola la livreuse : casquette rose, sac à colis, trottinette
ART.lola=human('#C98663','#3B2A24','#6FB8F5',
  `<path d="M24 44 Q30 16 60 16 Q90 16 96 44Z" fill="#FF8FB8" ${O()}/><path d="M86 41 L112 45 L108 52 L86 49Z" fill="#FF8FB8" ${O(2)}/>`,
  `<rect x="76" y="100" width="30" height="24" rx="4" fill="#E3B57E" ${O(2)}/><path d="M76 108 H106" stroke="#C79A63" stroke-width="2"/>`+
  `<path d="M8 126 H104 M14 126 L20 100" stroke="#5E6B7C" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="126" r="4" fill="#5E6B7C"/><circle cx="100" cy="126" r="4" fill="#5E6B7C"/>`);
// ---- Saison 2, le Coffre aux Jouets Doux (idée de la joueuse) ----
// Nougat l'ourson en guimauve : tout blanc crème, oreilles roses, ruban et clé du coffre
ART.nougat=svg(
  `<circle cx="30" cy="30" r="13" fill="#FFF4E8" ${O()}/><circle cx="90" cy="30" r="13" fill="#FFF4E8" ${O()}/>`+
  `<circle cx="30" cy="30" r="6.5" fill="#FFC2D6"/><circle cx="90" cy="30" r="6.5" fill="#FFC2D6"/>`+
  `<rect x="14" y="24" width="92" height="102" rx="40" fill="#FFF4E8" ${O()}/>`+
  `<path d="M18 84 Q60 96 102 84" fill="none" stroke="#F3DCC8" stroke-width="3"/>`+
  `<path d="M30 44 Q40 36 52 38" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`+
  eyes(46,74,56,4.8,6)+cheeks(32,88,68)+
  `<ellipse cx="60" cy="72" rx="13" ry="9" fill="#F7DDC8" ${O(2)}/><ellipse cx="60" cy="68.5" rx="4.4" ry="3.2" fill="${AI}"/>`+
  `<path d="M55 75 Q60 79 65 75" fill="none" stroke="${AM}" stroke-width="2.4" stroke-linecap="round"/>`+
  `<path d="M38 96 Q60 108 82 96" fill="none" stroke="#FF8FB8" stroke-width="5" stroke-linecap="round"/>`+
  `<circle cx="60" cy="108" r="6" fill="#FFD95A" ${O(2)}/><path d="M60 114 V125 M60 121 H66" stroke="#B8901A" stroke-width="3" stroke-linecap="round"/>`);

// Cocotte la lapine mochi : une boule rose toute ronde, longues oreilles, un cube menthe
ART.cocotte=svg(
  `<ellipse cx="42" cy="28" rx="10" ry="24" fill="#FFE4EE" ${O()} transform="rotate(-12 42 28)"/><ellipse cx="78" cy="28" rx="10" ry="24" fill="#FFE4EE" ${O()} transform="rotate(12 78 28)"/>`+
  `<ellipse cx="42" cy="30" rx="4.5" ry="15" fill="#FFB3CC" transform="rotate(-12 42 30)"/><ellipse cx="78" cy="30" rx="4.5" ry="15" fill="#FFB3CC" transform="rotate(12 78 30)"/>`+
  `<path d="M60 46 C94 46 110 72 108 98 C106 120 86 126 60 126 C34 126 14 120 12 98 C10 72 26 46 60 46Z" fill="#FFE4EE" ${O()}/>`+
  `<path d="M28 66 Q36 56 48 56" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`+
  eyes(46,74,82,4.8,6)+cheeks(32,88,94)+
  `<path d="M57 90 L63 90 L60 93.5Z" fill="#FF8FB8"/><path d="M60 94 Q56 99 52 96 M60 94 Q64 99 68 96" fill="none" stroke="${AM}" stroke-width="2.2" stroke-linecap="round"/>`+
  `<rect x="86" y="102" width="20" height="20" rx="5" fill="#BFF0DA" ${O(2)}/><circle cx="96" cy="112" r="4" fill="#fff" opacity=".8"/>`);

// Gloups le poulpe tout mou : tête ronde bleu pâle, huit petits bras, un grand sourire
ART.gloups=svg(
  `<g fill="#A9C9F5" ${O(2.4)}>`+
  `<path d="M22 90 C8 98 6 116 16 120 C22 112 28 104 36 100Z"/><path d="M98 90 C112 98 114 116 104 120 C98 112 92 104 84 100Z"/>`+
  `<path d="M36 100 C28 112 30 126 40 126 C42 116 46 108 50 104Z"/><path d="M84 100 C92 112 90 126 80 126 C78 116 74 108 70 104Z"/>`+
  `<path d="M50 104 C48 116 52 128 60 128 C68 128 72 116 70 104Z"/></g>`+
  `<g fill="#D6E7FC"><circle cx="14" cy="112" r="2"/><circle cx="106" cy="112" r="2"/><circle cx="60" cy="120" r="2"/></g>`+
  `<path d="M60 14 C92 14 106 40 104 66 C102 92 84 104 60 104 C36 104 18 92 16 66 C14 40 28 14 60 14Z" fill="#A9C9F5" ${O()}/>`+
  `<g fill="#D6E7FC"><circle cx="78" cy="30" r="4"/><circle cx="88" cy="46" r="3"/></g>`+
  `<path d="M30 44 Q38 32 52 30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`+
  eyes(46,74,62,5.2,6.6)+cheeks(32,88,76)+smile(50,70,78,9));

// Rainette la grenouille squishy : verte, yeux sur la tête, ventre clair, petites taches
ART.rainette=svg(
  `<circle cx="36" cy="36" r="17" fill="#7FD49A" ${O()}/><circle cx="84" cy="36" r="17" fill="#7FD49A" ${O()}/>`+
  `<path d="M60 34 C96 34 112 60 110 88 C108 116 88 126 60 126 C32 126 12 116 10 88 C8 60 24 34 60 34Z" fill="#7FD49A" ${O()}/>`+
  `<ellipse cx="60" cy="102" rx="30" ry="18" fill="#D6F5DE"/>`+
  `<circle cx="36" cy="36" r="9" fill="#fff"/><circle cx="84" cy="36" r="9" fill="#fff"/>`+
  `<circle cx="37" cy="37" r="5" fill="${AI}"/><circle cx="85" cy="37" r="5" fill="${AI}"/><circle cx="38.5" cy="35" r="1.8" fill="#fff"/><circle cx="86.5" cy="35" r="1.8" fill="#fff"/>`+
  cheeks(28,92,70)+
  `<path d="M40 68 Q60 84 80 68" fill="none" stroke="${AM}" stroke-width="2.6" stroke-linecap="round"/>`+
  `<path d="M24 58 Q30 50 40 50" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>`+
  `<g fill="#5DBB7C"><circle cx="22" cy="90" r="3"/><circle cx="98" cy="94" r="3.5"/><circle cx="90" cy="78" r="2.4"/></g>`);
// ---- Saison 2, le Royaume des Bonbons ----
// Praline la reine pâtissière : toque blanche et petite couronne dorée, tablier à la cerise
ART.praline=human('#F0C4AA','#8A4A2B','#FF8FB8',
  `<path d="M30 40 C18 36 20 16 34 18 C34 6 50 2 58 12 C64 2 84 4 84 18 C98 16 102 36 90 40Z" fill="#fff" ${O()}/>`+
  `<rect x="30" y="34" width="60" height="10" rx="4" fill="#FFE3EC" ${O(2)}/>`+
  `<path d="M47 15 L51 4 L57 11 L61 1 L65 11 L71 4 L75 15Z" fill="#FFD95A" ${O(2)}/>`,
  `<path d="M42 100 H78 L84 130 H36Z" fill="#fff" ${O(2)}/><circle cx="58" cy="115" r="5" fill="#E8344E"/><circle cx="65" cy="117" r="5" fill="#E8344E"/><path d="M58 110 Q62 104 68 104 M65 112 Q66 106 68 104" stroke="#3E8E4A" stroke-width="2" fill="none"/>`);

// Chouquette la petite pâtissière : un cupcake tout rond, crème rose, cerise sur la tête
ART.chouquette=svg(
  `<path d="M24 78 L96 78 L86 126 L34 126Z" fill="#9FDCF5" ${O()}/>`+
  `<path d="M40 80 L44 124 M57 80 L58 126 M73 80 L71 124 M88 82 L83 122" stroke="#6FB8F5" stroke-width="3"/>`+
  `<path d="M18 80 C6 72 12 52 28 54 C24 36 42 26 54 34 C58 18 80 20 82 36 C96 32 108 48 98 60 C110 66 104 84 92 82Z" fill="#FFD1E3" ${O()}/>`+
  `<path d="M28 50 Q36 40 48 42" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`+
  `<g stroke-linecap="round" stroke-width="3.5"><path d="M30 70 l5 -2" stroke="#FFD95A"/><path d="M92 68 l-4 -3" stroke="#6ED38C"/><path d="M84 46 l4 3" stroke="#6FB8F5"/><path d="M38 40 l4 -3" stroke="#BFA3EC"/></g>`+
  eyes(46,74,60,4.6,5.8)+cheeks(33,87,70)+smile(52,68,70,6)+
  `<circle cx="66" cy="22" r="8" fill="#E8344E" ${O(2)}/><path d="M66 14 Q70 6 77 5" stroke="#3E8E4A" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);

// Cacao le chocolatier : un ourson couleur chocolat, petite toque, une tablette à la main
ART.cacao=beast('#8B5A3C',
  `<circle cx="30" cy="36" r="12" fill="#8B5A3C" ${O()}/><circle cx="90" cy="36" r="12" fill="#8B5A3C" ${O()}/><circle cx="30" cy="36" r="6" fill="#C99364"/><circle cx="90" cy="36" r="6" fill="#C99364"/>`,
  `<path d="M42 32 C34 28 36 14 46 16 C48 6 60 4 64 12 C70 4 84 8 80 18 C88 20 86 32 78 34Z" fill="#fff" ${O(2)}/><rect x="42" y="28" width="36" height="8" rx="3" fill="#F2E6DA" ${O(1.8)}/>`+
  `<ellipse cx="60" cy="108" rx="20" ry="13" fill="#C99364"/>`+
  `<rect x="80" y="96" width="22" height="28" rx="3" fill="#6B3E26" ${O(2)}/><path d="M80 105 H102 M80 114 H102 M91 96 V124" stroke="#8B5A3C" stroke-width="2"/>`);

// Berlingot le marchand de bonbons : bonnet rayé à pompon, gilet menthe, grosse sucette
ART.berlingot=human('#C98663','#2B2140','#6ED38C',
  `<path d="M26 44 Q28 16 60 14 Q92 16 94 44Z" fill="#FF8FB8" ${O()}/><path d="M42 20 L38 42 M60 14 V42 M78 20 L82 42" stroke="#fff" stroke-width="5"/><circle cx="60" cy="12" r="6" fill="#FFD95A" ${O(2)}/>`,
  `<path d="M42 100 L38 130 M78 100 L82 130" stroke="#FF8FB8" stroke-width="6"/>`+
  `<rect x="98" y="84" width="5" height="40" rx="2.5" fill="#fff" ${O(1.5)}/><circle cx="100" cy="76" r="14" fill="#FF8FB8" ${O(2)}/><path d="M100 76 m-8 0 a8 8 0 1 1 8 8 a4.5 4.5 0 1 1 -4.5 -4.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
// ---- Saison 2, l'Île de la Musique ----
// Viola la violoniste, cheffe d'orchestre : chignon, robe bleu nuit, violon et archet
ART.viola=human('#E8B69D','#2B2140','#2B2F6B',
  `<circle cx="60" cy="16" r="10" fill="#2B2140" ${O()}/><path d="M50 10 L54 2 L60 8 L66 2 L70 10" fill="none" stroke="#FFD95A" stroke-width="3" stroke-linejoin="round"/>`,
  `<path d="M44 98 L60 108 L76 98" fill="none" stroke="#FFD95A" stroke-width="4" stroke-linejoin="round"/>`+
  `<g transform="rotate(-28 30 106)"><path d="M22 94 C13 94 13 104 19 106 C13 108 13 118 22 118 L38 118 C47 118 47 108 41 106 C47 104 47 94 38 94Z" fill="#B5652E" ${O(2)}/><rect x="28" y="72" width="4" height="22" fill="#5A3A22"/><path d="M27 104 h6 M27 110 h6" stroke="#5A3A22" stroke-width="2"/></g>`+
  `<path d="M6 90 L56 124" stroke="#8A5A2B" stroke-width="3" stroke-linecap="round"/>`);

// Boumbo le petit tambour : un tambour rouge à frange dorée, deux baguettes sur la tête
ART.boumbo=svg(
  `<path d="M40 34 L22 6 M80 34 L98 6" stroke="#C99364" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="6" r="5" fill="#FFF4E0" ${O(1.5)}/><circle cx="98" cy="6" r="5" fill="#FFF4E0" ${O(1.5)}/>`+
  `<rect x="14" y="40" width="92" height="80" rx="14" fill="#E8573A" ${O()}/>`+
  `<ellipse cx="60" cy="40" rx="46" ry="14" fill="#FFF4E0" ${O()}/>`+
  `<path d="M30 36 Q44 30 58 32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`+
  eyes(46,74,70,4.8,6)+cheeks(31,89,82)+smile(52,68,82,7)+
  `<rect x="12" y="96" width="96" height="8" rx="4" fill="#FFD95A" ${O(2)}/>`+
  `<path d="M18 106 L28 118 L38 106 L48 118 L58 106 L68 118 L78 106 L88 118 L98 106" fill="none" stroke="#FFD95A" stroke-width="3" stroke-linejoin="round"/>`);

// Flûtine la flûte enchantée : cheveux turquoise, couronne de fleurs, une flûte dans les mains
ART.flutine=human('#F0C4AA','#3FB3BA','#FFD95A',
  `<g ${O(1.6)}><circle cx="36" cy="30" r="6" fill="#FF8FB8"/><circle cx="50" cy="22" r="6" fill="#FFF3A6"/><circle cx="70" cy="22" r="6" fill="#BFA3EC"/><circle cx="84" cy="30" r="6" fill="#FF8FB8"/></g>`,
  `<rect x="10" y="104" width="100" height="8" rx="4" fill="#DDE6EE" ${O(2)}/><g fill="${AI}"><circle cx="40" cy="108" r="1.8"/><circle cx="52" cy="108" r="1.8"/><circle cx="64" cy="108" r="1.8"/><circle cx="76" cy="108" r="1.8"/></g>`+
  `<path d="M98 86 V70 L108 68 V82" fill="none" stroke="#2B2F6B" stroke-width="2.4"/><circle cx="96" cy="87" r="3" fill="#2B2F6B"/><circle cx="106" cy="83" r="3" fill="#2B2F6B"/>`);

// Piccolo le perroquet chanteur : tête rouge, crête jaune, corps vert, une note de musique
ART.piccolo=svg(
  `<path d="M48 110 L40 128 L60 118 L80 128 L72 110Z" fill="#6FB8F5" ${O(2)}/>`+
  `<ellipse cx="60" cy="96" rx="30" ry="26" fill="#6ED38C" ${O()}/>`+
  `<path d="M30 88 Q14 104 26 118 Q34 106 36 96Z M90 88 Q106 104 94 118 Q86 106 84 96Z" fill="#3FB86A" ${O(2)}/>`+
  `<path d="M50 26 Q52 8 60 16 Q64 4 70 16 Q78 10 74 28" fill="#FFD95A" ${O(2)}/>`+
  `<circle cx="60" cy="52" r="30" fill="#FF6F61" ${O()}/>`+
  `<ellipse cx="47" cy="50" rx="9" ry="10" fill="#fff"/><ellipse cx="73" cy="50" rx="9" ry="10" fill="#fff"/>`+
  eyes(47,73,51,4.2,5.2)+cheeks(36,84,64)+
  `<path d="M53 60 Q60 55 67 60 Q67 72 60 77 Q55 71 53 60Z" fill="#FFD95A" ${O(2)}/>`+
  `<path d="M100 34 V16 L110 14 V28" fill="none" stroke="${AI}" stroke-width="2.4"/><circle cx="98" cy="35" r="3.2" fill="${AI}"/><circle cx="108" cy="30" r="3.2" fill="${AI}"/>`);
// ---- Saison 2, le Jardin des Fées ----
// Pétale la fée jardinière : chapeau-fleur rose, ailes nacrées, robe vert tendre, petit arrosoir
ART.petale=human('#F0C4AA','#A85A3C','#8FD48A',
  `<g ${O(2)}><ellipse cx="38" cy="22" rx="12" ry="8" fill="#FF9CC8" transform="rotate(-25 38 22)"/><ellipse cx="82" cy="22" rx="12" ry="8" fill="#FF9CC8" transform="rotate(25 82 22)"/><ellipse cx="60" cy="12" rx="9" ry="12" fill="#FFB8D6"/><circle cx="60" cy="24" r="7" fill="#FFD95A"/></g>`,
  `<path d="M60 112 L84 128 L60 122 L36 128Z" fill="#6DBB57"/>`+
  `<rect x="88" y="100" width="22" height="18" rx="5" fill="#9FDCF5" ${O(2)}/><path d="M110 104 L118 96" stroke="${AI}" stroke-width="3" stroke-linecap="round"/><path d="M92 100 Q99 90 106 100" fill="none" stroke="${AI}" stroke-width="2.5"/>`,
  `<path d="M30 92 Q2 72 8 50 Q26 58 40 84Z M90 92 Q118 72 112 50 Q94 58 80 84Z" fill="#F3E8FF" opacity=".9" ${O(2)}/>`);

// Pois la coccinelle : carapace rouge à points noirs, tête noire, antennes
ART.pois=svg(
  `<path d="M44 30 Q38 12 30 10 M76 30 Q82 12 90 10" fill="none" stroke="${AI}" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="10" r="4" fill="${AI}"/><circle cx="90" cy="10" r="4" fill="${AI}"/>`+
  `<ellipse cx="60" cy="40" rx="26" ry="20" fill="#2B2140"/>`+
  `<ellipse cx="60" cy="84" rx="46" ry="42" fill="#E8344E" ${O()}/>`+
  `<path d="M60 44 V126" stroke="${AI}" stroke-width="3"/>`+
  `<g fill="${AI}"><circle cx="36" cy="96" r="6"/><circle cx="84" cy="96" r="6"/><circle cx="32" cy="70" r="4.6"/><circle cx="88" cy="70" r="4.6"/><circle cx="44" cy="114" r="4.4"/><circle cx="76" cy="114" r="4.4"/></g>`+
  `<path d="M28 60 Q36 50 48 50" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>`+
  `<g transform="translate(0 -22)">`+eyes(50,70,62,4.2,5.2)+`</g>`+cheeks(42,78,48)+`<path d="M54 50 Q60 54 66 50" fill="none" stroke="#FFB8C8" stroke-width="2.4" stroke-linecap="round"/>`);

// Azur le papillon : grandes ailes bleues à taches, petit corps, antennes en spirale
ART.azur=svg(
  `<path d="M58 60 C36 20 4 26 10 56 C14 74 40 74 56 66Z M62 60 C84 20 116 26 110 56 C106 74 80 74 64 66Z" fill="#6FB8F5" ${O()}/>`+
  `<path d="M56 70 C34 76 18 96 30 110 C42 120 54 98 58 80Z M64 70 C86 76 102 96 90 110 C78 120 66 98 62 80Z" fill="#BFA3EC" ${O()}/>`+
  `<g fill="#fff" opacity=".8"><circle cx="28" cy="46" r="6"/><circle cx="92" cy="46" r="6"/><circle cx="36" cy="98" r="4"/><circle cx="84" cy="98" r="4"/></g>`+
  `<path d="M54 28 Q48 12 40 14 Q36 18 42 20 M66 28 Q72 12 80 14 Q84 18 78 20" fill="none" stroke="${AI}" stroke-width="2.6" stroke-linecap="round"/>`+
  `<ellipse cx="60" cy="86" rx="9" ry="30" fill="#5A4A7A" ${O(2)}/>`+
  `<circle cx="60" cy="44" r="18" fill="#7B6AA8" ${O()}/>`+
  `<g transform="translate(0 -18)">`+eyes(53,67,62,3.4,4.4)+`</g>`+`<path d="M55 50 Q60 54 65 50" fill="none" stroke="#FFB8C8" stroke-width="2.2" stroke-linecap="round"/>`);

// Miella l'abeille : rayée jaune et brun, ailes transparentes, petit pot de miel
ART.miella=svg(
  `<ellipse cx="34" cy="48" rx="20" ry="14" fill="#E6F4FF" opacity=".9" ${O(2)} transform="rotate(-25 34 48)"/><ellipse cx="86" cy="48" rx="20" ry="14" fill="#E6F4FF" opacity=".9" ${O(2)} transform="rotate(25 86 48)"/>`+
  `<path d="M50 24 Q46 10 38 8 M70 24 Q74 10 82 8" fill="none" stroke="${AI}" stroke-width="3" stroke-linecap="round"/><circle cx="38" cy="8" r="4" fill="${AI}"/><circle cx="82" cy="8" r="4" fill="${AI}"/>`+
  `<ellipse cx="60" cy="80" rx="40" ry="44" fill="#FFD95A" ${O()}/>`+
  `<path d="M24 92 Q60 102 96 92 M28 110 Q60 120 92 110" fill="none" stroke="#6B3E26" stroke-width="9" stroke-linecap="round"/>`+
  `<path d="M30 56 Q38 44 52 44" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`+
  eyes(47,73,64,4.8,6)+cheeks(34,86,76)+smile(52,68,76,7)+
  `<rect x="90" y="104" width="22" height="20" rx="6" fill="#F2B04E" ${O(2)}/><path d="M90 110 H112" stroke="#B5702E" stroke-width="2"/>`);
// ---- Saison 2, le Royaume Arc-en-ciel ----
const plus=(base,extra)=> base.replace('</svg>', extra+'</svg>');
// la Reine Arc-en-ciel : licorne blanche à crinière arc-en-ciel, couronne d'or
ART.reine=plus(horse({coat:'#FFFFFF',muzzle:'#F6EEFF',
  maneBack:`<path d="M64 25 C38 19 21 44 25 80 C28 92 37 97 43 99 C38 86 38 70 45 55Z" fill="#FF6F61" ${O(2)}/><path d="M58 28 C40 28 30 46 32 74 C34 84 38 90 42 92 C40 80 40 66 46 54Z" fill="#FFD95A"/><path d="M53 31 C43 36 38 50 39 66 C41 74 43 80 45 82 C44 70 45 60 49 52Z" fill="#6ED38C"/><path d="M49 36 C44 44 42 54 43 64 C44 70 45 74 46 76 C46 66 47 58 50 52Z" fill="#6FB8F5"/>`,
  horn:`<path d="M55 30 L60 6 L65 30Z" fill="#FFF3A6" ${O(2)}/>`,
  forelock:`<path d="M64 29 C74 26 81 34 78 46 C74 40 69 37 63 37Z" fill="#BFA3EC" ${O(2)}/>`}),
  `<path d="M42 22 L46 8 L53 16 L60 4 L67 16 L74 8 L78 22Z" fill="#FFD95A" ${O(2)}/><circle cx="60" cy="13" r="2.6" fill="#FF6F91"/>`+
  `<path d="M44 102 Q60 112 76 102" fill="none" stroke="#BFA3EC" stroke-width="5" stroke-linecap="round"/>`);
// Étincelle, rentrée chez elle : la licorne du Lagon avec un foulard arc-en-ciel et une étoile
ART.etincelle=plus(horse({coat:'#FFFDF8',muzzle:'#FBE8EE',
  maneBack:`<path d="M64 25 C38 19 21 44 25 80 C28 92 37 97 43 99 C38 86 38 70 45 55Z" fill="#F48FB8" ${O(2)}/><path d="M58 28 C40 28 30 46 32 74 C34 84 38 90 42 92 C40 80 40 66 46 54Z" fill="#B79BE0"/>`,
  horn:`<path d="M55 30 L60 2 L65 30Z" fill="#F6C94E" ${O(2)}/><path d="M57 22 L63 19 M56 14 L62 11" stroke="#D99A22" stroke-width="1.8"/>`,
  forelock:`<path d="M64 29 C74 26 81 34 78 46 C74 40 69 37 63 37Z" fill="#B79BE0" ${O(2)}/>`}),
  `<path d="M42 92 Q60 104 78 92 L76 100 Q60 110 44 100Z" fill="#FF8FB8" ${O(2)}/><path d="M46 96 Q60 104 74 96" fill="none" stroke="#FFD95A" stroke-width="2.5"/>`+
  `<path d="M96 30 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1z" fill="#FFD95A" ${O(1.6)}/>`);
// Biscotte le bébé licorne : couleur biscuit, petite corne, un arc-en-ciel tout tordu
ART.biscotte=plus(horse({coat:'#FFE3BF',muzzle:'#FFF1DE',
  maneBack:`<path d="M64 25 C40 21 26 42 30 72 C32 82 38 88 42 90 C40 78 40 66 46 54Z" fill="#FFAE5C" ${O(2)}/>`,
  horn:`<path d="M56 30 L60 14 L64 30Z" fill="#FFF3A6" ${O(2)}/>`,
  forelock:`<path d="M64 29 C72 26 78 32 76 42 C73 37 69 35 63 36Z" fill="#9FDCF5" ${O(2)}/>`}),
  `<g fill="none" stroke-width="4" stroke-linecap="round"><path d="M86 120 Q92 92 106 104 Q112 112 104 116" stroke="#FF6F61"/><path d="M90 120 Q95 98 104 108" stroke="#FFD95A"/></g>`);
// Félix le licorne alchimiste : bleu pâle, lunettes rondes, une fiole verte qui fume
ART.felix=plus(horse({coat:'#E3F2FF',muzzle:'#F2F8FF',
  maneBack:`<path d="M64 25 C38 19 21 44 25 80 C28 92 37 97 43 99 C38 86 38 70 45 55Z" fill="#6ED38C" ${O(2)}/><path d="M58 28 C40 28 30 46 32 74 C34 84 38 90 42 92 C40 80 40 66 46 54Z" fill="#5CC6CC"/>`,
  horn:`<path d="M55 30 L60 4 L65 30Z" fill="#C9D6E3" ${O(2)}/>`,
  forelock:`<path d="M64 29 C74 26 81 34 78 46 C74 40 69 37 63 37Z" fill="#5CC6CC" ${O(2)}/>`}),
  `<circle cx="49" cy="50" r="9" fill="none" stroke="#5A3A22" stroke-width="2.5"/><circle cx="71" cy="50" r="9" fill="none" stroke="#5A3A22" stroke-width="2.5"/><path d="M58 50 H62" stroke="#5A3A22" stroke-width="2.5"/>`+
  `<path d="M92 96 V108 L84 124 H112 L104 108 V96Z" fill="#9FE8B8" ${O(2)}/><path d="M86 118 H110" stroke="#4FB57F" stroke-width="3"/><g fill="#fff" opacity=".8"><circle cx="96" cy="88" r="3"/><circle cx="102" cy="80" r="2.4"/></g>`);
// Mira la licorne coiffeuse : longue crinière violette, un miroir à main et un peigne
ART.mira=plus(horse({coat:'#FFF0FA',muzzle:'#FFF8FC',
  maneBack:`<path d="M64 25 C34 19 14 50 20 90 C22 104 30 112 40 114 C34 96 34 74 45 55Z" fill="#BFA3EC" ${O(2)}/><path d="M56 30 C38 32 28 52 30 80 C32 92 36 100 40 104 C38 86 40 66 46 54Z" fill="#E3D6FB"/>`,
  horn:`<path d="M55 30 L60 2 L65 30Z" fill="#FFB8E1" ${O(2)}/>`,
  forelock:`<path d="M64 29 C74 26 81 34 78 46 C74 40 69 37 63 37Z" fill="#BFA3EC" ${O(2)}/>`}),
  `<ellipse cx="98" cy="96" rx="12" ry="14" fill="#E9F6FF" stroke="#B8901A" stroke-width="3"/><path d="M98 110 V126" stroke="#B8901A" stroke-width="4" stroke-linecap="round"/><path d="M92 90 Q96 86 100 88" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`+
  `<rect x="10" y="108" width="22" height="6" rx="3" fill="#FFD95A" ${O(1.6)}/><path d="M13 114 V120 M18 114 V120 M23 114 V120 M28 114 V120" stroke="${AI}" stroke-width="1.8"/>`);
return ART;
})();
function charArtSVG(id){return CHAR_ART[id]||''}
function charFace(id,cls){const c=CHARACTERS[id],svg=charArtSVG(id);return svg?'<span class="char-art '+(cls||'')+'" role="img" aria-label="'+c.name+' '+c.title+'">'+svg+'</span>':'<span class="'+(cls||'')+'">'+(c?c.emoji:'❔')+'</span>'}

export { charFace };
