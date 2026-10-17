"use strict";
(function(){
/* ================================================================ Against the Sandglass
   A timed run of short prediction trials drawn from the books. The reader guesses what happens, then reads why.
   Everything below the guard is the page; everything above it is data and plain logic, so a book's trials can be
   added by appending to BOOKS and TRIALS (and, if they need a picture, one builder to FIGS). */

/* ---------- the settings, in the order of the run ---------- */
const SETTINGS=[
 {id:"ring",   kick:"The ring road",           chip:"Ring road",           c:"#b5602c"},
 {id:"foot",   kick:"The foot of Mount Phyle", chip:"Foot of Mount Phyle", c:"#5f6e28"},
 {id:"crown",  kick:"The crown of Mount Phyle",chip:"Crown",               c:"#7a4fa0"},
 {id:"chamber",kick:"The Chamber",             chip:"Chamber",             c:"#136f9e"},
 {id:"tholos", kick:"The Tholos",              chip:"Tholos",              c:"#c8961c"}];

/* ---------- the books: slug, title, setting, and a short name for the splits ---------- */
const BOOKS=[
 {id:"owc", slug:"ordering-without-clocks",        title:"Ordering Without Clocks",          setting:"ring",    short:"Clocks"},
 {id:"mc",  slug:"many-copies-acting-as-one",      title:"Many Copies, Acting as One",       setting:"ring",    short:"Copies"},
 {id:"ts",  slug:"taking-stock-without-stopping",  title:"Taking Stock Without Stopping",    setting:"ring",    short:"Stock"},
 {id:"loa", slug:"the-limits-of-agreement",        title:"The Limits of Agreement",          setting:"foot",    short:"Limits"},
 {id:"rl",  slug:"agreeing-when-messages-run-late",title:"Agreeing When Messages Run Late",  setting:"foot",    short:"Late birds"},
 {id:"co",  slug:"answering-while-cut-off",        title:"Answering While Cut Off",          setting:"foot",    short:"Cut off"},
 {id:"bc",  slug:"agreeing-by-chance",             title:"Agreeing by Chance",               setting:"foot",    short:"Chance"},
 {id:"ds",  slug:"telling-the-dead-from-the-slow", title:"Telling the Dead from the Slow",   setting:"foot",    short:"Dead or slow"},
 {id:"al",  slug:"agreeing-among-liars",           title:"Agreeing Among Liars",             setting:"crown",   short:"Liars"},
 {id:"ko",  slug:"keeping-order-among-liars",      title:"Keeping Order Among Liars",        setting:"crown",   short:"Order"},
 {id:"cl",  slug:"changing-leaders-among-liars",   title:"Changing Leaders Among Liars",     setting:"crown",   short:"Changing"},
 {id:"ptp", slug:"the-part-time-parliament",       title:"The Part-Time Parliament",         setting:"chamber", short:"Parliament"},
 {id:"olat",slug:"one-leader-at-a-time",           title:"One Leader at a Time",             setting:"tholos",  short:"One at a time"}];

/* ---------- the trials, in route order ----------
   id, book, anchor, short, setup, question, options, right, reveal, machine, takeaway, fig: the fields to append for a new trial.
   short: the idea it tests.  star: used by the short run (one for each book).  options: the choices, right is the index of the true one.
   fixed: keep the options in the order given (numbers); otherwise they are shuffled for each run.
   anchor: the section of the book that tells it.  alt: what the picture shows.  fig: a key into FIGS (defaults to id). */
const TRIALS=[
/* ---- the ring road ---- */
{id:"owc-gate",book:"owc",anchor:"gate",short:"The quicker legs win",fig:"owc-gate",star:1,
 alt:"The ring road from above: the messengers of House 2 and House 1 stand ready to run to the gate of House 3.",
 setup:"House 3 has grain for one buyer and fills the request placed first. House 2 writes a request, and soon after, knowing nothing of it, House 1 writes one. House 1's messenger has the quicker legs.",
 question:"How can House 3 tell which request was written first?",
 options:["It cannot, from anything it holds","By whose slip reaches its gate first","By the hour each house wrote on its slip"],right:0,
 reveal:"House 1's slip arrives first, though House 2 wrote first: arrival rewards the quicker messenger. Hours written on slips only compare two water-clocks that were never set together.",
 machine:"Arrival order, and readings from clocks that drift apart, cannot say which of two events on different machines happened first.",
 takeaway:"Arrival order and clocks never set together cannot say what happened first."},
{id:"owc-tally",book:"owc",anchor:"tallysec",short:"The tally",fig:"owc-tally",
 alt:"One morning on Arche drawn in the round, each entry carrying its tally; two entries are ringed.",
 setup:"Each counting room keeps a tally. Every entry raises it, every slip carries it, and a house that receives a slip jumps past the number on it. House 2 makes an entry under tally 3; later by the sun, House 3 makes one under tally 2.",
 question:"Do the two tallies show whether one entry led to the other?",
 options:["No: a smaller tally proves nothing about a chain","Yes: the smaller tally led to the larger","Yes: the later entry led to the earlier"],right:0,
 reveal:"Along any chain of slips the tallies rise, so a cause always carries the smaller tally. The reverse fails. Here the later entry by the sun carries the smaller tally, and no chain of slips can join the two.",
 machine:"A Lamport logical clock. If one event happened before another it has the smaller timestamp, but a smaller timestamp does not show that two events are related.",
 takeaway:"A cause always has the smaller tally; a smaller tally proves nothing."},
{id:"owc-column",book:"owc",anchor:"column",short:"One number for each house",fig:"owc-column",
 alt:"The same morning; the two ringed entries carry the columns 2·2·0 and 0·0·2.",
 setup:"Each house keeps a column of three counts, one for each house: count your own entries, send the whole column on every slip, and on receiving keep the larger of each row. Two entries carry the columns 2·2·0 and 0·0·2.",
 question:"Did one of these entries lead to the other?",
 options:["No: they are unrelated","Yes: the first led to the second","Yes: the second led to the first"],right:0,
 reveal:"One entry came before another exactly when its column is nowhere larger. Here each column is larger in a different row, so no chain of slips joins them.",
 machine:"Vector clocks, from Fidge and Mattern: one event happened before another exactly when its vector is no larger in any entry; otherwise the two are concurrent.",
 takeaway:"A column of counts tells related entries from unrelated ones exactly."},
{id:"owc-goatherd",book:"owc",anchor:"mountain",short:"What no slip carries",fig:"owc-goatherd",
 alt:"The ring road with a dashed path over the mountain from House 3 to House 1, and the slip on the long road round.",
 setup:"After a sale at House 3, a goatherd scrambles over the mountain with the news, and House 1 makes a request because of it. The goatherd carries no slip; the official slip takes the long way round.",
 question:"Must House 1's request carry a larger tally than the sale?",
 options:["No: no slip joined them","Yes: a cause always carries the smaller tally"],right:0,
 reveal:"By the houses' scrolls the sale and the request are unrelated, so the request can carry the smaller tally. Neither tally nor column sees a path that never went by slip; only clocks kept in step with the sun could, and cloudy Arche cannot keep them.",
 machine:"Logical and vector clocks see only the messages inside the system. Matching causes that travel outside it needs physical clocks kept closely in step.",
 takeaway:"Nothing built from slips sees news that never went by slip."},
{id:"mc-board",book:"mc",anchor:"rulesec",short:"The rule of the board",fig:"mc-board",star:1,
 alt:"Three houses drawn in the round: House 1's request ends before House 2's begins, and a goatherd's path joins them.",
 setup:"The rule of the board: everything served could have come from one steward with one board, each request falling between its sending and its confirmation. House 1's request is confirmed before the sun is high. At noon, told by a goatherd, House 2 asks under a lower tally.",
 question:"Under the rule of the board, whose request is served first?",
 options:["House 1's","House 2's, with the lower tally","Either may go first"],right:0,
 reveal:"House 1's request was over before House 2's began, so the steward's moment for it came first, and one steward serves the older request first. Serving by tally would break the rule.",
 machine:"Linearizability: every operation appears to take effect at one instant between its call and its answer, so one that finished before another began comes first.",
 takeaway:"Business finished before other business began comes first, as the sun saw it."},
{id:"mc-copies",book:"mc",anchor:"s5",short:"Copies nobody can count",fig:"mc-copies",
 alt:"The gate of House 3 with three faint boards behind it and a question mark.",
 setup:"Behind House 3's gate there may be one board, or three copies held in step by slips. A house sees only its sendings, its confirmations and the servings.",
 question:"Under the rule of the board, can a house tell how many boards there are?",
 options:["No, not even by comparing notes","Yes, by comparing notes with the others","Yes, by watching the sun"],right:0,
 reveal:"The rule speaks only of what happens at the gates, so whatever stands behind them is judged by what comes out of them. No house, comparing notes with every other and with anyone who watched the sun, could tell. That is many copies acting as one.",
 machine:"Linearizability is judged only by calls and answers, so a replicated object that keeps it cannot be told from a single copy.",
 takeaway:"Kept, the rule makes three copies look exactly like one board."},
{id:"mc-locality",book:"mc",anchor:"locality",short:"One board at a time",fig:"mc-locality",
 alt:"A grain board at House 3 and an oil board at House 2, each marked as keeping the rule.",
 setup:"House 2 keeps a board of its own for oil, and the houses ask for oil and grain alike. The grain board, taken alone, keeps the rule of the board, and so does the oil board.",
 question:"Is all the business, taken together, sure to keep the rule?",
 options:["Yes, always","Only if one plan spans both boards","Not necessarily"],right:0,
 reveal:"All the business keeps the rule exactly when each board alone keeps it. The sun ties the boards together and never contradicts itself. A looser rule that leaves out the sun can pass each board alone and fail the two together.",
 machine:"Locality: a system of objects is linearizable exactly when each object is; sequential consistency, which ignores real time, is not local.",
 takeaway:"Each board can be kept, and judged, on its own."},
{id:"ts-twice",book:"ts",anchor:"question",short:"Counted twice, or by nobody",fig:"ts-twice",
 alt:"A cart of two hundred jars on the track from House 3 to House 2, between the dawn count and the late count.",
 setup:"Auditors count House 3's storehouse at dawn and House 2's late in the day. In between, a cart carries two hundred jars of oil from House 3 to House 2.",
 question:"What does the sum of the two counts say?",
 options:["Two hundred jars too many","The right total","Two hundred jars too few"],right:0,
 reveal:"House 3 counted the jars before they left, and House 2 counts them again on arrival. A cart going the other way would vanish from the total instead. Counting one house after another is wrong by exactly what moved between the counts.",
 machine:"Reading machines one after another gives a total wrong by whatever moved between the readings.",
 takeaway:"Counting house after house is wrong by whatever was on the road."},
{id:"ts-sash",book:"ts",anchor:"sashsec",short:"The red sash",fig:"ts-sash",star:1,
 alt:"The ring road after House 2 has recorded: a cart of 15 comes in from House 3 and a cart of 20 from House 1.",
 setup:"A house that records its storehouse at once sends a messenger in a red sash down each of its roads, before any further cart. Nothing overtakes on a track. A house that has recorded keeps a slate for each road coming in.",
 question:"What goes on a road's slate?",
 options:["What comes in after this house records, until that road's sash","Everything that comes along it all day","Only what the sender says it sent"],right:0,
 reveal:"Nothing overtakes, so a sash divides a road's traffic in two: carts ahead of it left before their sender recorded, carts behind it after. The slates catch exactly the goods on the road, and no cart is stopped.",
 machine:"The Chandy–Lamport snapshot: record local state, send a marker on every channel, and record as a channel's state what arrives on it before its marker.",
 takeaway:"A red sash down every road marks where its traffic is counted."},
{id:"ts-morning",book:"ts",anchor:"morning",short:"A morning nobody lived through",fig:"ts-morning",
 alt:"Three houses drawn in the round with the moment each recorded, House 1's sale and House 2's milling.",
 setup:"House 1 records first, then sells forty jars into its port town. Later, before House 2 records, House 2 mills barley into flour. Neither touches a road.",
 question:"The count's total describes the island…",
 options:["at a moment it never lived through","as it stood when the count began","as it stood when the last slate closed"],right:0,
 reveal:"The total has House 1 still holding the jars and House 2's barley already milled, which never happened at once. Nothing joined the two, so the island could have passed through it. The total settles any question whose answer, once true, stays true.",
 machine:"A snapshot may be a state the system never passed through, but it is reachable, so it decides every stable property, such as termination or deadlock.",
 takeaway:"The count gives a morning that could have been, enough for settled questions."},
/* ---- the foot of Mount Phyle ---- */
{id:"loa-silent",book:"loa",anchor:"silent",short:"A dead man, or a slow bird",fig:"loa-silent",
 alt:"The hill from above with four tents; the perch at tent 2 is empty.",
 setup:"Four mercenaries at the foot of Mount Phyle must all attack or all hold, and send word only by raven. Every raven arrives in the end but none has a longest flight, and one of the four may be killed. Tent 2 has heard nothing from tent 1.",
 question:"Can a long enough wait tell Number 2 whether Number 1 is dead?",
 options:["No: a dead man and a slow bird look the same","Yes, once the wait is long enough"],right:0,
 reveal:"No flight is too long to be possible, so an empty perch after any wait fits both. A plan that waits for all four reports waits for ever on a dead man, so a plan must be able to commit having heard from only three tents.",
 machine:"In an asynchronous system a crashed process cannot be told from a slow one, so a protocol must decide without hearing from one process.",
 takeaway:"With no longest flight, a dead man looks exactly like a slow bird."},
{id:"loa-never",book:"loa",anchor:"promise",short:"A fair night with no end",fig:"loa-never",star:1,
 alt:"Four tents drawn in the round, each with a hollow dot: nobody has committed.",
 setup:"Nobody lies, every bird lands, one of the four may be killed, and nobody may draw lots: given the same sighting and birds in the same order, each man does the same thing. They want no two to commit differently, a shared sighting followed, and somebody to commit.",
 question:"Can any plan, however clever, be sure that somebody commits?",
 options:["No plan can","Yes, a clever enough plan","Yes, with more men"],right:0,
 reveal:"From any night that can still tip either way, the raven that would settle it can be held back until it lands, and the night still tips either way. Used without rest, that builds a fair night, every bird landing and every man acting, in which nobody commits.",
 machine:"Fischer, Lynch and Paterson: no deterministic consensus protocol guarantees termination in an asynchronous system with one crash; safety is never what fails.",
 takeaway:"No fixed plan is sure to end, though none need ever disagree."},
{id:"loa-ways",book:"loa",anchor:"change",short:"Three ways out",fig:"loa-ways",
 alt:"The hill with four emblems: a sandglass, a slate, a setting sun and extra tents.",
 setup:"The trap springs from two things together: no raven has a longest flight, and a dead man looks exactly like a slow bird.",
 question:"Which change would not get the four out?",
 options:["More men in more tents","A longest flight for every raven","An imperfect report of who has died","Every death before dusk"],right:0,
 reveal:"The impossibility holds for any number of men, two or more. A longest flight, a report that in the end names the dead and spares one living man while most live, or every death before dusk would each let them decide. So would a coin in each tent.",
 machine:"Bounded delays, failure detectors, or crashes only at the start make consensus solvable, and so does randomization; more processes do not.",
 takeaway:"A longest flight, a report or a coin helps; more men do not."},
{id:"rl-wind",book:"rl",anchor:"never",short:"Never two answers, in any wind",fig:"rl-wind",star:1,
 alt:"The hill with wind blowing across it and a pledge tied at two tents.",
 setup:"On windy nights a raven may sit in the pines for any time. The wind always drops in the end and stays down; then a bird let go in still air comes within a span everyone knows. Nobody sees it drop.",
 question:"Can the four be sure never to commit two different answers while it blows?",
 options:["Yes, in any wind","Only after the wind drops","No arrangement can"],right:0,
 reveal:"Safety rests on counting alone. A turn's owner commits on two pledges, and calling the other answer needs three men free to accept it, among four. Late birds only make a call or a pledge fail to happen, which is always safe. Only committing waits for the calm.",
 machine:"Dwork, Lynch and Stockmeyer: under partial synchrony consensus is safe under any delays and terminates once delays settle, at a moment no machine sees.",
 takeaway:"Safety needs nothing from the wind; only committing waits for it to drop."},
{id:"rl-half",book:"rl",anchor:"twosec",short:"Two against two",fig:"rl-half",
 alt:"The hill split into two pairs of tents by a band of wind.",
 setup:"Now suppose two of the four may be killed. The wind still drops in the end, and every tent still has its sandglass. The demands are the same: no two commit differently, a shared sighting is followed, every living man commits.",
 question:"Can any arrangement still meet the three demands?",
 options:["No: more than half must live","Yes, a cleverer one","Yes, once the wind drops"],right:0,
 reveal:"A pair that hears nothing from the other pair cannot wait, since the other two may be dead. But they may be alive, with every bird between the pairs in the pines, so each pair commits alone, and the two pairs may commit differently.",
 machine:"With crashes under partial synchrony, consensus needs more than twice as many machines as may fail, n ≥ 2f + 1.",
 takeaway:"With a wind that drops, more than half must live."},
{id:"co-cut",book:"co",anchor:"cutsec",short:"The cut-off tent",fig:"co-cut",star:1,
 alt:"The hill with hawks over tent 4; every bird to and from tent 4 ends in a cross.",
 setup:"No wind blows, so a raven that arrives does so within a known flight, but a hawk may take any bird unseen. Number 2 moves the standing plan from hold to attack and is told it stands. Every bird to and from tent 4 is lost.",
 question:"Number 4 asks which plan stands. Can the answer be given and sure to be right?",
 options:["No, not while tent 4 is cut off","Yes, after a long enough wait","Yes, with sandglasses in every tent"],right:0,
 reveal:"Nothing reaches tent 4, so Number 4 cannot tell this night from one on which nobody moved the plan, and must answer hold on both. Of answering as one, answering every man, and carrying on while birds are lost, the four can have any two.",
 machine:"The CAP theorem (Brewer; Gilbert and Lynch): when the network can partition, no service is both consistent and available.",
 takeaway:"Cut off, a tent can answer every man or answer as one, not both."},
{id:"co-glass",book:"co",anchor:"glasssec",short:"Waiting a glass",fig:"co-glass",
 alt:"The hill: tent 1 is the muster-master; a bird flies from tent 4 to tent 1 and back, and tent 4 holds a sandglass.",
 setup:"No wind blows, but a hawk may take a bird. Every move and question goes by bird to one tent, the muster-master, whose note alone counts. A man who has waited two flights and the muster-master's time, with no answer, answers from their own note.",
 question:"On which nights can an answer then be out of date?",
 options:["Only on nights when a bird is lost","On every night","Never"],right:0,
 reveal:"With no bird lost, no glass runs out, and every answer is the muster-master's. When the hawks take a bird, the glass runs out and the man answers anyway. In a wind with no known flight even this fails: a slow bird looks like a lost one.",
 machine:"With bounded delays, timeouts keep a service available, and consistent whenever no message is lost; without a bound, not even then.",
 takeaway:"With a known flight, every night with no bird lost has answers as one."},
{id:"bc-divide",book:"bc",anchor:"neversec",short:"Coins can delay, never divide",fig:"bc-divide",star:1,
 alt:"The hill: tents 1, 2 and 4 report hold, tent 3 reports attack, and each tent has a coin.",
 setup:"Each man has a coin: the owl for hold, the goddess for attack. Each round a man reports, then sends a second bird, sure of an answer only on three reports of it, more than half of all four. A man who reads no sure bird tosses alone.",
 question:"Can coins that fall differently commit two men to different answers?",
 options:["No: the coins can delay, never divide","Yes, when the tosses disagree"],right:0,
 reveal:"Three reports of hold and three of attack, out of four, would share a man, who cannot have reported both, so every sure bird in a round names the same answer. Only a man who read no sure bird tosses, so nobody tosses against a settled man.",
 machine:"Ben-Or's randomized consensus: agreement and validity hold whatever the coins and delays; only termination rests on chance.",
 takeaway:"Coins can delay agreement, never divide it."},
{id:"bc-prob",book:"bc",anchor:"prob",short:"With probability one",fig:"bc-prob",
 alt:"Rows of rounds with four coins in each row, tossed at random.",
 setup:"On a night when the sightings are split, nobody is sure, and the men keep tossing until, in some round, the tosses happen to agree.",
 question:"Will the four have committed by the fortieth round?",
 options:["Almost certainly, never certainly","Certainly","There is no chance they ever will"],right:0,
 reveal:"Courses on which the tosses keep splitting still exist, but together they have no chance at all, so every man not killed commits with probability one. No round can be named by which it is sure, and more than half must stay alive.",
 machine:"Termination with probability one and no bound on the rounds, while a majority of machines stays up.",
 takeaway:"With a coin, every living man commits with probability one, by no named round."},
{id:"ds-strong",book:"ds",anchor:"strongsec",short:"One man never chalked",fig:"ds-strong",star:1,
 alt:"The hill with a small slate beside each tent; nobody has chalked tent 2.",
 setup:"Each tent has a slate: a man chalks the tents thought dead and rubs marks out when thinking again. The slates are often wrong, but every dead man is chalked in the end, and one living man is never chalked by anyone, though nobody knows which.",
 question:"How many deaths can the four then bear and still agree?",
 options:["Any number, even three","Only one","None"],right:0,
 reveal:"Everyone waits for every bird of the man nobody chalks, so every sheet of sightings comes to match that man's, and all commit to its first filled row. A dead man is chalked in the end, so nobody waits for ever.",
 machine:"Chandra and Toueg: with a strong failure detector, never suspecting some correct process, consensus survives any number of crashes.",
 takeaway:"One living man nobody ever chalks lets the four bear any number of deaths."},
{id:"ds-eventual",book:"ds",anchor:"turnsec",short:"In the end, one man spared",fig:"ds-eventual",
 alt:"The hill: the owner of the round at one tent receives estimates from the other three.",
 setup:"Now the slates are right only in the end: for as long as they like, anyone may be chalked, and only from some moment nobody sees is one living man left alone.",
 question:"What must hold for the four to agree now?",
 options:["More than half must live","Nothing more: any number may die","Agreement is no longer possible"],right:0,
 reveal:"They take turns: each owner gathers three estimates and sends the one taken up most recently, and a round that fails is always safe. If two of four may die, two pairs with slow birds each chalk the other and commit apart, though nobody died.",
 machine:"An eventually strong detector solves consensus with a majority of correct processes, and no algorithm needs less.",
 takeaway:"Slates right only in the end still do, with more than half alive."},
/* ---- the crown of Mount Phyle ---- */
{id:"al-three",book:"al",anchor:"threesec",short:"Three cannot agree",fig:"al-three",
 alt:"The crown: the chief inside the ring wall, and bandits 2 and 3 at their posts.",
 setup:"On the crown a slip arrives as written, the knots on its cord name the sender, and silence within a round means nothing was sent. A chief sends an order to two guards. Suppose one of the three lies.",
 question:"Can the honest ones be sure to obey one order, and an honest chief's?",
 options:["No: three cannot bear one liar","Yes, by comparing notes"],right:0,
 reveal:"A guard told hold by the chief and scatter by the other guard holds the same two slips whether the chief lied or the other guard did, and the two cases call for different answers.",
 machine:"Lamport, Shostak and Pease: with oral messages, three generals cannot tolerate one traitor.",
 takeaway:"With plain slips, three men cannot bear one liar."},
{id:"al-price",book:"al",anchor:"fewsec",short:"Four men to a liar",fig:"al-price",star:1,fixed:1,
 alt:"The crown, with a label reading: liars to bear, 2.",
 setup:"With plain slips, each guard repeats to the other guards what the chief sent, and every guard obeys the greater count of the accounts at their post. Every further liar adds a round of reports about reports.",
 question:"How many men are needed to bear two liars?",
 options:["Four","Five","Six","Seven"],right:3,
 reveal:"Each liar costs three more men: one liar wants four, two want seven, three want ten. The crown's four bear one liar, and the lie is outvoted without anyone learning who told it.",
 machine:"With oral messages, agreement needs more than three times as many machines as traitors, 3f + 1, and f + 1 rounds.",
 takeaway:"Plain slips need more than three men for every liar."},
{id:"al-seals",book:"al",anchor:"sealsec",short:"The seal rings",fig:"al-seals",
 alt:"The crown: the chief seals two different orders, and each guard passes theirs across.",
 setup:"Now each man has a seal ring that cannot be counterfeited. A man passing a slip on stamps their own seal beside the last, and may refuse to pass it on but cannot alter it.",
 question:"How many men are now needed to bear one liar?",
 options:["Three","Four","Seven"],right:0,
 reveal:"An order that reaches one honest guard is passed to every honest guard, so their sheaves hold the same orders and give the same answer. Any party with two more men than liars bears them all, and a chief who seals two orders convicts themselves.",
 machine:"With unforgeable signatures, agreement is possible for any number of traitors.",
 takeaway:"Seals that cannot be forged let any number of liars be borne."},
{id:"ko-share",book:"ko",anchor:"sealsec",short:"Why three seals, and four bandits",fig:"ko-share",star:1,
 alt:"The crown with four posts and two overlapping groups of three, sharing two bandits.",
 setup:"Four bandits keep a loot scroll, a copy at each post. An entry is readied at a post once three matching seals, out of four, are in hand. Suppose the registrar lies, telling two bandits that entry 7 is one thing and the others that it is another.",
 question:"Can both versions of entry 7 be readied at honest posts?",
 options:["No","Yes, if the registrar lies cleverly"],right:0,
 reveal:"Any two groups of three, out of four, share two bandits, and at most one of them lies, so the groups share an honest bandit, who seals only one entry for a number in a term. That is why four is the fewest for one liar.",
 machine:"Castro and Liskov: with 3f + 1 replicas, two quorums of 2f + 1 share an honest one, so a faulty primary cannot give two requests one number.",
 takeaway:"Two threes out of four always share an honest bandit."},
{id:"ko-stall",book:"ko",anchor:"changesec",short:"Changing the job",fig:"ko-stall",
 alt:"The crown with a sandglass at each post and the registrar's post outlined.",
 setup:"A registrar numbers nothing, and every filed entry waits. Nobody can tell a registrar who stalls from one whose rats are held in their holes by the wind.",
 question:"What do the other bandits do?",
 options:["Ask for the next term when their sandglass runs out","Work out who lied, and leave them out","Wait for the registrar however long it takes"],right:0,
 reveal:"Nobody judges. A change needs three requests, and the new registrar must number what those requests show readied, so nothing that stood is dropped. Each bandit doubles the sandglass at every change, so once the wind drops the glasses outlast the runs and entries stand.",
 machine:"A view change replaces a slow or faulty primary without losing committed requests; doubling the timeouts brings progress once delays stop growing.",
 takeaway:"A stalled registrar is replaced without judging anyone."},
{id:"cl-rats",book:"cl",anchor:"votes",short:"Votes to one, bundles to all",fig:"cl-rats",star:1,
 alt:"The crown with twelve rats running between the four posts, every man to every man.",
 setup:"Each echo used to go from every man to every other. Now each man sends their sealed vote to the registrar alone, who ties three matching votes into a bundle and sends it to all.",
 question:"How many rats run in a stage of forty men, the old way against the new?",
 options:["Over fifteen hundred, against under eighty","About the same either way","Forty, against four"],right:0,
 reveal:"Every man to every man is forty times thirty-nine rats; votes to one man and a bundle back is thirty-nine each way. On the crown a bundle can be trusted because nobody can forge a seal: three seals prove at least two honest men voted.",
 machine:"HotStuff (Yin et al.): votes go to the leader, who combines them into a quorum certificate, so messages per step grow linearly, not quadratically.",
 takeaway:"Votes to one and a bundle back: rats grow with the men, not the pairs."},
{id:"cl-hidden",book:"cl",anchor:"hidden",short:"The hidden lock",fig:"cl-hidden",
 alt:"The crown: bandit 3 holds a lock, and the next registrar hears first from three other men.",
 setup:"With two stages of voting, a man locks as soon as they see a first bundle. Suppose only bandit 3 sees one before the term ends, and the next registrar hears first from three men who do not include bandit 3.",
 question:"What does a third stage of voting buy?",
 options:["A new registrar who need not wait out a sandglass","Safety, which two stages lacked","Nothing but one more stage"],right:0,
 reveal:"With two stages the lock can hide, so every new registrar must wait out a full sandglass to hear every man. With three, a man locks only on a second bundle, which three men kept, so any three answers show it, and a new registrar goes at the rats' pace.",
 machine:"HotStuff's third phase makes leader change responsive: a new leader proceeds on the first n − f replies, with no fixed timeout.",
 takeaway:"A third stage keeps every lock in sight, so a new registrar need not wait."},
/* ---- the Chamber ---- */
{id:"ptp-maj",book:"ptp",anchor:"majorities",short:"Any two majorities share a member",fig:"ptp-maj",
 alt:"The Chamber from above with seven priests; the first majority is ringed.",
 setup:"Seven legislators wander in and out of the Chamber. A majority passes decree 37 and leaves for a banquet, and a second majority gathers in their place.",
 question:"Can the second majority be made entirely of legislators who were not in the first?",
 options:["No: someone always sits in both","Yes, if enough of them wander"],right:0,
 reveal:"Two majorities of the same Parliament can never be made of entirely different people. The legislator who sits in both carries what the first decided into the second, even after everyone else from the first has gone.",
 machine:"Quorum intersection: any two majorities of the machines share at least one, which carries forward what the earlier majority accepted.",
 takeaway:"Any two majorities share a member."},
{id:"ptp-ballot",book:"ptp",anchor:"synod",short:"The three rules of the ballot",fig:"ptp-ballot",star:1,
 alt:"The Chamber with five priests, each marked with the last vote they cast; the quorum of ballot 27 is ringed.",
 setup:"A ballot must be for the decree of the latest earlier vote in its quorum. Ballot 27's quorum is Α, Γ and Δ. Α never voted, Γ last voted for β in ballot 5, and Δ for α in ballot 2.",
 question:"Which decree must ballot 27 be for?",
 options:["α","β","Whichever the priest who starts it likes"],right:1,fixed:1,
 reveal:"Γ's vote in ballot 5 is the latest in the quorum, so ballot 27 must be for β. Once a ballot succeeds, every later quorum holds a priest who voted in it, and the rule hands its decree on, so no two scrolls disagree.",
 machine:"A proposer must use the value of the highest-numbered vote its quorum reports; that is what keeps Paxos safe.",
 takeaway:"A ballot must carry the latest vote its quorum reports."},
{id:"ptp-pres",book:"ptp",anchor:"progress",short:"Two would-be presidents",fig:"ptp-pres",
 alt:"Three priests drawn in the round, with later moments further out; Α and Ε start rival ballots.",
 setup:"Two priests keep starting ballots, each higher than the other's last, and every new ballot makes its quorum promise never to vote in a lower one.",
 question:"What happens?",
 options:["Nothing passes, and no two scrolls disagree","Two different decrees pass","The higher ballot always passes"],right:0,
 reveal:"Each new ballot dooms the other's, so nothing passes. One president who alone starts ballots cures it, and two presidents at once only slow things down, because consistency never depended on who starts ballots.",
 machine:"Duelling proposers can stall Paxos for ever; a single leader restores progress, while safety never relied on there being one.",
 takeaway:"Rival presidents can stall the Parliament, never make it disagree."},
/* ---- the Tholos ---- */
{id:"olat-pass",book:"olat",anchor:"passes",short:"Passed means three hold it",fig:"olat-pass",star:1,
 alt:"The Tholos from above: the podium at the middle, five benches round it, runners carrying a line.",
 setup:"In Schedia's Tholos one of the five legislators holds the podium, writes each line, numbers it and gives it to the runners, who bring lines to the benches in order. The law is kept on wax tablets.",
 question:"When may the holder tell the petitioner the line is law?",
 options:["When a majority, the holder and two others, holds it","As soon as the holder writes it","When all five hold it"],right:0,
 reveal:"A line passes once three hold it and every line before it. Lines no majority holds yet are drafts; a change of holder may lose one, and that harms nobody, because nobody was told it was law.",
 machine:"An operation commits once a majority of replicas hold it, and only then is the client answered.",
 takeaway:"A line passes once three of the five hold it."},
{id:"olat-board",book:"olat",anchor:"board",short:"Board and line",fig:"olat-board",
 alt:"Boards drawn as rings growing outward, each line a step round its ring.",
 setup:"Every spell at the podium gets a board: a count and the name of whoever raised it. A line is known by board and line number, and every board opens with the whole law as its holder has it.",
 question:"Which is the later copy: board 6, line 40, or board 7, line 1?",
 options:["Board 7, line 1","Board 6, line 40"],right:0,
 reveal:"Boards are compared first, and lines only within a board. Board 6, line 40 may hold far more lines and is still the older copy, because board 7 opened with everything that passed before it.",
 machine:"A viewstamp pairs the view number with the position in the view, compared view first; each new view starts from everything committed before it.",
 takeaway:"Any line of a later board outranks every line of an earlier one."},
{id:"olat-porch",book:"olat",anchor:"porch",short:"The holder who has not noticed",fig:"olat-porch",
 alt:"The Tholos: Okios on the porch, and Liskovia at the podium under board 7.",
 setup:"Okios holds board 6 and steps out onto the porch. Inside, a majority raises board 7 and Liskovia takes the podium. Okios, not knowing, writes line 13 under board 6.",
 question:"Can line 13 pass?",
 options:["No: a majority has moved on","Yes, if two others take it","Yes, until Okios walks back in"],right:0,
 reveal:"Liskovia, Kleon and Melissa have moved on to board 7, so at most Okios and Theron can hold line 13, and passing needs three. Okios can write lines but pass none, and joins board 7 as soon as a runner gets through.",
 machine:"A primary cut off from the rest can keep taking requests but cannot commit any, because it can no longer reach a majority.",
 takeaway:"A holder who missed a later board can write lines but pass none."},
{id:"olat-wax",book:"olat",anchor:"wax",short:"Wax, not ink",fig:"olat-wax",
 alt:"The Tholos: the benches of Okios, Melissa and Theron are marked home, their wax smooth.",
 setup:"Schedia keeps its law in wax, smoothed when a legislator goes home; only a name and the last board served under are cut in stone. Line 12 has passed, held by Okios, the holder, and by Liskovia and Kleon. One night Okios, Melissa and Theron go home.",
 question:"What can the council do in the morning?",
 options:["Nothing: no board can form, tonight or ever","Go on, with the law as Liskovia and Kleon hold it","Go on, once the three rewrite their tablets"],right:0,
 reveal:"Only Liskovia and Kleon still have tablets, which is not a majority, and the holder's tablets went home with Okios. So no board may form, and the council stops for good, never starting a board without a law that passed.",
 machine:"Viewstamped Replication keeps its state in memory and can stop for good if a majority crash at once; Paxos writes to lasting storage.",
 takeaway:"Wax is quick, but a majority home at once can stop the council for good."}
];

/* ---------- plain logic: no page needed ---------- */
const BOOK={},SET={},TR={};
SETTINGS.forEach(s=>SET[s.id]=s);
BOOKS.forEach((b,i)=>{b.i=i;BOOK[b.id]=b});
TRIALS.forEach((t,i)=>{t.i=i;TR[t.id]=t});
const CATS={
 short:{id:"short",name:"Every book",desc:"One setup from each of the thirteen books.",mins:5,pick:t=>!!t.star},
 full:{id:"full",name:"Every trial",desc:"Every setup, three or four from some books.",mins:15,pick:()=>true}};
const KEY="daag-sandglass-v1";

/* the ids of a run's trials, in route order */
const routeOf=cat=>TRIALS.filter(CATS[cat].pick).map(t=>t.id);
/* the books of a route in order, and for each the index (in the route) of its last trial: the split closes there */
function booksOf(route){const out=[];route.forEach((id,i)=>{const b=TR[id].book,l=out[out.length-1];if(!l||l.book!==b)out.push({book:b,first:i,last:i,n:1});else{l.last=i;l.n++}});return out}
/* m:ss.t */
function fmt(ms){ms=Math.max(0,Math.round(ms/100)*100);const m=Math.floor(ms/60000),s=Math.floor(ms/1000)%60,t=Math.floor(ms/100)%10;return m+":"+String(s).padStart(2,"0")+"."+t}
function fmtDelta(ms){const a=Math.abs(Math.round(ms/100)*100);return (ms<0?"−":"+")+fmt(a)}
/* a best counts the most right, then the shortest time */
const better=(a,b)=>!b||a.right>b.right||(a.right===b.right&&a.total<b.total);
/* the words in a field */
const words=s=>s.trim().split(/\s+/).length;
/* a random order of 0..n-1 */
function order(n,rnd=Math.random){const a=[...Array(n).keys()];for(let i=n-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* what is stored: {short:{total,splits,right,n},full:{...}}, read and written with every call guarded */
function readBests(store){try{const o=JSON.parse(store.getItem(KEY)||"{}");return o&&typeof o==="object"&&!Array.isArray(o)?o:{}}catch(e){return {}}}
function validBest(b,cat){const r=routeOf(cat);return !!b&&typeof b.total==="number"&&typeof b.right==="number"&&b.n===r.length&&Array.isArray(b.splits)&&b.splits.length===booksOf(r).length&&b.splits.every(x=>typeof x==="number")}
function bestOf(store,cat){const b=readBests(store)[cat];return validBest(b,cat)?b:null}
function saveBest(store,cat,rec){try{const o=readBests(store);o[cat]=rec;store.setItem(KEY,JSON.stringify(o));return true}catch(e){return false}}

if(typeof document==="undefined"){
  if(typeof module!=="undefined")module.exports={SETTINGS,BOOKS,TRIALS,BOOK,SET,TR,CATS,KEY,routeOf,booksOf,fmt,fmtDelta,better,words,order,readBests,bestOf,saveBest,validBest};
  return;
}

/* ================================================================ the page: drawing kit
   Copied from the books and the bird's-eye view, so every picture reads as the series does:
   Isle (the ring road from above), Hill (the foot of the hill), Crown (the crown), Room (the Chamber or the Tholos),
   Polar (space-time drawn in the round). A figure has two states: asked (as built) and told (after the answer). */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow=matchMedia("(max-width:600px)");
const NS="http://www.w3.org/2000/svg";
function el(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
const mv=(g,[x,y])=>g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`);
const line=([x1,y1],[x2,y2])=>u=>[x1+(x2-x1)*u,y1+(y2-y1)*u];
const hid=(...a)=>a.flat().forEach(e=>e&&e.classList.add("tl"));      // hidden until told
const shw=(...a)=>a.flat().forEach(e=>e&&e.classList.add("on"));
/* the cast keeps its colours from the books */
const HC={1:"#9cb648",2:"#e0b84a",3:"#5b9be0"};                       // houses
const TC={1:"#e0b84a",2:"#6583d6",3:"#c45448",4:"#9cb648"};           // tents
const BC={1:"#a57fc0",2:"#9aa0a8",3:"#e8964d",4:"#b07a55"};           // bandits
const PC={A:"#e0b84a",B:"#5b9be0",G:"#e2564e",D:"#9cb648",E:"#b58be0",Z:"#e89a4d",H:"#5fbfae"};
const PG={A:"Α",B:"Β",G:"Γ",D:"Δ",E:"Ε",Z:"Ζ",H:"Η"};
const WHO={O:{n:"Okios",g:"Ο",c:"#8fa3b8"},L:{n:"Liskovia",g:"Λ",c:"#e8b03a"},K:{n:"Kleon",g:"Κ",c:"#8fb35a"},M:{n:"Melissa",g:"Μ",c:"#cf5a4a"},T:{n:"Theron",g:"Θ",c:"#b3aea4"}};
const THA={O:-90,L:-18,K:54,M:126,T:198};
const HOLD="#136f9e",ATTACK="#bf4a26";

/* one drawing at a time owns the clock of its own tell: X.fast draws the told state at once, X.live() is false once the page has moved on */
let FIGRUN=0;
function Ctx(){const id=++FIGRUN,X={fast:false,live:()=>id===FIGRUN,
  sleep:ms=>(X.fast||reduce||!X.live())?Promise.resolve():new Promise(r=>setTimeout(r,ms)),
  tween:(ms,fn)=>new Promise(res=>{if(reduce||X.fast||ms<=0){fn(1);res();return}const t0=performance.now();
    (function f(t){if(!X.live()){res();return}const u=Math.max(0,Math.min(1,(t-t0)/ms)),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;fn(e);if(u<1)requestAnimationFrame(f);else res()})(t0)}),
  trip:(g,path,ms)=>X.tween(ms,u=>mv(g,path(u))),
  cap:html=>{const c=$("#figcap");c.innerHTML=html;c.hidden=!html}};
  return X}

/* labels, tags, crosses and tokens; the text is measured so a tag fits what it says */
function setK(svg,w){const k=Math.max(1,w/470);svg.__k=k;svg.style.setProperty("--k",k)}
const kOf=p=>(p.ownerSVGElement||p).__k||1;
function txt(p,x,y,s,cls="lab",extra={}){const ex=Object.assign({},extra);if(ex["text-anchor"]){ex.style=(ex.style?ex.style+";":"")+"text-anchor:"+ex["text-anchor"];delete ex["text-anchor"]}
  const t=el("text",Object.assign({x,y,class:cls},ex),p);t.textContent=s;return t}
function tag(p,x,y,s,cls=""){const k=kOf(p),g=el("g",{class:"tag "+cls,transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},p),r=el("rect",{rx:4},g),t=el("text",{},g);
  g.set=(s2,c)=>{if(c!==undefined)g.setAttribute("class","tag "+c);t.textContent=s2;let w=0;try{w=t.getComputedTextLength()}catch(e){}
    if(!w)w=s2.length*(narrow.matches?7.6:7)*k;const W=w+14*k,H=24*k;r.setAttribute("x",-W/2);r.setAttribute("y",-H/2);r.setAttribute("width",W);r.setAttribute("height",H)};
  g.set(s);return g}
function cross(p,x,y,s=7){return el("path",{class:"cross",d:`M${x-s},${y-s}L${x+s},${y+s}M${x+s},${y-s}L${x-s},${y+s}`},p)}
function token(p,x,y,fill,glyph,r=13){const g=el("g",{class:"tok",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},p);
  el("circle",{r,fill,stroke:"#1c1512","stroke-width":2.5},g);el("text",{},g).textContent=glyph;return g}
const xy=(cx,cy,deg,r)=>[cx+r*Math.cos(deg*Math.PI/180),cy+r*Math.sin(deg*Math.PI/180)];

/* Arche's ring road from above */
function Isle(svg){
  const cx=235,cy=235,R=165,A={1:-90,2:30,3:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");setK(svg,470);
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:86,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("text",{x:cx,y:cy-8,class:"lab"},svg).textContent="Mount Phyle";
  el("circle",{cx,cy,r:R,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8"},svg);
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const I={svg,cx,cy,R,A,under,over,house:{},
    at(deg,r=R){return xy(cx,cy,deg,r)},
    /* u of the way along the direct stretch from house a to house b; each direction keeps to its own lane */
    road(a,b,u){const d=((A[b]-A[a]+540)%360)-180;return I.at(A[a]+d*u,R+(d>0?9:-9))},
    /* the points of that stretch between u0 and u1, for drawing a track */
    track(a,b,u0=.2,u1=.8,n=16){const pts=[];for(let i=0;i<=n;i++)pts.push(I.road(a,b,u0+(u1-u0)*i/n));return "M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")}};
  for(const h of [1,2,3]){const [x,y]=I.at(A[h]),g=el("g",{class:"site",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},sites);
    el("rect",{x:-25,y:-17,width:50,height:34,rx:5,fill:HC[h]},g);el("text",{},g).textContent="H"+h;I.house[h]={x,y,g}}
  return I;
}

/* a round hall from above: the Chamber (one door) or the Tholos (a porch, a podium) */
function Room(svg,o){
  const cx=220,cy=215,rr=204,R=o.R||138; svg.innerHTML=""; svg.setAttribute("viewBox","-35 0 510 470");setK(svg,510);
  el("circle",{cx,cy,r:rr,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:R+36,fill:"none",stroke:"#b5602c","stroke-width":3,"stroke-dasharray":"3 8"},svg);
  if(o.porch){el("rect",{x:cx-26,y:cy+rr-2,width:52,height:26,fill:"#d9cfb4",stroke:"#1c1512","stroke-width":3},svg);txt(svg,cx,cy+rr+44,"the porch","lab sm")}
  else{el("rect",{x:cx-24,y:cy+rr-2,width:48,height:12,fill:"#6b4a2a",stroke:"#1c1512","stroke-width":3},svg);txt(svg,cx,cy+rr+28,"the one door","lab sm")}
  const under=el("g",{},svg),mid=el("g",{},svg),seats=el("g",{},svg),over=el("g",{},svg);
  const H={svg,cx,cy,R,rr,under,over,S:{},
    at(deg,r=R){return xy(cx,cy,deg,r)},
    /* a tag on the far side of a seat from the middle */
    note(k,s,cls="",d=56){const q=H.S[k],dx=q.x-cx,dy=q.y-cy,n=Math.hypot(dx,dy)||1;return tag(over,q.x+dx/n*d,q.y+dy/n*d,s,cls)},
    /* a tag straight under a seat, for words too long to stand beside it */
    below(k,s,cls="",dy=42,dx=0){const q=H.S[k];return tag(over,q.x+dx,q.y+dy,s,cls)}};
  if(o.podium){H.pod=el("g",{class:"podium"},mid);H.podD=el("circle",{cx,cy,r:41,fill:o.podiumFill||"#d9cfb4",stroke:"#1c1512","stroke-width":4},H.pod);H.podT=txt(H.pod,cx,cy+5,o.podium,"lab ink sm")}
  for(const k in o.seats){const [deg,glyph,fill]=o.seats[k],[x,y]=(o.place&&o.place[k])||H.at(deg);
    const g=el("g",{class:"seat"+((o.out||[]).includes(k)?" out":"")+((o.wax||[]).includes(k)?" wax":""),transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},seats);
    if((o.ring||[]).includes(k))el("circle",{class:"ring",r:31},g);
    el("circle",{class:"b",r:24,fill},g);el("text",{class:"g"},g).textContent=glyph;H.S[k]={x,y,g}}
  return H;
}
const tholosSeats=()=>Object.fromEntries(Object.keys(WHO).map(k=>[k,[THA[k],WHO[k].g,WHO[k].c]]));
const chamberSeats=(keys,ang)=>Object.fromEntries(keys.map((k,i)=>[k,[ang[i],PG[k],PC[k]]]));

/* space-time drawn in the round: each place is a line running outward, each ring a later moment,
   and whatever is carried from place to place is an arc curving round and outward */
function Polar(svg,o){
  const {cx,cy,r0,step,nodes,rings,tEnd}=o; svg.innerHTML=""; svg.setAttribute("viewBox",o.vb);setK(svg,+o.vb.split(" ")[2]);
  const defs=el("defs",{},svg);
  const mk=(key,col)=>{const m=el("marker",{id:`${svg.id}-${key}`,markerUnits:"userSpaceOnUse",markerWidth:14,markerHeight:12,refX:11,refY:5,orient:"auto"},defs);el("path",{d:"M0,0 L11,5 L0,10 z",fill:col},m)};
  mk("b","#136f9e"); mk("r","#bf4a26");
  const frame=el("g",{},svg), under=el("g",{},svg), slips=el("g",{},svg), evs=el("g",{},svg), over=el("g",{},svg);
  const P={svg,under,slips,evs,over,cx,cy,
    r:t=>r0+step*t,
    xy(deg,rr){return xy(cx,cy,deg,rr)},
    pt(k,t){return P.xy(nodes[k][0],P.r(t))},
    /* the points of an arc from place a at time ta to place b at time tb, the short way round */
    arc(a,ta,b,tb){const a0=nodes[a][0],d=((nodes[b][0]-a0+540)%360)-180,n=Math.max(12,Math.round(Math.abs(d)/3)),pts=[];
      for(let i=0;i<=n;i++)pts.push(P.xy(a0+d*i/n,P.r(ta+(tb-ta)*i/n)));return pts},
    slip(a,ta,b,tb,trim=15){const pts=P.arc(a,ta,b,tb),end=pts[pts.length-1];
      while(pts.length>2&&Math.hypot(pts[pts.length-1][0]-end[0],pts[pts.length-1][1]-end[1])<trim)pts.pop();
      const p=el("path",{class:"st-slip","marker-end":`url(#${svg.id}-b)`,d:"M"+pts.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" L")},slips);
      p.pts=P.arc(a,ta,b,tb); p.mid=p.pts[Math.floor(p.pts.length/2)]; return p},
    seg(k,t1,t2,cls=""){const [x1,y1]=P.pt(k,t1),[x2,y2]=P.pt(k,t2);return el("line",{class:"st-seg "+cls,x1,y1,x2,y2},under)},
    event(k,t,fill,rad=13){const [x,y]=P.pt(k,t),g=el("g",{class:"st-ev",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},evs);
      el("circle",{class:"halo2",r:rad+5},g);el("circle",{class:"b",r:rad,fill},g);g.label=el("text",{},g);return g}
  };
  for(let i=1;i<=rings;i++)el("circle",{class:"st-ring",cx,cy,r:P.r(i)},frame);
  for(const k in nodes){const [x1,y1]=P.pt(k,0),[x2,y2]=P.pt(k,tEnd);el("line",{class:"st-spoke",x1,y1,x2,y2},frame)}
  for(const k in nodes){const [x,y]=P.pt(k,0),g=el("g",{class:"st-node",transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},frame);
    el("rect",{x:-17,y:-12,width:34,height:24,rx:4,fill:nodes[k][2]||"#f6eed6"},g).style.fill=nodes[k][2]||"";el("text",{},g).textContent=nodes[k][1]}
  if(o.note){const [x,y]=o.note;const t=el("text",{class:"st-note",x,y},frame);t.textContent="later moments are further out"}
  return P;
}
/* a thick stretch of one place's line: the span of a piece of business */
function span(P,k,t1,t2,col,w=8){const a=P.pt(k,t1),b=P.pt(k,t2);return el("line",{x1:a[0].toFixed(1),y1:a[1].toFixed(1),x2:b[0].toFixed(1),y2:b[1].toFixed(1),stroke:col,"stroke-width":w,"stroke-linecap":"round","stroke-opacity":.8},P.under)}

/* the foot of the hill, from above: four tents round a crown */
function Hill(svg){
  const cx=235,cy=235,R=158,A={1:-90,2:0,3:90,4:180}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");setK(svg,470);
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:96,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:24,fill:"#efe6cf",stroke:"#6b5a48","stroke-width":6},svg);
  el("text",{x:cx,y:cy+52,class:"lab"},svg).textContent="the crown";
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,cx,cy,R,A,under,over,tent:{},
    at(deg,r=R){return xy(cx,cy,deg,r)},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    token(fill,glyph){const g=token(over,0,0,fill,glyph,12);return g},
    /* a raven u of the way from tent a to tent b, flying round the hill; each direction keeps its own line */
    flyAt(a,b,u){const d=((A[b]-A[a]+540)%360)-180;return H.at(A[a]+d*u,R-(d>0?24:46)*Math.sin(Math.PI*u))},
    fly(g,a,b,u){mv(g,H.flyAt(a,b,u))},
    /* the track of a raven between two tents, from u0 to u1 */
    track(a,b,u0=.12,u1=.88,n=18){const pts=[];for(let i=0;i<=n;i++)pts.push(H.flyAt(a,b,u0+(u1-u0)*i/n));return "M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")},
    state(k,s){H.tent[k].st.textContent=s},
    badge(k,s){const b=H.tent[k].badge;b.setAttribute("opacity",s?1:0);b.lastChild.textContent=s||""}
  };
  for(const k of [1,2,3,4]){const a=A[k]*Math.PI/180,[x,y]=H.at(A[k]),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:TC[k]},g);el("text",{},g).textContent="T"+k;
    const st=el("text",{class:"state halo",x:-48*Math.cos(a),y:-46*Math.sin(a)},g);
    const badge=el("g",{class:"badge",opacity:0,transform:`translate(${(38*Math.cos(a)).toFixed(1)} ${(34*Math.sin(a)).toFixed(1)})`},g);el("circle",{r:11},badge);el("text",{},badge);
    H.tent[k]={x,y,g,st,badge}}
  return H;
}

