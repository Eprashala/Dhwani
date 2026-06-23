// card.js - The Deep Tarot Database (Part 1: The Major Arcana)

const majorArcanaData = [
    { 
        name: "The Fool", img: "maj00.jpg", 
        description: "A young man stands on the edge of a cliff, looking up at the sky, seemingly unaware of the drop ahead. He holds a white rose (purity) and a small bundle. A small white dog leaps at his feet.",
        upright: "The ultimate leap of faith. Pure innocence, spontaneity, and a free spirit. Trust the universe and step into the unknown.", 
        reversed: "Recklessness, holding back from a necessary risk, or acting with naive foolishness. Ignoring clear warnings." 
    },
    { 
        name: "The Magician", img: "maj01.jpg", 
        description: "A figure stands pointing one arm to the heavens and the other to the earth. On his table lay a Cup, Pentacle, Sword, and Wand—representing all the elemental tools.",
        upright: "Pure manifestation and resourcefulness. You have all the skills and spiritual backing necessary to make your desires a reality. Inspired action.", 
        reversed: "Manipulation, poor planning, untapped potential, or falling for an illusion." 
    },
    { 
        name: "The High Priestess", img: "maj02.jpg", 
        description: "She sits between the black and white pillars of severity and mercy. Behind her is a veil of pomegranates. A crescent moon rests at her feet, and she holds a scroll of esoteric knowledge.",
        upright: "Deep intuition, the subconscious mind, and divine mystery. The answers you seek are hidden within. Trust your gut feeling entirely.", 
        reversed: "Ignoring your intuition, keeping hidden agendas, or feeling profoundly disconnected from your inner voice." 
    },
    { 
        name: "The Empress", img: "maj03.jpg", 
        description: "A beautiful woman sits on a throne surrounded by lush nature, a flowing river, and a field of wheat. She wears a crown of twelve stars representing the zodiac.",
        upright: "The Divine Feminine. Extreme abundance, nurturing energy, creation, and fertility. A time of growth and sensual enjoyment of life.", 
        reversed: "Smothering behavior, creative blocks, or neglecting your own self-care while caring for others." 
    },
    { 
        name: "The Emperor", img: "maj04.jpg", 
        description: "A stern ruler sits on a stone throne adorned with rams' heads. He holds a globe and a scepter. The mountains behind him are barren, representing a foundation built on solid rock.",
        upright: "The Divine Masculine. Structure, stability, authority, and building a solid foundation. Success comes through discipline.", 
        reversed: "Tyranny, rigidity, a complete lack of discipline, or an abuse of power." 
    },
    { 
        name: "The Hierophant", img: "maj05.jpg", 
        description: "A religious figure sits between two pillars, wearing a three-tiered crown and holding a papal cross. Two initiates kneel before him to receive institutional wisdom.",
        upright: "Tradition, spiritual guidance, conformity, and established belief systems. Seek a mentor or commit to a structured learning process.", 
        reversed: "Rebellion, breaking out of orthodox structures, and questioning the status quo." 
    },
    { 
        name: "The Lovers", img: "maj06.jpg", 
        description: "Adam and Eve stand naked in the Garden of Eden beneath the archangel Raphael. The Tree of Knowledge and the Tree of Life stand behind them.",
        upright: "Alignment of values, deep partnerships, and crucial, soul-aligned choices. Perfect harmony and mutual attraction.", 
        reversed: "Disharmony, misaligned values, broken trust, or a difficult choice being avoided." 
    },
    { 
        name: "The Chariot", img: "maj07.jpg", 
        description: "A warrior stands in a chariot driven by two sphinxes—one black, one white. He holds no reins, steering the beasts by sheer force of will and mental discipline.",
        upright: "Triumph through discipline, overcoming obstacles, and maintaining absolute focus. You are in the driver's seat.", 
        reversed: "Loss of control, aggression, moving too fast, or being pulled in opposing directions." 
    },
    { 
        name: "Strength", img: "maj08.jpg", 
        description: "A woman calmly and gently closes the jaws of a fierce lion. Above her head floats the infinity symbol. She controls the beast not with force, but with quiet compassion.",
        upright: "Gentle courage, compassion, and taming the inner beast. Mastering raw emotions through love and patience.", 
        reversed: "Self-doubt, raw emotion overpowering logic, or physical weakness." 
    },
    { 
        name: "The Hermit", img: "maj09.jpg", 
        description: "An old man stands alone on a dark, snowy mountain peak. He holds a staff for support and a lantern containing a glowing six-pointed star to light his own way.",
        upright: "Soul-searching, introspection, and seeking inner guidance. A necessary withdrawal from the noise of the world to find your own truth.", 
        reversed: "Isolation, loneliness, withdrawing too far from the world, or ignoring wise counsel." 
    },
    { 
        name: "Wheel of Fortune", img: "maj10.jpg", 
        description: "A giant wheel floats in the sky, inscribed with alchemical symbols. Figures of Anubis, a snake, and a sphinx ride the wheel, while the four evangelists watch from the corners.",
        upright: "Karma, turning points, and the inevitable cycles of destiny. Good luck and sudden shifts in your favor.", 
        reversed: "Bad luck, clinging to control, or resisting the necessary turning of life's cycles." 
    },
    { 
        name: "Justice", img: "maj11.jpg", 
        description: "A crowned figure sits holding a double-edged sword in one hand (action) and a set of scales in the other (balance). She looks directly forward, demanding absolute truth.",
        upright: "Fairness, truth, the law of cause and effect. Accountability, legal matters resolving fairly, and karmic balance.", 
        reversed: "Dishonesty, unfair treatment, avoiding accountability, or a skewed sense of morality." 
    },
    { 
        name: "The Hanged Man", img: "maj12.jpg", 
        description: "A man is suspended upside down from a living T-cross tree by one ankle. His expression is peaceful, and a halo glows around his head, indicating a willing spiritual sacrifice.",
        upright: "Surrender, changing your perspective, and a necessary pause. Letting go of control to gain profound enlightenment.", 
        reversed: "Stalling, needless sacrifice, stubbornness, or feeling like a helpless victim." 
    },
    { 
        name: "Death", img: "maj13.jpg", 
        description: "A skeleton in black armor rides a white horse, trampling over a king while a bishop, child, and maiden beg for mercy. In the background, a sun rises between two towers.",
        upright: "Profound transformation, necessary endings making way for beginnings, and the shedding of old skin. A powerful transition.", 
        reversed: "Fear of change, holding onto a dead situation, or resisting a necessary transformation." 
    },
    { 
        name: "Temperance", img: "maj14.jpg", 
        description: "An angel stands with one foot on land and one in the water, pouring liquid smoothly between two cups. A path leads up to a glowing crown in the distant mountains.",
        upright: "Balance, moderation, alchemy, and blending opposites to create something new. Patience and finding the middle path.", 
        reversed: "Extremes, imbalance, rushing a delicate process, or clashing elements." 
    },
    { 
        name: "The Devil", img: "maj15.jpg", 
        description: "A satyr-like demon sits on a black cube. A naked man and woman are chained to the cube, but the chains around their necks are loose enough to be slipped off at any time.",
        upright: "Shadow self, unhealthy attachments, addiction, and feeling trapped by materialism or lust. An illusion of powerlessness.", 
        reversed: "Breaking chains, releasing toxic dependencies, and facing your inner shadows." 
    },
    { 
        name: "The Tower", img: "maj16.jpg", 
        description: "Lightning strikes a tall tower built on a jagged rock, setting the crown ablaze. Two figures fall headfirst from the windows into the darkness below.",
        upright: "Sudden upheaval, the breaking of false foundations, and chaotic revelation. The painful but necessary destruction of what is not built on truth.", 
        reversed: "Prolonging the inevitable disaster, fear of suffering, or narrowly avoiding a massive crisis." 
    },
    { 
        name: "The Star", img: "maj17.jpg", 
        description: "A naked woman kneels by a pool of water, pouring one jug onto the land and one into the water. Above her, a massive yellow star shines alongside seven smaller stars.",
        upright: "Hope, spiritual healing, and renewal after the storm. A period of profound peace, inspiration, and cosmic connection.", 
        reversed: "Despair, disconnection, lack of faith in the future, or feeling uninspired." 
    },
    { 
        name: "The Moon", img: "maj18.jpg", 
        description: "A crayfish crawls out of a dark pool onto a path that winds between two towers. A dog and a wolf howl at a weeping moon in the sky.",
        upright: "Illusion, anxiety, the subconscious, and navigating the dark by intuition alone. Things are not as they seem.", 
        reversed: "Releasing fear, unmasking deception, finding clarity, or waking up from a confusing dream." 
    },
    { 
        name: "The Sun", img: "maj19.jpg", 
        description: "A naked child rides a white horse in front of a wall of sunflowers, holding a red banner. A massive, radiant sun shines above, radiating pure joy.",
        upright: "Joy, success, absolute clarity, and vital life force. The purest positive energy and realization of your goals.", 
        reversed: "Temporary sadness, delayed success, inner child wounds, or struggling to see the light in a situation." 
    },
    { 
        name: "Judgement", img: "maj20.jpg", 
        description: "The Archangel Gabriel blows his trumpet from the heavens. Below, naked figures rise up from their floating coffins, their arms outstretched in awakening.",
        upright: "Absolution, an awakening, answering a higher calling, and profound rebirth. Seeing the ultimate truth of your life's purpose.", 
        reversed: "Self-doubt, ignoring the call, harsh self-criticism, or refusing to learn karmic lessons." 
    },
    { 
        name: "The World", img: "maj21.jpg", 
        description: "A dancing figure wrapped in a purple scarf holds two wands inside a massive laurel wreath. The four evangelists watch from the corners of the card.",
        upright: "Completion, integration, absolute fulfillment, and the successful end of a major cycle. You have achieved wholeness.", 
        reversed: "Lack of closure, unfinished business, delays in reaching the finish line, or an inability to move on." 
    }
];

