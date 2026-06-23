// --- DISCLAIMER LOGIC ---
function closeDisclaimer() {
    const checkbox = document.getElementById('dontShowAgain');
    const modal = document.getElementById('disclaimerModal');
    
    // If user checked the box, save their preference to local storage
    if (checkbox && checkbox.checked) {
        localStorage.setItem('hideLibraryDisclaimer', 'true');
    }
    
    // Hide the modal
    modal.classList.add('hidden-modal');
}

// Check local storage as soon as the page loads
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('disclaimerModal');
    if (localStorage.getItem('hideLibraryDisclaimer') === 'true') {
        modal.classList.add('hidden-modal');
    }
});

// --- 1. SECURITY, KIOSK MODE & WAKE LOCK ---
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || 
       (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || 
       (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
    }
});

let wakeLock = null;
async function acquireWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {}
    }
}
async function releaseWakeLock() {
    if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
    }
}

document.addEventListener('click', () => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        if (synth.speaking && !synth.paused) {
            synth.pause();
            togglePlayIcon(true);
        }
        if (recognition && isListening) recognition.stop();
    } else {
        acquireWakeLock();
    }
});

// --- 2. THE ANCIENT LIBRARY CONFIGURATION ---
const PROXY_URL = "https://eprashala.pythonanywhere.com/api/chat"; 

// Generates the massive Maharishi list easily
const sagesList = ["Bhrigu", "Atri", "Angiras", "Vasistha", "Vishvamitra", "Gautama", "Kashyapa", "Bharadvaja", "Jamadagni", "Agastya", "Narada", "Parashara", "Vyasa", "Shukracharya", "Brihaspati", "Markandeya", "Yajnavalkya", "Patanjali", "Kapila", "Kanada", "Valmiki", "Shandilya", "Devala", "Asita", "Durvasa", "Dadhichi", "Lomasha", "Paila", "Jaimini", "Sumantu", "Vaishampayana", "Shaunaka", "Garga", "Panini", "Pingala", "Charaka", "Sushruta", "Apastamba", "Baudhayana", "Katyayana", "Gobhila", "Harita", "Yaska", "Narayana", "Sanaka", "Sanandana", "Sanatana", "Sanatkumara", "Ribhu", "Nidagha", "Vamadeva", "Kahola", "Uddalaka", "Svetaketu", "Astavakra", "Raikva", "Maitreya", "Parvata", "Galava", "Mudgala", "Rishyasringa", "Vibhandaka", "Chyavana", "Pramiti", "Medhatithi", "Trita", "Aruni", "Upamanyu", "Dhaumya", "Kratu", "Pulaha", "Pulastya", "Marichi", "Daksha", "Shakti", "Romaharshana", "Suta", "Saubhari", "Mandavya", "Vatsyayana", "Bharata", "Shibi", "Janaka"];
const maharishiObject = {};
sagesList.forEach(sage => { maharishiObject[sage] = { persona: `Maharishi ${sage}`, texts: `Ancient texts and wisdom of Sage ${sage}`, greeting: "Hari Om" }; });