/* the crown from above: the ring wall at the centre with the chief inside, three posts out on the slopes */
function Crown(svg){
  const cx=235,cy=235,R=160,A={2:-90,3:30,4:150}; svg.innerHTML=""; svg.setAttribute("viewBox","0 0 470 470");setK(svg,470);
  el("circle",{cx,cy,r:215,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  el("circle",{cx,cy,r:112,fill:"#d9cfb4",stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"2 6"},svg);
  el("circle",{cx,cy,r:56,fill:"#efe6cf",stroke:"#6b5a48","stroke-width":9},svg);
  el("text",{x:cx,y:cy-70,class:"lab halo"},svg).textContent="ring wall";
  const under=el("g",{},svg),sites=el("g",{},svg),over=el("g",{},svg);
  const H={svg,under,over,site:{},
    pos(k){if(k===1)return [cx,cy];const a=A[k]*Math.PI/180;return [cx+R*Math.cos(a),cy+R*Math.sin(a)]},
    put(g,x,y){g.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)})`)},
    /* a rat u of the way from post a to post b; each direction keeps its own line */
    flyAt(a,b,u,bowk=16){const [x1,y1]=H.pos(a),[x2,y2]=H.pos(b),dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),bow=bowk*Math.sin(Math.PI*u);return [x1+dx*u-dy/L*bow,y1+dy*u+dx/L*bow]},
    track(a,b,u0=.2,u1=.8,bowk=16,n=14){const pts=[];for(let i=0;i<=n;i++)pts.push(H.flyAt(a,b,u0+(u1-u0)*i/n,bowk));return "M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")},
    state(k,s){H.site[k].st.textContent=s},
    mark(k,on){H.site[k].g.classList.toggle("turn",on)}};
  for(const k of [1,2,3,4]){const [x,y]=H.pos(k),g=el("g",{class:"site"},sites);H.put(g,x,y);
    el("rect",{x:-22,y:-16,width:44,height:32,rx:5,fill:BC[k]},g);el("text",{},g).textContent="B"+k;
    const a=(A[k]||0)*Math.PI/180,st=el("text",{class:"state halo",x:k===1?0:-48*Math.cos(a),y:k===1?80:-46*Math.sin(a)},g);
    H.site[k]={g,st,x,y}}
  return H;
}
/* arrowheads for plain paths drawn on a hill or a crown */
function arrowDefs(svg){const id=svg.id+"-ah",d=el("defs",{},svg);const m=el("marker",{id,markerUnits:"userSpaceOnUse",markerWidth:14,markerHeight:12,refX:11,refY:5,orient:"auto"},d);el("path",{d:"M0,0 L11,5 L0,10 z",fill:"#1c1512"},m);return `url(#${id})`}
/* a path of points, drawn as a track with or without an arrowhead */
function drawn(p,d,col="#1c1512",w=2.6,dash="",head=null){return el("path",{d,fill:"none",stroke:col,"stroke-width":w,"stroke-dasharray":dash,...(head?{"marker-end":head}:{})},p)}

/* ================================================================ the figures
   FIGS[id](svg, X) draws the asked state and returns {tell}, which draws the told state: elements hidden with hid() are shown with shw(),
   and a short motion (two seconds at most) runs through X.trip / X.tween. X.cap(html) writes a line under the picture. */
const FIGS={};

/* one morning on Arche: ten entries and three slips (the books' own morning) */
const MORN=[
  {id:"a",h:1,t:1.2,tally:1,col:[1,0,0]},{id:"b",h:1,t:2.4,tally:2,col:[2,0,0]},
  {id:"c",h:2,t:1.6,tally:1,col:[0,1,0]},{id:"d",h:2,t:3.8,tally:3,col:[2,2,0]},{id:"e",h:2,t:5,tally:4,col:[2,3,0]},
  {id:"f",h:3,t:3,tally:1,col:[0,0,1]},{id:"g",h:3,t:4.6,tally:2,col:[0,0,2]},{id:"i",h:3,t:6.6,tally:5,col:[2,3,3]},{id:"j",h:3,t:7.6,tally:6,col:[2,3,4]},
  {id:"l",h:1,t:9,tally:7,col:[3,3,4]}];
const MSLIPS=[["b","d"],["e","i"],["j","l"]];
const MEV=Object.fromEntries(MORN.map(e=>[e.id,e]));
function Morning(svg){
  const P=Polar(svg,{vb:"0 0 520 480",cx:260,cy:282,r0:40,step:24,rings:10,tEnd:9.8,note:[10,472],nodes:{1:[-90,"H1",HC[1]],2:[30,"H2",HC[2]],3:[150,"H3",HC[3]]}}),G={},S={};
  MSLIPS.forEach(([s,r])=>{S[r]=P.slip(MEV[s].h,MEV[s].t,MEV[r].h,MEV[r].t)});
  MORN.forEach(e=>{G[e.id]=P.event(e.h,e.t,HC[e.h],11)});
  return {P,G,S};
}
const hawk=(p,x,y)=>el("path",{d:`M${x-12},${y} Q${x-6},${y-9} ${x},${y} Q${x+6},${y-9} ${x+12},${y}`,fill:"none",stroke:"#1c1512","stroke-width":3,"stroke-linecap":"round"},p);

FIGS["owc-gate"]=(svg,X)=>{
  const I=Isle(svg),q1=I.house[1],q2=I.house[2],q3=I.house[3],m1=token(I.over,0,0,HC[1],"✉"),m2=token(I.over,0,0,HC[2],"✉");
  mv(m1,I.road(1,3,.08));mv(m2,I.road(2,3,.08));
  tag(I.over,q2.x,q2.y-38,"H2 writes first");tag(I.over,q1.x+92,q1.y,"H1 writes second");tag(I.over,q3.x-8,q3.y+40,"the gate");
  const w1=tag(I.over,235,262,"H1's slip arrives first","red"),w2=tag(I.over,235,292,"though H2 wrote first");hid(w1,w2);
  return {tell:async()=>{
    const p2=X.trip(m2,u=>I.road(2,3,.08+.72*u),2000);await X.sleep(300);
    const p1=X.trip(m1,u=>I.road(1,3,.08+.72*u),1100);await p1;shw(w1,w2);await p2}};
};

FIGS["co-cut"]=(svg,X)=>{
  const H=Hill(svg),t4=H.tent[4];
  el("circle",{cx:t4.x,cy:t4.y,r:52,fill:"#d9cfb4","fill-opacity":.5,stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"4 5"},H.under);
  hawk(H.over,t4.x-4,t4.y-78);hawk(H.over,t4.x+36,t4.y-92);
  const lost=(a,b,u1)=>{drawn(H.under,H.track(a,b,.1,u1),"#6b5a48",2.4,"5 5");const [x,y]=H.flyAt(a,b,u1);cross(H.over,x,y)};
  lost(2,4,.7);lost(4,2,.3);
  H.state(2,"attack");tag(H.over,t4.x+42,t4.y+74,"asks: which plan stands?");
  const ok=tag(H.over,235,180,"the plan stands at attack","red");hid(ok);
  return {tell:async()=>{shw(ok);H.state(4,"hold");await X.sleep(200)}};
};

FIGS["owc-tally"]=(svg,X)=>{
  const M=Morning(svg),P=M.P;MORN.forEach(e=>{M.G[e.id].label.textContent=e.tally});
  ["d","g"].forEach(id=>M.G[id].classList.add("sel"));
  const [dx,dy]=P.pt(2,3.8),[gx,gy]=P.pt(3,4.6);
  tag(P.over,dx-24,dy+50,"earlier by the sun");tag(P.over,gx+40,gy+44,"later by the sun");
  const nc=tag(P.over,260,438,"no chain of slips joins them","red");hid(nc);
  return {tell:async()=>{Object.values(M.S).forEach(s=>s.classList.add("hi"));shw(nc)}};
};

/* ---------------- the ring road ---------------- */
FIGS["owc-column"]=(svg,X)=>{
  const M=Morning(svg),P=M.P;["d","g"].forEach(id=>M.G[id].classList.add("sel"));
  const [dx,dy]=P.pt(2,3.8),[gx,gy]=P.pt(3,4.6);
  tag(P.over,dx-24,dy+50,"2 · 2 · 0");tag(P.over,gx+40,gy+44,"0 · 0 · 2");
  const t1=tag(P.over,dx-24,dy+80,"larger in rows 1 and 2","blue"),t2=tag(P.over,gx+40,gy+74,"larger in row 3","red"),t3=tag(P.over,255,362,"each larger somewhere","hot");hid(t1,t2,t3);
  return {tell:async()=>{shw(t1);await X.sleep(250);shw(t2);await X.sleep(250);shw(t3)}};
};

FIGS["owc-goatherd"]=(svg,X)=>{
  const I=Isle(svg),q1=I.house[1],q3=I.house[3],p0=[q3.x+38,q3.y-36],c=[300,250],p2=[q1.x+4,q1.y+24],bz=t=>[0,1].map(k=>(1-t)*(1-t)*p0[k]+2*t*(1-t)*c[k]+t*t*p2[k]);
  el("path",{d:`M${p0} Q${c} ${p2}`,fill:"none",stroke:"#bf4a26","stroke-width":3,"stroke-dasharray":"7 6"},I.under);
  tag(I.over,q3.x+6,q3.y+42,"sale · tally 9");const rq=tag(I.over,q1.x+92,q1.y+6,"request · tally ?");
  const gt=token(I.over,...p0,"#d9cfb4","g"),sl=token(I.over,...I.road(3,1,.16),HC[3],"✉");
  tag(I.over,p0[0]+52,p0[1]-26,"the goatherd","red");tag(I.over,92,234,"the slip");
  const w=tag(I.over,250,390,"the request has the smaller tally","red");hid(w);
  return {tell:async()=>{
    const pg=X.tween(1300,u=>mv(gt,bz(u))),ps=X.tween(2000,u=>mv(sl,I.road(3,1,.16+.46*u)));
    await pg;rq.set("request · tally 3","red");shw(w);await ps}};
};

FIGS["mc-board"]=(svg,X)=>{
  const P=Polar(svg,{vb:"0 0 520 450",cx:260,cy:272,r0:40,step:24,rings:9,tEnd:9.4,note:[10,440],nodes:{1:[-90,"H1",HC[1]],2:[30,"H2",HC[2]],3:[150,"H3",HC[3]]}});
  const a=[1.6,4.2],b=[6.4,8.8];
  span(P,1,a[0],a[1],HC[1],12);span(P,2,b[0],b[1],HC[2],12);
  [[1,a[0],"#fffaf0"],[1,a[1],HC[1]],[2,b[0],"#fffaf0"],[2,b[1],HC[2]]].forEach(([h,t,f])=>P.event(h,t,f,6));
  const pts=P.arc(1,4.8,2,6.0);el("path",{class:"st-slip dash",d:"M"+pts.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" L")},P.slips);
  const m=pts[Math.floor(pts.length/2)];tag(P.over,m[0]+34,m[1]-26,"a goatherd, no slip");
  const [ax,ay]=P.pt(1,2.9),[bx,by]=P.pt(2,7.6);tag(P.over,ax-96,ay,"House 1's request");tag(P.over,bx-34,by+46,"House 2's request");
  const e1=P.event(1,3.0,"#fffaf0",11),e2=P.event(2,7.6,"#fffaf0",11);e1.label.textContent="1";e2.label.textContent="2";
  const w=tag(P.over,260,372,"one steward serves 1, then 2","red");hid(e1,e2,w);
  return {tell:async()=>{shw(e1);e1.classList.add("sel");await X.sleep(400);shw(e2);e2.classList.add("sel");await X.sleep(300);shw(w)}};
};

FIGS["mc-copies"]=(svg,X)=>{
  const I=Isle(svg),q3=I.house[3];
  el("rect",{x:126,y:290,width:114,height:66,rx:8,fill:"#d9cfb4","fill-opacity":.5,stroke:"#6b5a48","stroke-width":2.5,"stroke-dasharray":"4 5"},I.under);
  el("rect",{x:119,y:286,width:8,height:74,fill:"#1c1512"},I.under);
  const bd=[0,1,2].map(i=>el("rect",{x:134+i*35,y:314,width:28,height:22,rx:3,fill:"#fffaf0",stroke:"#6b5a48","stroke-width":2,"stroke-dasharray":"3 3",opacity:.8},I.under));
  txt(I.over,183,308,"?","lab ink",{style:"font-size:26px"});tag(I.over,q3.x-8,q3.y+48,"the gate");tag(I.over,190,376,"behind the gate");
  const j=[el("line",{x1:162,y1:325,x2:169,y2:325,stroke:"#6b5a48","stroke-width":2.5},I.under),el("line",{x1:197,y1:325,x2:204,y2:325,stroke:"#6b5a48","stroke-width":2.5},I.under)];hid(j);
  const t1=tag(I.over,318,150,"no house can tell which","red"),t2=tag(I.over,318,178,"the gate shows the same");hid(t1,t2);
  return {tell:async()=>{shw(j);bd.forEach(b=>{b.setAttribute("stroke-dasharray","");b.setAttribute("opacity",1)});await X.sleep(300);shw(t1);await X.sleep(250);shw(t2)}};
};

FIGS["mc-locality"]=(svg,X)=>{
  const I=Isle(svg),board=(x,y,w,s)=>{const g=el("g",{transform:`translate(${x} ${y})`},I.over);el("rect",{x:-w/2,y:-15,width:w,height:30,rx:4,fill:"#fffaf0",stroke:"#1c1512","stroke-width":2.5},g);txt(g,0,5,s,"lab ink sm");
    const k=el("g",{},g);el("circle",{cx:w/2+4,cy:0,r:12,fill:"#eef4d3",stroke:"#5f7a22","stroke-width":2.5},k);txt(k,w/2+4,6,"✓","lab ink",{style:"fill:#3f7a2a;font-size:16px"});return g};
  board(128,262,100,"grain board");board(322,262,84,"oil board");
  const l1=drawn(I.under,"M128,282 Q150,340 235,340","#5f7a22",3,"6 5"),l2=drawn(I.under,"M322,282 Q324,340 235,340","#5f7a22",3,"6 5");
  const big=el("g",{transform:"translate(235 340)"},I.over);el("circle",{r:19,fill:"#eef4d3",stroke:"#5f7a22","stroke-width":3.5},big);txt(big,0,8,"✓","lab ink",{style:"fill:#3f7a2a;font-size:24px"});
  const t=tag(I.over,235,386,"all the business","ok");hid(l1,l2,big,t);
  return {tell:async()=>{shw(l1,l2);await X.sleep(300);shw(big);await X.sleep(250);shw(t)}};
};

FIGS["ts-twice"]=(svg,X)=>{
  const I=Isle(svg),q2=I.house[2],q3=I.house[3],cart=token(I.over,...I.road(3,2,.14),HC[3],"200",17);
  tag(I.over,q3.x+44,q3.y-44,"counted at dawn");tag(I.over,q2.x-44,q2.y-44,"counted late");
  const sum=tag(I.over,235,300,"+200 on the total","red");hid(sum);
  return {tell:async()=>{await X.trip(cart,u=>I.road(3,2,.14+.72*u),1600);shw(sum)}};
};

/* the count of Taking Stock Without Stopping, run by the book's own rules: carts, sashes, records and slates */
function Census(){
  const S={1:100,2:80,3:90},truth=S[1]+S[2]+S[3],ch={},rec={},recT={},slate={},items=[],snaps=[],key=(a,b)=>a+">"+b;
  for(const a of [1,2,3])for(const b of [1,2,3])if(a!==b)ch[key(a,b)]=[];
  const send=(a,b,x,t)=>{x.id=items.length;x.a=a;x.b=b;x.sent=t;items.push(x);ch[key(a,b)].push(x);if(x.k==="cart")S[a]-=x.n};
  const cart=n=>({k:"cart",n}),sash=()=>({k:"sash"});
  function record(h,t){rec[h]=S[h];recT[h]=t;slate[h]={};for(const o of [1,2,3])if(o!==h)slate[h][o]={sum:0,closed:false};for(const o of [1,2,3])if(o!==h)send(h,o,sash(),t)}
  function arrive(a,b,t,want){const x=ch[key(a,b)].shift();if(!x||x.k!==want[0]||(x.n||0)!==(want[1]||0))throw new Error("a track was not first-in first-out at "+t);x.arr=t;
    if(x.k==="cart"){S[b]+=x.n;if(rec[b]!=null&&!slate[b][a].closed)slate[b][a].sum+=x.n}
    else if(rec[b]==null){record(b,t);slate[b][a].closed=true}else slate[b][a].closed=true}
  const ev=[[1.4,()=>send(3,2,cart(30),1.4)],[1.6,()=>send(2,3,cart(10),1.6)],[2.2,()=>send(3,2,cart(15),2.2)],
    [2.6,()=>record(1,2.6)],[3.0,()=>send(1,2,cart(20),3.0)],
    [3.6,()=>arrive(3,2,3.6,["cart",30])],[3.8,()=>arrive(1,2,3.8,["sash"])],
    [4.6,()=>arrive(1,2,4.6,["cart",20])],[5.4,()=>arrive(3,2,5.4,["cart",15])],
    [5.8,()=>arrive(1,3,5.8,["sash"])],[6.2,()=>arrive(2,3,6.2,["cart",10])],
    [6.8,()=>arrive(2,3,6.8,["sash"])],[7.0,()=>arrive(3,2,7.0,["sash"])],[7.2,()=>arrive(2,1,7.2,["sash"])],[7.4,()=>arrive(3,1,7.4,["sash"])]];
  let i=0;for(const e of [3.0,7.4]){while(i<ev.length&&ev[i][0]<=e)ev[i++][1]()}
  const R=[1,2,3].map(h=>rec[h]),L=[];for(const h of [1,2,3])for(const o of [1,2,3])if(o!==h)L.push(slate[h][o].sum);
  const total=R.reduce((a,b)=>a+b,0)+L.reduce((a,b)=>a+b,0);
  if(total!==truth||[1,2,3].some(h=>[1,2,3].some(o=>o!==h&&!slate[h][o].closed)))throw new Error("the count does not add up");
  return {items,rec:R,recT,slate,truth,total};
}
FIGS["ts-sash"]=(svg,X)=>{
  const C=Census(),I=Isle(svg),q1=I.house[1],it=(a,b,k,n)=>C.items.find(x=>x.a===a&&x.b===b&&x.k===k&&(n===undefined||x.n===n));
  const c30=it(3,2,"cart",30),c15=it(3,2,"cart",15),c20=it(1,2,"cart",20),s1=it(1,2,"sash"),s3=it(3,2,"sash");
  const tk=x=>token(I.over,0,0,x.k==="sash"?"#bf4a26":HC[x.a],x.k==="cart"?x.n:"");
  const t30=tk(c30),t15=tk(c15),t20=tk(c20),ts1=tk(s1),ts3=tk(s3);
  mv(t30,I.road(3,2,.58));mv(t15,I.road(3,2,.3));mv(ts1,I.road(1,2,.58));mv(t20,I.road(1,2,.3));hid(ts3);mv(ts3,I.road(3,2,.12));
  tag(I.over,q1.x,q1.y+38,"H1 has recorded");
  const lab=tag(I.over,I.road(1,2,.58)[0]-70,I.road(1,2,.58)[1]-30,"red sash","red");
  const rec2=tag(I.over,250,330,`H2 records ${C.rec[1]}`,"hot"),sl1=tag(I.over,250,358,`slate from H1: ${C.slate[2][1].sum}, closed`),sl3=tag(I.over,250,386,`slate from H3: ${C.slate[2][3].sum}`,"ok");hid(rec2,sl1,sl3);
  const gone=g=>g.style.display="none";
  return {tell:async()=>{lab.classList.add("tl");
    await X.trip(t30,u=>I.road(3,2,.58+.34*u),400);gone(t30);
    await X.trip(ts1,u=>I.road(1,2,.58+.34*u),300);gone(ts1);shw(rec2,sl1);
    await X.trip(t20,u=>I.road(1,2,.3+.62*u),450);gone(t20);
    await X.trip(t15,u=>I.road(3,2,.3+.62*u),450);gone(t15);shw(sl3);
    ts3.classList.add("on");await X.trip(ts3,u=>I.road(3,2,.12+.8*u),400);gone(ts3);sl3.set(`slate from H3: ${C.slate[2][3].sum}, closed`)}};
};

FIGS["ts-morning"]=(svg,X)=>{
  const P=Polar(svg,{vb:"0 0 520 450",cx:260,cy:262,r0:38,step:26,rings:8,tEnd:7.8,note:[10,440],nodes:{1:[-90,"H1",HC[1]],2:[30,"H2",HC[2]],3:[150,"H3",HC[3]]}});
  const rec={1:3.4,2:6.2,3:4.8},ang=[-90,30,150];
  [1,2,3].forEach(h=>P.event(h,rec[h],"#fffaf0",9));P.event(1,4.4,HC[1],8);P.event(2,5.3,HC[2],8);
  const [r1x,r1y]=P.pt(1,rec[1]),[s1x,s1y]=P.pt(1,4.4),[m1x,m1y]=P.pt(2,5.3),[r2x,r2y]=P.pt(2,rec[2]),[r3x,r3y]=P.pt(3,rec[3]);
  const t1=tag(P.over,r1x-70,r1y,"H1 records"),ts=tag(P.over,s1x+76,s1y-4,"H1 sells jars"),t2=tag(P.over,m1x+4,m1y-34,"H2 mills barley");
  tag(P.over,r2x-4,r2y+32,"H2 records");tag(P.over,r3x+2,r3y+34,"H3 records");
  const loopPath=()=>{const pts=[];for(let a=-90;a<270;a+=4){const i=Math.min(2,Math.floor((a+90)/120)),j=(i+1)%3,f=(a-ang[i])/120,w=(1-Math.cos(Math.PI*f))/2,r=P.r(rec[i+1]+(rec[j+1]-rec[i+1])*w);pts.push(P.xy(a,r))}return "M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")+"Z"};
  const loop=el("path",{class:"loop",d:loopPath()},P.under);hid(loop);
  return {tell:async()=>{shw(loop);await X.sleep(300);t1.set("jars still held","ok");await X.sleep(250);t2.set("barley milled","ok")}};
};

/* ---------------- the foot of Mount Phyle ---------------- */
/* a small sandglass, its sand at level p (0 full above, 1 all below) */
function miniGlass(p,x,y,s=1,lvl=0){
  const g=el("g",{transform:`translate(${x} ${y}) scale(${s})`},p),bg=el("path",{d:"M-9,-14 H9 L1.5,0 L9,14 H-9 L-1.5,0 Z",fill:"#fffaf0"},g),
    top=el("path",{fill:"#e0b84a"},g),bot=el("path",{fill:"#e0b84a"},g);
  el("path",{d:"M-9,-14 H9 L1.5,0 L9,14 H-9 L-1.5,0 Z",fill:"none",stroke:"#1c1512","stroke-width":2.5,"stroke-linejoin":"round"},g);
  g.set=q=>{q=Math.max(0,Math.min(1,q));const hs=12*(1-q),hb=12*q,w1=9*hs/14,w2=9*(14-hb)/14;
    top.setAttribute("d",hs>.3?`M${-w1},${-hs} H${w1} L0,0 Z`:"");bot.setAttribute("d",hb>.3?`M-9,14 H9 L${w2},${14-hb} H${-w2} Z`:"")};
  g.set(lvl);return g}
const coin=(p,x,y,r=9)=>{const g=el("g",{transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},p);el("circle",{r,fill:"#e0b84a",stroke:"#1c1512","stroke-width":2.2},g);el("circle",{r:r*.5,fill:"none",stroke:"#8a6a1a","stroke-width":1.4},g);return g};

FIGS["loa-silent"]=(svg,X)=>{
  const H=Hill(svg),t1=H.tent[1];txt(H.over,385,288,"empty perch","lab halo");
  el("path",{d:"M350,262 H436",stroke:"#6b4a2a","stroke-width":5,"stroke-linecap":"round"},H.under);
  const a=tag(H.over,t1.x-78,t1.y+44,"dead?","red"),b=tag(H.over,t1.x+86,t1.y+44,"a bird in a pine?","blue");hid(a,b);
  return {tell:async()=>{shw(a);await X.sleep(350);shw(b)}};
};

FIGS["loa-never"]=(svg,X)=>{
  const P=Polar(svg,{vb:"0 0 500 500",cx:250,cy:250,r0:36,step:26,rings:8,tEnd:8.2,note:[10,490],nodes:{1:[225,"T1",TC[1]],2:[135,"T2",TC[2]],3:[315,"T3",TC[3]],4:[45,"T4",TC[4]]}});
  [1,2,3,4].forEach(k=>P.event(k,1.4,"#fffaf0",9));
  tag(P.over,250,466,"0 men committed","red");
  const hops=[[1,1.4,2,2.5],[2,2.5,3,3.6],[3,3.6,4,4.7],[4,4.7,1,5.8],[1,5.8,2,6.9],[2,6.9,3,8.0]],steps=hops.map(([a,t0,b,t1])=>{const s=P.slip(a,t0,b,t1,12),d=P.event(b,t1,"#fffaf0",9);hid(s,d);return [s,d]});
  return {tell:async()=>{for(const [s,d] of steps){shw(s,d);await X.sleep(260)}}};
};

function emblem(p,x,y,kind,label){
  const g=el("g",{class:"card",transform:`translate(${x} ${y})`},p),r=el("rect",{x:-54,y:-44,width:108,height:94,rx:6},g),ic=el("g",{transform:"translate(0 -17)"},g),st={stroke:"#1c1512","stroke-width":2.4,"stroke-linejoin":"round","stroke-linecap":"round"};
  if(kind==="glass"){el("path",{d:"M-9,-15 H9 L1.5,0 L9,15 H-9 L-1.5,0 Z",fill:"#fffaf0",...st},ic);el("path",{d:"M-5,-12 H5 L0,-2 Z M-7,13 H7 L4,6 H-4 Z",fill:"#e0b84a"},ic)}
  if(kind==="slate"){el("rect",{x:-13,y:-15,width:26,height:30,rx:2,fill:"#4a4540",...st},ic);el("path",{d:"M-8,-8 H4 M-8,-1 H8 M-8,6 H2",stroke:"#f6eed6","stroke-width":2,"stroke-linecap":"round"},ic);el("path",{d:"M5,3 l5,5 M10,3 l-5,5",stroke:"#f6eed6","stroke-width":2,"stroke-linecap":"round"},ic)}
  if(kind==="sun"){el("path",{d:"M-18,8 H18",...st},ic);el("path",{d:"M-10,8 A10,10 0 0 1 10,8 Z",fill:"#e8a33a",...st},ic);el("path",{d:"M0,-8 V-14 M-12,-3 L-17,-8 M12,-3 L17,-8",...st},ic)}
  if(kind==="tents"){el("path",{d:"M-20,12 L-11,-8 L-2,12 Z",fill:"#d9cfb4",...st},ic);el("path",{d:"M0,12 L9,-8 L18,12 Z",fill:"#d9cfb4",...st},ic);el("path",{d:"M-6,-14 H6 M0,-20 V-8",stroke:"#1c1512","stroke-width":2.4,"stroke-linecap":"round"},ic)}
  label.split("|").forEach((s,i)=>txt(g,0,24+i*16,s,"",{"text-anchor":"middle"}));
  const ok=txt(g,40,-24,"✓","mark ok"),no=el("path",{class:"cross",d:"M-40,-30 L40,36 M40,-30 L-40,36",style:"stroke-width:5"},g);hid(ok,no);
  g.lit=()=>{r.style.fill="#eef4d3";r.style.stroke="#5f7a22";shw(ok)};g.cut=()=>{r.style.fill="#fbe7de";r.style.stroke="#bf4a26";shw(no)};return g}
FIGS["loa-ways"]=(svg,X)=>{
  const H=Hill(svg),es=[emblem(H.over,140,134,"glass","a longest|flight"),emblem(H.over,330,134,"slate","a report|of the dead"),emblem(H.over,140,338,"sun","every death|before dusk"),emblem(H.over,330,338,"tents","more men|in more tents")];
  return {tell:async()=>{for(const e of es.slice(0,3)){e.lit();await X.sleep(280)}es[3].cut()}};
};

FIGS["rl-wind"]=(svg,X)=>{
  const H=Hill(svg),ah=arrowDefs(svg);
  const wave=(y,x0=34,x1=438,n=7)=>{let d=`M${x0},${y}`;const w=(x1-x0)/n;for(let i=0;i<n;i++)d+=` q${w/4},${i%2?14:-14} ${w/2},0 t${w/2},0`;return d};
  [168,294].forEach(y=>drawn(H.under,wave(y,34,420,6),"#6b8ba8",3.2,"",ah));
  tag(H.over,235,118,"pledge: hold, turn five");tag(H.over,364,284,"pledge: hold, turn five");
  const a=tag(H.over,235,330,"attack needs three men free to accept","red"),b=tag(H.over,235,358,"only two are free","red");hid(a,b);
  return {tell:async()=>{shw(a);await X.sleep(350);shw(b)}};
};

FIGS["rl-half"]=(svg,X)=>{
  const H=Hill(svg),pair=(a,b,col)=>{const [x1,y1]=H.at(H.A[a]),[x2,y2]=H.at(H.A[b]);return el("path",{d:`M${x1},${y1} L${x2},${y2}`,stroke:col,"stroke-width":78,"stroke-linecap":"round","stroke-opacity":.2},H.under)};
  pair(1,2,HOLD);pair(3,4,ATTACK);
  let d="M52,52";for(let i=1;i<=40;i++){const s=i/40,off=8*Math.sin(s*Math.PI*10);d+=` L${(52+366*s+off*0.707).toFixed(1)},${(52+366*s-off*0.707).toFixed(1)}`}
  el("path",{d,fill:"none",stroke:"#6b8ba8","stroke-width":5,"stroke-linecap":"round",opacity:.7},H.under);
  tag(H.over,340,352,"birds in the pines");
  const w=tag(H.over,235,318,"two different answers","red");hid(w);
  return {tell:async()=>{H.state(1,"hold");H.state(2,"hold");await X.sleep(250);H.state(3,"attack");H.state(4,"attack");await X.sleep(250);shw(w)}};
};

FIGS["co-glass"]=(svg,X)=>{
  const H=Hill(svg),ah=arrowDefs(svg),t4=H.tent[4];H.tent[1].g.classList.add("turn");
  tag(H.over,235,116,"muster-master");
  drawn(H.under,H.track(4,1,.12,.88),"#6b5a48",2.4,"5 5",ah);drawn(H.under,H.track(1,4,.12,.88),"#6b5a48",2.4,"5 5",ah);
  const bird=token(H.over,...H.flyAt(4,1,.5),"#fffaf0","✉",11),gl=miniGlass(H.over,t4.x-4,t4.y+46,1.5,0);
  const hk=[hawk(H.over,118,106),hawk(H.over,158,92)],x=cross(H.over,...H.flyAt(4,1,.5),9);hid(hk,x);
  const own=tag(H.over,t4.x+58,t4.y+88,"answers from its own note","red");hid(own);
  return {tell:async()=>{shw(hk);await X.sleep(300);shw(x);bird.style.display="none";await X.tween(900,u=>gl.set(u));shw(own)}};
};

FIGS["bc-divide"]=(svg,X)=>{
  const H=Hill(svg),rep={1:"H",2:"H",3:"A",4:"H"};
  [1,2,3,4].forEach(k=>{H.badge(k,rep[k]);const [x,y]=H.at(H.A[k],H.R-52);coin(H.over,x,y)});
  X.cap("H: the tent reports hold · A: it reports attack · each gold disc is a coin");
  const tri=(ks,col)=>el("path",{d:"M"+ks.map(k=>H.at(H.A[k]).map(v=>v.toFixed(1)).join(",")).join(" L")+"Z",fill:col,"fill-opacity":.12,stroke:col,"stroke-width":3,"stroke-linejoin":"round"},H.under);
  const l1=tri([1,2,4],HOLD),l2=tri([2,3,4],ATTACK),a=tag(H.over,326,158,"three of hold","blue"),b=tag(H.over,326,314,"three of attack?","red"),
    both=[2,4].map(k=>el("circle",{cx:H.tent[k].x,cy:H.tent[k].y,r:30,fill:"none",stroke:"#e0b84a","stroke-width":6},H.under)),c=tag(H.over,235,204,"in both: cannot have reported both","hot");
  hid(l1,l2,a,b,both,c);
  return {tell:async()=>{shw(l1,a);await X.sleep(300);shw(l2,b);await X.sleep(300);shw(both,c)}};
};

/* the rules of a round of coins, worked in code (from Agreeing by Chance): who is sure, who favours, who tosses */
function sureOf(vals){for(const a of "HA")if(vals.filter(v=>v===a).length*2>4)return a;return null}
function settleRule(secs){const s=secs.filter(Boolean);if(!s.length)return{kind:"toss"};if(s.some(x=>x!==s[0]))throw new Error("two sure answers in one round");return{kind:s.length>1?"settle":"favour",a:s[0]}}
function pickTwo(xs){const a=xs.slice(),out=[];while(out.length<2)out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]);return out}
function night(o){
  const sight=o.sight,men=[1,2,3,4],fav={},parted={},rounds=[],active=men.slice(),toss=()=>"HA"[Math.floor(Math.random()*2)];men.forEach(m=>fav[m]=sight[m]);
  for(let r=1;r<=o.max&&active.length;r++){
    const send=men.filter(m=>active.includes(m)||(parted[m]&&parted[m].c===r-1)),rep={};send.forEach(m=>rep[m]=active.includes(m)?fav[m]:parted[m].a);
    const sure={},sec={},out={};
    active.forEach(m=>{const others=send.filter(x=>x!==m);sure[m]=sureOf([rep[m],...pickTwo(others).map(x=>rep[x])])});
    send.forEach(m=>sec[m]=active.includes(m)?sure[m]:parted[m].a);
    active.forEach(m=>{const others=send.filter(x=>x!==m),res=settleRule([sec[m],...pickTwo(others).map(x=>sec[x])]);if(res.kind==="toss")res.t=toss();out[m]=res});
    rounds.push({r,active:active.slice(),out});
    active.slice().forEach(m=>{const x=out[m];if(x.kind==="toss")fav[m]=x.t;else{fav[m]=x.a;if(x.kind==="settle"){parted[m]={c:r,a:x.a};active.splice(active.indexOf(m),1)}}});
  }
  const ans=Object.values(parted).map(p=>p.a);if(ans.some(a=>a!==ans[0]))throw new Error("two men committed to different answers");
  return {rounds,done:!active.length};
}
FIGS["bc-prob"]=(svg,X)=>{
  svg.innerHTML="";svg.setAttribute("viewBox","0 0 470 470");setK(svg,470);
  const g=el("g",{},svg),colX=i=>128+i*92,ans={H:HOLD,A:ATTACK},MAX=8;
  [1,2,3,4].forEach((k,i)=>{const c=el("g",{class:"site",transform:`translate(${colX(i)} 26)`},g);el("rect",{x:-22,y:-15,width:44,height:30,rx:5,fill:TC[k]},c);el("text",{},c).textContent="T"+k});
  txt(g,10,70,"dusk","lab sm",{style:"text-anchor:start"});
  const dusk={1:"H",2:"H",3:"A",4:"A"};
  [1,2,3,4].forEach((k,i)=>{const c=el("g",{transform:`translate(${colX(i)} 66)`},g);el("circle",{r:15,fill:ans[dusk[k]],stroke:"#1c1512","stroke-width":2.5},c);txt(c,0,5,dusk[k],"lab ink",{style:"fill:#fff;font-size:15px"})});
  const ask=tag(g,235,446,"nobody is sure, so all four toss","red");
  const ph=[0,1,2,3,4].map(j=>{const y=108+j*40,row=el("g",{opacity:.45},g);txt(row,10,y+5,"round "+(j+1),"lab sm",{style:"text-anchor:start"});
    [0,1,2,3].forEach(i=>el("circle",{cx:colX(i),cy:y,r:12,fill:"none",stroke:"#6b5a48","stroke-width":1.6,"stroke-dasharray":"3 4"},row));return row});
  const key="O: the owl, hold · G: the goddess, attack · a gold ring marks a toss · ✓: settled";X.cap(key);
  const N=night({sight:dusk,max:60}),rows=N.rounds.slice(0,MAX),nodes=rows.map((rd,j)=>{const y=108+j*40,row=el("g",{},g);hid(row);
    txt(row,10,y+5,"round "+rd.r,"lab sm",{style:"text-anchor:start"});
    [1,2,3,4].forEach((k,i)=>{const o=rd.out[k],c=el("g",{transform:`translate(${colX(i)} ${y})`},row);
      if(!o){el("circle",{r:6,fill:"none",stroke:"#6b5a48","stroke-width":1.5,"stroke-dasharray":"2 3"},c);return}
      const a=o.kind==="toss"?o.t:o.a;el("circle",{r:15,fill:ans[a],stroke:"#1c1512","stroke-width":o.kind==="settle"?5:2.5},c);
      if(o.kind==="toss")el("circle",{r:20,fill:"none",stroke:"#e0b84a","stroke-width":4},c);
      txt(c,0,5,o.kind==="settle"?"✓":o.kind==="toss"?(a==="H"?"O":"G"):a,"lab ink",{style:"fill:#fff;font-size:15px"})});return row});
  const done=tag(g,235,446,"","ok");hid(done);
  const nr=N.rounds.length;
  return {tell:async()=>{for(const r of nodes){shw(r);await X.sleep(170)}
    ph.forEach(r=>{r.style.transition="opacity .4s";r.style.opacity=0});ask.classList.add("tl");done.set(N.done&&nr<=MAX?`every man committed by round ${nr}`:"and on, round after round","ok");shw(done);
    X.cap(key+"<br>The tosses in this picture are drawn at random, so another night takes another number of rounds.")}};
};

