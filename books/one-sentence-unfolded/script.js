"use strict";
(function(){

/* ================================================================ the tree
   To check the tree:  node -e 'console.log(require("./books/one-sentence-unfolded/script.js").checkTree())'
   (an empty list is a sound tree; the page runs the same check on load and reports in the console).
   To add a setting, such as the scholars' coast: give it a level 1 node with its accent and a kick, name it in a phrase of
   the root's two texts, then add its books at level 2 (book, title), their ideas at level 3 (ref), and the REF entries.
   One entry for each phrase that opens. The two registers are the same tree node for node:
     i  the islands' words        m  the machine room's words
   [phrase]{id} is a phrase that opens the node id, and the same ids stand in the same order in both texts.
   ^{KEY} is the series' superscript * link to the spread of the book that KEY (below) names.
   lvl     0 the sentence, 1 a setting, the shared ways or the limits, 2 a book or a shared way, 3 an idea, 4 a detail
   book    the book's slug and title (a book node); ref  the idea's spread (an idea node)
   accent  the setting's colour; a node without one takes its parent's
   kick    a small label above a setting's paragraph (a book node's label is its title) */
const NODES={

root:{lvl:0,
 i:"On two islands, [three trading houses]{ring}, [four mercenaries]{foot}, [four bandits]{crown} and [two councils]{paxos} each find [a way to act as one]{ways}, and each meets [a limit]{limits}.",
 m:"Machines that share no clock and may crash, lose messages or lie can [order and record what happens]{ring}, [agree despite crashes and delays]{foot}, [agree despite liars]{crown} and [keep one log while machines come and go]{paxos}, using [a few ideas over and over]{ways}, each within [a limit]{limits}."},

/* ---------------------------------------------------------------- level 1: the settings, the shared ways, the limits */
ring:{lvl:1,accent:"#b5602c",kick:"Arche · the ring road",
 i:"Three trading houses stand round the coast of Arche with a mountain between them. Word passes only on slips carried along the one road, where nothing overtakes and every slip arrives in the end, and in the trading season nobody can read the hour. The houses [put their entries in an order]{owc}, [fill requests as one steward with one board would]{mc}, and [take stock while their carts are on the road]{ts}.",
 m:"A few machines with no shared clock exchange messages over channels that deliver every message, in order, after any delay. They can [order events by cause and effect]{owc}, [make copies of one object behave as a single copy]{mc}, and [record a global state without stopping]{ts}."},

foot:{lvl:1,accent:"#5f6e28",kick:"Arche · the foot of Mount Phyle",
 i:"Four mercenaries camp at the foot of Mount Phyle, out of sight of one another, and must all attack or all hold. They send word only by raven and never lie, but a man may be killed, and a dead man's tent falls silent. They find [no plan sure to finish when no raven has a longest flight]{loa}. They can agree [once a wind drops]{rl}, [by tossing coins]{bc} or [with slates of the dead]{ds}. [When hawks take birds]{co}, they must choose what to give up.",
 m:"A few processes must decide one of two values, exchanging messages with no bound on delay, while one may crash without a word. Then [no deterministic protocol is sure to terminate]{loa}; consensus becomes possible [once delays settle]{rl}, [with random coins]{bc} or [with failure detectors]{ds}; and [when the network can partition]{co}, a replicated service must give up consistency or availability."},

crown:{lvl:1,accent:"#7a4fa0",kick:"Arche · the crown of Mount Phyle",
 i:"Four bandits hold the crown of the same hill, the chief inside a ring wall with no gate and the others at posts on the slopes, none in sight of another, sending word only by rat. Nobody dies, but some may lie, and nobody ever learns who. They [agree on hold or scatter]{al}, [keep one loot scroll in order]{ko}, and [pass the registrar's job at every entry]{cl}.",
 m:"A few machines, any of which may be faulty in any way, can tell one peer one thing and another something else. They can still [reach agreement]{al}, [replicate a log in one order]{ko}, and [replace the leader at every step, cheaply]{cl}."},

paxos:{lvl:1,accent:"#136f9e",kick:"Paxos",
 i:"Across the sea on Paxos, two councils keep a law while their members come and go, and nobody lies. In [the Parliament in the Chamber]{ptp}, legislators pass numbered decrees by ballot and write them in indelible ink. In [the council of Schedia in the Tholos]{olat}, one legislator at a time holds the podium and the law is kept in wax.",
 m:"Two replicated services keep a log while machines crash, recover and lose messages, and none lies. [Paxos]{ptp} lets any machine propose and writes every vote to lasting storage. [Viewstamped Replication]{olat} has one primary order everything and keeps state in memory."},

ways:{lvl:1,accent:"#1c1512",kick:"What the settings share",
 i:"The ways keep coming back from one setting to the next: [a rising number, with a name to break ties]{w.number}; [any two majorities share a member]{w.overlap}; [the same entries in the same order]{w.order}; [one in charge, for speed and never for safety]{w.one}; and [stopped, never wrong]{w.stopped}.",
 m:"The same few ideas recur: [logical timestamps with an id to break ties]{w.number}; [quorum intersection]{w.overlap}; [state machine replication]{w.order}; [a leader for liveness, never for safety]{w.one}; and [safety always, liveness only once things settle]{w.stopped}."},

limits:{lvl:1,accent:"#bf4a26",kick:"Where each one stops",
 i:"Nearly every limit rests on [two nights that look the same]{l.nights} from one place yet call for different answers. Nothing built from slips sees a goatherd's news^{OWC.7}; the count describes a morning that may never have been^{TS.6}; no plan is sure to finish while a dead man looks like a slow bird^{LoA.5}; the wind, the coins and slates right only in the end all need more than half alive^{RL.6}^{BC.6}^{DS.6}; a cut-off tent cannot answer every man as one^{CO.2}; plain slips need more than three men for each liar^{AL.4}; nothing stands on the crown while the wind blows^{KO.1}; rival presidents can stall the Parliament^{PTP.5}; and too many going home at once can stop Schedia for good^{OLAT.7}.",
 m:"Most impossibility results rest on [two executions that look the same]{l.nights} to some process. Logical clocks miss causality outside the system^{OWC.7}; a snapshot may be a state that never occurred^{TS.6}; deterministic asynchronous consensus cannot be sure to terminate^{LoA.5}; partial synchrony, randomization and eventually accurate detectors each need a correct majority^{RL.6}^{BC.6}^{DS.6}; a partitioned service cannot be both consistent and available^{CO.2}; Byzantine agreement without signatures needs 3f + 1^{AL.4}; nothing commits before the network settles^{KO.1}; duelling proposers can stall Paxos^{PTP.5}; and in-memory replication can stop for good if a majority crash at once^{OLAT.7}."},

/* ---------------------------------------------------------------- level 2: the shared ways and the two nights */
"w.number":{lvl:2,
 i:"The tally orders entries and the lower house breaks ties^{OWC.4}; each ballot number belongs to one priest^{PTP.3}; a board is a count and a name^{OLAT.3}. At the foot the count of glasses fixes each turn's owner by tent number^{RL.3}^{DS.5}, and on the crown the registrar's job passes in number order^{KO.2}.",
 m:"Lamport timestamps break ties by process id^{OWC.4}; each Paxos ballot number belongs to one proposer^{PTP.3}; a view is numbered by a count and the id of whoever raised it^{OLAT.3}. Rotating coordinators take turns by process number^{RL.3}^{DS.5}, and in PBFT the primary of each view is fixed by the view number^{KO.2}."},

"w.overlap":{lvl:2,
 i:"Two majorities share a member in the Chamber's ballots^{PTP.2} and the Tholos's change of holder^{OLAT.4}, and at the foot three reports out of four^{BC.3}, an owner's three estimates^{DS.5} and two pledges against three^{RL.4} overlap likewise. On the crown the shared bandit must be honest^{KO.4}, so one liar takes four.",
 m:"Quorum intersection: any two majorities share a machine^{PTP.2}^{OLAT.4}, and three of four reports^{BC.3}, a coordinator's n − f estimates^{DS.5} and f + 1 locks against n − f needed^{RL.4} overlap likewise. With Byzantine faults the quorums must meet in a correct replica^{KO.4}, so n ≥ 3f + 1."},

"w.order":{lvl:2,
 i:"Every house sorts by precedence and gets the same list^{OWC.4}; the Parliament runs a Synod for every number^{PTP.6}; the holder at the Tholos numbers every line and the runners skip none^{OLAT.1}; and the registrar numbers every entry of the loot scroll^{KO.3}.",
 m:"State machine replication: deterministic copies fed the same commands in the same order stay the same. Timestamp order^{OWC.4}, Multi-Paxos slots^{PTP.6}, a primary's numbering of operations^{OLAT.1} and PBFT's sequence numbers^{KO.3} supply that order."},

"w.one":{lvl:2,
 i:"Two presidents only slow the Parliament^{PTP.5}, and a holder who missed a change writes lines but passes none^{OLAT.6}. A stalled registrar is replaced without judging anyone^{KO.5}; the muster-master's note alone counts, at the price of silence when cut off^{CO.3}; at the foot a turn's owner is no leader at all^{RL.3}.",
 m:"Leaders give liveness, and safety holds with none, one or two. Duelling proposers only slow Paxos^{PTP.5}, and a cut-off primary commits nothing^{OLAT.6}. A faulty primary is replaced by a view change^{KO.5}, a single primary trades availability for consistency^{CO.3}, and a rotating coordinator is no standing leader^{RL.3}."},

"w.stopped":{lvl:2,
 i:"Nobody commits wrongly in the endless night^{LoA.5} or any wind^{RL.4}; coins delay but never divide^{BC.3}; bad slates never give two answers^{DS.7}; on the crown nothing stands in the wind, and nothing wrong^{KO.6}. Blank scrolls never disagree^{PTP.1}; wax can stop the council for good but never goes on without a passed law^{OLAT.7}.",
 m:"Safety holds where termination cannot be guaranteed^{LoA.5} and under any delays^{RL.4}; randomization delays but never divides^{BC.3}; even useless failure detectors never break agreement^{DS.7}; PBFT commits nothing until delays stop growing, and nothing wrong^{KO.6}. Empty logs never disagree^{PTP.1}, and VR can stop for good but never continues without a committed operation^{OLAT.7}."},

"l.nights":{lvl:2,
 i:"Two nights look the same from one place yet call for different answers: a dead man or a slow bird^{LoA.2}, a lying chief or a lying peer^{AL.3}, a night when Number 2 moved the plan or when nobody did^{CO.2}, and two pairs each as good as dead to the other^{RL.6}^{DS.6}.",
 m:"If two executions look the same to a process, it must act the same in both: a crashed process or a slow one^{LoA.2}, a lying commander or a lying peer^{AL.3}, a partitioned node after a write or after none^{CO.2}, and two halves each indistinguishable from a crash of the other^{RL.6}^{DS.6}."},

/* ---------------------------------------------------------------- level 2: the books of the ring road */
owc:{lvl:2,book:"ordering-without-clocks",title:"Ordering Without Clocks",
 i:"Neither arrival at a gate nor water-clocks that were never set together can say which of two requests was placed first, so the houses ask what could have led to what. [A tally on every slip]{owc.tally} puts every cause before its effect; [the rule of precedence]{owc.prec} makes one sequence every house computes alike; [a column of counts]{owc.col} tells related entries from unrelated ones; and [nothing built from slips]{owc.goat} sees news a goatherd carries over the mountain.",
 m:"Arrival order and unsynchronised clocks cannot say which of two events came first, so Lamport (1978) orders events by happened-before. [A logical clock]{owc.tally} gives every cause a smaller timestamp; [ties broken by process id]{owc.prec} give a total order every machine computes alike; [vector clocks]{owc.col}, from Fidge and Mattern (1988), detect concurrency exactly; and [none of them]{owc.goat} sees causality that travels outside the messages."},

mc:{lvl:2,book:"many-copies-acting-as-one",title:"Many Copies, Acting as One",
 i:"The rule of the board asks that everything served could have come from one steward with one board, [each request taking effect at a moment inside its span]{mc.span}. Then [business finished first comes first]{mc.first}, [however many copies stand behind the gates]{mc.copies}; [each board can be judged alone]{mc.local}; [the rule never makes a request wait]{mc.wait}, even on [a busy board nobody can pause]{mc.busy}; and [nobody on Arche can check it]{mc.check}.",
 m:"Herlihy and Wing's linearizability (1990): [every operation appears to take effect at one instant between its call and its answer]{mc.span}, so [real-time order is kept]{mc.first} and [a replicated object cannot be told from one copy]{mc.copies}. It is [local]{mc.local} and [nonblocking]{mc.wait}, it can be proved for [a queue no one can pause]{mc.busy}, and [it is a safety property that needs real time to check]{mc.check}."},

ts:{lvl:2,book:"taking-stock-without-stopping",title:"Taking Stock Without Stopping",
 i:"Counting one house after another is [wrong by whatever was on the road]{ts.twice}, and stopping the road would cost the island its food. [Each house sends a messenger in a red sash down every road]{ts.sash} the moment it records its storehouse, and writes down what comes in until each road's sash arrives. The total describes [a morning the island could have lived]{ts.morning}, which is enough for [any question whose answer, once true, stays true]{ts.settled}.",
 m:"Reading machines one by one [is wrong by whatever is in transit]{ts.twice}. In Chandy and Lamport's algorithm (1985), [each machine records its state and sends a marker on every channel]{ts.sash}, recording as a channel's state what arrives before its marker. The result is [a consistent state the system may never have passed through]{ts.morning}, which decides [every stable property]{ts.settled}."},

/* ---------------------------------------------------------------- level 2: the books of the foot */
loa:{lvl:2,book:"the-limits-of-agreement",title:"The Limits of Agreement",
 i:"With nobody lying and every raven arriving in the end, the four still cannot be sure that anybody ever commits, by any plan that draws no lots. [A dead man looks exactly like a slow bird]{loa.slow}; [some dusks leave the night open]{loa.open}; and [the raven that would settle it can always be held back]{loa.hold}. Nobody ever commits wrongly, and [three changes to the night]{loa.ways} would let them decide.",
 m:"Fischer, Lynch and Paterson (1985): with asynchronous messages and one possible crash, no deterministic consensus protocol is guaranteed to terminate. [A crashed process looks like a slow one]{loa.slow}; [some initial configuration is bivalent]{loa.open}; and [any step can be delayed to keep the run bivalent]{loa.hold}. Safety never fails, and [three changes to the model]{loa.ways} make consensus solvable."},

rl:{lvl:2,book:"agreeing-when-messages-run-late",title:"Agreeing When Messages Run Late",
 i:"While a wind blows a raven may sit in the pines for any time, but the wind always drops in the end, though nobody sees it drop. [Sandglasses started together]{rl.glass} give every tent one count; [turns and pledges]{rl.turns} keep any two men from committing differently [in any wind]{rl.never}; every living man [commits once it has dropped]{rl.commit}; and [more than half must live]{rl.half}.",
 m:"Dwork, Lynch and Stockmeyer (1988): delays are unbounded until an unknown moment and bounded after it. [Rounds]{rl.glass} and [phases with a rotating coordinator and locks]{rl.turns} give [safety under any delays]{rl.never} and [termination soon after the network settles]{rl.commit}, provided [more than half the machines are correct]{rl.half}."},

bc:{lvl:2,book:"agreeing-by-chance",title:"Agreeing by Chance",
 i:"A man who cannot settle on an answer tosses an Attic coin alone in the tent, the owl for hold and the goddess for attack. [Rounds of birds]{bc.rounds} decide when a man may be sure; [the coins can delay but never divide]{bc.never}; [every living man commits with probability one]{bc.prob}, by no round anyone can name; and [the coin takes from the arranger of the birds]{bc.arranger} the one thing the impossibility needed.",
 m:"Ben-Or (1983): a process that cannot decide flips a private coin. [Two-phase rounds that wait for n − f messages]{bc.rounds} keep [agreement whatever the coins]{bc.never}; [termination has probability one]{bc.prob}, with no bound on the rounds, because [the scheduler cannot foresee a flip]{bc.arranger}."},

ds:{lvl:2,book:"telling-the-dead-from-the-slow",title:"Telling the Dead from the Slow",
 i:"Each tent keeps a slate, chalking the tents thought dead and rubbing marks out on second thoughts, wrong as often as it likes, so long as it [in the end chalks the dead and spares some living man]{ds.kinds}. [One man never chalked]{ds.strong} lets the four agree however many die; [one spared only in the end]{ds.eventual} does so while more than half live; and the slates are [granted, not earned]{ds.granted}.",
 m:"Chandra and Toueg (1996): each process has a failure detector that may suspect wrongly, judged by [completeness and accuracy]{ds.kinds}. [A strong detector]{ds.strong} gives consensus despite any number of crashes; [an eventually strong one]{ds.eventual} gives it with a correct majority; and [detectors stand for timing assumptions]{ds.granted} rather than remove them."},

co:{lvl:2,book:"answering-while-cut-off",title:"Answering While Cut Off",
 i:"With no wind a raven arrives within a known flight, but a hawk may take any bird unseen. The four want [answers as one, and every man answered]{co.debts}, and [a cut-off tent cannot have both]{co.cut}. [A muster-master]{co.muster} keeps every answer as one, at the price of silence when cut off; [waiting a glass]{co.glass} gives up answering as one only while birds are lost; and [in a wind]{co.wind} even that fails.",
 m:"Brewer (2000), and Gilbert and Lynch (2002): a service wants [consistency and availability]{co.debts} despite partitions, and [cannot have both]{co.cut}. [A single primary]{co.muster} keeps consistency and loses availability when cut off; [timeouts under bounded delays]{co.glass} lose consistency only while messages are actually lost; [with unbounded delays]{co.wind}, not even then."},

/* ---------------------------------------------------------------- level 2: the books of the crown */
al:{lvl:2,book:"agreeing-among-liars",title:"Agreeing Among Liars",
 i:"On the crown's first night the rats run short and sure, so [silence within a round means something]{al.rats}. With plain slips [three men cannot bear one liar]{al.three}, and [each liar costs three more men]{al.cost}; under [seal rings]{al.seals} any number of liars is borne; and [the worse trouble]{al.halves} is the missing clock at the foot of the hill.",
 m:"Lamport, Shostak and Pease (1982), over [synchronous channels with known senders]{al.rats}: [three generals cannot tolerate one traitor]{al.three}; oral messages need [more than 3f generals]{al.cost}; [signed messages]{al.seals} work for any number of traitors; and [without synchrony, even crash faults defeat agreement]{al.halves}."},

ko:{lvl:2,book:"keeping-order-among-liars",title:"Keeping Order Among Liars",
 i:"On windy nights the four keep a copy of the loot scroll at each post, and [numbering is a job]{ko.job} anyone may hold, the liar included. [Two echoes]{ko.echoes} make an entry stand on three matching seals out of four, because [any two threes share an honest bandit]{ko.share}; [a stalled job passes]{ko.change} with nothing that stood dropped; and [the doubling sandglass]{ko.glass} lets entries stand once the wind drops.",
 m:"Castro and Liskov (1999): [the primary of each view orders requests]{ko.job}; [three phases]{ko.echoes} commit each on 2f + 1 matching messages, since [two such quorums share an honest replica]{ko.share}; [a view change]{ko.change} keeps committed requests; and [doubling timeouts]{ko.glass} give liveness once delays stop growing."},

cl:{lvl:2,book:"changing-leaders-among-liars",title:"Changing Leaders Among Liars",
 i:"Every man writing to every man made each stage costly and each change of registrar costlier. Now [votes go to the registrar alone]{cl.votes}, who ties three into a bundle for everyone; [three stages and a lock]{cl.lock} keep the scroll safe; [a third stage keeps every lock in sight]{cl.hidden}, so a new registrar goes at the rats' pace; and [the stages run on top of one another]{cl.chain}, so the job passes at every entry.",
 m:"Yin, Malkhi, Reiter, Gueta and Abraham (2019), HotStuff: [votes go to the leader and come back as one certificate]{cl.votes}; [three phases with a lock]{cl.lock} keep safety; [the third phase makes leader change responsive]{cl.hidden}; and [chaining pipelines the phases]{cl.chain}, rotating the leader every block."},

/* ---------------------------------------------------------------- level 2: the two councils of Paxos */
ptp:{lvl:2,book:"the-part-time-parliament",title:"The Part-Time Parliament",
 i:"The Parliament must never let two scrolls disagree, and must pass decrees whenever a majority stays long enough. [Any two majorities share a member]{ptp.maj}; [three rules of the ballot]{ptp.rules} carry every passed decree into every later ballot; [one president]{ptp.pres} keeps ballots from dooming one another; and [one Synod for every number]{ptp.synod} makes each new decree one ask, one vote and one announcement.",
 m:"Lamport's Paxos (1998, 2001) never lets logs disagree, and makes progress whenever a majority is steady. [Any two majorities intersect]{ptp.maj}; [unique ballots, majority quorums and the binding of the highest reported vote]{ptp.rules} make it safe; [a single leader]{ptp.pres} makes it live; and [one prepare phase for every open slot]{ptp.synod} leaves one round trip per command."},

olat:{lvl:2,accent:"#c8961c",book:"one-leader-at-a-time",title:"One Leader at a Time",
 i:"One legislator at a time holds the podium and writes every line. [A line passes once three hold it]{olat.pass}; [board and line]{olat.board} say which copy is later; [a new holder]{olat.takes} takes the podium from a majority's answers, losing no passed line, with care [when tablets were lost]{olat.lost}; [a holder on the porch]{olat.porch} can write lines but pass none; and with [wax, not ink]{olat.wax}, too many going home at once can stop the council for good.",
 m:"Oki and Liskov (1988): [a primary commits an operation once a majority hold it]{olat.pass}; [viewstamps]{olat.board} order copies view first; [a view change]{olat.takes} collects a majority of viewstamps, with [extra conditions when crashes lose state]{olat.lost}; [a cut-off primary]{olat.porch} commits nothing; and [state kept in memory]{olat.wax} means a majority crashing at once can stop the group."},

/* ---------------------------------------------------------------- level 3 and 4: the ideas of Ordering Without Clocks */
"owc.tally":{lvl:3,ref:"OWC.3",
 i:"Each house keeps a rising tally: every entry raises it, every slip carries it, and a receiver jumps past it. So a cause carries a smaller tally than its effect, though a smaller tally proves no chain.",
 m:"Every event increments a local counter, every message carries it, and a receiver sets its clock past the one it received. So if one event happened before another, its timestamp is smaller, though a smaller timestamp proves no causal link."},
"owc.prec":{lvl:3,ref:"OWC.4",
 i:"Every house sorts entries by the rule of precedence: smaller tally first, and on a tie the lower house number. No effect comes before its cause. The same rule lets houses [share a storehouse with no gatekeeper]{owc.store}.",
 m:"Ordering by timestamp, then by process number, gives a total order that every machine computes alike and that respects cause and effect. The same order lets machines [achieve mutual exclusion with no coordinator]{owc.store}."},
"owc.store":{lvl:4,ref:"OWC.5",
 i:"Each house sends out its request, keeps a waiting list in precedence and answers every request. It enters when first on its list and every other house has sent a higher tally, then sends a release.",
 m:"Each machine broadcasts a request, queues requests in timestamp order and acknowledges every one. It enters when its request heads its queue and a later timestamp has come from every other machine, then sends a release."},
"owc.col":{lvl:3,ref:"OWC.6",
 i:"Every slip carries the sender's column, one count for each house; the receiver keeps the larger of each row. An entry came first exactly when its column is nowhere larger; if each is larger somewhere, they are unrelated.",
 m:"Each machine keeps a vector of counters, sends it on every message and merges by taking the larger of each entry. One event happened before another exactly when its vector is no larger anywhere; otherwise they are concurrent."},
"owc.goat":{lvl:3,ref:"OWC.7",
 i:"A goatherd carries news no slip records, so a request caused by a sale can carry the smaller tally. Neither tally nor column sees that path; only clocks kept in step with the sun could.",
 m:"Logical and vector clocks see only the messages inside the system. A cause that travels outside it can leave its effect with the smaller timestamp. Matching such causes needs physical clocks kept closely in step."},

/* ---------------------------------------------------------------- level 3: Many Copies, Acting as One */
"mc.span":{lvl:3,ref:"MC.2",
 i:"Every piece of business has a span, and one came before another when it was over before the other began. Requests that overlap may be served either way round; requests one after the other may not.",
 m:"Each operation has an interval from call to answer, and one precedes another if it returns before the other is called. Overlapping operations may take effect in either order; operations ordered in real time keep that order."},
"mc.first":{lvl:3,ref:"MC.4",
 i:"After a goatherd's news^{OWC.7}, serving by tally can put House 2 before House 1, whose request was over before House 2 asked. The tallies' first and the sun's first differ; one board at House 3's gate, serving in order of entry, keeps the rule.",
 m:"Logical timestamps can put a later request first when its cause travelled outside the messages^{OWC.7}. Causal order and real-time order differ; a single server that applies operations in arrival order is linearizable."},
"mc.copies":{lvl:3,ref:"MC.5",
 i:"The rule speaks only of sendings, confirmations and servings at the gates. No house, comparing notes with every other and with anyone who watched the sun, could tell one board from three copies held in step by slips.",
 m:"Linearizability is judged only by calls and answers, so a replicated object that keeps it cannot be told from a single copy."},
"mc.local":{lvl:3,ref:"MC.6",
 i:"The business keeps the rule exactly when each board does alone, because the sun never contradicts itself. Under the looser rule, which ignores the sun, each board can pass alone while the two fail together.",
 m:"A system of objects is linearizable exactly when each object is. Sequential consistency is not local: two objects can each satisfy it while the system together does not."},
"mc.wait":{lvl:3,ref:"MC.7",
 i:"A waiting request can always be entered with the rule kept, so no request waits on anyone else's business. Promises about several things done as one can force a house to undo its business.",
 m:"A pending total operation can always complete with the specification still met, so no operation waits on another. Promises about whole transactions can force aborts."},
"mc.busy":{lvl:3,ref:"MC.8",
 i:"With many clerks and loaders at once, House 3's board has no moment when a request joined it. It keeps the rule because every sequence it could stand for is one the business so far could have produced.",
 m:"A queue no one can pause has no fixed linearization point. It is proved linearizable by tracking its possible linearizations at every moment: each must be consistent with the operations so far."},
"mc.check":{lvl:3,ref:"MC.9",
 i:"Nobody on Arche can check the rule, since it is judged by the sun. That every request is served in the end is a separate promise. The tallies keep a different promise^{OWC.3}, fairness between requests that overlap.",
 m:"Linearizability is judged by real time, so a system is trusted only because its design is proved to keep it. It forbids bad outcomes but promises no termination. Logical clocks keep a different promise^{OWC.3}: fairness between overlapping operations."},

/* ---------------------------------------------------------------- level 3: Taking Stock Without Stopping */
"ts.twice":{lvl:3,ref:"TS.1",
 i:"A cart sent from a counted house to an uncounted one is counted twice, and one sent the other way by nobody. Even a stopped road needs a last messenger down every road, meaning nothing behind me.",
 m:"Reading machines one after another gives a total wrong by whatever moved between the readings, and no machine's record shows it. Even a halting snapshot needs a marker per channel; markers alone suffice without halting."},
"ts.sash":{lvl:3,ref:"TS.4",
 i:"Nine places are counted: three storehouses and six tracks. A house that takes in a sash before recording records at once and writes that this road holds nothing. It works because nothing overtakes and every sash arrives.",
 m:"A global state is every process's state plus the messages in transit on every channel. A process that receives a marker before recording records its state and marks that channel empty. Channels must be reliable and in order."},
"ts.morning":{lvl:3,ref:"TS.6",
 i:"The total can show House 1 still holding jars it sold while House 2's barley is already milled, a morning nobody lived. Yet it lies on a lawful path, reordering only events no chain of messengers joins.",
 m:"The snapshot is a consistent global state reachable from the initial state, from which the final state is reachable, though the system may never have passed through it."},
"ts.settled":{lvl:3,ref:"TS.7",
 i:"Questions whose answer, once true, stays true can be settled from the count: everything delivered, a standstill, a deficit. On a day with no buying or selling, a shortfall against the account scrolls is what the bandits took.",
 m:"Snapshots detect stable properties, which stay true once true, such as termination and deadlock. The total cannot speak for any one moment."},

/* ---------------------------------------------------------------- level 3: The Limits of Agreement */
"loa.slow":{lvl:3,ref:"LoA.2",
 i:"After any wait, an empty perch fits a dead comrade and a bird roosting in a pine. Waiting for all four could last for ever, so any working plan commits having heard from at most three tents.",
 m:"In an asynchronous system a crashed process cannot be told from a slow one. A protocol that waits for every process may wait for ever, so it must proceed after hearing from all but one."},
"loa.open":{lvl:3,ref:"LoA.3",
 i:"Line the dusks from all-hold to all-attack. If every dusk were fated, two neighbours differing in one man's sighting would differ in fate, yet with that man silent the other three cannot tell them apart. So some dusk is open.",
 m:"Validity fixes all-0 inputs to 0 and all-1 inputs to 1, so two neighbouring inputs differing in one process would decide differently, yet the others cannot tell them apart if it crashes. So some initial configuration is bivalent."},
"loa.hold":{lvl:3,ref:"LoA.4",
 i:"From an open night, the raven that would settle it can be held back while others land, and the night stays open. Used again and again, this builds a fair night in which nobody ever commits.",
 m:"From a bivalent configuration any event can be delayed so that taking it leads to another bivalent configuration. Repeated, this gives an admissible run in which no process decides; safety never fails."},
"loa.ways":{lvl:3,ref:"LoA.6",
 i:"A longest flight; an imperfect report of who has died^{DS.1}, which in the end names every dead man and spares one living man, while a majority lives; or every death before dusk. The hill allows none.",
 m:"Bounded message delays; a failure detector^{DS.1} that eventually suspects every crashed process and eventually trusts some correct one, with a majority correct; or crashes only at the start. Each makes consensus solvable."},

/* ---------------------------------------------------------------- level 3: Agreeing When Messages Run Late */
"rl.glass":{lvl:3,ref:"RL.2",
 i:"All four started a sandglass at the last light, so they count glasses alike. A strip is written with its glass, and one taken in during a later glass counts for nothing: every glass stands alone.",
 m:"Rounds over a partially synchronous network: each message carries its round number, and a message from an earlier round is discarded, so every round stands alone."},
"rl.turns":{lvl:3,ref:"RL.3",
 i:"Four glasses make a turn, owned by one tent in number order. The owner calls only an answer three men can accept; each who can ties a pledge to it, and two pledged let the owner commit.",
 m:"Phases of four rounds with a rotating coordinator. The coordinator proposes only a value that n − f processes find acceptable; each that accepts locks it with the phase number, and f + 1 acknowledgments let it decide."},
"rl.never":{lvl:3,ref:"RL.4",
 i:"Among four, two pledges that cannot be untied leave too few men to accept the other answer, which needs three. Counting alone keeps any two men from committing differently, however long the wind blows.",
 m:"Once f + 1 processes hold a lock on a value, too few remain to accept another, however late messages are. Counting alone gives safety under any delays; only termination needs the network to settle."},
"rl.commit":{lvl:3,ref:"RL.5",
 i:"A man who commits sends parting birds, and whoever takes one in sends a set and commits. Once the wind drops every living man commits, within twenty glasses if nobody had yet, counted from a moment nobody sees.",
 m:"A process that decides broadcasts its decision, and any process that receives one decides too. After the unknown stabilization time every correct process decides, within a bounded number of rounds if none had decided before."},
"rl.half":{lvl:3,ref:"RL.6",
 i:"If two of the four may die, each pair must commit as if the other were dead, and the pairs can differ: more than half must live. Each liar needs more than three men, and seals change nothing.",
 m:"Under partial synchrony consensus needs n ≥ 2f + 1 for crashes: if two of four may crash, each pair must decide as if the other had. Byzantine faults need n ≥ 3f + 1, signatures or not."},

/* ---------------------------------------------------------------- level 3: Agreeing by Chance */
"bc.rounds":{lvl:3,ref:"BC.2",
 i:"Each round a man reports the answer favoured and waits for three reports. Three alike earn a second bird sure of that answer; otherwise it says unsure. One sure second bird means favour it; two mean settled; none, toss.",
 m:"Two-phase rounds wait for n − f messages. A majority of reports for a value makes a process propose it, otherwise it proposes nothing. f + 1 proposals decide, one sets the preference, none means flip a coin."},
"bc.never":{lvl:3,ref:"BC.3",
 i:"Three reports of hold and three of attack, out of four, would share a man, so every sure bird in a round names the same answer. Once one man is settled, every man favours that answer.",
 m:"Two majorities of reports would intersect, so all proposals in a round name one value, and once one process decides every process prefers it. Agreement and validity hold whatever the coins and the delays."},
"bc.prob":{lvl:3,ref:"BC.4",
 i:"Courses on which the tosses split for ever still exist, yet together they have no chance at all, so every man not killed commits with probability one. More than half must still live, coins or none.",
 m:"Runs in which the coins split for ever exist but have probability zero, so termination has probability one, with no bound on the rounds. Crashes still need n > 2f; Byzantine faults need n > 5f."},
"bc.arranger":{lvl:3,ref:"BC.5",
 i:"The impossibility rested on the four being unable to draw lots. Give each man a fair, fresh, unforeseen coin, tossed alone. At a toss the night forks, and the arranger of the birds cannot steer both forks.",
 m:"Randomization removes the determinism FLP assumes, and only that. The adversary scheduler cannot predict a coin flip, so it cannot keep the system undecided for ever."},

/* ---------------------------------------------------------------- level 3: Telling the Dead from the Slow */
"ds.kinds":{lvl:3,ref:"DS.2",
 i:"Two things are asked of a slate: chalk the dead, and spare the living. A slate that chalks everyone chalks every dead man and tells nobody anything. Four strengths of sparing and two of chalking make eight kinds.",
 m:"A failure detector is judged by completeness, suspecting the crashed, and accuracy, not suspecting the correct. Completeness alone is trivial, since suspecting everyone satisfies it. Four accuracy levels and two completeness levels make eight classes."},
"ds.strong":{lvl:3,ref:"DS.4",
 i:"Everyone waits for every bird of the one man no slate chalks, though nobody knows who. Every sheet of sightings then matches that man's, and all commit to its first filled row, however many die.",
 m:"A strong detector never suspects some correct process. Every process waits for that process's message each round, so all processes hold the same vector of values and decide its first non-empty entry, with any number of crashes."},
"ds.eventual":{lvl:3,ref:"DS.5",
 i:"The four take turns: each owner gathers three estimates and sends the most recent, and a failed round fails safely. More than half must live: otherwise two slow pairs chalk each other and commit apart.",
 m:"An eventually strong detector solves consensus with a majority correct, using a rotating coordinator: each gathers n − f estimates and proposes the most recent. With eventually accurate detectors, consensus needs n > 2f."},
"ds.granted":{lvl:3,ref:"DS.7",
 i:"The slates' promises are an assumption about the hill. With no longest flight no man can keep even the weakest useful slate; under a wind that drops^{RL.1} one can, lengthening the wait after every mistaken mark.",
 m:"The detector's properties are an assumption about the network. With unbounded delays no process can implement even the weakest useful detector; under partial synchrony^{RL.1} one can, lengthening its timeout after every mistaken suspicion."},

/* ---------------------------------------------------------------- level 3: Answering While Cut Off */
"co.debts":{lvl:3,ref:"CO.1",
 i:"Four tents share a standing plan. Answering as one: every answer fits one order that a single record would give. Every man answered: whoever asks about the plan or moves it hears back in the end.",
 m:"Consistency: every operation fits one order in which a single copy would have answered. Availability: every request to a working node gets a response. Both are wanted while the network may partition."},
"co.cut":{lvl:3,ref:"CO.2",
 i:"Tent 4 is cut off. Number 2 moves the plan to attack and is told it stands. Number 4, asking afterwards, cannot tell this night from one where nobody moved it, and must give one answer for both.",
 m:"No service is both consistent and available when the network can partition: a node cut off after a write cannot tell that run from one with no write, and must answer the same on both."},
"co.muster":{lvl:3,ref:"CO.3",
 i:"Only the muster-master's note counts: every move and question goes to it by bird, and a tent cut off from it falls silent. Answering from each tent's own note answers every man but gives up answering as one.",
 m:"A single primary gives consistency without availability under partition: every request goes through it, and a node cut off from it cannot answer. Answering from local copies gives availability without consistency."},
"co.glass":{lvl:3,ref:"CO.4",
 i:"A glass is two flights and the muster-master's time. A man still unanswered after a glass knows a bird was lost and answers from their note. Moves are resent, and the damage ends a span after the loss.",
 m:"Under bounded delays, a node that hears nothing after two message delays plus the primary's response time knows a message was lost and answers locally. Updates are resent until acknowledged, so staleness is bounded once the partition heals."},
"co.wind":{lvl:3,ref:"CO.6",
 i:"In a wind there is no known flight, so a slow bird looks exactly like a lost one. Answering every man can then break answering as one even on a night when no bird is lost.",
 m:"In an asynchronous network a slow message looks exactly like a lost one, so an available service cannot be consistent even when no message is lost."},

/* ---------------------------------------------------------------- level 3: Agreeing Among Liars */
"al.rats":{lvl:3,ref:"AL.2",
 i:"The chief for the round orders the three guards. Honest guards must obey one order, and an honest chief's. A slip arrives as written, its cord knotted with the sender's number; silence within the round means hold.",
 m:"One commander broadcasts to the other generals, run once per general: loyal lieutenants must obey one order, and the commander's if loyal. Channels are synchronous and reliable with known senders, so a missing message means the default."},
"al.three":{lvl:3,ref:"AL.3",
 i:"Among a chief and two guards, one may lie. A guard told hold by the chief and scatter by the other guard holds the same slips whether the chief or the other lied, though the right answers differ.",
 m:"Three generals cannot tolerate one traitor with oral messages: a lieutenant who hears attack from the commander and retreat from the other lieutenant cannot tell which of them is lying."},
"al.cost":{lvl:3,ref:"AL.4",
 i:"One liar wants four men, two want seven, three want ten. In the Repeating each guard repeats what the chief sent and obeys the greater count, so the lie is outvoted without anyone learning who told it.",
 m:"Oral messages need more than 3f generals and f + 1 rounds. Each lieutenant relays what it received and takes the majority, so the traitors' lies are outvoted without any loyal general learning who lied."},
"al.seals":{lvl:3,ref:"AL.5",
 i:"A slip under seal cannot be altered, so an order that reaches one honest guard is passed to every honest guard, and their sheaves agree. Any party with two more men than liars bears them all.",
 m:"With unforgeable signatures a relayed order cannot be altered, so an order that reaches one loyal lieutenant reaches all, and their sets of orders agree. Agreement holds for any number of traitors, given two more generals than traitors."},
"al.halves":{lvl:3,ref:"AL.6",
 i:"On the crown a lying chief looks like a lying peer, and nobody learns who lied, yet lies can be outvoted because silence means something. The foot has no clock: a dead man looks like a slow bird^{LoA.2}.",
 m:"Byzantine agreement is solvable with synchrony, because a missing message is detectable; crash consensus is not solvable without it, since a crashed process cannot be told from a slow one^{LoA.2}. Which general lied is never learned."},

/* ---------------------------------------------------------------- level 3: Keeping Order Among Liars */
"ko.job":{lvl:3,ref:"KO.2",
 i:"Honest copies take the same entries in the same order. Numbering is a job that passes in number order, term by term; a liar who holds it may give two entries one number or tell bandits different things.",
 m:"Every honest replica executes the same requests in the same order. The primary of each view orders requests, passing in order of view number, and may itself be faulty: it can assign one sequence number twice or equivocate."},
"ko.echoes":{lvl:3,ref:"KO.3",
 i:"The registrar numbers an entry; the bandits echo the numbering; a bandit with the numbering and two matching first echoes has it readied; readied is echoed; three matching second echoes make it stand. Nobody waits for the fourth.",
 m:"Pre-prepare, prepare, commit: the primary assigns a sequence number, replicas echo it, a replica with 2f matching prepares is prepared and broadcasts commit, and 2f + 1 matching commits make the request committed."},
"ko.share":{lvl:3,ref:"KO.4",
 i:"Two groups of three out of four share two bandits, at most one a liar, so an honest bandit is in both and seals only one entry for a number. Four is the fewest for one liar.",
 m:"With 3f + 1 replicas, two quorums of 2f + 1 share an honest replica, which signs only one request per sequence number in a view. 3f + 1 is the least, and signatures do not lower it."},
"ko.change":{lvl:3,ref:"KO.5",
 i:"A bandit whose entry has not stood by the sandglass's end asks for the next term, with proof of what is readied; nobody judges why. The new registrar numbers from three requests, so nothing that stood is dropped.",
 m:"A replica whose request has not committed by timeout sends a view-change with its prepared certificates, without judging why. The new primary starts from 2f + 1 view-changes, so no committed request is lost."},
"ko.glass":{lvl:3,ref:"KO.6",
 i:"Each bandit doubles the sandglass at every change, so once the wind drops the glasses outgrow a term's runs and an honest registrar's entries stand. Three matching sealed summaries make a settled checkpoint, and old echoes can go.",
 m:"Doubling the view-change timeout at each change gives liveness once delays stop growing. Stable checkpoints, on 2f + 1 matching signed digests, let replicas discard old messages and bound sequence numbers by watermarks."},

/* ---------------------------------------------------------------- level 3: Changing Leaders Among Liars */
"cl.votes":{lvl:3,ref:"CL.2",
 i:"Writing to everyone cost a dozen rats a stage among four; votes to one registrar cost six. Three matching seals in a bundle prove that at least two honest men voted; a threshold seal would make the bundle one seal's size.",
 m:"All-to-all messages cost quadratically; votes sent to the leader, who combines 2f + 1 of them into a quorum certificate, grow linearly. A threshold signature would make the certificate constant-size."},
"cl.lock":{lvl:3,ref:"CL.3",
 i:"Entries form a chain, and each passes three voting stages, each ending in a bundle. A man locks on the second bundle and votes only for a proposal that extends the locked chain or carries a later bundle.",
 m:"Blocks form a chain, and each goes through three phases, each ending in a quorum certificate. A replica locks on the pre-commit certificate and votes for a proposal that extends the locked block or carries a higher certificate."},
"cl.hidden":{lvl:3,ref:"CL.6",
 i:"With two stages a lock can hide from the next registrar. With three, a man locks only on a second bundle three men kept, so any three answers show it and the registrar goes at the rats' pace.",
 m:"With two phases a lock can hide from the next leader. With three, a lock rests on a certificate held by n − f replicas, so any n − f replies show it and no timeout is needed."},
"cl.chain":{lvl:3,ref:"CL.7",
 i:"The three stages look alike, so they run on top of one another: each term's proposal moves the entries behind it one stage on, and from the fourth term an entry stands every term.",
 m:"The three phases look alike, so Chained HotStuff pipelines them: each proposal advances the blocks behind it by one phase, and from the fourth view a block commits every view. The leader rotates every block."},

/* ---------------------------------------------------------------- level 3 and 4: The Part-Time Parliament */
"ptp.maj":{lvl:3,ref:"PTP.2",
 i:"Wandering is the danger: a group that passes decree 37 and leaves for a banquet leaves another that knows nothing of it. Any two majorities share a legislator, who carries what the first decided into the second.",
 m:"A group of machines that commits entry 37 and then goes offline can leave another group that never saw it. Any two majorities share at least one machine, which carries forward what the earlier majority accepted."},
"ptp.rules":{lvl:3,ref:"PTP.3",
 i:"Each ballot has its own number and a majority quorum, and must carry the decree of the latest vote cast in its quorum: with Γ's vote for β in ballot 5 and Δ's for α in ballot 2, ballot 27 is for β.",
 m:"Unique ballot numbers, majority quorums, and a proposer bound to the value of the highest-numbered vote its quorum reports. Two round trips, prepare and accept, make a ballot; lost or repeated messages cannot break safety."},
"ptp.pres":{lvl:3,ref:"PTP.5",
 i:"Two priests who keep starting higher ballots doom each other's, since each ballot makes its quorum promise never to vote lower, and nothing passes. One president alone starting ballots cures it; two only slow things down.",
 m:"Duelling proposers can stall Paxos for ever, because each prepare invalidates the other's promises. A single leader restores progress; two leaders only slow things down, since safety never relied on there being one."},
"ptp.synod":{lvl:3,ref:"PTP.6",
 i:"Parliament runs one Synod for each number under one president, who asks the opening question once for every number still open. A number nobody voted for gets a decree that changes nothing. Governing the island [added four habits]{ptp.grew}.",
 m:"Multi-Paxos: one prepare phase covers every open slot, gaps are filled with no-ops, and each further command costs one round trip from a stable leader. Practice [added four more features]{ptp.grew}."},
"ptp.grew":{lvl:4,ref:"PTP.7",
 i:"Each office has a fixed term, so one holder at a time. Later questions about the law never get older answers. Scrolls fold down to the law as it stands, and legislators join and leave by decree.",
 m:"Leases give each role one holder at a time; reads never go back in time; snapshots fold the log down to the state and its last index; and membership changes are made through the log itself."},

/* ---------------------------------------------------------------- level 3: One Leader at a Time */
"olat.pass":{lvl:3,ref:"OLAT.2",
 i:"The holder numbers each line and the runners bring them to the benches in order, skipping none. A line passes once a majority holds it and every line before it; only then is the petitioner told.",
 m:"One primary orders every operation and sends it to the backups in order. An operation commits once a majority of replicas hold it, and only then is the client answered."},
"olat.board":{lvl:3,ref:"OLAT.3",
 i:"Each spell at the podium gets a board, a count and the name of whoever raised it. Board 7, line 1 is later than board 6, line 40, because every board opens with the whole law.",
 m:"A viewstamp pairs the view number with the position in the view, compared view first. Each new view starts from everything committed before it, so view 7, position 1 is later than view 6, position 40."},
"olat.takes":{lvl:3,ref:"OLAT.4",
 i:"When the roll goes unanswered, a caller raises a higher board. Of a majority's answers, the one showing the latest board and line takes the podium. Any two threes share a legislator, so nothing passed is lost.",
 m:"A view change: collect a majority of viewstamps; the replica with the latest becomes primary and starts the view by sending its whole state. Any two majorities share a replica, so no committed operation is lost."},
"olat.lost":{lvl:3,ref:"OLAT.5",
 i:"Smooth wax shows only a board; a majority of answers is not enough. A board may form only if a majority has tablets, the lost ones were older than the latest shown, or the old holder has theirs.",
 m:"A replica that crashes loses its state, so a view may form only if a majority still has its state, the lost state was older than the latest viewstamp shown, or the old primary still has its state."},
"olat.porch":{lvl:3,ref:"OLAT.6",
 i:"Okios steps onto the porch and misses the change: a majority has raised board 7 and Liskovia holds the podium. Okios may go on writing lines, but passing needs three, and a majority has moved on.",
 m:"A primary cut off from the rest can keep taking requests but cannot commit any, because it can no longer reach a majority; the others have formed a new view."},
"olat.wax":{lvl:3,ref:"OLAT.7",
 i:"Unlike the ink across the bay, wax is lost when legislators go home. If too many go home on the same night, the council can stop for good, but it never goes on with a passed law missing.",
 m:"Viewstamped Replication keeps its state in memory and can stop for good if too many replicas crash at once, but never continues with a committed operation missing. Paxos writes to stable storage and survives any absence."}
};

/* ================================================================ where a mark or a node leads
   spine id: [the book's node, the anchor of its spread, that spread's own heading] */
const REF={
"OWC.3":["owc","tallysec","The tally"],
"OWC.4":["owc","ties","Breaking ties"],
"OWC.5":["owc","storesec","One storehouse, no gatekeeper"],
"OWC.6":["owc","column","One number for each house"],
"OWC.7":["owc","mountain","Shortcut over the mountain"],
"MC.2":["mc","rulesec","The rule of the board"],
"MC.4":["mc","firsts","The tallies' first, and the sun's first"],
"MC.5":["mc","s5","Copies nobody can count"],
"MC.6":["mc","locality","Grain and oil"],
"MC.7":["mc","nowait","Nobody made to wait"],
"MC.8":["mc","busy","The busy board"],
"MC.9":["mc","unsaid","What the rule does not say"],
"TS.1":["ts","question","How much do we hold between us?"],
"TS.4":["ts","sashsec","The red sash"],
"TS.6":["ts","morning","A morning nobody lived through"],
"TS.7":["ts","good","What such a total is good for"],
"LoA.2":["loa","silent","A dead man, or a slow bird?"],
"LoA.3":["loa","dusksec","The dusk that settles nothing"],
"LoA.4":["loa","defersec","The raven that would settle it can always be held back"],
"LoA.5":["loa","promise","A fair night in which nothing is ever settled"],
"LoA.6":["loa","change","What would have to change"],
"RL.1":["rl","windsec","The wind keeps the ravens in the folds"],
"RL.2":["rl","glasses","Glasses and late birds"],
"RL.3":["rl","turnsec","Turns and pledges"],
"RL.4":["rl","never","Never two answers, in any wind"],
"RL.5":["rl","commitsec","Committing once the wind drops"],
"RL.6":["rl","twosec","Two against two"],
"BC.2":["bc","rounds","Rounds of birds"],
"BC.3":["bc","neversec","Never two answers"],
"BC.4":["bc","prob","With probability one"],
"BC.5":["bc","changed","What the coin changed"],
"BC.6":["bc","limits","What chance does not buy"],
"DS.1":["ds","slatesec","A slate at every tent"],
"DS.2":["ds","wrongsec","How a slate may be wrong"],
"DS.4":["ds","strongsec","One man never chalked"],
"DS.5":["ds","turnsec","In the end, one man spared"],
"DS.6":["ds","halfsec","Why more than half, then"],
"DS.7":["ds","unsaidsec","What the slate does not say"],
"CO.1":["co","owe","What the four owe each other"],
"CO.2":["co","cutsec","The cut-off tent"],
"CO.3":["co","mustersec","The muster-master's arrangement"],
"CO.4":["co","glasssec","Waiting a glass"],
"CO.6":["co","windsec","When the flight has no bound"],
"AL.2":["al","ratsec","The rats in the wall"],
"AL.3":["al","threesec","Three cannot be brought to agree"],
"AL.4":["al","fewsec","Four men to a liar"],
"AL.5":["al","sealsec","The seal rings"],
"AL.6":["al","halvesec","The two halves"],
"KO.1":["ko","scrollsec","The loot scroll"],
"KO.2":["ko","jobsec","The chief's job"],
"KO.3":["ko","echoes","Two echoes"],
"KO.4":["ko","sealsec","Why three seals, and four bandits"],
"KO.5":["ko","changesec","Changing the job"],
"KO.6":["ko","gosec","Going on once the wind drops"],
"CL.2":["cl","votes","Votes to one man, bundles to all"],
"CL.3":["cl","stages","Three stages and a lock"],
"CL.6":["cl","hidden","The hidden lock"],
"CL.7":["cl","chain","A new registrar every entry"],
"PTP.1":["ptp","law","Settle the law, one numbered decree at a time"],
"PTP.2":["ptp","majorities","Any two majorities share a member"],
"PTP.3":["ptp","synod","One decree, once every nineteen years"],
"PTP.5":["ptp","progress","Too many ballots block everything"],
"PTP.6":["ptp","parliament","A separate Synod for every number"],
"PTP.7":["ptp","grew","Governing the island asked for more"],
"OLAT.1":["olat","podium","The podium"],
"OLAT.2":["olat","passes","When a law passes"],
"OLAT.3":["olat","board","Board and line"],
"OLAT.4":["olat","takes","Who takes the podium"],
"OLAT.5":["olat","lost","When tablets are lost"],
"OLAT.6":["olat","porch","The holder who has not noticed"],
"OLAT.7":["olat","wax","Wax, not ink"]
};

/* ================================================================ reading the markup (also used by the tree check) */
const TOK=/\[([^\]]+)\]\{([^}]+)\}|\^\{([^}]+)\}/g;
function toks(s){const out=[];let last=0,m;TOK.lastIndex=0;
  while((m=TOK.exec(s))){ if(m.index>last)out.push({t:s.slice(last,m.index)});
    out.push(m[1]!==undefined?{p:m[1],id:m[2]}:{r:m[3]}); last=TOK.lastIndex }
  if(last<s.length)out.push({t:s.slice(last)}); return out}
