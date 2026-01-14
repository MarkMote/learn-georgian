# Word Revisions
Based on our work together, here is a summary of the principles for creating high-quality, effective language learning examples (specifically for the ~1,000-word level):

### 1. High Utility & Realism (The "Useful Phrase" Rule)
Examples should be sentences a learner would actually need to say or hear in daily life.
*   **Bad:** *The bathroom has a light.* (Technically true, but useless).
*   **Good:** *Where is the bathroom?* (Essential travel phrase).
*   **Good:** *My tooth hurts.* (Essential medical phrase).

### 2. Avoid the "Generic Trap" (The "No More *Gemrielia*" Rule)
Avoid generic Subject-Adjective patterns ("The X is big," "The Y is tasty") unless the adjective is the target word. These add no context and become boring.
*   **Bad:** *Space is big.* / *The orange is tasty.*
*   **Good:** *I want to go to space.* / *I bought an orange.*

### 3. Complete, Coherent Thoughts
A sentence should paint a clear picture or describe a specific action, rather than a vague fragment. Adding a location or an object often fixes this.
*   **Bad:** *They throw.* (Too vague).
*   **Good:** *We throw stones into the water.* (Specific action + target + location).
*   **Bad:** *Falling is dangerous.* (Vague).
*   **Good:** *Falling from a horse is dangerous.* (Specific context).

### 4. Literal Accuracy over Idioms
When teaching a specific verb, use its literal physical meaning, not a metaphorical one. Beginners need to learn the core definition first.
*   **Bad:** *You break the rules.* (Abstract/Idiomatic).
*   **Good:** *You smash the old door.* (Literal physical action matching the verb *amtvrev*).
*   **Bad:** *They fall in love.*
*   **Good:** *The cup falls from the table.*

### 5. Vocabulary Recycling (The "LEGO" Method)
Build longer, more interesting sentences by reusing simple words the learner has already mastered (e.g., home, work, water, bread, mountain, go, buy).
*   **Technique:** Instead of introducing a new complex noun to fit the target verb, use a known noun like "mountain" or "water" to create a complex scene.
*   **Example:** *Stones fall from the mountain.*

### 6. Grammatical Variety
Avoid getting stuck in repetitive loops like "I want X" or "I have Y."
*   **Mix it up:** Use different subjects (He, We, The Wind), different tenses (past/present/future), and different sentence types (Questions, Commands, Negatives).
*   **Example:** Instead of *I use my brain*, try the command: *Use your brain!*
*   **Example:** Instead of *I peel the orange*, try the past action: *I bought an orange.*

### 7. The "Goldilocks" Complexity
*   **Too Hard:** Sentences with complex subordination, rare grammar cases, or poetic vocabulary.
*   **Too Simple:** "He runs."
*   **Just Right:** "He runs in the park every morning." (Adds context without adding difficulty).

IMPORTANT: n+1 principle: examples should teach new grammar and context behind the words being learned. we only want to introduce 1 new word at a time 

Ideal case: we reinforce earlier words and we give intuition for context, common semantic chunks, and grammar patterns without overwhelming the user. 
based on this can you review the words in words.csv for the following: 
- word being learn correctly used in the example 
- example could be improved somehow 
- example is really good but uses an important word not defined in words.csv, so we should define a flashcard for that word first. 


 (Rows 750-1720)

Review criteria:
1. Example must use the target word (form changes OK, but same root)
2. Keep simple: 2-4 Georgian words ideally
3. Prioritize: grammar patterns > usage context > new vocab
4. Recycle earlier vocabulary when possible

---

## CRITICAL: Wrong Word Used

These examples use a completely different word than what's being taught.

| Row | Target Word | Current Example | Issue | Suggested Fix |
|-----|-------------|-----------------|-------|---------------|
| 828 | გვერდი (side) | რომელ მხარეს ხარ? | Uses მხარე instead of გვერდი | ჩემს გვერდით იჯექი (Sit next to me) |
| 899 | ნაწილი (piece) | ტორტის ნაჭერი | Uses ნაჭერი instead of ნაწილი | ეს მანქანის ნაწილია (This is a car part) |
| 1004 | სინათლე (light) | შუქი აანთე | Uses შუქი instead of სინათლე | სინათლე ფანჯრიდან შემოდის (Light comes through the window) |
| 1241 | მაგარი (hard/cool) | ეს ტესტი ძალიან რთულია | Uses რთული instead of მაგარი | ქვა მაგარია (Stone is hard) |
| 1275 | წინა (front) | რიგის თავში გადადით | Uses თავი instead of წინა | წინა კარი (front door) |
| 1276 | იატაკი (floor) | ჩემი ბინა მესამე სართულზეა | Uses სართული instead of იატაკი | იატაკი სუფთაა (The floor is clean) | 