FIGS["ds-strong"]=(svg,X)=>{
  const H=Hill(svg),ah=arrowDefs(svg),chalk={1:[3,4],2:[1,3,4],3:[1,4],4:[1]},pos={1:[235,160],2:[316,235],3:[235,328],4:[154,235]};
  [1,2,3,4].forEach(k=>{const [x,y]=pos[k],g=el("g",{transform:`translate(${x} ${y})`},H.over),rows=[1,2,3,4].filter(j=>j!==k);
    el("rect",{x:-34,y:-27,width:68,height:54,rx:3,fill:"#4a4540",stroke:"#1c1512","stroke-width":2.5},g);
    rows.forEach((j,i)=>{const ry=-18+i*17;el("rect",{x:-28,y:ry-6,width:11,height:11,rx:2,fill:TC[j],stroke:"#1c1512","stroke-width":1.5},g);
      if(chalk[k].includes(j))el("path",{d:`M-8,${ry-4} l9,8 M1,${ry-4} l-9,8`,stroke:"#f6eed6","stroke-width":2.2,"stroke-linecap":"round"},g);
      else el("path",{d:`M-8,${ry} h22`,stroke:"#f6eed6","stroke-width":1,"stroke-dasharray":"2 3",opacity:.5},g);
      if(j===2&&k!==2)el("rect",{x:-31,y:ry-9,width:62,height:17,rx:3,fill:"none",stroke:"#9cd13a","stroke-width":2.6},g)})});
  tag(H.over,235,116,"nobody ever chalks tent 2","ok");
  const wait=a=>{const A=H.tent[a],B=H.tent[2],dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;return drawn(H.under,`M${A.x+ux*32},${A.y+uy*32} L${B.x-ux*38},${B.y-uy*38}`,"#5f7a22",3.4,"",ah)};
  const arr=[1,3,4].map(wait),ring=el("circle",{cx:H.tent[2].x,cy:H.tent[2].y,r:30,fill:"none",stroke:"#e0b84a","stroke-width":6},H.under);hid(arr,ring);
  return {tell:async()=>{shw(ring);for(const p of arr){shw(p);await X.sleep(250)}X.cap("Everyone waits for tent 2's birds, so every sheet comes to match tent 2's.")}};
};

