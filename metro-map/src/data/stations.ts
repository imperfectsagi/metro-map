// Approximate geographic positions for Delhi NCR Metro stations
// Used for 3D visualization layout. Coordinates are normalized around Delhi center.
// Real lat/lng can be substituted later; relative topology is preserved from official sequences.

export interface StationPos {
  id: string;
  name: string;
  x: number; // normalized X for 3D (east-west)
  y: number; // normalized Y for 3D (north-south)  - note: inverted for map feel
  lat: number;
  lng: number;
  lines: string[];
}

// Helper to place stations along a line path with slight curve for visual appeal
function placeLine(
  ids: string[],
  names: string[],
  start: [number, number],
  end: [number, number],
  lines: string[][],
  baseLat = 28.6139,
  baseLng = 77.2090
): StationPos[] {
  const result: StationPos[] = [];
  const n = ids.length;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    // slight sine curve for visual interest
    const curve = Math.sin(t * Math.PI) * 0.15;
    const x = start[0] + (end[0] - start[0]) * t + curve * (end[1] - start[1]) * 0.3;
    const y = start[1] + (end[1] - start[1]) * t - curve * (end[0] - start[0]) * 0.3;
    result.push({
      id: ids[i],
      name: names[i],
      x,
      y,
      lat: baseLat + y * 0.08,
      lng: baseLng + x * 0.08,
      lines: lines[i] || [],
    });
  }
  return result;
}

// Build complete station list from official sequences (names cleaned)
const redIds = ["shaheed-sthal","hindon-river","arthala","mohan-nagar","shyam-park","major-mohit-sharma","raj-bagh","shaheed-nagar","dilshad-garden","jhilmil","mansarovar-park","shahdara","welcome","seelampur","shastri-park","kashmere-gate","tis-hazari","pul-bangash","pratap-nagar","shastri-nagar","inderlok","kanhaiya-nagar","keshav-puram","netaji-subhash-place","kohat-enclave","madhuban-chowk","rohini","dr-baba-saheb-ambedkar-hospital","rithala"];
const redNames = ["Shaheed Sthal","Hindon River","Arthala","Mohan Nagar","Shyam Park","Major Mohit Sharma","Raj Bagh","Shaheed Nagar","Dilshad Garden","Jhilmil","Mansarovar Park","Shahdara","Welcome","Seelampur","Shastri Park","Kashmere Gate","Tis Hazari","Pul Bangash","Pratap Nagar","Shastri Nagar","Inderlok","Kanhaiya Nagar","Keshav Puram","Netaji Subhash Place","Kohat Enclave","Madhuban Chowk","Rohini","Dr. Baba Saheb Ambedkar Hospital","Rithala"];

const yellowIds = ["samaypur-badli","rohini-sector-18-19","haiderpur-badli-mor","jahangirpuri","adarsh-nagar","azadpur","model-town","guru-tegh-bahadur-nagar","vishwavidyalaya","vidhan-sabha","civil-lines","kashmere-gate","chandni-chowk","chawri-bazar","new-delhi","rajiv-chowk","patel-chowk","central-secretariat","seva-teerth","lok-kalyan-marg","jor-bagh","dilli-haat-ina","aiims","green-park","hauz-khas","malviya-nagar","saket","qutab-minar","chhatarpur","sultanpur","ghitorni","arjan-garh","guru-dronacharya","sikanderpur","mg-road","iffco-chowk","millennium-city-centre"];
const yellowNames = ["Samaypur Badli","Rohini Sector 18-19","Haiderpur Badli Mor","Jahangirpuri","Adarsh Nagar","Azadpur","Model Town","Guru Tegh Bahadur Nagar","Vishwavidyalaya","Vidhan Sabha","Civil Lines","Kashmere Gate","Chandni Chowk","Chawri Bazar","New Delhi","Rajiv Chowk","Patel Chowk","Central Secretariat","Seva Teerth","Lok Kalyan Marg","Jor Bagh","Dilli Haat - INA","AIIMS","Green Park","Hauz Khas","Malviya Nagar","Saket","Qutab Minar","Chhatarpur","Sultanpur","Ghitorni","Arjan Garh","Guru Dronacharya","Sikanderpur","MG Road","IFFCO Chowk","Millennium City Centre"];