const kidsIn=s=>toks(s).filter(x=>x.id).map(x=>x.id);
const plain=s=>toks(s).map(x=>x.t!==undefined?x.t:x.p!==undefined?x.p:"").join("");
const words=s=>{const t=plain(s).trim();return t?t.split(/\s+/).length:0};

/* the tree check: both registers have the same children in the same order, every id is defined once and reached once,
   every mark leads somewhere. It returns a list of problems, empty when the tree is sound. */
function checkTree(nodes,refs){
  nodes=nodes||NODES; refs=refs||REF;
  const bad=[],ids=Object.keys(nodes),par={};
  if(!nodes.root)bad.push("there is no root");
  for(const id of ids){
    const n=nodes[id];
    for(const k of ["i","m"])if(typeof n[k]!=="string"||!n[k].trim())bad.push(id+": no "+k+" text");
    const a=kidsIn(n.i||""),b=kidsIn(n.m||"");
    if(a.join("|")!==b.join("|"))bad.push(id+": the children differ, islands ["+a+"] machine room ["+b+"]");
    if(new Set(a).size!==a.length)bad.push(id+": a child is named twice");
    for(const c of a){
      if(!nodes[c])bad.push(id+": the child "+c+" is not defined");
      else if(par[c])bad.push(c+": has two parents, "+par[c]+" and "+id);
      else par[c]=id}
    for(const k of ["i","m"])for(const t of toks(n[k]||""))if(t.r&&!refs[t.r])bad.push(id+" ("+k+"): the mark "+t.r+" leads nowhere");
    if(n.ref&&!refs[n.ref])bad.push(id+": the ref "+n.ref+" leads nowhere");
    if(n.book&&!n.title)bad.push(id+": a book without a title");
  }
  for(const id of ids)if(id!=="root"&&!par[id])bad.push(id+": no parent, so it never opens");
  for(const id of ids)if(par[id]&&nodes[id].lvl!==nodes[par[id]].lvl+1)bad.push(id+": level "+nodes[id].lvl+" under level "+nodes[par[id]].lvl);
  for(const id of ids){let x=id,n=0;while(par[x]&&n<20){x=par[x];n++}if(x!=="root")bad.push(id+": does not lead back to the root")}
  for(const key of Object.keys(refs)){const r=refs[key];if(!nodes[r[0]]||!nodes[r[0]].book)bad.push(key+": "+r[0]+" is not a book")}
  return bad;
}