// ... (End of Part 1. Leave a space here for Part 2)

// --- Part 2: The Minor Arcana (Wands & Cups) ---

const minorArcanaDataPart1 = [
    // --- SUIT OF WANDS (Fire, Passion, Action, Willpower) ---
    {
        name: "Ace of Wands", img: "wands01.jpg",
        description: "A glowing hand emerges from the clouds, holding a sturdy, living branch sprouting fresh green leaves. In the background, a castle sits atop a hill, symbolizing distant goals.",
        upright: "A massive spark of divine inspiration, explosive creative energy, and a bold new beginning. You are being handed the raw fire of passion to start a new journey.",
        reversed: "Creative blocks, delays in a project, lacking the energy to start, or a brilliant idea that fizzles out before it can take root."
    },
    {
        name: "Two of Wands", img: "wands02.jpg",
        description: "A wealthy merchant stands on his castle roof, holding a small globe in his hand and looking out over the vast ocean and mountains. He has one wand planted firmly, and holds the other.",
        upright: "Future planning, stepping out of your comfort zone, and recognizing your own vast potential. You hold the world in your hands; now you must decide where to go.",
        reversed: "Fear of the unknown, playing it too safe, poor planning, or feeling trapped in your current circumstances."
    },
    {
        name: "Three of Wands", img: "wands03.jpg",
        description: "A man stands on a cliff, turning his back to us, watching his golden ships sail in across the sea. Three sturdy wands are planted in the ground around him.",
        upright: "Expansion, foresight, and the initial rewards of your labor. Your ships are coming in, and your long-term plans are actively taking motion.",
        reversed: "Delays, frustrating obstacles, lack of foresight, or feeling like your efforts are not paying off as quickly as you hoped."
    },
    {
        name: "Four of Wands", img: "wands04.jpg",
        description: "Two figures joyfully wave bouquets of flowers beneath a beautiful canopy tied to four wands. A glowing yellow castle stands in the background during a time of celebration.",
        upright: "Joyous celebration, harmony, homecoming, and establishing a secure, happy foundation. A beautiful milestone has been reached.",
        reversed: "A fleeting moment of disharmony, feeling unwelcome, or a delay in a celebration or milestone event."
    },
    {
        name: "Five of Wands", img: "wands05.jpg",
        description: "Five young men wave their wands in the air, seeming to fight or compete with one another. However, nobody is actually being struck; it is a clash of chaotic energy.",
        upright: "Conflict, competition, creative friction, and clashing egos. It is a chaotic environment, but this friction may be necessary to forge a better idea.",
        reversed: "Avoiding conflict at all costs, passive-aggression, inner turmoil, or finally resolving a tense argument."
    },
    {
        name: "Six of Wands", img: "wands06.jpg",
        description: "A victorious rider sits on a white horse, wearing a laurel wreath of triumph on his head. The crowd cheers around him as he carries a wand also adorned with a wreath.",
        upright: "Public recognition, massive success, victory, and glowing self-confidence. You are being acknowledged for your hard work and shining brightly.",
        reversed: "Ego taking over, a fall from grace, lack of recognition, or feeling completely overlooked despite your efforts."
    },
    {
        name: "Seven of Wands", img: "wands07.jpg",
        description: "A man stands atop a craggy hill, fiercely defending his position against six wands thrusting upward at him from below. He wears one mismatched shoe, showing he was caught off guard.",
        upright: "Holding your ground, fierce defense, and maintaining your boundaries. You are in a position of power, but you must fight to keep it.",
        reversed: "Exhaustion, giving up, feeling overwhelmed by challengers, or a collapse of your personal boundaries."
    },
    {
        name: "Eight of Wands", img: "wands08.jpg",
        description: "Eight blossoming wands fly diagonally through the open air at high speed, soaring over a clear river and peaceful landscape. There are no human figures to slow them down.",
        upright: "Rapid action, sudden movement, fast-paced communication, and travel. Things are progressing at lightning speed—catch the momentum.",
        reversed: "Delays, panicked rushing, miscommunication, or feeling completely out of control as things move too fast."
    },
    {
        name: "Nine of Wands", img: "wands09.jpg",
        description: "A weary, wounded man leans on a wand, looking over his shoulder with paranoia. Behind him stands a solid wall of eight wands. He has been through the fire, but he is still standing.",
        upright: "Resilience, grit, pushing through the final test, and defending your boundaries. You are exhausted, but you have the strength for one last push.",
        reversed: "Extreme burnout, giving up right before the finish line, paranoia, or feeling completely defensive and trapped."
    },
    {
        name: "Ten of Wands", img: "wands10.jpg",
        description: "A man struggles under the crushing weight of ten heavy wands, his head bowed down so he cannot even see the path ahead. He is slowly making his way toward a distant town.",
        upright: "A heavy burden, extreme responsibility, and overworking yourself. You are carrying too much and must learn to delegate before you break.",
        reversed: "A total collapse from stress, letting go of responsibilities, or finally unburdening yourself from a load that wasn't yours to carry."
    },
    {
        name: "Page of Wands", img: "wands11.jpg",
        description: "A boldly dressed youth stands in a barren desert, looking up at the budding wand in his hands with immense wonder and curiosity. His tunic is patterned with salamanders.",
        upright: "A sudden spark of inspiration, a new fiery passion, curiosity, and boundless enthusiasm. A messenger bringing exciting, energetic news.",
        reversed: "Hasty actions, a lack of direction, unreliability, or a brilliant idea that you fail to execute."
    },
    {
        name: "Knight of Wands", img: "wands12.jpg",
        description: "A fierce knight in yellow armor rides a rearing chestnut horse. He wears a tunic of salamanders and a helmet with a fiery plume, charging recklessly into the desert.",
        upright: "Explosive energy, passion, adventure, and fearless action. You are charging forward with absolute confidence.",
        reversed: "Recklessness, arrogance, impulsiveness, anger, or burning out from moving too fast without a plan."
    },
    {
        name: "Queen of Wands", img: "wands13.jpg",
        description: "A majestic queen sits on a throne adorned with lions and sunflowers. She holds a wand in one hand and a sunflower in the other. A black cat sits at her feet, representing her independent magic.",
        upright: "Charisma, fierce independence, warmth, and vibrant confidence. You are magnetic, bold, and fully in your power.",
        reversed: "Insecurity, jealousy, demanding attention, or shrinking yourself to make others comfortable."
    },
    {
        name: "King of Wands", img: "wands14.jpg",
        description: "A charismatic king sits on his throne, wearing a crown shaped like leaping flames. A small salamander rests near his feet, representing his absolute mastery over the element of fire.",
        upright: "Natural leadership, grand vision, entrepreneurial spirit, and commanding respect. You have the experience to lead others with passion.",
        reversed: "A domineering tyrant, impulsiveness, high expectations, or using aggression to control others."
    },

    // --- SUIT OF CUPS (Water, Emotions, Intuition, Relationships) ---
    {
        name: "Ace of Cups", img: "cups01.jpg",
        description: "A hand emerges from the clouds holding a chalice overflowing with five streams of water. A white dove descends, dropping a communion wafer into the cup.",
        upright: "A beautiful new beginning in love, deep compassion, and overwhelming emotional fulfillment. Your heart is opening.",
        reversed: "Emotional emptiness, blocked feelings, repressed intuition, or a relationship draining your vital energy."
    },
    {
        name: "Two of Cups", img: "cups02.jpg",
        description: "A man and a woman stand facing each other, exchanging cups. Above them is a Caduceus (the staff of Hermes) with a lion's head, symbolizing a powerful, healing partnership.",
        upright: "Mutual attraction, a balanced partnership, and deep harmony. A soul-level connection in romance, friendship, or business.",
        reversed: "A break in harmony, miscommunication, codependency, or an imbalance in a vital relationship."
    },
    {
        name: "Three of Cups", img: "cups03.jpg",
        description: "Three women dance joyfully in a circle, raising their cups in a toast. They are surrounded by a harvest of fruits and vegetables.",
        upright: "Celebration, friendship, collaboration, and joyful community. Lean on your supportive circle and enjoy life's fruits.",
        reversed: "Gossip, feeling left out of a social circle, or overindulging in escapism and partying."
    },
    {
        name: "Four of Cups", img: "cups04.jpg",
        description: "A young man sits under a tree with his arms crossed in apathy. Three cups rest on the ground, while a magical hand from a cloud offers him a fourth cup, which he ignores.",
        upright: "Apathy, contemplation, or feeling disconnected. You are missing an opportunity because you are too focused on what you don't have.",
        reversed: "Sudden awareness, breaking out of a slump, or finally noticing the blessings being offered to you."
    },
    {
        name: "Five of Cups", img: "cups05.jpg",
        description: "A figure in a black cloak stands weeping over three spilled cups, the liquid bleeding into the earth. Behind him, ignored, stand two perfectly upright cups. A bridge leads to a distant castle.",
        upright: "Grief, regret, pessimism, and mourning what has been lost. You must eventually turn around to see what still remains.",
        reversed: "Acceptance, moving on, finding peace, and realizing that not all is lost."
    },
    {
        name: "Six of Cups", img: "cups06.jpg",
        description: "In a nostalgic, safe courtyard, a young boy hands a cup filled with white white flowers to a younger girl. An older figure walks away in the background.",
        upright: "Nostalgia, childhood memories, innocence, and revisiting the past. A familiar face may return to your life.",
        reversed: "Clinging to the past, refusing to grow up, or trauma from childhood blocking your current path."
    },
    {
        name: "Seven of Cups", img: "cups07.jpg",
        description: "A dark figure stares up at seven floating cups resting on clouds. Each cup holds a different vision: a glowing jewel, a dragon, a snake, a shrouded figure, a castle, a laurel wreath, and an angelic face.",
        upright: "Illusions, daydreaming, wishful thinking, and being overwhelmed by choices. Not all that glitters is gold; choose carefully.",
        reversed: "Finding clarity, stripping away illusions, making a firm decision, or waking up from a fantasy."
    },
    {
        name: "Eight of Cups", img: "cups08.jpg",
        description: "Under a crescent moon, a man turns his back on eight neatly stacked cups and walks away with a staff, heading up a steep, desolate mountain path.",
        upright: "Walking away from something that no longer serves you. A difficult, emotional choice to seek deeper spiritual meaning elsewhere.",
        reversed: "Fear of moving on, staying in a stagnant situation out of comfort, or aimless drifting."
    },
    {
        name: "Nine of Cups", img: "cups09.jpg",
        description: "A plump, incredibly smug man sits on a wooden bench with his arms crossed. Behind him, on a curved table, sit nine gleaming cups arranged like a trophy case.",
        upright: "The 'Wish Card.' Emotional satisfaction, luxury, contentment, and feeling deeply proud of what you have achieved.",
        reversed: "Smugness, materialism, dissatisfaction despite having everything, or overindulgence."
    },
    {
        name: "Ten of Cups", img: "cups10.jpg",
        description: "A husband and wife embrace, raising their arms to the sky while two children dance joyfully beside them. Above, a massive rainbow arches, adorned with ten glowing cups.",
        upright: "Absolute emotional bliss, divine alignment in relationships, and a happy, deeply connected home life. Complete harmony.",
        reversed: "Shattered dreams, family disputes, broken homes, or keeping up appearances when everything is falling apart inside."
    },
    {
        name: "Page of Cups", img: "cups11.jpg",
        description: "A whimsically dressed youth stands by the sea, holding a cup. Surprisingly, a live fish pops its head out of the cup, speaking to him. The Page looks at it with curious delight.",
        upright: "Creative inspiration, a surprisingly sweet message, intuition, and trusting your inner child. Allow yourself to dream.",
        reversed: "Emotional immaturity, creative blocks, throwing tantrums, or doubting your own intuition."
    },
    {
        name: "Knight of Cups", img: "cups12.jpg",
        description: "A romantic knight rides a beautiful, slow-moving white horse. He wears a cloak covered in fish and holds out a golden cup as an offering of peace and love.",
        upright: "Romance, charm, poetry, and following your heart. An offering of love or a beautiful invitation is coming your way.",
        reversed: "A hopeless romantic, emotional manipulation, moodiness, or a charming facade hiding empty promises."
    },
    {
        name: "Queen of Cups", img: "cups13.jpg",
        description: "A beautiful queen sits on an elaborate throne at the edge of the sea. She stares intensely into a highly ornate, closed cup, listening entirely to her profound intuition.",
        upright: "Deep empathy, psychic ability, compassion, and emotional security. You are holding space for yourself and others with immense grace.",
        reversed: "Emotional martyrdom, total overwhelm, codependency, or losing yourself in other people's feelings."
    },
    {
        name: "King of Cups", img: "cups14.jpg",
        description: "A serene king sits on a heavy throne that floats upon a turbulent sea. He holds a cup in one hand and a scepter in the other, remaining completely calm despite the waves.",
        upright: "Emotional balance, compassion, and diplomatic leadership. You have mastered your feelings and can navigate turbulent waters with ease.",
        reversed: "Emotional manipulation, moodiness, repression of feelings, or a total loss of emotional control."
    }
];