const blueIds = ["dwarka-sector-21","dwarka-sector-8","dwarka-sector-9","dwarka-sector-10","dwarka-sector-11","dwarka-sector-12","dwarka-sector-13","dwarka-sector-14","dwarka-kakrola","dwarka-mor","nawada","uttam-nagar-west","uttam-nagar-east","janakpuri-west","janakpuri-east","tilak-nagar","subhash-nagar","tagore-garden","rajouri-garden","ramesh-nagar","moti-nagar","kirti-nagar","shadipur","patel-nagar","rajendra-place","karol-bagh","jhandewalan","rk-ashram-marg","rajiv-chowk","barakhamba-road","mandi-house","supreme-court","indraprastha","yamuna-bank","akshardham","mayur-vihar-i","mayur-vihar-extension","new-ashok-nagar","noida-sector-15","noida-sector-16","noida-sector-18","botanical-garden","golf-course","noida-city-centre","noida-sector-34","noida-sector-52","noida-sector-61","noida-sector-59","noida-sector-62","noida-electronic-city"];
const blueNames = ["Dwarka Sector 21","Dwarka Sector 8","Dwarka Sector 9","Dwarka Sector 10","Dwarka Sector 11","Dwarka Sector 12","Dwarka Sector 13","Dwarka Sector 14","Dwarka-Kakrola","Dwarka Mor","Nawada","Uttam Nagar West","Uttam Nagar East","Janakpuri West","Janakpuri East","Tilak Nagar","Subhash Nagar","Tagore Garden","Rajouri Garden","Ramesh Nagar","Moti Nagar","Kirti Nagar","Shadipur","Patel Nagar","Rajendra Place","Karol Bagh","Jhandewalan","RK Ashram Marg","Rajiv Chowk","Barakhamba Road","Mandi House","Supreme Court","Indraprastha","Yamuna Bank","Akshardham","Mayur Vihar-I","Mayur Vihar Extension","New Ashok Nagar","Noida Sector 15","Noida Sector 16","Noida Sector 18","Botanical Garden","Golf Course","Noida City Centre","Noida Sector 34","Noida Sector 52","Noida Sector 61","Noida Sector 59","Noida Sector 62","Noida Electronic City"];

const blueBranchIds = ["yamuna-bank","laxmi-nagar","nirman-vihar","preet-vihar","karkarduma","anand-vihar-isbt","kaushambi","vaishali"];
const blueBranchNames = ["Yamuna Bank","Laxmi Nagar","Nirman Vihar","Preet Vihar","Karkarduma","Anand Vihar ISBT","Kaushambi","Vaishali"];

const greenIds = ["brigadier-hoshiyar-singh","bahadurgarh-city","pandit-shree-ram-sharma","tikri-border","tikri-kalan","ghevra","mundka-industrial-area","mundka","rajdhani-park","nangloi-railway-station","nangloi","maharaja-surajmal-stadium","udyog-nagar","peera-garhi","paschim-vihar-west","paschim-vihar-east","madipur","shivaji-park","punjabi-bagh-west","punjabi-bagh","ashok-park-main","inderlok"];
const greenNames = ["Brigadier Hoshiyar Singh","Bahadurgarh City","Pandit Shree Ram Sharma","Tikri Border","Tikri Kalan","Ghevra","Mundka Industrial Area","Mundka","Rajdhani Park","Nangloi Railway Station","Nangloi","Maharaja Surajmal Stadium","Udyog Nagar","Peera Garhi","Paschim Vihar West","Paschim Vihar East","Madipur","Shivaji Park","Punjabi Bagh West","Punjabi Bagh","Ashok Park Main","Inderlok"];

const greenBranchIds = ["ashok-park-main","satguru-ram-singh-marg","kirti-nagar"];
const greenBranchNames = ["Ashok Park Main","Satguru Ram Singh Marg","Kirti Nagar"];

const violetIds = ["kashmere-gate","lal-quila","jama-masjid","delhi-gate","ito","mandi-house","janpath","central-secretariat","khan-market","jawaharlal-nehru-stadium","jangpura","lajpat-nagar","moolchand","kailash-colony","nehru-place","kalkaji-mandir","govind-puri","harkesh-nagar-okhla","jasola-apollo","sarita-vihar","mohan-estate","tughlakabad-station","badarpur-border","sarai","nhpc-chowk","mewala-maharajpur","sector-28","badkal-mor","old-faridabad","neelam-chowk-ajronda","bata-chowk","escorts-mujesar","sant-surdas","raja-nahar-singh"];
const violetNames = ["Kashmere Gate","Lal Quila","Jama Masjid","Delhi Gate","ITO","Mandi House","Janpath","Central Secretariat","Khan Market","Jawaharlal Nehru Stadium","Jangpura","Lajpat Nagar","Moolchand","Kailash Colony","Nehru Place","Kalkaji Mandir","Govind Puri","Harkesh Nagar Okhla","Jasola Apollo","Sarita Vihar","Mohan Estate","Tughlakabad Station","Badarpur Border","Sarai","NHPC Chowk","Mewala Maharajpur","Sector 28","Badkal Mor","Old Faridabad","Neelam Chowk Ajronda","Bata Chowk","Escorts Mujesar","Sant Surdas","Raja Nahar Singh"];