FIGS["ds-eventual"]=(svg,X)=>{
  const H=Hill(svg),ah=arrowDefs(svg);H.tent[1].g.classList.add("turn");H.state(1,"owner");
  const arr=[2,3,4].map(k=>drawn(H.under,H.track(k,1,.14,.84),"#1c1512",2.4,"",ah)),est=tag(H.over,235,314,"estimates go to the owner");
  const pair=(a,b,col)=>{const [x1,y1]=H.at(H.A[a]),[x2,y2]=H.at(H.A[b]);return el("path",{d:`M${x1},${y1} L${x2},${y2}`,stroke:col,"stroke-width":78,"stroke-linecap":"round","stroke-opacity":.2},H.under)};
  const p1=pair(1,2,HOLD),p2=pair(3,4,ATTACK),x1=tag(H.over,340,142,"this pair chalks the other","blue"),x2=tag(H.over,132,330,"this pair chalks the other","red");
  const w=tag(H.over,235,214,"nobody has died","hot");hid(p1,p2,x1,x2,w);
  return {tell:async()=>{arr.forEach(a=>a.style.opacity=.25);est.classList.add("tl");shw(p1,p2);await X.sleep(300);shw(x1);await X.sleep(250);shw(x2);await X.sleep(250);shw(w)}};
};