const LIBRARY_CONFIG = {
    "Bhagavad Gita": {
        "Bhagavad Gita": { persona: "Lord Krishna", texts: "Bhagavad Gita", greeting: "Jai Shri Krishna" }
    },
    "Gods": {
        "Shiv": { persona: "Lord Shiva", texts: "Shiva Purana, Linga Purana", greeting: "Om Namah Shivaya" },
        "Vishnu": { persona: "Lord Vishnu", texts: "Vishnu Purana", greeting: "Om Namo Bhagavate Vasudevaya" },
        "Brahma": { persona: "Lord Brahma", texts: "Brahma Purana", greeting: "Aham Brahmasmi" },
        "Ganesh": { persona: "Lord Ganesha", texts: "Ganesha Purana", greeting: "Om Gam Ganapataye Namaha" },
        "Rama": { persona: "Lord Rama", texts: "Ramayana", greeting: "Jai Shri Ram" },
        "Krishna": { persona: "Lord Krishna", texts: "Bhagavata Purana", greeting: "Jai Shri Krishna" },
        "Durga": { persona: "Goddess Durga", texts: "Devi Mahatmyam", greeting: "Ya Devi Sarvabhuteshu" },
        "Kali": { persona: "Goddess Kali", texts: "Kalika Purana", greeting: "Om Krim Kalikayai Namaha" },
        "Saraswati": { persona: "Goddess Saraswati", texts: "Saraswati Purana", greeting: "Om Aim Saraswatyai Namaha" },
        "Lakshmi": { persona: "Goddess Lakshmi", texts: "Lakshmi Tantra", greeting: "Om Shreem Mahalakshmiyei Namaha" },
        "Hanuman": { persona: "Lord Hanuman", texts: "Hanuman Chalisa", greeting: "Om Hanumate Namaha" },
        "Surya": { persona: "Lord Surya", texts: "Aditya Hrudayam", greeting: "Om Suryaya Namaha" },
        "Dattatreya": { persona: "Lord Dattatreya", texts: "Avadhuta Gita", greeting: "Hari Om Tat Sat" }
    },
    "Vedas": {
        "Rig Veda": { persona: "Vedic Seer", texts: "Rig Veda", greeting: "Hari Om" },
        "Yajur Veda": { persona: "Vedic Seer", texts: "Yajur Veda", greeting: "Hari Om" },
        "Sama Veda": { persona: "Vedic Seer", texts: "Sama Veda", greeting: "Hari Om" },
        "Atharva Veda": { persona: "Vedic Seer", texts: "Atharva Veda", greeting: "Hari Om" }
    },
    "Upanishads": {
        "Isha": { persona: "Upanishadic Sage", texts: "Isha Upanishad (Yajur Veda)", greeting: "Hari Om Tat Sat" },
        "Kena": { persona: "Upanishadic Sage", texts: "Kena Upanishad (Sama Veda)", greeting: "Hari Om" },
        "Katha": { persona: "Lord Yama", texts: "Katha Upanishad (Yajur Veda)", greeting: "Hari Om" },
        "Prashna": { persona: "Sage Pippalada", texts: "Prashna Upanishad (Atharva Veda)", greeting: "Hari Om" },
        "Mundaka": { persona: "Upanishadic Sage", texts: "Mundaka Upanishad (Atharva Veda)", greeting: "Hari Om" },
        "Mandukya": { persona: "Upanishadic Sage", texts: "Mandukya Upanishad (Atharva Veda)", greeting: "Hari Om" },
        "Taittiriya": { persona: "Upanishadic Sage", texts: "Taittiriya Upanishad (Yajur Veda)", greeting: "Hari Om" },
        "Aitareya": { persona: "Sage Aitareya", texts: "Aitareya Upanishad (Rig Veda)", greeting: "Hari Om" },
        "Chandogya": { persona: "Upanishadic Sage", texts: "Chandogya Upanishad (Sama Veda)", greeting: "Hari Om" },
        "Brihadaranyaka": { persona: "Sage Yajnavalkya", texts: "Brihadaranyaka Upanishad (Yajur Veda)", greeting: "Hari Om" }
    },
    "Puranas": {
        "Agni Purana": { persona: "Sage Vyasa", texts: "Agni Purana", greeting: "Hari Om" },
        "Bhagavata Purana": { persona: "Sage Shuka", texts: "Bhagavata Purana", greeting: "Hari Om" },
        "Brahma Purana": { persona: "Sage Vyasa", texts: "Brahma Purana", greeting: "Hari Om" },
        "Garuda Purana": { persona: "Lord Vishnu", texts: "Garuda Purana", greeting: "Hari Om" },
        "Matsya Purana": { persona: "Lord Matsya", texts: "Matsya Purana", greeting: "Hari Om" },
        "Padma Purana": { persona: "Sage Vyasa", texts: "Padma Purana", greeting: "Hari Om" },
        "Shiva Purana": { persona: "Sage Romaharshana", texts: "Shiva Purana", greeting: "Om Namah Shivaya" },
        "Skanda Purana": { persona: "Lord Kartikeya", texts: "Skanda Purana", greeting: "Hari Om" },
        "Vishnu Purana": { persona: "Sage Parashara", texts: "Vishnu Purana", greeting: "Om Namo Narayana" }
    },
    "Samhitas": {
        "Bhrigu Samhita": { persona: "Maharishi Bhrigu", texts: "Bhrigu Samhita (Astrology)", greeting: "Hari Om" },
        "Garga Samhita": { persona: "Maharishi Garga", texts: "Garga Samhita", greeting: "Jai Shri Krishna" },
        "Gheranda Samhita": { persona: "Sage Gheranda", texts: "Gheranda Samhita (Hatha Yoga)", greeting: "Hari Om" },
        "Shiva Samhita": { persona: "Lord Shiva", texts: "Shiva Samhita (Hatha Yoga)", greeting: "Om Namah Shivaya" },
        "Brihat Samhita": { persona: "Varahamihira", texts: "Brihat Samhita", greeting: "Hari Om" },
        "Kashyap Samhita": { persona: "Maharishi Kashyapa", texts: "Kashyap Samhita (Ayurveda)", greeting: "Hari Om" },
        "Yogayajnavalkya": { persona: "Sage Yajnavalkya", texts: "Yogayajnavalkya Samhita (Yoga)", greeting: "Hari Om" },
        "Shandilya Samhita": { persona: "Sage Shandilya", texts: "Shandilya Samhita (Bhakti)", greeting: "Hari Om" },
        "Parashara Samhita": { persona: "Maharishi Parashara", texts: "Parashara Samhita (Astrology)", greeting: "Hari Om" }
    },
    "Epics": {
        "Ramayana": { persona: "Maharishi Valmiki", texts: "Valmiki Ramayana", greeting: "Jai Shri Ram" },
        "Mahabharata": { persona: "Maharishi Vyasa", texts: "Mahabharata", greeting: "Hari Om" }
    },
    "Philosophical Sutras": {
        "Patanjali Yoga Sutras": { persona: "Maharishi Patanjali", texts: "Yoga Sutras of Patanjali", greeting: "Hari Om" },
        "Samkhya Sutras": { persona: "Maharishi Kapila", texts: "Samkhya Sutras", greeting: "Hari Om" },
        "Nyaya Sutras": { persona: "Maharishi Gautama", texts: "Nyaya Sutras", greeting: "Hari Om" },
        "Vaisheshika Sutras": { persona: "Maharishi Kanada", texts: "Vaisheshika Sutras", greeting: "Hari Om" },
        "Purva Mimamsa": { persona: "Maharishi Jaimini", texts: "Purva Mimamsa Sutras", greeting: "Hari Om" },
        "Brahma Sutras": { persona: "Maharishi Badarayana (Vyasa)", texts: "Brahma Sutras", greeting: "Hari Om" }
    },
    "Ayurveda": {
        "Charaka Samhita": { persona: "Maharishi Charaka", texts: "Charaka Samhita", greeting: "Hari Om" },
        "Sushruta Samhita": { persona: "Maharishi Sushruta", texts: "Sushruta Samhita", greeting: "Hari Om" },
        "Ashtanga Hridayam": { persona: "Vagbhata", texts: "Ashtanga Hridayam", greeting: "Hari Om" },
        "Madhava Nidana": { persona: "Madhava", texts: "Madhava Nidana", greeting: "Hari Om" },
        "Sharangadhara": { persona: "Sharangadhara", texts: "Sharangadhara Samhita", greeting: "Hari Om" },
        "Bhava Prakasha": { persona: "Bhava Mishra", texts: "Bhava Prakasha", greeting: "Hari Om" }
    },
    "Jyotish": {
        "Surya Siddhanta": { persona: "Ancient Astronomer", texts: "Surya Siddhanta", greeting: "Hari Om" },
        "Brihat Parashara": { persona: "Maharishi Parashara", texts: "Brihat Parashara Hora Shastra", greeting: "Hari Om" },
        "Brihat Samhita": { persona: "Varahamihira", texts: "Brihat Samhita", greeting: "Hari Om" },
        "Aryabhatiya": { persona: "Aryabhata", texts: "Aryabhatiya", greeting: "Hari Om" }
    },
    "Ancient & Vedic": {
            "Rig Veda": { "persona": "Maharishi Vishvamitra", "texts": "Rig Veda (Mandala 3)", "greeting": "Hari Om" },
            "Ramayana": { "persona": "Maharishi Valmiki", "texts": "Valmiki Ramayana", "greeting": "Jai Shri Ram" },
            "Mahabharata": { "persona": "Maharishi Vyasa", "texts": "Mahabharata, Bhagavad Gita", "greeting": "Hari Om" },
            "Yoga Sutras": { "persona": "Maharishi Patanjali", "texts": "Yoga Sutras", "greeting": "Namaste" },
            "Upanishads": { "persona": "Sage Yajnavalkya", "texts": "Brihadaranyaka Upanishad", "greeting": "Om Shanti" },
            "Nyaya Shastra": { "persona": "Sage Gautama", "texts": "Nyaya Sutras", "greeting": "Hari Om" }
    },
    "Classical & Vedanta": {
        "Advaita Vedanta": { "persona": "Adi Shankara", "texts": "Vivekachudamani, Brahma Sutra Bhashya", "greeting": "Namo Narayana" },
        "Vishishtadvaita": { "persona": "Ramanujacharya", "texts": "Sri Bhashya, Vedartha Sangraha", "greeting": "Ohm Namo Narayana" },
        "Dvaita Vedanta": { "persona": "Madhvacharya", "texts": "Anuvyakhyana, Gita Bhashya", "greeting": "Hari Sarvothama" },
        "Shuddhadvaita": { "persona": "Vallabhacharya", "texts": "Anubhashya, Shodasha Granthas", "greeting": "Jai Shri Krishna" }
    },
    "Shastra": {
        "Agama Shastra": { "persona": "Agamic Acharya", "texts": "Agamashashtra", "greeting": "Hari Om" },
        "Brihat Parashar Hora Shastra": { "persona": "Ancient vedic Astrology", "texts": "Brihat Parashar Hora Shastra", "greeting": "Hari Om" },
        "Vastu Shastra": { "persona": "Bhagawan Vishwakarma", "texts": "Vastu Shastram by Vishwakarma Prakash, Mayamatam, Samarangan Sutradhar, Bhrigu Samhita, Brihat Samhita, Manushyalaya Chandrika", "greeting": "Om Vishwakarmaya Namaha" },
        "Tantra Shastra": { "persona": "Acharya Abhinavagupta", "texts": "Vijnana Bhairava Tantra, Tantra Aloka (Abhinavagupta), Kulachudamani Nigama, Bhootadamar Tantra & Damar Tantras, Mahanirvana Tantra, Shakti/Shakta Tantra, Shaiva Tantra, Panchamakara, Atharvaveda & Asuri Kalpa, Rudra Yamala Tantra, Mahakala Samhita, Kubjika Tantra, Tantraraja Tantra", "greeting": "Om Namah Shivaya" },
        "Lal Kitab Astrological Science": { "persona": "Pandit Roop Chand Joshi", "texts": "Lal Kitab Ke Farman, Lal Kitab Ke Arman, Gutka (Ilm Samudrik Ki Lal Kitab), Lal Kitab – Tarmeem Shuda, Ilm-e-Samudrik Ki Buniyad Par Ki Lal Kitab", "greeting": "Namaskar" },
        "Kama Shastra": { "persona": "Maharishi Vatsyayana", "texts": "The Kama Sutra (Vatsyayana), Ananga Ranga (Kalyana Malla), Koka Shastra (Koka Pandita), Brihadaranyaka & Chandogya Upanishads, Gita Govindam (Jayadeva)", "greeting": "Swagatam" }
    },
    "Medieval Bhakti Movement": {
        "Ram Bhakti": { "persona": "Goswami Tulsidas", "texts": "Ramcharitmanas, Vinaya Patrika", "greeting": "Sita Ram" },
        "Krishna Bhakti (North)": { "persona": "Sant Surdas", "texts": "Sur Sagar", "greeting": "Radhe Radhe" },
        "Krishna Bhakti (West)": { "persona": "Sant Mirabai", "texts": "Mira Padavali", "greeting": "Jai Shree Krishna" },
        "Varkari Sampradaya": { "persona": "Sant Tukaram", "texts": "Tukaram Gatha", "greeting": "Ram Krishna Hari" },
        "Nirguna Bhakti": { "persona": "Sant Kabir", "texts": "Bijak, Kabir Granthavali", "greeting": "Sat Sahib" },
        "Gaudiya Vaishnavism": { "persona": "Chaitanya Mahaprabhu", "texts": "Shikshashtakam", "greeting": "Hare Krishna" },
        "Sikhism": { "persona": "Guru Nanak Dev", "texts": "Guru Granth Sahib (Japji Sahib)", "greeting": "Sat Sri Akal" }
    },
    "Modern Spiritual": {
        "Ramakrishna Mission": { "persona": "Sri Ramakrishna", "texts": "The Gospel of Sri Ramakrishna", "greeting": "Jai Ma" },
        "Advaita Path": { "persona": "Ramana Maharshi", "texts": "Nan Yar? (Who Am I?)", "greeting": "Namaste" },
        "Kriya Yoga": { "persona": "Paramahansa Yogananda", "texts": "Autobiography of a Yogi", "greeting": "God Bless You" },
        "Integral Yoga": { "persona": "Sri Aurobindo", "texts": "The Life Divine, Savitri", "greeting": "Namaste" },
        "Self-Realization": { "persona": "Nisargadatta Maharaj", "texts": "I Am That", "greeting": "Jai Guru" }
    },
    "Ayurveda & Sciences": {
        "Internal Medicine": { "persona": "Maharishi Charaka", "texts": "Charaka Samhita", "greeting": "Hari Om" },
        "Surgery": { "persona": "Maharishi Sushruta", "texts": "Sushruta Samhita", "greeting": "Hari Om" },
        "Clinical Diagnosis": { "persona": "Madhava", "texts": "Madhava Nidana", "greeting": "Hari Om" },
        "General Medicine": { "persona": "Vagbhata", "texts": "Ashtanga Hridayam", "greeting": "Hari Om" }
    },
    "Warid-Varkari Tradition": {
        "Sant Dnyaneshwar": { "persona": "Dnyaneshwar Mauli", "texts": "Dnyaneshwari (Bhavarth Deepika), Amrutanubhav, Changdev Pasashti, Haripath", "greeting": "Ram Krishna Hari" },
        "Sant Namdev": { "persona": "Sant Namdev", "texts": "Namdev Gatha (Abhangas), Mukhbani (included in Guru Granth Sahib)", "greeting": "Ram Krishna Hari" },
        "Sant Eknath": { "persona": "Sant Eknath", "texts": "Eknathi Bhagwat, Bhavarth Ramayana, Rukmini Swayamvar, Bharud (Folk Songs)", "greeting": "Ram Krishna Hari" },
        "Sant Tukaram": { "persona": "Tukaram Maharaj", "texts": "Tukaram Gatha (Mantra Gita)", "greeting": "Ram Krishna Hari" },
        "Sant Janabai": { "persona": "Sant Janabai", "texts": "Abhangas (devotional poetry often compiled in Gathas)", "greeting": "Ram Krishna Hari" },
        "Sant Chokhamela": { "persona": "Sant Chokhamela", "texts": "Abhangas (focused on social equality and devotion)", "greeting": "Ram Krishna Hari" }
    },
    "Samarth Tradition": {
        "Samarth Ramdas": { "persona": "Samarth Ramdas Swami", "texts": "Dasbodh, Manache Shlok, Atmaram, Karunashtakas, Maruti Stotra", "greeting": "Jai Jai Raghuveer Samarth" }
    },
    "Modern Reformer Saints": {
        "Sant Gadge Baba": { "persona": "Gadge Maharaj", "texts": "Teachings on cleanliness and social reform (mostly oral Kirtans)", "greeting": "Gopala Gopala Devakinandan Gopala" },
        "Sant Tukadoji Maharaj": { "persona": "Rashtrasant Tukadoji", "texts": "Gramgeeta", "greeting": "Jai Gurudev" },
        "Sai Baba of Shirdi": { "persona": "Shirdi Sai Baba", "texts": "Sai Satcharitra (recorded by Hemadpant)", "greeting": "Om Sai Ram" },
        "Gajanan Maharaj": { "persona": "Gajanan Maharaj of Shegaon", "texts": "Gajanan Vijay (recorded by Das Ganu)", "greeting": "Gan Gan Ganat Bote" },
        "Swami Samartha": { "persona": "Swami Samartha of Akkalkot ", "texts": "Shri Swami Samarth Charitra (by R.S. Sahasrabuddhe), Dasbodh ", "greeting": "Namaskar" },
        "Swami Vivekanand": { "persona": "Swami Vivekanand  ", "texts": "The Complete Works of Swami Vivekanandaand and Raja Yoga (meditation), Karma Yoga (action), Jnana Yoga (knowledge), and Bhakti Yoga (devotion) ", "greeting": "Namaskar" }
    },
    "Other Notable Saints": {
        "Sant Savata Mali": { "persona": "Sant Savata Mali", "texts": "Abhangas (emphasizing work as worship)", "greeting": "Ram Krishna Hari" },
        "Sant Gora Kumbhar": { "persona": "Sant Gora Kumbhar", "texts": "Abhangas (metaphorical pottery-based devotion)", "greeting": "Ram Krishna Hari" },
        "Sant Muktabai": { "persona": "Muktaai", "texts": "Tatiche Abhang (Verses of the Door)", "greeting": "Ram Krishna Hari" }
    },
    "Early Medieval Resistance (1100s - 1300s)": {
        "Prithviraj Chauhan": { "persona": "Samrat Prithviraj III", "texts": "Prithviraj Raso (by Chand Bardai), Prithviraja Vijaya", "greeting": "Jai Rajputana" },
        "Maharana Pratap": { "persona": "Rana Pratap Singh", "texts": "Rajyabhishek Paddhati, Vishwa Vallabha (Historical records of Mewar)", "greeting": "Jai Eklingji" }
    },
    "The Maratha & Sikh Resistance (1600s - 1700s)": {
        "Chhatrapati Shivaji Maharaj": { "persona": "Shivaji Raje Bhosle", "texts": "Shiva Bharat (by Paramanand), Budhbhushan (by Sambhaji Maharaj)", "greeting": "Jai Jijau, Jai Shivray" },
        "Guru Gobind Singh": { "persona": "Dashmesh Pita", "texts": "Zafarnama (Letter of Victory), Dasam Granth", "greeting": "Waheguru Ji Ka Khalsa" }
    },
    "The 1857 Uprising": {
        "Rani Lakshmibai": { "persona": "Jhansi Ki Rani", "texts": "Majha Pravas (by Vishnubhat Godse - Eyewitness account)", "greeting": "Jai Jhansi" },
        "Tatya Tope": { "persona": "Ramachandra Pandurang Tope", "texts": "The Indian War of Independence 1857 (referenced by Savarkar)", "greeting": "Vande Mataram" }
    },
    "Revolutionary & Modern Era (1900s - 1947)": {
        "Bal Gangadhar Tilak": { "persona": "Lokmanya Tilak", "texts": "Gita Rahasya, The Arctic Home in the Vedas", "greeting": "Swaraj is my birthright" },
        "Vinayak Damodar Savarkar": { "persona": "Veer Savarkar", "texts": "The Indian War of Independence 1857, My Transportation for Life", "greeting": "Vande Mataram" },
        "Mahatma Gandhi": { "persona": "Bapu", "texts": "The Story of My Experiments with Truth, Hind Swaraj", "greeting": "Jai Hind" },
        "Netaji Subhash Chandra Bose": { "persona": "Netaji", "texts": "The Indian Struggle, An Indian Pilgrim", "greeting": "Jai Hind" },
        "Bhagat Singh": { "persona": "Shaheed-e-Azam", "texts": "Why I am an Atheist, Jail Notebook", "greeting": "Inquilab Zindabad" },
        "Jawaharlal Nehru": { "persona": "Chacha Nehru", "texts": "The Discovery of India, Glimpses of World History", "greeting": "Jai Hind" },
        "Dr. B.R. Ambedkar": { "persona": "Babasaheb", "texts": "The Buddha and His Dhamma, Annihilation of Caste, Waiting for a Visa", "greeting": "Jai Bhim" },
        "Maulana Abul Kalam Azad": { "persona": "Maulana Azad", "texts": "India Wins Freedom, Ghubar-e-Khatir", "greeting": "Adaab" },
        "Lala Lajpat Rai": { "persona": "Punjab Kesari", "texts": "Unhappy India, Young India", "greeting": "Vande Mataram" }
    },
    "Prominent Personalities": {
        "Dr. Pihu Gynecology & Women's Health": { "persona": "Gynecology & Women's Health", "texts": "Charaka Samhita (Striroga Chikitsa), Kashyapa Samhita, Sushruta Samhita, Ashtanga Hridaya", "greeting": "Hari Om" },
        "Dr. Rupali - Ayurvedic Cosmetology & Aesthetics": { "persona": "Ayurvedic Cosmetology & Aesthetics", "texts": "Charaka Samhita (Sutrasthana, Chikitsasthana), Sushruta Samhita (Chikitsasthana - Skin diseases), Ashtanga Hridaya (Uttarasthana - Cosmetics), Bhela Samhita, Vagbhata’s Ashtanga Sangraha, Kamasutra by Vatsyayana (Angaraga - Body adornment), Gandhahastividhi (Art of perfumes), Brihat Samhita by Varahamihira (Perfumes & Cosmetics), Kautilya’s Arthashastra, Nighantus (Bhavaprakasha, Dhanvantari, Raja, Madanapala)", "greeting": "Hari Om" },
        "Sachin Tendulkar - Sports & Athletics": { "persona": "Sachin Tendulkar", "texts": "Playing It My Way", "greeting": "Namaste" },
        "Baliraja - Agricultural Science (Krishi Shastra)": { "persona": "Agricultural Science (Krishi Shastra)", "texts": "Krishi-Parashara, Vrikshayurveda, Kashyapiyakrishisukti, Arthashastra", "greeting": "Ram Ram" },
        "Paramahansa Yogananda Spiritual Science & Kriya Yoga": { "persona": "Paramahansa Yogananda", "texts": "Autobiography of a Yogi", "greeting": "Jai Guru" }
    },
    "Laws In India": {
        "Constitution": { "persona": "The Constituent Assembly", "texts": "The Constitution of India, 1950", "greeting": "Satyameva Jayate" },
        "Substantive Criminal Law": { "persona": "Republic of India", "texts": "Bharatiya Nyaya Sanhita (BNS), 2023", "greeting": "Satyameva Jayate" },
        "Criminal Procedure": { "persona": "Republic of India", "texts": "Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023", "greeting": "Satyameva Jayate" },
        "Law of Evidence": { "persona": "Republic of India", "texts": "Bharatiya Sakshya Adhiniyam (BSA), 2023", "greeting": "Satyameva Jayate" },
        "Direct Taxes": { "persona": "Income Tax Department", "texts": "Income Tax Act, 1961", "greeting": "Satyameva Jayate" },
        "Indirect Taxes": { "persona": "GST Council", "texts": "Central Goods and Services Tax (CGST) Act, 2017", "greeting": "Satyameva Jayate" },
        "Customs": { "persona": "Central Board of Indirect Taxes", "texts": "Customs Act, 1962", "greeting": "Satyameva Jayate" },
        "Electoral Process": { "persona": "Election Commission of India", "texts": "Representation of the People Act, 1951", "greeting": "Jai Hind" },
        "Voter Registration": { "persona": "Election Commission of India", "texts": "Registration of Electors Rules, 1960", "greeting": "Jai Hind" },
        "Civil Procedure": { "persona": "Indian Judiciary", "texts": "Code of Civil Procedure (CPC), 1908", "greeting": "Satyameva Jayate" },
        "Business & Contracts": { "persona": "Republic of India", "texts": "Indian Contract Act, 1872", "greeting": "Satyameva Jayate" },
        "Central Police Framework": { "persona": "Ministry of Home Affairs", "texts": "The Police Act, 1861", "greeting": "Jai Hind" },
        "State Police Framework": { "persona": "State Home Department", "texts": "Maharashtra Police Act, 1951", "greeting": "Jai Maharashtra" },
        "Road Safety & Violations": { "persona": "Traffic Police Department", "texts": "Motor Vehicles Act, 1988 (Amended 2019)", "greeting": "Drive Safe, Jai Hind" },
        "Transport Rules": { "persona": "Ministry of Road Transport", "texts": "Central Motor Vehicles Rules, 1989", "greeting": "Satyameva Jayate" }
    },
    "Dharma Shastra": {
        "Arthashastra": { persona: "Chanakya", texts: "Arthashastra", "greeting": "Hari Om" },
        "Nitisara": { persona: "Kamandaka", texts: "Nitisara", "greeting": "Hari Om" },
        "Manusmriti": { persona: "Manu", texts: "Manusmriti", "greeting": "Hari Om" },
        "Yajnavalkya Smriti": { persona: "Maharishi Yajnavalkya", texts: "Yajnavalkya Smriti", "greeting": "Hari Om" }
    },
    "Maharishis": maharishiObject
};