const pinkIds = ["majlis-park","azadpur","shalimar-bagh","netaji-subhash-place","shakurpur","punjabi-bagh-west","esi-basaidarapur","rajouri-garden","maya-puri","naraina-vihar","delhi-cantt","durgabai-deshmukh-south-campus","sir-m-vishweshwaraiah-moti-bagh","bhikaji-cama-place","sarojini-nagar","dilli-haat-ina","south-extension","lajpat-nagar","vinobapuri","ashram","sarai-kale-khan-nizamuddin","mayur-vihar-i","shri-ram-mandir-mayur-vihar","trilokpuri-sanjay-lake","east-vinod-nagar-mayur-vihar-ii","mandawali-west-vinod-nagar","ip-extension","anand-vihar-isbt","karkarduma","karkarduma-court","krishna-nagar","east-azad-nagar","welcome","jaffrabad","maujpur-babarpur","yamuna-vihar","bhajanpura","khajuri-khas","nanaksar-sonia-vihar","jagatpur-wazirabad","jharoda-majra","burari"];
const pinkNames = ["Majlis Park","Azadpur","Shalimar Bagh","Netaji Subhash Place","Shakurpur","Punjabi Bagh West","ESI - Basaidarapur","Rajouri Garden","Maya Puri","Naraina Vihar","Delhi Cantt","Durgabai Deshmukh South Campus","Sir M. Vishweshwaraiah Moti Bagh","Bhikaji Cama Place","Sarojini Nagar","Dilli Haat - INA","South Extension","Lajpat Nagar","Vinobapuri","Ashram","Sarai Kale Khan - Nizamuddin","Mayur Vihar-I","Shri Ram Mandir Mayur Vihar","Trilokpuri Sanjay Lake","East Vinod Nagar - Mayur Vihar-II","Mandawali - West Vinod Nagar","IP Extension","Anand Vihar ISBT","Karkarduma","Karkarduma Court","Krishna Nagar","East Azad Nagar","Welcome","Jaffrabad","Maujpur - Babarpur","Yamuna Vihar","Bhajanpura","Khajuri Khas","Nanaksar - Sonia Vihar","Jagatpur - Wazirabad","Jharoda Majra","Burari"];

const pinkBranchIds = ["maujpur-babarpur","gokulpuri","johri-enclave","shiv-vihar"];
const pinkBranchNames = ["Maujpur - Babarpur","Gokulpuri","Johri Enclave","Shiv Vihar"];

const magentaIds = ["krishna-park-extension","janakpuri-west","dabri-mor-janakpuri-south","dashrathpuri","palam","sadar-bazar-cantonment","terminal-1-igi-airport","shankar-vihar","vasant-vihar","munirka","rk-puram","iit","hauz-khas","panchsheel-park","chirag-delhi","greater-kailash","nehru-enclave","kalkaji-mandir","okhla-nsic","sukhdev-vihar","jamia-millia-islamia","okhla-vihar","jasola-vihar-shaheen-bagh","kalindi-kunj","okhla-bird-sanctuary","botanical-garden"];
const magentaNames = ["Krishna Park Extension","Janakpuri West","Dabri Mor - Janakpuri South","Dashrathpuri","Palam","Sadar Bazar Cantonment","Terminal 1-IGI Airport","Shankar Vihar","Vasant Vihar","Munirka","RK Puram","IIT","Hauz Khas","Panchsheel Park","Chirag Delhi","Greater Kailash","Nehru Enclave","Kalkaji Mandir","Okhla NSIC","Sukhdev Vihar","Jamia Millia Islamia","Okhla Vihar","Jasola Vihar Shaheen Bagh","Kalindi Kunj","Okhla Bird Sanctuary","Botanical Garden"];