/* ---------------- the crown of Mount Phyle ---------------- */
const lock=(p,x,y,s=1)=>{const g=el("g",{transform:`translate(${x} ${y}) scale(${s})`},p);el("path",{d:"M-6,-4 V-9 A6,6 0 0 1 6,-9 V-4",fill:"none",stroke:"#1c1512","stroke-width":2.6},g);el("rect",{x:-9,y:-4,width:18,height:14,rx:2,fill:"#e0b84a",stroke:"#1c1512","stroke-width":2.4},g);return g};
/* a card of words laid over a figure: lines[i] is [text, bold?] */
function cardOf(p,x,y,w,h,lines,cls=""){const g=el("g",{class:"card "+cls,transform:`translate(${x} ${y})`},p);el("rect",{width:w,height:h,rx:6},g);
  lines.forEach(([s,hd,dy,col],i)=>{const t=txt(g,12,dy,s,hd?"hd":"",{style:"text-anchor:start"+(col?";fill:"+col:"")})});return g}
const dim=(els,o=.2)=>els.forEach(e=>e.style.opacity=o);

FIGS["al-three"]=(svg,X)=>{
  const H=Crown(svg),ah=arrowDefs(svg);H.site[4].g.classList.add("out");
  drawn(H.under,H.track(1,2,.28,.78,0),HOLD,3.2,"",ah);drawn(H.under,H.track(3,2,.16,.84,22),ATTACK,3.2,"",ah);
  tag(H.over,196,126,"hold","blue");tag(H.over,345,196,"“the chief sent me scatter”","red");tag(H.over,235,44,"bandit 2 holds two slips");
  const kids=[...svg.children],A=cardOf(svg,12,128,222,200,[["suppose bandit 3 lies",1,28],["bandit 2 holds:",0,62],["from the chief: hold",0,88],["from bandit 3:",0,114],["“the chief sent me scatter”",0,138],["the same two slips",1,178,"#bf4a26"]]),
        B=cardOf(svg,242,128,222,200,[["suppose the chief lies",1,28],["bandit 2 holds:",0,62],["from the chief: hold",0,88],["from bandit 3:",0,114],["“the chief sent me scatter”",0,138],["the same two slips",1,178,"#bf4a26"]]);
  hid(A,B);
  return {tell:async()=>{dim(kids,.18);shw(A);await X.sleep(350);shw(B)}};
};