// --- 3. DOM & STATE ---
const UI = {
    overlay: document.getElementById('start-overlay'),
    log: document.getElementById('conversation-log'),
    itemSel: document.getElementById('item-selector'),
    lang: document.getElementById('language-selector'),
    status: document.getElementById('status-indicator'),
    textIn: document.getElementById('text-input'),
    btnSend: document.getElementById('btn-send'),
    btnMic: document.getElementById('btn-mic'),
    iconMicDefault: document.getElementById('icon-mic-default'),
    iconMicThinking: document.getElementById('icon-mic-thinking'),
    btnRepeat: document.getElementById('btn-repeat'),
    btnPlayPause: document.getElementById('btn-play-pause'),
    btnStop: document.getElementById('btn-stop'),
    btnMute: document.getElementById('btn-mute'),
    btnRestart: document.getElementById('btn-restart'),
    btnShare: document.getElementById('btn-share'),
    btnPasteKey: document.getElementById('btn-paste-key'),
    iconPlay: document.getElementById('icon-play'),
    iconPause: document.getElementById('icon-pause'),
    iconVol: document.getElementById('icon-vol'),
    iconMute: document.getElementById('icon-mute'),
    
    advToggle: document.getElementById('adv-toggle'),
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSet: document.getElementById('btn-close-settings'),
    btnSaveSet: document.getElementById('btn-save-settings'),
    name: document.getElementById('manual-name'),
    age: document.getElementById('manual-age'),
    remember: document.getElementById('remember-checkbox'),
    keyIn: document.getElementById('custom-api-key-input'),
    welcome: document.getElementById('welcome-msg'),
    ratioSlider: document.getElementById('ratio-slider'),
    modelSlider: document.getElementById('model-slider'),
    ratioVal: document.getElementById('ratio-val'),
    modelVal: document.getElementById('model-val')
};