if(typeof document==="undefined"){ module.exports={NODES,REF,toks,kidsIn,plain,words,checkTree}; return }

/* ================================================================ the page */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function h(tag,cls,parent,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;if(parent)parent.appendChild(e);return e}
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const IDS=Object.keys(NODES), KIDS={}, PAR={};
IDS.forEach(id=>{KIDS[id]=kidsIn(NODES[id].i);KIDS[id].forEach(k=>{PAR[k]=id})});
const TOTAL=IDS.length-1;
const accentOf=id=>NODES[id].accent||(PAR[id]?accentOf(PAR[id]):"#1c1512");
const domId=id=>"b-"+id.replace(/\./g,"-");
function darken(hex,f){const n=parseInt(hex.slice(1),16),c=[n>>16&255,n>>8&255,n&255].map(v=>Math.round(v*(1-f)));return "#"+c.map(v=>v.toString(16).padStart(2,"0")).join("")}

let reg="i";           // "i" the islands, "m" the machine room
const B={};            // id -> {blk, txt, kids, open, anim}
const bar=$(".bar"), tools=$("#tools"), live=$("#live");

/* ---------- building: every block exists from the start, hidden until its phrase is opened ---------- */
function build(id){
  const n=NODES[id],c=accentOf(id),b=B[id]={open:id==="root"};
  if(id==="root"){b.txt=$("#sentence");b.kids=$("#tree");b.blk=null}
  else{
    const blk=b.blk=h("div","blk");blk.id=domId(id);blk.hidden=true;blk.dataset.id=id;blk.dataset.lvl=n.lvl;
    blk.style.setProperty("--c",c);blk.style.setProperty("--cd",darken(c,.38));
    const body=h("div","blk-body",blk);
    if(n.book||n.kick){const k=h("div","kick",body);
      if(n.book){const a=h("a",null,k,n.title);a.href="../"+n.book+"/index.html"}else k.textContent=n.kick}
    b.txt=h("p","txt",body);b.kids=h("div","kids",body);
  }
  KIDS[id].forEach(k=>{build(k);b.kids.appendChild(B[k].blk)});
}