FIGS["al-price"]=(svg,X)=>{
  const H=Crown(svg);tag(H.over,235,410,"liars to bear: 2","hot");
  const kids=[...svg.children],g=el("g",{class:"card"},svg),rows=[["1 liar",4],["2 liars",7],["3 liars",10]];
  el("rect",{x:28,y:140,width:414,height:176,rx:6},g);
  rows.forEach(([s,n],i)=>{const y=190+i*50;if(n===7)el("rect",{x:38,y:y-24,width:394,height:46,rx:4,fill:"#f7e3a8",stroke:"none"},g);
    txt(g,52,y+5,s,"hd",{style:"text-anchor:start"});txt(g,138,y+5,String(n),"hd",{style:"text-anchor:middle;font-size:calc(19px*var(--k))"});
    for(let j=0;j<n;j++)el("circle",{cx:168+j*26,cy:y,r:9,fill:n===7?"#e0b84a":"#fffaf0",stroke:"#1c1512","stroke-width":2.2},g)});
  txt(g,138,160,"men","",{style:"text-anchor:middle"});hid(g);
  return {tell:async()=>{dim(kids,.15);shw(g)}};
};

FIGS["al-seals"]=(svg,X)=>{
  const H=Crown(svg),ah=arrowDefs(svg);H.site[4].g.classList.add("out");
  drawn(H.under,H.track(1,2,.28,.78,0),HOLD,3.2,"",ah);drawn(H.under,H.track(1,3,.28,.78,0),ATTACK,3.2,"",ah);
  tag(H.over,196,126,"hold : 1","blue");tag(H.over,322,262,"scatter : 1","red");tag(H.over,235,318,"the chief seals two orders","hot");
  const s2=tag(H.over,235,44,"sheaf: hold"),s3=tag(H.over,322,362,"sheaf: scatter");
  const a=drawn(H.under,H.track(2,3,.2,.8,26),HOLD,3,"",ah),b=drawn(H.under,H.track(3,2,.2,.8,26),ATTACK,3,"",ah);
  const ta=tag(H.over,372,140,"hold : 1 : 2","blue"),tb=tag(H.over,368,174,"scatter : 1 : 3","red");hid(a,b,ta,tb);
  return {tell:async()=>{shw(a,ta);await X.sleep(350);shw(b,tb);await X.sleep(300);s2.set("sheaf: hold, scatter","ok");s3.set("sheaf: scatter, hold","ok")}};
};

FIGS["ko-share"]=(svg,X)=>{
  const H=Crown(svg),poly=(ks,col)=>el("path",{d:"M"+ks.map(k=>H.pos(k).map(v=>v.toFixed(1)).join(",")).join(" L")+"Z",fill:col,"fill-opacity":.13,stroke:col,"stroke-width":3.4,"stroke-linejoin":"round"},H.under);
  poly([1,2,3],HOLD);poly([1,3,4],ATTACK);
  tag(H.over,235,36,"three seals for X","blue");tag(H.over,160,372,"three seals for Y","red");
  const ring=k=>el("circle",{cx:H.site[k].x,cy:H.site[k].y,r:30,fill:"none",stroke:"#e0b84a","stroke-width":6},H.under);
  const r1=ring(1),r3=ring(3),t1=tag(H.over,235,184,"the registrar: suppose this one lies","red"),t3=tag(H.over,322,358,"honest: seals one entry","ok");hid(r1,r3,t1,t3);
  return {tell:async()=>{shw(r1,r3);await X.sleep(300);shw(t1);await X.sleep(250);shw(t3)}};
};

FIGS["ko-stall"]=(svg,X)=>{
  const H=Crown(svg),ah=arrowDefs(svg);H.site[1].g.classList.add("turn");
  const gl={2:miniGlass(H.over,286,75,1.4,.12),3:miniGlass(H.over,H.site[3].x,H.site[3].y+46,1.4,.12),4:miniGlass(H.over,H.site[4].x,H.site[4].y+46,1.4,.12)};
  tag(H.over,235,324,"the registrar numbers nothing","red");
  const rq=[[3,2],[4,2],[1,2]].map(([a,b])=>drawn(H.under,H.track(a,b,.2,.8,14),"#1c1512",2.6,"",ah)),nt=tag(H.over,350,118,"next term: bandit 2","hot");hid(rq,nt);
  return {tell:async()=>{await X.tween(800,u=>Object.values(gl).forEach(g=>g.set(.12+.88*u)));shw(rq);await X.sleep(300);H.site[1].g.classList.remove("turn");H.site[2].g.classList.add("turn");shw(nt)}};
};