// --- Part 3: The Minor Arcana (Swords & Pentacles) ---

const minorArcanaDataPart2 = [
    // --- SUIT OF SWORDS (Air, Intellect, Conflict, Truth) ---
    {
        name: "Ace of Swords", img: "swords01.jpg",
        description: "A hand reaches from the clouds holding an upright sword encircled by a golden crown. A wreath hangs from the handle, and the background is a jagged, mountainous sky.",
        upright: "A breakthrough of mental clarity, a new idea, or a moment of truth. You are cutting through confusion with sharp, objective intellect.",
        reversed: "Confusion, mental fog, clouded judgment, or a breakthrough that turns into a destructive confrontation."
    },
    {
        name: "Two of Swords", img: "swords02.jpg",
        description: "A blindfolded woman sits on a stone bench by the sea, holding two heavy swords crossed over her chest. A crescent moon hangs in the sky behind her.",
        upright: "A difficult choice, stalemate, or needing to block out emotions to make a logical decision. You are choosing not to see the truth.",
        reversed: "Confusion, indecision, being overwhelmed by choices, or removing the blindfold to face a painful reality."
    },
    {
        name: "Three of Swords", img: "swords03.jpg",
        description: "A floating heart is pierced by three distinct blades. Dark storm clouds and heavy rain pour down in the background.",
        upright: "Heartbreak, sorrow, grief, and emotional pain. The truth has been revealed, and it hurts, but this pain is a necessary part of healing.",
        reversed: "Release of pain, healing, forgiveness, or finally overcoming a period of deep sorrow."
    },
    {
        name: "Four of Swords", img: "swords04.jpg",
        description: "A knight lies in a tomb-like state, his hands folded in prayer. Above him, three swords hang on the wall, while one sword rests beneath his bed.",
        upright: "Rest, recuperation, meditation, and mental sanctuary. You need to withdraw from the battlefield to heal your mind.",
        reversed: "Burnout, restlessness, being unable to find peace, or refusing to take a much-needed break."
    },
    {
        name: "Five of Swords", img: "swords05.jpg",
        description: "A man smirkily gathers up three swords while two others retreat in the distance, looking defeated. The sky is turbulent and gray.",
        upright: "Hollow victory, conflict, tension, and winning at the expense of others. Consider if the fight is actually worth the cost.",
        reversed: "Making peace, letting go of a grudge, or accepting that you have lost a battle to save yourself."
    },
    {
        name: "Six of Swords", img: "swords06.jpg",
        description: "A figure shrouded in a cloak sits in a boat with a woman and child. The boat is piloted by a ferryman across calm waters. Six swords are stuck upright into the boat.",
        upright: "Moving away from strife, transition, seeking calmer waters, and necessary change. You are leaving your troubles behind.",
        reversed: "Stuck in the past, unable to move forward, or refusing to let go of your baggage."
    },
    {
        name: "Seven of Swords", img: "swords07.jpg",
        description: "A man creeps away from a camp, holding five swords in his arms while glancing back suspiciously at the two swords he left behind.",
        upright: "Strategy, stealth, resourcefulness, or perhaps betrayal. You are trying to find a shortcut or avoid a direct confrontation.",
        reversed: "Confessing the truth, imposter syndrome, being caught in a lie, or taking full responsibility."
    },
    {
        name: "Eight of Swords", img: "swords08.jpg",
        description: "A woman is bound and blindfolded, surrounded by eight swords stuck in the ground around her. She stands in shallow water on a desolate path.",
        upright: "Feeling trapped, self-imposed limitation, and helplessness. You are your own jailer; the bonds are only as strong as your belief in them.",
        reversed: "Finding freedom, releasing self-doubt, and realizing the path out is clear."
    },
    {
        name: "Nine of Swords", img: "swords09.jpg",
        description: "A figure sits up in bed, covering their face in anguish. Nine swords hang on the wall behind them like a dark omen.",
        upright: "Anxiety, nightmares, deep despair, and overthinking. Often, these fears are far worse than reality.",
        reversed: "Finding relief, ending the cycle of worry, or speaking your fears out loud to dissipate them."
    },
    {
        name: "Ten of Swords", img: "swords10.jpg",
        description: "A man lies flat on the ground, his back pierced by ten swords. However, the sky above begins to brighten, suggesting dawn.",
        upright: "The end of a painful cycle, betrayal, hitting rock bottom. It cannot get any worse, which means your rebirth starts now.",
        reversed: "Survival, recovery, learning from a painful lesson, or refusing to accept that an old cycle is over."
    },
    {
        name: "Page of Swords", img: "swords11.jpg",
        description: "A youth stands on a rugged hill, holding a sword high, looking back over his shoulder. The clouds are turbulent, indicating wind and ideas.",
        upright: "Curiosity, thirst for knowledge, new ideas, and being vigilant. You are ready to learn and investigate.",
        reversed: "Cynicism, sarcasm, gossip, or having all talk and no action."
    },
    {
        name: "Knight of Swords", img: "swords12.jpg",
        description: "A knight in armor charges forward on a white horse, his sword extended. The wind blows fiercely, indicating rapid, intense energy.",
        upright: "Ambition, drive, action, and rushing into the fray. You have a clear objective and nothing will stop you.",
        reversed: "Impulsiveness, recklessness, missing details in your haste, or using aggression to get your way."
    },
    {
        name: "Queen of Swords", img: "swords13.jpg",
        description: "A queen sits on a throne adorned with cherubs and butterflies. She holds her sword upright, staring intensely with a piercing, clear gaze.",
        upright: "Intellectual clarity, independence, sharp wit, and setting firm boundaries. You see through the illusions of others.",
        reversed: "Being overly critical, cruel words, emotional coldness, or bitterness."
    },
    {
        name: "King of Swords", img: "swords14.jpg",
        description: "A king sits on his throne, holding his sword upright. He is the master of logic, intellectual authority, and truth.",
        upright: "Clear thinking, intellectual power, authority, and truth. You are making decisions based on logic and justice.",
        reversed: "Abuse of power, manipulative intellect, lack of empathy, or legal problems."
    },

    // --- SUIT OF PENTACLES (Earth, Money, Career, Physicality) ---
    {
        name: "Ace of Pentacles", img: "pents01.jpg",
        description: "A hand emerges from the clouds holding a giant gold coin. Below, a beautiful, lush garden with a path leads to a mountain archway.",
        upright: "New financial opportunity, prosperity, manifestation, and a stable beginning.",
        reversed: "Missed opportunities, financial instability, or poor planning regarding resources."
    },
    {
        name: "Two of Pentacles", img: "pents02.jpg",
        description: "A man dances, juggling two pentacles held together by an infinity symbol. The sea crashes behind him, suggesting constant motion.",
        upright: "Flexibility, balance, juggling priorities, and adaptability.",
        reversed: "Overwhelmed, disorganized, financial stress, or inability to manage your schedule."
    },
    {
        name: "Three of Pentacles", img: "pents03.jpg",
        description: "A sculptor works on a cathedral wall, consulting with a monk and a nobleman. The work is collaborative and skillful.",
        upright: "Collaboration, teamwork, mastery, and professional recognition.",
        reversed: "Lack of teamwork, mediocrity, or internal conflict at work."
    },
    {
        name: "Four of Pentacles", img: "pents04.jpg",
        description: "A man sits on a stone block, clutching a pentacle to his chest, one under his feet, and one on his head. He looks guarded and stubborn.",
        upright: "Financial security, holding onto your resources, and protecting what you have.",
        reversed: "Greed, miserliness, obsession with money, or inability to share."
    },
    {
        name: "Five of Pentacles", img: "pents05.jpg",
        description: "Two figures walk through the snow past a glowing church window. They are injured and poorly dressed, looking for help.",
        upright: "Financial loss, hardship, feeling left out in the cold, and poverty consciousness.",
        reversed: "Recovery from loss, finding support, or realizing your situation is improving."
    },
    {
        name: "Six of Pentacles", img: "pents06.jpg",
        description: "A wealthy merchant weighs coins on a scale and distributes them to two beggars kneeling at his feet.",
        upright: "Generosity, charity, sharing wealth, and giving/receiving support.",
        reversed: "Strings-attached generosity, power imbalances, or being unable to accept help."
    },
    {
        name: "Seven of Pentacles", img: "pents07.jpg",
        description: "A farmer leans on his hoe, looking at the seven pentacles hanging like fruit on his vines. He is waiting patiently for the harvest.",
        upright: "Patience, investment, long-term planning, and awaiting results.",
        reversed: "Impatience, lack of growth, or feeling that your hard work was a waste."
    },
    {
        name: "Eight of Pentacles", img: "pents08.jpg",
        description: "An apprentice works at a bench, carefully engraving a pentacle. Seven more are already hung, showing his devotion to his craft.",
        upright: "Mastery, education, focus, and dedication to your work.",
        reversed: "Lack of effort, perfectionism, or working hard on the wrong thing."
    },
    {
        name: "Nine of Pentacles", img: "pents09.jpg",
        description: "A woman stands in a lush garden with a bird on her hand. She is surrounded by vines laden with gold coins.",
        upright: "Luxury, self-sufficiency, financial independence, and grace.",
        reversed: "Over-dependence, financial insecurity, or losing what you worked so hard for."
    },
    {
        name: "Ten of Pentacles", img: "pents10.jpg",
        description: "A patriarch stands with his dogs and grandchildren in a stone archway. Gold pentacles are arranged in the Tree of Life pattern above them.",
        upright: "Legacy, long-term security, family wealth, and established success.",
        reversed: "Family disputes over money, loss of inheritance, or financial collapse."
    },
    {
        name: "Page of Pentacles", img: "pents11.jpg",
        description: "A young man stands in a field holding a pentacle aloft with both hands. He looks at it with intense study and seriousness.",
        upright: "New study, financial opportunity, grounded plans, and practical ambition.",
        reversed: "Lack of follow-through, missed opportunities, or immature financial planning."
    },
    {
        name: "Knight of Pentacles", img: "pents12.jpg",
        description: "A knight sits on a heavy, solid horse. He holds a single pentacle and looks over his fields of work with a steady gaze.",
        upright: "Consistency, hard work, responsibility, and reliability.",
        reversed: "Boredom, stagnation, laziness, or being overly fixated on the status quo."
    },
    {
        name: "Queen of Pentacles", img: "pents13.jpg",
        description: "A queen sits on an ornate throne in a garden, cradling a pentacle in her lap. A rabbit hops nearby, symbolizing fertility and earth.",
        upright: "Practicality, security, nurturing, and abundant resources.",
        reversed: "Self-centeredness, financial imbalance, or neglecting your environment."
    },
    {
        name: "King of Pentacles", img: "kingpents14.jpg", // Ensure filename matches your list
        description: "A king sits on a throne decorated with bulls, wearing robes of vines. He holds his scepter and a gold pentacle, symbolizing complete mastery over the material world.",
        upright: "Success, abundance, business mastery, and total security.",
        reversed: "Greed, corruption, gambling, or misuse of power."
    }
];

// FUSE ALL DATA TOGETHER
window.tarotDatabase = [...majorArcanaData, ...minorArcanaDataPart1, ...minorArcanaDataPart2];