/* ---------- the words, in whichever register is showing ---------- */
function xref(key){
  const r=REF[key],bk=NODES[r[0]],sp=h("sup","xref"),a=h("a",null,sp,"*");
  a.href="../"+bk.book+"/index.html#"+r[1];a.title=bk.title+": "+r[2];a.setAttribute("aria-label","Read more in "+bk.title+": "+r[2]);return sp}
function closing(id){
  const n=NODES[id];
  if(n.ref)return xref(n.ref);
  if(n.book){const sp=h("sup","xref"),a=h("a",null,sp,"*");a.href="../"+n.book+"/index.html";a.title=n.title+": the whole book";a.setAttribute("aria-label","Read the whole book: "+n.title);return sp}
  return null}
function phrase(text,id){
  const s=h("span","ph");s.dataset.id=id;s.setAttribute("role","button");s.tabIndex=0;
  s.setAttribute("aria-controls",domId(id));s.setAttribute("aria-expanded",B[id].open?"true":"false");
  const c=accentOf(id);s.style.setProperty("--c",c);s.style.setProperty("--cu",darken(c,.15));s.style.setProperty("--cd",darken(c,.38));
  h("span","pt",s,text);h("span","pm",s).setAttribute("aria-hidden","true");return s}
function fill(id){
  const b=B[id];b.txt.replaceChildren();
  for(const t of toks(NODES[id][reg])){
    if(t.t!==undefined)b.txt.append(t.t);
    else if(t.p!==undefined)b.txt.append(phrase(t.p,t.id));
    else b.txt.append(xref(t.r))}
  const e=closing(id);if(e)b.txt.append(e);
}