const magentaNorthIds = ["deepali-chowk","madhuban-chowk","uttari-pitampura-prashant-vihar","haiderpur-village","haiderpur-badli-mor","bhalswa","majlis-park"];
const magentaNorthNames = ["Deepali Chowk","Madhuban Chowk","Uttari Pitampura - Prashant Vihar","Haiderpur Village","Haiderpur Badli Mor","Bhalswa","Majlis Park"];

const greyIds = ["dwarka-kakrola","nangli","najafgarh","dhansa-bus-stand"];
const greyNames = ["Dwarka-Kakrola","Nangli","Najafgarh","Dhansa Bus Stand"];

const orangeIds = ["new-delhi","shivaji-stadium","dhaula-kuan","delhi-aerocity","igi-airport","dwarka-sector-21","yashobhoomi-dwarka-sector-25"];
const orangeNames = ["New Delhi","Shivaji Stadium","Dhaula Kuan","Delhi Aerocity","IGI Airport","Dwarka Sector 21","Yashobhoomi Dwarka Sector 25"];

// Place lines geographically roughly
const stationsMap = new Map<string, StationPos>();

function addStations(list: StationPos[]) {
  for (const s of list) {
    if (!stationsMap.has(s.id)) {
      stationsMap.set(s.id, s);
    } else {
      // merge lines
      const existing = stationsMap.get(s.id)!;
      const merged = Array.from(new Set([...existing.lines, ...s.lines]));
      stationsMap.set(s.id, { ...existing, lines: merged });
    }
  }
}

// Red: east to west-north
addStations(placeLine(redIds, redNames, [1.8, 0.8], [-0.6, 1.4], redIds.map(() => ["red"])));

// Yellow: north to south
addStations(placeLine(yellowIds, yellowNames, [-0.3, 1.6], [-0.2, -1.8], yellowIds.map(() => ["yellow"])));

// Blue: west to east
addStations(placeLine(blueIds, blueNames, [-1.8, -0.3], [2.2, -0.4], blueIds.map(() => ["blue"])));

// Blue branch
addStations(placeLine(blueBranchIds, blueBranchNames, [0.9, -0.2], [1.8, 0.6], blueBranchIds.map(() => ["blue_branch"])));

// Green: west to east-central
addStations(placeLine(greenIds, greenNames, [-2.0, 0.6], [-0.4, 0.5], greenIds.map(() => ["green"])));

// Green branch
addStations(placeLine(greenBranchIds, greenBranchNames, [-0.5, 0.5], [-0.7, -0.1], greenBranchIds.map(() => ["green_branch"])));

// Violet: north-central to south
addStations(placeLine(violetIds, violetNames, [0.1, 0.9], [0.4, -2.0], violetIds.map(() => ["violet"])));

// Pink ring - approximate circle
const pinkPositions: StationPos[] = [];
const pinkN = pinkIds.length;
for (let i = 0; i < pinkN; i++) {
  const angle = (i / pinkN) * Math.PI * 2 - Math.PI / 2;
  const r = 1.1 + Math.sin(i * 0.3) * 0.1;
  pinkPositions.push({
    id: pinkIds[i],
    name: pinkNames[i],
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r * 0.85,
    lat: 28.6139 + Math.sin(angle) * r * 0.07,
    lng: 77.2090 + Math.cos(angle) * r * 0.07,
    lines: ["pink"],
  });
}
addStations(pinkPositions);

// Pink branch
addStations(placeLine(pinkBranchIds, pinkBranchNames, [0.9, 0.9], [1.3, 1.3], pinkBranchIds.map(() => ["pink_branch"])));

// Magenta
addStations(placeLine(magentaIds, magentaNames, [-1.2, -0.2], [1.0, -0.9], magentaIds.map(() => ["magenta"])));

// Magenta north
addStations(placeLine(magentaNorthIds, magentaNorthNames, [-0.8, 1.2], [0.0, 1.3], magentaNorthIds.map(() => ["magenta_north"])));

// Grey
addStations(placeLine(greyIds, greyNames, [-1.5, -0.3], [-2.2, -0.5], greyIds.map(() => ["grey"])));

// Orange
addStations(placeLine(orangeIds, orangeNames, [0.05, 0.15], [-1.6, -0.4], orangeIds.map(() => ["orange"])));

export const allStations: StationPos[] = Array.from(stationsMap.values());

export function getStationById(id: string): StationPos | undefined {
  return stationsMap.get(id);
}

export function getStationName(id: string): string {
  return stationsMap.get(id)?.name || id;
}