let chatHistory = [];
let recognition = null;
let synth = window.speechSynthesis;
let isListening = false; 

let state = { isProcessing: false, isMuted: false, lastAIMessage: "", sessionActive: false };

// --- 4. INITIALIZATION ---
window.onload = () => {
    // Populate Single Dropdown with Groups as Headers
    UI.itemSel.innerHTML = '';
    for (const groupName in LIBRARY_CONFIG) {
        const optGroup = document.createElement('optgroup');
        optGroup.label = `--- ${groupName} ---`;
        
        for (const itemName in LIBRARY_CONFIG[groupName]) {
            const option = document.createElement('option');
            // Store both group and item in the value to retrieve it later easily
            option.value = `${groupName}|${itemName}`;
            option.text = itemName;
            optGroup.appendChild(option);
        }
        UI.itemSel.appendChild(optGroup);
    }

    loadData();
    initSpeechRecognition();
};

UI.overlay.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
    acquireWakeLock();
    const silent = new SpeechSynthesisUtterance('');
    silent.volume = 0; synth.speak(silent);
    UI.overlay.style.display = 'none';
    setupEventListeners();
});

// --- 5. CORE FUNCTIONS ---
function getSelectedConfig() {
    const [group, item] = UI.itemSel.value.split('|');
    return LIBRARY_CONFIG[group][item];
}