/* ---------- opening and folding ---------- */
const canAnimate=typeof Element.prototype.animate==="function";
function show(b,animate){
  const blk=b.blk;if(b.anim){b.anim.cancel();b.anim=null}
  blk.hidden=false;
  if(!animate||reduce||!canAnimate)return;
  blk.style.overflow="hidden";const hgt=blk.getBoundingClientRect().height;
  const a=blk.animate([{height:"0px",opacity:0},{height:hgt+"px",opacity:1}],{duration:250,easing:"ease-out"});
  b.anim=a;a.onfinish=()=>{if(b.anim===a){b.anim=null;blk.style.overflow=""}};a.oncancel=()=>{if(b.anim===a){b.anim=null;blk.style.overflow=""}};
}
function hide(b,animate){
  const blk=b.blk;if(b.anim){b.anim.cancel();b.anim=null}
  if(!animate||reduce||!canAnimate||blk.hidden){blk.hidden=true;blk.style.overflow="";return}
  blk.style.overflow="hidden";const hgt=blk.getBoundingClientRect().height;
  const a=blk.animate([{height:hgt+"px",opacity:1},{height:"0px",opacity:0}],{duration:220,easing:"ease-in"});
  b.anim=a;a.onfinish=()=>{if(b.anim===a){b.anim=null;blk.hidden=true;blk.style.overflow=""}};a.oncancel=()=>{if(b.anim===a){b.anim=null;blk.style.overflow=""}};
}
function mark(id){const p=$('.ph[data-id="'+id+'"]');if(p)p.setAttribute("aria-expanded",B[id].open?"true":"false")}
const below=id=>KIDS[id].flatMap(k=>[k,...below(k)]);
function setOpen(id,on,animate){
  const b=B[id];if(!b||id==="root"||b.open===on)return;
  if(on){ if(PAR[id]&&!B[PAR[id]].open)setOpen(PAR[id],true,false);
    b.open=true;show(b,animate)}
  else{ below(id).forEach(d=>{if(B[d].open){B[d].open=false;hide(B[d],false);mark(d)}});
    b.open=false;hide(b,animate)}
  mark(id);
}
const openIds=()=>IDS.filter(id=>id!=="root"&&B[id].open);
const depth=()=>Math.max(...IDS.filter(id=>B[id].open).map(id=>NODES[id].lvl));