FIGS["cl-rats"]=(svg,X)=>{
  const H=Crown(svg),ah=arrowDefs(svg),all=[];
  for(const a of [1,2,3,4])for(const b of [1,2,3,4])if(a!==b)all.push(drawn(H.under,H.track(a,b,.22,.78,15),"#6b5a48",2.2,"",ah));
  const t=tag(H.over,235,420,"every man to every man: 12 rats");
  const votes=[2,3,4].map(a=>drawn(H.under,H.track(a,1,.2,.8,0),HOLD,3.4,"",ah)),bundles=[2,3,4].map(b=>drawn(H.under,H.track(1,b,.26,.82,22),ATTACK,3.4,"",ah)),t2=tag(H.over,235,420,"votes to one, a bundle back: 6 rats","red");
  hid(votes,bundles,t2);
  return {tell:async()=>{dim(all,.12);t.classList.add("tl");shw(votes);await X.sleep(400);shw(bundles,t2);X.cap("With forty men: 40 × 39 = 1,560 rats, against 39 + 39 = 78.")}};
};

FIGS["cl-hidden"]=(svg,X)=>{
  const H=Crown(svg),ah=arrowDefs(svg);H.site[1].g.classList.add("turn");
  lock(H.over,H.site[3].x+36,H.site[3].y-34,1.2);tag(H.over,322,358,"locked on a first bundle");
  const a2=drawn(H.under,H.track(2,1,.2,.76,0),HOLD,3,"",ah),a4=drawn(H.under,H.track(4,1,.2,.76,0),HOLD,3,"",ah),a3=drawn(H.under,H.track(3,1,.2,.76,0),"#6b5a48",2.4,"5 5",ah);
  tag(H.over,332,282,"slow","red");tag(H.over,235,142,"the next registrar hears from three");
  const rings=[2,3,4].map(k=>el("circle",{cx:H.site[k].x,cy:H.site[k].y,r:30,fill:"none",stroke:"#e0b84a","stroke-width":6},H.under)),
    t1=tag(H.over,235,394,"three men kept the first bundle","hot"),t2=tag(H.over,235,424,"any three answers include one","ok");hid(rings,t1,t2);
  return {tell:async()=>{shw(rings);shw(t1);await X.sleep(450);shw(t2)}};
};

/* ---------------- the Chamber of Paxos ---------------- */
FIGS["ptp-maj"]=(svg,X)=>{
  const ks=["A","B","G","D","E","Z","H"],H=Room(svg,{seats:chamberSeats(ks,ks.map((_,i)=>-90+i*360/7+11.5))}),m1=["A","B","G","D"],m2=["D","E","Z","H"];
  const ring=(k,r,col)=>{const q=H.S[k];return el("circle",{cx:q.x,cy:q.y,r,fill:"none",stroke:col,"stroke-width":5},H.under)};
  m1.forEach(k=>ring(k,31,HOLD));txt(H.over,H.cx,H.cy-12,"first majority","lab ink",{style:"fill:#136f9e"});
  const r2=m2.map(k=>ring(k,37,"#5f6e28")),both=ring("D",43,"#e0b84a"),t2=txt(H.over,H.cx,H.cy+12,"second majority","lab ink",{style:"fill:#5f6e28"}),tb=H.note("D","in both","hot",66);
  hid(r2,both,t2,tb);
  return {tell:async()=>{shw(r2,t2);await X.sleep(450);shw(both,tb)}};
};

FIGS["ptp-ballot"]=(svg,X)=>{
  const ks=["A","B","G","D","E"],LAST={A:null,B:[14,"α"],G:[5,"β"],D:[2,"α"],E:[14,"α"]},H=Room(svg,{seats:chamberSeats(ks,[200,270,340,40,140])}),N={};
  ks.forEach(k=>{const q=H.S[k];if("AGD".includes(k))el("circle",{cx:q.x,cy:q.y,r:31,fill:"none",stroke:"#e0b84a","stroke-width":6},H.under);
    N[k]=H.note(k,LAST[k]?`voted ${LAST[k][1]} in ${LAST[k][0]}`:"never voted","",58)});
  txt(H.over,H.cx,H.cy-10,"ballot 27","lab ink",{style:"font-size:22px"});
  const r1=txt(H.over,H.cx,H.cy+18,"must be for β","lab red",{style:"font-size:19px"}),r2=txt(H.over,H.cx,H.cy+40,"Γ's vote in ballot 5 is the latest","lab sm");hid(r1,r2);
  return {tell:async()=>{N.G.set("voted β in 5","hot");shw(r1);await X.sleep(300);shw(r2)}};
};

FIGS["ptp-pres"]=(svg,X)=>{
  const P=Polar(svg,{vb:"0 0 480 480",cx:240,cy:268,r0:40,step:29,rings:6,tEnd:6.2,note:[10,470],nodes:{A:[150,"Α",PC.A],G:[-90,"Γ",PC.G],E:[30,"Ε",PC.E]}});
  const rows=[],s=(k,a,ta,b,tb,label,cls,at=.5)=>{const p=P.slip(a,ta,b,tb);if(k>3)hid(p);const e=[p];if(label){const q=p.pts[Math.floor(p.pts.length*at)],t=tag(P.over,q[0],q[1],label,cls);if(k>3)hid(t);e.push(t)}return e};
  const gx=t=>P.pt("G",t),late=[];
  s(0,"A",.6,"G",1.6,"ask 27");s(1,"G",1.8,"A",2.8);s(2,"E",2,"G",3,"ask 28","",.62);s(3,"G",3.2,"E",4.2);
  const v1=s(4,"A",3.1,"G",4.1,"vote 27?","red",.3),x1=cross(P.over,gx(4.1)[0]-16,gx(4.1)[1]);hid(x1);
  const a3=s(5,"A",4.4,"G",5.4,"ask 29","",.72),v2=s(6,"E",4.6,"G",5.6,"vote 28?","red",.3),x2=cross(P.over,gx(5.6)[0]+16,gx(5.6)[1]);hid(x2);
  const w=tag(P.over,240,444,"each ask dooms the other's ballot","red");hid(w);
  return {tell:async()=>{shw(v1);await X.sleep(350);shw(x1);await X.sleep(250);shw(a3);await X.sleep(350);shw(v2);await X.sleep(200);shw(x2,w)}};
};

/* ---------------- the Tholos of Schedia ---------------- */
const KS5=["O","L","K","M","T"];
/* Schedia's rule for when a board may form: a majority answered, and a majority has tablets or the old holder answered with tablets (the book's rule, so far as everyone last served under one board) */
function mayForm(ans){const w=KS5.filter(k=>ans[k]==="with"),x=KS5.filter(k=>ans[k]==="without"),maj=w.length+x.length>=3;return {maj,forms:maj&&(w.length>=3||(x.length>0&&ans.O==="with")),w,x}}

FIGS["olat-pass"]=(svg,X)=>{
  const H=Room(svg,{porch:true,podium:"board 6",podiumFill:WHO.O.c,seats:tholosSeats(),ring:["O"]}),N={},B=["L","K","M","T"];
  B.forEach(k=>{const q=H.S[k];el("line",{x1:H.cx,y1:H.cy,x2:q.x,y2:q.y,stroke:"#6b5a48","stroke-width":2,"stroke-dasharray":"4 5"},H.under);N[k]=H.note(k,"holds line 11")});
  N.O=H.note("O","writes line 12","hot");
  const r1=txt(H.over,H.cx,H.cy+64,"","lab ink sm halo"),r2=txt(H.over,H.cx,H.cy+82,"","lab sm halo"),rings={};
  return {tell:async()=>{
    const go=(k,ms,back)=>{const q=H.S[k],g=token(H.over,H.cx,H.cy,"#fffaf0","12");
      return X.trip(g,line([H.cx,H.cy],[q.x,q.y]),ms).then(async()=>{N[k].set("holds line 12","");if(back){g.querySelector("text").textContent="✓";await X.trip(g,line([q.x,q.y],[H.cx,H.cy]),back)}g.remove()})};
    const slow=[go("M",1700,0),go("T",1900,0)];
    await Promise.all([go("L",650,450),go("K",800,450)]);
    ["O","L","K"].forEach(k=>{const q=H.S[k];if(!rings[k])rings[k]=el("circle",{cx:q.x,cy:q.y,r:31,fill:"none",stroke:"#e0b84a","stroke-width":6},H.under)});
    r1.textContent="line 12 has passed";r2.textContent="the holder and two others hold it";await Promise.all(slow)}};
};

FIGS["olat-board"]=(svg,X)=>{
  svg.innerHTML="";svg.setAttribute("viewBox","0 0 440 440");setK(svg,470);const cx=220,cy=220,at=(r,l)=>xy(cx,cy,-90+l*6,r),
    arcD=(r,l)=>{const [x0,y0]=at(r,0),[x1,y1]=at(r,Math.max(l,.3));return `M${x0},${y0} A${r},${r} 0 ${l*6>180?1:0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`};
  el("circle",{cx,cy,r:204,fill:"#efe6cf",stroke:"#1c1512","stroke-width":5},svg);
  [[70,"board 5 · Okios",28,"#b9a77e"],[120,"board 6 · Okios",40,WHO.O.c],[170,"board 7 · Liskovia",1,WHO.L.c]].forEach(([r,s,l,c])=>{
    el("circle",{cx,cy,r,fill:"none",stroke:"#b9a77e","stroke-width":1,"stroke-dasharray":"3 4"},svg);
    el("path",{d:arcD(r,l),fill:"none",stroke:c,"stroke-width":10,"stroke-linecap":"round"},svg);txt(svg,cx-18,cy-r+4,s,"lab sm",{"text-anchor":"end"})});
  const [ax,ay]=at(120,40),[bx,by]=at(170,1);
  el("circle",{cx:ax,cy:ay,r:8,fill:WHO.O.c,stroke:"#1c1512","stroke-width":2.5},svg);el("circle",{cx:bx,cy:by,r:8,fill:WHO.L.c,stroke:"#1c1512","stroke-width":2.5},svg);
  const ta=tag(svg,ax-10,ay+30,"board 6, line 40"),tb=tag(svg,bx+86,by+22,"board 7, line 1");
  txt(svg,cx,cy-4,"later boards","lab sm");txt(svg,cx,cy+14,"further out","lab sm");txt(svg,cx,cy+50,"lines run round","lab sm");
  return {tell:async()=>{tb.set("board 7, line 1: later","hot");ta.set("board 6, line 40: older","")}};
};

FIGS["olat-porch"]=(svg,X)=>{
  const H=Room(svg,{porch:true,podium:"board 7",podiumFill:WHO.L.c,seats:tholosSeats(),ring:["L"],place:{O:[220,422]}});
  {const [x,y]=H.at(-90);el("circle",{cx:x,cy:y,r:24,fill:"none",stroke:"#b9a77e","stroke-width":2,"stroke-dasharray":"4 4"},H.under)}
  const q=H.S.O,t=H.S.T;el("line",{x1:q.x,y1:q.y,x2:t.x,y2:t.y,stroke:"#6b5a48","stroke-width":2,"stroke-dasharray":"4 5"},H.under);
  const o=tag(H.over,H.cx,H.cy+70,"Okios, under board 6, writes line 13"),nt=H.below("T","not heard of 7","",42,8);["L","K","M"].forEach(k=>H.note(k,"board 7","hot",60));
  return {tell:async()=>{const g=token(H.over,q.x,q.y,"#fffaf0","13");await X.trip(g,line([q.x,q.y],[t.x,t.y]),950);g.querySelector("text").textContent="✓";nt.set("holds line 13","");
    await X.trip(g,line([t.x,t.y],[q.x,q.y]),950);g.remove();o.set("only two hold line 13: it cannot pass","red")}};
};

FIGS["olat-wax"]=(svg,X)=>{
  const ans={O:"without",L:"with",K:"with",M:"without",T:"without"},r=mayForm(ans),H=Room(svg,{porch:true,podium:"board 7?",seats:tholosSeats(),wax:["O","M","T"]});
  KS5.forEach(k=>H.below(k,ans[k]==="with"?"tablets · line 12":"home, smooth wax",ans[k]==="with"?"":"red",42));
  const r1=txt(H.over,H.cx,H.cy+64,"","lab red sm halo"),r2=txt(H.over,H.cx,H.cy+82,"","lab sm halo");
  return {tell:async()=>{r1.textContent=r.forms?"board 7 forms":"no board may form";r2.textContent=r.forms?"":"only two have tablets, and not the holder's"}};
};
/*FIGS-END*/

/* ================================================================ the page: the run */
const E=Object.fromEntries(["now","prog","cover","run","finish","cats","timeme","timehelp","routeprev","coverglass","trial","veil","tfig","fig","figcap","kick","setup","q","opts","reveal","verdict","why","machtext","booklink","next","panel","glass","clock","clockcap","splits","leave","pcount","pause","strip","sclock","sn","ticks","fkick","score","newbest","fsub","fbtns","stable","splitsec","routelist","booklinks"].map(k=>[k,document.getElementById(k)]));
const store=()=>{try{return window.localStorage}catch(e){return null}};
/* the best of this visit too, so "new best" stays honest when the browser keeps nothing */
const sessionBest={};
function currentBest(cat){const a=bestOf(store(),cat),b=sessionBest[cat]||null;return a&&b?(better(a,b)?a:b):(a||b)}
const S={view:"cover",cat:"short",route:[],books:[],i:0,timed:true,deep:false,only:false,ans:{},splits:[],acc:0,t0:0,running:false,paused:false,order:{},best:null,chosen:null,X:null,api:null,result:null};
const elapsed=()=>S.acc+(S.running?performance.now()-S.t0:0);
const mk=(tag,cls,parent)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(parent)parent.appendChild(e);return e};

/* the sandglass: sand falls from the top bulb to the bottom as the run goes (a static level under reduced motion) */
const GLASS="M30 14 H90 C90 56 66 72 66 90 C66 108 90 124 90 166 H30 C30 124 54 108 54 90 C54 72 30 56 30 14 Z";
function Glass(svg){
  svg.innerHTML="";const id=svg.id||"glass",cp=el("clipPath",{id:id+"-clip"},el("defs",{},svg));el("path",{d:GLASS},cp);
  el("path",{d:GLASS,class:"bulb"},svg);
  const sand=el("g",{"clip-path":`url(#${id}-clip)`},svg),top=el("rect",{class:"sand",x:20,width:80},sand),bot=el("rect",{class:"sand",x:20,width:80},sand),
        stream=el("line",{class:"stream",x1:60,x2:60,y1:88},svg);
  el("path",{d:GLASS,class:"frame"},svg);el("path",{d:"M16 8H104M16 172H104",class:"frame"},svg);el("path",{d:"M24 12V168M96 12V168",class:"frame",style:"stroke-width:3;opacity:.7"},svg);
  return {set(p,run){p=Math.max(0,Math.min(1,p));const yt=36+54*p,yb=166-52*p;
    top.setAttribute("y",yt);top.setAttribute("height",Math.max(0,90-yt));bot.setAttribute("y",yb);bot.setAttribute("height",Math.max(0,172-yb));
    const flow=!!run&&p<1;stream.setAttribute("y2",Math.min(yb,160));stream.style.display=flow?"":"none";svg.classList.toggle("run",flow&&!reduce)}};
}
const panelGlass=Glass(E.glass),coverGlass=Glass(E.coverglass);

/* ---------- the cover ---------- */
function renderBests(){$$(".cat",E.cats).forEach(b=>{const c=b.dataset.cat,best=currentBest(c);$(".pb",b).textContent=best?`Best ${fmt(best.total)} · ${best.right} of ${best.n}`:"No run yet"})}
function buildCover(){
  coverGlass.set(.4,true);
  E.cats.innerHTML="";
  Object.values(CATS).forEach(c=>{const n=routeOf(c.id).length,b=mk("button","cat",E.cats);b.type="button";b.dataset.cat=c.id;
    b.innerHTML='<span class="nm"></span><span class="ds"></span><span class="meta"></span><span class="pb"></span>';
    $(".nm",b).textContent=c.name;$(".ds",b).textContent=c.desc;$(".meta",b).textContent=`${n} trials · about ${c.mins} minutes`;
    b.addEventListener("click",()=>startRun(c.id,{timed:E.timeme.checked}))});
  E.routeprev.innerHTML="";
  SETTINGS.forEach(st=>{const d=mk("div","rs",E.routeprev);d.style.setProperty("--c",st.c);d.innerHTML="<h3></h3><ul></ul>";$("h3",d).textContent=st.chip;
    BOOKS.filter(b=>b.setting===st.id).forEach(b=>{const li=mk("li","",$("ul",d));li.innerHTML="<span></span><b></b>";li.firstChild.textContent=b.short;li.lastChild.textContent=TRIALS.filter(t=>t.book===b.id).length})});
  E.timeme.addEventListener("change",()=>{E.timehelp.textContent=E.timeme.checked?"The clock runs, each book is split, and a best time is kept.":"Practice: no clock, no splits, no best times."});
  renderBests();
}