function getSelectedItemName() {
    return UI.itemSel.value.split('|')[1];
}

function getModelInfo(val) {
    val = parseInt(val);
    if(val === 20) return { name: "Flash-Lite", id: "gemini-2.5-flash-lite" };
    if(val === 40) return { name: "Flash", id: "gemini-3.1-flash" };
    if(val === 60) return { name: "Thinking", id: "gemini-2.0-flash-thinking-exp-01-21" }; 
    if(val === 80) return { name: "Pro", id: "gemini-3.1-pro" };
    return { name: "Flash", id: "gemini-3.1-flash" };
}

function updateSliderLabels() {
    const rVal = UI.ratioSlider.value;
    UI.ratioVal.innerText = `${rVal}% Book / ${100 - rVal}% AI`;
    
    const mVal = UI.modelSlider.value;
    UI.modelVal.innerText = `${getModelInfo(mVal).name} (${mVal}%)`;
}

function updateSliderAvailability() {
    // Check if user has entered a plausible API key (min 10 chars)
    const hasKey = UI.keyIn.value.trim().length > 10;
    const container = document.getElementById('advanced-sliders-container');
    const warning = document.getElementById('api-key-warning');
    
    UI.ratioSlider.disabled = !hasKey;
    UI.modelSlider.disabled = !hasKey;
    
    if (hasKey) {
        container.style.opacity = "1";
        warning.style.display = "none";
        UI.ratioSlider.classList.remove('cursor-not-allowed');
        UI.ratioSlider.classList.add('cursor-pointer');
        UI.modelSlider.classList.remove('cursor-not-allowed');
        UI.modelSlider.classList.add('cursor-pointer');
    } else {
        container.style.opacity = "0.5";
        warning.style.display = "block";
        UI.ratioSlider.classList.add('cursor-not-allowed');
        UI.ratioSlider.classList.remove('cursor-pointer');
        UI.modelSlider.classList.add('cursor-not-allowed');
        UI.modelSlider.classList.remove('cursor-pointer');
        
        // Force reset to default safe values if they delete their key
        UI.ratioSlider.value = "80";
        UI.modelSlider.value = "40";
        updateSliderLabels();
    }
}