/* ---------- the readout, the hash, the announcements ---------- */
const cnt=$("#cnt"),meter=$("#meter"),dots=$$("i",meter),btnMore=$("#more"),btnAll=$("#every"),btnFold=$("#fold");
$("#tot").textContent=TOTAL;
function say(s){live.textContent="";requestAnimationFrame(()=>{live.textContent=s})}
function writeHash(){
  const ids=openIds(),parts=[];
  if(ids.length===TOTAL)parts.push("all");else if(ids.length)parts.push("open="+ids.join(","));
  if(reg==="m")parts.push("m");
  try{history.replaceState(null,"",location.pathname+location.search+(parts.length?"#"+parts.join("&"):""))}catch(e){}
}
function readHash(){
  const t=location.hash.replace(/^#/,"");if(!t)return null;
  const st={all:false,open:[],m:false};let known=false;
  t.split("&").forEach(p=>{if(p==="all"){st.all=known=true}else if(p==="m"){st.m=known=true}else if(p.indexOf("open=")===0){st.open=p.slice(5).split(",").filter(Boolean);known=true}});
  return known?st:null}
function refresh(){
  const n=openIds().length,d=depth();
  cnt.textContent=n;
  dots.forEach((x,k)=>x.classList.toggle("on",k<=d));
  meter.setAttribute("aria-label","Deepest level open: "+d+" of 4");
  btnMore.disabled=btnAll.disabled=n===TOTAL;btnFold.disabled=n===0;
  writeHash();
}

/* ---------- keeping the reader's place ---------- */
function stuck(){return (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--barh"))||41)-3+tools.offsetHeight}
function reveal(id,from){
  const b=B[id];if(!b||!b.blk)return;
  requestAnimationFrame(()=>{
    const r=b.blk.getBoundingClientRect(),H=innerHeight;
    if(r.top<H-120)return;
    let dy=r.top-Math.round(H*.5);
    if(from){const pr=from.getClientRects()[0];if(pr)dy=Math.min(dy,pr.top-(stuck()+10))}
    if(dy>12)scrollBy({top:dy,behavior:reduce?"auto":"smooth"});
  });
}
function anchorBlock(){ // the paragraph the reader is at: the first whose text reaches a line a third of the way down the reading window
  const top=stuck(),y=top+(innerHeight-top)*.3,els=[$("#sentence"),...$$(".blk:not([hidden]) .txt")];
  for(const e of els){if(e.getBoundingClientRect().bottom>y)return e}
  return els[els.length-1]}

/* ---------- what the reader does ---------- */
function toggle(id,from){
  const b=B[id];if(!b)return;
  const on=!b.open,label=$('.ph[data-id="'+id+'"] .pt');
  const name=label?label.textContent:id;
  setOpen(id,on,true);refresh();
  say((on?"Opened: ":"Folded: ")+name);
  if(on)reveal(id,from);
}
function moreLevel(){
  const seen=IDS.filter(id=>B[id].open);let n=0;
  seen.forEach(id=>KIDS[id].forEach(k=>{if(!B[k].open){setOpen(k,true,true);n++}}));
  refresh();say(n?"Opened one more level: "+n+" more phrases are open.":"Everything is already open.");
}
function everything(){IDS.forEach(id=>setOpen(id,true,false));refresh();say("Everything is open.")}
function foldAll(){KIDS.root.forEach(k=>setOpen(k,false,false));refresh();say("Everything is folded.")}
function setReg(r,quiet){
  if(r===reg&&quiet!==false)return;
  const a=anchorBlock(),y0=a.getBoundingClientRect().top;
  reg=r;document.body.dataset.reg=r;
  IDS.forEach(fill);
  $("#reg-i").setAttribute("aria-pressed",r==="i");$("#reg-m").setAttribute("aria-pressed",r==="m");
  try{localStorage.setItem("daag-unfolded-reg",r)}catch(e){}
  const y1=a.getBoundingClientRect().top;if(y1!==y0)scrollBy({top:y1-y0,behavior:"instant"});
  writeHash();
  if(quiet!==true)say(r==="i"?"Reading in the islands' words.":"Reading in the machine room's words.");
}
function apply(st,fromHash){
  const prev=reg;
  if(st&&(st.m||st.all||st.open.length||fromHash))reg=st.m?"m":"i";
  else{try{reg=localStorage.getItem("daag-unfolded-reg")==="m"?"m":"i"}catch(e){reg="i"}}
  document.body.dataset.reg=reg;IDS.forEach(id=>{if(id!=="root"&&B[id].open){B[id].open=false;B[id].blk.hidden=true}});
  if(st&&st.all)IDS.forEach(id=>{if(id!=="root"){B[id].open=true;B[id].blk.hidden=false}});
  else if(st)st.open.filter(id=>B[id]&&id!=="root").forEach(id=>setOpen(id,true,false));
  IDS.forEach(fill);
  $("#reg-i").setAttribute("aria-pressed",reg==="i");$("#reg-m").setAttribute("aria-pressed",reg==="m");
  refresh();
}

/* ---------- start ---------- */
build("root");
document.documentElement.style.setProperty("--barh",bar.offsetHeight+"px");
apply(readHash(),false);
$("#reg-i").addEventListener("click",()=>setReg("i"));
$("#reg-m").addEventListener("click",()=>setReg("m"));
btnMore.addEventListener("click",moreLevel);btnAll.addEventListener("click",everything);btnFold.addEventListener("click",foldAll);
document.addEventListener("click",e=>{const p=e.target.closest&&e.target.closest(".ph");if(!p)return;const sel=getSelection&&getSelection();if(sel&&!sel.isCollapsed&&sel.toString().trim())return;toggle(p.dataset.id,p)});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.classList&&e.target.classList.contains("ph")){e.preventDefault();toggle(e.target.dataset.id,e.target)}});
addEventListener("hashchange",()=>{const st=readHash();if(st)apply(st,true)});
addEventListener("resize",()=>document.documentElement.style.setProperty("--barh",bar.offsetHeight+"px"));
/* a printed copy is the whole text */
addEventListener("beforeprint",()=>{document.body.classList.add("printing");IDS.forEach(id=>{if(id!=="root")B[id].blk.hidden=false})});
addEventListener("afterprint",()=>{document.body.classList.remove("printing");IDS.forEach(id=>{if(id!=="root"&&!B[id].open)B[id].blk.hidden=true})});
/* a sound tree, or a word in the console about what is not */
const problems=checkTree();if(problems.length)console.error("The tree has problems:\n"+problems.join("\n"));
window.UNFOLDED={NODES,REF,checkTree,words};

/* ---------- the bar: the section in view, and how far down the page is ---------- */
const secs=$$("header.spread,div.spread,section.spread"),now=$("#now"),prog=$("#prog");let tick=false;
function onscroll(){
  if(tick)return;tick=true;
  requestAnimationFrame(()=>{
    tick=false;
    const y=scrollY,hh=document.documentElement.scrollHeight-innerHeight;
    prog.style.width=(hh>0?y/hh*100:0)+"%";
    const mid=y+innerHeight*.4;let cur=secs[0];
    for(const s of secs){if(s.offsetTop<=mid&&s.offsetTop>=cur.offsetTop)cur=s}
    now.textContent=cur.dataset.name||"";
  });
}
addEventListener("scroll",onscroll,{passive:true});addEventListener("resize",onscroll);onscroll();

})();