---

## CRITICAL: Infinitive Uses Wrong Form

These verbal noun (infinitive) entries use imperatives or other verb forms instead of the noun form.

| Row | Target Word | Current Example | Suggested Fix |
|-----|-------------|-----------------|---------------|
| 787 | სიცილი (laugh-inf) | არ გაიცინო! | სიცილი კარგია (Laughter is good) |
| 802 | ტირილი (cry-inf) | არ იტირო. | ტირილი არ მომწონს (I don't like crying) |
| 862 | გასინჯვა (taste-inf) | მინდა გავსინჯო | ღვინის გასინჯვა სახალისოა (Wine tasting is fun) |
| 1042 | წოლა (lie down-inf) | უნდა დავწვე | ცოტა წოლა მჭირდება (I need a bit of rest) |

Notes:
- X კარგია is a bit of an overused pattern. keep it for row 787 but not more kargias. Same goes for მომწონს.
- Row 862: Uses "wine tasting" as a compound noun - this correctly uses the verbal noun form გასინჯვა.
- Row 1042: Uses წოლა as a noun with მჭირდება (I need) - correctly uses the verbal noun form. 


---

## HIGH: Confusing Alternate Verb Pattern

These examples use a different verb with the target verb in parentheses. This is confusing for learners.

Here is the finalized list. I have added context to the "throwing" and "falling" examples to make them complete thoughts, improved the English phrasing for clarity, and ensured the verbs match the specific physical actions (like "smashing" vs. just "breaking").

| Row | Word | Current Example (Translation) | Improved Version (Translation) | Notes |
|:---|:---|:---|:---|:---|
| 1210 | **იზრდებით**<br>(You grow) | **თქვენ ასაკთან ერთად ბრძენდებით**<br>(You grow wise with age) | **თქვენ ძალიან სწრაფად იზრდებით**<br>(You grow very fast) | Natural phrase used when seeing children/teens after a while. |
| 1251 | **იჭერ**<br>(You catch) | **შენ ადვილად ცივდები**<br>(You catch cold easily) | **შენ მდინარეში თევზს იჭერ**<br>(You catch fish in the river) | Adds location (river) to make it a complete scene. |
| 1268 | **ვისვრით**<br>(We throw) | **ჩვენ წვეულებას ვაწყობთ**<br>(We throw a party) | **ჩვენ ქვებს წყალში ვისვრით**<br>(We throw stones into the water) | Adds "into the water" to give the action a target. |
| 1269 | **ისვრით**<br>(You throw) | **თქვენ კამათელს აგორებთ**<br>(You roll dice) | **სად ისვრით ნაგავს?**<br>(Where do you throw the trash?) | High-utility daily life question. |
| 1303 | **ვარდნა**<br>(To fall) | **ფოთლები იწყებს ცვენას**<br>(Leaves start falling) | **ცხენიდან ვარდნა საშიშია**<br>(Falling from a horse is dangerous) | "Falling from a horse" is a concrete, understandable danger. |
| 1306 | **ვარდება**<br>(Falls) | **წვიმა ციდან ცვივა**<br>(Rain falls from sky) | **ჭიქა მაგიდიდან ვარდება**<br>(The cup falls from the table) | Narrative event using common household nouns. |
| 1307 | **ვვარდებით**<br>(We fall) | **ჩვენ სწრაფად გვეძინება**<br>(We fall asleep fast) | **ჩვენ წყალში ვვარდებით**<br>(We fall into the water) | Specific physical action rather than generic "falling down". |
| 1309 | **ვარდებიან**<br>(They fall) | **მათ უყვარდებათ**<br>(They fall in love) | **ქვები მთიდან ვარდებიან**<br>(Stones fall from the mountain) | Vivid nature imagery reusing "mountain". |
| 1317 | **ბიძგება**<br>(To push) | **კარს ხელი უნდა ჰკრა**<br>(Must push door) | **მანქანის ბიძგება რთულია**<br>(Pushing the car is hard) | Very common phrase when a car breaks down. |
| 1331 | **ვქაჩავ**<br>(I pull) | **მე კარს ვაღებ**<br>(I open door) | **მე კარს ვქაჩავ**<br>(I pull the door) | Clarifies the specific motion (pulling vs opening). |
| 1369 | **ანჯღრევა**<br>(To shake) | **ხელის ჩამორთმევა**<br>(Shaking hands) | **წამლის ანჯღრევა საჭიროა**<br>(Shaking the medicine is necessary) | Practical instruction found on labels or from doctors. |
| 1371 | **ანჯღრევ**<br>(You shake) | **შენ თავს აქნევ**<br>(You nod/shake head) | **შენ ხეს ანჯღრევ**<br>(You shake the tree) | Visual action (usually to get fruit/nuts). |
| 1372 | **ინჯღრევა**<br>(It shakes) | **მიწა ირყევა**<br>(Ground quakes) | **ძველი ავტობუსი ინჯღრევა**<br>(The old bus shakes) | Describes a rough ride/vehicle. |
| 1373 | **ვანჯღრევთ**<br>(We shake) | **ჩვენ საბანს ვაფერთხებთ**<br>(We shake out blanket) | **ჩვენ წვენის ბოთლს ვანჯღრევთ**<br>(We shake the juice bottle) | Specific context: shaking juice before drinking. |
| 1375 | **ინჯღრევიან**<br>(They shake) | **ისინი შიშისგან ცახცახებენ**<br>(Trembling from fear) | **მგზავრები მანქანაში ინჯღრევიან**<br>(Passengers shake in the car) | Describes people being tossed around in a vehicle. |
| 1600 | **ვატარებთ**<br>(We carry) | **ჩვენი ბარგი მიგვაქვს**<br>(Bringing luggage) | **ჩვენ ბავშვს ვატარებთ**<br>(We carry the child) | Clear context of holding/transporting a person. |
| 1601 | **ატარებთ**<br>(You carry) | **თქვენ სკამები მიგაქვთ**<br>(Taking chairs) | **პასპორტს თან ატარებთ?**<br>(Do you carry a passport with you?) | Extremely useful question for travel/police contexts. |
| 1611 | **ამტვრევ**<br>(You break) | **შენ წესებს არღვევ**<br>(Breaking rules) | **შენ ძველ კარს ამტვრევ**<br>(You are smashing the old door) | *Amtvrev* implies forceful breaking/smashing (e.g., demolition). |
| 1612 | **ამტვრევს**<br>(Breaks) | **თავის პირობას არღვევს**<br>(Breaking promise) | **ქარი ხეს ამტვრევს**<br>(The wind breaks the tree) | Natural event sentence. |


---

## MEDIUM: Simplify (Too Complex)

These examples are too long or use complex/new vocabulary when simpler options exist.

Here is the finalized, polished list. I have applied your feedback:
*   **Restored complex but good examples:** (e.g., `მზე კაშკაშად ანათებს`, `ეს წიგნი ხუთი დოლარი ღირს`).
*   **Creative variety:** Removed repetitive "we want" / "I have" patterns.
*   **High-utility context:** Used verbs like "buy," "work," "cost," "break," and practical questions.

| Row | Word | Current Example (Translation) | Improved Version (Translation) | Why this is better |
|:---|:---|:---|:---|:---|
| 751 | **ჩუმი**<br>(Quiet) | **ერთი წუთით ჩუმად იყავი**<br>(Be quiet for a minute) | **ჩუმად იყავი**<br>(Be quiet) | Short, standard command. |
| 755 | **კოსმოსი**<br>(Space) | **კოსმოსში ცხოვრება არსებობს**<br>(Life exists in space) | **კოსმოსი ძალიან შორს არის**<br>(Space is very far) | Reuses known vocab "very far". |
| 769 | **ფუნტი**<br>(Pound) | **ერთი ფუნტი საკმარისი არაა**<br>(One pound is not enough) | **ერთი ფუნტი ბევრია**<br>(One pound is a lot) | Simple contrast. |
| 781 | **ფორთოხალი**<br>(Orange) | **მე ფორთოხალი გავფცი**<br>(I peeled the orange) | **მე ფორთოხალი ვიყიდე**<br>(I bought an orange) | Uses common verb "bought" instead of "peel". |
| 842 | **სანტიმეტრი**<br>(Centimeter) | **ის ერთი სანტიმეტრის სიგრძისაა**<br>(It is one centimeter in length) | **ეს ხუთი სანტიმეტრია**<br>(This is five centimeters) | Practical for measuring. |
| 845 | **ბოროტი**<br>(Mean/Evil) | **ნუ იქნები მის მიმართ ბოროტი**<br>(Don't be mean towards him) | **ნუ ხარ ბოროტი**<br>(Don't be mean) | Simple imperative. |
| 855 | **ქვედა**<br>(Bottom) | **ქვედა თაროზე ყუთია**<br>(There is a box on the bottom shelf) | **ქვედა სართული**<br>(Bottom floor) | High utility for elevators/buildings. |
| 856 | **მასალა**<br>(Material) | **ჩვენ მეტი მასალა გვჭირდება**<br>(We need more material) | **ეს რა მასალაა?**<br>(What material is this?) | Common shopping question. |
| 859 | **ოფლი**<br>(Sweat) | **მისი სახე ოფლით სავსეა**<br>(His face is full of sweat) | **ოფლი მდის**<br>(I am sweating) | *Lit: Sweat flows from me.* The standard way to say it. |
| 875 | **ენერგია**<br>(Energy) | **დღეს მას ენერგია არ აქვს**<br>(He has no energy today) | **მას ენერგია არ აქვს**<br>(He has no energy) | Keeps the natural negative phrasing. |
| 888 | **ბრმა**<br>(Blind) | **მან ბრმა კაცი დაეხმარა**<br>(He helped a blind man) | **ბრმა კაცს ძაღლი ჰყავს**<br>(The blind man has a dog) | Narrative sentence using "has" (animate). |
| 898 | **კოცნიან**<br>(They kiss) | **ისინი დამშვიდობებისას კოცნიან**<br>(They kiss when saying goodbye) | **ისინი ხშირად კოცნიან**<br>(They kiss often) | Simple Subject-Adverb-Verb. |
| 915 | **ივნისი**<br>(June) | **ჩემი დაბადების დღე ივნისშია**<br>(My birthday is in June) | **ივნისში ცხელა**<br>(It is hot in June) | Weather is the most common context for months. |
| 917 | **ას ორი**<br>(102) | **გვერდი ას ორი აკლია**<br>(Page 102 is missing) | **ეს ას ორი ლარი ღირს**<br>(This costs 102 lari) | Practical price context. |
| 919 | **საპონი**<br>(Soap) | **აბაზანაში საპონი აღარ არის**<br>(There is no more soap in the bathroom) | **საპონი სად არის?**<br>(Where is the soap?) | High-utility daily question. |
| 975 | **ტუჩი**<br>(Lip) | **ტუჩები გამიშრა**<br>(My lips dried out) | **მას წითელი ტუჩები აქვს**<br>(She has red lips) | Descriptive pattern. |
| 976 | **ხელსაწყო**<br>(Tool) | **ეს სასარგებლო ხელსაწყოა**<br>(This is a useful tool) | **ის ხელსაწყოთი მუშაობს**<br>(He works with a tool) | Uses instrumental case (-ti) and verb "works". |
| 977 | **ფეხის თითი**<br>(Toe) | **ფეხის დიდი თითი ვიტკინე**<br>(I hurt my big toe) | **ფეხის თითი მტკივა**<br>(My toe hurts) | Standard expression of pain. |
| 993 | **მინა**<br>(Glass) | **ფანჯარა მინისგანაა გაკეთებული**<br>(The window is made of glass) | **მინა გატეხილია**<br>(The glass is broken) | Describing a broken object is useful. |
| 1012 | **ჭრა**<br>(Cutting) | **პურის ჭრა ნამცეცებს აკეთებს**<br>(Cutting bread makes crumbs) | **დანა პურს არ ჭრის**<br>(The knife doesn't cut the bread) | Practical kitchen problem. |
| 1050 | **ნიადაგი**<br>(Soil) | **ნიადაგი ძალიან ნაყოფიერია**<br>(The soil is very fertile) | **ყვავილს კარგი ნიადაგი სჭირდება**<br>(The flower needs good soil) | Contextual usage of "needs". |
| 1052 | **მზე**<br>(Sun) | **მზე კაშკაშად ანათებს**<br>(The sun shines brightly) | **მზე კაშკაშად ანათებს**<br>(The sun shines brightly) | *Restored original.* "Brightly" is a good collocate. |
| 1061 | **ვიღვიძებთ**<br>(We wake up) | **ჩვენ ერთსა და იმავე დროს ვიღვიძებთ**<br>(We wake up at the same time) | **ჩვენ ადრე ვიღვიძებთ**<br>(We wake up early) | Simplifies the adverb. |
| 1067 | **მეორე**<br>(Second) | **ეს მეორე შემთხვევაა**<br>(This is the second instance) | **ეს მეორე დღეა**<br>(This is the second day) | "Day" is higher frequency than "instance". |
| 1079 | **ტვინი**<br>(Brain) | **შენი ტვინი უნდა გამოიყენო**<br>(You must use your brain) | **ტვინი გამოიყენე**<br>(Use your brain) | Great idiom/literal command. |
| 1081 | **სამოთხე**<br>(Paradise) | **ეს ადგილი სამოთხეს ჰგავს**<br>(This place looks like paradise) | **საქართველო სამოთხეა**<br>(Georgia is paradise) | Culturally relevant. |
| 1082 | **კანი**<br>(Skin) | **მას ძალიან რბილი კანი აქვს**<br>(She has very soft skin) | **მას რბილი კანი აქვს**<br>(She has soft skin) | Removed "very" to unclutter. |
| 1083 | **ადვოკატი**<br>(Lawyer) | **ადვოკატი უნდა დავიქირაო**<br>(I need to hire a lawyer) | **ადვოკატი მჭირდება**<br>(I need a lawyer) | "I need" is the most direct way to say this. |
| 1087 | **თვლა**<br>(Counting) | **ფულის თვლა დროს მოითხოვს**<br>(Counting money requires time) | **ფულის თვლა ვიცი**<br>(I know [how to] count money) | Uses "I know" (fact/ability). |
| 1099 | **ცხვირი**<br>(Nose) | **ცხვირიდან მომდის**<br>(I have a runny nose) | **ცხვირი მტკივა**<br>(My nose hurts) | Standard expression of pain. |
| 1100 | **მხატვარი**<br>(Painter) | **ჩემი მეგობარი ნიჭიერი მხატვარია**<br>(My friend is a talented painter) | **ჩემი მეგობარი მხატვარია**<br>(My friend is a painter) | Direct description. |
| 1109 | **წვერი**<br>(Beard) | **მან გადაწყვიტა წვერი გაეზარდა**<br>(He decided to grow a beard) | **მას გრძელი წვერი აქვს**<br>(He has a long beard) | Describing appearance using "has". |
| 1110 | **ტერფი**<br>(Foot/Sole) | **ლურსმანზე დავაბიჯე ტერფი**<br>(I stepped on a nail) | **ტერფი მტკივა**<br>(My foot hurts) | Standard expression of pain. |
| 1113 | **ცრემლი**<br>(Tear) | **ცრემლი ჩამოუგორდა ლოყაზე**<br>(A tear rolled down cheek) | **ცრემლი მოდის**<br>(A tear is coming/falling) | Uses simple verb "modis". |
| 1114 | **სველი**<br>(Wet) | **ჩემი ფეხსაცმელი სველია წვიმისგან**<br>(My shoes are wet from rain) | **იატაკი სველია**<br>(The floor is wet) | Common context (spill/mopping). |
| 1115 | **კვადრატი**<br>(Square) | **კვადრატს ოთხი ტოლი გვერდი აქვს**<br>(Square has 4 equal sides) | **ეს მაგიდა კვადრატია**<br>(This table is a square) | Applies shape to a known object. |
| 1123 | **ოქრო**<br>(Gold) | **მას ოქროს ყელსაბამი უკეთია**<br>(She wears a gold necklace) | **ოქრო ძვირია**<br>(Gold is expensive) | Very common description. |
| 1125 | **ყვავილი**<br>(Flower) | **ამ ყვავილს კარგი სუნი აქვს**<br>(This flower smells good) | **მე ყვავილი ვიყიდე**<br>(I bought a flower) | Action verb "bought". |
| 1126 | **მშვიდობა**<br>(Peace) | **ჩვენ ყველას გვინდა მშვიდობა მსოფლიოში**<br>(We all want peace in the world) | **მშვიდობა აუცილებელია**<br>(Peace is necessary) | Avoids generic "we want". |
| 1130 | **ნოემბერი**<br>(November) | **მისი დაბადების დღე ნოემბერშია**<br>(Birthday is in Nov) | **ნოემბერში ცივა**<br>(It is cold in November) | Weather context. |
| 1138 | **საჩუქარი**<br>(Gift) | **გმადლობთ შესანიშნავი საჩუქრისთვის**<br>(Thanks for wonderful gift) | **ეს საჩუქარი შენთვისაა**<br>(This gift is for you) | Teaches "-tvis" (for) suffix. |
| 1139 | **ყრუ**<br>(Deaf) | **მოხუცი ცალ ყურში ყრუა**<br>(Old man is deaf in one ear) | **ყრუ კაცს არ ესმის**<br>(The deaf man doesn't hear) | Defines word through action (hearing). |
| 1142 | **მუხლი**<br>(Knee) | **დავეცი და მუხლი ვიტკინე**<br>(I fell and hurt knee) | **მუხლი მტკივა**<br>(My knee hurts) | Standard expression of pain. |
| 1145 | **სიმინდი**<br>(Corn) | **მე მიყვარს შემწვარი სიმინდის ჭამა**<br>(I love eating fried corn) | **ჩვენ სიმინდს ვჭამთ**<br>(We are eating corn) | Action "We are eating". |
| 1152 | **ხრიან**<br>(They bend) | **ისინი წესებს არღვევენ (ხრიან)**<br>(They bend rules) | **ისინი ჯოხს ხრიან**<br>(They bend the stick) | Concrete physical action. |
| 1155 | **ტბა**<br>(Lake) | **ჩვენ ტბაზე ნავით გავისეირნეთ**<br>(We went boating on lake) | **ჩვენ ტბაზე მივდივართ**<br>(We are going to the lake) | Uses common "We are going" pattern. |
| 1158 | **ფერმა**<br>(Farm) | **ისინი თავიანთ ფერმაში ბოსტნეულს ზრდიან**<br>(They grow veg on farm) | **მე ფერმაში ვმუშაობ**<br>(I work on a farm) | "I work" is very useful. |
| 1168 | **წამალი**<br>(Medicine) | **მე ჩემი წამალი უნდა მივიღო**<br>(I must take my medicine) | **წამალი მჭირდება**<br>(I need medicine) | Useful for pharmacy/doctor visits. |
| 1171 | **მილიონი**<br>(Million) | **ეს ერთი მილიონი დოლარი ღირს**<br>(It costs 1 million dollars) | **აქ მილიონი ადამიანია**<br>(Here are a million people) | Describes a crowd. |
| 1173 | **ვაჟიშვილი**<br>(Son) | **ის ჩემი ერთადერთი ვაჟიშვილია**<br>(He is my only son) | **ეს ჩემი ვაჟიშვილია**<br>(This is my son) | Standard introduction. |
| 1184 | **ზაფხული**<br>(Summer) | **ჩვენ ამ ზაფხულს შვებულებაში მივდივართ**<br>(Going on vacation this summer) | **ზაფხული ცხელია**<br>(Summer is hot) | Standard weather description. |
| 1186 | **წრე**<br>(Circle) | **მოდით, ყველა წრეზე დავსხდეთ**<br>(Let's sit in a circle) | **ეს დიდი წრეა**<br>(This is a big circle) | Simple geometry. |
| 1187 | **ზეთი**<br>(Oil) | **სამზარეულოს ზეთი უნდა ვიყიდო**<br>(I need to buy cooking oil) | **ზეთი მჭირდება**<br>(I need oil) | Good for shopping. |
| 1189 | **ბნელი**<br>(Dark) | **ძალიან ბნელა, რომ რამე დავინახო**<br>(Too dark to see) | **ოთახი ბნელია**<br>(The room is dark) | Describes a place using known word. |
| 1197 | **ბოქლომი**<br>(Padlock) | **მან ჭიშკარზე დიდი ბოქლომი დაადო**<br>(He put padlock on gate) | **კარზე ბოქლომია**<br>(There is a padlock on the door) | Simple location. |
| 1198 | **ბაბუა**<br>(Grandfather) | **ბაბუაჩემი შესანიშნავ ამბებს ჰყვება**<br>(Grandpa tells great stories) | **მე ბაბუა მიყვარს**<br>(I love grandfather) | Core family vocabulary. |
| 1199 | **მენეჯერი**<br>(Manager) | **მენეჯერს უნდა დაველაპარაკო**<br>(I need to speak to manager) | **მენეჯერი დაკავებულია**<br>(The manager is busy) | Common workplace scenario. |
| 1212 | **მეტრი**<br>(Meter) | **ოთახი სამი მეტრი სიგანისაა**<br>(Room is 3m wide) | **ეს ორი მეტრია**<br>(This is two meters) | Simple measurement. |
| 1215 | **ბირთვული**<br>(Nuclear) | **ბირთვული ელექტროსადგური**<br>(Nuclear power plant) | **ბირთვული ომი საშიშია**<br>(Nuclear war is dangerous) | Strong example context. |
| 1216 | **მშობელი**<br>(Parent) | **ყველა მშობელი ღელავს თავის შვილზე**<br>(Every parent worries) | **მშობელი სკოლაში მიდის**<br>(The parent goes to school) | Uses "goes to school" pattern. |
| 1242 | **სუსტი**<br>(Weak) | **ძალიან სუსტად ვგრძნობ თავს, რომ ვიმუშაო**<br>(Too weak to work) | **მე სუსტი ვარ**<br>(I am weak) | Good as is. |
| 1243 | **თიხა**<br>(Clay) | **ეს ლარნაკი თიხისგანაა დამზადებული**<br>(Vase made of clay) | **ეს თიხის ჯამია**<br>(This is a clay bowl) | "Bowl" is a common object. |
| 1257 | **მთა**<br>(Mountain) | **მთიდან ხედი საოცარია**<br>(View from mtn is amazing) | **ჩვენ მთაში მივდივართ**<br>(We are going to the mountains) | Common travel phrase. |
| 1260 | **დოლარი**<br>(Dollar) | **ეს წიგნი ხუთი დოლარი ღირს**<br>(Book costs 5 dollars) | **ეს წიგნი ხუთი დოლარი ღირს**<br>(This book costs 5 dollars) | *Restored original.* Great example. |
| 1262 | **სკოლა**<br>(School) | **ჩემი ძმა ჯერ კიდევ სკოლაშია**<br>(Brother is still in school) | **ბავშვები სკოლაში მიდიან**<br>(The children go to school) | Reuses "go to" pattern. |
| 1263 | **ოკეანე**<br>(Ocean) | **გემი ოკეანის გადაღმა გაცურა**<br>(Ship sailed across ocean) | **გემი ოკეანეშია**<br>(The ship is in the ocean) | Simple location sentence. |
| 1277 | **პირდაპირ**<br>(Straight) | **იარეთ პირდაპირ და შემდეგ შეუხვიეთ მარცხნივ**<br>(Go straight then left) | **იარე პირდაპირ**<br>(Walk straight) | Common direction. |


---

## LOW: Data Issues

| Row | Issue |
|-----|-------|
| 1264 | Typo: "სროლასნიხარია" should be "სროლა სასიამოვნოა" |
| 1376 | Corrupted/duplicate row data |
| 997 | Wrong preposition: სახლისთვის should be სახლთან for "pass by the house" |

---

## Summary by Issue Type

| Issue Type | Count | Priority |
|------------|-------|----------|
| Wrong word entirely | 6 | CRITICAL |
| Infinitive uses wrong form | 4 | CRITICAL |
| Confusing alternate verb | 20 | HIGH |
| Too complex/simplify | 70+ | MEDIUM |
| Data issues | 3 | LOW |

---

## Next Steps

1. Fix CRITICAL issues first (wrong word, wrong form)
2. Fix HIGH issues (confusing alternate verbs)
3. Apply MEDIUM simplifications as time allows
4. Fix LOW data issues