function saveData() {
    localStorage.setItem('darshan_name', UI.name.value);
    localStorage.setItem('darshan_age', UI.age.value);
    localStorage.setItem('darshan_remember', UI.remember.checked);
    localStorage.setItem('darshan_ratio', UI.ratioSlider.value);
    localStorage.setItem('darshan_model', UI.modelSlider.value);
    
    if (UI.remember.checked && chatHistory.length > 0) {
        localStorage.setItem('darshan_history', JSON.stringify(chatHistory));
    } else { 
        localStorage.removeItem('darshan_history'); 
    }
}

function loadData() {
    UI.name.value = localStorage.getItem('darshan_name') || "";
    UI.age.value = localStorage.getItem('darshan_age') || "";
    UI.remember.checked = localStorage.getItem('darshan_remember') === 'true';
    
    UI.ratioSlider.value = localStorage.getItem('darshan_ratio') || "80";
    UI.modelSlider.value = localStorage.getItem('darshan_model') || "40";
    updateSliderLabels(); // Initialize the text visually
    
    if (UI.remember.checked) {
        const savedHist = localStorage.getItem('darshan_history');
        if (savedHist) {
            try {
                chatHistory = JSON.parse(savedHist);
                if (chatHistory.length > 0) {
                    UI.welcome.style.display = 'none';
                    chatHistory.forEach(msg => renderMessage(msg.role === 'user' ? (UI.name.value || "Bhakt") : getSelectedItemName(), msg.parts[0].text, msg.role === 'model'));
                    const lastModel = [...chatHistory].reverse().find(m => m.role === 'model');
                    if (lastModel) state.lastAIMessage = lastModel.parts[0].text;
                }
            } catch (e) { }
        }
    }

    // Lock or unlock based on saved/auto-filled key
    updateSliderAvailability();
}