/* ---------- views ---------- */
function prog(){const n=S.route.length||1,d=S.view==="run"?S.i+(S.chosen!==null?1:0):S.view==="finish"?n:0;E.prog.style.width=(S.view==="cover"?0:d/n*100)+"%"}
function view(v){S.view=v;document.body.dataset.view=v;E.cover.hidden=v!=="cover";E.run.hidden=v!=="run";E.finish.hidden=v!=="finish";
  if(v==="cover")E.now.textContent="Against the Sandglass";if(v==="finish")E.now.textContent="The finish";
  window.scrollTo(0,0);prog()}

/* ---------- starting a run ---------- */
function startRun(cat,o={}){
  const route=o.route||routeOf(cat);
  Object.assign(S,{cat,route,books:booksOf(route),i:o.index||0,timed:!!o.timed,deep:!!o.deep,only:!!o.only,ans:{},splits:[],acc:0,order:{},paused:false,chosen:null,result:null,pref:{cat:o.only||o.deep?(o.cat||cat):cat}});
  S.best=S.timed?currentBest(cat):null;
  E.veil.hidden=true;pauseWords(false);
  buildPanel();view("run");
  S.running=S.timed;S.t0=performance.now();
  showTrial();drawClock();
}
function buildPanel(){
  E.splits.innerHTML="";E.ticks.innerHTML="";let last=null;
  S.books.forEach(bk=>{const b=BOOK[bk.book],st=SET[b.setting];
    if(st.id!==last){last=st.id;const h=mk("li","hd",E.splits);h.style.setProperty("--c",st.c);h.textContent=st.chip}
    const r=mk("li","bk",E.splits);r.innerHTML='<span class="nm"></span><span class="sc"></span><span class="dl"></span><span class="tm"></span>';$(".nm",r).textContent=b.short;
    const t=mk("i","",E.ticks);t.style.setProperty("--c",st.c)});
  E.panel.classList.toggle("practice",!S.timed);E.strip.classList.toggle("practice",!S.timed);
  E.clockcap.textContent=S.timed?"elapsed":"practice: no clock";
}
function updatePanel(){
  const cur=TR[S.route[S.i]];
  $$("li.bk",E.splits).forEach((r,j)=>{const bk=S.books[j],ids=S.route.slice(bk.first,bk.last+1),done=ids.filter(id=>S.ans[id]),ok=done.filter(id=>S.ans[id].ok).length,bad=done.length-ok,
      closed=S.timed&&S.splits[j]!==undefined,tm=$(".tm",r),dl=$(".dl",r);
    r.classList.toggle("cur",S.view==="run"&&S.i>=bk.first&&S.i<=bk.last);
    r.classList.toggle("done",closed||(!S.timed&&done.length===ids.length));
    $(".sc",r).innerHTML=done.length?`<span class="ok">✓${ok}</span>${bad?` <span class="bad">✗${bad}</span>`:""}`:"";
    if(closed){tm.textContent=fmt(S.splits[j]);if(S.best&&S.best.splits[j]!==undefined){const d=S.splits[j]-S.best.splits[j];dl.textContent=fmtDelta(d);dl.className="dl "+(d<=0?"ahead":"behind")}}
    else{tm.textContent="";dl.textContent="";dl.className="dl"}});
  $$("i",E.ticks).forEach((t,j)=>{const bk=S.books[j],ids=S.route.slice(bk.first,bk.last+1),done=ids.filter(id=>S.ans[id]),finished=done.length===ids.length&&(S.i>bk.last||S.chosen!==null&&S.i===bk.last);
    t.classList.toggle("on",finished);t.classList.toggle("cur",S.i>=bk.first&&S.i<=bk.last&&!finished);t.classList.toggle("miss",done.some(id=>!S.ans[id].ok))});
  const n=Object.keys(S.ans).length;
  E.pcount.textContent=`${n} of ${S.route.length} answered`;E.sn.textContent=`${Math.min(S.i+1,S.route.length)} of ${S.route.length}`;
  const p=(S.i+(S.chosen!==null?1:0))/S.route.length;panelGlass.set(p,S.timed&&S.running);
}

/* ---------- the clock ---------- */
function drawClock(){
  if(S.view!=="run")return;
  const s=S.timed?fmt(elapsed()):"";E.clock.textContent=S.timed?s:"practice";E.sclock.textContent=s;
  E.clockcap.textContent=S.paused?"paused":S.timed?"elapsed":"no clock, no best";
}
setInterval(drawClock,100);
const pauseWords=on=>[E.pause,$("#pause2")].forEach(b=>b.textContent=on?"Go on":"Pause");
function pause(){if(!S.timed||!S.running||S.paused||S.view!=="run")return;S.acc+=performance.now()-S.t0;S.running=false;S.paused=true;E.veil.hidden=false;E.veil.focus({preventScroll:true});pauseWords(true);drawClock();updatePanel()}
function resume(){if(!S.paused)return;S.paused=false;E.veil.hidden=true;S.t0=performance.now();S.running=true;pauseWords(false);drawClock();updatePanel()}
const togglePause=()=>S.paused?resume():pause();

/* ---------- a trial ---------- */
function mountFigure(t){
  const f=FIGS[t.fig||t.id];E.fig.innerHTML="";E.fig.removeAttribute("style");E.figcap.innerHTML="";E.figcap.hidden=true;S.api=null;
  E.tfig.classList.toggle("none",!f);if(!f){S.X=Ctx();return}
  E.fig.setAttribute("aria-label",t.alt||"");S.X=Ctx();
  try{S.api=f(E.fig,S.X)||{}}catch(err){console.error(err);E.tfig.classList.add("none")}
}
async function tellFigure(fast){const api=S.api;if(!api||!api.tell)return;S.X.fast=!!fast;try{await api.tell()}catch(err){console.error(err)}}
function showTrial(){
  const t=TR[S.route[S.i]],b=BOOK[t.book],st=SET[b.setting];S.chosen=null;
  E.trial.style.setProperty("--c",st.c);E.kick.textContent=`${st.kick} · ${b.title}`;E.setup.textContent=t.setup;E.q.textContent=t.question;
  let ord=S.order[t.id];if(!ord){ord=t.fixed?[...t.options.keys()]:order(t.options.length);S.order[t.id]=ord}
  E.opts.innerHTML="";E.opts.classList.remove("done");
  ord.forEach((oi,k)=>{const o=mk("button","opt",E.opts);o.type="button";o.dataset.k=k;o.innerHTML=`<span class="n">${k+1}</span><span class="t"></span><span class="sr"></span><span class="m" aria-hidden="true"></span>`;
    $(".t",o).textContent=t.options[oi];o.addEventListener("click",()=>answer(k))});
  E.reveal.classList.remove("on");E.next.disabled=true;E.next.textContent=S.i===S.route.length-1?"Finish →":"Next →";
  E.now.textContent=`${st.chip} · ${S.i+1} of ${S.route.length}`;
  mountFigure(t);updatePanel();prog();
  E.trial.classList.remove("swap");void E.trial.offsetWidth;E.trial.classList.add("swap");
}
function answer(k,o={}){
  if(S.view!=="run"||S.chosen!==null||S.paused)return;
  const t=TR[S.route[S.i]],b=BOOK[t.book],ord=S.order[t.id];if(k<0||k>=ord.length)return;
  const ok=ord[k]===t.right;S.chosen=k;S.ans[t.id]={k,ok};
  E.opts.classList.add("done");
  $$(".opt",E.opts).forEach((btn,j)=>{const right=ord[j]===t.right;btn.classList.toggle("right",right);btn.classList.toggle("wrong",j===k&&!ok);
    $(".sr",btn).textContent=right?" (the right answer)":j===k?" (your answer, not right)":""});
  E.verdict.textContent=ok?"✓ Right.":"✗ Not quite.";E.verdict.className="verdict "+(ok?"ok":"bad");
  E.why.textContent=t.reveal;E.machtext.textContent=t.machine;E.booklink.href=`../${b.slug}/index.html#${t.anchor}`;
  E.reveal.classList.add("on");E.next.disabled=false;
  tellFigure(o.instant||reduce);updatePanel();prog();
  if(!o.instant){E.next.focus({preventScroll:true});
    requestAnimationFrame(()=>{const r=E.next.getBoundingClientRect();if(r.bottom>innerHeight-12)window.scrollBy({top:r.bottom-innerHeight+24,behavior:reduce?"auto":"smooth"})})}
}
function next(){
  if(S.view!=="run"||S.chosen===null||S.paused)return;
  const j=S.books.findIndex(bk=>bk.last===S.i);
  if(S.timed&&j>=0&&S.splits[j]===undefined)S.splits[j]=Math.round(elapsed());
  if(S.i+1>=S.route.length){finish();return}
  S.i++;showTrial();
  if(E.trial.getBoundingClientRect().top<60)E.trial.scrollIntoView({block:"start"});
}
function leave(){S.running=false;S.paused=false;E.veil.hidden=true;pauseWords(false);view("cover");renderBests()}

/* ---------- the finish ---------- */
function finish(){
  const total=elapsed();S.running=false;S.acc=total;updatePanel();
  const ids=S.route.filter(id=>S.ans[id]),right=ids.filter(id=>S.ans[id].ok).length,miss=ids.filter(id=>!S.ans[id].ok);
  let isBest=false;
  if(S.timed&&!S.deep&&!S.only&&S.splits.length===S.books.length){const rec={total:Math.round(total),splits:S.splits.slice(),right,n:S.route.length};isBest=better(rec,S.best);if(isBest){sessionBest[S.cat]=rec;saveBest(store(),S.cat,rec)}}
  S.result={total,right,ids,miss,isBest};view("finish");renderFinish();
}
function renderFinish(){
  const R=S.result,N=R.ids.length,timedRun=S.timed&&!S.deep&&!S.only;
  E.fkick.textContent=S.deep?"Practice":S.only?"Practice · only the misses":S.timed?CATS[S.cat].name:"Practice · "+CATS[S.cat].name;
  E.score.textContent=S.timed?`${R.right} of ${N} · ${fmt(R.total)}`:`${R.right} of ${N}`;
  E.newbest.hidden=!R.isBest;
  E.fsub.textContent=S.timed?"A miss costs no seconds: the time and the score stand side by side.":"Practice keeps no clock and no best time.";
  E.fbtns.innerHTML="";
  const btn=(label,alt,fn)=>{const b=mk("button","btn"+(alt?" alt":""),E.fbtns);b.type="button";b.textContent=label;b.addEventListener("click",fn);return b};
  const pref=S.pref.cat,other=pref==="short"?"full":"short",timeMe=E.timeme.checked;
  btn("Run again",false,()=>startRun(pref,{timed:timeMe}));
  if(R.miss.length)btn(`Run only my misses (${R.miss.length})`,true,()=>startRun(S.cat,{route:R.miss,timed:false,only:true,cat:pref}));
  btn(`The other category: ${CATS[other].name}`,true,()=>startRun(other,{timed:timeMe}));
  btn("Back to the start",true,()=>{view("cover");renderBests()});
  /* the splits */
  E.splitsec.hidden=!S.timed;E.stable.innerHTML="";
  if(S.timed){
    E.stable.innerHTML='<tr><th>Book</th><th>Right</th><th class="r opt-col">This book</th><th class="r">Split</th><th class="r">Against best</th></tr>';
    let last=null;
    S.books.forEach((bk,j)=>{const b=BOOK[bk.book],st=SET[b.setting];
      if(st.id!==last){last=st.id;const h=mk("tr","hd",E.stable);h.style.setProperty("--c",st.c);const c=mk("td","",h);c.colSpan=5;c.textContent=st.kick}
      const ids=S.route.slice(bk.first,bk.last+1),ok=ids.filter(id=>S.ans[id]&&S.ans[id].ok).length,r=mk("tr","",E.stable),segment=S.splits[j]-(j?S.splits[j-1]:0);
      r.innerHTML='<td></td><td></td><td class="r opt-col"></td><td class="r"></td><td class="r"></td>';const td=r.children;
      td[0].textContent=b.title;td[1].textContent=`${ok} of ${ids.length}`;td[2].textContent=fmt(segment);td[3].textContent=fmt(S.splits[j]);
      if(S.best&&S.best.splits[j]!==undefined){const d=S.splits[j]-S.best.splits[j];td[4].textContent=fmtDelta(d);td[4].className="r "+(d<=0?"ahead":"behind")}});
    const tr=mk("tr","",E.stable);tr.innerHTML='<td><b>Total</b></td><td></td><td class="opt-col"></td><td class="r"></td><td class="r"></td>';
    tr.children[1].textContent=`${R.right} of ${N}`;tr.children[3].textContent=fmt(R.total);
    if(S.best){const d=R.total-S.best.total;tr.children[4].textContent=fmtDelta(d);tr.children[4].className="r "+(d<=0?"ahead":"behind")}
  }
  /* the route: what each setup taught */
  E.routelist.innerHTML="";
  SETTINGS.forEach(st=>{const ids=R.ids.filter(id=>SET[BOOK[TR[id].book].setting]===st);if(!ids.length)return;
    const g=mk("div","rg",E.routelist);g.style.setProperty("--c",st.c);mk("h3","",g).textContent=st.kick;
    ids.forEach(id=>{const t=TR[id],b=BOOK[t.book],a=S.ans[id],r=mk("div","rrow"+(a.ok?"":" miss"),g);
      r.innerHTML='<span class="mk"></span><span><span class="bn"></span><span class="tk"></span></span><a rel="noopener">Read it ↗</a>';
      const mkEl=$(".mk",r);mkEl.textContent=a.ok?"✓":"✗";mkEl.classList.add(a.ok?"ok":"bad");mkEl.setAttribute("aria-label",a.ok?"right":"missed");
      $(".bn",r).textContent=b.title+" · "+t.short;$(".tk",r).textContent=t.takeaway;$("a",r).href=`../${b.slug}/index.html#${t.anchor}`})});
  E.booklinks.innerHTML="";
  BOOKS.forEach(b=>{const a=mk("a","",E.booklinks);a.href=`../${b.slug}/index.html`;a.textContent=b.title});
}

/* ---------- keys, pause, links ---------- */
document.addEventListener("keydown",e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||S.view!=="run")return;
  if(e.key==="Escape"){e.preventDefault();togglePause();return}
  if(S.paused){if((e.key==="Enter"||e.key===" ")&&e.target===E.veil){e.preventDefault();resume()}return}
  if(/^[1-9]$/.test(e.key)&&S.chosen===null){if(!e.target.closest("input,textarea,select")){e.preventDefault();answer(+e.key-1)}return}
  if(S.chosen!==null&&(e.key==="ArrowRight"||((e.key==="Enter"||e.key===" ")&&!e.target.closest("button,a,summary,input,[role=button]")))){e.preventDefault();next()}
});
E.next.addEventListener("click",next);
E.veil.addEventListener("click",resume);
E.leave.addEventListener("click",leave);E.pause.addEventListener("click",togglePause);
$("#leave2").addEventListener("click",leave);$("#pause2").addEventListener("click",togglePause);
document.addEventListener("visibilitychange",()=>{if(document.hidden)pause()});
narrow.addEventListener("change",()=>{if(S.view==="run"){mountFigure(TR[S.route[S.i]]);if(S.chosen!==null)tellFigure(true)}});
/* a link like #t=ko-share opens that trial alone in practice mode and goes on through the full route; &tell opens it answered, &miss answered wrongly */
function hashOpts(){const o={};location.hash.replace(/^#/,"").split("&").forEach(p=>{const [k,v]=p.split("=");if(k)o[k]=v===undefined?true:decodeURIComponent(v)});return o}
function deepStart(){
  const o=hashOpts(),t=TR[o.t];if(!t)return false;
  const route=routeOf("full");startRun("full",{route,index:route.indexOf(t.id),timed:false,deep:true});
  if(o.tell||o.miss){const ord=S.order[t.id];answer(o.miss?ord.findIndex(oi=>oi!==t.right):ord.findIndex(oi=>oi===t.right),{instant:true})}
  return true;
}
addEventListener("hashchange",deepStart);
buildCover();view("cover");deepStart();
})();