function clearData() {
    chatHistory = []; state.lastAIMessage = ""; localStorage.removeItem('darshan_history');
    UI.log.innerHTML = `<div class="text-gray-400 text-center mt-12 cinzel"><p class="text-yellow-500 text-xl mb-2">🙏 Memory Cleared 🙏</p>Begin anew.</div>`;
    synth.cancel();
}

function setupEventListeners() {
    UI.ratioSlider.addEventListener('input', updateSliderLabels);
    UI.modelSlider.addEventListener('input', updateSliderLabels);
    UI.keyIn.addEventListener('input', updateSliderAvailability);

    const openSettings = (e) => { e.stopPropagation(); UI.settingsModal.classList.remove('hidden'); };
    const closeSettings = (e) => { e.stopPropagation(); UI.settingsModal.classList.add('hidden'); };
    const fabContainer = document.getElementById('mainFab');
    const fabToggle = document.getElementById('fabToggle');
    
    fabToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        fabContainer.classList.toggle('active');
    });

    // Close the widget if clicking anywhere outside of it
    document.addEventListener('click', (e) => {
        if (fabContainer.classList.contains('active') && !fabContainer.contains(e.target)) {
            fabContainer.classList.remove('active');
        }
    });

    // --- NEW PASTE BUTTON LOGIC ---
    UI.btnPasteKey.addEventListener('click', async (e) => {
        e.stopPropagation(); 
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                UI.keyIn.value = text;
                updateSliderAvailability(); // Unlock immediately
                
                const originalText = UI.btnPasteKey.innerText;
                UI.btnPasteKey.innerText = "Pasted!";
                UI.btnPasteKey.classList.replace('bg-slate-700', 'bg-green-600');
                
                setTimeout(() => { 
                    UI.btnPasteKey.innerText = originalText; 
                    UI.btnPasteKey.classList.replace('bg-green-600', 'bg-slate-700');
                }, 1500);
            }
        } catch (err) {
            alert('Could not access clipboard. Please paste manually.');
        }
    });
    UI.advToggle.onclick = openSettings;
    UI.btnCloseSet.onclick = closeSettings;
    UI.btnSaveSet.onclick = (e) => { e.stopPropagation(); saveData(); closeSettings(e); };
    UI.settingsModal.addEventListener('click', e => e.stopPropagation());

    UI.btnPlayPause.onclick = (e) => { e.stopPropagation(); if(synth.paused) { synth.resume(); togglePlayIcon(false); } else if(synth.speaking) { synth.pause(); togglePlayIcon(true); } };
    UI.btnStop.onclick = (e) => { e.stopPropagation(); synth.cancel(); togglePlayIcon(true); };
    UI.btnRepeat.onclick = (e) => { e.stopPropagation(); if(state.lastAIMessage) speakText(state.lastAIMessage, UI.lang.value); };
    UI.btnMute.onclick = (e) => { e.stopPropagation(); state.isMuted = !state.isMuted; if(state.isMuted) { synth.cancel(); UI.iconVol.classList.add('hidden'); UI.iconMute.classList.remove('hidden'); } else { UI.iconVol.classList.remove('hidden'); UI.iconMute.classList.add('hidden'); } };

    UI.btnRestart.onclick = (e) => { e.stopPropagation(); clearData(); };
    UI.btnShare.onclick = async (e) => { e.stopPropagation(); if(chatHistory.length === 0) return; let text = chatHistory.map(m => `${m.role === 'user' ? 'User' : getSelectedItemName()}: ${m.parts[0].text}`).join("\n\n"); try { await navigator.share({ title: 'Ancient Library Wisdom', text: text }); } catch(err) {} };
    
    // Close App Logic (Top Left Button)
    document.getElementById('btn-close-app').addEventListener('click', (e) => {
        e.stopPropagation();
        
        if(confirm("Are you sure you want to depart from the ancient library?")) {
            // Attempt to close mobile browsers
            window.open('', '_self', '');
            window.close();

            // If wrapped in an Android App
            try { if (window.Android && window.Android.closeApp) window.Android.closeApp(); } catch(err) {}

            // The Guaranteed Fallback: Graceful "Deep Sleep" Visual Shutdown
            setTimeout(() => {
                window.speechSynthesis.cancel();
                if (typeof recognition !== 'undefined' && recognition && isListening) {
                    recognition.stop();
                }
                
                document.body.innerHTML = `
                    <div style="height:100vh; width:100vw; display:flex; flex-direction:column; align-items:center; justify-content:center; background-color:#020617; color:#fbbf24; font-family:'Cinzel', serif; z-index:9999; position:fixed; top:0; left:0; text-align:center; padding: 20px;">
                        <div style="font-size: 4rem; margin-bottom: 10px; text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);">ॐ</div>
                        <div style="font-size: 1.5rem; letter-spacing: 2px; margin-bottom: 15px;">Session Concluded.</div>
                        <div style="font-size: 0.9rem; color:#64748b; font-family:'Inter', sans-serif;">The library has been sealed.<br>You may safely close this browser tab.</div>
                    </div>
                `;
            }, 200); 
        }
    });
    UI.btnSend.onclick = (e) => { e.stopPropagation(); processInput(UI.textIn.value); };
    UI.textIn.onkeypress = (e) => { e.stopPropagation(); if(e.key === 'Enter') processInput(UI.textIn.value); };

    UI.btnMic.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.isProcessing || !recognition) return;
        if (isListening) { recognition.stop(); } 
        else { recognition.lang = UI.lang.value; try { recognition.start(); } catch(err) {} }
    });
}

function initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    recognition = new SpeechRec();
    recognition.continuous = false; 
    recognition.interimResults = false; 
    
    recognition.onstart = () => {
        isListening = true;
        UI.btnMic.classList.add('mic-pulse');
        UI.status.style.backgroundColor = '#ef4444'; 
        UI.textIn.value = '';
        UI.textIn.placeholder = "Listening... Speak now.";
    };
    recognition.onresult = (e) => {
        const transcript = e.results[e.results.length - 1][0].transcript.trim();
        if (transcript) { UI.textIn.value = transcript; processInput(transcript); }
    };
    recognition.onend = () => {
        isListening = false;
        if (!state.isProcessing) resetMicUI();
    };
    recognition.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'not-allowed') { isListening = false; resetMicUI(); }
    };
}

function resetMicUI() {
    UI.btnMic.classList.remove('mic-pulse');
    UI.status.style.backgroundColor = '#4b5563'; 
    UI.textIn.placeholder = "Type your message...";
    setMicThinkingState(false);
}

function togglePlayIcon(isPaused) {
    if(isPaused) { UI.iconPause.classList.add('hidden'); UI.iconPlay.classList.remove('hidden'); }
    else { UI.iconPause.classList.remove('hidden'); UI.iconPlay.classList.add('hidden'); }
}

function setMicThinkingState(isThinking) {
    if (isThinking) {
        UI.btnMic.classList.add('mic-thinking');
        UI.btnMic.classList.remove('mic-pulse');
        UI.iconMicDefault.classList.add('hidden');
        UI.iconMicThinking.classList.remove('hidden');
    } else {
        UI.btnMic.classList.remove('mic-thinking');
        UI.iconMicDefault.classList.remove('hidden');
        UI.iconMicThinking.classList.add('hidden');
    }
}

async function processInput(userText) {
    userText = userText.trim();
    if (!userText || state.isProcessing) return;

    UI.textIn.value = '';
    UI.textIn.placeholder = "Consulting ancient texts...";
    if (UI.welcome) UI.welcome.style.display = 'none';
    
    state.isProcessing = true;
    UI.status.style.backgroundColor = '#facc15'; 
    setMicThinkingState(true);
    
    const config = getSelectedConfig();

    if (chatHistory.length === 0) {
        chatHistory.push({ role: 'user', parts: [{ text: "Pranam." }] });
        chatHistory.push({ role: 'model', parts: [{ text: `${config.greeting}. I am here to share wisdom.` }] });
    }

    const userName = UI.name.value || "Bhakt";
    renderMessage(userName, userText, false);
    chatHistory.push({ role: 'user', parts: [{ text: userText }] });
    saveData();

    try {
        const res = await getAIResponse(chatHistory, config);
        const cleanRes = res.replace(/[*#`_\[\]()]/g, '').trim();
        
        state.lastAIMessage = cleanRes;
        chatHistory.push({ role: 'model', parts: [{ text: cleanRes }] });
        renderMessage(getSelectedItemName(), cleanRes, true);
        saveData();
        
        if (!state.isMuted) speakText(cleanRes, UI.lang.value);
    } catch (err) {
        renderMessage("System", "⚠️ Divine connection interrupted. Please try again.", true);
    }

    state.isProcessing = false;
    resetMicUI();
}

async function getAIResponse(history, config) {
    const customKey = (UI.keyIn.value.length > 10) ? UI.keyIn.value : null;
    const headers = { 'Content-Type': 'application/json' };
    if (customKey) headers['X-Custom-Api-Key'] = customKey;

    let contextAddon = "";
    if (UI.age.value) contextAddon = ` The user is ${UI.age.value} years old. Adjust the complexity of your explanation accordingly.`;
    if (UI.name.value) contextAddon += ` Address them compassionately as ${UI.name.value}.`;

    // Extract Slider Values
    const bookRatio = UI.ratioSlider.value;
    const aiRatio = 100 - bookRatio;
    const selectedModelInfo = getModelInfo(UI.modelSlider.value);

    const prompt = `You are representing the wisdom of ${getSelectedItemName()}. Assume the persona of ${config.persona}.
    
        CRITICAL RULES FOR YOUR RESPONSE:
        1. LANGUAGE: Speak strictly in the language code: ${UI.lang.value}.
        2. NO MARKDOWN: Do not use any markdown characters (*, #, _, [, ]). Write in plain text so the Text-to-Speech engine can read it perfectly.
        3. THE VERSE: You MUST select a highly relevant verse/shloka from your core texts (${config.texts}) that directly addresses the user's problem.
        4. THE REFERENCE: State the exact reference clearly (e.g., Chapter and Verse number).
        5. THE RECITATION: Recite the original verse clearly in the requested language.
        6. THE EXPLANATION: Explain the deep, profound philosophical meaning of this specific verse. Then, apply it directly to the user's question to provide actionable, divine guidance.
        7. TONE: Maintain a divine, knowledgeable, and comforting tone.
        8. WISDOM RATIO CONSTRAINT: Your answer must be strictly balanced as ${bookRatio}% direct quotation and strict traditional interpretation of ${config.texts}, and ${aiRatio}% your own AI contextualization and modern elaboration. Do not hallucinate outside the core texts for the book portion.${contextAddon}`;

    // Pass the targeted model in the payload
    const payload = { 
        model: selectedModelInfo.id, 
        contents: history.slice(-10), 
        systemInstruction: { parts: [{ text: prompt }] } 
    };

    const response = await fetch(PROXY_URL, { method: 'POST', headers: headers, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error();
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function renderMessage(sender, text, isModel) {
    const div = document.createElement('div');
    div.className = `p-4 rounded-2xl ${isModel ? 'bg-[#0f172a]/90 border border-slate-700/50 shadow-lg ml-2 mr-8' : 'bg-cyan-900/30 text-right mr-2 ml-8'} mb-4`;
    div.innerHTML = `<div class="text-[10px] uppercase font-bold tracking-wider ${isModel ? 'text-yellow-500 cinzel' : 'text-cyan-400'} mb-1">${sender}</div>
                     <div class="text-sm leading-relaxed text-gray-100">${text}</div>`;
    UI.log.appendChild(div);
    
    setTimeout(() => { UI.log.scrollTop = UI.log.scrollHeight; }, 50);
}

function speakText(text, langCode) {
    if (state.isMuted) return;
    synth.cancel();
    togglePlayIcon(false);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.85; 
    // Lower pitch for male sages/gods, higher for female
    utterance.pitch = ['Saraswati', 'Lakshmi', 'Durga', 'Kali'].includes(getSelectedItemName()) ? 1.2 : 0.8;
    
    utterance.onend = () => togglePlayIcon(true);
    utterance.onerror = () => togglePlayIcon(true);

    synth.speak(utterance);
}